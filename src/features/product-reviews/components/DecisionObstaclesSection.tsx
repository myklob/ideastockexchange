import type { DecisionObstacleItem } from '../types'
import { formatScore, pairBySide, rankByScore, TABLE_TOP_LIMIT } from '../../belief-analysis/lib/ranking'
import ExpandableRows from '../../belief-analysis/components/ExpandableRows'

interface DecisionObstaclesSectionProps {
  obstacles: DecisionObstacleItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

export default function DecisionObstaclesSection({ obstacles }: DecisionObstaclesSectionProps) {
  const overpay = rankByScore(obstacles.filter(o => o.side === 'overpay'), o => o.score, Infinity).top
  const underinvest = rankByScore(obstacles.filter(o => o.side === 'underinvest'), o => o.score, Infinity).top
  const pairs = pairBySide(overpay, underinvest)
  const topPairs = pairs.length > 0 ? pairs.slice(0, TABLE_TOP_LIMIT) : [[null, null] as [DecisionObstacleItem | null, DecisionObstacleItem | null]]
  const restPairs = pairs.slice(TABLE_TOP_LIMIT)

  const row = ([o, u]: [DecisionObstacleItem | null, DecisionObstacleItem | null], key: React.Key) => (
    <tr key={key}>
      <td className={TD}>{o?.description ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(o?.score) ?? <span>&nbsp;</span>}</td>
      <td className={TD}>{u?.description ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(u?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">🚧 Decision Obstacles</h2>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th className={`${TH} w-[42%]`}>Why buyers overpay in this category</th>
            <th className={`${TH} w-[8%] text-center`}>Score</th>
            <th className={`${TH} w-[42%]`}>Why buyers underinvest in this category</th>
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
