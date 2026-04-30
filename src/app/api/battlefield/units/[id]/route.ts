import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeBeliefUnitStats, type BeliefUnitInput } from '@/lib/battlefield'

/**
 * GET /api/battlefield/units/[id]
 *
 * Returns one Belief projected as a Battlefield unit. `id` may be a
 * numeric Belief.id or a slug — the route tries id first, then slug.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const numericId = parseInt(id, 10)

  const belief = await prisma.belief.findFirst({
    where: Number.isFinite(numericId) ? { OR: [{ id: numericId }, { slug: id }] } : { slug: id },
    select: {
      id: true,
      slug: true,
      statement: true,
      category: true,
      positivity: true,
      stabilityScore: true,
      claimStrength: true,
      arguments: { select: { side: true } },
      evidence: { select: { id: true } },
      legalEntries: { select: { side: true } },
      mediaResources: { select: { id: true } },
      objectiveCriteria: { select: { id: true } },
      downstreamMappings: { select: { id: true } },
      upstreamMappings: { select: { side: true } },
    },
  })

  if (!belief) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  }

  const agree = belief.arguments.filter(a => a.side === 'agree').length
  const disagree = belief.arguments.filter(a => a.side === 'disagree').length
  const supportingLaws = belief.legalEntries.filter(l => l.side === 'supporting').length
  const upstreamSupport = belief.upstreamMappings.filter(m => m.side === 'support').length

  const input: BeliefUnitInput = {
    positivity: belief.positivity,
    stabilityScore: belief.stabilityScore,
    claimStrength: belief.claimStrength,
    argumentCount: belief.arguments.length,
    agreeArgumentCount: agree,
    disagreeArgumentCount: disagree,
    evidenceCount: belief.evidence.length,
    supportingLawsCount: supportingLaws,
    downstreamCount: belief.downstreamMappings.length,
    upstreamSupportCount: upstreamSupport,
    mediaCount: belief.mediaResources.length,
    criteriaCount: belief.objectiveCriteria.length,
  }

  return NextResponse.json({
    belief_id: String(belief.id),
    slug: belief.slug,
    name: belief.statement,
    category: belief.category ?? null,
    stats: computeBeliefUnitStats(input),
    raw: input,
  })
}
