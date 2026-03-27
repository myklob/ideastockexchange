import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchMediaById, computeEpistemicImpact, formatReach, getMediaTypeLabel, getMediaTypeEmoji } from '@/features/media/fetch-media'
import { fetchAllMedia } from '@/features/media/fetch-media'

function scoreColor(score: number): string {
  if (score >= 0.7) return 'text-green-700'
  if (score >= 0.4) return 'text-orange-600'
  return 'text-red-700'
}

interface MediaDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MediaDetailPage({ params }: MediaDetailPageProps) {
  const { id } = await params
  const mediaId = parseInt(id, 10)
  if (isNaN(mediaId)) notFound()

  const media = await fetchMediaById(mediaId)
  if (!media) notFound()

  // Find other media linked to the same belief (for context)
  const allMedia = await fetchAllMedia()
  const siblingMedia = allMedia.filter(m => m.belief.id === media.belief.id && m.id !== media.id)

  const epistemicImpact = computeEpistemicImpact(media)
  const proQuality = (media.qualityArguments || []).filter(a => a.side === 'agree')
  const conQuality = (media.qualityArguments || []).filter(a => a.side === 'disagree')
  const totalProQuality = proQuality.reduce((s, a) => s + Math.abs(a.impactScore), 0)
  const totalConQuality = conQuality.reduce((s, a) => s + Math.abs(a.impactScore), 0)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <Link href="/media" className="text-sm text-[var(--accent)] hover:underline">Media</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-sm text-[var(--muted-foreground)] truncate max-w-[300px]">{media.title}</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4 leading-tight">
          ISE Media Review: {media.title}
        </h1>

