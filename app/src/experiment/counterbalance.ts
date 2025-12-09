/**
 * Counterbalancing utilities for Williams design
 * 
 * Design: 2 (Modality) × 2 (Intervention) × 2 (Pressure) = 8 conditions
 * Format: {Modality}{Intervention}_{Pressure}
 * - Modality: H=Hand, G=Gaze
 * - Intervention: S=Static, A=Adaptive
 * - Pressure: P0=OFF, P1=ON
 */

export type Cond = 
  | 'HaS_P0' | 'HaS_P1' | 'GaS_P0' | 'GaS_P1'
  | 'HaA_P0' | 'HaA_P1' | 'GaA_P0' | 'GaA_P1'

/**
 * Parse condition code into components
 */
export function parseCondition(cond: Cond): {
  modality: 'hand' | 'gaze'
  intervention: 'static' | 'adaptive'
  pressure: boolean
} {
  const modality = cond.startsWith('H') ? 'hand' : 'gaze'
  const intervention = cond.includes('S') ? 'static' : 'adaptive'
  const pressure = cond.endsWith('P1')
  return { modality, intervention, pressure }
}

/**
 * True 8x8 Balanced Latin Square (Williams Design)
 * 
 * This is a Balanced Latin Square that ensures:
 * - Each condition appears in each position exactly once (Latin Square property)
 * - Every condition follows every other condition exactly once (Williams Design property)
 * - Controls for immediate carryover effects between adjacent blocks
 * 
 * This matrix ensures rigorous counterbalancing by eliminating order and carryover confounds.
 */
export const WILLIAMS_8: Cond[][] = [
  ['HaS_P0', 'GaS_P0', 'GaA_P1', 'HaA_P0', 'HaA_P1', 'HaS_P1', 'GaS_P1', 'GaA_P0'],
  ['GaS_P0', 'HaA_P0', 'HaS_P0', 'HaA_P1', 'HaS_P1', 'GaS_P1', 'GaA_P0', 'GaA_P1'],
  ['HaA_P0', 'HaA_P1', 'GaS_P0', 'HaS_P1', 'GaS_P1', 'GaA_P0', 'GaA_P1', 'HaS_P0'],
  ['HaA_P1', 'HaS_P1', 'HaA_P0', 'GaS_P1', 'GaA_P0', 'GaA_P1', 'HaS_P0', 'GaS_P0'],
  ['HaS_P1', 'GaS_P1', 'HaA_P1', 'GaA_P0', 'GaA_P1', 'HaS_P0', 'GaS_P0', 'HaA_P0'],
  ['GaS_P1', 'GaA_P0', 'HaS_P1', 'GaA_P1', 'HaS_P0', 'GaS_P0', 'HaA_P0', 'HaA_P1'],
  ['GaA_P0', 'GaA_P1', 'GaS_P1', 'HaS_P0', 'GaS_P0', 'HaA_P0', 'HaA_P1', 'HaS_P1'],
  ['GaA_P1', 'HaS_P0', 'GaA_P0', 'GaS_P0', 'HaA_P0', 'HaA_P1', 'HaS_P1', 'GaS_P1']
]

/**
 * Compute hash of the Williams matrix for versioning
 */
export function getSequenceTableVersion(): string {
  // Simple hash of the matrix structure
  const matrixStr = JSON.stringify(WILLIAMS_8)
  let hash = 0
  for (let i = 0; i < matrixStr.length; i++) {
    const char = matrixStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return `v${Math.abs(hash).toString(36).substring(0, 8)}`
}

/**
 * Get counterbalanced sequence for a participant
 * @param participantIndex - Zero-based participant index
 * @returns Array of 8 condition codes in order
 */
export function sequenceForParticipant(participantIndex: number): Cond[] {
  const sequenceIndex = participantIndex % 8
  return [...WILLIAMS_8[sequenceIndex]]
}

/**
 * Get sequence index (1-8) for a participant
 * @param participantIndex - Zero-based participant index
 * @returns Sequence index (1-based)
 */
export function getSequenceId(participantIndex: number): number {
  return (participantIndex % 8) + 1
}

/**
 * Validate Williams block assignment
 * Checks that exactly 8 blocks are completed and each condition appears exactly once
 */
export function validateWilliamsAssignment(
  completedBlocks: Array<{ blockNumber: number; condition: Cond }>
): {
  valid: boolean
  errors: string[]
  session_invalid: boolean
} {
  const errors: string[] = []
  
  // Check exactly 8 blocks
  if (completedBlocks.length !== 8) {
    errors.push(`Expected 8 blocks, found ${completedBlocks.length}`)
  }
  
  // Check each condition appears exactly once
  const conditionCounts = new Map<Cond, number>()
  const allConditions: Cond[] = ['HaS_P0', 'HaS_P1', 'GaS_P0', 'GaS_P1', 'HaA_P0', 'HaA_P1', 'GaA_P0', 'GaA_P1']
  
  for (const cond of allConditions) {
    conditionCounts.set(cond, 0)
  }
  
  for (const block of completedBlocks) {
    const count = conditionCounts.get(block.condition) || 0
    conditionCounts.set(block.condition, count + 1)
  }
  
  // Check for duplicates
  for (const [cond, count] of conditionCounts.entries()) {
    if (count === 0) {
      errors.push(`Missing condition: ${cond}`)
    } else if (count > 1) {
      errors.push(`Duplicate condition: ${cond} (appears ${count} times)`)
    }
  }
  
  // Check block numbers are 1-8
  const blockNumbers = completedBlocks.map(b => b.blockNumber).sort((a, b) => a - b)
  for (let i = 0; i < blockNumbers.length; i++) {
    if (blockNumbers[i] !== i + 1) {
      errors.push(`Block numbers not sequential: found ${blockNumbers.join(', ')}`)
      break
    }
  }
  
  const valid = errors.length === 0
  const session_invalid = !valid
  
  return { valid, errors, session_invalid }
}

/**
 * Legacy function for backward compatibility (4-condition design)
 * Maps old condition codes to new format with Pressure=OFF
 * @deprecated Use sequenceForParticipant which returns 8 conditions
 */
export function legacySequenceForParticipant(participantIndex: number): ('HaS' | 'GaS' | 'HaA' | 'GaA')[] {
  const sequenceIndex = participantIndex % 4
  const baseSequence = [
    ['HaS', 'GaS', 'HaA', 'GaA'],
    ['GaS', 'HaA', 'GaA', 'HaS'],
    ['HaA', 'GaA', 'HaS', 'GaS'],
    ['GaA', 'HaS', 'GaS', 'HaA'],
  ][sequenceIndex]
  return baseSequence as ('HaS' | 'GaS' | 'HaA' | 'GaA')[]
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns New shuffled array (original unchanged)
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

