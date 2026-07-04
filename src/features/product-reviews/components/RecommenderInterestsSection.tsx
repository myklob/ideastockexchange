import type { RecommenderInterestItem } from '../types'
import { formatScore, pairBySide, rankByScore, TABLE_TOP_LIMIT } from '../../belief-analysis/lib/ranking'
import ExpandableRows from '../../belief-analysis/components/ExpandableRows'

interface RecommenderInterestsSectionProps {
  interests: RecommenderInterestItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

function InterestCell({ item }: { item: RecommenderInterestItem | null }) {
  if (!item) return <span>&nbsp;</span>
  return (
    <>
      {item.description}
      {item.evidence && (
        <span className="text-xs text-[var(--muted-foreground)]"> — Evidence: {item.evidence}</span>
      )}
    </>
  )
}

/**
 * Interests Behind the Recommendations. Hidden-interest attributions
 * (affiliate money, ecosystem lock-in) render as the italic rows: they are
 * scored claims requiring evidence, applied with equal suspicion to
 * recommenders of this product and recommenders of alternatives.
 */
export default function RecommenderInterestsSection({ interests }: RecommenderInterestsSectionProps) {
  const stated = (side: string) =>
    rankByScore(interests.filter(i => i.side === side && !i.hidden), i => i.score, Infinity).top
  const hiddenRows = (side: string) =>
    rankByScore(interests.filter(i => i.side === side && i.hidden), i => i.score, Infinity).top

  const pairs = pairBySide(stated('product'), stated('alternatives'))
  const topPairs = pairs.length > 0 ? pairs.slice(0, TABLE_TOP_LIMIT) : [[null, null] as [RecommenderInterestItem | null, RecommenderInterestItem | null]]
  const restPairs = pairs.slice(TABLE_TOP_LIMIT)
  const hiddenPairs = pairBySide(hiddenRows('product'), hiddenRows('alternatives'))

  const row = ([p, a]: [RecommenderInterestItem | null, RecommenderInterestItem | null], key: React.Key, hidden = false) => (
    <tr key={key} className={hidden ? 'italic bg-[#fdf6ec]' : ''}>
      <td className={TD}><InterestCell item={p} /></td>
      <td className={`${TDC} font-mono`}>{formatScore(p?.score) ?? <span>&nbsp;</span>}</td>
      <td className={TD}><InterestCell item={a} /></td>
      <td className={`${TDC} font-mono`}>{formatScore(a?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">💡 Interests Behind the Recommendations</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Who recommends this product or its alternatives, what they gain, and what they optimize
        for. The italic rows are candidate hidden interests — scored claims requiring evidence,
        applied with equal suspicion to both sides.
      </p>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th className={`${TH} w-[42%]`}>Those who recommend this product</th>
            <th className={`${TH} w-[8%] text-center`}>Score</th>
            <th className={`${TH} w-[42%]`}>Those who recommend alternatives</th>
            <th className={`${TH} w-[8%] text-center`}>Score</th>
          </tr>
        </thead>
        <tbody>
          {topPairs.map((pair, i) => row(pair, pair[0]?.id ?? pair[1]?.id ?? i))}
          <ExpandableRows moreCount={restPairs.length} colSpan={4}>
            {restPairs.map((pair, i) => row(pair, pair[0]?.id ?? pair[1]?.id ?? i))}
          </ExpandableRows>
          {(hiddenPairs.length > 0 ? hiddenPairs : [[null, null] as [RecommenderInterestItem | null, RecommenderInterestItem | null]]).map(
            (pair, i) => row(pair, `h${pair[0]?.id ?? pair[1]?.id ?? i}`, true),
          )}
        </tbody>
      </table>
    </section>
  )
}
