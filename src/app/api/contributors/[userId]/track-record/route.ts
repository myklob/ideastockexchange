/**
 * GET /api/contributors/[userId]/track-record
 *
 * The behavioral-tracking counter to selective skepticism, made transparent.
 * Engagement platforms hide their ranking algorithm; here the opposite rule
 * applies: anyone can fetch exactly how any contributor's vote weight is
 * derived — the raw inputs, both factors, the formula, and the clamps.
 *
 * Read-only by construction. The weight is computed from the track record at
 * vote time (src/lib/fallacy/calibration.ts) and can never be submitted:
 * consistent accuracy raises influence, a tribal one-sided pattern sinks it,
 * and filing volume does nothing at all.
 */

import { NextResponse } from 'next/server'
import { callerRecordFor } from '@/lib/fallacy/caller-record'
import {
  accuracyRate,
  sideBalance,
  callerCredibility,
  CREDIBILITY_FLOOR,
  CREDIBILITY_CEILING,
  MIN_RESOLVED_FOR_ACCURACY,
  MIN_FLAGGED_FOR_BALANCE,
} from '@/lib/fallacy/calibration'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params
  if (!userId || userId.length > 128) {
    return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 })
  }

  const record = await callerRecordFor(userId)
  const resolved = record.upheld + record.rejected
  const flagged = record.flaggedAgreeSide + record.flaggedDisagreeSide

  return NextResponse.json({
    userId,
    record,
    derivation: {
      accuracy: accuracyRate(record),
      accuracyApplied: resolved >= MIN_RESOLVED_FOR_ACCURACY,
      sideBalance: sideBalance(record),
      balanceApplied: flagged >= MIN_FLAGGED_FOR_BALANCE,
      formula:
        'weight = clamp(accuracyFactor × balanceFactor); ' +
        'accuracyFactor = 2 × accuracy (neutral 1.0 until ' +
        `${MIN_RESOLVED_FOR_ACCURACY} resolved claims); ` +
        'balanceFactor = 0.4 + 0.9 × sideBalance (neutral 1.0 until ' +
        `${MIN_FLAGGED_FOR_BALANCE} filed claims)`,
      clamp: { floor: CREDIBILITY_FLOOR, ceiling: CREDIBILITY_CEILING },
    },
    credibility: callerCredibility(record),
    note:
      'This multiplier weights fallacy-claim and grouping votes. It is ' +
      'computed server-side from the record above and is never submitted. ' +
      'Being right raises it; flagging both sides raises it; volume alone ' +
      'moves nothing.',
  })
}
