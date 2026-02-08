'use client'

import { useState } from 'react'

interface MissingAssumptionPromptProps {
  argumentId: string
  argumentClaim: string
  parentClaim: string
  linkageScore: number
  onSubmitAssumption: (assumption: string) => void
  onDismiss: () => void
}

/**
 * Prompt displayed when linkage is low (0.1-0.4), suggesting
 * that a missing Assumption might bridge the logical gap.
 *
 * "Is there a missing Assumption that would connect these two ideas?"
 * Users can insert an intermediate Belief (the Assumption) to
 * repair the linkage chain.
 */
export default function MissingAssumptionPrompt({
  argumentClaim,
  parentClaim,
  linkageScore,
  onSubmitAssumption,
  onDismiss,
}: MissingAssumptionPromptProps) {
  const [assumption, setAssumption] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = () => {
    if (assumption.trim()) {
      onSubmitAssumption(assumption.trim())
      setAssumption('')
      setIsExpanded(false)
    }
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded px-3 py-2 text-xs">
      <div className="flex items-start gap-2">
        <span className="text-purple-600 text-sm mt-0.5">?</span>
        <div className="flex-1">
          <p className="text-purple-800 font-medium mb-1">
            Low Linkage Detected ({(linkageScore * 100).toFixed(0)}%)
          </p>
          <p className="text-purple-700 opacity-80 mb-2">
            Is there a missing assumption that would connect{' '}
            <em>&ldquo;{argumentClaim}&rdquo;</em> to{' '}
            <em>&ldquo;{parentClaim}&rdquo;</em>?
          </p>

          {!isExpanded ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsExpanded(true)}
                className="px-2 py-1 rounded text-[10px] font-semibold text-purple-700 bg-purple-100 border border-purple-200 hover:bg-purple-200 transition-colors"
              >
                Add Missing Assumption
              </button>
              <button
                onClick={onDismiss}
                className="px-2 py-1 rounded text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <div>
              <p className="text-[10px] text-purple-600 mb-1">
                What assumption would strengthen the link?
              </p>
              <textarea
                value={assumption}
                onChange={(e) => setAssumption(e.target.value)}
                rows={2}
                maxLength={1000}
                className="w-full border border-purple-200 rounded px-2 py-1 text-xs bg-white text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-purple-400 resize-y mb-2"
                placeholder='e.g., "Carbon Taxes are the most effective way to stop global warming."'
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={!assumption.trim()}
                  className="px-2 py-1 rounded text-[10px] font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Assumption
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="px-2 py-1 rounded text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
