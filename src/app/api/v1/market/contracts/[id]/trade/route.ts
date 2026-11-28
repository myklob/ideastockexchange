import { marketJson, marketErrorResponse } from '@/lib/markets/api'
import { tradeLmsr } from '@/lib/markets/service'

/** POST — trade against the LMSR maker (young markets). Body:
 *  { username, outcome: "YES"|"NO", side: "BUY"|"SELL", shares }. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let body: { username?: string; outcome?: 'YES' | 'NO'; side?: 'BUY' | 'SELL'; shares?: number }
  try {
    body = await request.json()
  } catch {
    return marketJson({ error: 'Body must be valid JSON.' }, { status: 400 })
  }
  if (!body.username || !body.outcome || !body.side || typeof body.shares !== 'number') {
    return marketJson({ error: 'username, outcome, side, and shares are required.' }, { status: 422 })
  }
  try {
    const result = await tradeLmsr({
      contractId: id,
      username: body.username,
      outcome: body.outcome,
      side: body.side,
      shares: body.shares,
    })
    return marketJson(
      {
        priceYes: result.priceYes,
        pricePerShare: result.pricePerShare,
        fee: result.fee,
        graduated: result.graduated,
        contract: result.contract,
      },
      { status: 201 },
    )
  } catch (error) {
    return marketErrorResponse(error)
  }
}
