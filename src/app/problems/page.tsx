import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Problems — Idea Stock Exchange',
  description:
    'The failures of attention-driven discourse the Idea Stock Exchange is built to fix, and the mechanism that answers each one.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

export default function ProblemsPage() {
  return (
    <div className={container}>
      <p className="text-right text-sm italic text-gray-600 mb-6">
        <Link href="/" className="text-blue-700 hover:underline">Home</Link>
        {' > '}
        <strong>Problems</strong>
      </p>
      <h1 className="text-3xl font-bold mb-3">Problems</h1>
      <p className="text-lg text-gray-600 mb-6">
        The failures of attention-driven discourse this platform is built to fix. Each problem page
        names the failure, what it costs, and the structural mechanism that answers it — structure,
        not moderation.
      </p>

      <div className="border border-gray-300 rounded p-4 mb-4">
        <h2 className="text-xl font-bold mb-1">
          <Link href="/problems/topic-drift" className="text-blue-700 hover:underline">
            Topic Drift
          </Link>
        </h2>
        <p className="text-sm text-gray-700">
          Conversations veer off their original question, burying the point under tangents until
          nobody remembers what was being decided. Answered by one canonical page per topic, merged
          restatements, and relevance priced by{' '}
          <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
            linkage scores
          </Link>
          .
        </p>
      </div>

      <p className="text-sm text-gray-600">
        More problem pages land as their mechanisms do. The mechanisms themselves are documented on
        the <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms</Link>{' '}
        index and in{' '}
        <Link href="/how-it-works" className="text-blue-700 hover:underline">How It Works</Link>.
      </p>
    </div>
  )
}
