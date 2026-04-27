import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Importance Scores — Idea Stock Exchange',
  description:
    'Importance Scores measure how much an argument moves the probability needle on a belief. Decisive, significant, moderate, minor, or negligible — the band determines how much weight a true argument earns.',
}

const bands = [
  {
    label: 'Decisive',
    threshold: '≥ 0.85',
    color: '#16a34a',
    description:
      'A single argument in this band, if it stands, would by itself flip the conclusion. Evidence-of-cause findings, cleanly-replicated experiments, or premises whose denial collapses the entire belief.',
  },
  {
    label: 'Significant',
    threshold: '0.65 – 0.84',
    color: '#65a30d',
    description:
      'Material contribution to the score. Removing the argument would visibly shift the headline number, even if the conclusion would not flip outright.',
  },
  {
    label: 'Moderate',
    threshold: '0.40 – 0.64',
    color: '#ca8a04',
    description:
      'Relevant but not decisive. Useful corroborating point that nudges the result, often part of a broader case rather than a load-bearing pillar.',
  },
  {
    label: 'Minor',
    threshold: '0.15 – 0.39',
    color: '#ea580c',
    description:
      'Small contribution. The argument is on-topic and not wrong, but it covers a peripheral aspect or is one of many similar nudges.',
  },
  {
    label: 'Negligible',
    threshold: '< 0.15',
    color: '#dc2626',
    description:
      'Near-zero contribution. The argument might be technically correct but has barely any bearing on whether the belief should be raised or lowered.',
  },
]

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms &amp; Scores</Link>
      {' > '}
      <strong>Importance Scores</strong>
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

