import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Algorithms & Scores — Idea Stock Exchange',
  description:
    'The scoring algorithms behind the Idea Stock Exchange: ReasonRank, linkage scores, objective criteria, belief equivalency, and the claim-strength spectrum.',
}

const algorithms = [
  {
    href: '/algorithms/reason-rank',
    title: 'ReasonRank',
    description:
      'PageRank-style logic for arguments: each idea earns its score from the quality of reasons supporting it, minus the reasons against.',
  },
  {
    href: '/algorithms/linkage-scores',
    title: 'Linkage Scores',
    description:
      'Separating true arguments from relevant ones using evidence-to-conclusion and argument-to-conclusion linkage (ECLS & ACLS).',
  },
  {
    href: '/algorithms/objective-criteria',
    title: 'Objective Criteria',
    description:
      'Agreeing on measurement standards before evaluating evidence — settling the yardstick before the fight.',
  },
  {
    href: '/algorithms/strong-to-weak',
    title: 'Strong-to-Weak Spectrum',
    description:
      'Separating valid concerns from extreme claims — the second coordinate axis alongside positive-to-negative.',
  },
  {
    href: '/algorithms/belief-equivalency',
    title: 'Belief Equivalency Scores',
    description:
      'Determining whether two differently-worded beliefs make the same underlying claim — the anti-fragmentation mechanism.',
  },
  {
    href: '/algorithms/combine-similar-beliefs',
    title: 'Combine Similar Beliefs',
    description:
      'Merging scattered restatements of the same belief so arguments and evidence accumulate in one place.',
  },
]

export default function AlgorithmsIndexPage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-8 text-[#222]">
      <p className="text-right text-sm italic text-gray-600 mb-6">
        <Link href="/" className="text-blue-700 hover:underline">Home</Link>
        {' > '}
        <strong>Algorithms &amp; Scores</strong>
      </p>

      <h1 className="text-3xl font-bold mb-4">Algorithms &amp; Scores</h1>
      <p className="mb-8">
        Every score on the Idea Stock Exchange is computed, inspectable, and open to
        challenge. These pages explain how each algorithm works and why it exists.
      </p>

      <ul className="space-y-5 list-none p-0 m-0">
        {algorithms.map((algo) => (
          <li key={algo.href} className="border border-gray-300 rounded p-4">
            <Link href={algo.href} className="text-lg font-semibold text-blue-700 hover:underline">
              {algo.title}
            </Link>
            <p className="text-sm text-gray-700 mt-1 mb-0">{algo.description}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
