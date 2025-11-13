/**
 * System check and display requirement enforcement with pause-on-violation
 */

let isBlocked = false
let initialDPR: number = 1
let visibilityListeners: Array<() => void> = []
let focusBlurCount = 0
let tabHiddenStartTime: number | null = null
let tabHiddenMs = 0

/**
 * Get the initial DPR that was stored when enforcement started
 */
export function getInitialDPR(): number {
  return initialDPR
}

/**
 * Check if browser is in fullscreen mode
 * Also accepts maximized windows (covers >90% of screen) as equivalent
 */
export function isFullscreen(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false

  // Standard API
  if (document.fullscreenElement) return true

  // Vendor prefixes
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null
    mozFullScreenElement?: Element | null
    msFullscreenElement?: Element | null
  }

  if (
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  ) {
    return true
  }

  // Fallback: Check if window is maximized (covers >90% of screen)
  // This is more lenient and works better across different browsers/OS
  if (typeof window.screen !== 'undefined') {
    const windowCoversMostOfScreen =
      window.innerWidth >= window.screen.width * 0.9 &&
      window.innerHeight >= window.screen.height * 0.9
    if (windowCoversMostOfScreen) {
      return true
    }
  }

  return false
}

/**
 * Get zoom percentage
 * Uses visualViewport.scale if available (most accurate), otherwise falls back to 1-inch method
 * Returns a value that should be close to 100 at default zoom
 * 
 * Note: On high-DPI displays, we need to account for devicePixelRatio correctly.
 * visualViewport.scale is the most reliable method when available.
 */
export function getZoomPct(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 100
  }

  // Method 1: Prefer visualViewport.scale (most accurate for browser zoom)
  // visualViewport.scale directly represents browser zoom:
  // - scale = 1.0 means 100% zoom
  // - scale = 0.5 means 50% zoom (zoomed out)
  // - scale = 2.0 means 200% zoom (zoomed in)
  if (window.visualViewport && typeof window.visualViewport.scale === 'number') {
    const scale = window.visualViewport.scale
    const zoomPct = Math.round(scale * 100)
    
    // Debug logging
    if (import.meta.env.DEV) {
      console.log('[systemCheck] Zoom detection (visualViewport):', {
        scale,
        zoomPct,
        dpr: window.devicePixelRatio,
      })
    }
    
    return zoomPct
  }

  // Method 2: Fallback to 1-inch test element method
  // This measures CSS pixels, which are affected by browser zoom
  // NOTE: On some high-DPI displays/browsers, this method can be unreliable
  // We'll use it as a fallback but apply corrections if needed
  const div = document.createElement('div')
  div.style.width = '1in'
  div.style.height = '1in'
  div.style.visibility = 'hidden'
  div.style.position = 'absolute'
  div.style.top = '-9999px'
  div.style.left = '-9999px'
  div.style.padding = '0'
  div.style.margin = '0'
  div.style.border = 'none'
  document.body.appendChild(div)

  // Force a reflow to ensure measurement is accurate
  void div.offsetWidth
  
  const px = div.offsetWidth
  document.body.removeChild(div)

  const dpr = window.devicePixelRatio ?? 1
  
  // At 100% browser zoom, 1in should equal 96 CSS pixels
  // However, on high-DPI displays, some browsers report this differently
  // If we measure 192px when DPR=2, it might actually mean 100% zoom (not 200%)
  // This is because the browser might be accounting for DPR in the measurement
  
  // Try the direct calculation first
  let zoomPct = Math.round((px / 96) * 100)
  
  // Heuristic: If DPR > 1 and zoom seems too high (>150%), try dividing by DPR
  // This handles cases where the measurement is doubled on high-DPI displays
  if (dpr > 1 && zoomPct > 150) {
    const correctedZoom = Math.round((px / 96 / dpr) * 100)
    
    // Debug logging
    if (import.meta.env.DEV) {
      console.log('[systemCheck] Zoom detection (1in method, DPR correction):', {
        measuredPx: px,
        rawZoomPct: zoomPct,
        dpr,
        correctedZoom,
        usingCorrected: correctedZoom >= 50 && correctedZoom <= 150,
      })
    }
    
    // Use corrected value if it's in a reasonable range (50-150%)
    if (correctedZoom >= 50 && correctedZoom <= 150) {
      return correctedZoom
    }
  }

  // Debug logging
  if (import.meta.env.DEV) {
    console.log('[systemCheck] Zoom detection (1in method):', {
      measuredPx: px,
      zoomPct,
      dpr,
      note: 'If zoom seems wrong, check if DPR correction is needed',
    })
  }

  return zoomPct
}

