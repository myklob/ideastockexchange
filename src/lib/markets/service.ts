/**
 * The market service: contract creation, LMSR trading, order-book trading
 * after graduation, bundles (structured products), and play-money margin.
 *
 * The firewall, restated where the code lives: everything here READS scores
 * (to quote forecasts and divergence) and WRITES only market tables. No code
 * path in this module touches a score column, and none ever may. A billion
 * play-dollars on a false claim moves its score by nothing.
 */

import { prisma } from '@/lib/prisma'
import type { Prisma, MarketContract } from '@/generated/prisma/client'
import {
  type LmsrState,
  type Side,
  priceYes as lmsrPriceYes,
  costToBuy,
  proceedsFromSell,
  applyTrade,
  applySell,
} from './lmsr'
import { matchOrder, type RestingOrder } from './matching'
import { epochBoundary, isFutureEpoch, isValidEpochLabel } from './epoch'
import { extractGraphInputs, computeTruthScore } from './engine'
import { forecastYesProbability } from './forecast'

type Tx = Prisma.TransactionClient
type Db = Tx | typeof prisma

/** Volume (shares traded) at which an LMSR market graduates to the book. */
export const GRADUATION_VOLUME = 1000

export const CONTRACT_TYPES = ['SCORE', 'ALGORITHM_DELTA', 'PLATFORM_FAILURE'] as const
export type ContractType = (typeof CONTRACT_TYPES)[number]

export class MarketError extends Error {
  status: number
  constructor(message: string, status = 422) {
    super(message)
    this.status = status
  }
}

function lmsrState(contract: MarketContract): LmsrState {
  return { qYes: contract.qYes, qNo: contract.qNo, b: contract.bParameter }
}

export async function resolveUser(db: Db, username: string) {
  const name = username.trim()
  if (!name) throw new MarketError('username is required')
  const existing = await db.user.findUnique({ where: { username: name } })
  if (existing) return existing
  return db.user.create({ data: { username: name } })
}

/** Current provisional engine score for a belief (versioned; the same
 *  function settlement snapshots run). Read-only. */
export async function currentProvisionalScore(db: Db, beliefId: number): Promise<number> {
  const belief = await db.belief.findUnique({
    where: { id: beliefId },
    include: { arguments: { select: { side: true, impactScore: true, importanceScore: true } } },
  })
  if (!belief) throw new MarketError(`No belief #${beliefId}`, 404)
  return computeTruthScore(extractGraphInputs(belief))
}

// ─── Contract creation ────────────────────────────────────────────────────

export interface CreateContractParams {
  contractType?: ContractType
  beliefSlug?: string
  thresholdValue?: number
  direction: 'ABOVE' | 'BELOW'
  resolutionEpoch: string
  creatorUsername?: string
  bParameter?: number
  feeRate?: number
}

export async function createContract(params: CreateContractParams) {
  const contractType: ContractType = params.contractType ?? 'SCORE'
  if (!CONTRACT_TYPES.includes(contractType)) {
    throw new MarketError(`contractType must be one of ${CONTRACT_TYPES.join(', ')}`)
  }
  if (params.direction !== 'ABOVE' && params.direction !== 'BELOW') {
    throw new MarketError('direction must be ABOVE or BELOW')
  }
  if (!isValidEpochLabel(params.resolutionEpoch)) {
    throw new MarketError('resolutionEpoch must be a "YYYY-MM" epoch label')
  }
  if (!isFutureEpoch(params.resolutionEpoch, new Date())) {
    throw new MarketError('resolutionEpoch must be a future epoch')
  }

  let beliefId: number | null = null
  if (contractType === 'PLATFORM_FAILURE') {
    if (params.beliefSlug) throw new MarketError('PLATFORM_FAILURE contracts take no belief')
  } else {
    if (!params.beliefSlug) throw new MarketError(`${contractType} contracts require beliefSlug`)
    const belief = await prisma.belief.findUnique({ where: { slug: params.beliefSlug } })
    if (!belief) throw new MarketError(`No belief with slug "${params.beliefSlug}"`, 404)
    beliefId = belief.id
  }

  let threshold = 0
  if (contractType === 'SCORE') {
    if (
      typeof params.thresholdValue !== 'number' ||
      !(params.thresholdValue >= 0 && params.thresholdValue <= 1)
    ) {
      throw new MarketError('SCORE contracts require thresholdValue in [0,1]')
    }
    threshold = params.thresholdValue
  }

  const creator = params.creatorUsername ? await resolveUser(prisma, params.creatorUsername) : null

  return prisma.marketContract.create({
    data: {
      contractType,
      beliefId,
      thresholdValue: threshold,
      direction: params.direction,
      resolutionEpoch: params.resolutionEpoch,
      creatorId: creator?.id ?? null,
      bParameter: params.bParameter && params.bParameter > 0 ? params.bParameter : 100,
      feeRate: params.feeRate !== undefined && params.feeRate >= 0 ? params.feeRate : 100,
    },
  })
}

