import Link from 'next/link'
import { fetchAllMedia, computeEpistemicImpact, formatReach, getMediaTypeLabel, getMediaTypeEmoji } from '@/features/media/fetch-media'

function scoreColor(score: number): string {
  if (score >= 0.7) return 'text-green-700'
  if (score >= 0.4) return 'text-orange-600'
  return 'text-red-700'
}

export default async function MediaIndexPage() {
  const allMedia = await fetchAllMedia()

  // Sort by epistemic impact (descending)
  const byEpistemicImpact = [...allMedia].sort(
    (a, b) => computeEpistemicImpact(b) - computeEpistemicImpact(a)
  )

  // Group by media type for summary counts
  const typeCounts = allMedia.reduce<Record<string, number>>((acc, m) => {
    acc[m.mediaType] = (acc[m.mediaType] || 0) + 1
    return acc
  }, {})

  // Group by category
  const categoryMap = allMedia.reduce<Record<string, typeof allMedia>>((acc, m) => {
    const cat = m.belief.category || 'Uncategorized'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(m)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-sm text-[var(--muted-foreground)]">Media Index</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4 leading-tight">
          Media Index: Best Books, Movies, Songs, and More by Topic
        </h1>

        {/* Rationale callout */}
        <div className="bg-blue-50 border border-blue-200 border-l-4 border-l-blue-600 p-4 mb-6 text-sm">
          <strong>Why track media per belief?</strong> Every belief is shaped by the media that reaches people
          &mdash; books, movies, songs, scientific papers, images, and more. ISE identifies which media currently
          carry the most weight for each belief, measures their <em>epistemic impact</em> (Truth Score &times; Reach),
          and helps you find the best content for and against any idea.{' '}
          <Link href="/media/why-pro-con-media" className="text-[var(--accent)] hover:underline">
            Read the full rationale &rarr;
          </Link>
        </div>

        {/* Media type summary */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
            <span>&#x1F3AC;</span> Media Types at a Glance
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <div key={type} className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                <div className="text-2xl">{getMediaTypeEmoji(type)}</div>
                <div className="text-sm font-semibold">{getMediaTypeLabel(type)}s</div>
                <div className="text-lg font-bold text-[var(--foreground)]">{count}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-gray-200 mb-8" />

        {/* Top media by epistemic impact */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
            <span>&#x1F4CA;</span> Top Media by Epistemic Impact
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Epistemic Impact = Truth Score &times; Reach. How much this media is actually shaping public belief.
          </p>

          {byEpistemicImpact.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] italic">No media resources tracked yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left font-semibold border border-gray-300">#</th>
                    <th className="px-3 py-2 text-left font-semibold border border-gray-300">Title</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Type</th>
                    <th className="px-3 py-2 text-left font-semibold border border-gray-300">Related Belief</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Side</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Quality</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Truth</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Reach</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Epistemic Impact</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Directness</th>
                  </tr>
                </thead>
                <tbody>
                  {byEpistemicImpact.map((m, i) => (
                    <tr key={m.id} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="px-3 py-2 border border-gray-300">{i + 1}</td>
                      <td className="px-3 py-2 border border-gray-300">
                        <Link href={`/media/${m.id}`} className="text-[var(--accent)] hover:underline font-medium">
                          {m.title}
                        </Link>
                        {m.author && <span className="text-[var(--muted-foreground)] text-xs block">by {m.author}</span>}
                      </td>
                      <td className="px-3 py-2 border border-gray-300 text-center">
                        {getMediaTypeEmoji(m.mediaType)} {getMediaTypeLabel(m.mediaType)}
                      </td>
                      <td className="px-3 py-2 border border-gray-300">
                        <Link href={`/beliefs/${m.belief.slug}`} className="text-[var(--accent)] hover:underline text-xs">
                          {m.belief.statement}
                        </Link>
                      </td>
                      <td className="px-3 py-2 border border-gray-300 text-center">
                        {m.side === 'supporting' ? (
                          <span className="text-green-700">&#x2705;</span>
                        ) : (
                          <span className="text-red-700">&#x274C;</span>
                        )}
                      </td>
                      <td className={`px-3 py-2 border border-gray-300 text-center font-semibold ${scoreColor(m.qualityScore)}`}>
                        {m.qualityScore.toFixed(2)}
                      </td>
                      <td className={`px-3 py-2 border border-gray-300 text-center font-semibold ${scoreColor(m.truthScore)}`}>
                        {m.truthScore.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 border border-gray-300 text-center">
                        {formatReach(m.reach)}
                      </td>
                      <td className={`px-3 py-2 border border-gray-300 text-center font-semibold ${scoreColor(m.truthScore)}`}>
                        {formatReach(computeEpistemicImpact(m))}
                      </td>
                      <td className="px-3 py-2 border border-gray-300 text-center">
                        {m.directnessOfAdvocacy}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <hr className="border-gray-200 mb-8" />

        {/* Media by category */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
            <span>&#x1F4DA;</span> Media by Category
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-3 py-2 text-left font-semibold border border-gray-300">Category</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Total Media</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Beliefs Covered</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(categoryMap).sort((a, b) => b[1].length - a[1].length).map(([cat, items]) => {
                  const uniqueBeliefs = new Set(items.map(m => m.belief.id))
                  return (
                    <tr key={cat}>
                      <td className="px-3 py-2 border border-gray-300 font-medium">{cat}</td>
                      <td className="px-3 py-2 border border-gray-300 text-center">{items.length}</td>
                      <td className="px-3 py-2 border border-gray-300 text-center">{uniqueBeliefs.size}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <hr className="border-gray-200 mb-8" />

        {/* Related pages */}
        <div className="bg-blue-50 border-l-4 border-blue-600 px-4 py-4 rounded-r text-sm">
          <p className="font-bold mb-2">Related pages:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><Link href="/media/why-pro-con-media" className="text-[var(--accent)] hover:underline">Why We Track Pro/Con Media Per Belief</Link></li>
            <li><Link href="/beliefs" className="text-[var(--accent)] hover:underline">All Beliefs</Link></li>
          </ul>
        </div>
      </main>
    </div>
  )
}
