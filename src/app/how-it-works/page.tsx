import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'How It Works — The Engine of Reason — Idea Stock Exchange',
  description:
    'How structured argument, evidence-weighted ranking, and one permanent page per idea turn scattered opinion into cumulative knowledge.',
}

export const dynamic = 'force-dynamic'

const container = 'max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]'
const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'

interface LiveExample {
  slug: string
  statement: string
  net: number
  topClaim: string
  topImpact: number
}

/** A live engine readout for the status box — the placeholders became scores. */
async function liveExample(): Promise<LiveExample | null> {
  try {
    const belief = await prisma.belief.findUnique({
      where: { slug: 'universal-basic-income-should-be-implemented' },
      select: {
        slug: true,
        statement: true,
        positivity: true,
        arguments: {
          where: { status: 'published' },
          orderBy: { impactScore: 'desc' },
          take: 1,
          select: { claim: true, impactScore: true, belief: { select: { statement: true } } },
        },
      },
    })
    if (!belief || belief.arguments.length === 0) return null
    const top = belief.arguments[0]
    return {
      slug: belief.slug,
      statement: belief.statement,
      net: belief.positivity,
      topClaim: top.claim ?? top.belief.statement,
      topImpact: top.impactScore,
    }
  } catch {
    return null
  }
}