// ─── Quoting ──────────────────────────────────────────────────────────────

export interface ContractQuote {
  priceYes: number
  source: 'LMSR' | 'BOOK_MID' | 'LAST_TRADE'
  bestBidYes: number | null
  bestAskYes: number | null
}

export async function quoteContract(db: Db, contract: MarketContract): Promise<ContractQuote> {
  if (contract.pricingMode === 'LMSR') {
    return {
      priceYes: lmsrPriceYes(lmsrState(contract)),
      source: 'LMSR',
      bestBidYes: null,
      bestAskYes: null,
    }
  }
  const open = { in: ['OPEN', 'PARTIAL'] }
  const [bestBid, bestAsk] = await Promise.all([
    db.marketOrder.findFirst({
      where: { contractId: contract.id, outcome: 'YES', side: 'BUY', status: open },
      orderBy: { limitPrice: 'desc' },
    }),
    db.marketOrder.findFirst({
      where: { contractId: contract.id, outcome: 'YES', side: 'SELL', status: open },
      orderBy: { limitPrice: 'asc' },
    }),
  ])
  if (bestBid && bestAsk) {
    return {
      priceYes: (bestBid.limitPrice + bestAsk.limitPrice) / 2,
      source: 'BOOK_MID',
      bestBidYes: bestBid.limitPrice,
      bestAskYes: bestAsk.limitPrice,
    }
  }
  const lastTick = await db.priceTick.findFirst({
    where: { contractId: contract.id },
    orderBy: { createdAt: 'desc' },
  })
  return {
    priceYes: lastTick?.priceYes ?? lmsrPriceYes(lmsrState(contract)),
    source: lastTick ? 'LAST_TRADE' : 'LMSR',
    bestBidYes: bestBid?.limitPrice ?? null,
    bestAskYes: bestAsk?.limitPrice ?? null,
  }
}

/** Forecast YES probability from the current provisional score — the other
 *  half of the divergence display. Null for meta and platform contracts. */
export async function forecastForContract(db: Db, contract: MarketContract, now = new Date()): Promise<number | null> {
  if (contract.contractType !== 'SCORE' || contract.beliefId === null) return null
  const score = await currentProvisionalScore(db, contract.beliefId)
  const days = (epochBoundary(contract.resolutionEpoch).getTime() - now.getTime()) / 86_400_000
  return forecastYesProbability({
    currentScore: score,
    threshold: contract.thresholdValue,
    direction: contract.direction as 'ABOVE' | 'BELOW',
    daysToResolution: days,
  })
}

async function recordTick(tx: Tx, contract: MarketContract, priceYesNow: number, now = new Date()) {
  let forecastYes: number | null = null
  try {
    forecastYes = await forecastForContract(tx, contract, now)
  } catch {
    forecastYes = null
  }
  await tx.priceTick.create({
    data: { contractId: contract.id, priceYes: priceYesNow, forecastYes },
  })
}

// ─── Positions ────────────────────────────────────────────────────────────

