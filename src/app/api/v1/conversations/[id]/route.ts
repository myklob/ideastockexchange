import { prisma } from '@/lib/prisma'
import { agentJson } from '@/lib/agent-api'
import { CONVERSATION_FIREWALL_LINE } from '@/lib/conversations/contract'

/**
 * GET /api/v1/conversations/[id] — one imported thread: the verbatim
 * transcript, the mined candidates with their redundancy bands, and where
 * each candidate stands (pending / integrated / duplicate / dismissed).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const thread = await prisma.conversationThread.findUnique({
    where: { id },
    include: {
      belief: { select: { id: true, slug: true, statement: true } },
      submittedByAgent: { select: { name: true, operator: true } },
      messages: { orderBy: { index: 'asc' } },
      candidates: {
        include: {
          message: { select: { index: true, authorHandle: true } },
          nearestArgument: { select: { id: true, claim: true } },
          integratedArgument: { select: { id: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!thread) return agentJson({ error: `No conversation thread "${id}".` }, { status: 404 })

  return agentJson({
    firewall: CONVERSATION_FIREWALL_LINE,
    thread: {
      id: thread.id,
      platform: thread.platform,
      title: thread.title,
      sourceUrl: thread.sourceUrl,
      belief: thread.belief,
      beliefUrl: thread.belief ? `/beliefs/${thread.belief.slug}` : null,
      submittedBy: thread.submittedByAgent,
      createdAt: thread.createdAt,
      messages: thread.messages.map(m => ({
        index: m.index,
        author: m.authorHandle,
        body: m.body,
        postedAt: m.postedAt,
      })),
      candidates: thread.candidates,
    },
  })
}
