/**
 * Integration tests for the prediction-market layer against a live SQLite
 * database built from the committed migration chain.
 *
 * Covers the full spec including the formerly-deferred items: LMSR trading
 * with fees and graduation, the peer-to-peer order book, bundles (spreads),
 * play-money leverage with logged defaults, epoch snapshots + settlement,
 * ALGORITHM_DELTA meta-markets, PLATFORM_FAILURE shorts, manipulation
 * monitoring, the graph freeze, and the firewall invariant that no amount
 * of trading moves a belief score.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve(__dirname, 'tmp-market-layer.test.db')

/* eslint-disable @typescript-eslint/no-explicit-any */
let prisma: any
let service: any
let settle: any
let engine: any
let epochLib: any
let lmsr: any
let runIngest: any
/* eslint-enable @typescript-eslint/no-explicit-any */

let beliefId: number
let initialScore: number
let EPOCH_A: string // trading epoch (near future)
let EPOCH_B: string // settlement epoch (after A)
const EPOCH_PAST = '2025-01'

function applyMigrations(file: string) {
  const db = new Database(file)
  const root = path.resolve(__dirname, '../../prisma/migrations')
  const dirs = fs
    .readdirSync(root)
    .filter(d => fs.existsSync(path.join(root, d, 'migration.sql')))
    .sort()
  for (const d of dirs) {
    db.exec(fs.readFileSync(path.join(root, d, 'migration.sql'), 'utf8'))
  }
  db.close()
}

async function balanceOf(username: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { username } })
  return user.currentBalance
}

beforeAll(async () => {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
  applyMigrations(DB_PATH)
  process.env.DATABASE_URL = `file:${DB_PATH}`

  ;({ prisma } = await import('@/lib/prisma'))
  service = await import('@/lib/markets/service')
  settle = await import('@/lib/markets/settle')
  engine = await import('@/lib/markets/engine')
  epochLib = await import('@/lib/markets/epoch')
  lmsr = await import('@/lib/markets/lmsr')
  ;({ runIngest } = await import('@/lib/agent-ingest/ingest'))

  EPOCH_A = epochLib.nextEpoch(epochLib.epochLabelFor(new Date()))
  EPOCH_B = epochLib.nextEpoch(EPOCH_A)

  // Belief graph: 2 agree args (impact 60) + 1 disagree (impact 20)
  // → truth = (120/140) × 0.625 ≈ 0.5357 at default claimStrength 0.5.
  const belief = await prisma.belief.create({
    data: { slug: 'carbon-pricing-reduces-emissions', statement: 'Carbon pricing reduces emissions' },
  })
  beliefId = belief.id
  for (const [slug, side, impact] of [
    ['cp-child-1', 'agree', 60],
    ['cp-child-2', 'agree', 60],
    ['cp-child-3', 'disagree', 20],
  ] as const) {
    const child = await prisma.belief.create({ data: { slug, statement: slug } })
    await prisma.argument.create({
      data: { parentBeliefId: beliefId, beliefId: child.id, side, impactScore: impact },
    })
  }
  initialScore = await service.currentProvisionalScore(prisma, beliefId)
})

afterAll(async () => {
  await prisma?.$disconnect()
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
})

describe('contract creation', () => {
  it('computes the expected provisional score', () => {
    expect(initialScore).toBeCloseTo((120 / 140) * 0.625, 6)
  })

  it('validates epochs, thresholds, and contract types', async () => {
    const base = {
      beliefSlug: 'carbon-pricing-reduces-emissions',
      thresholdValue: 0.5,
      direction: 'ABOVE' as const,
    }
    await expect(service.createContract({ ...base, resolutionEpoch: 'not-an-epoch' })).rejects.toThrow(/YYYY-MM/)
    await expect(service.createContract({ ...base, resolutionEpoch: EPOCH_PAST })).rejects.toThrow(/future/)
    await expect(
      service.createContract({ ...base, resolutionEpoch: EPOCH_A, thresholdValue: 1.5 }),
    ).rejects.toThrow(/\[0,1\]/)
    await expect(
      service.createContract({ ...base, beliefSlug: 'no-such-slug', resolutionEpoch: EPOCH_A }),
    ).rejects.toThrow(/No belief/)
    await expect(
      service.createContract({
        contractType: 'PLATFORM_FAILURE', beliefSlug: 'carbon-pricing-reduces-emissions',
        direction: 'ABOVE', resolutionEpoch: EPOCH_A,
      }),
    ).rejects.toThrow(/no belief/)
  })
})

