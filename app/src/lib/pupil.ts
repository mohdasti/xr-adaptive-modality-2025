/**
 * Pupil diameter proxy using webcam + canvas luminance estimation
 * Provides a simplified measure for cognitive load assessment
 * 
 * WARNING: This is a simplified proxy and should NOT be used for medical diagnosis.
 * Use only for research purposes with informed consent.
 */

export interface PupilReading {
  zScore: number
  rawLuminance: number
  timestamp: number
}

/**
 * Pupil proxy tracker
 */
export class PupilTracker {
  private stream: MediaStream | null = null
  private video: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private intervalId: number | null = null
  
  private readings: PupilReading[] = []
  private readonly maxReadings = 20 // Keep last 20 readings (~1-2s at 10-20fps)
  
  private isRunning = false
  private onReadingCallback?: (reading: PupilReading) => void
  
  // Luminance baseline for z-score calculation
  private baselineMean = 128 // Middle gray
  private baselineStd = 20 // Standard deviation estimate

  /**
   * Start tracking with webcam
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('PupilTracker already running')
      return
    }

    try {
      // Request camera permission
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front-facing camera
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
      })

      // Create video element
      this.video = document.createElement('video')
      this.video.srcObject = this.stream
      this.video.autoplay = true
      this.video.playsInline = true
      this.video.style.display = 'none'
      document.body.appendChild(this.video)

      // Create canvas for luminance sampling
      this.canvas = document.createElement('canvas')
      this.canvas.width = 320
      this.canvas.height = 240
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })

      // Wait for video to be ready
      await new Promise((resolve) => {
        if (this.video) {
          this.video.onloadedmetadata = resolve
        }
      })

      this.isRunning = true

      // Start reading loop (10-20fps)
      this.intervalId = window.setInterval(() => {
        this.captureFrame()
      }, 50) // ~20fps

      console.log('PupilTracker started successfully')
    } catch (error) {
      console.error('Failed to start PupilTracker:', error)
      throw error
    }
  }

  /**
   * Stop tracking
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    if (this.video) {
      this.video.srcObject = null
      document.body.removeChild(this.video)
      this.video = null
    }

    if (this.canvas) {
      this.canvas = null
      this.ctx = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    this.isRunning = false
    console.log('PupilTracker stopped')
  }

  /**
   * Capture and analyze a single frame
   */
  private captureFrame(): void {
    if (!this.video || !this.canvas || !this.ctx) return

    // Draw video frame to canvas
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)

    // Sample luminance from center region (proxy for pupil)
    // We focus on a small center region to approximate where eyes are
    const sampleSize = 40
    const startX = (this.canvas.width - sampleSize) / 2
    const startY = (this.canvas.height - sampleSize) / 2

    const imageData = this.ctx.getImageData(
      startX,
      startY,
      sampleSize,
      sampleSize
    )

    // Calculate average luminance
    let totalLuminance = 0
    const pixelCount = imageData.data.length / 4

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i]
      const g = imageData.data[i + 1]
      const b = imageData.data[i + 2]
      
      // Use relative luminance formula
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b
      totalLuminance += luminance
    }

    const avgLuminance = totalLuminance / pixelCount

    // Calculate z-score
    const zScore = (avgLuminance - this.baselineMean) / this.baselineStd

    // Create reading
    const reading: PupilReading = {
      zScore,
      rawLuminance: avgLuminance,
      timestamp: Date.now(),
    }

    // Store reading
    this.readings.push(reading)
    if (this.readings.length > this.maxReadings) {
      this.readings.shift()
    }

    // Emit callback if set
    if (this.onReadingCallback) {
      this.onReadingCallback(reading)
    }
  }

  /**
   * Get median z-score over recent readings
   */
  getMedianZScore(): number {
    if (this.readings.length === 0) return 0

    const zScores = this.readings
      .map((r) => r.zScore)
      .sort((a, b) => a - b)

    const mid = Math.floor(zScores.length / 2)

    if (zScores.length % 2 === 0) {
      return (zScores[mid - 1] + zScores[mid]) / 2
    } else {
      return zScores[mid]
    }
  }

  /**
   * Get current reading
   */
  getCurrentReading(): PupilReading | null {
    if (this.readings.length === 0) return null
    return this.readings[this.readings.length - 1]
  }

  /**
   * Get all recent readings
   */
  getRecentReadings(count: number = this.maxReadings): PupilReading[] {
    return this.readings.slice(-count)
  }

  /**
   * Set callback for new readings
   */
  onReading(callback: (reading: PupilReading) => void): void {
    this.onReadingCallback = callback
  }

  /**
   * Check if tracker is running
   */
  get running(): boolean {
    return this.isRunning
  }

  /**
   * Update baseline for z-score calculation
   */
  updateBaseline(mean: number, std: number): void {
    this.baselineMean = mean
    this.baselineStd = std
  }
}

// Global singleton instance
let globalPupilTracker: PupilTracker | null = null

/**
 * Get the global pupil tracker instance
 */
export function getPupilTracker(): PupilTracker {
  if (!globalPupilTracker) {
    globalPupilTracker = new PupilTracker()
  }
  return globalPupilTracker
}

/**
 * Reset the global pupil tracker
 */
export function resetPupilTracker(): void {
  if (globalPupilTracker) {
    globalPupilTracker.stop()
    globalPupilTracker = null
  }
}

/**
 * Check camera availability
 */
export async function checkCameraAvailability(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some((device) => device.kind === 'videoinput')
  } catch (error) {
    console.error('Failed to check camera availability:', error)
    return false
  }
}

