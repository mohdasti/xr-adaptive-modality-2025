import { Routes, Route, Navigate } from 'react-router-dom'
import Intro from './routes/Intro'
import SystemCheck from './routes/SystemCheck'
import CameraCheck from './routes/CameraCheck'
import Task from './routes/Task'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/intro" element={<Intro />} />
      <Route path="/check" element={<SystemCheck />} />
      <Route path="/camera-check" element={<CameraCheck />} />
      <Route path="/task" element={<Task />} />
      <Route path="/" element={<Navigate to="/intro" replace />} />
    </Routes>
  )
}

export default App
