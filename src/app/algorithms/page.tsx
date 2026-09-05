import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Scoring Algorithms — Idea Stock Exchange',
  description:
    'Index of every algorithm behind the numbers on a belief page: ReasonRank, linkage, truth, importance, uniqueness, evidence, and more.',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <strong>Algorithms</strong>
    </p>
  )
}

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-mono text-base my-4 rounded">
      {children}
    </div>
  )
}

// ─── Algorithm index data ─────────────────────────────────────────────────────

interface AlgorithmEntry {
  name: string
  href: string
  description: string
}

interface AlgorithmGroup {
  heading: string
  blurb: string
  entries: AlgorithmEntry[]
}

const groups: AlgorithmGroup[] = [
  {
    heading: 'The Core Pipeline',
    blurb:
      'Five multipliers decide how much weight an argument passes up to its conclusion. ReasonRank is the recursion that runs them over the whole tree.',
    entries: [
      {
        name: 'ReasonRank',
        href: '/algorithms/reason-rank',
        description:
          'The master algorithm: how pro and con argument trees recursively roll up into a belief score, PageRank-style.',
      },
      {
        name: 'Truth Scores',
        href: '/algorithms/truth-scores',
        description:
          'How well-supported a claim is by its own sub-arguments and evidence — accuracy, independent of relevance.',
      },
      {
        name: 'Linkage Scores',
        href: '/algorithms/linkage-scores',
        description:
          'Whether a true argument actually connects to its conclusion. A multiplier from −1.0 to +1.0, itself debatable.',
      },
      {
        name: 'Importance Score',
        href: '/algorithms/importance-score',
        description:
          'How much a true, relevant argument should move the needle — derived from a dedicated importance sub-debate.',
      },
      {
        name: 'Uniqueness',
        href: '/algorithms/unique-scores',
        description:
          'The redundancy penalty. Making one point five different ways scores as one point, not five.',
      },
      {
        name: 'Evidence Scores',
        href: '/algorithms/evidence-scores',
        description:
          'Grading raw data by source tier, replication count, replication consistency, and relevance to the conclusion.',
      },
    ],
  },
  {
    heading: 'Debate Hygiene',
    blurb:
      'Before the multipliers run, these algorithms keep the inputs honest: shared yardsticks, calibrated claim strength, and explicit hidden premises.',
    entries: [
      {
        name: 'Objective Criteria',
        href: '/algorithms/objective-criteria',
        description:
          'Agreeing on the measurement yardstick before the fight, so evidence is weighed by standards set in advance.',
      },
      {
        name: 'Claim Strength (Strong-to-Weak)',
        href: '/algorithms/strong-to-weak',
        description:
          'Burden of proof scales with wording: “always” needs more support than “sometimes.”',
      },
      {
        name: 'Assumptions',
        href: '/algorithms/assumptions',
        description:
          'Surfacing the unstated premises that bridge low-linkage arguments, so each one becomes its own debatable node.',
      },
      {
        name: 'Fallacy Detection',
        href: '/algorithms/fallacy-detection',
        description:
          'Fallacy accusations as scored arguments: a required template, a 60% consensus bar, and a credibility multiplier that punishes tribal calling.',
      },
    ],
  },
  {
    heading: 'Deduplication',
    blurb:
      'One question, one page. These algorithms stop the same debate from fragmenting across a dozen differently-worded copies.',
    entries: [
      {
        name: 'Belief Equivalency',
        href: '/algorithms/belief-equivalency',
        description:
          'Detecting differently-worded claims that make the same point, so their arguments and scores can be shared.',
      },
      {
        name: 'Combining Similar Beliefs',
        href: '/algorithms/combine-similar-beliefs',
        description:
          'How near-duplicate beliefs get merged once equivalency is established, and what happens to their argument trees.',
      },
    ],
  },
  {
    heading: 'Decision Analysis',
    blurb:
      'For “should we” questions, scored arguments feed probability-weighted cost-benefit accounting.',
    entries: [
      {
        name: 'CBA Likelihood',
        href: '/cba/about',
        description:
          'How competing probability estimates for each predicted cost and benefit are scored, and the winner selected.',
      },
    ],
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlgorithmsIndexPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222]">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-4 leading-tight">The Scoring Algorithms</h1>

      <p className="mb-3">
        Every score on a{' '}
        <Link href="/beliefs" className="text-blue-700 hover:underline">belief page</Link>{' '}
        is computed, never hand-assigned. Nobody at the Idea Stock Exchange decides that an
        argument is worth 72 points. The community contributes arguments, evidence, and votes on
        specific narrow questions; the algorithms turn those inputs into numbers through formulas
        anyone can inspect and challenge.
      </p>
      <p className="mb-5">
        Each page below explains one number you will meet on a belief page: what it measures, how
        it is calculated, and a worked example. Some of these formulas run in the live scoring
        engine today; others describe elicitation flows (voting interfaces, diagnostic wizards)
        that are designed but still being wired to real data. Each page says which is which.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Core formula ────────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">The Formula Everything Feeds Into</h2>
      <p className="mb-3">
        A belief&apos;s conclusion score is the weighted sum of the reasons to agree minus the
        weighted sum of the reasons to disagree:
      </p>

      <FormulaBox>
        Conclusion Score = &Sigma;(agree &times; linkage &times; uniqueness) &minus;
        &Sigma;(disagree &times; linkage &times; uniqueness)
      </FormulaBox>

      <p className="mb-3">
        The live engine computes this one edge at a time. For each argument attached to a belief,{' '}
        <code className="bg-gray-100 px-1 rounded">computeArgumentImpactScore</code> in{' '}
        <code className="bg-gray-100 px-1 rounded">src/core/scoring/scoring-engine.ts</code>{' '}
        produces the term that argument contributes:
      </p>

      <FormulaBox>
        impact = sign &times; truth &times; |linkage| &times; importance &times; uniqueness
        &times; 100
      </FormulaBox>

      <p className="mb-3">
        Where <strong>sign</strong> is +1 for a reason to agree and &minus;1 for a reason to
        disagree, <strong>truth</strong> is the child belief&apos;s own truth score (0&ndash;1),{' '}
        <strong>|linkage|</strong> is the absolute linkage score (0&ndash;1, so the side alone
        controls direction), <strong>importance</strong> is the needle-moving weight
        (0&ndash;1), and <strong>uniqueness</strong> is the redundancy penalty (0&ndash;1,
        defaulting to 1). The result is scaled by 100 and rounded to one decimal, which is why
        belief pages show impacts like 18.5 or &minus;12.4.
      </p>
      <p className="mb-4">
        The multiplication is the point. An argument that is true but irrelevant scores zero.
        Relevant but false scores zero. True, relevant, but a restatement of a point already made
        scores near zero. Only arguments that clear every filter move the conclusion.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Index ───────────────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-4">The Algorithms</h2>

      {groups.map(group => (
        <div key={group.heading} className="mb-8">
          <h3 className="text-xl font-bold mb-2">{group.heading}</h3>
          <p className="mb-3 text-gray-700">{group.blurb}</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left w-[30%]">Algorithm</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">What it explains</th>
                </tr>
              </thead>
              <tbody>
                {group.entries.map(entry => (
                  <tr key={entry.href} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 font-semibold">
                      <Link href={entry.href} className="text-blue-700 hover:underline">
                        {entry.name}
                      </Link>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{entry.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <hr className="my-6 border-gray-300" />

      {/* ── Where to see them ───────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold mb-3">See Them in Action</h2>
      <p className="mb-3">
        The algorithms are not the product; the belief page is. Every number these pages explain
        appears next to a real argument on a real page, where you can click into it, see the
        sub-debate behind it, and challenge it.
      </p>
      <ul className="list-disc list-inside mb-5 space-y-1 text-sm">
        <li>
          <Link href="/beliefs" className="text-blue-700 hover:underline">
            Browse the beliefs
          </Link>{' '}
          &mdash; every score you see traces back to one of the algorithms above.
        </li>
        <li>
          <Link href="/faq" className="text-blue-700 hover:underline">
            Read the FAQ
          </Link>{' '}
          &mdash; common questions about how scoring, voting, and merging work.
        </li>
      </ul>
    </main>
  )
}
