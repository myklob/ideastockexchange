import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { CONVERSATION_FIREWALL_LINE } from '@/lib/conversations/contract'
import { DEMO_AGENT_NAME } from '@/lib/conversations/demo-agent'
import DemoPlayground from './DemoPlayground'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Live Demo: Chat to Belief Page — Idea Stock Exchange',
  description:
    'Say something in chat and watch it resolve to a permanent belief page; paste a forum thread and watch its arguments get mined, reviewed, and integrated.',
}

const FEATURED_SLUGS = ['accept-certified-election-results', 'comply-with-final-court-rulings']

const SAMPLE_TRANSCRIPT = `ballot_curious: Serious question: do you actually have to accept election results if you think it was rigged?
norms_matter: Yes, because the acceptance norm only works if it binds both sides. Once one side treats every loss as illegitimate the other side stops conceding too.
audit_hawk: The real problem nobody talks about: certification deadlines are so tight that meaningful audits are impossible before results become official.
history_nerd: Elections have literally been stolen before, look at 1876. The Hayes-Tilden mess was settled by a backroom bargain, not by courts.
norms_matter: Courts threw out more than sixty challenges after 2020 for lack of proof. The dispute channel exists and it was used.
vibes_only: lol this thread again
cynic_prime: Everyone knows politicians lie about everything anyway.`

/**
 * The working demonstration of the architecture: chat stays informal, the
 * belief page holds the accumulated knowledge, and every conversation plugs
 * into it instead of restarting from zero.
 */
export default async function DemoPage() {
  const featured = await prisma.belief.findMany({
    where: { slug: { in: FEATURED_SLUGS } },
    select: { id: true, slug: true, statement: true },
  })
  const fallback =
    featured.length > 0
      ? []
      : await prisma.belief.findMany({
          where: { arguments: { some: {} } },
          select: { id: true, slug: true, statement: true },
          orderBy: { id: 'asc' },
          take: 6,
        })
  const beliefs = [...featured, ...fallback]

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
            <span className="text-[var(--muted-foreground)]">/</span>
            <span className="text-sm font-medium text-[var(--foreground)]">Live Demo</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/conversations" className="text-[var(--accent)] hover:underline">All conversations</Link>
            <Link href="/how-it-works" className="text-[var(--accent)] hover:underline">How it works</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          From a chat message to a permanent belief page
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-3">
          Online conversations start from zero every time. Someone states a belief and there is no
          connection to any prior work, no shared memory, no cumulative progress. This page is the
          fix, running live: every belief has one permanent page, and every conversation plugs into
          it. Type what someone just said in chat and the page it belongs to comes back with the best
          arguments on both sides. Paste a thread and its arguments get mined, checked against what
          the page already has, and reviewed into the page &mdash; extending its outline, folding
          into an argument it already holds, or dropping out.
        </p>
        <p className="text-xs font-semibold border border-amber-300 bg-amber-50 p-2 mb-6">
          {CONVERSATION_FIREWALL_LINE} Every write the demo makes is public at{' '}
          <Link href={`/audit?agent=${encodeURIComponent(DEMO_AGENT_NAME)}`} className="text-[var(--accent)] hover:underline">
            /audit
          </Link>
          .
        </p>

        {beliefs.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            <p className="text-lg mb-2">No belief pages with argument trees yet.</p>
            <p className="text-sm">Run <code>npm run db:seed</code> to load the worked example, then reload.</p>
          </div>
        ) : (
          <DemoPlayground beliefs={beliefs} sampleTranscript={SAMPLE_TRANSCRIPT} />
        )}

        <section className="mt-12 text-sm text-[var(--muted-foreground)] border-t border-[var(--border)] pt-6">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-2">What is happening underneath</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              <strong>Find.</strong> The statement is matched against every belief page by content overlap;
              a whole transcript is stripped of chat noise, split into sentences, and only standalone
              claims survive (questions, fragments, and social noise are skipped, with the reason shown).
            </li>
            <li>
              <strong>Organize.</strong> Each candidate is read for stance and scanned against the arguments
              already on the page. Restating the page&apos;s own con argument makes it a con point, whatever
              the message opener said. The similarity band routes it: distinct extends the outline; a
              restatement folds &mdash; no new row, no double-counting.
            </li>
            <li>
              <strong>Integrate.</strong> Nothing auto-integrates. A review move pushes a candidate through the
              same ingestion firewall every agent uses: standalone-claim check, a linkage mechanism, an audit
              row with the rationale, and no score fields at all. Then the engine recomputes the page.
            </li>
            <li>
              <strong>Accumulate.</strong> The result lives on the belief page: its Argument Trees, its score
              history, and the batch record. The next conversation starts there instead of at zero.
            </li>
          </ol>
          <p className="mt-4">
            Agents do the same thing with a key via <code>POST /api/v1/conversations</code>; see{' '}
            <Link href="/contribute" className="text-[var(--accent)] hover:underline">Contribute</Link>.
          </p>
        </section>
      </main>
    </div>
  )
}
