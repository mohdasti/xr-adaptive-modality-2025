import { useState, useEffect, useRef, useCallback } from 'react'
import { bus } from '../lib/bus'
import {
  FittsConfig,
  Position,
  TrialData,
  generateCircularPositions,
  isHit,
} from '../lib/fitts'
import {
  Modality,
  ModalityConfig,
  GazeState,
  createGazeState,
  updateGazeState,
  isGazeSelectionComplete,
  isPointInTarget,
} from '../lib/modality'
import { getPupilTracker } from '../lib/pupil'
import './FittsTask.css'

export interface FittsTaskProps {
  config: FittsConfig
  modalityConfig: ModalityConfig
  ui_mode: string
  pressure: number
  trialNumber: number
  widthScale?: number // Width inflation factor (default: 1.0)
  pressureEnabled?: boolean // Show countdown timer
  agingEnabled?: boolean // Apply aging visual effects
  cameraEnabled?: boolean // Enable pupil tracking
  onTrialComplete: () => void
  onTrialError: (errorType: 'miss' | 'timeout' | 'slip') => void
  timeout?: number // milliseconds
}

export function FittsTask({
  config,
  modalityConfig,
  ui_mode,
  pressure,
  trialNumber,
  widthScale = 1.0,
  pressureEnabled = false,
  agingEnabled = false,
  cameraEnabled = false,
  onTrialComplete,
  onTrialError,
  timeout = 10000,
}: FittsTaskProps) {
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
  const [pupilZScore, setPupilZScore] = useState(0)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const trialDataRef = useRef<TrialData | null>(null)
  const pupilTrackerRef = useRef<ReturnType<typeof getPupilTracker> | null>(null)

  // Generate possible target positions
  const targetPositions = useRef(
    generateCircularPositions(startPos, config.A, 8)
  )

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
      trialNumber,
      A: config.A,
      W: config.W,
      ID: config.ID,
      modality: modalityConfig.modality,
      ui_mode,
      pressure,
      startPos,
      targetPos: target,
      timestamp: startTime,
    }
    
    trialDataRef.current = trialData
    
    // Emit trial start event
    bus.emit('trial:start', {
      trialId,
      trial: trialNumber,
      A: config.A,
      W: config.W,
      ID: config.ID,
      modality: modalityConfig.modality,
      ui_mode,
      pressure,
      timestamp: startTime,
    })
    
    // Set timeout
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        handleTimeout()
      }, timeout)
    }
  }, [config, modalityConfig, ui_mode, pressure, trialNumber, timeout, startPos])

  const handleTimeout = useCallback(() => {
    if (!trialDataRef.current) return
    
    bus.emit('trial:error', {
      trialId: trialDataRef.current.trialId,
      error: 'timeout',
      err_type: 'timeout',
      timestamp: Date.now(),
    })
    
    onTrialError('timeout')
  }, [onTrialError])

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
      
      const hit = isHit(clickPos, targetPos, effectiveWidth)
      
      if (hit) {
        // Success
        bus.emit('trial:end', {
          trialId: trialDataRef.current.trialId,
          trial: trialNumber,
          rt_ms,
          duration: rt_ms,
          correct: true,
          A: config.A,
          W: config.W,
          ID: config.ID,
          clickPos,
          targetPos,
          modality: modalityConfig.modality,
          timestamp: endTime,
        })
        
        onTrialComplete()
      } else {
        // Miss or slip
        const errorType = isClick ? 'miss' : 'slip'
        bus.emit('trial:error', {
          trialId: trialDataRef.current.trialId,
          error: errorType,
          err_type: errorType,
          rt_ms,
          clickPos,
          targetPos,
          timestamp: endTime,
        })
        
        onTrialError(errorType)
      }
    },
    [trialStartTime, targetPos, config, trialNumber, modalityConfig, onTrialComplete, onTrialError]
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
            bus.emit('trial:error', {
              trialId: trialDataRef.current.trialId,
              error: 'slip',
              err_type: 'slip',
              clickPos: cursorPos,
              targetPos,
              timestamp: Date.now(),
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
          <span>Trial:</span> <strong>{trialNumber}</strong>
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
