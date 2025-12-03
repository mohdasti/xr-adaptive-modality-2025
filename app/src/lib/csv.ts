/**
 * CSV logging utilities for experiment data
 */
import { getDisplayMetadata } from '../lib/system'

/**
 * CSV schema columns in order
 */
export const CSV_HEADERS = [
  'pid',
  'session_number',
  'age',
  'gender',
  'gaming_hours_per_week',
  'input_device',
  'vision_correction',
  'wearing_correction_now',
  'dominant_hand',
  'operating_hand',
  'using_dominant_hand',
  'motor_impairment',
  'fatigue_level',
  'ts',
  'trial_number',
  'trial_in_block',
  'block_number',
  'block_order',
  'block_trial_count',
  'block',
  'trial',
  'modality',
  'ui_mode',
  'pressure',
  'aging',
  'ID',
  'index_of_difficulty_nominal',
  'A',
  'target_distance_A',
  'W',
  'target_x',
  'target_y',
  'target_center_x',
  'target_center_y',
  'endpoint_x',
  'endpoint_y',
  'endpoint_error_px',
  'projected_error_px',
  'rt_ms',
  'correct',
  'err_type',
  'hover_ms',
  'confirm_type',
  'pupil_z_med',
  'adaptation_triggered',
  'target_reentry_count',
  'verification_time_ms',
  'pixels_per_mm',
  'pixels_per_degree',
  'screen_width',
  'screen_height',
  'window_width',
  'window_height',
  'device_pixel_ratio',
  'zoom_level',
  'zoom_pct',
  'is_fullscreen',
  'fullscreen',
  'viewport_w',
  'viewport_h',
  'focus_blur_count',
  'tab_hidden_ms',
  'user_agent',
  'browser',
  'dpi',
  'practice',
  'avg_fps',
] as const

export type CSVRow = Record<string, string | number | boolean | null>

const BLOCK_HEADERS = [
  'participant_id',
  'modality',
  'ui_mode',
  'block_number',
  'tlx_mental',
  'tlx_physical',
  'tlx_temporal',
  'tlx_performance',
  'tlx_effort',
  'tlx_frustration',
] as const

export type BlockRow = {
  participant_id: string
  modality: string
  ui_mode: string
  block_number: number
  tlx_mental: number
  tlx_physical: number
  tlx_temporal: number
  tlx_performance: number
  tlx_effort: number
  tlx_frustration: number
}

type BlockRowInput = Omit<BlockRow, 'participant_id'>

/**
 * CSV Logger class
 */
export class CSVLogger {
  private headers: string[]
  private rows: CSVRow[]
  private sessionData: Partial<CSVRow>
  private blockRows: BlockRow[]
  private participantId: string = ''

  constructor(headers: string[] = [...CSV_HEADERS]) {
    this.headers = headers
    this.rows = []
    this.sessionData = {}
    this.blockRows = []
  }

  /**
   * Initialize session-level data
   */
  initSession(data: Partial<CSVRow>): void {
    const meta = typeof window !== 'undefined' ? getDisplayMetadata() : undefined
    const providedPid = typeof data.pid === 'string' ? data.pid : undefined
    const pid = providedPid || `P${Date.now()}`
    
    // Get session number from data or URL if not provided
    let sessionNumber = data.session_number
    if (!sessionNumber && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const sessionParam = params.get('session')
      if (sessionParam) {
        sessionNumber = parseInt(sessionParam, 10)
      }
    }
    
    // Load demographics from sessionStorage
    let demographics: Partial<CSVRow> = {}
    if (typeof window !== 'undefined') {
      try {
        const demographicsStr = sessionStorage.getItem('demographics')
        if (demographicsStr) {
          const demData = JSON.parse(demographicsStr)
          demographics = {
            age: demData.age ?? null,
            gender: demData.gender ?? null,
            gaming_hours_per_week: demData.gamingHoursPerWeek ?? null,
            input_device: demData.inputDevice ?? null,
            vision_correction: demData.visionCorrection ?? null,
            wearing_correction_now: demData.wearingCorrectionNow ?? null,
            dominant_hand: demData.dominantHand ?? null,
            operating_hand: demData.operatingHand ?? null,
            using_dominant_hand: demData.usingDominantHand ?? null,
            motor_impairment: demData.motorImpairment ?? null,
            fatigue_level: demData.fatigueLevel ?? null,
          }
        }
      } catch (e) {
        console.warn('Failed to load demographics from sessionStorage:', e)
      }
    }
    
    this.sessionData = {
      ...(meta ?? {}),
      ...data,
      ...demographics,
      pid,
      session_number: sessionNumber || null,
      browser: this.getBrowser(),
      dpi: this.getDPI(),
    }

    this.participantId = String(pid)
  }

  /**
   * Get current display metadata (captured at trial time)
   */
  getDisplayMetadata(): ReturnType<typeof getDisplayMetadata> {
    return getDisplayMetadata()
  }

