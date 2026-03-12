import { CostBenefitAnalysis } from '@/core/types/cba'
import { formatDollars } from '@/core/scoring/cba-scoring'

interface ExpectedValueSummaryProps {
  cba: CostBenefitAnalysis
}

export default function ExpectedValueSummary({ cba }: ExpectedValueSummaryProps) {
  const benefits = cba.items.filter((i) => i.type === 'benefit')
  const costs = cba.items.filter((i) => i.type === 'cost')
  const isPositive = cba.netExpectedValue >= 0

  // Compute bar widths (relative to the larger of benefits/costs)
  const maxTotal = Math.max(cba.totalExpectedBenefits, cba.totalExpectedCosts, 1)
  const benefitWidth = (cba.totalExpectedBenefits / maxTotal) * 100
  const costWidth = (cba.totalExpectedCosts / maxTotal) * 100

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-5 shadow-sm">
      {/* Net Expected Value */}
      <div className="text-center mb-5">
        <div className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-semibold mb-1">
          Net Expected Value
        </div>
        <div
          className={`text-4xl font-extrabold ${
            isPositive ? 'text-green-700' : 'text-red-700'
          }`}
        >
          {isPositive ? '+' : ''}
          {formatDollars(cba.netExpectedValue)}
        </div>
        <div className="text-xs text-[var(--muted-foreground)] mt-1">
          Impacts don&apos;t count unless their probabilities survive attack.
        </div>
      </div>

      {/* Benefits vs Costs bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-green-700 uppercase tracking-wider">
              Expected Benefits
            </span>
            <span className="font-mono text-green-700">
              +{formatDollars(cba.totalExpectedBenefits)}
            </span>
          </div>
          <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-700"
              style={{ width: `${benefitWidth}%` }}
            />
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
            {benefits.length} item{benefits.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-red-700 uppercase tracking-wider">
              Expected Costs
            </span>
            <span className="font-mono text-red-700">
              -{formatDollars(cba.totalExpectedCosts)}
            </span>
          </div>
          <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-700"
              style={{ width: `${costWidth}%` }}
            />
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
            {costs.length} item{costs.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Formula reminder */}
      <div className="mt-4 pt-3 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)] font-mono text-center">
        Expected Value = Predicted Impact &times; Likelihood Score
      </div>
    </div>
  )
}
