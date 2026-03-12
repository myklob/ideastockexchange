import type { PerformanceItem } from '../types'
import { getEvidenceTierColor, EVIDENCE_TIER_LABELS } from '../types'
import SectionHeading from '@/features/belief-analysis/components/SectionHeading'

interface PerformanceSectionProps {
  performance: PerformanceItem[]
}

export default function PerformanceSection({ performance }: PerformanceSectionProps) {
  return (
    <div>
      <SectionHeading
        emoji="📂"
        title="Product Performance: Evidence Quality Assessment"
        subtitle="How does this specific product perform on the category criteria established above?"
      />

      {performance.length > 0 ? (
        <>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Category Criterion</th>
                  <th className="text-left px-4 py-3 font-semibold">This Product&apos;s Performance</th>
                  <th className="text-left px-4 py-3 font-semibold">Evidence Quality</th>
                  <th className="text-left px-4 py-3 font-semibold">Comparison to Category Average</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((item) => (
                  <tr key={item.id} className="border-t border-gray-200">
                    <td className="px-4 py-3 font-medium">{item.criterion}</td>
                    <td className="px-4 py-3">{item.measurement}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: getEvidenceTierColor(item.evidenceTier) }}
                      >
                        Tier {item.evidenceTier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={
                        item.comparisonToAvg === 'Better' ? 'text-green-600 font-medium' :
                        item.comparisonToAvg === 'Worse' ? 'text-red-600 font-medium' :
                        'text-gray-600'
                      }>
                        {item.comparisonToAvg}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Evidence Tier Definitions:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {Object.entries(EVIDENCE_TIER_LABELS).map(([tier, label]) => (
                <li key={tier}>
                  <span className="font-medium">Tier {tier}:</span> {label}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500 italic">No performance data has been recorded yet.</p>
      )}

      <p className="text-sm text-gray-500 italic mt-4">
        This section evaluates the specific product against the objective criteria established at the top,
        with evidence quality tracked for each measurement.
      </p>
    </div>
  )
}
