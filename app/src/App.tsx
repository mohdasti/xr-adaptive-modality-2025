import { useEffect } from 'react'
import { TaskPane } from './components/TaskPane'
import { HUDPane } from './components/HUDPane'
import { LoggerPane } from './components/LoggerPane'
import { initializePolicyEngine } from './lib/policy'
import './App.css'

function App() {
  // Initialize policy engine on mount
  useEffect(() => {
    initializePolicyEngine().catch((error) => {
      console.error('Failed to initialize policy engine:', error)
    })
  }, [])

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>XR Adaptive Modality - Control Panel</h1>
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

export default App
