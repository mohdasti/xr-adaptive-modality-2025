/**
 * useGazeSimulation - Physiologically-accurate gaze simulation hook
 * 
 * Simulates human eye tracking behavior with:
 * - Fixation noise (drift/tremor) when relatively still
 * - Saccadic suppression (freeze during rapid movement)
 * - Smoothing (damping) to trail the raw input
 * 
 * Based on physiological constraints of the human eye:
 * - Eyes cannot hold perfectly still (fixation instability)
 * - Eyes are "blind" during saccades (rapid ballistic movements)
 * - Eye tracking has processing latency
 */

import { useState, useEffect, useRef, useCallback } from 'react'

export interface Position {
  x: number
  y: number
}

export interface GazeSimulationConfig {
  /** Lerp factor for smoothing (0-1, lower = more lag). Default: 0.15 */
  smoothingFactor?: number
  /** Base standard deviation of fixation noise in pixels. Default: 3.5 (reduced for better dwell accuracy) */
  fixationNoiseStdDev?: number
  /** Velocity threshold (px/s) below which fixation noise is applied. Default: 50 */
  fixationVelocityThreshold?: number
  /** Velocity threshold (px/s) above which saccadic suppression activates. Default: 1000 */
  saccadeVelocityThreshold?: number
  /** Whether to enable saccadic suppression. Default: true */
  enableSaccadicSuppression?: boolean
  /** Target size in pixels (for adaptive noise scaling). If provided, noise scales down for smaller targets */
  targetSize?: number
  /** Target position (for adaptive noise scaling near target). If provided, noise reduces when near target */
  targetPosition?: Position | null
}

const DEFAULT_CONFIG: Required<Omit<GazeSimulationConfig, 'targetSize' | 'targetPosition'>> = {
  smoothingFactor: 0.15,
  fixationNoiseStdDev: 3.5, // Reduced from 7.5 for better dwell accuracy on small targets
  fixationVelocityThreshold: 50,
  saccadeVelocityThreshold: 1000,
  enableSaccadicSuppression: true,
}

/**
 * Generate Gaussian random number using Box-Muller transform
 * @param mean - Mean of the distribution
 * @param stdev - Standard deviation of the distribution
 * @returns Normally distributed random number
 */
function gaussianRandom(mean = 0, stdev = 1): number {
  const u = 1 - Math.random() // Avoid log(0)
  const v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return z * stdev + mean
}

/**
 * Calculate velocity between two positions over a time delta
 * @param pos1 - Previous position
 * @param pos2 - Current position
 * @param deltaTime - Time difference in milliseconds
 * @returns Velocity in pixels per second
 */
function calculateVelocity(
  pos1: Position,
  pos2: Position,
  deltaTime: number
): number {
  if (deltaTime <= 0) return 0
  
  const dx = pos2.x - pos1.x
  const dy = pos2.y - pos1.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const velocity = (distance / deltaTime) * 1000 // Convert to px/s
  
  return velocity
}

/**
 * Linear interpolation between two values
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Custom hook for simulating physiologically-accurate gaze behavior
 * 
 * @param rawPosition - Current raw mouse/trackpad position
 * @param enabled - Whether the simulation is active
 * @param config - Configuration options
 * @returns Object containing simulated position ref and state
 */