describe('LMSR trading', () => {
  let contractId: string

  it('buys at the LMSR quote plus fee, records position and tick', async () => {
    const contract = await service.createContract({
      beliefSlug: 'carbon-pricing-reduces-emissions',
      thresholdValue: 0.5,
      direction: 'ABOVE',
      resolutionEpoch: EPOCH_A,
    })
    contractId = contract.id

    const expectedCost = lmsr.costToBuy({ qYes: 0, qNo: 0, b: 100 }, 'YES', 50)
    const result = await service.tradeLmsr({
      contractId, username: 'alice', outcome: 'YES', side: 'BUY', shares: 50,
    })
    expect(result.priceYes).toBeGreaterThan(0.5)
    expect(result.pricePerShare * 50).toBeCloseTo(expectedCost, 6)
    expect(await balanceOf('alice')).toBeCloseTo(10_000 - expectedCost * 1.01, 4)

    const position = await prisma.marketPosition.findFirst({
      where: { contractId, user: { username: 'alice' } },
    })
    expect(position.sharesYes).toBe(50)
    expect(position.avgCostYes).toBeCloseTo(expectedCost / 50, 8)

    const tick = await prisma.priceTick.findFirst({ where: { contractId } })
    expect(tick.priceYes).toBeCloseTo(result.priceYes, 8)
    expect(tick.forecastYes).not.toBeNull()
  })

  it('sells held shares back to the maker; naked shorts are rejected', async () => {
    const before = await balanceOf('alice')
    const result = await service.tradeLmsr({
      contractId, username: 'alice', outcome: 'YES', side: 'SELL', shares: 20,
    })
    expect(result.pricePerShare).toBeGreaterThan(0)
    expect(await balanceOf('alice')).toBeGreaterThan(before)
    const position = await prisma.marketPosition.findFirst({
      where: { contractId, user: { username: 'alice' } },
    })
    expect(position.sharesYes).toBe(30)

    await expect(
      service.tradeLmsr({ contractId, username: 'bob', outcome: 'YES', side: 'SELL', shares: 1 }),
    ).rejects.toThrow(/No naked shorts/)
  })

  it('collects fees into the liquidity pool and tracks volume', async () => {
    const contract = await prisma.marketContract.findUnique({ where: { id: contractId } })
    expect(contract.volume).toBe(70)
    expect(contract.feesCollected).toBeGreaterThan(0)
    expect(contract.liquidityPool).toBeCloseTo(contract.feesCollected, 10)
  })
})

