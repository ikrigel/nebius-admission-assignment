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
  const [message, setMessage] = useState(null)
  const [logLevel, setLogLevel] = useState(Logger.getLogLevel())

  useEffect(() => {
    const saved = StorageService.getSettings()
    setSettings(saved)
    setLogLevel(Logger.getLogLevel())
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
    Logger.info(`Settings saved. Active provider: ${settings.activeProvider}, Log level: ${logLevel}`)
    setMessage({ type: 'success', text: 'Settings saved successfully!' })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleLogLevelChange = (e, newLevel) => {
    if (newLevel !== null) {
      setLogLevel(newLevel)
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
                  <Button
                    fullWidth
                    variant={settings.activeProvider === provider.id ? 'contained' : 'outlined'}
                    color="primary"
                    size="small"
                    onClick={() => handleSelectProvider(provider.id)}
                  >
                    {settings.activeProvider === provider.id ? 'Active' : 'Use This Provider'}
                  </Button>
                </Stack>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

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

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSave}
        >
          Save Settings
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
