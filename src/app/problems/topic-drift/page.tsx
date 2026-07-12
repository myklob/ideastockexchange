import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Topic Drift — Idea Stock Exchange',
  description:
    'Why conversations veer off their original question, and the structural answer: one canonical page per topic, restatements merged, and relevance priced by linkage scores.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/problems" className="text-blue-700 hover:underline">Problems</Link>
      {' > '}
      <strong>Topic Drift</strong>
    </p>
  )
}

export default function TopicDriftPage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">Topic Drift</h1>
      <p className="text-lg text-gray-600 mb-6">
        <strong>Topic drift</strong> is what happens when a conversation veers off its original
        question, burying the point under tangents until nobody remembers what was being decided.
        The Idea Stock Exchange&apos;s answer is structural: one canonical page per topic, similar
        claims merged into one, and every contribution scored for relevance, so wandering off-topic
        stops paying.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Why topic drift happens</h2>
      <p className="mb-4">
        Topic drift is the structural failure of attention-driven media to keep a conversation
        anchored to a single question. It happens because the format cannot afford sustained focus.
        The further you go into one issue, the smaller the audience for it gets, and the
        platform&apos;s revenue depends on the size of the audience. So conversations are designed
        to drift to the next attention-grabbing thing before too much depth costs too much audience.
      </p>
      <p className="mb-4">
        The specific symptoms vary by format. Cable segments cut to commercial before any topic gets
        explored. Talk-radio callers change subject. Social threads chase whatever gets the most
        replies, which is usually a tangent. Podcast guests interrupt each other and never close a
        thought. Within minutes, the original question is buried.
      </p>
      <p className="mb-4">
        Wikipedia does not have this problem because Wikipedia is not trying to maximize how long
        you stay on the article. It is just trying to be right about the article&apos;s topic. The
        platform has no incentive to add tangential content to keep you scrolling, so it does not.
        That is the difference a non-attention-based incentive structure makes.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">What it costs</h2>
      <p className="mb-2">Within a single conversation:</p>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <strong>Focus dissolves.</strong> Tangents and rhetorical distractions derail the
          discussion before it reaches a conclusion.
        </li>
        <li>
          <strong>Time and energy are wasted.</strong> Participants re-litigate settled points and
          chase irrelevancies instead of progressing.
        </li>
        <li>
          <strong>Emotion replaces reasoning.</strong> As the thread wanders, people feel
          misunderstood, frustration rises, and rational discourse gives way to venting.
        </li>
        <li>
          <strong>The logical chain breaks.</strong> Drift destroys the step-by-step progression
          needed to evaluate ideas on their merits.
        </li>
      </ul>
      <p className="mb-2">And across platforms, the same failure at scale:</p>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <strong>Repetition without progress.</strong> Billions of disconnected discussions repeat
          the same debates daily; conclusions reached in one thread never carry over to the next.
        </li>
        <li>
          <strong>Arguments scatter with no home.</strong> Pro and con points fragment across
          platforms with no central place where they are organized, evaluated, or refined.
        </li>
        <li>
          <strong>Insights get buried.</strong> Valuable points disappear into dead comment threads
          because nothing preserves them or integrates them into a larger analysis.
        </li>
        <li>
          <strong>Echo chambers harden.</strong> Isolated discussions reinforce existing biases, and
          nobody is incentivized to engage the best version of the opposing view.
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-2">How the Idea Stock Exchange addresses it</h2>
      <ul className="list-disc ml-6 mb-4 space-y-2">
        <li>
          <strong>One canonical page anchors every conversation.</strong> One page per{' '}
          <Link href="/debate-topics" className="text-blue-700 hover:underline">topic</Link> and one
          page per <Link href="/beliefs" className="text-blue-700 hover:underline">belief</Link>{' '}
          give every question a permanent home the debate returns to. Leaving the topic becomes a
          deliberate link out, not a drift.
        </li>
        <li>
          <strong>Restating stops counting as contributing.</strong> Similar ways of saying the same
          thing are{' '}
          <Link href="/algorithms/combine-similar-beliefs" className="text-blue-700 hover:underline">
            grouped
          </Link>
          , and the{' '}
          <Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">
            uniqueness discount
          </Link>{' '}
          merges the thousandth restatement with the first, so the conversation moves only when
          someone adds something new. The posting flow enforces this at the door: every submission
          is scanned against the arguments already on the page, overlap is stored for the discount
          to price, and a near-identical restatement must acknowledge the existing row before it
          posts.
        </li>
        <li>
          <strong>Relevance is priced, not policed.</strong> Every argument carries a{' '}
          <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
            linkage score
          </Link>{' '}
          measuring how directly it bears on the conclusion it is attached to. A true-but-irrelevant
          tangent scores zero linkage and contributes nothing. Drift is not moderated away; it is
          scored away, with no moderator anywhere in the chain.
        </li>
        <li>
          <strong>Navigation replaces wandering.</strong> Moving to a more general, more specific,
          bolder, or more hedged version of a claim is explicit movement along the topic page&apos;s
          dimensions — every topic page carries a &ldquo;Navigate, don&apos;t drift&rdquo; strip for
          exactly these moves — so exploring the neighborhood of an idea no longer means losing the
          thread.
        </li>
        <li>
          <strong>The strongest on-topic points rise.</strong>{' '}
          <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
            ReasonRank
          </Link>{' '}
          ranks arguments by logical strength and{' '}
          <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
            evidence
          </Link>
          , so attention lands where the argument is strongest, not where the newest tangent is
          loudest.
        </li>
      </ul>
      <p className="mb-4">
        For how these mechanisms fit together, see{' '}
        <Link href="/how-it-works" className="text-blue-700 hover:underline">How It Works</Link>.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The payoff</h2>
      <p className="mb-4">
        Scattered debate loses insights, repeats arguments, and hardens polarization. A canonical
        page with priced relevance turns billions of parallel shouting matches into one accumulating
        analysis, where staying on topic is the path of least resistance and every contribution
        either advances the question or quietly scores zero.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Related</h2>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <Link href="/problems" className="text-blue-700 hover:underline">The Problem</Link>:
          where this failure sits in the larger diagnosis of attention-funded media.
        </li>
        <li>
          <Link
            href="/problems/media-cannot-organize-a-good-debate"
            className="text-blue-700 hover:underline"
          >
            The media cannot organize a good debate
          </Link>
          : the parent failure — drift plus scattered, redundant arguments.
        </li>
        <li>
          <Link href="/problems/clean-slate" className="text-blue-700 hover:underline">
            For-profit media does not accumulate progress
          </Link>
          : topic drift over time, across whole news cycles.
        </li>
        <li>
          <Link href="/solutions" className="text-blue-700 hover:underline">Solutions</Link>: the
          full mechanism map, including the Order mechanism this page describes.
        </li>
      </ul>
    </div>
  )
}
