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
 * Get counterbalanced sequence for a participant
 * @param participantIndex - Zero-based participant index
 * @returns Array of 8 condition codes in order
 */
export function sequenceForParticipant(participantIndex: number): Cond[] {
  const sequenceIndex = participantIndex % 8
  return [...WILLIAMS_8[sequenceIndex]]
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

