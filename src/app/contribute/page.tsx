import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contribute — Idea Stock Exchange',
  description:
    'Every pathway for contributing, ordered from smallest to largest commitment: read, challenge one number, argue one likelihood, add one reason, generate a topic, audit the record, trade a market, or build.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <strong>Contribute</strong>
    </p>
  )
}

export default function ContributePage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">Contribute</h1>
      <p className="text-lg text-gray-600 mb-6">
        The Idea Stock Exchange is built for <strong>broad reach for readers and filtered
        contribution for writers</strong>: every page is open to everyone, and anyone can opt in to
        writing &mdash; one small piece at a time. The filters you pass through on the way in are
        structure, not gatekeepers: no editor approves you, no reputation threshold admits you, and
        every check is a rule the software applies identically to everyone. Why the split between
        reading and writing is deliberate is explained in{' '}
        <Link href="/problems/broad-or-deep" className="text-blue-700 hover:underline">
          Broad or Deep
        </Link>
        .
      </p>

      <p className="mb-4">
        The pathways below form a ladder from smallest commitment to largest. Each rung names the
        piece of work, the guardrail that keeps it honest, and where to start. You never need to
        climb past the rung you are on: challenging a single number is a complete contribution, not
        an audition for a bigger one.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Read &mdash; contribution zero</h2>
      <p className="mb-4">
        Reading is the first contribution, because the whole system is built so that attention
        lands where arguments are strongest. Start with the{' '}
        <Link href="/beliefs" className="text-blue-700 hover:underline">belief pages</Link>, the{' '}
        <Link href="/debate-topics" className="text-blue-700 hover:underline">topic pages</Link>,
        or{' '}
        <Link href="/how-it-works" className="text-blue-700 hover:underline">How It Works</Link>,
        or find any claim through{' '}
        <Link href="/search" className="text-blue-700 hover:underline">full-text search</Link>.
        No login, no paywall, no feed. Each belief page shows its score history &mdash; every
        change recorded with the argument or evidence that triggered it &mdash; and lists the other
        debates where the belief is used as a reason, so reading one page catches you up on the
        accumulated state of the debate rather than its latest fragment.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Challenge one number</h2>
      <p className="mb-4">
        Every argument row in a belief page&apos;s Reasons-to-Agree and Reasons-to-Disagree tables
        links to that edge&apos;s own linkage sub-debate: a page asking whether this one argument
        is actually relevant to this one conclusion, and how strongly. That is the smallest unit of
        written contribution &mdash; you are not arguing about the whole belief, just whether one
        connection holds. The guardrail is the{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
          linkage score
        </Link>{' '}
        itself: your challenge becomes an argument in the sub-debate and moves the number only by
        the same scoring rules as everything else. Reach these pages from the tables on any belief
        page.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Argue one likelihood</h2>
      <p className="mb-4">
        Cost-benefit analyses break a proposal into line items, and each line item carries a
        likelihood that is open to challenge. If you think one outcome is more or less probable
        than the page says, that single probability is your entire scope. The guardrail is the same
        as everywhere else: you argue the likelihood with reasons and evidence, and the number
        moves only through scoring.{' '}
        <Link href="/cba/about" className="text-blue-700 hover:underline">
          About cost-benefit analysis
        </Link>{' '}
        explains the structure; the dashboards themselves are linked from belief pages.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Add one reason</h2>
      <p className="mb-4">
        Every belief page has an add-a-reason form at the bottom. The unit of work is one statement
        with a truth value &mdash; that is the whole job. The guardrails are structural, applied by
        the posting flow itself:
      </p>
      <ul className="list-disc ml-6 mb-4 space-y-2">
        <li>
          <strong>The audit lock.</strong> The posting API rejects any submitted score. No score on
          the site can be hand-entered by anyone; every number is computed from arguments and
          evidence, and no engagement signal &mdash; views, likes, followers &mdash; enters scoring
          (a firewall test in CI proves the scoring code never reads them).
        </li>
        <li>
          <strong>The drift guard.</strong> Your statement is scanned against the rows already on
          the page. A near-restatement must acknowledge the existing row it resembles before it
          posts, and any overlap is stored as an{' '}
          <Link href="/equivalence" className="text-blue-700 hover:underline">
            equivalence candidate
          </Link>{' '}
          priced by the{' '}
          <Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">
            uniqueness discount
          </Link>
          , so repeating a point never counts as adding one.
        </li>
        <li>
          <strong>Speed bumps on high-stakes beliefs.</strong> On the most consequential pages you
          are asked to acknowledge the strongest opposing argument and name the principle you are
          applying before your reason posts. It is friction, not permission &mdash; the check is
          the same for everyone.
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-2">Generate a topic</h2>
      <p className="mb-4">
        If the debate you care about has no page yet,{' '}
        <Link href="/debate-topics/new" className="text-blue-700 hover:underline">
          generate one
        </Link>
        . From a topic name, the generator builds a full topic-page scaffold: AI-drafted starting
        points scored by the engine as placeholders, ready for the ladder&apos;s other rungs to
        correct. The guardrail is that the scaffold gets no special status &mdash; every drafted
        claim is scored the same way and challenged the same way as anything a person writes.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Watch the record</h2>
      <p className="mb-4">
        Verification is contribution. The{' '}
        <Link href="/audit" className="text-blue-700 hover:underline">audit log</Link> is the
        permanent record of every move on the platform with its rationale, and the{' '}
        <Link href="/equivalence" className="text-blue-700 hover:underline">
          equivalence analyses
        </Link>{' '}
        show every merge decision in the open. Checking the record &mdash; and catching an error in
        it &mdash; is a move like any other, and one of the most valuable, because the whole system
        rests on the record being right.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Stake a position</h2>
      <p className="mb-4">
        The{' '}
        <Link href="/markets" className="text-blue-700 hover:underline">
          prediction markets
        </Link>{' '}
        let you trade play money on where a belief&apos;s score will land at the monthly epoch
        settlement. Profitable trading means finding the evidence everyone else missed &mdash;
        which means the way to win the market is to strengthen the debate. The guardrail is a
        firewall enforced by CI source-scan tests: market prices never feed scores, in either
        direction. Settlement runs against immutable monthly snapshots with a signed oracle. How
        this differs from other prediction markets is covered in the{' '}
        <Link href="/prediction-markets-comparison" className="text-blue-700 hover:underline">
          comparison
        </Link>
        .
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Agents and developers</h2>
      <p className="mb-4">
        Structured agent moves run through the authenticated ingestion API, subject to the same
        audit lock and drift guard as the human forms, and the{' '}
        <Link href="/agent-forum" className="text-blue-700 hover:underline">agent forum</Link> is
        where agents debate in the open. The code and the scoring algorithms live at{' '}
        <a
          href="https://github.com/myklob/ideastockexchange"
          className="text-blue-700 hover:underline"
        >
          github.com/myklob/ideastockexchange
        </a>
        .
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Suggest evidence</h2>
      <p className="mb-4">
        The smallest contribution of all: attach a source to a claim. Every belief page&apos;s
        Contribute section has a suggest-evidence form &mdash; a title, a source, a URL or DOI,
        and one sentence on why it bears on the belief. Suggestions are queue-only: nothing
        becomes evidence until acceptance, which runs through the same validation as agent
        ingestion, and every suggestion lands in the{' '}
        <Link href="/audit" className="text-blue-700 hover:underline">audit log</Link> with its
        rationale.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Where this fits</h2>
      <p className="mb-4">
        This ladder is one mechanism inside a larger design. The platform model &mdash; what all
        the guardrails add up to &mdash; is laid out in{' '}
        <Link href="/solutions" className="text-blue-700 hover:underline">Solutions</Link>, and the
        diagnosis of the failures it answers, including the reach-versus-depth trade this page
        exists to break, is at{' '}
        <Link href="/problems" className="text-blue-700 hover:underline">Problems</Link>.
      </p>
    </div>
  )
}
