import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cost-Benefit Likelihood Scores — Idea Stock Exchange',
  description:
    'CBA Likelihood Scores compute the probability that a projected cost or benefit will actually occur as pro_total / (pro_total + con_total) over the argument trees beneath each line item. The output drives expected-value calculations.',
}

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>Cost-Benefit Likelihood</strong>
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

export default function CbaLikelihoodPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Cost-Benefit Likelihood Scores: Probability From Debate
      </h1>

      <p className="mb-3 text-[1.05rem]">
        Every line item in a Cost-Benefit Analysis carries a projected dollar impact &mdash; a
        figure for what would happen <em>if</em> that cost or benefit materialized. The
        Likelihood Score is the probability that it actually will. Crucially, the platform does
        not let a single analyst pick that probability. Instead it derives it from a structured
        pro-and-con debate beneath each line item, applying the same{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
          ReasonRank
        </Link>{' '}
        machinery used everywhere else.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Formula</h2>

      <FormulaBox>
        likelihood = pro_total / (pro_total + con_total)
      </FormulaBox>

      <p className="mb-3">
        Where each term is the sum of <code className="bg-gray-100 px-1 rounded">rawImpact</code>{' '}
        values from arguments on its side of the line item:
      </p>

      <FormulaBox>
        rawImpact = reasonRank &times; linkage &times; importance &times; uniqueness
      </FormulaBox>

      <p className="mb-4">
        Pro arguments make the case that the cost or benefit will occur as projected. Con
        arguments make the case that it will not, or that the magnitude is wrong. The active
        likelihood is the share of total argument weight on the pro side &mdash; a number
        between 0 and 1, exactly the shape an expected-value calculation requires.
      </p>

      <p className="mb-4 text-sm text-gray-600">
        With no arguments at all, the score defaults to 0.5. The platform refuses to assign
        confidence to a projection that has not been argued. Defaulting to 0.5 also means an
        unargued line item contributes only its midpoint expected value, which keeps unargued
        projections from dominating the CBA totals.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Multiple Competing Estimates</h2>

      <p className="mb-3">
        A well-developed line item often has multiple competing probability estimates &mdash;
        one analyst says 70% likely, another says 40%, a third says 25%. Each estimate has its
        own pro/con argument tree. The platform scores each tree independently and selects the
        estimate with the highest ReasonRank as the active probability.
      </p>

      <p className="mb-4">
        The status of the active estimate depends on the gap between it and the runner-up:
      </p>

      <ul className="list-disc list-outside ml-6 mb-4 space-y-1 text-sm">
        <li>
          <strong>Calibrated:</strong> Winner&apos;s ReasonRank is &gt; 0.20 above the next
          best, or there is a single estimate with &ge; 2 pro arguments.
        </li>
        <li>
          <strong>Contested:</strong> Two or more estimates with similar ReasonRank scores
          (gap &le; 0.20).
        </li>
        <li>
          <strong>Emerging:</strong> Insufficient argument depth to call calibrated or
          contested.
        </li>
      </ul>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Confidence Interval</h2>

      <p className="mb-3">
        The CBA also surfaces an estimate of the uncertainty around the active probability,
        derived from the standard deviation across competing estimates and the depth of their
        argument trees:
      </p>

      <FormulaBox>
        CI = stdDev(probabilities) &times; argFactor
      </FormulaBox>

      <p className="mb-4 text-sm text-gray-600">
        where{' '}
        <code className="bg-gray-100 px-1 rounded">argFactor = max(0.5, 1 − totalArgs × 0.03)</code>
        . More argument depth tightens the interval; pure disagreement among estimates widens
        it. With a single estimate, the interval is fixed at 0.15.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Expected Value Composition</h2>

      <p className="mb-3">
        The CBA total expected value is the sum across all line items of:
      </p>

      <FormulaBox>
        expectedValue<sub>i</sub> = predictedImpact<sub>i</sub> &times; activeLikelihood<sub>i</sub>
      </FormulaBox>

      <p className="mb-4">
        A line item projecting +$10M in benefit at 70% likelihood contributes +$7M in expected
        value. A line item projecting &minus;$3M in cost at 90% likelihood contributes
        &minus;$2.7M. The CBA totals roll up every line item this way, then surface the net.
        Likelihood is the lever that turns a stack of speculative projections into a defensible
        expected-value figure.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Why ReasonRank Specifically</h2>

      <p className="mb-3">
        Two simpler approaches were rejected:
      </p>

      <ul className="list-disc list-outside ml-6 mb-4 space-y-2">
        <li>
          <strong>Single-analyst probability.</strong> Asking one expert to commit a number
          is fast, but it inherits all of that expert&apos;s biases and gives the reader no
          structural way to challenge the figure. It also concentrates blame, which makes
          experts conservative or absent rather than calibrated.
        </li>
        <li>
          <strong>Vote-counting.</strong> Counting the number of pro and con statements ignores
          the quality of the arguments behind them. Five rigorous pro arguments outweigh fifty
          unstructured con statements, and a likelihood algorithm that misses that distinction
          is easy to game with sock-puppet volume.
        </li>
      </ul>

      <p className="mb-4">
        ReasonRank avoids both failure modes. It rewards argument quality (truth, linkage,
        importance, evidence) and penalizes redundancy (uniqueness), so the resulting
        probability reflects the actual epistemic balance of the underlying debate. And because
        the entire derivation is visible on the line-item page, anyone who disagrees with the
        score can point to the specific argument they want to add, weaken, or remove.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Developer Reference</h2>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Per-estimate score</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`import { calculateReasonRankScore } from '@/core/scoring'

const score = calculateReasonRankScore(estimate)
// → 0.01 .. 0.99 (clamped)
//   formula: proRank / (proRank + conRank)`}
        </pre>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Active likelihood selection</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`import { determineActiveLikelihood } from '@/core/scoring'

const { activeProbability, activeEstimateId, status } =
  determineActiveLikelihood(estimates)
// status is 'calibrated' | 'contested' | 'emerging'`}
        </pre>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Expected value composition</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`import { calculateExpectedValue } from '@/core/scoring'

const ev = calculateExpectedValue(predictedImpact, activeLikelihood)`}
        </pre>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Implementation:{' '}
        <code className="bg-gray-100 px-1 rounded">
          src/core/scoring/cba-scoring.ts
        </code>{' '}
        and{' '}
        <code className="bg-gray-100 px-1 rounded">
          src/core/scoring/scoring-engine.ts → calculateReasonRankScore, determineActiveLikelihood, calculateLikelihoodCI
        </code>
        .
      </p>

      <hr className="my-6 border-gray-300" />

      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
              ReasonRank
            </Link>{' '}
            &mdash; the underlying argument-scoring algorithm
          </li>
          <li>
            <Link href="/algorithms/sub-argument-aggregation" className="text-blue-700 hover:underline">
              Sub-Argument Aggregation
            </Link>{' '}
            &mdash; how rawImpact is computed for each argument feeding into pro_total / con_total
          </li>
          <li>
            <Link href="/cba/about" className="text-blue-700 hover:underline">
              Automated Cost-Benefit Analysis (subsystem)
            </Link>
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