describe('graduation to the order book', () => {
  let contractId: string

  it('graduates at 1,000 shares of volume and closes the LMSR path', async () => {
    const contract = await service.createContract({
      beliefSlug: 'carbon-pricing-reduces-emissions',
      thresholdValue: 0.6,
      direction: 'ABOVE',
      resolutionEpoch: EPOCH_A,
    })
    contractId = contract.id

    await service.tradeLmsr({ contractId, username: 'dave', outcome: 'YES', side: 'BUY', shares: 100 })
    await service.tradeLmsr({ contractId, username: 'carol', outcome: 'YES', side: 'BUY', shares: 500 })
    const graduating = await service.tradeLmsr({
      contractId, username: 'carol', outcome: 'YES', side: 'SELL', shares: 500,
    })
    expect(graduating.graduated).toBe(true)

    const updated = await prisma.marketContract.findUnique({ where: { id: contractId } })
    expect(updated.pricingMode).toBe('ORDER_BOOK')
    expect(updated.volume).toBe(1100)

    await expect(
      service.tradeLmsr({ contractId, username: 'carol', outcome: 'YES', side: 'BUY', shares: 1 }),
    ).rejects.toThrow(/graduated/)
  })

  it('matches limit orders at the maker price; taker pays the fee', async () => {
    const daveBefore = await balanceOf('dave')
    const carolBefore = await balanceOf('carol')

    // dave (holds 100 YES) rests an ask; carol lifts it at her higher limit.
    const ask = await service.placeOrder({
      contractId, username: 'dave', side: 'SELL', outcome: 'YES', limitPrice: 0.55, quantity: 10,
    })
    expect(ask.order.status).toBe('OPEN')

    const bid = await service.placeOrder({
      contractId, username: 'carol', side: 'BUY', outcome: 'YES', limitPrice: 0.6, quantity: 10,
    })
    expect(bid.order.status).toBe('FILLED')
    expect(bid.fills).toHaveLength(1)
    expect(bid.fills[0].price).toBe(0.55) // maker price, not taker limit

    // Maker receives proceeds, no fee; taker pays price + 1% fee.
    expect(await balanceOf('dave')).toBeCloseTo(daveBefore + 5.5, 6)
    expect(await balanceOf('carol')).toBeCloseTo(carolBefore - 5.5 - 0.055, 6)

    const davePosition = await prisma.marketPosition.findFirst({
      where: { contractId, user: { username: 'dave' } },
    })
    const carolPosition = await prisma.marketPosition.findFirst({
      where: { contractId, user: { username: 'carol' } },
    })
    expect(davePosition.sharesYes).toBe(90)
    expect(carolPosition.sharesYes).toBe(10)

    const trade = await prisma.marketTrade.findFirst({
      where: { contractId, source: 'BOOK' },
      include: { buyer: true, seller: true },
    })
    expect(trade.buyer.username).toBe('carol')
    expect(trade.seller.username).toBe('dave')
  })

  it('skips self-crossing orders (wash defense) and refunds cancelled escrow exactly', async () => {
    const resting = await service.placeOrder({
      contractId, username: 'carol', side: 'SELL', outcome: 'YES', limitPrice: 0.5, quantity: 5,
    })
    const crossing = await service.placeOrder({
      contractId, username: 'carol', side: 'BUY', outcome: 'YES', limitPrice: 0.55, quantity: 5,
    })
    expect(crossing.selfCrossSkipped).toBe(true)
    expect(crossing.fills).toHaveLength(0)
    expect(crossing.order.status).toBe('OPEN')

    const before = await balanceOf('carol')
    await service.cancelOrder(crossing.order.id, 'carol')
    // Escrow at limit 0.55 × 5 × (1 + 1% fee)
    expect(await balanceOf('carol')).toBeCloseTo(before + 0.55 * 5 * 1.01, 6)
    await service.cancelOrder(resting.order.id, 'carol')
  })

  it('rejects sell orders beyond held shares net of open commitments', async () => {
    await expect(
      service.placeOrder({
        contractId, username: 'carol', side: 'SELL', outcome: 'YES', limitPrice: 0.5, quantity: 999,
      }),
    ).rejects.toThrow(/Cannot sell/)
  })
})

describe('bundles: spreads executed atomically', () => {
  let lowContract: string
  let highContract: string

  it('buys a threshold spread as one structured product', async () => {
    const low = await service.createContract({
      beliefSlug: 'carbon-pricing-reduces-emissions',
      thresholdValue: 0.55, direction: 'ABOVE', resolutionEpoch: EPOCH_A,
    })
    const high = await service.createContract({
      beliefSlug: 'carbon-pricing-reduces-emissions',
      thresholdValue: 0.65, direction: 'ABOVE', resolutionEpoch: EPOCH_A,
    })
    lowContract = low.id
    highContract = high.id

    await service.resolveUser(prisma, 'erin')
    const before = await balanceOf('erin')
    const result = await service.executeBundle('erin', 'score in (0.55, 0.65]', [
      { contractId: low.id, outcome: 'YES', shares: 20 },
      { contractId: high.id, outcome: 'NO', shares: 20 },
    ])
    expect(result.bundle.legs).toHaveLength(2)
    expect(await balanceOf('erin')).toBeCloseTo(before - result.totalCost, 6)

    const positions = await prisma.marketPosition.findMany({
      where: { user: { username: 'erin' } },
    })
    expect(positions.find((p: { contractId: string }) => p.contractId === low.id).sharesYes).toBe(20)
    expect(positions.find((p: { contractId: string }) => p.contractId === high.id).sharesNo).toBe(20)
  })

  it('rolls back the whole bundle when any leg fails', async () => {
    const graduated = await prisma.marketContract.findFirst({ where: { pricingMode: 'ORDER_BOOK' } })
    const before = await balanceOf('erin')
    const bundlesBefore = await prisma.marketBundle.count()

    await expect(
      service.executeBundle('erin', 'bad bundle', [
        { contractId: lowContract, outcome: 'YES', shares: 5 },
        { contractId: graduated.id, outcome: 'NO', shares: 5 },
      ]),
    ).rejects.toThrow(/graduated/)

    expect(await balanceOf('erin')).toBe(before)
    expect(await prisma.marketBundle.count()).toBe(bundlesBefore)
    expect(highContract).toBeTruthy()
  })
})

