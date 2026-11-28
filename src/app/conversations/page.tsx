import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CONVERSATION_FIREWALL_LINE } from '@/lib/conversations/contract'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-300',
  integrated: 'bg-green-50 text-green-800 border-green-300',
  duplicate: 'bg-blue-50 text-blue-800 border-blue-300',
  dismissed: 'bg-gray-100 text-gray-500 border-gray-300',
}

/**
 * Imported conversations and the candidate arguments mined from them. Every
 * conversation plugs into a permanent belief page; this is the review lane
 * where mined candidates wait to extend a page's outline (integrate), fold
 * into an existing argument (combine), or drop out (dismiss). Read-only —
 * imports arrive via POST /api/v1/conversations, review moves via
 * POST /api/v1/conversations/[id]/integrate.
 */
export default async function ConversationsPage() {
  const threads = await prisma.conversationThread.findMany({
    include: {
      belief: { select: { slug: true, statement: true } },
      submittedByAgent: { select: { name: true, operator: true } },
      candidates: {
        include: { message: { select: { index: true, authorHandle: true } } },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-sm font-medium text-[var(--foreground)]">Conversations</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Conversation Integration</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Chatrooms and web forums reset discussion to zero: every thread repeats arguments made a
          thousand times, and whatever clarity is reached dies with the scroll. Here, each imported
          conversation plugs into its belief&apos;s permanent page — the candidate arguments mined from
          the transcript either extend the page&apos;s pro/con outline, fold into an argument the page
          already has, or drop out at review. Chat stays informal; the belief pages accumulate.
        </p>
        <p className="text-xs font-semibold border border-amber-300 bg-amber-50 p-2 mb-6">
          {CONVERSATION_FIREWALL_LINE}
        </p>

        {threads.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            <p className="text-lg mb-2">No conversations imported yet.</p>
            <p className="text-sm">Agents import transcripts via POST /api/v1/conversations with their key.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {threads.map(thread => (
              <div key={thread.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex flex-wrap items-baseline gap-2 mb-1">
                  <h2 className="font-semibold text-[var(--foreground)]">{thread.title}</h2>
                  <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{thread.platform}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)] mb-3">
                  <span>
                    {thread.submittedByAgent.name}
                    {thread.submittedByAgent.operator ? ` (${thread.submittedByAgent.operator})` : ''}
                  </span>
                  <span>{thread.createdAt.toISOString().replace('T', ' ').slice(0, 16)}</span>
                  <span>{thread._count.messages} messages</span>
                  {thread.sourceUrl && (
                    <a href={thread.sourceUrl} className="text-[var(--accent)] hover:underline" rel="nofollow noopener">
                      source
                    </a>
                  )}
                  {thread.belief ? (
                    <Link href={`/beliefs/${thread.belief.slug}`} className="text-[var(--accent)] hover:underline">
                      Page: {thread.belief.statement}
                    </Link>
                  ) : (
                    <span>no belief page matched</span>
                  )}
                </div>

                {thread.candidates.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)]">No standalone claims mined from this transcript.</p>
                ) : (
                  <div className="space-y-1">
                    {thread.candidates.map(candidate => (
                      <div key={candidate.id} className="flex flex-wrap items-baseline gap-2 text-sm">
                        <span
                          className={`text-[10px] uppercase tracking-wide border rounded px-1 ${
                            STATUS_STYLES[candidate.status] ?? STATUS_STYLES.dismissed
                          }`}
                        >
                          {candidate.status}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wide ${
                            candidate.direction === 'pro' ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {candidate.direction}
                        </span>
                        <span className="text-[var(--foreground)]">{candidate.statement}</span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          — msg #{candidate.message.index} by {candidate.message.authorHandle}
                          {candidate.band && candidate.band !== 'distinct' ? `, ${candidate.band}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
