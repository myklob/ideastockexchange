import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hidden Assumptions — Idea Stock Exchange',
  description:
    'Every argument-to-conclusion linkage smuggles unstated premises. ISE surfaces them, scores them, and lets you challenge them.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms</Link>
      {' > '}
      <strong>Hidden Assumptions</strong>
    </p>
  )
}

export default function AssumptionsPage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">Hidden Assumptions</h1>
      <p className="text-lg text-gray-600 mb-6">
        &ldquo;X, therefore Y&rdquo; is never just X and Y. The step between them rests on
        premises nobody typed — and those premises are where arguments actually fail.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Where assumptions hide</h2>
      <p className="mb-4">
        Every{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
          linkage
        </Link>{' '}
        between an argument and its conclusion has a mechanism — the sentence explaining
        <em> how</em> X being true supports Y. Write the mechanism down and its unstated premises
        become visible: &ldquo;automation displaces workers, therefore we need UBI&rdquo;
        assumes displacement outpaces re-employment, that no cheaper remedy exists, and that
        cash is the binding constraint. Each of those can be false while X stays true.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">How ISE surfaces them</h2>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <strong>Assumptions by side</strong> on every belief page: what you must accept for the
          belief to hold, and what you must accept to reject it — symmetrically, with scores.
        </li>
        <li>
          <strong>Per-linkage hidden-assumption lists</strong> on each argument&apos;s linkage
          page: the premises that specific X-supports-Y step depends on.
        </li>
        <li>
          <strong>Component claims</strong> in the Logical Anatomy section: the belief&apos;s
          AND/OR structure, with each component marked stated or unstated and
          survives-if-false or not.
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-2">Assumptions are claims — the recursion applies</h2>
      <p className="mb-4">
        A surfaced assumption is a standalone claim with a truth value, which means it can get
        its own belief page, its own pro/con tree, and its own score. Challenge one by arguing
        it where it lives: when the assumption&apos;s score falls, the linkage that depended on
        it weakens, and propagation moves every conclusion downstream. When the assumption chain
        breaks entirely, the linkage is a non-sequitur and scores near zero no matter how true
        the argument is.
      </p>

      <p className="mt-8 text-sm text-gray-600">
        Related: <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">Linkage Scores</Link> ·{' '}
        <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">Truth Scores</Link> ·{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">ReasonRank</Link>
      </p>
    </div>
  )
}
