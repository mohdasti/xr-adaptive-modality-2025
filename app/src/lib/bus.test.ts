import { describe, it, expect, beforeEach, vi } from 'vitest'
import { bus } from './bus'

describe('EventBus', () => {
  beforeEach(() => {
    bus.clear()
  })

  it('should register and trigger event handlers', () => {
    const handler = vi.fn()
    bus.on('test:event', handler)
    bus.emit('test:event', { data: 'test' })
    
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ data: 'test' })
  })

  it('should remove event handlers', () => {
    const handler = vi.fn()
    bus.on('test:event', handler)
    bus.off('test:event', handler)
    bus.emit('test:event')
    
    expect(handler).not.toHaveBeenCalled()
  })

  it('should handle multiple handlers for same event', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    
    bus.on('test:event', handler1)
    bus.on('test:event', handler2)
    bus.emit('test:event', { data: 'test' })
    
    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).toHaveBeenCalledTimes(1)
  })

  it('should not throw when emitting event with no handlers', () => {
    expect(() => bus.emit('nonexistent:event')).not.toThrow()
  })

  it('should handle errors in event handlers gracefully', () => {
    const errorHandler = vi.fn(() => {
      throw new Error('Handler error')
    })
    const normalHandler = vi.fn()
    
    bus.on('test:event', errorHandler)
    bus.on('test:event', normalHandler)
    
    expect(() => bus.emit('test:event')).not.toThrow()
    expect(normalHandler).toHaveBeenCalled()
  })
})

