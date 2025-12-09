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
 * Uses multiple methods to cross-validate and ensure accuracy, especially for Chrome
 * Returns a value that should be close to 100 at default zoom
 * 
 * Note: Chrome can incorrectly report zoom on high-DPI displays, so we use multiple
 * detection methods and cross-validate the results.
 */
export function getZoomPct(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 100
  }

  const dpr = window.devicePixelRatio ?? 1
  const results: Array<{ method: string; zoom: number; confidence: number }> = []

  // Method 1: visualViewport.scale (most accurate when available)
  // However, Chrome may report this incorrectly on some displays
  if (window.visualViewport && typeof window.visualViewport.scale === 'number') {
    const scale = window.visualViewport.scale
    const zoomPct = Math.round(scale * 100)
    
    // Lower confidence if scale seems suspicious (e.g., always 1.0 on Chrome with display scaling)
    let confidence = 0.9
    if (zoomPct === 100 && dpr !== 1) {
      // Chrome might report 100% even when zoomed on high-DPI displays
      confidence = 0.5
    }
    
    results.push({ method: 'visualViewport', zoom: zoomPct, confidence })
    
    if (import.meta.env.DEV) {
      console.log('[systemCheck] Zoom detection (visualViewport):', {
        scale,
        zoomPct,
        dpr,
        confidence,
      })
    }
  }

  // Method 2: 1-inch test element method
  // This measures CSS pixels, which are affected by browser zoom
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

  // At 100% browser zoom, 1in should equal 96 CSS pixels
  // On high-DPI displays, Chrome may report this differently
  let zoomPct1in = Math.round((px / 96) * 100)
  
  // Chrome quirk: On some high-DPI displays, the 1in measurement might be
  // affected by display scaling. If we get an unexpected value, try correcting.
  // If zoom is very low (< 60%), it's likely real zoom, not a measurement error
  if (zoomPct1in < 60 || (zoomPct1in >= 95 && zoomPct1in <= 105)) {
    // Likely accurate
    results.push({ method: '1in', zoom: zoomPct1in, confidence: 0.8 })
  } else if (dpr > 1 && zoomPct1in > 150) {
    // Might be DPR-related, try correction
    const corrected = Math.round((px / 96 / dpr) * 100)
    if (corrected >= 50 && corrected <= 150) {
      results.push({ method: '1in-corrected', zoom: corrected, confidence: 0.7 })
    }
  } else {
    results.push({ method: '1in', zoom: zoomPct1in, confidence: 0.6 })
  }

  if (import.meta.env.DEV) {
    console.log('[systemCheck] Zoom detection (1in method):', {
      measuredPx: px,
      zoomPct1in,
      dpr,
    })
  }

  // Method 3: Window size comparison (only reliable when window is maximized/fullscreen)
  // Compare innerWidth to screen width to detect zoom
  if (typeof window.screen !== 'undefined') {
    const windowRatio = window.innerWidth / window.screen.width
    // At 100% zoom on a maximized window, ratio should be close to 1.0
    // At 50% zoom, ratio would be ~0.5
    // At 200% zoom, ratio would be ~2.0 (but limited by screen size)
    if (windowRatio > 0.4 && windowRatio < 2.0) {
      const zoomPctWindow = Math.round(windowRatio * 100)
      // Only use this if window is large enough (likely maximized)
      if (window.innerWidth >= window.screen.width * 0.9) {
        results.push({ method: 'window-size', zoom: zoomPctWindow, confidence: 0.7 })
      }
    }
  }

  // Method 4: Use matchMedia to detect zoom (Chrome-specific)
  // Chrome reports resolution differently at different zoom levels
  try {
    const mediaQuery = window.matchMedia('(resolution: 96dpi)')
    // This is a heuristic - if the media query matches, we're likely at 100% zoom
    // But this isn't always reliable, so low confidence
    if (mediaQuery.matches) {
      results.push({ method: 'matchMedia', zoom: 100, confidence: 0.4 })
    }
  } catch (e) {
    // matchMedia might not support resolution query
  }

  // Choose the best result
  if (results.length === 0) {
    return 100 // Default fallback
  }

  // Sort by confidence and look for consensus
  results.sort((a, b) => b.confidence - a.confidence)
  
  // If we have multiple high-confidence results, check for consensus
  const highConfidence = results.filter(r => r.confidence >= 0.7)
  if (highConfidence.length >= 2) {
    // Check if they agree (within 5%)
    const first = highConfidence[0].zoom
    const second = highConfidence[1].zoom
    if (Math.abs(first - second) <= 5) {
      // Consensus - use average
      const avg = Math.round((first + second) / 2)
      if (import.meta.env.DEV) {
        console.log('[systemCheck] Zoom consensus:', { first, second, avg, results })
      }
      return avg
    }
  }

  // If visualViewport says 100% but 1in method says something very different,
  // and we're on Chrome with high DPR, trust the 1in method more
  const visualViewportResult = results.find(r => r.method === 'visualViewport')
  const oneInchResult = results.find(r => r.method === '1in' || r.method === '1in-corrected')
  
  if (visualViewportResult && oneInchResult && dpr > 1) {
    const vvZoom = visualViewportResult.zoom
    const oiZoom = oneInchResult.zoom
    
    // If visualViewport says 100% but 1in says 50%, trust 1in (Chrome bug)
    if (vvZoom === 100 && oiZoom >= 45 && oiZoom <= 55) {
      if (import.meta.env.DEV) {
        console.log('[systemCheck] Chrome zoom bug detected, using 1in method:', {
          visualViewport: vvZoom,
          oneInch: oiZoom,
          using: oiZoom,
        })
      }
      return oiZoom
    }
    
    // If visualViewport says 50% but 1in says 100%, trust visualViewport
    if (vvZoom >= 45 && vvZoom <= 55 && oiZoom === 100) {
      if (import.meta.env.DEV) {
        console.log('[systemCheck] Using visualViewport over 1in:', {
          visualViewport: vvZoom,
          oneInch: oiZoom,
          using: vvZoom,
        })
      }
      return vvZoom
    }
  }

  // Use highest confidence result
  const best = results[0]
  if (import.meta.env.DEV) {
    console.log('[systemCheck] Zoom detection final result:', {
      method: best.method,
      zoom: best.zoom,
      confidence: best.confidence,
      allResults: results,
    })
  }
  
  return best.zoom
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

