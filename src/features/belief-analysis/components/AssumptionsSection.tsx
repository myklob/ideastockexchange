import type { AssumptionItem } from '../types'
import SectionHeading from './SectionHeading'

interface AssumptionsSectionProps {
  assumptions: AssumptionItem[]
}

function strengthBadge(strength: string): string {
  switch (strength) {
    case 'CRITICAL': return 'bg-red-100 text-red-800'
    case 'STRONG': return 'bg-orange-100 text-orange-800'
    case 'MODERATE': return 'bg-yellow-100 text-yellow-800'
    case 'WEAK': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function AssumptionsSection({ assumptions }: AssumptionsSectionProps) {
  const accept = assumptions.filter(a => a.side === 'accept')
  const reject = assumptions.filter(a => a.side === 'reject')

  return (
    <section>
      <SectionHeading
        emoji="&#x1F4DC;"
        title="Foundational Assumptions"
        href="/Assumptions"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Required to Accept This Belief</th>
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Required to Reject This Belief</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 align-top">
                {accept.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {accept.map(a => (
                      <li key={a.id} className="text-sm">
                        {a.statement}
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${strengthBadge(a.strength)}`}>
                          {a.strength}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <span className="text-[var(--muted-foreground)] italic text-sm">Not yet analyzed</span>
                )}
              </td>
              <td className="px-3 py-3 align-top">
                {reject.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {reject.map(a => (
                      <li key={a.id} className="text-sm">
                        {a.statement}
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${strengthBadge(a.strength)}`}>
                          {a.strength}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <span className="text-[var(--muted-foreground)] italic text-sm">Not yet analyzed</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
