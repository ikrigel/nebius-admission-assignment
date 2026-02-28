/**
 * Logger service with in-memory and localStorage persistence.
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
}

const MAX_LOG_ENTRIES = 500

class LoggerService {
  constructor() {
    this._logs = []
    this._loadFromStorage()
  }

  _loadFromStorage() {
    try {
      const stored = localStorage.getItem('rsum_logs')
      if (stored) {
        this._logs = JSON.parse(stored)
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  _saveToStorage() {
    try {
      localStorage.setItem('rsum_logs', JSON.stringify(this._logs))
    } catch (e) {
      // Ignore storage errors
    }
  }

  _log(level, message) {
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
}

export const Logger = new LoggerService()
