import Link from 'next/link'
import type { Metadata } from 'next'
import { fetchCorpusLeverage } from '@/features/belief-analysis/lib/leverage'
import {
  GAP_LABELS,
  LEVERAGE_CLASSES,
  FRAGILE_CONCENTRATION,
} from '@/core/scoring/decision-leverage'

export const metadata: Metadata = {
  title: 'The Work Queue — Idea Stock Exchange',
  description:
    'Every unsettled argument in the corpus, ranked by the points of conclusion score riding on it. Where the next hour of contribution actually changes an answer.',
}

/** The queue is a queue: past this many rows nobody is reading it as one. */
const QUESTION_LIMIT = 25
const BELIEF_LIMIT = 15

const container = 'max-w-[1100px] mx-auto px-4 py-8 leading-7 text-[#333]'
const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

const CLASS_STYLES: Record<string, string> = {
  crux: 'bg-red-50 text-red-800',
  'load-bearing': 'bg-green-50 text-green-800',
  'open-minor': 'bg-yellow-50 text-yellow-800',
  'settled-minor': 'bg-gray-100 text-gray-600',
}

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <strong>Work Queue</strong>
    </p>
  )
}

export default async function WorkQueuePage() {
  const corpus = await fetchCorpusLeverage()
  const questions = corpus.openQuestions.slice(0, QUESTION_LIMIT)
  const beliefs = corpus.beliefs.slice(0, BELIEF_LIMIT)
  const hiddenQuestions = corpus.openQuestions.length - questions.length

  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">The Work Queue</h1>
      <p className="text-lg text-gray-600 mb-6">
        Every unsettled argument in the corpus, ranked by how much conclusion score is riding on
        it. The top row is where one hour of work changes an answer.
      </p>

      {corpus.beliefsConsidered === 0 ? (
        <p className="mb-4">
          No belief in the corpus has a published argument tree yet, so there is nothing to rank.
          Start one from the{' '}
          <Link href="/beliefs" className="text-blue-700 hover:underline">belief index</Link>.
        </p>
      ) : (
        <>
          <p className="mb-4">
            Across <strong>{corpus.beliefsConsidered}</strong>{' '}
            {corpus.beliefsConsidered === 1 ? 'belief' : 'beliefs'} with argument trees,{' '}
            <strong>{corpus.totalAtStake.toFixed(1)} points</strong> of conclusion score are still
            unsettled, spread over <strong>{corpus.openQuestions.length}</strong> open{' '}
            {corpus.openQuestions.length === 1 ? 'edge' : 'edges'}. Each number is{' '}
            <Link href="/algorithms/decision-leverage" className="text-blue-700 hover:underline">
              Decision Leverage
            </Link>
            : how much of a change in that argument reaches its conclusion, times how much about
            the argument is still open.
          </p>

          {corpus.fragileBeliefs.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-300 px-4 py-3 my-5 rounded text-sm">
              <strong>
                {corpus.fragileBeliefs.length}{' '}
                {corpus.fragileBeliefs.length === 1 ? 'belief rests' : 'beliefs rest'} on a single
                unresolved argument
              </strong>{' '}
              (more than {Math.round(FRAGILE_CONCENTRATION * 100)}% of what is unsettled sits on
              one edge). Read {corpus.fragileBeliefs.length === 1 ? 'its' : 'their'} score as
              provisional however confident the number looks:{' '}
              {corpus.fragileBeliefs.map((b, i) => (
                <span key={b.belief.id}>
                  {i > 0 && ', '}
                  <Link
                    href={`/beliefs/${b.belief.slug}`}
                    className="text-blue-700 hover:underline"
                  >
                    {b.belief.statement}
                  </Link>
                </span>
              ))}
              .
            </div>
          )}

          <h2 className="text-xl font-bold mt-8 mb-2">Open questions, highest stakes first</h2>
          <p className="mb-3 text-sm text-gray-700">
            One row per unsettled argument edge. &ldquo;What would settle it&rdquo; names the widest
            gap and links the page where that gap closes — file a source, vote a linkage, argue the
            other side, or score the sub-debate.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className={TH}>Argument</th>
                  <th className={TH}>In this debate</th>
                  <th className={TH}>At stake</th>
                  <th className={TH}>What would settle it</th>
                  <th className={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <tr key={`${q.belief.id}-${q.id}`}>
                    <td className={TD}>
                      {q.childSlug ? (
                        <Link
                          href={`/beliefs/${q.childSlug}`}
                          className="text-[var(--accent)] hover:underline"
                        >
                          {q.label}
                        </Link>
                      ) : (
                        q.label
                      )}
                      <span className="ml-2 text-xs text-gray-500">
                        {q.side === 'agree' ? 'supports' : 'opposes'}
                      </span>
                    </td>
                    <td className={TD}>
                      <Link
                        href={`/beliefs/${q.belief.slug}`}
                        className="text-blue-700 hover:underline"
                      >
                        {q.belief.statement}
                      </Link>
                    </td>
                    <td className={`${TDC} font-mono font-semibold`}>{q.leverage.toFixed(1)}</td>
                    <td className={TD}>
                      {q.nextStepHref ? (
                        <Link href={q.nextStepHref} className="text-blue-700 hover:underline">
                          {GAP_LABELS[q.widestGap]}
                        </Link>
                      ) : (
                        GAP_LABELS[q.widestGap]
                      )}
                    </td>
                    <td className={TDC}>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${CLASS_STYLES[q.classification]}`}
                      >
                        {LEVERAGE_CLASSES[q.classification].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hiddenQuestions > 0 && (
            <p className="text-xs text-gray-600 mt-2">
              {hiddenQuestions} lower-stakes {hiddenQuestions === 1 ? 'edge' : 'edges'} not shown.
              The full ranking, thresholds included, is at{' '}
              <code className="bg-gray-100 px-1 rounded">/api/leverage</code>.
            </p>
          )}

          <h2 className="text-xl font-bold mt-10 mb-2">Beliefs by unsettled score</h2>
          <p className="mb-3 text-sm text-gray-700">
            The same numbers grouped by debate. <strong>Concentration</strong> is the share of a
            belief&apos;s unsettled score held by its single largest gap: high means one argument
            is carrying the verdict.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className={TH}>Belief</th>
                  <th className={TH}>Unsettled</th>
                  <th className={TH}>Cruxes</th>
                  <th className={TH}>Load-bearing</th>
                  <th className={TH}>Concentration</th>
                </tr>
              </thead>
              <tbody>
                {beliefs.map(b => (
                  <tr key={b.belief.id}>
                    <td className={TD}>
                      <Link
                        href={`/beliefs/${b.belief.slug}`}
                        className="text-blue-700 hover:underline"
                      >
                        {b.belief.statement}
                      </Link>
                    </td>
                    <td className={`${TDC} font-mono font-semibold`}>
                      {b.totalAtStake.toFixed(1)}
                    </td>
                    <td className={TDC}>{b.cruxes.length}</td>
                    <td className={TDC}>{b.loadBearing.length}</td>
                    <td className={`${TDC} font-mono`}>
                      {b.concentration >= FRAGILE_CONCENTRATION ? (
                        <span className="text-red-700">{b.concentration.toFixed(2)}</span>
                      ) : (
                        b.concentration.toFixed(2)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-bold mt-10 mb-2">How to read this</h2>
          <ul className="list-disc ml-6 mb-4 space-y-2 text-sm">
            <li>
              <strong>A high number is not a verdict on the argument.</strong> It means the
              conclusion could still move if this edge were settled, in either direction. Settling
              a crux often means demolishing it.
            </li>
            <li>
              <strong>Points are an upper bound, not a forecast.</strong> Leverage assumes the open
              part of a claim could resolve anywhere in its range.
            </li>
            <li>
              <strong>The queue only knows what has been filed.</strong> An argument with no
              evidence row scores as unevidenced whether or not the evidence exists in the world.
              That is the gap the queue exists to close.
            </li>
            <li>
              Nothing here is hand-ranked. Every number comes from the same engine that scores the
              belief pages, and all of it moves the moment a source, vote or counter-argument
              lands. Start anywhere on the{' '}
              <Link href="/contribute" className="text-blue-700 hover:underline">
                contribution ladder
              </Link>
              .
            </li>
          </ul>
        </>
      )}
    </div>
  )
}
