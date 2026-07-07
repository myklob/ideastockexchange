'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * The make-it-debatable move for a manual importance weight: one click
 * creates the edge's dedicated importance sub-belief and the multiplier
 * starts tracking that sub-debate (neutral until argued) instead of the
 * placement-time constant.
 */
export default function AttachImportanceButton({ argumentId }: { argumentId: number }) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function attach() {
    setStatus('working')
    setError(null)
    try {
      const res = await fetch(`/api/arguments/${argumentId}/importance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setError(data.error ?? 'Could not attach the importance debate.')
        return
      }
      router.refresh()
    } catch {
      setStatus('error')
      setError('Network error — try again.')
    }
  }

  return (
    <span className="block mt-1">
      <button
        type="button"
        onClick={attach}
        disabled={status === 'working'}
        className="text-xs text-[var(--accent)] hover:underline disabled:opacity-50"
      >
        {status === 'working' ? 'Attaching…' : 'Make importance debatable'}
      </button>
      {error && <span className="block text-xs text-red-700">{error}</span>}
    </span>
  )
}
