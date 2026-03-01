# Comprehensive Debugging Guide

This document provides detailed guidance on debugging the GitHub Repository Summarizer application.

## Table of Contents

1. [Backend Debugging](#backend-debugging)
2. [Frontend Debugging](#frontend-debugging)
3. [API Testing](#api-testing)
4. [Performance Monitoring](#performance-monitoring)
5. [Common Issues & Solutions](#common-issues--solutions)

---

## Backend Debugging

### Enhanced Logging

The backend includes a comprehensive `DebugLogger` class in `backend/debug.py` with color-coded output.

#### Log Levels

The backend uses Python's standard logging with DEBUG, INFO, WARNING, and ERROR levels:

```bash
# Run backend with debug logging
python -m uvicorn backend.main:app --reload --port 8000
```

#### Debug Logger Methods

**In your code**, import and use the debug logger:

```python
from backend.debug import DebugLogger

debug_logger = DebugLogger(__name__)

# Request logging
debug_logger.log_request("POST", "/api/summarize", url="https://github.com/psf/requests")

# Success logging (green)
debug_logger.log_success("Repository processed successfully")

# Error logging (red with traceback)
debug_logger.log_error("Failed to fetch repository", error=exception)

# Debug logging (blue)
debug_logger.log_debug("Starting token estimation...")

# Structured data logging
debug_logger.log_data("Repository stats", {
    "owner": "psf",
    "repo": "requests",
    "files": 150,
    "tokens": 28000
})

# API call logging
debug_logger.log_api_call("openai", "gpt-4o-mini", tokens_used=2500)
```

#### Performance Timing

```python
# Start timer
debug_logger.start_timer("fetch_files")

# ... do work ...

# End timer - returns duration in milliseconds
duration = debug_logger.end_timer("fetch_files")
# Output: ✓ fetch_files: 1234.5ms
```

#### Decorator-Based Timing

```python
from backend.debug import debug_timer

@debug_timer(debug_logger, "repository_processing")
async def process_repo(github_url):
    # Function execution time will be automatically logged
    pass
```

### Logging Configuration

The backend automatically configures logging in `backend/main.py`:

```python
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Environment-Based Debug Output

Set environment variables to control debug output:

```bash
# Enable all debug output
export PYTHONUNBUFFERED=1
python -m uvicorn backend.main:app --reload

# Increase verbosity
export DEBUG=true
python -m uvicorn backend.main:app --reload
```

---

## Frontend Debugging

### Browser Console Debug Tools

The frontend exposes a global `DEBUG` object with various utilities.

#### Enable Debug Mode

**Option 1: URL Parameter**
```
http://localhost:5173/?debug=true
```

**Option 2: Local Storage**
```javascript
localStorage.setItem('debug_mode', 'true')
// Refresh page
```

**Option 3: Console Command**
```javascript
DEBUG.enableVerbose()
```

### Debug Console API

All commands available via `window.DEBUG` in browser console:

#### Logging Methods

```javascript
// Blue colored info log
DEBUG.info('Starting analysis', { url: 'https://...' })

// Green colored success log
DEBUG.success('Repository fetched', { files: 150 })

// Yellow colored warning log
DEBUG.warning('Rate limit approaching', { remaining: 50 })

// Red colored error log
DEBUG.error('API call failed', error)

// Purple colored debug (only in debug mode)
DEBUG.debug('Processing file', { name: 'package.json' })

// Cyan colored API log
DEBUG.api('Calling LLM', { provider: 'nebius', model: '...' })
```

#### Performance Monitoring

```javascript
// Start a timer
DEBUG.startTimer('repository_analysis')

// ... do work ...

// End timer - shows duration
DEBUG.endTimer('repository_analysis')
// Output: ✓ repository_analysis: 5234ms

// View all performance metrics
DEBUG.logPerformance()
// Shows: page load time, paint timing, DOM timing, etc.
```

#### State Inspection

```javascript
// Log any object/state as a table
DEBUG.logState('User Settings', {
    provider: 'nebius',
    model: 'nvidia/Llama-3.1-Nemotron-Ultra',
    apiKeySet: true
})

// Check storage
DEBUG.logState('Local Storage', localStorage)
```

#### Debug Mode Control

```javascript
// Toggle debug mode on/off
DEBUG.toggleDebugMode()

// Enable verbose mode (persistent)
DEBUG.enableVerbose()

// Check current debug mode
window.DEBUG.isDebugMode  // true/false
```

### Network Debugging

The API service includes detailed logging with colored output:

```
🟦 [API] Starting summarize request...
🟦 [API] Settings: { activeProvider: "nebius", keys: {...} }
🟦 [API] Provider: nebius
🟦 [API] API Key provided: ***
🟦 [API] Endpoint: http://localhost:5173/api/summarize
🟦 [API] Request body: { github_url: "https://github.com/psf/requests" }
🟦 [API] Sending POST request...
🟦 [API] Response status: 200
🟦 [API] Response OK: true
🟦 [API] Response data: { summary: "...", technologies: [...], structure: "..." }
✅ [API] Request successful
```

#### Enable Network Monitoring

Open DevTools → Network tab to monitor:
- Request headers (including X-Provider, X-Api-Key)
- Response status and timing
- Response payload size and format

---

## API Testing

### Direct cURL Testing

```bash
# Basic API test
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"github_url": "https://github.com/psf/requests"}'

# With custom provider and API key
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -H "X-Provider: openai" \
  -H "X-Api-Key: sk-your-key" \
  -d '{"github_url": "https://github.com/torvalds/linux"}'

# With GitHub token
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -H "X-Github-Token: ghp_your_token" \
  -d '{"github_url": "https://github.com/psf/requests"}'

# Verbose output (shows request/response)
curl -v -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"github_url": "https://github.com/psf/requests"}'

# Pretty-print JSON response
curl -s -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"github_url": "https://github.com/psf/requests"}' | jq '.'
```

### Health Check

```bash
curl http://localhost:8000/health
# Response: {"status":"ok"}
```

### Error Testing

```bash
# Invalid GitHub URL
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"github_url": "not-a-github-url"}'
# Response: 400 Bad Request

# Private repository
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"github_url": "https://github.com/private/repo"}'
# Response: 404 Repository not found