describe('margin: play-money leverage', () => {
  it('caps total borrowing at portfolio equity (2x buying power)', async () => {
    const loan = await service.borrowMargin('frank', 10_000)
    expect(loan.outstanding).toBe(10_000)
    expect(await balanceOf('frank')).toBe(20_000)
    await expect(service.borrowMargin('frank', 1)).rejects.toThrow(/Borrow cap/)
  })

  it('repays oldest loans first', async () => {
    const result = await service.repayMargin('frank', 5_000)
    expect(result.repaid).toBe(5_000)
    expect(await balanceOf('frank')).toBe(15_000)
    const loan = await prisma.marginLoan.findFirst({ where: { user: { username: 'frank' } } })
    expect(loan.outstanding).toBe(5_000)
    expect(loan.status).toBe('OPEN')
  })
})

describe('settlement at the epoch boundary', () => {
  let b1: string // doomed longshot (frank & ivan lose)
  let b2: string // near-threshold winner (alice wins)
  let b3: string // ALGORITHM_DELTA meta-market
  let b4: string // PLATFORM_FAILURE within grace (NO)
  let b5: string // wash-trading pair
  let fakeNow: Date

  it('sets up epoch-B contracts and positions', async () => {
    fakeNow = new Date(epochLib.epochBoundary(EPOCH_B).getTime() + 60_000)

    b1 = (await service.createContract({
      beliefSlug: 'carbon-pricing-reduces-emissions',
      thresholdValue: 0.99, direction: 'ABOVE', resolutionEpoch: EPOCH_B,
    })).id
    b2 = (await service.createContract({
      beliefSlug: 'carbon-pricing-reduces-emissions',
      thresholdValue: 0.5, direction: 'ABOVE', resolutionEpoch: EPOCH_B,
    })).id
    b3 = (await service.createContract({
      contractType: 'ALGORITHM_DELTA',
      beliefSlug: 'carbon-pricing-reduces-emissions',
      direction: 'ABOVE', resolutionEpoch: EPOCH_B,
    })).id
    b4 = (await service.createContract({
      contractType: 'PLATFORM_FAILURE',
      direction: 'ABOVE', resolutionEpoch: EPOCH_B,
    })).id
    b5 = (await service.createContract({
      beliefSlug: 'carbon-pricing-reduces-emissions',
      thresholdValue: 0.3, direction: 'ABOVE', resolutionEpoch: EPOCH_B,
    })).id

    // Positions.
    await service.tradeLmsr({ contractId: b1, username: 'frank', outcome: 'YES', side: 'BUY', shares: 100 })
    await service.tradeLmsr({ contractId: b2, username: 'alice', outcome: 'YES', side: 'BUY', shares: 40 })
    await service.tradeLmsr({ contractId: b2, username: 'bob', outcome: 'NO', side: 'BUY', shares: 10 })
    await service.tradeLmsr({ contractId: b3, username: 'gina', outcome: 'YES', side: 'BUY', shares: 10 })
    await service.tradeLmsr({ contractId: b4, username: 'henry', outcome: 'YES', side: 'BUY', shares: 10 })

    // ivan: borrow to the cap, then torch it on the losing side.
    await service.borrowMargin('ivan', 10_000)
    await service.tradeLmsr({ contractId: b1, username: 'ivan', outcome: 'YES', side: 'BUY', shares: 19_000 })
    expect(await balanceOf('ivan')).toBeLessThan(1_000)

    // ALGORITHM_DELTA baseline: prior-epoch snapshot under an older version
    // with a lower score, so a version change + higher score settles YES.
    await prisma.epochSnapshot.create({
      data: {
        beliefId, epoch: epochLib.previousEpoch(EPOCH_B),
        truthScore: 0.4, algorithmVersion: 'reasonrank-provisional-v0.0',
        graphArchive: '{}',
      },
    })

    // Near-threshold monitoring bait: an agent named like a winning holder
    // submitted an argument in the final week before the boundary.
    const agentAlice = await prisma.agent.create({ data: { name: 'alice', operator: 'test' } })
    const stub = await prisma.belief.create({ data: { slug: 'late-edit-arg', statement: 'Late edit argument stub' } })
    const lateArgument = await prisma.argument.create({
      data: {
        parentBeliefId: beliefId, beliefId: stub.id, side: 'agree',
        submittedByAgentId: agentAlice.id,
      },
    })
    await prisma.argument.update({
      where: { id: lateArgument.id },
      data: { createdAt: new Date(epochLib.epochBoundary(EPOCH_B).getTime() - 24 * 3600 * 1000) },
    })

    // Wash pair on b5: LMSR entry, then a book round large enough to trip
    // the pair-concentration monitor.
    await service.tradeLmsr({ contractId: b5, username: 'dave', outcome: 'YES', side: 'BUY', shares: 100 })
    await prisma.marketContract.update({ where: { id: b5 }, data: { pricingMode: 'ORDER_BOOK' } })
    await service.placeOrder({ contractId: b5, username: 'dave', side: 'SELL', outcome: 'YES', limitPrice: 0.5, quantity: 60 })
    await service.placeOrder({ contractId: b5, username: 'erin', side: 'BUY', outcome: 'YES', limitPrice: 0.5, quantity: 60 })
  })

  it('settles the epoch: snapshots, strict-inequality outcomes, $1 payouts', async () => {
    const aliceBefore = await balanceOf('alice')
    const ginaBefore = await balanceOf('gina')
    const henryBefore = await balanceOf('henry')

    const summary = await settle.runEpoch(EPOCH_B, fakeNow)
    expect(summary.snapshotsCreated).toBeGreaterThan(0)
    expect(summary.contractsSettled).toBe(5)

    const snapshot = await prisma.epochSnapshot.findUnique({
      where: { beliefId_epoch: { beliefId, epoch: EPOCH_B } },
    })
    expect(snapshot.truthScore).toBeCloseTo(initialScore, 6)
    expect(snapshot.algorithmVersion).toBe(engine.SCORING_ALGORITHM_VERSION)

    // b2: score ≈ 0.536 > 0.5 → YES. Alice's 40 shares pay $40.
    const settled = await prisma.marketContract.findUnique({ where: { id: b2 } })
    expect(settled.status).toBe('SETTLED')
    expect(settled.finalOutcome).toBe('YES')
    expect(settled.finalScore).toBeCloseTo(initialScore, 6)
    expect(await balanceOf('alice')).toBeCloseTo(aliceBefore + 40, 6)

    // b1: 0.536 < 0.99 → NO. YES holders get nothing.
    expect((await prisma.marketContract.findUnique({ where: { id: b1 } })).finalOutcome).toBe('NO')

    // b3: version changed AND score rose 0.4 → 0.536 → YES pays gina.
    const meta = await prisma.marketContract.findUnique({ where: { id: b3 } })
    expect(meta.finalOutcome).toBe('YES')
    expect(await balanceOf('gina')).toBeCloseTo(ginaBefore + 10, 6)

    // b4: settlement ran inside the grace window → the platform showed up → NO.
    expect((await prisma.marketContract.findUnique({ where: { id: b4 } })).finalOutcome).toBe('NO')
    expect(await balanceOf('henry')).toBeCloseTo(henryBefore, 6)

    // Positions zeroed after settlement.
    const alicePosition = await prisma.marketPosition.findFirst({
      where: { contractId: b2, user: { username: 'alice' } },
    })
    expect(alicePosition.sharesYes).toBe(0)
  })

  it('flags the near-threshold contract with the editor/holder overlap', async () => {
    const flag = await prisma.manipulationFlag.findFirst({
      where: { contractId: b2, reason: 'NEAR_THRESHOLD_EDITOR_POSITION' },
    })
    expect(flag).not.toBeNull()
    const details = JSON.parse(flag.details)
    expect(details.lateEditors).toContain('alice')
    expect(details.editorHolderOverlap).toContain('alice')
  })

  it('flags the concentrated buyer-seller pair as wash trading', async () => {
    const flag = await prisma.manipulationFlag.findFirst({
      where: { contractId: b5, reason: 'WASH_TRADING_PATTERN' },
    })
    expect(flag).not.toBeNull()
    const details = JSON.parse(flag.details)
    expect(details.share).toBeGreaterThan(0.4)
  })

  it('squares the margin book: repayment where possible, logged default where not', async () => {
    // frank repaid earlier + auto-repay at settlement.
    const frankLoan = await prisma.marginLoan.findFirst({ where: { user: { username: 'frank' } } })
    expect(frankLoan.status).toBe('REPAID')

    // ivan torched borrowed money on a losing contract: partial repayment,
    // remainder defaulted and logged.
    const ivanLoan = await prisma.marginLoan.findFirst({ where: { user: { username: 'ivan' } } })
    expect(ivanLoan.status).toBe('DEFAULTED')
    expect(ivanLoan.outstanding).toBeGreaterThan(0)
    expect(await balanceOf('ivan')).toBe(0)
  })

  it('is idempotent: a second run settles nothing new', async () => {
    const again = await settle.runEpoch(EPOCH_B, fakeNow)
    expect(again.contractsSettled).toBe(0)
    expect(again.snapshotsCreated).toBe(0)
  })

  it('reproduces the snapshot score exactly from the archived graph state', async () => {
    const snapshot = await prisma.epochSnapshot.findUnique({
      where: { beliefId_epoch: { beliefId, epoch: EPOCH_B } },
    })
    expect(engine.recomputeFromArchive(snapshot.graphArchive)).toBe(snapshot.truthScore)
  })

  it('PLATFORM_FAILURE settles YES when the snapshot job misses its grace window', async () => {
    const failed = await prisma.marketContract.create({
      data: {
        contractType: 'PLATFORM_FAILURE', thresholdValue: 0, direction: 'ABOVE',
        resolutionEpoch: EPOCH_PAST,
      },
    })
    const jack = await service.resolveUser(prisma, 'jack')
    await prisma.marketPosition.create({
      data: { userId: jack.id, contractId: failed.id, sharesYes: 10, avgCostYes: 0.2 },
    })
    const before = await balanceOf('jack')
    await settle.runEpoch(EPOCH_PAST, new Date())
    const settledContract = await prisma.marketContract.findUnique({ where: { id: failed.id } })
    expect(settledContract.finalOutcome).toBe('YES')
    expect(await balanceOf('jack')).toBeCloseTo(before + 10, 6)
  })
})

