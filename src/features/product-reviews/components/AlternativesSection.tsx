import Link from 'next/link'
import type { AlternativeItem } from '../types'
import { formatScore, rankByScore } from '../../belief-analysis/lib/ranking'
import ExpandableRows from '../../belief-analysis/components/ExpandableRows'

interface AlternativesSectionProps {
  alternatives: AlternativeItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

function relationshipLabel(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

export default function AlternativesSection({ alternatives }: AlternativesSectionProps) {
  const { top, rest } = rankByScore(alternatives, a => a.score)
  const rows: Array<AlternativeItem | null> = top.length > 0 ? top : [null]

  const row = (a: AlternativeItem | null, key: React.Key) => (
    <tr key={key}>
      <td className={TD}>
        {a ? (
          a.linkSlug ? (
            <Link href={`/product-reviews/${a.linkSlug}`} className="text-[var(--accent)] hover:underline">
              {a.alternativeName}
            </Link>
          ) : (
            a.alternativeName
          )
        ) : (
          <span>&nbsp;</span>
        )}
      </td>
      <td className={TDC}>{a ? relationshipLabel(a.tier) : <span>&nbsp;</span>}</td>
      <td className={TD}>{a?.keyAdvantage ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(a?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">🔄 Alternatives</h2>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th className={`${TH} w-[26%]`}>Alternative</th>
            <th className={`${TH} w-[18%] text-center`}>Relationship</th>
            <th className={`${TH} w-[44%]`}>Key difference from this product</th>
            <th className={`${TH} w-[12%] text-center`}>Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a, i) => row(a, a?.id ?? i))}
          <ExpandableRows moreCount={rest.length} colSpan={4}>
            {rest.map(a => row(a, a.id))}
          </ExpandableRows>
        </tbody>
      </table>
    </section>
  )
}
