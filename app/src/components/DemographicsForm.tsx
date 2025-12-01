import React, { useState } from 'react'
import './DemographicsForm.css'

export interface DemographicsData {
  age: number | null
  gender: string
  gamingHoursPerWeek: number | null
  inputDevice: string
  visionCorrection: string // 'none' | 'glasses' | 'contacts' | 'other'
  wearingCorrectionNow: boolean
  dominantHand: string // 'left' | 'right' | 'ambidextrous'
  operatingHand: string // 'left' | 'right'
  usingDominantHand: boolean // Calculated flag
  motorImpairment: boolean
  fatigueLevel: number | null // 1-7 Likert
}

interface DemographicsFormProps {
  onComplete: (data: DemographicsData) => void
}

export function DemographicsForm({ onComplete }: DemographicsFormProps) {
  const [age, setAge] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [gamingHoursPerWeek, setGamingHoursPerWeek] = useState<string>('')
  const [inputDevice, setInputDevice] = useState<string>('')
  const [visionCorrection, setVisionCorrection] = useState<string>('')
  const [wearingCorrectionNow, setWearingCorrectionNow] = useState<boolean>(false)
  const [dominantHand, setDominantHand] = useState<string>('')
  const [operatingHand, setOperatingHand] = useState<string>('')
  const [motorImpairment, setMotorImpairment] = useState<boolean>(false)
  const [fatigueLevel, setFatigueLevel] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Age validation
    const ageNum = parseInt(age, 10)
    if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
      newErrors.age = 'Please enter a valid age (18-120)'
    }

    // Gender validation
    if (!gender) {
      newErrors.gender = 'Please select your gender'
    }

    // Gaming hours validation
    const gamingHoursNum = gamingHoursPerWeek ? parseFloat(gamingHoursPerWeek) : null
    if (gamingHoursNum === null || isNaN(gamingHoursNum) || gamingHoursNum < 0 || gamingHoursNum > 168) {
      newErrors.gamingHoursPerWeek = 'Please enter hours per week (0-168)'
    }

    // Input device validation
    if (!inputDevice) {
      newErrors.inputDevice = 'Please select your primary input device'
    }
    
    // Vision correction validation
    if (!visionCorrection) {
      newErrors.visionCorrection = 'Please answer about vision correction'
    }
    
    // Dominant hand validation
    if (!dominantHand) {
      newErrors.dominantHand = 'Please select your dominant hand'
    }
    
    // Operating hand validation
    if (!operatingHand) {
      newErrors.operatingHand = 'Please select which hand you are using for the mouse'
    }
    
    // Fatigue level validation
    const fatigueNum = fatigueLevel ? parseInt(fatigueLevel, 10) : null
    if (fatigueNum === null || isNaN(fatigueNum) || fatigueNum < 1 || fatigueNum > 7) {
      newErrors.fatigueLevel = 'Please rate your fatigue level (1-7)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Calculate using_dominant_hand flag
  const calculateUsingDominantHand = (): boolean => {
    if (!dominantHand || !operatingHand) return false
    if (dominantHand === 'ambidextrous') return true // Assume comfortable either way
    return dominantHand === operatingHand
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Warnings are informational only - don't block submission
    // Trackpad and motor impairment warnings are shown inline in the form
    
    if (validate()) {
      const ageNum = parseInt(age, 10)
      const gamingHoursNum = gamingHoursPerWeek ? parseFloat(gamingHoursPerWeek) : 0
      const fatigueNum = fatigueLevel ? parseInt(fatigueLevel, 10) : null
      
      onComplete({
        age: ageNum,
        gender,
        gamingHoursPerWeek: gamingHoursNum,
        inputDevice,
        visionCorrection,
        wearingCorrectionNow,
        dominantHand,
        operatingHand,
        usingDominantHand: calculateUsingDominantHand(),
        motorImpairment,
        fatigueLevel: fatigueNum,
      })
    }
  }

  return (
    <div className="demographics-form-container">
      <h1 className="demographics-title">Background Information</h1>
      <p className="demographics-intro">
        Please provide some basic information about yourself. This information will help us analyze
        the results of the experiment.
      </p>

      <form onSubmit={handleSubmit} className="demographics-form">
        {/* Age */}
        <div className="form-group">
          <label htmlFor="age" className="form-label required">
            Age
          </label>
          <input
            id="age"
            type="number"
            min="18"
            max="120"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={`form-input ${errors.age ? 'error' : ''}`}
            placeholder="Enter your age"
          />
          {errors.age && <span className="error-message">{errors.age}</span>}
        </div>

        {/* Gender */}
        <div className="form-group">
          <label className="form-label required">Gender</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={gender === 'male'}
                onChange={(e) => setGender(e.target.value)}
              />
              <span>Male</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={gender === 'female'}
                onChange={(e) => setGender(e.target.value)}
              />
              <span>Female</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="gender"
                value="non-binary"
                checked={gender === 'non-binary'}
                onChange={(e) => setGender(e.target.value)}
              />
              <span>Non-binary</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="gender"
                value="prefer-not-to-say"
                checked={gender === 'prefer-not-to-say'}
                onChange={(e) => setGender(e.target.value)}
              />
              <span>Prefer not to say</span>
            </label>
          </div>
          {errors.gender && <span className="error-message">{errors.gender}</span>}
        </div>

        {/* Gaming Hours Per Week */}
        <div className="form-group">
          <label htmlFor="gamingHours" className="form-label required">
            How many hours per week do you play fast-paced video games?
          </label>
          <p className="form-help">
            Include FPS, MOBA, Action, or other fast-paced games. This is a critical covariate for
            Fitts&apos; Law performance analysis.
          </p>
          <input
            id="gamingHours"
            type="number"
            min="0"
            max="168"
            step="0.5"
            value={gamingHoursPerWeek}
            onChange={(e) => setGamingHoursPerWeek(e.target.value)}
            className={`form-input ${errors.gamingHoursPerWeek ? 'error' : ''}`}
            placeholder="0 if none"
          />
          {errors.gamingHoursPerWeek && (
            <span className="error-message">{errors.gamingHoursPerWeek}</span>
          )}
        </div>

        {/* Input Device */}
        <div className="form-group">
          <label className="form-label required">What input device are you using?</label>
          <p className="form-help">
            Select the device you will use to control the cursor during this experiment.
          </p>
          {inputDevice === 'trackpad' && (
            <div className="warning-box">
              <strong>⚠️ Recommendation:</strong> This experiment is optimized for external mice.
              Trackpads may significantly affect performance measurements. We recommend using an
              external mouse if possible.
            </div>
          )}
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="inputDevice"
                value="mouse"
                checked={inputDevice === 'mouse'}
                onChange={(e) => setInputDevice(e.target.value)}
              />
              <span>External Mouse</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="inputDevice"
                value="trackpad"
                checked={inputDevice === 'trackpad'}
                onChange={(e) => setInputDevice(e.target.value)}
              />
              <span>Laptop Trackpad / Touchpad</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="inputDevice"
                value="trackball"
                checked={inputDevice === 'trackball'}
                onChange={(e) => setInputDevice(e.target.value)}
              />
              <span>Trackball</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="inputDevice"
                value="drawing-tablet"
                checked={inputDevice === 'drawing-tablet'}
                onChange={(e) => setInputDevice(e.target.value)}
              />
              <span>Drawing Tablet / Graphics Tablet</span>
            </label>
          </div>
          {errors.inputDevice && <span className="error-message">{errors.inputDevice}</span>}
        </div>

        {/* Vision Correction */}
        <div className="form-group">
          <label className="form-label required">Do you wear glasses or contact lenses?</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="visionCorrection"
                value="none"
                checked={visionCorrection === 'none'}
                onChange={(e) => {
                  setVisionCorrection(e.target.value)
                  setWearingCorrectionNow(false)
                }}
              />
              <span>No vision correction</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="visionCorrection"
                value="glasses"
                checked={visionCorrection === 'glasses'}
                onChange={(e) => setVisionCorrection(e.target.value)}
              />
              <span>Glasses</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="visionCorrection"
                value="contacts"
                checked={visionCorrection === 'contacts'}
                onChange={(e) => setVisionCorrection(e.target.value)}
              />
              <span>Contact lenses</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="visionCorrection"
                value="other"
                checked={visionCorrection === 'other'}
                onChange={(e) => setVisionCorrection(e.target.value)}
              />
              <span>Other vision correction</span>
            </label>
          </div>
          {errors.visionCorrection && (
            <span className="error-message">{errors.visionCorrection}</span>
          )}
          
          {(visionCorrection === 'glasses' || visionCorrection === 'contacts') && (
            <div className="checkbox-group" style={{ marginTop: '0.5rem' }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={wearingCorrectionNow}
                  onChange={(e) => setWearingCorrectionNow(e.target.checked)}
                />
                <span>I am wearing my {visionCorrection === 'glasses' ? 'glasses' : 'contacts'} now</span>
              </label>
            </div>
          )}
        </div>

        {/* Handedness */}
        <div className="form-group">
          <label className="form-label required">What is your dominant hand?</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="dominantHand"
                value="right"
                checked={dominantHand === 'right'}
                onChange={(e) => setDominantHand(e.target.value)}
              />
              <span>Right-handed</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="dominantHand"
                value="left"
                checked={dominantHand === 'left'}
                onChange={(e) => setDominantHand(e.target.value)}
              />
              <span>Left-handed</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="dominantHand"
                value="ambidextrous"
                checked={dominantHand === 'ambidextrous'}
                onChange={(e) => setDominantHand(e.target.value)}
              />
              <span>Ambidextrous</span>
            </label>
          </div>
          {errors.dominantHand && <span className="error-message">{errors.dominantHand}</span>}
        </div>

        {/* Operating Hand */}
        <div className="form-group">
          <label className="form-label required">Which hand are you currently using to control the mouse/input device?</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="operatingHand"
                value="right"
                checked={operatingHand === 'right'}
                onChange={(e) => setOperatingHand(e.target.value)}
              />
              <span>Right hand</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="operatingHand"
                value="left"
                checked={operatingHand === 'left'}
                onChange={(e) => setOperatingHand(e.target.value)}
              />
              <span>Left hand</span>
            </label>
          </div>
          {errors.operatingHand && <span className="error-message">{errors.operatingHand}</span>}
          {dominantHand && operatingHand && (
            <p className="form-help" style={{ marginTop: '0.5rem' }}>
              {calculateUsingDominantHand()
                ? '✓ Using your dominant hand'
                : 'ℹ Using your non-dominant hand (this will be accounted for in analysis)'}
            </p>
          )}
        </div>

        {/* Motor Impairment */}
        <div className="form-group">
          <label className="form-label required">
            Do you have any condition that affects the movement of your hands or arms?
          </label>
          <p className="form-help">
            Examples: arthritis, tremors, RSI, Parkinson&apos;s, recent injury, etc.
          </p>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="motorImpairment"
                value="no"
                checked={!motorImpairment}
                onChange={() => setMotorImpairment(false)}
              />
              <span>No</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="motorImpairment"
                value="yes"
                checked={motorImpairment}
                onChange={() => setMotorImpairment(true)}
              />
              <span>Yes</span>
            </label>
          </div>
          {motorImpairment && (
            <div className="warning-box" style={{ marginTop: '0.5rem' }}>
              <strong>Note:</strong> If you have a motor impairment, your data may be excluded from
              the main Fitts&apos; Law analysis to ensure valid baseline measurements. However, we
              may analyze your data separately for accessibility research purposes. You can still
              participate in the experiment.
            </div>
          )}
        </div>

        {/* Fatigue Level */}
        <div className="form-group">
          <label htmlFor="fatigueLevel" className="form-label required">
            How tired do you feel right now?
          </label>
          <p className="form-help">
            Rate your current fatigue level on a scale from 1 (very alert) to 7 (very tired).
          </p>
          <div className="slider-group">
            <input
              id="fatigueLevel"
              type="range"
              min="1"
              max="7"
              step="1"
              value={fatigueLevel || '4'}
              onChange={(e) => setFatigueLevel(e.target.value)}
              className="slider-input"
            />
            <div className="slider-labels">
              <span>1 - Very Alert</span>
              <span>4 - Neutral</span>
              <span>7 - Very Tired</span>
            </div>
            <div className="slider-value-display">
              Current: <strong>{fatigueLevel || '4'}</strong>
            </div>
          </div>
          {errors.fatigueLevel && <span className="error-message">{errors.fatigueLevel}</span>}
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">
            Continue
          </button>
        </div>
      </form>
    </div>
  )
}

