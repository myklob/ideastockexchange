/**
 * Batch Belief Score Propagation API
 *
 * POST /api/scoring/propagate-all
 *
 * Recomputes every stored score from its formula:
 *   1. Leaf pass — Evidence EVS and ObjectiveCriteria totals.
 *   2. Graph pass — bottom-up propagation through the Argument graph,
 *      rewriting argument impact/argumentScore and belief
 *      positivity/stabilityScore for every ancestor.
 *
 * Useful after bulk imports or whenever scores appear out-of-sync. The same
 * logic runs from `npm run scores:recompute` (and at the end of db:seed).
 *
 * GET /api/scoring/propagate-all
 *
 * Returns a count of beliefs in the database without running propagation.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recomputeAllScores } from '@/lib/recompute-all-scores'

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

// ─── POST (run full recomputation) ──────────────────────────────────────────

export async function POST() {
  const summary = await recomputeAllScores()

  return NextResponse.json({
    success: true,
    summary,
    description:
      'Full score recomputation complete. Evidence EVS, objective criteria totals, ' +
      'argument impact scores, and belief positivity/stability now match their ' +
      'computed argument-tree values.',
  })
}
