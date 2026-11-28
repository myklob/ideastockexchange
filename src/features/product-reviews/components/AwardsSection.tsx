import type { AwardItem } from '../types'
import { formatScore, pairBySide, rankByScore, TABLE_TOP_LIMIT } from '../../belief-analysis/lib/ranking'
import ExpandableRows from '../../belief-analysis/components/ExpandableRows'

interface AwardsSectionProps {
  awards: AwardItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

function AwardCell({ a }: { a: AwardItem | null }) {
  if (!a) return <span>&nbsp;</span>
  return (
    <>
      {a.title}
      {a.details && <span className="text-xs text-[var(--muted-foreground)]"> — {a.details}</span>}
    </>
  )
}

export default function AwardsSection({ awards }: AwardsSectionProps) {
  const independent = rankByScore(awards.filter(a => a.side === 'independent'), a => a.score, Infinity).top
  const manufacturer = rankByScore(awards.filter(a => a.side === 'manufacturer'), a => a.score, Infinity).top
  const pairs = pairBySide(independent, manufacturer)
  const topPairs = pairs.length > 0 ? pairs.slice(0, TABLE_TOP_LIMIT) : [[null, null] as [AwardItem | null, AwardItem | null]]
  const restPairs = pairs.slice(TABLE_TOP_LIMIT)

  const row = ([ind, man]: [AwardItem | null, AwardItem | null], key: React.Key) => (
    <tr key={key}>
      <td className={TD}><AwardCell a={ind} /></td>
      <td className={`${TDC} font-mono`}>{formatScore(ind?.score) ?? <span>&nbsp;</span>}</td>
      <td className={TD}><AwardCell a={man} /></td>
      <td className={`${TDC} font-mono`}>{formatScore(man?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">🏆 Recognition</h2>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th className={`${TH} w-[42%]`}>Independent recognition (award, certifier, criteria)</th>
            <th className={`${TH} w-[8%] text-center`}>Score</th>
            <th className={`${TH} w-[42%]`}>Manufacturer claims (marketing awards, self-selected statistics)</th>
            <th className={`${TH} w-[8%] text-center`}>Score</th>
          </tr>
        </thead>
        <tbody>
          {topPairs.map((pair, i) => row(pair, pair[0]?.id ?? pair[1]?.id ?? i))}
          <ExpandableRows moreCount={restPairs.length} colSpan={4}>
            {restPairs.map((pair, i) => row(pair, pair[0]?.id ?? pair[1]?.id ?? i))}
          </ExpandableRows>
        </tbody>
      </table>
    </section>
  )
}
