import Link from 'next/link'
import type { AlternativeItem } from '../types'
import SectionHeading from '@/features/belief-analysis/components/SectionHeading'

interface AlternativesSectionProps {
  alternatives: AlternativeItem[]
}

export default function AlternativesSection({ alternatives }: AlternativesSectionProps) {
  const premium = alternatives.filter(a => a.tier === 'premium')
  const budget = alternatives.filter(a => a.tier === 'budget')
  const lateral = alternatives.filter(a => a.tier === 'lateral')

  return (
    <div>
      <SectionHeading
        emoji="🔄"
        title="Similar Products & Alternatives"
        subtitle="Grouping similar products prevents fragmented debates and ensures comprehensive analysis."
      />

      {alternatives.length > 0 ? (
        <>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Premium Alternatives (Higher Cost/Performance)</th>
                  <th className="text-left px-4 py-3 font-semibold">Budget Alternatives (Lower Cost/Performance)</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.max(premium.length, budget.length, 1) }).map((_, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="px-4 py-3">
                      {premium[i] ? (
                        <>
                          {premium[i].linkSlug ? (
                            <Link href={`/product-reviews/${premium[i].linkSlug}`} className="text-[var(--accent)] hover:underline font-medium">
                              {premium[i].alternativeName}
                            </Link>
                          ) : (
                            <span className="font-medium">{premium[i].alternativeName}</span>
                          )}
                          <span className="text-gray-600"> — {premium[i].keyAdvantage}</span>
                        </>
                      ) : ''}
                    </td>
                    <td className="px-4 py-3">
                      {budget[i] ? (
                        <>
                          {budget[i].linkSlug ? (
                            <Link href={`/product-reviews/${budget[i].linkSlug}`} className="text-[var(--accent)] hover:underline font-medium">
                              {budget[i].alternativeName}
                            </Link>
                          ) : (
                            <span className="font-medium">{budget[i].alternativeName}</span>
                          )}
                          <span className="text-gray-600"> — {budget[i].keyAdvantage}</span>
                        </>
                      ) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lateral.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Lateral Alternatives (Different Trade-offs, Similar Price):</p>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                {lateral.map((alt) => (
                  <li key={alt.id}>
                    {alt.linkSlug ? (
                      <Link href={`/product-reviews/${alt.linkSlug}`} className="text-[var(--accent)] hover:underline font-medium">
                        {alt.alternativeName}
                      </Link>
                    ) : (
                      <span className="font-medium">{alt.alternativeName}</span>
                    )}
                    <span className="text-gray-600"> — {alt.keyAdvantage}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-500 italic">No alternative products have been listed yet.</p>
      )}
    </div>
  )
}
