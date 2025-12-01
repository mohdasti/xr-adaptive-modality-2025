import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getDisplayMetadata, meetsDisplayRequirements, DisplayMeta } from '../lib/system'

export default function SystemCheck() {
  const [meta, setMeta] = React.useState<DisplayMeta>(getDisplayMetadata())
  const [status, setStatus] = React.useState(meetsDisplayRequirements(getDisplayMetadata()))
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Check if demographics are completed
  const [hasDemographics, setHasDemographics] = React.useState(false)
  
  React.useEffect(() => {
    try {
      const demographicsStr = sessionStorage.getItem('demographics')
      setHasDemographics(!!demographicsStr)
    } catch (e) {
      console.warn('Failed to check demographics:', e)
    }
  }, [])

  React.useEffect(() => {
    function onChange() {
      const m = getDisplayMetadata()
      setMeta(m)
      setStatus(meetsDisplayRequirements(m))
    }

    window.addEventListener('resize', onChange)
    document.addEventListener('fullscreenchange', onChange)
    onChange()

    return () => {
      window.removeEventListener('resize', onChange)
      document.removeEventListener('fullscreenchange', onChange)
    }
  }, [])

  function goFullscreen() {
    const elem = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => void
      mozRequestFullScreen?: () => void
      msRequestFullscreen?: () => void
    }
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else if (elem.webkitRequestFullscreen) {
      // Safari
      elem.webkitRequestFullscreen()
    } else if (elem.mozRequestFullScreen) {
      // Firefox
      elem.mozRequestFullScreen()
    } else if (elem.msRequestFullscreen) {
      // IE/Edge
      elem.msRequestFullscreen()
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-4">System Check</h1>
      <ul className="mb-4 list-disc ml-6">
        <li>
          Zoom level must be <b>100%</b>.
        </li>
        <li>
          Browser must be in <b>full-screen</b>.
        </li>
        <li>
          Minimum window size: <b>1280×720</b>.
        </li>
      </ul>

      <div className="rounded border p-4 mb-4 bg-gray-50">
        <p>
          <b>Zoom:</b> {meta.zoom_level}% {status.zoomOk ? '✅' : '❌'}
        </p>
        <p>
          <b>Full-screen:</b> {meta.is_fullscreen ? 'Yes' : 'No'} {status.fsOk ? '✅' : '❌'}
        </p>
        <p>
          <b>Window:</b> {meta.window_width}×{meta.window_height} {status.resOk ? '✅' : '❌'}
        </p>
        <p className="text-xs mt-2">
          DPR={meta.device_pixel_ratio} | UA={meta.user_agent}
        </p>
      </div>

      {!hasDemographics && (
        <div className="rounded border p-4 mb-4 bg-yellow-50 border-yellow-200">
          <p className="text-yellow-800">
            <strong>Missing demographics:</strong> Please complete the demographics form first.
          </p>
        </div>
      )}
      
      <div className="flex gap-3">
        <button onClick={goFullscreen} className="px-4 py-2 rounded border">
          Enter Full-screen
        </button>
        <button
          onClick={() => {
            if (!hasDemographics) {
              const params = searchParams.toString()
              navigate(`/demographics${params ? `?${params}` : ''}`)
              return
            }
            const params = searchParams.toString()
            navigate(`/calibration${params ? `?${params}` : ''}`)
          }}
          disabled={!status.allOk}
          className={
            'px-4 py-2 rounded text-white ' +
            (status.allOk ? 'bg-black' : 'bg-gray-400 cursor-not-allowed')
          }
        >
          {hasDemographics ? 'Continue to Calibration' : 'Complete Demographics First'}
        </button>
      </div>
    </div>
  )
}
