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
 * Check if browser is in fullscreen mode
 */
export function isFullscreen(): boolean {
  if (typeof document === 'undefined') return false

  // Standard API
  if (document.fullscreenElement) return true

  // Vendor prefixes
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null
    mozFullScreenElement?: Element | null
    msFullscreenElement?: Element | null
  }

  return !!(
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  )
}

/**
 * Get zoom percentage
 * Uses visualViewport.scale if available, otherwise infers via devicePixelRatio and CSS metrics
 */
export function getZoomPct(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 100
  }

  // Prefer visualViewport.scale (most accurate)
  if (window.visualViewport && window.visualViewport.scale) {
    return Math.round(window.visualViewport.scale * 100)
  }

  // Fallback: infer from devicePixelRatio and CSS pixel metrics
  const dpr = window.devicePixelRatio ?? 1

  // Create a 1-inch test element
  const div = document.createElement('div')
  div.style.width = '1in'
  div.style.height = '1in'
  div.style.visibility = 'hidden'
  div.style.position = 'absolute'
  div.style.top = '-9999px'
  div.style.left = '-9999px'
  document.body.appendChild(div)

  const px = div.offsetWidth
  document.body.removeChild(div)

  // 96 CSS px/inch at 100% zoom
  const zoomFromCSS = Math.round((px / 96) * 100)

  // If DPR is not 1, adjust (this is approximate)
  // At 100% zoom, 1in = 96px * DPR
  // So if we measure px, zoom = (px / (96 * DPR)) * 100
  if (dpr !== 1) {
    return Math.round((px / (96 * dpr)) * 100)
  }

  return zoomFromCSS
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

    // Check violations
    const violations: string[] = []
    if (zoom !== 100) {
      violations.push(`Zoom is ${zoom}% (must be 100%)`)
    }
    if (!fullscreen) {
      violations.push('Not in fullscreen mode')
    }
    if (currentDPR !== initialDPR) {
      violations.push(`Device pixel ratio changed from ${initialDPR} to ${currentDPR}`)
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
 */
export function verifyGates(): boolean {
  const zoom = getZoomPct()
  const fullscreen = isFullscreen()
  const currentDPR = typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1

  if (zoom !== 100 || !fullscreen || currentDPR !== initialDPR) {
    return false
  }

  return true
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

