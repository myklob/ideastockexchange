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
import { getEmbeddingProvider, cosineSimilarity } from '@/lib/semantic-similarity'

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
  /** Whether the L2 embedding layer contributed to the blend this run. */
  semanticLayer: 'active' | 'unavailable' | 'disabled'
  matches: SimilarBeliefMatch[]
}

// With the semantic layer active, structurally-parallel but topically-distinct
// claims ("Ford makes the best trucks" / "Apple makes the best phones") land
// around 0.35-0.38; genuinely related debates start at ~0.40.
export const DEFAULT_SIMILARITY_THRESHOLD = 0.4

export interface DetectSimilarBeliefsOptions {
  threshold?: number
  /**
   * Blend in the local sentence-embedding layer (0.4·lexical + 0.6·semantic).
   * Default true for CLI/batch use; the API route disables it by default so
   * serverless requests never wait on a model load.
   */
  semantic?: boolean
}

export async function detectSimilarBeliefs(
  options: DetectSimilarBeliefsOptions = {},
): Promise<SimilarBeliefDetectionSummary> {
  const threshold = options.threshold ?? DEFAULT_SIMILARITY_THRESHOLD
  const useSemantic = options.semantic ?? true

  const beliefs = await prisma.belief.findMany({
    select: { id: true, statement: true, claimStrength: true },
    orderBy: { id: 'asc' },
  })

  let semanticLayer: SimilarBeliefDetectionSummary['semanticLayer'] = 'disabled'
  let vectors: number[][] | null = null
  if (useSemantic) {
    const provider = await getEmbeddingProvider()
    if (provider) {
      vectors = await provider.embed(beliefs.map(b => b.statement))
      semanticLayer = 'active'
    } else {
      semanticLayer = 'unavailable'
    }
  }

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
    semanticLayer,
    matches: [],
  }

  for (let i = 0; i < beliefs.length; i++) {
    for (let j = i + 1; j < beliefs.length; j++) {
      const a = beliefs[i]
      const b = beliefs[j]
      summary.pairsExamined++

      // Embeddings are normalized; clamp tiny negative cosines to 0 so the
      // blend stays in [0, 1].
      const semanticSim = vectors
        ? Math.max(0, cosineSimilarity(vectors[i], vectors[j]))
        : null
      const result = calculateBeliefEquivalencyScore(a.statement, b.statement, semanticSim)
      const existing =
        edgeByPair.get(`${a.id}:${b.id}`) ?? edgeByPair.get(`${b.id}:${a.id}`)

      if (existing) {
        // Only a full-blend run may rescore existing edges: a lexical-only
        // pass has strictly less information and would overwrite scores that
        // were computed with the semantic layer active.
        if (
          semanticLayer === 'active' &&
          Math.abs(existing.equivalencyScore - result.equivalencyScore) > 1e-9
        ) {
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
