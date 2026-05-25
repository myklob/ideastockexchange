import Link from 'next/link'
import type { SimilarBeliefItem } from '../types'
import SectionHeading from './SectionHeading'

interface SimilarBeliefsSectionProps {
  similarTo: SimilarBeliefItem[]
  similarFrom: SimilarBeliefItem[]
  currentBeliefId: number
}

export default function SimilarBeliefsSection({ similarTo, similarFrom, currentBeliefId }: SimilarBeliefsSectionProps) {
  // Deduplicate by relation id — when both A→B and B→A edges exist the same
  // belief would otherwise appear twice.
  const seen = new Set<string | number>()
  const allSimilar = [...similarTo, ...similarFrom].filter(s => {
    if (seen.has(s.id)) return false
    seen.add(s.id)
    return true
  })
  const extreme = allSimilar.filter(s => s.variant === 'extreme')
  const moderate = allSimilar.filter(s => s.variant === 'moderate')

  function getLinkedBelief(item: SimilarBeliefItem) {
    const linked = item.fromBelief.id === currentBeliefId ? item.toBelief : item.fromBelief
    // Guard against self-links (degenerate data where both ends are the current belief).
    return linked.id === currentBeliefId ? null : linked
  }

  return (
    <section>
      <SectionHeading
        emoji="&#x1F504;"
        title="Similar Beliefs"
        href="/algorithms/combine-similar-beliefs"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-center w-1/2 font-semibold">More Extreme Versions</th>
              <th className="px-3 py-2 text-center w-1/2 font-semibold">More Moderate Versions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 align-top text-sm">
                {extreme.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {extreme.map(s => {
                      const linked = getLinkedBelief(s)
                      if (!linked) return null
                      return (
                        <li key={s.id}>
                          <Link href={`/beliefs/${linked.slug}`} className="text-[var(--accent)] hover:underline">
                            {linked.statement}
                          </Link>
                        </li>
                      )
                    })}
                  </ol>
                ) : (
                  <span className="text-[var(--muted-foreground)] italic">None identified yet</span>
                )}
              </td>
              <td className="px-3 py-3 align-top text-sm">
                {moderate.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {moderate.map(s => {
                      const linked = getLinkedBelief(s)
                      if (!linked) return null
                      return (
                        <li key={s.id}>
                          <Link href={`/beliefs/${linked.slug}`} className="text-[var(--accent)] hover:underline">
                            {linked.statement}
                          </Link>
                        </li>
                      )
                    })}
                  </ol>
                ) : (
                  <span className="text-[var(--muted-foreground)] italic">None identified yet</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
