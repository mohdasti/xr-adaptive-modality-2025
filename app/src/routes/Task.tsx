import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TaskPane } from '../components/TaskPane'
import { HUDPane } from '../components/HUDPane'
import { LoggerPane } from '../components/LoggerPane'
import { initializePolicyEngine } from '../lib/policy'
import { enforceDisplayOrPause } from '../lib/display'

export default function Task() {
  const [displayWarning, setDisplayWarning] = useState<string | null>(null)

  // Initialize policy engine on mount
  useEffect(() => {
    initializePolicyEngine().catch((error) => {
      console.error('Failed to initialize policy engine:', error)
    })
  }, [])

  // Live display requirement checking
  useEffect(() => {
    const recheck = () => {
      const isValid = enforceDisplayOrPause((msg) => {
        setDisplayWarning(msg)
      })
      if (isValid) {
        setDisplayWarning(null)
      }
    }

    // Initial check
    recheck()

    // Listen for display changes
    window.addEventListener('resize', recheck)
    document.addEventListener('fullscreenchange', recheck)

    return () => {
      window.removeEventListener('resize', recheck)
      document.removeEventListener('fullscreenchange', recheck)
    }
  }, [])

  return (
    <div className="app-container">
      {displayWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '500px',
              textAlign: 'center',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Display Requirements</h2>
            <p
              dangerouslySetInnerHTML={{
                __html: displayWarning.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
              }}
            />
            <button
              onClick={() => setDisplayWarning(null)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <header className="app-header">
        <h1>XR Adaptive Modality - Control Panel</h1>
        <nav className="app-nav">
          <Link to="/intro" className="nav-link">
            Help / How it works
          </Link>
        </nav>
      </header>

      <main className="app-grid">
        <div className="grid-item task">
          <TaskPane />
        </div>

        <div className="grid-item hud">
          <HUDPane />
        </div>

        <div className="grid-item logger">
          <LoggerPane />
        </div>
      </main>
    </div>
  )
}

