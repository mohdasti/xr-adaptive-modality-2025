import { useSearchParams } from 'react-router-dom'
import { getLogger } from '../lib/csv'
import './Debrief.css'

export default function Debrief() {
  const [searchParams] = useSearchParams()
  const participantId = searchParams.get('pid') || 'Unknown'
  const sessionNum = searchParams.get('session') || '1'
  
  const handleDownload = () => {
    const logger = getLogger()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    
    // Download both files
    logger.downloadCSV(`trials_${participantId}_session${sessionNum}_${timestamp}.csv`)
    setTimeout(() => {
      logger.downloadBlockCSV(`blocks_${participantId}_session${sessionNum}_${timestamp}.csv`)
    }, 500)
  }

  return (
    <div className="debrief-container">
      <div className="debrief-header">
        <h1 className="debrief-title">Experiment Complete</h1>
        <p className="debrief-subtitle">
          Thank you for participating! Your contribution helps us design better interfaces for XR.
        </p>
      </div>

      <div className="debrief-content">
        <section className="debrief-section">
          <h2 className="section-title">What was this study about?</h2>
          <p className="section-text">
            We are investigating how <strong>Adaptive User Interfaces</strong> can compensate for the 
            natural instability of eye-gaze interaction.
          </p>
          <p className="section-text">
            You may have noticed that in some blocks, the interface behaved differently:
          </p>
          <ul className="feature-list">
            <li>
              <strong>Hand Mode:</strong> The targets may have &quot;inflated&quot; (grown larger) when you were under pressure, 
              making them easier to click.
            </li>
            <li>
              <strong>Gaze Mode:</strong> The interface may have &quot;decluttered&quot; (dimmed non-essential text) 
              to help you focus when the task got difficult.
            </li>
          </ul>
        </section>

        <section className="debrief-section">
          <h2 className="section-title">About the &quot;Gaze&quot; Tracker</h2>
          <p className="section-text">
            To ensure consistency across all participants without requiring expensive hardware, 
            we used a <strong>Simulated Gaze Model</strong>. The &quot;jitter&quot; and &quot;drift&quot; you experienced 
            were mathematically generated based on physiological models of human eye movement. 
            This allows us to test future interface designs today, even on standard computers.
          </p>
        </section>

        <section className="debrief-download-section">
          <h2 className="download-title">📥 Final Step: Save Your Data</h2>
          <p className="download-text">
            Your data is currently stored <strong>only on this computer</strong>. 
            Please download your session files below.
          </p>
          
          <div className="download-buttons">
            <button 
              onClick={handleDownload}
              className="download-button primary"
            >
              Download Session Data (CSV)
            </button>
            
            <button 
              onClick={() => {
                if(confirm("Delete all local data? This cannot be undone.")) {
                  getLogger().clear()
                  localStorage.clear()
                  sessionStorage.clear()
                  window.location.href = '/'
                }
              }}
              className="download-button secondary"
            >
              Delete My Data &amp; Exit
            </button>
          </div>
        </section>

        <section className="debrief-footer">
          <p><strong>Principal Investigator:</strong> [Your Name]</p>
          <p><strong>Contact:</strong> [Your Email]</p>
          <p className="footer-note">
            If you have questions about your rights as a participant, you may contact the [Institution] IRB.
          </p>
        </section>
      </div>
    </div>
  )
}

