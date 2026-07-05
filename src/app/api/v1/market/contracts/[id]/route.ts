import { prisma } from '@/lib/prisma'
import { marketJson, marketErrorResponse } from '@/lib/markets/api'
import { quoteContract, forecastForContract, currentProvisionalScore } from '@/lib/markets/service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const contract = await prisma.marketContract.findUnique({
    where: { id },
    include: {
      belief: { select: { id: true, slug: true, statement: true } },
      orders: {
        where: { status: { in: ['OPEN', 'PARTIAL'] } },
        orderBy: { limitPrice: 'desc' },
      },
      flags: true,
    },
  })
  if (!contract) return marketJson({ error: 'Contract not found.' }, { status: 404 })

  try {
    const quote = await quoteContract(prisma, contract)
    const forecastYes = await forecastForContract(prisma, contract)
    const provisionalScore =
      contract.beliefId !== null ? await currentProvisionalScore(prisma, contract.beliefId) : null
    return marketJson({
      contract,
      quote,
      provisionalScore,
      forecastYes,
      divergence: forecastYes === null ? null : quote.priceYes - forecastYes,
    })
  } catch (error) {
    return marketErrorResponse(error)
  }
}
