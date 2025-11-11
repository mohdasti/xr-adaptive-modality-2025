export type DisplayMeta = {
  screen_width: number
  screen_height: number
  window_width: number
  window_height: number
  device_pixel_ratio: number
  zoom_level: number
  is_fullscreen: boolean
  user_agent: string
}

export function getDisplayMetadata(): DisplayMeta {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      screen_width: 0,
      screen_height: 0,
      window_width: 0,
      window_height: 0,
      device_pixel_ratio: 1,
      zoom_level: 100,
      is_fullscreen: false,
      user_agent: 'unknown',
    }
  }

  return {
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    window_width: window.innerWidth,
    window_height: window.innerHeight,
    device_pixel_ratio: window.devicePixelRatio ?? 1,
    zoom_level: Math.round((window.devicePixelRatio ?? 1) * 100),
    is_fullscreen: document.fullscreenElement !== null,
    user_agent: navigator.userAgent,
  }
}

export function meetsDisplayRequirements(meta: DisplayMeta) {
  const minW = 1280
  const minH = 720
  const zoomOk = meta.zoom_level === 100
  const fsOk = meta.is_fullscreen
  const resOk = meta.window_width >= minW && meta.window_height >= minH
  return { zoomOk, fsOk, resOk, allOk: zoomOk && fsOk && resOk }
}

