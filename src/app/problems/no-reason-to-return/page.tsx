import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Even the Right Tools Need Good Reasons to Use Them — Idea Stock Exchange',
  description:
    'Why every structured-debate platform died of abandonment, and the structural answer: a prediction market as the engagement engine, firewalled from the scoring engine that acts as referee.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/problems" className="text-blue-700 hover:underline">The Problem</Link>
      {' > '}
      <strong>Even the Right Tools Need Good Reasons to Use Them</strong>
    </p>
  )
}

export default function NoReasonToReturnPage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">
        Even the Right Tools Need Good Reasons to Use Them
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        Every Wikipedia-for-debates predecessor died the same death: structured reasoning is hard
        work, the reward was abstract, and nobody had a reason to come back tomorrow. The Idea
        Stock Exchange&apos;s answer is an engagement engine that does not corrupt the referee: a
        play-money <Link href="/markets" className="text-blue-700 hover:underline">prediction
        market</Link> on where a belief&apos;s score is heading, kept strictly apart from the
        scoring engine that computes it.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The graveyard of good structure</h2>
      <p className="mb-4">
        Debatepedia mapped pro and con arguments onto wiki pages. Arguman drew formal argument
        trees with typed rebuttals. Kialo built clean, nested pro/con hierarchies with voting. All
        three got the structure roughly right, and all three met the same fate: a burst of early
        enthusiasm, a plateau, and a long quiet decline into abandonment. The pages did not get
        worse. People just stopped showing up.
      </p>
      <p className="mb-4">
        The failure was not the tools. It was the economics of attention. Structured reasoning is
        hard work &mdash; harder than posting a hot take &mdash; and the reward it offered was
        abstract: the satisfaction of a well-organized argument, visible mostly to the person who
        organized it. Nothing changed tomorrow because you contributed today. Nothing was riding on
        whether you came back. Good structure without an engagement engine is a library nobody
        visits.
      </p>
      <p className="mb-4">
        The attention platforms solved the engagement problem, decisively &mdash; and their
        solution poisoned the content. Outrage, novelty, and tribal signaling are superb at
        bringing people back and terrible at making anything true. Their engagement engine and
        their content ranking are the same machine: what spreads is what enrages, so what enrages
        is what ranks. The lesson from both graveyards is the same. A platform for reasoning needs
        an engagement engine as compelling as outrage, and it needs that engine to have no power
        whatsoever over what counts as a good argument. The trick is an engagement engine that
        does not corrupt the referee.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">What it costs</h2>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <strong>The best tools go unused.</strong> Every structured-debate platform to date has
          proven that being right about the format is not enough; without a return loop, the
          archive fossilizes.
        </li>
        <li>
          <strong>Effort has no payoff.</strong> The person who spends an evening steelmanning the
          other side gets the same nothing as the person who never showed up, so the evening goes
          to a platform that pays in dopamine instead.
        </li>
        <li>
          <strong>Attention defaults to outrage.</strong> When no reasoning platform can hold an
          audience, the platforms that can &mdash; the ones optimized for provocation &mdash;
          become the only venue where public arguments actually happen.
        </li>
        <li>
          <strong>Analyses stop improving.</strong> An argument map nobody revisits never absorbs
          the new study, the overlooked counterexample, or the better framing. Structure without
          traffic is a snapshot, not an analysis.
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-2">How the Idea Stock Exchange addresses it</h2>
      <p className="mb-4">
        The prediction market is the engagement engine. The scoring engine is the referee. The two
        are kept strictly apart.
      </p>
      <ul className="list-disc ml-6 mb-4 space-y-2">
        <li>
          <strong>A reason to return, priced in play money.</strong> On the{' '}
          <Link href="/markets" className="text-blue-700 hover:underline">markets</Link>, people
          stake play-money positions on where a belief&apos;s score will land at monthly epoch
          settlement. A position is a reason to come back tomorrow: the analysis your bet settles
          against is still moving, and the trader who finds the argument the crowd missed is the
          trader who profits. That makes reading the opposing side carefully &mdash; and hunting
          for the evidence everyone else overlooked &mdash; the profitable move, not the virtuous
          one.
        </li>
        <li>
          <strong>Bettors predict the truth; they do not vote on it.</strong> A market position is
          a forecast of what a continuously improving analysis of the arguments will reveal, scored
          against the belief&apos;s{' '}
          <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">
            truth score
          </Link>{' '}
          at settlement. No market price ever feeds back into a score. Scores are computed by{' '}
          <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
            ReasonRank
          </Link>{' '}
          from arguments and{' '}
          <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
            evidence
          </Link>{' '}
          alone &mdash; no engagement signal of any kind enters scoring, and a CI firewall test
          proves it on every build.
        </li>
        <li>
          <strong>The firewall is enforced in code, both directions.</strong> The CI source scan
          fails the build if market code can write to the argument graph or if scoring code can
          read market tables. Around settlement the graph freezes, and each monthly epoch is
          captured in an immutable, signed snapshot &mdash; see the{' '}
          <Link href="/prediction-markets-comparison" className="text-blue-700 hover:underline">
            prediction-markets comparison
          </Link>{' '}
          for how this differs from markets that let the price be the verdict. The permanent{' '}
          <Link href="/audit" className="text-blue-700 hover:underline">audit log</Link> records
          every score change with its trigger.
        </li>
        <li>
          <strong>The reading loop and the returning loop close on the same page.</strong> Every{' '}
          <Link href="/beliefs" className="text-blue-700 hover:underline">belief page</Link> links
          to any open market on its score and shows the score&apos;s full history &mdash; every
          change recorded with the argument or evidence that triggered it &mdash; so checking your
          position means rereading the debate, and rereading the debate means seeing exactly where
          a new contribution would move it.
        </li>
        <li>
          <strong>The only way to move the price is to improve the argument graph.</strong> You
          cannot buy a score, brigade a score, or hand-enter a score &mdash; the posting API
          rejects score fields outright. If you want the price to move your way, your one lever is
          to add the argument or the evidence that shifts the analysis. The engagement engine ends
          up funneling effort into exactly the work the referee rewards.
        </li>
      </ul>
      <p className="mb-4">
        The market mechanism is one pillar of the larger design &mdash; see the{' '}
        <Link href="/solutions" className="text-blue-700 hover:underline">solutions overview</Link>{' '}
        for how it fits alongside the scoring engine, and{' '}
        <Link href="/how-it-works" className="text-blue-700 hover:underline">How It Works</Link>{' '}
        for the full loop. Ready to place a first stake or post a first argument? Start at{' '}
        <Link href="/contribute" className="text-blue-700 hover:underline">contribute</Link>.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The payoff</h2>
      <p className="mb-4">
        The predecessors proved that structure alone empties out, and the attention platforms
        proved that engagement alone corrupts. Separating the two &mdash; a market that makes
        returning profitable, a referee that only ever reads the arguments &mdash; gets both
        without the poison: a debate archive people revisit daily for the same reason traders
        watch a ticker, where the only winning strategy is to make the analysis better.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Related</h2>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <Link href="/problems" className="text-blue-700 hover:underline">The Problem hub</Link>:
          where this failure sits in the larger diagnosis.
        </li>
        <li>
          <Link href="/problems/no-truth-metric" className="text-blue-700 hover:underline">
            No truth metric
          </Link>
          : the referee the markets settle against &mdash; without a computed score, there is
          nothing to bet on.
        </li>
        <li>
          <strong>This project is open source</strong>: the firewall tests, the scoring engine, and
          the market code are all inspectable at{' '}
          <a
            href="https://github.com/myklob/ideastockexchange"
            className="text-blue-700 hover:underline"
          >
            github.com/myklob/ideastockexchange
          </a>
          .
        </li>
      </ul>
    </div>
  )
}
