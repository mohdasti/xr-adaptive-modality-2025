import { useState, useEffect } from 'react'
import { bus } from '../lib/bus'
import {
  FittsConfig,
  DIFFICULTY_PRESETS,
  generateTrialSequence,
} from '../lib/fitts'
import {
  Modality,
  ModalityConfig,
  DEFAULT_MODALITY_CONFIG,
} from '../lib/modality'
import { FittsTask } from './FittsTask'
import { TLXForm, TLXValues } from './TLXForm'
import { getTlxStore } from '../lib/tlxStore'
import {
  getDisplayMetadata,
  meetsDisplayRequirements,
  DisplayMetadata,
} from '../utils/sessionMeta'
import { sequenceForParticipant, parseCondition, type Cond } from '../experiment/counterbalance'
import './TaskPane.css'

type TaskMode = 'manual' | 'fitts'

// Show Manual Control only in development mode
const SHOW_DEV_MODE = import.meta.env.DEV || import.meta.env.MODE === 'development'

export function TaskPane() {
  // Manual mode state (dev only)
  const [trialId, setTrialId] = useState('')
  const [policy, setPolicy] = useState('default')
  
  // Task mode - default to Fitts Task (the actual experiment)
  const [taskMode, setTaskMode] = useState<TaskMode>('fitts')
  
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
  const [cameraEnabled, setCameraEnabled] = useState(false)
  
  // TLX modal state
  const [showTlxModal, setShowTlxModal] = useState(false)
  const [blockNumber, setBlockNumber] = useState(1)
  const [globalTrialNumber, setGlobalTrialNumber] = useState(1)
  const [trialInBlock, setTrialInBlock] = useState(1)
  const [blockOrderCode, setBlockOrderCode] = useState<Cond>('HaS_P0')
  const [displayMetadata, setDisplayMetadata] = useState<DisplayMetadata | null>(null)
  const [showDisplayWarning, setShowDisplayWarning] = useState(false)
  const [activeBlockContext, setActiveBlockContext] = useState<{ modality: string; uiMode: string } | null>(null)
  
  // Participant index for counterbalancing (stored in localStorage)
  const [, setParticipantIndex] = useState<number | null>(null)
  const [blockSequence, setBlockSequence] = useState<Cond[]>([])
  
  // Initialize participant index and block sequence on mount
  useEffect(() => {
    const storedIndex = localStorage.getItem('participantIndex')
    if (storedIndex !== null) {
      const idx = parseInt(storedIndex, 10)
      if (!isNaN(idx)) {
        setParticipantIndex(idx)
        const sequence = sequenceForParticipant(idx)
        setBlockSequence(sequence)
        return
      }
    }
    
    // Prompt for participant index if not stored
    const input = prompt('Enter Participant Index (0-99) for counterbalancing:')
    if (input !== null) {
      const idx = parseInt(input, 10)
      if (!isNaN(idx) && idx >= 0) {
        setParticipantIndex(idx)
        localStorage.setItem('participantIndex', String(idx))
        const sequence = sequenceForParticipant(idx)
        setBlockSequence(sequence)
      }
    }
  }, [])
  
  // Listen for modality changes from HUDPane
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleModalityChange = (payload: any) => {
      setModalityConfig(payload.config)
    }
    
    bus.on('modality:change', handleModalityChange)
    return () => bus.off('modality:change', handleModalityChange)
  }, [])
  
  // Listen for policy changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleContextChange = (payload: any) => {
      setPressureEnabled(payload.pressure)
      setAgingEnabled(payload.aging)
      if (payload.camera !== undefined) {
        setCameraEnabled(payload.camera)
      }
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
    setTrialId('') // Clear trial ID after error
  }

  const handlePolicyChange = (newPolicy: string) => {
    setPolicy(newPolicy)
    bus.emit('policy:change', { policy: newPolicy, timestamp: Date.now() })
  }

  // Parse condition code to modality, UI mode, and pressure
  const parseConditionCode = (cond: Cond): { modality: Modality; uiMode: string; pressure: boolean; aging: boolean } => {
    const parsed = parseCondition(cond)
    const modality = parsed.modality === 'hand' ? Modality.HAND : Modality.GAZE
    const uiMode = parsed.intervention === 'adaptive' ? 'adaptive' : 'static'
    // Pressure is now part of the condition code
    const pressure = parsed.pressure
    // Aging is optional and not part of the base design - default to false
    // Can be enabled per-participant or per-session if needed
    const aging = false
    return { modality, uiMode, pressure, aging }
  }

  // Fitts task handlers
  const startFittsBlockInternal = () => {
    // Get block order from counterbalanced sequence
    if (blockSequence.length === 0 || blockNumber > blockSequence.length) {
      console.warn('Block sequence not initialized or block number out of range')
      return
    }
    
    const currentCond = blockSequence[blockNumber - 1]
    setBlockOrderCode(currentCond)
    
    const { modality: targetModality, uiMode: targetUiMode, pressure: targetPressure, aging: targetAging } = parseConditionCode(currentCond)
    
    // Automatically set pressure and aging based on block condition
    // This ensures they are controlled by the experimental design, not manual toggles
    if (pressureEnabled !== targetPressure) {
      console.log('[TaskPane] Block forcing pressure change:', {
        from: pressureEnabled,
        to: targetPressure,
        blockCondition: currentCond,
      })
      setPressureEnabled(targetPressure)
      bus.emit('context:change', {
        pressure: targetPressure,
        aging: targetAging, // Will be set next
        timestamp: Date.now(),
      })
    }
    
    if (agingEnabled !== targetAging) {
      console.log('[TaskPane] Block forcing aging change:', {
        from: agingEnabled,
        to: targetAging,
        blockCondition: currentCond,
      })
      setAgingEnabled(targetAging)
      bus.emit('context:change', {
        pressure: targetPressure,
        aging: targetAging,
        timestamp: Date.now(),
      })
    }
    
    // Update modality if needed
    // In development, respect HUD selection to allow testing Gaze+dwell regardless of block order
    if (!SHOW_DEV_MODE) {
      if (modalityConfig.modality !== targetModality) {
        console.log('[TaskPane] Block forcing modality change:', {
          from: modalityConfig.modality,
          to: targetModality,
          blockCondition: currentCond,
          currentDwellTime: modalityConfig.dwellTime,
        })
        bus.emit('modality:change', {
          config: {
            modality: targetModality,
            dwellTime: modalityConfig.dwellTime, // Preserve dwell time setting
          },
          timestamp: Date.now(),
        })
      } else {
        console.log('[TaskPane] Modality matches block condition:', {
          modality: modalityConfig.modality,
          blockCondition: currentCond,
          dwellTime: modalityConfig.dwellTime,
        })
      }
    } else {
      console.log('[TaskPane] DEV mode: respecting HUD modality override:', {
        modalityFromHUD: modalityConfig.modality,
        dwellTime: modalityConfig.dwellTime,
        blockCondition: currentCond,
      })
    }
    
    // Update UI mode
    setUiMode(targetUiMode)
    
    // Generate and shuffle trial sequence
    const configs = selectedIDs.map((id) => DIFFICULTY_PRESETS[id])
    const sequence = generateTrialSequence(configs, nTrialsPerID, true)
    
    setTrialSequence(sequence)
    setCurrentTrialIndex(0)
    setTrialInBlock(1)
    setShowDisplayWarning(false)
    setActiveBlockContext({
      modality: targetModality,
      uiMode: targetUiMode,
    })
    setFittsActive(true)
  }

  const handleStartFittsBlock = () => {
    const meta = getDisplayMetadata()
    setDisplayMetadata(meta)

    if (!meetsDisplayRequirements(meta)) {
      setShowDisplayWarning(true)
      return
    }

    startFittsBlockInternal()
  }

  const handleDisplayRetry = () => {
    const meta = getDisplayMetadata()
    setDisplayMetadata(meta)

    if (meetsDisplayRequirements(meta)) {
      setShowDisplayWarning(false)
      startFittsBlockInternal()
    } else {
      // Provide feedback on what's still missing
      const issues: string[] = []
      const windowCoversMostOfScreen = 
        meta.window_width >= meta.screen_width * 0.9 && 
        meta.window_height >= meta.screen_height * 0.9
      
      if (!meta.is_fullscreen && !windowCoversMostOfScreen) {
        issues.push('Maximize browser window or enter fullscreen (F11 or ⌃⌘F)')
      }
      if (meta.zoom_level < 95 || meta.zoom_level > 105) {
        issues.push(`Reset zoom to ~100% (currently ${meta.zoom_level}% - use Ctrl+0 / ⌘0)`)
      }
      if (meta.window_width < 1280 || meta.window_height < 720) {
        issues.push(`Resize window to at least 1280×720 (currently ${meta.window_width}×${meta.window_height})`)
      }
      
      if (issues.length > 0) {
        alert(`Please fix the following:\n\n${issues.join('\n')}`)
      }
    }
  }

  const handleDisplayModalClose = () => {
    setShowDisplayWarning(false)
  }

  const handleFittsTrialComplete = () => {
    // Move to next trial
    const nextIndex = currentTrialIndex + 1
    
    setGlobalTrialNumber((prev) => prev + 1)
    
    if (nextIndex < trialSequence.length) {
      setCurrentTrialIndex(nextIndex)
      setTrialInBlock((prev) => prev + 1)
    } else {
      // Block complete - show TLX modal
      setFittsActive(false)
      setShowTlxModal(true)
      setTrialInBlock(1)
      bus.emit('block:complete', {
        totalTrials: trialSequence.length,
        block_number: blockNumber,
        block_order: blockOrderCode,
        timestamp: Date.now(),
      })
    }
  }
  
  const handleTlxSubmit = (values: TLXValues) => {
    const tlxStore = getTlxStore()
    tlxStore.setBlockTLX(blockNumber, values)
    const blockContext = activeBlockContext ?? {
      modality: modalityConfig.modality,
      uiMode,
    }
    
    bus.emit('tlx:submit', {
      blockNumber,
      blockOrder: blockOrderCode,
      modality: blockContext.modality,
      ui_mode: blockContext.uiMode,
      values,
      timestamp: Date.now(),
    })
    
    setShowTlxModal(false)
    setCurrentTrialIndex(0)
    setTrialSequence([])
    setBlockNumber((prev) => prev + 1)
    setActiveBlockContext(null)
  }
  
  const handleTlxClose = () => {
    setShowTlxModal(false)
    setCurrentTrialIndex(0)
    setTrialSequence([])
    setActiveBlockContext(null)
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
    setTrialInBlock(1)
    setTrialSequence([])
    setActiveBlockContext(null)
  }

  const toggleIDSelection = (id: string) => {
    setSelectedIDs((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const totalTrialsInBlock = Math.max(trialSequence.length, 1)
  const currentDisplayMeta: DisplayMetadata | null = showDisplayWarning
    ? displayMetadata ?? getDisplayMetadata()
    : displayMetadata

  return (
    <div className="pane task-pane">
      <h2>Task Control</h2>
      
      {showDisplayWarning && (
        <div className="display-guard-overlay">
          <div className="display-guard-modal">
            <h3>Display Requirements</h3>
            <p>
              Please maximize your browser window (or enter fullscreen with F11 / ⌃⌘F) and ensure browser zoom is reset to 100%
              (Ctrl+0 / ⌘0). Minimum window size is 1280×720.
            </p>
            <p style={{ fontSize: '0.875rem', color: '#808080', marginTop: '0.5rem' }}>
              <strong>Note:</strong> Different monitor sizes and resolutions are fine as long as the window meets minimum size requirements. Webcam is optional (only needed for pupil proxy feature).
            </p>
            <div className="display-guard-meta">
              <div>
                <strong>Fullscreen:</strong>{' '}
                {currentDisplayMeta?.is_fullscreen ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Maximized:</strong>{' '}
                {currentDisplayMeta && 
                 currentDisplayMeta.window_width >= currentDisplayMeta.screen_width * 0.9 &&
                 currentDisplayMeta.window_height >= currentDisplayMeta.screen_height * 0.9
                  ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Zoom:</strong>{' '}
                {currentDisplayMeta ? `${currentDisplayMeta.zoom_level}%` : '—'}
              </div>
              <div>
                <strong>Window:</strong>{' '}
                {currentDisplayMeta
                  ? `${currentDisplayMeta.window_width} × ${currentDisplayMeta.window_height}`
                  : '—'}
              </div>
              <div>
                <strong>Screen:</strong>{' '}
                {currentDisplayMeta
                  ? `${currentDisplayMeta.screen_width} × ${currentDisplayMeta.screen_height}`
                  : '—'}
              </div>
            </div>
            <div className="display-guard-actions">
              <button onClick={handleDisplayRetry} className="primary-button">
                Re-check &amp; Start
              </button>
              <button onClick={handleDisplayModalClose}>Dismiss</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Task Mode Selector - Only show in dev mode */}
      {SHOW_DEV_MODE && (
      <div className="control-group">
          <h3>Task Mode (Dev Only)</h3>
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
      )}

      {/* Manual Mode - Dev only */}
      {SHOW_DEV_MODE && taskMode === 'manual' && (
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

      {/* Fitts Task Mode - Primary experiment interface */}
      {taskMode === 'fitts' && !fittsActive && (
        <>
          <div className="control-group">
            <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.5rem' }}>Fitts Task Experiment</h2>
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
              Block #{blockNumber} of {blockSequence.length} · Condition: <strong>{blockOrderCode}</strong>
              <br />
              Next global trial #: <strong>{globalTrialNumber}</strong>
              <br />
              {!SHOW_DEV_MODE && (
                <small>All experimental factors (modality, UI mode, pressure) are automatically set by block sequence.</small>
              )}
              {SHOW_DEV_MODE && (
                <small>Dev mode: Modality can be changed in HUD for testing, but will be overridden by block sequence in production.</small>
              )}
            </div>

            <div className="status" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
              <strong>Current Block:</strong> {blockOrderCode} — {
                (() => {
                  const parsed = parseConditionCode(blockOrderCode)
                  const modalityLabel = parsed.modality === Modality.HAND ? 'Hand' : 'Gaze'
                  const interventionLabel = parsed.uiMode === 'adaptive' ? 'Adaptive' : 'Static'
                  const pressureLabel = parsed.pressure ? 'Pressure ON' : 'Pressure OFF'
                  return `${modalityLabel} · ${interventionLabel} · ${pressureLabel}`
                })()
              }
              <br />
              <small style={{ color: '#666' }}>
                Block order is automatically set based on your participant index (Williams counterbalancing).
                Modality, UI mode (Static/Adaptive), and Pressure are all controlled by the block sequence.
                {SHOW_DEV_MODE && ' (Dev mode: HUD toggles are overridden by block sequence in production.)'}
              </small>
            </div>

            {/* Pressure control - Dev only (experimental variable) */}
            {SHOW_DEV_MODE && (
            <label className="input-label">
                Pressure (Dev Only):
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
            )}

            <div className="status">
              Total Trials: <strong>{selectedIDs.length * nTrialsPerID * 3}</strong>
              <span style={{ fontSize: '0.875rem', color: '#666' }}>
                {' '}(point + drag near + drag far per difficulty)
              </span>
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
                Trial {trialInBlock} of {trialSequence.length}
              </h3>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(
                      (trialInBlock / totalTrialsInBlock) * 100,
                      100
                    )}%`,
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
            trialContext={{
              globalTrialNumber,
              trialInBlock,
              blockNumber,
              blockOrder: blockOrderCode,
              blockTrialCount: trialSequence.length,
            }}
            widthScale={widthScale}
            pressureEnabled={pressureEnabled}
            agingEnabled={agingEnabled}
            cameraEnabled={cameraEnabled}
            onTrialComplete={handleFittsTrialComplete}
            onTrialError={handleFittsTrialError}
            timeout={10000}
          />
        </>
      )}
      
      {/* TLX Modal */}
      <TLXForm
        blockNumber={blockNumber}
        isOpen={showTlxModal}
        onSubmit={handleTlxSubmit}
        onClose={handleTlxClose}
      />
    </div>
  )
}
