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
  timeout = 10000,
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
  
  // Error rate feedback from HUD (for canvas overlay)
  const [errorRateFeedback, setErrorRateFeedback] = useState<{
    message: string | null
    color: string | null
    icon: string | null
    errorRate: number | null
    blockErrors: number | null
    totalBlockTrials: number | null
  } | null>(null)
  
  // Alignment gate state (P1 experimental feature)
  const alignmentGateEnabled = isAlignmentGateEnabled()
  const [pointerDown, setPointerDown] = useState(false)
  const [_pointerDownTime, setPointerDownTime] = useState<number | null>(null)
  const [hoverStartTime, setHoverStartTime] = useState<number | null>(null)
  const [_isHoveringTarget, setIsHoveringTarget] = useState(false)
  const [_falseTriggerCount, setFalseTriggerCount] = useState(0)
  const [recoveryStartTime, setRecoveryStartTime] = useState<number | null>(null)
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
  
  // FPS tracking for data quality
  const fpsTrackingRef = useRef<{
    frameTimes: number[]
    lastFrameTime: number | null
  }>({
    frameTimes: [],
    lastFrameTime: null,
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

    const endpointError =
      endpoint && targetCenter ? distanceBetweenPoints(endpoint, targetCenter) : null

    return {
      endpoint,
      targetCenter,
      endpointError,
    }
    },
    [targetPos]
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

  const handleTimeout = useCallback(() => {
    if (!trialDataRef.current) return
    if (isPaused || isBlockedState()) return // Don't process if paused

    const trialData = trialDataRef.current
    const metrics = getSpatialMetrics(null)
    const displayMetrics = getDisplayMetrics()
    const avgFPS = calculateAverageFPS()
    const timestamp = performance.now()

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
    })

    onTrialError('timeout')
  }, [getSpatialMetrics, onTrialError, isPaused, calculateAverageFPS, isPractice])

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
      
      const startTime = performance.now()
      setTrialStartTime(startTime)
      
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
      
      const hit = isHit(clickPos, targetPos, effectiveWidth)
      
      if (hit) {
        const metrics = getSpatialMetrics(clickPos)
        const displayMetrics = getDisplayMetrics()
        const avgFPS = calculateAverageFPS()

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
        })
        
        // Clear trial start time to prevent duplicate completions
        setTrialStartTime(null)
        onTrialComplete()
      } else {
        // Miss or slip
        const errorType = isClick ? 'miss' : 'slip'
        const metrics = getSpatialMetrics(clickPos)
        const displayMetrics = getDisplayMetrics()
        const avgFPS = calculateAverageFPS()

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
        })
        
        // Clear trial start time to prevent duplicate completions
        setTrialStartTime(null)
        onTrialError(errorType)
      }
    },
    [trialStartTime, targetPos, onTrialComplete, onTrialError, effectiveWidth, getSpatialMetrics, getConfirmType, isPaused]
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
  
  // Load calibration data for normalized jitter
  const [calibrationData, setCalibrationData] = useState<{
    pixelsPerMM: number
    pixelsPerDegree: number
  } | null>(null)
  
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
    fixationVelocityThreshold: 50,
    saccadeVelocityThreshold: 2000, // Increased to prevent false freezes in mouse simulation
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
            const metrics = getSpatialMetrics(cursorPos)
            const avgFPS = calculateAverageFPS()

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
              rt_ms: timestamp - trialData.timestamp,
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
              // Practice and FPS tracking
              practice: isPractice,
              avg_fps: avgFPS,
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
  
  // Listen for error rate feedback updates from HUD
  useEffect(() => {
    const handleErrorRateUpdate = (payload: {
      message: string | null
      color: string | null
      icon: string | null
      errorRate: number | null
      blockErrors: number | null
      totalBlockTrials: number | null
    }) => {
      if (payload.message) {
        setErrorRateFeedback({
          message: payload.message,
          color: payload.color || '#ffc107',
          icon: payload.icon || '•',
          errorRate: payload.errorRate || 0,
          blockErrors: payload.blockErrors || 0,
          totalBlockTrials: payload.totalBlockTrials || 0,
        })
      } else {
        setErrorRateFeedback(null)
      }
    }
    
    const unsubscribe = bus.on('error-rate:update', handleErrorRateUpdate)
    return () => unsubscribe()
  }, [])
  
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
        {/* Error Rate Feedback Overlay - Prominent on canvas, but only between trials (when START is visible) */}
        {errorRateFeedback && errorRateFeedback.message && errorRateFeedback.color && showStart && (
          <div
            style={{
              position: 'absolute',
              top: '20px', // Near top-left, but only when no target is present
              left: '20px',
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              border: `3px solid ${errorRateFeedback.color}`,
              backgroundColor: `${errorRateFeedback.color}20`, // 20 hex = ~12% opacity
              color: errorRateFeedback.color,
              fontSize: '1.5rem',
              fontWeight: 700,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              boxShadow: `0 0 20px ${errorRateFeedback.color}80`,
              zIndex: 1000,
              pointerEvents: 'none',
              minWidth: '280px',
              textAlign: 'center',
              animation: errorRateFeedback.errorRate && errorRateFeedback.errorRate > 10 
                ? 'error-pulse 1s ease-in-out infinite' 
                : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.8rem' }}>{errorRateFeedback.icon || '•'}</span>
              <span>{errorRateFeedback.message}</span>
            </div>
            <div style={{ 
              fontSize: '0.875rem', 
              marginTop: '0.5rem', 
              fontWeight: '400', 
              opacity: 0.9,
              color: errorRateFeedback.color 
            }}>
              {errorRateFeedback.blockErrors} errors / {errorRateFeedback.totalBlockTrials} trials = {errorRateFeedback.errorRate?.toFixed(1)}%
            </div>
          </div>
        )}
        
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
