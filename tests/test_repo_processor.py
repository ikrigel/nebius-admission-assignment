"""Tests for repository processor."""

import pytest
from backend.services.repo_processor import RepoProcessor


class TestRepoProcessor:
    """Test file filtering and processing."""

    def test_is_file_excluded_directories(self):
        """Test that files in excluded directories are filtered."""
        processor = RepoProcessor()

        # Should exclude files in excluded directories
        assert processor.is_file_excluded("node_modules/lib.js")
        assert processor.is_file_excluded(".git/config")
        assert processor.is_file_excluded("__pycache__/module.pyc")
        assert processor.is_file_excluded(".venv/bin/python")
        assert processor.is_file_excluded("dist/bundle.js")
        assert processor.is_file_excluded("build/output.o")

        # Should not exclude files in normal directories
        assert not processor.is_file_excluded("src/main.py")
        assert not processor.is_file_excluded("lib/utils.js")
        assert not processor.is_file_excluded("tests/test_main.py")

    def test_is_file_excluded_extensions(self):
        """Test that files with excluded extensions are filtered."""
        processor = RepoProcessor()

        # Should exclude
        assert processor.is_file_excluded("image.png")
        assert processor.is_file_excluded("video.mp4")
        assert processor.is_file_excluded("script.min.js")
        assert processor.is_file_excluded("app.map")
        assert processor.is_file_excluded("binary.exe")
        assert processor.is_file_excluded("library.so")

        # Should not exclude
        assert not processor.is_file_excluded("README.md")
        assert not processor.is_file_excluded("main.py")
        assert not processor.is_file_excluded("app.js")

    def test_is_file_excluded_filenames(self):
        """Test that excluded filenames are filtered."""
        processor = RepoProcessor()

        # Should exclude
        assert processor.is_file_excluded("package-lock.json")
        assert processor.is_file_excluded("yarn.lock")
        assert processor.is_file_excluded("poetry.lock")
        assert processor.is_file_excluded(".DS_Store")

        # Should not exclude
        assert not processor.is_file_excluded("package.json")
        assert not processor.is_file_excluded("README.md")

    def test_get_file_priority_readme(self):
        """Test priority scoring for README files."""
        processor = RepoProcessor()

        assert processor.get_file_priority("README.md") == 100
        assert processor.get_file_priority("README.rst") == 100
        assert processor.get_file_priority("README.txt") == 95

    def test_get_file_priority_manifests(self):
        """Test priority scoring for dependency manifests."""
        processor = RepoProcessor()

        assert processor.get_file_priority("package.json") == 90
        assert processor.get_file_priority("pyproject.toml") == 90
        assert processor.get_file_priority("Cargo.toml") == 90
        assert processor.get_file_priority("go.mod") == 90

    def test_get_file_priority_requirements(self):
        """Test priority scoring for requirements files."""
        processor = RepoProcessor()

        assert processor.get_file_priority("requirements.txt") == 82
        assert processor.get_file_priority("setup.py") == 88

    def test_get_file_priority_docker(self):
        """Test priority scoring for Docker files."""
        processor = RepoProcessor()

        assert processor.get_file_priority("Dockerfile") == 72
        assert processor.get_file_priority("docker-compose.yml") == 72

    def test_get_file_priority_config(self):
        """Test priority scoring for config files."""
        processor = RepoProcessor()

        assert processor.get_file_priority(".env.example") == 68
        assert processor.get_file_priority("vercel.json") == 68
        assert processor.get_file_priority("netlify.toml") == 68

    def test_get_file_priority_entrypoint(self):
        """Test priority scoring for entry point files."""
        processor = RepoProcessor()

        assert processor.get_file_priority("main.py") == 55
        assert processor.get_file_priority("app.py") == 55
        assert processor.get_file_priority("index.js") == 52
        assert processor.get_file_priority("server.py") == 52

    def test_get_file_priority_init(self):
        """Test priority scoring for __init__.py files."""
        processor = RepoProcessor()

        assert processor.get_file_priority("__init__.py") == 45

    def test_get_file_priority_source(self):
        """Test priority scoring for generic source files."""
        processor = RepoProcessor()

        assert processor.get_file_priority("utils.py") == 20
        assert processor.get_file_priority("helper.js") == 20
        assert processor.get_file_priority("model.java") == 20

    def test_estimate_tokens(self):
        """Test token estimation."""
        processor = RepoProcessor()

        # Approximately 1 token per 4 characters
        text = "a" * 100  # ~25 tokens
        token_count = processor.estimate_tokens(text)

        assert 20 <= token_count <= 30

    def test_truncate_to_tokens(self):
        """Test token-based truncation."""
        processor = RepoProcessor()

        text = "a" * 1000
        truncated = processor.truncate_to_tokens(text, 100)

        # Should be truncated to ~400 chars (100 tokens * 4 chars)
        assert len(truncated) <= 450
        assert "... (truncated)" in truncated

    def test_directory_tree_generation(self):
        """Test directory tree generation."""
        processor = RepoProcessor()

        tree = [
            {"path": "README.md", "type": "blob"},
            {"path": "src/main.py", "type": "blob"},
            {"path": "src/utils.py", "type": "blob"},
            {"path": "tests/test_main.py", "type": "blob"},
            {"path": ".gitignore", "type": "blob"},
        ]

        directory_tree = processor.build_directory_tree(tree)

        # Should contain directory structure
        assert "src" in directory_tree or "main.py" in directory_tree
        assert "tests" in directory_tree or "test_main.py" in directory_tree
        assert "README.md" in directory_tree
        assert "project-root/" in directory_tree

    def test_max_tokens_constant(self):
        """Test that MAX_TOKENS is set correctly."""
        processor = RepoProcessor()
        # Should be 28,000 tokens as per design
        assert processor.MAX_TOKENS == 28000

    def test_priority_scores_exist(self):
        """Test that priority scores dictionary is populated."""
        processor = RepoProcessor()

        # Should have scores for common files
        assert "README.md" in processor.PRIORITY_SCORES
        assert "package.json" in processor.PRIORITY_SCORES
        assert "requirements.txt" in processor.PRIORITY_SCORES

    def test_excluded_dirs_exist(self):
        """Test that excluded directories set is populated."""
        processor = RepoProcessor()

        # Should have common excluded directories
        assert "node_modules" in processor.EXCLUDED_DIRS
        assert ".git" in processor.EXCLUDED_DIRS
        assert "__pycache__" in processor.EXCLUDED_DIRS