export default function ImportanceScoresPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222] leading-relaxed">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight">
        Importance Scores: Not Every True Argument Matters Equally
      </h1>

      <p className="mb-3 text-[1.05rem]">
        Importance separates truth from relevance to a specific conclusion. Without this filter,
        a long list of minor correct points can outweigh a single decisive counterargument
        purely by volume. The Idea Stock Exchange refuses that trade. Each argument carries an
        importance weight between 0 and 1 that determines how much of its impact actually counts
        toward the parent belief.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Formula</h2>

      <FormulaBox>
        weightedImpact = baseImpact &times; importanceScore
      </FormulaBox>

      <p className="mb-4">
        <strong>baseImpact</strong> is what the argument would contribute on its own merits
        before importance is applied &mdash; a function of its truth, linkage, and recursive
        sub-argument support. <strong>importanceScore</strong> is a number between 0 and 1
        capturing how much this argument should move the needle on the specific belief in
        question. Their product is what flows into the parent&apos;s ReasonRank propagation.
      </p>

      <p className="mb-4 text-sm text-gray-600">
        Importance is independent of side. Both pro and con arguments get scored. A decisive con
        argument outweighs any number of minor pro arguments, exactly as it should.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">The Five Bands</h2>

      <div className="space-y-3 mb-6">
        {bands.map((band) => (
          <div
            key={band.label}
            className="border border-gray-200 rounded p-3"
            style={{ borderLeftWidth: 4, borderLeftColor: band.color }}
          >
            <div className="flex items-center gap-3 mb-1">
              <span
                className="font-bold text-sm px-2 py-0.5 rounded text-white"
                style={{ backgroundColor: band.color }}
              >
                {band.label}
              </span>
              <span className="text-sm font-mono text-gray-500">{band.threshold}</span>
            </div>
            <p className="text-sm text-gray-700">{band.description}</p>
          </div>
        ))}
      </div>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Why the Band Boundaries Are Where They Are</h2>

      <p className="mb-3">
        The cutoffs are not arbitrary. The 0.85 threshold for &ldquo;decisive&rdquo; is the
        point at which a single argument&apos;s contribution would, in a typical pro-vs-con
        balance, by itself produce a score above 0.5 even with one strong counterargument
        present. The 0.15 cutoff for &ldquo;negligible&rdquo; is where the argument&apos;s
        contribution gets small enough that, given the natural noise in truth and linkage
        scoring, its presence or absence is below detection.
      </p>

      <p className="mb-4">
        The intermediate bands are spaced to give human reviewers a meaningful palette. Four
        bands would collapse useful distinctions. Six bands would be more vocabulary than
        anyone could reliably assign.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">How the Score Is Set</h2>

      <p className="mb-3">
        Importance enters the system through one of three channels:
      </p>

      <ol className="list-decimal list-outside ml-6 mb-4 space-y-2">
        <li>
          <strong>Wizard input.</strong> When an editor adds an argument, the linkage diagnostic
          asks how strongly this point bears on the conclusion. Wizard answers map to canonical
          importance values (proof &rarr; 1.0, strong &rarr; 0.8, contextual &rarr; 0.5,
          weak &rarr; 0.2).
        </li>
        <li>
          <strong>Editor judgment.</strong> Subject-matter editors can override the wizard value
          with a custom number when the argument&apos;s importance is genuinely between bands or
          requires nuanced calibration.
        </li>
        <li>
          <strong>Community challenge.</strong> Like every other score, importance can be
          contested. A challenge opens a sub-debate whose own ReasonRank determines the new
          value, replacing the static one.
        </li>
      </ol>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Why This Matters</h2>

      <p className="mb-3">
        The hardest scoring failure to fix is the case where every argument is technically
        accurate but the page conclusion is wrong. It happens when one side stacks a long list
        of true-but-peripheral points against one or two decisive points on the other side, and
        a system that only counts truth and linkage gets fooled by the volume. Adding importance
        as a third independent dimension closes that loophole.
      </p>

      <p className="mb-4">
        It also makes the scoring legible. A reader can look at a belief page and see at a
        glance which arguments the system treated as load-bearing &mdash; the decisive and
        significant bands &mdash; and which it treated as supporting context. Disagreements
        about that calibration become arguments about importance specifically, rather than
        arguments about the headline number whose roots are hard to trace.
      </p>

      <hr className="my-6 border-gray-300" />

      <h2 className="text-2xl font-bold mb-3">Developer Reference</h2>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm mb-4">
        <p className="font-bold mb-2">Source</p>
        <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto">
{`import { calculateImportanceScore } from '@/core/scoring'

const result = calculateImportanceScore(importanceScore, baseImpact)
// → { importanceScore: clamped, weightedImpact, label }
//   where label is 'decisive' | 'significant' | 'moderate' | 'minor' | 'negligible'`}
        </pre>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Implementation:{' '}
        <code className="bg-gray-100 px-1 rounded">
          src/core/scoring/all-scores.ts → calculateImportanceScore
        </code>
        . Importance is consumed by{' '}
        <code className="bg-gray-100 px-1 rounded">scoreArgument()</code> in the recursive
        ReasonRank propagation, and by the importance-weighted aggregate in{' '}
        <code className="bg-gray-100 px-1 rounded">computeAllBeliefScores</code>.
      </p>

      <hr className="my-6 border-gray-300" />

      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/sub-argument-aggregation" className="text-blue-700 hover:underline">
              Sub-Argument Aggregation
            </Link>{' '}
            &mdash; the formula importance feeds into:{' '}
            <code className="bg-white border border-gray-200 px-1 rounded">
              sign × childTruth × |linkage| × importance × 100
            </code>
          </li>
          <li>
            <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
              Linkage Scores
            </Link>{' '}
            &mdash; the orthogonal axis: importance is &ldquo;how much it would matter <em>if</em>{' '}
            true and on-topic&rdquo;, linkage is &ldquo;how on-topic it is&rdquo;
          </li>
          <li>
            <Link href="/algorithms/strong-to-weak" className="text-blue-700 hover:underline">
              Strong-to-Weak Spectrum
            </Link>{' '}
            &mdash; the burden-of-proof axis that interacts with importance for extreme claims
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
