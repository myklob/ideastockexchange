import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { quoteContract, forecastForContract } from '@/lib/markets/service'
import { MARKET_SCORE_NOTICE } from '@/lib/markets/api'
import { epochBoundary } from '@/lib/markets/epoch'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Prediction Markets — Idea Stock Exchange',
  description:
    'Buy YES/NO shares on the future engine score of belief pages. Play money. Settles against immutable epoch snapshots at the end of each month.',
}

function PriceBar({ priceYes }: { priceYes: number }) {
  const pctYes = Math.round(priceYes * 100)
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div className="bg-green-500" style={{ width: `${pctYes}%` }} />
      <div className="bg-red-400" style={{ width: `${100 - pctYes}%` }} />
    </div>
  )
}

function contractHeadline(contract: {
  contractType: string
  direction: string
  thresholdValue: number
  belief: { statement: string } | null
}): string {
  if (contract.contractType === 'PLATFORM_FAILURE') {
    return 'The snapshot job misses its epoch (platform failure)'
  }
  if (contract.contractType === 'ALGORITHM_DELTA') {
    return `An algorithm change ${contract.direction === 'ABOVE' ? 'raises' : 'lowers'} the score of: ${contract.belief?.statement ?? ''}`
  }
  return contract.belief?.statement ?? ''
}

export default async function MarketsIndexPage() {
  const contracts = await prisma.marketContract.findMany({
    where: { status: 'OPEN' },
    include: { belief: { select: { slug: true, statement: true } } },
    orderBy: [{ resolutionEpoch: 'asc' }, { createdAt: 'asc' }],
    take: 100,
  })

  const rows = []
  for (const contract of contracts) {
    const quote = await quoteContract(prisma, contract)
    const forecastYes = await forecastForContract(prisma, contract)
    rows.push({ contract, quote, forecastYes })
  }

  return (
    <main className="max-w-[960px] mx-auto px-4 py-8 text-[#222]">
      <p className="text-right text-sm italic text-gray-600 mb-6">
        <Link href="/" className="text-blue-700 hover:underline">Home</Link>
        {' > '}
        <strong>Markets</strong>
      </p>

      <h1 className="text-3xl font-bold mb-2">Prediction Markets</h1>
      <p className="text-lg text-gray-600 mb-4">
        Buy YES or NO on the future engine score of a belief.
      </p>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded text-sm">
        <p className="mb-1">
          <strong>Play money.</strong> Trade under any username; new accounts start with{' '}
          <span className="font-mono">$10,000</span>. Young markets quote via an LMSR maker;
          at 1,000 shares of volume they graduate to a peer-to-peer order book.
        </p>
        <p className="mb-1">
          Markets settle against immutable{' '}
          <code className="font-mono text-xs bg-amber-100 px-1 rounded">EpochSnapshot</code>{' '}
          records at each month&apos;s end. Move the score by posting better arguments on the
          belief page — never by trading. {MARKET_SCORE_NOTICE}
        </p>
        <p className="text-xs text-gray-600">
          Full mechanics: <code>docs/MARKET_LAYER_SPEC.md</code> ·{' '}
          <Link href="/prediction-markets-comparison" className="text-blue-700 hover:underline">
            design rationale
          </Link>
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No open contracts.</p>
          <p className="text-sm">
            Seed the featured set with <code>npx tsx prisma/seed-markets.ts</code>, or create one via{' '}
            <code>POST /api/v1/market/contracts</code>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ contract, quote, forecastYes }) => {
            const yesPct = (quote.priceYes * 100).toFixed(0)
            const noPct = ((1 - quote.priceYes) * 100).toFixed(0)
            const divergence = forecastYes === null ? null : quote.priceYes - forecastYes
            return (
              <Link
                key={contract.id}
                href={`/markets/${contract.id}`}
                className="block border border-gray-200 rounded-lg p-5 hover:border-blue-400 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span className="font-medium">{contract.contractType}</span>
                      <span>•</span>
                      <span>
                        Resolves {epochBoundary(contract.resolutionEpoch).toISOString().slice(0, 10)}
                      </span>
                      <span>•</span>
                      <span>{contract.pricingMode === 'LMSR' ? 'LMSR maker' : 'Order book'}</span>
                    </div>
                    <h2 className="font-semibold text-lg leading-snug mb-1">
                      {contractHeadline(contract)}
                    </h2>
                    {contract.contractType === 'SCORE' && (
                      <p className="text-sm text-gray-600 mb-1">
                        Will score {contract.direction === 'ABOVE' ? '>' : '<'}{' '}
                        {(contract.thresholdValue * 100).toFixed(0)}% at epoch end?
                        {forecastYes !== null && (
                          <>
                            {' '}Engine forecast:{' '}
                            <span className="font-mono">{(forecastYes * 100).toFixed(0)}%</span>
                            {divergence !== null && Math.abs(divergence) >= 0.05 && (
                              <span className={divergence > 0 ? 'text-red-600' : 'text-green-700'}>
                                {' '}(divergence {divergence > 0 ? '+' : ''}
                                {(divergence * 100).toFixed(0)}pts — the arbitrage lives here)
                              </span>
                            )}
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-right min-w-[120px]">
                    <div className="text-2xl font-bold text-green-700 leading-none">{yesPct}&cent;</div>
                    <div className="text-xs text-gray-500 mb-2">YES price</div>
                    <div className="text-sm text-red-600">{noPct}&cent; NO</div>
                  </div>
                </div>

                <PriceBar priceYes={quote.priceYes} />
              </Link>
            )
          })}
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-600 space-y-1">
        <p>
          <strong>The firewall:</strong> market prices and volume never feed back into the scoring
          engine. Data flows one way — the engine publishes snapshots, the market settles against
          them. External consumers can verify settlements via the signed oracle endpoint{' '}
          <code className="text-xs">/api/v1/oracle/snapshot</code>.
        </p>
      </div>
    </main>
  )
}
