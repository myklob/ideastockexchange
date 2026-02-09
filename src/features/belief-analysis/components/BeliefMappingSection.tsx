import Link from 'next/link'
import type { MappingItem } from '../types'
import SectionHeading from './SectionHeading'

interface BeliefMappingSectionProps {
  upstreamMappings: MappingItem[]
  downstreamMappings: MappingItem[]
}

function MappingTable({ mappings, label }: { mappings: MappingItem[]; label: string }) {
  const supportMappings = mappings.filter(m => m.side === 'support')
  const opposeMappings = mappings.filter(m => m.side === 'oppose')

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 text-center w-1/2 font-semibold">Support</th>
            <th className="px-3 py-2 text-center w-1/2 font-semibold">Oppose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-3 py-3 align-top text-sm">
              {supportMappings.length > 0 ? (
                <ol className="list-decimal list-inside space-y-1">
                  {supportMappings.map(m => {
                    const target = m.direction === 'upstream' ? m.parentBelief : m.childBelief
                    return (
                      <li key={m.id}>
                        <Link href={`/beliefs/${target.slug}`} className="text-[var(--accent)] hover:underline">
                          {target.statement}
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              ) : (
                <span className="text-[var(--muted-foreground)] italic">
                  {label === 'upstream'
                    ? 'Broader principles that, if true, would support this belief'
                    : 'More specific claims that depend on this belief being true'}
                </span>
              )}
            </td>
            <td className="px-3 py-3 align-top text-sm">
              {opposeMappings.length > 0 ? (
                <ol className="list-decimal list-inside space-y-1">
                  {opposeMappings.map(m => {
                    const target = m.direction === 'upstream' ? m.parentBelief : m.childBelief
                    return (
                      <li key={m.id}>
                        <Link href={`/beliefs/${target.slug}`} className="text-[var(--accent)] hover:underline">
                          {target.statement}
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              ) : (
                <span className="text-[var(--muted-foreground)] italic">
                  {label === 'upstream'
                    ? 'Broader principles that, if true, would oppose this belief'
                    : 'More specific claims that depend on this belief being false'}
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default function BeliefMappingSection({ upstreamMappings, downstreamMappings }: BeliefMappingSectionProps) {
  return (
    <section>
      <SectionHeading
        emoji="&#x1F9ED;"
        title="General to Specific Belief Mapping"
        href="/Belief%20Sorting"
      />

      <h3 className="text-base font-bold text-[var(--foreground)] mb-3">Most General (Upstream)</h3>
      <div className="mb-6">
        <MappingTable mappings={upstreamMappings} label="upstream" />
      </div>

      <h3 className="text-base font-bold text-[var(--foreground)] mb-3">More Specific (Downstream)</h3>
      <MappingTable mappings={downstreamMappings} label="downstream" />
    </section>
  )
}
