/**
 * Scheduled settlement endpoint — the production home of scripts/run-epoch.ts.
 * vercel.json crons hit this daily shortly after the freeze window lifts;
 * runEpoch is idempotent per epoch, so re-runs after the first successful
 * settlement are no-ops (snapshots already exist, contracts already settled).
 * Without a scheduler the accumulation story is fiction: no snapshots, no
 * settlement, and PLATFORM_FAILURE contracts resolve YES on the missed grace
 * window — which is exactly the failure they exist to price.
 *
 * Auth: the Authorization header must be `Bearer ${CRON_SECRET}`. Vercel
 * forwards that header on cron invocations only when the project defines
 * CRON_SECRET, so it is a required production variable; with it unset the
 * route is open in development and disabled (503) in production.
 *
 * Only the most recently completed epoch can be run: snapshots are written
 * once and referenced forever, so backfilling history with today's scores
 * requires the explicit ALLOW_EPOCH_BACKFILL=1 opt-in.
 */

import { NextResponse } from 'next/server'
import { runEpoch } from '@/lib/markets/settle'
import { epochLabelFor, previousEpoch, isValidEpochLabel } from '@/lib/markets/epoch'
import { requireOperatorSecret } from '@/lib/public-guard'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const denied = requireOperatorSecret(request)
  if (denied) return denied

  const { searchParams } = new URL(request.url)
  const latestCompleted = previousEpoch(epochLabelFor(new Date()))
  const epoch = searchParams.get('epoch') ?? latestCompleted
  if (!isValidEpochLabel(epoch)) {
    return NextResponse.json({ error: `Invalid epoch label: ${epoch}` }, { status: 400 })
  }
  if (epoch !== latestCompleted && process.env.ALLOW_EPOCH_BACKFILL !== '1') {
    return NextResponse.json(
      { error: `Only the most recently completed epoch (${latestCompleted}) can be run. Set ALLOW_EPOCH_BACKFILL=1 to backfill history deliberately.` },
      { status: 400 },
    )
  }

  try {
    const summary = await runEpoch(epoch)
    return NextResponse.json({ ...summary, epoch })
  } catch (e) {
    const status = (e as { status?: number }).status
    if (status && status < 500) {
      const message = e instanceof Error ? e.message : 'Epoch run rejected.'
      return NextResponse.json({ epoch, error: message }, { status })
    }
    console.error('[GET /api/v1/epoch/run]', e)
    return NextResponse.json({ epoch, error: 'Epoch run failed.' }, { status: 500 })
  }
}
