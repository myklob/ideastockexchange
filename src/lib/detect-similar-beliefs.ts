/**
 * Automated similar-belief detection.
 *
 * Scans every pair of beliefs, scores how much they make the same underlying
 * claim (calculateBeliefEquivalencyScore: normalized-token similarity with
 * synonym/negated-antonym handling), and persists the results as
 * SimilarBelief edges. Linking parallel phrasings means redundant debates get
 * surfaced together instead of splitting the argument graph.
 *
 * Behavior:
 * • Existing edges are always rescored (statements may have been edited).
 * • New edges are created only at/above `threshold` ("related" per the
 *   relationship buckets), so noise pairs don't clutter the graph.
 * • Hand-authored edges below threshold are kept (rescored, never deleted).
 * • `variant` marks the target belief's claim strength relative to the
 *   source: stronger claim → "extreme", equal-or-weaker → "moderate".
 */

import { prisma } from '@/lib/prisma'
import { calculateBeliefEquivalencyScore } from '@/core/scoring/all-scores'

export interface SimilarBeliefMatch {
  fromBeliefId: number
  toBeliefId: number
  fromStatement: string
  toStatement: string
  equivalencyScore: number
  relationship: string
}

export interface SimilarBeliefDetectionSummary {
  beliefCount: number
  pairsExamined: number
  edgesCreated: number
  edgesUpdated: number
  matches: SimilarBeliefMatch[]
}

export const DEFAULT_SIMILARITY_THRESHOLD = 0.35

export async function detectSimilarBeliefs(
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD,
): Promise<SimilarBeliefDetectionSummary> {
  const beliefs = await prisma.belief.findMany({
    select: { id: true, statement: true, claimStrength: true },
    orderBy: { id: 'asc' },
  })

  const existingEdges = await prisma.similarBelief.findMany({
    select: { id: true, fromBeliefId: true, toBeliefId: true, equivalencyScore: true },
  })
  const edgeByPair = new Map<string, (typeof existingEdges)[number]>()
  for (const edge of existingEdges) {
    edgeByPair.set(`${edge.fromBeliefId}:${edge.toBeliefId}`, edge)
  }

  const summary: SimilarBeliefDetectionSummary = {
    beliefCount: beliefs.length,
    pairsExamined: 0,
    edgesCreated: 0,
    edgesUpdated: 0,
    matches: [],
  }

  for (let i = 0; i < beliefs.length; i++) {
    for (let j = i + 1; j < beliefs.length; j++) {
      const a = beliefs[i]
      const b = beliefs[j]
      summary.pairsExamined++

      const result = calculateBeliefEquivalencyScore(a.statement, b.statement)
      const existing =
        edgeByPair.get(`${a.id}:${b.id}`) ?? edgeByPair.get(`${b.id}:${a.id}`)

      if (existing) {
        if (Math.abs(existing.equivalencyScore - result.equivalencyScore) > 1e-9) {
          await prisma.similarBelief.update({
            where: { id: existing.id },
            data: { equivalencyScore: result.equivalencyScore },
          })
          summary.edgesUpdated++
        }
      } else if (result.equivalencyScore >= threshold) {
        const variant = b.claimStrength > a.claimStrength ? 'extreme' : 'moderate'
        await prisma.similarBelief.create({
          data: {
            fromBeliefId: a.id,
            toBeliefId: b.id,
            variant,
            equivalencyScore: result.equivalencyScore,
          },
        })
        summary.edgesCreated++
      }

      if (result.equivalencyScore >= threshold) {
        summary.matches.push({
          fromBeliefId: a.id,
          toBeliefId: b.id,
          fromStatement: a.statement,
          toStatement: b.statement,
          equivalencyScore: result.equivalencyScore,
          relationship: result.relationship,
        })
      }
    }
  }

  summary.matches.sort((x, y) => y.equivalencyScore - x.equivalencyScore)
  return summary
}
