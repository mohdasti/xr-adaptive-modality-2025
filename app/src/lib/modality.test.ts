import { describe, it, expect } from 'vitest'
import {
  Modality,
  DWELL_TIMES,
  createGazeState,
  updateGazeState,
  isGazeSelectionComplete,
  isPointInTarget,
  getModalityLabel,
  getDwellLabel,
  ModalityManager,
} from './modality'

describe('Modality', () => {
  describe('createGazeState', () => {
    it('creates initial state with no confirmation required for dwell > 0', () => {
      const state = createGazeState(DWELL_TIMES.SHORT)
      expect(state.isHovering).toBe(false)
      expect(state.hoverStartTime).toBeNull()
      expect(state.dwellProgress).toBe(0)
      expect(state.requiresConfirmation).toBe(false)
    })

    it('creates initial state with confirmation required for dwell === 0', () => {
      const state = createGazeState(DWELL_TIMES.NONE)
      expect(state.requiresConfirmation).toBe(true)
    })
  })

  describe('updateGazeState', () => {
    it('starts hover when entering target', () => {
      const initial = createGazeState(DWELL_TIMES.SHORT)
      const updated = updateGazeState(initial, true, 1000, DWELL_TIMES.SHORT)
      
      expect(updated.isHovering).toBe(true)
      expect(updated.hoverStartTime).toBe(1000)
      expect(updated.dwellProgress).toBe(0)
    })

    it('updates progress during hover', () => {
      const initial = {
        isHovering: true,
        hoverStartTime: 1000,
        dwellProgress: 0,
        requiresConfirmation: false,
      }
      
      const updated = updateGazeState(initial, true, 1175, DWELL_TIMES.SHORT)
      expect(updated.dwellProgress).toBeCloseTo(0.5, 2) // 175ms / 350ms
    })

    it('completes progress at dwell time', () => {
      const initial = {
        isHovering: true,
        hoverStartTime: 1000,
        dwellProgress: 0.9,
        requiresConfirmation: false,
      }
      
      const updated = updateGazeState(initial, true, 1350, DWELL_TIMES.SHORT)
      expect(updated.dwellProgress).toBe(1)
    })

    it('resets on hover exit', () => {
      const initial = {
        isHovering: true,
        hoverStartTime: 1000,
        dwellProgress: 0.5,
        requiresConfirmation: false,
      }
      
      const updated = updateGazeState(initial, false, 1200, DWELL_TIMES.SHORT)
      expect(updated.isHovering).toBe(false)
      expect(updated.hoverStartTime).toBeNull()
      expect(updated.dwellProgress).toBe(0)
    })
  })

  describe('isGazeSelectionComplete', () => {
    it('completes on dwell progress >= 1', () => {
      const state = {
        isHovering: true,
        hoverStartTime: 1000,
        dwellProgress: 1,
        requiresConfirmation: false,
      }
      
      expect(isGazeSelectionComplete(state, DWELL_TIMES.SHORT, false)).toBe(true)
    })

    it('requires space press when dwell === 0', () => {
      const state = {
        isHovering: true,
        hoverStartTime: 1000,
        dwellProgress: 0,
        requiresConfirmation: true,
      }
      
      expect(isGazeSelectionComplete(state, DWELL_TIMES.NONE, false)).toBe(false)
      expect(isGazeSelectionComplete(state, DWELL_TIMES.NONE, true)).toBe(true)
    })

    it('returns false when not hovering', () => {
      const state = {
        isHovering: false,
        hoverStartTime: null,
        dwellProgress: 1,
        requiresConfirmation: false,
      }
      
      expect(isGazeSelectionComplete(state, DWELL_TIMES.SHORT, false)).toBe(false)
    })
  })

  describe('isPointInTarget', () => {
    it('detects point inside target', () => {
      expect(isPointInTarget({ x: 400, y: 300 }, { x: 400, y: 300 }, 80)).toBe(true)
      expect(isPointInTarget({ x: 440, y: 300 }, { x: 400, y: 300 }, 80)).toBe(true)
    })

    it('detects point outside target', () => {
      expect(isPointInTarget({ x: 500, y: 300 }, { x: 400, y: 300 }, 80)).toBe(false)
      expect(isPointInTarget({ x: 400, y: 400 }, { x: 400, y: 300 }, 80)).toBe(false)
    })
  })

  describe('getModalityLabel', () => {
    it('returns correct labels', () => {
      expect(getModalityLabel(Modality.GAZE)).toBe('Gaze Simulation')
      expect(getModalityLabel(Modality.HAND)).toBe('Mouse')
    })
  })

  describe('getDwellLabel', () => {
    it('returns correct labels', () => {
      expect(getDwellLabel(DWELL_TIMES.NONE)).toBe('Space to confirm')
      expect(getDwellLabel(DWELL_TIMES.SHORT)).toBe('350ms dwell')
      expect(getDwellLabel(DWELL_TIMES.MEDIUM)).toBe('500ms dwell')
    })
  })

  describe('ModalityManager', () => {
    it('initializes with default config', () => {
      const manager = new ModalityManager()
      expect(manager.isHandMode()).toBe(true)
      expect(manager.getDwellTime()).toBe(DWELL_TIMES.NONE)
    })

    it('updates modality', () => {
      const manager = new ModalityManager()
      manager.setModality(Modality.GAZE)
      expect(manager.isGazeMode()).toBe(true)
      expect(manager.isHandMode()).toBe(false)
    })

    it('updates dwell time', () => {
      const manager = new ModalityManager()
      manager.setDwellTime(DWELL_TIMES.SHORT)
      expect(manager.getDwellTime()).toBe(DWELL_TIMES.SHORT)
    })

    it('updates config partially', () => {
      const manager = new ModalityManager()
      // Ensure initial state is correct
      expect(manager.getDwellTime()).toBe(DWELL_TIMES.NONE)
      // Update only modality, dwellTime should remain unchanged
      manager.updateConfig({ modality: Modality.GAZE })
      expect(manager.isGazeMode()).toBe(true)
      expect(manager.getDwellTime()).toBe(DWELL_TIMES.NONE) // Should remain 0
    })
  })
})

