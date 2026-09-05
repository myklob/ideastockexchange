import Link from 'next/link'
import { fetchAllTopics } from '@/features/topics/data/fetch-topics'
import { formatSignedScore } from '@/features/topics/lib/dimensions'

export const dynamic = 'force-dynamic'

export default async function TopicsIndexPage() {
  const topics = await fetchAllTopics()

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-sm font-medium text-[var(--foreground)]">Topics</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">One Page Per Topic</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Every topic gets one page where all beliefs about it converge, organized across three
          dimensions — <strong>direction</strong> (negative ↔ positive), <strong>magnitude</strong>{' '}
          (weak ↔ extreme), and <strong>abstraction</strong> (general ↔ specific) — and sorted by
          engine-computed scores, so the best-supported version of any claim rises to the top.
          Individual claims live on their own pages under{' '}
          <Link href="/beliefs" className="text-[var(--accent)] hover:underline">Beliefs</Link>.
        </p>

        {topics.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            <p className="text-lg mb-2">No topics yet.</p>
            <p className="text-sm">
              Run <code className="bg-gray-100 px-1 rounded">npm run db:seed</code> to populate the
              sample topics, or browse{' '}
              <Link href="/beliefs" className="text-[var(--accent)] hover:underline">all beliefs</Link>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map(topic => (
              <Link
                key={topic.id}
                href={`/topics/${topic.slug}`}
                className="block bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-[var(--foreground)] mb-1">{topic.title}</h2>
                    {topic.question && (
                      <p className="text-sm text-[var(--muted-foreground)]">{topic.question}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right text-xs text-[var(--muted-foreground)]">
                    <div className="text-sm font-bold text-[var(--foreground)]">
                      {topic.beliefCount}
                    </div>
                    <div>{topic.beliefCount === 1 ? 'belief' : 'beliefs'}</div>
                    {topic.minPositivity !== null && topic.maxPositivity !== null && (
                      <div className="mt-1 font-mono">
                        {formatSignedScore(topic.minPositivity)} … {formatSignedScore(topic.maxPositivity)}
                      </div>
                    )}
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
