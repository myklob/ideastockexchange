import { prisma } from '@/lib/prisma'
import { marketJson, marketErrorResponse } from '@/lib/markets/api'
import { quoteContract, forecastForContract } from '@/lib/markets/service'

/**
 * GET — the continuous price feed: the tick history (one tick per
 * price-changing event, each carrying the model-based forecast at that
 * moment) plus the live quote and forecast. Poll it or chart it; it reads
 * scores and never writes them.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const sp = new URL(request.url).searchParams
  const limit = Math.min(1000, Math.max(1, parseInt(sp.get('limit') ?? '200', 10) || 200))

  const contract = await prisma.marketContract.findUnique({ where: { id } })
  if (!contract) return marketJson({ error: 'Contract not found.' }, { status: 404 })

  try {
    const [ticks, quote, forecastYes] = await Promise.all([
      prisma.priceTick.findMany({
        where: { contractId: id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      quoteContract(prisma, contract),
      forecastForContract(prisma, contract),
    ])
    return marketJson({
      current: {
        priceYes: quote.priceYes,
        source: quote.source,
        forecastYes,
        divergence: forecastYes === null ? null : quote.priceYes - forecastYes,
      },
      ticks: ticks.reverse(),
    })
  } catch (error) {
    return marketErrorResponse(error)
  }
}
