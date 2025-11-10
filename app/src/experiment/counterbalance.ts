/**
 * Counterbalancing utilities for Williams design
 */

export type Cond = 'HaS' | 'GaS' | 'HaA' | 'GaA'

/**
 * Williams square for 4 conditions (balanced Latin square)
 * Ensures each condition appears in each position exactly once
 */
export const WILLIAMS_4: Cond[][] = [
  ['HaS', 'GaS', 'HaA', 'GaA'],
  ['GaS', 'HaA', 'GaA', 'HaS'],
  ['HaA', 'GaA', 'HaS', 'GaS'],
  ['GaA', 'HaS', 'GaS', 'HaA'],
]

/**
 * Get counterbalanced sequence for a participant
 * @param participantIndex - Zero-based participant index
 * @returns Array of 4 condition codes in order
 */
export function sequenceForParticipant(participantIndex: number): Cond[] {
  const sequenceIndex = participantIndex % 4
  return [...WILLIAMS_4[sequenceIndex]]
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

