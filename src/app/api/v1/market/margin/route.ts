import { prisma } from '@/lib/prisma'
import { marketJson, marketErrorResponse } from '@/lib/markets/api'
import { borrowMargin, repayMargin, portfolioEquity, resolveUser } from '@/lib/markets/service'

/** GET ?username= — margin book and portfolio equity for a user. */
export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get('username')
  if (!username) return marketJson({ error: 'username query param is required.' }, { status: 422 })
  try {
    const user = await resolveUser(prisma, username)
    const [loans, equity] = await Promise.all([
      prisma.marginLoan.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
      portfolioEquity(prisma, user.id),
    ])
    return marketJson({ balance: user.currentBalance, equity, loans })
  } catch (error) {
    return marketErrorResponse(error)
  }
}

/**
 * POST — play-money leverage. Body: { username, action: "borrow"|"repay",
 * amount }. Borrow cap: total outstanding ≤ portfolio equity (2x buying
 * power). No interest, no hidden absorption of defaults.
 */
export async function POST(request: Request) {
  let body: { username?: string; action?: 'borrow' | 'repay'; amount?: number }
  try {
    body = await request.json()
  } catch {
    return marketJson({ error: 'Body must be valid JSON.' }, { status: 400 })
  }
  if (!body.username || !body.action || typeof body.amount !== 'number') {
    return marketJson({ error: 'username, action, and amount are required.' }, { status: 422 })
  }
  try {
    if (body.action === 'borrow') {
      const loan = await borrowMargin(body.username, body.amount)
      return marketJson({ loan }, { status: 201 })
    }
    if (body.action === 'repay') {
      const result = await repayMargin(body.username, body.amount)
      return marketJson(result)
    }
    return marketJson({ error: 'action must be "borrow" or "repay".' }, { status: 422 })
  } catch (error) {
    return marketErrorResponse(error)
  }
}
