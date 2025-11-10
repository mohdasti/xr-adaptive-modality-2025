export interface DisplayMetadata {
  screen_width: number
  screen_height: number
  window_width: number
  window_height: number
  device_pixel_ratio: number
  zoom_level: number
  is_fullscreen: boolean
  user_agent: string
}

/**
 * Check if browser is in fullscreen mode (handles vendor prefixes)
 */
function isFullscreen(): boolean {
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

export function getDisplayMetadata(): DisplayMetadata {
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1
  
  // Detect browser zoom level (approximate)
  // Browser zoom affects outerWidth/outerHeight vs screen dimensions
  let zoomLevel = 100
  if (typeof window !== 'undefined' && typeof screen !== 'undefined') {
    // Approximate zoom: compare window outer dimensions to screen
    // This is an approximation and may not be 100% accurate
    const zoomX = (window.outerWidth / screen.width) * 100
    const zoomY = (window.outerHeight / screen.height) * 100
    // Use average, but if window is maximized/fullscreen, fall back to devicePixelRatio
    if (window.outerWidth < screen.width * 0.95) {
      zoomLevel = Math.round((zoomX + zoomY) / 2)
    } else {
      // For fullscreen/maximized windows, use devicePixelRatio as proxy
      zoomLevel = Math.round(devicePixelRatio * 100)
    }
  }

  return {
    screen_width: typeof window !== 'undefined' ? window.screen.width : 0,
    screen_height: typeof window !== 'undefined' ? window.screen.height : 0,
    window_width: typeof window !== 'undefined' ? window.innerWidth : 0,
    window_height: typeof window !== 'undefined' ? window.innerHeight : 0,
    device_pixel_ratio: devicePixelRatio,
    zoom_level: zoomLevel,
    is_fullscreen: isFullscreen(),
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  }
}

export function meetsDisplayRequirements(meta: DisplayMetadata): boolean {
  // Allow zoom between 95-105% since browser zoom detection is approximate
  const zoomOk = meta.zoom_level >= 95 && meta.zoom_level <= 105
  
  // Window size requirements
  const windowSizeOk = meta.window_width >= 1280 && meta.window_height >= 720
  
  // Accept fullscreen OR maximized window (covers >90% of screen)
  const windowCoversMostOfScreen = 
    meta.window_width >= meta.screen_width * 0.9 && 
    meta.window_height >= meta.screen_height * 0.9
  
  const displayModeOk = meta.is_fullscreen || windowCoversMostOfScreen
  
  return zoomOk && windowSizeOk && displayModeOk
}

