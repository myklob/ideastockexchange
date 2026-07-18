/**
 * Evidence Grounding — database walker.
 *
 * The DB twin of scoreGroundingTree (src/core/scoring/grounding.ts): walks a
 * belief's evidence rows and published argument edges downward, computing how
 * much of its support bottoms out in tiered evidence. A belief re-entered
 * while still on the walk stack is a citation ring and grounds nothing.
 *
 * Called from score propagation so grounding rides the same cascade as truth:
 * link a source and every ancestor's grounding rises; retract one (tier → T0)
 * and grounding collapses with the EVS.
 */

import { prisma } from '@/lib/prisma'
import { computeGroundingScore } from '@/core/scoring/grounding'

export async function groundingForBelief(
  beliefId: number,
  memo: Map<number, number> = new Map(),
  walking: Set<number> = new Set(),
): Promise<number> {
  const cached = memo.get(beliefId)
  if (cached !== undefined) return cached
  if (walking.has(beliefId)) return 0 // ring of claims: no foundation

  walking.add(beliefId)

  const [evidence, argumentEdges] = await Promise.all([
    prisma.evidence.findMany({
      where: { beliefId },
      select: { evidenceType: true, linkageScore: true },
    }),
    prisma.argument.findMany({
      where: { parentBeliefId: beliefId, status: 'published' },
      select: { beliefId: true, linkageScore: true },
    }),
  ])

  const edges = []
  for (const edge of argumentEdges) {
    edges.push({
      linkageScore: edge.linkageScore,
      childGrounding: await groundingForBelief(edge.beliefId, memo, walking),
    })
  }

  walking.delete(beliefId)

  const score = computeGroundingScore(
    evidence.map((e) => ({ tier: e.evidenceType, linkageScore: e.linkageScore })),
    edges,
  )
  memo.set(beliefId, score)
  return score
}

/**
 * Recompute and persist a belief's grounding score. Returns the new value.
 * The memo is shared across one propagation pass so a belief feeding many
 * parents is walked once.
 */
export async function persistBeliefGrounding(
  beliefId: number,
  memo: Map<number, number> = new Map(),
): Promise<number> {
  const score = await groundingForBelief(beliefId, memo)
  await prisma.belief.update({
    where: { id: beliefId },
    data: { groundingScore: score },
  })
  return score
}
