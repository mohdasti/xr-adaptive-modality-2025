import { TaskPane } from './components/TaskPane'
import { HUDPane } from './components/HUDPane'
import { LoggerPane } from './components/LoggerPane'
import './App.css'

function App() {
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
