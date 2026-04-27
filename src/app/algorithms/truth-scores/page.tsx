import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Truth Scores — Idea Stock Exchange',
  description:
    'Truth Scores combine Logical Validity (do the arguments hold structurally?) with Verification (do the underlying facts check out?) into a single number between 0 and 1 displayed on every belief page.',
}

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>Truth Scores</strong>
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

function CalloutBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f9f9f9] border-l-4 border-[#3366cc] px-4 py-4 mb-5 rounded">
      {children}
    </div>
  )
}

export default function TruthScoresPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Truth Scores: Logic and Facts, Checked Separately
      </h1>

      <CalloutBox>
        <p>
          Two completely different things can go wrong with an argument. The logic can be broken
          even when the facts are correct (every premise true, but the conclusion does not
          follow). And the logic can be airtight while the underlying facts are wrong (perfectly
          valid reasoning from a false premise produces a false conclusion). The Truth Score is
          the average of two independent checks &mdash; one for each failure mode &mdash; so a
          claim cannot pass by being good at one and ignoring the other.
        </p>
      </CalloutBox>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Formula</h2>

      <FormulaBox>
        Truth Score = (Logical Validity + Verification) / 2
      </FormulaBox>

      <p className="mb-4">
        Both components live on the same 0&ndash;1 scale, so the average is the natural
        expression of &ldquo;both halves matter equally.&rdquo; If only one component has data
        (no arguments yet, or no evidence yet), the score falls back to whichever component is
        available. With neither, the score is 0.5 &mdash; maximum uncertainty &mdash; because
        the system never invents confidence it has not earned.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Logical Validity</h2>

      <p className="mb-3">
        Logical Validity asks whether the argument structures hold. It is computed as the average
        truth score across all arguments on the page, with each argument&apos;s contribution
        reduced by the total penalty assigned to fallacies detected in it.
      </p>

      <FormulaBox>
        LV = mean over arguments of [ truthScore × (1 &minus; fallacyPenalty) ]
      </FormulaBox>

      <p className="mb-4">
        A perfectly clean argument carries its full truth score into the average. An argument
        with a 30% fallacy penalty contributes 70% of its weight. An argument with a 100%
        penalty contributes nothing. See{' '}
        <Link href="/algorithms/logical-validity" className="text-blue-700 hover:underline">
          Logical Validity
        </Link>{' '}
        for the full fallacy taxonomy and how penalties are calibrated.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Verification</h2>

      <p className="mb-3">
        Verification asks whether the facts check out empirically. It is the EVS-weighted ratio
        of supporting evidence to total evidence on the belief page.
      </p>

      <FormulaBox>
        VTS = supportingWeight / (supportingWeight + weakeningWeight)
      </FormulaBox>

      <p className="mb-3 text-sm text-gray-600">
        where each evidence item&apos;s weight is{' '}
        <code className="bg-gray-100 px-1 rounded">EVS × linkageScore</code> &mdash; high-tier
        sources whose claim is tightly connected to the belief contribute more than low-tier
        sources or loosely-connected ones.
      </p>

      <p className="mb-4">
        See{' '}
        <Link href="/algorithms/verification" className="text-blue-700 hover:underline">
          Verification
        </Link>{' '}
        for how the EVS formula handles replication, source independence, and conclusion
        relevance, and{' '}
        <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
          Evidence Scores
        </Link>{' '}
        for the T1&ndash;T4 tier system that drives the underlying weights.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Why Both Halves</h2>

      <p className="mb-3">
        Logical Validity catches the class of argument where every cited fact is correct but the
        conclusion does not follow from them. The classic version is &ldquo;some swans are white,
        therefore all swans are white&rdquo; &mdash; the data is not in question, but the inference
        is invalid. A page can stack high-tier evidence and still fail this check.
      </p>

      <p className="mb-3">
        Verification catches the opposite class &mdash; arguments whose form is valid but whose
        premises are unsupported or contradicted by evidence. &ldquo;If X then Y. X. Therefore
        Y.&rdquo; is a valid inference. If X is unsupported by evidence, the conclusion inherits
        that weakness regardless of how clean the syllogism looks.
      </p>

      <p className="mb-4">
        Combining the two means a claim has to clear both bars. A page that aces logic but has no
        evidence backing its premises is rated as uncertain, not as true. A page swimming in
        peer-reviewed evidence whose arguments commit obvious fallacies is also rated as
        uncertain. Real confidence requires both.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Edge Cases</h2>

      <p className="mb-3">
        <strong>No arguments and no evidence.</strong> The score is 0.5. The system does not
        award confidence to a page that has not been argued or evidenced. New beliefs start
        neutral.
      </p>

      <p className="mb-3">
        <strong>Arguments only, no evidence.</strong> The score is the Logical Validity component
        alone. A purely conceptual debate (e.g., a definitional claim) can score well here without
        any empirical evidence at all.
      </p>

      <p className="mb-4">
        <strong>Evidence only, no arguments.</strong> The score is the Verification component
        alone. Rare in practice &mdash; most evidence-rich pages also have arguments &mdash; but
        the math does not break down if the case arises.
      </p>

      <p className="mb-4">
        Truth Scores are clamped to [0.01, 0.99] before display. Neither perfect 0 nor perfect 1
        is reachable from the formula, which mirrors the basic epistemic principle that nothing
        a community of fallible reasoners produces should ever be marked as fully certain in
        either direction.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Developer Reference</h2>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Source</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`import { calculateTruthScoreBreakdown } from '@/core/scoring'

const breakdown = calculateTruthScoreBreakdown(args, evidence)
// → { overallTruthScore, logicalValidityScore, verificationTruthScore,
//     argumentCount, totalFallacyPenalty, evidenceCount }`}
        </pre>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Implementation:{' '}
        <code className="bg-gray-100 px-1 rounded">
          src/core/scoring/all-scores.ts → calculateTruthScoreBreakdown
        </code>
        . Called by{' '}
        <code className="bg-gray-100 px-1 rounded">computeBeliefScores()</code> in{' '}
        <code className="bg-gray-100 px-1 rounded">
          src/features/belief-analysis/data/fetch-belief.ts
        </code>{' '}
        on every belief-page render.
      </p>

      <hr className="my-6 border-gray-300" />

      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/logical-validity" className="text-blue-700 hover:underline">
              Logical Validity
            </Link>{' '}
            &mdash; the fallacy-detection half of the formula
          </li>
          <li>
            <Link href="/algorithms/verification" className="text-blue-700 hover:underline">
              Verification
            </Link>{' '}
            &mdash; the evidence-weighted half of the formula
          </li>
          <li>
            <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
              Evidence Scores
            </Link>{' '}
            &mdash; the EVS weights that drive Verification
          </li>
          <li>
            <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
              ReasonRank
            </Link>{' '}
            &mdash; how the Truth Score composes with Linkage and Importance into the headline number
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
