# GitHub Repo Summarizer

A GitHub repository analysis service that uses LLMs to generate summaries of what projects do, what technologies they use, and how they're structured.

## Prerequisites

- Python 3.10+
- Node.js 18+
- pip
- npm

## Setup

### Backend

```bash
pip install -r requirements.txt
cp .env.example .env
# Edit .env to add your NEBIUS_API_KEY (or other LLM provider key)
uvicorn backend.main:app --reload --port 8000
```

### Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
# Opens http://localhost:5173 (proxies /api to localhost:8000)
```

## Testing

Test the API directly:

```bash
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"github_url": "https://github.com/psf/requests"}'
```

Expected response:

```json
{
  "summary": "The Requests library is...",
  "technologies": ["Python", "urllib3", "certifi"],
  "structure": "The project follows..."
}
```

## Model Choice

**Model**: `meta-llama/Meta-Llama-3.1-70B-Instruct` (via Nebius Token Factory)

**Rationale**: 128k context window (large repos), strong code comprehension and understanding, cost-effective on Nebius's free tier.

## Repository Processing Strategy

- **Git Trees API**: Uses GitHub's Git Trees API with `?recursive=1` for efficient single-call tree walking (vs O(n) recursive Contents API calls)
- **File Filtering**: Excludes binary files, lock files, node_modules, build artifacts, etc.
- **Priority Scoring**: Prioritizes README, manifests (package.json, pyproject.toml), config files, and source files
- **Context Budget**: 28,000 tokens max, fills by priority score, truncates if needed
- **Directory Tree**: Always includes full ASCII tree structure for context

## Frontend Features

- Search GitHub repositories
- View summaries (description, technologies, structure)
- Browse search history
- Export history as CSV
- Manage API keys for multiple providers (Nebius, OpenAI, Anthropic, Gemini, Perplexity)
- View application logs with level filters
- Fully responsive design (mobile, tablet, desktop)

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

The `vercel.json` configuration handles both the Python backend (serverless functions) and React frontend (static build).

## Support Providers

- Nebius Token Factory (default, free $1 credit)
- OpenAI
- Anthropic (Claude)
- Google Gemini
- Perplexity

## Architecture

- **Backend**: Python FastAPI with async support
- **Frontend**: React 18 + Material-UI 5 + Vite
- **Services**: Multi-provider LLM abstraction layer
- **Storage**: LocalStorage for client-side history, logs, and settings
