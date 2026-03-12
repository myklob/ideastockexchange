import Link from 'next/link'
import { fetchAllBeliefs } from '@/features/belief-analysis/data/fetch-belief'

export default async function BeliefsIndexPage() {
  const beliefs = await fetchAllBeliefs()

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-sm font-medium text-[var(--foreground)]">All Beliefs</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Belief Analysis Pages</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-8">
          Every belief gets its own comprehensive analysis page with argument trees, evidence, values analysis,
          cost-benefit analysis, and more. Click a belief to view its full analysis.
        </p>

        {beliefs.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            <p className="text-lg mb-2">No beliefs yet.</p>
            <p className="text-sm">Seed the database to get started with sample beliefs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {beliefs.map(belief => (
              <Link
                key={belief.id}
                href={`/beliefs/${belief.slug}`}
                className="block bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="font-semibold text-[var(--foreground)] mb-1">{belief.statement}</h2>
                    <div className="flex gap-3 text-xs text-[var(--muted-foreground)]">
                      {belief.category && <span>{belief.category}</span>}
                      {belief.subcategory && <span>&gt; {belief.subcategory}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-sm font-bold ${belief.positivity >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {belief.positivity >= 0 ? '+' : ''}{belief.positivity.toFixed(0)}%
                    </span>
                    <div className="text-xs text-[var(--muted-foreground)]">positivity</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
