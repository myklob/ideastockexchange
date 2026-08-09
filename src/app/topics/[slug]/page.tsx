import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchTopicBySlug } from '@/features/topics/data/fetch-topics'
import {
  getDirectionBand,
  getAbstractionLabel,
  formatSignedScore,
  sortTopicBeliefs,
  type SortDir,
  type TopicBeliefRow,
  type TopicSortKey,
} from '@/features/topics/lib/dimensions'
import { getStrengthBand, formatStrength } from '@/core/scoring/claim-strength'
import { getGroundingBand } from '@/core/scoring/grounding'

interface TopicPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string; dir?: string }>
}

const MASTER_SORT_KEYS: TopicSortKey[] = ['abstraction', 'magnitude', 'direction', 'score', 'grounding']

function parseSortKey(raw: string | undefined): TopicSortKey {
  return MASTER_SORT_KEYS.includes(raw as TopicSortKey) ? (raw as TopicSortKey) : 'score'
}

function StatementLink({ belief }: { belief: TopicBeliefRow }) {
  return (
    <Link href={`/beliefs/${belief.slug}`} className="text-[var(--accent)] hover:underline">
      &ldquo;{belief.statement}&rdquo;
    </Link>
  )
}

function ScoreCell({ belief }: { belief: TopicBeliefRow }) {
  return (
    <span className={`font-bold ${belief.positivity >= 0 ? 'text-green-700' : 'text-red-700'}`}>
      {formatSignedScore(belief.positivity)}
    </span>
  )
}

