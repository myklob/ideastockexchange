import { CostBenefitAnalysis } from '@/core/types/cba'
import { formatDollars } from '@/core/scoring/cba-scoring'

interface ScenarioPanelProps {
  cba: CostBenefitAnalysis
}

export default function ScenarioPanel({ cba }: ScenarioPanelProps) {
  const { scenarios } = cba
  if (!scenarios) return null

  const cols = [
    {
      label: 'Optimistic',
      description: 'All likelihoods +15%',
      data: scenarios.optimistic,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      label: 'Base Case',
      description: 'As calculated',
      data: scenarios.base,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      label: 'Pessimistic',
      description: 'All likelihoods −15%',
      data: scenarios.pessimistic,
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
    },
  ]

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-5">
      <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--foreground)] mb-4">
        Scenario Analysis
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {cols.map(({ label, description, data, color, bg, border }) => {
          const isPositive = data.totalEv >= 0
          return (
            <div
              key={label}
              className={`${bg} border ${border} rounded-lg p-3 text-center`}
            >
              <div className={`text-xs font-semibold uppercase tracking-wider ${color} mb-0.5`}>
                {label}
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)] mb-2">
                {description}
              </div>
              <div className={`text-xl font-extrabold ${color}`}>
                {isPositive ? '+' : ''}{formatDollars(data.totalEv)}
              </div>
              <div className="mt-2 space-y-0.5 text-[10px] text-[var(--muted-foreground)]">
                <div className="text-emerald-700">+{formatDollars(data.totalBenefits)} benefits</div>
                <div className="text-rose-700">−{formatDollars(data.totalCosts)} costs</div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-[var(--muted-foreground)] mt-3 text-center">
        Scenarios shift all likelihood scores ±15% (capped at 0%–100%).
        The base case reflects current argument tree scores.
      </p>
    </div>
  )
}
