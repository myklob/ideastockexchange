import Link from 'next/link'
import type { ObjectiveCriteriaItem } from '../types'

interface ObjectiveCriteriaSectionProps {
  criteria: ObjectiveCriteriaItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

export default function ObjectiveCriteriaSection({ criteria }: ObjectiveCriteriaSectionProps) {
  const rows: Array<ObjectiveCriteriaItem | null> = criteria.length > 0 ? criteria : [null]

  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
        <span>&#127919;</span>
        <Link href="/Objective%20criteria%20scores" className="text-[var(--accent)] hover:underline">Objective Criteria</Link>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-[35%]`}>Criterion</th>
              <th className={`${TH} w-[30%]`}>How to Measure</th>
              <th className={`${TH} text-center w-[15%]`}>Current Status</th>
              <th className={`${TH} text-center w-[20%]`}>Target</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={c?.id ?? i}>
                <td className={TD}>{c?.description ?? <span>&nbsp;</span>}</td>
                <td className={TD}>{c?.howToMeasure ?? c?.thresholdForAgreement ?? <span>&nbsp;</span>}</td>
                <td className={TDC}>{c?.currentStatus ?? <span>&nbsp;</span>}</td>
                <td className={TDC}>{c?.target ?? <span>&nbsp;</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
