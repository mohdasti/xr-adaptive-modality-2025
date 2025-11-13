/**
 * Telemetry collector for high-frequency pointer tracking and movement analysis
 */

import { telemetryConfig } from './config'
import pako from 'pako'

// Types
export interface SystemSnapshot {
  zoom_pct: number
  fullscreen: boolean
  dpr: number
  viewport_w: number
  viewport_h: number
  pointer_type: string
}

export interface TrialRow {
  // P0 (minimal) - always included
  trial_id: string
  session_id: string
  participant_id: string
  timestamp_start: number
  timestamp_end: number
  rt_ms: number
  correct: boolean
  endpoint_x: number
  endpoint_y: number
  target_center_x: number
  target_center_y: number
  endpoint_error_px: number

  // P0+ (full) - included when level >= 'full'
  path_length_px?: number
  movement_time_ms?: number
  peak_velocity_px_s?: number
  mean_velocity_px_s?: number
  submovement_count?: number
  curvature_index?: number
  sd_along_px?: number
  sd_ortho_px?: number
  power_8_12_hz?: number
  power_12_20_hz?: number

  // P1 (raw) - included when level === 'raw'
  raw_pointer_samples?: string // JSONL gzipped base64
  raw_raf_deltas?: string // JSONL gzipped base64

  // Timing landmarks (timestamps)
  stim_onset_ts?: number // Timestamp of stimulus onset
  move_onset_ts?: number // Timestamp of first movement (velocity > threshold)
  target_entry_ts?: number // Timestamp when cursor enters target bbox
  pinch_onset_ts?: number // Timestamp of pinch/gesture onset
  select_ts?: number // Timestamp of successful selection

  // Derived RTs
  rt_total?: number // Total RT (select_ts - stim_onset_ts)
  rt_move_prep?: number // Movement preparation time (move_onset_ts - stim_onset_ts)
  rt_target_entry?: number // Time to target entry (target_entry_ts - stim_onset_ts)
  rt_click_after_entry?: number // Time from target entry to click (select_ts - target_entry_ts)

  // Pinch-fixation synchrony
  pinch_fixation_delta_ms?: number // Time difference between pinch and fixation (pinch_onset_ts - fixation_ts)
  timing_bin?: 'early' | 'on' | 'late' // Timing classification
  timing_pass?: boolean // true if timing_bin === 'on'

  // Drag task metrics
  drag_distance_bin?: 'near' | 'far' // Distance factor for drag tasks
  unintended_drop?: number // Count of unintended drops (pointer up outside target)
  reengage_attempts?: number // Number of re-engagement attempts after drop
  reengage_time_ms?: number // Time from drop to successful completion
  drag_path_px?: number // Accumulated path length during drag

  // Metadata
  [key: string]: string | number | boolean | undefined
}

interface PointerSample {
  t: number // timestamp
  x: number
  y: number
  pressure?: number
}

interface RAFDelta {
  t: number
  delta: number
}

// State
let sessionId: string = ''
let participantId: string = ''
let condition: Record<string, string | number> = {}
let currentTrialId: string = ''
let currentTrialMeta: Record<string, string | number> = {}

// Trial state
let trialStartTime: number = 0
let stimOnsetTime: number = 0
let selectTime: number = 0
// Timing markers (stored in trial row for analysis)
let moveOnsetTime: number = 0
let targetEntryTime: number = 0
let pinchOnsetTime: number = 0
// Velocity threshold for move onset detection (px/s)
const MOVE_VELOCITY_THRESHOLD = 10 // Small threshold to detect movement start
// Target bounding box (from trial meta)
let targetBBox: { x: number; y: number; width: number; height: number } | null = null
// Fixation state (for hover-as-proxy)
let isFixatedOnTarget: boolean = false
let fixationStartTime: number = 0

// Drag tracking state
let isDragging: boolean = false
let dragPath: Array<{ x: number; y: number; t: number }> = []
let unintendedDropCount: number = 0
let reengageAttempts: number = 0
let reengageStartTime: number = 0
let reengageTimeMs: number = 0
let currentDragDistanceBin: 'near' | 'far' | null = null

// Pointer tracking
let pointerSamples: PointerSample[] = []
let pointerListeners: Array<() => void> = []

// RAF tracking
let rafDeltas: RAFDelta[] = []
let rafFrameId: number | null = null
let rafLastTime: number = 0

// Movement analysis buffers
let speedBuffer: number[] = []
let positionBuffer: Array<{ x: number; y: number; t: number }> = []
const SPEED_BUFFER_MS = 300 // Last 300ms before select

