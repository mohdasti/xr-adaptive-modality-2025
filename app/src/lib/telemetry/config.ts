/**
 * Telemetry configuration and types
 */

export type TelemetryLevel = 'minimal' | 'full' | 'raw'

export interface TelemetryConfig {
  level: TelemetryLevel // 'minimal' = P0, 'full' = P0+, 'raw' = P0+ + P1
  sampleHz: number // target pointer sampling (use coalesced events, cap ~240 Hz)
  enableRawStreams: boolean // true when level === 'raw'
}

export const telemetryConfig: TelemetryConfig = {
  level: 'full',
  sampleHz: 240,
  enableRawStreams: false,
}

