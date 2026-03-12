import Link from 'next/link'
import type { SimilarBeliefItem } from '../types'
import SectionHeading from './SectionHeading'

interface SimilarBeliefsSectionProps {
  similarTo: SimilarBeliefItem[]
  similarFrom: SimilarBeliefItem[]
  currentBeliefId: number
}

export default function SimilarBeliefsSection({ similarTo, similarFrom, currentBeliefId }: SimilarBeliefsSectionProps) {
  const allSimilar = [...similarTo, ...similarFrom]
  const extreme = allSimilar.filter(s => s.variant === 'extreme')
  const moderate = allSimilar.filter(s => s.variant === 'moderate')

  function getLinkedBelief(item: SimilarBeliefItem) {
    return item.fromBelief.id === currentBeliefId ? item.toBelief : item.fromBelief
  }

  return (
    <section>
      <SectionHeading
        emoji="&#x1F504;"
        title="Similar Beliefs"
        href="/combine%20similar%20beliefs"
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
