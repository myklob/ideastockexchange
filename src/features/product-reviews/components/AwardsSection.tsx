import type { AwardItem } from '../types'
import SectionHeading from '@/features/belief-analysis/components/SectionHeading'

interface AwardsSectionProps {
  awards: AwardItem[]
}

export default function AwardsSection({ awards }: AwardsSectionProps) {
  const independent = awards.filter(a => a.side === 'independent')
  const manufacturer = awards.filter(a => a.side === 'manufacturer')

  return (
    <div>
      <SectionHeading
        emoji="🏆"
        title="Awards & Certifications"
        subtitle="Independent recognition carries more weight than manufacturer marketing. Track the difference."
      />

      {awards.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Independent Recognition</th>
                <th className="text-left px-4 py-3 font-semibold">Manufacturer Claims</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.max(independent.length, manufacturer.length, 1) }).map((_, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-4 py-3">
                    {independent[i] && (
                      <>
                        <span className="font-medium">{independent[i].title}</span>
                        {independent[i].details && (
                          <span className="text-gray-600"> — {independent[i].details}</span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {manufacturer[i] && (
                      <>
                        <span className="font-medium">{manufacturer[i].title}</span>
                        {manufacturer[i].details && (
                          <span className="text-gray-600"> — {manufacturer[i].details}</span>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No awards or certifications have been recorded yet.</p>
      )}
    </div>
  )
}
