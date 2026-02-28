from dataclasses import dataclass
from typing import Optional
from .github_service import GitHubService, RepoFile


@dataclass
class ProcessedRepo:
    """Processed repository with selected files and directory tree."""
    owner: str
    repo: str
    directory_tree: str
    files: list[RepoFile]
    total_files_count: int
    fetched_files_count: int


class RepoProcessor:
    """Process repository tree, filter files, and manage context budget."""

    # Hard exclusion lists
    EXCLUDED_DIRS = {
        "node_modules", ".git", "__pycache__", "dist", "build",
        ".venv", "venv", "env", ".env", "vendor", "bower_components",
        ".next", ".nuxt", "coverage", ".cache", "tmp", "temp", ".pytest_cache"
    }

    EXCLUDED_EXTENSIONS = {
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
        ".ttf", ".woff", ".woff2", ".eot",
        ".pdf", ".docx", ".xlsx",
        ".zip", ".tar", ".gz", ".rar", ".7z",
        ".pyc", ".pyo", ".so", ".dll", ".exe", ".o",
        ".mp3", ".mp4", ".mov", ".avi", ".wav",
        ".lock", ".min.js", ".min.css", ".map",
    }

    EXCLUDED_FILENAMES = {
        "package-lock.json", "yarn.lock", "Pipfile.lock", "poetry.lock",
        "composer.lock", ".DS_Store", "Thumbs.db",
        ".gitignore", ".gitattributes",
    }

    # Priority scoring (0-100)
    PRIORITY_SCORES = {
        "README.md": 100, "README.rst": 100, "README.txt": 95,
        "pyproject.toml": 90, "setup.py": 88, "setup.cfg": 87,
        "package.json": 90, "Cargo.toml": 90, "go.mod": 90,
        "pom.xml": 85, "build.gradle": 85, "Gemfile": 85,
        "requirements.txt": 82, "requirements-dev.txt": 78,
        "docker-compose.yml": 72, "Dockerfile": 72,
        ".env.example": 68, "vercel.json": 68, "netlify.toml": 68,
        "tsconfig.json": 65, ".eslintrc": 60, "jest.config.js": 60,
        "main.py": 55, "app.py": 55, "index.py": 52, "server.py": 52,
        "index.js": 52, "index.ts": 52, "main.ts": 52, "main.js": 52,
        "__init__.py": 45,
    }

    # Context window budget in tokens (estimate: 1 token ≈ 4 chars)
    MAX_TOKENS = 28000

    def is_file_excluded(self, path: str) -> bool:
        """Check if a file should be excluded."""
        parts = path.split("/")

        # Check if any directory segment is excluded
        for part in parts[:-1]:
            if part in self.EXCLUDED_DIRS:
                return True

        # Check file extension
        for ext in self.EXCLUDED_EXTENSIONS:
            if path.endswith(ext):
                return True

        # Check filename
        filename = parts[-1]
        if filename in self.EXCLUDED_FILENAMES:
            return True

        return False

    def get_file_priority(self, path: str) -> int:
        """Get priority score for a file (0-100)."""
        filename = path.split("/")[-1]

        # Exact filename match
        if filename in self.PRIORITY_SCORES:
            return self.PRIORITY_SCORES[filename]

        # Pattern matching for .eslintrc.* and jest.config.*
        if filename.startswith(".eslintrc"):
            return 60
        if filename.startswith("jest.config"):
            return 60

        # Boost source files in src/ or lib/ directories
        if "/src/" in path or "/lib/" in path:
            return 25

        # Default score
        return 20

    def estimate_tokens(self, content: str) -> int:
        """Estimate tokens in content (1 token ≈ 4 chars)."""
        return max(1, len(content) // 4)

    def truncate_to_tokens(self, content: str, max_tokens: int) -> str:
        """Truncate content to fit within max tokens."""
        max_chars = max_tokens * 4
        if len(content) <= max_chars:
            return content
        return content[:max_chars] + "\n... (truncated)"

    def build_directory_tree(self, tree: list[dict], max_lines: int = 200) -> str:
        """Build ASCII directory tree from flat file list."""
        if not tree:
            return ""

        # Build nested structure
        root = {}
        for item in tree:
            if item.get("type") != "blob":
                continue

            path = item.get("path", "")
            parts = path.split("/")
            current = root

            for i, part in enumerate(parts[:-1]):
                if part not in current:
                    current[part] = {}
                current = current[part]

            # Add file
            if len(parts) > 0:
                filename = parts[-1]
                if filename not in current:
                    current[filename] = None

        # Render tree
        lines = []

        def render_tree(node, prefix="", max_depth=3, current_depth=0):
            if current_depth >= max_depth:
                return

            items = sorted(
                [(k, v) for k, v in node.items()],
                key=lambda x: (x[1] is not None, x[0])  # Dirs first, then files
            )

            for i, (name, subtree) in enumerate(items):
                if len(lines) >= max_lines:
                    return

                is_last = i == len(items) - 1
                connector = "└── " if is_last else "├── "
                lines.append(f"{prefix}{connector}{name}")

                if subtree is not None:
                    next_prefix = prefix + ("    " if is_last else "│   ")
                    render_tree(subtree, next_prefix, max_depth, current_depth + 1)

        tree_str = "project-root/\n"
        render_tree(root)
        tree_str += "\n".join(lines[:max_lines])

        return tree_str

    async def process(
        self,
        github_url: str,
        github_service: GitHubService
    ) -> ProcessedRepo:
        """Process a GitHub repository and return selected files."""
        owner, repo, tree = await github_service.get_repo_tree(github_url)

        # Filter and score files
        candidates = []
        total_count = 0

        for item in tree:
            if item.get("type") != "blob":
                continue

            path = item.get("path", "")
            total_count += 1

            if self.is_file_excluded(path):
                continue

            priority = self.get_file_priority(path)
            size = item.get("size", 0)
            candidates.append({
                "path": path,
                "priority": priority,
                "size": size,
            })

        # Sort by priority (descending)
        candidates.sort(key=lambda x: (-x["priority"], x["path"]))

        # Fetch files within budget
        selected_files = []
        tokens_used = 0
        fetched_count = 0
        max_files_to_fetch = 50

        for candidate in candidates[:max_files_to_fetch]:
            if tokens_used >= self.MAX_TOKENS:
                break

            path = candidate["path"]
            content = await github_service.get_file_content(owner, repo, path)

            if content is None:
                continue

            tokens_needed = self.estimate_tokens(content)

            if tokens_used + tokens_needed <= self.MAX_TOKENS:
                selected_files.append(RepoFile(
                    path=path,
                    content=content,
                    size=len(content),
                    language=github_service.get_file_language(path),
                ))
                tokens_used += tokens_needed
                fetched_count += 1
            elif self.MAX_TOKENS - tokens_used > 500:
                # Partially include: truncate to remaining budget
                remaining_tokens = self.MAX_TOKENS - tokens_used
                truncated = self.truncate_to_tokens(content, remaining_tokens)
                selected_files.append(RepoFile(
                    path=path,
                    content=truncated,
                    size=len(truncated),
                    language=github_service.get_file_language(path),
                ))
                tokens_used += self.estimate_tokens(truncated)
                fetched_count += 1
                break

        # Build directory tree
        directory_tree = self.build_directory_tree(tree)

        return ProcessedRepo(
            owner=owner,
            repo=repo,
            directory_tree=directory_tree,
            files=selected_files,
            total_files_count=total_count,
            fetched_files_count=fetched_count,
        )
