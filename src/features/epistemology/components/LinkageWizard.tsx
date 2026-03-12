'use client'

import { useState } from 'react'
import { LinkageDiagnostic, LinkageClassification } from '@/core/types/schlicht'

interface LinkageWizardProps {
  parentClaim: string
  childClaim: string
  onComplete: (result: {
    diagnostic: LinkageDiagnostic
    score: number
    classification: LinkageClassification
  }) => void
  onCancel: () => void
}

type WizardStep = 'direction' | 'relevance' | 'strength' | 'result'

const STRENGTH_OPTIONS = [
  {
    value: 'proof' as const,
    label: 'Proof',
    score: 1.0,
    description: 'If A is true, B must be true. (Mathematical / logical necessity)',
    classification: 'DEDUCTIVE_PROOF' as LinkageClassification,
    color: 'border-green-600 bg-green-50 text-green-800',
  },
  {
    value: 'strong' as const,
    label: 'Strong',
    score: 0.8,
    description: 'A is the primary cause or reason for B. Direct causal evidence.',
    classification: 'STRONG_CAUSAL' as LinkageClassification,
    color: 'border-blue-600 bg-blue-50 text-blue-800',
  },
  {
    value: 'context' as const,
    label: 'Context',
    score: 0.5,
    description: 'A helps explain B, but B could exist without it.',
    classification: 'CONTEXTUAL' as LinkageClassification,
    color: 'border-yellow-600 bg-yellow-50 text-yellow-800',
  },
  {
    value: 'weak' as const,
    label: 'Weak',
    score: 0.2,
    description: 'A is tangentially related or a minor example.',
    classification: 'ANECDOTAL' as LinkageClassification,
    color: 'border-orange-600 bg-orange-50 text-orange-800',
  },
]

export default function LinkageWizard({
  parentClaim,
  childClaim,
  onComplete,
  onCancel,
}: LinkageWizardProps) {
  const [step, setStep] = useState<WizardStep>('direction')
  const [direction, setDirection] = useState<'support' | 'oppose' | null>(null)
  const [isRelevant, setIsRelevant] = useState<boolean | null>(null)
  const [strength, setStrength] = useState<'proof' | 'strong' | 'context' | 'weak' | null>(null)

  const handleDirectionSelect = (dir: 'support' | 'oppose') => {
    setDirection(dir)
    setStep('relevance')
  }

  const handleRelevanceSelect = (relevant: boolean) => {
    setIsRelevant(relevant)
    if (!relevant) {
      // Non sequitur — skip to result
      const diagnostic: LinkageDiagnostic = {
        direction: direction!,
        isRelevant: false,
      }
      onComplete({
        diagnostic,
        score: 0.0,
        classification: 'NON_SEQUITUR',
      })
    } else {
      setStep('strength')
    }
  }

  const handleStrengthSelect = (str: 'proof' | 'strong' | 'context' | 'weak') => {
    setStrength(str)
    const option = STRENGTH_OPTIONS.find((o) => o.value === str)!
    const sign = direction === 'oppose' ? -1 : 1
    const diagnostic: LinkageDiagnostic = {
      direction: direction!,
      isRelevant: true,
      strength: str,
    }
    onComplete({
      diagnostic,
      score: option.score * sign,
      classification: option.classification,
    })
  }

  const handleBack = () => {
    if (step === 'relevance') {
      setStep('direction')
      setDirection(null)
    } else if (step === 'strength') {
      setStep('relevance')
      setIsRelevant(null)
    }
  }

  const stepNumber = step === 'direction' ? 1 : step === 'relevance' ? 2 : 3

  return (
    <div className="bg-white border border-purple-200 rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm uppercase tracking-wider font-semibold text-purple-800">
          Linkage Assessment — Step {stepNumber} of 3
        </h3>
        <button
          onClick={onCancel}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-lg leading-none"
        >
          &times;
        </button>
      </div>

      {/* Connection being evaluated */}
      <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4 text-sm">
        <div className="text-[var(--muted-foreground)] mb-1">Evaluating the connection:</div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--foreground)] flex-1">
            &ldquo;{childClaim}&rdquo;
          </span>
          <span className="text-purple-600 font-mono text-xs px-2 py-0.5 bg-purple-50 rounded">
            &rarr;
          </span>
          <span className="font-medium text-[var(--foreground)] flex-1">
            &ldquo;{parentClaim}&rdquo;
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-5">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s <= stepNumber ? 'bg-purple-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Direction */}
      {step === 'direction' && (
        <div>
          <p className="text-sm font-medium text-[var(--foreground)] mb-3">
            Does this argument <strong>support</strong> or <strong>oppose</strong> the conclusion?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleDirectionSelect('support')}
              className="flex-1 p-3 rounded border-2 border-green-300 bg-green-50 hover:bg-green-100 text-green-800 font-semibold text-sm transition-colors"
            >
              Supports (+)
            </button>
            <button
              onClick={() => handleDirectionSelect('oppose')}
              className="flex-1 p-3 rounded border-2 border-red-300 bg-red-50 hover:bg-red-100 text-red-800 font-semibold text-sm transition-colors"
            >
              Opposes (-)
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Blue Sky Filter */}
      {step === 'relevance' && (
        <div>
          <p className="text-sm font-medium text-[var(--foreground)] mb-2">
            The &ldquo;Blue Sky&rdquo; Filter:
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            If this argument is <strong>100% true</strong>, does it{' '}
            <em>force us to change our mind</em> about the conclusion?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleRelevanceSelect(true)}
              className="flex-1 p-3 rounded border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-sm transition-colors"
            >
              Yes — It matters
            </button>
            <button
              onClick={() => handleRelevanceSelect(false)}
              className="flex-1 p-3 rounded border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-sm transition-colors"
            >
              No — Non Sequitur
            </button>
          </div>
          <button
            onClick={handleBack}
            className="mt-3 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            &larr; Back to Step 1
          </button>
        </div>
      )}

      {/* Step 3: Strength */}
      {step === 'strength' && (
        <div>
          <p className="text-sm font-medium text-[var(--foreground)] mb-3">
            How strong is this connection?
          </p>
          <div className="flex flex-col gap-2">
            {STRENGTH_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStrengthSelect(option.value)}
                className={`p-3 rounded border-2 text-left transition-colors hover:shadow-sm ${option.color}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm">{option.label}</span>
                  <span className="text-xs font-mono opacity-70">
                    {direction === 'oppose' ? '-' : '+'}{(option.score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs opacity-80">{option.description}</p>
              </button>
            ))}
          </div>
          <button
            onClick={handleBack}
            className="mt-3 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            &larr; Back to Step 2
          </button>
        </div>
      )}
    </div>
  )
}
