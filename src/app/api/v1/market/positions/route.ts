import { prisma } from '@/lib/prisma'
import { marketJson, marketErrorResponse } from '@/lib/markets/api'
import { quoteContract, resolveUser } from '@/lib/markets/service'

/** GET ?username= — a user's positions marked at current prices. */
export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get('username')
  if (!username) return marketJson({ error: 'username query param is required.' }, { status: 422 })
  try {
    const user = await resolveUser(prisma, username)
    const positions = await prisma.marketPosition.findMany({
      where: { userId: user.id },
      include: {
        contract: { include: { belief: { select: { slug: true, statement: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    const rows = []
    for (const position of positions) {
      const quote = await quoteContract(prisma, position.contract)
      rows.push({
        ...position,
        markPriceYes: quote.priceYes,
        markValue: position.sharesYes * quote.priceYes + position.sharesNo * (1 - quote.priceYes),
      })
    }
    return marketJson({ balance: user.currentBalance, positions: rows })
  } catch (error) {
    return marketErrorResponse(error)
  }
}