  /**
   * Get participant ID
   */
  getParticipantId(): string {
    return this.participantId
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
    this.blockRows = []
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

  getBlockRowCount(): number {
    return this.blockRows.length
  }

  pushBlockRow(row: BlockRowInput): void {
    const participant_id = this.participantId || String(this.sessionData.pid ?? '')
    const fullRow: BlockRow = {
      participant_id,
      ...row,
    }
    this.blockRows.push(fullRow)
  }

  clearBlockRows(): void {
    this.blockRows = []
  }

  toBlockCSV(): string {
    const lines: string[] = []
    lines.push(BLOCK_HEADERS.join(','))

    for (const row of this.blockRows) {
      const values = BLOCK_HEADERS.map((header) => {
        const value = row[header as keyof BlockRow]
        if (value === null || value === undefined) return ''
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

  downloadBlockCSV(filename: string = 'block_data.csv'): void {
    if (this.blockRows.length === 0) {
      console.warn('No block-level TLX data to download.')
      return
    }
    const csvContent = this.toBlockCSV()
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
}

/**
 * Global CSV logger instance
 */
let globalLogger: CSVLogger | null = null

/**
 * Initialize global logger
 */
export function initLogger(pid?: string, sessionNumber?: number | null): CSVLogger {
  globalLogger = new CSVLogger()
  
  // Get session number from URL if not provided
  let session = sessionNumber
  if (session === undefined && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const sessionParam = params.get('session')
    if (sessionParam) {
      session = parseInt(sessionParam, 10)
    }
  }
  
  globalLogger.initSession({
    pid: pid || `P${Date.now()}`,
    session_number: session || null,
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
export function createRowFromTrial(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  blockNumber: number = 1,
  adaptationTriggered: boolean = false
): CSVRow {
  // Capture display metadata at trial time
  const displayMeta = typeof window !== 'undefined' ? getDisplayMetadata() : null

  const row: CSVRow = {
    ts: payload.timestamp || Date.now(),
    trial_number: payload.trial_number || payload.globalTrialNumber || payload.trialSequenceNumber || null,
    trial_in_block: payload.trial_in_block || payload.trial || payload.trialNumber || null,
    block_number: payload.block_number || blockNumber,
    block_order: payload.block_order || payload.blockOrder || '',
    block_trial_count: payload.block_trial_count || payload.blockTrialCount || null,
    block: payload.block_number || blockNumber,
    trial: payload.trial_in_block || payload.trial || payload.trialNumber || 0,
    modality: payload.modality || '',
    ui_mode: payload.ui_mode || '',
    pressure: payload.pressure || 0,
    aging: payload.aging || false,
    ID: payload.ID || null,
    index_of_difficulty_nominal: payload.index_of_difficulty_nominal || payload.ID || null,
    A: payload.A || null,
    target_distance_A: payload.target_distance_A || payload.A || null,
    W: payload.W || null,
    target_x: payload.targetPos?.x || null,
    target_y: payload.targetPos?.y || null,
    target_center_x: payload.target_center_x ?? null,
    target_center_y: payload.target_center_y ?? null,
    endpoint_x: payload.endpoint_x ?? payload.clickPos?.x ?? null,
    endpoint_y: payload.endpoint_y ?? payload.clickPos?.y ?? null,
    endpoint_error_px: payload.endpoint_error_px ?? null,
    projected_error_px: payload.projected_error_px ?? null,
    rt_ms: payload.rt_ms || null,
    correct: payload.correct !== undefined ? payload.correct : null,
    err_type: payload.err_type || payload.error || null,
    hover_ms: payload.hover_ms || null,
    confirm_type: payload.confirm_type || null,
    pupil_z_med: payload.pupil_z_med || null,
    adaptation_triggered: payload.adaptation_triggered ?? adaptationTriggered,
    target_reentry_count: payload.target_reentry_count ?? null,
    verification_time_ms: payload.verification_time_ms ?? null,
    pixels_per_mm: payload.pixels_per_mm ?? null,
    pixels_per_degree: payload.pixels_per_degree ?? null,
    // Display metadata captured at trial time
    screen_width: displayMeta?.screen_width ?? payload.screen_width ?? null,
    screen_height: displayMeta?.screen_height ?? payload.screen_height ?? null,
    window_width: displayMeta?.window_width ?? payload.window_width ?? null,
    window_height: displayMeta?.window_height ?? payload.window_height ?? null,
    device_pixel_ratio: displayMeta?.device_pixel_ratio ?? payload.device_pixel_ratio ?? payload.dpr ?? null,
    zoom_level: displayMeta?.zoom_level ?? payload.zoom_level ?? null,
    zoom_pct: payload.zoom_pct ?? displayMeta?.zoom_level ?? null,
    is_fullscreen: displayMeta?.is_fullscreen ?? payload.is_fullscreen ?? null,
    fullscreen: payload.fullscreen ?? displayMeta?.is_fullscreen ?? null,
    viewport_w: payload.viewport_w ?? displayMeta?.window_width ?? null,
    viewport_h: payload.viewport_h ?? displayMeta?.window_height ?? null,
    focus_blur_count: payload.focus_blur_count ?? null,
    tab_hidden_ms: payload.tab_hidden_ms ?? null,
    user_agent: displayMeta?.user_agent ?? payload.user_agent ?? null,
    practice: payload.practice ?? false,
    avg_fps: payload.avg_fps ?? null,
  }
  
  return row
}

