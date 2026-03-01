import Link from 'next/link'
import type { ObjectiveCriteriaItem } from '../types'
import SectionHeading from './SectionHeading'

interface ObjectiveCriteriaSectionProps {
  criteria: ObjectiveCriteriaItem[]
}

function scoreBadge(score: number) {
  const pct = Math.round(score * 100)
  let color = 'text-red-600'
  if (score >= 0.80) color = 'text-green-700'
  else if (score >= 0.60) color = 'text-blue-700'
  else if (score >= 0.40) color = 'text-orange-600'
  return <span className={`font-mono font-semibold ${color}`}>{pct}%</span>
}

export default function ObjectiveCriteriaSection({ criteria }: ObjectiveCriteriaSectionProps) {
  return (
    <section>
      <SectionHeading
        emoji="&#x1F4CF;"
        title="Best Scoring Objective Criteria"
        href="/algorithms/objective-criteria"
        subtitle="For Measuring the Strength of this Belief"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-semibold">Top Objective Criteria</th>
              <th className="px-3 py-2 text-center font-semibold">
                <abbr title="Does this actually measure what we think it measures?">Validity</abbr>
              </th>
              <th className="px-3 py-2 text-center font-semibold">
                <abbr title="Can different people measure this consistently?">Reliability</abbr>
              </th>
              <th className="px-3 py-2 text-center font-semibold">
                <abbr title="Is the data source neutral / free of conflicts of interest?">Independence</abbr>
              </th>
              <th className="px-3 py-2 text-center font-semibold">
                <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">
                  <abbr title="How strongly does this metric correlate with the ultimate goal?">Linkage</abbr>
                </Link>
              </th>
              <th className="px-3 py-2 text-center font-semibold">Type</th>
              <th className="px-3 py-2 text-center font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {criteria.length > 0 ? (
              criteria.map(c => (
                <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 text-sm">{c.description}</td>
                  <td className="px-3 py-3 text-center text-sm">{scoreBadge(c.validityScore)}</td>
                  <td className="px-3 py-3 text-center text-sm">{scoreBadge(c.reliabilityScore)}</td>
                  <td className="px-3 py-3 text-center text-sm">{scoreBadge(c.independenceScore)}</td>
                  <td className="px-3 py-3 text-center text-sm">{scoreBadge(c.linkageScore)}</td>
                  <td className="px-3 py-3 text-center text-sm text-[var(--muted-foreground)]">{c.criteriaType || '—'}</td>
                  <td className="px-3 py-3 text-center text-sm font-bold font-mono">{(c.totalScore * 100).toFixed(0)}%</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-3 text-sm text-[var(--muted-foreground)] italic" colSpan={7}>
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
