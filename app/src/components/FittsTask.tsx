import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { bus } from '../lib/bus'
import {
  FittsConfig,
  Position,
  TrialData,
  generateCircularPositions,
  isHit,
} from '../lib/fitts'
import { shuffle } from '../experiment/counterbalance'
import {
  Modality,
  ModalityConfig,
  GazeState,
  createGazeState,
  updateGazeState,
  isGazeSelectionComplete,
} from '../lib/modality'
import { distance as distanceBetweenPoints } from '../utils/geom'
import {
  verifyGates,
  enforceDisplayRequirements,
  clearBlocked,
  isBlockedState,
  getDisplayMetrics,
  resetTrialMetrics,
  cleanup as cleanupSystemCheck,
  getZoomPct,
  isFullscreen,
  getInitialDPR,
} from '../lib/systemCheck'
import { isAlignmentGateEnabled } from '../config'
import { useGazeSimulation } from '../hooks/useGazeSimulation'
import './FittsTask.css'

interface TrialContext {
  globalTrialNumber: number
  trialInBlock: number
  blockNumber: number
  blockOrder: string
  blockTrialCount: number
}

export interface FittsTaskProps {
  config: FittsConfig
  modalityConfig: ModalityConfig
  ui_mode: string
  pressure: number
  trialContext: TrialContext
  widthScale?: number // Width inflation factor (default: 1.0)
  pressureEnabled?: boolean // Show countdown timer
  agingEnabled?: boolean // Apply aging visual effects
  cameraEnabled?: boolean // Enable pupil tracking (unused for now)
  isPractice?: boolean // Whether this is a practice trial (default: false)
  onTrialComplete: () => void
  onTrialError: (errorType: 'miss' | 'timeout' | 'slip') => void
  timeout?: number // milliseconds
}

