import Link from 'next/link'
import type { ObjectiveCriteriaItem } from '../types'
import { formatScore, rankByScore } from '../lib/ranking'
import ExpandableRows from './ExpandableRows'

interface ObjectiveCriteriaSectionProps {
  criteria: ObjectiveCriteriaItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

/** totalScore 0 is the unscored default — render blank per Rule 6. */
function criterionScore(c: ObjectiveCriteriaItem | null): number | null {
  if (!c || !c.totalScore) return null
  return c.totalScore
}

function CriterionRow({ c }: { c: ObjectiveCriteriaItem | null }) {
  return (
    <tr>
      <td className={TD}>{c?.description ?? <span>&nbsp;</span>}</td>
      <td className={TD}>{c?.howToMeasure ?? c?.thresholdForAgreement ?? <span>&nbsp;</span>}</td>
      <td className={TDC}>{c?.strengthenReading ?? c?.target ?? <span>&nbsp;</span>}</td>
      <td className={TDC}>{c?.weakenReading ?? <span>&nbsp;</span>}</td>
      <td className={TDC}>{c?.currentStatus ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(criterionScore(c)) ?? <span>&nbsp;</span>}</td>
    </tr>
  )
}

export default function ObjectiveCriteriaSection({ criteria }: ObjectiveCriteriaSectionProps) {
  const { top, rest } = rankByScore(criteria, criterionScore)
  const rows: Array<ObjectiveCriteriaItem | null> = top.length > 0 ? top : [null]

  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
        <span>&#127919;</span>
        <Link href="/Objective%20criteria%20scores" className="text-[var(--accent)] hover:underline">Objective Criteria</Link>
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        These are the measurements that would settle this debate if both sides committed to them in
        advance. The best criteria are specific enough that supporters and opponents would predict{' '}
        <em>different</em> readings — a criterion both sides expect to come out the same way tests
        nothing.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100 text-xs">
              <th className={`${TH} w-[20%]`}>Criterion</th>
              <th className={`${TH} w-[24%]`}>How to Measure</th>
              <th className={`${TH} text-center w-[17%]`}>Reading That Would Strengthen</th>
              <th className={`${TH} text-center w-[17%]`}>Reading That Would Weaken</th>
              <th className={`${TH} text-center w-[14%]`}>Latest Reading</th>
              <th className={`${TH} text-center w-[8%]`}>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <CriterionRow key={c?.id ?? i} c={c} />
            ))}
            <ExpandableRows moreCount={rest.length} colSpan={6}>
              {rest.map(c => (
                <CriterionRow key={c.id} c={c} />
              ))}
            </ExpandableRows>
          </tbody>
        </table>
      </div>
    </section>
  )
}
