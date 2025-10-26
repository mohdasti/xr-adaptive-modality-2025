import { useState, useEffect } from 'react'
import { bus } from '../lib/bus'
import './LoggerPane.css'

interface LogEntry {
  id: string
  event: string
  payload: any
  timestamp: number
  time: string
}

const MAX_LOGS = 20

export function LoggerPane() {
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
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

  const getEventClass = (event: string): string => {
    if (event.includes('error')) return 'event-error'
    if (event.includes('start')) return 'event-start'
    if (event.includes('end')) return 'event-end'
    if (event.includes('policy')) return 'event-policy'
    return ''
  }

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
        <button onClick={clearLogs} className="clear-btn">
          Clear Logs
        </button>
      </div>

      <div className="log-info">
        Showing last {logs.length} of {MAX_LOGS} events
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

