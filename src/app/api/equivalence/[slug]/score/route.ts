import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Compute the final equivalence score from stored component scores.
 *
 * Formula:
 *   Equivalence = (0.40 × synonymConvergenceScore)
 *               + (0.40 × overlapScore)
 *               + (0.20 × argumentBalance)
 *               + networkAdjustment
 *               − totalPenalty
 *
 * Overlap Score = (subject × 0.25) + (predicate × 0.35) + (context × 0.20) + (mechanism × 0.20)
 *
 * Verdict thresholds:
 *   90–100% → merge
 *   75–89%  → merge_with_note
 *   50–74%  → link
 *   < 50%   → separate
 */
function computeEquivalenceScore(analysis: {
  synonymConvergenceScore: number
  subjectOverlap: number
  predicateOverlap: number
  contextOverlap: number
  mechanismOverlap: number
  argumentBalance: number
  networkAdjustment: number
  totalPenalty: number
}): { overlapScore: number; finalEquivalenceScore: number; verdict: string } {
  const overlapScore =
    analysis.subjectOverlap * 0.25 +
    analysis.predicateOverlap * 0.35 +
    analysis.contextOverlap * 0.20 +
    analysis.mechanismOverlap * 0.20

  const raw =
    0.40 * analysis.synonymConvergenceScore +
    0.40 * overlapScore +
    0.20 * analysis.argumentBalance +
    analysis.networkAdjustment -
    analysis.totalPenalty

  const finalEquivalenceScore = Math.max(0, Math.min(1, raw))

  let verdict: string
  if (finalEquivalenceScore >= 0.90) {
    verdict = 'merge'
  } else if (finalEquivalenceScore >= 0.75) {
    verdict = 'merge_with_note'
  } else if (finalEquivalenceScore >= 0.50) {
    verdict = 'link'
  } else {
    verdict = 'separate'
  }

  return { overlapScore, finalEquivalenceScore, verdict }
}

/**
 * POST /api/equivalence/[slug]/score
 * Recalculate and persist the final equivalence score for an analysis.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const analysis = await prisma.equivalenceAnalysis.findUnique({
    where: { slug },
  })

  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
  }

  const { overlapScore, finalEquivalenceScore, verdict } = computeEquivalenceScore(analysis)

  const updated = await prisma.equivalenceAnalysis.update({
    where: { slug },
    data: { overlapScore, finalEquivalenceScore, verdict },
  })

  return NextResponse.json({
    overlapScore,
    finalEquivalenceScore,
    verdict,
    analysis: updated,
  })
}

/**
 * GET /api/equivalence/[slug]/score
 * Preview the equivalence score without persisting it.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const analysis = await prisma.equivalenceAnalysis.findUnique({
    where: { slug },
  })

  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
  }

  const result = computeEquivalenceScore(analysis)

  return NextResponse.json(result)
}
