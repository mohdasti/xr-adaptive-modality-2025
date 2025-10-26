import { useState, useEffect } from 'react'
import { bus } from '../lib/bus'
import { getLogger, createRowFromTrial, initLogger, attachTlxToRow } from '../lib/csv'
import { getTlxStore } from '../lib/tlxStore'
import './LoggerPane.css'

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

  // Initialize CSV logger on mount
  useEffect(() => {
    const pid = prompt('Enter Participant ID (or leave blank for auto-generated):')
    initLogger(pid || undefined)
  }, [])

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
      
      // Log to CSV for trial events
      if (eventName === 'trial:end' || eventName === 'trial:error') {
        let row = createRowFromTrial(payload, blockNumber)
        
        // Attach TLX values from store
        const tlxStore = getTlxStore()
        const tlxValues = tlxStore.getBlockTLX(blockNumber)
        row = attachTlxToRow(row, tlxValues)
        
        logger.pushRow(row)
        setCsvRowCount(logger.getRowCount())
      }
      
      // Log TLX submission
      if (eventName === 'tlx:submit') {
        setCsvRowCount(logger.getRowCount())
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
    }

    // Subscribe to all events
    Object.entries(handlers).forEach(([event, handler]) => {
      bus.on(event, handler)
    })

    // Cleanup
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        bus.off(event, handler)
      })
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
        <h2>Event Logger</h2>
        <div className="logger-actions">
          <button onClick={clearLogs} className="clear-btn">
            Clear Logs
          </button>
          <div className="csv-actions">
            <span className="csv-count">{csvRowCount} rows</span>
            <button onClick={handleDownloadCSV} className="download-btn">
              📊 Download CSV
            </button>
            <button onClick={handleDownloadJSON} className="download-btn secondary">
              📄 JSON
            </button>
            <button onClick={handleClearCSV} className="clear-btn small">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div className="log-info">
        Showing last {logs.length} of {MAX_LOGS} events | Block: {currentBlock}
      </div>

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
    </div>
  )
}