# Missing API key
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"github_url": "https://github.com/psf/requests"}'
# Response: 503 Service Unavailable (if no env API key)
```

---

## Performance Monitoring

### Backend Performance

Monitor backend performance via logs:

```
✓ fetch_github_tree: 234.5ms
✓ process_repository: 456.3ms
✓ generate_summary: 2345.6ms
✓ summarize_endpoint: 3456.7ms
```

### Frontend Performance

```javascript
// View comprehensive performance metrics
DEBUG.logPerformance()
// Shows:
// - Page Load Time: 1234ms
// - Connect Time: 123ms
// - Render Time: 456ms
// - First Paint: 234ms
// - First Contentful Paint: 289ms
```

### Browser DevTools

1. **Performance Tab**: Record and analyze page performance
2. **Network Tab**: Monitor API calls and response times
3. **Console Tab**: View debug output and errors
4. **Storage Tab**: Inspect localStorage and cookies

### Response Time Targets

- Health check: < 10ms
- Repository summary: < 5 seconds (depends on repo size and LLM)
- GitHub API calls: < 1 second per file
- LLM API calls: 1-10 seconds (provider dependent)

---

## Common Issues & Solutions

### Issue: "Failed to load module script" in Console

**Cause**: Static files (JS, CSS) not being served with correct MIME type

**Debug Steps**:
1. Check Network tab → Assets → Look for 404 or wrong MIME type
2. Verify frontend build exists: `ls frontend/dist/`
3. Check backend logs for file serving errors
4. Hard refresh: Ctrl+Shift+R

**Solution**:
```bash
# Rebuild frontend
cd frontend && npm run build

