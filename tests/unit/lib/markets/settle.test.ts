import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))

import { payOut } from '@/lib/markets/settle'
import type { Prisma, MarketContract } from '@/generated/prisma/client'

const contract = { id: 'c1', feeRate: 100 } as MarketContract

type UserUpdate = { where: { id: string }; data: Record<string, { increment: number }> }

function fakeTx(opts: {
  orders?: { id: string; userId: string; side: string; limitPrice: number; quantity: number; filledQuantity: number }[]
  positions?: {
    id: string
    userId: string
    sharesYes: number
    sharesNo: number
    avgCostYes: number
    avgCostNo: number
    realizedPnl: number
    user: { username: string }
  }[]
}) {
  const userUpdates: UserUpdate[] = []
  const tx = {
    marketOrder: {
      findMany: async () => opts.orders ?? [],
      update: async () => ({}),
    },
    marketPosition: {
      findMany: async () => opts.positions ?? [],
      update: async () => ({}),
    },
    user: {
      update: async (call: UserUpdate) => {
        userUpdates.push(call)
        return {}
      },
    },
  }
  return { tx: tx as unknown as Prisma.TransactionClient, userUpdates }
}

describe('payOut', () => {
  it('refunds every open buy order for the same user, not just the last one', async () => {
    const { tx, userUpdates } = fakeTx({
      orders: [
        { id: 'o1', userId: 'u1', side: 'BUY', limitPrice: 0.4, quantity: 10, filledQuantity: 0 },
        { id: 'o2', userId: 'u1', side: 'BUY', limitPrice: 0.6, quantity: 5, filledQuantity: 0 },
      ],
    })
    await payOut(tx, contract, 'YES')

    const refunds = userUpdates.filter(u => u.where.id === 'u1')
    expect(refunds).toHaveLength(2)
    const total = refunds.reduce((s, u) => s + u.data.currentBalance.increment, 0)
    expect(total).toBeCloseTo(0.4 * 1.01 * 10 + 0.6 * 1.01 * 5)
  })

  it('credits both an escrow refund and a winning payout to the same user', async () => {
    const { tx, userUpdates } = fakeTx({
      orders: [{ id: 'o1', userId: 'u1', side: 'BUY', limitPrice: 0.5, quantity: 10, filledQuantity: 0 }],
      positions: [
        {
          id: 'p1',
          userId: 'u1',
          sharesYes: 20,
          sharesNo: 0,
          avgCostYes: 0.5,
          avgCostNo: 0,
          realizedPnl: 0,
          user: { username: 'alice' },
        },
      ],
    })
    const result = await payOut(tx, contract, 'YES')

    const credits = userUpdates
      .filter(u => u.where.id === 'u1')
      .map(u => u.data.currentBalance.increment)
    expect(credits).toHaveLength(2)
    expect(credits.reduce((s, c) => s + c, 0)).toBeCloseTo(0.5 * 1.01 * 10 + 20)
    expect(result.payoutsTotal).toBe(20)
    expect(result.winners).toEqual([{ username: 'alice', shares: 20 }])
  })

  it('books realized pnl for losers without touching their balance', async () => {
    const { tx, userUpdates } = fakeTx({
      positions: [
        {
          id: 'p1',
          userId: 'u2',
          sharesYes: 0,
          sharesNo: 15,
          avgCostYes: 0,
          avgCostNo: 0.3,
          realizedPnl: 0,
          user: { username: 'bob' },
        },
      ],
    })
    const result = await payOut(tx, contract, 'YES')

    expect(userUpdates).toHaveLength(1)
    expect(userUpdates[0].data.currentBalance).toBeUndefined()
    expect(userUpdates[0].data.realizedPnl.increment).toBeCloseTo(-15 * 0.3)
    expect(result.payoutsTotal).toBe(0)
    expect(result.winners).toEqual([])
  })
})
