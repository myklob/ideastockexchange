import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Combine Similar Beliefs — Idea Stock Exchange',
  description:
    'Why scattered restatements of the same belief stall public reasoning, and how the Idea Stock Exchange merges duplicates so arguments and evidence accumulate in one place.',
}

// ─── Sub-components ────────────────────────────────────────────────────────

function Breadcrumb() {
  return (
    <p className="text-right text-sm italic text-gray-600 mb-6">
      <Link href="/" className="text-blue-700 hover:underline">Home</Link>
      {' > '}
      <Link href="/algorithms" className="text-blue-700 hover:underline">Algorithms</Link>
      {' > '}
      <strong>Combine Similar Beliefs</strong>
    </p>
  )
}

function CenteredCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f0f3f6] px-5 py-5 my-6 rounded text-center">
      {children}
    </div>
  )
}

function AccentCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f0f3f6] border-l-4 border-[#4a6fa5] px-5 py-5 my-6 rounded-r text-center">
      {children}
    </div>
  )
}

const fragments = [
  '"Fords are garbage."',
  '"Ford trucks break down all the time."',
  '"Don’t buy a Ford if you want to actually drive it."',
  '"F-150s have transmission issues from day one."',
  '"My uncle’s Ford left him stranded twice in one month."',
]

const ctaCards: Array<{
  emoji: string
  title: string
  cta: string
  href?: string
}> = [
  {
    emoji: '\u{1F500}',
    title: 'Spot Duplicates?',
    cta: 'Propose a Merge →',
    href: '/algorithms/belief-equivalency',
  },
  {
    emoji: '\u{1F333}',
    title: 'Got a Counter?',
    cta: 'Add to Argument Tree →',
    href: '/beliefs',
  },
  {
    emoji: '\u{1F50D}',
    title: 'Better Evidence?',
    cta: 'Contribute Sources →',
  },
  {
    emoji: '\u{1F4A1}',
    title: 'Bigger Ideas?',
    cta: 'Contact Directly →',
  },
]

// ─── Page ──────────────────────────────────────────────────────────────────

