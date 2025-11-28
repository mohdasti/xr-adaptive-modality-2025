import { useState, useEffect } from 'react'
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
  const [cameraEnabled, setCameraEnabled] = useState(false)
  
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
  
  const handleCameraToggle = () => {
    const newValue = !cameraEnabled
    setCameraEnabled(newValue)
    bus.emit('context:change', {
      pressure: pressureEnabled,
      aging: agingEnabled,
      camera: newValue,
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

    bus.on('trial:start', handleTrialStart)
    bus.on('trial:end', handleTrialEnd)
    bus.on('trial:error', handleTrialError)
    bus.on('policy:change', handlePolicyChange)

    return () => {
      bus.off('trial:start', handleTrialStart)
      bus.off('trial:end', handleTrialEnd)
      bus.off('trial:error', handleTrialError)
      bus.off('policy:change', handlePolicyChange)
    }
  }, [modalityConfig.modality, pressure, policyState.action, pressureEnabled])

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
      
      {/* Contextual Factors */}
      <div className="context-controls">
        <h3>Contextual Factors</h3>
        {!SHOW_DEV_MODE && (
          <div style={{ padding: '0.5rem', backgroundColor: '#fff3cd', borderRadius: '4px', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <strong>Note:</strong> Pressure and Aging are automatically controlled by the block sequence. These toggles are disabled in production mode.
          </div>
        )}
        <div className="context-toggles">
          <label className="context-toggle">
            <input
              type="checkbox"
              checked={pressureEnabled}
              onChange={handlePressureToggle}
              disabled={!SHOW_DEV_MODE}
              title={!SHOW_DEV_MODE ? 'Automatically set by block sequence' : 'Toggle pressure mode'}
            />
            <span className="toggle-label">
              <span className="toggle-icon">⏱️</span>
              Pressure (Countdown Timer)
              {!SHOW_DEV_MODE && <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '0.25rem' }}>(auto)</span>}
            </span>
          </label>
          
          <label className="context-toggle">
            <input
              type="checkbox"
              checked={agingEnabled}
              onChange={handleAgingToggle}
              disabled={!SHOW_DEV_MODE}
              title={!SHOW_DEV_MODE ? 'Automatically set by block sequence' : 'Toggle aging proxy'}
            />
            <span className="toggle-label">
              <span className="toggle-icon">👓</span>
              Aging Proxy (Reduced Contrast)
              {!SHOW_DEV_MODE && <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '0.25rem' }}>(auto)</span>}
            </span>
          </label>
          
          <label className="context-toggle">
            <input
              type="checkbox"
              checked={cameraEnabled}
              onChange={handleCameraToggle}
            />
            <span className="toggle-label">
              <span className="toggle-icon">📷</span>
              Pupil Proxy (Camera Required)
              <span style={{ fontSize: '0.75rem', color: '#d32f2f', marginLeft: '0.25rem' }}>(experimental)</span>
            </span>
          </label>
        </div>
        
        {cameraEnabled && (
          <div className="camera-consent">
            <p className="consent-text">
              ⚠️ <strong>Consent:</strong> This feature uses your webcam to estimate cognitive load via pupil proxy. 
              <br />No video frames are stored or transmitted—only a scalar value (luminance-based z-score).
              <br />Your privacy is protected.
            </p>
          </div>
        )}
      </div>
      
      {/* Modality Switch */}
      <div className="modality-switch">
        <h3>Modality</h3>
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
              <span className="radio-icon">👆</span>
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
      
      <div className="stats-grid">
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

      <div className="status-indicator noncritical">
        <span className="indicator-dot"></span>
        System Active
      </div>
    </div>
  )
}

