import type { PerformanceItem } from '../types'
import { formatScore, rankByScore } from '../../belief-analysis/lib/ranking'
import ExpandableRows from '../../belief-analysis/components/ExpandableRows'
import TierBadge from './TierBadge'

interface PerformanceSectionProps {
  performance: PerformanceItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

function SourceCell({ p }: { p: PerformanceItem }) {
  const name = p.source ?? (p.sourceUrl ? new URL(p.sourceUrl).hostname : null)
  return (
    <>
      {p.sourceUrl ? (
        <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
          {name ?? 'Source'}
        </a>
      ) : (
        name ?? <span className="text-[var(--muted-foreground)] italic">unsourced</span>
      )}
      <TierBadge tier={p.evidenceTier} />
    </>
  )
}

export default function PerformanceSection({ performance }: PerformanceSectionProps) {
  const { top, rest } = rankByScore(performance, p => p.impact)
  const rows: Array<PerformanceItem | null> = top.length > 0 ? top : [null]

  const row = (p: PerformanceItem | null, key: React.Key) => (
    <tr key={key}>
      <td className={TD}>{p?.criterion ?? <span>&nbsp;</span>}</td>
      <td className={TD}>{p?.measurement ?? <span>&nbsp;</span>}</td>
      <td className={TD}>
        {p ? (p.benchmark ?? <span className="text-xs text-[var(--muted-foreground)]">{p.comparisonToAvg} than average</span>) : <span>&nbsp;</span>}
      </td>
      <td className={TD}>{p ? <SourceCell p={p} /> : <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(p?.impact) ?? <span>&nbsp;</span>}</td>
    </tr>
  )

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">📂 Performance Against the Criteria</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={`${TH} w-[20%]`}>Criterion (from the table above)</th>
              <th className={`${TH} w-[22%]`}>This product&apos;s measured performance</th>
              <th className={`${TH} w-[22%]`}>Category average / best rival</th>
              <th className={`${TH} w-[22%]`}>Evidence (source + tier)</th>
              <th className={`${TH} w-[14%] text-center`}>Impact</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => row(p, p?.id ?? i))}
            <ExpandableRows moreCount={rest.length} colSpan={5}>
              {rest.map(p => row(p, p.id))}
            </ExpandableRows>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#555] mt-2">
        Tier key: <strong>Tier 1</strong> independent lab tests and certified ratings ·{' '}
        <strong>Tier 2</strong> professional reviewer consensus, third-party-verified manufacturer
        data · <strong>Tier 3</strong> aggregated user reviews, investigative journalism ·{' '}
        <strong>Tier 4</strong> individual testimonials, unverified manufacturer claims.
      </p>
    </section>
  )
}
