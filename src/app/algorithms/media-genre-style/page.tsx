import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Media Genre & Style Scores — Idea Stock Exchange',
  description:
    'Media Genre and Style Scores classify cited sources into eight canonical genres — peer-reviewed at the top, social media at the bottom — and assign a reliability weight that parallels the Evidence T1–T4 tiers.',
}

const genres = [
  {
    type: 'peer_reviewed',
    tier: 'T1',
    weight: 1.00,
    color: '#16a34a',
    description:
      'Academic peer-reviewed source — high methodological standards, independent scrutiny.',
    examples: 'Cochrane reviews, journal articles, systematic reviews, meta-analyses.',
  },
  {
    type: 'institutional',
    tier: 'T1',
    weight: 1.00,
    color: '#16a34a',
    description:
      'Official institutional report — authoritative, but may reflect institutional bias.',
    examples: 'BLS releases, IPCC reports, regulatory filings, central-bank publications.',
  },
  {
    type: 'investigative',
    tier: 'T2',
    weight: 0.75,
    color: '#65a30d',
    description:
      'Investigative journalism — fact-checked, sourced reporting with editorial oversight.',
    examples: 'ProPublica, Reuters investigations, long-form magazine reporting.',
  },
  {
    type: 'news_report',
    tier: 'T2',
    weight: 0.75,
    color: '#65a30d',
    description:
      'Standard news report — subject to editorial standards, but constrained by news cycle.',
    examples: 'Wire-service stories, daily newspaper reporting.',
  },
  {
    type: 'editorial',
    tier: 'T3',
    weight: 0.50,
    color: '#ca8a04',
    description:
      'Editorial or house opinion — represents a specific viewpoint, not neutral reporting.',
    examples: 'Newspaper editorial board pieces, journal house views.',
  },
  {
    type: 'opinion',
    tier: 'T4',
    weight: 0.25,
    color: '#dc2626',
    description:
      'Opinion or commentary — reflects the author’s perspective, not verified analysis.',
    examples: 'Op-eds, columns, podcasts, blog posts.',
  },
  {
    type: 'social_media',
    tier: 'T4',
    weight: 0.25,
    color: '#dc2626',
    description:
      'Social media post — no editorial filter, highly susceptible to misinformation.',
    examples: 'Tweets, threads, LinkedIn posts, Substack notes.',
  },
  {
    type: 'unknown',
    tier: 'T3',
    weight: 0.50,
    color: '#9ca3af',
    description:
      'Source genre unclassified — treat with standard caution.',
    examples: 'Unattributed snippets, sources whose nature has not yet been verified.',
  },
]

const inference = [
  ['book', 'investigative'],
  ['article', 'news_report'],
  ['academic', 'peer_reviewed'],
  ['journal', 'peer_reviewed'],
  ['paper', 'peer_reviewed'],
  ['report', 'institutional'],
  ['podcast', 'opinion'],
  ['video', 'opinion'],
  ['documentary', 'investigative'],
  ['tweet', 'social_media'],
  ['post', 'social_media'],
  ['blog', 'opinion'],
  ['editorial', 'editorial'],
  ['opinion', 'opinion'],
  ['news', 'news_report'],
  ['song', 'opinion'],
  ['movie', 'opinion'],
]

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>Media Genre &amp; Style</strong>
    </p>
  )
}

