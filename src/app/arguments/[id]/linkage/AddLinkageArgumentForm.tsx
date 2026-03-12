'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  argumentId: number
}

export default function AddLinkageArgumentForm({ argumentId }: Props) {
  const router = useRouter()
  const [side, setSide] = useState<'agree' | 'disagree'>('agree')
  const [statement, setStatement] = useState('')
  const [strength, setStrength] = useState(0.5)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!statement.trim()) {
      setError('Please enter a statement.')
      return
    }
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/arguments/${argumentId}/linkage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side, statement: statement.trim(), strength }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Submission failed.')
        return
      }

      setStatement('')
      setStrength(0.5)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded p-4 bg-gray-50">
      {/* Direction */}
      <div className="flex gap-3 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="side"
            value="agree"
            checked={side === 'agree'}
            onChange={() => setSide('agree')}
            className="accent-green-600"
          />
          <span className="text-sm font-medium text-green-700">
            The link IS valid (supports the connection)
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="side"
            value="disagree"
            checked={side === 'disagree'}
            onChange={() => setSide('disagree')}
            className="accent-red-600"
          />
          <span className="text-sm font-medium text-red-700">
            The link is NOT valid (challenges the connection)
          </span>
        </label>
      </div>

      {/* Statement */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Argument statement
        </label>
        <textarea
          value={statement}
          onChange={e => setStatement(e.target.value)}
          rows={3}
          placeholder='e.g. "The mechanism by which X causes Y has been directly measured in controlled conditions."'
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* Strength */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Connection strength: <strong className="font-mono">{strength.toFixed(2)}</strong>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Weak (0.1)</span>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={strength}
            onChange={e => setStrength(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-gray-400">Proof (1.0)</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          How strong is this particular argument for or against the link? (This is not the linkage
          score itself — it weights your argument within the debate.)
        </p>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Add Linkage Argument'}
      </button>
    </form>
  )
}
