import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'It Does Not Rank Arguments — or Beliefs by Their Arguments — Idea Stock Exchange',
  description:
    'Attention media has no metric for truth, so engagement ranks the feed and tribal content beats accurate content — the Idea Stock Exchange computes every belief score from arguments and evidence, with engagement locked out of scoring by a CI-enforced firewall.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/problems" className="text-blue-700 hover:underline">The Problem</Link>
      {' > '}
      <strong>It Does Not Rank Arguments &mdash; or Beliefs by Their Arguments</strong>
    </p>
  )
}

export default function NoTruthMetricPage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">
        It Does Not Rank Arguments &mdash; or Beliefs by Their Arguments
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        Attention media has no metric for truth, so the only ranking signal available to it is
        engagement &mdash; and engagement reliably rewards tribal content over accurate content.
        The Idea Stock Exchange&apos;s answer is to compute every belief&apos;s score from the
        arguments and evidence beneath it, and to lock engagement out of scoring entirely.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Why engagement fills the vacuum</h2>
      <p className="mb-4">
        A newspaper, a cable channel, or a social feed has no way to measure whether a claim is
        true. Nothing in the format assigns a score to an argument, checks it against the evidence
        offered for it, or rolls those scores up into a verdict on the belief the arguments are
        about. With no truth metric available, the platform ranks by the one thing it can measure:
        the reaction. Clicks, shares, watch time, replies &mdash; engagement becomes the ranking
        function by default, not by design.
      </p>
      <p className="mb-4">
        And engagement has a systematic bias. Outrage travels farther than correction. A claim
        engineered to confirm what one tribe already believes generates more reaction than a
        careful qualification of it, so the feed learns to serve the claim and bury the
        qualification. The feed is optimizing for the reaction, not the reasoning &mdash; and the
        predictable result is echo chambers, because the content that spreads is the content that
        flatters the audience it spreads to.
      </p>
      <p className="mb-4">
        The deeper failure follows directly: a platform that cannot rank arguments cannot tell its
        audience which side of a contested question is currently winning on the merits. Nobody can
        look at the feed and learn whether the case for a policy has actually survived the case
        against it. When the merits are unreadable, tribal identity fills the vacuum &mdash; you
        find out what your side believes, because that is the only signal the medium transmits.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">What it costs</h2>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <strong>Accuracy loses to virality.</strong> The reward structure pays the claim that
          spreads, not the claim that holds up, so being right confers no advantage over being
          shareable.
        </li>
        <li>
          <strong>Corrections never catch the error.</strong> The retraction is less engaging than
          the original claim, so it reaches a fraction of the audience the error reached.
        </li>
        <li>
          <strong>Echo chambers harden.</strong> Feeds tuned to reaction serve each tribe the
          content that confirms it, and the two audiences drift out of contact with each
          other&apos;s best arguments.
        </li>
        <li>
          <strong>The scoreboard is blank.</strong> No one can point to a running, evidence-based
          answer to &ldquo;which side is winning this argument?&rdquo; &mdash; so affiliation
          stands in for analysis.
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-2">How the Idea Stock Exchange addresses it</h2>
      <ul className="list-disc ml-6 mb-4 space-y-2">
        <li>
          <strong>Every belief carries a computed score.</strong> A belief&apos;s score is
          calculated from the arguments and evidence beneath it by{' '}
          <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
            ReasonRank
          </Link>
          : each argument&apos;s impact is sign &times;{' '}
          <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">
            truth
          </Link>{' '}
          &times; |linkage| &times; importance &times; uniqueness. The score is a verdict on the
          reasoning, recomputed as the reasoning changes.
        </li>
        <li>
          <strong>Both sides are ranked, side by side.</strong> Every{' '}
          <Link href="/beliefs" className="text-blue-700 hover:underline">belief page</Link> shows
          symmetric Reasons to Agree and Reasons to Disagree tables, each ranked by score &mdash;
          so which side is winning on the merits is readable at a glance, and the strongest
          opposing argument is always one row away.
        </li>
        <li>
          <strong>No score is hand-entered.</strong> The{' '}
          <Link href="/audit" className="text-blue-700 hover:underline">audit lock</Link> means
          every score is computed: the posting API rejects score fields outright, so no editor,
          moderator, or administrator can decree a number.
        </li>
        <li>
          <strong>Engagement appears nowhere in scoring.</strong> There are no view counts, likes,
          or follower counts anywhere in the data model, and a CI firewall test scans the scoring
          engine&apos;s source to prove no engagement signal can enter it &mdash; the same way a
          second firewall proves prediction-market prices never feed scores. A claim that goes
          viral gains nothing; a claim that survives scrutiny gains everything.
        </li>
      </ul>
      <p className="mb-4">
        Automated scoring and structured pro/con framing are two of the core{' '}
        <Link href="/solutions" className="text-blue-700 hover:underline">mechanisms</Link> the
        platform is built on.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The payoff</h2>
      <p className="mb-4">
        When truth has a metric, engagement stops being the ranking function of last resort. The
        feed no longer decides what you see by what provoked the biggest reaction; the scoreboard
        shows which arguments survived scrutiny and which beliefs those survivors support. Tribal
        identity loses its monopoly on the question &ldquo;what should I believe?&rdquo; because,
        for the first time, the merits are readable.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Related</h2>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <Link href="/problems" className="text-blue-700 hover:underline">Problems hub</Link>:
          where this failure sits in the larger diagnosis.
        </li>
        <li>
          <Link href="/problems/no-reason-to-return" className="text-blue-700 hover:underline">
            No reason to return
          </Link>
          : computed scores give the{' '}
          <Link href="/markets" className="text-blue-700 hover:underline">
            prediction markets
          </Link>{' '}
          something honest to settle against &mdash; a number derived from arguments, not applause.
        </li>
      </ul>
    </div>
  )
}