// Kinematics tracking
let pathLenPx: number = 0
let peakSpeedPxS: number = 0
let timeToPeakMs: number = 0
let speedMinimaCount: number = 0
let meanCurvature: number = 0
let maxDeviationPx: number = 0
let speedAtSelectPxS: number = 0
let accelAtSelectPxS2: number = 0

// Rolling buffer for frequency analysis (300ms window)
interface SpeedSample {
  speed: number
  t: number
}
let speedRingBuffer: SpeedSample[] = []
let lastPoint: { x: number; y: number; t: number; vx: number; vy: number; speed: number } | null = null
let lastSpeed: number = 0
let lastAccel: number = 0

// Event health tracking
let coalescedCount: number = 0
let primaryCount: number = 0
let eventDeltas: number[] = [] // For median dt calculation
let eventDropEstimate: number = 0

// Raw streams (when enabled)
let rawPointerStream: string[] = []
let rawRAFStream: string[] = []

/**
 * Initialize telemetry session
 */
export function initTelemetry(
  sessionIdParam: string,
  participantIdParam: string,
  conditionParam: Record<string, string | number>
): void {
  sessionId = sessionIdParam
  participantId = participantIdParam
  condition = conditionParam

  // Start RAF monitoring
  startRAFMonitoring()
}

/**
 * Start trial
 */
export function startTrial(trialId: string, trialMeta: Record<string, string | number>): void {
  currentTrialId = trialId
  currentTrialMeta = trialMeta
  trialStartTime = performance.now()

  // Reset trial state
  stimOnsetTime = 0
  moveOnsetTime = 0
  targetEntryTime = 0
  pinchOnsetTime = 0
  selectTime = 0
  pointerSamples = []
  speedBuffer = []
  positionBuffer = []
  isFixatedOnTarget = false
  fixationStartTime = 0

  // Reset kinematics
  pathLenPx = 0
  peakSpeedPxS = 0
  timeToPeakMs = 0
  speedMinimaCount = 0
  meanCurvature = 0
  maxDeviationPx = 0
  speedAtSelectPxS = 0
  accelAtSelectPxS2 = 0
  speedRingBuffer = []
  lastPoint = null
  lastSpeed = 0
  lastAccel = 0

  // Reset event health
  coalescedCount = 0
  primaryCount = 0
  eventDeltas = []
  eventDropEstimate = 0

  // Reset drag state
  isDragging = false
  dragPath = []
  unintendedDropCount = 0
  reengageAttempts = 0
  reengageStartTime = 0
  reengageTimeMs = 0
  currentDragDistanceBin = (currentTrialMeta.dragDistance as 'near' | 'far') || (currentTrialMeta.drag_distance_bin as 'near' | 'far') || null

  // Clear raw streams for new trial
  if (telemetryConfig.enableRawStreams) {
    rawPointerStream = []
    rawRAFStream = []
  }

  // Extract target bounding box from trial meta
  const targetX = (currentTrialMeta.target_center_x as number) || 0
  const targetY = (currentTrialMeta.target_center_y as number) || 0
  const targetWidth = (currentTrialMeta.target_width_px as number) || 40
  targetBBox = {
    x: targetX - targetWidth / 2,
    y: targetY - targetWidth / 2,
    width: targetWidth,
    height: targetWidth,
  }

  // Raw streams are cleared per-trial in startTrial
}

/**
 * Record system snapshot
 */
export function recordSystemSnapshot(): SystemSnapshot {
  const meta = typeof window !== 'undefined' ? {
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    window_width: window.innerWidth,
    window_height: window.innerHeight,
    device_pixel_ratio: window.devicePixelRatio ?? 1,
    zoom_level: Math.round((window.devicePixelRatio ?? 1) * 100),
    is_fullscreen: document.fullscreenElement !== null,
  } : {
    screen_width: 0,
    screen_height: 0,
    window_width: 0,
    window_height: 0,
    device_pixel_ratio: 1,
    zoom_level: 100,
    is_fullscreen: false,
  }

  return {
    zoom_pct: meta.zoom_level,
    fullscreen: meta.is_fullscreen,
    dpr: meta.device_pixel_ratio,
    viewport_w: meta.window_width,
    viewport_h: meta.window_height,
    pointer_type: 'unknown', // Will be updated by pointer events
  }
}

/**
 * Attach pointer listeners to element
 */
