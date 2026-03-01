"""Tests for backend configuration."""

import os
import pytest
from backend.config import Settings


class TestSettings:
    """Test Settings configuration."""

    def test_settings_initialization(self):
        """Test that settings are initialized correctly."""
        # Save original env vars
        original_provider = os.environ.get("LLM_PROVIDER")
        original_key = os.environ.get("NEBIUS_API_KEY")

        try:
            os.environ["LLM_PROVIDER"] = "nebius"
            os.environ["NEBIUS_API_KEY"] = "test-key-123"

            settings = Settings()

            assert settings.llm_provider == "nebius"
            assert settings.nebius_api_key == "test-key-123"
        finally:
            # Restore original env vars
            if original_provider:
                os.environ["LLM_PROVIDER"] = original_provider
            elif "LLM_PROVIDER" in os.environ:
                del os.environ["LLM_PROVIDER"]

            if original_key:
                os.environ["NEBIUS_API_KEY"] = original_key
            elif "NEBIUS_API_KEY" in os.environ:
                del os.environ["NEBIUS_API_KEY"]

    def test_get_api_key_nebius(self):
        """Test getting API key for Nebius provider."""
        original_provider = os.environ.get("LLM_PROVIDER")
        original_key = os.environ.get("NEBIUS_API_KEY")

        try:
            os.environ["LLM_PROVIDER"] = "nebius"
            os.environ["NEBIUS_API_KEY"] = "nebius-test-key"

            settings = Settings()
            assert settings.get_api_key() == "nebius-test-key"
        finally:
            if original_provider:
                os.environ["LLM_PROVIDER"] = original_provider
            elif "LLM_PROVIDER" in os.environ:
                del os.environ["LLM_PROVIDER"]
            if original_key:
                os.environ["NEBIUS_API_KEY"] = original_key
            elif "NEBIUS_API_KEY" in os.environ:
                del os.environ["NEBIUS_API_KEY"]

    def test_get_api_key_openai(self):
        """Test getting API key for OpenAI provider."""
        original_provider = os.environ.get("LLM_PROVIDER")
        original_key = os.environ.get("OPENAI_API_KEY")

        try:
            os.environ["LLM_PROVIDER"] = "openai"
            os.environ["OPENAI_API_KEY"] = "openai-test-key"

            settings = Settings()
            assert settings.get_api_key() == "openai-test-key"
        finally:
            if original_provider:
                os.environ["LLM_PROVIDER"] = original_provider
            elif "LLM_PROVIDER" in os.environ:
                del os.environ["LLM_PROVIDER"]
            if original_key:
                os.environ["OPENAI_API_KEY"] = original_key
            elif "OPENAI_API_KEY" in os.environ:
                del os.environ["OPENAI_API_KEY"]

    def test_get_model_default_nebius(self):
        """Test getting default model for Nebius provider."""
        original_provider = os.environ.get("LLM_PROVIDER")
        original_model = os.environ.get("LLM_MODEL")

        try:
            os.environ["LLM_PROVIDER"] = "nebius"
            if "LLM_MODEL" in os.environ:
                del os.environ["LLM_MODEL"]

            settings = Settings()
            assert (
                settings.get_model()
                == "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1"
            )
        finally:
            if original_provider:
                os.environ["LLM_PROVIDER"] = original_provider
            elif "LLM_PROVIDER" in os.environ:
                del os.environ["LLM_PROVIDER"]
            if original_model:
                os.environ["LLM_MODEL"] = original_model

    def test_get_model_custom(self):
        """Test getting custom model specified via env var."""
        original_model = os.environ.get("LLM_MODEL")

        try:
            os.environ["LLM_MODEL"] = "custom-model-123"

            settings = Settings()
            assert settings.get_model() == "custom-model-123"
        finally:
            if original_model:
                os.environ["LLM_MODEL"] = original_model
            elif "LLM_MODEL" in os.environ:
                del os.environ["LLM_MODEL"]

    def test_get_model_default_openai(self):
        """Test getting default model for OpenAI provider."""
        original_provider = os.environ.get("LLM_PROVIDER")
        original_model = os.environ.get("LLM_MODEL")

        try:
            os.environ["LLM_PROVIDER"] = "openai"
            if "LLM_MODEL" in os.environ:
                del os.environ["LLM_MODEL"]

            settings = Settings()
            assert settings.get_model() == "gpt-4o-mini"
        finally:
            if original_provider:
                os.environ["LLM_PROVIDER"] = original_provider
            elif "LLM_PROVIDER" in os.environ:
                del os.environ["LLM_PROVIDER"]
            if original_model:
                os.environ["LLM_MODEL"] = original_model

    def test_get_model_default_anthropic(self):
        """Test getting default model for Anthropic provider."""
        original_provider = os.environ.get("LLM_PROVIDER")
        original_model = os.environ.get("LLM_MODEL")

        try:
            os.environ["LLM_PROVIDER"] = "anthropic"
            if "LLM_MODEL" in os.environ:
                del os.environ["LLM_MODEL"]

            settings = Settings()
            assert settings.get_model() == "claude-3-5-haiku-20241022"
        finally:
            if original_provider:
                os.environ["LLM_PROVIDER"] = original_provider
            elif "LLM_PROVIDER" in os.environ:
                del os.environ["LLM_PROVIDER"]
            if original_model:
                os.environ["LLM_MODEL"] = original_model
