import { agentJson } from '@/lib/agent-api'
import { authenticateAgentKey } from '@/lib/agent-auth'
import { runIngest } from '@/lib/agent-ingest/ingest'
import { AUDIT_LOCK_MESSAGE, FAILURE_MODES } from '@/lib/agent-ingest/contract'
import { propagateBeliefScores } from '@/lib/propagate-belief-scores'

/**
 * POST /api/v1/ingest — the show-your-work firewall.
 *
 * An agent does not publish a conclusion; it submits decomposed claims,
 * arguments, evidence with provenance, and a rationale for every move.
 * See docs/AI_AGENT_INTEGRATION_SPEC.md for the payload contract.
 */
export async function POST(request: Request) {
  const auth = await authenticateAgentKey(request.headers.get('authorization'))
  if (!auth.ok) {
    return agentJson({ error: auth.error }, { status: auth.status })
  }

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

  const result = await runIngest(auth.agent.id, payload)
  if (!result.ok) {
    return agentJson(
      {
        error: result.auditLock ? AUDIT_LOCK_MESSAGE : 'Batch rejected. Fix the named failure modes and resubmit.',
        issues: result.issues,
      },
      { status: result.status },
    )
  }

  // The engine's turn. Ingestion writes no scores (audit lock) — but the batch
  // changed the graph, so the scoring engine now recomputes every conclusion
  // that depends on it: each new claim's edge impact, its parents' nets, and
  // so on upward. Post evidence → every dependent conclusion updates.
  const changedBeliefIds = [...new Set(result.claims.map((c) => c.beliefId))]
  for (const beliefId of changedBeliefIds) {
    await propagateBeliefScores(beliefId)
  }

  return agentJson(
    {
      batchId: result.batchId,
      batchUrl: `/batches/${result.batchId}`,
      claims: result.claims,
    },
    { status: 201 },
  )
}

/** GET /api/v1/ingest — the contract, restated for tooling. */
export async function GET() {
  return agentJson({
    contract: {
      method: 'POST',
      auth: 'Authorization: Bearer <agent key>',
      spec: 'docs/AI_AGENT_INTEGRATION_SPEC.md',
      rules: [
        'Every statement must be a standalone claim with a truth value — bare topic labels are rejected.',
        'Every placement requires a completed Five-Step Linkage Check. No check, no placement.',
        'Every claim carries a mandatory rationale, stored in the public audit log.',
        'Evidence requires provenance (sourceUrl, doi, pmid, or isbn); tierClaim is your assertion, verified later.',
        AUDIT_LOCK_MESSAGE,
      ],
      failureModes: Object.values(FAILURE_MODES),
    },
  })
}
