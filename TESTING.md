# Testing Guide

This document explains how to run tests and use debugging tools for the GitHub Repository Summarizer application.

## Backend Testing

### Setup

1. Install test dependencies:
```bash
pip install -r requirements.txt
```

### Running Tests

#### Run all tests:
```bash
pytest
```

#### Run tests with verbose output:
```bash
pytest -v
```

#### Run specific test file:
```bash
pytest tests/test_config.py
```

#### Run specific test class:
```bash
pytest tests/test_config.py::TestSettings
```

#### Run specific test:
```bash
pytest tests/test_config.py::TestSettings::test_settings_initialization
```

#### Run tests matching a pattern:
```bash
pytest -k "parse_github"
```

#### Run tests with coverage:
```bash
pip install pytest-cov
pytest --cov=backend --cov-report=html
# Open htmlcov/index.html in browser
```

### Test Organization

Tests are organized by module:

- **`tests/test_config.py`**: Configuration and settings tests
  - Validates environment variable loading
  - Tests API key retrieval per provider
  - Tests default model selection

- **`tests/test_github_service.py`**: GitHub API client tests
  - URL parsing (basic, with branch, with .git suffix, SSH format)
  - Language detection
  - Header management (GitHub token)

- **`tests/test_repo_processor.py`**: File filtering and processing tests
  - Directory exclusion logic
  - File exclusion logic
  - Priority scoring system
  - Token counting
  - Directory tree generation

- **`tests/test_main.py`**: FastAPI application tests
  - Health check endpoint
  - SPA routing
  - Path traversal protection
  - CORS headers

### Test Examples

#### Configuration Test
```python
def test_get_api_key_nebius(self):
    """Test getting API key for Nebius provider."""
    # Sets NEBIUS_API_KEY env var
    # Creates Settings instance
    # Verifies get_api_key() returns correct key
```

#### GitHub Service Test
```python
def test_parse_github_url_basic(self):
    """Test parsing basic GitHub URL."""
    # Parses "https://github.com/psf/requests"
    # Verifies owner, repo, and branch extraction
    # Checks default branch is "main"
```

#### Application Test
```python
def test_health_check(self, client):
    """Test health check returns ok status."""
    # Makes GET request to /health
    # Verifies response status and JSON
```

## Frontend Testing

### Manual Testing

The frontend can be tested manually in the browser. Open DevTools (F12) to access debug utilities.

### Debug Utilities

Several debugging tools are available in the browser console:

#### Global Debug API
```javascript
// View available commands
DEBUG

// Info logging
DEBUG.info('message', data)

// Success logging
DEBUG.success('message', data)

// Warning logging
DEBUG.warning('message', data)

// Error logging
DEBUG.error('message', data)

// Debug logging (only in debug mode)
DEBUG.debug('message', data)

// API logging
DEBUG.api('message', data)
```

#### Performance Monitoring
```javascript
// Start timer
DEBUG.startTimer('operation')

// ... do something ...

// End timer and log duration
DEBUG.endTimer('operation')  // Logs: Operation completed in 234ms

// Log all performance metrics
DEBUG.logPerformance()  // Shows page load time, paint timing, etc.
```

#### State Inspection
```javascript
// Log state as a table
DEBUG.logState('component-state', { prop1: value1, prop2: value2 })
```

#### Debug Mode Control
```javascript
// Toggle debug mode on/off
DEBUG.toggleDebugMode()

// Enable verbose debugging
DEBUG.enableVerbose()
```

### Enabling Debug Mode

#### Option 1: URL Parameter
Add `?debug=true` to the URL:
```
http://localhost:5173/?debug=true
```

#### Option 2: Local Storage
```javascript
localStorage.setItem('debug_mode', 'true')
```

#### Option 3: Console Command
```javascript
DEBUG.enableVerbose()
```

### API Debugging

The API service (`api.js`) includes extensive logging with the 🟦 (blue square) prefix:

```javascript
// Example API logs in console:
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

### Application Logging

The application maintains a log panel at the bottom of the page. You can:

1. **View logs**: See all application logs at different levels
2. **Filter by level**: Show only errors, info, or all messages
3. **Search logs**: Filter logs by text content
4. **Export logs**: Download logs as JSON for analysis
5. **Clear logs**: Remove all recorded logs

The log levels are:
- **NONE**: No logs displayed
- **ERROR**: Only errors
- **INFO**: Errors and info messages (default)
- **VERBOSE**: All messages including debug

## Troubleshooting

### Common Issues

#### Tests fail with "No module named 'backend'"
**Solution**: Run pytest from the project root directory:
```bash
cd /path/to/nebius-admission-assignment
pytest
```

#### CORS errors in frontend
**Solution**: Ensure backend dev server is running:
```bash
python -m uvicorn backend.main:app --reload --port 8000
```

#### API calls timeout
**Solution**: Check that both frontend and backend are running
- Backend: http://localhost:8000/health
- Frontend: http://localhost:5173

#### Static files return 404
**Solution**: Rebuild frontend and check `frontend/dist` exists:
```bash
cd frontend
npm run build
```

## Continuous Integration

The test suite can be integrated with CI/CD pipelines:

```bash
# GitHub Actions example
- name: Run tests
  run: |
    pip install -r requirements.txt
    pytest --cov=backend --cov-report=xml

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Best Practices

1. **Run tests before committing**
   ```bash
   pytest
   ```

2. **Test new features**
   - Add tests in appropriate `tests/test_*.py` file
   - Run only your new tests: `pytest -k "new_feature"`

3. **Debug failures**
   - Use `-v` flag for verbose output
   - Use `-s` flag to see print statements
   - Use `--pdb` to drop into debugger on failure

4. **Monitor performance**
   - Use `DEBUG.logPerformance()` in console
   - Check Network tab in DevTools
   - Monitor backend logs for slow API calls

## Additional Resources

- **Backend**: [FastAPI Docs](https://fastapi.tiangolo.com)
- **Frontend**: [React Docs](https://react.dev)
- **Testing**: [Pytest Docs](https://docs.pytest.org)
- **API Debugging**: Check browser DevTools Console for detailed logs
