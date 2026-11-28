import Link from 'next/link'
import type { OwnershipCostItem, ValueItem } from '../types'
import { formatScore, rankByScore } from '../../belief-analysis/lib/ranking'
import ExpandableRows from '../../belief-analysis/components/ExpandableRows'
import TierBadge from './TierBadge'

interface OwnershipSectionProps {
  costs: OwnershipCostItem[]
  values: ValueItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

const COST_TYPE_LABELS: Record<string, string> = {
  initial: 'Initial',
  ongoing: 'Ongoing',
  hidden: 'Hidden',
  opportunity: 'Opportunity',
}

const TIMEFRAME_LABELS: Record<string, string> = {
  short: 'Short-term (0-2 years)',
  long: 'Long-term (3+ years)',
  both: 'Short-term / Long-term',
}

function sourceCell(source: string | null, tier: number | null): React.ReactNode {
  if (!source && tier == null) return <span>&nbsp;</span>
  return (
    <>
      {source ?? <span className="text-[var(--muted-foreground)] italic">unsourced</span>}
      <TierBadge tier={tier} />
    </>
  )
}

/**
 * Cost-Benefit Analysis, product form: total cost of ownership and total
 * value delivered. Costs and benefits keep their units and never collapse
 * across categories unless the conversion is stated.
 */
export default function OwnershipSection({ costs, values }: OwnershipSectionProps) {
  const rankedCosts = rankByScore(costs, c => c.score)
  const rankedValues = rankByScore(values, v => v.score)

  const costRow = (c: OwnershipCostItem | null, key: React.Key) => (
    <tr key={key}>
      <td className={TD}>{c?.item ?? <span>&nbsp;</span>}</td>
      <td className={TD}>{c?.estimate ?? <span>&nbsp;</span>}</td>
      <td className={TDC}>{c ? (COST_TYPE_LABELS[c.costType] ?? c.costType) : <span>&nbsp;</span>}</td>
      <td className={TD}>{c ? sourceCell(c.source, c.evidenceTier) : <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(c?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )

  const valueRow = (v: ValueItem | null, key: React.Key) => (
    <tr key={key}>
      <td className={TD}>{v?.item ?? <span>&nbsp;</span>}</td>
      <td className={TD}>{v?.measure ?? <span>&nbsp;</span>}</td>
      <td className={TDC}>{v ? (TIMEFRAME_LABELS[v.timeframe] ?? v.timeframe) : <span>&nbsp;</span>}</td>
      <td className={TD}>{v ? sourceCell(v.source, v.evidenceTier) : <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(v?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )

  return (
    <section className="space-y-5">
      <h2 className="text-xl font-bold mb-2">
        💰{' '}
        <Link href="/cba/about" className="text-[var(--accent)] hover:underline">
          Cost-Benefit Analysis
        </Link>
      </h2>

      <div>
        <h3 className="text-base font-semibold mb-2">Total cost of ownership</h3>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={`${TH} w-[30%]`}>Cost item</th>
              <th className={`${TH} w-[18%]`}>Estimate (with units)</th>
              <th className={`${TH} w-[20%] text-center`}>Type</th>
              <th className={`${TH} w-[20%]`}>Evidence (source + tier)</th>
              <th className={`${TH} w-[12%] text-center`}>Score</th>
            </tr>
          </thead>
          <tbody>
            {(rankedCosts.top.length > 0 ? rankedCosts.top : [null]).map((c, i) => costRow(c, c?.id ?? i))}
            <ExpandableRows moreCount={rankedCosts.rest.length} colSpan={5}>
              {rankedCosts.rest.map(c => costRow(c, c.id))}
            </ExpandableRows>
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2">Total value delivered</h3>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={`${TH} w-[30%]`}>Value item</th>
              <th className={`${TH} w-[18%]`}>Measure (with units)</th>
              <th className={`${TH} w-[20%] text-center`}>Timeframe</th>
              <th className={`${TH} w-[20%]`}>Evidence (source + tier)</th>
              <th className={`${TH} w-[12%] text-center`}>Score</th>
            </tr>
          </thead>
          <tbody>
            {(rankedValues.top.length > 0 ? rankedValues.top : [null]).map((v, i) => valueRow(v, v?.id ?? i))}
            <ExpandableRows moreCount={rankedValues.rest.length} colSpan={5}>
              {rankedValues.rest.map(v => valueRow(v, v.id))}
            </ExpandableRows>
          </tbody>
        </table>
      </div>
    </section>
  )
}
