import { prisma } from '@/lib/prisma'
import { agentJson } from '@/lib/agent-api'
import { integrateCandidates, type IntegrateRequest } from '@/lib/conversations/integrate'
import {
  DEMO_MAX_ACTIONS_PER_REQUEST,
  DEMO_REVIEWS_PER_MINUTE,
  checkDemoRateLimit,
  demoClientKey,
  demoWritesDisabled,
  ensureDemoAgent,
} from '@/lib/conversations/demo-agent'
import { AUDIT_LOCK_MESSAGE, FAILURE_MODES } from '@/lib/agent-ingest/contract'
import { propagateBeliefScores } from '@/lib/propagate-belief-scores'

/**
 * POST /api/v1/conversations/demo/[id]/integrate — the playground's review
 * move. Byte-for-byte the agent route's behavior (five-step check, mandatory
 * rationale, audit rows, no scores, then the engine recomputes), restricted
 * to threads the demo agent imported and capped per request.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (demoWritesDisabled()) {
    return agentJson({ error: 'The demo playground is paused.' }, { status: 503 })
  }
  if (!checkDemoRateLimit(`review:${demoClientKey(request)}`, DEMO_REVIEWS_PER_MINUTE)) {
    return agentJson({ error: `Demo reviews are limited to ${DEMO_REVIEWS_PER_MINUTE} per minute.` }, { status: 429 })
  }

  const { id } = await params
  let body: IntegrateRequest
  try {
    body = await request.json()
  } catch {
    return agentJson(
      { error: 'Body must be valid JSON.', issues: [{ mode: FAILURE_MODES.MALFORMED_BATCH, path: '', message: 'Body must be valid JSON.' }] },
      { status: 400 },
    )
  }

  const agent = await ensureDemoAgent()
  const thread = await prisma.conversationThread.findUnique({ where: { id }, select: { submittedByAgentId: true } })
  if (!thread) return agentJson({ error: `No conversation thread "${id}".` }, { status: 404 })
  if (thread.submittedByAgentId !== agent.id) {
    return agentJson({ error: 'The demo can only review threads it imported itself.' }, { status: 403 })
  }

  const actionCount =
    (Array.isArray(body.integrate) ? body.integrate.length : 0) +
    (Array.isArray(body.fold) ? body.fold.length : 0) +
    (Array.isArray(body.dismiss) ? body.dismiss.length : 0)
  if (actionCount > DEMO_MAX_ACTIONS_PER_REQUEST) {
    return agentJson({ error: `At most ${DEMO_MAX_ACTIONS_PER_REQUEST} review moves per request in the demo.` }, { status: 422 })
  }

  const result = await integrateCandidates(agent.id, id, body)
  if (!result.ok) {
    return agentJson(
      { error: result.auditLock ? AUDIT_LOCK_MESSAGE : 'Integration rejected. Fix the named issues and resubmit.', issues: result.issues },
      { status: result.status },
    )
  }

  for (const beliefId of result.changedBeliefIds) {
    await propagateBeliefScores(beliefId, new Set(), 0, `demo conversation integration on belief #${beliefId}`)
  }

  return agentJson({
    batchId: result.batchId,
    batchUrl: result.batchId ? `/batches/${result.batchId}` : null,
    integrated: result.integrated,
    folded: result.folded,
    dismissed: result.dismissed,
  })
}
