/**
 * Session tracking utilities for multi-session experiments
 */

export interface SessionInfo {
  participantId: string
  participantIndex: number
  sessionNumber: number
  completedBlocks: number[]
  currentBlock: number
  totalBlocks: number
}

const STORAGE_PREFIX = 'participant_session_'

/**
 * Get session info from URL parameters
 */
export function getSessionInfoFromURL(): {
  participantId: string | null
  sessionNumber: number | null
  startBlock: number | null
} {
  const params = new URLSearchParams(window.location.search)
  const participantId = params.get('pid') || params.get('participant')
  const sessionNumber = params.get('session') ? parseInt(params.get('session')!, 10) : null
  const startBlock = params.get('startBlock') ? parseInt(params.get('startBlock')!, 10) : null
  
  return { participantId, sessionNumber, startBlock }
}

/**
 * Get completed blocks for a participant from localStorage
 */
export function getCompletedBlocks(participantId: string): number[] {
  const key = `${STORAGE_PREFIX}${participantId}`
  const stored = localStorage.getItem(key)
  if (!stored) return []
  
  try {
    const data = JSON.parse(stored)
    return data.completedBlocks || []
  } catch {
    return []
  }
}

/**
 * Mark a block as completed for a participant
 */
export function markBlockCompleted(participantId: string, blockNumber: number): void {
  const key = `${STORAGE_PREFIX}${participantId}`
  const completed = getCompletedBlocks(participantId)
  
  if (!completed.includes(blockNumber)) {
    completed.push(blockNumber)
    completed.sort((a, b) => a - b)
    
    const data = {
      participantId,
      completedBlocks: completed,
      lastUpdated: new Date().toISOString(),
    }
    
    localStorage.setItem(key, JSON.stringify(data))
  }
}

/**
 * Get session info for current participant
 */
export function getSessionInfo(
  participantId: string,
  participantIndex: number,
  sessionNumber: number | null,
  totalBlocks: number
): SessionInfo {
  const completedBlocks = getCompletedBlocks(participantId)
  const currentBlock = sessionNumber 
    ? Math.max(1, completedBlocks.length + 1)
    : completedBlocks.length + 1
  
  return {
    participantId,
    participantIndex,
    sessionNumber: sessionNumber || 1,
    completedBlocks,
    currentBlock: Math.min(currentBlock, totalBlocks),
    totalBlocks,
  }
}

/**
 * Get next block number for a participant
 */
export function getNextBlock(participantId: string, totalBlocks: number): number {
  const completed = getCompletedBlocks(participantId)
  const next = completed.length + 1
  return Math.min(next, totalBlocks)
}

/**
 * Check if all blocks are completed
 */
export function areAllBlocksCompleted(participantId: string, totalBlocks: number): boolean {
  const completed = getCompletedBlocks(participantId)
  return completed.length >= totalBlocks
}

/**
 * Get session progress summary
 */
export function getSessionProgress(participantId: string, totalBlocks: number): {
  completed: number
  remaining: number
  percentage: number
  nextBlock: number
} {
  const completed = getCompletedBlocks(participantId)
  const completedCount = completed.length
  const remaining = Math.max(0, totalBlocks - completedCount)
  const percentage = totalBlocks > 0 ? (completedCount / totalBlocks) * 100 : 0
  const nextBlock = Math.min(completedCount + 1, totalBlocks)
  
  return {
    completed: completedCount,
    remaining,
    percentage,
    nextBlock,
  }
}

/**
 * Clear session data (for testing/reset)
 */
export function clearSessionData(participantId: string): void {
  const key = `${STORAGE_PREFIX}${participantId}`
  localStorage.removeItem(key)
}

