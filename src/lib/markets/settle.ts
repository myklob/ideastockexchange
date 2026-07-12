/**
 * Epoch settlement: snapshot → resolve → pay out. Settlement is pure
 * arithmetic against immutable EpochSnapshot rows — no judgment calls, no
 * administrator discretion. The graph freeze that protects the boundary is
 * enforced at the graph writers (see agent ingest); this job runs after it.
 */

import { prisma } from '@/lib/prisma'
import type { Prisma, MarketContract } from '@/generated/prisma/client'
import { epochBoundary, previousEpoch, SNAPSHOT_GRACE_MS } from './epoch'
import { extractGraphInputs, computeTruthScore, archiveToJson, SCORING_ALGORITHM_VERSION } from './engine'
import { MarketError } from './service'

type Tx = Prisma.TransactionClient

export const NEAR_THRESHOLD_MARGIN = 0.05
export const LATE_EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
export const WASH_PAIR_SHARE = 0.4
export const WASH_MIN_VOLUME = 50

export interface EpochRunSummary {
  epoch: string
  snapshotsCreated: number
  snapshotsExisting: number
  contractsSettled: number
  payoutsTotal: number
  flagsCreated: number
  loansRepaid: number
  loansDefaulted: number
}

/**
 * Write immutable snapshots for every belief referenced by a live contract.
 * Idempotent: existing (beliefId, epoch) rows are never touched — a snapshot
 * is written once and referenced forever.
 */
export async function snapshotEpoch(epoch: string): Promise<{ created: number; existing: number }> {
  const liveContracts = await prisma.marketContract.findMany({
    where: { status: { in: ['OPEN', 'FROZEN'] }, beliefId: { not: null } },
    select: { beliefId: true },
    distinct: ['beliefId'],
  })
  let created = 0
  let existing = 0
  for (const { beliefId } of liveContracts) {
    if (beliefId === null) continue
    const already = await prisma.epochSnapshot.findUnique({
      where: { beliefId_epoch: { beliefId, epoch } },
    })
    if (already) {
      existing++
      continue
    }
    const belief = await prisma.belief.findUnique({
      where: { id: beliefId },
      include: { arguments: { select: { side: true, impactScore: true, importanceScore: true } } },
    })
    if (!belief) continue
    const inputs = extractGraphInputs(belief)
    await prisma.epochSnapshot.create({
      data: {
        beliefId,
        epoch,
        truthScore: computeTruthScore(inputs),
        algorithmVersion: SCORING_ALGORITHM_VERSION,
        graphArchive: archiveToJson(inputs),
      },
    })
    created++
  }
  return { created, existing }
}

/** Strict-inequality convention: equality resolves NO. */
export function resolveScoreOutcome(finalScore: number, threshold: number, direction: string): 'YES' | 'NO' {
  if (direction === 'ABOVE') return finalScore > threshold ? 'YES' : 'NO'
  return finalScore < threshold ? 'YES' : 'NO'
}

async function resolveOutcome(
  contract: MarketContract,
  epoch: string,
  now: Date,
): Promise<{ outcome: 'YES' | 'NO'; finalScore: number | null } | null> {
  if (contract.contractType === 'SCORE') {
    if (contract.beliefId === null) return null
    const snapshot = await prisma.epochSnapshot.findUnique({
      where: { beliefId_epoch: { beliefId: contract.beliefId, epoch } },
    })
    if (!snapshot) return null // cannot settle without the snapshot
    return {
      outcome: resolveScoreOutcome(snapshot.truthScore, contract.thresholdValue, contract.direction),
      finalScore: snapshot.truthScore,
    }
  }

  if (contract.contractType === 'ALGORITHM_DELTA') {
    // "Will next month's algorithm raise (ABOVE) / lower (BELOW) the score of X?"
    // YES requires BOTH a version change and the score moving in direction.
    // Without a prior-epoch baseline the contract resolves NO.
    if (contract.beliefId === null) return null
    const [prev, curr] = await Promise.all([
      prisma.epochSnapshot.findUnique({
        where: { beliefId_epoch: { beliefId: contract.beliefId, epoch: previousEpoch(epoch) } },
      }),
      prisma.epochSnapshot.findUnique({
        where: { beliefId_epoch: { beliefId: contract.beliefId, epoch } },
      }),
    ])
    if (!curr) return null
    if (!prev) return { outcome: 'NO', finalScore: curr.truthScore }
    const versionChanged = prev.algorithmVersion !== curr.algorithmVersion
    const moved =
      contract.direction === 'ABOVE'
        ? curr.truthScore > prev.truthScore
        : curr.truthScore < prev.truthScore
    return { outcome: versionChanged && moved ? 'YES' : 'NO', finalScore: curr.truthScore }
  }

  if (contract.contractType === 'PLATFORM_FAILURE') {
    // Shorting the platform: YES iff the snapshot job for this epoch did not
    // run within the grace window. A settlement run inside the window is
    // itself proof the platform ran on time.
    const deadline = epochBoundary(epoch).getTime() + SNAPSHOT_GRACE_MS
    if (now.getTime() <= deadline) return { outcome: 'NO', finalScore: null }
    const timely = await prisma.epochSnapshot.findFirst({
      where: { epoch, createdAt: { lte: new Date(deadline) } },
    })
    return { outcome: timely ? 'NO' : 'YES', finalScore: null }
  }

  return null
}

