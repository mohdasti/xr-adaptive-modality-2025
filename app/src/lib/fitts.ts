/**
 * Fitts's Law utilities and presets
 */

/**
 * Compute Index of Difficulty using Shannon formulation
 * ID = log2(A/W + 1)
 * @param A - Amplitude (distance to target in pixels)
 * @param W - Width (target size in pixels)
 * @returns Index of Difficulty in bits
 */
export function computeID(A: number, W: number): number {
  if (W <= 0) {
    throw new Error('Width (W) must be greater than 0')
  }
  if (A < 0) {
    throw new Error('Amplitude (A) must be non-negative')
  }
  return Math.log2(A / W + 1)
}

/**
 * Compute effective width from error rate
 * We = 4.133 * SDx (for 96% hits)
 * @param sdx - Standard deviation of selection coordinates
 * @returns Effective width in pixels
 */
export function computeEffectiveWidth(sdx: number): number {
  return 4.133 * sdx
}

/**
 * Compute throughput (bits/second)
 * TP = IDe / MT
 * @param ide - Effective index of difficulty
 * @param mt - Movement time in seconds
 * @returns Throughput in bits/second
 */
export function computeThroughput(ide: number, mt: number): number {
  if (mt <= 0) {
    throw new Error('Movement time must be greater than 0')
  }
  return ide / mt
}

/**
 * Task difficulty configuration
 */
export interface FittsConfig {
  A: number // Amplitude (distance in pixels)
  W: number // Width (target size in pixels)
  ID: number // Index of Difficulty (computed)
  label: string // Human-readable label
}

/**
 * Preset difficulty levels based on ISO 9241-9 recommendations
 */
export const DIFFICULTY_PRESETS: Record<string, FittsConfig> = {
  low: {
    A: 200,
    W: 80,
    ID: computeID(200, 80), // ~1.66 bits
    label: 'Low (ID ≈ 1.7)',
  },
  medium: {
    A: 400,
    W: 40,
    ID: computeID(400, 40), // ~3.32 bits
    label: 'Medium (ID ≈ 3.3)',
  },
  high: {
    A: 600,
    W: 20,
    ID: computeID(600, 20), // ~4.95 bits
    label: 'High (ID ≈ 5.0)',
  },
  veryHigh: {
    A: 800,
    W: 16,
    ID: computeID(800, 16), // ~5.64 bits
    label: 'Very High (ID ≈ 5.6)',
  },
}

/**
 * Standard ladder of difficulties for experimental blocks
 */
export const ladder: FittsConfig[] = [
  DIFFICULTY_PRESETS.low,
  DIFFICULTY_PRESETS.medium,
  DIFFICULTY_PRESETS.high,
]

/**
 * Generate a randomized sequence of trials
 * @param configs - Array of FittsConfig to sample from
 * @param trialsPerConfig - Number of trials per configuration
 * @param shuffle - Whether to shuffle the sequence
 * @returns Array of FittsConfig in trial order
 */
export function generateTrialSequence(
  configs: FittsConfig[],
  trialsPerConfig: number,
  shuffle: boolean = true
): FittsConfig[] {
  const sequence: FittsConfig[] = []
  
  for (const config of configs) {
    for (let i = 0; i < trialsPerConfig; i++) {
      sequence.push(config)
    }
  }
  
  if (shuffle) {
    // Fisher-Yates shuffle
    for (let i = sequence.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[sequence[i], sequence[j]] = [sequence[j], sequence[i]]
    }
  }
  
  return sequence
}

/**
 * Position for target placement
 */
export interface Position {
  x: number
  y: number
}

/**
 * Generate target positions in a circular layout around a center point
 * @param center - Center position
 * @param amplitude - Distance from center
 * @param numPositions - Number of positions around the circle
 * @returns Array of positions
 */
export function generateCircularPositions(
  center: Position,
  amplitude: number,
  numPositions: number = 8
): Position[] {
  const positions: Position[] = []
  const angleStep = (2 * Math.PI) / numPositions
  
  for (let i = 0; i < numPositions; i++) {
    const angle = i * angleStep
    positions.push({
      x: center.x + amplitude * Math.cos(angle),
      y: center.y + amplitude * Math.sin(angle),
    })
  }
  
  return positions
}

/**
 * Generate target positions in a grid layout
 * @param bounds - Canvas bounds {width, height}
 * @param margin - Margin from edges
 * @param gridSize - Grid dimensions {rows, cols}
 * @returns Array of positions
 */
export function generateGridPositions(
  bounds: { width: number; height: number },
  margin: number = 50,
  gridSize: { rows: number; cols: number } = { rows: 3, cols: 3 }
): Position[] {
  const positions: Position[] = []
  const { rows, cols } = gridSize
  
  const availableWidth = bounds.width - 2 * margin
  const availableHeight = bounds.height - 2 * margin
  
  const stepX = availableWidth / (cols - 1)
  const stepY = availableHeight / (rows - 1)
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push({
        x: margin + col * stepX,
        y: margin + row * stepY,
      })
    }
  }
  
  return positions
}

/**
 * Calculate distance between two positions
 */
export function distance(p1: Position, p2: Position): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

/**
 * Check if a point is within a circular target
 */
export function isHit(
  clickPos: Position,
  targetPos: Position,
  targetWidth: number
): boolean {
  const radius = targetWidth / 2
  return distance(clickPos, targetPos) <= radius
}

/**
 * Trial data structure
 */
export interface TrialData {
  trialId: string
  trialNumber: number
  globalTrialNumber: number
  trialInBlock: number
  blockNumber: number
  blockOrder: string
  blockTrialCount: number
  A: number
  W: number
  ID: number
  modality: string
  ui_mode: string
  pressure: number
  aging: boolean
  startPos: Position
  targetPos: Position
  timestamp: number
}

/**
 * Trial result structure
 */
export interface TrialResult extends TrialData {
  rt_ms: number
  clickPos: Position
  correct: boolean
  errorType?: 'miss' | 'timeout'
}

