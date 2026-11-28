import { prisma } from '@/lib/prisma'
import { marketJson, marketErrorResponse } from '@/lib/markets/api'
import { placeOrder } from '@/lib/markets/service'

/** GET — the order book (open orders, both sides). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const orders = await prisma.marketOrder.findMany({
    where: { contractId: id, status: { in: ['OPEN', 'PARTIAL'] } },
    include: { user: { select: { username: true } } },
    orderBy: [{ limitPrice: 'desc' }, { createdAt: 'asc' }],
  })
  return marketJson({
    bids: orders.filter(o => o.side === 'BUY'),
    asks: orders.filter(o => o.side === 'SELL'),
  })
}

/** POST — place a limit order on a graduated market. Body:
 *  { username, side: "BUY"|"SELL", outcome: "YES"|"NO", limitPrice, quantity }. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let body: {
    username?: string
    side?: 'BUY' | 'SELL'
    outcome?: 'YES' | 'NO'
    limitPrice?: number
    quantity?: number
  }
  try {
    body = await request.json()
  } catch {
    return marketJson({ error: 'Body must be valid JSON.' }, { status: 400 })
  }
  if (
    !body.username || !body.side || !body.outcome ||
    typeof body.limitPrice !== 'number' || typeof body.quantity !== 'number'
  ) {
    return marketJson(
      { error: 'username, side, outcome, limitPrice, and quantity are required.' },
      { status: 422 },
    )
  }
  try {
    const result = await placeOrder({
      contractId: id,
      username: body.username,
      side: body.side,
      outcome: body.outcome,
      limitPrice: body.limitPrice,
      quantity: body.quantity,
    })
    return marketJson(
      {
        order: result.order,
        fills: result.fills,
        selfCrossSkipped: result.selfCrossSkipped,
      },
      { status: 201 },
    )
  } catch (error) {
    return marketErrorResponse(error)
  }
}
