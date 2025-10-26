import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FittsTask } from './FittsTask'
import { DIFFICULTY_PRESETS } from '../lib/fitts'

describe('FittsTask', () => {
  const defaultProps = {
    config: DIFFICULTY_PRESETS.medium,
    modality: 'visual',
    ui_mode: 'standard',
    pressure: 1.0,
    trialNumber: 1,
    onTrialComplete: vi.fn(),
    onTrialError: vi.fn(),
    timeout: 10000,
  }

  it('renders start button initially', () => {
    render(<FittsTask {...defaultProps} />)
    expect(screen.getByText('START')).toBeInTheDocument()
  })

  it('displays task parameters', () => {
    render(<FittsTask {...defaultProps} />)
    expect(screen.getByText(/Amplitude:/)).toBeInTheDocument()
    expect(screen.getByText(/Width:/)).toBeInTheDocument()
    expect(screen.getByText(/ID:/)).toBeInTheDocument()
    expect(screen.getByText(/Trial:/)).toBeInTheDocument()
  })

  it('shows correct parameter values', () => {
    render(<FittsTask {...defaultProps} />)
    expect(screen.getByText('400px')).toBeInTheDocument() // A
    expect(screen.getByText('40px')).toBeInTheDocument() // W
    expect(screen.getByText('3.32 bits')).toBeInTheDocument() // ID
    expect(screen.getByText('1')).toBeInTheDocument() // Trial number
  })

  it('renders canvas with correct class', () => {
    const { container } = render(<FittsTask {...defaultProps} />)
    const canvas = container.querySelector('.fitts-canvas')
    expect(canvas).toBeInTheDocument()
  })

  it('starts trial when start button is clicked', () => {
    const { container } = render(<FittsTask {...defaultProps} />)
    const canvas = container.querySelector('.fitts-canvas')
    
    // Click on start button (center of canvas)
    fireEvent.click(canvas!, { clientX: 400, clientY: 300 })
    
    // Start button should disappear
    expect(screen.queryByText('START')).not.toBeInTheDocument()
  })
})

