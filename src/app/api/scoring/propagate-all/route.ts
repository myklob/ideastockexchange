/**
 * Batch Belief Score Propagation API
 *
 * POST /api/scoring/propagate-all
 *
 * Recomputes scores for every belief in the database, bottom-up.
 * Useful after bulk imports or whenever scores appear out-of-sync.
 *
 * Strategy:
 *   1. Find all "leaf" beliefs (beliefs that are not themselves used as a
 *      reason in any argument). These are the deepest nodes in the graph.
 *   2. Propagate each leaf upward through the graph, updating:
 *      - argument.impactScore for every edge
 *      - belief.positivity (overallScore) and belief.stabilityScore for every ancestor
 *   3. The visited-set inside propagateBeliefScores prevents redundant work
 *      when two leaves share ancestors.
 *
 * GET /api/scoring/propagate-all
 *
 * Returns a count of beliefs in the database without running propagation.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { propagateBeliefScores } from '@/lib/propagate-belief-scores'

// ─── GET (status check) ─────────────────────────────────────────────────────

export async function GET() {
  const total = await prisma.belief.count()
  const argumentCount = await prisma.argument.count()

  return NextResponse.json({
    status: 'ready',
    totalBeliefs: total,
    totalArguments: argumentCount,
    note: 'POST to this endpoint to recompute all belief scores.',
  })
}

// ─── POST (run full propagation) ────────────────────────────────────────────

export async function POST() {
  // Find all beliefs that are never used as a reason (i.e., leaf beliefs).
  // These have no outgoing "beliefId" references in the Argument table.
  const allBeliefIds = await prisma.belief.findMany({ select: { id: true } })
  const beliefIdsUsedAsChild = await prisma.argument.findMany({
    select: { beliefId: true },
    distinct: ['beliefId'],
  })

  const usedAsChildSet = new Set(beliefIdsUsedAsChild.map(a => a.beliefId))
  const leafBeliefIds = allBeliefIds
    .map(b => b.id)
    .filter(id => !usedAsChildSet.has(id))

  // Also include beliefs that have no children themselves — every belief
  // that isn't a parent of another, so they won't be visited through a leaf.
  const beliefIdsUsedAsParent = await prisma.argument.findMany({
    select: { parentBeliefId: true },
    distinct: ['parentBeliefId'],
  })
  const usedAsParentSet = new Set(beliefIdsUsedAsParent.map(a => a.parentBeliefId))

  // True isolated beliefs (no arguments at all) — still need positivity updated
  const isolatedBeliefIds = allBeliefIds
    .map(b => b.id)
    .filter(id => !usedAsChildSet.has(id) && !usedAsParentSet.has(id))

  // Combine: start from leaves (propagates upward) + isolated beliefs
  const startBeliefIds = Array.from(new Set([...leafBeliefIds, ...isolatedBeliefIds]))

  const visited = new Set<number>()
  let totalUpdatedArguments = 0
  let totalUpdatedBeliefs = 0
  let maxDepth = 0

  for (const id of startBeliefIds) {
    if (visited.has(id)) continue
    const result = await propagateBeliefScores(id, visited)
    totalUpdatedArguments += result.updatedArgumentIds.length
    totalUpdatedBeliefs += result.updatedBeliefIds.length
    maxDepth = Math.max(maxDepth, result.depth)
  }

  return NextResponse.json({
    success: true,
    summary: {
      startBeliefCount: startBeliefIds.length,
      totalUpdatedArguments,
      totalUpdatedBeliefs,
      maxDepth,
    },
    description:
      'Full score propagation complete. All belief positivity and stabilityScore ' +
      'fields have been updated to match their computed argument-tree scores.',
  })
}
