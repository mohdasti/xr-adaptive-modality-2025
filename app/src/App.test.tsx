import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders main heading', () => {
    render(<App />)
    expect(
      screen.getByText('XR Adaptive Modality - Control Panel')
    ).toBeInTheDocument()
  })

  it('renders all three panes', () => {
    render(<App />)
    expect(screen.getByText('Task Control')).toBeInTheDocument()
    expect(screen.getByText('System HUD')).toBeInTheDocument()
    expect(screen.getByText('Event Logger')).toBeInTheDocument()
  })

  it('renders task control buttons', () => {
    render(<App />)
    expect(screen.getByText('Start Trial')).toBeInTheDocument()
    expect(screen.getByText('End Trial')).toBeInTheDocument()
    expect(screen.getByText('Trigger Error')).toBeInTheDocument()
  })
})
