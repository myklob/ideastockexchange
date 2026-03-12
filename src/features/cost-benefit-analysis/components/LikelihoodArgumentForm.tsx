'use client'

import { useState } from 'react'

interface LikelihoodArgumentFormProps {
  cbaId: string
  itemId: string
  estimateId: string
  estimateLabel: string
  onClose: () => void
  onSubmitted: () => void
}

export default function LikelihoodArgumentForm({
  cbaId,
  itemId,
  estimateId,
  estimateLabel,
  onClose,
  onSubmitted,
}: LikelihoodArgumentFormProps) {
  const [claim, setClaim] = useState('')
  const [description, setDescription] = useState('')
  const [side, setSide] = useState<'pro' | 'con'>('pro')
  const [contributorName, setContributorName] = useState('')
  const [contributorType, setContributorType] = useState<'human' | 'ai'>('human')
  const [truthScore, setTruthScore] = useState(50)
  const [linkageScore, setLinkageScore] = useState(50)
  const [importanceScore, setImportanceScore] = useState(100)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/cba/${cbaId}/items/${itemId}/likelihood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimate_id: estimateId,
          claim,
          description,
          side,
          contributor_name: contributorName,
          contributor_type: contributorType,
          truth_score: truthScore,
          linkage_score: linkageScore,
          importance_score: importanceScore,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit argument')
      }

      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-3 border border-[var(--border)] rounded-lg bg-white p-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-semibold text-[var(--foreground)]">
          Argue About the {estimateLabel} Estimate
        </h4>
        <button
          onClick={onClose}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-lg leading-none"
        >
          &times;
        </button>
      </div>

      <div className="text-xs text-[var(--muted-foreground)] mb-3 bg-[var(--muted)] p-2 rounded">
        Submit evidence for or against this probability estimate. Arguments are scored on
        Truth (factual accuracy), Linkage (relevance to this prediction), and Importance (how much it moves the needle).
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Contributor row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-[var(--muted-foreground)] uppercase mb-0.5">
              Name
            </label>
            <input
              type="text"
              value={contributorName}
              onChange={(e) => setContributorName(e.target.value)}
              required
              className="w-full border border-[var(--border)] rounded px-2 py-1.5 text-xs bg-white text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              placeholder="Your name or agent ID"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-[var(--muted-foreground)] uppercase mb-0.5">
              Type
            </label>
            <div className="flex gap-3 pt-1">
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input
                  type="radio"
                  checked={contributorType === 'human'}
                  onChange={() => setContributorType('human')}
                  className="accent-[var(--accent)]"
                />
                Human
              </label>
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input
                  type="radio"
                  checked={contributorType === 'ai'}
                  onChange={() => setContributorType('ai')}
                  className="accent-[var(--accent)]"
                />
                AI
              </label>
            </div>
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="block text-[10px] font-medium text-[var(--muted-foreground)] uppercase mb-0.5">
            Position on this estimate
          </label>
          <div className="flex gap-3">
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <input
                type="radio"
                checked={side === 'pro'}
                onChange={() => setSide('pro')}
                className="accent-green-600"
              />
              <span className="text-green-700 font-medium">
                Support (this probability is correct)
              </span>
            </label>
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <input
                type="radio"
                checked={side === 'con'}
                onChange={() => setSide('con')}
                className="accent-red-600"
              />
              <span className="text-red-700 font-medium">
                Attack (this probability is wrong)
              </span>
            </label>
          </div>
        </div>

        {/* Claim */}
        <div>
          <label className="block text-[10px] font-medium text-[var(--muted-foreground)] uppercase mb-0.5">
            Claim
          </label>
          <input
            type="text"
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            required
            maxLength={500}
            className="w-full border border-[var(--border)] rounded px-2 py-1.5 text-xs bg-white text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            placeholder="e.g., Reference class of 47 bridge projects shows 70% hit budget targets"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-medium text-[var(--muted-foreground)] uppercase mb-0.5">
            Evidence / Reasoning
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            maxLength={5000}
            className="w-full border border-[var(--border)] rounded px-2 py-1.5 text-xs bg-white text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-y"
            placeholder="Provide base rates, historical data, falsifiable assumptions, or other evidence..."
          />
        </div>

        {/* Score sliders — three ReasonRank metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-medium text-[var(--muted-foreground)] uppercase mb-0.5">
              Truth: {truthScore}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={truthScore}
              onChange={(e) => setTruthScore(Number(e.target.value))}
              className="w-full h-1 accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[9px] text-[var(--muted-foreground)]">
              <span>Unverified</span>
              <span>Factual</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-[var(--muted-foreground)] uppercase mb-0.5">
              Linkage: {linkageScore}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={linkageScore}
              onChange={(e) => setLinkageScore(Number(e.target.value))}
              className="w-full h-1 accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[9px] text-[var(--muted-foreground)]">
              <span>Tangential</span>
              <span>Direct</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-[var(--muted-foreground)] uppercase mb-0.5">
              Importance: {importanceScore}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={importanceScore}
              onChange={(e) => setImportanceScore(Number(e.target.value))}
              className="w-full h-1 accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[9px] text-[var(--muted-foreground)]">
              <span>Minor</span>
              <span>Decisive</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Argument'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs font-semibold text-[var(--foreground)] bg-[var(--muted)] border border-[var(--border)] hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