async function upsertPositionBuy(
  tx: Tx,
  userId: string,
  contractId: string,
  outcome: Side,
  shares: number,
  costPerShare: number,
) {
  const existing = await tx.marketPosition.findUnique({
    where: { userId_contractId: { userId, contractId } },
  })
  if (!existing) {
    return tx.marketPosition.create({
      data: {
        userId,
        contractId,
        sharesYes: outcome === 'YES' ? shares : 0,
        sharesNo: outcome === 'NO' ? shares : 0,
        avgCostYes: outcome === 'YES' ? costPerShare : 0,
        avgCostNo: outcome === 'NO' ? costPerShare : 0,
      },
    })
  }
  const held = outcome === 'YES' ? existing.sharesYes : existing.sharesNo
  const avg = outcome === 'YES' ? existing.avgCostYes : existing.avgCostNo
  const newAvg = (held * avg + shares * costPerShare) / (held + shares)
  return tx.marketPosition.update({
    where: { id: existing.id },
    data:
      outcome === 'YES'
        ? { sharesYes: held + shares, avgCostYes: newAvg }
        : { sharesNo: held + shares, avgCostNo: newAvg },
  })
}

async function applyPositionSell(
  tx: Tx,
  userId: string,
  contractId: string,
  outcome: Side,
  shares: number,
  proceedsPerShare: number,
) {
  const position = await tx.marketPosition.findUnique({
    where: { userId_contractId: { userId, contractId } },
  })
  const held = outcome === 'YES' ? position?.sharesYes ?? 0 : position?.sharesNo ?? 0
  if (!position || held < shares - 1e-9) {
    throw new MarketError(`Cannot sell ${shares} ${outcome} shares: only ${held.toFixed(2)} held. No naked shorts.`)
  }
  const avg = outcome === 'YES' ? position.avgCostYes : position.avgCostNo
  const pnl = (proceedsPerShare - avg) * shares
  return tx.marketPosition.update({
    where: { id: position.id },
    data: {
      ...(outcome === 'YES' ? { sharesYes: held - shares } : { sharesNo: held - shares }),
      realizedPnl: position.realizedPnl + pnl,
    },
  })
}

// ─── LMSR trading ─────────────────────────────────────────────────────────

export interface LmsrTradeParams {
  contractId: string
  username: string
  outcome: Side
  side: 'BUY' | 'SELL'
  shares: number
}

function assertTradable(contract: MarketContract, now = new Date()) {
  if (contract.status !== 'OPEN') {
    throw new MarketError(`Contract is ${contract.status}; trading is closed.`, 409)
  }
  if (now.getTime() > epochBoundary(contract.resolutionEpoch).getTime()) {
    throw new MarketError('Past the resolution boundary; awaiting settlement.', 409)
  }
}

