import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSchilchtBelief } from '@/features/reasonrank/data/schlicht-data'
import ProtocolDashboard from '@/features/reasonrank/components/ProtocolDashboard'

interface ProtocolPageProps {
  params: Promise<{ id: string }>
}

export default async function ProtocolPage({ params }: ProtocolPageProps) {
  const { id } = await params
  const belief = getSchilchtBelief(id)

  if (!belief) {
    notFound()
  }

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

      {/* Interactive dashboard */}
      <ProtocolDashboard initialBelief={belief} />
    </div>
  )
}
