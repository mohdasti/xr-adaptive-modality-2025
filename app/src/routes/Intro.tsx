import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Intro() {
  const navigate = useNavigate()

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
          <li>
            If we try an optional camera quality check, please turn <b>off</b> Zoom video or
            join from a second device.
          </li>
        </ul>
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">Quick comprehension check</h2>
      <ComprehensionGate onPassed={() => navigate('/check')} />

      <div className="mt-6 flex gap-3">
        <Link to="/check" className="px-4 py-2 rounded bg-black text-white">
          Run System Check
        </Link>
        <Link to="/camera-check" className="px-4 py-2 rounded border">
          Try Optional Camera Check
        </Link>
        <Link to="/task" className="px-4 py-2 rounded border">
          Skip to Task
        </Link>
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
    const ok1 =
      answers.a1.toLowerCase().includes('click') ||
      answers.a1.toLowerCase().includes('space')
    const ok2 =
      answers.a2.toLowerCase().includes('fast') ||
      answers.a2.toLowerCase().includes('accur')
    const ok3 =
      answers.a3.toLowerCase().includes('100') ||
      answers.a3.toLowerCase().includes('full')
    if (ok1 && ok2 && ok3) onPassed()
    else setError('Please answer all three correctly (short phrases are fine).')
  }

  return (
    <div className="border rounded-lg p-4">
      <label className="block mb-2">1) How do you &quot;select&quot; the target with each modality?</label>
      <input
        className="w-full border rounded p-2 mb-3"
        placeholder="Hand: click; Gaze: hover + Space"
        value={answers.a1}
        onChange={handleChange('a1')}
      />
      <label className="block mb-2">2) What is the goal of each trial?</label>
      <input
        className="w-full border rounded p-2 mb-3"
        placeholder="Fast and accurate target selection"
        value={answers.a2}
        onChange={handleChange('a2')}
      />
      <label className="block mb-2">3) What display settings are required?</label>
      <input
        className="w-full border rounded p-2 mb-3"
        placeholder="Full-screen, 100% zoom"
        value={answers.a3}
        onChange={handleChange('a3')}
      />
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <button onClick={submit} className="px-4 py-2 rounded bg-black text-white">
        I understand—continue
      </button>
    </div>
  )
}

