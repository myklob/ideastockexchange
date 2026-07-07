import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Uniqueness Scores — Idea Stock Exchange',
  description:
    'How the Idea Stock Exchange discounts restatements: uniqueness = 1 − max similarity to earlier same-side arguments, multiplied into every impact.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms</Link>
      {' > '}
      <strong>Uniqueness Scores</strong>
    </p>
  )
}

export default function UniqueScoresPage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">Uniqueness Scores</h1>
      <p className="text-lg text-gray-600 mb-6">
        How much new signal does this argument add versus the ones already on the page?
        Nobody wins by making one point five different ways.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The problem uniqueness solves</h2>
      <p className="mb-4">
        A bare sum of argument weights rewards repetition: state the same point five ways and a
        naive tally counts it five times. Uniqueness closes that exploit. Each argument&apos;s
        contribution is multiplied by how much it adds beyond the same-side arguments that were
        there first — a ninety percent restatement contributes about ten percent of its weight.
      </p>

      <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-mono my-4 rounded">
        uniqueness = 1 &minus; max(similarity to each <em>earlier</em> same-side argument)
      </div>
      <p className="mb-4">
        The maximum, not the average: one near-identical prior argument is enough to mark a new
        one as redundant. The <strong>earliest</strong> statement of a point keeps full credit
        (uniqueness 1.0); later restatements are discounted. Ordering by arrival keeps the rule
        stable — posting a duplicate never damages the original.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Where it enters the score</h2>
      <p className="mb-4">
        Uniqueness multiplies into every argument&apos;s impact at scoring time, alongside truth,{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">linkage</Link>, and{' '}
        <Link href="/algorithms/importance-score" className="text-blue-700 hover:underline">importance</Link>:
      </p>
      <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-mono my-4 rounded">
        impact = sign &times; truth &times; |linkage| &times; importance &times; uniqueness &times; 100
      </div>
      <p className="mb-4">
        Every impact value on a belief page links to its provenance page, which shows this
        argument&apos;s uniqueness trace: exactly which earlier same-side arguments it overlaps
        and by how much. The number is engine output — challenge it by showing the overlap is
        wrong, not by asking nicely.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">How similarity is measured</h2>
      <p className="mb-2">Three layers, blended as they become available:</p>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <strong>Mechanical (live today):</strong> normalized token overlap — synonym groups
          collapse (&ldquo;decrease&rdquo; = &ldquo;reduce&rdquo;), stopwords drop, negated
          antonyms fold in, then a Jaccard similarity over what remains. Near-verbatim
          restatements short-circuit to full similarity.
        </li>
        <li>
          <strong>Semantic embeddings (input slot):</strong> the blend accepts an
          embedding-based layer as it lands, weighted above the mechanical layer.
        </li>
        <li>
          <strong>Community equivalence (input slot):</strong> &ldquo;are these the same
          point?&rdquo; is itself debatable — equivalence sub-debates feed the third layer.
        </li>
      </ul>
      <p className="mb-4">
        The belief-level readout of the same idea is the{' '}
        <Link href="/algorithms/topic-overlap" className="text-blue-700 hover:underline">
          topic overlap score
        </Link>{' '}
        — the page-wide average of per-argument uniqueness — and duplicate{' '}
        <em>beliefs</em> (rather than arguments) are handled by{' '}
        <Link href="/algorithms/belief-equivalency" className="text-blue-700 hover:underline">
          belief equivalency
        </Link>
        .
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The novelty premium</h2>
      <p className="mb-4">
        A genuinely new point (uniqueness &ge; 0.5) can carry a small, decaying early bonus —
        peaking at 1.25&times; and fading over about a day — so surfacing a fresh consideration
        is worth slightly more than the thousandth confirmation of an old one. The premium never
        drops a score below its base; it only rewards novelty, never punishes age.
      </p>

      <p className="mt-8 text-sm text-gray-600">
        Related: <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">ReasonRank</Link> ·{' '}
        <Link href="/algorithms/topic-overlap" className="text-blue-700 hover:underline">Topic Overlap</Link> ·{' '}
        <Link href="/algorithms/combine-similar-beliefs" className="text-blue-700 hover:underline">Combining Similar Beliefs</Link>
      </p>
    </div>
  )
}