async function payOut(tx: Tx, contract: MarketContract, outcome: 'YES' | 'NO') {
  // Cancel resting orders first, refunding buy-side escrow.
  const openOrders = await tx.marketOrder.findMany({
    where: { contractId: contract.id, status: { in: ['OPEN', 'PARTIAL'] } },
    include: { user: true },
  })
  for (const order of openOrders) {
    const unfilled = order.quantity - order.filledQuantity
    if (order.side === 'BUY' && unfilled > 0) {
      const refund = order.limitPrice * (1 + contract.feeRate / 10_000) * unfilled
      // Atomic increment: `order.user.currentBalance` is a pre-loop snapshot,
      // and a user with several resting buys would have all but the last
      // refund overwritten by the stale read.
      await tx.user.update({
        where: { id: order.userId },
        data: { currentBalance: { increment: refund } },
      })
    }
    await tx.marketOrder.update({ where: { id: order.id }, data: { status: 'CANCELLED' } })
  }

  const positions = await tx.marketPosition.findMany({
    where: { contractId: contract.id },
    include: { user: true },
  })
  let payoutsTotal = 0
  const winners: { username: string; shares: number }[] = []
  for (const position of positions) {
    const winningShares = outcome === 'YES' ? position.sharesYes : position.sharesNo
    const losingShares = outcome === 'YES' ? position.sharesNo : position.sharesYes
    const winningAvg = outcome === 'YES' ? position.avgCostYes : position.avgCostNo
    const losingAvg = outcome === 'YES' ? position.avgCostNo : position.avgCostYes
    const payout = winningShares * 1.0
    const pnl = winningShares * (1.0 - winningAvg) - losingShares * losingAvg
    if (winningShares > 0) winners.push({ username: position.user.username, shares: winningShares })
    if (payout > 0) {
      await tx.user.update({
        where: { id: position.userId },
        data: {
          currentBalance: { increment: payout },
          realizedPnl: { increment: pnl },
        },
      })
      payoutsTotal += payout
    } else {
      await tx.user.update({
        where: { id: position.userId },
        data: { realizedPnl: { increment: pnl } },
      })
    }
    await tx.marketPosition.update({
      where: { id: position.id },
      data: { sharesYes: 0, sharesNo: 0, realizedPnl: position.realizedPnl + pnl },
    })
  }
  return { payoutsTotal, winners }
}

async function flagNearThreshold(
  contract: MarketContract,
  finalScore: number,
  winners: { username: string; shares: number }[],
): Promise<number> {
  if (contract.contractType !== 'SCORE' || contract.beliefId === null) return 0
  if (Math.abs(finalScore - contract.thresholdValue) >= NEAR_THRESHOLD_MARGIN) return 0

  const boundary = epochBoundary(contract.resolutionEpoch)
  const lateArguments = await prisma.argument.findMany({
    where: {
      parentBeliefId: contract.beliefId,
      createdAt: { gte: new Date(boundary.getTime() - LATE_EDIT_WINDOW_MS), lte: boundary },
    },
    include: { submittedByAgent: { select: { name: true } } },
  })
  if (lateArguments.length === 0) return 0

  const lateEditors = [
    ...new Set(lateArguments.map(a => a.submittedByAgent?.name ?? '(unattributed human edit)')),
  ]
  const winnerNames = winners.map(w => w.username)
  const overlap = lateEditors.filter(name => winnerNames.includes(name))

  await prisma.manipulationFlag.create({
    data: {
      contractId: contract.id,
      reason: 'NEAR_THRESHOLD_EDITOR_POSITION',
      details: JSON.stringify({
        finalScore,
        threshold: contract.thresholdValue,
        margin: Math.abs(finalScore - contract.thresholdValue),
        lateEditors,
        winningHolders: winnerNames,
        editorHolderOverlap: overlap,
      }),
    },
  })
  return 1
}

