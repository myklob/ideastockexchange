'use client'

import { useState } from 'react'

interface LineItemFormProps {
  cbaId: string
  onClose: () => void
  onSubmitted: () => void
}

export default function LineItemForm({ cbaId, onClose, onSubmitted }: LineItemFormProps) {
  const [type, setType] = useState<'benefit' | 'cost'>('benefit')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Economic')
  const [predictedImpact, setPredictedImpact] = useState('')
  const [initialLikelihood, setInitialLikelihood] = useState(50)
  const [likelihoodReasoning, setLikelihoodReasoning] = useState('')
  const [contributorName, setContributorName] = useState('')
  const [contributorType, setContributorType] = useState<'human' | 'ai'>('human')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const impact = parseFloat(predictedImpact)
    if (isNaN(impact) || impact <= 0) {
      setError('Predicted impact must be a positive number')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch(`/api/cba/${cbaId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          description,
          category,
          predicted_impact: impact,
          initial_likelihood: initialLikelihood,
          likelihood_reasoning: likelihoodReasoning,
          contributor_name: contributorName,
          contributor_type: contributorType,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit line item')
      }

      onSubmitted()
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Add Cost or Benefit
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          <div className="text-sm text-[var(--muted-foreground)] mb-5 bg-[var(--muted)] p-3 rounded border border-[var(--border)]">
            Each line item gets its own likelihood score derived from argument competition.
            Your initial probability estimate becomes the first competing claim that others can argue for or against.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={type === 'benefit'}
                    onChange={() => setType('benefit')}
                    className="accent-green-600"
                  />
                  <span className="text-sm font-medium text-green-700">Benefit</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={type === 'cost'}
                    onChange={() => setType('cost')}
                    className="accent-red-600"
                  />
                  <span className="text-sm font-medium text-red-700">Cost</span>
                </label>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder="e.g., Reduced commute times for daily commuters"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                maxLength={5000}
                className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-y"
                placeholder="Detailed explanation of this cost or benefit..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              >
                <option value="Economic">Economic</option>
                <option value="Social">Social</option>
                <option value="Environmental">Environmental</option>
                <option value="Political">Political</option>
              </select>
            </div>

            {/* Predicted Impact */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Predicted Impact (USD, annual)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-[var(--muted-foreground)]">$</span>
                <input
                  type="number"
                  value={predictedImpact}
                  onChange={(e) => setPredictedImpact(e.target.value)}
                  required
                  min={1}
                  step="any"
                  className="w-full border border-[var(--border)] rounded pl-7 pr-3 py-2 text-sm bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  placeholder="1000000"
                />
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                Enter a positive number. This will be treated as a {type === 'benefit' ? 'positive' : 'negative'} value.
              </div>
            </div>

            {/* Initial Likelihood */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Your Initial Likelihood Estimate: {initialLikelihood}%
              </label>
              <input
                type="range"
                min={1}
                max={99}
                value={initialLikelihood}
                onChange={(e) => setInitialLikelihood(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                <span>Very unlikely</span>
                <span>Certain</span>
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                This becomes the first competing estimate. Others will argue for or against it.
              </div>
            </div>

            {/* Likelihood Reasoning */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Why this probability?
              </label>
              <textarea
                value={likelihoodReasoning}
                onChange={(e) => setLikelihoodReasoning(e.target.value)}
                required
                rows={2}
                maxLength={2000}
                className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-y"
                placeholder="e.g., Based on reference class of 50 similar projects..."
              />
            </div>

            {/* Contributor */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  required
                  className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  placeholder="Name or agent ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Contributor Type
                </label>
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={contributorType === 'human'}
                      onChange={() => setContributorType('human')}
                      className="accent-[var(--accent)]"
                    />
                    <span className="text-sm">Human</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={contributorType === 'ai'}
                      onChange={() => setContributorType('ai')}
                      className="accent-[var(--accent)]"
                    />
                    <span className="text-sm">AI</span>
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded font-semibold text-sm text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : `Add ${type === 'benefit' ? 'Benefit' : 'Cost'}`}
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
