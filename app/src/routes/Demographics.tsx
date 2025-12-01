import { DemographicsForm, DemographicsData } from '../components/DemographicsForm'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function Demographics() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const handleComplete = (data: DemographicsData) => {
    // Store demographics in sessionStorage
    sessionStorage.setItem('demographics', JSON.stringify(data))
    
    // Navigate to system check
    const params = searchParams.toString()
    navigate(`/check${params ? `?${params}` : ''}`)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f0f0f',
      padding: '2rem 0'
    }}>
      <DemographicsForm onComplete={handleComplete} />
    </div>
  )
}

