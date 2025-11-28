/**
 * Rule-based adaptation engine
 */

import { Modality } from './modality'
import {
  loadAdaptationPolicy,
  AdaptationPolicy,
} from '../policy/loadPolicy'

/**
 * Policy configuration structure
 */
export interface PolicyConfig {
  adaptive: boolean
  pressure_only: boolean
  hysteresis_trials: number
  gaze: {
    trigger: {
      rt_p: number // RT percentile threshold
      err_burst: number // Number of consecutive errors
    }
    action: 'declutter' | 'none'
  }
  hand: {
    trigger: {
      rt_p: number
      err_burst: number
    }
    action: 'inflate_width' | 'none'
    delta_w?: number // Width scale factor
  }
  fallback: {
    use_performance_triggers: boolean
    use_camera: boolean
  }
}

/**
 * Trial history entry
 */
export interface TrialHistoryEntry {
  trialId: string
  modality: string
  rt_ms?: number
  correct: boolean
  error?: boolean
  err_type?: string
  timestamp: number
}

/**
 * Policy action types
 */
export type PolicyAction = 'none' | 'declutter' | 'inflate_width'

/**
 * Policy state
 */
export interface PolicyState {
  action: PolicyAction
  reason: string
  delta_w?: number
  triggered: boolean
  hysteresis_count: number
}

/**
 * Trigger computation results
 */
export interface TriggerResults {
  rt_p75: number | null
  err_burst: number
  recent_errors: number
  total_trials: number
}

function isAdaptationPolicy(candidate: unknown): candidate is AdaptationPolicy {
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    'adaptation' in candidate &&
    typeof (candidate as AdaptationPolicy).adaptation === 'object'
  )
}

function applyAdaptationPolicy(
  basePolicy: PolicyConfig,
  adaptationPolicy: AdaptationPolicy
): PolicyConfig {
  const {
    triggers: {
      rt_percentile,
      error_burst_threshold,
      min_trials_before_adapt,
    },
    hysteresis,
  } = adaptationPolicy.adaptation

  const resolvedHysteresis =
    Math.max(
      hysteresis?.post_trigger_window ?? 0,
      min_trials_before_adapt
    ) || basePolicy.hysteresis_trials

  return {
    ...basePolicy,
    hysteresis_trials: resolvedHysteresis,
    gaze: {
      ...basePolicy.gaze,
      trigger: {
        ...basePolicy.gaze.trigger,
        rt_p: rt_percentile,
        err_burst: error_burst_threshold,
      },
    },
    hand: {
      ...basePolicy.hand,
      trigger: {
        ...basePolicy.hand.trigger,
        rt_p: rt_percentile,
        err_burst: error_burst_threshold,
      },
    },
  }
}

