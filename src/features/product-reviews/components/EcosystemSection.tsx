import type { EcosystemItem } from '../types'
import SectionHeading from '@/features/belief-analysis/components/SectionHeading'

interface EcosystemSectionProps {
  items: EcosystemItem[]
}

export default function EcosystemSection({ items }: EcosystemSectionProps) {
  const upstream = items.filter(i => i.category === 'upstream')
  const downstream = items.filter(i => i.category === 'downstream')
  const lockin = items.filter(i => i.category === 'lockin')

  return (
    <div>
      <SectionHeading
        emoji="🧭"
        title="Product Ecosystem: Related Purchases"
        subtitle="Understanding the full ecosystem helps calculate true long-term cost and commitment level."
      />

      {items.length > 0 ? (
        <div className="space-y-4">
          {upstream.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Upstream Dependencies (You Need These First):</p>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                {upstream.map(item => (
                  <li key={item.id}>{item.description}</li>
                ))}
              </ol>
            </div>
          )}

          {downstream.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Downstream Additions (You Might Want These After):</p>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                {downstream.map(item => (
                  <li key={item.id}>{item.description}</li>
                ))}
              </ol>
            </div>
          )}

          {lockin.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Lock-in Considerations:</p>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                {lockin.map(item => (
                  <li key={item.id}>{item.description}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No ecosystem analysis has been recorded yet.</p>
      )}
    </div>
  )
}
