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
import { propagateBeliefScores, previewArgumentImpacts } from '@/lib/propagate-belief-scores'

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

  // The same per-argument recompute the POST applies (truth, effective
  // importance, sibling uniqueness), run without writes.
  const impacts = await previewArgumentImpacts(beliefId)

  const parentBeliefs = await prisma.belief.findMany({
    where: { id: { in: impacts.map(p => p.parentBeliefId) } },
    select: { id: true, slug: true, statement: true },
  })
  const parentById = new Map(parentBeliefs.map(b => [b.id, b]))

  const preview = impacts.map(p => ({
    argumentId: p.argumentId,
    side: p.side,
    linkageScore: p.linkageScore,
    importanceScore: p.effectiveImportance,
    uniquenessScore: p.uniqueness,
    currentImpactScore: p.currentImpactScore,
    projectedImpactScore: p.projectedImpactScore,
    delta: Math.round((p.projectedImpactScore - p.currentImpactScore) * 10) / 10,
    parentBelief: parentById.get(p.parentBeliefId) ?? null,
  }))

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
