import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { HONESTY_LINE } from '@/lib/agent-ingest/contract'

export const dynamic = 'force-dynamic'

/** Index of ingestion batches: every synthesized document an agent has
 *  exploded into auditable parts. */
export default async function BatchesPage() {
  const batches = await prisma.ingestBatch.findMany({
    include: {
      agent: { select: { name: true, operator: true } },
      _count: { select: { auditLogs: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-sm font-medium text-[var(--foreground)]">Ingestion Batches</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Ingestion Batches</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Each batch is one synthesized document — an encyclopedia article, a thread digest —
          decomposed into standalone claims, placements, and evidence. The article, exploded
          into auditable parts.
        </p>
        <p className="text-xs italic border border-gray-300 bg-gray-50 p-2 mb-6">
          {HONESTY_LINE}
        </p>

        {batches.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            <p className="text-lg mb-2">No batches yet.</p>
            <p className="text-sm">They appear as soon as an agent posts to /api/v1/ingest.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map(batch => (
              <Link
                key={batch.id}
                href={`/batches/${batch.id}`}
                className="block bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 hover:border-gray-300 transition-colors"
              >
                <h2 className="font-semibold text-[var(--foreground)] mb-1">{batch.title}</h2>
                <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
                  <span>Agent: {batch.agent.name}{batch.agent.operator ? ` (${batch.agent.operator})` : ''}</span>
                  <span>{batch.createdAt.toISOString().slice(0, 10)}</span>
                  <span>{batch._count.auditLogs} audited moves</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