export async function tradeLmsr(params: LmsrTradeParams) {
  const { contractId, outcome, side } = params
  const shares = params.shares
  if (!(shares > 0)) throw new MarketError('shares must be positive')
  if (outcome !== 'YES' && outcome !== 'NO') throw new MarketError('outcome must be YES or NO')

  return prisma.$transaction(async tx => {
    const contract = await tx.marketContract.findUnique({ where: { id: contractId } })
    if (!contract) throw new MarketError('Contract not found', 404)
    assertTradable(contract)
    if (contract.pricingMode !== 'LMSR') {
      throw new MarketError('Contract has graduated to the order book; use limit orders.', 409)
    }
    const user = await resolveUser(tx, params.username)
    const state = lmsrState(contract)

    let newState: LmsrState
    let fee: number
    let pricePerShare: number

    if (side === 'BUY') {
      const cost = costToBuy(state, outcome, shares)
      fee = (cost * contract.feeRate) / 10_000
      const total = cost + fee
      if (user.currentBalance < total) {
        throw new MarketError(
          `Insufficient balance: need $${total.toFixed(2)}, have $${user.currentBalance.toFixed(2)}.`,
        )
      }
      pricePerShare = cost / shares
      newState = applyTrade(state, outcome, shares)
      await tx.user.update({
        where: { id: user.id },
        data: { currentBalance: user.currentBalance - total, totalInvested: user.totalInvested + cost },
      })
      await upsertPositionBuy(tx, user.id, contract.id, outcome, shares, pricePerShare)
      await tx.marketTrade.create({
        data: {
          contractId: contract.id,
          buyerId: user.id,
          source: 'LMSR',
          outcome,
          quantity: shares,
          price: pricePerShare,
          fee,
        },
      })
    } else if (side === 'SELL') {
      const proceeds = proceedsFromSell(state, outcome, shares)
      fee = (proceeds * contract.feeRate) / 10_000
      pricePerShare = proceeds / shares
      newState = applySell(state, outcome, shares)
      await applyPositionSell(tx, user.id, contract.id, outcome, shares, (proceeds - fee) / shares)
      await tx.user.update({
        where: { id: user.id },
        data: { currentBalance: user.currentBalance + proceeds - fee },
      })
      await tx.marketTrade.create({
        data: {
          contractId: contract.id,
          sellerId: user.id,
          source: 'LMSR',
          outcome,
          quantity: shares,
          price: pricePerShare,
          fee,
        },
      })
    } else {
      throw new MarketError('side must be BUY or SELL')
    }

    const newVolume = contract.volume + shares
    const graduated = newVolume >= GRADUATION_VOLUME
    const updated = await tx.marketContract.update({
      where: { id: contract.id },
      data: {
        qYes: newState.qYes,
        qNo: newState.qNo,
        volume: newVolume,
        feesCollected: contract.feesCollected + fee,
        liquidityPool: contract.liquidityPool + fee,
        ...(graduated ? { pricingMode: 'ORDER_BOOK' } : {}),
      },
    })
    await recordTick(tx, updated, lmsrPriceYes(newState))

    return {
      contract: updated,
      priceYes: lmsrPriceYes(newState),
      pricePerShare,
      fee,
      graduated: graduated && contract.pricingMode === 'LMSR',
    }
  })
}

// ─── Order book (graduated markets) ───────────────────────────────────────

export interface PlaceOrderParams {
  contractId: string
  username: string
  side: 'BUY' | 'SELL'
  outcome: Side
  limitPrice: number
  quantity: number
}

function escrowPerShare(limitPrice: number, feeRate: number): number {
  return limitPrice * (1 + feeRate / 10_000)
}

