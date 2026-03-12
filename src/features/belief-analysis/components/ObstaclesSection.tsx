import type { ObstacleItem } from '../types'
import SectionHeading from './SectionHeading'

interface ObstaclesSectionProps {
  obstacles: ObstacleItem[]
}

export default function ObstaclesSection({ obstacles }: ObstaclesSectionProps) {
  const supporterObstacles = obstacles.filter(o => o.side === 'supporter')
  const oppositionObstacles = obstacles.filter(o => o.side === 'opposition')

  return (
    <section>
      <SectionHeading
        emoji="&#x1F6A7;"
        title="Primary Obstacles to Resolution"
        href="/Obstacles%20to%20Resolution"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-red-50">
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Barriers to Supporter Honesty</th>
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Barriers to Opposition Honesty</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 align-top text-sm">
                {supporterObstacles.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {supporterObstacles.map(o => <li key={o.id}>{o.description}</li>)}
                  </ol>
                ) : (
                  <div className="text-[var(--muted-foreground)]">
                    <p>1. What prevents acknowledging costs?</p>
                    <p>2. Incentives for extreme positions?</p>
                  </div>
                )}
              </td>
              <td className="px-3 py-3 align-top text-sm">
                {oppositionObstacles.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {oppositionObstacles.map(o => <li key={o.id}>{o.description}</li>)}
                  </ol>
                ) : (
                  <div className="text-[var(--muted-foreground)]">
                    <p>1. What prevents acknowledging benefits?</p>
                    <p>2. Incentives for extreme positions?</p>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
