/**
 * Seeds the featured prediction-market contracts as real database rows,
 * porting the old static demo list (src/lib/markets/contracts.ts) onto live
 * LMSR markets with future resolution epochs. Also seeds one of each
 * formerly-deferred contract type: an ALGORITHM_DELTA meta-market and a
 * PLATFORM_FAILURE short. Idempotent per (belief, type, epoch, threshold).
 */

import { prisma } from '../src/lib/prisma'
import { FEATURED_CONTRACTS } from '../src/lib/markets/contracts'
import { epochLabelFor, nextEpoch } from '../src/lib/markets/epoch'

function futureEpochs(): { near: string; quarter: string; yearEnd: string } {
  const current = epochLabelFor(new Date())
  const near = nextEpoch(current)
  const quarter = nextEpoch(nextEpoch(near))
  const year = current.slice(0, 4)
  const yearEnd = `${year}-12` > quarter ? `${year}-12` : nextEpoch(quarter)
  return { near, quarter, yearEnd }
}

async function ensureBelief(slug: string, statement: string) {
  const existing = await prisma.belief.findUnique({ where: { slug } })
  if (existing) return existing
  return prisma.belief.create({ data: { slug, statement } })
}

async function main() {
  const { near, quarter, yearEnd } = futureEpochs()
  const epochFor = (original: string): string => {
    if (original.startsWith('2026-05')) return near
    if (original.startsWith('2026-07')) return quarter
    return yearEnd
  }

  let created = 0
  for (const featured of FEATURED_CONTRACTS) {
    const belief = await ensureBelief(featured.beliefSlug, featured.beliefStatement)
    const resolutionEpoch = epochFor(featured.resolutionEpoch)
    const existing = await prisma.marketContract.findFirst({
      where: {
        beliefId: belief.id,
        contractType: 'SCORE',
        thresholdValue: featured.threshold,
        direction: featured.direction,
        resolutionEpoch,
      },
    })
    if (existing) continue
    await prisma.marketContract.create({
      data: {
        beliefId: belief.id,
        contractType: 'SCORE',
        thresholdValue: featured.threshold,
        direction: featured.direction,
        resolutionEpoch,
        qYes: featured.state.qYes,
        qNo: featured.state.qNo,
        bParameter: featured.state.b,
      },
    })
    created++
  }

  // Meta-market on algorithm governance (built against the design warning —
  // see the governance note in docs/MARKET_LAYER_SPEC.md).
  const ubi = await ensureBelief(
    'universal-basic-income-should-be-implemented',
    'Universal Basic Income should be implemented in developed nations',
  )
  const meta = await prisma.marketContract.findFirst({
    where: { contractType: 'ALGORITHM_DELTA', beliefId: ubi.id, resolutionEpoch: quarter },
  })
  if (!meta) {
    await prisma.marketContract.create({
      data: {
        beliefId: ubi.id,
        contractType: 'ALGORITHM_DELTA',
        thresholdValue: 0,
        direction: 'ABOVE',
        resolutionEpoch: quarter,
      },
    })
    created++
  }

  // Shorting the platform: YES iff the snapshot job misses its 72h grace window.
  const short = await prisma.marketContract.findFirst({
    where: { contractType: 'PLATFORM_FAILURE', resolutionEpoch: near },
  })
  if (!short) {
    await prisma.marketContract.create({
      data: {
        contractType: 'PLATFORM_FAILURE',
        thresholdValue: 0,
        direction: 'ABOVE',
        resolutionEpoch: near,
      },
    })
    created++
  }

  console.log(`Seeded ${created} market contract(s). Epochs: ${near}, ${quarter}, ${yearEnd}.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
