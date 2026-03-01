import httpx
import base64
import re
import logging
from dataclasses import dataclass
from typing import Optional
from fastapi import HTTPException

logger = logging.getLogger(__name__)


@dataclass
class RepoFile:
    """Represents a file in a repository."""
    path: str
    content: str
    size: int
    language: Optional[str] = None


class GitHubService:
    """GitHub API client for fetching repository contents."""

    BASE_URL = "https://api.github.com"

    def __init__(self, github_token: Optional[str] = None):
        self.github_token = github_token
        self.session: Optional[httpx.AsyncClient] = None

    async def get_session(self) -> httpx.AsyncClient:
        """Get or create the async HTTP session."""
        if not self.session:
            headers = {"Accept": "application/vnd.github+json"}
            if self.github_token:
                headers["Authorization"] = f"token {self.github_token}"
            self.session = httpx.AsyncClient(
                base_url=self.BASE_URL,
                headers=headers,
                timeout=10.0,
            )
        return self.session

    async def close(self):
        """Close the HTTP session."""
        if self.session:
            await self.session.aclose()

    def _parse_github_url(self, url: str) -> tuple[str, str, str]:
        """Parse GitHub URL and return (owner, repo, branch)."""
        url = url.strip()
        logger.info(f"🔗 Parsing GitHub URL: {url}")

        if not url.startswith("http"):
            url = f"https://{url}"
            logger.debug(f"✏️  Added https prefix: {url}")

        # Try to extract owner/repo from URL
        match = re.search(r"github\.com[:/]([^/]+)/([^/]+)(?:/tree/([^/]+))?", url)
        if not match:
            logger.error(f"❌ Failed to parse URL: {url}")
            raise HTTPException(
                status_code=400,
                detail="Invalid GitHub URL. Expected: https://github.com/owner/repo"
            )

        owner, repo, branch = match.groups()
        logger.debug(f"📋 Raw parse result - owner: {owner}, repo: {repo}, branch: {branch}")

        # Remove .git suffix if present (use removesuffix, not rstrip!)
        if repo.endswith(".git"):
            logger.debug(f"🔪 Removing .git suffix from {repo}")
            repo = repo[:-4]  # Remove last 4 characters (.git)

        branch = branch or "main"  # Default to main branch
        logger.info(f"✅ Parsed - owner: {owner}, repo: {repo}, branch: {branch}")
        return owner, repo, branch

    async def get_repo_tree(self, url: str) -> tuple[str, str, list[dict]]:
        """
        Fetch the full repository tree using Git Trees API.
        Returns (owner, repo, tree) where tree is a list of file dicts.
        """
        owner, repo, branch = self._parse_github_url(url)
        session = await self.get_session()

        try:
            # Get the commit SHA for the branch
            api_url = f"/repos/{owner}/{repo}/git/ref/heads/{branch}"
            logger.info(f"🌐 Fetching branch ref: {api_url}")
            ref_response = await session.get(api_url)
            logger.debug(f"📊 Branch ref response status: {ref_response.status_code}")

            # If main branch not found, try master as fallback
            if ref_response.status_code == 404 and branch == "main":
                logger.info(f"⚠️  Branch 'main' not found, trying 'master'...")
                branch = "master"
                api_url = f"/repos/{owner}/{repo}/git/ref/heads/{branch}"
                logger.info(f"🌐 Retrying with: {api_url}")
                ref_response = await session.get(api_url)
                logger.debug(f"📊 Branch ref response status: {ref_response.status_code}")

            if ref_response.status_code == 404:
                error_detail = f"GitHub API returned 404. URL: /repos/{owner}/{repo}/git/ref/heads/{branch}. Response: {ref_response.text[:200]}"
                logger.error(f"❌ {error_detail}")
                raise HTTPException(
                    status_code=404,
                    detail=error_detail
                )
            if ref_response.status_code == 403:
                raise HTTPException(
                    status_code=429,
                    detail="GitHub API rate limit exceeded."
                )

            ref_data = ref_response.json()
            if "object" not in ref_data:
                raise HTTPException(
                    status_code=500,
                    detail=f"Unexpected GitHub API response. Expected 'object' key. Got: {ref_data}"
                )
            sha = ref_data["object"]["sha"]

            # Get the full tree recursively
            tree_response = await session.get(
                f"/repos/{owner}/{repo}/git/trees/{sha}",
                params={"recursive": "1"}
            )
            if tree_response.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail="Repository not found or is private."
                )
            if tree_response.status_code == 403:
                raise HTTPException(
                    status_code=429,
                    detail="GitHub API rate limit exceeded."
                )

            tree_data = tree_response.json()
            tree = tree_data.get("tree", [])
            return owner, repo, tree

        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="GitHub API request timeout.")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching repository: {str(e)}")

    async def get_file_content(self, owner: str, repo: str, path: str) -> Optional[str]:
        """Fetch content of a single file."""
        session = await self.get_session()
        try:
            response = await session.get(f"/repos/{owner}/{repo}/contents/{path}")
            if response.status_code == 404:
                return None
            if response.status_code == 403:
                return None  # Rate limited, skip this file

            data = response.json()
            if "content" in data:
                content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
                return content
        except Exception:
            pass
        return None

    def get_file_language(self, path: str) -> Optional[str]:
        """Infer programming language from file extension."""
        ext_to_lang = {
            ".py": "Python",
            ".js": "JavaScript",
            ".ts": "TypeScript",
            ".jsx": "React",
            ".tsx": "React",
            ".java": "Java",
            ".cpp": "C++",
            ".c": "C",
            ".cs": "C#",
            ".rb": "Ruby",
            ".go": "Go",
            ".rs": "Rust",
            ".php": "PHP",
            ".swift": "Swift",
            ".kt": "Kotlin",
            ".scala": "Scala",
            ".sh": "Shell",
            ".bash": "Bash",
        }
        for ext, lang in ext_to_lang.items():
            if path.endswith(ext):
                return lang
        return None
