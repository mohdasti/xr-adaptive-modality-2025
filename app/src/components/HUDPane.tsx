import { useState, useEffect, useRef } from 'react'
import { bus } from '../lib/bus'
import {
  Modality,
  ModalityConfig,
  DWELL_TIMES,
  DEFAULT_MODALITY_CONFIG,
  getModalityLabel,
} from '../lib/modality'
import {
  getPolicyEngine,
  PolicyState,
  TrialHistoryEntry,
} from '../lib/policy'
import './HUDPane.css'

// Show Manual Control only in development mode
const SHOW_DEV_MODE = import.meta.env.DEV || import.meta.env.MODE === 'development'

interface Stats {
  totalTrials: number
  activeTrials: number
  errors: number
  currentPolicy: string
  lastEventTime: string
}

export function HUDPane() {
  const [stats, setStats] = useState<Stats>({
    totalTrials: 0,
    activeTrials: 0,
    errors: 0,
    currentPolicy: 'default',
    lastEventTime: 'N/A',
  })
  
  const [modalityConfig, setModalityConfig] = useState<ModalityConfig>(
    DEFAULT_MODALITY_CONFIG
  )
  
  const [policyState, setPolicyState] = useState<PolicyState>({
    action: 'none',
    reason: 'Initial state',
    triggered: false,
    hysteresis_count: 0,
  })
  
  const [pressure, setPressure] = useState(1.0)
  const [pressureEnabled, setPressureEnabled] = useState(false)
  const [agingEnabled, setAgingEnabled] = useState(false)
  
  // Block-level error rate tracking for ISO 9241-9 compliance
  const [blockCompletedTrials, setBlockCompletedTrials] = useState(0)
  const [blockErrors, setBlockErrors] = useState(0)
  
  // Track last block number to detect block changes (moved outside useEffect to fix hooks violation)
  const lastBlockNumberRef = useRef<number | null>(null)
  
  const handleModalityChange = (modality: Modality) => {
    const newConfig: ModalityConfig = {
      modality,
      dwellTime: modalityConfig.dwellTime,
    }
    setModalityConfig(newConfig)
    bus.emit('modality:change', {
      config: newConfig,
      timestamp: Date.now(),
    })
  }
  
  const handleDwellTimeChange = (dwellTime: number) => {
    const newConfig: ModalityConfig = {
      modality: modalityConfig.modality,
      dwellTime: dwellTime as typeof modalityConfig.dwellTime,
    }
    setModalityConfig(newConfig)
    bus.emit('modality:change', {
      config: newConfig,
      timestamp: Date.now(),
    })
  }
  
  const handlePressureToggle = () => {
    const newValue = !pressureEnabled
    setPressureEnabled(newValue)
    bus.emit('context:change', {
      pressure: newValue,
      aging: agingEnabled,
      timestamp: Date.now(),
    })
  }
  
  const handleAgingToggle = () => {
    const newValue = !agingEnabled
    setAgingEnabled(newValue)
    bus.emit('context:change', {
      pressure: pressureEnabled,
      aging: newValue,
      timestamp: Date.now(),
    })
  }

  useEffect(() => {
    const policyEngine = getPolicyEngine()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTrialStart = (payload: any) => {
      setStats((prev) => ({
        ...prev,
        totalTrials: prev.totalTrials + 1,
        activeTrials: prev.activeTrials + 1,
        lastEventTime: new Date().toLocaleTimeString(),
      }))
      
      // Update pressure if provided
      if (payload.pressure !== undefined) {
        setPressure(payload.pressure)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTrialEnd = (payload: any) => {
      setStats((prev) => ({
        ...prev,
        activeTrials: Math.max(0, prev.activeTrials - 1),
        lastEventTime: new Date().toLocaleTimeString(),
      }))
      
      // Track block-level completion (ignore practice trials)
      if (!payload.practice) {
        setBlockCompletedTrials((prev) => prev + 1)
      }
      
      // Add to policy engine history
      const entry: TrialHistoryEntry = {
        trialId: payload.trialId,
        modality: payload.modality || modalityConfig.modality,
        rt_ms: payload.rt_ms,
        correct: payload.correct || false,
        error: false,
        timestamp: payload.timestamp,
      }
      policyEngine.addTrial(entry)
      
      // Compute next policy state
      const newState = policyEngine.nextPolicyState({
        modality: modalityConfig.modality,
        pressure,
        pressureEnabled,
        currentRT: payload.rt_ms,
      })
      
      // If state changed, emit policy:change event
      if (newState.action !== policyState.action) {
        setPolicyState(newState)
        bus.emit('policy:change', {
          policy: newState.action,
          state: newState,
          timestamp: Date.now(),
        })
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTrialError = (payload: any) => {
      setStats((prev) => ({
        ...prev,
        errors: prev.errors + 1,
        lastEventTime: new Date().toLocaleTimeString(),
      }))
      
      // Track block-level errors (ignore practice trials)
      if (!payload.practice) {
        setBlockErrors((prev) => prev + 1)
      }
      
      // Add to policy engine history
      const entry: TrialHistoryEntry = {
        trialId: payload.trialId,
        modality: payload.modality || modalityConfig.modality,
        rt_ms: payload.rt_ms,
        correct: false,
        error: true,
        err_type: payload.err_type,
        timestamp: payload.timestamp,
      }
      policyEngine.addTrial(entry)
      
      // Compute next policy state
      const newState = policyEngine.nextPolicyState({
        modality: modalityConfig.modality,
        pressure,
        pressureEnabled,
      })
      
      // If state changed, emit policy:change event
      if (newState.action !== policyState.action) {
        setPolicyState(newState)
        bus.emit('policy:change', {
          policy: newState.action,
          state: newState,
          timestamp: Date.now(),
        })
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePolicyChange = (payload: any) => {
      setStats((prev) => ({
        ...prev,
        currentPolicy: payload.policy || 'default',
        lastEventTime: new Date().toLocaleTimeString(),
      }))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBlockComplete = () => {
      // Reset block error tracking when block completes
      // (Will reset on next trial:start when new block begins)
      setBlockCompletedTrials(0)
      setBlockErrors(0)
    }
    
    // Reset block tracking when a new block starts (detect block number change)
    const handleBlockStart = (payload: any) => {
      if (payload.block_number !== undefined && payload.block_number !== null) {
        const currentBlock = payload.block_number
        if (lastBlockNumberRef.current !== currentBlock) {
          lastBlockNumberRef.current = currentBlock
          // New block started - reset error tracking (ignore practice trials)
          if (!payload.practice) {
            setBlockCompletedTrials(0)
            setBlockErrors(0)
          }
        }
      }
    }

    const unsubTrialStart = bus.on('trial:start', (payload: any) => {
      handleBlockStart(payload)
      handleTrialStart(payload)
    })
    const unsubTrialEnd = bus.on('trial:end', handleTrialEnd)
    const unsubTrialError = bus.on('trial:error', handleTrialError)
    const unsubPolicyChange = bus.on('policy:change', handlePolicyChange)
    const unsubBlockComplete = bus.on('block:complete', handleBlockComplete)

    return () => {
      unsubTrialStart()
      unsubTrialEnd()
      unsubTrialError()
      unsubPolicyChange()
      unsubBlockComplete()
    }
  }, [modalityConfig.modality, pressure, policyState.action, pressureEnabled])
  
  // Calculate error rate for ISO 9241-9 feedback
  const totalBlockTrials = blockCompletedTrials + blockErrors
  const errorRatePercent = totalBlockTrials > 0 
    ? (blockErrors / totalBlockTrials) * 100 
    : 0
  
  // ISO 9241-9 error rate feedback
  const getErrorRateFeedback = () => {
    if (totalBlockTrials === 0) return null
    
    if (errorRatePercent < 4) {
      return {
        message: 'Good Accuracy! Go Faster!',
        color: '#28a745', // Green
        icon: '✓',
      }
    } else if (errorRatePercent > 10) {
      return {
        message: 'Too many errors! Slow Down.',
        color: '#dc3545', // Red
        icon: '⚠',
      }
    }
    return {
      message: `Error Rate: ${errorRatePercent.toFixed(1)}%`,
      color: '#ffc107', // Yellow
      icon: '•',
    }
  }
  
  const errorFeedback = getErrorRateFeedback()
  
  // Emit error rate feedback to FittsTask for canvas overlay display
  useEffect(() => {
    if (errorFeedback && totalBlockTrials >= 3) {
      bus.emit('error-rate:update', {
        message: errorFeedback.message,
        color: errorFeedback.color,
        icon: errorFeedback.icon,
        errorRate: errorRatePercent,
        blockErrors,
        totalBlockTrials,
        timestamp: Date.now(),
      })
    } else {
      // Clear error rate overlay when not applicable
      bus.emit('error-rate:update', {
        message: null,
        color: null,
        icon: null,
        errorRate: null,
        blockErrors: null,
        totalBlockTrials: null,
        timestamp: Date.now(),
      })
    }
  }, [errorFeedback, errorRatePercent, blockErrors, totalBlockTrials])

  return (
    <div className={`pane hud-pane ${policyState.action === 'declutter' ? 'decluttered' : ''}`}>
      <h2>System HUD</h2>
      
      {/* Policy Status */}
      {policyState.action !== 'none' && (
        <div className="policy-status">
          <div className="policy-badge">
            <span className="policy-icon">⚡</span>
            <strong>Adaptation Active:</strong> {policyState.action}
          </div>
          <div className="policy-reason noncritical">{policyState.reason}</div>
        </div>
      )}
      
      {/* ISO 9241-9 Error Rate Feedback - Removed from HUD, now displayed on canvas overlay */}
      
      {/* Contextual Factors - Only show in dev mode */}
      {SHOW_DEV_MODE && (
        <div className="context-controls">
          <h3>Contextual Factors</h3>
          <div className="context-toggles">
            <label className="context-toggle">
              <input
                type="checkbox"
                checked={pressureEnabled}
                onChange={handlePressureToggle}
                title="Toggle pressure mode"
              />
              <span className="toggle-label">
                <span className="toggle-icon">⏱️</span>
                Time Pressure (Countdown Timer)
              </span>
            </label>
            
            <label className="context-toggle">
              <input
                type="checkbox"
                checked={agingEnabled}
                onChange={handleAgingToggle}
                title="Toggle aging proxy"
              />
              <span className="toggle-label">
                <span className="toggle-icon">👓</span>
                Visual Aging (Reduced Contrast)
              </span>
            </label>
          </div>
        </div>
      )}
      
      {/* Modality Switch - Only visible in dev mode */}
      {SHOW_DEV_MODE && (
        <div className="modality-switch">
          <h3>Modality</h3>
          {!SHOW_DEV_MODE && (
            <div style={{ padding: '0.5rem', backgroundColor: '#fff3cd', borderRadius: '4px', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <strong>Note:</strong> Modality is automatically set by the block sequence in production mode.
            </div>
          )}
          <div className="modality-options">
            <label className="modality-radio">
              <input
                type="radio"
                name="modality"
                value={Modality.HAND}
                checked={modalityConfig.modality === Modality.HAND}
                onChange={() => handleModalityChange(Modality.HAND)}
              />
              <span className="radio-label">
                <span className="radio-icon">🖱️</span>
                {getModalityLabel(Modality.HAND)}
              </span>
            </label>
            
            <label className="modality-radio">
              <input
                type="radio"
                name="modality"
                value={Modality.GAZE}
                checked={modalityConfig.modality === Modality.GAZE}
                onChange={() => handleModalityChange(Modality.GAZE)}
              />
              <span className="radio-label">
                <span className="radio-icon">👁️</span>
                {getModalityLabel(Modality.GAZE)}
              </span>
            </label>
          </div>
          
          {/* Dwell time selector for gaze mode */}
          {modalityConfig.modality === Modality.GAZE && (
            <div className="dwell-selector">
              <label className="dwell-label">Confirmation:</label>
              <select
                value={modalityConfig.dwellTime}
                onChange={(e) => handleDwellTimeChange(Number(e.target.value))}
                className="dwell-select"
              >
                <option value={DWELL_TIMES.NONE}>Space key</option>
                <option value={DWELL_TIMES.SHORT}>350ms dwell</option>
                <option value={DWELL_TIMES.MEDIUM}>500ms dwell</option>
              </select>
            </div>
          )}
        </div>
      )}
      
      {/* Modality Display (Production Mode) - Show current modality as read-only */}
      {!SHOW_DEV_MODE && (
        <div className="modality-switch">
          <h3>Current Modality</h3>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'rgba(0, 217, 255, 0.1)', 
            borderRadius: '4px',
            border: '1px solid rgba(0, 217, 255, 0.3)'
          }}>
            <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>
              {modalityConfig.modality === Modality.GAZE ? '👁️' : '🖱️'}
            </span>
            <strong>{getModalityLabel(modalityConfig.modality)}</strong>
            {modalityConfig.modality === Modality.GAZE && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#b0b0b0' }}>
                ({modalityConfig.dwellTime === 0 ? 'Space key confirmation' : `${modalityConfig.dwellTime}ms dwell`})
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Collapsible Stats Section - Less prominent for participants */}
      {SHOW_DEV_MODE && (
        <>
          <details className="stats-details" style={{ marginTop: '1rem' }}>
            <summary style={{ 
              cursor: 'pointer', 
              padding: '0.5rem', 
              backgroundColor: '#2a2a2a', 
              borderRadius: '4px',
              fontSize: '0.875rem',
              color: '#b0b0b0'
            }}>
              <strong>System Stats</strong> (Dev Only - Click to expand)
            </summary>
            <div className="stats-grid" style={{ marginTop: '0.5rem' }}>
              <div className="stat-card">
                <div className="stat-label">Total Trials</div>
                <div className="stat-value">{stats.totalTrials}</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">Active Trials</div>
                <div className="stat-value active">{stats.activeTrials}</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">Errors</div>
                <div className="stat-value error">{stats.errors}</div>
              </div>
              
              <div className="stat-card wide">
                <div className="stat-label">Current Policy</div>
                <div className="stat-value policy">{stats.currentPolicy}</div>
              </div>
              
              <div className="stat-card wide noncritical">
                <div className="stat-label">Last Event</div>
                <div className="stat-value time">{stats.lastEventTime}</div>
              </div>
            </div>
          </details>
          <div className="status-indicator noncritical" style={{ marginTop: '0.5rem' }}>
            <span className="indicator-dot"></span>
            System Active
          </div>
        </>
      )}
      
      {/* Minimal stats for production - only show errors */}
      {!SHOW_DEV_MODE && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.875rem', color: '#b0b0b0', marginBottom: '0.25rem' }}>Block Errors</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: stats.errors > 0 ? '#dc3545' : '#28a745' }}>
            {stats.errors}
          </div>
        </div>
      )}
    </div>
  )
}

