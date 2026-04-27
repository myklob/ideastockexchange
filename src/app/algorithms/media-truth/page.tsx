import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Media Truth Scores — Idea Stock Exchange',
  description:
    'Media Truth Scores flag editorializing, sensationalism, and misleading framing in cited sources — even when the underlying facts are technically accurate. Computed from genre and three independent style flags.',
}

const flags = [
  {
    label: 'Editorializing',
    description:
      'Inserts the author’s opinion as fact. Look for unattributed value-laden adjectives ("disastrous", "vital", "shameful") in what is presented as a news report.',
    penalty: '0.10–0.30',
  },
  {
    label: 'Sensationalism',
    description:
      'Pumps drama disproportionate to the underlying claim. Headlines that promise more than the body delivers; selective use of the most extreme single data point as if it were typical.',
    penalty: '0.10–0.30',
  },
  {
    label: 'Misleading framing',
    description:
      'Technically accurate facts arranged to imply a conclusion the data do not support. Selectively missing context, manipulated timelines, or charts whose axis tricks distort proportion.',
    penalty: '0.15–0.40',
  },
]

const baseScores = [
  { genre: 'peer_reviewed', score: 0.90 },
  { genre: 'institutional',  score: 0.80 },
  { genre: 'investigative',  score: 0.70 },
  { genre: 'news_report',    score: 0.60 },
  { genre: 'editorial',      score: 0.40 },
  { genre: 'opinion',        score: 0.30 },
  { genre: 'social_media',   score: 0.15 },
  { genre: 'unknown',        score: 0.50 },
]

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>Media Truth Scores</strong>
    </p>
  )
}

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-mono text-base my-4 rounded text-center">
      {children}
    </div>
  )
}

export default function MediaTruthPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Media Truth Scores: When the Facts Are Right but the Framing Is Off
      </h1>

      <p className="mb-3 text-[1.05rem]">
        A source can be technically accurate and still actively misleading. Selective omission,
        loaded language, and disproportionate framing all produce articles whose individual
        claims survive fact-checking but whose net effect is to mislead a reasonable reader.
        Media Truth Scores quantify that gap. They sit alongside &mdash; not inside &mdash; the{' '}
        <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
          Evidence Score
        </Link>
        , because they measure something different: not whether the source said something true,
        but whether the way it said it deserves to be trusted.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Formula</h2>

      <FormulaBox>
        mediaTruth = baseGenreScore &minus; Σ flagPenalties
      </FormulaBox>

      <p className="mb-3">
        Every source starts at the base score for its{' '}
        <Link href="/algorithms/media-genre-style" className="text-blue-700 hover:underline">
          genre
        </Link>{' '}
        &mdash; a peer-reviewed paper begins at 0.90, an op-ed at 0.30. From there, three
        independent style flags subtract penalties when triggered. The result is clamped to
        [0, 1] before display.
      </p>

      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Genre</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Base score</th>
            </tr>
          </thead>
          <tbody>
            {baseScores.map((row) => (
              <tr key={row.genre}>
                <td className="border border-gray-300 px-3 py-2 font-mono">{row.genre}</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                  {row.score.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Three Flags</h2>

      <div className="space-y-3 mb-6">
        {flags.map((f) => (
          <div key={f.label} className="border border-gray-200 rounded p-3 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-bold text-sm">{f.label}</span>
              <span className="text-sm font-mono text-gray-500">penalty: {f.penalty}</span>
            </div>
            <p className="text-sm text-gray-700">{f.description}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-600 italic mb-4">
        Penalties are applied independently and stack additively. A piece flagged for both
        sensationalism (0.20) and misleading framing (0.30) loses 0.50 from its base score. A
        T2 news report (base 0.60) so flagged drops to 0.10 &mdash; a plausible reflection of
        how much trust survives that combination.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Why the Three Flags Are Separate</h2>

      <p className="mb-3">
        Editorializing, sensationalism, and misleading framing are genuinely different
        failures. A neutral, calm, but selectively framed article scores worst on framing alone.
        A blistering, opinionated piece that nonetheless presents the data in proportion scores
        worst on editorializing alone. Many sources are flagged on one axis and clean on the
        others. Collapsing the three into one number would lose information that editors and
        readers find useful when assessing why a source dropped in score.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">How Aggregate Media Truth Is Computed</h2>

      <p className="mb-3">
        For a belief page that cites multiple media sources, the page-level Media Truth Score
        is the genre-weighted average of the individual sources&apos; scores:
      </p>

      <FormulaBox>
        avgTruthScore = Σ (truthScore × genreScore) / Σ genreScore
      </FormulaBox>

      <p className="mb-4">
        Higher-tier sources count more. A T1 peer-reviewed paper with a clean 0.90 truth score
        anchors the aggregate above what a stack of T4 social-media posts can pull it down to.
        The weighting prevents the gaming pattern of citing one rigorous source plus many
        opinion-tier sources to inflate apparent breadth.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">What This Catches That Evidence Scores Miss</h2>

      <p className="mb-4">
        An EVS is computed from tier, replication, relevance, and consistency &mdash; structural
        properties that say nothing about how the source <em>presented</em> the claim. A
        peer-reviewed study cited via a tabloid summary that distorts its conclusion can carry
        a high EVS while the actual reader sees a misleading framing. Media Truth Scores live on
        that summary, not the underlying study, and downgrade the citation accordingly. The two
        metrics together evaluate &ldquo;is this source good?&rdquo; from both the methodological
        and the rhetorical angle.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Developer Reference</h2>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Source</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`import { calculateMediaScores, aggregateMediaScores } from '@/core/scoring'

const item = calculateMediaScores('news_report')
// → { truthScore: 0.60, genreScore: 0.75, reliabilityTier: 'T2', ... }

const agg = aggregateMediaScores(belief.mediaResources)
// → { avgTruthScore, avgGenreScore }`}
        </pre>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Implementation:{' '}
        <code className="bg-gray-100 px-1 rounded">
          src/core/scoring/all-scores.ts → calculateMediaScores, aggregateMediaScores
        </code>
        . Base scores are stored in{' '}
        <code className="bg-gray-100 px-1 rounded">GENRE_BASE_TRUTH_SCORES</code>; the genre
        classifier in{' '}
        <code className="bg-gray-100 px-1 rounded">inferGenreFromMediaType</code> handles legacy
        media-type strings.
      </p>

      <hr className="my-6 border-gray-300" />

      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/media-genre-style" className="text-blue-700 hover:underline">
              Media Genre &amp; Style
            </Link>{' '}
            &mdash; the genre classifier that supplies the base score
          </li>
          <li>
            <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
              Evidence Scores
            </Link>{' '}
            &mdash; the methodological complement to the rhetorical Media Truth Score
          </li>
          <li>
            <Link href="/algorithms/verification" className="text-blue-700 hover:underline">
              Verification
            </Link>{' '}
            &mdash; how media-weighted evidence rolls up into the page truth score
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