        {/* Meta info box */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Type:</strong> {getMediaTypeEmoji(media.mediaType)} {getMediaTypeLabel(media.mediaType)}</p>
              {media.author && <p><strong>Author/Creator:</strong> {media.author}</p>}
              {media.year && <p><strong>Year:</strong> {media.year}</p>}
              {media.url && (
                <p><strong>URL:</strong>{' '}
                  <a href={media.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                    External Link
                  </a>
                </p>
              )}
            </div>
            <div className="text-right">
              <p><strong>Reliability Tier:</strong> {media.reliabilityTier}</p>
              <p><strong>Genre:</strong> {media.genreType}</p>
              <p>
                <strong>Side:</strong>{' '}
                {media.side === 'supporting' ? (
                  <span className="text-green-700 font-semibold">Supporting</span>
                ) : (
                  <span className="text-red-700 font-semibold">Opposing</span>
                )}
                {' '}
                <Link href={`/beliefs/${media.belief.slug}`} className="text-[var(--accent)] hover:underline">
                  {media.belief.statement}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Two-category callout */}
        <div className="bg-blue-50 border border-blue-200 border-l-4 border-l-blue-600 p-4 mb-6 text-sm">
          <strong>Two categories of analysis:</strong> This page contains (1) <strong>Belief Arguments</strong> &mdash;
          the ideas and claims this media spreads or counters, and (2) <strong>Quality Arguments</strong> &mdash;
          pro/con arguments about the quality of this media as a work, independent of its message.{' '}
          <Link href="/media/why-pro-con-media" className="text-[var(--accent)] hover:underline">Why?</Link>
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* Scores at a Glance */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
            <span>&#x1F4CA;</span> Scores at a Glance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Quality Score</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Truth Score</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Linkage Score</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Reach</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Epistemic Impact</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Directness</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`px-3 py-3 border border-gray-300 text-center text-lg font-bold ${scoreColor(media.qualityScore)}`}>
                    {media.qualityScore.toFixed(2)}
                  </td>
                  <td className={`px-3 py-3 border border-gray-300 text-center text-lg font-bold ${scoreColor(media.truthScore)}`}>
                    {media.truthScore.toFixed(2)}
                  </td>
                  <td className={`px-3 py-3 border border-gray-300 text-center text-lg font-bold ${scoreColor(media.linkageScore)}`}>
                    {media.linkageScore.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 border border-gray-300 text-center text-lg font-bold">
                    {formatReach(media.reach)}
                  </td>
                  <td className={`px-3 py-3 border border-gray-300 text-center text-lg font-bold ${scoreColor(media.truthScore)}`}>
                    {formatReach(epistemicImpact)}
                  </td>
                  <td className="px-3 py-3 border border-gray-300 text-center text-lg font-bold">
                    {media.directnessOfAdvocacy}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <hr className="border-gray-200 mb-8" />

        {/* Part 1: Belief Arguments */}
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Part 1: Belief Arguments &mdash; Ideas This Media Spreads
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          The beliefs and claims this media supports or weakens. Each belief links to its own ISE analysis page.
        </p>

        <section className="mb-8">
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-3">
            &#x2705; Belief This Media Supports/Opposes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className={media.side === 'supporting' ? 'bg-green-50' : 'bg-red-50'}>
                  <th className="px-3 py-2 text-left font-semibold border border-gray-300">Belief</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Side</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Linkage</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Impact</th>
                  <th className="px-3 py-2 text-left font-semibold border border-gray-300">How It Argues</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border border-gray-300">
                    <Link href={`/beliefs/${media.belief.slug}`} className="text-[var(--accent)] hover:underline font-medium">
                      {media.belief.statement}
                    </Link>
                  </td>
                  <td className="px-3 py-2 border border-gray-300 text-center">
                    {media.side === 'supporting' ? (
                      <span className="text-green-700 font-semibold">Supporting</span>
                    ) : (
                      <span className="text-red-700 font-semibold">Opposing</span>
                    )}
                  </td>
                  <td className={`px-3 py-2 border border-gray-300 text-center font-semibold ${scoreColor(media.linkageScore)}`}>
                    {media.linkageScore.toFixed(2)}
                  </td>
                  <td className={`px-3 py-2 border border-gray-300 text-center font-semibold ${scoreColor(media.impactScore)}`}>
                    {media.impactScore.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 border border-gray-300 text-xs text-gray-600">
                    {media.howItArgues || 'Not yet described'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Other media for the same belief */}
        {siblingMedia.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-3">
              Other Media for the Same Belief
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left font-semibold border border-gray-300">Title</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Type</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Side</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Truth</th>
                    <th className="px-3 py-2 text-center font-semibold border border-gray-300">Reach</th>
                  </tr>
                </thead>
                <tbody>
                  {siblingMedia.map(s => (
                    <tr key={s.id}>
                      <td className="px-3 py-2 border border-gray-300">
                        <Link href={`/media/${s.id}`} className="text-[var(--accent)] hover:underline">
                          {s.title}
                        </Link>
                      </td>
                      <td className="px-3 py-2 border border-gray-300 text-center">
                        {getMediaTypeEmoji(s.mediaType)} {getMediaTypeLabel(s.mediaType)}
                      </td>
                      <td className="px-3 py-2 border border-gray-300 text-center">
                        {s.side === 'supporting' ? (
                          <span className="text-green-700">&#x2705;</span>
                        ) : (
                          <span className="text-red-700">&#x274C;</span>
                        )}
                      </td>
                      <td className={`px-3 py-2 border border-gray-300 text-center font-semibold ${scoreColor(s.truthScore)}`}>
                        {s.truthScore.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 border border-gray-300 text-center">
                        {formatReach(s.reach)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <hr className="border-gray-200 mb-8" />

        {/* Part 2: Quality Arguments */}
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Part 2: Quality Arguments &mdash; Is This Media Good?
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-2">
          Separate from what ideas it spreads, is this a <em>good</em> {getMediaTypeLabel(media.mediaType).toLowerCase()}?
          These arguments evaluate quality on its own merits &mdash; craft, originality, entertainment value, emotional impact.
        </p>

        {/* Yellow note about independence */}
        <div className="bg-yellow-50 border border-yellow-200 border-l-4 border-l-yellow-500 p-3 mb-6 text-sm">
          <strong>Note:</strong> Quality arguments are <em>independent</em> of truth arguments. A beautifully crafted
          propaganda film can score high on quality and low on truth. A dry but rigorous paper can score high on truth
          and low on quality (entertainment). Both scores matter.
        </div>

        <Link
          href={`/media/${media.id}/quality`}
          className="text-[var(--accent)] hover:underline font-bold text-sm block mb-6"
        >
          &rarr; View full Quality Analysis page for this media &rarr;
        </Link>

        {/* Pro quality arguments */}
        <section className="mb-6">
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-3">
            &#x2705; Reasons This Is Good Media
          </h3>
          <div className="overflow-x-auto">
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
                      No quality arguments yet
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
                    +{totalProQuality.toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Con quality arguments */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-3">
            &#x274C; Reasons This Is Not Good Media
          </h3>
          <div className="overflow-x-auto">
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
                      No quality arguments yet
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
                    &minus;{totalConQuality.toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <hr className="border-gray-200 mb-6" />

        {/* Overall quality score */}
        <div className="text-right space-y-1 mb-8">
          <p className="text-lg font-bold">
            Quality Score:{' '}
            <span className={totalProQuality - totalConQuality >= 0 ? 'text-green-700' : 'text-red-700'}>
              {totalProQuality - totalConQuality >= 0 ? '+' : ''}{(totalProQuality - totalConQuality).toFixed(1)}
            </span>
            {' '}
            <span className="text-sm font-normal text-[var(--muted-foreground)]">
              (based on argument scores)
            </span>
          </p>
        </div>

        {/* Related pages */}
        <div className="bg-blue-50 border-l-4 border-blue-600 px-4 py-4 rounded-r text-sm">
          <p className="font-bold mb-2">Related pages:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><Link href="/media" className="text-[var(--accent)] hover:underline">Media Index</Link></li>
            <li><Link href={`/media/${media.id}/quality`} className="text-[var(--accent)] hover:underline">Full Quality Analysis for {media.title}</Link></li>
            <li><Link href="/media/why-pro-con-media" className="text-[var(--accent)] hover:underline">Why We Track Pro/Con Media Per Belief</Link></li>
            <li><Link href={`/beliefs/${media.belief.slug}`} className="text-[var(--accent)] hover:underline">Belief: {media.belief.statement}</Link></li>
          </ul>
        </div>
      </main>
    </div>
  )
}
