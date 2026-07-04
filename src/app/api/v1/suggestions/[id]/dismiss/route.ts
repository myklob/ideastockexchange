import { prisma } from '@/lib/prisma'
import { agentJson } from '@/lib/agent-api'
import { authenticateAgentKey } from '@/lib/agent-auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateAgentKey(request.headers.get('authorization'))
  if (!auth.ok) return agentJson({ error: auth.error }, { status: auth.status })

  let body: { rationale?: string }
  try {
    body = await request.json()
  } catch {
    return agentJson({ error: 'Body must be valid JSON.' }, { status: 400 })
  }
  if (!body.rationale?.trim()) {
    return agentJson({ error: 'rationale is mandatory: say why this suggestion does not belong.' }, { status: 422 })
  }

  const { id } = await params
  const suggestion = await prisma.suggestedEvidence.findUnique({ where: { id } })
  if (!suggestion) return agentJson({ error: 'Suggestion not found.' }, { status: 404 })
  if (suggestion.status !== 'pending') {
    return agentJson({ error: `Suggestion already ${suggestion.status}.` }, { status: 409 })
  }

  const updated = await prisma.suggestedEvidence.update({
    where: { id },
    data: { status: 'dismissed', resolvedAt: new Date() },
  })
  await prisma.auditLog.create({
    data: {
      agentId: auth.agent.id,
      action: 'dismiss_suggestion',
      targetType: 'SuggestedEvidence',
      targetId: id,
      rationale: body.rationale.trim(),
    },
  })

  return agentJson({ suggestion: updated })
}