export default function CombineSimilarBeliefsPage() {
  return (
    <main className="max-w-[960px] mx-auto px-4 py-8 text-[#222]">
      <Breadcrumb />

      <h1 className="text-3xl font-bold mb-2 leading-tight">
        <span aria-hidden="true">&#x1F9E0; </span>Combine Similar Beliefs
      </h1>
      <p className="text-[1.1rem] italic text-gray-600 mb-6">
        (AKA: Stop Reposting the Same Take Forever)
      </p>

      <p className="mb-4">
        The internet&rsquo;s greatest strength is also its greatest curse: it can generate infinite
        variations of the exact same opinion. But it almost never adds them up. We fight the same
        battles over and over, scattered across threads, timelines, and forums, each time reinventing
        the wheel with slightly different wording.
      </p>

      <p className="mb-6">
        That is why the core rule here is simple: <strong>combine similar beliefs</strong>. Not to
        silence anyone. Not to &ldquo;clean up.&rdquo; But to stop wasting collective human
        intelligence on duplicate labor.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section: Ford example ─────────────────────────────────── */}
      <h2 className="text-2xl font-bold mt-8 mb-3">
        <span aria-hidden="true">&#x1F525; </span>
        Real-World Example: The Eternal &ldquo;Ford Trucks Are Junk&rdquo; War
      </h2>

      <p className="mb-4">
        Online, one belief mutates into thousands of versions. The same complaint about Ford
        reliability shows up everywhere, in slightly different language each time:
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-[#f0f3f6]">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left w-1/2">
                The Chaos (10,000 Skirmishes)
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left w-1/2">
                The Solution (One Page)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-3 align-top">
                <ul className="space-y-1">
                  {fragments.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="italic text-xs text-gray-600 mt-3">
                  Each version spawns its own comment section, memes, and re-litigation of
                  repair-cost statistics and warranty terms.
                </p>
              </td>
              <td className="border border-gray-300 px-3 py-3 align-top">
                <p className="mb-2">We map them all to one core belief:</p>
                <p className="font-bold text-[1.05rem] text-center bg-white border border-gray-300 rounded px-3 py-3 my-2">
                  &ldquo;Ford trucks have below-average mechanical reliability.&rdquo;
                </p>
                <p>
                  Instead of fragmented battles, we put all variations on one page and let the
                  arguments accumulate.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mb-6">
        This is the heart of <strong>One Page Per Topic</strong>: a shared, living map where effort
        compounds instead of evaporates. The same logic applies to any contested claim, from
        &ldquo;Ford trucks are unreliable&rdquo; to &ldquo;Minimum wage causes unemployment&rdquo; to
        &ldquo;Climate change is human-caused.&rdquo; The mechanism does not care what the belief is
        about; it just stops the same argument from being rebuilt from scratch every time it gets
        brought up.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section: Paragraph problem ────────────────────────────── */}
      <h2 className="text-2xl font-bold mt-8 mb-3">
        <span aria-hidden="true">&#x274C; </span>
        The Paragraph Problem: Why Text Blobs Fail Us
      </h2>

      <p className="mb-4">
        Most platforms treat opinions as free-form paragraphs. It feels natural, until you try to
        learn anything from them. Paragraphs are great for storytelling and vibes. They are terrible
        as a data structure for knowledge. Core claims get buried in anecdotes, sarcasm, or rage. You
        cannot reliably extract what someone actually believes. Nuanced positions (&ldquo;sort
        of,&rdquo; &ldquo;in some cases,&rdquo; &ldquo;depending on&rdquo;) get lost in the noise.
        And arguments cannot be compared, ranked, or improved over time, because there is no
        canonical version of any of them to improve.
      </p>

      <p className="font-bold text-[1.05rem] mb-4">
        A paragraph is like a burrito: delicious, but impossible to systematically compare the beans
        across a million other burritos.
      </p>

      <p className="mb-6">
        To make progress, beliefs need to be standalone, structured objects, so we can attach clear
        reasons, evidence, and counterpoints that persist and improve.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section: Not censorship ────────────────────────────────── */}
      <h2 className="text-2xl font-bold mt-8 mb-3">
        <span aria-hidden="true">&#x2705; </span>
        We Don&apos;t Censor Weak Beliefs, We Expose Them
      </h2>

      <p className="mb-4">
        Important clarification: combining duplicates is not censorship. We do not delete bad takes.
        We do not ban edgy opinions. We do not silence anyone. We do something far more powerful: we
        let weak beliefs lose in public, transparently.
      </p>

      <AccentCallout>
        <p className="font-bold text-[1.05rem] m-0">
          Strong ideas rise because the best arguments and evidence are visible.
          <br />
          Weak ideas sink because their flaws are laid bare, not hidden.
        </p>
      </AccentCallout>

      <p className="mb-6">
        Scoring is objective and structured. <strong>Truth Scores</strong> ask whether the claim is
        factually accurate and logically sound.{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
          Linkage Scores
        </Link>{' '}
        ask whether each reason actually supports the claim it is offered for.{' '}
        <strong>Importance Scores</strong> ask, if true, how much it actually matters. No gatekeepers
        needed. Just better visibility of the best reasoning.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section: Enshittification ─────────────────────────────── */}
      <h2 className="text-2xl font-bold mt-8 mb-3">
        <span aria-hidden="true">&#x1F4A9; </span>
        The Enshittification Loop and How We Break It
      </h2>

      <p className="mb-6">
        Today&rsquo;s platforms optimize for endless engagement, not collective understanding. The
        incentives reward outrage over nuance, hot takes over insight, and signaling over truth. We
        end up on an argument treadmill: same beliefs reposted forever, zero forward motion.
      </p>

      <hr className="my-6 border-gray-300" />

      {/* ── Section: Alternative ───────────────────────────────────── */}
      <h2 className="text-2xl font-bold mt-8 mb-3">
        <span aria-hidden="true">&#x1F680; </span>
        The Alternative: A Belief-Based Internet
      </h2>

      <p className="mb-4">
        Imagine a web where beliefs are submitted as clear, standalone claims, where reasons to agree
        and disagree are attached directly and persistently, where near-duplicates are merged so
        effort stacks instead of scatters, where evidence accumulates in one place over years, and
        where weak positions are not banned but simply out-argued.
      </p>

      <CenteredCallout>
        <p className="text-[1.05rem] mb-2">
          This is not another debate club. It is <strong>organized collective intelligence</strong>.
        </p>
        <p className="font-bold m-0">
          The biggest barrier to better discourse is not bad opinions. It is the broken system we are
          forced to have them in.
        </p>
      </CenteredCallout>

      <hr className="my-8 border-gray-300" />

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold text-center mt-8 mb-4">
        <span aria-hidden="true">&#x1F4EC; </span>
        Ready to Help Build It?
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {ctaCards.map((card) => {
          const body = (
            <>
              <div className="text-4xl mb-2" aria-hidden="true">
                {card.emoji}
              </div>
              <div className="font-bold mb-2">{card.title}</div>
              <div className="text-blue-700 text-sm">{card.cta}</div>
            </>
          )
          const className =
            'block border border-gray-300 bg-[#f0f3f6] rounded p-4 text-center hover:bg-[#e7ecf2] transition-colors'
          return card.href ? (
            <Link key={card.title} href={card.href} className={className}>
              {body}
            </Link>
          ) : (
            <div key={card.title} className={className}>
              {body}
            </div>
          )
        })}
      </div>

      <p className="text-center italic text-gray-600 mb-8">
        Together, we turn endless repetition into actual progress.
      </p>

      <hr className="my-8 border-gray-300" />

      {/* ── Related ────────────────────────────────────────────────── */}
      <div className="bg-[#eef5ff] border-l-4 border-[#3366cc] px-4 py-4 rounded-r">
        <p className="font-bold mb-2">Related pages:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <Link href="/algorithms/belief-equivalency" className="text-blue-700 hover:underline">
              Belief Equivalency Scores
            </Link>{' '}
            &mdash; the technical mechanism for detecting when two differently-worded beliefs are
            making the same claim
          </li>
          <li>
            <Link href="/algorithms/strong-to-weak" className="text-blue-700 hover:underline">
              Strong-to-Weak Spectrum
            </Link>{' '}
            &mdash; how the same belief at different intensities relates on a single axis
          </li>
          <li>
            <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">
              Linkage Scores
            </Link>{' '}
            &mdash; how arguments connect to the conclusions they&rsquo;re offered for
          </li>
          <li>
            <Link href="/beliefs" className="text-blue-700 hover:underline">
              Belief Pages
            </Link>{' '}
            &mdash; browse canonical belief pages and their argument trees
          </li>
        </ul>
      </div>
    </main>
  )
}
