import Link from 'next/link'
import type { ObjectiveCriteriaItem } from '../types'
import SectionHeading from './SectionHeading'

interface ObjectiveCriteriaSectionProps {
  criteria: ObjectiveCriteriaItem[]
}

export default function ObjectiveCriteriaSection({ criteria }: ObjectiveCriteriaSectionProps) {
  return (
    <section>
      <SectionHeading
        emoji="&#x1F4CF;"
        title="Best Scoring Objective Criteria"
        href="/Objective%20criteria%20scores"
        subtitle="For Measuring the Strength of this Belief"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left w-[45%] font-semibold">Top Objective Criteria</th>
              <th className="px-3 py-2 text-center w-[15%] font-semibold">Independence Score</th>
              <th className="px-3 py-2 text-center w-[15%] font-semibold">
                <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">Linkage Score</Link>
              </th>
              <th className="px-3 py-2 text-center w-[13%] font-semibold">Criteria Type</th>
              <th className="px-3 py-2 text-center w-[12%] font-semibold">Total Score</th>
            </tr>
          </thead>
          <tbody>
            {criteria.length > 0 ? (
              criteria.map(c => (
                <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 text-sm">{c.description}</td>
                  <td className="px-3 py-3 text-center text-sm font-mono">{(c.independenceScore * 100).toFixed(0)}%</td>
                  <td className="px-3 py-3 text-center text-sm font-mono">{(c.linkageScore * 100).toFixed(0)}%</td>
                  <td className="px-3 py-3 text-center text-sm text-[var(--muted-foreground)]">{c.criteriaType || '-'}</td>
                  <td className="px-3 py-3 text-center text-sm font-bold font-mono">{c.totalScore.toFixed(1)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-3 text-sm text-[var(--muted-foreground)] italic" colSpan={5}>
                  No objective criteria defined yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
