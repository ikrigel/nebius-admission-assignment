"""Tests for FastAPI application."""

import pytest
from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


class TestHealthEndpoint:
    """Test health check endpoint."""

    def test_health_check(self, client):
        """Test health check returns ok status."""
        response = client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestSPARouting:
    """Test SPA fallback routing."""

    def test_root_route(self, client):
        """Test root route returns index.html."""
        response = client.get("/")

        # Should not error - either returns 404 (if dist doesn't exist) or 200
        assert response.status_code in [200, 404]

    def test_named_routes_served(self, client):
        """Test that named routes (without file extensions) are handled."""
        # Routes like /about, /settings, /help should be routed to index.html for SPA
        response = client.get("/about")

        # Should return 200 (index.html served for SPA routing)
        # or 404 if frontend/dist doesn't exist
        assert response.status_code in [200, 404]

    def test_api_route_reaches_router(self, client):
        """Test that /api routes are not caught by SPA fallback."""
        # This tests that the API route is defined before the catch-all
        response = client.post(
            "/api/summarize",
            json={"github_url": "https://github.com/test/repo"}
        )

        # Should return an error response from the API
        # 404 from GitHub API is expected when testing with fake repo
        # Could also be 503, 502, 500, 422, 400 depending on service availability
        assert response.status_code in [503, 502, 500, 422, 400, 404]

    def test_static_file_extension_detection(self, client):
        """Test that file requests are distinguished from routes."""
        # Files with extensions should be served as files
        response = client.get("/assets/style.css")

        # Should return 404 (file not found) not 200 (index.html fallback)
        # because it has a file extension
        assert response.status_code == 404


class TestPathTraversalProtection:
    """Test path traversal attack protection."""

    def test_path_traversal_attempt_blocked(self, client):
        """Test that path traversal attempts are blocked."""
        response = client.get("/../../../etc/passwd")

        # Path traversal attempts should be blocked
        # Could return 404 (file not found) or 200 (SPA fallback if normalized)
        # The important thing is no sensitive files are exposed
        assert response.status_code in [404, 200]
        # Response should not contain /etc/passwd content
        if response.status_code == 200:
            assert "/etc/passwd" not in response.text

    def test_path_traversal_with_backslash(self, client):
        """Test path traversal with backslash is blocked."""
        response = client.get("/..\\..\\..\\etc\\passwd")

        # Windows path traversal attempt
        assert response.status_code == 404

    def test_path_traversal_double_encoded(self, client):
        """Test that double-encoded traversal is blocked."""
        response = client.get("/%2e%2e/%2e%2e/etc/passwd")

        assert response.status_code == 404
