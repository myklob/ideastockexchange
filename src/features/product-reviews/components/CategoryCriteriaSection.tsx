import type { CategoryCriterionItem } from '../types'
import { formatScore, rankByScore } from '../../belief-analysis/lib/ranking'
import ExpandableRows from '../../belief-analysis/components/ExpandableRows'

interface CategoryCriteriaSectionProps {
  categoryType: string
  criteria: CategoryCriterionItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

/**
 * CRITERIA BEFORE BRANDS: this table is filled before performance or
 * arguments are touched. The criteria apply to every product in the category
 * and are the yardstick the rest of the page measures against.
 */
export default function CategoryCriteriaSection({ categoryType, criteria }: CategoryCriteriaSectionProps) {
  const { top, rest } = rankByScore(criteria, c => c.score)
  const rows: Array<CategoryCriterionItem | null> = top.length > 0 ? top : [null]

  const row = (c: CategoryCriterionItem | null, key: React.Key) => (
    <tr key={key}>
      <td className={TD}>{c?.criterion ?? <span>&nbsp;</span>}</td>
      <td className={TD}>{c?.howToMeasure ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(c?.importance) ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(c?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">🧪 Category Criteria: What Makes a Good {categoryType.replace(/s$/, '')}?</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Criteria before brands: these apply to every product in the category and are the yardstick
        the rest of this page measures against.
      </p>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th className={`${TH} w-[34%]`}>Criterion (applies to every product in the category)</th>
            <th className={`${TH} w-[34%]`}>How to measure it</th>
            <th className={`${TH} w-[16%] text-center`}>Importance</th>
            <th className={`${TH} w-[16%] text-center`}>Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => row(c, c?.id ?? i))}
          <ExpandableRows moreCount={rest.length} colSpan={4}>
            {rest.map(c => row(c, c.id))}
          </ExpandableRows>
        </tbody>
      </table>
    </section>
  )
}
