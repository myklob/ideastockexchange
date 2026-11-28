import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Topic Overlap — Idea Stock Exchange',
  description:
    'The belief-level uniqueness readout: how little a page&apos;s arguments restate each other.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms</Link>
      {' > '}
      <strong>Topic Overlap</strong>
    </p>
  )
}

export default function TopicOverlapPage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">Topic Overlap</h1>
      <p className="text-lg text-gray-600 mb-6">
        The page-level uniqueness readout — dimension 10 of the twelve. It answers: is this
        belief accumulating independent support, or restating one point?
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">What it computes</h2>
      <p className="mb-4">
        For each argument on the page, take its uniqueness — 1 minus its highest similarity to
        any other argument text on the page — then average across the page. A score near 1
        means the arguments are genuinely distinct considerations; a score near 0.5 or below
        diagnoses a page whose apparent weight is mostly one point wearing several costumes.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Three scales of the same idea</h2>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <strong>Per-argument:</strong>{' '}
          <Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">
            uniqueness scores
          </Link>{' '}
          discount each restatement&apos;s impact at scoring time — this is what stops
          repetition from adding weight.
        </li>
        <li>
          <strong>Per-page:</strong> topic overlap (this page) reports the diagnostic average on
          the belief&apos;s Scorecard.
        </li>
        <li>
          <strong>Across pages:</strong>{' '}
          <Link href="/algorithms/belief-equivalency" className="text-blue-700 hover:underline">
            belief equivalency
          </Link>{' '}
          catches whole duplicate beliefs, so &ldquo;one page per topic&rdquo; stays true —
          see{' '}
          <Link href="/algorithms/combine-similar-beliefs" className="text-blue-700 hover:underline">
            combining similar beliefs
          </Link>
          .
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-2">Reading a low score</h2>
      <p className="mb-4">
        A low topic overlap score is not a verdict against the belief — it is a to-do list.
        The page needs consolidation (merge the restatements, keep the earliest) or genuinely
        new considerations. Because per-argument uniqueness already discounts the duplicates,
        the belief&apos;s net is protected either way; the readout just tells editors where the
        redundancy lives.
      </p>

      <p className="mt-8 text-sm text-gray-600">
        Related: <Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">Uniqueness Scores</Link> ·{' '}
        <Link href="/algorithms/belief-equivalency" className="text-blue-700 hover:underline">Belief Equivalency</Link> ·{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">ReasonRank</Link>
      </p>
    </div>
  )
}