/**
 * Enforce display requirements and pause on violation
 * Sets up listeners for resize, fullscreenchange, and visibilitychange
 */
export function enforceDisplayRequirements(onPause: (reason: string) => void): void {

  // Store initial DPR
  if (typeof window !== 'undefined') {
    initialDPR = window.devicePixelRatio ?? 1
  }

  // Check function
  const checkAndPause = () => {
    if (isBlocked) return // Already blocked

    const zoom = getZoomPct()
    const fullscreen = isFullscreen()
    const currentDPR = typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1

    // Check violations (with more lenient thresholds)
    const violations: string[] = []
    
    // Allow zoom between 95-105% (browser zoom detection can be imprecise)
    if (zoom < 95 || zoom > 105) {
      violations.push(`Zoom is ${zoom}% (must be 100%, or 95-105% acceptable)`)
    }
    
    // Check fullscreen (includes maximized windows)
    if (!fullscreen) {
      violations.push('Not in fullscreen or maximized mode (press F11 or ⌃⌘F, or maximize window)')
    }
    
    // Only check DPR if it changes significantly (more than 0.1)
    // DPR can fluctuate slightly on some systems
    if (Math.abs(currentDPR - initialDPR) > 0.1) {
      violations.push(`Device pixel ratio changed significantly from ${initialDPR} to ${currentDPR}`)
    }

    if (violations.length > 0) {
      isBlocked = true
      onPause(`Display settings changed: ${violations.join('; ')}. Please restore settings to continue.`)
    }
  }

  // Listen for display changes
  const handleResize = () => {
    checkAndPause()
  }

  const handleFullscreenChange = () => {
    checkAndPause()
  }

  const handleVisibilityChange = () => {
    if (typeof document === 'undefined') return

    if (document.visibilityState === 'hidden') {
      // Tab became hidden
      tabHiddenStartTime = performance.now()
      focusBlurCount++
    } else if (document.visibilityState === 'visible' && tabHiddenStartTime !== null) {
      // Tab became visible again
      const hiddenDuration = performance.now() - tabHiddenStartTime
      tabHiddenMs += hiddenDuration
      tabHiddenStartTime = null
    }

    // Also check display requirements when visibility changes
    checkAndPause()
  }

  // Attach listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    visibilityListeners.push(
      () => window.removeEventListener('resize', handleResize),
      () => document.removeEventListener('fullscreenchange', handleFullscreenChange),
      () => document.removeEventListener('webkitfullscreenchange', handleFullscreenChange),
      () => document.removeEventListener('mozfullscreenchange', handleFullscreenChange),
      () => document.removeEventListener('MSFullscreenChange', handleFullscreenChange),
      () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    )
  }

  // Initial check
  checkAndPause()
}

/**
 * Clear blocked state (call when user restores settings)
 */
export function clearBlocked(): void {
  isBlocked = false
}

/**
 * Check if currently blocked
 */
export function isBlockedState(): boolean {
  return isBlocked
}

/**
 * Verify gates before starting trial
 * Returns true if gates pass, false if blocked
 * Uses lenient thresholds: zoom 95-105%, accepts maximized windows, allows small DPR changes
 */
export function verifyGates(): boolean {
  const zoom = getZoomPct()
  const fullscreen = isFullscreen()
  const currentDPR = typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1

  // Allow zoom between 95-105% (browser zoom detection can be imprecise)
  const zoomOk = zoom >= 95 && zoom <= 105
  
  // Accept fullscreen or maximized windows
  const fullscreenOk = fullscreen
  
  // Allow small DPR changes (within 0.1)
  const dprOk = Math.abs(currentDPR - initialDPR) <= 0.1

  return zoomOk && fullscreenOk && dprOk
}

/**
 * Get current display metrics for logging
 */
export function getDisplayMetrics(): {
  zoom_pct: number
  fullscreen: boolean
  dpr: number
  viewport_w: number
  viewport_h: number
  focus_blur_count: number
  tab_hidden_ms: number
} {
  return {
    zoom_pct: getZoomPct(),
    fullscreen: isFullscreen(),
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1,
    viewport_w: typeof window !== 'undefined' ? window.innerWidth : 0,
    viewport_h: typeof window !== 'undefined' ? window.innerHeight : 0,
    focus_blur_count: focusBlurCount,
    tab_hidden_ms: tabHiddenMs,
  }
}

/**
 * Reset metrics for new trial
 */
export function resetTrialMetrics(): void {
  focusBlurCount = 0
  tabHiddenMs = 0
  tabHiddenStartTime = null
}

/**
 * Cleanup listeners
 */
export function cleanup(): void {
  visibilityListeners.forEach((cleanup) => cleanup())
  visibilityListeners = []
  isBlocked = false
}

