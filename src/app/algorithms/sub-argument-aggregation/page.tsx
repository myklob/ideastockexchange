import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sub-Argument Aggregation — Idea Stock Exchange',
  description:
    'How sub-argument scores roll up into their parent. impactScore = sign × childTruth × |linkage| × importance × 100. The recursion that makes ReasonRank propagate scores bottom-up through any depth of argument tree.',
}

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>Sub-Argument Aggregation</strong>
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

export default function SubArgumentAggregationPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Sub-Argument Aggregation: How Scores Flow Upward
      </h1>

      <p className="mb-3 text-[1.05rem]">
        Belief pages are not flat lists of claims. They are trees. Each top-level argument has
        sub-arguments; those sub-arguments have their own sub-arguments; and so on. The
        question this page answers is: when a child belief&apos;s truth score changes, exactly
        how much should it move the parent&apos;s score? The answer is one formula, applied
        consistently at every level.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Edge Formula</h2>

      <FormulaBox>
        impactScore = sign &times; childTruth &times; |linkage| &times; importance &times; 100
      </FormulaBox>

      <ul className="list-disc list-outside ml-6 mb-4 space-y-2">
        <li>
          <strong>sign</strong>: +1 if the child is on the &ldquo;agree&rdquo; side of the
          parent, &minus;1 if on the &ldquo;disagree&rdquo; side. The side alone controls
          direction; the magnitude is everything else.
        </li>
        <li>
          <strong>childTruth</strong>: the child&apos;s own ReasonRank truth score (0&ndash;1)
          after its own sub-argument tree has been resolved. A weakly-supported child carries
          weakly-supported impact upward.
        </li>
        <li>
          <strong>|linkage|</strong>: how relevant the child is to the parent. Absolute value
          is used so the side flag alone determines direction; a high-linkage but
          contradicting argument is captured by the sign, not by a negative linkage value.
        </li>
        <li>
          <strong>importance</strong>: how much this argument moves the needle on the parent
          if accepted. Decisive (1.0) through negligible (&lt; 0.15). See{' '}
          <Link href="/algorithms/importance-scores" className="text-blue-700 hover:underline">
            Importance Scores
          </Link>
          .
        </li>
        <li>
          <strong>&times; 100</strong>: scales the result to the stored impact range used
          throughout the schema (e.g., +18.5, &minus;22.1). Rounded to one decimal place to
          keep floating-point noise out of the database.
        </li>
      </ul>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">From Edge to Parent: ReasonRank</h2>

      <p className="mb-3">
        Each argument&apos;s impact contributes to its parent&apos;s ReasonRank score via the
        recursive PageRank-style propagation:
      </p>

      <FormulaBox>
        proSubRank = Σ rawImpact for pro children
      </FormulaBox>
      <FormulaBox>
        conSubRank = Σ rawImpact for con children
      </FormulaBox>
      <FormulaBox>
        normalizedNet = (proSubRank &minus; conSubRank) / numSubArgs
      </FormulaBox>
      <FormulaBox>
        subArgScore = clamp(0.5 + normalizedNet &times; 0.5, 0, 1)
      </FormulaBox>
      <FormulaBox>
        ReasonRank = (1 &minus; d) &times; baseTruth + d &times; subArgScore
      </FormulaBox>

      <p className="mb-4">
        with damping factor <code className="bg-gray-100 px-1 rounded">d = 0.85</code> &mdash;
        the same value PageRank uses. 85% of an argument&apos;s ReasonRank comes from its
        sub-argument evidence; 15% comes from its own base truth (the &ldquo;teleportation&rdquo;
        term). For leaf arguments with no sub-arguments, 100% comes from base truth.
      </p>

      <p className="mb-4 text-sm text-gray-600">
        The clamp keeps subArgScore in [0, 1] even when the net argument balance is extreme.
        The normalization-by-count (<code className="bg-gray-100 px-1 rounded">/ numSubArgs</code>)
        keeps a tree with 50 sub-arguments from arithmetically swamping a tree with 5 just by
        accumulating; per-argument quality matters more than raw quantity.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Worked Example</h2>

      <p className="mb-3">
        A parent claim has two sub-arguments. The pro one is well-supported; the con one is
        marginal.
      </p>

      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2">Side</th>
              <th className="border border-gray-300 px-3 py-2">childTruth</th>
              <th className="border border-gray-300 px-3 py-2">|linkage|</th>
              <th className="border border-gray-300 px-3 py-2">importance</th>
              <th className="border border-gray-300 px-3 py-2">impactScore</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2 text-center">pro</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.80</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.90</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.70</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">+50.4</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 text-center">con</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.55</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.40</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">0.30</td>
              <td className="border border-gray-300 px-3 py-2 text-center font-mono">&minus;6.6</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mb-3 text-sm text-gray-600">
        Per-argument:{' '}
        <code className="bg-gray-100 px-1 rounded">+1 × 0.80 × 0.90 × 0.70 × 100 = +50.4</code>{' '}
        and{' '}
        <code className="bg-gray-100 px-1 rounded">−1 × 0.55 × 0.40 × 0.30 × 100 = −6.6</code>.
      </p>

      <p className="mb-3 text-sm text-gray-600">
        Sub-rank propagation (assuming both sub-arguments are leaves with rawImpact equal to
        truth × linkage × importance, so 0.504 and 0.066 respectively):
      </p>

      <pre className="bg-white border border-gray-200 rounded p-3 text-xs overflow-x-auto mb-4">
{`proSubRank = 0.504
conSubRank = 0.066
numSubArgs = 2
normalizedNet = (0.504 − 0.066) / 2 = 0.219
subArgScore = clamp(0.5 + 0.219 × 0.5, 0, 1) = 0.6095
ReasonRank = 0.15 × baseTruth + 0.85 × 0.6095`}
      </pre>

      <p className="mb-4 text-sm text-gray-600">
        If the parent&apos;s baseTruth is 0.50, its ReasonRank is{' '}
        <code className="bg-gray-100 px-1 rounded">0.15 × 0.50 + 0.85 × 0.6095 ≈ 0.593</code>.
        The pro sub-argument moved the parent above neutral; the con sub-argument barely
        registered because its three component scores were all weak.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">No Depth Penalty</h2>

      <p className="mb-3">
        The recursion gives each level the same treatment. There is no extra penalty for deep
        arguments. A premise three levels down still propagates fully upward, scaled at every
        level by the linkage and importance of its specific edge to its parent. If the chain
        from premise to top-level conclusion is strong (high linkage, high importance) at every
        step, the deep premise contributes essentially as much as a top-level argument would.
        If any link is weak, the contribution attenuates exactly at the weak step.
      </p>

      <p className="mb-4">
        This is the same property that makes PageRank insensitive to the literal depth of a
        page in a hyperlink graph. What matters is the <em>quality</em> of the path, not its
        length.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Why Each Multiplier Is Necessary</h2>

      <ul className="list-disc list-outside ml-6 mb-4 space-y-2">
        <li>
          <strong>Without childTruth:</strong> a hand-waved claim contributes the same as a
          rigorously supported one.
        </li>
        <li>
          <strong>Without linkage:</strong> a mountain of true-but-irrelevant arguments swamps
          one decisive on-topic counterargument.
        </li>
        <li>
          <strong>Without importance:</strong> twenty minor pro points outweigh one decisive
          con point purely by volume.
        </li>
        <li>
          <strong>Without uniqueness</strong> (folded into{' '}
          <code className="bg-gray-100 px-1 rounded">rawImpact</code>):{' '}
          ten near-duplicates of the same argument count as ten arguments.
        </li>
      </ul>

      <p className="mb-4">
        The product structure means a single weak factor pulls the contribution toward zero.
        That asymmetry is the point. Strong impact requires strong scores on every dimension; a
        single failure is enough to disqualify.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Developer Reference</h2>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Edge-level impact</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`import { computeArgumentImpactScore } from '@/core/scoring'

const impact = computeArgumentImpactScore(
  side,            // 'agree' or 'disagree'
  childTruthScore, // 0..1
  linkageScore,    // -1..1; |linkage| is used
  importanceScore, // 0..1
)
// → signed value in (−100, +100)`}
        </pre>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Recursive scoring</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`import { scoreArgument } from '@/core/scoring'

const breakdown = scoreArgument(arg)
// breakdown.rawImpact = reasonRank × linkage × importance × uniqueness
// breakdown.signedImpact = rawImpact × (side === 'pro' ? +1 : -1)`}
        </pre>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Implementation:{' '}
        <code className="bg-gray-100 px-1 rounded">
          src/core/scoring/scoring-engine.ts → scoreArgument, computeArgumentImpactScore
        </code>
        . The damping factor 0.85 is the constant{' '}
        <code className="bg-gray-100 px-1 rounded">DAMPING_FACTOR</code> at the top of the
        file.
      </p>

      <hr className="my-6 border-gray-300" />

      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
              ReasonRank
            </Link>{' '}
            &mdash; the umbrella algorithm whose recursion this formula implements
          </li>
          <li>
            <Link href="/algorithms/reason-rank-vs-pagerank" className="text-blue-700 hover:underline">
              ReasonRank vs. PageRank
            </Link>{' '}
            &mdash; how the propagation here relates to the PageRank formulation
          </li>
          <li>
            <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
              Linkage Scores
            </Link>{' '}
            &mdash; one of the four edge multipliers
          </li>
          <li>
            <Link href="/algorithms/importance-scores" className="text-blue-700 hover:underline">
              Importance Scores
            </Link>{' '}
            &mdash; another edge multiplier
          </li>
          <li>
            <Link href="/algorithms/topic-overlap" className="text-blue-700 hover:underline">
              Topic Overlap
            </Link>{' '}
            &mdash; the uniqueness term in rawImpact
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
