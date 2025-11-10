/**
 * TLX (NASA-TLX) in-memory store
 * Persists TLX values per block for attachment to trial CSV rows
 */

export interface TLXValues {
  mental: number
  physical: number
  temporal: number
  performance: number
  effort: number
  frustration: number
}

class TLXStore {
  private store: Map<number, TLXValues> = new Map()

  /**
   * Set TLX values for a specific block
   */
  setBlockTLX(blockNumber: number, values: TLXValues): void {
    this.store.set(blockNumber, values)
  }

  /**
   * Get TLX values for a specific block
   */
  getBlockTLX(blockNumber: number): TLXValues | undefined {
    return this.store.get(blockNumber)
  }

  /**
   * Check if TLX values exist for a block
   */
  hasBlockTLX(blockNumber: number): boolean {
    return this.store.has(blockNumber)
  }

  /**
   * Clear all TLX values
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Get all blocks with TLX values
   */
  getAllBlocks(): number[] {
    return Array.from(this.store.keys()).sort((a, b) => a - b)
  }

  /**
   * Get store size
   */
  size(): number {
    return this.store.size
  }
}

// Global singleton instance
let globalTlxStore: TLXStore | null = null

/**
 * Get the global TLX store instance
 */
export function getTlxStore(): TLXStore {
  if (!globalTlxStore) {
    globalTlxStore = new TLXStore()
  }
  return globalTlxStore
}

/**
 * Reset the global TLX store
 */
export function resetTlxStore(): void {
  globalTlxStore = new TLXStore()
}

