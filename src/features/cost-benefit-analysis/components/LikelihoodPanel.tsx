'use client'

import { useState } from 'react'
import { LikelihoodBelief, LikelihoodEstimate } from '@/core/types/cba'
import { SchilchtArgument } from '@/core/types/schlicht'
import LikelihoodArgumentForm from './LikelihoodArgumentForm'

interface LikelihoodPanelProps {
  belief: LikelihoodBelief
  cbaId: string
  itemId: string
  onArgumentSubmitted?: (updatedBelief: LikelihoodBelief) => void
}

function EstimateCard({
  estimate,
  cbaId,
  itemId,
  onArgumentSubmitted,
}: {
  estimate: LikelihoodEstimate
  cbaId: string
  itemId: string
  onArgumentSubmitted?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showArgForm, setShowArgForm] = useState(false)

  const totalArgs = estimate.proArguments.length + estimate.conArguments.length
  const proStrength = estimate.proArguments.reduce(
    (s, a) => s + a.truthScore * a.linkageScore * (a.importanceScore ?? 1),
    0
  )
  const conStrength = estimate.conArguments.reduce(
    (s, a) => s + a.truthScore * a.linkageScore * (a.importanceScore ?? 1),
    0
  )

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${
        estimate.isActive
          ? 'border-blue-400 bg-blue-50/50 shadow-sm'
          : 'border-[var(--border)] bg-white'
      }`}
    >
      {/* Estimate header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Probability badge */}
          <span
            className={`text-lg font-bold px-2.5 py-0.5 rounded ${
              estimate.isActive
                ? 'text-blue-800 bg-blue-100'
                : 'text-gray-600 bg-gray-100'
            }`}
          >
            {estimate.label}
          </span>
          {estimate.isActive && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              Active Winner
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted-foreground)] font-mono">
            RR: {(estimate.reasonRankScore * 100).toFixed(0)}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {totalArgs} arg{totalArgs !== 1 ? 's' : ''}
          </span>
          <span className="text-gray-400">{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] p-3">
          {/* Reasoning */}
          <p className="text-sm text-[var(--muted-foreground)] mb-3 italic">
            &ldquo;{estimate.reasoning}&rdquo;
          </p>

          {/* Contributor */}
          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
                estimate.contributor.type === 'human'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-blue-700 bg-blue-50 border-blue-200'
              }`}
            >
              {estimate.contributor.type === 'human' ? '\u{1F464}' : '\u{1F916}'}
              {estimate.contributor.name}
            </span>
          </div>

          {/* Strength bars */}
          <div className="flex gap-4 text-xs mb-3">
            <div className="flex-1">
              <div className="flex justify-between mb-0.5">
                <span className="text-green-700 font-medium">Pro Strength</span>
                <span className="font-mono">{proStrength.toFixed(2)}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min((proStrength / Math.max(proStrength + conStrength, 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-0.5">
                <span className="text-red-700 font-medium">Con Strength</span>
                <span className="font-mono">{conStrength.toFixed(2)}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${Math.min((conStrength / Math.max(proStrength + conStrength, 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pro Arguments */}
          {estimate.proArguments.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-green-700 mb-1.5">
                Supporting Arguments
              </div>
              {estimate.proArguments.map((arg) => (
                <MiniArgumentCard key={arg.id} argument={arg} />
              ))}
            </div>
          )}

          {/* Con Arguments */}
          {estimate.conArguments.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-red-700 mb-1.5">
                Counter-Arguments
              </div>
              {estimate.conArguments.map((arg) => (
                <MiniArgumentCard key={arg.id} argument={arg} />
              ))}
            </div>
          )}

          {/* Add argument button */}
          <button
            onClick={() => setShowArgForm(true)}
            className="w-full text-center py-1.5 text-xs font-medium text-[var(--accent)] border border-dashed border-[var(--accent)] rounded hover:bg-blue-50 transition-colors"
          >
            + Argue For or Against This Estimate
          </button>

          {showArgForm && (
            <LikelihoodArgumentForm
              cbaId={cbaId}
              itemId={itemId}
              estimateId={estimate.id}
              estimateLabel={estimate.label}
              onClose={() => setShowArgForm(false)}
              onSubmitted={() => {
                setShowArgForm(false)
                onArgumentSubmitted?.()
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

function MiniArgumentCard({ argument, depth = 0 }: { argument: SchilchtArgument; depth?: number }) {
  const [showSubs, setShowSubs] = useState(false)
  const isPro = argument.side === 'pro'
  const importance = argument.importanceScore ?? 1
  const hasSubArgs = argument.subArguments && argument.subArguments.length > 0

  return (
    <div
      className={`text-xs border-l-2 ${
        isPro ? 'border-l-green-500' : 'border-l-red-500'
      } bg-white border border-[var(--border)] rounded-r p-2 mb-1.5`}
      style={{ marginLeft: depth > 0 ? `${depth * 12}px` : undefined }}
    >
      <div className="font-medium text-[var(--foreground)] mb-0.5">{argument.claim}</div>
      <p className="text-[var(--muted-foreground)] leading-relaxed mb-1">
        {argument.description.length > 200
          ? argument.description.slice(0, 200) + '...'
          : argument.description}
      </p>
      <div className="flex flex-wrap gap-3 text-[10px] text-[var(--muted-foreground)]">
        <span>
          Truth: <strong>{(argument.truthScore * 100).toFixed(0)}%</strong>
        </span>
        <span>
          Linkage: <strong>{(argument.linkageScore * 100).toFixed(0)}%</strong>
        </span>
        <span>
          Importance: <strong>{(importance * 100).toFixed(0)}%</strong>
        </span>
        <span>
          Impact:{' '}
          <strong className={isPro ? 'text-green-700' : 'text-red-700'}>
            {isPro ? '+' : ''}
            {argument.impactScore}
          </strong>
        </span>
        {argument.contributor && (
          <span>
            {argument.contributor.type === 'human' ? '\u{1F464}' : '\u{1F916}'}{' '}
            {argument.contributor.name}
          </span>
        )}
      </div>
      {/* Sub-argument tree toggle */}
      {hasSubArgs && (
        <div className="mt-1.5">
          <button
            onClick={() => setShowSubs(!showSubs)}
            className="text-[10px] text-[var(--accent)] font-medium hover:underline"
          >
            {showSubs ? '\u25B2 Hide' : '\u25BC Show'} {argument.subArguments!.length} sub-argument{argument.subArguments!.length !== 1 ? 's' : ''}
          </button>
          {showSubs && (
            <div className="mt-1">
              {argument.subArguments!.map((sub) => (
                <MiniArgumentCard key={sub.id} argument={sub} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function LikelihoodPanel({
  belief,
  cbaId,
  itemId,
  onArgumentSubmitted,
}: LikelihoodPanelProps) {
  const statusColors = {
    calibrated: 'text-green-700 bg-green-50 border-green-200',
    contested: 'text-amber-700 bg-amber-50 border-amber-200',
    emerging: 'text-blue-700 bg-blue-50 border-blue-200',
  }

  return (
    <div className="bg-gray-50 border border-[var(--border)] rounded-lg p-4 mt-3">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-[var(--muted-foreground)] mb-1">
            Likelihood Score (Nested Belief)
          </div>
          <p className="text-sm text-[var(--foreground)] font-medium">
            {belief.statement}
          </p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
            statusColors[belief.status]
          }`}
        >
          {belief.status.toUpperCase()}
        </span>
      </div>

      {/* Active likelihood display */}
      <div className="flex items-center gap-4 mb-3 bg-white p-3 rounded border border-[var(--border)]">
        <div className="text-center">
          <div className="text-2xl font-extrabold text-[var(--foreground)]">
            {(belief.activeLikelihood * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)]">
            &plusmn;{(belief.confidenceInterval * 100).toFixed(0)}% CI
          </div>
        </div>

        {/* Likelihood bar */}
        <div className="flex-1">
          <div className="relative h-3 bg-gray-200 rounded-full overflow-visible">
            {/* CI range */}
            <div
              className="absolute h-full rounded-full bg-blue-300/50"
              style={{
                left: `${Math.max(0, (belief.activeLikelihood - belief.confidenceInterval) * 100)}%`,
                width: `${Math.min(belief.confidenceInterval * 200, 100)}%`,
                transition: 'all 0.5s ease',
              }}
            />
            {/* Center marker */}
            <div
              className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-blue-700 z-10 rounded"
              style={{
                left: `${belief.activeLikelihood * 100}%`,
                transition: 'left 0.5s ease',
              }}
            />
            {/* Estimate markers */}
            {belief.estimates.map((est) => (
              <div
                key={est.id}
                className={`absolute top-[-5px] bottom-[-5px] w-1 rounded ${
                  est.isActive ? 'bg-blue-600' : 'bg-gray-400'
                }`}
                style={{ left: `${est.probability * 100}%` }}
                title={`${est.label} (RR: ${(est.reasonRankScore * 100).toFixed(0)})`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] mt-1 font-mono">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="text-right text-xs text-[var(--muted-foreground)]">
          <div>{belief.adversarialCycles} cycles</div>
          <div>{belief.estimates.length} competing estimate{belief.estimates.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Competing estimates */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--muted-foreground)]">
          Competing Probability Estimates
        </div>
        {belief.estimates.map((est) => (
          <EstimateCard
            key={est.id}
            estimate={est}
            cbaId={cbaId}
            itemId={itemId}
            onArgumentSubmitted={() => onArgumentSubmitted?.(belief)}
          />
        ))}
      </div>
    </div>
  )
}
