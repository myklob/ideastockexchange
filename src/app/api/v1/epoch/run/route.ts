/**
 * Scheduled settlement endpoint — the production home of scripts/run-epoch.ts.
 * vercel.json crons hit this daily shortly after the freeze window lifts;
 * runEpoch is idempotent per epoch, so re-runs after the first successful
 * settlement are no-ops (snapshots already exist, contracts already settled).
 * Without a scheduler the accumulation story is fiction: no snapshots, no
 * settlement, and PLATFORM_FAILURE contracts resolve YES on the missed grace
 * window — which is exactly the failure they exist to price.
 *
 * Auth: when CRON_SECRET is set (Vercel injects it on cron requests), the
 * Authorization header must be `Bearer ${CRON_SECRET}`. Unset (local dev),
 * the route is open.
 */

import { NextResponse } from 'next/server'
import { runEpoch } from '@/lib/markets/settle'
import { epochLabelFor, previousEpoch, isValidEpochLabel } from '@/lib/markets/epoch'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const requested = searchParams.get('epoch')
  const epoch = requested ?? previousEpoch(epochLabelFor(new Date()))
  if (!isValidEpochLabel(epoch)) {
    return NextResponse.json({ error: `Invalid epoch label: ${epoch}` }, { status: 400 })
  }

  try {
    const summary = await runEpoch(epoch)
    return NextResponse.json({ ...summary, epoch })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Epoch run failed.'
    const status = (e as { status?: number }).status ?? 500
    return NextResponse.json({ epoch, error: message }, { status })
  }
}
