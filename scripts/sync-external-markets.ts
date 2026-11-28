/**
 * External-market data plumbing (Kalshi-style integration). For every
 * ExternalMarketLink, fetch the external market's public state and:
 *
 *   1. File its settlement-relevant facts as SuggestedEvidence on the linked
 *      belief (suggestion-only: nothing lands on the graph until explicitly
 *      accepted through the validated queue).
 *   2. Print suggested hedging positions where the external market's implied
 *      probability diverges from our contracts' prices.
 *
 * THE INTEGRATION RULE: this script never writes a score, never writes a
 * price into our books, and never auto-accepts evidence. One-way plumbing.
 *
 *   npx tsx scripts/sync-external-markets.ts
 */

import { prisma } from '@/lib/prisma'
import { quoteContract } from '@/lib/markets/service'

const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2/markets/'
const CONNECTOR_AGENT = 'system:kalshi-connector'

interface ExternalState {
  title: string
  status: string
  impliedYes: number | null
  url: string
}

async function fetchKalshi(ticker: string): Promise<ExternalState | null> {
  try {
    const response = await fetch(KALSHI_API + encodeURIComponent(ticker), {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const json = (await response.json()) as {
      market?: { title?: string; status?: string; last_price?: number; ticker?: string }
    }
    const market = json.market
    if (!market) return null
    return {
      title: market.title ?? ticker,
      status: market.status ?? 'unknown',
      impliedYes: typeof market.last_price === 'number' ? market.last_price / 100 : null,
      url: `https://kalshi.com/markets/${ticker}`,
    }
  } catch {
    return null
  }
}

async function ensureConnectorAgent() {
  const existing = await prisma.agent.findUnique({ where: { name: CONNECTOR_AGENT } })
  if (existing) return existing
  return prisma.agent.create({
    data: {
      name: CONNECTOR_AGENT,
      operator: 'Idea Stock Exchange',
      description: 'External-market data connector. Proposes evidence; never scores, never trades.',
      isSystem: true,
    },
  })
}

async function main() {
  const links = await prisma.externalMarketLink.findMany({
    include: { belief: { select: { id: true, slug: true, statement: true } } },
  })
  if (links.length === 0) {
    console.log('No external market links. Add one via POST /api/v1/market/external-links.')
    return
  }
  const connector = await ensureConnectorAgent()

  for (const link of links) {
    if (link.venue !== 'KALSHI') {
      console.log(`- ${link.venue}:${link.externalId} — no fetcher for this venue yet; skipped.`)
      continue
    }
    const state = await fetchKalshi(link.externalId)
    if (!state) {
      console.log(`- KALSHI:${link.externalId} — could not fetch; skipped.`)
      continue
    }

    // Settlement-relevant fact → suggestion queue (explicit acceptance required).
    const title = `Kalshi market "${state.title}" is ${state.status}` +
      (state.impliedYes !== null ? ` (implied ${(state.impliedYes * 100).toFixed(0)}%)` : '')
    const pending = await prisma.suggestedEvidence.findFirst({
      where: { beliefId: link.beliefId, source: 'kalshi', title, status: 'pending' },
    })
    if (!pending) {
      await prisma.suggestedEvidence.create({
        data: {
          beliefId: link.beliefId,
          source: 'kalshi',
          title,
          sourceUrl: state.url,
          proposedByAgentId: connector.id,
        },
      })
      await prisma.auditLog.create({
        data: {
          agentId: connector.id,
          action: 'suggest_evidence',
          targetType: 'SuggestedEvidence',
          targetId: link.externalId,
          rationale: `External market state for ${link.belief.slug}; suggestion-only, accept to attach.`,
        },
      })
    }
    console.log(`- KALSHI:${link.externalId} → suggestion filed for "${link.belief.slug}"`)

    // Suggested hedges: our contract price vs the external implied probability.
    if (state.impliedYes === null) continue
    const contracts = await prisma.marketContract.findMany({
      where: { beliefId: link.beliefId, status: 'OPEN' },
    })
    for (const contract of contracts) {
      const quote = await quoteContract(prisma, contract)
      const gap = quote.priceYes - state.impliedYes
      if (Math.abs(gap) >= 0.1) {
        const ourSide = gap > 0 ? 'NO here / YES there' : 'YES here / NO there'
        console.log(
          `    hedge candidate on ${contract.id}: ISE ${(quote.priceYes * 100).toFixed(0)}% vs ` +
          `Kalshi ${(state.impliedYes * 100).toFixed(0)}% → ${ourSide} (gap ${(gap * 100).toFixed(0)}pts)`,
        )
      }
    }
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