async function flagWashTrading(contract: MarketContract): Promise<number> {
  const bookTrades = await prisma.marketTrade.findMany({
    where: { contractId: contract.id, source: 'BOOK' },
    include: {
      buyer: { select: { username: true } },
      seller: { select: { username: true } },
    },
  })
  const bookVolume = bookTrades.reduce((s, t) => s + t.quantity, 0)
  if (bookVolume < WASH_MIN_VOLUME) return 0

  const pairVolume = new Map<string, number>()
  for (const trade of bookTrades) {
    const key = `${trade.buyer?.username ?? '?'} ↔ ${trade.seller?.username ?? '?'}`
    pairVolume.set(key, (pairVolume.get(key) ?? 0) + trade.quantity)
  }
  let flags = 0
  for (const [pair, volume] of pairVolume) {
    if (volume / bookVolume > WASH_PAIR_SHARE) {
      await prisma.manipulationFlag.create({
        data: {
          contractId: contract.id,
          reason: 'WASH_TRADING_PATTERN',
          details: JSON.stringify({
            pair,
            pairVolume: volume,
            bookVolume,
            share: volume / bookVolume,
          }),
        },
      })
      flags++
    }
  }
  return flags
}

async function settleLoans(): Promise<{ repaid: number; defaulted: number }> {
  const loans = await prisma.marginLoan.findMany({
    where: { status: 'OPEN' },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  })
  let repaid = 0
  let defaulted = 0
  for (const loan of loans) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: loan.userId } })
    const pay = Math.min(user.currentBalance, loan.outstanding)
    if (pay > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentBalance: user.currentBalance - pay },
      })
      repaid += pay
    }
    const remaining = loan.outstanding - pay
    if (remaining <= 1e-9) {
      await prisma.marginLoan.update({
        where: { id: loan.id },
        data: { outstanding: 0, status: 'REPAID' },
      })
      continue
    }
    // Still short: if the borrower has no live positions left to mark, the
    // shortfall defaults — logged, never silently absorbed.
    const openPositions = await prisma.marketPosition.findMany({
      where: { userId: loan.userId, contract: { status: 'OPEN' } },
    })
    const hasExposure = openPositions.some(p => p.sharesYes > 0 || p.sharesNo > 0)
    if (!hasExposure) {
      await prisma.marginLoan.update({
        where: { id: loan.id },
        data: { outstanding: remaining, status: 'DEFAULTED' },
      })
      defaulted += remaining
    } else {
      await prisma.marginLoan.update({
        where: { id: loan.id },
        data: { outstanding: remaining },
      })
    }
  }
  return { repaid, defaulted }
}

/**
 * The epoch boundary job: snapshot the graph, settle every contract due,
 * pay winners, run the monitors, square the margin book. Idempotent per
 * epoch — settled contracts and existing snapshots are skipped.
 */
export async function runEpoch(epoch: string, now = new Date()): Promise<EpochRunSummary> {
  if (now.getTime() < epochBoundary(epoch).getTime()) {
    throw new MarketError(`Epoch ${epoch} has not reached its boundary yet`, 409)
  }

  const snapshots = await snapshotEpoch(epoch)

  const due = await prisma.marketContract.findMany({
    where: { resolutionEpoch: epoch, status: { in: ['OPEN', 'FROZEN'] } },
  })

  let contractsSettled = 0
  let payoutsTotal = 0
  let flagsCreated = 0

  for (const contract of due) {
    const resolution = await resolveOutcome(contract, epoch, now)
    if (!resolution) continue

    const { winners, payoutsTotal: paid } = await prisma.$transaction(async tx => {
      const result = await payOut(tx, contract, resolution.outcome)
      await tx.marketContract.update({
        where: { id: contract.id },
        data: {
          status: 'SETTLED',
          finalScore: resolution.finalScore,
          finalOutcome: resolution.outcome,
          settledAt: now,
        },
      })
      return result
    })

    contractsSettled++
    payoutsTotal += paid
    if (resolution.finalScore !== null) {
      flagsCreated += await flagNearThreshold(contract, resolution.finalScore, winners)
    }
    flagsCreated += await flagWashTrading(contract)
  }

  const loans = await settleLoans()

  return {
    epoch,
    snapshotsCreated: snapshots.created,
    snapshotsExisting: snapshots.existing,
    contractsSettled,
    payoutsTotal,
    flagsCreated,
    loansRepaid: loans.repaid,
    loansDefaulted: loans.defaulted,
  }
}
