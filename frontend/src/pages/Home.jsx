import { useState, useEffect } from 'react'
import {
  Container,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { StorageService } from '../services/storage'
import { ApiService } from '../services/api'
import { CsvService } from '../services/csv'
import { Logger } from '../services/logger'

const Home = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [url, setUrl] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Load history on mount
    const hist = StorageService.getHistory()
    setHistory(hist)

    // Load last search
    const lastState = StorageService.getPageState('home')
    if (lastState) {
      setUrl(lastState.url)
      setResult(lastState.result)
    }
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!url.trim()) {
      Logger.warn('Search attempted with empty URL')
      setError('Please enter a GitHub repository URL')
      return
    }

    if (!url.includes('github.com')) {
      Logger.warn(`Invalid URL: ${url}`)
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)')
      return
    }

    setLoading(true)
    setError(null)
    Logger.info(`Summarizing repository: ${url}`)

    try {
      const data = await ApiService.summarize(url)
      setResult(data)
      StorageService.addToHistory({
        url,
        summary: data.summary,
        technologies: data.technologies,
        structure: data.structure,
        timestamp: new Date().toISOString(),
      })
      setHistory(StorageService.getHistory())
      StorageService.savePageState('home', { url, result: data })
      Logger.info(`Successfully summarized: ${url}`)
    } catch (err) {
      Logger.error(`Summary failed: ${err.message}`)
      setError(err.message || 'Failed to summarize repository')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCsv = () => {
    if (history.length === 0) {
      Logger.warn('No history to export')
      setError('No search history to export')
      return
    }
    CsvService.exportHistory()
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" sx={{ mb: 4, fontWeight: 600 }}>
        GitHub Repository Summarizer
      </Typography>

      {/* Search Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSearch}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="GitHub Repository URL"
              placeholder="https://github.com/owner/repo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
              disabled={loading}
            />
            <Button
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{ alignSelf: 'flex-start' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Summarize'}
            </Button>
          </Stack>
        </form>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Results and History Layout */}
      <Grid container spacing={3}>
        {/* Results (left side on md+) */}
        <Grid item xs={12} md={6}>
          {result && (
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Summary
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {result.summary}
                </Typography>

                <Typography variant="h6" sx={{ mb: 1 }}>
                  Technologies
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {result.technologies && result.technologies.length > 0 ? (
                    result.technologies.map((tech, idx) => (
                      <Chip key={idx} label={tech} variant="outlined" color="primary" />
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No technologies detected
                    </Typography>
                  )}
                </Stack>

                <Typography variant="h6" sx={{ mb: 1 }}>
                  Project Structure
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {result.structure}
                </Typography>
              </CardContent>
            </Card>
          )}
          {!result && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">
                Enter a repository URL and click Summarize to get started
              </Typography>
            </Box>
          )}
        </Grid>

        {/* History (right side on md+) */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Search History</Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportCsv}
              disabled={history.length === 0}
            >
              Export CSV
            </Button>
          </Box>

          {history.length > 0 ? (
            isMobile ? (
              // Mobile: Card list
              <Stack spacing={2}>
                {history.map((item, idx) => (
                  <Paper key={idx} sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, wordBreak: 'break-all' }}>
                      <strong>{item.url}</strong>
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(item.timestamp).toLocaleString()}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            ) : (
              // Desktop: Table
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                      <TableCell>Repository</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Link</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.url.replace('https://github.com/', '')}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {new Date(item.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            startIcon={<OpenInNewIcon />}
                            href={item.url}
                            target="_blank"
                          >
                            Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : (
            <Typography variant="body2" color="textSecondary">
              No search history yet
            </Typography>
          )}
        </Grid>
      </Grid>
    </Container>
  )
}

export default Home
