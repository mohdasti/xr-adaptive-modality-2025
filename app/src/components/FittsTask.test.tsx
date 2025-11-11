import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FittsTask } from './FittsTask'
import { DIFFICULTY_PRESETS } from '../lib/fitts'
import { Modality, ModalityConfig, DWELL_TIMES } from '../lib/modality'

describe('FittsTask', () => {
  const defaultModalityConfig: ModalityConfig = {
    modality: Modality.HAND,
    dwellTime: DWELL_TIMES.NONE,
  }
  
  const defaultProps = {
    config: DIFFICULTY_PRESETS.medium,
    modalityConfig: defaultModalityConfig,
    ui_mode: 'standard',
    pressure: 1.0,
    trialContext: {
      globalTrialNumber: 5,
      trialInBlock: 1,
      blockNumber: 1,
      blockOrder: 'HaS' as const,
      blockTrialCount: 9,
    },
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
    expect(screen.getByText(/Trial \(Block\):/)).toBeInTheDocument()
    expect(screen.getByText(/Trial \(Global\):/)).toBeInTheDocument()
  })

  it('shows correct parameter values', () => {
    render(<FittsTask {...defaultProps} />)
    expect(screen.getByText('400px')).toBeInTheDocument() // A
    expect(screen.getByText('40px')).toBeInTheDocument() // W
    // ID is computed as log2(400/40 + 1) ≈ 3.46, check for approximate match
    expect(screen.getByText(/3\.\d+ bits/)).toBeInTheDocument() // ID (flexible match)
    expect(screen.getByText('1/9')).toBeInTheDocument() // Trial in block
    expect(screen.getByText('5')).toBeInTheDocument() // Global trial number
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

