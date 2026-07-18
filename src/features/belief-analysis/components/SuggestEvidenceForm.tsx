'use client'

import { useState } from 'react'

interface SuggestEvidenceFormProps {
  beliefSlug: string
}

/**
 * The suggest-evidence move, open to humans: attach a source to this claim.
 * Suggestion-only — nothing becomes an Evidence row until acceptance, which
 * runs through the same validation as agent ingestion. Provenance (a URL or
 * DOI) and a rationale are mandatory; the move is audit-logged.
 */
export default function SuggestEvidenceForm({ beliefSlug }: SuggestEvidenceFormProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [rationale, setRationale] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setError(null)
    try {
      const res = await fetch('/api/v1/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beliefSlug,
          title,
          source,
          sourceUrl,
          rationale,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setError(data.error ?? 'Submission failed.')
        return
      }
      setStatus('done')
    } catch {
      setStatus('error')
      setError('Network error — try again.')
    }
  }

  if (status === 'done') {
    return (
      <div className="border border-gray-300 bg-gray-50 px-4 py-3 text-sm">
        Suggestion queued. It becomes evidence only if accepted — acceptance runs through the
        same validation as agent ingestion, and the whole trail lands in the audit log.
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm border border-[var(--border)] rounded px-3 py-1.5 text-[var(--accent)] hover:underline"
      >
        Suggest evidence for this belief
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="border border-gray-300 rounded p-4 space-y-3 text-sm">
      <p className="text-[var(--muted-foreground)]">
        Attach a source to this claim. Suggestion-only: nothing becomes evidence until it is
        accepted, so the smallest contribution is safe to make.
      </p>
      <div>
        <label className="block font-semibold mb-1">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          placeholder="Author, 'Study title' (Year)"
          className="w-full border border-gray-300 rounded px-3 py-1.5"
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Source</label>
        <input
          value={source}
          onChange={e => setSource(e.target.value)}
          required
          placeholder="Journal, institution, or publisher"
          className="w-full border border-gray-300 rounded px-3 py-1.5"
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Source URL (or DOI link)</label>
        <input
          value={sourceUrl}
          onChange={e => setSourceUrl(e.target.value)}
          required
          type="url"
          placeholder="https://…"
          className="w-full border border-gray-300 rounded px-3 py-1.5"
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Why it bears on this belief</label>
        <textarea
          value={rationale}
          onChange={e => setRationale(e.target.value)}
          required
          minLength={10}
          rows={2}
          placeholder="Every move carries its why — one or two sentences."
          className="w-full border border-gray-300 rounded px-3 py-1.5"
        />
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="border border-[var(--border)] rounded px-4 py-1.5 font-semibold text-[var(--accent)] disabled:opacity-50"
        >
          {status === 'submitting' ? 'Submitting…' : 'Submit suggestion'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[var(--muted-foreground)] hover:underline"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
