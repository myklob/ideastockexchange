import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSchilchtBelief, getAllSchilchtBeliefs } from '@/lib/data/schlicht-data'
import ConfidenceMeter from '@/components/schlicht/ConfidenceMeter'
import ArgumentCard from '@/components/schlicht/ArgumentCard'
import ProtocolLog from '@/components/schlicht/ProtocolLog'
import EvidenceTable from '@/components/schlicht/EvidenceTable'

interface ProtocolPageProps {
  params: Promise<{ id: string }>
}

export default async function ProtocolPage({ params }: ProtocolPageProps) {
  const { id } = await params
  const belief = getSchilchtBelief(id)

  if (!belief) {
    notFound()
  }

  const activeAgentCount = Object.keys(belief.agents).length
  const protocolId = `SCHLICHT-${belief.beliefId.slice(0, 8).toUpperCase()}`

  const proNetStrength = belief.proTree.reduce(
    (sum, a) => sum + a.impactScore,
    0
  )
  const conNetStrength = belief.conTree.reduce(
    (sum, a) => sum + Math.abs(a.impactScore),
    0
  )

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      {/* Top navigation bar */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-lg font-bold text-[var(--foreground)]"
            >
              ISE
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <Link
              href="/protocol"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Protocol Views
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <span className="text-sm text-[var(--muted-foreground)] font-mono">
              {belief.beliefId}
            </span>
          </div>
          <Link
            href={`/api/protocol/${id}`}
            className="text-xs font-mono text-[var(--muted-foreground)] hover:text-[var(--accent)] border border-[var(--border)] px-2 py-1 rounded"
          >
            View JSON
          </Link>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto p-5">
        {/* Header: Belief statement + Confidence Meter */}
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4 leading-tight">
            {belief.statement}
          </h1>
          <ConfidenceMeter
            metrics={belief.metrics}
            status={belief.status}
            protocolId={protocolId}
            activeAgents={activeAgentCount}
          />
        </header>

        {/* Main grid: Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-5">
          {/* Main content */}
          <main className="flex flex-col gap-6">
            {/* Pro arguments */}
            <section>
              <div className="flex justify-between items-center border-b-2 border-[var(--border)] pb-1 mb-4">
                <span className="text-sm uppercase tracking-wider font-semibold text-green-700">
                  Verified Support Tree
                </span>
                <span className="text-xs text-[var(--muted-foreground)] font-mono">
                  Net Strength: +{proNetStrength.toFixed(1)}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {belief.proTree.map((arg) => (
                  <ArgumentCard key={arg.id} argument={arg} />
                ))}
              </div>
            </section>

            {/* Con arguments */}
            <section>
              <div className="flex justify-between items-center border-b-2 border-[var(--border)] pb-1 mb-4">
                <span className="text-sm uppercase tracking-wider font-semibold text-red-700">
                  Active Counter-Arguments
                </span>
                <span className="text-xs text-[var(--muted-foreground)] font-mono">
                  Net Weakness: -{conNetStrength.toFixed(1)}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {belief.conTree.map((arg) => (
                  <ArgumentCard key={arg.id} argument={arg} />
                ))}
              </div>
            </section>

            {/* Evidence */}
            <section>
              <div className="border-b-2 border-[var(--border)] pb-1 mb-4">
                <span className="text-sm uppercase tracking-wider font-semibold text-[var(--foreground)]">
                  Foundational Data
                </span>
              </div>
              <EvidenceTable evidence={belief.evidence} />
            </section>

            {/* Comparison table */}
            <section className="bg-white border border-[var(--border)] rounded-lg p-5">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-[var(--foreground)] mb-4">
                Why This Beats Traditional Approaches
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-2 pr-4 text-[var(--muted-foreground)] font-medium">
                        Wikipedia / Grokipedia
                      </th>
                      <th className="text-left py-2 text-[var(--accent)] font-medium">
                        ISE Schlicht Protocol
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--muted-foreground)]">
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4">Prose hides reasoning</td>
                      <td className="py-2 text-[var(--foreground)]">
                        JSON exposes argument structure
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4">
                        Edit wars &rarr; consensus text
                      </td>
                      <td className="py-2 text-[var(--foreground)]">
                        Adversarial cycles &rarr; calibrated confidence
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4">
                        &quot;X is true&quot; (declarative)
                      </td>
                      <td className="py-2 text-[var(--foreground)]">
                        &quot;X: 73% &plusmn; 8%&quot; (probabilistic)
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4">AIs assist humans</td>
                      <td className="py-2 text-[var(--foreground)]">
                        Specialized AIs perform verification functions
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Trust through authority</td>
                      <td className="py-2 text-[var(--foreground)]">
                        Trust through inspectable protocol log
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </main>

          {/* Sidebar */}
          <aside>
            <ProtocolLog
              entries={belief.protocolLog}
              protocolStatus={belief.protocolStatus}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