export function attachPointerListeners(el: HTMLElement): void {
  // Remove existing listeners
  detachPointerListeners()

  const handlePointerMove = (e: PointerEvent) => {
    const now = performance.now()

    // Get coalesced events if available (for high-frequency sampling)
    const points = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]
    const isCoalesced = points.length > 1
    if (isCoalesced) {
      coalescedCount += points.length - 1
    }
    primaryCount++

    // Track event timing for drop detection
    if (lastPoint) {
      const dt = now - lastPoint.t
      eventDeltas.push(dt)
      // Keep only recent deltas (last 100 events)
      if (eventDeltas.length > 100) {
        eventDeltas = eventDeltas.slice(-100)
      }
    }

    for (let i = 0; i < points.length; i++) {
      const event = points[i]
      // For coalesced events, estimate timestamps (approximate 60fps spacing)
      const eventTime = i === 0 ? now : now - (points.length - 1 - i) * 16.67

      // Compute dt from last point
      let dt = 0
      let vx = 0
      let vy = 0
      let speed = 0
      let accel = 0

      if (lastPoint) {
        dt = (eventTime - lastPoint.t) / 1000 // seconds
        if (dt > 0) {
          const dx = event.clientX - lastPoint.x
          const dy = event.clientY - lastPoint.y
          vx = dx / dt
          vy = dy / dt
          speed = Math.sqrt(vx * vx + vy * vy) // px/s

          // Acceleration (finite difference)
          if (lastPoint.speed > 0) {
            accel = (speed - lastPoint.speed) / dt // px/s²
          }
        }
      }

      const sample: PointerSample = {
        t: eventTime,
        x: event.clientX,
        y: event.clientY,
        pressure: event.pressure,
      }

      pointerSamples.push(sample)

      // Update position buffer for movement analysis
      positionBuffer.push({ x: event.clientX, y: event.clientY, t: eventTime })

      // Keep only last 300ms
      const cutoff = eventTime - SPEED_BUFFER_MS
      positionBuffer = positionBuffer.filter((p) => p.t >= cutoff)

      // Update kinematics
      if (dt > 0 && speed > 0) {
        // Path length
        if (lastPoint) {
          pathLenPx += Math.sqrt(
            Math.pow(event.clientX - lastPoint.x, 2) +
            Math.pow(event.clientY - lastPoint.y, 2)
          )
        }

        // Peak speed and time to peak
        if (speed > peakSpeedPxS) {
          peakSpeedPxS = speed
          if (stimOnsetTime > 0) {
            timeToPeakMs = eventTime - stimOnsetTime
          }
        }

        // Speed minima detection (for submovement count) with hysteresis
        const HYSTERESIS_THRESHOLD = 5 // px/s threshold to avoid noise
        if (lastPoint && lastSpeed > 0) {
          // Check if we crossed a minimum (speed decreased then increased)
          if (lastSpeed > speed && speed < lastSpeed - HYSTERESIS_THRESHOLD) {
            // Potential minimum - check if speed increases after
            // We'll check this on next sample
          } else if (lastSpeed < speed && lastSpeed < peakSpeedPxS * 0.3) {
            // Speed was low and now increasing - count as minimum
            speedMinimaCount++
          }
        }

        // Curvature and deviation (perpendicular distance to straight-line path)
        if (positionBuffer.length >= 3 && stimOnsetTime > 0) {
          const startIdx = 0
          const start = positionBuffer[startIdx]
          const current = { x: event.clientX, y: event.clientY }
          
          // Straight-line distance from start to current
          const straightDist = Math.sqrt(
            Math.pow(current.x - start.x, 2) + Math.pow(current.y - start.y, 2)
          )

          if (straightDist > 0) {
            // Perpendicular distance from current point to straight line
            // Using cross product method
            const dx = current.x - start.x
            const dy = current.y - start.y
            const perpDist = Math.abs(
              (dx * (start.y - current.y) - dy * (start.x - current.x)) / straightDist
            )
            
            maxDeviationPx = Math.max(maxDeviationPx, perpDist)

            // Curvature approximation: deviation / path length
            if (pathLenPx > 0) {
              meanCurvature = (meanCurvature * (positionBuffer.length - 1) + perpDist / pathLenPx) / positionBuffer.length
            }
          }
        }

        // Update rolling speed buffer (300ms window)
        speedRingBuffer.push({ speed, t: eventTime })
        const speedCutoff = eventTime - SPEED_BUFFER_MS
        speedRingBuffer = speedRingBuffer.filter((s) => s.t >= speedCutoff)

        // Detect move onset (first time velocity exceeds threshold after stim)
        if (moveOnsetTime === 0 && stimOnsetTime > 0 && speed > MOVE_VELOCITY_THRESHOLD) {
          moveOnsetTime = eventTime
        }
      }

      // Update last point
      lastPoint = {
        x: event.clientX,
        y: event.clientY,
        t: eventTime,
        vx,
        vy,
        speed,
      }
      lastSpeed = speed
      lastAccel = accel

      // Check target entry (cursor enters target bbox)
      if (targetEntryTime === 0 && targetBBox) {
        const inTarget =
          event.clientX >= targetBBox.x &&
          event.clientX <= targetBBox.x + targetBBox.width &&
          event.clientY >= targetBBox.y &&
          event.clientY <= targetBBox.y + targetBBox.height

        if (inTarget) {
          targetEntryTime = eventTime
          // For hover-as-proxy: treat target entry as fixation start
          if (!isFixatedOnTarget) {
            isFixatedOnTarget = true
            fixationStartTime = eventTime
          }
        } else {
          // Exited target
          isFixatedOnTarget = false
          fixationStartTime = 0
        }
      }

      // Track drag path during drag
      if (isDragging) {
        dragPath.push({ x: event.clientX, y: event.clientY, t: eventTime })
        // Keep only recent path (last 5 seconds)
        const pathCutoff = eventTime - 5000
        dragPath = dragPath.filter((p) => p.t >= pathCutoff)
      }

      // Raw stream logging
      if (telemetryConfig.enableRawStreams) {
        rawPointerStream.push(JSON.stringify(sample))
      }
    }
  }

  const handlePointerDown = (e: PointerEvent) => {
    const now = performance.now()
    const taskType = (currentTrialMeta.taskType as string) || 'point'

    // For drag tasks, track drag start
    if (taskType === 'drag') {
      if (!isDragging) {
        // Start new drag
        isDragging = true
        dragPath = [{ x: e.clientX, y: e.clientY, t: now }]

        // If we were in re-engagement, this is a new attempt
        if (reengageStartTime > 0) {
          reengageAttempts++
        }
      }
    }
  }

  const handlePointerUp = (e: PointerEvent) => {
    const now = performance.now()
    const taskType = (currentTrialMeta.taskType as string) || 'point'

    // For drag tasks, check if drop was intentional or unintended
    if (taskType === 'drag' && isDragging && targetBBox) {
      const inTarget =
        e.clientX >= targetBBox.x &&
        e.clientX <= targetBBox.x + targetBBox.width &&
        e.clientY >= targetBBox.y &&
        e.clientY <= targetBBox.y + targetBBox.height

      if (!inTarget) {
        // Unintended drop (pointer up outside target)
        unintendedDropCount++
        isDragging = false
        reengageStartTime = now
        dragPath = []
      } else {
        // Successful drag completion
        if (reengageStartTime > 0) {
          reengageTimeMs = now - reengageStartTime
        }
        isDragging = false
        reengageStartTime = 0
      }
    }
  }

  el.addEventListener('pointermove', handlePointerMove, { passive: true })
  el.addEventListener('pointerdown', handlePointerDown, { passive: true })
  el.addEventListener('pointerup', handlePointerUp, { passive: true })

  pointerListeners.push(
    () => el.removeEventListener('pointermove', handlePointerMove),
    () => el.removeEventListener('pointerdown', handlePointerDown),
    () => el.removeEventListener('pointerup', handlePointerUp)
  )
}

