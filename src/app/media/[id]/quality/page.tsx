import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchMediaById, getMediaTypeLabel, getMediaTypeEmoji } from '@/features/media/fetch-media'

function scoreColor(score: number): string {
  if (score >= 0.7) return 'text-green-700'
  if (score >= 0.4) return 'text-orange-600'
  return 'text-red-700'
}

interface MediaQualityPageProps {
  params: Promise<{ id: string }>
}

export default async function MediaQualityPage({ params }: MediaQualityPageProps) {
  const { id } = await params
  const mediaId = parseInt(id, 10)
  if (isNaN(mediaId)) notFound()

  const media = await fetchMediaById(mediaId)
  if (!media) notFound()

  const typeLabel = getMediaTypeLabel(media.mediaType).toLowerCase()
  const proQuality = (media.qualityArguments || []).filter(a => a.side === 'agree')
  const conQuality = (media.qualityArguments || []).filter(a => a.side === 'disagree')
  const totalPro = proQuality.reduce((s, a) => s + Math.abs(a.impactScore), 0)
  const totalCon = conQuality.reduce((s, a) => s + Math.abs(a.impactScore), 0)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <Link href="/media" className="text-sm text-[var(--accent)] hover:underline">Media</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <Link href={`/media/${media.id}`} className="text-sm text-[var(--accent)] hover:underline">{media.title}</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-sm text-[var(--muted-foreground)]">Quality Analysis</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4 leading-tight">
          Quality Analysis: &ldquo;{media.title} is a great {typeLabel}&rdquo;
        </h1>

        {/* Meta info box */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Media:</strong> <Link href={`/media/${media.id}`} className="text-[var(--accent)] hover:underline">{media.title}</Link></p>
              <p><strong>Type:</strong> {getMediaTypeEmoji(media.mediaType)} {getMediaTypeLabel(media.mediaType)}</p>
              {media.author && <p><strong>Author/Creator:</strong> {media.author}</p>}
            </div>
            <div className="text-right">
              <p><strong>Quality Score:</strong> <span className={`font-bold ${scoreColor(media.qualityScore)}`}>{media.qualityScore.toFixed(2)}</span></p>
              <p><strong>Claim Strength:</strong> Moderate (0.5)</p>
            </div>
          </div>
        </div>

        {/* Explanation callout */}
        <div className="bg-yellow-50 border border-yellow-200 border-l-4 border-l-yellow-500 p-4 mb-6 text-sm">
          <strong>This page uses the ISE belief-analysis template</strong> applied to the question:
          &ldquo;Is <em>{media.title}</em> a great {typeLabel}?&rdquo;
          Arguments here evaluate the <em>quality of the media itself</em> &mdash; craft, originality, emotional impact,
          entertainment value &mdash; completely separate from the truth or falsehood of the ideas it spreads.
          For belief arguments, see the{' '}
          <Link href={`/media/${media.id}`} className="text-[var(--accent)] hover:underline">main media page</Link>.
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* Argument Trees */}
        <section className="space-y-12">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
              <span>&#x1F50D;</span> Argument Trees
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Each reason is itself a belief with its own ISE page. Scoring is recursive based on{' '}
              <Link href="/truth" className="text-[var(--accent)] hover:underline">truth</Link>,{' '}
              <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">linkage</Link>, and{' '}
              <Link href="/Importance%20Score" className="text-[var(--accent)] hover:underline">importance</Link>.
            </p>

            {/* Pro quality */}
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-3">
              &#x2705; Top Scoring Reasons to Agree (It IS Great)
            </h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-green-50">
                    <th className="px-3 py-2 text-left font-semibold border border-gray-300 w-[55%]">Reason</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Argument Score</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Linkage</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {proQuality.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-3 border border-gray-300 text-center text-[var(--muted-foreground)] italic">
                        No pro-quality arguments yet. Contribute one!
                      </td>
                    </tr>
                  ) : (
                    proQuality.map(a => (
                      <tr key={a.id}>
                        <td className="px-3 py-2 border border-gray-300">{a.statement}</td>
                        <td className="px-3 py-2 border border-gray-300 text-center text-green-700 font-semibold">
                          +{Math.abs(a.argumentScore).toFixed(0)}
                        </td>
                        <td className="px-3 py-2 border border-gray-300 text-center">{a.linkageScore.toFixed(2)}</td>
                        <td className="px-3 py-2 border border-gray-300 text-center">{a.impactScore.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-gray-100">
                    <td colSpan={3} className="px-3 py-2 border border-gray-300 text-right font-bold">Total Pro:</td>
                    <td className="px-3 py-2 border border-gray-300 text-center font-bold text-green-700">
                      +{totalPro.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Con quality */}
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-3">
              &#x274C; Top Scoring Reasons to Disagree (It Is NOT Great)
            </h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-red-50">
                    <th className="px-3 py-2 text-left font-semibold border border-gray-300 w-[55%]">Reason</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Argument Score</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Linkage</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {conQuality.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-3 border border-gray-300 text-center text-[var(--muted-foreground)] italic">
                        No con-quality arguments yet. Contribute one!
                      </td>
                    </tr>
                  ) : (
                    conQuality.map(a => (
                      <tr key={a.id}>
                        <td className="px-3 py-2 border border-gray-300">{a.statement}</td>
                        <td className="px-3 py-2 border border-gray-300 text-center text-red-700 font-semibold">
                          &minus;{Math.abs(a.argumentScore).toFixed(0)}
                        </td>
                        <td className="px-3 py-2 border border-gray-300 text-center">{a.linkageScore.toFixed(2)}</td>
                        <td className="px-3 py-2 border border-gray-300 text-center">{a.impactScore.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-gray-100">
                    <td colSpan={3} className="px-3 py-2 border border-gray-300 text-right font-bold">Total Con:</td>
                    <td className="px-3 py-2 border border-gray-300 text-center font-bold text-red-700">
                      &minus;{totalCon.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Overall quality score */}
          <div className="text-right space-y-1">
            <p className="text-lg font-bold">
              Quality Score:{' '}
              <span className={totalPro - totalCon >= 0 ? 'text-green-700' : 'text-red-700'}>
                {totalPro - totalCon >= 0 ? '+' : ''}{(totalPro - totalCon).toFixed(1)}
              </span>
              {' '}
              <span className="text-sm font-normal text-[var(--muted-foreground)]">
                (based on argument scores)
              </span>
            </p>
          </div>
        </section>

        <hr className="border-gray-200 my-8" />

        {/* Related pages */}
        <div className="bg-blue-50 border-l-4 border-blue-600 px-4 py-4 rounded-r text-sm">
          <p className="font-bold mb-2">Related pages:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><Link href={`/media/${media.id}`} className="text-[var(--accent)] hover:underline">Back to {media.title} &mdash; Belief Arguments</Link></li>
            <li><Link href="/media" className="text-[var(--accent)] hover:underline">Media Index</Link></li>
            <li><Link href="/media/why-pro-con-media" className="text-[var(--accent)] hover:underline">Why We Track Pro/Con Media Per Belief</Link></li>
          </ul>
        </div>
      </main>
    </div>
  )
}
