import type { EcosystemItem } from '../types'
import { formatScore, rankByScore } from '../../belief-analysis/lib/ranking'
import ExpandableRows from '../../belief-analysis/components/ExpandableRows'

interface EcosystemSectionProps {
  items: EcosystemItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

const TYPE_LABELS: Record<string, string> = {
  upstream: 'Upstream: needed first',
  downstream: 'Downstream: wanted after',
  lockin: 'Lock-in',
}

export default function EcosystemSection({ items }: EcosystemSectionProps) {
  const { top, rest } = rankByScore(items, i => i.score)
  const rows: Array<EcosystemItem | null> = top.length > 0 ? top : [null]

  const row = (item: EcosystemItem | null, key: React.Key) => (
    <tr key={key}>
      <td className={TD}>{item?.description ?? <span>&nbsp;</span>}</td>
      <td className={TDC}>{item ? (TYPE_LABELS[item.category] ?? item.category) : <span>&nbsp;</span>}</td>
      <td className={TD}>{item?.cost ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(item?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">🧭 Ecosystem and Lock-in</h2>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th className={`${TH} w-[30%]`}>Item</th>
            <th className={`${TH} w-[24%] text-center`}>Type</th>
            <th className={`${TH} w-[34%]`}>Cost or commitment</th>
            <th className={`${TH} w-[12%] text-center`}>Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, i) => row(item, item?.id ?? i))}
          <ExpandableRows moreCount={rest.length} colSpan={4}>
            {rest.map(item => row(item, item.id))}
          </ExpandableRows>
        </tbody>
      </table>
    </section>
  )
}
