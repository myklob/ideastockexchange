'use client'

import { useState } from 'react'
import { CBALineItem } from '@/lib/types/cba'
import { formatDollars } from '@/lib/cba-scoring'
import LikelihoodPanel from './LikelihoodPanel'

interface LineItemCardProps {
  item: CBALineItem
  cbaId: string
  onUpdate?: () => void
}

const categoryColors: Record<string, string> = {
  Economic: 'text-blue-700 bg-blue-50 border-blue-200',
  Social: 'text-purple-700 bg-purple-50 border-purple-200',
  Environmental: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Political: 'text-orange-700 bg-orange-50 border-orange-200',
}

export default function LineItemCard({ item, cbaId, onUpdate }: LineItemCardProps) {
  const [expanded, setExpanded] = useState(false)

  const isBenefit = item.type === 'benefit'
  const borderColor = isBenefit ? 'border-l-green-600' : 'border-l-red-600'
  const typeLabel = isBenefit ? 'BENEFIT' : 'COST'
  const typeLabelColor = isBenefit
    ? 'text-green-700 bg-green-50'
    : 'text-red-700 bg-red-50'
  const catColor = categoryColors[item.category] || 'text-gray-700 bg-gray-50 border-gray-200'

  const likelihood = item.likelihoodBelief.activeLikelihood
  const likelihoodStatus = item.likelihoodBelief.status

  return (
    <div
      className={`bg-white border border-[var(--border)] ${borderColor} border-l-4 rounded-lg overflow-hidden transition-shadow hover:shadow-md`}
    >
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${typeLabelColor}`}>
              {typeLabel}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${catColor}`}>
              {item.category}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                likelihoodStatus === 'calibrated'
                  ? 'text-green-700 bg-green-50 border-green-200'
                  : likelihoodStatus === 'contested'
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-blue-700 bg-blue-50 border-blue-200'
              }`}
            >
              {likelihoodStatus}
            </span>
          </div>
          <span className="text-gray-400 flex-shrink-0">{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>

        <h3 className="font-semibold text-[var(--foreground)] mb-2">{item.title}</h3>

        {/* Key metrics row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-[var(--muted)] rounded p-2">
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-0.5">
              Predicted Impact
            </div>
            <div className={`text-sm font-bold ${isBenefit ? 'text-green-700' : 'text-red-700'}`}>
              {formatDollars(item.predictedImpact)}
            </div>
          </div>
          <div className="bg-[var(--muted)] rounded p-2">
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-0.5">
              Likelihood
            </div>
            <div className="text-sm font-bold text-[var(--foreground)]">
              {(likelihood * 100).toFixed(0)}%
              <span className="text-[10px] font-normal text-[var(--muted-foreground)] ml-0.5">
                &plusmn;{(item.likelihoodBelief.confidenceInterval * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="bg-[var(--muted)] rounded p-2">
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-0.5">
              Expected Value
            </div>
            <div className={`text-sm font-bold ${item.expectedValue >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {item.expectedValue >= 0 ? '+' : ''}
              {formatDollars(item.expectedValue)}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[var(--border)] p-4">
          {/* Description */}
          <p className="text-sm text-[var(--muted-foreground)] mb-3 leading-relaxed">
            {item.description}
          </p>

          {/* Contributor */}
          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
                item.contributor.type === 'human'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-blue-700 bg-blue-50 border-blue-200'
              }`}
            >
              {item.contributor.type === 'human' ? '\u{1F464}' : '\u{1F916}'}
              {item.contributor.name}
            </span>
          </div>

          {/* Formula callout */}
          <div className="bg-gray-50 border border-[var(--border)] rounded p-3 mb-3 text-xs font-mono text-center">
            {formatDollars(item.predictedImpact)} &times; {(likelihood * 100).toFixed(0)}%
            = <strong className={item.expectedValue >= 0 ? 'text-green-700' : 'text-red-700'}>
              {item.expectedValue >= 0 ? '+' : ''}{formatDollars(item.expectedValue)}
            </strong>
          </div>

          {/* Likelihood Panel - nested belief */}
          <LikelihoodPanel
            belief={item.likelihoodBelief}
            cbaId={cbaId}
            itemId={item.id}
          />
        </div>
      )}
    </div>
  )
}
