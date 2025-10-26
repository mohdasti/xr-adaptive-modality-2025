import { useState, useEffect } from 'react'
import './TLXForm.css'

export interface TLXValues {
  global: number
  mental: number
}

export interface TLXFormProps {
  blockNumber: number
  isOpen: boolean
  onSubmit: (values: TLXValues) => void
  onClose: () => void
}

export function TLXForm({ blockNumber, isOpen, onSubmit, onClose }: TLXFormProps) {
  const [globalWorkload, setGlobalWorkload] = useState(50)
  const [mentalDemand, setMentalDemand] = useState(50)
  const [canSubmit, setCanSubmit] = useState(false)

  // Ensure sliders are interactive
  useEffect(() => {
    setCanSubmit(true)
  }, [])

  const handleSubmit = () => {
    if (!canSubmit) return
    
    onSubmit({
      global: globalWorkload,
      mental: mentalDemand,
    })
  }

  const handleClose = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="tlx-modal-overlay" onClick={handleClose}>
      <div className="tlx-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="tlx-header">
          <h2>NASA-TLX Workload Assessment</h2>
          <p className="tlx-subtitle">Block {blockNumber} Complete</p>
          <p className="tlx-description">
            Please rate your workload for this block using the sliders below.
          </p>
        </div>

        <div className="tlx-form">
          {/* Global Workload */}
          <div className="tlx-item">
            <div className="tlx-label-row">
              <label className="tlx-label">Global Workload</label>
              <span className="tlx-value">{globalWorkload}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={globalWorkload}
              onChange={(e) => setGlobalWorkload(parseInt(e.target.value, 10))}
              className="tlx-slider"
            />
            <div className="tlx-scale">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>

          {/* Mental Demand */}
          <div className="tlx-item">
            <div className="tlx-label-row">
              <label className="tlx-label">Mental Demand</label>
              <span className="tlx-value">{mentalDemand}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={mentalDemand}
              onChange={(e) => setMentalDemand(parseInt(e.target.value, 10))}
              className="tlx-slider"
            />
            <div className="tlx-scale">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        </div>

        <div className="tlx-actions">
          <button
            onClick={handleSubmit}
            className="tlx-submit-btn"
            disabled={!canSubmit}
          >
            Submit
          </button>
          <button
            onClick={handleClose}
            className="tlx-skip-btn"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}

