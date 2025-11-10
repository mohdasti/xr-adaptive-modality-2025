import { useState, useEffect, useRef, useCallback } from 'react'
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
  // Apply width scaling
  const effectiveWidth = config.W * widthScale
  const [startPos] = useState<Position>({ x: 400, y: 300 }) // Center of canvas
  const [targetPos, setTargetPos] = useState<Position | null>(null)
  const [trialStartTime, setTrialStartTime] = useState<number | null>(null)
  const [showStart, setShowStart] = useState(true)
  const [cursorPos, setCursorPos] = useState<Position>({ x: 0, y: 0 })
  const [gazeState, setGazeState] = useState<GazeState>(
    createGazeState(modalityConfig.dwellTime)
  )
  const [countdown, setCountdown] = useState<number>(timeout / 1000)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
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

    const trialData = trialDataRef.current
    const metrics = getSpatialMetrics(null)
    const timestamp = Date.now()

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
      modality: trialData.modality,
      ui_mode: trialData.ui_mode,
      pressure: trialData.pressure,
      aging: trialData.aging,
      targetPos: trialData.targetPos,
      target_center_x: metrics.targetCenter?.x ?? null,
      target_center_y: metrics.targetCenter?.y ?? null,
      endpoint_x: metrics.endpoint?.x ?? null,
      endpoint_y: metrics.endpoint?.y ?? null,
      endpoint_error_px: metrics.endpointError ?? null,
      timestamp,
    })

    onTrialError('timeout')
  }, [getSpatialMetrics, onTrialError])

  // Generate possible target positions
  const targetPositions = useRef(
    generateCircularPositions(startPos, config.A, 8)
  )
  
  // Shuffle target positions when block number changes
  useEffect(() => {
    if (trialContext.blockNumber > 0) {
      const positions = generateCircularPositions(startPos, config.A, 8)
      targetPositions.current = shuffle(positions)
    }
  }, [trialContext.blockNumber, startPos, config.A])

  const startTrial = useCallback(() => {
    // Select random target position
    const randomIndex = Math.floor(Math.random() * targetPositions.current.length)
    const target = targetPositions.current[randomIndex]
    
    setTargetPos(target)
    setShowStart(false)
    setGazeState(createGazeState(modalityConfig.dwellTime))
    setCountdown(timeout / 1000)
    
    const startTime = Date.now()
    setTrialStartTime(startTime)
    
    // Create trial data
    const trialId = `trial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
      timestamp: startTime,
    })
    
    // Set timeout
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        handleTimeout()
      }, timeout)
    }
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

  const completeSelection = useCallback(
    (clickPos: Position, isClick: boolean = false) => {
      if (!trialStartTime || !targetPos || !trialDataRef.current) return
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      
      const endTime = Date.now()
      const rt_ms = endTime - trialStartTime
      const trialData = trialDataRef.current
      const confirmType = getConfirmType(isClick)
      
      const hit = isHit(clickPos, targetPos, effectiveWidth)
      
      if (hit) {
        const metrics = getSpatialMetrics(clickPos)

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
          confirm_type: confirmType,
          timestamp: endTime,
        })
        
        onTrialComplete()
      } else {
        // Miss or slip
        const errorType = isClick ? 'miss' : 'slip'
        const metrics = getSpatialMetrics(clickPos)

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
          A: trialData.A,
          W: trialData.W,
          ID: trialData.ID,
          index_of_difficulty_nominal: trialData.ID,
          target_distance_A: trialData.A,
          confirm_type: confirmType,
          timestamp: endTime,
        })
        
        onTrialError(errorType)
      }
    },
    [trialStartTime, targetPos, onTrialComplete, onTrialError, effectiveWidth, getSpatialMetrics, getConfirmType]
  )

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
      } else if (targetPos && modalityConfig.modality === Modality.HAND) {
        // Hand mode: direct click
        completeSelection(clickPos, true)
      }
    },
    [showStart, startPos, targetPos, modalityConfig.modality, startTrial, completeSelection]
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

  // Gaze mode: update hover state
  useEffect(() => {
    if (modalityConfig.modality !== Modality.GAZE) return
    if (showStart || !targetPos) return
    
    const updateHover = () => {
      const isHovering = isPointInTarget(cursorPos, targetPos, effectiveWidth)
      const currentTime = Date.now()
      
      setGazeState((prev) => {
        const newState = updateGazeState(
          prev,
          isHovering,
          currentTime,
          modalityConfig.dwellTime
        )
        
        // Check if selection is complete (dwell-based)
        if (
          modalityConfig.dwellTime > 0 &&
          isGazeSelectionComplete(newState, modalityConfig.dwellTime, false)
        ) {
          completeSelection(cursorPos, false)
          return prev // Don't update state, trial is ending
        }
        
        return newState
      })
      
      animationFrameRef.current = requestAnimationFrame(updateHover)
    }
    
    animationFrameRef.current = requestAnimationFrame(updateHover)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [
    modalityConfig.modality,
    modalityConfig.dwellTime,
    showStart,
    targetPos,
    cursorPos,
    effectiveWidth,
    completeSelection,
  ])

  // Gaze mode: space key handler
  useEffect(() => {
    if (modalityConfig.modality !== Modality.GAZE) return
    if (modalityConfig.dwellTime > 0) return // Only for confirmation mode
    if (showStart || !targetPos) return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        
        // Check if hovering over target
        if (gazeState.isHovering) {
          completeSelection(cursorPos, false)
        } else {
          // Premature confirmation (slip)
          if (trialDataRef.current) {
            const trialData = trialDataRef.current
            const timestamp = Date.now()
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
              confirm_type: getConfirmType(false),
              timestamp,
            })
            onTrialError('slip')
          }
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
  ])

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
    }
  }, [])

  return (
    <div className={`fitts-task ${agingEnabled ? 'aging-mode' : ''}`}>
      <div
        className={`fitts-canvas ${modalityConfig.modality === Modality.GAZE ? 'gaze-mode' : 'hand-mode'}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        ref={canvasRef}
      >
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
                      width: `${gazeState.dwellProgress * 100}%`,
                      height: `${gazeState.dwellProgress * 100}%`,
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
