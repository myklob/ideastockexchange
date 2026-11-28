import { marketJson, marketErrorResponse } from '@/lib/markets/api'
import { cancelOrder } from '@/lib/markets/service'

/** DELETE — cancel an open order; unfilled buy escrow is refunded.
 *  Body: { username }. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let body: { username?: string }
  try {
    body = await request.json()
  } catch {
    return marketJson({ error: 'Body must be valid JSON with username.' }, { status: 400 })
  }
  if (!body.username) return marketJson({ error: 'username is required.' }, { status: 422 })
  try {
    const order = await cancelOrder(id, body.username)
    return marketJson({ order })
  } catch (error) {
    return marketErrorResponse(error)
  }
}