export function FittsTask({
  config,
  modalityConfig,
  ui_mode,
  pressure,
  trialContext,
  widthScale = 1.0,
  pressureEnabled = false,
  agingEnabled = false,
  cameraEnabled = false, // Unused - kept for future integration
  isPractice = false,
  onTrialComplete,
  onTrialError,
  timeout = 6000,
}: FittsTaskProps) {
  // Suppress unused warning for future use
  void cameraEnabled
  
  // Debug: log modality config and pressure changes
  useEffect(() => {
    console.log('[FittsTask] Component props:', {
      modality: modalityConfig.modality,
      dwellTime: modalityConfig.dwellTime,
      isGaze: modalityConfig.modality === Modality.GAZE,
      pressureEnabled,
      agingEnabled,
      timeout,
    })
  }, [modalityConfig.modality, modalityConfig.dwellTime, pressureEnabled, agingEnabled, timeout])
  
  // Apply width scaling
  const effectiveWidth = config.W * widthScale
  
  // Start position (center of canvas) - will be updated when canvas dimensions are known
  const [startPos, setStartPos] = useState<Position>({ x: 400, y: 300 })
  const [targetPos, setTargetPos] = useState<Position | null>(null)
  const [trialStartTime, setTrialStartTime] = useState<number | null>(null)
  const [showStart, setShowStart] = useState(true)
  const [cursorPos, setCursorPos] = useState<Position>({ x: 0, y: 0 })
  const [gazeState, setGazeState] = useState<GazeState>(
    createGazeState(modalityConfig.dwellTime)
  )
  const [countdown, setCountdown] = useState<number>(timeout / 1000)
  const [isPaused, setIsPaused] = useState(false)
  const [pauseReason, setPauseReason] = useState<string>('')
  
  // Calibration data (declared early for use in callbacks)
  const [calibrationData, setCalibrationData] = useState<{
    pixelsPerMM: number
    pixelsPerDegree: number
  } | null>(null)
  
  // Alignment gate state (P1 experimental feature)
  const alignmentGateEnabled = isAlignmentGateEnabled()
  const [pointerDown, setPointerDown] = useState(false)
  const [_pointerDownTime, setPointerDownTime] = useState<number | null>(null)
  const [hoverStartTime, setHoverStartTime] = useState<number | null>(null)
  const [_isHoveringTarget, setIsHoveringTarget] = useState(false)
  
  // Target re-entry tracking (for gaze interaction analysis)
  // Counts how many times the cursor enters the target before selection
  const targetReEntryCountRef = useRef<number>(0)
  const previousHoverStateRef = useRef<boolean>(false)
  
  // Verification time tracking (time from first target entry to selection)
  // Critical for gaze interaction analysis - isolates the "verification phase"
  const firstTargetEntryTimeRef = useRef<number | null>(null)
  const [_falseTriggerCount, setFalseTriggerCount] = useState(0)
  const [recoveryStartTime, setRecoveryStartTime] = useState<number | null>(null)
  
  // LBA-critical timing fields for verification phase segmentation
  const enteredTargetRef = useRef<boolean>(false)
  const firstEntryTimeRef = useRef<number | null>(null) // Relative to trial start
  const lastExitTimeRef = useRef<number | null>(null) // Relative to trial start
  const timeInTargetTotalRef = useRef<number>(0) // Sum of all durations inside target
  const currentEntryTimeRef = useRef<number | null>(null) // Start of current entry period (if inside target)
  const confirmEventTimeRef = useRef<number | null>(null) // Time of confirm event (relative to trial start)
  const confirmEventSourceRef = useRef<'click' | 'space' | 'dwell' | 'none'>('none')
  const trialEndReasonRef = useRef<'confirmed' | 'timeout' | 'aborted' | 'invalid'>('invalid')
  
  // Condition integrity: single source of truth (frozen at trial start)
  const currentConditionRef = useRef<{
    modality: string
    ui_mode: string
    pressure: number
    condition_id: string
    condition_version: string
    app_build_sha: string
  } | null>(null)
  
  // QC/Exclusion telemetry tracking
  // Note: Eye-tracking fields are included for future compatibility but always null
  // since gaze is simulated, not actual eye tracking
  const qcTelemetryRef = useRef<{
    zoom_pct_measured: number | null
    tab_hidden_count: number
    tab_hidden_total_ms: number
    tab_hidden_start: number | null
    focus_blur_count: number
    trial_invalid_reason: string | null
    trial_valid: boolean
    // Eye-tracking quality (always null for simulated gaze)
    eye_valid_sample_pct: null
    eye_dropout_count: 0
    eye_avg_confidence: null
    calibration_age_ms: number | null // Time since calibration (for simulated gaze, tracks calibration timestamp)
  }>({
    zoom_pct_measured: null,
    tab_hidden_count: 0,
    tab_hidden_total_ms: 0,
    tab_hidden_start: null,
    focus_blur_count: 0,
    trial_invalid_reason: null,
    trial_valid: true,
    eye_valid_sample_pct: null,
    eye_dropout_count: 0,
    eye_avg_confidence: null,
    calibration_age_ms: null,
  })
  const alignmentGateRef = useRef<{
    falseTriggers: number
    recoveryTimes: number[]
    lastFailureTime: number | null
  }>({ falseTriggers: 0, recoveryTimes: [], lastFailureTime: null })
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const hoverAnimationFrameRef = useRef<number | null>(null) // Separate ref for hover detection
  const trialDataRef = useRef<TrialData | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const targetRef = useRef<HTMLDivElement | null>(null)
  
  // Trajectory tracking for control theory analysis
  // Stores cursor position (x, y) and relative time (ms from trial start) during movement
  interface TrajectoryPoint {
    x: number
    y: number
    t: number // Time in ms relative to trial start
  }
  const trajectoryRef = useRef<TrajectoryPoint[]>([])
  const trajectoryAnimationFrameRef = useRef<number | null>(null)
  const lastTrajectoryLogTimeRef = useRef<number>(0)
  const TRAJECTORY_LOG_INTERVAL_MS = 16 // Log every ~16ms (~60fps)
  const TRAJECTORY_MAX_POINTS = 600 // Max points before downsampling
  const TRAJECTORY_GAP_THRESHOLD_MS = 40 // Gap threshold for quality metrics
  const trajectoryStartReasonRef = useRef<'target_shown' | 'movement_detected'>('target_shown')
  const movementDetectedRef = useRef<boolean>(false)
  
  // FPS tracking for data quality
  const fpsTrackingRef = useRef<{
    frameTimes: number[]
    lastFrameTime: number | null
  }>({
    frameTimes: [],
    lastFrameTime: null,
  })

  // Submovement tracking (for Hybrid Analysis)
  const submovementTrackingRef = useRef<{
    previousPos: Position | null
    previousTime: number | null
    velocities: number[] // Recent velocity history for peak detection
    peakVelocity: number // Maximum velocity seen so far in this trial
    submovementCount: number // Count of detected submovements
    lastVelocity: number // Last calculated velocity
    isRising: boolean // Whether velocity is currently rising
  }>({
    previousPos: null,
    previousTime: null,
    velocities: [],
    peakVelocity: 0,
    submovementCount: 0,
    lastVelocity: 0,
    isRising: false,
  })

  const getSpatialMetrics = useCallback(
    (localPoint?: Position | null) => {
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    const targetRect = targetRef.current?.getBoundingClientRect()

    const endpoint =
      localPoint && canvasRect
        ? {
            x: canvasRect.left + localPoint.x,
            y: canvasRect.top + localPoint.y,
          }
        : null

    const targetCenter = targetRect
      ? {
          x: targetRect.left + targetRect.width / 2,
          y: targetRect.top + targetRect.height / 2,
        }
      : canvasRect && targetPos
        ? {
            x: canvasRect.left + targetPos.x,
            y: canvasRect.top + targetPos.y,
          }
        : null

    // Calculate radial (Euclidean) error for backward compatibility
    const endpointError =
      endpoint && targetCenter ? distanceBetweenPoints(endpoint, targetCenter) : null

    // Calculate projected error along task axis (ISO 9241-9 compliant)
    // Task axis: vector from start center to target center
    // Projected error: component of selection error along the task axis
    let projectedError: number | null = null
    
    if (endpoint && targetCenter && canvasRect) {
      // Get start center in screen coordinates
      const startCenter = {
        x: canvasRect.left + startPos.x,
        y: canvasRect.top + startPos.y,
      }
      
      // Task axis vector (from start to target)
      const taskAxisX = targetCenter.x - startCenter.x
      const taskAxisY = targetCenter.y - startCenter.y
      const taskAxisLength = Math.sqrt(taskAxisX * taskAxisX + taskAxisY * taskAxisY)
      
      if (taskAxisLength > 0) {
        // Normalize task axis vector
        const normalizedTaskAxisX = taskAxisX / taskAxisLength
        const normalizedTaskAxisY = taskAxisY / taskAxisLength
        
        // Selection vector (from target center to endpoint)
        const selectionX = endpoint.x - targetCenter.x
        const selectionY = endpoint.y - targetCenter.y
        
        // Project selection vector onto task axis (dot product)
        projectedError = selectionX * normalizedTaskAxisX + selectionY * normalizedTaskAxisY
      }
    }

    return {
      endpoint,
      targetCenter,
      endpointError,
      projectedError,
    }
    },
    [targetPos, startPos]
  )

  // Calculate average FPS from frame times (moved before handleTimeout to fix declaration order)
  const calculateAverageFPS = useCallback((): number | null => {
    const frameTimes = fpsTrackingRef.current.frameTimes
    if (frameTimes.length < 2) return null
    
    // Calculate average frame time in milliseconds
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    // Convert to FPS (1000ms / frameTime)
    const avgFPS = 1000 / avgFrameTime
    return avgFPS
  }, [])

  // Get QC telemetry data
  // Note: Eye-tracking fields are always null/0 for simulated gaze
  const getQCTelemetryData = useCallback((): {
    zoom_pct_measured: number | null
    tab_hidden_count: number
    tab_hidden_total_ms: number
    trial_invalid_reason: string | null
    trial_valid: boolean
    eye_valid_sample_pct: null // Always null for simulated gaze
    eye_dropout_count: 0 // Always 0 for simulated gaze
    eye_avg_confidence: null // Always null for simulated gaze
    calibration_age_ms: number | null // Calibration timestamp age (for simulated gaze)
  } => {
    return {
      zoom_pct_measured: qcTelemetryRef.current.zoom_pct_measured,
      tab_hidden_count: qcTelemetryRef.current.tab_hidden_count,
      tab_hidden_total_ms: qcTelemetryRef.current.tab_hidden_total_ms,
      trial_invalid_reason: qcTelemetryRef.current.trial_invalid_reason,
      trial_valid: qcTelemetryRef.current.trial_valid,
      eye_valid_sample_pct: null, // Simulated gaze - no actual eye tracking
      eye_dropout_count: 0, // Simulated gaze - no dropouts
      eye_avg_confidence: null, // Simulated gaze - no confidence scores
      calibration_age_ms: qcTelemetryRef.current.calibration_age_ms,
    }
  }, [])

  // Get condition integrity data and check for mismatches
  const getConditionData = useCallback((): {
    cond_modality: string
    cond_ui_mode: string
    cond_pressure: number
    condition_id: string
    condition_version: string
    app_build_sha: string
    condition_mismatch_flag: boolean
  } => {
    const condition = currentConditionRef.current
    if (!condition) {
      // Fallback if condition not initialized
      return {
        cond_modality: modalityConfig.modality,
        cond_ui_mode: ui_mode,
        cond_pressure: pressure,
        condition_id: `${modalityConfig.modality}_${ui_mode}_p${pressure.toFixed(1)}`,
        condition_version: typeof __CONDITION_VERSION__ !== 'undefined' ? __CONDITION_VERSION__ : '1.0',
        app_build_sha: typeof __APP_BUILD_SHA__ !== 'undefined' ? __APP_BUILD_SHA__ : 'dev',
        condition_mismatch_flag: true, // Flag as mismatch if condition not initialized
      }
    }
    
    // Check for mismatches
    const mismatch = 
      condition.modality !== modalityConfig.modality ||
      condition.ui_mode !== ui_mode ||
      Math.abs(condition.pressure - pressure) > 0.01 // Allow small floating point differences
    
    return {
      cond_modality: condition.modality,
      cond_ui_mode: condition.ui_mode,
      cond_pressure: condition.pressure,
      condition_id: condition.condition_id,
      condition_version: condition.condition_version,
      app_build_sha: condition.app_build_sha,
      condition_mismatch_flag: mismatch,
    }
  }, [modalityConfig.modality, ui_mode, pressure])

  // Calculate velocity between two positions over a time delta
  const calculateVelocity = useCallback(
    (pos1: Position, pos2: Position, deltaTime: number): number => {
      if (deltaTime <= 0) return 0
      const dx = pos2.x - pos1.x
      const dy = pos2.y - pos1.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return (distance / deltaTime) * 1000 // Convert to px/s
    },
    []
  )

  // Compute submovements from trajectory using speed profile peak detection
  const computeSubmovementsFromTrajectory = useCallback((
    trajectory: TrajectoryPoint[],
    minPeakDistanceMs: number = 50,
    minPeakProminence: number = 20, // px/s
    smoothingWindow: number = 5
  ): {
    submovement_count_recomputed: number
    submovement_primary_peak_v: number | null
    submovement_primary_peak_t_ms: number | null
    submovement_algorithm: string
    submovement_params_json: string
  } => {
    if (trajectory.length < 3) {
      // Need at least 3 points to compute velocity
      return {
        submovement_count_recomputed: 0,
        submovement_primary_peak_v: null,
        submovement_primary_peak_t_ms: null,
        submovement_algorithm: 'peak_detection_v1.0',
        submovement_params_json: JSON.stringify({
          min_peak_distance_ms: minPeakDistanceMs,
          min_peak_prominence: minPeakProminence,
          smoothing_window: smoothingWindow,
        }),
      }
    }
    
    // Compute raw speed profile
    const speeds: Array<{ v: number; t: number }> = []
    for (let i = 1; i < trajectory.length; i++) {
      const dt = trajectory[i].t - trajectory[i - 1].t
      if (dt > 0) {
        const dx = trajectory[i].x - trajectory[i - 1].x
        const dy = trajectory[i].y - trajectory[i - 1].y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const speed = (distance / dt) * 1000 // px/s
        speeds.push({
          v: speed,
          t: trajectory[i].t, // Use time of second point
        })
      }
    }
    
    if (speeds.length === 0) {
      return {
        submovement_count_recomputed: 0,
        submovement_primary_peak_v: null,
        submovement_primary_peak_t_ms: null,
        submovement_algorithm: 'peak_detection_v1.0',
        submovement_params_json: JSON.stringify({
          min_peak_distance_ms: minPeakDistanceMs,
          min_peak_prominence: minPeakProminence,
          smoothing_window: smoothingWindow,
        }),
      }
    }
    
    // Apply moving average smoothing
    const smoothedSpeeds: Array<{ v: number; t: number }> = []
    const halfWindow = Math.floor(smoothingWindow / 2)
    
    for (let i = 0; i < speeds.length; i++) {
      let sum = 0
      let count = 0
      
      for (let j = Math.max(0, i - halfWindow); j <= Math.min(speeds.length - 1, i + halfWindow); j++) {
        sum += speeds[j].v
        count++
      }
      
      smoothedSpeeds.push({
        v: sum / count,
        t: speeds[i].t,
      })
    }
    
    // Detect peaks in smoothed speed profile
    const peaks: Array<{ v: number; t: number; index: number }> = []
    
    for (let i = 1; i < smoothedSpeeds.length - 1; i++) {
      const prev = smoothedSpeeds[i - 1].v
      const curr = smoothedSpeeds[i].v
      const next = smoothedSpeeds[i + 1].v
      
      // Check if current point is a local maximum
      if (curr > prev && curr > next && curr >= minPeakProminence) {
        // Check minimum distance from previous peak
        if (peaks.length === 0 || (smoothedSpeeds[i].t - peaks[peaks.length - 1].t) >= minPeakDistanceMs) {
          peaks.push({
            v: curr,
            t: smoothedSpeeds[i].t,
            index: i,
          })
        }
      }
    }
    
    // Find primary peak (highest velocity)
    let primaryPeak: { v: number; t: number } | null = null
    if (peaks.length > 0) {
      primaryPeak = peaks.reduce((max, peak) => peak.v > max.v ? peak : max)
    }
    
    return {
      submovement_count_recomputed: peaks.length,
      submovement_primary_peak_v: primaryPeak?.v ?? null,
      submovement_primary_peak_t_ms: primaryPeak?.t ?? null,
      submovement_algorithm: 'peak_detection_v1.0',
      submovement_params_json: JSON.stringify({
        min_peak_distance_ms: minPeakDistanceMs,
        min_peak_prominence: minPeakProminence,
        smoothing_window: smoothingWindow,
      }),
    }
  }, [])

  // Process trajectory data: calculate quality metrics and downsample if needed
  const processTrajectory = useCallback((
    trajectory: TrajectoryPoint[],
    trajEndReason: 'confirmed' | 'timeout' | 'aborted'
  ): {
    trajectory: TrajectoryPoint[]
    traj_point_count: number
    traj_duration_ms: number | null
    traj_median_dt_ms: number | null
    traj_max_dt_ms: number | null
    traj_gap_count: number
    traj_has_monotonic_t: boolean
    traj_start_reason: 'target_shown' | 'movement_detected'
    traj_end_reason: 'confirmed' | 'timeout' | 'aborted'
    traj_downsample_factor: number
    submovement_count_recomputed: number
    submovement_primary_peak_v: number | null
    submovement_primary_peak_t_ms: number | null
    submovement_algorithm: string
    submovement_params_json: string
  } => {
    // Ensure at least 2 points for very short movements (start + end)
    let processedTrajectory = [...trajectory]
    
    // Downsample if needed
    let downsampleFactor = 1
    if (processedTrajectory.length > TRAJECTORY_MAX_POINTS) {
      downsampleFactor = Math.ceil(processedTrajectory.length / TRAJECTORY_MAX_POINTS)
      // Deterministic downsampling: keep every k-th point, always keep first and last
      const downsampled: TrajectoryPoint[] = [processedTrajectory[0]]
      for (let i = downsampleFactor; i < processedTrajectory.length - 1; i += downsampleFactor) {
        downsampled.push(processedTrajectory[i])
      }
      if (processedTrajectory.length > 1) {
        downsampled.push(processedTrajectory[processedTrajectory.length - 1])
      }
      processedTrajectory = downsampled
    }
    
    // Calculate quality metrics
    const pointCount = processedTrajectory.length
    let duration_ms: number | null = null
    let median_dt_ms: number | null = null
    let max_dt_ms: number | null = null
    let gap_count = 0
    let has_monotonic_t = true
    
    if (pointCount >= 2) {
      // Duration
      duration_ms = processedTrajectory[pointCount - 1].t - processedTrajectory[0].t
      
      // Calculate dt values (time differences between consecutive points)
      const dts: number[] = []
      for (let i = 1; i < pointCount; i++) {
        const dt = processedTrajectory[i].t - processedTrajectory[i - 1].t
        dts.push(dt)
        
        // Check for gaps
        if (dt > TRAJECTORY_GAP_THRESHOLD_MS) {
          gap_count++
        }
        
        // Check monotonicity
        if (dt < 0) {
          has_monotonic_t = false
        }
      }
      
      // Median dt
      if (dts.length > 0) {
        const sortedDts = [...dts].sort((a, b) => a - b)
        const mid = Math.floor(sortedDts.length / 2)
        median_dt_ms = sortedDts.length % 2 === 0
          ? (sortedDts[mid - 1] + sortedDts[mid]) / 2
          : sortedDts[mid]
      }
      
      // Max dt
      max_dt_ms = dts.length > 0 ? Math.max(...dts) : null
    }
    
    // Compute submovements from trajectory
    const submovementData = computeSubmovementsFromTrajectory(processedTrajectory)
    
    return {
      trajectory: processedTrajectory,
      traj_point_count: pointCount,
      traj_duration_ms: duration_ms,
      traj_median_dt_ms: median_dt_ms,
      traj_max_dt_ms: max_dt_ms,
      traj_gap_count: gap_count,
      traj_has_monotonic_t: has_monotonic_t,
      traj_start_reason: trajectoryStartReasonRef.current,
      traj_end_reason: trajEndReason,
      traj_downsample_factor: downsampleFactor,
      ...submovementData,
    }
  }, [computeSubmovementsFromTrajectory])

  // Track target entry/exit events and accumulate time in target
  // This is critical for LBA analysis - segments verification phase
  const trackTargetEntryExit = useCallback((isHovering: boolean, currentTime: number) => {
    if (!trialStartTime) return // Trial not started yet
    
    const relativeTime = currentTime - trialStartTime
    
    if (isHovering && currentEntryTimeRef.current === null) {
      // Entering target
      enteredTargetRef.current = true
      if (firstEntryTimeRef.current === null) {
        firstEntryTimeRef.current = relativeTime
        firstTargetEntryTimeRef.current = currentTime // Absolute time for verification_time_ms
      }
      currentEntryTimeRef.current = relativeTime
    } else if (!isHovering && currentEntryTimeRef.current !== null) {
      // Exiting target - accumulate time spent inside
      const entryDuration = relativeTime - currentEntryTimeRef.current
      timeInTargetTotalRef.current += entryDuration
      lastExitTimeRef.current = relativeTime
      currentEntryTimeRef.current = null
    }
    // If still hovering, time accumulation happens on next exit or trial end
  }, [trialStartTime])

  // Detect velocity peaks (submovements)
  // A submovement is defined as a velocity peak that exceeds 10% of peak velocity
  // followed by a decrease
  const detectSubmovement = useCallback((currentVelocity: number): boolean => {
    const tracking = submovementTrackingRef.current
    
    // Update peak velocity if current is higher
    if (currentVelocity > tracking.peakVelocity) {
      tracking.peakVelocity = currentVelocity
    }
    
    // Need at least some movement to detect peaks
    if (tracking.peakVelocity === 0) return false
    
    // Threshold: 10% of peak velocity
    const threshold = tracking.peakVelocity * 0.1
    
    // Track velocity trend
    const wasRising = tracking.isRising
    const isRisingNow = currentVelocity > tracking.lastVelocity
    
    // Detect peak: velocity was rising, now decreasing, and above threshold
    if (wasRising && !isRisingNow && currentVelocity > threshold) {
      tracking.isRising = false
      tracking.submovementCount++
      return true
    }
    
    // Update state
    tracking.isRising = isRisingNow
    tracking.lastVelocity = currentVelocity
    
    return false
  }, [])

  const handleTimeout = useCallback(() => {
    if (!trialDataRef.current) return
    if (isPaused || isBlockedState()) return // Don't process if paused

    const trialData = trialDataRef.current
    const metrics = getSpatialMetrics(null)
    const displayMetrics = getDisplayMetrics()
    const avgFPS = calculateAverageFPS()
    const timestamp = performance.now()
    
    // Finalize time tracking: if still in target, accumulate remaining time
    if (currentEntryTimeRef.current !== null && trialStartTime) {
      const relativeTime = timestamp - trialStartTime
      const entryDuration = relativeTime - currentEntryTimeRef.current
      timeInTargetTotalRef.current += entryDuration
      currentEntryTimeRef.current = null
    }
    
    // Set trial end reason and confirm event source
    trialEndReasonRef.current = 'timeout'
    confirmEventSourceRef.current = 'none'
    confirmEventTimeRef.current = null
    
    // Calculate verification timing (verification_end_time_ms is null for timeout)
    const verification_start_time_ms = firstEntryTimeRef.current
    const verification_end_time_ms = null // Timeout - no confirm event
    const verification_time_ms = null // Cannot calculate without end time
    
    const rt_ms = timestamp - trialData.timestamp
    const timeout_triggered = true
    const time_remaining_ms_at_confirm = null // No confirm event for timeout
    
    // For non-practice trials, ensure trajectory has end point at timeout
    if (!isPractice && trialStartTime && trajectoryRef.current.length > 0) {
      const lastPoint = trajectoryRef.current[trajectoryRef.current.length - 1]
      const currentPos = cursorPosRef.current
      // Only add end point if it's different from last point or enough time has passed
      if (lastPoint.t < rt_ms - 10 || 
          Math.abs(lastPoint.x - currentPos.x) > 1 || 
          Math.abs(lastPoint.y - currentPos.y) > 1) {
        trajectoryRef.current.push({
          x: currentPos.x,
          y: currentPos.y,
          t: rt_ms,
        })
      }
    }
    
    // Process trajectory with quality metrics
    const trajData = processTrajectory(
      trajectoryRef.current,
      'timeout'
    )

    bus.emit('trial:error', {
      trialId: trialData.trialId,
      trial: trialData.trialNumber,
      trial_in_block: trialData.trialInBlock,
      trial_number: trialData.globalTrialNumber,
      block_number: trialData.blockNumber,
      block_order: trialData.blockOrder,
      block_trial_count: trialData.blockTrialCount,
      error: 'timeout',
      err_type: 'timeout',
      rt_ms: timestamp - trialData.timestamp,
      A: trialData.A,
      W: trialData.W,
      ID: trialData.ID,
      index_of_difficulty_nominal: trialData.ID,
      target_distance_A: trialData.A,
          // Width logging: both nominal (design) and displayed (actual rendered size)
          nominal_width_px: trialData.W,
          displayed_width_px: effectiveWidth,
          width_scale_factor: widthScale,
      modality: trialData.modality,
      ui_mode: trialData.ui_mode,
      pressure: trialData.pressure,
      aging: trialData.aging,
      taskType: config.taskType || 'point',
      dragDistance: config.dragDistance,
      targetPos: trialData.targetPos,
      target_center_x: metrics.targetCenter?.x ?? null,
      target_center_y: metrics.targetCenter?.y ?? null,
      endpoint_x: metrics.endpoint?.x ?? null,
      endpoint_y: metrics.endpoint?.y ?? null,
      endpoint_error_px: metrics.endpointError ?? null,
      projected_error_px: metrics.projectedError ?? null,
      timestamp,
      // Display metrics
      zoom_pct: displayMetrics.zoom_pct,
      fullscreen: displayMetrics.fullscreen,
      dpr: displayMetrics.dpr,
      viewport_w: displayMetrics.viewport_w,
      viewport_h: displayMetrics.viewport_h,
      focus_blur_count: displayMetrics.focus_blur_count,
      tab_hidden_ms: displayMetrics.tab_hidden_ms,
      // Practice and FPS tracking
      practice: isPractice,
      avg_fps: avgFPS,
      // Calibration data (for post-hoc visual angle calculations)
      pixels_per_mm: calibrationData?.pixelsPerMM ?? null,
      pixels_per_degree: calibrationData?.pixelsPerDegree ?? null,
      // Trajectory data (for control theory analysis - cursor position over time)
      trajectory: trajData.trajectory.length > 0 ? trajData.trajectory : (isPractice ? null : []),
      // Trajectory quality metrics
      traj_point_count: trajData.traj_point_count,
      traj_duration_ms: trajData.traj_duration_ms,
      traj_median_dt_ms: trajData.traj_median_dt_ms,
      traj_max_dt_ms: trajData.traj_max_dt_ms,
      traj_gap_count: trajData.traj_gap_count,
      traj_has_monotonic_t: trajData.traj_has_monotonic_t,
      traj_start_reason: trajData.traj_start_reason,
      traj_end_reason: trajData.traj_end_reason,
      traj_downsample_factor: trajData.traj_downsample_factor,
      // Target re-entry tracking (proxy for frustration in gaze interactions)
      target_reentry_count: targetReEntryCountRef.current,
      // Verification time (time from first target entry to timeout)
      verification_time_ms: verification_time_ms,
      // LBA-critical timing fields
      entered_target: enteredTargetRef.current,
      first_entry_time_ms: firstEntryTimeRef.current,
      last_exit_time_ms: lastExitTimeRef.current,
      time_in_target_total_ms: timeInTargetTotalRef.current,
      verification_start_time_ms: verification_start_time_ms,
      verification_end_time_ms: verification_end_time_ms,
      confirm_event_time_ms: confirmEventTimeRef.current,
      confirm_event_source: confirmEventSourceRef.current,
      timeout_limit_ms: timeout,
      timeout_triggered: timeout_triggered,
      time_remaining_ms_at_confirm: time_remaining_ms_at_confirm,
      trial_end_reason: trialEndReasonRef.current,
      // Submovement count (legacy - for comparison)
      submovement_count_legacy: submovementTrackingRef.current.submovementCount,
      // Submovement count (recomputed from trajectory)
      submovement_count_recomputed: trajData.submovement_count_recomputed,
      submovement_primary_peak_v: trajData.submovement_primary_peak_v,
      submovement_primary_peak_t_ms: trajData.submovement_primary_peak_t_ms,
      submovement_algorithm: trajData.submovement_algorithm,
      submovement_params_json: trajData.submovement_params_json,
      // Condition integrity fields
      ...getConditionData(),
    })

    // Reset trajectory after timeout
    trajectoryRef.current = []
    lastTrajectoryLogTimeRef.current = 0
    onTrialError('timeout')
  }, [getSpatialMetrics, onTrialError, isPaused, calculateAverageFPS, isPractice, calibrationData, processTrajectory, timeout, getConditionData, getQCTelemetryData])

  // Canvas dimensions - read from actual DOM element for accuracy
  // CSS handles responsive sizing (70vw/70vh, min 800x600, max 1200x900)
  // We read the actual rendered size to ensure coordinate calculations match
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 })
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const width = Math.floor(rect.width)
        const height = Math.floor(rect.height)
        setCanvasDimensions({ width, height })
        // Update start position to center of canvas
        setStartPos({ x: width / 2, y: height / 2 })
      }
    }
    
    // Initial measurement (with small delay to ensure CSS has applied)
    const timeoutId = setTimeout(updateDimensions, 100)
    
    // Update on resize
    window.addEventListener('resize', updateDimensions)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateDimensions)
    }
  }, [])
  
  const CANVAS_WIDTH = canvasDimensions.width
  const CANVAS_HEIGHT = canvasDimensions.height
  const targetMargin = useMemo(() => Math.max(config.W * 2, 100), [config.W]) // Ensure target + some padding fits
  
  // Generate possible target positions (constrained to canvas bounds)
  // Regenerate when canvas dimensions, start position, or config changes
  const targetPositions = useRef<Position[]>([])
  
  useEffect(() => {
    if (CANVAS_WIDTH > 0 && CANVAS_HEIGHT > 0 && startPos.x > 0 && startPos.y > 0) {
      const positions = generateCircularPositions(
        startPos,
        config.A,
        8,
        { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
        targetMargin
      )
      targetPositions.current = shuffle(positions)
    }
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, startPos, config.A, targetMargin, trialContext.blockNumber])

  const startTrial = useCallback(() => {
    // Verify gates before starting
    if (!verifyGates()) {
      const reason = 'Display requirements not met. Please ensure fullscreen mode and 100% zoom.'
      setPauseReason(reason)
      setIsPaused(true)
      enforceDisplayRequirements((pauseMsg) => {
        setPauseReason(pauseMsg)
        setIsPaused(true)
      })
      return
    }

    // Reset trial metrics
    resetTrialMetrics()

    // Reset alignment gate state
    if (alignmentGateEnabled) {
      setPointerDown(false)
      setPointerDownTime(null)
      setHoverStartTime(null)
      setIsHoveringTarget(false)
      setFalseTriggerCount(0)
      setRecoveryStartTime(null)
      alignmentGateRef.current = { falseTriggers: 0, recoveryTimes: [], lastFailureTime: null }
    }
    
    // Reset target re-entry tracking
    targetReEntryCountRef.current = 0
    previousHoverStateRef.current = false
    firstTargetEntryTimeRef.current = null
    
    // Reset LBA-critical timing fields
    enteredTargetRef.current = false
    firstEntryTimeRef.current = null
    lastExitTimeRef.current = null
    timeInTargetTotalRef.current = 0
    currentEntryTimeRef.current = null
    confirmEventTimeRef.current = null
    confirmEventSourceRef.current = 'none'
    trialEndReasonRef.current = 'invalid'
    
    // Reset QC telemetry
    const zoomPct = getZoomPct()
    qcTelemetryRef.current = {
      zoom_pct_measured: zoomPct,
      tab_hidden_count: 0,
      tab_hidden_total_ms: 0,
      tab_hidden_start: null,
      focus_blur_count: 0,
      trial_invalid_reason: null,
      trial_valid: true,
      eye_valid_sample_pct: null,
      eye_dropout_count: 0,
      eye_avg_confidence: null,
      calibration_age_ms: null,
    }
    
    // Calculate calibration age for gaze mode (simulated gaze - tracks calibration timestamp if available)
    // Note: This is for simulated gaze calibration, not actual eye tracking
    if (modalityConfig.modality === Modality.GAZE) {
      try {
        const calibrationStr = sessionStorage.getItem('calibration')
        if (calibrationStr) {
          const cal = JSON.parse(calibrationStr)
          if (cal.timestamp) {
            qcTelemetryRef.current.calibration_age_ms = performance.now() - cal.timestamp
          }
        }
      } catch (e) {
        // Silently ignore - calibration timestamp is optional for simulated gaze
      }
    }

    // Set up display requirement monitoring during trial
    enforceDisplayRequirements((pauseMsg) => {
      setPauseReason(pauseMsg)
      setIsPaused(true)
      // Clear timeout if trial is paused
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    })

    // Hide start button first
    setShowStart(false)
    setTargetPos(null) // Ensure target is hidden initially
    
    // Select target position based on trial number (cycles through positions)
    // This ensures variety and prevents same position from repeating
    const positionIndex = (trialContext.trialInBlock - 1) % targetPositions.current.length
    const target = targetPositions.current[positionIndex]
    
    // Validate target is within canvas bounds
    if (
      target.x < targetMargin ||
      target.x > CANVAS_WIDTH - targetMargin ||
      target.y < targetMargin ||
      target.y > CANVAS_HEIGHT - targetMargin
    ) {
      console.warn(
        `Target position (${target.x}, ${target.y}) is outside canvas bounds. ` +
        `Canvas: ${CANVAS_WIDTH}×${CANVAS_HEIGHT}, Margin: ${targetMargin}`
      )
    }
    
    // Add a brief delay before showing target (200ms) to allow participant to prepare
    // This makes the trial more realistic and prevents immediate clicking
    setTimeout(() => {
      setTargetPos(target)
      setGazeState(createGazeState(modalityConfig.dwellTime))
      setCountdown(timeout / 1000)
      
      // Reset trial completion guard for new trial
      trialCompletedRef.current = false
      
      // Reset FPS tracking
      fpsTrackingRef.current = {
        frameTimes: [],
        lastFrameTime: null,
      }
      
      // Reset submovement tracking
      submovementTrackingRef.current = {
        previousPos: null,
        previousTime: null,
        velocities: [],
        peakVelocity: 0,
        submovementCount: 0,
        lastVelocity: 0,
        isRising: false,
      }
      
      // Reset trajectory tracking
      trajectoryRef.current = []
      lastTrajectoryLogTimeRef.current = 0
      
      const startTime = performance.now()
      setTrialStartTime(startTime)
      
      // Initialize condition integrity: single source of truth (frozen at trial start)
      const conditionId = `${modalityConfig.modality}_${ui_mode}_p${pressure.toFixed(1)}`
      const appBuildSha = typeof __APP_BUILD_SHA__ !== 'undefined' ? __APP_BUILD_SHA__ : 'dev'
      const conditionVersion = typeof __CONDITION_VERSION__ !== 'undefined' ? __CONDITION_VERSION__ : '1.0'
      
      currentConditionRef.current = {
        modality: modalityConfig.modality,
        ui_mode: ui_mode,
        pressure: pressure,
        condition_id: conditionId,
        condition_version: conditionVersion,
        app_build_sha: appBuildSha,
      }
      
      // Create trial data
      const trialId = `trial-${performance.now()}-${Math.random().toString(36).substr(2, 9)}`
      const trialData: TrialData = {
        trialId,
        trialNumber: trialContext.trialInBlock,
        globalTrialNumber: trialContext.globalTrialNumber,
        trialInBlock: trialContext.trialInBlock,
        blockNumber: trialContext.blockNumber,
        blockOrder: trialContext.blockOrder,
        blockTrialCount: trialContext.blockTrialCount,
        A: config.A,
        W: config.W,
        ID: config.ID,
        modality: modalityConfig.modality,
        ui_mode,
        pressure,
        aging: agingEnabled,
        startPos,
        targetPos: target,
        timestamp: startTime,
      }
      
      trialDataRef.current = trialData
      
      // Emit trial start event
      bus.emit('trial:start', {
        trialId,
        trial: trialContext.trialInBlock,
        trial_in_block: trialContext.trialInBlock,
        trial_number: trialContext.globalTrialNumber,
        block_number: trialContext.blockNumber,
        block_order: trialContext.blockOrder,
        block_trial_count: trialContext.blockTrialCount,
        A: config.A,
        W: config.W,
        ID: config.ID,
        index_of_difficulty_nominal: config.ID,
        target_distance_A: config.A,
        modality: modalityConfig.modality,
        ui_mode,
        pressure,
        aging: agingEnabled,
        taskType: config.taskType || 'point',
        dragDistance: config.dragDistance,
        practice: isPractice,
        timestamp: startTime,
      })
      
      // Set timeout
      if (timeout > 0) {
        timeoutRef.current = setTimeout(() => {
          handleTimeout()
        }, timeout)
      }
    }, 200) // 200ms delay before target appears
  }, [
    config,
    modalityConfig,
    ui_mode,
    pressure,
    trialContext,
    timeout,
    startPos,
    handleTimeout,
    agingEnabled,
    targetMargin,
    isPractice,
  ])

  const getConfirmType = useCallback(
    (wasClick: boolean): string => {
      if (modalityConfig.modality === Modality.HAND) {
        return 'click'
      }
      if (!wasClick && modalityConfig.dwellTime > 0) {
        return 'dwell'
      }
      return 'space'
    },
    [modalityConfig.modality, modalityConfig.dwellTime]
  )

  // Guard to prevent duplicate trial completions
  const trialCompletedRef = useRef(false)
  
  // FPS tracking loop
  useEffect(() => {
    if (!trialStartTime || showStart || !targetPos) return
    
    let fpsTrackingFrameId: number | null = null
    let lastFrameTime = performance.now()
    
    const trackFrame = () => {
      const currentTime = performance.now()
      const deltaTime = currentTime - lastFrameTime
      
      // Record frame time
      fpsTrackingRef.current.frameTimes.push(deltaTime)
      lastFrameTime = currentTime
      
      // Keep only recent frames (last 120 frames ~2s at 60fps)
      if (fpsTrackingRef.current.frameTimes.length > 120) {
        fpsTrackingRef.current.frameTimes.shift()
      }
      
      fpsTrackingFrameId = requestAnimationFrame(trackFrame)
    }
    
    // Start tracking
    fpsTrackingFrameId = requestAnimationFrame(trackFrame)
    
    return () => {
      if (fpsTrackingFrameId !== null) {
        cancelAnimationFrame(fpsTrackingFrameId)
      }
    }
  }, [trialStartTime, showStart, targetPos])
  
  // Trajectory logging loop (for control theory analysis)
  useEffect(() => {
    if (!trialStartTime || showStart || !targetPos) {
      // Stop trajectory logging if trial not active
      if (trajectoryAnimationFrameRef.current !== null) {
        cancelAnimationFrame(trajectoryAnimationFrameRef.current)
        trajectoryAnimationFrameRef.current = null
      }
      return
    }
    
    // Reset trajectory tracking state for new trial
    trajectoryStartReasonRef.current = 'target_shown'
    movementDetectedRef.current = false
    
    // For non-practice trials, always log at least start point
    if (!isPractice && trialStartTime) {
      const startPos = cursorPosRef.current
      trajectoryRef.current.push({
        x: startPos.x,
        y: startPos.y,
        t: 0, // Trial start
      })
    }
    
    const logTrajectory = () => {
      if (!trialStartTime || showStart || !targetPos) {
        trajectoryAnimationFrameRef.current = null
        return
      }
      
      const currentTime = performance.now()
      const elapsed = currentTime - trialStartTime
      const currentPos = cursorPosRef.current
      
      // Movement detection: check if cursor has moved significantly from start
      if (!movementDetectedRef.current && (currentPos.x !== 0 || currentPos.y !== 0)) {
        const startPoint = trajectoryRef.current[0]
        if (startPoint) {
          const distance = Math.sqrt(
            Math.pow(currentPos.x - startPoint.x, 2) + 
            Math.pow(currentPos.y - startPoint.y, 2)
          )
          // Movement threshold: 5px
          if (distance > 5) {
            movementDetectedRef.current = true
            trajectoryStartReasonRef.current = 'movement_detected'
          }
        }
      }
      
      // Only log if enough time has passed (throttle to ~60fps)
      if (elapsed - lastTrajectoryLogTimeRef.current >= TRAJECTORY_LOG_INTERVAL_MS) {
        // For non-practice trials, always log (even if at origin)
        // This ensures we capture at least start + end points
        if (!isPractice || (currentPos.x !== 0 || currentPos.y !== 0)) {
          trajectoryRef.current.push({
            x: currentPos.x,
            y: currentPos.y,
            t: elapsed, // Time in ms from trial start
          })
          lastTrajectoryLogTimeRef.current = elapsed
        }
      }
      
      // Continue logging if trial is still active
      if (targetPos && !showStart && trialStartTime) {
        trajectoryAnimationFrameRef.current = requestAnimationFrame(logTrajectory)
      } else {
        trajectoryAnimationFrameRef.current = null
      }
    }
    
    // Start trajectory logging
    trajectoryAnimationFrameRef.current = requestAnimationFrame(logTrajectory)
    
    return () => {
      if (trajectoryAnimationFrameRef.current !== null) {
        cancelAnimationFrame(trajectoryAnimationFrameRef.current)
        trajectoryAnimationFrameRef.current = null
      }
    }
  }, [trialStartTime, showStart, targetPos, isPractice])

  // Velocity tracking loop for submovement detection
  // Use a ref to track cursor position to avoid dependency on cursorPos state
  const cursorPosRef = useRef<Position>(cursorPos)
  useEffect(() => {
    cursorPosRef.current = cursorPos
  }, [cursorPos])
  
  useEffect(() => {
    if (!trialStartTime || showStart || !targetPos) return
    
    let velocityTrackingFrameId: number | null = null
    
    const trackVelocity = () => {
      const tracking = submovementTrackingRef.current
      const currentTime = performance.now()
      // Read current cursor position from ref (always up-to-date)
      const currentPos = cursorPosRef.current
      
      // Initialize on first frame
      if (tracking.previousTime === null || tracking.previousPos === null) {
        tracking.previousPos = { ...currentPos }
        tracking.previousTime = currentTime
        velocityTrackingFrameId = requestAnimationFrame(trackVelocity)
        return
      }
      
      // Calculate velocity
      const deltaTime = currentTime - tracking.previousTime
      if (deltaTime > 0) {
        const velocity = calculateVelocity(tracking.previousPos, currentPos, deltaTime)
        
        // Detect submovement peaks
        detectSubmovement(velocity)
        
        // Store velocity history (keep last 60 samples for smoothing)
        tracking.velocities.push(velocity)
        if (tracking.velocities.length > 60) {
          tracking.velocities.shift()
        }
      }
      
      // Update previous state
      tracking.previousPos = { ...currentPos }
      tracking.previousTime = currentTime
      
      velocityTrackingFrameId = requestAnimationFrame(trackVelocity)
    }
    
    // Start tracking
    velocityTrackingFrameId = requestAnimationFrame(trackVelocity)
    
    return () => {
      if (velocityTrackingFrameId !== null) {
        cancelAnimationFrame(velocityTrackingFrameId)
      }
    }
  }, [trialStartTime, showStart, targetPos, calculateVelocity, detectSubmovement])
  
  const completeSelection = useCallback(
    (clickPos: Position, isClick: boolean = false) => {
      if (!trialStartTime || !targetPos || !trialDataRef.current) return
      if (isPaused || isBlockedState()) return // Don't process if paused
      
      // Prevent duplicate completions
      if (trialCompletedRef.current) {
        console.warn('[FittsTask] Trial already completed, ignoring duplicate completion')
        return
      }
      
      // Mark trial as completed immediately to prevent race conditions
      trialCompletedRef.current = true
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      
      const endTime = performance.now()
      const rt_ms = endTime - trialStartTime
      const trialData = trialDataRef.current
      const confirmType = getConfirmType(isClick)
      
      // Finalize time tracking: if still in target, accumulate remaining time
      if (currentEntryTimeRef.current !== null && trialStartTime) {
        const relativeTime = endTime - trialStartTime
        const entryDuration = relativeTime - currentEntryTimeRef.current
        timeInTargetTotalRef.current += entryDuration
        currentEntryTimeRef.current = null
      }
      
      // Finalize QC telemetry: tab hidden time
      if (qcTelemetryRef.current.tab_hidden_start !== null) {
        const hiddenDuration = endTime - qcTelemetryRef.current.tab_hidden_start
        qcTelemetryRef.current.tab_hidden_total_ms += hiddenDuration
        qcTelemetryRef.current.tab_hidden_start = null
      }
      
      // Validate trial quality
      const violations: string[] = []
      if (qcTelemetryRef.current.tab_hidden_count > 0) {
        violations.push(`tab_hidden_${qcTelemetryRef.current.tab_hidden_count}times`)
      }
      if (qcTelemetryRef.current.tab_hidden_total_ms > 500) {
        violations.push(`tab_hidden_${Math.round(qcTelemetryRef.current.tab_hidden_total_ms)}ms`)
      }
      if (qcTelemetryRef.current.focus_blur_count > 2) {
        violations.push(`focus_blur_${qcTelemetryRef.current.focus_blur_count}times`)
      }
      const zoomPct = qcTelemetryRef.current.zoom_pct_measured
      if (zoomPct !== null && (zoomPct < 95 || zoomPct > 105)) {
        violations.push(`zoom_${zoomPct.toFixed(1)}pct`)
      }
      
      qcTelemetryRef.current.trial_invalid_reason = violations.length > 0 ? violations.join(';') : null
      qcTelemetryRef.current.trial_valid = violations.length === 0
      
      // Set confirm event time and source
      const relativeEndTime = rt_ms
      confirmEventTimeRef.current = relativeEndTime
      if (isClick) {
        confirmEventSourceRef.current = 'click'
      } else if (modalityConfig.modality === Modality.GAZE) {
        if (modalityConfig.dwellTime > 0) {
          confirmEventSourceRef.current = 'dwell'
        } else {
          confirmEventSourceRef.current = 'space'
        }
      } else {
        confirmEventSourceRef.current = 'space'
      }
      
      // Calculate verification timing
      const verification_start_time_ms = firstEntryTimeRef.current
      const verification_end_time_ms = confirmEventTimeRef.current
      const verification_time_ms = verification_start_time_ms !== null && verification_end_time_ms !== null
        ? verification_end_time_ms - verification_start_time_ms
        : null
      
      // Calculate timeout metadata
      const timeout_triggered = false // Trial completed before timeout
      const time_remaining_ms_at_confirm = timeout > 0 && rt_ms < timeout
        ? timeout - rt_ms
        : null
      
      trialEndReasonRef.current = 'confirmed'
      
      // For non-practice trials, ensure trajectory has end point
      if (!isPractice && trajectoryRef.current.length > 0) {
        const lastPoint = trajectoryRef.current[trajectoryRef.current.length - 1]
        // Only add end point if it's different from last point or enough time has passed
        if (lastPoint.t < rt_ms - 10 || 
            Math.abs(lastPoint.x - clickPos.x) > 1 || 
            Math.abs(lastPoint.y - clickPos.y) > 1) {
          trajectoryRef.current.push({
            x: clickPos.x,
            y: clickPos.y,
            t: rt_ms,
          })
        }
      }
      
      // Process trajectory with quality metrics
      const trajData = processTrajectory(
        trajectoryRef.current,
        'confirmed'
      )
      
      const hit = isHit(clickPos, targetPos, effectiveWidth)
      
      if (hit) {
        const metrics = getSpatialMetrics(clickPos)
        const displayMetrics = getDisplayMetrics()
        const avgFPS = calculateAverageFPS()
        const conditionData = getConditionData()

        // Alignment gate metrics (if enabled)
        const alignmentGateMetrics = alignmentGateEnabled
          ? {
              alignment_gate_enabled: true,
              alignment_gate_false_triggers: alignmentGateRef.current.falseTriggers,
              alignment_gate_recovery_time_ms:
                alignmentGateRef.current.recoveryTimes.length > 0
                  ? alignmentGateRef.current.recoveryTimes[
                      alignmentGateRef.current.recoveryTimes.length - 1
                    ]
                  : null,
              alignment_gate_mean_recovery_time_ms:
                alignmentGateRef.current.recoveryTimes.length > 0
                  ? alignmentGateRef.current.recoveryTimes.reduce((a, b) => a + b, 0) /
                    alignmentGateRef.current.recoveryTimes.length
                  : null,
            }
          : {
              alignment_gate_enabled: false,
              alignment_gate_false_triggers: null,
              alignment_gate_recovery_time_ms: null,
              alignment_gate_mean_recovery_time_ms: null,
            }

        bus.emit('trial:end', {
          trialId: trialData.trialId,
          trial: trialData.trialNumber,
          trial_in_block: trialData.trialInBlock,
          trial_number: trialData.globalTrialNumber,
          block_number: trialData.blockNumber,
          block_order: trialData.blockOrder,
          block_trial_count: trialData.blockTrialCount,
          rt_ms,
          duration: rt_ms,
          correct: true,
          A: trialData.A,
          W: trialData.W,
          ID: trialData.ID,
          index_of_difficulty_nominal: trialData.ID,
          target_distance_A: trialData.A,
          // Width logging: both nominal (design) and displayed (actual rendered size)
          nominal_width_px: trialData.W,
          displayed_width_px: effectiveWidth,
          width_scale_factor: widthScale,
          clickPos,
          targetPos: trialData.targetPos,
          target_center_x: metrics.targetCenter?.x ?? null,
          target_center_y: metrics.targetCenter?.y ?? null,
          endpoint_x: metrics.endpoint?.x ?? null,
          endpoint_y: metrics.endpoint?.y ?? null,
          endpoint_error_px: metrics.endpointError ?? null,
          projected_error_px: metrics.projectedError ?? null,
          modality: trialData.modality,
          ui_mode: trialData.ui_mode,
          pressure: trialData.pressure,
          aging: trialData.aging,
          taskType: config.taskType || 'point',
          dragDistance: config.dragDistance,
          confirm_type: confirmType,
          timestamp: endTime,
          // Display metrics
          zoom_pct: displayMetrics.zoom_pct,
          fullscreen: displayMetrics.fullscreen,
          dpr: displayMetrics.dpr,
          viewport_w: displayMetrics.viewport_w,
          viewport_h: displayMetrics.viewport_h,
          focus_blur_count: displayMetrics.focus_blur_count,
          tab_hidden_ms: displayMetrics.tab_hidden_ms,
          // Alignment gate metrics
          ...alignmentGateMetrics,
          // Practice and FPS tracking
          practice: isPractice,
          avg_fps: avgFPS,
          // Calibration data (for post-hoc visual angle calculations)
          pixels_per_mm: calibrationData?.pixelsPerMM ?? null,
          pixels_per_degree: calibrationData?.pixelsPerDegree ?? null,
          // Target re-entry tracking (proxy for frustration in gaze interactions)
          target_reentry_count: targetReEntryCountRef.current,
          // Verification time (time from first target entry to selection)
          verification_time_ms: verification_time_ms,
          // LBA-critical timing fields
          entered_target: enteredTargetRef.current,
          first_entry_time_ms: firstEntryTimeRef.current,
          last_exit_time_ms: lastExitTimeRef.current,
          time_in_target_total_ms: timeInTargetTotalRef.current,
          verification_start_time_ms: verification_start_time_ms,
          verification_end_time_ms: verification_end_time_ms,
          confirm_event_time_ms: confirmEventTimeRef.current,
          confirm_event_source: confirmEventSourceRef.current,
          timeout_limit_ms: timeout,
          timeout_triggered: timeout_triggered,
          time_remaining_ms_at_confirm: time_remaining_ms_at_confirm,
          trial_end_reason: trialEndReasonRef.current,
          // Trajectory data (for control theory analysis - cursor position over time)
          trajectory: trajData.trajectory.length > 0 ? trajData.trajectory : (isPractice ? null : []),
          // Trajectory quality metrics
          traj_point_count: trajData.traj_point_count,
          traj_duration_ms: trajData.traj_duration_ms,
          traj_median_dt_ms: trajData.traj_median_dt_ms,
          traj_max_dt_ms: trajData.traj_max_dt_ms,
          traj_gap_count: trajData.traj_gap_count,
          traj_has_monotonic_t: trajData.traj_has_monotonic_t,
          traj_start_reason: trajData.traj_start_reason,
          traj_end_reason: trajData.traj_end_reason,
          traj_downsample_factor: trajData.traj_downsample_factor,
          // Submovement count (legacy - for comparison)
          submovement_count_legacy: submovementTrackingRef.current.submovementCount,
          // Submovement count (recomputed from trajectory)
          submovement_count_recomputed: trajData.submovement_count_recomputed,
          submovement_primary_peak_v: trajData.submovement_primary_peak_v,
          submovement_primary_peak_t_ms: trajData.submovement_primary_peak_t_ms,
          submovement_algorithm: trajData.submovement_algorithm,
          submovement_params_json: trajData.submovement_params_json,
          // Condition integrity fields
          ...conditionData,
          // QC/Exclusion telemetry
          ...getQCTelemetryData(),
        })
        
        // Clear trial start time and reset trajectory to prevent duplicate completions
        setTrialStartTime(null)
        trajectoryRef.current = []
        lastTrajectoryLogTimeRef.current = 0
        onTrialComplete()
      } else {
        // Miss or slip
        const errorType = isClick ? 'miss' : 'slip'
        trialEndReasonRef.current = 'confirmed' // Confirm event happened, just missed target
        const metrics = getSpatialMetrics(clickPos)
        const displayMetrics = getDisplayMetrics()
        const avgFPS = calculateAverageFPS()
        const conditionData = getConditionData()

        bus.emit('trial:error', {
          trialId: trialData.trialId,
          trial: trialData.trialNumber,
          trial_in_block: trialData.trialInBlock,
          trial_number: trialData.globalTrialNumber,
          block_number: trialData.blockNumber,
          block_order: trialData.blockOrder,
          block_trial_count: trialData.blockTrialCount,
          error: errorType,
          err_type: errorType,
          rt_ms,
          clickPos,
          targetPos: trialData.targetPos,
          target_center_x: metrics.targetCenter?.x ?? null,
          target_center_y: metrics.targetCenter?.y ?? null,
          endpoint_x: metrics.endpoint?.x ?? null,
          endpoint_y: metrics.endpoint?.y ?? null,
          endpoint_error_px: metrics.endpointError ?? null,
          projected_error_px: metrics.projectedError ?? null,
          modality: trialData.modality,
          ui_mode: trialData.ui_mode,
          pressure: trialData.pressure,
          aging: trialData.aging,
          taskType: config.taskType || 'point',
          dragDistance: config.dragDistance,
          A: trialData.A,
          W: trialData.W,
          ID: trialData.ID,
          index_of_difficulty_nominal: trialData.ID,
          target_distance_A: trialData.A,
          // Width logging: both nominal (design) and displayed (actual rendered size)
          nominal_width_px: trialData.W,
          displayed_width_px: effectiveWidth,
          width_scale_factor: widthScale,
          confirm_type: confirmType,
          timestamp: endTime,
          // Display metrics
          zoom_pct: displayMetrics.zoom_pct,
          fullscreen: displayMetrics.fullscreen,
          dpr: displayMetrics.dpr,
          viewport_w: displayMetrics.viewport_w,
          viewport_h: displayMetrics.viewport_h,
          focus_blur_count: displayMetrics.focus_blur_count,
          tab_hidden_ms: displayMetrics.tab_hidden_ms,
          // Practice and FPS tracking
          practice: isPractice,
          avg_fps: avgFPS,
          // Calibration data (for post-hoc visual angle calculations)
          pixels_per_mm: calibrationData?.pixelsPerMM ?? null,
          pixels_per_degree: calibrationData?.pixelsPerDegree ?? null,
          // Target re-entry tracking (proxy for frustration in gaze interactions)
          target_reentry_count: targetReEntryCountRef.current,
          // Verification time (time from first target entry to selection)
          verification_time_ms: verification_time_ms,
          // LBA-critical timing fields
          entered_target: enteredTargetRef.current,
          first_entry_time_ms: firstEntryTimeRef.current,
          last_exit_time_ms: lastExitTimeRef.current,
          time_in_target_total_ms: timeInTargetTotalRef.current,
          verification_start_time_ms: verification_start_time_ms,
          verification_end_time_ms: verification_end_time_ms,
          confirm_event_time_ms: confirmEventTimeRef.current,
          confirm_event_source: confirmEventSourceRef.current,
          timeout_limit_ms: timeout,
          timeout_triggered: timeout_triggered,
          time_remaining_ms_at_confirm: time_remaining_ms_at_confirm,
          trial_end_reason: trialEndReasonRef.current,
          // Trajectory data (for control theory analysis - cursor position over time)
          trajectory: trajData.trajectory.length > 0 ? trajData.trajectory : (isPractice ? null : []),
          // Trajectory quality metrics
          traj_point_count: trajData.traj_point_count,
          traj_duration_ms: trajData.traj_duration_ms,
          traj_median_dt_ms: trajData.traj_median_dt_ms,
          traj_max_dt_ms: trajData.traj_max_dt_ms,
          traj_gap_count: trajData.traj_gap_count,
          traj_has_monotonic_t: trajData.traj_has_monotonic_t,
          traj_start_reason: trajData.traj_start_reason,
          traj_end_reason: trajData.traj_end_reason,
          traj_downsample_factor: trajData.traj_downsample_factor,
          // Submovement count (legacy - for comparison)
          submovement_count_legacy: submovementTrackingRef.current.submovementCount,
          // Submovement count (recomputed from trajectory)
          submovement_count_recomputed: trajData.submovement_count_recomputed,
          submovement_primary_peak_v: trajData.submovement_primary_peak_v,
          submovement_primary_peak_t_ms: trajData.submovement_primary_peak_t_ms,
          submovement_algorithm: trajData.submovement_algorithm,
          submovement_params_json: trajData.submovement_params_json,
          // Condition integrity fields
          ...conditionData,
          // QC/Exclusion telemetry
          ...getQCTelemetryData(),
        })
        
        // Clear trial start time to prevent duplicate completions
        setTrialStartTime(null)
        trajectoryRef.current = []
        lastTrajectoryLogTimeRef.current = 0
        onTrialError(errorType)
      }
    },
    [trialStartTime, targetPos, onTrialComplete, onTrialError, effectiveWidth, getSpatialMetrics, getConfirmType, isPaused, calibrationData, processTrajectory, isPractice, timeout, getConditionData, getQCTelemetryData]
  )

  // Alignment gate: check if selection is allowed
  const checkAlignmentGate = useCallback(
    (clickPos: Position): boolean => {
      if (!alignmentGateEnabled || modalityConfig.modality !== Modality.HAND) {
        return true // Gate disabled or not hand mode - allow selection
      }

      if (!targetPos) return false

      // Check if pointer is down (hand input detected)
      if (!pointerDown) {
        // False trigger: attempted selection without pointer down
        alignmentGateRef.current.falseTriggers++
        setFalseTriggerCount((prev) => prev + 1)
        if (recoveryStartTime === null) {
          setRecoveryStartTime(performance.now())
        }
        console.log('[FittsTask] Alignment gate: false trigger (no pointer down)')
        return false
      }

      // Check if hovering over target
      const isInTarget = isHit(clickPos, targetPos, effectiveWidth)
      if (!isInTarget) {
        // False trigger: attempted selection outside target
        alignmentGateRef.current.falseTriggers++
        setFalseTriggerCount((prev) => prev + 1)
        if (recoveryStartTime === null) {
          setRecoveryStartTime(performance.now())
        }
        console.log('[FittsTask] Alignment gate: false trigger (not in target)')
        return false
      }

      // Check if hovering for ≥80ms
      const now = performance.now()
      const hoverDuration = hoverStartTime ? now - hoverStartTime : 0
      if (hoverDuration < 80) {
        // False trigger: hover duration insufficient
        alignmentGateRef.current.falseTriggers++
        setFalseTriggerCount((prev) => prev + 1)
        if (recoveryStartTime === null) {
          setRecoveryStartTime(performance.now())
        }
        console.log(
          `[FittsTask] Alignment gate: false trigger (hover duration ${hoverDuration}ms < 80ms)`
        )
        return false
      }

      // Gate passed - log recovery time if there was a previous failure
      if (recoveryStartTime !== null) {
        const recoveryTime = now - recoveryStartTime
        alignmentGateRef.current.recoveryTimes.push(recoveryTime)
        setRecoveryStartTime(null)
        console.log(`[FittsTask] Alignment gate: passed (recovery time: ${recoveryTime}ms)`)
      }

      return true
    },
    [
      alignmentGateEnabled,
      modalityConfig.modality,
      targetPos,
      pointerDown,
      hoverStartTime,
      effectiveWidth,
      recoveryStartTime,
    ]
  )

  // Track pointer down/up for alignment gate
  useEffect(() => {
    if (!alignmentGateEnabled || modalityConfig.modality !== Modality.HAND) return
    if (showStart || !targetPos) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!canvasRef.current?.contains(event.target as Node)) return
      setPointerDown(true)
      setPointerDownTime(performance.now())
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (!canvasRef.current?.contains(event.target as Node)) return
      setPointerDown(false)
      setPointerDownTime(null)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [alignmentGateEnabled, modalityConfig.modality, showStart, targetPos])

  // Track hover state for alignment gate
  useEffect(() => {
    if (!alignmentGateEnabled || modalityConfig.modality !== Modality.HAND) return
    if (showStart || !targetPos) return

    const checkHover = () => {
      if (!canvasRef.current) return

      const isHovering = isHit(mousePosRef.current, targetPos, effectiveWidth)
      const currentTime = performance.now()

      // Track target re-entries for hand mode too
      if (isHovering !== previousHoverStateRef.current) {
        if (isHovering && !previousHoverStateRef.current) {
          // Cursor entered the target
          targetReEntryCountRef.current += 1
        }
        previousHoverStateRef.current = isHovering
      }

      // Track entry/exit events for LBA timing analysis
      trackTargetEntryExit(isHovering, currentTime)

      setIsHoveringTarget(isHovering)

      if (isHovering && hoverStartTime === null) {
        setHoverStartTime(performance.now())
      } else if (!isHovering && hoverStartTime !== null) {
        setHoverStartTime(null)
      }

      animationFrameRef.current = requestAnimationFrame(checkHover)
    }

    animationFrameRef.current = requestAnimationFrame(checkHover)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [
    alignmentGateEnabled,
    modalityConfig.modality,
    showStart,
    targetPos,
    effectiveWidth,
    hoverStartTime,
  ])

  // Hand mode: click handler
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const clickPos: Position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }

      if (showStart) {
        // Click on start button
        if (isHit(clickPos, startPos, 60)) {
          startTrial()
        }
      } else if (targetPos) {
        if (modalityConfig.modality === Modality.HAND) {
          // Check alignment gate if enabled
          if (!checkAlignmentGate(clickPos)) {
            // Gate failed - selection blocked
            return
          }

          // Hand mode: direct click (gate passed)
          completeSelection(clickPos, true)
        } else {
          // Gaze mode: clicking should not work (only dwell or space)
          console.log('[FittsTask] Click ignored in gaze mode. Use dwell or space key.')
        }
      }
    },
    [
      showStart,
      startPos,
      targetPos,
      modalityConfig.modality,
      startTrial,
      completeSelection,
      checkAlignmentGate,
    ]
  )

  // Gaze mode: mouse move handler (deprecated - raw position is now tracked globally)
  // This handler is kept for compatibility but cursorPos is set by gaze simulation hook
  const handleMouseMove = useCallback(() => {
    // Cursor position is now handled by the global mouse tracking and gaze simulation
    // This handler is kept to prevent errors but does nothing
    // The gaze simulation hook updates cursorPos via displayGazePos
  }, [])

  // Track mouse position globally (for gaze mode and alignment gate)
  const mousePosRef = useRef<Position>({ x: 0, y: 0 })
  
  // Raw mouse position (for gaze simulation input)
  const [rawMousePosition, setRawMousePosition] = useState<Position | null>(null)
  
  // Load calibration data from sessionStorage (state declared earlier)
  useEffect(() => {
    try {
      const calibrationStr = sessionStorage.getItem('calibration')
      if (calibrationStr) {
        const cal = JSON.parse(calibrationStr)
        setCalibrationData({
          pixelsPerMM: cal.pixelsPerMM || 3.779, // Default ~96 DPI if no calibration
          pixelsPerDegree: cal.pixelsPerDegree || 60, // Default estimate
        })
      } else {
        // No calibration - use default estimate (96 DPI ≈ 3.779 px/mm at 60cm)
        setCalibrationData({
          pixelsPerMM: 3.779,
          pixelsPerDegree: 60,
        })
      }
    } catch (e) {
      console.warn('[FittsTask] Failed to load calibration, using defaults:', e)
      setCalibrationData({
        pixelsPerMM: 3.779,
        pixelsPerDegree: 60,
      })
    }
  }, [])
  
  // Calculate normalized jitter: Base jitter in mm (0.5mm ≈ 0.12° at 60cm viewing distance)
  // Convert to pixels using calibration: Jitter_px = Jitter_mm × PixelsPerMM
  const JITTER_MM = 0.5 // Standard high-end eye tracker noise level
  const normalizedJitterPx = useMemo(() => {
    if (calibrationData) {
      return JITTER_MM * calibrationData.pixelsPerMM
    }
    return 5.0 // Fallback to fixed value if no calibration
  }, [calibrationData])
  
  // Gaze simulation hook (physiologically-accurate eye tracking simulation)
  const isGazeMode = modalityConfig.modality === Modality.GAZE
  const {
    simulatedPosition: simulatedGazePosRef,
    displayPosition: displayGazePos,
    isSaccading,
  } = useGazeSimulation(rawMousePosition, isGazeMode, {
    smoothingFactor: 0.15,
    fixationNoiseStdDev: normalizedJitterPx, // Normalized noise based on calibration
    pixelsPerDegree: calibrationData?.pixelsPerDegree || 60, // Pass calibration data for angular velocity calculation
    fixationVelocityThreshold: 30, // degrees/sec - below this, apply fixation noise
    saccadeVelocityThreshold: 120, // degrees/sec - above this, trigger saccadic suppression
    enableSaccadicSuppression: true,
  })
  
  // Update mouse position on move (for gaze mode and alignment gate)
  useEffect(() => {
    const needsMouseTracking =
      modalityConfig.modality === Modality.GAZE ||
      (alignmentGateEnabled && modalityConfig.modality === Modality.HAND)
    
    if (!needsMouseTracking) {
      // Reset raw position when not needed
      setRawMousePosition(null)
      return
    }
    
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const rawPos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
      
      // Update raw position for gaze simulation
      if (modalityConfig.modality === Modality.GAZE) {
        setRawMousePosition(rawPos)
      }
      
      // For hand mode, use raw position directly
      if (modalityConfig.modality === Modality.HAND) {
        mousePosRef.current = rawPos
        setRawMousePosition(null) // Not needed for hand mode
      }
    }
    
    window.addEventListener('mousemove', handleGlobalMouseMove)
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove)
  }, [modalityConfig.modality, alignmentGateEnabled])
  
  // Gaze mode: Sync simulated position to mousePosRef and cursorPos for hit detection and display
  useEffect(() => {
    if (modalityConfig.modality !== Modality.GAZE) {
      // Reset when not in gaze mode
      setCursorPos({ x: 0, y: 0 })
      return
    }
    
    // Update mousePosRef with simulated position for hit detection
    // This ensures collisions are calculated using the physiologically-accurate simulated gaze
    mousePosRef.current = simulatedGazePosRef.current
    
    // Update cursorPos with display position for visual rendering
    setCursorPos(displayGazePos)
    
    // Debug: log position updates occasionally
    if (Math.random() < 0.01 && rawMousePosition) {
      console.log('[FittsTask] Gaze simulation update:', {
        raw: rawMousePosition,
        simulated: simulatedGazePosRef.current,
        display: displayGazePos,
        isSaccading,
      })
    }
  }, [modalityConfig.modality, displayGazePos, simulatedGazePosRef, isSaccading, rawMousePosition])

  // Gaze mode: update hover state (for both Start button and Target)
  useEffect(() => {
    if (modalityConfig.modality !== Modality.GAZE) {
      return
    }
    // Allow checking hover for Start button OR Target - don't return early
    // We need to track hover state for both the start button and the target
    
    console.log('[FittsTask] Starting gaze hover detection, dwellTime:', modalityConfig.dwellTime)
    
    const updateHover = () => {
      // Use the ref for current smoothed gaze position (always up-to-date)
      const currentMousePos = mousePosRef.current
      
      // Skip if position hasn't been initialized yet (wait for mouse to move)
      if (currentMousePos.x === 0 && currentMousePos.y === 0) {
        hoverAnimationFrameRef.current = requestAnimationFrame(updateHover)
        return
      }
      
      // Determine which element we're checking hover for (Start button or Target)
      const currentTarget = showStart ? startPos : targetPos
      if (!currentTarget) {
        hoverAnimationFrameRef.current = requestAnimationFrame(updateHover)
        return
      }
      
      // Start button is typically larger (80px radius) than targets
      const START_BUTTON_RADIUS = 60
      const DWELL_TOLERANCE_PX = 10
      const hitSize = showStart ? START_BUTTON_RADIUS * 2 : effectiveWidth
      const hitRadius = hitSize / 2
      
      // Calculate distance to current target (start button or target)
      const distance = Math.sqrt(
        Math.pow(currentMousePos.x - currentTarget.x, 2) + 
        Math.pow(currentMousePos.y - currentTarget.y, 2)
      )
      const isHovering = distance <= (hitRadius + DWELL_TOLERANCE_PX)
      const currentTime = performance.now()
      
      // Track target re-entries (for gaze interaction analysis)
      // Count when cursor enters target (transitions from not hovering to hovering)
      // Only track for the actual target, not the start button
      if (!showStart && targetPos && isHovering !== previousHoverStateRef.current) {
        if (isHovering && !previousHoverStateRef.current) {
          // Cursor entered the target
          targetReEntryCountRef.current += 1
        }
        previousHoverStateRef.current = isHovering
      }
      
      // Track entry/exit events for LBA timing analysis (only for target, not start button)
      if (!showStart && targetPos) {
        trackTargetEntryExit(isHovering, currentTime)
      }
      
      setGazeState((prev) => {
        const newState = updateGazeState(
          prev,
          isHovering,
          currentTime,
          modalityConfig.dwellTime
        )
        
        // Check if selection is complete (dwell-based)
        // Only auto-select if dwellTime > 0 (dwell mode, not confirmation mode)
        if (
          modalityConfig.dwellTime > 0 &&
          isGazeSelectionComplete(newState, modalityConfig.dwellTime, false)
        ) {
          if (showStart) {
            // Start button selected via dwell
            console.log('[FittsTask] Start button selected via dwell!')
            startTrial()
            return prev // Don't update state, trial is starting
          } else {
            // Target selected via dwell
            completeSelection(currentMousePos, false)
            return prev // Don't update state, trial is ending
          }
        }
        
        return newState
      })
      
      hoverAnimationFrameRef.current = requestAnimationFrame(updateHover)
    }
    
    hoverAnimationFrameRef.current = requestAnimationFrame(updateHover)
    
    return () => {
      if (hoverAnimationFrameRef.current) {
        cancelAnimationFrame(hoverAnimationFrameRef.current)
        hoverAnimationFrameRef.current = null
      }
    }
  }, [
    modalityConfig.modality,
    modalityConfig.dwellTime,
    showStart,
    startPos,
    targetPos,
    effectiveWidth,
    completeSelection,
    startTrial,
  ])

  // Gaze mode: space key handler (for confirmation mode when dwellTime === 0)
  // Also prevent space from scrolling in all gaze modes
  useEffect(() => {
    if (modalityConfig.modality !== Modality.GAZE) return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault()
        event.stopPropagation()
        
        console.log('[FittsTask] Space key pressed', {
          dwellTime: modalityConfig.dwellTime,
          showStart,
          hasTarget: !!targetPos,
          isHovering: gazeState.isHovering,
          cursorPos,
          mousePos: mousePosRef.current
        })
        
        // Handle selection if in confirmation mode (dwellTime === 0)
        if (modalityConfig.dwellTime === 0) {
          const currentPos = mousePosRef.current
          const DWELL_TOLERANCE_PX = 10
          
          // Check if hovering over start button
          if (showStart && startPos) {
            const START_BUTTON_RADIUS = 60
            const distance = Math.sqrt(
              Math.pow(currentPos.x - startPos.x, 2) + 
              Math.pow(currentPos.y - startPos.y, 2)
            )
            const isHoveringStart = distance <= (START_BUTTON_RADIUS + DWELL_TOLERANCE_PX)
            
            if (isHoveringStart || gazeState.isHovering) {
              console.log('[FittsTask] Space key - starting trial')
              startTrial()
              return
            }
          }
          
          // Check if hovering over target
          if (!showStart && targetPos) {
            const targetRadius = effectiveWidth / 2
            const distance = Math.sqrt(
              Math.pow(currentPos.x - targetPos.x, 2) + 
              Math.pow(currentPos.y - targetPos.y, 2)
            )
            const isHovering = distance <= (targetRadius + DWELL_TOLERANCE_PX)
            
            // Check if hovering over target (use both state and real-time check)
            if (isHovering || gazeState.isHovering) {
              console.log('[FittsTask] Space key - selecting target')
              completeSelection(currentPos, false)
              return
            }
          }
          
          // Premature confirmation (slip) - only log if we have a target (not start button)
          if (!showStart && targetPos && trialDataRef.current) {
            const trialData = trialDataRef.current
            const timestamp = performance.now()
            const rt_ms = timestamp - trialData.timestamp
            
            // Finalize time tracking: if still in target, accumulate remaining time
            if (currentEntryTimeRef.current !== null && trialStartTime) {
              const relativeTime = timestamp - trialStartTime
              const entryDuration = relativeTime - currentEntryTimeRef.current
              timeInTargetTotalRef.current += entryDuration
              currentEntryTimeRef.current = null
            }
            
            // Set confirm event time and source
            const relativeEndTime = rt_ms
            confirmEventTimeRef.current = relativeEndTime
            confirmEventSourceRef.current = 'space'
            trialEndReasonRef.current = 'confirmed' // Confirm event happened, just premature
            
            // Calculate verification timing
            const verification_start_time_ms = firstEntryTimeRef.current
            const verification_end_time_ms = confirmEventTimeRef.current
            const verification_time_ms = verification_start_time_ms !== null && verification_end_time_ms !== null
              ? verification_end_time_ms - verification_start_time_ms
              : null
            
            // Calculate timeout metadata
            const timeout_triggered = false // Trial completed before timeout
            const time_remaining_ms_at_confirm = timeout > 0 && rt_ms < timeout
              ? timeout - rt_ms
              : null
            
            // For non-practice trials, ensure trajectory has end point
            if (!isPractice && trialStartTime && trajectoryRef.current.length > 0) {
              const lastPoint = trajectoryRef.current[trajectoryRef.current.length - 1]
              // Only add end point if it's different from last point or enough time has passed
              if (lastPoint.t < rt_ms - 10 || 
                  Math.abs(lastPoint.x - cursorPos.x) > 1 || 
                  Math.abs(lastPoint.y - cursorPos.y) > 1) {
                trajectoryRef.current.push({
                  x: cursorPos.x,
                  y: cursorPos.y,
                  t: rt_ms,
                })
              }
            }
            
            // Process trajectory with quality metrics
            const trajData = processTrajectory(
              trajectoryRef.current,
              'confirmed'
            )
            
            const metrics = getSpatialMetrics(cursorPos)
            const avgFPS = calculateAverageFPS()
            const conditionData = getConditionData()

            bus.emit('trial:error', {
              trialId: trialData.trialId,
              trial: trialData.trialNumber,
              trial_in_block: trialData.trialInBlock,
              trial_number: trialData.globalTrialNumber,
              block_number: trialData.blockNumber,
              block_order: trialData.blockOrder,
              block_trial_count: trialData.blockTrialCount,
              error: 'slip',
              err_type: 'slip',
              rt_ms,
              clickPos: cursorPos,
              targetPos,
              target_center_x: metrics.targetCenter?.x ?? null,
              target_center_y: metrics.targetCenter?.y ?? null,
              endpoint_x: metrics.endpoint?.x ?? null,
              endpoint_y: metrics.endpoint?.y ?? null,
              endpoint_error_px: metrics.endpointError ?? null,
              modality: trialData.modality,
              ui_mode: trialData.ui_mode,
              pressure: trialData.pressure,
              aging: trialData.aging,
              A: trialData.A,
              W: trialData.W,
              ID: trialData.ID,
              index_of_difficulty_nominal: trialData.ID,
              target_distance_A: trialData.A,
              // Width logging: both nominal (design) and displayed (actual rendered size)
              nominal_width_px: trialData.W,
              displayed_width_px: effectiveWidth,
              width_scale_factor: widthScale,
              confirm_type: getConfirmType(false),
              timestamp,
              // LBA-critical timing fields
              entered_target: enteredTargetRef.current,
              first_entry_time_ms: firstEntryTimeRef.current,
              last_exit_time_ms: lastExitTimeRef.current,
              time_in_target_total_ms: timeInTargetTotalRef.current,
              verification_start_time_ms: verification_start_time_ms,
              verification_end_time_ms: verification_end_time_ms,
              verification_time_ms: verification_time_ms,
              confirm_event_time_ms: confirmEventTimeRef.current,
              confirm_event_source: confirmEventSourceRef.current,
              timeout_limit_ms: timeout,
              timeout_triggered: timeout_triggered,
              time_remaining_ms_at_confirm: time_remaining_ms_at_confirm,
              trial_end_reason: trialEndReasonRef.current,
              // Trajectory data (for control theory analysis - cursor position over time)
              trajectory: trajData.trajectory.length > 0 ? trajData.trajectory : (isPractice ? null : []),
              // Trajectory quality metrics
              traj_point_count: trajData.traj_point_count,
              traj_duration_ms: trajData.traj_duration_ms,
              traj_median_dt_ms: trajData.traj_median_dt_ms,
              traj_max_dt_ms: trajData.traj_max_dt_ms,
              traj_gap_count: trajData.traj_gap_count,
              traj_has_monotonic_t: trajData.traj_has_monotonic_t,
              traj_start_reason: trajData.traj_start_reason,
              traj_end_reason: trajData.traj_end_reason,
              traj_downsample_factor: trajData.traj_downsample_factor,
              // Practice and FPS tracking
              practice: isPractice,
              avg_fps: avgFPS,
              // Submovement count (legacy - for comparison)
              submovement_count_legacy: submovementTrackingRef.current.submovementCount,
              // Submovement count (recomputed from trajectory)
              submovement_count_recomputed: trajData.submovement_count_recomputed,
              submovement_primary_peak_v: trajData.submovement_primary_peak_v,
              submovement_primary_peak_t_ms: trajData.submovement_primary_peak_t_ms,
              submovement_algorithm: trajData.submovement_algorithm,
              submovement_params_json: trajData.submovement_params_json,
              // Condition integrity fields
              ...conditionData,
            })
            onTrialError('slip')
          }
        }
      }
    }
    
    // Add event listener with capture to catch space key early
    window.addEventListener('keydown', handleKeyDown, true)
    
    // Also add to document to catch even if window doesn't have focus
    document.addEventListener('keydown', handleKeyDown, true)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [
    modalityConfig.modality,
    modalityConfig.dwellTime,
    showStart,
    targetPos,
    gazeState.isHovering,
    cursorPos,
    completeSelection,
    onTrialError,
    getSpatialMetrics,
    getConfirmType,
    effectiveWidth,
    widthScale,
    calculateAverageFPS,
    isPractice,
  ])

  // Reset state when trial context changes (new trial starts)
  useEffect(() => {
    // Reset to start state for new trial
    setShowStart(true)
    setTargetPos(null)
    setTrialStartTime(null)
    setGazeState(createGazeState(modalityConfig.dwellTime))
    setCountdown(timeout / 1000)
    
    // Reset cursor position for gaze mode (reset to uninitialized state)
    // The gaze simulation hook will re-initialize when mouse moves
    if (modalityConfig.modality === Modality.GAZE) {
      setRawMousePosition(null) // Reset raw input to trigger hook reset
      mousePosRef.current = { x: 0, y: 0 }
      setCursorPos({ x: 0, y: 0 })
      console.log('[FittsTask] Reset gaze cursor position for new trial')
    }
    
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (hoverAnimationFrameRef.current) {
      cancelAnimationFrame(hoverAnimationFrameRef.current)
      hoverAnimationFrameRef.current = null
    }
  }, [trialContext.trialInBlock, trialContext.globalTrialNumber, modalityConfig.dwellTime, timeout, modalityConfig.modality, canvasDimensions.width, canvasDimensions.height])

  // Reset cursor position when returning to start state (showStart becomes true)
  useEffect(() => {
    if (modalityConfig.modality === Modality.GAZE && showStart) {
      // Reset to uninitialized state - cursor will follow mouse when it moves
      // This ensures cursor doesn't get stuck at the last target position
      setRawMousePosition(null) // Reset raw input to trigger hook reset
      mousePosRef.current = { x: 0, y: 0 }
      setCursorPos({ x: 0, y: 0 })
      console.log('[FittsTask] Reset gaze cursor for start state - waiting for mouse movement')
    }
  }, [showStart, modalityConfig.modality])
  
  // Countdown timer for pressure mode
  useEffect(() => {
    const shouldStart = pressureEnabled && !showStart && !!targetPos
    console.log('[FittsTask] Timer useEffect check:', {
      pressureEnabled,
      showStart,
      hasTargetPos: !!targetPos,
      currentCountdown: countdown,
      timeoutSeconds: timeout / 1000,
      shouldStart,
    })
    
    if (!shouldStart) {
      console.log('[FittsTask] Timer NOT starting:', {
        reason: !pressureEnabled ? 'pressure not enabled' : showStart ? 'start button visible' : 'no target',
      })
      return
    }
    
    // Reset countdown to timeout value when timer starts
    const initialCountdown = timeout / 1000
    console.log('[FittsTask] Timer STARTING - resetting countdown to:', initialCountdown, 'seconds')
    setCountdown(initialCountdown)
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        const next = Math.max(0, prev - 0.1)
        if (next <= 0) {
          clearInterval(interval)
          console.log('[FittsTask] Timer reached 0 - timeout triggered')
          // Trigger timeout handler if trial is still active
          if (trialDataRef.current && trialStartTime) {
            handleTimeout()
          }
          return 0
        }
        return next
      })
    }, 100)
    
    return () => {
      clearInterval(interval)
      console.log('[FittsTask] Timer interval cleared')
    }
  }, [pressureEnabled, showStart, targetPos, timeout, handleTimeout])

  // QC telemetry: visibility and focus tracking
  useEffect(() => {
    if (!trialStartTime || showStart || !targetPos) {
      return
    }
    
    const handleVisibilityChange = () => {
      const now = performance.now()
      if (document.hidden) {
        // Tab hidden
        if (qcTelemetryRef.current.tab_hidden_start === null) {
          qcTelemetryRef.current.tab_hidden_start = now
          qcTelemetryRef.current.tab_hidden_count++
        }
      } else {
        // Tab visible again
        if (qcTelemetryRef.current.tab_hidden_start !== null) {
          const hiddenDuration = now - qcTelemetryRef.current.tab_hidden_start
          qcTelemetryRef.current.tab_hidden_total_ms += hiddenDuration
          qcTelemetryRef.current.tab_hidden_start = null
        }
      }
    }
    
    const handleBlur = () => {
      qcTelemetryRef.current.focus_blur_count++
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      
      // Finalize tab hidden time if still hidden
      if (qcTelemetryRef.current.tab_hidden_start !== null) {
        const now = performance.now()
        const hiddenDuration = now - qcTelemetryRef.current.tab_hidden_start
        qcTelemetryRef.current.tab_hidden_total_ms += hiddenDuration
        qcTelemetryRef.current.tab_hidden_start = null
      }
    }
  }, [trialStartTime, showStart, targetPos])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (hoverAnimationFrameRef.current) {
        cancelAnimationFrame(hoverAnimationFrameRef.current)
      }
      cleanupSystemCheck()
    }
  }, [])

  const handleResume = useCallback(() => {
    // Re-check display requirements (using same lenient thresholds as verifyGates)
    const zoom = getZoomPct()
    const fullscreen = isFullscreen()
    const currentDPR = typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1
    const storedInitialDPR = getInitialDPR()
    
    // Check if requirements are met (lenient thresholds)
    const violations: string[] = []
    
    // Allow zoom between 95-105% (browser zoom detection can be imprecise)
    if (zoom < 95 || zoom > 105) {
      violations.push(`Zoom is ${zoom}% (must be 95-105%, ideally 100%)`)
    }
    
    // Accept fullscreen or maximized windows
    if (!fullscreen) {
      violations.push('Not in fullscreen or maximized mode (press F11 or ⌃⌘F, or maximize window)')
    }
    
    // Only check DPR if it changes significantly (more than 0.1)
    // DPR can fluctuate slightly on some systems, so we're lenient here
    if (Math.abs(currentDPR - storedInitialDPR) > 0.1) {
      violations.push(`Device pixel ratio changed significantly (${storedInitialDPR} → ${currentDPR})`)
    }
    
    if (violations.length === 0) {
      // Requirements met - clear blocked state and resume
      clearBlocked()
      setIsPaused(false)
      setPauseReason('')
      console.log('[FittsTask] Display requirements met, resuming trial', { zoom, fullscreen, dpr: currentDPR, initialDPR: storedInitialDPR })
    } else {
      // Requirements not met - update message with specific violations
      const reason = `Display requirements still not met:\n${violations.join('\n')}\n\nPlease fix these issues and click Resume again.`
      setPauseReason(reason)
      console.log('[FittsTask] Display requirements not met:', violations, { zoom, fullscreen, dpr: currentDPR, initialDPR: storedInitialDPR })
    }
  }, [])

  return (
    <div className={`fitts-task ${agingEnabled ? 'aging-mode' : ''}`}>
      {/* Pause modal */}
      {isPaused && (
        <div className="pause-modal-overlay">
          <div className="pause-modal">
            <h3>Trial Paused</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{pauseReason}</p>
            <div className="pause-modal-actions">
              <button onClick={handleResume} className="resume-button">
                Resume Trial
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        className={`fitts-canvas ${modalityConfig.modality === Modality.GAZE ? 'gaze-mode' : 'hand-mode'}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        ref={canvasRef}
        onKeyDown={(e) => {
          // Prevent space key from scrolling the page in gaze mode
          if (modalityConfig.modality === Modality.GAZE && e.code === 'Space') {
            e.preventDefault()
          }
        }}
        tabIndex={-1}
      >
        {/* Gaze cursor indicator - visible cursor for gaze mode (only visible after mouse moves) */}
        {modalityConfig.modality === Modality.GAZE && cursorPos.x > 0 && cursorPos.y > 0 && (
          <div
            className="gaze-cursor-indicator"
            style={{
              position: 'absolute',
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
              transform: 'translate(-50%, -50%)',
              width: '12px',
              height: '12px',
              background: 'rgba(0, 217, 255, 0.8)',
              border: '2px solid #00ffff',
              borderRadius: '50%',
              pointerEvents: 'none',
              boxShadow: '0 0 10px rgba(0, 217, 255, 0.6)',
              zIndex: 1000,
              transition: 'none', // No transition for smooth following
              opacity: 1,
            }}
            title={`Gaze cursor: (${cursorPos.x.toFixed(0)}, ${cursorPos.y.toFixed(0)})`}
          />
        )}
        {/* Error rate feedback removed from canvas - shown in HUD only to reduce distraction */}
        
        {/* Countdown overlay for pressure mode */}
        {pressureEnabled && !showStart && targetPos && (
          <div 
            className={`countdown-overlay ${countdown <= 3 ? 'warning' : countdown <= 6 ? 'urgent' : ''}`}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '1rem 1.5rem',
              background: countdown <= 3 
                ? 'rgba(255, 68, 68, 0.95)' 
                : countdown <= 6 
                  ? 'rgba(255, 140, 0, 0.95)'
                  : 'rgba(255, 204, 0, 0.95)',
              color: '#000',
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'Courier New, monospace',
              borderRadius: '8px',
              boxShadow: countdown <= 3
                ? '0 0 25px rgba(255, 68, 68, 0.9)'
                : countdown <= 6
                  ? '0 0 22px rgba(255, 140, 0, 0.7)'
                  : '0 0 20px rgba(255, 204, 0, 0.6)',
              border: countdown <= 3
                ? '3px solid rgba(255, 0, 0, 1)'
                : countdown <= 6
                  ? '3px solid rgba(255, 140, 0, 0.9)'
                  : '2px solid rgba(255, 170, 0, 0.8)',
              zIndex: 1000,
              pointerEvents: 'none',
              minWidth: '80px',
              textAlign: 'center',
            }}
          >
            {countdown.toFixed(1)}s
          </div>
        )}
        {showStart && (
          <div style={{ position: 'relative' }}>
            <button
              className={`fitts-start-button ${modalityConfig.modality === Modality.GAZE && gazeState.isHovering ? 'hovering' : ''}`}
              style={{
                left: `${startPos.x}px`,
                top: `${startPos.y}px`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation() // CRITICAL: Stop the background from hearing this click
                e.preventDefault() // Prevent text selection or other side effects
                startTrial() // Start the trial immediately
              }}
              onMouseDown={(e) => {
                // Also stop propagation on mousedown as a fallback
                e.stopPropagation()
              }}
            >
              START
            </button>
            {/* Gaze mode dwell progress for start button */}
            {modalityConfig.modality === Modality.GAZE &&
              modalityConfig.dwellTime > 0 &&
              gazeState.isHovering && (
                <div
                  className="dwell-progress"
                  style={{
                    position: 'absolute',
                    left: `${startPos.x - 60}px`,
                    top: `${startPos.y - 60}px`,
                    width: `${gazeState.dwellProgress * 120}px`,
                    height: `${gazeState.dwellProgress * 120}px`,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 217, 255, 0.3)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            {/* Gaze mode space confirmation indicator for start button */}
            {modalityConfig.modality === Modality.GAZE &&
              modalityConfig.dwellTime === 0 &&
              gazeState.isHovering && (
                <div
                  className="space-indicator"
                  style={{
                    position: 'absolute',
                    left: `${startPos.x}px`,
                    top: `${startPos.y - 80}px`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  Press SPACE
                </div>
              )}
          </div>
        )}
        
        {!showStart && targetPos && (
          <>
            <div
            className={`fitts-target ${gazeState.isHovering ? 'hovering' : ''} ${widthScale > 1.0 ? 'inflated' : ''}`}
            style={{
              left: `${targetPos.x}px`,
              top: `${targetPos.y}px`,
              width: `${effectiveWidth}px`,
              height: `${effectiveWidth}px`,
            }}
            ref={targetRef}
            >
              {/* Dwell progress indicator for gaze mode */}
              {modalityConfig.modality === Modality.GAZE &&
                modalityConfig.dwellTime > 0 &&
                gazeState.isHovering && (
                  <div
                    className="dwell-progress"
                    style={{
                      width: `${gazeState.dwellProgress * effectiveWidth}px`,
                      height: `${gazeState.dwellProgress * effectiveWidth}px`,
                    }}
                  />
                )}
            </div>
            
            {/* Confirmation indicator for gaze mode with Space */}
            {modalityConfig.modality === Modality.GAZE &&
              modalityConfig.dwellTime === 0 &&
              gazeState.isHovering && (
                <div
                  className="space-indicator"
                  style={{
                    left: `${targetPos.x}px`,
                    top: `${targetPos.y - effectiveWidth / 2 - 40}px`,
                  }}
                >
                  Press SPACE
                </div>
              )}
          </>
        )}
      </div>
      
      <div className="fitts-info">
        <div className="fitts-param">
          <span>Amplitude:</span> <strong>{config.A}px</strong>
        </div>
        <div className="fitts-param">
          <span>Width:</span> <strong>{config.W}px</strong>
          {widthScale > 1.0 && (
            <span className="scale-indicator"> (×{widthScale.toFixed(2)})</span>
          )}
        </div>
        <div className="fitts-param">
          <span>ID:</span> <strong>{config.ID.toFixed(2)} bits</strong>
        </div>
        <div className="fitts-param">
          <span>Trial (Block):</span>{' '}
          <strong>
            {trialContext.trialInBlock}/{trialContext.blockTrialCount}
          </strong>
        </div>
        <div className="fitts-param">
          <span>Trial (Global):</span>{' '}
          <strong>{trialContext.globalTrialNumber}</strong>
        </div>
        <div className="fitts-param">
          <span>Modality:</span> <strong>{modalityConfig.modality}</strong>
        </div>
        {modalityConfig.modality === Modality.GAZE && (
          <div className="fitts-param">
            <span>Dwell:</span>{' '}
            <strong>
              {modalityConfig.dwellTime === 0
                ? 'Space'
                : `${modalityConfig.dwellTime}ms`}
            </strong>
          </div>
        )}
      </div>
    </div>
  )
}
