# GitHub Repository Summarizer

A web application that analyzes GitHub repositories using Large Language Models to generate human-readable summaries of what projects do, what technologies they use, and how they're structured.

## Features

- **Repository Analysis**: Automatically analyze public GitHub repositories
- **Multiple LLM Providers**: Support for Nebius, OpenAI, Anthropic, and Perplexity
- **Smart File Selection**: Intelligently selects the most important repository files (README, configuration, source)
- **Search History**: Automatically tracks all analyzed repositories with timestamps and export to CSV
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop screens
- **Application Logging**: Built-in log panel with DEBUG, INFO, WARNING, ERROR levels and export functionality
- **Configurable Log Levels**: Choose logging verbosity (None, Errors Only, Info, Verbose)
- **GitHub Token Support**: Add Personal Access Token to increase API rate limits (60 → 5,000 req/hr)
- **Key Management**: Delete individual API keys or clear all credentials with one click
- **Persistent Settings**: All data stored locally in browser—no server-side storage
- **Comprehensive Testing**: 48 automated tests covering configuration, GitHub API, file filtering, and endpoints
- **Frontend Debugging**: Browser console utilities for performance monitoring, state inspection, and timing

## Live Demo

🚀 **Deployed on Vercel** - https://nebius-admission-assignment.vercel.app/

## Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- npm (comes with Node.js)
- pip (comes with Python)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ikrigel/nebius-admission-assignment.git
cd nebius-admission-assignment
```

### 2. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Create environment configuration
cp .env.example .env

# Edit .env with your LLM API key
# For Nebius: get key from https://api.studio.nebius.ai/
# For OpenAI: https://platform.openai.com/api-keys
# For Anthropic: https://console.anthropic.com/
# For Perplexity: https://www.perplexity.ai/api
```

Example `.env`:

```
LLM_PROVIDER=nebius
NEBIUS_API_KEY=v1.CmQKHHN0YXRpY2tleXMtZTAw...
```

### 3. Start Backend Server (Terminal 1)

```bash
# Using python -m (recommended if uvicorn command not found)
python -m uvicorn backend.main:app --reload --port 8000

# Or directly if uvicorn is on PATH
uvicorn backend.main:app --reload --port 8000
```

You should see: `Uvicorn running on http://127.0.0.1:8000`

### 4. Frontend Setup (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

You should see: `Local: http://localhost:5173/`

## Testing the Application

### Automated Tests

Run the comprehensive test suite with pytest:

```bash
# Run all tests (48 tests)
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_config.py

# Run with coverage report
pip install pytest-cov
pytest --cov=backend --cov-report=html
```

**Test Coverage**:
- ✅ Configuration & settings validation
- ✅ GitHub API URL parsing & language detection
- ✅ File filtering & priority scoring
- ✅ FastAPI endpoints & SPA routing
- ✅ Path traversal attack protection

See [TESTING.md](./TESTING.md) for complete testing guide.

### Manual Web Interface Testing

1. Open http://localhost:5173 in your browser
2. Go to **Settings** page (left menu)
3. Select your LLM provider and enter your API key
4. Click **Save Settings**
5. Go to **Home** page
6. Enter a GitHub URL: `https://github.com/psf/requests`
7. Click **Summarize** and wait for results

### API Direct Testing

```bash
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"github_url": "https://github.com/psf/requests"}'
```

Expected response:

```json
{
  "summary": "The Requests library is an elegant, simple HTTP library for Python, designed for human beings...",
  "technologies": ["Python", "urllib3", "certifi"],
  "structure": "The project follows a standard Python package layout with source code in src/, comprehensive tests, and detailed documentation..."
}
```

### Debug Mode

**Frontend Debugging**:
- Access debug utilities: `window.DEBUG` in browser console
- Enable debug mode: Add `?debug=true` to URL
- Performance monitoring: `DEBUG.logPerformance()`
- State inspection: `DEBUG.logState('name', state)`

