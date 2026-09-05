import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fallacy Detection — Idea Stock Exchange',
  description:
    'Fallacy accusations as scored arguments: the required accusation template, the 60% consensus bar, the validity ladder, and the cross-partisan credibility multiplier.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'
const code = 'bg-gray-100 border border-gray-300 px-4 py-3 font-mono my-4 rounded text-sm'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms</Link>
      {' > '}
      <strong>Fallacy Detection</strong>
    </p>
  )
}

export default function FallacyDetectionPage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">Fallacy Detection</h1>
      <p className="text-lg text-gray-600 mb-6">
        A fallacy accusation is an argument, not a weapon. It carries the same burdens as any
        argument — and pays the same price when it loses.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The problem: fallacy calling is tribal</h2>
      <p className="mb-4">
        On every platform, &ldquo;STRAW MAN!&rdquo; is a comment, not a case. Most accusations are
        wrong, none require reasoning, nobody is accountable for false ones, and people spot
        fallacies fluently in opposing arguments while staying blind to the same patterns on
        their own side. The result is that actual logical validity becomes noise: an accusation
        costs nothing, so it carries no information.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The accusation template</h2>
      <p className="mb-2">
        Here, filing a fallacy claim requires the full template — the API rejects anything less
        (<code className="bg-gray-100 px-1 rounded">POST /api/arguments/[id]/fallacy-claims</code>):
      </p>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li><strong>Type</strong> — a catalog entry (false dilemma, straw man, cherry-picking, &hellip;), which fixes what a confirmed claim damages and how hard.</li>
        <li><strong>Quote</strong> — the exact text that commits the fallacy.</li>
        <li><strong>Explanation</strong> — why the quote qualifies as this type.</li>
        <li><strong>Missing elements</strong> — what is excluded, misrepresented, or unsupported.</li>
        <li><strong>Evidence</strong> — exhibits, mandatory for types whose case needs them: a straw-man claim must link the opponent&apos;s actual position; a false-dilemma claim must list the excluded alternatives; a cherry-picking claim must link the contradicting evidence.</li>
        <li><strong>Consequences</strong> — how the fallacy affects the argument&apos;s validity if confirmed.</li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-2">Filing changes nothing</h2>
      <p className="mb-4">
        A filed claim enters the target&apos;s{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">linkage sub-debate</Link>{' '}
        as a <em>draft</em> counter-argument. Drafts are displayed but never counted — the same
        rule the automated pattern detector has always lived under. Others then argue for and
        against the accusation itself, and vote. Only weighted community agreement of at least
        60% (minimum three votes) confirms a claim; 60% the other way rejects it. Consensus can
        move in both directions as votes accumulate, and the counter-argument&apos;s status
        tracks it.
      </p>
      <div className={code}>
        open &rarr; confirmed: counter-argument published, scores propagate<br />
        open &rarr; rejected: the accusation failed its own debate; the target is untouched
      </div>

      <h2 className="text-xl font-bold mt-8 mb-2">What confirmation costs the target</h2>
      <p className="mb-2">
        Each catalog entry targets the factor that fallacy actually damages: relevance fallacies
        (ad hominem, whataboutism) draft against the linkage; formal fallacies (false dilemma,
        slippery slope) against logical validity; evidence fallacies (cherry-picking, anecdote)
        against{' '}
        <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">evidence quality</Link>.
        Confirmed formal fallacies feed the validity ladder:
      </p>
      <div className={code}>
        no confirmed fallacy &rarr; 0.95&ensp;·&ensp;one minor &rarr; 0.75&ensp;·&ensp;one major
        &rarr; 0.45&ensp;·&ensp;two or more &rarr; 0.25
      </div>
      <p className="mb-4">
        The multiplication is the point: great evidence cannot rescue broken reasoning. And the
        ladder rewards repair — the same evidence restated <em>without</em> the false binary
        scores higher than it did with it, so removing the fallacy is the profitable move.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Cross-partisan calibration</h2>
      <p className="mb-2">
        Every voter&apos;s weight on fallacy claims is their credibility multiplier, computed
        from their track record and clamped to [0.3, 1.4]:
      </p>
      <div className={code}>
        credibility = clamp(accuracyFactor &times; balanceFactor)<br />
        accuracyFactor = 2 &times; (claims upheld / claims resolved)<br />
        balanceFactor&ensp; = 0.4 + 0.9 &times; (side balance of who you flag)
      </div>
      <p className="mb-4">
        A caller whose claims the community upholds 82% of the time and who flags both sides of
        debates carries well over neutral weight. A caller at 40% accuracy who only ever flags
        one side sinks toward the floor. A new user with no history is exactly 1.0 — no
        information, no adjustment. Accuracy alone cannot buy influence for a one-sided caller:
        keeping your weight requires spotting fallacies in arguments you agree with, too.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Why mass accusation fails</h2>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>Each claim requires the full template — reasoning and exhibits, not a button.</li>
        <li>Each claim must <em>win its own debate</em> at 60% weighted agreement.</li>
        <li>Coordinated one-sided accusers arrive pre-discounted by the balance factor.</li>
        <li>Every rejected claim permanently lowers the accuser&apos;s accuracy rate.</li>
      </ul>
      <p className="mb-4">
        Gaming the system costs more than making good arguments — which is the design goal of
        every score here.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The automated detector</h2>
      <p className="mb-4">
        Agent-submitted arguments are also scanned by a pattern detector (ad hominem slurs,
        &ldquo;everyone knows&rdquo;, correlation-as-causation, universals, isolated-study and
        anecdote framings). Detections use the same catalog and the same rule: each becomes a
        draft counter-argument attributed to the system detector agent, reviewable like anything
        else. No score is ever docked because a detector fired.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Why this needs grouping</h2>
      <p className="mb-4">
        Fallacy detection only accumulates when the same debate is not fragmented across a
        thousand pages. Because{' '}
        <Link href="/algorithms/belief-equivalency" className="text-blue-700 hover:underline">belief equivalency</Link>{' '}
        and{' '}
        <Link href="/algorithms/combine-similar-beliefs" className="text-blue-700 hover:underline">merging</Link>{' '}
        keep one page per claim, a fallacy confirmed once stays confirmed for the whole cluster —
        nobody resets the debate by opening a fresh thread. Restatements of an argument face the
        same consolidation: the redundancy scan proposes pairs, the community votes
        (<code className="bg-gray-100 px-1 rounded">POST /api/equivalence-candidates/[id]/votes</code>),
        and 60% agreement groups them while the{' '}
        <Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">uniqueness discount</Link>{' '}
        prices whatever overlap remains.
      </p>

      <p className="mt-8 text-sm text-gray-600">
        Related: <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">Truth Scores</Link> ·{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">Linkage Scores</Link> ·{' '}
        <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">Evidence Scores</Link> ·{' '}
        <Link href="/algorithms/belief-equivalency" className="text-blue-700 hover:underline">Belief Equivalency</Link>
      </p>
    </div>
  )
}
