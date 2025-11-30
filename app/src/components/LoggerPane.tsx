import { useState, useEffect, useRef } from 'react'
import { bus } from '../lib/bus'
import { getLogger, createRowFromTrial, initLogger } from '../lib/csv'
import { getPolicyEngine } from '../lib/policy'
import { submitDataViaEmail, submitDataToServer, getAvailableSubmissionMethod } from '../lib/dataSubmission'
import { getSessionInfoFromURL, getSessionProgress } from '../utils/sessionTracking'
import './LoggerPane.css'

// Show developer controls only in development mode
const SHOW_DEV_MODE = import.meta.env.DEV || import.meta.env.MODE === 'development'

interface LogEntry {
  id: string
  event: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
  timestamp: number
  time: string
}

const MAX_LOGS = 20

export function LoggerPane() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [csvRowCount, setCsvRowCount] = useState(0)
  const [currentBlock, setCurrentBlock] = useState(1)
  const [blockRowCount, setBlockRowCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)
  // Track adaptation state: map of trial_number -> adaptation_triggered
  const adaptationStateRef = useRef<Map<number, boolean>>(new Map())
  const lastAdaptationStateRef = useRef(false)

  // Initialize CSV logger on mount - check URL first, then prompt
  useEffect(() => {
    const urlInfo = getSessionInfoFromURL()
    if (urlInfo.participantId) {
      initLogger(urlInfo.participantId, urlInfo.sessionNumber)
      return
    }
    
    // Check localStorage for existing participant ID
    const storedPid = localStorage.getItem('participantId')
    if (storedPid) {
      initLogger(storedPid, urlInfo.sessionNumber)
      return
    }
    
    // Only prompt in dev mode if no URL params and no stored data
    // In production with custom links, URL params should always be present
    if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
      const pid = prompt('Enter Participant ID (e.g., P001) or leave blank for auto-generated:')
      if (pid) {
        localStorage.setItem('participantId', pid)
      }
      initLogger(pid || undefined, urlInfo.sessionNumber)
    } else {
      // Production: auto-generate if no URL params (shouldn't happen with custom links)
      initLogger(undefined, urlInfo.sessionNumber)
    }
  }, [])
  
  // Track session info
  const [sessionInfo, setSessionInfo] = useState<{
    participantId: string | null
    sessionNumber: number | null
    progress: { completed: number; remaining: number; percentage: number; nextBlock: number } | null
  } | null>(null)
  
  // Update session info
  useEffect(() => {
    const urlInfo = getSessionInfoFromURL()
    const pid = urlInfo.participantId || localStorage.getItem('participantId')
    
    if (pid) {
      const progress = getSessionProgress(pid, 8) // 8 blocks total
      setSessionInfo({
        participantId: pid,
        sessionNumber: urlInfo.sessionNumber,
        progress,
      })
    }
  }, [csvRowCount]) // Update when data changes

  useEffect(() => {
    const logger = getLogger()
    let blockNumber = 1
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createLogHandler = (eventName: string) => (payload: any) => {
      const entry: LogEntry = {
        id: `${eventName}-${Date.now()}-${Math.random()}`,
        event: eventName,
        payload,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString(),
      }

      setLogs((prev) => {
        const updated = [entry, ...prev]
        return updated.slice(0, MAX_LOGS)
      })
      
      // Track adaptation state from policy changes
      if (eventName === 'policy:change' && payload?.state) {
        const triggered = payload.state.triggered === true
        lastAdaptationStateRef.current = triggered
      }

      // Log to CSV for trial events
      if (eventName === 'trial:end' || eventName === 'trial:error') {
        // Get adaptation state for this trial
        const trialNumber = payload?.trial_number
        let adaptationState = false
        
        if (payload?.adaptation_triggered !== undefined) {
          // Use explicit value from payload if provided (preferred)
          adaptationState = payload.adaptation_triggered
        } else {
          // Try to get current state from policy engine
          try {
            const policyEngine = getPolicyEngine()
            const policyState = policyEngine.getState()
            adaptationState = policyState.triggered === true
          } catch {
            // Fall back to last known adaptation state
            adaptationState = lastAdaptationStateRef.current
          }
          
          // Store this association
          if (trialNumber) {
            adaptationStateRef.current.set(trialNumber, adaptationState)
          }
        }
        
        const row = createRowFromTrial(payload, blockNumber, adaptationState)
        logger.pushRow(row)
        setCsvRowCount(logger.getRowCount())
      }
      
      if (eventName === 'tlx:submit' && payload?.values) {
        logger.pushBlockRow({
          modality: payload.modality || '',
          ui_mode: payload.ui_mode || '',
          block_number: payload.blockNumber,
          tlx_mental: payload.values.mental,
          tlx_physical: payload.values.physical,
          tlx_temporal: payload.values.temporal,
          tlx_performance: payload.values.performance,
          tlx_effort: payload.values.effort,
          tlx_frustration: payload.values.frustration,
        })
        setBlockRowCount(logger.getBlockRowCount())
      }
      
      // Track block completion
      if (eventName === 'block:complete') {
        blockNumber++
        setCurrentBlock(blockNumber)
      }
    }

    const handlers = {
      'trial:start': createLogHandler('trial:start'),
      'trial:end': createLogHandler('trial:end'),
      'trial:error': createLogHandler('trial:error'),
      'policy:change': createLogHandler('policy:change'),
      'tlx:submit': createLogHandler('tlx:submit'),
    }

    // Subscribe to all events and collect unsubscribe functions
    const unsubscribers = Object.entries(handlers).map(([event, handler]) => {
      return bus.on(event, handler)
    })

    // Cleanup: call all unsubscribe functions
    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  }, [])

  const clearLogs = () => {
    setLogs([])
  }
  
  const handleDownloadCSV = () => {
    const logger = getLogger()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `experiment_${timestamp}.csv`
    logger.downloadCSV(filename)
  }

  const handleDownloadBlockCSV = () => {
    const logger = getLogger()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `block_data_${timestamp}.csv`
    logger.downloadBlockCSV(filename)
  }
  
  const handleDownloadJSON = () => {
    const logger = getLogger()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `experiment_${timestamp}.json`
    logger.downloadJSON(filename)
  }
  
  const handleClearCSV = () => {
    if (confirm('Clear all CSV data? This cannot be undone.')) {
      const logger = getLogger()
      logger.clear()
      setCsvRowCount(0)
      setBlockRowCount(0)
      setSubmitStatus(null)
    }
  }

  const handleEndSession = async () => {
    const logger = getLogger()
    
    if (csvRowCount === 0) {
      setSubmitStatus('⚠️ No data to submit for this session')
      return
    }
    
    const participantId = logger.getParticipantId()
    const sessionNum = sessionInfo?.sessionNumber || 1
    const progress = sessionInfo?.progress
    
    // Confirm before submitting
    const confirmMessage = `Submit data for Session ${sessionNum}?\n\n` +
      `Participant: ${participantId}\n` +
      `Trials: ${csvRowCount}\n` +
      `Blocks: ${blockRowCount}\n` +
      (progress ? `Progress: ${progress.completed} of 8 blocks completed\n` : '') +
      `\nThis will send all data from this session via email.`
    
    if (!confirm(confirmMessage)) {
      return
    }
    
    const csvData = logger.toCSV()
    const blockData = logger.getBlockRowCount() > 0 ? logger.toBlockCSV() : null
    
    setSubmitting(true)
    setSubmitStatus(`Submitting Session ${sessionNum} data...`)
    
    try {
      const submissionMethod = getAvailableSubmissionMethod()
      
      let result: { success: boolean; message?: string; error?: string }
      
      // Include session info in participant ID for email filename
      const sessionParticipantId = `${participantId}_session${sessionNum}`
      
      if (submissionMethod === 'email') {
        result = await submitDataViaEmail(csvData, blockData, sessionParticipantId)
      } else if (submissionMethod === 'server') {
        result = await submitDataToServer(csvData, blockData, sessionParticipantId)
      } else {
        throw new Error('No submission method configured. Please set up EmailJS or API endpoint.')
      }
      
      if (result.success) {
        setSubmitStatus(`✅ Session ${sessionNum} data submitted successfully!`)
        // Still offer download as backup
        setTimeout(() => {
          logger.downloadCSV(`backup_${sessionParticipantId}_${Date.now()}.csv`)
          if (blockData) {
            logger.downloadBlockCSV(`backup_blocks_${sessionParticipantId}_${Date.now()}.csv`)
          }
        }, 2000)
      } else {
        throw new Error(result.error || 'Submission failed')
      }
    } catch (error) {
      setSubmitStatus(`⚠️ Session submission failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please download manually.`)
      console.error('Submission error:', error)
    } finally {
      setSubmitting(false)
    }
  }


  const getEventClass = (event: string): string => {
    if (event.includes('error')) return 'event-error'
    if (event.includes('start')) return 'event-start'
    if (event.includes('end')) return 'event-end'
    if (event.includes('policy')) return 'event-policy'
    return ''
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatPayload = (payload: any): string => {
    if (!payload) return 'null'
    try {
      return JSON.stringify(payload, null, 2)
    } catch {
      return String(payload)
    }
  }

  return (
    <div className="pane logger-pane">
      <div className="logger-header">
        <h2>{SHOW_DEV_MODE ? 'Event Logger' : 'Data & Progress'}</h2>
        <div className="logger-actions">
          {SHOW_DEV_MODE && (
            <button onClick={clearLogs} className="clear-btn">
              Clear Logs
            </button>
          )}
          <div className="csv-actions">
            <span className="csv-count">{csvRowCount} trial rows</span>
            {SHOW_DEV_MODE && (
              <span className="csv-count secondary">{blockRowCount} block rows</span>
            )}
            {sessionInfo && sessionInfo.progress && (
              <span className="csv-count" style={{ color: '#00ff88' }}>
                {sessionInfo.progress.completed}/8 blocks
              </span>
            )}
            {getAvailableSubmissionMethod() !== 'none' && (
              <button 
                onClick={handleEndSession} 
                disabled={submitting || csvRowCount === 0}
                className="submit-btn"
                title="Submit all data from current session (recommended: use at end of session)"
              >
                {submitting ? '⏳ Submitting...' : `📤 End Session ${sessionInfo?.sessionNumber || ''}`}
              </button>
            )}
            <button onClick={handleDownloadCSV} className="download-btn" title="Download your data as backup">
              📊 Download CSV
            </button>
            {SHOW_DEV_MODE && (
              <>
                <button onClick={handleDownloadBlockCSV} className="download-btn secondary">
                  🧱 Block CSV
                </button>
                <button onClick={handleDownloadJSON} className="download-btn secondary">
                  📄 JSON
                </button>
                <button onClick={handleClearCSV} className="clear-btn small">
                  🗑️
                </button>
              </>
            )}
          </div>
          {submitStatus && (
            <div className={`submit-status ${submitStatus.includes('✅') ? 'success' : submitStatus.includes('⚠️') ? 'warning' : 'info'}`}>
              {submitStatus}
            </div>
          )}
        </div>
      </div>
      
      {/* Session Info Display */}
      {sessionInfo && (
        <div className="session-info" style={{ 
          marginBottom: '1rem', 
          padding: '0.75rem', 
          backgroundColor: 'rgba(0, 217, 255, 0.1)', 
          borderRadius: '4px',
          border: '1px solid rgba(0, 217, 255, 0.3)'
        }}>
          <strong>Session Info:</strong> {sessionInfo.participantId}
          {sessionInfo.sessionNumber && <span> · Session {sessionInfo.sessionNumber}</span>}
          {sessionInfo.progress && (
            <span style={{ marginLeft: '1rem' }}>
              Progress: {sessionInfo.progress.completed} of 8 blocks completed ({sessionInfo.progress.percentage.toFixed(0)}%)
            </span>
          )}
        </div>
      )}

      {SHOW_DEV_MODE && (
        <div className="log-info">
          Showing last {logs.length} of {MAX_LOGS} events | Block: {currentBlock}
        </div>
      )}

      {SHOW_DEV_MODE && (
        <div className="log-table-container">
        <table className="log-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Event</th>
              <th>Payload</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-state">
                  No events logged yet. Start a trial to see events appear here.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className={getEventClass(log.event)}>
                  <td className="time-cell">{log.time}</td>
                  <td className="event-cell">
                    <code>{log.event}</code>
                  </td>
                  <td className="payload-cell">
                    <pre>{formatPayload(log.payload)}</pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