export async function placeOrder(params: PlaceOrderParams) {
  const { contractId, side, outcome, limitPrice, quantity } = params
  if (!(limitPrice > 0 && limitPrice < 1)) throw new MarketError('limitPrice must be in (0,1)')
  if (!(quantity > 0)) throw new MarketError('quantity must be positive')
  if (side !== 'BUY' && side !== 'SELL') throw new MarketError('side must be BUY or SELL')
  if (outcome !== 'YES' && outcome !== 'NO') throw new MarketError('outcome must be YES or NO')

  return prisma.$transaction(async tx => {
    const contract = await tx.marketContract.findUnique({ where: { id: contractId } })
    if (!contract) throw new MarketError('Contract not found', 404)
    assertTradable(contract)
    if (contract.pricingMode !== 'ORDER_BOOK') {
      throw new MarketError('Contract has not graduated to the order book yet; trade against the LMSR maker.', 409)
    }
    const user = await resolveUser(tx, params.username)

    if (side === 'BUY') {
      const escrow = escrowPerShare(limitPrice, contract.feeRate) * quantity
      if (user.currentBalance < escrow) {
        throw new MarketError(`Insufficient balance to escrow $${escrow.toFixed(2)} for this order.`)
      }
      await tx.user.update({
        where: { id: user.id },
        data: { currentBalance: user.currentBalance - escrow },
      })
    } else {
      // No naked shorts: held shares must cover this order plus all open sells.
      const position = await tx.marketPosition.findUnique({
        where: { userId_contractId: { userId: user.id, contractId } },
      })
      const held = outcome === 'YES' ? position?.sharesYes ?? 0 : position?.sharesNo ?? 0
      const openSells = await tx.marketOrder.aggregate({
        where: {
          contractId, userId: user.id, side: 'SELL', outcome,
          status: { in: ['OPEN', 'PARTIAL'] },
        },
        _sum: { quantity: true, filledQuantity: true },
      })
      const committed = (openSells._sum.quantity ?? 0) - (openSells._sum.filledQuantity ?? 0)
      if (held - committed < quantity - 1e-9) {
        throw new MarketError(
          `Cannot sell ${quantity} ${outcome}: ${held.toFixed(2)} held, ${committed.toFixed(2)} already committed to open orders.`,
        )
      }
    }

    const resting = await tx.marketOrder.findMany({
      where: { contractId, status: { in: ['OPEN', 'PARTIAL'] } },
    })
    const match = matchOrder(
      { userId: user.id, side, outcome, limitPrice, quantity },
      resting as RestingOrder[],
    )

    const taker = await tx.marketOrder.create({
      data: {
        contractId, userId: user.id, side, outcome, limitPrice, quantity,
        filledQuantity: quantity - match.remainder,
        status: match.remainder <= 1e-9 ? 'FILLED' : match.fills.length > 0 ? 'PARTIAL' : 'OPEN',
      },
    })

    let totalFilled = 0
    let lastPrice: number | null = null
    for (const fill of match.fills) {
      const maker = resting.find(o => o.id === fill.makerOrderId)
      if (!maker) continue
      const fee = (fill.price * fill.quantity * contract.feeRate) / 10_000
      const buyerId = side === 'BUY' ? user.id : fill.makerUserId
      const sellerId = side === 'BUY' ? fill.makerUserId : user.id

      // Shares move seller → buyer; cash moves buyer → seller (taker pays fee).
      await applyPositionSell(tx, sellerId, contractId, outcome, fill.quantity, fill.price)
      await upsertPositionBuy(tx, buyerId, contractId, outcome, fill.quantity, fill.price)

      if (side === 'BUY') {
        // Taker escrowed at limit; refund the escrow difference for this fill.
        const escrowed = escrowPerShare(limitPrice, contract.feeRate) * fill.quantity
        const actual = fill.price * fill.quantity + fee
        const refund = escrowed - actual
        const takerUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } })
        await tx.user.update({
          where: { id: user.id },
          data: { currentBalance: takerUser.currentBalance + refund },
        })
        const makerUser = await tx.user.findUniqueOrThrow({ where: { id: fill.makerUserId } })
        await tx.user.update({
          where: { id: fill.makerUserId },
          data: { currentBalance: makerUser.currentBalance + fill.price * fill.quantity },
        })
      } else {
        // Maker (buyer) escrowed at their own limit == fill price; taker (seller)
        // receives proceeds minus fee.
        const takerUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } })
        await tx.user.update({
          where: { id: user.id },
          data: { currentBalance: takerUser.currentBalance + fill.price * fill.quantity - fee },
        })
        // Maker escrow included their fee allowance; makers pay no fee — refund it.
        const makerFeeRefund = (fill.price * fill.quantity * contract.feeRate) / 10_000
        const makerUser = await tx.user.findUniqueOrThrow({ where: { id: fill.makerUserId } })
        await tx.user.update({
          where: { id: fill.makerUserId },
          data: { currentBalance: makerUser.currentBalance + makerFeeRefund },
        })
      }

      const makerFilled = maker.filledQuantity + fill.quantity
      await tx.marketOrder.update({
        where: { id: maker.id },
        data: {
          filledQuantity: makerFilled,
          status: makerFilled >= maker.quantity - 1e-9 ? 'FILLED' : 'PARTIAL',
        },
      })
      await tx.marketTrade.create({
        data: {
          contractId, buyerId, sellerId,
          source: 'BOOK', outcome,
          quantity: fill.quantity, price: fill.price, fee,
        },
      })
      totalFilled += fill.quantity
      lastPrice = fill.price
    }

    let updated = contract
    if (totalFilled > 0) {
      const totalFees = match.fills.reduce(
        (s, f) => s + (f.price * f.quantity * contract.feeRate) / 10_000, 0,
      )
      updated = await tx.marketContract.update({
        where: { id: contractId },
        data: {
          volume: contract.volume + totalFilled,
          feesCollected: contract.feesCollected + totalFees,
          liquidityPool: contract.liquidityPool + totalFees,
        },
      })
      const tickPrice = outcome === 'YES' ? (lastPrice as number) : 1 - (lastPrice as number)
      await recordTick(tx, updated, tickPrice)
    }

    return {
      order: await tx.marketOrder.findUniqueOrThrow({ where: { id: taker.id } }),
      fills: match.fills,
      selfCrossSkipped: match.selfCrossSkipped,
      contract: updated,
    }
  })
}

