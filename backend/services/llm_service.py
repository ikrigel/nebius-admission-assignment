import json
import re
from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Optional
from .repo_processor import ProcessedRepo
from backend.config import Settings


class SummaryResponse(BaseModel):
    """API response for summarize endpoint."""
    summary: str
    technologies: list[str]
    structure: str


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def complete(self, system: str, user: str) -> str:
        """Generate a completion."""
        pass


class NebiusProvider(LLMProvider):
    """Nebius LLM provider (OpenAI-compatible)."""

    def __init__(self, api_key: str, model: str):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.studio.nebius.ai/v1/",
        )
        self.model = model

    async def complete(self, system: str, user: str) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content


class OpenAIProvider(LLMProvider):
    """OpenAI LLM provider."""

    def __init__(self, api_key: str, model: str):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model

    async def complete(self, system: str, user: str) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content


class PerplexityProvider(LLMProvider):
    """Perplexity LLM provider (OpenAI-compatible)."""

    def __init__(self, api_key: str, model: str):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.perplexity.ai",
        )
        self.model = model

    async def complete(self, system: str, user: str) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content


class AnthropicProvider(LLMProvider):
    """Anthropic Claude provider."""

    def __init__(self, api_key: str, model: str):
        from anthropic import AsyncAnthropic
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = model

    async def complete(self, system: str, user: str) -> str:
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return response.content[0].text


class LLMService:
    """Multi-provider LLM service."""

    PROVIDER_REGISTRY = {
        "nebius": NebiusProvider,
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "perplexity": PerplexityProvider,
    }

    def __init__(self, settings: Settings, provider_override: Optional[str] = None,
                 api_key_override: Optional[str] = None):
        provider_name = provider_override or settings.llm_provider
        api_key = api_key_override or settings.get_api_key()
        model = settings.get_model()

        if not api_key:
            raise ValueError(f"API key not provided for provider: {provider_name}")

        provider_cls = self.PROVIDER_REGISTRY.get(provider_name)
        if not provider_cls:
            raise ValueError(f"Unknown provider: {provider_name}")

        self.provider = provider_cls(api_key, model)

    async def summarize_repo(self, processed: ProcessedRepo) -> SummaryResponse:
        """Generate summary for a processed repository."""
        system_prompt = """You are a senior software engineer analyzing a GitHub repository.
Your task is to provide a structured analysis of the repository.
Respond ONLY with valid JSON matching exactly this schema:
{
  "summary": "string — 2-4 sentence description of what the project does",
  "technologies": ["array", "of", "technology", "names"],
  "structure": "string — 1-2 sentences describing project layout"
}
Do not include markdown fences, explanations, or any text outside the JSON object."""

        files_section = "\n".join([
            f"=== {f.path} ===\n{f.content[:2000]}"
            for f in processed.files
        ])

        user_prompt = f"""Repository: {processed.owner}/{processed.repo}

Directory Structure:
{processed.directory_tree}

Files ({processed.fetched_files_count} of {processed.total_files_count} total):

{files_section}

Analyze this repository and return the JSON summary."""

        raw_response = await self.provider.complete(system_prompt, user_prompt)
        return self._parse_response(raw_response)

    def _parse_response(self, raw: str) -> SummaryResponse:
        """Parse LLM response into structured format."""
        # Try direct JSON parsing
        try:
            data = json.loads(raw)
            return SummaryResponse(**data)
        except json.JSONDecodeError:
            pass

        # Try regex extraction
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
                return SummaryResponse(**data)
            except json.JSONDecodeError:
                pass

        # Fallback: return error response
        return SummaryResponse(
            summary="Failed to parse response from LLM.",
            technologies=[],
            structure="Unable to analyze structure."
        )
