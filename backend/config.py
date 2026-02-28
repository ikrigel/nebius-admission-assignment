from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    """Configuration loaded from environment variables."""

    llm_provider: Literal["nebius", "openai", "anthropic", "gemini", "perplexity"] = "nebius"
    nebius_api_key: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    perplexity_api_key: str = ""
    llm_model: str = ""  # Empty = use provider default
    github_token: str = ""  # Optional, raises rate limit from 60 to 5000 req/hr

    class Config:
        env_file = ".env"

    def get_api_key(self) -> str:
        """Get the API key for the active provider."""
        keys = {
            "nebius": self.nebius_api_key,
            "openai": self.openai_api_key,
            "anthropic": self.anthropic_api_key,
            "gemini": self.gemini_api_key,
            "perplexity": self.perplexity_api_key,
        }
        return keys.get(self.llm_provider, "")

    def get_model(self) -> str:
        """Get the model name for the active provider."""
        if self.llm_model:
            return self.llm_model

        defaults = {
            "nebius": "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1",
            "openai": "gpt-3.5-turbo",
            "anthropic": "claude-3-haiku-20240307",
            "gemini": "gemini-1.5-flash",
            "perplexity": "sonar",
        }
        return defaults.get(self.llm_provider, "")


settings = Settings()