See [TESTING.md](./TESTING.md#frontend-testing) for complete debugging guide.

## Model Selection

**Primary Model**: `nvidia/Llama-3_1-Nemotron-Ultra-253B-v1` (Nebius)

**Why This Model?**
- **256k context window**: Handles large repositories efficiently
- **Strong code comprehension**: Excellent at understanding software projects
- **Cost-effective**: Free credits on Nebius; sufficient for extensive testing
- **Performance**: Fast inference times for interactive use

**Alternative Models**:
- OpenAI: `gpt-4o-mini` (lightweight, recommended for production)
- Anthropic: `claude-3-5-haiku-20241022` (latest Claude Haiku model)
- Perplexity: `sonar`

**Model Selection in Web Interface**:
Select your preferred provider in the **Settings** page to use that model's default, or edit `.env` to specify a custom model via `LLM_MODEL` variable.

## Repository Processing Strategy

The application uses a multi-stage approach to handle repositories of any size:

### 1. Smart File Filtering

**Excluded Directories** (80+% of files typically):
- `node_modules/`, `.git/`, `__pycache__/`, `dist/`, `build/`, `.venv/`, `vendor/`, etc.

**Excluded File Types**:
- Binary files (images, videos, executables)
- Lock files (`package-lock.json`, `yarn.lock`, `poetry.lock`)
- Generated code (`.min.js`, `.map`, etc.)

### 2. Priority Scoring

Files are scored 0-100 based on importance:

- **100 points**: README.md (project identity)
- **90 points**: Dependency manifests (package.json, pyproject.toml, Cargo.toml, go.mod)
- **82 points**: Requirements files (requirements.txt, setup.py)
- **72 points**: Docker config (Dockerfile, docker-compose.yml)
- **55 points**: Entry points (main.py, app.py, index.js)
- **20 points**: All other source files

### 3. Context Window Management

- **Budget**: 28,000 tokens (≈ 112,000 characters)
- **Strategy**: Fill by priority score, truncate last file if needed
- **Directory Tree**: Always included for structural context

**Example**: For a large repository like Linux kernel:
- Total files: 70,000+ → Filtered: ~5,000 → Selected: ~50 most important files
- Final context: README + key makefiles + core system headers → ~20,000 tokens
- Reserve: 8,000 tokens for LLM's response

## Project Structure

```
nebius-admission-assignment/
├── backend/
│   ├── config.py              # Environment configuration
│   ├── main.py                # FastAPI application entry
│   ├── routers/
│   │   └── summarize.py       # POST /api/summarize endpoint
│   └── services/
│       ├── github_service.py  # GitHub API integration
│       ├── repo_processor.py  # File filtering & prioritization
│       └── llm_service.py     # Multi-provider LLM abstraction
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Root React component
│   │   ├── main.jsx           # React entry point
│   │   ├── theme.js           # MUI dark theme config
│   │   ├── pages/
│   │   │   ├── Home.jsx       # Main search & history
│   │   │   ├── Settings.jsx   # API key management
│   │   │   ├── About.jsx      # Project info
│   │   │   └── Help.jsx       # FAQ
│   │   ├── components/
│   │   │   ├── Layout.jsx     # Navigation & layout
│   │   │   └── LogPanel.jsx   # Log viewer
│   │   └── services/
│   │       ├── api.js         # Backend API client
│   │       ├── storage.js     # LocalStorage wrapper
│   │       ├── logger.js      # Logging service
│   │       ├── csv.js         # Export service
│   │       └── debug.js       # Debug utilities (console logging)
│   ├── package.json
│   └── vite.config.js
├── tests/                     # Automated test suite (48 tests)
│   ├── test_config.py         # Configuration tests
│   ├── test_github_service.py # GitHub API tests
│   ├── test_repo_processor.py # File filtering tests
│   └── test_main.py           # FastAPI endpoint tests
├── api/
│   └── index.py               # Vercel serverless entry
├── requirements.txt           # Python dependencies
├── .env.example               # Environment template
├── vercel.json                # Vercel deployment config
├── pytest.ini                 # Pytest configuration
├── conftest.py                # Pytest fixtures & setup
├── TESTING.md                 # Testing & debugging guide
└── README.md                  # This file
```

## Deployment to Vercel

### 1. Prerequisites

- Vercel account (free at vercel.com)
- GitHub account with this repo

### 2. Deploy

```bash
# Option A: Via CLI
npm i -g vercel
vercel --prod

# Option B: Via GitHub
# Push to GitHub, go to vercel.com, and import the repository
```

### 3. Configure Environment

On Vercel dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add `NEBIUS_API_KEY` (or your LLM provider key)
3. Redeploy

The `vercel.json` automatically:
- Builds React frontend to `dist/`
- Deploys Python backend as serverless functions
- Routes `/api/*` to Python, everything else to React

## Settings & Configuration

### LLM Provider Settings
Go to **Settings** page to:
- Select your preferred LLM provider
- Enter your API key (saved locally, never sent to servers)
- Delete individual API keys with one click

### GitHub Token (Optional)
Add a GitHub Personal Access Token to improve API rate limits:
- **Without token**: 60 requests/hour
- **With token**: 5,000 requests/hour

Steps:
1. Go to https://github.com/settings/tokens/new
2. Create token with `repo` and `public_repo` scopes
3. Go to **Settings** → **GitHub Token** section
4. Paste token and click **Save Settings**

### Logging Configuration
Control application logging verbosity in **Settings**:
- **None**: No logs displayed
- **Errors Only**: Only error messages
- **Info** (default): Errors + info messages
- **Verbose**: All messages including debug logs

View logs in the collapsible panel at the bottom of the page.

## Environment Variables

All variables are optional except you need at least one LLM API key:

```bash
# LLM Configuration
LLM_PROVIDER=nebius                    # nebius|openai|anthropic|perplexity
LLM_MODEL=nvidia/Llama-3_1-...        # Optional, uses provider default
NEBIUS_API_KEY=v1.CmQKHH...          # Required if using Nebius
OPENAI_API_KEY=sk-...                 # Required if using OpenAI
ANTHROPIC_API_KEY=sk-ant-...         # Required if using Anthropic
PERPLEXITY_API_KEY=pplx-...           # Required if using Perplexity

# GitHub (Optional, raises rate limit from 60 to 5000 req/hr)
GITHUB_TOKEN=ghp_...                  # Optional GitHub PAT
```

**Note**: API keys can be configured in the web interface (Settings page) without using environment variables.

## Troubleshooting

### Backend won't start

```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution**: Install dependencies
```bash
pip install -r requirements.txt
```

### Frontend build fails

```
error: Could not resolve '@mui/material'
```

**Solution**: Install dependencies
```bash
cd frontend && npm install
```

### API calls fail with 503

```
ValueError: API key not provided for provider
```

**Solution**: Check Settings page has API key saved and correct provider selected

### "Repository not found" error

**Possible causes**:
1. URL is incorrect (typo)
2. Repository is private
3. Repository URL format is wrong

**Solution**: Use format: `https://github.com/owner/repo`

### Rate limit exceeded

**GitHub Rate Limit**: 60 requests/hour (public)
- **Solution**: Add `GITHUB_TOKEN` to `.env`

**LLM Rate Limit**: Varies by provider
- **Solution**: Wait a few minutes and retry, or upgrade account

## Code Quality

- **Backend**: ~800 lines, modular services, async/await
- **Frontend**: ~2000 lines, React components, Material-UI
- **File Size**: Each file < 250 lines (requirement met)
- **Documentation**: Comprehensive comments and design docs in `claude.md`

## Testing Repositories

Good test repositories:
- `https://github.com/psf/requests` — Python HTTP library
- `https://github.com/vuejs/vue` — JavaScript framework
- `https://github.com/jqlang/jq` — JSON processor
- `https://github.com/torvalds/linux` — Large C project (stress test)

## Support & Contact

- **Issue Tracker**: GitHub Issues
- **Documentation**: See `claude.md` for architecture and design decisions
- **Academy Task**: https://taskchecker.academy.nebius.com/tasks/ai-performance-engineering-2026

## License

This project is an educational submission for the Nebius Academy. All rights reserved.

## Architecture Overview

For detailed architecture, design decisions, and technical rationale, see [claude.md](./claude.md).
