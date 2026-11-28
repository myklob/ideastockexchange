import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For-Profit Media Does Not Accumulate Progress — Idea Stock Exchange',
  description:
    'Why every news cycle restarts settled debates from zero, and the structural answer: permanent canonical pages, score history, immutable epoch snapshots, and a refutation that stays refuted.',
}

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/problems" className="text-blue-700 hover:underline">The Problem</Link>
      {' > '}
      <strong>For-Profit Media Does Not Accumulate Progress</strong>
    </p>
  )
}

export default function CleanSlatePage() {
  return (
    <div className={container}>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-3">For-Profit Media Does Not Accumulate Progress</h1>
      <p className="text-lg text-gray-600 mb-6">
        <strong>The clean-slate problem</strong>: every news cycle restarts settled debates from
        zero, because covering a question fresh sells ads better than building on what was settled
        last time. The Idea Stock Exchange&apos;s answer is structural: permanent canonical pages
        that accumulate every argument, scores that update instead of restarting, and a record that
        makes forgetting impossible.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">Why every cycle starts from zero</h2>
      <p className="mb-4">
        Attention media earns nothing from a debate it already covered. A question presented fresh
        &mdash; as if nobody had ever examined it &mdash; pulls a bigger audience than a question
        presented as mostly settled, because &ldquo;mostly settled&rdquo; is a reason to change the
        channel. So each cycle re-opens the same questions with the same talking points, and
        whatever ground was gained last time is quietly abandoned.
      </p>
      <p className="mb-4">
        This is not an accident of laziness; it is the business model. Institutional memory is an
        anti-goal for attention media, because a returning viewer who remembers the last round is a
        viewer who leaves. The format is optimized for the viewer who arrives knowing nothing, and
        it re-manufactures that viewer every cycle by never carrying anything forward.
      </p>
      <p className="mb-4">
        The result is repetition without progress. Billions of disconnected discussions repeat the
        same debates daily &mdash; on air, in threads, around dinner tables &mdash; and the
        conclusions reached in one never carry over to the next. Humanity keeps holding the same
        argument and keeps throwing away the transcript.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">What it costs</h2>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <strong>Society re-litigates instead of refining.</strong> Every cycle spends its energy
          re-establishing what the last cycle already established, so the debate never advances past
          its opening arguments.
        </li>
        <li>
          <strong>Expertise resets each cycle.</strong> The careful distinctions and hard-won
          context built up in one round of coverage evaporate before the next, and the discussion
          returns to its crudest form.
        </li>
        <li>
          <strong>Refuted claims return unrefuted.</strong> A claim demolished this week comes back
          next week as if the demolition never happened, because nothing connects the rerun to the
          refutation.
        </li>
        <li>
          <strong>Progress becomes impossible by construction.</strong> A process that starts from a
          clean slate every time can repeat forever without concluding anything.
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-2">How the Idea Stock Exchange addresses it</h2>
      <ul className="list-disc ml-6 mb-4 space-y-2">
        <li>
          <strong>Permanent pages accumulate every argument.</strong> One canonical page per{' '}
          <Link href="/beliefs" className="text-blue-700 hover:underline">belief</Link> and per{' '}
          <Link href="/debate-topics" className="text-blue-700 hover:underline">topic</Link> holds
          every reason to agree and disagree ever submitted. The next cycle does not start a new
          conversation; it lands on the old one, with everything already on the table.
        </li>
        <li>
          <strong>Scores update instead of restarting.</strong> Every change to a belief&apos;s
          score is recorded with the argument or evidence that triggered it and shown as score
          history on the belief page, so the debate visibly accumulates. Progress is a curve you can
          inspect, not a memory you have to trust.
        </li>
        <li>
          <strong>Each month&apos;s state is frozen and reproducible.</strong> Monthly immutable
          epoch snapshots capture the scored graph behind every traded belief to the decimal, and the{' '}
          <Link href="/markets" className="text-blue-700 hover:underline">prediction markets</Link>{' '}
          settle against them. Nobody can quietly rewrite where the debate stood.
        </li>
        <li>
          <strong>Every move is logged with its rationale.</strong> The permanent{' '}
          <Link href="/audit" className="text-blue-700 hover:underline">audit log</Link> records
          every change and why it happened, so the history of the debate is as public as its current
          state.
        </li>
        <li>
          <strong>Refuted evidence stays refuted.</strong> When a source is falsified, its{' '}
          <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">
            evidence score
          </Link>{' '}
          is zeroed and the retraction propagates to every score built on it. A demolished claim
          cannot return next week at full strength, because the demolition is wired into the math.
        </li>
      </ul>
      <p className="mb-4">
        The mechanisms doing the work here are{' '}
        <Link href="/solutions" className="text-blue-700 hover:underline">Order</Link> and{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">
          automated scoring
        </Link>
        : a permanent structure for the arguments, and a score that responds to them and only them.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-2">The payoff</h2>
      <p className="mb-4">
        A debate that accumulates behaves like science instead of like weather. Each cycle starts
        where the last one ended, refuted claims stay down, and the question gets sharper instead of
        merely louder. The clean slate stops being the default, and progress stops being optional.
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
          : the broader failure this one compounds.
        </li>
        <li>
          <Link href="/problems/topic-drift" className="text-blue-700 hover:underline">
            Topic drift
          </Link>
          : the same failure inside one conversation &mdash; the clean slate is drift across whole
          news cycles.
        </li>
      </ul>
    </div>
  )
}
