import type { TradeoffItem } from '../types'
import SectionHeading from '@/features/belief-analysis/components/SectionHeading'

interface TradeoffsSectionProps {
  tradeoffs: TradeoffItem[]
}

export default function TradeoffsSection({ tradeoffs }: TradeoffsSectionProps) {
  const advertisedOptimizes = tradeoffs.filter(t => t.side === 'optimizes' && t.category === 'advertised')
  const advertisedSacrifices = tradeoffs.filter(t => t.side === 'sacrifices' && t.category === 'advertised')
  const actualOptimizes = tradeoffs.filter(t => t.side === 'optimizes' && t.category === 'actual')
  const actualSacrifices = tradeoffs.filter(t => t.side === 'sacrifices' && t.category === 'actual')

  return (
    <div>
      <SectionHeading
        emoji="⚖️"
        title="Core Design Trade-offs"
        subtitle="Every product design involves trade-offs. Understanding these helps users determine if this product's specific balance matches their priorities."
      />

      {tradeoffs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">What This Product Optimizes For</th>
                <th className="text-left px-4 py-3 font-semibold">What This Product Sacrifices</th>
              </tr>
            </thead>
            <tbody>
              {(advertisedOptimizes.length > 0 || advertisedSacrifices.length > 0) && (
                <>
                  <tr className="border-t border-gray-200 bg-gray-50/50">
                    <td className="px-4 py-2 font-semibold text-xs uppercase text-gray-500">Advertised</td>
                    <td className="px-4 py-2 font-semibold text-xs uppercase text-gray-500">Advertised</td>
                  </tr>
                  {Array.from({ length: Math.max(advertisedOptimizes.length, advertisedSacrifices.length) }).map((_, i) => (
                    <tr key={`adv-${i}`} className="border-t border-gray-200">
                      <td className="px-4 py-3">{advertisedOptimizes[i]?.description ?? ''}</td>
                      <td className="px-4 py-3">{advertisedSacrifices[i]?.description ?? ''}</td>
                    </tr>
                  ))}
                </>
              )}
              {(actualOptimizes.length > 0 || actualSacrifices.length > 0) && (
                <>
                  <tr className="border-t border-gray-200 bg-gray-50/50">
                    <td className="px-4 py-2 font-semibold text-xs uppercase text-gray-500">Actual (what evidence shows)</td>
                    <td className="px-4 py-2 font-semibold text-xs uppercase text-gray-500">Actual (what evidence shows)</td>
                  </tr>
                  {Array.from({ length: Math.max(actualOptimizes.length, actualSacrifices.length) }).map((_, i) => (
                    <tr key={`act-${i}`} className="border-t border-gray-200">
                      <td className="px-4 py-3">{actualOptimizes[i]?.description ?? ''}</td>
                      <td className="px-4 py-3">{actualSacrifices[i]?.description ?? ''}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No trade-off analysis has been recorded yet.</p>
      )}
    </div>
  )
}