/**
 * Detach pointer listeners
 */
function detachPointerListeners(): void {
  pointerListeners.forEach((cleanup) => cleanup())
  pointerListeners = []
}

/**
 * Mark stimulus onset
 */
export function markStimOnset(): void {
  stimOnsetTime = performance.now()
}

/**
 * Mark movement onset
 */
export function markMoveOnset(): void {
  moveOnsetTime = performance.now()
}

/**
 * Mark target entry
 */
export function markTargetEntry(): void {
  targetEntryTime = performance.now()
}

/**
 * Mark pinch onset
 */
export function markPinchOnset(): void {
  if (pinchOnsetTime === 0) {
    pinchOnsetTime = performance.now()
  }
}

/**
 * Mark selection
 */
export function markSelect(): void {
  if (selectTime === 0) {
    selectTime = performance.now()
    // Fill speed and acceleration at select
    speedAtSelectPxS = lastSpeed
    accelAtSelectPxS2 = lastAccel
  }
}

/**
 * Start RAF monitoring for FPS/jitter
 */
function startRAFMonitoring(): void {
  if (rafFrameId !== null) return

  rafLastTime = performance.now()

  const rafLoop = (currentTime: number) => {
    const delta = currentTime - rafLastTime
    rafDeltas.push({ t: currentTime, delta })

    // Keep last 1000 samples (~16s at 60fps)
    if (rafDeltas.length > 1000) {
      rafDeltas = rafDeltas.slice(-1000)
    }

    if (telemetryConfig.enableRawStreams) {
      rawRAFStream.push(JSON.stringify({ t: currentTime, delta }))
    }

    rafLastTime = currentTime
    rafFrameId = requestAnimationFrame(rafLoop)
  }

  rafFrameId = requestAnimationFrame(rafLoop)
}

