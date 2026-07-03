import Link from 'next/link'
import type { SimilarBeliefItem } from '../types'
import SectionHeading from './SectionHeading'
import { formatScore, pairBySide, rankByScore, TABLE_TOP_LIMIT } from '../lib/ranking'
import ExpandableRows from './ExpandableRows'

interface SimilarBeliefsSectionProps {
  similarTo: SimilarBeliefItem[]
  similarFrom: SimilarBeliefItem[]
  currentBeliefId: number
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

/** Equivalency 0.0 is the unscored default — render blank per Rule 6. */
function equivalency(item: SimilarBeliefItem | null): number | null {
  if (!item || !item.equivalencyScore) return null
  return item.equivalencyScore
}

export default function SimilarBeliefsSection({ similarTo, similarFrom, currentBeliefId }: SimilarBeliefsSectionProps) {
  const allSimilar = [...similarTo, ...similarFrom]
  const extreme = rankByScore(allSimilar.filter(s => s.variant === 'extreme'), equivalency, Infinity).top
  const moderate = rankByScore(allSimilar.filter(s => s.variant === 'moderate'), equivalency, Infinity).top
  const pairs = pairBySide(extreme, moderate)
  const topPairs = pairs.slice(0, TABLE_TOP_LIMIT)
  const restPairs = pairs.slice(TABLE_TOP_LIMIT)

  function getLinkedBelief(item: SimilarBeliefItem) {
    return item.fromBelief.id === currentBeliefId ? item.toBelief : item.fromBelief
  }

  function SimilarCell({ item }: { item: SimilarBeliefItem | null }) {
    if (!item) return <span>&nbsp;</span>
    const linked = getLinkedBelief(item)
    return (
      <Link href={`/beliefs/${linked.slug}`} className="text-[var(--accent)] hover:underline">
        {linked.statement}
      </Link>
    )
  }

  function SimilarPairRow({ e, m }: { e: SimilarBeliefItem | null; m: SimilarBeliefItem | null }) {
    return (
      <tr>
        <td className={TD}><SimilarCell item={e} /></td>
        <td className={`${TDC} font-mono`}>{formatScore(equivalency(e)) ?? <span>&nbsp;</span>}</td>
        <td className={TD}><SimilarCell item={m} /></td>
        <td className={`${TDC} font-mono`}>{formatScore(equivalency(m)) ?? <span>&nbsp;</span>}</td>
      </tr>
    )
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
              <th className={`${TH} w-[42%]`}>More Extreme Versions</th>
              <th className={`${TH} text-center w-[8%]`}>Score</th>
              <th className={`${TH} w-[42%]`}>More Moderate Versions</th>
              <th className={`${TH} text-center w-[8%]`}>Score</th>
            </tr>
          </thead>
          <tbody>
            {pairs.length > 0 ? (
              <>
                {topPairs.map(([e, m], i) => (
                  <SimilarPairRow key={e?.id ?? m?.id ?? i} e={e} m={m} />
                ))}
                <ExpandableRows moreCount={restPairs.length} colSpan={4}>
                  {restPairs.map(([e, m], i) => (
                    <SimilarPairRow key={e?.id ?? m?.id ?? i} e={e} m={m} />
                  ))}
                </ExpandableRows>
              </>
            ) : (
              <tr>
                <td className={`${TD} text-[var(--muted-foreground)] italic`}>None identified yet</td>
                <td className={TDC}>&nbsp;</td>
                <td className={`${TD} text-[var(--muted-foreground)] italic`}>None identified yet</td>
                <td className={TDC}>&nbsp;</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
