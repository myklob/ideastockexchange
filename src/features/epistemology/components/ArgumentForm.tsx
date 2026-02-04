'use client'

import { useState } from 'react'
import { ArgumentSide, SchilchtArgument } from '@/core/types/schlicht'

interface ArgumentFormProps {
  beliefId: string
  onSubmit: (argument: SchilchtArgument) => void
  onClose: () => void
}

export default function ArgumentForm({
  beliefId,
  onSubmit,
  onClose,
}: ArgumentFormProps) {
  const [contributorName, setContributorName] = useState('')
  const [contributorType, setContributorType] = useState<'human' | 'ai'>(
    'human'
  )
  const [side, setSide] = useState<ArgumentSide>('pro')
  const [claim, setClaim] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/protocol/${beliefId}/arguments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim,
          description,
          side,
          contributor_name: contributorName,
          contributor_type: contributorType,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit argument')
      }

      const data = await res.json()
      onSubmit(data.argument)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[var(--border)] shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Propose New Argument
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          {/* API info */}
          <div className="text-sm text-[var(--muted-foreground)] mb-5 bg-[var(--muted)] p-3 rounded border border-[var(--border)]">
            Both humans and AIs can submit arguments. AI agents can also use the{' '}
            <code className="text-xs bg-white px-1 py-0.5 rounded border">
              POST /api/protocol/{beliefId}/arguments
            </code>{' '}
            endpoint directly.
          </div>

          <form onSubmit={handleSubmit}>
            {/* Contributor Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                required
                className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder="e.g., Jane Doe, Claude-3.5, GPT-4"
              />
            </div>

            {/* Contributor Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Contributor Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contributorType"
                    value="human"
                    checked={contributorType === 'human'}
                    onChange={() => setContributorType('human')}
                    className="accent-[var(--accent)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">
                    Human
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contributorType"
                    value="ai"
                    checked={contributorType === 'ai'}
                    onChange={() => setContributorType('ai')}
                    className="accent-[var(--accent)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">
                    AI Agent
                  </span>
                </label>
              </div>
            </div>

            {/* Side */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Position
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="side"
                    value="pro"
                    checked={side === 'pro'}
                    onChange={() => setSide('pro')}
                    className="accent-green-600"
                  />
                  <span className="text-sm font-medium text-green-700">
                    Supporting (Pro)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="side"
                    value="con"
                    checked={side === 'con'}
                    onChange={() => setSide('con')}
                    className="accent-red-600"
                  />
                  <span className="text-sm font-medium text-red-700">
                    Opposing (Con)
                  </span>
                </label>
              </div>
            </div>

            {/* Claim Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Claim Title
              </label>
              <input
                type="text"
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                required
                maxLength={500}
                className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder="Short title for your argument"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Argument
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                maxLength={5000}
                className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-y"
                placeholder="Provide your reasoning, evidence, and any relevant sources..."
              />
              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                {description.length}/5000 characters
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded font-semibold text-sm text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Argument'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded font-semibold text-sm text-[var(--foreground)] bg-[var(--muted)] border border-[var(--border)] hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