describe('the firewall and the freeze', () => {
  it('all that trading and settlement moved the belief score by exactly nothing', async () => {
    // The late-edit stub argument carries impactScore 0, so the provisional
    // score is unchanged from before any market existed.
    const after = await service.currentProvisionalScore(prisma, beliefId)
    expect(after).toBe(initialScore)
  })

  it('agent ingestion rejects score-affecting writes during the freeze window', async () => {
    const agent = await prisma.agent.create({ data: { name: 'freeze-test-agent' } })
    const payload = {
      batchTitle: 'Freeze test',
      claims: [{
        statement: 'Carbon pricing reduces industrial emissions in capped sectors',
        direction: 'pro',
        parentBeliefSlug: 'carbon-pricing-reduces-emissions',
        rationale: 'testing the freeze',
        fiveStepCheck: {
          parentWording: 'Carbon pricing reduces emissions',
          claimWording: 'Carbon pricing reduces industrial emissions in capped sectors',
          howItSupports: 'Sector evidence supports the general claim',
          provisionalEstimate: 0.7,
          flaggedBelowThreshold: false,
        },
      }],
    }

    const frozenNow = new Date(epochLib.epochBoundary(EPOCH_A).getTime() - 5 * 60_000) // 23:55
    const frozen = await runIngest(agent.id, payload, frozenNow)
    expect(frozen.ok).toBe(false)
    expect(frozen.status).toBe(423)
    expect(frozen.issues[0].mode).toBe('graph-freeze')

    const openNow = new Date(epochLib.epochBoundary(EPOCH_A).getTime() - 3 * 3600 * 1000) // 21:00
    const accepted = await runIngest(agent.id, payload, openNow)
    expect(accepted.ok).toBe(true)
  })
})