/**
 * Compute path length from samples
 */
function computePathLength(samples: PointerSample[]): number {
  if (samples.length < 2) return 0

  let length = 0
  for (let i = 1; i < samples.length; i++) {
    const dx = samples[i].x - samples[i - 1].x
    const dy = samples[i].y - samples[i - 1].y
    length += Math.sqrt(dx * dx + dy * dy)
  }
  return length
}

/**
 * Compute curvature index (path length / straight-line distance)
 */
function computeCurvatureIndex(
  samples: PointerSample[],
  startX: number,
  startY: number,
  endX: number,
  endY: number
): number {
  if (samples.length < 2) return 1.0

  const pathLength = computePathLength(samples)
  const straightLine = Math.sqrt(
    Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
  )

  return straightLine > 0 ? pathLength / straightLine : 1.0
}

/**
 * Compute submovement count (local minima in speed with prominence threshold)
 */
function computeSubmovementCount(speeds: number[]): number {
  if (speeds.length < 3) return 0

  const prominenceThreshold = Math.max(...speeds) * 0.1 // 10% of peak speed
  let count = 0

  for (let i = 1; i < speeds.length - 1; i++) {
    const isMin = speeds[i] < speeds[i - 1] && speeds[i] < speeds[i + 1]
    const isProminent = speeds[i] < prominenceThreshold

    if (isMin && isProminent) {
      count++
    }
  }

  return count
}

/**
 * Compute endpoint variability (sd_along_px, sd_ortho_px)
 */
function computeEndpointVariability(
  endpoints: Array<{ x: number; y: number }>,
  targetX: number,
  targetY: number
): { sd_along: number; sd_ortho: number } {
  if (endpoints.length === 0) return { sd_along: 0, sd_ortho: 0 }

  // Compute movement axis (from first endpoint to target)
  const first = endpoints[0]
  const dx = targetX - first.x
  const dy = targetY - first.y
  const axisLength = Math.sqrt(dx * dx + dy * dy)

  if (axisLength === 0) return { sd_along: 0, sd_ortho: 0 }

  // Unit vector along movement axis
  const ux = dx / axisLength
  const uy = dy / axisLength

  // Project endpoints onto axis
  const alongProjections: number[] = []
  const orthoProjections: number[] = []

  for (const ep of endpoints) {
    const vx = ep.x - first.x
    const vy = ep.y - first.y

    // Project onto axis (along)
    const along = vx * ux + vy * uy
    alongProjections.push(along)

    // Project onto perpendicular (ortho)
    const ortho = vx * (-uy) + vy * ux
    orthoProjections.push(ortho)
  }

  // Compute standard deviations
  const meanAlong = alongProjections.reduce((a, b) => a + b, 0) / alongProjections.length
  const meanOrtho = orthoProjections.reduce((a, b) => a + b, 0) / orthoProjections.length

  const varianceAlong =
    alongProjections.reduce((sum, v) => sum + Math.pow(v - meanAlong, 2), 0) /
    alongProjections.length
  const varianceOrtho =
    orthoProjections.reduce((sum, v) => sum + Math.pow(v - meanOrtho, 2), 0) /
    orthoProjections.length

  return {
    sd_along: Math.sqrt(varianceAlong),
    sd_ortho: Math.sqrt(varianceOrtho),
  }
}

/**
 * Goertzel algorithm for frequency power estimation
 */
function goertzelPower(
  samples: number[],
  sampleRate: number,
  targetFreq: number
): number {
  if (samples.length === 0) return 0

  const N = samples.length
  const k = Math.round((N * targetFreq) / sampleRate)
  const w = (2 * Math.PI * k) / N
  const cosW = Math.cos(w)
  const sinW = Math.sin(w)
  const coeff = 2 * cosW

  let q0 = 0
  let q1 = 0
  let q2 = 0

  for (let i = 0; i < N; i++) {
    q0 = coeff * q1 - q2 + samples[i]
    q2 = q1
    q1 = q0
  }

  const real = q1 - q2 * cosW
  const imag = q2 * sinW
  return real * real + imag * imag
}

/**
 * Compute median of array
 */
function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

/**
 * Compute event drop estimate
 */
