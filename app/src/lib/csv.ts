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
  'submovement_count',
  'verification_time_ms',
  // LBA-critical timing fields
  'entered_target',
  'first_entry_time_ms',
  'last_exit_time_ms',
  'time_in_target_total_ms',
  'verification_start_time_ms',
  'verification_end_time_ms',
  'confirm_event_time_ms',
  'confirm_event_source',
  'timeout_limit_ms',
  'timeout_triggered',
  'time_remaining_ms_at_confirm',
  'trial_end_reason',
  // Trajectory data (for control theory analysis - cursor position over time)
  'trajectory',
  // Trajectory quality metrics
  'traj_point_count',
  'traj_duration_ms',
  'traj_median_dt_ms',
  'traj_max_dt_ms',
  'traj_gap_count',
  'traj_has_monotonic_t',
  'traj_start_reason',
  'traj_end_reason',
  'traj_downsample_factor',
  // Width metrics (nominal vs displayed)
  'nominal_width_px',
  'displayed_width_px',
  'width_scale_factor',
  // Alignment gate metrics
  'alignment_gate_enabled',
  'alignment_gate_false_triggers',
  'alignment_gate_recovery_time_ms',
  'alignment_gate_mean_recovery_time_ms',
  // Task configuration
  'task_type',
  'drag_distance',
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
  // Submovement analysis
  'submovement_count_legacy',
  'submovement_count_recomputed',
  'submovement_primary_peak_v',
  'submovement_primary_peak_t_ms',
  'submovement_algorithm',
  'submovement_params_json',
  // Condition integrity fields
  'cond_modality',
  'cond_ui_mode',
  'cond_pressure',
  'condition_id',
  'condition_version',
  'app_build_sha',
  'condition_mismatch_flag',
  // Counterbalancing fields
  'sequence_id',
  'sequence_table_version',
  'session_invalid',
  // QC/Exclusion telemetry
  'zoom_pct_measured',
  'tab_hidden_count',
  'tab_hidden_total_ms',
  'trial_invalid_reason',
  'trial_valid',
  // Eye-tracking quality (always null/0 for simulated gaze - included for schema compatibility)
  'eye_valid_sample_pct',
  'eye_dropout_count',
  'eye_avg_confidence',
  'calibration_age_ms',
  // Export metadata
  'schema_version',
  'exported_at_iso',
  'data_quality_flags_json',
  'traj_usable',
  'exclude_main',
  // TLX columns (merged from block data)
  'tlx_mental',
  'tlx_physical',
  'tlx_temporal',
  'tlx_performance',
  'tlx_effort',
  'tlx_frustration',
  // Debrief response columns
  'debrief_q1_adaptation_noticed',
  'debrief_q2_strategy_changed',
  'debrief_timestamp',
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
    
    // Load sequence info from sessionStorage if available
    let sequenceInfo: Partial<CSVRow> = {}
    if (typeof window !== 'undefined') {
      try {
        const sequenceStr = sessionStorage.getItem('sequence_info')
        if (sequenceStr) {
          const seqData = JSON.parse(sequenceStr)
          sequenceInfo = {
            sequence_id: seqData.sequence_id ?? null,
            sequence_table_version: seqData.sequence_table_version ?? null,
          }
        }
      } catch (e) {
        console.warn('Failed to load sequence info from sessionStorage:', e)
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
      ...sequenceInfo,
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
   * Note: Only validates core fields - all other fields have safe defaults
   * This ensures data collection continues even if new fields are missing (no pilot data required)
   */
  private validateRow(row: CSVRow): boolean {
    const requiredKeys = ['ts', 'trial']
    for (const key of requiredKeys) {
      if (!(key in row)) {
        console.warn(`Missing required key: ${key}`)
        return false
      }
    }
    // All other fields are optional and have safe defaults - validation passes
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
   * Get debrief responses from sessionStorage
   */
  private getDebriefResponses(): {
    debrief_q1_adaptation_noticed: string | null
    debrief_q2_strategy_changed: string | null
    debrief_timestamp: string | null
  } {
    if (typeof window === 'undefined') {
      return {
        debrief_q1_adaptation_noticed: null,
        debrief_q2_strategy_changed: null,
        debrief_timestamp: null,
      }
    }

    try {
      const stored = sessionStorage.getItem('debrief_responses')
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          debrief_q1_adaptation_noticed: parsed.q1_adaptation_noticed || null,
          debrief_q2_strategy_changed: parsed.q2_strategy_changed || null,
          debrief_timestamp: parsed.timestamp || null,
        }
      }
    } catch (e) {
      console.warn('Failed to load debrief responses from sessionStorage:', e)
    }

    return {
      debrief_q1_adaptation_noticed: null,
      debrief_q2_strategy_changed: null,
      debrief_timestamp: null,
    }
  }

  /**
   * Convert to CSV string
   */
  toCSV(): string {
    const lines: string[] = []
    const debriefData = this.getDebriefResponses()
    const schemaVersion = 'v3'
    const exportedAt = new Date().toISOString()

    // Header row
    lines.push(this.headers.join(','))

    // Data rows
    for (const row of this.rows) {
      // Merge debrief data and export metadata into row
      const rowWithMetadata: CSVRow = {
        ...row,
        ...debriefData,
        schema_version: schemaVersion,
        exported_at_iso: exportedAt,
      }
      
      // Add backward compatibility and data quality flags
      const dataQualityFlags: Record<string, boolean | string> = {}
      
      // Check if trajectory is usable
      const trajectory = rowWithMetadata.trajectory
      const trajUsable = trajectory && 
        (typeof trajectory === 'string' ? trajectory !== '[]' && trajectory !== 'null' : Array.isArray(trajectory) && trajectory.length > 0)
      rowWithMetadata.traj_usable = trajUsable ?? false
      
      if (!trajUsable) {
        dataQualityFlags.trajectory_missing = true
      }
      
      // Check for pressure bug participants (example: based on app_build_sha or date)
      const appBuildSha = rowWithMetadata.app_build_sha
      const excludeMain = appBuildSha && typeof appBuildSha === 'string' && 
        (appBuildSha.includes('bug') || appBuildSha.startsWith('dev'))
      rowWithMetadata.exclude_main = excludeMain ?? false
      
      if (excludeMain) {
        dataQualityFlags.pressure_bug_detected = true
      }
      
      rowWithMetadata.data_quality_flags_json = Object.keys(dataQualityFlags).length > 0 
        ? JSON.stringify(dataQualityFlags) 
        : null

      const values = this.headers.map((header) => {
        const value = rowWithMetadata[header]
        if (value === null || value === undefined) return ''
        
        // Special handling for JSON fields: ensure safe stringification
        let strValue: string
        if (header === 'trajectory' || header === 'submovement_params_json' || header === 'data_quality_flags_json') {
          if (value === null || value === undefined || value === '') {
            strValue = ''
          } else if (typeof value === 'string') {
            // Already a string, use as-is
            strValue = value
          } else {
            // Try to stringify, catch errors
            try {
              strValue = JSON.stringify(value)
            } catch (e) {
              console.warn(`Failed to stringify ${header}:`, e)
              strValue = ''
            }
          }
        } else {
          strValue = String(value)
        }
        
        // Escape quotes and wrap in quotes if contains comma/newline
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
   * Uses merged CSV to include TLX data and all other block-level data in a single file
   */
  downloadCSV(filename: string = 'experiment_data.csv'): void {
    // Use merged CSV to ensure all data (including TLX) is in one file
    const csvContent = this.toMergedCSV()
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

  /**
   * Merge TLX block data into trial CSV rows
   * Each trial row gets TLX values from its corresponding block
   */
  toMergedCSV(): string {
    const debriefData = this.getDebriefResponses()
    const schemaVersion = 'v3'
    const exportedAt = new Date().toISOString()
    
    // Create a map of block_number -> TLX values
    const blockTLXMap = new Map<number, {
      tlx_mental: number | null
      tlx_physical: number | null
      tlx_temporal: number | null
      tlx_performance: number | null
      tlx_effort: number | null
      tlx_frustration: number | null
    }>()

    for (const blockRow of this.blockRows) {
      blockTLXMap.set(blockRow.block_number, {
        tlx_mental: blockRow.tlx_mental ?? null,
        tlx_physical: blockRow.tlx_physical ?? null,
        tlx_temporal: blockRow.tlx_temporal ?? null,
        tlx_performance: blockRow.tlx_performance ?? null,
        tlx_effort: blockRow.tlx_effort ?? null,
        tlx_frustration: blockRow.tlx_frustration ?? null,
      })
    }

    // Merge TLX data and debrief data into trial rows
    const mergedRows: CSVRow[] = this.rows.map((row) => {
      const blockNumber = typeof row.block_number === 'number' ? row.block_number : 
                         typeof row.block_number === 'string' ? parseInt(row.block_number, 10) : null
      
      const tlxData = blockNumber !== null && !isNaN(blockNumber) 
        ? blockTLXMap.get(blockNumber) 
        : null

      // Add backward compatibility and data quality flags
      const dataQualityFlags: Record<string, boolean | string> = {}
      
      // Check if trajectory is usable
      const trajectory = row.trajectory
      const trajUsable = trajectory && 
        (typeof trajectory === 'string' ? trajectory !== '[]' && trajectory !== 'null' : Array.isArray(trajectory) && trajectory.length > 0)
      const trajUsableValue = trajUsable ?? false
      
      if (!trajUsableValue) {
        dataQualityFlags.trajectory_missing = true
      }
      
      // Check for pressure bug participants
      const appBuildSha = row.app_build_sha
      const excludeMain = appBuildSha && typeof appBuildSha === 'string' && 
        (appBuildSha.includes('bug') || appBuildSha.startsWith('dev'))
      const excludeMainValue = excludeMain ?? false
      
      if (excludeMainValue) {
        dataQualityFlags.pressure_bug_detected = true
      }

      return {
        ...row,
        tlx_mental: tlxData?.tlx_mental ?? null,
        tlx_physical: tlxData?.tlx_physical ?? null,
        tlx_temporal: tlxData?.tlx_temporal ?? null,
        tlx_performance: tlxData?.tlx_performance ?? null,
        tlx_effort: tlxData?.tlx_effort ?? null,
        tlx_frustration: tlxData?.tlx_frustration ?? null,
        ...debriefData,
        schema_version: schemaVersion,
        exported_at_iso: exportedAt,
        traj_usable: trajUsableValue,
        exclude_main: excludeMainValue,
        data_quality_flags_json: Object.keys(dataQualityFlags).length > 0 
          ? JSON.stringify(dataQualityFlags) 
          : null,
      }
    })

    // Self-check: warn if missing trials (only warn, don't fail)
    // Note: This is informational only - doesn't block export
    const expectedTrials = 8 * 24 // 8 blocks × 24 trials per block (example - adjust based on your design)
    if (mergedRows.length > 0 && mergedRows.length < expectedTrials * 0.9) {
      console.warn(`[CSVLogger] Expected ~${expectedTrials} trials, found ${mergedRows.length}. Data may be incomplete.`)
    }

    // Generate CSV with merged data
    const lines: string[] = []
    lines.push(this.headers.join(','))

    for (const row of mergedRows) {
      const values = this.headers.map((header) => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        
        // Special handling for JSON fields
        let strValue: string
        if (header === 'trajectory' || header === 'submovement_params_json' || header === 'data_quality_flags_json') {
          if (value === null || value === undefined || value === '') {
            strValue = ''
          } else if (typeof value === 'string') {
            strValue = value
          } else {
            try {
              strValue = JSON.stringify(value)
            } catch (e) {
              console.warn(`Failed to stringify ${header}:`, e)
              strValue = ''
            }
          }
        } else {
          strValue = String(value)
        }
        
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
   * Export block-level CSV (one row per block with TLX and metadata)
   */
  toBlockLevelCSV(): string {
    const schemaVersion = 'v3'
    const exportedAt = new Date().toISOString()
    const lines: string[] = []
    
    // Block-level headers
    const blockHeaders = [
      'participant_id',
      'block_number',
      'modality',
      'ui_mode',
      'pressure',
      'condition_id',
      'block_order',
      'tlx_mental',
      'tlx_physical',
      'tlx_temporal',
      'tlx_performance',
      'tlx_effort',
      'tlx_frustration',
      'schema_version',
      'exported_at_iso',
    ]
    
    lines.push(blockHeaders.join(','))
    
    for (const blockRow of this.blockRows) {
      const row: Record<string, string | number | null> = {
        participant_id: this.participantId,
        block_number: blockRow.block_number,
        modality: blockRow.modality,
        ui_mode: blockRow.ui_mode,
        pressure: null, // Not stored in block rows, would need to derive
        condition_id: null, // Would need to derive from modality/ui_mode/pressure
        block_order: null, // Would need to derive from sequence
        tlx_mental: blockRow.tlx_mental,
        tlx_physical: blockRow.tlx_physical,
        tlx_temporal: blockRow.tlx_temporal,
        tlx_performance: blockRow.tlx_performance,
        tlx_effort: blockRow.tlx_effort,
        tlx_frustration: blockRow.tlx_frustration,
        schema_version: schemaVersion,
        exported_at_iso: exportedAt,
      }
      
      const values = blockHeaders.map((header) => {
        const value = row[header]
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
  
  /**
   * Download block-level CSV
   */
  downloadBlockLevelCSV(filename?: string): void {
    if (!filename) {
      const pid = this.participantId || 'unknown'
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      filename = `${pid}_${timestamp}_blocks.csv`
    }
    
    const csvContent = this.toBlockLevelCSV()
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
   * Download merged CSV (trials + TLX data in one file)
   */
  downloadMergedCSV(filename: string = 'experiment_data_merged.csv'): void {
    const csvContent = this.toMergedCSV()
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
    submovement_count: payload.submovement_count ?? null,
    verification_time_ms: payload.verification_time_ms ?? null,
    // LBA-critical timing fields
    entered_target: payload.entered_target ?? false,
    first_entry_time_ms: payload.first_entry_time_ms ?? null,
    last_exit_time_ms: payload.last_exit_time_ms ?? null,
    time_in_target_total_ms: payload.time_in_target_total_ms ?? 0,
    verification_start_time_ms: payload.verification_start_time_ms ?? null,
    verification_end_time_ms: payload.verification_end_time_ms ?? null,
    confirm_event_time_ms: payload.confirm_event_time_ms ?? null,
    confirm_event_source: payload.confirm_event_source ?? 'none',
    timeout_limit_ms: payload.timeout_limit_ms ?? null,
    timeout_triggered: payload.timeout_triggered ?? false,
    time_remaining_ms_at_confirm: payload.time_remaining_ms_at_confirm ?? null,
    trial_end_reason: payload.trial_end_reason ?? 'invalid',
    // Trajectory data (convert array to JSON string for CSV compatibility)
    // Always ensure valid JSON: empty array [] for non-practice trials with no movement, null for practice
    trajectory: payload.trajectory && Array.isArray(payload.trajectory)
      ? (payload.trajectory.length > 0 ? JSON.stringify(payload.trajectory) : (payload.practice ? null : '[]'))
      : null,
    // Trajectory quality metrics
    traj_point_count: payload.traj_point_count ?? null,
    traj_duration_ms: payload.traj_duration_ms ?? null,
    traj_median_dt_ms: payload.traj_median_dt_ms ?? null,
    traj_max_dt_ms: payload.traj_max_dt_ms ?? null,
    traj_gap_count: payload.traj_gap_count ?? null,
    traj_has_monotonic_t: payload.traj_has_monotonic_t ?? null,
    traj_start_reason: payload.traj_start_reason ?? null,
    traj_end_reason: payload.traj_end_reason ?? null,
    traj_downsample_factor: payload.traj_downsample_factor ?? null,
    // Width metrics (nominal vs displayed)
    nominal_width_px: payload.nominal_width_px ?? payload.W ?? null,
    displayed_width_px: payload.displayed_width_px ?? null,
    width_scale_factor: payload.width_scale_factor ?? null,
    // Alignment gate metrics
    alignment_gate_enabled: payload.alignment_gate_enabled ?? false,
    alignment_gate_false_triggers: payload.alignment_gate_false_triggers ?? null,
    alignment_gate_recovery_time_ms: payload.alignment_gate_recovery_time_ms ?? null,
    alignment_gate_mean_recovery_time_ms: payload.alignment_gate_mean_recovery_time_ms ?? null,
    // Task configuration
    task_type: payload.taskType ?? payload.task_type ?? null,
    drag_distance: payload.dragDistance ?? payload.drag_distance ?? null,
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
    // Submovement analysis (all optional - safe defaults)
    submovement_count_legacy: payload.submovement_count_legacy ?? payload.submovement_count ?? null,
    submovement_count_recomputed: payload.submovement_count_recomputed ?? null,
    submovement_primary_peak_v: payload.submovement_primary_peak_v ?? null,
    submovement_primary_peak_t_ms: payload.submovement_primary_peak_t_ms ?? null,
    submovement_algorithm: payload.submovement_algorithm ?? null,
    submovement_params_json: payload.submovement_params_json ?? null,
    // Condition integrity fields (all optional - safe defaults)
    cond_modality: payload.cond_modality ?? payload.modality ?? null,
    cond_ui_mode: payload.cond_ui_mode ?? payload.ui_mode ?? null,
    cond_pressure: payload.cond_pressure ?? payload.pressure ?? null,
    condition_id: payload.condition_id ?? null,
    condition_version: payload.condition_version ?? null,
    app_build_sha: payload.app_build_sha ?? null,
    condition_mismatch_flag: payload.condition_mismatch_flag ?? false,
    // Counterbalancing fields (optional - loaded from sessionStorage if available)
    sequence_id: payload.sequence_id ?? null,
    sequence_table_version: payload.sequence_table_version ?? null,
    session_invalid: payload.session_invalid ?? false,
    // QC/Exclusion telemetry (all optional - safe defaults)
    zoom_pct_measured: payload.zoom_pct_measured ?? payload.zoom_pct ?? null,
    tab_hidden_count: payload.tab_hidden_count ?? 0,
    tab_hidden_total_ms: payload.tab_hidden_total_ms ?? 0,
    trial_invalid_reason: payload.trial_invalid_reason ?? null,
    trial_valid: payload.trial_valid ?? true,
    // Eye-tracking quality (always null/0 for simulated gaze - included for schema compatibility)
    // Note: This study uses simulated gaze, not actual eye tracking
    eye_valid_sample_pct: payload.eye_valid_sample_pct ?? null,
    eye_dropout_count: payload.eye_dropout_count ?? 0,
    eye_avg_confidence: payload.eye_avg_confidence ?? null,
    calibration_age_ms: payload.calibration_age_ms ?? null, // Calibration timestamp age (for simulated gaze calibration)
    // Export metadata (set at export time - always present)
    schema_version: payload.schema_version ?? null,
    exported_at_iso: payload.exported_at_iso ?? null,
    data_quality_flags_json: payload.data_quality_flags_json ?? null,
    traj_usable: payload.traj_usable ?? null,
    exclude_main: payload.exclude_main ?? false,
  }
  
  return row
}