export default async function HowItWorksPage() {
  const example = await liveExample()

  return (
    <div className={container}>
      <p className="text-right text-sm italic text-gray-600 mb-6">
        <Link href="/" className="text-blue-700 hover:underline">Home</Link>
        {' › '}
        <Link href="/beliefs" className="text-blue-700 hover:underline">Topics</Link>
        {' › '}
        <strong>How It Works</strong>
      </p>

      <h1 className="text-3xl font-bold mb-2">The Engine of Reason: How the Idea Stock Exchange Works</h1>
      <p className="text-lg text-gray-600 mb-6">
        How structured argument, evidence-weighted ranking, and one permanent page per idea turn
        scattered opinion into cumulative knowledge.
      </p>

      <div className="bg-gray-50 border-l-4 border-gray-500 px-4 py-3 mb-5">
        <p>
          <strong>Where this stands, honestly.</strong> The method on this page is real and the
          site you are reading runs it. The scoring engine computes every number: each
          argument&apos;s impact is sign &times; truth &times; linkage &times; importance &times;
          uniqueness, recursively, and posting new content propagates through every dependent
          conclusion automatically. Every score is clickable — the click-into-the-score
          interaction this page used to promise is live, as are the conflict-resolution pipeline
          and the posting speed bumps on high-stakes beliefs.{' '}
          {example ? (
            <>
              For instance, right now the engine scores{' '}
              <Link href={`/beliefs/${example.slug}`} className="text-blue-700 hover:underline">
                {example.statement}
              </Link>{' '}
              at a net of <strong>{example.net >= 0 ? '+' : ''}{example.net.toFixed(1)}</strong>,
              led by &ldquo;{example.topClaim}&rdquo; (impact{' '}
              {example.topImpact >= 0 ? '+' : ''}{example.topImpact.toFixed(1)}) — live output,
              not a bracketed placeholder.
            </>
          ) : (
            <>
              Numbers on belief pages are engine output, not hand-typed placeholders; seed the
              database to see live examples.
            </>
          )}{' '}
          What remains early is scale: the graph is young, and a young graph&apos;s scores are
          only as good as the arguments on it. We do not pretend otherwise.
        </p>
      </div>

      <div className="bg-gray-50 border-l-4 border-gray-300 px-4 py-3 mb-6 italic">
        <p>
          &ldquo;No concept you form is valid unless you integrate it without contradiction into
          the sum of human knowledge.&rdquo; A modified version of a line from Ayn Rand, and as
          good a one-sentence statement of the whole project as any.
        </p>
      </div>

      <hr className="my-8" />

      <h2 className="text-2xl font-bold mb-3">1. The Core Problem: The Chaos of Threads</h2>
      <p className="mb-4">
        The flaw in the modern internet is not that people are stupid. It is structural. Bad
        arguments are never actually defeated, they just move to a new thread. Because every
        discussion lives on its own disconnected page, humanity has no long-term memory for
        debate. We refute the same nonsense every morning, forever, like a civilization with
        amnesia. The full diagnosis — why attention-funded platforms select for exactly these
        failures — lives on{' '}
        <Link href="/problems" className="text-blue-700 hover:underline">The Problem</Link>, with
        the mechanism map on{' '}
        <Link href="/solutions" className="text-blue-700 hover:underline">Solutions</Link>.
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={TH}>Format</th>
              <th className={TH}>Structural Flaw</th>
              <th className={TH}>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}>Forums and social media</td>
              <td className={TD}>Topic drift. Anyone can change the subject in one reply. It is a car with fifty steering wheels.</td>
              <td className={TD}>Endless noise, no resolution.</td>
            </tr>
            <tr>
              <td className={TD}>Chat rooms</td>
              <td className={TD}>Amnesia. The discussion resets to zero every time someone new walks in.</td>
              <td className={TD}>The same arguments, repeated forever.</td>
            </tr>
            <tr>
              <td className={TD}>News media</td>
              <td className={TD}>Fragmentation. Information is siloed to manufacture conflict, not to resolve it.</td>
              <td className={TD}>Echo chambers and polarization.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mb-4">
        The fix is almost boringly simple to state. There should be{' '}
        <Link href="/beliefs" className="text-blue-700 hover:underline">one page per topic</Link>.
        When an argument is debunked there, it stays debunked, and the next person who shows up
        starts from the current state of the evidence instead of from scratch.
      </p>

      <hr className="my-8" />

      <h2 className="text-2xl font-bold mb-3">2. The Solution: Structured Argumentation</h2>
      <p className="mb-4">
        The Idea Stock Exchange replaces the linear thread with a recursive argument tree.
        Instead of a comment box where remarks pile up and scroll away, every belief has a
        structured page, and you contribute by acting on its logic directly rather than talking
        near it.
      </p>
      <p className="mb-4">
        That means two kinds of moves. You <strong>add a row</strong> — a new reason to agree or
        disagree, through the form on every belief page. Or you{' '}
        <strong>challenge a number</strong>. Every score on the page, including{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">linkage</Link>,{' '}
        <Link href="/algorithms/objective-criteria" className="text-blue-700 hover:underline">objective criteria</Link>, and{' '}
        <Link href="/algorithms/importance-score" className="text-blue-700 hover:underline">importance</Link>, is a
        doorway. Click it and you drop into the sub-debate that produced it, where you post
        evidence that strengthens or weakens the claim, and every conclusion that depends on it
        updates. The impact value on each argument row opens a provenance page showing the full
        factor-by-factor derivation — truth, linkage, importance, uniqueness — each factor
        itself a door.
      </p>

      <hr className="my-8" />

      <h2 className="text-2xl font-bold mb-3">3. The Database: A Family Tree of Ideas</h2>
      <p className="mb-4">
        Under the hood, the structure is a genealogy chart, except it tracks logic instead of
        people. Arguments are parents that combine to support a conclusion. Those conclusions
        become parents in turn, premises for larger ideas built on top of them. The link between
        any two of them is not a bare hyperlink, it carries a{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">linkage score</Link>{' '}
        that says whether this is a reason to agree or a reason to disagree, and how strongly.
      </p>
      <p className="mb-4">
        Call it the turtle stack. A child has parents, and those parents have parents, and every
        argument on the exchange is itself a full belief page with its own pros and cons. You can
        drill down as far as you want until you hit raw evidence at the bottom. There is no
        hardcoded floor, on purpose.
      </p>

      <hr className="my-8" />

      <h2 className="text-2xl font-bold mb-3">
        4. The Ranking:{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">ReasonRank</Link>
      </h2>
      <p className="mb-4">
        How do we know which side is winning? Not by counting upvotes, because a vote measures
        how many people showed up, not whether they are right. ReasonRank weighs the evidence
        instead. It is the same insight that made PageRank beat keyword-counting for web search,
        pointed at arguments: a claim is strong when strong claims support it, recursively, all
        the way down to evidence.
      </p>
      <div className="bg-gray-50 border-l-4 border-gray-300 px-4 py-3 mb-4">
        <p className="font-mono text-sm">
          Conclusion Score = &sum;(Agree Arguments &times; Linkage &times; Uniqueness) &minus;
          &sum;(Disagree Arguments &times; Linkage &times; Uniqueness)
        </p>
      </div>
      <p className="mb-4">
        That is the readable summary. The exact per-edge formula the engine runs is sign &times;
        truth &times; |linkage| &times; importance &times; uniqueness &times; 100, and the full
        recursive definition with normalization and the twelve score dimensions lives on the{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">ReasonRank</Link>{' '}
        page and the{' '}
        <Link href="/algorithms" className="text-blue-700 hover:underline">algorithms index</Link>.
        Two terms are worth a sentence here:
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={`${TH} w-[22%]`}>Term</th>
              <th className={TH}>In one sentence</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}>
                <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">Linkage</Link>
              </td>
              <td className={TD}>
                If the argument were true, how much would it actually support the conclusion? A
                true but irrelevant fact has a linkage near zero and therefore contributes
                nothing, no matter how loudly it is stated.
              </td>
            </tr>
            <tr>
              <td className={TD}>
                <Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">Uniqueness</Link>
              </td>
              <td className={TD}>
                How much new signal does this argument add versus ones already on the page? If it
                is ninety percent a restatement of an existing point, it contributes about ten
                percent of its score. Nobody wins by making one point five different ways.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-xl font-bold mb-2">A worked illustration: should we have joined World War II?</h3>
      <p className="mb-2">Consider two arguments for entering the war, both of which happen to be true.</p>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <strong>&ldquo;Nazi leaders were rude and unpleasant.&rdquo;</strong> True, and almost
          irrelevant to a decision to go to war. Low linkage — with truth 1.0 but linkage 0.02,
          the engine&apos;s formula yields an impact around <strong>+2</strong>.
        </li>
        <li>
          <strong>&ldquo;Germany was carrying out systematic genocide.&rdquo;</strong> True,
          highly relevant, backed by overwhelming evidence. High linkage — truth 1.0 at linkage
          0.95 yields an impact around <strong>+95</strong>.
        </li>
      </ul>
      <p className="mb-4">
        The second argument dominates the first by structure, not by whoever repeats their point
        most often. This is the same computation that runs on every live belief page — click any
        impact value to see it worked for that argument.
      </p>

      <hr className="my-8" />

      <h2 className="text-2xl font-bold mb-3">5. From Argument to Agreement: Conflict Resolution</h2>
      <p className="mb-4">
        Once beliefs are decomposed into scored trees, something useful falls out almost for
        free. You can read the same trees sideways and turn a shouting match into a map. This
        runs live through the{' '}
        <Link href="/cba/about" className="text-blue-700 hover:underline">cost-benefit analysis</Link>{' '}
        workflow, and it borrows its logic from Fisher and Ury&apos;s &ldquo;Getting to
        Yes,&rdquo; run at internet scale.
      </p>
      <p className="mb-4">
        Most debates get stuck on positions, the &ldquo;I want X&rdquo; surface. The exchange
        pushes past that to interests, the &ldquo;I need X because of Y&rdquo; underneath,
        because interests are where the overlap hides. Once both sides&apos; costs and benefits
        are scored, the conflict resolution pipeline computes four things on every belief page:
        the interests both sides actually share, the single primary conflict pair that is really
        driving the disagreement, the genuine value conflicts where one side prices freedom and
        the other prices safety, and the compromise candidates where a small achievable shift
        would flip a category&apos;s net. That last one is the payoff. It points you at the
        winnable disagreements instead of the symbolic ones.
      </p>
      <p className="mb-4">
        The design also adds friction where it helps. For the highest-stakes fights, the posting
        flow imposes speed bumps before your submission is accepted: acknowledge the strongest
        point on the other side first — verified against the live ranking, not your word for it
        — and check that your proposed solution is consistent with the moral principle you
        claimed a paragraph ago. Both are enforced by the API, not just the interface.
      </p>

      <hr className="my-8" />

      <h2 className="text-2xl font-bold mb-3">6. The Vision, Scoped Honestly</h2>
      <p className="mb-4">
        It is tempting to say we are building the collective consciousness of the internet. We
        are not, and promising that would burn exactly the people we need. Here is the honest
        version of the ambition, which is still large enough to be worth twenty years.
      </p>
      <p className="mb-4">
        Wikipedia gave the world one shared, cumulative page for facts. The Idea Stock Exchange
        aims to do the same thing for reasoning: one shared, cumulative, evidence-ranked page for
        the arguments on each idea. That is a narrower claim than &ldquo;fix democracy,&rdquo;
        and it is one the mechanism on this page can actually deliver. If it works, three things
        follow. A refuted argument stops circulating instead of respawning in the next thread.
        Each round of debate builds on the last instead of restarting from zero. And anyone can
        see the whole map of reasons to agree and disagree with a claim in one place, ranked by
        evidence rather than by volume. Whether that adds up to better collective decisions is
        the horizon we are aiming at, not a result we are claiming.
      </p>

      <hr className="my-8" />

      <h2 className="text-2xl font-bold mb-3">Get Involved</h2>
      <p className="mb-3">
        This is an open-source project with a real repository and, honestly, not enough hands
        yet. If you are a developer, the useful entry point is not the grand vision, it is a
        concrete first issue: the stack is Next.js and TypeScript, the scoring engine and market
        layer have written specs and passing test suites, and the issues list has work waiting.
        If you are a thinker rather than a coder, the exchange needs well-formed pro and con
        arguments and clean belief pages far more than it needs another manifesto — start with
        the add-a-reason form on any{' '}
        <Link href="/beliefs" className="text-blue-700 hover:underline">belief page</Link>.
      </p>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <a
            href="https://github.com/myklob/ideastockexchange"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline"
          >
            View and contribute on GitHub
          </a>
        </li>
        <li>
          <Link href="/beliefs" className="text-blue-700 hover:underline">
            Browse the belief pages and add a reason
          </Link>
        </li>
      </ul>

      <hr className="my-8" />

      <h2 className="text-2xl font-bold mb-3">Related scoring pages</h2>
      <p className="mb-4">
        The scores referenced above each have their own methodology page:{' '}
        <Link href="/algorithms/reason-rank" className="text-blue-700 hover:underline">ReasonRank</Link>,{' '}
        <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">Linkage</Link>,{' '}
        <Link href="/algorithms/truth-scores" className="text-blue-700 hover:underline">Truth</Link>,{' '}
        <Link href="/algorithms/evidence-scores" className="text-blue-700 hover:underline">Evidence</Link>,{' '}
        <Link href="/algorithms/importance-score" className="text-blue-700 hover:underline">Importance</Link>,{' '}
        <Link href="/algorithms/unique-scores" className="text-blue-700 hover:underline">Uniqueness</Link>,{' '}
        <Link href="/algorithms/objective-criteria" className="text-blue-700 hover:underline">Objective Criteria</Link>,{' '}
        <Link href="/cba/about" className="text-blue-700 hover:underline">Likelihood</Link>, and the full{' '}
        <Link href="/algorithms" className="text-blue-700 hover:underline">algorithms index</Link>.
      </p>
    </div>
  )
}
