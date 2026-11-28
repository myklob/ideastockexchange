import { prisma } from '@/lib/prisma'
import { agentJson } from '@/lib/agent-api'
import { authenticateAgentKey } from '@/lib/agent-auth'
import { runConversationImport } from '@/lib/conversations/import'
import {
  CONVERSATION_FIREWALL_LINE,
  CONVERSATION_PLATFORMS,
  MAX_MESSAGES_PER_IMPORT,
} from '@/lib/conversations/contract'
import { FAILURE_MODES } from '@/lib/agent-ingest/contract'

/**
 * POST /api/v1/conversations — plug a chatroom or web-forum thread into its
 * permanent belief page.
 *
 * The transcript is stored verbatim, candidate pro/con claims are mined from
 * it, and each candidate is matched against the page's existing arguments
 * (extend vs restate). Nothing here touches the graph or any score: the
 * candidates wait for an explicit, audited integration move via
 * POST /api/v1/conversations/[id]/integrate.
 */
export async function POST(request: Request) {
  const auth = await authenticateAgentKey(request.headers.get('authorization'))
  if (!auth.ok) return agentJson({ error: auth.error }, { status: auth.status })

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return agentJson(
      {
        error: 'Body must be valid JSON.',
        issues: [{ mode: FAILURE_MODES.MALFORMED_BATCH, path: '', message: 'Body must be valid JSON.' }],
      },
      { status: 400 },
    )
  }

  const result = await runConversationImport(auth.agent.id, payload)
  if (!result.ok) {
    return agentJson(
      { error: 'Import rejected. Fix the named issues and resubmit.', issues: result.issues },
      { status: result.status },
    )
  }

  return agentJson(
    {
      firewall: CONVERSATION_FIREWALL_LINE,
      threadId: result.threadId,
      belief: result.belief,
      beliefUrl: result.belief ? `/beliefs/${result.belief.slug}` : null,
      candidates: result.candidates,
      skipped: result.skipped,
    },
    { status: 201 },
  )
}

/** GET /api/v1/conversations — recent imports, or the contract for tooling. */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  if (sp.get('contract') !== null) {
    return agentJson({
      contract: {
        method: 'POST',
        auth: 'Authorization: Bearer <agent key>',
        body: {
          platform: CONVERSATION_PLATFORMS.join(' | '),
          title: 'thread title',
          sourceUrl: 'permalink (optional)',
          beliefSlug: 'the belief page this conversation is about (optional; matched from the transcript when omitted)',
          messages: `[{ author, body, postedAt? }] — up to ${MAX_MESSAGES_PER_IMPORT}`,
        },
        rules: [
          'GET /api/v1/conversations/lookup?statement=... resolves a statement made mid-conversation to its permanent page and outline — check there before importing, so the conversation plugs in where the last one left off.',
          'The transcript is stored verbatim and mined for candidate pro/con claims.',
          'Candidates are matched against the belief page’s existing arguments: same-claim candidates fold, distinct ones extend the outline.',
          'Nothing is written to the belief graph at import. Integration is a separate, audited move through the ingestion firewall.',
          CONVERSATION_FIREWALL_LINE,
        ],
      },
    })
  }

  const beliefSlug = sp.get('beliefSlug')
  const threads = await prisma.conversationThread.findMany({
    where: beliefSlug ? { belief: { slug: beliefSlug } } : undefined,
    include: {
      belief: { select: { slug: true, statement: true } },
      submittedByAgent: { select: { name: true, operator: true } },
      _count: { select: { messages: true, candidates: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return agentJson({ firewall: CONVERSATION_FIREWALL_LINE, threads })
}
