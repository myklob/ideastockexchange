import { NextResponse } from 'next/server'
import { fetchCorpusLeverage } from '@/features/belief-analysis/lib/leverage'
import { fetchCorpusExposure } from '@/features/belief-analysis/lib/exposure'
import {
  GAP_WEIGHTS,
  LOAD_BEARING_WEIGHT,
  OPEN_RANGE_THRESHOLD,
  FRAGILE_CONCENTRATION,
} from '@/core/scoring/decision-leverage'

/**
 * The work queue as JSON: every unsettled argument edge in the corpus, ranked
 * by the conclusion score riding on it, plus the per-belief roll-up. Built for
 * agents picking work — the thresholds ride along so a consumer can reproduce
 * the classification instead of trusting it.
 *
 * `?limit=n` caps the returned edges (default 100, max 500).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const requested = parseInt(url.searchParams.get('limit') ?? '100', 10)
  const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 500) : 100

  const [corpus, exposure] = await Promise.all([fetchCorpusLeverage(), fetchCorpusExposure()])

  return NextResponse.json({
    summary: {
      beliefsConsidered: corpus.beliefsConsidered,
      openEdges: corpus.openQuestions.length,
      totalAtStake: corpus.totalAtStake,
      fragileBeliefs: corpus.fragileBeliefs.map(b => ({
        id: b.belief.id,
        slug: b.belief.slug,
        concentration: b.concentration,
        totalAtStake: b.totalAtStake,
      })),
    },
    parameters: {
      gapWeights: GAP_WEIGHTS,
      loadBearingWeight: LOAD_BEARING_WEIGHT,
      openRangeThreshold: OPEN_RANGE_THRESHOLD,
      fragileConcentration: FRAGILE_CONCENTRATION,
    },
    beliefs: corpus.beliefs.map(b => ({
      id: b.belief.id,
      slug: b.belief.slug,
      statement: b.belief.statement,
      totalAtStake: b.totalAtStake,
      concentration: b.concentration,
      cruxCount: b.cruxes.length,
      loadBearingCount: b.loadBearing.length,
    })),
    openQuestions: corpus.openQuestions.slice(0, limit),
    truncated: corpus.openQuestions.length > limit,
    evidenceExposure: {
      countedFromEvidence: exposure.countedFromEvidence,
      exposedPoints: exposure.exposedPoints,
      exposedShare: exposure.exposedShare,
      unrecordedCount: exposure.unrecordedCount,
      tierUnconfirmedCount: exposure.tierUnconfirmedCount,
      falsifiedCount: exposure.falsifiedCount,
      rows: exposure.rows.slice(0, limit),
    },
  })
}
