import Link from 'next/link'
import { getAllSchilchtBeliefs } from '@/features/epistemology/data/schlicht-data'

function getStatusStyle(status: string): string {
  switch (status) {
    case 'calibrated':
      return 'bg-green-100 text-green-800'
    case 'contested':
      return 'bg-amber-100 text-amber-800'
    case 'emerging':
      return 'bg-blue-100 text-blue-800'
    case 'archived':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getVolatilityLabel(vol: string): string {
  switch (vol) {
    case 'low':
      return 'High Stability'
    case 'medium':
      return 'Moderate Stability'
    case 'high':
      return 'Low Stability'
    default:
      return 'Unknown'
  }
}

export default function ProtocolListPage() {
  const beliefs = getAllSchilchtBeliefs()

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      {/* Navigation */}
      <nav className="bg-white border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="text-lg font-bold text-[var(--foreground)]"
          >
            ISE
          </Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Protocol Views
          </span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-3">
            Schlicht Protocol: Belief Dashboard
          </h1>
          <p className="text-[var(--muted-foreground)] text-lg leading-relaxed max-w-3xl">
            Each belief is a living object continuously audited by specialized AI
            agents. Select a belief to view its confidence meter, argument trees,
            and real-time protocol log.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-[var(--foreground)] mb-3">
            The Schlicht Protocol
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="border border-[var(--border)] rounded p-3">
              <div className="font-semibold text-[var(--foreground)] mb-1">
                Confidence Meter
              </div>
              <div className="text-[var(--muted-foreground)]">
                Probability distribution derived from surviving arguments, not
                binary true/false.
              </div>
            </div>
            <div className="border border-[var(--border)] rounded p-3">
              <div className="font-semibold text-[var(--foreground)] mb-1">
                Agent Attribution
              </div>
              <div className="text-[var(--muted-foreground)]">
                Every score is certified by a specialized AI (Logic-Check,
                Evidence-Bot, Red-Team).
              </div>
            </div>
            <div className="border border-[var(--border)] rounded p-3">
              <div className="font-semibold text-[var(--foreground)] mb-1">
                Protocol Log
              </div>
              <div className="text-[var(--muted-foreground)]">
                Real-time adversarial process where agents propose, attack, and
                merge claims.
              </div>
            </div>
          </div>
        </div>

        {/* Belief list */}
        <div className="flex flex-col gap-4">
          {beliefs.map((belief) => {
            const truthPct = (belief.metrics.truthScore * 100).toFixed(1)
            const ciPct = (belief.metrics.confidenceInterval * 100).toFixed(1)

            return (
              <Link
                key={belief.beliefId}
                href={`/protocol/${belief.beliefId}`}
                className="block bg-white border border-[var(--border)] rounded-lg p-5 hover:border-[var(--accent)] hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="font-semibold text-[var(--foreground)]">
                    {belief.statement}
                  </h2>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 ${getStatusStyle(belief.status)}`}
                  >
                    {belief.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-[var(--muted-foreground)]">
                      Confidence:{' '}
                    </span>
                    <span className="font-bold text-[var(--foreground)]">
                      {truthPct}% &plusmn; {ciPct}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">
                      Stability:{' '}
                    </span>
                    <span className="text-[var(--foreground)]">
                      {getVolatilityLabel(belief.metrics.volatility)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">
                      Cycles:{' '}
                    </span>
                    <span className="text-[var(--foreground)]">
                      {belief.metrics.adversarialCycles.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">
                      Pro:{' '}
                    </span>
                    <span className="text-green-700 font-medium">
                      {belief.proTree.length}
                    </span>
                    <span className="text-[var(--muted-foreground)]">
                      {' '}
                      / Con:{' '}
                    </span>
                    <span className="text-red-700 font-medium">
                      {belief.conTree.length}
                    </span>
                  </div>
                </div>

                {/* Mini confidence bar */}
                <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${belief.metrics.truthScore * 100}%`,
                      background: 'linear-gradient(90deg, #3b82f6, #22c55e)',
                    }}
                  />
                </div>

                <div className="mt-3 text-xs text-[var(--accent)] font-medium">
                  View Protocol Dashboard &rarr;
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
