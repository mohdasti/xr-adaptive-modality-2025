// Compute zoom % using improved detection (handles Chrome bugs on high-DPI displays)
import { getZoomPct } from './systemCheck'

export function getZoomPercent(): number {
  return getZoomPct()
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

  if (!okZoom || !okFS) {
    onPause('Display changed. Please return to **Fullscreen** and **100% zoom** to continue.')
    return false
  }
  return true
}

export function pointerTypeFromEvent(e: PointerEvent): string {
  return e.pointerType || 'mouse'
}

