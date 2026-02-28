import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  List,
  ListItem,
  Typography,
  IconButton,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  useTheme,
  Chip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DownloadIcon from '@mui/icons-material/Download'
import { Logger } from '../services/logger'
import { CsvService } from '../services/csv'

const LOG_COLORS = {
  DEBUG: '#64748b',
  INFO: '#6366f1',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
}

const LogPanel = () => {
  const theme = useTheme()
  const [logs, setLogs] = useState([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [filterLevel, setFilterLevel] = useState('ALL')

  useEffect(() => {
    // Load logs from logger
    setLogs(Logger.getAll())

    // Listen for new logs
    const handleNewLog = (event) => {
      setLogs(prev => [event.detail, ...prev].slice(0, 500))
    }

    const handleLogsClear = () => {
      setLogs([])
    }

    window.addEventListener('log-entry', handleNewLog)
    window.addEventListener('logs-cleared', handleLogsClear)

    return () => {
      window.removeEventListener('log-entry', handleNewLog)
      window.removeEventListener('logs-cleared', handleLogsClear)
    }
  }, [])

  const filteredLogs = filterLevel === 'ALL'
    ? logs
    : logs.filter(log => log.level === filterLevel)

  const handleClear = () => {
    Logger.clear()
    setLogs([])
  }

  const handleDelete = (id) => {
    Logger._logs = Logger._logs.filter(l => l.id !== id)
    Logger._saveToStorage()
    setLogs(Logger.getAll())
  }

  const handleExport = () => {
    CsvService.exportLogs()
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderRadius: 0,
        maxHeight: isExpanded ? '400px' : '50px',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          backgroundColor: theme.palette.mode === 'dark'
            ? theme.palette.background.default
            : theme.palette.grey[100],
          borderBottom: isExpanded ? `1px solid ${theme.palette.divider}` : 'none',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Logs ({filteredLogs.length})
        </Typography>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {isExpanded && (
            <>
              <ToggleButtonGroup
                size="small"
                value={filterLevel}
                exclusive
                onChange={(e, level) => level && setFilterLevel(level)}
                sx={{
                  '& .MuiToggleButton-root': {
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                  },
                }}
              >
                {['ALL', 'DEBUG', 'INFO', 'WARNING', 'ERROR'].map(level => (
                  <ToggleButton key={level} value={level}>
                    {level}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              <IconButton
                size="small"
                onClick={handleExport}
                title="Export logs as JSON"
              >
                <DownloadIcon fontSize="small" />
              </IconButton>

              <IconButton
                size="small"
                onClick={handleClear}
                title="Clear all logs"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}

          <IconButton
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Log list */}
      {isExpanded && (
        <Box
          sx={{
            overflowY: 'auto',
            maxHeight: 'calc(400px - 50px)',
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {filteredLogs.length > 0 ? (
            <List sx={{ p: 0 }}>
              {filteredLogs.map((log, idx) => (
                <ListItem
                  key={log.id || idx}
                  sx={{
                    py: 0.75,
                    px: 2,
                    borderLeft: `4px solid ${LOG_COLORS[log.level] || '#ccc'}`,
                    backgroundColor: idx % 2 === 0 ? 'transparent' : theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.02)'
                      : 'rgba(0, 0, 0, 0.02)',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ width: '100%', alignItems: 'flex-start' }}>
                    <Typography variant="caption" color="textSecondary" sx={{ minWidth: 70 }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Typography>

                    <Chip
                      label={log.level}
                      size="small"
                      sx={{
                        backgroundColor: LOG_COLORS[log.level] || '#ccc',
                        color: 'white',
                        fontSize: '0.7rem',
                        height: '20px',
                        minWidth: 60,
                      }}
                    />

                    <Typography
                      variant="caption"
                      sx={{
                        flex: 1,
                        wordBreak: 'break-word',
                        color: 'textPrimary',
                      }}
                    >
                      {log.message}
                    </Typography>

                    <IconButton
                      size="small"
                      onClick={() => handleDelete(log.id)}
                      sx={{ ml: 'auto' }}
                      title="Delete entry"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary">
                No logs to display
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  )
}

export default LogPanel
