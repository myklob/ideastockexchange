import Link from 'next/link'
import type { MappingItem } from '../types'
import SectionHeading from './SectionHeading'
import { formatScore, pairBySide, rankByScore, TABLE_TOP_LIMIT } from '../lib/ranking'
import ExpandableRows from './ExpandableRows'

interface BeliefMappingSectionProps {
  upstreamMappings: MappingItem[]
  downstreamMappings: MappingItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

function MappingCell({ m }: { m: MappingItem | null }) {
  if (!m) return <span>&nbsp;</span>
  const target = m.direction === 'upstream' ? m.parentBelief : m.childBelief
  return (
    <Link href={`/beliefs/${target.slug}`} className="text-[var(--accent)] hover:underline">
      {target.statement}
    </Link>
  )
}

function MappingPairRow({ s, o }: { s: MappingItem | null; o: MappingItem | null }) {
  return (
    <tr>
      <td className={TD}><MappingCell m={s} /></td>
      <td className={`${TDC} font-mono`}>{formatScore(s?.score) ?? <span>&nbsp;</span>}</td>
      <td className={TD}><MappingCell m={o} /></td>
      <td className={`${TDC} font-mono`}>{formatScore(o?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )
}

function MappingTable({ mappings, label }: { mappings: MappingItem[]; label: string }) {
  const support = rankByScore(mappings.filter(m => m.side === 'support'), m => m.score, Infinity).top
  const oppose = rankByScore(mappings.filter(m => m.side === 'oppose'), m => m.score, Infinity).top
  const pairs = pairBySide(support, oppose)
  const topPairs = pairs.slice(0, TABLE_TOP_LIMIT)
  const restPairs = pairs.slice(TABLE_TOP_LIMIT)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className={`${TH} w-[42%]`}>Support</th>
            <th className={`${TH} text-center w-[8%]`}>Score</th>
            <th className={`${TH} w-[42%]`}>Oppose</th>
            <th className={`${TH} text-center w-[8%]`}>Score</th>
          </tr>
        </thead>
        <tbody>
          {pairs.length > 0 ? (
            <>
              {topPairs.map(([s, o], i) => (
                <MappingPairRow key={s?.id ?? o?.id ?? i} s={s} o={o} />
              ))}
              <ExpandableRows moreCount={restPairs.length} colSpan={4}>
                {restPairs.map(([s, o], i) => (
                  <MappingPairRow key={s?.id ?? o?.id ?? i} s={s} o={o} />
                ))}
              </ExpandableRows>
            </>
          ) : (
            <tr>
              <td className={`${TD} text-[var(--muted-foreground)] italic`}>
                {label === 'upstream'
                  ? 'Broader principles that, if true, would support this belief'
                  : 'More specific claims that depend on this belief being true'}
              </td>
              <td className={TDC}>&nbsp;</td>
              <td className={`${TD} text-[var(--muted-foreground)] italic`}>
                {label === 'upstream'
                  ? 'Broader principles that, if true, would oppose this belief'
                  : 'More specific claims that depend on this belief being false'}
              </td>
              <td className={TDC}>&nbsp;</td>
            </tr>
          )}
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
        href="/beliefs"
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
