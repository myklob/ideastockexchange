import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeBeliefUnitStats, type BeliefUnitInput } from '@/lib/battlefield'

/**
 * GET /api/battlefield/units
 *
 * Returns one record per Belief, projected as a Battlefield-of-Ideas unit
 * (HP, Attack, Defense, Speed, AoE, Level, class). Optional query params:
 *   ?limit=N        — max rows (default 100, capped at 500)
 *   ?sortBy=overall|hp|attack|defense|speed|aoe|level   (default overall)
 *   ?sortDir=asc|desc                                    (default desc)
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const sp = url.searchParams

  const limitRaw = parseInt(sp.get('limit') ?? '', 10)
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 100

  const sortBy = (sp.get('sortBy') ?? 'overall') as
    | 'overall' | 'hp' | 'attack' | 'defense' | 'speed' | 'aoe' | 'level'
  const sortDir = sp.get('sortDir') === 'asc' ? 'asc' : 'desc'

  const beliefs = await prisma.belief.findMany({
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

  const units = beliefs.map(b => {
    const agree = b.arguments.filter(a => a.side === 'agree').length
    const disagree = b.arguments.filter(a => a.side === 'disagree').length
    const supportingLaws = b.legalEntries.filter(l => l.side === 'supporting').length
    const upstreamSupport = b.upstreamMappings.filter(m => m.side === 'support').length

    const input: BeliefUnitInput = {
      positivity: b.positivity,
      stabilityScore: b.stabilityScore,
      claimStrength: b.claimStrength,
      argumentCount: b.arguments.length,
      agreeArgumentCount: agree,
      disagreeArgumentCount: disagree,
      evidenceCount: b.evidence.length,
      supportingLawsCount: supportingLaws,
      downstreamCount: b.downstreamMappings.length,
      upstreamSupportCount: upstreamSupport,
      mediaCount: b.mediaResources.length,
      criteriaCount: b.objectiveCriteria.length,
    }

    const stats = computeBeliefUnitStats(input)

    return {
      belief_id: String(b.id),
      slug: b.slug,
      name: b.statement,
      category: b.category ?? null,
      stats,
    }
  })

  units.sort((a, b) => {
    const av = a.stats[sortBy]
    const bv = b.stats[sortBy]
    return sortDir === 'asc' ? av - bv : bv - av
  })

  return NextResponse.json({ units: units.slice(0, limit), count: units.length })
}