export async function cancelOrder(orderId: string, username: string) {
  return prisma.$transaction(async tx => {
    const order = await tx.marketOrder.findUnique({
      where: { id: orderId },
      include: { user: true, contract: true },
    })
    if (!order) throw new MarketError('Order not found', 404)
    if (order.user.username !== username.trim()) throw new MarketError('Not your order', 403)
    if (order.status === 'FILLED' || order.status === 'CANCELLED') {
      throw new MarketError(`Order already ${order.status}`, 409)
    }
    const unfilled = order.quantity - order.filledQuantity
    if (order.side === 'BUY' && unfilled > 0) {
      const refund = escrowPerShare(order.limitPrice, order.contract.feeRate) * unfilled
      await tx.user.update({
        where: { id: order.userId },
        data: { currentBalance: order.user.currentBalance + refund },
      })
    }
    return tx.marketOrder.update({ where: { id: order.id }, data: { status: 'CANCELLED' } })
  })
}

// ─── Bundles: spreads and combinations, executed atomically ───────────────

export interface BundleLegParams {
  contractId: string
  outcome: Side
  shares: number
}

/**
 * Execute several binary legs as one atomic structured product. E.g. the
 * spread "score lands in (0.55, 0.65]": YES on the >0.55 contract plus NO on
 * the >0.65 contract. All legs are LMSR buys; if any leg fails (insufficient
 * balance, graduated contract), the whole bundle rolls back.
 */
export async function executeBundle(username: string, label: string, legs: BundleLegParams[]) {
  if (!label.trim()) throw new MarketError('label is required')
  if (!Array.isArray(legs) || legs.length < 2) {
    throw new MarketError('A bundle needs at least two legs; single legs are plain trades.')
  }
  return prisma.$transaction(async tx => {
    const user = await resolveUser(tx, username)
    const bundle = await tx.marketBundle.create({
      data: { userId: user.id, label: label.trim() },
    })
    let totalCost = 0
    for (const leg of legs) {
      if (!(leg.shares > 0)) throw new MarketError('Every leg needs positive shares')
      const contract = await tx.marketContract.findUnique({ where: { id: leg.contractId } })
      if (!contract) throw new MarketError(`Leg contract ${leg.contractId} not found`, 404)
      assertTradable(contract)
      if (contract.pricingMode !== 'LMSR') {
        throw new MarketError('Bundles execute against LMSR makers; a leg has graduated to the order book.', 409)
      }
      const state = lmsrState(contract)
      const cost = costToBuy(state, leg.outcome, leg.shares)
      const fee = (cost * contract.feeRate) / 10_000
      const freshUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } })
      if (freshUser.currentBalance < cost + fee) {
        throw new MarketError(
          `Insufficient balance for bundle leg on ${contract.id}: need $${(cost + fee).toFixed(2)}.`,
        )
      }
      const newState = applyTrade(state, leg.outcome, leg.shares)
      await tx.user.update({
        where: { id: user.id },
        data: {
          currentBalance: freshUser.currentBalance - cost - fee,
          totalInvested: freshUser.totalInvested + cost,
        },
      })
      await upsertPositionBuy(tx, user.id, contract.id, leg.outcome, leg.shares, cost / leg.shares)
      await tx.marketTrade.create({
        data: {
          contractId: contract.id, buyerId: user.id,
          source: 'LMSR', outcome: leg.outcome,
          quantity: leg.shares, price: cost / leg.shares, fee,
        },
      })
      const updated = await tx.marketContract.update({
        where: { id: contract.id },
        data: {
          qYes: newState.qYes,
          qNo: newState.qNo,
          volume: contract.volume + leg.shares,
          feesCollected: contract.feesCollected + fee,
          liquidityPool: contract.liquidityPool + fee,
          ...(contract.volume + leg.shares >= GRADUATION_VOLUME ? { pricingMode: 'ORDER_BOOK' } : {}),
        },
      })
      await recordTick(tx, updated, lmsrPriceYes(newState))
      await tx.marketBundleLeg.create({
        data: {
          bundleId: bundle.id,
          contractId: contract.id,
          outcome: leg.outcome,
          shares: leg.shares,
          cost: cost + fee,
        },
      })
      totalCost += cost + fee
    }
    return {
      bundle: await tx.marketBundle.findUniqueOrThrow({
        where: { id: bundle.id },
        include: { legs: true },
      }),
      totalCost,
    }
  })
}

