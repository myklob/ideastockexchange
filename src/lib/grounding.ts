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
  const result = await walkGrounding(beliefId, memo, walking)
  return result.score
}

// Scores computed while a ring edge was cut are context-dependent, so they
// are never memoized — a shared memo must only ever hold root scores.
async function walkGrounding(
  beliefId: number,
  memo: Map<number, number>,
  walking: Set<number>,
): Promise<{ score: number; tainted: boolean }> {
  const cached = memo.get(beliefId)
  if (cached !== undefined) return { score: cached, tainted: false }
  if (walking.has(beliefId)) return { score: 0, tainted: true } // ring of claims: no foundation

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

  let tainted = false
  const edges = []
  for (const edge of argumentEdges) {
    const child = await walkGrounding(edge.beliefId, memo, walking)
    tainted = tainted || child.tainted
    edges.push({
      linkageScore: edge.linkageScore,
      childGrounding: child.score,
    })
  }

  walking.delete(beliefId)

  const score = computeGroundingScore(
    evidence.map((e) => ({ tier: e.evidenceType, linkageScore: e.linkageScore })),
    edges,
  )
  if (!tainted) memo.set(beliefId, score)
  return { score, tainted }
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