export function useGazeSimulation(
  rawPosition: Position | null,
  enabled: boolean,
  config: GazeSimulationConfig = {}
): {
  simulatedPosition: React.MutableRefObject<Position>
  displayPosition: Position
  isSaccading: boolean
} {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Internal state
  const simulatedPosRef = useRef<Position>({ x: 0, y: 0 })
  const previousRawPosRef = useRef<Position | null>(null)
  const previousTimeRef = useRef<number>(performance.now())
  const isSaccadingRef = useRef<boolean>(false)
  const frozenPosRef = useRef<Position | null>(null)
  
  // Display state (for React rendering)
  const [displayPosition, setDisplayPosition] = useState<Position>({ x: 0, y: 0 })
  const [isSaccading, setIsSaccading] = useState<boolean>(false)
  
  // Check if position is initialized (not at origin)
  const isInitialized = useCallback((pos: Position): boolean => {
    return !(pos.x === 0 && pos.y === 0)
  }, [])
  
  // Main simulation loop
  useEffect(() => {
    if (!enabled || !rawPosition) {
      // Reset when disabled
      simulatedPosRef.current = { x: 0, y: 0 }
      setDisplayPosition({ x: 0, y: 0 })
      setIsSaccading(false)
      isSaccadingRef.current = false
      previousRawPosRef.current = null
      frozenPosRef.current = null
      return
    }
    
    // Initialize on first valid position
    if (!isInitialized(simulatedPosRef.current) && isInitialized(rawPosition)) {
      simulatedPosRef.current = { ...rawPosition }
      previousRawPosRef.current = { ...rawPosition }
      previousTimeRef.current = performance.now()
      setDisplayPosition({ ...rawPosition })
      return
    }
    
    // Skip if not initialized yet
    if (!isInitialized(simulatedPosRef.current)) {
      return
    }
    
    const currentTime = performance.now()
    const deltaTime = currentTime - previousTimeRef.current
    previousTimeRef.current = currentTime
    
    // Calculate velocity
    let velocity = 0
    if (previousRawPosRef.current) {
      velocity = calculateVelocity(
        previousRawPosRef.current,
        rawPosition,
        deltaTime
      )
    }
    
    // Update previous raw position
    previousRawPosRef.current = { ...rawPosition }
    
    // Saccadic Suppression: Freeze cursor during rapid movement
    if (
      finalConfig.enableSaccadicSuppression &&
      velocity > finalConfig.saccadeVelocityThreshold
    ) {
      // Entering saccade - freeze at current position
      if (!isSaccadingRef.current) {
        frozenPosRef.current = { ...simulatedPosRef.current }
        isSaccadingRef.current = true
        setIsSaccading(true)
      }
      
      // Keep frozen position during saccade
      if (frozenPosRef.current) {
        simulatedPosRef.current = { ...frozenPosRef.current }
        setDisplayPosition({ ...frozenPosRef.current })
        return
      }
    } else {
      // Exiting saccade - snap to new position
      if (isSaccadingRef.current) {
        // Snap to current raw position (saccade complete)
        simulatedPosRef.current = { ...rawPosition }
        frozenPosRef.current = null
        isSaccadingRef.current = false
        setIsSaccading(false)
        setDisplayPosition({ ...rawPosition })
        return
      }
    }
    
    // Normal movement: Apply smoothing (damping)
    const smoothedX = lerp(
      simulatedPosRef.current.x,
      rawPosition.x,
      finalConfig.smoothingFactor
    )
    const smoothedY = lerp(
      simulatedPosRef.current.y,
      rawPosition.y,
      finalConfig.smoothingFactor
    )
    
    // Fixation Noise: Add Gaussian noise when relatively still
    // Adaptive noise scaling: reduce noise for smaller targets and when near target
    let finalX = smoothedX
    let finalY = smoothedY
    
    if (velocity < finalConfig.fixationVelocityThreshold) {
      // Calculate adaptive noise scale based on target size and proximity
      let noiseScale = 1.0
      
      if (config.targetSize !== undefined && config.targetSize > 0) {
        // Scale noise based on target size: smaller targets get less noise
        // For targets < 30px, scale noise down significantly
        // For targets >= 30px, use full noise
        const minTargetSize = 30 // pixels
        if (config.targetSize < minTargetSize) {
          // Scale noise proportionally: 10px target gets ~33% noise, 20px gets ~67%
          noiseScale = Math.max(0.2, config.targetSize / minTargetSize)
        }
      }
      
      // Further reduce noise when near/over the target
      if (config.targetPosition) {
        const dx = smoothedX - config.targetPosition.x
        const dy = smoothedY - config.targetPosition.y
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy)
        const targetRadius = (config.targetSize && config.targetSize > 0) ? config.targetSize / 2 : 20
        
        // If within 1.5x target radius, reduce noise further
        if (distanceToTarget < targetRadius * 1.5) {
          // Scale noise down linearly: at target center (0 distance) = 0.3x, at 1.5x radius = 1.0x
          const proximityScale = 0.3 + (distanceToTarget / (targetRadius * 1.5)) * 0.7
          noiseScale *= proximityScale
        }
      }
      
      // Apply fixation noise (drift/tremor) with adaptive scaling
      const adaptiveNoiseStdDev = finalConfig.fixationNoiseStdDev * noiseScale
      const noiseX = gaussianRandom(0, adaptiveNoiseStdDev)
      const noiseY = gaussianRandom(0, adaptiveNoiseStdDev)
      
      finalX = smoothedX + noiseX
      finalY = smoothedY + noiseY
    }
    
    // Update simulated position
    simulatedPosRef.current = { x: finalX, y: finalY }
    setDisplayPosition({ x: finalX, y: finalY })
  }, [rawPosition, enabled, finalConfig, isInitialized])
  
  // Animation frame loop for continuous updates
  useEffect(() => {
    if (!enabled || !rawPosition) return
    
    let animationFrameId: number
    
    const updateLoop = () => {
      // The position updates are handled by the effect above
      // This loop ensures smooth rendering at 60/120Hz
      animationFrameId = requestAnimationFrame(updateLoop)
    }
    
    animationFrameId = requestAnimationFrame(updateLoop)
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [enabled, rawPosition])
  
  return {
    simulatedPosition: simulatedPosRef,
    displayPosition,
    isSaccading,
  }
}

