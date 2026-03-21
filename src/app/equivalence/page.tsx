import Link from 'next/link'
import { prisma } from '@/lib/prisma'

const VERDICT_LABELS: Record<string, { label: string; color: string }> = {
  merge:           { label: 'MERGE',           color: 'bg-red-100 text-red-800 border-red-300' },
  merge_with_note: { label: 'MERGE WITH NOTE', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  link:            { label: 'LINK ONLY',       color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  separate:        { label: 'SEPARATE',        color: 'bg-green-100 text-green-800 border-green-300' },
}

export default async function EquivalenceListPage() {
  const analyses = await prisma.equivalenceAnalysis.findMany({
    orderBy: { finalEquivalenceScore: 'desc' },
    select: {
      id: true,
      slug: true,
      beliefXRaw: true,
      beliefYRaw: true,
      finalEquivalenceScore: true,
      verdict: true,
      confidence: true,
      analystType: true,
      createdAt: true,
    },
  })

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-sm text-[var(--muted-foreground)]">Equivalence Analyses</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            ⚖️ Belief Equivalence Analyses
          </h1>
          <span className="text-sm text-[var(--muted-foreground)]">
            {analyses.length} {analyses.length === 1 ? 'analysis' : 'analyses'}
          </span>
        </div>

        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Each analysis compares two beliefs to determine whether they should be merged,
          linked, or kept separate. Scored using synonym convergence, overlap, and argument balance.
        </p>

        {analyses.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            <p className="text-lg mb-2">No equivalence analyses yet.</p>
            <p className="text-sm">
              Use the <code className="font-mono bg-gray-100 px-1 rounded">POST /api/equivalence</code> endpoint to create one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map(analysis => {
              const verdictInfo = VERDICT_LABELS[analysis.verdict] ?? VERDICT_LABELS.separate
              const scorePercent = (analysis.finalEquivalenceScore * 100).toFixed(1)

              return (
                <Link
                  key={analysis.id}
                  href={`/equivalence/${analysis.slug}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:border-[var(--accent)] hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${verdictInfo.color}`}>
                          {verdictInfo.label}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)] font-mono">
                          {scorePercent}%
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {analysis.analystType} · {analysis.confidence} confidence
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">
                        X: {analysis.beliefXRaw}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] truncate mt-0.5">
                        Y: {analysis.beliefYRaw}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-[var(--muted-foreground)] font-mono">
                        {analysis.slug}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
