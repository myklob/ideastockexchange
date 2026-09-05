import { prisma } from '@/lib/prisma'
import { agentJson } from '@/lib/agent-api'
import { authenticateAgentKey } from '@/lib/agent-auth'
import { VALID_TIER_CLAIMS } from '@/lib/agent-ingest/contract'

/**
 * Knowledge-connector queue (suggestion-only). External sources propose
 * evidence candidates here; nothing becomes an Evidence row until an agent
 * or human explicitly accepts it via /api/v1/suggestions/[id]/accept.
 *
 * AUTH MODEL: suggesting is open to humans, the same policy as posting a
 * reason — a suggestion writes nothing to the graph, so the gate lives at
 * acceptance (still agent-key-only), not at proposal. With an Authorization
 * header the request is authenticated as an agent (an invalid key is
 * rejected, never downgraded to a human submission); without one it is a
 * human submission: proposedBy stays null, provenance and rationale are
 * still mandatory, and the move is audit-logged like every other.
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  const status = sp.get('status') ?? 'pending'
  const beliefSlug = sp.get('beliefSlug')

  const suggestions = await prisma.suggestedEvidence.findMany({
    where: {
      status,
      ...(beliefSlug ? { belief: { slug: beliefSlug } } : {}),
    },
    include: {
      belief: { select: { slug: true, statement: true } },
      proposedBy: { select: { name: true, operator: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return agentJson({ suggestions })
}

export async function POST(request: Request) {
  // Header present → must authenticate as an agent; a bad key is rejected,
  // never treated as a human submission. Header absent → human path.
  const authorization = request.headers.get('authorization')
  let agentId: string | null = null
  if (authorization) {
    const auth = await authenticateAgentKey(authorization)
    if (!auth.ok) return agentJson({ error: auth.error }, { status: auth.status })
    agentId = auth.agent.id
  }

  let body: {
    beliefSlug?: string
    source?: string
    title?: string
    sourceUrl?: string
    doi?: string
    snippet?: string
    tierClaim?: string
    divergent?: boolean
    rationale?: string
    /** Human path only: optional display name recorded in the audit payload. */
    suggestedBy?: string
  }
  try {
    body = await request.json()
  } catch {
    return agentJson({ error: 'Body must be valid JSON.' }, { status: 400 })
  }

  if (!body.beliefSlug || !body.source?.trim() || !body.title?.trim()) {
    return agentJson({ error: 'beliefSlug, source, and title are required.' }, { status: 422 })
  }
  if (!body.sourceUrl?.trim() && !body.doi?.trim()) {
    return agentJson({ error: 'A suggestion needs provenance: sourceUrl or doi.' }, { status: 422 })
  }
  if (body.tierClaim && !VALID_TIER_CLAIMS.includes(body.tierClaim as (typeof VALID_TIER_CLAIMS)[number])) {
    return agentJson({ error: `tierClaim must be one of ${VALID_TIER_CLAIMS.join(', ')}.` }, { status: 422 })
  }
  if (!body.rationale?.trim()) {
    return agentJson({ error: 'rationale is mandatory: every move carries its "why".' }, { status: 422 })
  }

  const belief = await prisma.belief.findUnique({ where: { slug: body.beliefSlug } })
  if (!belief) return agentJson({ error: `No belief with slug "${body.beliefSlug}".` }, { status: 404 })

  const suggestion = await prisma.suggestedEvidence.create({
    data: {
      beliefId: belief.id,
      source: body.source.trim(),
      title: body.title.trim(),
      sourceUrl: body.sourceUrl?.trim() || null,
      doi: body.doi?.trim() || null,
      snippet: body.snippet?.trim() || null,
      tierClaim: body.tierClaim ?? null,
      divergent: body.divergent === true,
      proposedByAgentId: agentId,
    },
  })
  await prisma.auditLog.create({
    data: {
      agentId,
      action: 'suggest_evidence',
      targetType: 'SuggestedEvidence',
      targetId: suggestion.id,
      rationale: body.rationale.trim(),
      payload: JSON.stringify({ ...body, submittedAs: agentId ? 'agent' : 'human' }),
    },
  })

  return agentJson({ suggestion }, { status: 201 })
}
