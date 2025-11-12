/**
 * Modality mechanics for adaptive selection
 */

/**
 * Available modalities
 */
export enum Modality {
  GAZE = 'gaze',
  HAND = 'hand',
}

/**
 * Dwell time presets (milliseconds)
 */
export const DWELL_TIMES = {
  NONE: 0, // Require explicit confirmation (Space key)
  SHORT: 350, // Short dwell
  MEDIUM: 500, // Medium dwell
} as const

export type DwellTime = (typeof DWELL_TIMES)[keyof typeof DWELL_TIMES]

/**
 * Modality configuration
 */
export interface ModalityConfig {
  modality: Modality
  dwellTime: DwellTime // Only applies to gaze modality
}

/**
 * Default modality configuration
 */
export const DEFAULT_MODALITY_CONFIG: ModalityConfig = {
  modality: Modality.HAND,
  dwellTime: DWELL_TIMES.NONE,
}

/**
 * Selection state for gaze modality
 */
export interface GazeState {
  isHovering: boolean
  hoverStartTime: number | null
  dwellProgress: number // 0-1
  requiresConfirmation: boolean // true if dwell === 0
}

/**
 * Create initial gaze state
 */
export function createGazeState(dwellTime: DwellTime): GazeState {
  return {
    isHovering: false,
    hoverStartTime: null,
    dwellProgress: 0,
    requiresConfirmation: dwellTime === DWELL_TIMES.NONE,
  }
}

/**
 * Update gaze state based on hover and time
 */
export function updateGazeState(
  state: GazeState,
  isHovering: boolean,
  currentTime: number,
  dwellTime: DwellTime
): GazeState {
  // Starting hover
  if (isHovering && !state.isHovering) {
    return {
      ...state,
      isHovering: true,
      hoverStartTime: currentTime,
      dwellProgress: 0,
    }
  }

  // Continuing hover
  if (isHovering && state.isHovering && state.hoverStartTime) {
    const elapsed = currentTime - state.hoverStartTime
    const progress = dwellTime > 0 ? Math.min(elapsed / dwellTime, 1) : 0

    return {
      ...state,
      dwellProgress: progress,
    }
  }

  // Stopped hovering
  if (!isHovering && state.isHovering) {
    return {
      ...state,
      isHovering: false,
      hoverStartTime: null,
      dwellProgress: 0,
    }
  }

  return state
}

/**
 * Check if gaze selection is complete
 */
export function isGazeSelectionComplete(
  state: GazeState,
  dwellTime: DwellTime,
  spacePressed: boolean
): boolean {
  if (!state.isHovering) return false

  // Dwell-based selection
  if (dwellTime > 0) {
    return state.dwellProgress >= 1
  }

  // Confirmation-based selection (dwell === 0)
  return spacePressed
}

/**
 * Check if a point is within a circular target
 */
export function isPointInTarget(
  point: { x: number; y: number },
  target: { x: number; y: number },
  targetWidth: number
): boolean {
  const radius = targetWidth / 2
  const dx = point.x - target.x
  const dy = point.y - target.y
  return Math.sqrt(dx * dx + dy * dy) <= radius
}

/**
 * Get modality display name
 */
export function getModalityLabel(modality: Modality): string {
  switch (modality) {
    case Modality.GAZE:
      return 'Gaze-like'
    case Modality.HAND:
      return 'Hand-like'
    default:
      return 'Unknown'
  }
}

/**
 * Get dwell time display name
 */
export function getDwellLabel(dwellTime: DwellTime): string {
  switch (dwellTime) {
    case DWELL_TIMES.NONE:
      return 'Space to confirm'
    case DWELL_TIMES.SHORT:
      return '350ms dwell'
    case DWELL_TIMES.MEDIUM:
      return '500ms dwell'
    default:
      return `${dwellTime}ms dwell`
  }
}

/**
 * Modality state manager
 */
export class ModalityManager {
  private config: ModalityConfig

  constructor(config: ModalityConfig = DEFAULT_MODALITY_CONFIG) {
    // Create a copy to avoid mutating the default
    this.config = { ...config }
  }

  getConfig(): ModalityConfig {
    return { ...this.config }
  }

  setModality(modality: Modality): void {
    this.config.modality = modality
  }

  setDwellTime(dwellTime: DwellTime): void {
    this.config.dwellTime = dwellTime
  }

  updateConfig(config: Partial<ModalityConfig>): void {
    this.config = { ...this.config, ...config }
  }

  isGazeMode(): boolean {
    return this.config.modality === Modality.GAZE
  }

  isHandMode(): boolean {
    return this.config.modality === Modality.HAND
  }

  getDwellTime(): DwellTime {
    return this.config.dwellTime
  }
}

