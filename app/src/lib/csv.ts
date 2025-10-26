/**
 * CSV logging utilities for experiment data
 */

/**
 * CSV schema columns in order
 */
export const CSV_HEADERS = [
  'pid',
  'ts',
  'block',
  'trial',
  'modality',
  'ui_mode',
  'pressure',
  'aging',
  'ID',
  'A',
  'W',
  'target_x',
  'target_y',
  'rt_ms',
  'correct',
  'err_type',
  'hover_ms',
  'confirm_type',
  'pupil_z_med',
  'tlx_global',
  'tlx_mental',
  'browser',
  'dpi',
] as const

export type CSVRow = Record<string, string | number | boolean | null>

/**
 * CSV Logger class
 */
export class CSVLogger {
  private headers: string[]
  private rows: CSVRow[]
  private sessionData: Partial<CSVRow>

  constructor(headers: string[] = [...CSV_HEADERS]) {
    this.headers = headers
    this.rows = []
    this.sessionData = {}
  }

  /**
   * Initialize session-level data
   */
  initSession(data: Partial<CSVRow>): void {
    this.sessionData = {
      ...data,
      browser: this.getBrowser(),
      dpi: this.getDPI(),
    }
  }

  /**
   * Get browser information
   */
  private getBrowser(): string {
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  /**
   * Get DPI/pixel ratio
   */
  private getDPI(): number {
    return window.devicePixelRatio || 1
  }

  /**
   * Validate row has required keys
   */
  private validateRow(row: CSVRow): boolean {
    const requiredKeys = ['ts', 'trial']
    for (const key of requiredKeys) {
      if (!(key in row)) {
        console.warn(`Missing required key: ${key}`)
        return false
      }
    }
    return true
  }

  /**
   * Push a new row
   */
  pushRow(row: CSVRow): void {
    // Merge with session data
    const fullRow: CSVRow = {
      ...this.sessionData,
      ...row,
    } as CSVRow

    // Validate
    if (!this.validateRow(fullRow)) {
      console.error('Invalid row:', fullRow)
      return
    }

    this.rows.push(fullRow)
  }

  /**
   * Get all rows
   */
  getRows(): CSVRow[] {
    return [...this.rows]
  }

  /**
   * Clear all rows
   */
  clear(): void {
    this.rows = []
  }

  /**
   * Convert to CSV string
   */
  toCSV(): string {
    const lines: string[] = []

    // Header row
    lines.push(this.headers.join(','))

    // Data rows
    for (const row of this.rows) {
      const values = this.headers.map((header) => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        
        // Escape quotes and wrap in quotes if contains comma
        const strValue = String(value)
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`
        }
        return strValue
      })
      lines.push(values.join(','))
    }

    return lines.join('\n')
  }

  /**
   * Download CSV file
   */
  downloadCSV(filename: string = 'experiment_data.csv'): void {
    const csvContent = this.toCSV()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  /**
   * Get row count
   */
  getRowCount(): number {
    return this.rows.length
  }

  /**
   * Export as JSON
   */
  toJSON(): string {
    return JSON.stringify(this.rows, null, 2)
  }

  /**
   * Download as JSON
   */
  downloadJSON(filename: string = 'experiment_data.json'): void {
    const jsonContent = this.toJSON()
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }
}

/**
 * Global CSV logger instance
 */
let globalLogger: CSVLogger | null = null

/**
 * Initialize global logger
 */
export function initLogger(pid?: string): CSVLogger {
  globalLogger = new CSVLogger()
  globalLogger.initSession({
    pid: pid || `P${Date.now()}`,
  })
  return globalLogger
}

/**
 * Get global logger instance
 */
export function getLogger(): CSVLogger {
  if (!globalLogger) {
    globalLogger = initLogger()
  }
  return globalLogger
}

/**
 * Helper to create row from trial event
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createRowFromTrial(payload: any, blockNumber: number = 1): CSVRow {
  const row: CSVRow = {
    ts: payload.timestamp || Date.now(),
    block: blockNumber,
    trial: payload.trial || payload.trialNumber || 0,
    modality: payload.modality || '',
    ui_mode: payload.ui_mode || '',
    pressure: payload.pressure || 0,
    aging: payload.aging || false,
    ID: payload.ID || null,
    A: payload.A || null,
    W: payload.W || null,
    target_x: payload.targetPos?.x || null,
    target_y: payload.targetPos?.y || null,
    rt_ms: payload.rt_ms || null,
    correct: payload.correct !== undefined ? payload.correct : null,
    err_type: payload.err_type || payload.error || null,
    hover_ms: payload.hover_ms || null,
    confirm_type: payload.confirm_type || null,
    pupil_z_med: payload.pupil_z_med || null,
    tlx_global: payload.tlx_global || null,
    tlx_mental: payload.tlx_mental || null,
  }
  
  return row
}

/**
 * Helper to attach TLX values to a row
 */
export function attachTlxToRow(row: CSVRow, tlxValues?: { global: number; mental: number }): CSVRow {
  if (tlxValues) {
    row.tlx_global = tlxValues.global
    row.tlx_mental = tlxValues.mental
  }
  return row
}

