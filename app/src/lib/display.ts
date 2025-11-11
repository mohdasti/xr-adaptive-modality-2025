// Compute zoom % via 1in CSS trick
export function getZoomPercent(): number {
  const div = document.createElement('div')
  div.style.width = '1in'
  div.style.visibility = 'hidden'
  div.style.position = 'absolute'
  div.style.top = '-9999px'
  document.body.appendChild(div)
  const px = div.offsetWidth
  document.body.removeChild(div)
  // 96 CSS px/inch at 100% zoom
  return Math.round((px / 96) * 100)
}

export function displayStabilityScore(
  prev: { zoom: number; dpr: number; fs: boolean },
  curr: { zoom: number; dpr: number; fs: boolean }
): number {
  let s = 0
  s += prev.zoom === curr.zoom ? 0.4 : 0
  s += prev.dpr === curr.dpr ? 0.2 : 0
  s += prev.fs === curr.fs ? 0.4 : 0
  return s
}

export function enforceDisplayOrPause(onPause: (msg: string) => void): boolean {
  const okZoom = getZoomPercent() === 100
  const okFS = !!document.fullscreenElement
  const okDPR = !!window.devicePixelRatio

  if (!okZoom || !okFS) {
    onPause('Display changed. Please return to **Fullscreen** and **100% zoom** to continue.')
    return false
  }
  return true
}

export function pointerTypeFromEvent(e: PointerEvent): string {
  return e.pointerType || 'mouse'
}

