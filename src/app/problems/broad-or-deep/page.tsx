import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "You Can't Be Broad and Deep at the Same Time — Idea Stock Exchange",
  description:
    'Why attention economics forces media to choose breadth over depth, and the structural answer: open reading for everyone, with contribution filtered by structure instead of gatekeepers.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/problems" className="text-blue-700 hover:underline">The Problem</Link>
      {' > '}
      <strong>You Can&apos;t Be Broad and Deep at the Same Time</strong>
    </p>
  )
}

export default function BroadOrDeepPage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">
        You Can&apos;t Be Broad and Deep at the Same Time
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        For-profit media has to maximize its audience to make money, and that single constraint
        forces breadth over depth at every level. Depth requires filtering, filtering shrinks the
        audience, and so attention economics forbids depth. The Idea Stock Exchange&apos;s answer
        is to stop choosing: broad, open reach for readers, and filtered, structured contribution
        for writers.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Why media picks breadth every time</h2>
      <p className="mb-4">
        A business that sells attention cannot afford to lose any of it. That one economic fact
        cascades into the same choice at every level of the operation:
      </p>
      <ul className="list-disc ml-6 mb-4 space-y-2">
        <li>
          <strong>Shallow coverage aimed at everyone.</strong> Every extra layer of rigor loses the
          viewers who came for something lighter, so coverage stays at the depth the broadest
          audience will tolerate &mdash; which is to say, almost none.
        </li>
        <li>
          <strong>Unfiltered contributors.</strong> Gatekeeping shrinks the pool of voices, and a
          smaller pool means less content and a smaller audience. So the call-in line, the comment
          section, and the panel booking all optimize for volume, not quality.
        </li>
        <li>
          <strong>No rules.</strong> Rules cost participation. Requiring a caller to address the
          strongest opposing argument, or a commenter to check whether their point was already
          made, would drive most of them away. So nothing is required, and nothing accumulates.
        </li>
      </ul>
      <p className="mb-4">
        The trade-off is real: depth genuinely does require filtering. A rigorous conversation has
        to exclude the repetitive, the irrelevant, and the unserious, and every exclusion costs
        audience. A platform that lives on audience size cannot pay that cost, so it never gets
        depth &mdash; not because nobody there wants it, but because the business model forbids it.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The fix: split the trade-off instead of choosing a side</h2>
      <p className="mb-4">
        The trade-off only binds if reading and writing must live under one policy. They
        don&apos;t. The two sides of the dilemma can be separated and each given what it needs:
      </p>
      <ul className="list-disc ml-6 mb-4 space-y-2">
        <li>
          <strong>Broad reach for readers.</strong> Anyone can read every page. No login, no
          paywall, no filter of any kind on who gets to see the analysis.
        </li>
        <li>
          <strong>Filtered contribution for writers.</strong> Anyone can opt in to contributing,
          one small piece at a time, through structured pathways whose guardrails are built into
          the format itself &mdash; guardrails instead of gatekeepers.
        </li>
      </ul>
      <p className="mb-4">
        Breadth and depth stop competing because they no longer share a bottleneck. The audience
        can be as large as the internet while the contribution pipeline stays as strict as the
        structure demands.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">How the Idea Stock Exchange addresses it</h2>
      <ul className="list-disc ml-6 mb-4 space-y-2">
        <li>
          <strong>Reading is free and open.</strong> Every{' '}
          <Link href="/beliefs" className="text-blue-700 hover:underline">belief page</Link> and{' '}
          <Link href="/debate-topics" className="text-blue-700 hover:underline">topic page</Link>{' '}
          is public, and{' '}
          <Link href="/search" className="text-blue-700 hover:underline">full-text search</Link>{' '}
          covers all of it. The reader side of the platform is as broad as broadcast.
        </li>
        <li>
          <strong>Contributing runs through a graduated on-ramp.</strong> The{' '}
          <Link href="/contribute" className="text-blue-700 hover:underline">contribution
          pathways</Link> scale from tiny to large: challenge a single{' '}
          <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
            linkage
          </Link>{' '}
          number, argue one{' '}
          <Link href="/cba/about" className="text-blue-700 hover:underline">
            cost-benefit likelihood
          </Link>
          , add one reason to one belief page, or generate a whole{' '}
          <Link href="/debate-topics/new" className="text-blue-700 hover:underline">
            new topic page
          </Link>
          . Nobody has to earn a byline; everybody starts with one small, structured piece.
        </li>
        <li>
          <strong>The filters are structural, not human.</strong> The audit lock rejects any
          hand-entered score &mdash; every number must be computed from arguments and evidence,
          with the full history on the{' '}
          <Link href="/audit" className="text-blue-700 hover:underline">audit log</Link>. The
          drift guard makes near-restatements acknowledge the existing row before they post. Speed
          bumps on high-stakes beliefs require acknowledging the strongest opposing argument
          first. No editor anywhere decides who may speak.
        </li>
        <li>
          <strong>Quality comes from the shape of each piece.</strong> Because every contribution
          is one small, structured unit, its quality is enforced by the structure itself &mdash;
          the linkage it must declare, the overlap it must acknowledge, the steelman it must face
          &mdash; not by a gatekeeper&apos;s judgment of the contributor.
        </li>
      </ul>
      <p className="mb-4">
        For how this reader/writer split fits into the whole platform model, see{' '}
        <Link href="/solutions" className="text-blue-700 hover:underline">the solution</Link>.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The payoff</h2>
      <p className="mb-4">
        Attention economics says a platform must be shallow to be big. Splitting the trade-off
        breaks that law: the analysis can go as deep as the strongest contributors can push it,
        while the doors stay open to every reader on earth. Depth without a velvet rope; breadth
        without the shallows.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Related</h2>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <Link href="/problems" className="text-blue-700 hover:underline">Problems hub</Link>:
          where this failure sits in the larger diagnosis.
        </li>
        <li>
          <Link
            href="/problems/media-cannot-organize-a-good-debate"
            className="text-blue-700 hover:underline"
          >
            Media cannot organize a good debate
          </Link>
          : the parent failure this trade-off helps explain.
        </li>
        <li>
          <Link href="/problems/no-reason-to-return" className="text-blue-700 hover:underline">
            No reason to return
          </Link>
          : what shallow, unfiltered coverage costs the audience over time.
        </li>
      </ul>
    </div>
  )
}
