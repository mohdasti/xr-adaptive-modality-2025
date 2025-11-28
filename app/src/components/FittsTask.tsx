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
  isPointInTarget,
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
  onTrialComplete,
  onTrialError,
  timeout = 10000,
}: FittsTaskProps) {
  // Suppress unused warning for future use
  void cameraEnabled
  
  // Debug: log modality config changes
  useEffect(() => {
    console.log('[FittsTask] Modality config:', {
      modality: modalityConfig.modality,
      dwellTime: modalityConfig.dwellTime,
      isGaze: modalityConfig.modality === Modality.GAZE,
    })
  }, [modalityConfig.modality, modalityConfig.dwellTime])
  
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
  const gazeAnimationFrameRef = useRef<number | null>(null) // Separate ref for gaze smoothing
  const hoverAnimationFrameRef = useRef<number | null>(null) // Separate ref for hover detection
  const trialDataRef = useRef<TrialData | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const targetRef = useRef<HTMLDivElement | null>(null)

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

  const handleTimeout = useCallback(() => {
    if (!trialDataRef.current) return
    if (isPaused || isBlockedState()) return // Don't process if paused

    const trialData = trialDataRef.current
    const metrics = getSpatialMetrics(null)
    const displayMetrics = getDisplayMetrics()
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
    })

    onTrialError('timeout')
  }, [getSpatialMetrics, onTrialError, isPaused])

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
        })
        
        // Clear trial start time to prevent duplicate completions
        setTrialStartTime(null)
        onTrialComplete()
      } else {
        // Miss or slip
        const errorType = isClick ? 'miss' : 'slip'
        const metrics = getSpatialMetrics(clickPos)
        const displayMetrics = getDisplayMetrics()

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

  // Gaze mode: mouse move handler
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (modalityConfig.modality !== Modality.GAZE) return
      if (showStart || !targetPos) return
      
      const rect = event.currentTarget.getBoundingClientRect()
      const pos: Position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
      
      setCursorPos(pos)
    },
    [modalityConfig.modality, showStart, targetPos]
  )

  // Track mouse position globally (for gaze mode and alignment gate)
  const mousePosRef = useRef<Position>({ x: 0, y: 0 })
  
  // Gaze proxy: smoothed cursor position (for simulating eye-tracking characteristics)
  const smoothedGazePosRef = useRef<Position>({ x: 0, y: 0 })
  const rawMousePosRef = useRef<Position>({ x: 0, y: 0 })
  
  // Linear interpolation helper (lerp)
  const lerp = useCallback((a: number, b: number, t: number): number => {
    return a + (b - a) * t
  }, [])
  
  // Gaussian noise generator (for simulating microsaccades)
  const gaussianNoise = useCallback((): number => {
    // Box-Muller transform for Gaussian distribution
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return z0
  }, [])
  
  // Update mouse position on move (for gaze mode and alignment gate)
  useEffect(() => {
    const needsMouseTracking =
      modalityConfig.modality === Modality.GAZE ||
      (alignmentGateEnabled && modalityConfig.modality === Modality.HAND)
    
    if (!needsMouseTracking) return
    
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const rawPos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
      rawMousePosRef.current = rawPos
      
      // Debug: log mouse moves occasionally in gaze mode
      if (modalityConfig.modality === Modality.GAZE && Math.random() < 0.05) {
        console.log('[FittsTask] Mouse move (gaze mode):', rawPos)
      }
      
      // For hand mode, use raw position directly
      if (modalityConfig.modality === Modality.HAND) {
        mousePosRef.current = rawPos
        return
      }
      
      // For gaze mode, the smoothing loop will handle cursor updates
      // Don't update cursorPos here - let the smoothing loop do it for consistent jitter
    }
    
    window.addEventListener('mousemove', handleGlobalMouseMove)
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove)
  }, [modalityConfig.modality, alignmentGateEnabled])
  
  // Gaze mode: smoothing and jitter animation loop
  useEffect(() => {
    if (modalityConfig.modality !== Modality.GAZE) {
      // Reset smoothed position when not in gaze mode
      smoothedGazePosRef.current = { x: 0, y: 0 }
      setCursorPos({ x: 0, y: 0 })
      return
    }
    
    console.log('[FittsTask] Starting gaze smoothing loop')
    
    // Don't initialize to a fixed position - wait for mouse to move
    // Reset smoothed position to zero so we know it hasn't been initialized yet
    smoothedGazePosRef.current = { x: 0, y: 0 }
    
    const smoothingFactor = 0.15 // Lerp factor for smoothing (lower = more lag)
    const jitterStdDev = 2.0 // Standard deviation of jitter in pixels (simulates microsaccades)
    
    const updateGazeCursor = () => {
      const rawPos = rawMousePosRef.current
      const currentSmoothed = smoothedGazePosRef.current
      
      // Check if we haven't initialized yet (both are zero)
      const isInitialized = !(currentSmoothed.x === 0 && currentSmoothed.y === 0)
      
      if (!isInitialized) {
        // Wait for mouse to move before initializing
        if (rawPos.x > 0 || rawPos.y > 0) {
          console.log('[FittsTask] Initializing gaze cursor at mouse position:', rawPos)
          smoothedGazePosRef.current = rawPos
          mousePosRef.current = rawPos
          setCursorPos(rawPos)
          gazeAnimationFrameRef.current = requestAnimationFrame(updateGazeCursor)
          return
        } else {
          // Mouse hasn't moved yet - keep cursor invisible (at 0,0)
          gazeAnimationFrameRef.current = requestAnimationFrame(updateGazeCursor)
          return
        }
      }
      
      // If raw position is zero after initialization, something went wrong - reset
      if (rawPos.x === 0 && rawPos.y === 0) {
        gazeAnimationFrameRef.current = requestAnimationFrame(updateGazeCursor)
        return
      }
      
      // After initialization, apply smoothing and jitter
      // Linear interpolation (smoothing) - lag behind raw mouse
      const smoothedX = lerp(currentSmoothed.x, rawPos.x, smoothingFactor)
      const smoothedY = lerp(currentSmoothed.y, rawPos.y, smoothingFactor)
      
      // Add Gaussian noise (jitter) to simulate microsaccades
      const jitterX = gaussianNoise() * jitterStdDev
      const jitterY = gaussianNoise() * jitterStdDev
      
      // Final gaze position = smoothed + jitter
      const gazePos = {
        x: smoothedX + jitterX,
        y: smoothedY + jitterY,
      }
      
      smoothedGazePosRef.current = gazePos
      mousePosRef.current = gazePos // Use smoothed+jittered position for hit detection
      
      // Update display cursor (for visual feedback)
      setCursorPos(gazePos)
      
      // Debug: log position updates occasionally
      if (Math.random() < 0.01) { // Log ~1% of frames
        console.log('[FittsTask] Gaze cursor update:', {
          raw: rawPos,
          smoothed: { x: smoothedX.toFixed(1), y: smoothedY.toFixed(1) },
          jitter: { x: jitterX.toFixed(2), y: jitterY.toFixed(2) },
          final: gazePos
        })
      }
      
      gazeAnimationFrameRef.current = requestAnimationFrame(updateGazeCursor)
    }
    
    // Start the animation loop immediately
    gazeAnimationFrameRef.current = requestAnimationFrame(updateGazeCursor)
    
    return () => {
      console.log('[FittsTask] Stopping gaze smoothing loop')
      if (gazeAnimationFrameRef.current) {
        cancelAnimationFrame(gazeAnimationFrameRef.current)
        gazeAnimationFrameRef.current = null
      }
    }
  }, [modalityConfig.modality, lerp, gaussianNoise, canvasDimensions.width, canvasDimensions.height])

  // Gaze mode: update hover state
  useEffect(() => {
    if (modalityConfig.modality !== Modality.GAZE) {
      // Debug: log when not in gaze mode
      if (showStart === false && targetPos !== null) {
        console.log('[FittsTask] Not in gaze mode, modality:', modalityConfig.modality, 'dwellTime:', modalityConfig.dwellTime)
      }
      return
    }
    if (showStart || !targetPos) return
    
    console.log('[FittsTask] Starting gaze hover detection, dwellTime:', modalityConfig.dwellTime)
    
    const updateHover = () => {
      // Use the ref for current smoothed gaze position (always up-to-date)
      const currentMousePos = mousePosRef.current
      
      // Skip if position hasn't been initialized yet (wait for mouse to move)
      if (currentMousePos.x === 0 && currentMousePos.y === 0) {
        hoverAnimationFrameRef.current = requestAnimationFrame(updateHover)
        return
      }
      
      // Calculate distance to target for debugging
      const distance = Math.sqrt(
        Math.pow(currentMousePos.x - targetPos.x, 2) + 
        Math.pow(currentMousePos.y - targetPos.y, 2)
      )
      const targetRadius = effectiveWidth / 2
      const isHovering = distance <= targetRadius
      const currentTime = performance.now()
      
      
      setGazeState((prev) => {
        const newState = updateGazeState(
          prev,
          isHovering,
          currentTime,
          modalityConfig.dwellTime
        )
        
        // Debug: log hover state changes and progress
        if (isHovering !== prev.isHovering || (isHovering && newState.dwellProgress > 0 && Math.abs(newState.dwellProgress - prev.dwellProgress) > 0.1)) {
          console.log('[FittsTask] Hover update:', {
            isHovering,
            wasHovering: prev.isHovering,
            dwellProgress: newState.dwellProgress.toFixed(3),
            dwellTime: modalityConfig.dwellTime,
            hoverStartTime: newState.hoverStartTime,
            currentPos: currentMousePos,
            targetPos,
            effectiveWidth,
            targetRadius,
            distance: distance.toFixed(1),
            insideTarget: isHovering
          })
        }
        
        // Check if selection is complete (dwell-based)
        // Only auto-select if dwellTime > 0 (dwell mode, not confirmation mode)
        if (
          modalityConfig.dwellTime > 0 &&
          isGazeSelectionComplete(newState, modalityConfig.dwellTime, false)
        ) {
          console.log('[FittsTask] Dwell complete! Auto-selecting...', {
            dwellProgress: newState.dwellProgress,
            dwellTime: modalityConfig.dwellTime,
            isHovering: newState.isHovering,
            hoverStartTime: newState.hoverStartTime,
            elapsed: newState.hoverStartTime ? currentTime - newState.hoverStartTime : 0
          })
          completeSelection(currentMousePos, false)
          return prev // Don't update state, trial is ending
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
    targetPos,
    effectiveWidth,
    completeSelection,
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
        
        // Only handle selection if in confirmation mode (dwellTime === 0) and trial is active
        if (modalityConfig.dwellTime === 0 && !showStart && targetPos) {
          // Use current mouse position for hit detection
          const currentPos = mousePosRef.current
          const isHovering = isPointInTarget(currentPos, targetPos, effectiveWidth)
          
          console.log('[FittsTask] Space key - checking hover', {
            currentPos,
            targetPos,
            effectiveWidth,
            isHovering,
            gazeStateIsHovering: gazeState.isHovering
          })
          
          // Check if hovering over target (use both state and real-time check)
          if (isHovering || gazeState.isHovering) {
            console.log('[FittsTask] Space key - selecting target')
            completeSelection(currentPos, false)
          } else {
          // Premature confirmation (slip)
          if (trialDataRef.current) {
            const trialData = trialDataRef.current
            const timestamp = performance.now()
            const metrics = getSpatialMetrics(cursorPos)

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
            })
            onTrialError('slip')
          }
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
    // Don't cancel gazeAnimationFrameRef - let the smoothing loop keep running
    // It will re-initialize when mouse moves
    if (modalityConfig.modality === Modality.GAZE) {
      smoothedGazePosRef.current = { x: 0, y: 0 }
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
    // Don't cancel gazeAnimationFrameRef - smoothing loop should keep running
  }, [trialContext.trialInBlock, trialContext.globalTrialNumber, modalityConfig.dwellTime, timeout, modalityConfig.modality, canvasDimensions.width, canvasDimensions.height])

  // Reset cursor position when returning to start state (showStart becomes true)
  useEffect(() => {
    if (modalityConfig.modality === Modality.GAZE && showStart) {
      // Reset to uninitialized state - cursor will follow mouse when it moves
      // This ensures cursor doesn't get stuck at the last target position
      smoothedGazePosRef.current = { x: 0, y: 0 }
      mousePosRef.current = { x: 0, y: 0 }
      setCursorPos({ x: 0, y: 0 })
      console.log('[FittsTask] Reset gaze cursor for start state - waiting for mouse movement')
    }
  }, [showStart, modalityConfig.modality])

  // Countdown timer for pressure mode
  useEffect(() => {
    if (!pressureEnabled || showStart || !targetPos) return
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 0.1
        if (next <= 0) {
          clearInterval(interval)
          return 0
        }
        return next
      })
    }, 100)
    
    return () => clearInterval(interval)
  }, [pressureEnabled, showStart, targetPos])

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
      if (gazeAnimationFrameRef.current) {
        cancelAnimationFrame(gazeAnimationFrameRef.current)
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
        {/* Countdown overlay for pressure mode */}
        {pressureEnabled && !showStart && targetPos && (
          <div className={`countdown-overlay ${countdown <= 3 ? 'warning' : ''}`}>
            {countdown.toFixed(1)}s
          </div>
        )}
        {showStart && (
          <button
            className="fitts-start-button"
            style={{
              left: `${startPos.x}px`,
              top: `${startPos.y}px`,
            }}
          >
            START
          </button>
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
