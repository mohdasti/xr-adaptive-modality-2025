import { useState, useEffect } from 'react'
import { bus } from '../lib/bus'
import {
  Modality,
  ModalityConfig,
  DWELL_TIMES,
  DEFAULT_MODALITY_CONFIG,
  getModalityLabel,
} from '../lib/modality'
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
      dwellTime,
    }
    setModalityConfig(newConfig)
    bus.emit('modality:change', {
      config: newConfig,
      timestamp: Date.now(),
    })
  }

  useEffect(() => {
    const handleTrialStart = () => {
      setStats((prev) => ({
        ...prev,
        totalTrials: prev.totalTrials + 1,
        activeTrials: prev.activeTrials + 1,
        lastEventTime: new Date().toLocaleTimeString(),
      }))
    }

    const handleTrialEnd = () => {
      setStats((prev) => ({
        ...prev,
        activeTrials: Math.max(0, prev.activeTrials - 1),
        lastEventTime: new Date().toLocaleTimeString(),
      }))
    }

    const handleTrialError = () => {
      setStats((prev) => ({
        ...prev,
        errors: prev.errors + 1,
        lastEventTime: new Date().toLocaleTimeString(),
      }))
    }

    const handlePolicyChange = (payload: any) => {
      setStats((prev) => ({
        ...prev,
        currentPolicy: payload.policy,
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
  }, [])

  return (
    <div className="pane hud-pane">
      <h2>System HUD</h2>
      
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
        
        <div className="stat-card wide">
          <div className="stat-label">Last Event</div>
          <div className="stat-value time">{stats.lastEventTime}</div>
        </div>
      </div>

      <div className="status-indicator">
        <span className="indicator-dot"></span>
        System Active
      </div>
    </div>
  )
}

