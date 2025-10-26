import { useState, useEffect } from 'react'
import { bus } from '../lib/bus'
import {
  FittsConfig,
  ladder,
  DIFFICULTY_PRESETS,
  generateTrialSequence,
} from '../lib/fitts'
import {
  Modality,
  ModalityConfig,
  DWELL_TIMES,
  DEFAULT_MODALITY_CONFIG,
} from '../lib/modality'
import { FittsTask } from './FittsTask'
import './TaskPane.css'

type TaskMode = 'manual' | 'fitts'

export function TaskPane() {
  // Manual mode state
  const [trialId, setTrialId] = useState('')
  const [policy, setPolicy] = useState('default')
  
  // Task mode
  const [taskMode, setTaskMode] = useState<TaskMode>('manual')
  
  // Modality configuration (shared state via event bus)
  const [modalityConfig, setModalityConfig] = useState<ModalityConfig>(
    DEFAULT_MODALITY_CONFIG
  )
  
  // Fitts task state
  const [fittsActive, setFittsActive] = useState(false)
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0)
  const [trialSequence, setTrialSequence] = useState<FittsConfig[]>([])
  const [nTrialsPerID, setNTrialsPerID] = useState(3)
  const [selectedIDs, setSelectedIDs] = useState<string[]>(['low', 'medium', 'high'])
  const [uiMode, setUiMode] = useState('standard')
  const [pressure, setPressure] = useState(1.0)
  
  // Width scale factor from policy
  const [widthScale, setWidthScale] = useState(1.0)
  
  // Context factors
  const [pressureEnabled, setPressureEnabled] = useState(false)
  const [agingEnabled, setAgingEnabled] = useState(false)
  
  // Listen for modality changes from HUDPane
  useEffect(() => {
    const handleModalityChange = (payload: any) => {
      setModalityConfig(payload.config)
    }
    
    bus.on('modality:change', handleModalityChange)
    return () => bus.off('modality:change', handleModalityChange)
  }, [])
  
  // Listen for policy changes
  useEffect(() => {
    const handlePolicyChange = (payload: any) => {
      if (payload.state && payload.state.action === 'inflate_width') {
        const delta = payload.state.delta_w || 0.25
        setWidthScale(1.0 + delta)
      } else {
        setWidthScale(1.0)
      }
    }
    
    bus.on('policy:change', handlePolicyChange)
    return () => bus.off('policy:change', handlePolicyChange)
  }, [])
  
  // Listen for context changes
  useEffect(() => {
    const handleContextChange = (payload: any) => {
      setPressureEnabled(payload.pressure)
      setAgingEnabled(payload.aging)
    }
    
    bus.on('context:change', handleContextChange)
    return () => bus.off('context:change', handleContextChange)
  }, [])

  // Manual mode handlers
  const handleStartTrial = () => {
    const id = `trial-${Date.now()}`
    setTrialId(id)
    bus.emit('trial:start', { trialId: id, timestamp: Date.now() })
  }

  const handleEndTrial = () => {
    if (!trialId) return
    bus.emit('trial:end', {
      trialId,
      duration: Math.random() * 5000,
      timestamp: Date.now(),
    })
    setTrialId('')
  }

  const handleError = () => {
    if (!trialId) return
    bus.emit('trial:error', {
      trialId,
      error: 'Simulated error occurred',
      timestamp: Date.now(),
    })
  }

  const handlePolicyChange = (newPolicy: string) => {
    setPolicy(newPolicy)
    bus.emit('policy:change', { policy: newPolicy, timestamp: Date.now() })
  }

  // Fitts task handlers
  const handleStartFittsBlock = () => {
    // Generate trial sequence
    const configs = selectedIDs.map((id) => DIFFICULTY_PRESETS[id])
    const sequence = generateTrialSequence(configs, nTrialsPerID, true)
    
    setTrialSequence(sequence)
    setCurrentTrialIndex(0)
    setFittsActive(true)
  }

  const handleFittsTrialComplete = () => {
    // Move to next trial
    const nextIndex = currentTrialIndex + 1
    
    if (nextIndex < trialSequence.length) {
      setCurrentTrialIndex(nextIndex)
    } else {
      // Block complete
      setFittsActive(false)
      setCurrentTrialIndex(0)
      bus.emit('block:complete', {
        totalTrials: trialSequence.length,
        timestamp: Date.now(),
      })
    }
  }

  const handleFittsTrialError = (errorType: 'miss' | 'timeout' | 'slip') => {
    // For now, just move to next trial
    // In production, you might want to repeat the trial
    console.log('Trial error:', errorType)
    handleFittsTrialComplete()
  }

  const handleStopFittsBlock = () => {
    setFittsActive(false)
    setCurrentTrialIndex(0)
  }

  const toggleIDSelection = (id: string) => {
    setSelectedIDs((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="pane task-pane">
      <h2>Task Control</h2>
      
      {/* Task Mode Selector */}
      <div className="control-group">
        <h3>Task Mode</h3>
        <div className="mode-selector">
          <button
            className={taskMode === 'manual' ? 'active' : ''}
            onClick={() => setTaskMode('manual')}
            disabled={fittsActive}
          >
            Manual Control
          </button>
          <button
            className={taskMode === 'fitts' ? 'active' : ''}
            onClick={() => setTaskMode('fitts')}
            disabled={fittsActive}
          >
            Fitts Task
          </button>
        </div>
      </div>

      {/* Manual Mode */}
      {taskMode === 'manual' && (
        <>
          <div className="control-group">
            <h3>Trial Management</h3>
            <div className="button-group">
              <button onClick={handleStartTrial} disabled={!!trialId}>
                Start Trial
              </button>
              <button onClick={handleEndTrial} disabled={!trialId}>
                End Trial
              </button>
              <button onClick={handleError} disabled={!trialId}>
                Trigger Error
              </button>
            </div>
            {trialId && (
              <div className="status">
                Active Trial: <code>{trialId}</code>
              </div>
            )}
          </div>

          <div className="control-group">
            <h3>Policy Selection</h3>
            <select
              value={policy}
              onChange={(e) => handlePolicyChange(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="adaptive">Adaptive</option>
              <option value="fixed">Fixed</option>
              <option value="experimental">Experimental</option>
            </select>
            <div className="status">
              Current Policy: <strong>{policy}</strong>
            </div>
          </div>
        </>
      )}

      {/* Fitts Task Mode */}
      {taskMode === 'fitts' && !fittsActive && (
        <>
          <div className="control-group">
            <h3>Block Configuration</h3>
            
            <label className="input-label">
              Trials per ID:
              <input
                type="number"
                min="1"
                max="20"
                value={nTrialsPerID}
                onChange={(e) => setNTrialsPerID(parseInt(e.target.value))}
              />
            </label>

            <div className="checkbox-group">
              <label>Difficulty Levels:</label>
              {Object.entries(DIFFICULTY_PRESETS).map(([key, config]) => (
                <label key={key} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedIDs.includes(key)}
                    onChange={() => toggleIDSelection(key)}
                  />
                  {config.label}
                </label>
              ))}
            </div>

            <div className="status">
              Modality: <strong>{modalityConfig.modality}</strong>
              {modalityConfig.modality === Modality.GAZE && (
                <span>
                  {' '}
                  (
                  {modalityConfig.dwellTime === 0
                    ? 'Space to confirm'
                    : `${modalityConfig.dwellTime}ms dwell`}
                  )
                </span>
              )}
              <br />
              <small>Change modality in System HUD</small>
            </div>

            <label className="input-label">
              UI Mode:
              <select value={uiMode} onChange={(e) => setUiMode(e.target.value)}>
                <option value="standard">Standard</option>
                <option value="minimal">Minimal</option>
                <option value="enhanced">Enhanced</option>
              </select>
            </label>

            <label className="input-label">
              Pressure:
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={pressure}
                onChange={(e) => setPressure(parseFloat(e.target.value))}
              />
              <span className="pressure-value">{pressure.toFixed(1)}</span>
            </label>

            <div className="status">
              Total Trials: <strong>{selectedIDs.length * nTrialsPerID}</strong>
            </div>
          </div>

          <div className="control-group">
            <button
              onClick={handleStartFittsBlock}
              disabled={selectedIDs.length === 0}
              className="primary-button"
            >
              Start Fitts Block
            </button>
          </div>
        </>
      )}

      {/* Active Fitts Task */}
      {taskMode === 'fitts' && fittsActive && (
        <>
          <div className="control-group">
            <div className="block-progress">
              <h3>
                Trial {currentTrialIndex + 1} of {trialSequence.length}
              </h3>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((currentTrialIndex + 1) / trialSequence.length) * 100}%`,
                  }}
                />
              </div>
            </div>
            
            <button onClick={handleStopFittsBlock} className="stop-button">
              Stop Block
            </button>
          </div>

          <FittsTask
            config={trialSequence[currentTrialIndex]}
            modalityConfig={modalityConfig}
            ui_mode={uiMode}
            pressure={pressure}
            trialNumber={currentTrialIndex + 1}
            widthScale={widthScale}
            pressureEnabled={pressureEnabled}
            agingEnabled={agingEnabled}
            onTrialComplete={handleFittsTrialComplete}
            onTrialError={handleFittsTrialError}
            timeout={10000}
          />
        </>
      )}
    </div>
  )
}
