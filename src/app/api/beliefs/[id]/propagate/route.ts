/**
 * Belief Score Propagation API
 *
 * POST /api/beliefs/[id]/propagate
 *
 * Manually triggers recursive score propagation starting from a given belief.
 * Useful after bulk imports, seeding, or any out-of-band data changes that
 * bypass the normal mutation APIs.
 *
 * The propagation walks upward through the belief dependency graph:
 *   belief B → argument A (B is a reason for parent P) → parent belief P → ...
 *
 * For each level it recomputes:
 *   - argument.impactScore = sign × childTruth × |linkageScore| × importanceScore × 100
 *   - belief.stabilityScore from the updated argument impactScores
 *
 * Returns a summary of every argument and belief that was updated.
 *
 * GET /api/beliefs/[id]/propagate
 *
 * Returns a dry-run preview: computes what would change without writing to the DB.
 * Useful for debugging the belief graph topology and score calculations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchBeliefById, computeBeliefScores } from '@/features/belief-analysis/data/fetch-belief'
import { propagateBeliefScores } from '@/lib/propagate-belief-scores'
import { computeArgumentImpactScore } from '@/core/scoring/scoring-engine'

// ─── GET (dry-run preview) ──────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const beliefId = Number(id)

  if (Number.isNaN(beliefId)) {
    return NextResponse.json({ error: 'Invalid belief id' }, { status: 400 })
  }

  const belief = await fetchBeliefById(beliefId)
  if (!belief) {
    return NextResponse.json({ error: 'Belief not found' }, { status: 404 })
  }

  const scores = computeBeliefScores(belief)

  // Find all arguments where this belief is the child (used as a reason for a parent)
  const argumentsAsChild = await prisma.argument.findMany({
    where: { beliefId },
    include: {
      parentBelief: { select: { id: true, slug: true, statement: true } },
    },
  })

  const preview = argumentsAsChild.map(arg => {
    const currentImpactScore = arg.impactScore
    const projectedImpactScore = computeArgumentImpactScore(
      arg.side,
      scores.importanceWeightedScore,
      arg.linkageScore,
      arg.importanceScore,
    )
    return {
      argumentId: arg.id,
      side: arg.side,
      linkageScore: arg.linkageScore,
      importanceScore: arg.importanceScore,
      currentImpactScore,
      projectedImpactScore,
      delta: Math.round((projectedImpactScore - currentImpactScore) * 10) / 10,
      parentBelief: arg.parentBelief,
    }
  })

  return NextResponse.json({
    beliefId,
    beliefStatement: belief.statement,
    currentScores: {
      importanceWeightedScore: scores.importanceWeightedScore,
      stabilityScore: scores.stabilityScore,
      overallScore: scores.overallScore,
    },
    affectedArguments: preview,
    note: 'This is a dry-run preview. POST to this endpoint to apply the propagation.',
  })
}

// ─── POST (apply propagation) ───────────────────────────────────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const beliefId = Number(id)

  if (Number.isNaN(beliefId)) {
    return NextResponse.json({ error: 'Invalid belief id' }, { status: 400 })
  }

  // Verify the belief exists before triggering propagation
  const belief = await fetchBeliefById(beliefId)
  if (!belief) {
    return NextResponse.json({ error: 'Belief not found' }, { status: 404 })
  }

  const result = await propagateBeliefScores(beliefId)

  return NextResponse.json({
    success: true,
    beliefId,
    beliefStatement: belief.statement,
    propagation: {
      updatedArgumentCount: result.updatedArgumentIds.length,
      updatedBeliefCount: result.updatedBeliefIds.length,
      maxDepth: result.depth,
      updatedArgumentIds: result.updatedArgumentIds,
      updatedBeliefIds: result.updatedBeliefIds,
    },
    description:
      'Score propagation complete. All ancestor beliefs have been updated ' +
      'to reflect the current strength of this belief.',
  })
}
