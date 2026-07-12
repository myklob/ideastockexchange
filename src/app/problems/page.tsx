import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Places We Discuss Ideas Are Paid to Hold Attention, Not to Solve Problems — Idea Stock Exchange',
  description:
    'Why attention-funded platforms cannot host productive debate, the five core failures that follow from the revenue model, and the mechanism that answers each one.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <strong>The Problem</strong>
    </p>
  )
}

export default function ProblemsPage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">
        The Places We Discuss Ideas Are Paid to Hold Attention, Not to Solve Problems
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        Almost every platform where the public encounters ideas at scale — cable news, newspapers,
        talk radio, YouTube, Twitter, TikTok, Facebook — sells attention to advertisers. Once
        revenue depends on holding attention, every design decision flows from that fact. The fix is
        not better hosts or better moderation; it is a different incentive entirely. Wikipedia is
        the proof of concept on the easy half of the problem. The five failures below are what stops
        that model from extending to contested questions.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Why attention funding corrupts the design</h2>
      <p className="mb-4">
        The economics are simple and merciless. The deeper a conversation goes into one question,
        the smaller the audience that stays for it, and ad revenue is a function of audience size.
        So every attention-funded format is engineered to move on before depth costs viewers: the
        cable segment cuts to commercial, the feed refreshes, the thread chases the tangent that got
        the most replies. Topic drift, daily restarts, and rage-bait are not failures of these
        platforms. They are what the revenue model selects for.
      </p>
      <p className="mb-4">
        Wikipedia escaped because it is not paid to hold you. It has no incentive to keep you
        scrolling, so it does not try — it just tries to be right about the article&apos;s topic.
        But Wikipedia only handles questions where a citation settles the matter. Contested
        questions — where reasonable people weigh competing arguments — need something more: a way
        to organize those arguments and score them by evidence. That gap is where the five failures
        live.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The five core failures</h2>
      <p className="mb-4">
        Each failure has its own page naming the damage it does and the structural mechanism that
        answers it.
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#f0f3f6]">
              <th className="border border-gray-300 px-3 py-2 align-top text-left">Failure</th>
              <th className="border border-gray-300 px-3 py-2 align-top text-left">What it is</th>
              <th className="border border-gray-300 px-3 py-2 align-top text-left">
                The mechanism that answers it
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2 align-top">
                <Link
                  href="/problems/media-cannot-organize-a-good-debate"
                  className="text-blue-700 hover:underline"
                >
                  The media cannot organize a good debate
                </Link>
              </td>
              <td className="border border-gray-300 px-3 py-2 align-top">
                <Link href="/problems/topic-drift" className="text-blue-700 hover:underline">
                  Topic drift
                </Link>{' '}
                and scattered, redundant arguments — conversations wander, and the good remarks are
                unfindable a week later.
              </td>
              <td className="border border-gray-300 px-3 py-2 align-top">
                <Link href="/solutions" className="text-blue-700 hover:underline">Order</Link>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 align-top">
                <Link href="/problems/clean-slate" className="text-blue-700 hover:underline">
                  For-profit media does not accumulate progress
                </Link>
              </td>
              <td className="border border-gray-300 px-3 py-2 align-top">
                The clean-slate problem — every news cycle restarts settled debates, because
                covering them fresh sells better than building on what was settled.
              </td>
              <td className="border border-gray-300 px-3 py-2 align-top">
                <Link href="/solutions" className="text-blue-700 hover:underline">
                  Order + automated scoring
                </Link>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 align-top">
                <Link href="/problems/no-truth-metric" className="text-blue-700 hover:underline">
                  It does not rank arguments or beliefs
                </Link>
              </td>
              <td className="border border-gray-300 px-3 py-2 align-top">
                No metric for truth, and echo chambers as the consequence — the only available
                metric is engagement, which reliably rewards tribal content over accurate content.
              </td>
              <td className="border border-gray-300 px-3 py-2 align-top">
                <Link href="/solutions" className="text-blue-700 hover:underline">
                  Automated scoring + structured pro/con framing
                </Link>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 align-top">
                <Link href="/problems/broad-or-deep" className="text-blue-700 hover:underline">
                  You cannot be broad and deep at the same time
                </Link>
              </td>
              <td className="border border-gray-300 px-3 py-2 align-top">
                Maximizing audience forces breadth over depth at every level; the fix separates the
                two — broad reach for readers, filtered contribution anyone can opt into, one small
                piece at a time.
              </td>
              <td className="border border-gray-300 px-3 py-2 align-top">
                <Link href="/solutions" className="text-blue-700 hover:underline">
                  The whole platform model
                </Link>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 align-top">
                <Link
                  href="/problems/no-reason-to-return"
                  className="text-blue-700 hover:underline"
                >
                  Even the right tools need good reasons to use them
                </Link>
              </td>
              <td className="border border-gray-300 px-3 py-2 align-top">
                Every Wikipedia-for-debates predecessor — Debatepedia, Arguman, Kialo — died because
                structured reasoning is hard and nobody had a reason to come back.
              </td>
              <td className="border border-gray-300 px-3 py-2 align-top">
                <Link href="/solutions" className="text-blue-700 hover:underline">
                  The market mechanism
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-2">The different incentive</h2>
      <p className="mb-4">
        The Idea Stock Exchange runs on two mechanisms, kept strictly apart. The first is the
        scoring engine: every belief, argument, and evidence score is computed from what is beneath
        it — the arguments and evidence on the page — with engagement nowhere in the calculation. A
        claim that goes viral gains nothing; a claim that survives scrutiny gains everything.
        Nothing is hand-entered, so if a score looks wrong, the only way to fix it is a better
        argument, not an edit.
      </p>
      <p className="mb-4">
        The second is the{' '}
        <Link href="/markets" className="text-blue-700 hover:underline">prediction market</Link>,
        which is the engagement engine — with the scoring engine as referee. People stake play-money
        positions on where a belief&apos;s score is heading, which supplies the reason to return
        that Debatepedia, Arguman, and Kialo never had. But bettors do not change the truth: no
        market price ever feeds back into a score, a firewall enforced by automated tests. How that
        differs from every existing prediction market is laid out in the{' '}
        <Link href="/prediction-markets-comparison" className="text-blue-700 hover:underline">
          comparison
        </Link>
        ; how both mechanisms fit into the larger design is on the{' '}
        <Link href="/solutions" className="text-blue-700 hover:underline">Solutions</Link> page.
      </p>

      <p className="mb-4">
        The full mechanism map — which structure answers which failure — is on the{' '}
        <Link href="/solutions" className="text-blue-700 hover:underline">Solutions</Link> page. If
        you want to help build the fix, start at{' '}
        <Link href="/contribute" className="text-blue-700 hover:underline">Contribute</Link> or the{' '}
        <a
          href="https://github.com/myklob/ideastockexchange"
          className="text-blue-700 hover:underline"
        >
          GitHub repository
        </a>
        .
      </p>
    </div>
  )
}
