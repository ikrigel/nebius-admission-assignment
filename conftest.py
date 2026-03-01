"""Pytest configuration and fixtures."""

import os
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def setup_test_env():
    """Set up test environment variables."""
    os.environ["TESTING"] = "true"
    os.environ["LLM_PROVIDER"] = "nebius"
    # Use dummy keys for testing
    os.environ["NEBIUS_API_KEY"] = "test-key-nebius"
    os.environ["OPENAI_API_KEY"] = "test-key-openai"
    os.environ["ANTHROPIC_API_KEY"] = "test-key-anthropic"
    os.environ["PERPLEXITY_API_KEY"] = "test-key-perplexity"
    yield
    # Cleanup
    for key in [
        "TESTING",
        "LLM_PROVIDER",
        "NEBIUS_API_KEY",
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "PERPLEXITY_API_KEY",
    ]:
        if key in os.environ:
            del os.environ[key]


@pytest.fixture
def mock_github_tree():
    """Provide a mock GitHub repository tree."""
    return [
        {
            "path": "README.md",
            "type": "blob",
            "size": 5000,
            "sha": "abc123",
        },
        {
            "path": "package.json",
            "type": "blob",
            "size": 1500,
            "sha": "def456",
        },
        {
            "path": "src/index.js",
            "type": "blob",
            "size": 2000,
            "sha": "ghi789",
        },
        {
            "path": "src/utils.js",
            "type": "blob",
            "size": 1000,
            "sha": "jkl012",
        },
        {
            "path": "tests/test.js",
            "type": "blob",
            "size": 800,
            "sha": "mno345",
        },
        {
            "path": "node_modules/lib/index.js",
            "type": "blob",
            "size": 50000,
            "sha": "pqr678",
        },
        {
            "path": ".git/config",
            "type": "blob",
            "size": 100,
            "sha": "stu901",
        },
        {
            "path": "dist/bundle.min.js",
            "type": "blob",
            "size": 100000,
            "sha": "vwx234",
        },
    ]


@pytest.fixture
def mock_repo_files():
    """Provide mock repository file content."""
    return {
        "README.md": """# Example Project

This is an example project demonstrating a Python web application.

## Features
- Fast API framework
- Async/await support
- JSON API responses

## Installation
```bash
pip install -r requirements.txt
```

## Usage
```bash
python -m uvicorn main:app --reload
```
""",
        "package.json": """{
  "name": "example-project",
  "version": "1.0.0",
  "description": "An example project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "dotenv": "^16.0.0"
  }
}
""",
        "src/index.js": """const app = require('express')();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
""",
    }


def pytest_configure(config):
    """Configure pytest."""
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
