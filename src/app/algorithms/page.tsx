import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Algorithms & Scores — Idea Stock Exchange',
  description:
    'The scoring algorithms behind the Idea Stock Exchange: ReasonRank, linkage scores, objective criteria, the strong-to-weak spectrum, and belief equivalency.',
}

const ALGORITHMS = [
  {
    href: '/algorithms/reason-rank',
    title: 'ReasonRank',
    description:
      'How argument scores propagate upward from sub-argument scores — PageRank for reasons instead of web pages.',
  },
  {
    href: '/algorithms/linkage-scores',
    title: 'Linkage Scores',
    description:
      'How much an argument, if true, actually supports its conclusion. Truth and relevance are scored separately.',
  },
  {
    href: '/algorithms/objective-criteria',
    title: 'Objective Criteria',
    description:
      'Measurable thresholds that would settle a disagreement — the falsifiability layer of every belief page.',
  },
  {
    href: '/algorithms/strong-to-weak',
    title: 'Strong-to-Weak Spectrum',
    description:
      'Separating valid concerns from extreme claims: the second coordinate axis alongside positive-to-negative.',
  },
  {
    href: '/algorithms/belief-equivalency',
    title: 'Belief Equivalency Scores',
    description:
      'The pipeline that decides whether two beliefs should be merged, linked, or kept separate.',
  },
  {
    href: '/algorithms/combine-similar-beliefs',
    title: 'Combine Similar Beliefs',
    description:
      'Grouping restatements of the same idea so effort concentrates on one canonical page per belief.',
  },
]

export default function AlgorithmsPage() {
  return (
    <main className="max-w-[960px] mx-auto px-4 py-8">
      <p className="text-right text-sm italic text-gray-600 mb-6">
        <Link href="/" className="text-blue-700 hover:underline">Home</Link>
        {' > '}
        <strong>Algorithms &amp; Scores</strong>
      </p>

      <h1 className="text-3xl font-bold mb-4 leading-tight">Algorithms &amp; Scores</h1>
      <p className="mb-8 text-gray-700">
        Every number on a belief page is computed, never manually assigned. These are the
        algorithms that do the computing.
      </p>

      <ul className="space-y-6">
        {ALGORITHMS.map((a) => (
          <li key={a.href} className="border border-gray-300 rounded p-5">
            <Link href={a.href} className="text-xl font-bold text-blue-700 hover:underline">
              {a.title}
            </Link>
            <p className="mt-2 text-gray-700">{a.description}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
