/**
 * Enhanced debugging utility for development and troubleshooting.
 * Provides styled console output and performance monitoring.
 */

const COLORS = {
  info: '#6366f1',      // Indigo
  success: '#10b981',   // Green
  warning: '#f59e0b',   // Amber
  error: '#ef4444',     // Red
  debug: '#8b5cf6',     // Purple
  api: '#06b6d4',       // Cyan
}

const STYLES = {
  info: `color: ${COLORS.info}; font-weight: bold; font-size: 12px;`,
  success: `color: ${COLORS.success}; font-weight: bold; font-size: 12px;`,
  warning: `color: ${COLORS.warning}; font-weight: bold; font-size: 12px;`,
  error: `color: ${COLORS.error}; font-weight: bold; font-size: 12px;`,
  debug: `color: ${COLORS.debug}; font-weight: bold; font-size: 12px;`,
  api: `color: ${COLORS.api}; font-weight: bold; font-size: 12px;`,
  value: `color: #6b7280; font-family: monospace; font-size: 11px;`,
}

class DebugService {
  constructor() {
    this.timers = {}
    this.isDebugMode = this._checkDebugMode()
    this._initializeDebugWindow()
  }

  _checkDebugMode() {
    // Enable debug mode via URL param: ?debug=true
    const params = new URLSearchParams(window.location.search)
    return params.get('debug') === 'true' || localStorage.getItem('debug_mode') === 'true'
  }

  _initializeDebugWindow() {
    // Expose debug service globally for console access
    window.DEBUG = {
      info: (msg, data) => this.info(msg, data),
      success: (msg, data) => this.success(msg, data),
      warning: (msg, data) => this.warning(msg, data),
      error: (msg, data) => this.error(msg, data),
      debug: (msg, data) => this.debug(msg, data),
      api: (msg, data) => this.api(msg, data),
      startTimer: (label) => this.startTimer(label),
      endTimer: (label) => this.endTimer(label),
      logState: (name, state) => this.logState(name, state),
      logPerformance: () => this.logPerformance(),
      toggleDebugMode: () => this.toggleDebugMode(),
      enableVerbose: () => this.enableVerbose(),
    }
  }

  info(label, data = null) {
    console.log(`%c[INFO] ${label}`, STYLES.info, data || '')
  }

  success(label, data = null) {
    console.log(`%c[SUCCESS] ${label}`, STYLES.success, data || '')
  }

  warning(label, data = null) {
    console.warn(`%c[WARNING] ${label}`, STYLES.warning, data || '')
  }

  error(label, error = null) {
    console.error(`%c[ERROR] ${label}`, STYLES.error, error || '')
    if (error && error.stack) {
      console.error('Stack trace:', error.stack)
    }
  }

  debug(label, data = null) {
    if (this.isDebugMode) {
      console.log(`%c[DEBUG] ${label}`, STYLES.debug, data || '')
    }
  }

  api(label, data = null) {
    console.log(`%c[API] ${label}`, STYLES.api, data || '')
  }

  startTimer(label) {
    console.time(`[TIMER] ${label}`)
    this.timers[label] = Date.now()
  }

  endTimer(label) {
    console.timeEnd(`[TIMER] ${label}`)
    if (this.timers[label]) {
      const duration = Date.now() - this.timers[label]
      console.log(
        `%c[PERF] ${label} completed in ${duration}ms`,
        STYLES.success
      )
      delete this.timers[label]
      return duration
    }
  }

  logState(name, state) {
    console.group(`%c[STATE] ${name}`, STYLES.info)
    console.table(state)
    console.groupEnd()
  }

  logPerformance() {
    if (window.performance) {
      console.group('%c[PERFORMANCE]', STYLES.debug)
      const perfData = window.performance.timing
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
      const connectTime = perfData.responseEnd - perfData.requestStart
      const renderTime = perfData.domComplete - perfData.domLoading

      console.log(`%cPage Load Time: ${pageLoadTime}ms`, STYLES.value)
      console.log(`%cConnect Time: ${connectTime}ms`, STYLES.value)
      console.log(`%cRender Time: ${renderTime}ms`, STYLES.value)

      // Paint timing
      if (window.performance.getEntriesByType) {
        const paintEntries = window.performance.getEntriesByType('paint')
        paintEntries.forEach((entry) => {
          console.log(
            `%c${entry.name}: ${Math.round(entry.startTime)}ms`,
            STYLES.value
          )
        })
      }

      console.groupEnd()
    }
  }

  toggleDebugMode() {
    this.isDebugMode = !this.isDebugMode
    localStorage.setItem('debug_mode', this.isDebugMode ? 'true' : 'false')
    console.log(
      `%cDebug mode ${this.isDebugMode ? 'ENABLED' : 'DISABLED'}`,
      this.isDebugMode ? STYLES.success : STYLES.warning
    )
  }

  enableVerbose() {
    this.isDebugMode = true
    localStorage.setItem('debug_mode', 'true')
    console.log('%c🔍 Verbose debugging ENABLED - Set ?debug=true to auto-enable on next load', STYLES.success)
  }

  logNetworkActivity(event) {
    if (this.isDebugMode) {
      console.group(`%c[NETWORK] ${event.type}`, STYLES.api)
      console.log('Event:', event)
      console.groupEnd()
    }
  }
}

export const Debug = new DebugService()

// Enable helpful console message
if (typeof window !== 'undefined') {
  console.log(
    '%c🛠️ Debug utilities available via window.DEBUG',
    'color: #6366f1; font-weight: bold;'
  )
  console.log(
    '%cUsage: DEBUG.info(), DEBUG.api(), DEBUG.startTimer(), etc.',
    'color: #8b5cf6; font-size: 11px;'
  )
  console.log(
    '%cEnable verbose mode: DEBUG.enableVerbose() or add ?debug=true to URL',
    'color: #8b5cf6; font-size: 11px;'
  )
}