# Restart backend
python -m uvicorn backend.main:app --reload
```

---

### Issue: API Returns 503 "Service Unavailable"

**Cause**: Missing API key for configured LLM provider

**Debug Steps**:
1. Check Settings page - is API key saved?
2. Check browser console for error details
3. Check backend logs for provider initialization errors

**Solution**:
```bash
# Verify env variables
echo $NEBIUS_API_KEY  # Should show key (first 10 chars)

# Or add key via Settings UI
```

---

### Issue: Repository Not Found (404)

**Cause**: Private repo or incorrect URL format

**Debug Steps**:
1. Verify URL format: `https://github.com/owner/repo`
2. Check if repo is public: Visit URL in browser
3. Check GitHub rate limit: `curl https://api.github.com/rate_limit`

**Solution**:
```bash
# Add GitHub token for higher rate limit
export GITHUB_TOKEN=ghp_your_token

# Restart backend
python -m uvicorn backend.main:app --reload
```

---

### Issue: Tests Fail with Dependency Error

**Cause**: Missing test dependencies

**Solution**:
```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run tests
pytest -v
```

---

### Issue: Slow API Response (> 30 seconds)

**Debug Steps**:
```javascript
// In browser console
DEBUG.startTimer('total')
// ... interact with app ...
DEBUG.endTimer('total')

// Check backend logs for where time is spent
// Example output:
// ✓ fetch_github_tree: 234ms
// ✓ process_repository: 1234ms  <- Usually slowest
// ✓ generate_summary: 5678ms    <- Depends on LLM
```

**Optimization Tips**:
- Use GitHub token to improve fetch speed
- Choose smaller repositories for testing
- Monitor LLM API response time
- Check network latency to API providers

---

## Debugging Workflows

### Debug a Failed Repository Summary

```bash
# 1. Check backend logs
tail -50 /var/log/app.log  # Or run with --reload to see live

# 2. Test API directly
curl -v -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"github_url": "https://github.com/psf/requests"}'

# 3. Check frontend logs
# Open DevTools → Console tab
# Look for 🔴 [API] error messages

# 4. Inspect error details
DEBUG.logState('Last Error', window.lastError)
```

### Debug Performance Issue

```javascript
// In browser console:
DEBUG.logPerformance()
DEBUG.startTimer('api_call')

// Trigger action (e.g., click Summarize)

// Then in console:
DEBUG.endTimer('api_call')

// Compare with expected times:
// - GitHub API: < 1s
// - LLM API: 1-10s
// - Total: < 15s
```

### Debug Settings Not Saving

```javascript
// Check localStorage
console.log(localStorage.getItem('rsum_settings'))

// Or use debug utility
DEBUG.logState('Settings', JSON.parse(localStorage.getItem('rsum_settings')))

// Clear and retry
localStorage.removeItem('rsum_settings')
// Refresh page and re-enter settings
```

---

## Advanced: Custom Debug Output

Add custom debug logging to your code:

**Backend Example**:
```python
from backend.debug import DebugLogger

debug_logger = DebugLogger(__name__)

async def my_function():
    debug_logger.start_timer("my_operation")

    try:
        # Do work
        debug_logger.log_success("Operation completed")
    except Exception as e:
        debug_logger.log_error("Operation failed", error=e)
    finally:
        debug_logger.end_timer("my_operation")
```

**Frontend Example**:
```javascript
import { Debug } from './services/debug.js'

async function myFunction() {
  Debug.startTimer('my_operation')

  try {
    // Do work
    Debug.success('Operation completed')
  } catch (error) {
    Debug.error('Operation failed', error)
  } finally {
    Debug.endTimer('my_operation')
  }
}
```

---

## Resources

- [Python Logging Documentation](https://docs.python.org/3/library/logging.html)
- [Browser DevTools Documentation](https://developer.chrome.com/docs/devtools/)
- [FastAPI Debugging Guide](https://fastapi.tiangolo.com/tutorial/debugging/)
- [React DevTools](https://react-devtools-tutorial.vercel.app/)
