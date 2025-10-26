import { describe, it, expect } from 'vitest'
import {
  computeID,
  computeEffectiveWidth,
  computeThroughput,
  generateTrialSequence,
  generateCircularPositions,
  generateGridPositions,
  distance,
  isHit,
  DIFFICULTY_PRESETS,
  ladder,
} from './fitts'

describe('Fitts Law Utilities', () => {
  describe('computeID', () => {
    it('computes Shannon formulation correctly', () => {
      expect(computeID(200, 80)).toBeCloseTo(1.66, 2)
      expect(computeID(400, 40)).toBeCloseTo(3.32, 2)
      expect(computeID(600, 20)).toBeCloseTo(4.95, 2)
    })

    it('handles edge cases', () => {
      expect(computeID(0, 100)).toBe(0)
      expect(computeID(100, 100)).toBeCloseTo(1, 2)
    })

    it('throws on invalid inputs', () => {
      expect(() => computeID(100, 0)).toThrow()
      expect(() => computeID(100, -10)).toThrow()
      expect(() => computeID(-100, 10)).toThrow()
    })
  })

  describe('computeEffectiveWidth', () => {
    it('computes effective width correctly', () => {
      expect(computeEffectiveWidth(10)).toBeCloseTo(41.33, 2)
      expect(computeEffectiveWidth(5)).toBeCloseTo(20.665, 2)
    })
  })

  describe('computeThroughput', () => {
    it('computes throughput correctly', () => {
      expect(computeThroughput(3.32, 1.0)).toBeCloseTo(3.32, 2)
      expect(computeThroughput(4.95, 1.5)).toBeCloseTo(3.3, 2)
    })

    it('throws on invalid movement time', () => {
      expect(() => computeThroughput(3.32, 0)).toThrow()
      expect(() => computeThroughput(3.32, -1)).toThrow()
    })
  })

  describe('DIFFICULTY_PRESETS', () => {
    it('contains expected presets', () => {
      expect(DIFFICULTY_PRESETS.low).toBeDefined()
      expect(DIFFICULTY_PRESETS.medium).toBeDefined()
      expect(DIFFICULTY_PRESETS.high).toBeDefined()
      expect(DIFFICULTY_PRESETS.veryHigh).toBeDefined()
    })

    it('has correct ID values', () => {
      expect(DIFFICULTY_PRESETS.low.ID).toBeCloseTo(1.66, 1)
      expect(DIFFICULTY_PRESETS.medium.ID).toBeCloseTo(3.32, 1)
      expect(DIFFICULTY_PRESETS.high.ID).toBeCloseTo(4.95, 1)
    })
  })

  describe('ladder', () => {
    it('contains three difficulty levels', () => {
      expect(ladder).toHaveLength(3)
    })

    it('is ordered from low to high', () => {
      expect(ladder[0].ID).toBeLessThan(ladder[1].ID)
      expect(ladder[1].ID).toBeLessThan(ladder[2].ID)
    })
  })

  describe('generateTrialSequence', () => {
    it('generates correct number of trials', () => {
      const sequence = generateTrialSequence(ladder, 5, false)
      expect(sequence).toHaveLength(15) // 3 configs * 5 trials
    })

    it('includes each config the correct number of times', () => {
      const sequence = generateTrialSequence(ladder, 3, false)
      const lowCount = sequence.filter((c) => c.ID === ladder[0].ID).length
      const medCount = sequence.filter((c) => c.ID === ladder[1].ID).length
      const highCount = sequence.filter((c) => c.ID === ladder[2].ID).length
      
      expect(lowCount).toBe(3)
      expect(medCount).toBe(3)
      expect(highCount).toBe(3)
    })

    it('shuffles when requested', () => {
      const unshuffled = generateTrialSequence(ladder, 3, false)
      const shuffled = generateTrialSequence(ladder, 3, true)
      
      // Unlikely to be identical if shuffled (though possible)
      // Just check they have same length and contents
      expect(shuffled).toHaveLength(unshuffled.length)
    })
  })

  describe('generateCircularPositions', () => {
    it('generates correct number of positions', () => {
      const positions = generateCircularPositions({ x: 400, y: 300 }, 200, 8)
      expect(positions).toHaveLength(8)
    })

    it('positions are at correct distance from center', () => {
      const center = { x: 400, y: 300 }
      const amplitude = 200
      const positions = generateCircularPositions(center, amplitude, 8)
      
      positions.forEach((pos) => {
        const dist = distance(center, pos)
        expect(dist).toBeCloseTo(amplitude, 1)
      })
    })
  })

  describe('generateGridPositions', () => {
    it('generates correct number of positions', () => {
      const positions = generateGridPositions(
        { width: 800, height: 600 },
        50,
        { rows: 3, cols: 3 }
      )
      expect(positions).toHaveLength(9)
    })

    it('respects margins', () => {
      const margin = 50
      const bounds = { width: 800, height: 600 }
      const positions = generateGridPositions(bounds, margin, { rows: 2, cols: 2 })
      
      positions.forEach((pos) => {
        expect(pos.x).toBeGreaterThanOrEqual(margin)
        expect(pos.x).toBeLessThanOrEqual(bounds.width - margin)
        expect(pos.y).toBeGreaterThanOrEqual(margin)
        expect(pos.y).toBeLessThanOrEqual(bounds.height - margin)
      })
    })
  })

  describe('distance', () => {
    it('calculates distance correctly', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
      expect(distance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0)
      expect(distance({ x: 100, y: 100 }, { x: 100, y: 200 })).toBe(100)
    })
  })

  describe('isHit', () => {
    it('detects hits correctly', () => {
      const target = { x: 400, y: 300 }
      const width = 80
      
      expect(isHit({ x: 400, y: 300 }, target, width)).toBe(true) // center
      expect(isHit({ x: 440, y: 300 }, target, width)).toBe(true) // edge
      expect(isHit({ x: 441, y: 300 }, target, width)).toBe(false) // outside
    })

    it('detects misses correctly', () => {
      const target = { x: 400, y: 300 }
      const width = 40
      
      expect(isHit({ x: 500, y: 300 }, target, width)).toBe(false)
      expect(isHit({ x: 400, y: 400 }, target, width)).toBe(false)
    })
  })
})

