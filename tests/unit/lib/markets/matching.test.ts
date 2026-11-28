import { describe, it, expect } from 'vitest'
import { matchOrder, type RestingOrder } from '@/lib/markets/matching'

function ask(id: string, userId: string, limitPrice: number, quantity: number, at: string): RestingOrder {
  return {
    id, userId, side: 'SELL', outcome: 'YES', limitPrice, quantity,
    filledQuantity: 0, createdAt: new Date(at),
  }
}

describe('order-book matching', () => {
  it('fills at the maker price, cheapest ask first, ties by time', () => {
    const book = [
      ask('a', 'u1', 0.70, 10, '2026-07-01T10:00:00Z'),
      ask('b', 'u2', 0.65, 10, '2026-07-01T11:00:00Z'),
      ask('c', 'u3', 0.65, 10, '2026-07-01T10:30:00Z'),
    ]
    const result = matchOrder(
      { userId: 'taker', side: 'BUY', outcome: 'YES', limitPrice: 0.70, quantity: 25 },
      book,
    )
    expect(result.remainder).toBe(0)
    expect(result.fills.map(f => f.makerOrderId)).toEqual(['c', 'b', 'a'])
    expect(result.fills.map(f => f.price)).toEqual([0.65, 0.65, 0.70])
    expect(result.fills[2].quantity).toBe(5) // partial fill of the last ask
  })

  it('leaves a remainder when the book runs out of crossing orders', () => {
    const book = [ask('a', 'u1', 0.60, 10, '2026-07-01T10:00:00Z')]
    const result = matchOrder(
      { userId: 'taker', side: 'BUY', outcome: 'YES', limitPrice: 0.62, quantity: 30 },
      book,
    )
    expect(result.fills).toHaveLength(1)
    expect(result.remainder).toBe(20)
  })

  it('does not cross prices that do not overlap', () => {
    const book = [ask('a', 'u1', 0.70, 10, '2026-07-01T10:00:00Z')]
    const result = matchOrder(
      { userId: 'taker', side: 'BUY', outcome: 'YES', limitPrice: 0.65, quantity: 10 },
      book,
    )
    expect(result.fills).toHaveLength(0)
    expect(result.remainder).toBe(10)
  })

  it('never matches a taker against their own resting order (wash defense)', () => {
    const book = [
      ask('own', 'taker', 0.60, 10, '2026-07-01T10:00:00Z'),
      ask('other', 'u2', 0.65, 10, '2026-07-01T10:00:00Z'),
    ]
    const result = matchOrder(
      { userId: 'taker', side: 'BUY', outcome: 'YES', limitPrice: 0.70, quantity: 10 },
      book,
    )
    expect(result.selfCrossSkipped).toBe(true)
    expect(result.fills.map(f => f.makerOrderId)).toEqual(['other'])
  })

  it('matches sells against the highest bids first', () => {
    const bids: RestingOrder[] = [
      { id: 'b1', userId: 'u1', side: 'BUY', outcome: 'YES', limitPrice: 0.55, quantity: 10, filledQuantity: 0, createdAt: new Date('2026-07-01T10:00:00Z') },
      { id: 'b2', userId: 'u2', side: 'BUY', outcome: 'YES', limitPrice: 0.60, quantity: 10, filledQuantity: 0, createdAt: new Date('2026-07-01T10:00:00Z') },
    ]
    const result = matchOrder(
      { userId: 'taker', side: 'SELL', outcome: 'YES', limitPrice: 0.55, quantity: 15 },
      bids,
    )
    expect(result.fills.map(f => f.makerOrderId)).toEqual(['b2', 'b1'])
    expect(result.fills.map(f => f.price)).toEqual([0.60, 0.55])
  })
})
