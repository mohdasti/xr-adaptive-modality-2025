import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function CameraCheck() {
  const navigate = useNavigate()
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const runningRef = React.useRef(false)
  const tickRef = React.useRef<number | null>(null)

  const [error, setError] = React.useState<string>('')
  const [quality, setQuality] = React.useState<number | null>(null)
  const [running, setRunning] = React.useState(false)
  const [progress, setProgress] = React.useState<number>(0)

  React.useEffect(() => {
    return () => {
      // Cleanup on unmount
      runningRef.current = false
      if (tickRef.current !== null) {
        cancelAnimationFrame(tickRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  async function start() {
    setError('')
    setRunning(true)
    runningRef.current = true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Crude stability metric: % of frames delivered over 10s (30fps target ~300 frames).
      const targetFrames = 300
      let frames = 0
      const start = performance.now()

      const tick = () => {
        if (!runningRef.current) return

        frames++
        const elapsed = performance.now() - start
        const progressPercent = Math.min(100, (elapsed / 10000) * 100)
        setProgress(progressPercent)

        if (elapsed < 10000) {
          tickRef.current = requestAnimationFrame(tick)
        } else {
          const q = Math.min(1, frames / targetFrames)
          setQuality(q)
          setRunning(false)
          setProgress(100)
          runningRef.current = false
          sessionStorage.setItem('camera_enabled', 'true')
          sessionStorage.setItem('camera_quality', String(q))
        }
      }

      tickRef.current = requestAnimationFrame(tick)
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string }
      setError(err?.name ?? err?.message ?? 'Camera error')
      setQuality(0)
      setRunning(false)
      runningRef.current = false
      sessionStorage.setItem('camera_enabled', 'false')
      sessionStorage.setItem('camera_quality', '0')
    }
  }

  function stop() {
    runningRef.current = false
    setRunning(false)
    setProgress(0)
    if (tickRef.current !== null) {
      cancelAnimationFrame(tickRef.current)
      tickRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  function finish() {
    // Never block; proceed regardless of quality
    if (quality === null) {
      sessionStorage.setItem('camera_enabled', 'false')
      sessionStorage.setItem('camera_quality', '0')
    }
    stop()
    navigate('/check')
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-3">Optional Camera Check</h1>
      <p className="mb-3">
        We&apos;ll briefly test your camera. If it fails or is busy (e.g., Zoom video on), we&apos;ll
        continue without it.
      </p>

      {error && (
        <p className="text-red-600 mb-2">
          Camera error: {error}. You can continue without camera.
        </p>
      )}
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className="w-full max-w-md rounded border mb-3 bg-black"
        style={{ minHeight: '200px' }}
      />

      {running && (
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full" style={{ height: '10px' }}>
            <div
              className="bg-blue-600 rounded-full transition-all"
              style={{ width: `${progress}%`, height: '10px' }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">Testing camera quality... {Math.round(progress)}%</p>
        </div>
      )}

      <div className="flex gap-3">
        {!running && (
          <button onClick={start} className="px-4 py-2 rounded bg-black text-white">
            Start 10s Test
          </button>
        )}
        {running && (
          <button onClick={stop} className="px-4 py-2 rounded border">
            Stop
          </button>
        )}
        <button onClick={finish} className="px-4 py-2 rounded border">
          Done (continue)
        </button>
      </div>

      {quality !== null && (
        <p className="mt-3">
          Quality score (0–1): <b>{quality.toFixed(2)}</b> — camera data will be treated as
          exploratory only.
        </p>
      )}
    </div>
  )
}
