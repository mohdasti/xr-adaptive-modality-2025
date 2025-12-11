/**
 * Application configuration
 */

export interface ExperimentalConfig {
  /**
   * Alignment gate: Requires hand input AND hover-in-target for ≥80ms before selection.
   * This is a P1 experimental feature (off by default).
   * 
   * When enabled:
   * - Selection requires both pointer down AND hover-in-target for ≥80ms
   * - Logs false-trigger rate (attempts before gate passes)
   * - Logs recovery time (time from gate failure to successful selection)
   */
  alignmentGate: boolean
}

export interface AppConfig {
  experimental: ExperimentalConfig
}

/**
 * Default application configuration
 */
export const defaultConfig: AppConfig = {
  experimental: {
    alignmentGate: true, // Enabled for data collection (P1 experimental feature)
  },
}

/**
 * Get application configuration
 * Can be extended to load from environment variables or user settings
 */
export function getConfig(): AppConfig {
  // For now, return default config
  // Future: load from localStorage, environment variables, or API
  return defaultConfig
}

/**
 * Check if alignment gate is enabled
 */
export function isAlignmentGateEnabled(): boolean {
  return getConfig().experimental.alignmentGate
}

