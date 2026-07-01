/**
 * Full-database score recomputation.
 *
 * This is the "one button" that makes every stored score match its formula:
 *
 * 1. Leaf pass — recompute pure per-row scores that feed everything else:
 *    • Evidence.evsScore   = ESIW × log2(ERQ+1) × ECRS × ERP
 *    • ObjectiveCriteria.totalScore = mean(validity, reliability, independence, linkage)
 * 2. Graph pass — bottom-up propagation through the Argument graph
 *    (propagateBeliefScores): rewrites Argument.impactScore, Argument.argumentScore,
 *    Belief.positivity and Belief.stabilityScore for every belief reachable
 *    from a leaf.
 *
 * Callable from the API route (POST /api/scoring/propagate-all), the CLI
 * (scripts/recompute-scores.ts), and the seed pipeline — so scores refresh
 * whenever the algorithm improves, new data lands, or arguments change.
 */

import { prisma } from '@/lib/prisma'
import { propagateBeliefScores } from '@/lib/propagate-belief-scores'
import { calculateEVS, getEvidenceTypeWeight } from '@/core/scoring/scoring-engine'
import { calculateObjectiveCriteriaScore } from '@/core/scoring/all-scores'

export interface LeafRecomputeSummary {
  evidenceUpdated: number
  criteriaUpdated: number
}

export interface PropagateAllSummary {
  startBeliefCount: number
  totalUpdatedArguments: number
  totalUpdatedBeliefs: number
  maxDepth: number
}

export interface RecomputeAllSummary extends LeafRecomputeSummary, PropagateAllSummary {}

const scoresDiffer = (a: number, b: number) => Math.abs(a - b) > 1e-9

/**
 * Recompute per-row leaf scores (Evidence EVS, ObjectiveCriteria totals)
 * and persist any that changed. These are pure functions of the row's own
 * factor columns, so they can always be refreshed safely.
 */
export async function recomputeLeafScores(): Promise<LeafRecomputeSummary> {
  const summary: LeafRecomputeSummary = { evidenceUpdated: 0, criteriaUpdated: 0 }

  const evidence = await prisma.evidence.findMany({
    select: {
      id: true,
      evidenceType: true,
      replicationQuantity: true,
      conclusionRelevance: true,
      replicationPercentage: true,
      evsScore: true,
    },
  })
  for (const ev of evidence) {
    const evs = calculateEVS({
      sourceIndependenceWeight: getEvidenceTypeWeight(ev.evidenceType),
      replicationQuantity: ev.replicationQuantity,
      conclusionRelevance: ev.conclusionRelevance,
      replicationPercentage: ev.replicationPercentage,
    })
    if (scoresDiffer(evs, ev.evsScore)) {
      await prisma.evidence.update({ where: { id: ev.id }, data: { evsScore: evs } })
      summary.evidenceUpdated++
    }
  }

  const criteria = await prisma.objectiveCriteria.findMany({
    select: {
      id: true,
      description: true,
      criteriaType: true,
      validityScore: true,
      reliabilityScore: true,
      independenceScore: true,
      linkageScore: true,
      totalScore: true,
    },
  })
  for (const c of criteria) {
    const { totalScore } = calculateObjectiveCriteriaScore(c)
    if (scoresDiffer(totalScore, c.totalScore)) {
      await prisma.objectiveCriteria.update({ where: { id: c.id }, data: { totalScore } })
      summary.criteriaUpdated++
    }
  }

  return summary
}

/**
 * Recompute scores for every belief in the database, bottom-up.
 *
 * Strategy:
 * 1. Find all "leaf" beliefs — beliefs with no arguments of their own
 *    (never the PARENT in any argument edge). Their truth is intrinsic
 *    (evidence-based), making them the correct starting points: propagation
 *    walks upward from a child belief to the arguments that cite it.
 * 2. Propagate each leaf upward, updating argument impact/argumentScore and
 *    belief positivity/stability for every ancestor.
 * 3. Isolated beliefs (no argument edges at all) still get their positivity
 *    synced by step 1 of propagateBeliefScores before it stops.
 *
 * The shared visited-set prevents redundant work when leaves share ancestors.
 * A second pass re-propagates with the first pass's refreshed child scores,
 * which settles multi-parent graphs where a parent's own upward edges were
 * recomputed before all of its children had updated.
 */
export async function propagateAllBeliefScores(): Promise<PropagateAllSummary> {
  const allBeliefIds = await prisma.belief.findMany({ select: { id: true } })
  const beliefIdsUsedAsParent = await prisma.argument.findMany({
    select: { parentBeliefId: true },
    distinct: ['parentBeliefId'],
  })

  const usedAsParentSet = new Set(beliefIdsUsedAsParent.map(a => a.parentBeliefId))
  const startBeliefIds = allBeliefIds.map(b => b.id).filter(id => !usedAsParentSet.has(id))

  const summary: PropagateAllSummary = {
    startBeliefCount: startBeliefIds.length,
    totalUpdatedArguments: 0,
    totalUpdatedBeliefs: 0,
    maxDepth: 0,
  }

  for (let pass = 0; pass < 2; pass++) {
    const visited = new Set<number>()
    for (const id of startBeliefIds) {
      if (visited.has(id)) continue
      const result = await propagateBeliefScores(id, visited)
      if (pass === 0) {
        summary.totalUpdatedArguments += result.updatedArgumentIds.length
        summary.totalUpdatedBeliefs += result.updatedBeliefIds.length
      }
      summary.maxDepth = Math.max(summary.maxDepth, result.depth)
    }
  }

  return summary
}

/** Leaf pass + graph pass, in dependency order. */
export async function recomputeAllScores(): Promise<RecomputeAllSummary> {
  const leaf = await recomputeLeafScores()
  const graph = await propagateAllBeliefScores()
  return { ...leaf, ...graph }
}