function computeEventDropEstimate(deltas: number[]): number {
  if (deltas.length < 2) return 0
  const medDt = median(deltas)
  const threshold = 2 * medDt
  return deltas.filter((dt) => dt > threshold).length
}

/**
 * Compute band power from speed ring buffer
 */
function computeBandPowerFromBuffer(buffer: SpeedSample[], lowFreq: number, highFreq: number): number {
  if (buffer.length < 2) return 0

  // Estimate sample rate from timestamps
  const timeSpan = buffer[buffer.length - 1].t - buffer[0].t
  if (timeSpan <= 0) return 0

  const sampleRate = (buffer.length / timeSpan) * 1000 // Hz
  const speeds = buffer.map((s) => s.speed)

  // Compute power at center frequency
  const centerFreq = (lowFreq + highFreq) / 2
  return goertzelPower(speeds, sampleRate, centerFreq)
}

/**
 * Compute pinch-fixation synchrony
 */
function computePinchFixationSynchrony(
  pinchTs: number,
  fixationTs: number
): { delta_ms: number; timing_bin: 'early' | 'on' | 'late'; timing_pass: boolean } {
  const delta_ms = pinchTs - fixationTs

  // Clamp to range [-400, +400] ms
  const clampedDelta = Math.max(-400, Math.min(400, delta_ms))

  let timing_bin: 'early' | 'on' | 'late'
  if (clampedDelta >= -150 && clampedDelta <= 150) {
    timing_bin = 'on'
  } else if (clampedDelta < -150) {
    timing_bin = 'early'
  } else {
    timing_bin = 'late'
  }

  return {
    delta_ms: clampedDelta,
    timing_bin,
    timing_pass: timing_bin === 'on',
  }
}

// Store trial rows for session export
let trialRows: TrialRow[] = []

/**
 * Add trial row to session collection
 */
export function addTrialRow(row: TrialRow): void {
  trialRows.push(row)
}

/**
 * Get all trial rows for session
 */
export function getTrialRows(): TrialRow[] {
  return [...trialRows]
}

/**
 * Get raw streams for export (if enabled)
 */
export function getRawStreams(): {
  pointer: string[] | null
  raf: string[] | null
  state: Array<{ t: number; snapshot: SystemSnapshot }> | null
} {
  if (!telemetryConfig.enableRawStreams) {
    return { pointer: null, raf: null, state: null }
  }

  return {
    pointer: rawPointerStream.length > 0 ? [...rawPointerStream] : null,
    raf: rawRAFStream.length > 0 ? [...rawRAFStream] : null,
    state: null, // State snapshots not yet implemented
  }
}

/**
 * End trial and return TrialRow
 */
export function endTrial(): TrialRow {
  const row = buildTrialRow()
  addTrialRow(row)
  return row
}

/**
 * Build trial row (internal, used by endTrial)
 */