// ─── Margin: play-money leverage ──────────────────────────────────────────

/** Marked portfolio value: cash + positions at current prices, minus loans. */
export async function portfolioEquity(db: Db, userId: string): Promise<number> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } })
  const positions = await db.marketPosition.findMany({
    where: { userId },
    include: { contract: true },
  })
  let markValue = 0
  for (const position of positions) {
    if (position.contract.status !== 'OPEN') continue
    const quote = await quoteContract(db, position.contract)
    markValue += position.sharesYes * quote.priceYes + position.sharesNo * (1 - quote.priceYes)
  }
  const loans = await db.marginLoan.aggregate({
    where: { userId, status: 'OPEN' },
    _sum: { outstanding: true },
  })
  return user.currentBalance + markValue - (loans._sum.outstanding ?? 0)
}

/**
 * Borrow play-money credits against equity. Total outstanding may not exceed
 * equity — i.e. at most 2x buying power. No interest while the mechanics are
 * proven; defaults at settlement are logged, never silently absorbed.
 */
export async function borrowMargin(username: string, amount: number) {
  if (!(amount > 0)) throw new MarketError('amount must be positive')
  return prisma.$transaction(async tx => {
    const user = await resolveUser(tx, username)
    const equity = await portfolioEquity(tx, user.id)
    const loans = await tx.marginLoan.aggregate({
      where: { userId: user.id, status: 'OPEN' },
      _sum: { outstanding: true },
    })
    const outstanding = loans._sum.outstanding ?? 0
    if (outstanding + amount > equity + 1e-9) {
      throw new MarketError(
        `Borrow cap: outstanding ($${outstanding.toFixed(2)}) + requested ($${amount.toFixed(2)}) ` +
        `exceeds equity ($${equity.toFixed(2)}). Max total borrow = portfolio equity.`,
      )
    }
    const loan = await tx.marginLoan.create({
      data: { userId: user.id, amount, outstanding: amount },
    })
    await tx.user.update({
      where: { id: user.id },
      data: { currentBalance: user.currentBalance + amount },
    })
    return loan
  })
}

export async function repayMargin(username: string, amount: number) {
  if (!(amount > 0)) throw new MarketError('amount must be positive')
  return prisma.$transaction(async tx => {
    const user = await resolveUser(tx, username)
    if (user.currentBalance < amount) throw new MarketError('Insufficient balance to repay')
    const loans = await tx.marginLoan.findMany({
      where: { userId: user.id, status: 'OPEN' },
      orderBy: { createdAt: 'asc' },
    })
    if (loans.length === 0) throw new MarketError('No open loans', 409)
    let left = amount
    for (const loan of loans) {
      if (left <= 0) break
      const pay = Math.min(left, loan.outstanding)
      await tx.marginLoan.update({
        where: { id: loan.id },
        data: {
          outstanding: loan.outstanding - pay,
          status: loan.outstanding - pay <= 1e-9 ? 'REPAID' : 'OPEN',
        },
      })
      left -= pay
    }
    const paid = amount - left
    await tx.user.update({
      where: { id: user.id },
      data: { currentBalance: user.currentBalance - paid },
    })
    return { repaid: paid }
  })
}
