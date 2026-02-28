/**
 * Logger service with in-memory and localStorage persistence.
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
}

const LOG_LEVEL_HIERARCHY = {
  NONE: 0,
  ERROR: 1,
  INFO: 2,
  VERBOSE: 3, // Includes DEBUG + INFO
}

const MAX_LOG_ENTRIES = 500

class LoggerService {
  constructor() {
    this._logs = []
    this._logLevel = 'INFO' // Default: INFO level
    this._loadFromStorage()
  }

  _loadFromStorage() {
    try {
      const stored = localStorage.getItem('rsum_logs')
      if (stored) {
        this._logs = JSON.parse(stored)
      }
      const levelStored = localStorage.getItem('rsum_log_level')
      if (levelStored) {
        this._logLevel = levelStored
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  _saveToStorage() {
    try {
      localStorage.setItem('rsum_logs', JSON.stringify(this._logs))
      localStorage.setItem('rsum_log_level', this._logLevel)
    } catch (e) {
      // Ignore storage errors
    }
  }

  _shouldLog(level) {
    const levelMap = {
      ERROR: 'ERROR',
      INFO: 'INFO',
      WARNING: 'WARNING',
      DEBUG: 'DEBUG',
    }

    if (this._logLevel === 'NONE') return false
    if (this._logLevel === 'ERROR') return level === 'ERROR'
    if (this._logLevel === 'INFO') return level === 'ERROR' || level === 'WARNING' || level === 'INFO'
    if (this._logLevel === 'VERBOSE') return true // Log everything

    return true
  }

  _log(level, message) {
    if (!this._shouldLog(level)) {
      return
    }

    const entry = {
      id: Date.now() + Math.random(),
      level,
      message,
      timestamp: new Date().toISOString(),
    }

    this._logs.unshift(entry) // Newest first
    if (this._logs.length > MAX_LOG_ENTRIES) {
      this._logs = this._logs.slice(0, MAX_LOG_ENTRIES)
    }

    this._saveToStorage()

    // Emit custom event for real-time updates
    window.dispatchEvent(
      new CustomEvent('log-entry', { detail: entry })
    )
  }

  debug(message) {
    this._log(LOG_LEVELS.DEBUG, message)
  }

  info(message) {
    this._log(LOG_LEVELS.INFO, message)
  }

  warn(message) {
    this._log(LOG_LEVELS.WARNING, message)
  }

  error(message) {
    this._log(LOG_LEVELS.ERROR, message)
  }

  getAll() {
    return [...this._logs]
  }

  getByLevel(level) {
    return this._logs.filter(l => l.level === level)
  }

  clear() {
    this._logs = []
    this._saveToStorage()
    window.dispatchEvent(new CustomEvent('logs-cleared'))
  }

  exportAsJSON() {
    return JSON.stringify(this._logs, null, 2)
  }

  setLogLevel(level) {
    const validLevels = ['NONE', 'ERROR', 'INFO', 'VERBOSE']
    if (validLevels.includes(level)) {
      this._logLevel = level
      this._saveToStorage()
      window.dispatchEvent(new CustomEvent('log-level-changed', { detail: { level } }))
    }
  }

  getLogLevel() {
    return this._logLevel
  }
}

export const Logger = new LoggerService()
