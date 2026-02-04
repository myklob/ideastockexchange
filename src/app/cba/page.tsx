import Link from 'next/link'
import { getAllCBAs } from '@/features/cost-benefit-analysis/data/cba-data'
import { formatDollars } from '@/core/scoring/cba-scoring'

export default function CBAListPage() {
  const cbas = getAllCBAs()

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      {/* Navigation */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold text-[var(--foreground)]">
              ISE
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <span className="text-sm text-[var(--foreground)] font-semibold">
              Cost-Benefit Analysis
            </span>
          </div>
          <Link
            href="/protocol"
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] border border-[var(--border)] px-2 py-1 rounded"
          >
            Protocol Views
          </Link>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto p-5">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-3">
            Crowd-Sourced Cost-Benefit Analysis
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-3xl leading-relaxed">
            Each analysis contains costs and benefits with crowd-sourced likelihood
            scores. Probabilities are not voted on &mdash; they are argued for.
            The estimate backed by the strongest surviving argument tree becomes the
            active likelihood.
          </p>
        </header>

        {/* Formula banner */}
        <div className="bg-white border border-[var(--border)] rounded-lg p-4 mb-6 text-center">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Core Formula</div>
          <div className="text-lg font-mono font-semibold text-[var(--foreground)]">
            Predicted Impact &times; Likelihood Score = Expected Value
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">
            Impacts don&apos;t count unless their probabilities survive attack.
          </div>
        </div>

        {/* CBA Cards */}
        <div className="grid gap-6">
          {cbas.map((cba) => {
            const benefits = cba.items.filter((i) => i.type === 'benefit')
            const costs = cba.items.filter((i) => i.type === 'cost')
            const isPositive = cba.netExpectedValue >= 0
            const calibratedCount = cba.items.filter(
              (i) => i.likelihoodBelief.status === 'calibrated'
            ).length
            const contestedCount = cba.items.filter(
              (i) => i.likelihoodBelief.status === 'contested'
            ).length

            return (
              <Link
                key={cba.id}
                href={`/cba/${cba.id}`}
                className="block bg-white border border-[var(--border)] rounded-lg p-6 hover:border-[var(--accent)] hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
                      {cba.title}
                    </h2>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                      {cba.description.length > 200
                        ? cba.description.slice(0, 200) + '...'
                        : cba.description}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 text-xs px-2 py-1 rounded border font-semibold ${
                      cba.status === 'active'
                        ? 'text-green-700 bg-green-50 border-green-200'
                        : 'text-gray-700 bg-gray-50 border-gray-200'
                    }`}
                  >
                    {cba.status.toUpperCase()}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-[var(--muted)] rounded p-3 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-0.5">
                      Net Expected Value
                    </div>
                    <div className={`text-lg font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                      {isPositive ? '+' : ''}{formatDollars(cba.netExpectedValue)}
                    </div>
                  </div>
                  <div className="bg-[var(--muted)] rounded p-3 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-0.5">
                      Benefits
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      {benefits.length} items
                    </div>
                  </div>
                  <div className="bg-[var(--muted)] rounded p-3 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-0.5">
                      Costs
                    </div>
                    <div className="text-lg font-bold text-red-700">
                      {costs.length} items
                    </div>
                  </div>
                  <div className="bg-[var(--muted)] rounded p-3 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-0.5">
                      Status
                    </div>
                    <div className="text-xs font-mono text-[var(--foreground)]">
                      {calibratedCount} calibrated, {contestedCount} contested
                    </div>
                  </div>
                </div>

                {/* Expected value bars */}
                <div className="flex gap-2 items-center">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          (cba.totalExpectedBenefits /
                            Math.max(cba.totalExpectedBenefits + cba.totalExpectedCosts, 1)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] font-mono flex-shrink-0">
                    B/C: {(cba.totalExpectedBenefits / Math.max(cba.totalExpectedCosts, 1)).toFixed(2)}
                  </span>
                </div>

                <div className="mt-3 text-sm text-[var(--accent)] font-medium">
                  View Full Analysis &rarr;
                </div>
              </Link>
            )
          })}
        </div>

        {cbas.length === 0 && (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            No cost-benefit analyses yet.
          </div>
        )}
      </div>
    </div>
  )
}
