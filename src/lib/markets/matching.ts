/**
 * Order-book matching for graduated markets: price-time priority, partial
 * fills, execution at the resting (maker) order's limit price.
 *
 * Wash-trade defense at the matching layer: a taker never crosses their own
 * resting order — it is skipped, left resting, and the overlap is reported so
 * the caller can log it.
 *
 * Pure functions over plain rows; the service layer applies the fills to the
 * database.
 */

export interface RestingOrder {
  id: string
  userId: string
  side: 'BUY' | 'SELL'
  outcome: 'YES' | 'NO'
  limitPrice: number
  quantity: number
  filledQuantity: number
  createdAt: Date
}

export interface TakerOrder {
  userId: string
  side: 'BUY' | 'SELL'
  outcome: 'YES' | 'NO'
  limitPrice: number
  quantity: number
}

export interface Fill {
  makerOrderId: string
  makerUserId: string
  price: number
  quantity: number
}

export interface MatchResult {
  fills: Fill[]
  /** Quantity left unfilled (rests on the book if > 0). */
  remainder: number
  /** True if the taker's price crossed one of their own orders (skipped). */
  selfCrossSkipped: boolean
}

function remaining(order: RestingOrder): number {
  return order.quantity - order.filledQuantity
}

/**
 * Match a taker order against the opposite side of the same outcome's book.
 * BUY matches SELLs priced at or below the taker limit (cheapest first);
 * SELL matches BUYs priced at or above (highest first). Ties break by time.
 */
export function matchOrder(taker: TakerOrder, book: RestingOrder[]): MatchResult {
  const oppositeSide = taker.side === 'BUY' ? 'SELL' : 'BUY'
  const crosses = (maker: RestingOrder) =>
    taker.side === 'BUY' ? maker.limitPrice <= taker.limitPrice : maker.limitPrice >= taker.limitPrice

  const candidates = book
    .filter(o => o.side === oppositeSide && o.outcome === taker.outcome && remaining(o) > 0)
    .filter(crosses)
    .sort((a, b) => {
      const byPrice = taker.side === 'BUY' ? a.limitPrice - b.limitPrice : b.limitPrice - a.limitPrice
      if (byPrice !== 0) return byPrice
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

  const fills: Fill[] = []
  let remainder = taker.quantity
  let selfCrossSkipped = false

  for (const maker of candidates) {
    if (remainder <= 0) break
    if (maker.userId === taker.userId) {
      selfCrossSkipped = true
      continue
    }
    const quantity = Math.min(remainder, remaining(maker))
    fills.push({
      makerOrderId: maker.id,
      makerUserId: maker.userId,
      price: maker.limitPrice,
      quantity,
    })
    remainder -= quantity
  }

  return { fills, remainder, selfCrossSkipped }
}
