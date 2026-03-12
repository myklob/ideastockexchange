import type { UserProfileItem } from '../types'
import SectionHeading from '@/features/belief-analysis/components/SectionHeading'

interface UserProfilesSectionProps {
  profiles: UserProfileItem[]
}

export default function UserProfilesSection({ profiles }: UserProfilesSectionProps) {
  const ideal = profiles.filter(p => p.side === 'ideal')
  const notIdeal = profiles.filter(p => p.side === 'not_ideal')

  return (
    <div>
      <SectionHeading
        emoji="👥"
        title="Best Fit User Profiles"
        subtitle="No product is best for everyone. Understanding fit helps users self-select rather than arguing about &quot;best&quot; in the abstract."
      />

      {profiles.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">This Product Is Ideal For:</th>
                <th className="text-left px-4 py-3 font-semibold">This Product Is NOT Ideal For:</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.max(ideal.length, notIdeal.length, 1) }).map((_, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-4 py-3 text-green-700">{ideal[i]?.description ?? ''}</td>
                  <td className="px-4 py-3 text-red-700">{notIdeal[i]?.description ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No user profile analysis has been recorded yet.</p>
      )}
    </div>
  )
}
