import { prisma } from '@/lib/prisma'
import { marketJson, marketErrorResponse } from '@/lib/markets/api'
import { MarketError } from '@/lib/markets/service'

const VENUES = ['KALSHI', 'POLYMARKET', 'OTHER']

/**
 * Mapping between ISE beliefs and related external markets — the data
 * plumbing half of the exchange integrations. One-way by design: signed
 * snapshots flow out via /api/v1/oracle/snapshot; external settlement facts
 * flow in ONLY through the evidence suggestion queue. Prices never touch scores.
 */
export async function GET(request: Request) {
  const beliefSlug = new URL(request.url).searchParams.get('beliefSlug')
  const links = await prisma.externalMarketLink.findMany({
    where: beliefSlug ? { belief: { slug: beliefSlug } } : undefined,
    include: { belief: { select: { slug: true, statement: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return marketJson({ links })
}

export async function POST(request: Request) {
  let body: { beliefSlug?: string; venue?: string; externalId?: string; url?: string; notes?: string }
  try {
    body = await request.json()
  } catch {
    return marketJson({ error: 'Body must be valid JSON.' }, { status: 400 })
  }
  try {
    if (!body.beliefSlug || !body.venue || !body.externalId) {
      throw new MarketError('beliefSlug, venue, and externalId are required.')
    }
    if (!VENUES.includes(body.venue)) {
      throw new MarketError(`venue must be one of ${VENUES.join(', ')}`)
    }
    const belief = await prisma.belief.findUnique({ where: { slug: body.beliefSlug } })
    if (!belief) throw new MarketError(`No belief with slug "${body.beliefSlug}"`, 404)

    const link = await prisma.externalMarketLink.create({
      data: {
        beliefId: belief.id,
        venue: body.venue,
        externalId: body.externalId.trim(),
        url: body.url?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    })
    return marketJson({ link }, { status: 201 })
  } catch (error) {
    return marketErrorResponse(error)
  }
}