export default async function TopicPage({ params, searchParams }: TopicPageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const topic = await fetchTopicBySlug(decodeURIComponent(slug))
  if (!topic) notFound()

  const masterSort = parseSortKey(sp.sort)
  const masterDir: SortDir | undefined =
    sp.dir === 'asc' || sp.dir === 'desc' ? sp.dir : undefined

  const byDirection = sortTopicBeliefs(topic.beliefs, 'direction')
  const byMagnitude = sortTopicBeliefs(topic.beliefs, 'magnitude')
  const byAbstraction = sortTopicBeliefs(topic.beliefs, 'abstraction')
  const masterRows = sortTopicBeliefs(topic.beliefs, masterSort, masterDir)

  // |positivity| rather than the signed value: on a negative-direction topic
  // the strongest-supported claim is the most negative one.
  const boldestNotBest =
    byMagnitude.length > 1 &&
    Math.abs(byMagnitude[byMagnitude.length - 1].positivity) <
      Math.max(...topic.beliefs.map(b => Math.abs(b.positivity)))

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <Link href="/topics" className="text-sm text-[var(--accent)] hover:underline">Topics</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-sm text-[var(--muted-foreground)] truncate max-w-[300px]">{topic.title}</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">{topic.title}</h1>
          {topic.question && (
            <p className="text-base text-[var(--foreground)] mb-2">{topic.question}</p>
          )}
          {topic.description && (
            <p className="text-sm text-[var(--muted-foreground)] mb-3">{topic.description}</p>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {topic.parents.length > 0 && (
              <span>
                <span className="text-[var(--muted-foreground)]">Parent topics:</span>{' '}
                {topic.parents.map((p, i) => (
                  <span key={p.slug}>
                    {i > 0 && '; '}
                    <Link href={`/topics/${p.slug}`} className="text-[var(--accent)] hover:underline">
                      {p.title}
                    </Link>
                  </span>
                ))}
              </span>
            )}
            {topic.children.length > 0 && (
              <span>
                <span className="text-[var(--muted-foreground)]">Subtopics:</span>{' '}
                {topic.children.map((c, i) => (
                  <span key={c.slug}>
                    {i > 0 && '; '}
                    <Link href={`/topics/${c.slug}`} className="text-[var(--accent)] hover:underline">
                      {c.title}
                    </Link>
                  </span>
                ))}
              </span>
            )}
            {topic.debateTopicSlug && (
              <Link
                href={`/debate-topics/${topic.debateTopicSlug}`}
                className="text-[var(--accent)] hover:underline"
              >
                Full topic-template analysis →
              </Link>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-3">
            One page for this topic: every belief below is a coordinate on three dimensions —{' '}
            <strong>direction</strong> (negative ↔ positive), <strong>magnitude</strong> (weak ↔
            extreme phrasing), and <strong>abstraction</strong> (general ↔ specific). Scores are
            engine-computed from the arguments and evidence on each belief&apos;s own page; when a
            number looks wrong, the fix is a better argument, not an edit.
          </p>
        </header>

        {topic.beliefs.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            <p className="text-lg mb-2">No beliefs are mapped to this topic yet.</p>
            <p className="text-sm">
              Browse <Link href="/beliefs" className="text-[var(--accent)] hover:underline">all beliefs</Link>{' '}
              or a <Link href="/topics" className="text-[var(--accent)] hover:underline">different topic</Link>.
            </p>
          </div>
        ) : (
          <>
            {/* Dimension 1: Direction */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
                Direction: Negative → Positive
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-3">
                The full spectrum of positions in one view, sorted from most negative to most
                positive — nuance instead of a binary pro/con.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border-b text-left font-semibold">Position</th>
                      <th className="px-4 py-2 border-b text-left font-semibold">Belief</th>
                      <th className="px-4 py-2 border-b text-center font-semibold">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byDirection.map(belief => {
                      const band = getDirectionBand(belief.positivity)
                      return (
                        <tr key={belief.id} className="hover:bg-gray-50">
                          <td className={`px-4 py-2 border-b font-medium whitespace-nowrap ${band.className}`}>
                            {band.label}
                          </td>
                          <td className="px-4 py-2 border-b"><StatementLink belief={belief} /></td>
                          <td className="px-4 py-2 border-b text-center"><ScoreCell belief={belief} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Dimension 2: Claim Magnitude */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
                Claim Magnitude: Weak → Extreme
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-3">
                The same topic, sorted by how bold the phrasing is — from hedged to maximal.
                Magnitude measures a claim&apos;s structural reach, not how well-supported it is;
                bolder claims need stronger evidence to earn the same score (see{' '}
                <Link href="/algorithms/strong-to-weak" className="text-[var(--accent)] hover:underline">
                  the strong-to-weak spectrum
                </Link>
                ).
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border-b text-left font-semibold">Belief</th>
                      <th className="px-4 py-2 border-b text-left font-semibold">Magnitude</th>
                      <th className="px-4 py-2 border-b text-center font-semibold">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byMagnitude.map(belief => {
                      const band = getStrengthBand(belief.claimStrength)
                      return (
                        <tr key={belief.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 border-b"><StatementLink belief={belief} /></td>
                          <td className="px-4 py-2 border-b whitespace-nowrap">
                            <span
                              className="px-1.5 py-0.5 rounded border border-gray-300 font-mono text-xs"
                              style={{ backgroundColor: band.hexColor }}
                            >
                              {band.label} ({formatStrength(belief.claimStrength)})
                            </span>
                          </td>
                          <td className="px-4 py-2 border-b text-center"><ScoreCell belief={belief} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {boldestNotBest && (
                <p className="text-xs italic text-[var(--muted-foreground)] mt-2">
                  Notice the boldest claim doesn&apos;t have the highest score: bold claims require
                  stronger evidence.
                </p>
              )}
            </section>

            {/* Dimension 3: Abstraction */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
                Abstraction: General → Specific
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-3">
                Navigate up to the broader principle or down to concrete implementations. A belief
                only merges with another at the same level, so evidence for a specific case never
                double-counts as proof of the general rule.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border-b text-left font-semibold">Level</th>
                      <th className="px-4 py-2 border-b text-left font-semibold">Belief</th>
                      <th className="px-4 py-2 border-b text-center font-semibold">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byAbstraction.map((belief, index) => (
                      <tr key={belief.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b whitespace-nowrap">
                          {index > 0 && <span aria-hidden="true">↓ </span>}
                          {getAbstractionLabel(belief.specificity)}
                        </td>
                        <td className="px-4 py-2 border-b"><StatementLink belief={belief} /></td>
                        <td className="px-4 py-2 border-b text-center"><ScoreCell belief={belief} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Combined navigation */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
                Combined View: All Dimensions
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-3">
                Every belief on this page with all three coordinates side by side. Re-sort by any
                dimension, by the engine-computed score, or by{' '}
                <Link href="/algorithms/evidence-scores" className="text-[var(--accent)] hover:underline">
                  evidence grounding
                </Link>{' '}
                so the best-supported version of the claim rises to the top.
              </p>
              <form method="get" className="flex flex-wrap items-end gap-3 mb-3 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Sort by</span>
                  <select name="sort" defaultValue={masterSort} className="border border-gray-300 rounded px-2 py-1 bg-white">
                    <option value="score">Score (best-supported first)</option>
                    <option value="grounding">Evidence grounding</option>
                    <option value="direction">Direction (negative → positive)</option>
                    <option value="magnitude">Magnitude (weak → extreme)</option>
                    <option value="abstraction">Abstraction (general → specific)</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Direction</span>
                  <select name="dir" defaultValue={masterDir ?? ''} className="border border-gray-300 rounded px-2 py-1 bg-white">
                    <option value="">Natural</option>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </label>
                <button
                  type="submit"
                  className="bg-[var(--accent)] text-white font-medium px-3 py-1.5 rounded hover:opacity-90"
                >
                  Apply
                </button>
              </form>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border-b text-left font-semibold">Abstraction</th>
                      <th className="px-4 py-2 border-b text-left font-semibold">Magnitude</th>
                      <th className="px-4 py-2 border-b text-left font-semibold">Direction</th>
                      <th className="px-4 py-2 border-b text-left font-semibold">Statement</th>
                      <th className="px-4 py-2 border-b text-center font-semibold">Score</th>
                      <th className="px-4 py-2 border-b text-center font-semibold">Grounding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterRows.map(belief => {
                      const direction = getDirectionBand(belief.positivity)
                      const strength = getStrengthBand(belief.claimStrength)
                      const grounding = getGroundingBand(belief.groundingScore)
                      return (
                        <tr key={belief.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 border-b whitespace-nowrap">
                            {getAbstractionLabel(belief.specificity)}
                          </td>
                          <td className="px-4 py-2 border-b whitespace-nowrap">{strength.label}</td>
                          <td className={`px-4 py-2 border-b whitespace-nowrap ${direction.className}`}>
                            {direction.label}
                          </td>
                          <td className="px-4 py-2 border-b"><StatementLink belief={belief} /></td>
                          <td className="px-4 py-2 border-b text-center"><ScoreCell belief={belief} /></td>
                          <td className="px-4 py-2 border-b text-center whitespace-nowrap">
                            <span
                              className="px-1.5 py-0.5 rounded border border-gray-300 font-mono text-xs"
                              style={{ backgroundColor: grounding.hexColor }}
                              title={grounding.descriptor}
                            >
                              {grounding.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Duplication grouping */}
            {topic.similarPairs.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">Grouped Duplicates</h2>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  The equivalency engine flags beliefs on this page that make the same underlying
                  claim in different words, so pros and cons attach once instead of repeating (see{' '}
                  <Link href="/algorithms/belief-equivalency" className="text-[var(--accent)] hover:underline">
                    belief equivalency
                  </Link>
                  ).
                </p>
                <ul className="space-y-2 text-sm">
                  {topic.similarPairs.map(pair => (
                    <li
                      key={`${pair.fromSlug}:${pair.toSlug}`}
                      className="border border-gray-200 rounded p-3 bg-gray-50"
                    >
                      <Link href={`/beliefs/${pair.fromSlug}`} className="text-[var(--accent)] hover:underline">
                        &ldquo;{pair.fromStatement}&rdquo;
                      </Link>{' '}
                      <span className="text-[var(--muted-foreground)]">≈</span>{' '}
                      <Link href={`/beliefs/${pair.toSlug}`} className="text-[var(--accent)] hover:underline">
                        &ldquo;{pair.toStatement}&rdquo;
                      </Link>{' '}
                      <span className="text-xs text-[var(--muted-foreground)]">
                        (equivalency {Math.round(pair.equivalencyScore * 100)}%)
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
