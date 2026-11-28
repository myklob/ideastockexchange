/**
 * The monthly settlement job. Cron it shortly after each epoch boundary
 * (00:10 UTC on the 1st, right after the freeze window lifts):
 *
 *   npx tsx scripts/run-epoch.ts                  # settle the just-ended epoch
 *   npx tsx scripts/run-epoch.ts --epoch 2026-07  # settle a specific epoch
 *
 * Snapshots the graph (immutable, versioned, archived inputs), settles every
 * contract due, pays winners $1.00/share, runs the manipulation monitors,
 * and squares the margin book. Idempotent per epoch.
 */

import { prisma } from '@/lib/prisma'
import { runEpoch } from '@/lib/markets/settle'
import { epochLabelFor, previousEpoch, isValidEpochLabel } from '@/lib/markets/epoch'

async function main() {
  const idx = process.argv.indexOf('--epoch')
  const epoch = idx >= 0 ? process.argv[idx + 1] : previousEpoch(epochLabelFor(new Date()))
  if (!epoch || !isValidEpochLabel(epoch)) {
    console.error('Usage: npx tsx scripts/run-epoch.ts [--epoch YYYY-MM]')
    process.exit(1)
  }

  console.log(`Running epoch ${epoch}...`)
  const summary = await runEpoch(epoch)
  console.log(`  Snapshots: ${summary.snapshotsCreated} created, ${summary.snapshotsExisting} already existed`)
  console.log(`  Contracts settled: ${summary.contractsSettled}`)
  console.log(`  Payouts: $${summary.payoutsTotal.toFixed(2)}`)
  console.log(`  Manipulation flags: ${summary.flagsCreated}`)
  console.log(`  Margin repaid: $${summary.loansRepaid.toFixed(2)}, defaulted: $${summary.loansDefaulted.toFixed(2)}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
