import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Media Cannot Organize a Good Debate — Idea Stock Exchange',
  description:
    'Attention-funded media drifts off the question and scatters the same arguments across a thousand dead threads; the structural answer is one canonical, searchable, ranked page per question.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/problems" className="text-blue-700 hover:underline">The Problem</Link>
      {' > '}
      <strong>The Media Cannot Organize a Good Debate</strong>
    </p>
  )
}

export default function MediaCannotOrganizeAGoodDebatePage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">The Media Cannot Organize a Good Debate</h1>
      <p className="text-lg text-gray-600 mb-6">
        The media&apos;s product is attention, not resolution &mdash; so its conversations wander
        off the question by design, and the arguments it does surface scatter across platforms with
        no home, no organization, and no refinement. The failure has two faces: drift and scatter.
        The Idea Stock Exchange answers both with the same structure &mdash; one canonical,
        searchable page per question, where restatements stop counting and the strongest points rise.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Face one: the conversation drifts off the question</h2>
      <p className="mb-4">
        Attention-funded formats cannot afford sustained focus. The deeper a segment goes into one
        issue, the smaller its audience gets, so cable cuts to commercial, threads chase the
        loudest tangent, and podcasts move on before any thought closes. Within minutes the
        original question is buried &mdash; not by accident, but because the incentive structure
        rewards exactly that. This face of the failure has its own deep dive:{' '}
        <Link href="/problems/topic-drift" className="text-blue-700 hover:underline">
          Topic Drift
        </Link>
        .
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Face two: the arguments scatter with no home</h2>
      <p className="mb-4">
        Even when someone makes a genuinely good point, it has nowhere to live. The sharp remark
        from last week&apos;s thread is unfindable this week. The same pro and con points are
        remade daily &mdash; across networks, platforms, and comment sections &mdash; because no
        central place exists where an argument is recorded once, organized against its
        counterarguments, and refined over time. Every conversation starts from scratch, repeats
        the greatest hits, and dies without depositing anything anywhere.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">What it costs</h2>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <strong>Insights are buried in dead threads.</strong> The best framing of an argument
          disappears into an archive nobody will search, and tomorrow&apos;s debate proceeds as if
          it was never made.
        </li>
        <li>
          <strong>No side ever engages the other side&apos;s best version.</strong> Because the
          strongest statement of each position has no fixed address, everyone rebuts whichever weak
          version happened to cross their feed.
        </li>
        <li>
          <strong>Moderators can only delete, not organize.</strong> The one tool platforms have is
          removal. Nothing in the media&apos;s toolkit can merge duplicates, rank points by
          strength, or attach a rebuttal to the claim it answers.
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-2">How the Idea Stock Exchange addresses it</h2>
      <ul className="list-disc ml-6 mb-4 space-y-2">
        <li>
          <strong>One canonical page per question.</strong> Every{' '}
          <Link href="/debate-topics" className="text-blue-700 hover:underline">topic</Link> and
          every <Link href="/beliefs" className="text-blue-700 hover:underline">belief</Link> gets
          exactly one permanent page. The debate accumulates there instead of restarting somewhere
          else every news cycle.
        </li>
        <li>
          <strong>A good remark stays findable.</strong> Full-text{' '}
          <Link href="/search" className="text-blue-700 hover:underline">search</Link> covers every
          claim and argument on the exchange, so last week&apos;s point is one query away instead
          of buried in a dead thread.
        </li>
        <li>
          <strong>Restatements are grouped and priced, not repeated.</strong> Near-duplicates are
          priced down to zero marginal weight by the{' '}
          <Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">
            uniqueness discount
          </Link>
          , with side-by-side{' '}
          <Link href="/equivalence" className="text-blue-700 hover:underline">
            equivalence analyses
          </Link>{' '}
          showing which claims say the same thing &mdash; so the thousandth remake of a point adds
          weight to the first instead of noise beside it.
        </li>
        <li>
          <strong>Relevance is priced.</strong> Every argument carries a{' '}
          <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
            linkage score
          </Link>{' '}
          measuring how directly it bears on the conclusion, so tangents score their way to the
          bottom without any moderator touching them.
        </li>
        <li>
          <strong>The strongest points rise.</strong>{' '}
          <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
            ReasonRank
          </Link>{' '}
          ranks every reason by argument and evidence strength &mdash; never by engagement &mdash;
          so the best version of each side sits at the top of its table, where the other side has
          to engage it.
        </li>
        <li>
          <strong>Every argument has one home, and every use is visible.</strong> Each belief page
          lists the other debates where that belief is used as a reason, so a point made once is
          organized once and deployed everywhere it applies.
        </li>
      </ul>
      <p className="mb-4">
        The mechanism behind all of this is <strong>Order</strong> &mdash; see the{' '}
        <Link href="/solutions" className="text-blue-700 hover:underline">Solutions</Link> page for
        how it fits with the other mechanisms, or{' '}
        <Link href="/how-it-works" className="text-blue-700 hover:underline">How It Works</Link>{' '}
        for the full engine.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Related</h2>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <Link href="/problems" className="text-blue-700 hover:underline">Problems hub</Link>:
          where this failure sits in the larger diagnosis.
        </li>
        <li>
          <Link href="/problems/topic-drift" className="text-blue-700 hover:underline">
            Topic Drift
          </Link>
          : the deep dive on face one &mdash; why attention-funded conversations wander by design.
        </li>
        <li>
          <Link href="/problems/clean-slate" className="text-blue-700 hover:underline">
            The Clean-Slate Problem
          </Link>
          : the sibling failure across time &mdash; every news cycle restarts the debate from zero.
        </li>
      </ul>
    </div>
  )
}
