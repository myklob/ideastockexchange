import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Truth Scores — Idea Stock Exchange',
  description:
    'How a belief earns its truth score from its own argument tree and evidence ledger — recursively, never by assertion.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms</Link>
      {' > '}
      <strong>Truth Scores</strong>
    </p>
  )
}

export default function TruthScoresPage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">Truth Scores</h1>
      <p className="text-lg text-gray-600 mb-6">
        A belief never asserts its own truth. It earns a score from its own reasons to agree
        and disagree, computed recursively down to raw evidence.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The core computation</h2>
      <p className="mb-4">
        Every belief page carries a two-sided argument tree and a two-sided evidence ledger.
        The net truth readout is the normalized balance of the two:
      </p>
      <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-mono my-4 rounded">
        net = (pro &minus; con) / (pro + con) &times; 100
      </div>
      <p className="mb-4">
        where pro and con are the summed impact magnitudes of each side&apos;s arguments plus
        evidence. Dividing by the belief&apos;s own total keeps the number honest — it says how
        lopsided the debate is, not how loud it is. (Volume is reported alongside as mass, and
        the belief&apos;s standing against its <em>rivals</em> is a separate readout — see the
        Contrast Class on belief pages.)
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Two channels: logic and evidence</h2>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <strong>Logical validity</strong> — the argument channel: how the reasons to agree and
          disagree balance. An argument can only fail logically, so it lives in the tree.
        </li>
        <li>
          <strong>Verification</strong> — the evidence channel: how the supporting and weakening
          evidence balances, each item weighted by its{' '}
          <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
            evidence score
          </Link>
          . Evidence can fail empirically, so it lives in the ledger.
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-2">The turtle stack: truth is recursive</h2>
      <p className="mb-4">
        Each argument&apos;s contribution to a belief uses the <em>argument&apos;s own</em> truth
        score — the score of the child belief page behind it — times its{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">linkage</Link>,{' '}
        <Link href="/algorithms/importance-score" className="text-blue-700 hover:underline">importance</Link>, and{' '}
        <Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">uniqueness</Link>.
        That child is a full belief page with its own tree, whose arguments are belief pages in
        turn. You can drill down as far as you want until you hit raw evidence at the bottom;
        there is no hardcoded floor, on purpose. When anything below changes, propagation
        recomputes every conclusion above it.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Unscored stays blank</h2>
      <p className="mb-4">
        A claim with no scored content has no truth score — the cell renders blank rather than
        faking a neutral. Scores appear when real arguments and evidence exist to compute them
        from, and never before. The same rule protects a belief&apos;s editorial framing: the
        engine only writes a computed net over a page that actually has scored content.
      </p>

      <p className="mt-8 text-sm text-gray-600">
        Related: <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">ReasonRank</Link> ·{' '}
        <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">Evidence Scores</Link> ·{' '}
        <Link href="/algorithms/strong-to-weak" className="text-blue-700 hover:underline">Claim Strength</Link>
      </p>
    </div>
  )
}
