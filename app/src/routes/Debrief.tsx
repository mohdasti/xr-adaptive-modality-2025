import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getLogger } from '../lib/csv'
import { submitDataViaEmail, submitDataToServer, getAvailableSubmissionMethod } from '../lib/dataSubmission'
import './Debrief.css'

export default function Debrief() {
  const [searchParams] = useSearchParams()
  const participantId = searchParams.get('pid') || 'Unknown'
  const sessionNum = searchParams.get('session') || '1'
  
  // Strategy questions state
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [questionsSubmitted, setQuestionsSubmitted] = useState(false)
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoSubmitAttempted, setAutoSubmitAttempted] = useState(false)
  
  const handleDownload = (merged: boolean = false) => {
    const logger = getLogger()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    
    if (merged) {
      // Download merged file (trials + TLX in one)
      logger.downloadMergedCSV(`experiment_${participantId}_session${sessionNum}_${timestamp}_merged.csv`)
    } else {
      // Download separate files
      logger.downloadCSV(`trials_${participantId}_session${sessionNum}_${timestamp}.csv`)
      setTimeout(() => {
        logger.downloadBlockCSV(`blocks_${participantId}_session${sessionNum}_${timestamp}.csv`)
      }, 500)
    }
  }
  
  // Auto-submit data when page loads (if EmailJS is configured)
  useEffect(() => {
    if (autoSubmitAttempted) return // Only attempt once
    
    const attemptAutoSubmit = async () => {
      const logger = getLogger()
      const csvData = logger.toCSV()
      const blockData = logger.getBlockRowCount() > 0 ? logger.toBlockCSV() : null
      
      // Check if we have data to submit
      if (!csvData || csvData.split('\n').length < 2) {
        console.log('[Debrief] No data to submit yet')
        return
      }
      
      const submissionMethod = getAvailableSubmissionMethod()
      if (submissionMethod === 'none') {
        console.log('[Debrief] No email submission method configured')
        return
      }
      
      setAutoSubmitAttempted(true)
      setIsSubmitting(true)
      setEmailStatus('📤 Automatically sending your data to the researcher...')
      
      try {
        const sessionParticipantId = `${participantId}_session${sessionNum}`
        
        // Check for existing debrief responses (in case they've already submitted)
        let debriefData = null
        try {
          const stored = sessionStorage.getItem('debrief_responses')
          if (stored) {
            const parsed = JSON.parse(stored)
            debriefData = {
              q1_adaptation_noticed: parsed.q1_adaptation_noticed || '',
              q2_strategy_changed: parsed.q2_strategy_changed || '',
              timestamp: parsed.timestamp || new Date().toISOString(),
            }
          }
        } catch (e) {
          console.warn('[Debrief] Failed to parse stored debrief responses:', e)
        }
        
        let result: { success: boolean; message?: string; error?: string }
        
        if (submissionMethod === 'email') {
          result = await submitDataViaEmail(csvData, blockData, sessionParticipantId, debriefData)
        } else {
          result = await submitDataToServer(csvData, blockData, sessionParticipantId, debriefData)
        }
        
        if (result.success) {
          setEmailStatus('✅ Your data has been automatically sent to the researcher!')
        } else {
          const errorMsg = result.error || 'Unknown error'
          const isSizeLimit = errorMsg.includes('exceeds EmailJS limit') || errorMsg.includes('50 KB')
          
          if (isSizeLimit) {
            // Size limit - auto-download merged file
            setEmailStatus('ℹ️ Data size exceeds email limit (50KB). Automatically downloading merged file...')
            
            setTimeout(() => {
              const logger = getLogger()
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
              logger.downloadMergedCSV(`experiment_${sessionParticipantId}_${timestamp}_merged.csv`)
              setEmailStatus('✅ Merged CSV file downloaded! Please email it to m.dastgheib@gmail.com (see instructions below).')
            }, 300)
          } else {
            setEmailStatus(`⚠️ Automatic submission failed: ${errorMsg}. Please use the download button below.`)
          }
        }
      } catch (error) {
        console.error('[Debrief] Auto-submission error:', error)
        setEmailStatus(`⚠️ Automatic submission failed. Please use the download button below.`)
      } finally {
        setIsSubmitting(false)
      }
    }
    
    // Delay auto-submit slightly to ensure page is fully loaded
    const timer = setTimeout(attemptAutoSubmit, 1000)
    return () => clearTimeout(timer)
  }, [participantId, sessionNum, autoSubmitAttempted])
  
  const handleSubmitQuestions = async () => {
    if (!q1.trim() || !q2.trim()) {
      alert('Please answer both questions before submitting.')
      return
    }
    
    // Store qualitative responses in sessionStorage
    const responses = {
      participantId,
      sessionNum,
      timestamp: new Date().toISOString(),
      q1_adaptation_noticed: q1.trim(),
      q2_strategy_changed: q2.trim(),
    }
    
    sessionStorage.setItem('debrief_responses', JSON.stringify(responses))
    setQuestionsSubmitted(true)
    
    // Immediately submit data with debrief responses
    setIsSubmitting(true)
    setEmailStatus('📤 Sending your complete data (including responses) to the researcher...')
    
    try {
      const logger = getLogger()
      const csvData = logger.toCSV()
      const blockData = logger.getBlockRowCount() > 0 ? logger.toBlockCSV() : null
      const sessionParticipantId = `${participantId}_session${sessionNum}`
      
      const debriefData = {
        q1_adaptation_noticed: responses.q1_adaptation_noticed,
        q2_strategy_changed: responses.q2_strategy_changed,
        timestamp: responses.timestamp,
      }
      
      const submissionMethod = getAvailableSubmissionMethod()
      
      if (submissionMethod !== 'none') {
        let result: { success: boolean; message?: string; error?: string }
        
        if (submissionMethod === 'email') {
          result = await submitDataViaEmail(csvData, blockData, sessionParticipantId, debriefData)
        } else {
          result = await submitDataToServer(csvData, blockData, sessionParticipantId, debriefData)
        }
        
        if (result.success) {
          setEmailStatus('✅ Your complete data has been sent to the researcher!')
        } else {
          const errorMsg = result.error || 'Unknown error'
          const isSizeLimit = errorMsg.includes('exceeds EmailJS limit') || errorMsg.includes('50 KB')
          
          if (isSizeLimit) {
            // Size limit - auto-download merged file
            setEmailStatus('ℹ️ Data size exceeds email limit (50KB). Automatically downloading merged file...')
            
            setTimeout(() => {
              const logger = getLogger()
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
              logger.downloadMergedCSV(`experiment_${sessionParticipantId}_${timestamp}_merged.csv`)
              setEmailStatus('✅ Merged CSV file downloaded! Please email it to m.dastgheib@gmail.com (see instructions below).')
            }, 300)
          } else {
            setEmailStatus(`⚠️ Submission failed: ${errorMsg}. Please use the download button below.`)
          }
        }
      } else {
        setEmailStatus('ℹ️ Email not configured. Please use the download button to save your data.')
      }
    } catch (error) {
      console.error('[Debrief] Submission error:', error)
      setEmailStatus('⚠️ Submission failed. Please use the download button below.')
    } finally {
      setIsSubmitting(false)
    }
    
    console.log('Debrief responses:', responses)
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

        <section className="debrief-section debrief-questions">
          <h2 className="section-title">Your Experience (Optional but helpful)</h2>
          <p className="section-text">
            To better understand how the adaptive interface worked for you, please share your thoughts:
          </p>
          
          {!questionsSubmitted ? (
            <>
              <div className="question-group">
                <label htmlFor="q1" className="question-label">
                  1. Did you notice the interface changing during the task? If so, how?
                </label>
                <textarea
                  id="q1"
                  value={q1}
                  onChange={(e) => setQ1(e.target.value)}
                  className="question-textarea"
                  placeholder="e.g., 'I noticed the targets getting bigger when I made mistakes...'"
                  rows={4}
                />
              </div>
              
              <div className="question-group">
                <label htmlFor="q2" className="question-label">
                  2. Did you change your strategy when the targets became easier or harder?
                </label>
                <textarea
                  id="q2"
                  value={q2}
                  onChange={(e) => setQ2(e.target.value)}
                  className="question-textarea"
                  placeholder="e.g., 'When targets got bigger, I tried to go faster...'"
                  rows={4}
                />
              </div>
              
              <button 
                onClick={handleSubmitQuestions}
                className="submit-questions-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? '⏳ Submitting...' : 'Submit Responses'}
              </button>
            </>
          ) : (
            <div className="questions-submitted">
              <p>✓ Thank you for your responses!</p>
            </div>
          )}
        </section>

        <section className="debrief-download-section">
          <h2 className="download-title">📥 Final Step: Save Your Data</h2>
          
          {emailStatus && (
            <div className={`email-status ${emailStatus.includes('✅') ? 'success' : emailStatus.includes('⚠️') ? 'warning' : 'info'}`}>
              {emailStatus}
            </div>
          )}
          
          <p className="download-text">
            {emailStatus?.includes('✅ Your data has been automatically sent')
              ? 'Your data has been automatically sent to the researcher. You can also download it below as a backup.'
              : emailStatus?.includes('exceeds email limit') || emailStatus?.includes('Merged CSV')
              ? 'Due to file size limits, automatic email submission could not complete.'
              : getAvailableSubmissionMethod() === 'none'
              ? 'Automatic email submission is not configured.'
              : 'Your data is currently stored only on this computer.'}
          </p>
          
          {!emailStatus?.includes('✅ Your data has been automatically sent') && (
            <div className="email-instructions">
              <h3 className="email-instructions-title">📧 Important: Please Email Your CSV File(s)</h3>
              <p className="email-instructions-text">
                {emailStatus?.includes('exceeds email limit') || emailStatus?.includes('Merged CSV')
                  ? 'Your data file is too large for automatic submission. Please download the CSV file(s) below and email them to:'
                  : 'Please download your CSV file(s) below and email them to the researcher at:'}
              </p>
              <div className="email-highlight">
                <strong>m.dastgheib@gmail.com</strong>
              </div>
              <p className="email-instructions-text">
                <strong>Steps:</strong>
              </p>
              <ol className="email-steps">
                <li>Click the download button below to save your CSV file(s)</li>
                <li>Open your email client (Gmail, Outlook, etc.)</li>
                <li>Create a new email to <strong>m.dastgheib@gmail.com</strong></li>
                <li>Attach the downloaded CSV file(s) to your email</li>
                <li>Use subject line: <em>Experiment Data - {participantId}</em></li>
                <li>Send the email</li>
              </ol>
              <p className="email-instructions-note">
                <strong>Important:</strong> If you downloaded multiple files, please attach ALL CSV files to your email.
              </p>
            </div>
          )}
          
          <div className="download-buttons">
            <button 
              onClick={() => handleDownload(true)}
              className="download-button primary"
            >
              Download Merged CSV (Trials + TLX - Recommended)
            </button>
            
            <button 
              onClick={() => handleDownload(false)}
              className="download-button secondary"
            >
              Download Separate Files (Trials + Blocks)
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
          <div className="footer-contact">
            <p><strong>Principal Investigator:</strong> Mohammad Dastgheib</p>
            <p className="footer-email">
              <strong>📧 Email:</strong> <a href="mailto:m.dastgheib@gmail.com" className="email-link">m.dastgheib@gmail.com</a>
            </p>
            <p className="footer-note">
              If you have questions about your rights as a participant, you may contact me at mdastgheib.com.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

