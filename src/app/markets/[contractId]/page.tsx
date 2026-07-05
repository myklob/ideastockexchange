import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { quoteContract, forecastForContract, currentProvisionalScore } from '@/lib/markets/service'
import { epochBoundary } from '@/lib/markets/epoch'
import MarketTrade from './MarketTrade'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ contractId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { contractId } = await params
  const contract = await prisma.marketContract.findUnique({
    where: { id: contractId },
    include: { belief: { select: { statement: true } } },
  })
  if (!contract) return { title: 'Market not found' }
  return {
    title: `${contract.belief?.statement ?? contract.contractType} — Market — Idea Stock Exchange`,
  }
}

export default async function MarketDetailPage({ params }: PageProps) {
  const { contractId } = await params
  const contract = await prisma.marketContract.findUnique({
    where: { id: contractId },
    include: {
      belief: { select: { id: true, slug: true, statement: true } },
      flags: true,
    },
  })
  if (!contract) notFound()

  const quote = await quoteContract(prisma, contract)
  const forecastYes = await forecastForContract(prisma, contract)
  const provisionalScore =
    contract.beliefId !== null ? await currentProvisionalScore(prisma, contract.beliefId) : null
  const divergence = forecastYes === null ? null : quote.priceYes - forecastYes

  const ticks = await prisma.priceTick.findMany({
    where: { contractId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  const openOrders =
    contract.pricingMode === 'ORDER_BOOK'
      ? await prisma.marketOrder.findMany({
          where: { contractId, status: { in: ['OPEN', 'PARTIAL'] } },
          orderBy: [{ limitPrice: 'desc' }],
        })
      : []

  const headline =
    contract.contractType === 'PLATFORM_FAILURE'
      ? 'The snapshot job misses its epoch (platform failure)'
      : contract.contractType === 'ALGORITHM_DELTA'
        ? `An algorithm change ${contract.direction === 'ABOVE' ? 'raises' : 'lowers'} the score of: ${contract.belief?.statement}`
        : contract.belief?.statement ?? ''

  return (
    <main className="max-w-[960px] mx-auto px-4 py-8 text-[#222]">
      <p className="text-right text-sm italic text-gray-600 mb-6">
        <Link href="/" className="text-blue-700 hover:underline">Home</Link>
        {' > '}
        <Link href="/markets" className="text-blue-700 hover:underline">Markets</Link>
        {' > '}
        <strong>{headline.slice(0, 50)}&hellip;</strong>
      </p>

      <div className="text-xs text-gray-500 mb-2">
        <span className="font-medium">{contract.contractType}</span>
        {' • '}
        <span>Resolves {epochBoundary(contract.resolutionEpoch).toISOString().slice(0, 10)}</span>
        {' • '}
        <span>{contract.pricingMode === 'LMSR' ? `LMSR maker (b=${contract.bParameter})` : 'Order book'}</span>
        {' • '}
        <span className="font-mono">{contract.id}</span>
      </div>

      <h1 className="text-2xl font-bold mb-2 leading-tight">{headline}</h1>

      {contract.contractType === 'SCORE' && contract.belief && (
        <p className="text-sm text-gray-600 mb-4">
          YES wins if the{' '}
          <Link href={`/beliefs/${contract.belief.slug}`} className="text-blue-700 hover:underline">
            belief page
          </Link>
          &apos;s snapshot score is {contract.direction === 'ABOVE' ? 'above' : 'below'}{' '}
          <span className="font-mono">{(contract.thresholdValue * 100).toFixed(0)}%</span> at the
          epoch boundary (exactly equal resolves NO). Move the score with better arguments, not trades.
        </p>
      )}
      {contract.contractType === 'ALGORITHM_DELTA' && (
        <p className="text-sm text-gray-600 mb-4">
          A meta-market on algorithm governance: YES only if the resolution epoch&apos;s snapshot was
          produced by a <em>different algorithm version</em> than the prior epoch&apos;s AND the
          score moved {contract.direction === 'ABOVE' ? 'up' : 'down'}. Built against the original
          design warning — see the governance note in <code>docs/MARKET_LAYER_SPEC.md</code>.
        </p>
      )}
      {contract.contractType === 'PLATFORM_FAILURE' && (
        <p className="text-sm text-gray-600 mb-4">
          Shorting the platform: YES if no epoch snapshot lands within 72 hours of the boundary —
          the referee failing to show up, measured programmatically.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-center">
        <div className="border border-gray-200 rounded p-3">
          <div className="text-2xl font-bold text-green-700">{(quote.priceYes * 100).toFixed(0)}&cent;</div>
          <div className="text-xs text-gray-500">YES price ({quote.source})</div>
        </div>
        <div className="border border-gray-200 rounded p-3">
          <div className="text-2xl font-bold">
            {provisionalScore === null ? '—' : `${(provisionalScore * 100).toFixed(0)}%`}
          </div>
          <div className="text-xs text-gray-500">provisional engine score</div>
        </div>
        <div className="border border-gray-200 rounded p-3">
          <div className="text-2xl font-bold">
            {forecastYes === null ? '—' : `${(forecastYes * 100).toFixed(0)}%`}
          </div>
          <div className="text-xs text-gray-500">engine forecast (YES)</div>
        </div>
        <div className="border border-gray-200 rounded p-3">
          <div className={`text-2xl font-bold ${divergence !== null && Math.abs(divergence) >= 0.05 ? 'text-amber-600' : ''}`}>
            {divergence === null ? '—' : `${divergence > 0 ? '+' : ''}${(divergence * 100).toFixed(0)}pts`}
          </div>
          <div className="text-xs text-gray-500">divergence (the arbitrage)</div>
        </div>
      </div>

      <MarketTrade
        contractId={contract.id}
        pricingMode={contract.pricingMode}
        priceYes={quote.priceYes}
        feeRate={contract.feeRate}
      />

      {contract.pricingMode === 'ORDER_BOOK' && (
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-2">Order book</h2>
          {openOrders.length === 0 ? (
            <p className="text-sm text-gray-500">Empty book. Place the first limit order above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100 text-xs">
                    <th className="border border-gray-300 px-2 py-1.5">Side</th>
                    <th className="border border-gray-300 px-2 py-1.5">Outcome</th>
                    <th className="border border-gray-300 px-2 py-1.5">Limit</th>
                    <th className="border border-gray-300 px-2 py-1.5">Open qty</th>
                  </tr>
                </thead>
                <tbody>
                  {openOrders.map(order => (
                    <tr key={order.id} className="text-center">
                      <td className={`border border-gray-300 px-2 py-1 ${order.side === 'BUY' ? 'text-green-700' : 'text-red-600'}`}>
                        {order.side}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">{order.outcome}</td>
                      <td className="border border-gray-300 px-2 py-1 font-mono">
                        {(order.limitPrice * 100).toFixed(0)}&cent;
                      </td>
                      <td className="border border-gray-300 px-2 py-1 font-mono">
                        {(order.quantity - order.filledQuantity).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-bold mb-2">Price feed</h2>
        <p className="text-xs text-gray-500 mb-2">
          One tick per price-changing event, with the engine forecast at that moment. Full history:{' '}
          <code className="text-xs">/api/v1/market/contracts/{contract.id}/feed</code>
        </p>
        {ticks.length === 0 ? (
          <p className="text-sm text-gray-500">No trades yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100 text-xs">
                  <th className="border border-gray-300 px-2 py-1.5">Time (UTC)</th>
                  <th className="border border-gray-300 px-2 py-1.5">YES price</th>
                  <th className="border border-gray-300 px-2 py-1.5">Engine forecast</th>
                </tr>
              </thead>
              <tbody>
                {ticks.map(tick => (
                  <tr key={tick.id} className="text-center font-mono text-xs">
                    <td className="border border-gray-300 px-2 py-1">
                      {tick.createdAt.toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">{(tick.priceYes * 100).toFixed(1)}&cent;</td>
                    <td className="border border-gray-300 px-2 py-1">
                      {tick.forecastYes === null ? '—' : `${(tick.forecastYes * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {contract.flags.length > 0 && (
        <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-3 text-sm">
          <p className="font-semibold mb-1">
            Manipulation monitor flags (human to-dos — never settlement inputs)
          </p>
          <ul className="list-disc ml-5 text-xs">
            {contract.flags.map(flag => (
              <li key={flag.id}>
                <span className="font-mono">{flag.reason}</span>: {flag.details}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
        <p>
          <strong>Want to move the price?</strong> Don&apos;t out-bid the market — go improve the
          underlying argument graph. Better arguments, better evidence, tighter linkages all show
          up in the next snapshot. Trading never moves the score; the firewall only flows one way.
        </p>
      </div>
    </main>
  )
}
