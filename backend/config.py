import os
from dataclasses import dataclass
from typing import Literal

# Load .env file if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


@dataclass
class Settings:
    """Configuration loaded from environment variables."""

    llm_provider: str
    nebius_api_key: str
    openai_api_key: str
    anthropic_api_key: str
    perplexity_api_key: str
    llm_model: str
    github_token: str

    def __init__(self):
        self.llm_provider = os.getenv("LLM_PROVIDER", "nebius")
        self.nebius_api_key = os.getenv("NEBIUS_API_KEY", "")
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.perplexity_api_key = os.getenv("PERPLEXITY_API_KEY", "")
        self.llm_model = os.getenv("LLM_MODEL", "")
        self.github_token = os.getenv("GITHUB_TOKEN", "")

    def get_api_key(self) -> str:
        """Get the API key for the active provider."""
        keys = {
            "nebius": self.nebius_api_key,
            "openai": self.openai_api_key,
            "anthropic": self.anthropic_api_key,
            "perplexity": self.perplexity_api_key,
        }
        return keys.get(self.llm_provider, "")

    def get_model(self) -> str:
        """Get the model name for the active provider."""
        if self.llm_model:
            return self.llm_model

        defaults = {
            "nebius": "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1",
            "openai": "gpt-4o-mini",  # Updated: gpt-3.5-turbo is deprecated
            "anthropic": "claude-3-5-haiku-20241022",  # Updated: latest Haiku model
            "perplexity": "sonar",
        }
        return defaults.get(self.llm_provider, "")


settings = Settings()
