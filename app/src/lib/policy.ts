/**
 * Rule-based adaptation engine
 */

import { Modality } from './modality'

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

/**
 * Load policy configuration from JSON file
 */
export async function loadPolicy(path: string = '/policy/policy.default.json'): Promise<PolicyConfig> {
  try {
    const response = await fetch(path)
    if (!response.ok) {
      throw new Error(`Failed to load policy: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading policy:', error)
    // Return default policy
    return getDefaultPolicy()
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
  private goodTrialCount: number = 0
  private badTrialCount: number = 0
  
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
    const { modality, pressure, pressureEnabled = false, currentRT } = params
    
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
    
    // Hysteresis logic
    if (triggered) {
      this.badTrialCount++
      this.goodTrialCount = 0
      
      // Need N consecutive bad trials to activate
      if (this.badTrialCount >= this.policy.hysteresis_trials) {
        const newState: PolicyState = {
          action: config.action,
          reason: `Triggered: RT p75=${triggers.rt_p75?.toFixed(0)}ms, err_burst=${triggers.err_burst}`,
          triggered: true,
          hysteresis_count: this.badTrialCount,
        }
        
        // Add delta_w for inflate_width action
        if (config.action === 'inflate_width' && 'delta_w' in config) {
          newState.delta_w = config.delta_w
        }
        
        this.currentState = newState
        return newState
      }
    } else {
      this.goodTrialCount++
      this.badTrialCount = 0
      
      // Need N consecutive good trials to deactivate
      if (
        this.currentState.action !== 'none' &&
        this.goodTrialCount >= this.policy.hysteresis_trials
      ) {
        this.currentState = {
          action: 'none',
          reason: 'Performance improved',
          triggered: false,
          hysteresis_count: this.goodTrialCount,
        }
      }
    }
    
    return { ...this.currentState }
  }
  
  /**
   * Reset policy state
   */
  reset(): void {
    this.currentState = {
      action: 'none',
      reason: 'Reset',
      triggered: false,
      hysteresis_count: 0,
    }
    this.goodTrialCount = 0
    this.badTrialCount = 0
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

