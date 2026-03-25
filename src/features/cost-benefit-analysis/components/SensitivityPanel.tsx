import { SensitivityItem } from '@/core/types/cba'
import { formatDollars } from '@/core/scoring/cba-scoring'

interface SensitivityPanelProps {
  items: SensitivityItem[]
}

export default function SensitivityPanel({ items }: SensitivityPanelProps) {
  if (!items || items.length === 0) return null

  const maxSwing = Math.max(...items.map((i) => i.swing), 1)

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-5">
      <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--foreground)] mb-1">
        Sensitivity Analysis
      </h3>
      <p className="text-xs text-[var(--muted-foreground)] mb-4">
        Top items where additional research or debate would most change the conclusion.
        Swing = magnitude &times; (likelihood_high &minus; likelihood_low).
      </p>
      <div className="space-y-3">
        {items.map((item, idx) => {
          const barWidth = (item.swing / maxSwing) * 100
          return (
            <div key={item.impactId}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-[var(--muted-foreground)] mt-0.5 w-4 text-right flex-shrink-0">
                    {idx + 1}.
                  </span>
                  <span className="text-xs font-medium text-[var(--foreground)] leading-tight">
                    {item.impactTitle}
                  </span>
                </div>
                <span className="text-xs font-bold font-mono text-amber-700 flex-shrink-0">
                  ±{formatDollars(item.swing / 2)}
                </span>
              </div>
              {/* Tornado bar */}
              <div className="ml-6 flex items-center gap-2">
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-[10px] text-[var(--muted-foreground)] font-mono whitespace-nowrap">
                  L: {(item.likelihoodLow * 100).toFixed(0)}%–{(item.likelihoodHigh * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
