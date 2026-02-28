/**
 * Storage service with localStorage wrapper for typed access.
 */

const KEYS = {
  HISTORY: 'rsum_history',
  SETTINGS: 'rsum_settings',
  LOGS: 'rsum_logs',
  GITHUB_TOKEN: 'rsum_github_token',
  PAGE_STATE: (page) => `rsum_page_${page}`,
}

class StorageServiceClass {
  // History management
  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]')
    } catch (e) {
      return []
    }
  }

  addToHistory(entry) {
    try {
      const history = this.getHistory()
      history.unshift(entry)
      localStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 1000)))
    } catch (e) {
      console.error('Failed to add to history:', e)
    }
  }

  clearHistory() {
    localStorage.removeItem(KEYS.HISTORY)
  }

  // Settings management
  getSettings() {
    try {
      return JSON.parse(
        localStorage.getItem(KEYS.SETTINGS) || '{"activeProvider":"nebius","keys":{}}'
      )
    } catch (e) {
      return { activeProvider: 'nebius', keys: {} }
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  // Logs management
  getLogs() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]')
    } catch (e) {
      return []
    }
  }

  saveLogs(logs) {
    try {
      localStorage.setItem(KEYS.LOGS, JSON.stringify(logs))
    } catch (e) {
      console.error('Failed to save logs:', e)
    }
  }

  // Per-page state
  getPageState(page) {
    try {
      const state = localStorage.getItem(KEYS.PAGE_STATE(page))
      return state ? JSON.parse(state) : null
    } catch (e) {
      return null
    }
  }

  savePageState(page, state) {
    try {
      localStorage.setItem(KEYS.PAGE_STATE(page), JSON.stringify(state))
    } catch (e) {
      console.error('Failed to save page state:', e)
    }
  }

  // GitHub token management
  getGithubToken() {
    try {
      return localStorage.getItem(KEYS.GITHUB_TOKEN) || ''
    } catch (e) {
      return ''
    }
  }

  saveGithubToken(token) {
    try {
      if (token) {
        localStorage.setItem(KEYS.GITHUB_TOKEN, token)
      } else {
        localStorage.removeItem(KEYS.GITHUB_TOKEN)
      }
    } catch (e) {
      console.error('Failed to save GitHub token:', e)
    }
  }

  // Utility
  clear() {
    try {
      localStorage.clear()
    } catch (e) {
      console.error('Failed to clear storage:', e)
    }
  }
}

export const StorageService = new StorageServiceClass()
