"""Tests for GitHub service."""

import pytest
from fastapi import HTTPException
from backend.services.github_service import GitHubService


class TestGitHubService:
    """Test GitHub API client."""

    def test_parse_github_url_basic(self):
        """Test parsing basic GitHub URL."""
        service = GitHubService()
        owner, repo, branch = service._parse_github_url(
            "https://github.com/psf/requests"
        )

        assert owner == "psf"
        assert repo == "requests"
        assert branch == "main"

    def test_parse_github_url_with_branch(self):
        """Test parsing GitHub URL with branch."""
        service = GitHubService()
        owner, repo, branch = service._parse_github_url(
            "https://github.com/psf/requests/tree/master"
        )

        assert owner == "psf"
        assert repo == "requests"
        assert branch == "master"

    def test_parse_github_url_with_git_suffix(self):
        """Test parsing GitHub URL with .git suffix."""
        service = GitHubService()
        owner, repo, branch = service._parse_github_url(
            "https://github.com/psf/requests.git"
        )

        assert owner == "psf"
        assert repo == "requests"
        assert branch == "main"

    def test_parse_github_url_without_https(self):
        """Test parsing GitHub URL without https prefix."""
        service = GitHubService()
        owner, repo, branch = service._parse_github_url(
            "github.com/psf/requests"
        )

        assert owner == "psf"
        assert repo == "requests"
        assert branch == "main"

    def test_parse_github_url_with_git_ssh(self):
        """Test parsing GitHub SSH URL."""
        service = GitHubService()
        owner, repo, branch = service._parse_github_url(
            "git@github.com:psf/requests.git"
        )

        assert owner == "psf"
        assert repo == "requests"
        assert branch == "main"

    def test_parse_github_url_invalid(self):
        """Test parsing invalid GitHub URL."""
        service = GitHubService()

        with pytest.raises(HTTPException) as exc_info:
            service._parse_github_url("not-a-valid-url")

        assert exc_info.value.status_code == 400

    def test_parse_github_url_wrong_domain(self):
        """Test parsing URL from wrong domain."""
        service = GitHubService()

        with pytest.raises(HTTPException) as exc_info:
            service._parse_github_url("https://gitlab.com/psf/requests")

        assert exc_info.value.status_code == 400

    def test_get_file_language_python(self):
        """Test language detection for Python files."""
        service = GitHubService()

        assert service.get_file_language("main.py") == "Python"
        assert service.get_file_language("utils/helper.py") == "Python"

    def test_get_file_language_javascript(self):
        """Test language detection for JavaScript files."""
        service = GitHubService()

        assert service.get_file_language("index.js") == "JavaScript"
        assert service.get_file_language("src/app.js") == "JavaScript"

    def test_get_file_language_typescript(self):
        """Test language detection for TypeScript files."""
        service = GitHubService()

        assert service.get_file_language("main.ts") == "TypeScript"
        assert service.get_file_language("index.tsx") == "React"

    def test_get_file_language_java(self):
        """Test language detection for Java files."""
        service = GitHubService()

        assert service.get_file_language("Main.java") == "Java"

    def test_get_file_language_go(self):
        """Test language detection for Go files."""
        service = GitHubService()

        assert service.get_file_language("main.go") == "Go"

    def test_get_file_language_rust(self):
        """Test language detection for Rust files."""
        service = GitHubService()

        assert service.get_file_language("main.rs") == "Rust"

    def test_get_file_language_unknown(self):
        """Test language detection for unknown file types."""
        service = GitHubService()

        assert service.get_file_language("README.md") is None
        assert service.get_file_language("Makefile") is None
        assert service.get_file_language("unknown.xyz") is None

    def test_github_token_in_headers(self):
        """Test that GitHub token is included in headers."""
        service = GitHubService(github_token="test-token-123")

        import asyncio

        async def check_headers():
            session = await service.get_session()
            assert session.headers.get("Authorization") == "token test-token-123"
            await session.aclose()

        asyncio.run(check_headers())

    def test_no_github_token_in_headers(self):
        """Test that GitHub token header is not included when not provided."""
        service = GitHubService()

        import asyncio

        async def check_headers():
            session = await service.get_session()
            assert "Authorization" not in session.headers
            await session.aclose()

        asyncio.run(check_headers())
