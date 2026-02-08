'use client'

import { useState, useCallback } from 'react'
import { SchilchtArgument } from '@/core/types/schlicht'
import { detectNonSequitur, shouldPromptForAssumption, resolveLinkageScore } from '@/core/scoring/scoring-engine'
import AgentBadge from './AgentBadge'
import LinkageIndicator from './LinkageIndicator'
import NonSequiturWarning from './NonSequiturWarning'
import MissingAssumptionPrompt from './MissingAssumptionPrompt'

interface ArgumentCardProps {
  argument: SchilchtArgument
  parentClaim?: string
  onAssumptionSubmit?: (argumentId: string, assumption: string) => void
}

function getAgentLabel(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('evidence')) return 'Verified Source'
  if (lower.includes('logic')) return 'Valid Inference'
  if (lower.includes('red') || lower.includes('adversar'))
    return 'Risk Assessment'
  if (lower.includes('compress')) return 'Deduplicated'
  if (lower.includes('calibration')) return 'Calibrated'
  if (lower.includes('base')) return 'Base Rate Applied'
  return 'Certified'
}

export default function ArgumentCard({ argument, parentClaim, onAssumptionSubmit }: ArgumentCardProps) {
  const [assumptionDismissed, setAssumptionDismissed] = useState(false)

  const isPro = argument.side === 'pro'
  const borderColor = isPro ? 'border-l-green-600' : 'border-l-red-600'
  const impactColor = isPro ? 'text-green-700' : 'text-red-700'
  const impactPrefix = isPro ? '+' : ''

  // Linkage analysis
  const resolvedLinkage = resolveLinkageScore(argument)
  const warnings = detectNonSequitur(argument)
  const needsAssumption = shouldPromptForAssumption(argument) && !assumptionDismissed

  const handleAssumptionSubmit = useCallback(
    (assumption: string) => {
      onAssumptionSubmit?.(argument.id, assumption)
      setAssumptionDismissed(true)
    },
    [argument.id, onAssumptionSubmit]
  )

  return (
    <div
      className={`bg-white border border-[var(--border)] ${borderColor} border-l-4 rounded p-4 transition-transform hover:-translate-y-0.5 hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <h4 className="font-semibold text-[var(--foreground)]">
          {argument.claim}
        </h4>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <LinkageIndicator
            score={resolvedLinkage}
            classification={argument.linkageClassification}
            compact
          />
          <span className="text-[10px] font-mono text-[var(--muted-foreground)] bg-gray-100 px-1.5 py-0.5 rounded">
            #{argument.id.replace('arg-', '').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Non Sequitur / True-but-Irrelevant Warning */}
      {(warnings.isNonSequitur || warnings.isTrueButIrrelevant) && (
        <div className="mb-3">
          <NonSequiturWarning
            isNonSequitur={warnings.isNonSequitur}
            isTrueButIrrelevant={warnings.isTrueButIrrelevant}
            warningMessage={warnings.warningMessage}
            truthScore={argument.truthScore}
            linkageScore={resolvedLinkage}
          />
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-[var(--muted-foreground)] mb-3 leading-relaxed">
        {argument.description}
      </p>

      {/* Fallacies */}
      {argument.fallaciesDetected.length > 0 && (
        <div className="mb-3">
          {argument.fallaciesDetected.map((f, i) => (
            <div
              key={i}
              className="text-xs bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded mb-1"
            >
              Fallacy Detected: {f.type} &mdash; {f.description} (Impact:{' '}
              {f.impact})
            </div>
          ))}
        </div>
      )}

      {/* Contributor badge */}
      {argument.contributor && (
        <div className="mb-2">
          <span
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
              argument.contributor.type === 'human'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-blue-700 bg-blue-50 border-blue-200'
            }`}
          >
            <span>{argument.contributor.type === 'human' ? '\u{1F464}' : '\u{1F916}'}</span>
            {argument.contributor.name}
            <span className="text-[10px] opacity-60">
              ({argument.contributor.type})
            </span>
          </span>
        </div>
      )}

      {/* Agent badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {argument.certifiedBy.map((agent) => (
          <AgentBadge key={agent} name={agent} label={getAgentLabel(agent)} />
        ))}
      </div>

      {/* Linkage indicator bar */}
      <div className="mb-3">
        <LinkageIndicator
          score={resolvedLinkage}
          classification={argument.linkageClassification}
        />
      </div>

      {/* Scores */}
      <div className="flex gap-4 text-xs bg-[var(--muted)] p-2 rounded border border-[var(--border)]">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">
            Truth
          </span>
          <span className="font-bold">
            {(argument.truthScore * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">
            Linkage
          </span>
          <span className="font-bold">
            {(resolvedLinkage * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">
            Impact
          </span>
          <span className={`font-bold ${impactColor}`}>
            {impactPrefix}
            {argument.impactScore}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">
            Net Weight
          </span>
          <span className="font-bold text-purple-700">
            {(argument.truthScore * resolvedLinkage * (argument.importanceScore ?? 1) * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Missing Assumption Prompt */}
      {needsAssumption && parentClaim && (
        <div className="mt-3">
          <MissingAssumptionPrompt
            argumentId={argument.id}
            argumentClaim={argument.claim}
            parentClaim={parentClaim}
            linkageScore={resolvedLinkage}
            onSubmitAssumption={handleAssumptionSubmit}
            onDismiss={() => setAssumptionDismissed(true)}
          />
        </div>
      )}

      {/* Rebuttal */}
      {argument.rebuttal && (
        <div className="mt-3 pl-3 border-l-2 border-gray-300 bg-gray-50 p-2 rounded-r text-sm">
          <span className="font-semibold text-[var(--foreground)]">
            Rebuttal (#{argument.rebuttal.id.toUpperCase()}):
          </span>{' '}
          <span className="text-[var(--muted-foreground)]">
            {argument.rebuttal.statement}
          </span>
          <br />
          <em className="text-xs text-[var(--muted-foreground)]">
            (Confidence: {(argument.rebuttal.confidence * 100).toFixed(0)}%)
          </em>
        </div>
      )}
    </div>
  )
}
