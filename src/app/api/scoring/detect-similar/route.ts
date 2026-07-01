/**
 * Similar-Belief Detection API
 *
 * POST /api/scoring/detect-similar
 *   Body (optional): { "threshold": 0.35 }
 *
 * Scores every belief pair for equivalency and persists SimilarBelief edges,
 * linking parallel phrasings of the same claim. Returns the detection summary
 * including the matched pairs, strongest first.
 *
 * GET returns a status snapshot (belief count, existing edge count).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  detectSimilarBeliefs,
  DEFAULT_SIMILARITY_THRESHOLD,
} from '@/lib/detect-similar-beliefs'

export async function GET() {
  const [beliefCount, edgeCount] = await Promise.all([
    prisma.belief.count(),
    prisma.similarBelief.count(),
  ])
  return NextResponse.json({
    status: 'ready',
    beliefCount,
    similarBeliefEdges: edgeCount,
    note: 'POST to this endpoint to (re)detect similar-belief edges.',
  })
}

export async function POST(request: NextRequest) {
  let threshold = DEFAULT_SIMILARITY_THRESHOLD
  try {
    const body = await request.json()
    if (typeof body?.threshold === 'number') threshold = body.threshold
  } catch {
    // No/invalid JSON body — use the default threshold.
  }

  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    return NextResponse.json(
      { error: 'threshold must be a number in [0, 1]' },
      { status: 400 },
    )
  }

  const summary = await detectSimilarBeliefs(threshold)
  return NextResponse.json({ success: true, threshold, summary })
}
