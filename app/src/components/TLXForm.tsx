import { useState, useEffect, useMemo } from 'react'
import './TLXForm.css'

export interface TLXValues {
  mental: number
  physical: number
  temporal: number
  performance: number
  effort: number
  frustration: number
}

export interface TLXFormProps {
  blockNumber: number
  isOpen: boolean
  onSubmit: (values: TLXValues) => void
  onClose: () => void
}

export function TLXForm({ blockNumber, isOpen, onSubmit, onClose }: TLXFormProps) {
  const DEFAULT_VALUES: TLXValues = useMemo(
    () => ({
      mental: 50,
      physical: 50,
      temporal: 50,
      performance: 50,
      effort: 50,
      frustration: 50,
    }),
    []
  )

  const [values, setValues] = useState<TLXValues>(DEFAULT_VALUES)
  const [canSubmit, setCanSubmit] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setValues(DEFAULT_VALUES)
      setCanSubmit(true)
    }
  }, [isOpen, DEFAULT_VALUES])

  const handleSubmit = () => {
    if (!canSubmit) return
    
    onSubmit({
      ...values,
    })
  }

  const handleClose = () => {
    onClose()
  }

  const handleSliderChange = (key: keyof TLXValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = parseInt(event.target.value, 10)
    setValues((prev) => ({
      ...prev,
      [key]: nextValue,
    }))
  }

  const items: Array<{ key: keyof TLXValues; label: string; helper?: string }> = [
    { key: 'mental', label: 'Mental Demand' },
    { key: 'physical', label: 'Physical Demand' },
    { key: 'temporal', label: 'Temporal Demand' },
    { key: 'performance', label: 'Performance', helper: '(0 = perfect, 100 = poor)' },
    { key: 'effort', label: 'Effort' },
    { key: 'frustration', label: 'Frustration' },
  ]

  if (!isOpen) return null

  return (
    <div className="tlx-modal-overlay" onClick={handleClose}>
      <div className="tlx-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="tlx-header">
          <h2>NASA-TLX Workload Assessment</h2>
          <p className="tlx-subtitle">Block {blockNumber} Complete</p>
          <p className="tlx-description">
            Please rate your workload for this block using the six raw NASA-TLX dimensions (0–100).
          </p>
        </div>

        <div className="tlx-form">
          {items.map(({ key, label, helper }) => (
            <div className="tlx-item" key={key}>
              <div className="tlx-label-row">
                <label className="tlx-label">
                  {label}
                  {helper && <span className="tlx-helper">{helper}</span>}
                </label>
                <span className="tlx-value">{values[key]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={values[key]}
                onChange={handleSliderChange(key)}
                className="tlx-slider"
              />
              <div className="tlx-scale">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          ))}
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

