'use client'

import { useState } from 'react'
import { DeduplicationEntry } from '@/core/types/cba'

interface DeduplicationLogProps {
  log: DeduplicationEntry[]
}

export default function DeduplicationLog({ log }: DeduplicationLogProps) {
  const [expanded, setExpanded] = useState(false)

  if (!log || log.length === 0) return null

  const merges = log.filter((e) => e.action === 'merged').length
  const discounts = log.filter((e) => e.action === 'discounted').length

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-[var(--foreground)]">
            De-Duplication Log
          </span>
          <span className="text-[10px] text-[var(--muted-foreground)]">
            {merges > 0 && `${merges} merged`}
            {merges > 0 && discounts > 0 && ', '}
            {discounts > 0 && `${discounts} discounted`}
          </span>
        </div>
        <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] divide-y divide-gray-50">
          {log.map((entry, idx) => (
            <div key={idx} className="px-5 py-3 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    entry.action === 'merged'
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-blue-700 bg-blue-50'
                  }`}
                >
                  {entry.action}
                </span>
                <span className="text-[var(--muted-foreground)] font-mono">
                  {(entry.similarity * 100).toFixed(0)}% overlap
                </span>
              </div>
              <p className="text-[var(--muted-foreground)] leading-relaxed">
                {entry.adjustment}
              </p>
            </div>
          ))}
          <div className="px-5 py-3 text-[10px] text-[var(--muted-foreground)] bg-gray-50 italic">
            De-duplication prevents the same argument or impact from being counted multiple times.
            Two versions of the same argument count once.
          </div>
        </div>
      )}
    </div>
  )
}