function buildTrialRow(): TrialRow {
  const now = performance.now()
  const rt = selectTime > 0 ? selectTime - stimOnsetTime : now - stimOnsetTime

  // Get endpoint (last sample or target if no samples)
  const endpoint = pointerSamples.length > 0
    ? {
        x: pointerSamples[pointerSamples.length - 1].x,
        y: pointerSamples[pointerSamples.length - 1].y,
      }
    : { x: 0, y: 0 }

  const targetCenter = {
    x: (currentTrialMeta.target_center_x as number) || 0,
    y: (currentTrialMeta.target_center_y as number) || 0,
  }

  const endpointError = Math.sqrt(
    Math.pow(endpoint.x - targetCenter.x, 2) + Math.pow(endpoint.y - targetCenter.y, 2)
  )

  // Compute derived RTs
  const rt_total = selectTime > 0 && stimOnsetTime > 0 ? selectTime - stimOnsetTime : rt
  const rt_move_prep = moveOnsetTime > 0 && stimOnsetTime > 0 ? moveOnsetTime - stimOnsetTime : undefined
  const rt_target_entry = targetEntryTime > 0 && stimOnsetTime > 0 ? targetEntryTime - stimOnsetTime : undefined
  const rt_click_after_entry =
    selectTime > 0 && targetEntryTime > 0 ? selectTime - targetEntryTime : undefined

  // Compute pinch-fixation synchrony (if both are available)
  let pinchFixationSync: { delta_ms: number; timing_bin: 'early' | 'on' | 'late'; timing_pass: boolean } | null = null
  if (pinchOnsetTime > 0 && fixationStartTime > 0) {
    // Use fixation start time as proxy for gaze fixation
    pinchFixationSync = computePinchFixationSynchrony(pinchOnsetTime, fixationStartTime)
  } else if (pinchOnsetTime > 0 && targetEntryTime > 0) {
    // Fallback: use target entry as fixation proxy
    pinchFixationSync = computePinchFixationSynchrony(pinchOnsetTime, targetEntryTime)
  }

  // Compute frequency domain features from speed ring buffer
  const power8_12Hz = computeBandPowerFromBuffer(speedRingBuffer, 8, 12)
  const power12_20Hz = computeBandPowerFromBuffer(speedRingBuffer, 12, 20)

  // Compute event drop estimate
  eventDropEstimate = computeEventDropEstimate(eventDeltas)

  // Compute coalesced ratio
  const pointerCoalescedRatio = primaryCount > 0 ? coalescedCount / (coalescedCount + primaryCount) : 0

  const row: TrialRow = {
    trial_id: currentTrialId,
    session_id: sessionId,
    participant_id: participantId,
    timestamp_start: trialStartTime,
    timestamp_end: now,
    rt_ms: rt,
    correct: endpointError < ((currentTrialMeta.target_width_px as number) || 40) / 2,
    endpoint_x: endpoint.x,
    endpoint_y: endpoint.y,
    target_center_x: targetCenter.x,
    target_center_y: targetCenter.y,
    endpoint_error_px: endpointError,
    // Timing landmarks (timestamps)
    ...(stimOnsetTime > 0 && { stim_onset_ts: stimOnsetTime }),
    ...(moveOnsetTime > 0 && { move_onset_ts: moveOnsetTime }),
    ...(targetEntryTime > 0 && { target_entry_ts: targetEntryTime }),
    ...(pinchOnsetTime > 0 && { pinch_onset_ts: pinchOnsetTime }),
    ...(selectTime > 0 && { select_ts: selectTime }),
    // Derived RTs
    ...(rt_total !== undefined && { rt_total }),
    ...(rt_move_prep !== undefined && { rt_move_prep }),
    ...(rt_target_entry !== undefined && { rt_target_entry }),
    ...(rt_click_after_entry !== undefined && { rt_click_after_entry }),
    // Pinch-fixation synchrony
    ...(pinchFixationSync && {
      pinch_fixation_delta_ms: pinchFixationSync.delta_ms,
      timing_bin: pinchFixationSync.timing_bin,
      timing_pass: pinchFixationSync.timing_pass,
    }),
    // Drag task metrics
    ...(currentDragDistanceBin && { drag_distance_bin: currentDragDistanceBin }),
    ...(unintendedDropCount > 0 && { unintended_drop: unintendedDropCount }),
    ...(reengageAttempts > 0 && { reengage_attempts: reengageAttempts }),
    ...(reengageTimeMs > 0 && { reengage_time_ms: reengageTimeMs }),
    ...(dragPath.length > 1 && {
      drag_path_px: (() => {
        // Compute path length from drag path
        let pathLength = 0
        for (let i = 1; i < dragPath.length; i++) {
          const dx = dragPath[i].x - dragPath[i - 1].x
          const dy = dragPath[i].y - dragPath[i - 1].y
          pathLength += Math.sqrt(dx * dx + dy * dy)
        }
        return pathLength
      })(),
    }),
    // Kinematics
    ...(pathLenPx > 0 && { path_len_px: pathLenPx }),
    ...(peakSpeedPxS > 0 && { peak_speed_px_s: peakSpeedPxS }),
    ...(timeToPeakMs > 0 && { time_to_peak_ms: timeToPeakMs }),
    ...(speedMinimaCount > 0 && { n_submovements: speedMinimaCount }),
    ...(meanCurvature > 0 && { mean_curvature: meanCurvature }),
    ...(maxDeviationPx > 0 && { max_deviation_px: maxDeviationPx }),
    ...(speedAtSelectPxS > 0 && { speed_at_select_px_s: speedAtSelectPxS }),
    ...(accelAtSelectPxS2 !== 0 && { accel_at_select_px_s2: accelAtSelectPxS2 }),
    // Frequency domain
    ...(power8_12Hz > 0 && { power_8_12_hz: power8_12Hz }),
    ...(power12_20Hz > 0 && { power_12_20_hz: power12_20Hz }),
    // Event health
    ...(pointerCoalescedRatio > 0 && { pointer_coalesced_ratio: pointerCoalescedRatio }),
    ...(eventDropEstimate > 0 && { event_drop_estimate: eventDropEstimate }),
    ...currentTrialMeta,
    ...condition,
  }

  // P0+ metrics (when level >= 'full')
  if (telemetryConfig.level === 'full' || telemetryConfig.level === 'raw') {
    if (pointerSamples.length >= 2) {
      const startSample = pointerSamples[0]
      const endSample = pointerSamples[pointerSamples.length - 1]

      row.path_length_px = computePathLength(pointerSamples)
      row.movement_time_ms = endSample.t - startSample.t
      row.curvature_index = computeCurvatureIndex(
        pointerSamples,
        startSample.x,
        startSample.y,
        endSample.x,
        endSample.y
      )

      // Velocity metrics
      if (speedBuffer.length > 0) {
        row.peak_velocity_px_s = Math.max(...speedBuffer)
        row.mean_velocity_px_s =
          speedBuffer.reduce((a, b) => a + b, 0) / speedBuffer.length
      }

      // Submovement count
      if (speedBuffer.length >= 3) {
        row.submovement_count = computeSubmovementCount(speedBuffer)
      }

      // Endpoint variability (use last few samples as endpoints)
      const lastSamples = pointerSamples.slice(-10).map((s) => ({ x: s.x, y: s.y }))
      if (lastSamples.length > 0) {
        const variability = computeEndpointVariability(
          lastSamples,
          targetCenter.x,
          targetCenter.y
        )
        row.sd_along_px = variability.sd_along
        row.sd_ortho_px = variability.sd_ortho
      }

      // Frequency domain features are already computed from speedRingBuffer above
      // (power_8_12_hz and power_12_20_hz are included in the row object)
    }
  }

  // P1 raw streams (when level === 'raw')
  if (telemetryConfig.enableRawStreams) {
    if (rawPointerStream.length > 0) {
      const jsonl = rawPointerStream.join('\n')
      const compressed = pako.gzip(jsonl)
      row.raw_pointer_samples = btoa(String.fromCharCode(...compressed))
    }

    if (rawRAFStream.length > 0) {
      const jsonl = rawRAFStream.join('\n')
      const compressed = pako.gzip(jsonl)
      row.raw_raf_deltas = btoa(String.fromCharCode(...compressed))
    }
  }

  // Cleanup
  detachPointerListeners()
  pointerSamples = []
  speedBuffer = []
  positionBuffer = []

  return row
}

