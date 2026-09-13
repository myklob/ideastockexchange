import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchBeliefLeverage } from '@/features/belief-analysis/lib/leverage'
import {
  GAP_WEIGHTS,
  LOAD_BEARING_WEIGHT,
  OPEN_RANGE_THRESHOLD,
  summarizeLeverage,
} from '@/core/scoring/decision-leverage'

/**
 * Decision Leverage for one belief: which argument edge still holds unsettled
 * conclusion score, ranked. The thresholds ride along in the payload so a
 * consumer can reproduce the classification instead of trusting it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const beliefId = parseInt(id, 10)

  if (isNaN(beliefId)) {
    return NextResponse.json({ error: 'Invalid belief ID' }, { status: 400 })
  }

  const belief = await prisma.belief.findUnique({
    where: { id: beliefId },
    select: { id: true, slug: true, statement: true },
  })

  if (!belief) {
    return NextResponse.json({ error: 'Belief not found' }, { status: 404 })
  }

  const leverage = await fetchBeliefLeverage(beliefId)

  return NextResponse.json({
    belief,
    summary: {
      totalAtStake: leverage.totalAtStake,
      concentration: leverage.concentration,
      cruxCount: leverage.cruxes.length,
      loadBearingCount: leverage.loadBearing.length,
      verdict: summarizeLeverage(leverage),
    },
    parameters: {
      gapWeights: GAP_WEIGHTS,
      loadBearingWeight: LOAD_BEARING_WEIGHT,
      openRangeThreshold: OPEN_RANGE_THRESHOLD,
    },
    edges: leverage.edges,
  })
}