async function fetchPolicyFromPath(path: string): Promise<unknown> {
  const response = await fetch(path, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Failed to load policy: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Load policy configuration from JSON file or adaptation policy definitions
 */
export async function loadPolicy(path?: string): Promise<PolicyConfig> {
  const basePolicy = getDefaultPolicy()

  try {
    if (path) {
      const policyOverride = await fetchPolicyFromPath(path)
      if (isAdaptationPolicy(policyOverride)) {
        return applyAdaptationPolicy(basePolicy, policyOverride)
      }
      return policyOverride as PolicyConfig
    }

    const adaptationPolicy = await loadAdaptationPolicy()
    return applyAdaptationPolicy(basePolicy, adaptationPolicy)
  } catch (error) {
    console.error('Error loading policy configuration:', error)
    return basePolicy
  }
}

/**
 * Get default policy configuration
 */
export function getDefaultPolicy(): PolicyConfig {
  return {
    adaptive: true,
    pressure_only: true,
    hysteresis_trials: 5,
    gaze: {
      trigger: {
        rt_p: 75,
        err_burst: 2,
      },
      action: 'declutter',
    },
    hand: {
      trigger: {
        rt_p: 75,
        err_burst: 2,
      },
      action: 'inflate_width',
      delta_w: 0.25,
    },
    fallback: {
      use_performance_triggers: true,
      use_camera: false,
    },
  }
}

/**
 * Compute percentile of an array
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  
  const sorted = [...values].sort((a, b) => a - b)
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  
  if (lower === upper) return sorted[lower]
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * Detect error burst (consecutive errors)
 */
function detectErrorBurst(history: TrialHistoryEntry[], windowSize: number = 10): number {
  if (history.length === 0) return 0
  
  // Look at recent trials
  const recent = history.slice(-windowSize)
  
  // Find longest consecutive error streak
  let maxStreak = 0
  let currentStreak = 0
  
  for (const trial of recent) {
    if (trial.error || !trial.correct) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }
  
  return maxStreak
}

/**
 * Compute trigger conditions from trial history
 */
export function computeTriggers(
  history: TrialHistoryEntry[],
  modality: string
): TriggerResults {
  // Filter by modality
  const modalityHistory = history.filter((t) => t.modality === modality)
  
  if (modalityHistory.length === 0) {
    return {
      rt_p75: null,
      err_burst: 0,
      recent_errors: 0,
      total_trials: 0,
    }
  }
  
  // Get successful trials for RT calculation
  const successfulTrials = modalityHistory.filter((t) => t.correct && t.rt_ms)
  const rtValues = successfulTrials.map((t) => t.rt_ms!).filter((rt) => rt > 0)
  
  // Compute 75th percentile RT
  const rt_p75 = rtValues.length > 0 ? percentile(rtValues, 75) : null
  
  // Detect error burst
  const err_burst = detectErrorBurst(modalityHistory)
  
  // Count recent errors (last 10 trials)
  const recentTrials = modalityHistory.slice(-10)
  const recent_errors = recentTrials.filter((t) => t.error || !t.correct).length
  
  return {
    rt_p75,
    err_burst,
    recent_errors,
    total_trials: modalityHistory.length,
  }
}

/**
 * Check if triggers are met
 */
function checkTriggers(
  triggers: TriggerResults,
  thresholds: { rt_p: number; err_burst: number },
  currentRT?: number
): boolean {
  // Check error burst
  if (triggers.err_burst >= thresholds.err_burst) {
    return true
  }
  
  // Check RT percentile (if we have current RT and baseline)
  if (currentRT && triggers.rt_p75) {
    // Current RT exceeds p75 threshold
    if (currentRT > triggers.rt_p75) {
      return true
    }
  }
  
  return false
}

/**
 * Policy state manager with hysteresis
 */
export class PolicyEngine {
  private policy: PolicyConfig
  private currentState: PolicyState
  private history: TrialHistoryEntry[]
  // Namespace counters by modality to prevent cross-contamination
  private counters: Record<string, { good: number; bad: number }> = {}
  
  constructor(policy: PolicyConfig) {
    this.policy = policy
    this.currentState = {
      action: 'none',
      reason: 'Initial state',
      triggered: false,
      hysteresis_count: 0,
    }
    this.history = []
  }
  
  /**
   * Get or initialize counters for a modality
   */
  private getCounters(modality: string): { good: number; bad: number } {
    if (!this.counters[modality]) {
      this.counters[modality] = { good: 0, bad: 0 }
    }
    return this.counters[modality]
  }
  
  /**
   * Add trial to history
   */
  addTrial(trial: TrialHistoryEntry): void {
    this.history.push(trial)
    
    // Keep only recent history (last 100 trials)
    if (this.history.length > 100) {
      this.history = this.history.slice(-100)
    }
  }
  
  /**
   * Get current policy state
   */
  getState(): PolicyState {
    return { ...this.currentState }
  }
  
  /**
   * Update policy configuration
   */
  updatePolicy(policy: PolicyConfig): void {
    this.policy = policy
  }
  
  /**
   * Compute next policy state based on current conditions
   */
  nextPolicyState(params: {
    modality: Modality
    pressure: number
    pressureEnabled?: boolean
    currentRT?: number
  }): PolicyState {
    const { modality, pressureEnabled = false, currentRT } = params
    // Pressure parameter not used in current implementation
    void params.pressure
    
    // If not adaptive, return none
    if (!this.policy.adaptive) {
      return {
        action: 'none',
        reason: 'Adaptation disabled',
        triggered: false,
        hysteresis_count: 0,
      }
    }
    
    // If pressure_only and pressure is not enabled, return none
    if (this.policy.pressure_only && !pressureEnabled) {
      return {
        action: 'none',
        reason: 'Pressure mode not enabled',
        triggered: false,
        hysteresis_count: 0,
      }
    }
    
    // Get modality-specific configuration
    const modalityStr = modality === Modality.GAZE ? 'gaze' : 'hand'
    const config = this.policy[modalityStr]
    
    // Compute triggers
    const triggers = computeTriggers(this.history, modalityStr)
    
    // Check if triggers are met
    const triggered = checkTriggers(triggers, config.trigger, currentRT)
    
    // Hysteresis logic (modality-specific)
    const counters = this.getCounters(modalityStr)
    
    if (triggered) {
      counters.bad++
      counters.good = 0
      
      // Need N consecutive bad trials to activate
      if (counters.bad >= this.policy.hysteresis_trials) {
        const newState: PolicyState = {
          action: config.action,
          reason: `Triggered: RT p75=${triggers.rt_p75?.toFixed(0)}ms, err_burst=${triggers.err_burst}`,
          triggered: true,
          hysteresis_count: counters.bad,
        }
        
        // Add delta_w for inflate_width action
        if (config.action === 'inflate_width' && 'delta_w' in config) {
          newState.delta_w = config.delta_w
        }
        
        this.currentState = newState
        return newState
      }
    } else {
      counters.good++
      counters.bad = 0
      
      // Need N consecutive good trials to deactivate
      if (
        this.currentState.action !== 'none' &&
        counters.good >= this.policy.hysteresis_trials
      ) {
        this.currentState = {
          action: 'none',
          reason: 'Performance improved',
          triggered: false,
          hysteresis_count: counters.good,
        }
      }
    }
    
    return { ...this.currentState }
  }
  
  /**
   * Reset policy state and counters
   */
  reset(): void {
    this.currentState = {
      action: 'none',
      reason: 'Reset',
      triggered: false,
      hysteresis_count: 0,
    }
    // Clear all modality-specific counters
    this.counters = {}
  }
  
  /**
   * Reset counters for a specific modality
   */
  resetModality(modality: string): void {
    delete this.counters[modality]
  }
  
  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = []
  }
  
  /**
   * Get trial history
   */
  getHistory(): TrialHistoryEntry[] {
    return [...this.history]
  }
}

/**
 * Global policy engine instance
 */
let globalPolicyEngine: PolicyEngine | null = null

/**
 * Initialize global policy engine
 */
export async function initializePolicyEngine(
  policyPath?: string
): Promise<PolicyEngine> {
  const policy = await loadPolicy(policyPath)
  globalPolicyEngine = new PolicyEngine(policy)
  return globalPolicyEngine
}

/**
 * Get global policy engine instance
 */
export function getPolicyEngine(): PolicyEngine {
  if (!globalPolicyEngine) {
    globalPolicyEngine = new PolicyEngine(getDefaultPolicy())
  }
  return globalPolicyEngine
}

/**
 * Hysteresis helper: Check if hand modality should adapt based on rolling error rate
 * @param last - Array of recent trial results with error flag
 * @param thr - Error rate threshold (default 0.10 = 10%)
 * @param lookback - Number of trials to look back (default 5)
 * @returns true if error rate exceeds threshold
 */
export function shouldAdaptHand(
  last: Array<{ error: boolean }>,
  thr = 0.10,
  lookback = 5
): boolean {
  const w = last.slice(-lookback)
  if (w.length < lookback) return false
  const rate = w.filter((t) => t.error).length / w.length
  return rate > thr
}

/**
 * Hysteresis helper: Check if gaze modality should adapt based on rolling mean RT
 * @param last - Array of recent trial results with movement time
 * @param thrMs - RT threshold in milliseconds (default 1200ms)
 * @param lookback - Number of trials to look back (default 5)
 * @returns true if mean RT exceeds threshold
 */
export function shouldAdaptGaze(
  last: Array<{ mt: number }>,
  thrMs = 1200,
  lookback = 5
): boolean {
  const w = last.slice(-lookback)
  if (w.length < lookback) return false
  const mean = w.reduce((a, b) => a + b.mt, 0) / w.length
  return mean > thrMs
}

