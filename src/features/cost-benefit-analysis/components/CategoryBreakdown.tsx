import { CostBenefitAnalysis, CBACategory, CBA_CATEGORY_UNITS } from '@/core/types/cba'
import { formatDollars } from '@/core/scoring/cba-scoring'

interface CategoryBreakdownProps {
  cba: CostBenefitAnalysis
}

const CATEGORY_ICONS: Record<CBACategory, string> = {
  Financial: '$',
  HumanLife: '♥',
  Freedom: '⚖',
  Time: '⏱',
}

function formatValue(value: number, category: CBACategory): string {
  if (category === 'Financial') return formatDollars(value)
  const unit = CBA_CATEGORY_UNITS[category]
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${(abs / 1e9).toFixed(1)}B ${unit}`
  if (abs >= 1e6) return `${(abs / 1e6).toFixed(1)}M ${unit}`
  if (abs >= 1e3) return `${(abs / 1e3).toFixed(0)}K ${unit}`
  return `${abs.toFixed(0)} ${unit}`
}

export default function CategoryBreakdown({ cba }: CategoryBreakdownProps) {
  const breakdown = cba.categoryBreakdown ?? []
  const nonEmpty = breakdown.filter((c) => c.benefitsEv !== 0 || c.costsEv !== 0)

  if (nonEmpty.length === 0) return null

  const maxAbsValue = Math.max(
    ...breakdown.flatMap((c) => [c.benefitsEv, c.costsEv]),
    1
  )

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-5">
      <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--foreground)] mb-4">
        Category Breakdown
      </h3>
      <div className="space-y-4">
        {breakdown.map((cat) => {
          const hasData = cat.benefitsEv !== 0 || cat.costsEv !== 0
          if (!hasData) return null
          const benefitPct = (cat.benefitsEv / maxAbsValue) * 100
          const costPct = (cat.costsEv / maxAbsValue) * 100
          const isPositive = cat.netEv >= 0

          return (
            <div key={cat.category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-[var(--muted-foreground)]">
                    {CATEGORY_ICONS[cat.category as CBACategory]}
                  </span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {cat.category}
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    {cat.unit}
                  </span>
                </div>
                <span
                  className={`text-sm font-bold font-mono ${
                    isPositive ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {formatValue(cat.netEv, cat.category as CBACategory)}
                </span>
              </div>
              {/* Stacked bar */}
              <div className="flex gap-0.5 h-4 rounded overflow-hidden bg-gray-100">
                {cat.benefitsEv > 0 && (
                  <div
                    className="h-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${benefitPct}%` }}
                    title={`Benefits: ${formatValue(cat.benefitsEv, cat.category as CBACategory)}`}
                  />
                )}
                {cat.costsEv > 0 && (
                  <div
                    className="h-full bg-rose-500 transition-all duration-700"
                    style={{ width: `${costPct}%` }}
                    title={`Costs: ${formatValue(cat.costsEv, cat.category as CBACategory)}`}
                  />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] mt-0.5">
                <span className="text-emerald-700">
                  +{formatValue(cat.benefitsEv, cat.category as CBACategory)}
                </span>
                <span className="text-rose-700">
                  -{formatValue(cat.costsEv, cat.category as CBACategory)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 bg-emerald-500 rounded-sm inline-block" /> Benefits
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 bg-rose-500 rounded-sm inline-block" /> Costs
        </span>
      </div>
    </div>
  )
}
