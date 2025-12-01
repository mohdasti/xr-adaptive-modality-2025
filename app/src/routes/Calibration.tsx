import CreditCardCalibration, { CalibrationData } from '../components/CreditCardCalibration'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function Calibration() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const handleComplete = (data: CalibrationData) => {
    // Navigate to task
    const params = searchParams.toString()
    navigate(`/task${params ? `?${params}` : ''}`)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f0f0f',
      padding: '2rem 0'
    }}>
      <CreditCardCalibration onComplete={handleComplete} />
    </div>
  )
}

