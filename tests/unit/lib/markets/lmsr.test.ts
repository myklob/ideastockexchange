import { describe, it, expect } from 'vitest'
import {
  cost,
  priceYes,
  costToBuy,
  proceedsFromSell,
  applyTrade,
  applySell,
  avgPricePerShare,
  maxMakerLoss,
  type LmsrState,
} from '@/lib/markets/lmsr'

const fresh: LmsrState = { qYes: 0, qNo: 0, b: 100 }

describe('LMSR', () => {
  it('quotes 50/50 on a fresh market', () => {
    expect(priceYes(fresh)).toBeCloseTo(0.5, 10)
  })

  it('buying moves the price against the buyer', () => {
    const after = applyTrade(fresh, 'YES', 50)
    expect(priceYes(after)).toBeGreaterThan(0.5)
    expect(avgPricePerShare(fresh, 'YES', 50)).toBeGreaterThan(priceYes(fresh))
  })

  it('buy then sell round-trips: proceeds equal the original cost', () => {
    const buyCost = costToBuy(fresh, 'YES', 50)
    const held = applyTrade(fresh, 'YES', 50)
    const sellProceeds = proceedsFromSell(held, 'YES', 50)
    expect(sellProceeds).toBeCloseTo(buyCost, 8)
    expect(applySell(held, 'YES', 50)).toEqual(fresh)
  })

  it('maker loss on a one-sided market approaches but never exceeds b·ln(2)', () => {
    const b = 100
    for (const shares of [10, 100, 1000, 10_000]) {
      const collected = costToBuy({ qYes: 0, qNo: 0, b }, 'YES', shares)
      const payoutIfYes = shares
      const loss = payoutIfYes - collected
      expect(loss).toBeLessThanOrEqual(maxMakerLoss(b) + 1e-6)
    }
    const nearWorst = 1_000_000 - costToBuy({ qYes: 0, qNo: 0, b }, 'YES', 1_000_000)
    expect(nearWorst).toBeCloseTo(maxMakerLoss(b), 2)
  })

  it('stays numerically stable at extreme inventories', () => {
    const extreme: LmsrState = { qYes: 100_000, qNo: 0, b: 100 }
    expect(priceYes(extreme)).toBeCloseTo(1, 6)
    expect(Number.isFinite(cost(extreme))).toBe(true)
  })
})
