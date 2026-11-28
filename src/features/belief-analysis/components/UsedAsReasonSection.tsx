import Link from 'next/link'
import type { UsedInArgumentItem } from '../types'
import SectionHeading from './SectionHeading'
import ExpandableRows from './ExpandableRows'
import { formatScore, rankByScore } from '../lib/ranking'

interface UsedAsReasonSectionProps {
  usedIn: UsedInArgumentItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

/** Impact 0 is the unscored default — rank by magnitude, blanks last (Rule 6/8). */
function impactMagnitude(item: UsedInArgumentItem): number | null {
  if (!item.impactScore) return null
  return Math.abs(item.impactScore)
}

function UsageRow({ item }: { item: UsedInArgumentItem }) {
  return (
    <tr>
      <td className={TD}>
        <Link href={`/beliefs/${item.parentBelief.slug}`} className="text-[var(--accent)] hover:underline">
          {item.parentBelief.statement}
        </Link>
      </td>
      <td className={TDC}>
        {item.side === 'agree' ? (
          <span className="text-green-700">supports</span>
        ) : (
          <span className="text-red-600">opposes</span>
        )}
      </td>
      <td className={`${TDC} font-mono`}>
        {item.impactScore ? (
          <span className={item.impactScore >= 0 ? 'text-green-700' : 'text-red-600'}>
            {item.impactScore >= 0 ? '+' : ''}
            {formatScore(item.impactScore)}
          </span>
        ) : (
          <span>&nbsp;</span>
        )}
      </td>
    </tr>
  )
}

/**
 * What-links-here for beliefs: every parent debate where this belief serves as
 * a reason, with side and engine-computed impact. One argument, one home,
 * every use visible — the answer to scattered, redundant arguments.
 */
export default function UsedAsReasonSection({ usedIn }: UsedAsReasonSectionProps) {
  if (usedIn.length === 0) return null

  const { top, rest } = rankByScore(usedIn, impactMagnitude)

  return (
    <section>
      <SectionHeading
        emoji="&#x1F517;"
        title="Where This Belief Is Used"
        subtitle="Every debate that uses this belief as a reason. An argument has one home; every use of it is visible from that home."
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={TH}>Used as a reason in</th>
              <th className={TH}>Side</th>
              <th className={TH}>Impact</th>
            </tr>
          </thead>
          <tbody>
            {top.map(item => (
              <UsageRow key={item.id} item={item} />
            ))}
            <ExpandableRows moreCount={rest.length} colSpan={3}>
              {rest.map(item => (
                <UsageRow key={item.id} item={item} />
              ))}
            </ExpandableRows>
          </tbody>
        </table>
      </div>
    </section>
  )
}
