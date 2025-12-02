import { useState, useRef } from 'react'
import './CreditCardCalibration.css'

// Standard credit card dimensions in millimeters
const CREDIT_CARD_WIDTH_MM = 85.60
const CREDIT_CARD_HEIGHT_MM = 53.98

export interface CalibrationData {
  pixelsPerMM: number
  viewingDistanceMM: number // Assumed viewing distance (600mm = 60cm default)
  pixelsPerDegree: number // Calculated from PPD = (pixels/mm) * (distance_mm * tan(1°))
}

interface CreditCardCalibrationProps {
  onComplete: (data: CalibrationData) => void
}

export function CreditCardCalibration({ onComplete }: CreditCardCalibrationProps) {
  const [boxSize, setBoxSize] = useState(200) // pixels
  const [isCalibrating, setIsCalibrating] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // Calculate pixels per millimeter from box size
  const pixelsPerMM = boxSize / CREDIT_CARD_WIDTH_MM

  // Assume standard viewing distance of 60cm (600mm) for PPD calculation
  // PPD = pixels_per_degree = (pixels/mm) * (distance_mm * tan(1°))
  const VIEWING_DISTANCE_MM = 600
  const TAN_1_DEGREE = Math.tan((1 * Math.PI) / 180) // tan(1°)
  const pixelsPerDegree = pixelsPerMM * (VIEWING_DISTANCE_MM * TAN_1_DEGREE)

  const handleStartCalibration = () => {
    setIsCalibrating(true)
  }

  const handleComplete = () => {
    const calibrationData: CalibrationData = {
      pixelsPerMM,
      viewingDistanceMM: VIEWING_DISTANCE_MM,
      pixelsPerDegree,
    }
    
    // Store in sessionStorage
    sessionStorage.setItem('calibration', JSON.stringify(calibrationData))
    
    onComplete(calibrationData)
  }

  return (
    <div className="calibration-container">
      <h1 className="calibration-title">Screen Calibration</h1>
      
      <div className="calibration-instructions">
        <p className="instruction-text">
          To ensure accurate measurements, we need to calibrate your screen size.
        </p>
        <ol className="instruction-steps">
          <li>
            <strong>Find a standard credit card</strong> (or any card with the same size: 85.6mm × 54mm)
          </li>
          <li>
            <strong>Place the card on your screen</strong> next to the red box below
          </li>
          <li>
            <strong>Adjust the slider</strong> until the red box matches the <strong>width</strong> of your
            credit card (the shorter dimension)
          </li>
          <li>
            <strong>Click &quot;Calibration Complete&quot;</strong> when the box size matches
          </li>
        </ol>
        <div className="calibration-note">
          <strong>Note:</strong> Make sure you are sitting at a comfortable viewing distance (about an
          arm&apos;s length from the screen, roughly 60cm). The calibration assumes this distance.
        </div>
      </div>

      <div className="calibration-display">
        <div className="calibration-box-wrapper">
          <div
            ref={boxRef}
            className="calibration-box"
            style={{
              width: `${boxSize}px`,
              height: `${(boxSize * CREDIT_CARD_HEIGHT_MM) / CREDIT_CARD_WIDTH_MM}px`,
            }}
          >
            <div className="calibration-box-label">
              {boxSize.toFixed(0)}px
              <br />
              <span className="calibration-box-subtitle">
                ({((boxSize / pixelsPerMM) * 0.1).toFixed(1)}cm)
              </span>
            </div>
          </div>
        </div>

        <div className="calibration-controls">
          <div className="slider-wrapper">
            <label htmlFor="box-size-slider" className="slider-label">
              Adjust Size
            </label>
            <div className="vertical-slider-container">
              <input
                id="box-size-slider"
                type="range"
                min="50"
                max="500"
                step="1"
                value={boxSize}
                onChange={(e) => setBoxSize(parseInt(e.target.value, 10))}
                className="size-slider vertical"
              />
            </div>
            <div className="slider-value">
              {boxSize}px ({((boxSize / pixelsPerMM) * 0.1).toFixed(1)}cm)
            </div>
          </div>
        </div>
      </div>

      <div className="calibration-info">
        <div className="info-item">
          <strong>Pixels per millimeter:</strong> {pixelsPerMM.toFixed(2)} px/mm
        </div>
        <div className="info-item">
          <strong>Pixels per degree (PPD):</strong> {pixelsPerDegree.toFixed(2)} px/°
        </div>
        <div className="info-item">
          <strong>Viewing distance:</strong> {VIEWING_DISTANCE_MM / 10}cm (assumed)
        </div>
      </div>

      <div className="calibration-actions">
        {!isCalibrating ? (
          <button onClick={handleStartCalibration} className="calibration-button primary">
            Start Calibration
          </button>
        ) : (
          <button onClick={handleComplete} className="calibration-button primary">
            Calibration Complete
          </button>
        )}
      </div>
    </div>
  )
}


