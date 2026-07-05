import { prisma } from '@/lib/prisma'
import { marketJson, marketErrorResponse } from '@/lib/markets/api'
import {
  createContract,
  quoteContract,
  forecastForContract,
  type CreateContractParams,
} from '@/lib/markets/service'

/**
 * GET /api/v1/market/contracts — open contracts with quotes and the
 * divergence between market price and the engine-based forecast (the most
 * interesting number on the platform: where the arbitrage lives).
 *
 * POST — create a contract. contractType SCORE (default), ALGORITHM_DELTA
 * (meta-market on algorithm governance), or PLATFORM_FAILURE (shorting the
 * platform's snapshot job).
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  const status = sp.get('status') ?? 'OPEN'
  const beliefSlug = sp.get('beliefSlug')

  const contracts = await prisma.marketContract.findMany({
    where: {
      status,
      ...(beliefSlug ? { belief: { slug: beliefSlug } } : {}),
    },
    include: { belief: { select: { slug: true, statement: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const rows = []
  for (const contract of contracts) {
    const quote = await quoteContract(prisma, contract)
    const forecastYes = await forecastForContract(prisma, contract)
    rows.push({
      ...contract,
      quote,
      forecastYes,
      divergence: forecastYes === null ? null : quote.priceYes - forecastYes,
    })
  }
  return marketJson({ contracts: rows })
}

export async function POST(request: Request) {
  let body: CreateContractParams
  try {
    body = await request.json()
  } catch {
    return marketJson({ error: 'Body must be valid JSON.' }, { status: 400 })
  }
  try {
    const contract = await createContract(body)
    return marketJson({ contract }, { status: 201 })
  } catch (error) {
    return marketErrorResponse(error)
  }
}
