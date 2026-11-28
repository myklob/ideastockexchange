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
import { propagateAllBeliefScores } from '@/lib/propagate-belief-scores'

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
  const result = await propagateAllBeliefScores()

  return NextResponse.json({
    success: true,
    summary: {
      startBeliefCount: result.startedFrom,
      totalUpdatedArguments: result.updatedArguments,
      totalUpdatedBeliefs: result.updatedBeliefs,
      maxDepth: result.maxDepth,
    },
    description:
      'Full score propagation complete. All belief positivity and stabilityScore ' +
      'fields have been updated to match their computed argument-tree scores.',
  })
}
