/**
 * CSV service for exporting and downloading data.
 */

import { StorageService } from './storage'
import { Logger } from './logger'

class CsvServiceClass {
  historyToCsv(history) {
    const COLUMNS = ['timestamp', 'url', 'summary', 'technologies', 'structure']

    const header = COLUMNS.join(',')

    const rows = history.map(entry =>
      COLUMNS.map(col => {
        let val = entry[col] || ''

        // Join arrays with semicolons
        if (Array.isArray(val)) {
          val = val.join('; ')
        }

        // Escape: wrap in quotes, double any internal quotes
        val = String(val).replace(/"/g, '""')
        return `"${val}"`
      }).join(',')
    )

    return [header, ...rows].join('\n')
  }

  download(filename, csvString) {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  exportHistory() {
    const history = StorageService.getHistory()
    if (!history.length) {
      Logger.warn('No history to export')
      return
    }

    const csv = this.historyToCsv(history)
    const filename = `repo-history-${new Date().getTime()}.csv`
    this.download(filename, csv)

    Logger.info(`Exported ${history.length} entries as CSV`)
  }

  exportLogs() {
    const logs = StorageService.getLogs()
    const json = JSON.stringify(logs, null, 2)

    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `logs-${new Date().getTime()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)

    Logger.info(`Exported logs as JSON`)
  }
}

export const CsvService = new CsvServiceClass()
