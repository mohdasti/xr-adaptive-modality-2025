import { describe, it, expect, beforeEach } from 'vitest'
import {
  getDefaultPolicy,
  computeTriggers,
  PolicyEngine,
  TrialHistoryEntry,
} from './policy'
import { Modality } from './modality'

describe('Policy Engine', () => {
  describe('getDefaultPolicy', () => {
    it('returns default policy configuration', () => {
      const policy = getDefaultPolicy()
      expect(policy.adaptive).toBe(true)
      expect(policy.pressure_only).toBe(true)
      expect(policy.hysteresis_trials).toBe(5)
      expect(policy.gaze.action).toBe('declutter')
      expect(policy.hand.action).toBe('inflate_width')
    })
  })

  describe('computeTriggers', () => {
    it('returns null values for empty history', () => {
      const triggers = computeTriggers([], 'hand')
      expect(triggers.rt_p75).toBeNull()
      expect(triggers.err_burst).toBe(0)
      expect(triggers.total_trials).toBe(0)
    })

    it('computes RT p75 correctly', () => {
      const history: TrialHistoryEntry[] = [
        { trialId: '1', modality: 'hand', rt_ms: 500, correct: true, timestamp: 1000 },
        { trialId: '2', modality: 'hand', rt_ms: 600, correct: true, timestamp: 2000 },
        { trialId: '3', modality: 'hand', rt_ms: 700, correct: true, timestamp: 3000 },
        { trialId: '4', modality: 'hand', rt_ms: 800, correct: true, timestamp: 4000 },
      ]
      
      const triggers = computeTriggers(history, 'hand')
      expect(triggers.rt_p75).toBeCloseTo(725, 0) // 75th percentile
      expect(triggers.total_trials).toBe(4)
    })

    it('filters by modality', () => {
      const history: TrialHistoryEntry[] = [
        { trialId: '1', modality: 'hand', rt_ms: 500, correct: true, timestamp: 1000 },
        { trialId: '2', modality: 'gaze', rt_ms: 1000, correct: true, timestamp: 2000 },
        { trialId: '3', modality: 'hand', rt_ms: 600, correct: true, timestamp: 3000 },
      ]
      
      const handTriggers = computeTriggers(history, 'hand')
      expect(handTriggers.total_trials).toBe(2)
      expect(handTriggers.rt_p75).toBeCloseTo(550, 0)
      
      const gazeTriggers = computeTriggers(history, 'gaze')
      expect(gazeTriggers.total_trials).toBe(1)
    })

    it('detects error bursts', () => {
      const history: TrialHistoryEntry[] = [
        { trialId: '1', modality: 'hand', correct: true, timestamp: 1000 },
        { trialId: '2', modality: 'hand', correct: false, error: true, timestamp: 2000 },
        { trialId: '3', modality: 'hand', correct: false, error: true, timestamp: 3000 },
        { trialId: '4', modality: 'hand', correct: false, error: true, timestamp: 4000 },
        { trialId: '5', modality: 'hand', correct: true, timestamp: 5000 },
      ]
      
      const triggers = computeTriggers(history, 'hand')
      expect(triggers.err_burst).toBe(3) // 3 consecutive errors
    })

    it('counts recent errors', () => {
      const history: TrialHistoryEntry[] = [
        ...Array(5).fill(null).map((_, i) => ({
          trialId: `${i}`,
          modality: 'hand',
          correct: true,
          timestamp: i * 1000,
        })),
        { trialId: '5', modality: 'hand', correct: false, error: true, timestamp: 5000 },
        { trialId: '6', modality: 'hand', correct: false, error: true, timestamp: 6000 },
      ]
      
      const triggers = computeTriggers(history, 'hand')
      expect(triggers.recent_errors).toBe(2)
    })
  })

  describe('PolicyEngine', () => {
    let engine: PolicyEngine
    
    beforeEach(() => {
      engine = new PolicyEngine(getDefaultPolicy())
    })

    it('initializes with none action', () => {
      const state = engine.getState()
      expect(state.action).toBe('none')
      expect(state.triggered).toBe(false)
    })

    it('returns none when adaptive is disabled', () => {
      const policy = getDefaultPolicy()
      policy.adaptive = false
      engine.updatePolicy(policy)
      
      const state = engine.nextPolicyState({
        modality: Modality.HAND,
        pressure: 2.0,
      })
      
      expect(state.action).toBe('none')
      expect(state.reason).toContain('disabled')
    })

    it('returns none when pressure is low and pressure_only is true', () => {
      const state = engine.nextPolicyState({
        modality: Modality.HAND,
        pressure: 1.0,
      })
      
      expect(state.action).toBe('none')
      expect(state.reason).toContain('Pressure')
    })

    it('triggers inflate_width for hand mode after error burst', () => {
      // Add error burst
      for (let i = 0; i < 5; i++) {
        engine.addTrial({
          trialId: `${i}`,
          modality: 'hand',
          correct: false,
          error: true,
          timestamp: i * 1000,
        })
      }
      
      const state = engine.nextPolicyState({
        modality: Modality.HAND,
        pressure: 2.0,
      })
      
      expect(state.action).toBe('inflate_width')
      expect(state.triggered).toBe(true)
      expect(state.delta_w).toBe(0.25)
    })

    it('triggers declutter for gaze mode after error burst', () => {
      // Add error burst
      for (let i = 0; i < 5; i++) {
        engine.addTrial({
          trialId: `${i}`,
          modality: 'gaze',
          correct: false,
          error: true,
          timestamp: i * 1000,
        })
      }
      
      const state = engine.nextPolicyState({
        modality: Modality.GAZE,
        pressure: 2.0,
      })
      
      expect(state.action).toBe('declutter')
      expect(state.triggered).toBe(true)
    })

    it('implements hysteresis - requires N consecutive bad trials', () => {
      // Add 4 errors (not enough to trigger)
      for (let i = 0; i < 4; i++) {
        engine.addTrial({
          trialId: `${i}`,
          modality: 'hand',
          correct: false,
          error: true,
          timestamp: i * 1000,
        })
        
        const state = engine.nextPolicyState({
          modality: Modality.HAND,
          pressure: 2.0,
        })
        
        expect(state.action).toBe('none')
      }
      
      // Add 5th error (should trigger)
      engine.addTrial({
        trialId: '4',
        modality: 'hand',
        correct: false,
        error: true,
        timestamp: 4000,
      })
      
      const state = engine.nextPolicyState({
        modality: Modality.HAND,
        pressure: 2.0,
      })
      
      expect(state.action).toBe('inflate_width')
    })

    it('deactivates after N consecutive good trials', () => {
      // Trigger activation
      for (let i = 0; i < 5; i++) {
        engine.addTrial({
          trialId: `${i}`,
          modality: 'hand',
          correct: false,
          error: true,
          timestamp: i * 1000,
        })
      }
      
      let state = engine.nextPolicyState({
        modality: Modality.HAND,
        pressure: 2.0,
      })
      expect(state.action).toBe('inflate_width')
      
      // Add good trials
      for (let i = 0; i < 5; i++) {
        engine.addTrial({
          trialId: `good-${i}`,
          modality: 'hand',
          rt_ms: 500,
          correct: true,
          timestamp: (5 + i) * 1000,
        })
        
        state = engine.nextPolicyState({
          modality: Modality.HAND,
          pressure: 2.0,
          currentRT: 500,
        })
      }
      
      expect(state.action).toBe('none')
      expect(state.reason).toContain('improved')
    })

    it('resets state correctly', () => {
      // Trigger activation
      for (let i = 0; i < 5; i++) {
        engine.addTrial({
          trialId: `${i}`,
          modality: 'hand',
          correct: false,
          error: true,
          timestamp: i * 1000,
        })
      }
      
      engine.nextPolicyState({
        modality: Modality.HAND,
        pressure: 2.0,
      })
      
      engine.reset()
      
      const state = engine.getState()
      expect(state.action).toBe('none')
      expect(state.reason).toBe('Reset')
    })

    it('maintains trial history', () => {
      engine.addTrial({
        trialId: '1',
        modality: 'hand',
        rt_ms: 500,
        correct: true,
        timestamp: 1000,
      })
      
      const history = engine.getHistory()
      expect(history).toHaveLength(1)
      expect(history[0].trialId).toBe('1')
    })

    it('clears history', () => {
      engine.addTrial({
        trialId: '1',
        modality: 'hand',
        correct: true,
        timestamp: 1000,
      })
      
      engine.clearHistory()
      
      const history = engine.getHistory()
      expect(history).toHaveLength(0)
    })
  })
})

