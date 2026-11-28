import { agentJson } from '@/lib/agent-api'
import { authenticateAgentKey } from '@/lib/agent-auth'
import { integrateCandidates, type IntegrateRequest } from '@/lib/conversations/integrate'
import { AUDIT_LOCK_MESSAGE, FAILURE_MODES } from '@/lib/agent-ingest/contract'
import { propagateBeliefScores } from '@/lib/propagate-belief-scores'

/**
 * POST /api/v1/conversations/[id]/integrate — the review move that lets a
 * conversation change the graph, through the same firewall as everything
 * else.
 *
 * Body: {
 *   integrate?: [{ candidateId, howItSupports?, provisionalEstimate?, direction? }],
 *   fold?:      [candidateId]   // restates an existing argument: combine, no new row
 *   dismiss?:   [candidateId]   // not a usable argument
 * }
 *
 * Integrations run as one ingest batch (five-step checks, audit rows, no
 * scores), then the engine recomputes every conclusion the batch touched.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateAgentKey(request.headers.get('authorization'))
  if (!auth.ok) return agentJson({ error: auth.error }, { status: auth.status })

  const { id } = await params
  let body: IntegrateRequest
  try {
    body = await request.json()
  } catch {
    return agentJson(
      {
        error: 'Body must be valid JSON.',
        issues: [{ mode: FAILURE_MODES.MALFORMED_BATCH, path: '', message: 'Body must be valid JSON.' }],
      },
      { status: 400 },
    )
  }

  const result = await integrateCandidates(auth.agent.id, id, body)
  if (!result.ok) {
    return agentJson(
      {
        error: result.auditLock ? AUDIT_LOCK_MESSAGE : 'Integration rejected. Fix the named issues and resubmit.',
        issues: result.issues,
      },
      { status: result.status },
    )
  }

  // The engine's turn, same as direct ingestion: the batch changed the graph,
  // so every dependent conclusion recomputes.
  for (const beliefId of result.changedBeliefIds) {
    await propagateBeliefScores(beliefId, new Set(), 0, `conversation integration on belief #${beliefId}`)
  }

  return agentJson(
    {
      batchId: result.batchId,
      batchUrl: result.batchId ? `/batches/${result.batchId}` : null,
      integrated: result.integrated,
      folded: result.folded,
      dismissed: result.dismissed,
    },
    { status: 200 },
  )
}