/**
 * End session and return session summary
 * Note: Use exportSessionData() from export.ts to download files
 */
export async function endSession(): Promise<{
  sessionId: string
  participantId: string
  trialCount: number
}> {
  // Stop RAF monitoring
  if (rafFrameId !== null) {
    cancelAnimationFrame(rafFrameId)
    rafFrameId = null
  }

  // Detach pointer listeners
  detachPointerListeners()

  return {
    sessionId,
    participantId,
    trialCount: trialRows.length,
  }
}

/**
 * Get telemetry health metrics
 */
export function getHealth(): {
  fps_est: number
  raf_jitter_ms_p50: number
  raf_jitter_ms_p95: number
  event_drop_estimate: number
  pointer_coalesced_ratio: number
  rawStreamsEnabled: boolean
  sessionId: string
  participantId: string
  trialCount: number
} {
  // Estimate FPS from RAF deltas
  let fps_est = 60
  if (rafDeltas.length >= 2) {
    const recent = rafDeltas.slice(-60) // Last 60 frames
    const avgDelta = recent.reduce((sum, d) => sum + d.delta, 0) / recent.length
    fps_est = avgDelta > 0 ? 1000 / avgDelta : 60
  }

  // Compute jitter percentiles
  let raf_jitter_ms_p50 = 0
  let raf_jitter_ms_p95 = 0

  if (rafDeltas.length >= 2) {
    const deltas = rafDeltas.map((d) => d.delta)
    const sorted = [...deltas].sort((a, b) => a - b)
    const p50Index = Math.floor(sorted.length * 0.5)
    const p95Index = Math.floor(sorted.length * 0.95)
    raf_jitter_ms_p50 = sorted[p50Index] || 0
    raf_jitter_ms_p95 = sorted[p95Index] || 0
  }

  // Event drop estimate (simplified: compare expected vs actual samples)
  const event_drop_estimate = 0 // Would need target sample rate to compute

  // Pointer coalesced ratio (simplified: assume all events are coalesced when available)
  const pointer_coalesced_ratio = 1.0 // Would need to track coalesced vs non-coalesced

  return {
    fps_est,
    raf_jitter_ms_p50,
    raf_jitter_ms_p95,
    event_drop_estimate,
    pointer_coalesced_ratio,
    rawStreamsEnabled: telemetryConfig.enableRawStreams,
    sessionId,
    participantId,
    trialCount: trialRows.length,
  }
}