export default function MediaGenreStylePage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Media Genre &amp; Style Scores: Reliability by Source Format
      </h1>

      <p className="mb-3 text-[1.05rem]">
        A peer-reviewed paper and a tweet making the same claim should not carry the same
        weight in an evidence base, even when both are technically &ldquo;a source&rdquo;. The
        Media Genre &amp; Style Score is the platform&apos;s standardized way of saying that
        out loud, with a number attached. Every cited media source is mapped to one of eight
        canonical genres, and each genre carries a reliability weight that parallels the
        Evidence T1&ndash;T4 tier system.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Eight Genres</h2>

      <div className="space-y-3 mb-6">
        {genres.map((g) => (
          <div
            key={g.type}
            className="border border-gray-200 rounded p-3"
            style={{ borderLeftWidth: 4, borderLeftColor: g.color }}
          >
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <span className="font-mono font-semibold">{g.type}</span>
              <span
                className="text-xs px-2 py-0.5 rounded text-white font-bold"
                style={{ backgroundColor: g.color }}
              >
                {g.tier} &middot; weight {g.weight.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-1">{g.description}</p>
            <p className="text-xs text-gray-500 italic">Examples: {g.examples}</p>
          </div>
        ))}
      </div>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Why These Boundaries</h2>

      <p className="mb-3">
        The two top tiers (peer_reviewed, institutional) earn full weight not because their
        publishers are politically neutral &mdash; many are not &mdash; but because the
        process behind publication imposes filters that the lower tiers lack. Peer review,
        statistical assessment, and revision-against-criticism are mechanisms that reduce the
        rate at which obviously-wrong claims reach print. Institutional reports go through
        agency review and legal vetting. Both are imperfect, both can be biased, but both put
        more between an author&apos;s first draft and the published claim than any other genre.
      </p>

      <p className="mb-3">
        The middle tier (investigative, news_report) earns 0.75 because editorial oversight,
        sourcing requirements, and corrections processes provide a real, but weaker, filter.
        Wire-service stories that go through a copy desk and a fact-checker are not the same
        epistemic object as a thread of replies typed live.
      </p>

      <p className="mb-4">
        The bottom tiers (editorial, opinion, social_media) score lower because the format
        itself is designed to skip those filters. An op-ed exists to express the author&apos;s
        view; a tweet exists to be sent immediately. Skip the filter, lose the weight. Nothing
        prevents a tweet from being correct; the tier just means the format does not, by
        itself, evidence its correctness.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Genre Inference From Legacy Media Type</h2>

      <p className="mb-3">
        Existing belief data sometimes carries only a coarse media-type string (&ldquo;book&rdquo;,
        &ldquo;article&rdquo;, &ldquo;podcast&rdquo;) without an explicit genre. The system
        infers a genre from the type using the table below before computing scores. Editors can
        always override the inferred genre when a specific source needs a more nuanced
        classification.
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">mediaType</th>
              <th className="border border-gray-300 px-3 py-2 text-left">inferred genre</th>
            </tr>
          </thead>
          <tbody>
            {inference.map(([mt, genre]) => (
              <tr key={mt}>
                <td className="border border-gray-300 px-3 py-2 font-mono">{mt}</td>
                <td className="border border-gray-300 px-3 py-2 font-mono">{genre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-600 italic mb-4">
        Anything not in the table maps to <code className="bg-gray-100 px-1 rounded">unknown</code>
        , which carries a tier-3 default weight of 0.50. This is deliberately neither punitive
        nor charitable &mdash; it just refuses to opine until a human classifies the source.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Genre vs. Tier vs. Truth</h2>

      <p className="mb-3">
        Three related but distinct things are computed from a media source:
      </p>

      <ul className="list-disc list-outside ml-6 mb-4 space-y-2">
        <li>
          <strong>Reliability tier (T1&ndash;T4).</strong> The bucket. Drives the source&apos;s
          weight in the EVS formula and in evidence aggregation.
        </li>
        <li>
          <strong>Genre score (0&ndash;1).</strong> The numeric weight derived from the tier.
          Used to weight per-source contributions.
        </li>
        <li>
          <strong>Media Truth Score (0&ndash;1).</strong> The base score for the genre, minus
          per-source deductions for editorializing, sensationalism, and misleading framing.
          See{' '}
          <Link href="/algorithms/media-truth" className="text-blue-700 hover:underline">
            Media Truth Scores
          </Link>
          .
        </li>
      </ul>

      <p className="mb-4">
        Tier and genre score depend only on the format. Media Truth depends on the actual
        execution of the article. A peer-reviewed paper that engages in misleading framing can
        still drop in Media Truth even though its tier remains T1. Editors should think about
        these as orthogonal axes.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Developer Reference</h2>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Source</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`import {
  calculateMediaScores,
  inferGenreFromMediaType,
  type MediaGenreType,
} from '@/core/scoring'

const genre: MediaGenreType = inferGenreFromMediaType('book') // 'investigative'
const result = calculateMediaScores(genre)
// → { truthScore, genreScore, genreType, reliabilityTier, genreDescription }`}
        </pre>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Implementation:{' '}
        <code className="bg-gray-100 px-1 rounded">
          src/core/scoring/all-scores.ts → calculateMediaScores, inferGenreFromMediaType
        </code>
        . Genre constants live in <code className="bg-gray-100 px-1 rounded">
          GENRE_RELIABILITY_SCORES
        </code>{' '}
        and <code className="bg-gray-100 px-1 rounded">GENRE_TO_TIER</code> in the same file.
      </p>

      <hr className="my-6 border-gray-300" />

      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/media-truth" className="text-blue-700 hover:underline">
              Media Truth Scores
            </Link>{' '}
            &mdash; the per-source flags that adjust the base genre score
          </li>
          <li>
            <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
              Evidence Scores
            </Link>{' '}
            &mdash; the parallel T1&ndash;T4 tier system applied to evidence broadly
          </li>
          <li>
            <Link href="/algorithms/verification" className="text-blue-700 hover:underline">
              Verification
            </Link>{' '}
            &mdash; where genre-weighted media contributions land in the truth score
          </li>
          <li>
            <Link href="/algorithms" className="text-blue-700 hover:underline">
              Full Algorithms index
            </Link>
          </li>
        </ul>
      </div>
    </main>
  )
}
