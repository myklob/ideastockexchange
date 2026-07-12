import { prisma } from '@/lib/prisma'
import { agentJson } from '@/lib/agent-api'
import { authenticateAgentKey } from '@/lib/agent-auth'
import { validateEvidenceInput } from '@/lib/agent-ingest/validate-claim'
import { isGraphFrozen, GRAPH_FREEZE_MESSAGE } from '@/lib/markets/epoch'
import { propagateBeliefScores } from '@/lib/propagate-belief-scores'

/**
 * Explicit acceptance turns a suggestion into an Evidence row, through the
 * same ingestion validation as everything else. If the suggestion was marked
 * divergent, the belief gets a review flag — a to-do for humans, never a
 * scoring input.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateAgentKey(request.headers.get('authorization'))
  if (!auth.ok) return agentJson({ error: auth.error }, { status: auth.status })

  // Accepting a suggestion creates an Evidence row — a score-affecting graph
  // write, rejected during the epoch freeze window.
  if (isGraphFrozen(new Date())) {
    return agentJson({ error: GRAPH_FREEZE_MESSAGE }, { status: 423 })
  }

  let body: { rationale?: string }
  try {
    body = await request.json()
  } catch {
    return agentJson({ error: 'Body must be valid JSON.' }, { status: 400 })
  }
  if (!body.rationale?.trim()) {
    return agentJson({ error: 'rationale is mandatory: say why this evidence belongs on the belief.' }, { status: 422 })
  }

  const { id } = await params
  const suggestion = await prisma.suggestedEvidence.findUnique({
    where: { id },
    include: { belief: { select: { id: true, slug: true } } },
  })
  if (!suggestion) return agentJson({ error: 'Suggestion not found.' }, { status: 404 })
  if (suggestion.status !== 'pending') {
    return agentJson({ error: `Suggestion already ${suggestion.status}.` }, { status: 409 })
  }

  const issues = validateEvidenceInput(
    {
      title: suggestion.title,
      sourceUrl: suggestion.sourceUrl ?? undefined,
      doi: suggestion.doi ?? undefined,
      tierClaim: suggestion.tierClaim ?? undefined,
    },
    'suggestion',
  )
  if (issues.length > 0) {
    return agentJson({ error: 'Suggestion fails ingestion validation.', issues }, { status: 422 })
  }

  const rationale = body.rationale.trim()
  const evidence = await prisma.$transaction(async tx => {
    const created = await tx.evidence.create({
      data: {
        beliefId: suggestion.beliefId,
        side: 'supporting',
        description: suggestion.title,
        sourceUrl: suggestion.sourceUrl,
        doi: suggestion.doi,
        tierClaim: suggestion.tierClaim,
        retrievedByAgentId: auth.agent.id,
      },
    })
    await tx.suggestedEvidence.update({
      where: { id: suggestion.id },
      data: { status: 'accepted', acceptedEvidenceId: created.id, resolvedAt: new Date() },
    })
    if (suggestion.divergent) {
      await tx.belief.update({
        where: { id: suggestion.beliefId },
        data: {
          reviewFlag: true,
          reviewFlagNote: `External source (${suggestion.source}) diverges from local structure: ${suggestion.title}`,
        },
      })
    }
    await tx.auditLog.create({
      data: {
        agentId: auth.agent.id,
        action: 'accept_suggestion',
        targetType: 'Evidence',
        targetId: String(created.id),
        rationale,
        payload: JSON.stringify({ suggestionId: suggestion.id }),
      },
    })
    return created
  })

  // New evidence changed the belief's ledger — recompute its score and every
  // conclusion upstream of it. The acceptance wrote no scores; the engine does.
  await propagateBeliefScores(suggestion.beliefId, new Set(), 0, `evidence suggestion #${id} accepted`)

  return agentJson({ evidence, beliefSlug: suggestion.belief.slug }, { status: 201 })
}
