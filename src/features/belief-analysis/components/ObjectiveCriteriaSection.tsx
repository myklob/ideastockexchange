import Link from 'next/link'
import type { ObjectiveCriteriaItem } from '../types'
import SectionHeading from './SectionHeading'

interface ObjectiveCriteriaSectionProps {
  criteria: ObjectiveCriteriaItem[]
}

function scorePct(score: number): string {
  return `${Math.round(score * 100)}%`
}

export default function ObjectiveCriteriaSection({ criteria }: ObjectiveCriteriaSectionProps) {
  return (
    <section>
      <SectionHeading
        emoji="&#x1F9EA;"
        title="Objective Criteria"
        href="/algorithms/objective-criteria"
        subtitle="How would we know if this belief is true? Measurable tests both sides should agree on before the debate starts."
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-semibold w-[40%]">Criterion</th>
              <th className="px-3 py-2 text-left font-semibold w-[30%]">Current Status</th>
              <th className="px-3 py-2 text-left font-semibold w-[30%]">Threshold for Agreement</th>
            </tr>
          </thead>
          <tbody>
            {criteria.length > 0 ? (
              criteria.map(c => (
                <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 align-top">
                    <div className="text-sm">{c.description}</div>
                    {c.totalScore > 0 && (
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">
                        Quality: <span className="font-mono">{scorePct(c.totalScore)}</span>
                        {c.criteriaType && (
                          <span className="ml-2">
                            ·{' '}
                            <Link href="/algorithms/objective-criteria" className="text-[var(--accent)] hover:underline">
                              {c.criteriaType}
                            </Link>
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top text-sm">
                    {c.currentStatus ?? <span className="text-[var(--muted-foreground)] italic">—</span>}
                  </td>
                  <td className="px-3 py-3 align-top text-sm">
                    {c.thresholdForAgreement ?? <span className="text-[var(--muted-foreground)] italic">—</span>}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-3 text-sm text-[var(--muted-foreground)] italic" colSpan={3}>
                  No objective criteria defined yet.{' '}
                  <Link href="/algorithms/objective-criteria" className="text-[var(--accent)] hover:underline">
                    Learn how criteria work.
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
