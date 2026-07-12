import Link from 'next/link'
import type { BeliefMarketPointer } from '@/lib/markets/belief-pointer'

interface MarketPointerProps {
  contracts: BeliefMarketPointer[]
}

/**
 * The belief→market pointer: when an open contract exists on this belief's
 * score, say so where the arguments live. Reading the debate and staking a
 * position on where its score is heading close into one loop — the reason to
 * come back. Prices never feed scores; the only way to move the settlement
 * is to improve the argument graph below.
 */
export default function MarketPointer({ contracts }: MarketPointerProps) {
  if (contracts.length === 0) return null

  return (
    <div className="border border-gray-300 bg-gray-50 px-4 py-2.5 mb-6 text-sm">
      <span className="mr-1">&#x1F3AF;</span>
      <strong>Prediction market open on this score.</strong>{' '}
      {contracts.map((c, i) => (
        <span key={c.id}>
          {i > 0 && ' · '}
          <Link href={`/markets/${c.id}`} className="text-[var(--accent)] hover:underline">
            {c.contractType === 'SCORE' ? (
              <>settles {c.direction.toLowerCase()} {c.thresholdValue} at {c.resolutionEpoch}</>
            ) : (
              <>{c.contractType.replace('_', ' ').toLowerCase()} · {c.resolutionEpoch}</>
            )}
            {c.status === 'FROZEN' ? ' (frozen for settlement)' : ''}
          </Link>
        </span>
      ))}
      <span className="text-[var(--muted-foreground)]">
        {' '}— prices predict the engine, never feed it. Move the score by improving the arguments below.
      </span>
    </div>
  )
}
