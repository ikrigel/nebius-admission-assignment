import { useState, useEffect } from 'react'
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  Typography,
  Stack,
  Alert,
  Box,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import DeleteIcon from '@mui/icons-material/Delete'
import { StorageService } from '../services/storage'
import { Logger } from '../services/logger'

const PROVIDERS = [
  { id: 'nebius', label: 'Nebius Token Factory', url: 'https://tokenfactory.nebius.com/' },
  { id: 'openai', label: 'OpenAI', url: 'https://platform.openai.com/api-keys' },
  { id: 'anthropic', label: 'Anthropic (Claude)', url: 'https://console.anthropic.com/' },
  { id: 'gemini', label: 'Google Gemini', url: 'https://aistudio.google.com/app/apikey' },
  { id: 'perplexity', label: 'Perplexity', url: 'https://www.perplexity.ai/api' },
]

const Settings = () => {
  const theme = useTheme()
  const [settings, setSettings] = useState({ activeProvider: 'nebius', keys: {} })
  const [showKeys, setShowKeys] = useState({})
  const [showGithubToken, setShowGithubToken] = useState(false)
  const [githubToken, setGithubToken] = useState('')
  const [message, setMessage] = useState(null)
  const [logLevel, setLogLevel] = useState(Logger.getLogLevel())

  useEffect(() => {
    const saved = StorageService.getSettings()
    setSettings(saved)
    setLogLevel(Logger.getLogLevel())

    // Load GitHub token
    const token = StorageService.getGithubToken()
    setGithubToken(token || '')
    Logger.info('Settings page loaded')
  }, [])

  const handleKeyChange = (providerId, value) => {
    setSettings(prev => ({
      ...prev,
      keys: {
        ...prev.keys,
        [providerId]: value,
      },
    }))
  }

  const handleSelectProvider = (providerId) => {
    setSettings(prev => ({
      ...prev,
      activeProvider: providerId,
    }))
  }

  const handleSave = () => {
    StorageService.saveSettings(settings)
    Logger.setLogLevel(logLevel)
    StorageService.saveGithubToken(githubToken)
    Logger.info(`Settings saved. Active provider: ${settings.activeProvider}, Log level: ${logLevel}`)
    setMessage({ type: 'success', text: 'Settings saved successfully!' })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleLogLevelChange = (e, newLevel) => {
    if (newLevel !== null) {
      setLogLevel(newLevel)
    }
  }

  const handleDeleteKey = (providerId) => {
    setSettings(prev => ({
      ...prev,
      keys: {
        ...prev.keys,
        [providerId]: '',
      },
    }))
    Logger.info(`Deleted API key for ${providerId}`)
    setMessage({ type: 'info', text: `API key for ${providerId} deleted` })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleDeleteGithubToken = () => {
    setGithubToken('')
    Logger.info('Deleted GitHub token')
    setMessage({ type: 'info', text: 'GitHub token deleted' })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleClearAllKeys = () => {
    if (window.confirm('Are you sure you want to delete all API keys and tokens? This cannot be undone.')) {
      setSettings({ activeProvider: 'nebius', keys: {} })
      setGithubToken('')
      StorageService.saveSettings({ activeProvider: 'nebius', keys: {} })
      StorageService.saveGithubToken('')
      Logger.warn('All API keys and tokens cleared')
      setMessage({ type: 'warning', text: 'All keys and tokens have been deleted' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const toggleShowKey = (providerId) => {
    setShowKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId],
    }))
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" sx={{ mb: 4, fontWeight: 600 }}>
        Settings
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Typography variant="h5" sx={{ mb: 3 }}>
        LLM Providers
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
        Select your preferred LLM provider and enter your API key. The selected provider will be used for summarizing repositories.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {PROVIDERS.map(provider => (
          <Grid item xs={12} sm={6} md={4} key={provider.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: settings.activeProvider === provider.id
                  ? `2px solid ${theme.palette.primary.main}`
                  : `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardHeader
                title={provider.label}
                sx={{ pb: 1 }}
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="API Key"
                  type={showKeys[provider.id] ? 'text' : 'password'}
                  value={settings.keys[provider.id] || ''}
                  onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => toggleShowKey(provider.id)}
                          edge="end"
                        >
                          {showKeys[provider.id] ? (
                            <VisibilityOffIcon fontSize="small" />
                          ) : (
                            <VisibilityIcon fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </CardContent>
              <CardActions sx={{ pt: 0 }}>
                <Stack spacing={1} sx={{ width: '100%' }}>
                  <Button
                    size="small"
                    endIcon={<OpenInNewIcon />}
                    href={provider.url}
                    target="_blank"
                    variant="text"
                  >
                    Get API Key
                  </Button>
                  <Stack direction="row" spacing={1}>
                    <Button
                      fullWidth
                      variant={settings.activeProvider === provider.id ? 'contained' : 'outlined'}
                      color="primary"
                      size="small"
                      onClick={() => handleSelectProvider(provider.id)}
                    >
                      {settings.activeProvider === provider.id ? 'Active' : 'Use This Provider'}
                    </Button>
                    {settings.keys[provider.id] && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteKey(provider.id)}
                        title="Delete this API key"
                      >
                        Delete
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mb: 4, p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          GitHub Token (Optional)
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Add a GitHub Personal Access Token to increase the API rate limit from 60 to 5,000 requests per hour. This helps when analyzing large repositories or making many requests.
        </Typography>

        <Stack spacing={2}>
          <TextField
            fullWidth
            label="GitHub Personal Access Token"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            type={showGithubToken ? 'text' : 'password'}
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowGithubToken(!showGithubToken)}
                    edge="end"
                  >
                    {showGithubToken ? (
                      <VisibilityOffIcon fontSize="small" />
                    ) : (
                      <VisibilityIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={2}>
            <Button
              size="small"
              variant="text"
              endIcon={<OpenInNewIcon />}
              href="https://github.com/settings/tokens/new"
              target="_blank"
            >
              Create Token
            </Button>
            {githubToken && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteGithubToken}
              >
                Delete Token
              </Button>
            )}
          </Stack>

          <Typography variant="caption" color="textSecondary">
            Required scopes: <code>repo</code>, <code>public_repo</code>
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ mb: 4, p: 3, backgroundColor: theme.palette.background.default, borderRadius: 1 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Logging
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Control the verbosity of application logs:
        </Typography>
        <Stack spacing={1}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Log Level:</Typography>
            <ToggleButtonGroup
              value={logLevel}
              exclusive
              onChange={handleLogLevelChange}
              size="small"
            >
              <ToggleButton value="NONE">None</ToggleButton>
              <ToggleButton value="ERROR">Errors Only</ToggleButton>
              <ToggleButton value="INFO">Info</ToggleButton>
              <ToggleButton value="VERBOSE">Verbose</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Typography variant="caption" color="textSecondary">
            • <strong>None:</strong> No logs<br/>
            • <strong>Errors Only:</strong> Only error messages<br/>
            • <strong>Info:</strong> Errors + info messages (default)<br/>
            • <strong>Verbose:</strong> All messages including debug logs
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSave}
        >
          Save Settings
        </Button>
        <Button
          variant="outlined"
          color="error"
          size="large"
          startIcon={<DeleteIcon />}
          onClick={handleClearAllKeys}
        >
          Clear All Keys & Tokens
        </Button>
      </Box>

      {!settings.keys[settings.activeProvider] && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          ⚠️ No API key set for {PROVIDERS.find(p => p.id === settings.activeProvider)?.label}.
          Please add your API key above.
        </Alert>
      )}
    </Container>
  )
}

export default Settings
