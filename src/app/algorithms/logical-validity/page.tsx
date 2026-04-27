import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Logical Validity — Idea Stock Exchange',
  description:
    'Logical Validity scores the structural soundness of arguments on a belief page. Detected fallacies reduce each argument’s contribution multiplicatively; the result is one half of the page’s Truth Score.',
}

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>Logical Validity</strong>
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

const fallacyExamples = [
  {
    name: 'Ad hominem',
    pattern: 'Attacks the speaker rather than the argument.',
    penalty: '0.30',
    illustration: '“You can’t trust that study, the author has a podcast.”',
  },
  {
    name: 'Strawman',
    pattern: 'Misrepresents the opposing view to make it easier to attack.',
    penalty: '0.40',
    illustration: '“Opponents of this policy want children to starve.”',
  },
  {
    name: 'Appeal to authority (without evidence)',
    pattern: 'Cites a credentialed person rather than the work supporting their claim.',
    penalty: '0.20',
    illustration: '“A Nobel laureate said it, so it must be true.”',
  },
  {
    name: 'False dichotomy',
    pattern: 'Presents two options as exhaustive when more exist.',
    penalty: '0.30',
    illustration: '“Either we ban this entirely or we accept total catastrophe.”',
  },
  {
    name: 'Hasty generalization',
    pattern: 'Draws a sweeping conclusion from a small sample.',
    penalty: '0.25',
    illustration: '“Two people I know had a bad reaction, so the drug is dangerous.”',
  },
  {
    name: 'Affirming the consequent',
    pattern: 'If P then Q. Q. Therefore P. (Invalid form.)',
    penalty: '0.35',
    illustration: '“If it rained, the ground is wet. The ground is wet, so it rained.”',
  },
  {
    name: 'Circular reasoning',
    pattern: 'The conclusion is restated as a premise.',
    penalty: '0.40',
    illustration: '“The text is reliable because it says it is reliable.”',
  },
  {
    name: 'Non sequitur (hard)',
    pattern: 'Premises and conclusion have no logical connection.',
    penalty: '1.00',
    illustration: '“Crime is up. Therefore the moon landing was faked.”',
  },
]

export default function LogicalValidityPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Logical Validity: Does the Argument Hold Together?
      </h1>

      <p className="mb-3 text-[1.05rem]">
        Logical Validity is the half of the{' '}
        <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">
          Truth Score
        </Link>{' '}
        that asks: even granting the premises, does the conclusion follow? An argument can be
        built on accurate facts and still be invalid because the inference is broken. A separate
        argument can be invalid in a way that is hard to spot at a glance &mdash; the form looks
        familiar, but the form is wrong. The Logical Validity check is what penalizes that
        specifically, before any evidence-quality concerns enter the picture.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Formula</h2>

      <FormulaBox>
        LV = mean over arguments of [ truthScore × (1 &minus; fallacyPenalty) ]
      </FormulaBox>

      <p className="mb-4">
        Each argument carries its own truth score, scaled down by the fraction of its weight that
        registered fallacies eat. The page-level Logical Validity is the simple average across
        every argument on the page &mdash; pro and con &mdash; so a single high-impact fallacy
        cannot be hidden by surrounding clean arguments.
      </p>

      <p className="mb-4 text-sm text-gray-600">
        With zero arguments, Logical Validity defaults to 0.5, the same maximum-uncertainty
        anchor used everywhere else. The page must actually be argued before the score moves.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Fallacy Penalties</h2>

      <p className="mb-3">
        Each fallacy has an impact score between 0 and 100 representing how much it damages an
        argument. The total penalty applied to an argument is the sum of all detected fallacies&apos;
        impacts divided by 100, capped at 1.0 (no negative validity). A 30-impact ad hominem and
        a 40-impact strawman on the same argument compose into a 70% penalty, leaving the
        argument with 30% of its original weight.
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Fallacy</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Pattern</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Default penalty</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Example</th>
            </tr>
          </thead>
          <tbody>
            {fallacyExamples.map((row) => (
              <tr key={row.name}>
                <td className="border border-gray-300 px-3 py-2 font-semibold">{row.name}</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-700">{row.pattern}</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                  {row.penalty}
                </td>
                <td className="border border-gray-300 px-3 py-2 italic text-gray-600">
                  {row.illustration}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-600 italic mb-4">
        Penalties are defaults. Reviewers can adjust the impact for a specific instance &mdash;
        a strawman that misrepresents only a minor sub-claim is less damaging than one that
        misrepresents the central thesis &mdash; and the resolved value is what the formula
        consumes.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Structural Soundness Beyond Fallacy Tags</h2>

      <p className="mb-3">
        Two structural patterns are caught even when no specific fallacy fires:
      </p>

      <ul className="list-disc list-outside ml-6 mb-4 space-y-2">
        <li>
          <strong>Non sequitur.</strong> An argument with{' '}
          <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
            linkage
          </Link>{' '}
          below 0.05 carries no logical connection to its conclusion regardless of what its
          claim text says. This is a structural failure, not a fallacy in the rhetorical sense,
          and the linkage score handles it directly.
        </li>
        <li>
          <strong>True but irrelevant.</strong> An argument with linkage below 0.10 and a high
          truth score is flagged: the facts are right, but they do not bear on this conclusion.
          The system surfaces the warning so the argument can be moved or dropped rather than
          inflating the page that should not own it.
        </li>
      </ul>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">What This Catches That Verification Misses</h2>

      <p className="mb-4">
        A page can be packed with peer-reviewed sources and still fail Logical Validity if the
        arguments built on top of them commit obvious errors. Cherry-picking a single high-tier
        study, then generalizing past what it claims, is a common failure mode that{' '}
        <Link href="/algorithms/verification" className="text-blue-700 hover:underline">
          Verification
        </Link>{' '}
        alone would not catch &mdash; the cited source is real, after all. The fallacy penalty on
        the inference itself is the lever that prevents this.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Developer Reference</h2>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Argument-level penalty</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`// In src/core/scoring/scoring-engine.ts → scoreArgument()
const fallacyPenalty = arg.fallaciesDetected.reduce(
  (sum, f) => sum + Math.abs(f.impact) / 100,
  0,
)
const baseTruth = Math.max(0, arg.truthScore * (1 - fallacyPenalty))`}
        </pre>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Page-level Logical Validity</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`// In src/core/scoring/all-scores.ts → calculateTruthScoreBreakdown()
let logicalValiditySum = 0
for (const arg of args) {
  const penalty = arg.fallacyPenalty ?? 0
  logicalValiditySum += Math.max(0, arg.truthScore * (1 - penalty))
}
const logicalValidityScore = argumentCount > 0
  ? logicalValiditySum / argumentCount
  : 0.5`}
        </pre>
      </div>

      <hr className="my-6 border-gray-300" />

      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">
              Truth Scores
            </Link>{' '}
            &mdash; how Logical Validity composes with Verification
          </li>
          <li>
            <Link href="/algorithms/verification" className="text-blue-700 hover:underline">
              Verification
            </Link>{' '}
            &mdash; the evidence-weighted half of the truth score
          </li>
          <li>
            <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
              Linkage Scores
            </Link>{' '}
            &mdash; how non-sequiturs and true-but-irrelevant arguments are caught
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
