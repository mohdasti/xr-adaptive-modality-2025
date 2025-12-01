import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function Intro() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-4">Welcome! How this study works</h1>

      <p className="mb-3">
        You&apos;ll complete short target-selection tasks, adapted from the ISO 9241-9
        standard used to evaluate pointing performance (commonly called &quot;Fitts&apos; Law&quot; tasks).
        You&apos;ll do this with two input methods:
      </p>

      <ul className="list-disc ml-6 mb-4">
        <li>
          <b>Hand:</b> Move cursor to the target and click.
        </li>
        <li>
          <b>Gaze-confirmation (simulated):</b> Hover the cursor over a target, then press{' '}
          <kbd className="px-2 py-1 bg-gray-200 rounded border">Space</kbd> to confirm.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">What to do on each trial</h2>
      <ol className="list-decimal ml-6 mb-6">
        <li>Focus on the starting point.</li>
        <li>Move to the highlighted target as quickly and accurately as you can.</li>
        <li>
          <b>Hand:</b> Click the target. &nbsp; <b>Gaze-confirm:</b> Hover then press{' '}
          <kbd className="px-2 py-1 bg-gray-200 rounded border">Space</kbd>.
        </li>
        <li>Repeat until the block ends. Take short breaks between blocks.</li>
      </ol>

      <div className="p-4 rounded-lg bg-gray-50 border mb-6">
        <p className="mb-2">
          <b>Tips:</b>
        </p>
        <ul className="list-disc ml-6">
          <li>
            Keep your browser at <b>100% zoom</b> and <b>full-screen</b> (we&apos;ll check this).
          </li>
          <li>
            <b>Do not resize your browser window</b> during the experiment. This can affect measurement accuracy.
            Set your window size before starting and keep it fixed throughout.
          </li>
          <li>Use Chrome desktop on a laptop/desktop; close other heavy apps.</li>
        </ul>
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">Quick comprehension check</h2>
      <ComprehensionGate onPassed={() => {
        const params = searchParams.toString()
        navigate(`/demographics${params ? `?${params}` : ''}`)
      }} />

      <div className="mt-6 flex gap-3">
        <button 
          onClick={() => {
            const params = searchParams.toString()
            navigate(`/demographics${params ? `?${params}` : ''}`)
          }}
          className="px-4 py-2 rounded bg-black text-white"
        >
          Continue to Demographics
        </button>
        {import.meta.env.DEV && (
          <button 
            onClick={() => {
              const params = searchParams.toString()
              navigate(`/task${params ? `?${params}` : ''}`)
            }}
            className="px-4 py-2 rounded border"
          >
            Skip to Task (Dev Only)
          </button>
        )}
      </div>
    </div>
  )
}

function ComprehensionGate({ onPassed }: { onPassed: () => void }) {
  const [answers, setAnswers] = React.useState({ a1: '', a2: '', a3: '' })
  const [error, setError] = React.useState('')

  const handleChange =
    (k: 'a1' | 'a2' | 'a3') => (e: React.ChangeEvent<HTMLInputElement>) =>
      setAnswers((prev) => ({ ...prev, [k]: e.target.value }))

  function submit() {
    if (!answers.a1 || !answers.a2 || !answers.a3) {
      setError('Please answer all three questions.')
      return
    }
    
    // Check correct answers
    const correctAnswers = {
      a1: 'click-space', // Correct answer
      a2: 'fast-accurate', // Correct answer
      a3: 'fullscreen-100', // Correct answer
    }
    
    if (answers.a1 === correctAnswers.a1 && 
        answers.a2 === correctAnswers.a2 && 
        answers.a3 === correctAnswers.a3) {
      onPassed()
    } else {
      setError('Please select the correct answers for all questions.')
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="mb-4">
        <label className="block mb-2 font-semibold">
          1) How do you &quot;select&quot; the target with each modality?
        </label>
        <div className="space-y-2">
          <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="q1"
              value="click-space"
              checked={answers.a1 === 'click-space'}
              onChange={(e) => handleChange('a1')(e)}
              className="mr-2"
            />
            <span>Hand: click; Gaze: hover + Space</span>
          </label>
          <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="q1"
              value="double-click"
              checked={answers.a1 === 'double-click'}
              onChange={(e) => handleChange('a1')(e)}
              className="mr-2"
            />
            <span>Double-click for both</span>
          </label>
          <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="q1"
              value="drag"
              checked={answers.a1 === 'drag'}
              onChange={(e) => handleChange('a1')(e)}
              className="mr-2"
            />
            <span>Drag and drop</span>
          </label>
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">
          2) What is the goal of each trial?
        </label>
        <div className="space-y-2">
          <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="q2"
              value="fast-accurate"
              checked={answers.a2 === 'fast-accurate'}
              onChange={(e) => handleChange('a2')(e)}
              className="mr-2"
            />
            <span>Select the target as quickly and accurately as possible</span>
          </label>
          <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="q2"
              value="slow-careful"
              checked={answers.a2 === 'slow-careful'}
              onChange={(e) => handleChange('a2')(e)}
              className="mr-2"
            />
            <span>Take your time and be very careful</span>
          </label>
          <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="q2"
              value="practice"
              checked={answers.a2 === 'practice'}
              onChange={(e) => handleChange('a2')(e)}
              className="mr-2"
            />
            <span>Just practice clicking around</span>
          </label>
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">
          3) What display settings are required?
        </label>
        <div className="space-y-2">
          <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="q3"
              value="fullscreen-100"
              checked={answers.a3 === 'fullscreen-100'}
              onChange={(e) => handleChange('a3')(e)}
              className="mr-2"
            />
            <span>Full-screen mode and 100% browser zoom</span>
          </label>
          <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="q3"
              value="window-200"
              checked={answers.a3 === 'window-200'}
              onChange={(e) => handleChange('a3')(e)}
              className="mr-2"
            />
            <span>Windowed mode and 200% zoom</span>
          </label>
          <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="q3"
              value="any"
              checked={answers.a3 === 'any'}
              onChange={(e) => handleChange('a3')(e)}
              className="mr-2"
            />
            <span>Any display settings are fine</span>
          </label>
        </div>
      </div>

      {error && <p className="text-red-600 mb-3">{error}</p>}
      <button onClick={submit} className="px-4 py-2 rounded bg-black text-white">
        I understand—continue
      </button>
    </div>
  )
}

