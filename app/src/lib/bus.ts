// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (payload: any) => void

class EventBus {
  private events: Map<string, Set<EventHandler>> = new Map()

  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(handler)
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.events.delete(event)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: string, payload?: any): void {
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload)
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error)
        }
      })
    }
  }

  clear(): void {
    this.events.clear()
  }
}

// Global singleton instance
export const bus = new EventBus()

// Type definitions for known events
export interface EventPayloads {
  'trial:start': {
    trialId: string
    trial?: number
    A?: number
    W?: number
    ID?: number
    modality?: string
    ui_mode?: string
    pressure?: number
    timestamp: number
  }
  'trial:end': {
    trialId: string
    trial?: number
    duration: number
    rt_ms?: number
    correct?: boolean
    A?: number
    W?: number
    ID?: number
    clickPos?: { x: number; y: number }
    targetPos?: { x: number; y: number }
    timestamp: number
  }
  'trial:error': {
    trialId: string
    error: string
    err_type?: 'miss' | 'timeout' | 'slip'
    rt_ms?: number
    clickPos?: { x: number; y: number }
    targetPos?: { x: number; y: number }
    timestamp: number
  }
  'policy:change': {
    policy?: string
    state?: {
      action: string
      reason: string
      triggered: boolean
      hysteresis_count: number
      delta_w?: number
    }
    timestamp: number
  }
  'block:complete': { totalTrials: number; timestamp: number }
  'modality:change': {
    config: {
      modality: string
      dwellTime: number
    }
    timestamp: number
  }
  'context:change': {
    pressure: boolean
    aging: boolean
    camera?: boolean
    timestamp: number
  }
  'tlx:submit': {
    blockNumber: number
    values: {
      global: number
      mental: number
    }
    timestamp: number
  }
}

export type EventType = keyof EventPayloads

