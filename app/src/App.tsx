import { Routes, Route, Navigate } from 'react-router-dom'
import Intro from './routes/Intro'
import Demographics from './routes/Demographics'
import SystemCheck from './routes/SystemCheck'
import Calibration from './routes/Calibration'
import CameraCheck from './routes/CameraCheck'
import Task from './routes/Task'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/intro" element={<Intro />} />
      <Route path="/demographics" element={<Demographics />} />
      <Route path="/check" element={<SystemCheck />} />
      <Route path="/calibration" element={<Calibration />} />
      <Route path="/camera-check" element={<CameraCheck />} />
      <Route path="/task" element={<Task />} />
      <Route path="/" element={<Navigate to="/intro" replace />} />
    </Routes>
  )
}

export default App
