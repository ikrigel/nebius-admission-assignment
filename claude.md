# GitHub Repo Summarizer — Design Decisions & Architecture

## Overview

This document outlines the key architectural and design decisions made for the GitHub Repo Summarizer project.

## Technology Choices

### Backend: FastAPI

**Why FastAPI?**

- **Async Support**: Native async/await for concurrent API calls (GitHub, LLM providers)
- **Pydantic Validation**: Automatic request/response validation and schema generation
- **Auto OpenAPI**: Generates interactive API documentation out of the box
- **Performance**: High-performance ASGI framework suitable for serverless (Vercel)

Alternative considered: Flask. Too synchronous; would require additional libraries for async support.

### Frontend: React 18 + Material-UI 5 + Vite

**Why React + MUI?**

- **Component-Based**: Reusable, composable UI components
- **Material-UI 5**: Production-grade responsive component library with built-in dark theme
- **Responsive by Default**: MUI's Grid, Drawer, AppBar handle mobile/tablet/desktop automatically via breakpoints
- **Vite**: Fast development server with HMR (hot module reload), lightning-fast builds

**Why not vanilla JS?**
- React enables cleaner state management across pages
- MUI provides battle-tested responsive patterns (hamburger drawer, grid layouts)
- Vite's dev proxy feature (`/api` → localhost:8000) eliminates CORS issues in development

### GitHub API: Git Trees with Recursive Flag

**Why Git Trees API?**

- **Single API call**: `GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1` returns the entire tree in one request
- **Avoids rate limits**: No O(n) recursive calls; 60 req/hour limit becomes less of a bottleneck
- **Fast**: Milliseconds vs seconds for large repos

Alternative considered: Contents API with recursive traversal. Causes rate limit issues on large repos (e.g., Linux kernel).

## Architecture

### Multi-Provider LLM Abstraction

The `LLMService` uses a provider registry pattern:

```python
PROVIDER_REGISTRY = {
    "nebius": NebiusProvider,
    "openai": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "gemini": GeminiProvider,
    "perplexity": PerplexityProvider,
}
```

**Key insight**: Nebius and Perplexity are both OpenAI-compatible APIs (same SDK, different `base_url`). This reduces code duplication:

- **Nebius**: `openai.AsyncOpenAI(base_url="https://api.studio.nebius.ai/v1/", api_key=...)`
- **Perplexity**: `openai.AsyncOpenAI(base_url="https://api.perplexity.ai", api_key=...)`
- **OpenAI**: `openai.AsyncOpenAI(api_key=...)`

Anthropic and Gemini have their own SDKs with slightly different interfaces, but the abstraction hides these differences.

### File Filtering & Context Management

The `repo_processor.py` implements a **three-tier filtering strategy**:

1. **Hard Exclusion**: Skip entire directories and file types
   - Dirs: node_modules, .git, __pycache__, dist, build, .venv, vendor
   - Extensions: binaries, lock files, generated code
   - Files: package-lock.json, .DS_Store, etc.

2. **Priority Scoring**: Rank non-excluded files by importance
   - README (100): Project identity
   - Manifests (90): dependencies
   - Config files (70): project structure
   - Main files (55): entry points
   - Generic source (20): everything else

3. **Context Budget**: Fill by priority until 28,000 tokens used
   - Always include: directory tree (cheap, structural context)
   - Files: ordered by score, truncate last file if needed

**Why 28,000 tokens?** Safe limit for 32k-context models with room for the prompt and response.

### User-Provided API Keys

The frontend Settings page lets users input their own API keys. These are sent to the backend via request headers:

```
X-Provider: openai
X-Api-Key: sk-xxx
```

The backend reads these headers and, if present, uses the user's key instead of the configured env var. This allows a single deployment to serve multiple users with their own API accounts.

### LocalStorage Schema

Frontend state persists via localStorage with `rsum_` prefix:

- `rsum_history`: Array of `{url, summary, technologies, structure, timestamp}`
- `rsum_settings`: `{activeProvider, keys: {nebius: "...", openai: "..."}}`
- `rsum_logs`: Array of `{id, level, message, timestamp}`
- `rsum_page_home`: Page-specific state (last search URL, results)

This survives page refreshes and browser restarts.

### Responsive Design Strategy

MUI provides native responsive support via `sx` prop and `useMediaQuery` hook:

- **xs/sm (mobile <960px)**: Drawer `variant="temporary"` (slides over), single column layout
- **md (tablet 960–1280px)**: Drawer `variant="permanent"` (always visible), two-column layout
- **lg+ (desktop >1280px)**: Drawer permanent, wide layout with full tables

This is declared once in the component definition, not via CSS media queries.

### Vercel Deployment

The monorepo is configured for Vercel with `vercel.json`:

- **Frontend**: React app in `frontend/` builds to `frontend/dist/` via `npm run build`
- **Backend**: Python serverless functions in `api/index.py`
- **Routing**: `/api/*` → Python; `/*` → React build (SPA fallback to index.html)

Vercel's `@vercel/python` runtime wraps the FastAPI ASGI app automatically.

## Testing Strategy

1. **Backend**: Test with curl against `/api/summarize`
2. **Frontend**: Manual testing in browser at localhost:5173
3. **Integration**: Verify Vite dev proxy routes `/api` calls correctly
4. **Edge Cases**: Invalid URLs, private repos, empty repos, network errors
5. **Responsive**: Test mobile viewport (DevTools) for hamburger menu, layout reflow
6. **E2E**: Perform full search-to-CSV workflow on all devices

## Future Improvements (Out of Scope)

- Add unit tests (pytest backend, vitest frontend)
- Cache LLM responses for repeated repos
- Add repo search by technology (reverse index)
- Support GitHub authentication (OAuth) for higher rate limits
- Add dark/light theme toggle (currently dark-only)
