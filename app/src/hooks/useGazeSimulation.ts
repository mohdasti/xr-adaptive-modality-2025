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
  /** Standard deviation of fixation noise in pixels (fixed, no adaptation). Default: 5.0 */
  fixationNoiseStdDev?: number
  /** Velocity threshold (deg/s) below which fixation noise is applied. Default: 30 */
  fixationVelocityThreshold?: number
  /** Velocity threshold (deg/s) above which saccadic suppression activates. Default: 120 */
  saccadeVelocityThreshold?: number
  /** Pixels per degree (for angular velocity calculation). Default: 60 */
  pixelsPerDegree?: number
  /** Whether to enable saccadic suppression. Default: true */
  enableSaccadicSuppression?: boolean
}

const DEFAULT_CONFIG: Required<Omit<GazeSimulationConfig, 'pixelsPerDegree'> & { pixelsPerDegree: number }> = {
  smoothingFactor: 0.15,
  fixationNoiseStdDev: 5.0, // Fixed noise for high-end eye tracker simulation (~0.12°)
  fixationVelocityThreshold: 30, // degrees/sec - below this, apply fixation noise
  saccadeVelocityThreshold: 120, // degrees/sec - above this, trigger saccadic suppression
  pixelsPerDegree: 60, // Default estimate (96 DPI at 60cm viewing distance)
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
    
    // Calculate velocity in pixels per second
    let velocityPx = 0
    if (previousRawPosRef.current) {
      velocityPx = calculateVelocity(
        previousRawPosRef.current,
        rawPosition,
        deltaTime
      )
    }
    
    // Convert to angular velocity (degrees per second)
    // Angular velocity is independent of screen resolution/DPI
    const pixelsPerDegree = finalConfig.pixelsPerDegree || DEFAULT_CONFIG.pixelsPerDegree
    const velocityDeg = velocityPx / pixelsPerDegree
    
    // Update previous raw position
    previousRawPosRef.current = { ...rawPosition }
    
    // Saccadic Suppression: Freeze cursor during rapid movement
    // Use angular velocity threshold (deg/s) instead of pixel velocity
    if (
      finalConfig.enableSaccadicSuppression &&
      velocityDeg > finalConfig.saccadeVelocityThreshold
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
    // Fixed noise level (no adaptation) to preserve Fitts' Law validity
    // Use angular velocity threshold (deg/s) instead of pixel velocity
    let finalX = smoothedX
    let finalY = smoothedY
    
    if (velocityDeg < finalConfig.fixationVelocityThreshold) {
      // Apply fixed fixation noise (drift/tremor)
      // No adaptive scaling - noise is constant to maintain scientific validity
      const noiseX = gaussianRandom(0, finalConfig.fixationNoiseStdDev)
      const noiseY = gaussianRandom(0, finalConfig.fixationNoiseStdDev)
      
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

