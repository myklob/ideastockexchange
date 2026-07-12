import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Solutions — Idea Stock Exchange',
  description:
    'The problem-to-mechanism map: how canonical pages, automated scoring, structured pro/con framing, the platform model, and a firewalled prediction market answer the five failures of attention-funded media.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <strong>Solutions</strong>
    </p>
  )
}

export default function SolutionsPage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">Solutions</h1>
      <p className="text-lg text-gray-600 mb-6">
        The five failures of attention-funded media catalogued on the{' '}
        <Link href="/problems" className="text-blue-700 hover:underline">Problems</Link> page are
        answered by mechanisms, not moderation. No editor decides what is on topic, what is true, or
        who may speak; structure does. This page maps each mechanism to the place it runs in the
        product, so every claim below is a link to a live surface, not a promise.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Order</h2>
      <p className="mb-4">
        Every question gets exactly one permanent home: one canonical page per{' '}
        <Link href="/debate-topics" className="text-blue-700 hover:underline">topic</Link> and one
        per <Link href="/beliefs" className="text-blue-700 hover:underline">belief</Link>. Arguments
        made anywhere on the site attach to those pages, so a good point made once is findable
        forever instead of scrolling away in a dead thread. Full-text{' '}
        <Link href="/search" className="text-blue-700 hover:underline">search</Link> covers all of
        it.
      </p>
      <p className="mb-4">
        Drift is handled twice. It is scored away by{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
          linkage scores
        </Link>
        , which price how directly each argument bears on its conclusion — a true-but-irrelevant
        tangent scores zero and sinks. And it is blocked at the door by the drift guard: every
        submission is scanned against the arguments already on the page, and a near-restatement must
        acknowledge the existing row before it posts. Overlap that does get through is stored as an
        equivalence candidate and priced down by the{' '}
        <Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">
          uniqueness discount
        </Link>
        , so the thousandth restatement contributes nothing new, with merge verdicts tracked in{' '}
        <Link href="/equivalence" className="text-blue-700 hover:underline">
          equivalence analyses
        </Link>
        .
      </p>
      <p className="mb-4">
        This answers{' '}
        <Link
          href="/problems/media-cannot-organize-a-good-debate"
          className="text-blue-700 hover:underline"
        >
          the media cannot organize a good debate
        </Link>{' '}
        and, because canonical pages persist across news cycles,{' '}
        <Link href="/problems/clean-slate" className="text-blue-700 hover:underline">
          the clean-slate problem
        </Link>
        .
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Automated scoring</h2>
      <p className="mb-4">
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
          ReasonRank
        </Link>{' '}
        computes every score from the arguments and evidence beneath it. Each argument&apos;s
        contribution is impact = sign &times; truth &times; |linkage| &times; importance &times;
        uniqueness, and belief scores roll up from there. The audit lock guarantees the numbers mean
        something: no score can be hand-entered anywhere in the system — the posting API rejects
        score fields outright — and every change lands in the permanent{' '}
        <Link href="/audit" className="text-blue-700 hover:underline">audit log</Link>. If a score
        looks wrong, the only remedy is a better argument.
      </p>
      <p className="mb-4">
        Every belief page shows its score history: each change is recorded with the argument or
        evidence that triggered it, so debates accumulate visibly instead of restarting from zero.
        And engagement appears nowhere in the calculation — the scoring code provably never reads
        views, likes, or followers, an isolation enforced by a CI firewall test rather than a
        policy document.
      </p>
      <p className="mb-4">
        This answers{' '}
        <Link href="/problems/clean-slate" className="text-blue-700 hover:underline">
          the clean-slate problem
        </Link>{' '}
        and{' '}
        <Link href="/problems/no-truth-metric" className="text-blue-700 hover:underline">
          the missing truth metric
        </Link>
        .
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Structured pro/con framing</h2>
      <p className="mb-4">
        Every belief page carries symmetric Reasons to Agree and Reasons to Disagree tables, ranked
        by score, so the strongest case on each side is always at the top and neither side can be
        quietly starved of space. Beliefs are pushed toward testability by their falsifiability and
        evidence sections, backed by{' '}
        <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
          evidence scores
        </Link>{' '}
        and{' '}
        <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">
          truth scores
        </Link>
        . Each belief page also lists where the belief is used as a reason in other debates, so
        conclusions propagate instead of being re-argued.
      </p>
      <p className="mb-4">
        Engaging the best version of the other side is not left to good manners. On high-stakes
        beliefs, speed bumps require a steelman acknowledgment and a principle-consistency check
        before a contribution posts. This answers{' '}
        <Link href="/problems/no-truth-metric" className="text-blue-700 hover:underline">
          the missing truth metric
        </Link>{' '}
        and the echo chambers it breeds.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The platform model</h2>
      <p className="mb-4">
        Attention-funded media must choose between reaching everyone and going deep for a few. The
        platform model separates the two: reading is broad — every canonical page is public and
        permanent — while contribution is filtered and granular. Nobody has to write a treatise; the{' '}
        <Link href="/contribute" className="text-blue-700 hover:underline">contribute</Link>{' '}
        on-ramp lists every graduated pathway, from rating a single linkage to drafting a full
        analysis, one small piece at a time.
      </p>
      <p className="mb-4">
        The filters are structural, not human: the audit lock, the drift guard, and the speed bumps
        do the work gatekeepers do elsewhere, without anyone holding the gate. This answers{' '}
        <Link href="/problems/broad-or-deep" className="text-blue-700 hover:underline">
          the broad-or-deep tradeoff
        </Link>
        .
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The market mechanism</h2>
      <p className="mb-4">
        Structured reasoning is work, and every predecessor that asked for the work without paying
        for it died. Here the payment is a{' '}
        <Link href="/markets" className="text-blue-700 hover:underline">
          play-money prediction market
        </Link>{' '}
        on where each belief&apos;s score will land at settlement: if you think the analysis is
        missing something, stake a position, add the missing argument, and profit when the score
        moves. The market is the engagement engine; the scoring engine is the referee. Settlement
        runs on monthly epochs — an immutable snapshot of the argument graph, signed by the oracle,
        freezes the state that pays out — and belief pages link straight to any open market on their
        score. How this differs from every existing prediction market is laid out in the{' '}
        <Link href="/prediction-markets-comparison" className="text-blue-700 hover:underline">
          comparison
        </Link>
        .
      </p>
      <p className="mb-4">
        This answers{' '}
        <Link href="/problems/no-reason-to-return" className="text-blue-700 hover:underline">
          the missing reason to return
        </Link>
        .
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The two engines, kept apart</h2>
      <p className="mb-4">
        Everything above reduces to two engines and a wall between them. The scoring engine computes
        truth from arguments and evidence, and nothing else. The market engine pays attention back
        to whoever improves the analysis. No market price ever feeds a score, and no score is ever
        hand-entered — and both invariants are enforced as CI source-scan tests that fail the build
        on violation, not as policy documents that ask nicely. How the pieces fit together
        end-to-end is on{' '}
        <Link href="/how-it-works" className="text-blue-700 hover:underline">How It Works</Link>.
      </p>
      <p className="mb-4">
        If you want to help build this, start at{' '}
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
