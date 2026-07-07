import type { LegalItem } from '../types'
import SectionHeading from './SectionHeading'
import { formatScore, pairBySide, rankByScore, TABLE_TOP_LIMIT } from '../lib/ranking'
import ExpandableRows from './ExpandableRows'

interface LegalSectionProps {
  legal: LegalItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

function LegalCell({ l }: { l: LegalItem | null }) {
  if (!l) return <span>&nbsp;</span>
  return (
    <>
      {l.description}
      {l.jurisdiction && (
        <span className="ml-1 text-xs text-[var(--muted-foreground)]">({l.jurisdiction})</span>
      )}
    </>
  )
}

function LegalPairRow({ s, c }: { s: LegalItem | null; c: LegalItem | null }) {
  return (
    <tr>
      <td className={TD}><LegalCell l={s} /></td>
      <td className={`${TDC} font-mono`}>{formatScore(s?.score) ?? <span>&nbsp;</span>}</td>
      <td className={TD}><LegalCell l={c} /></td>
      <td className={`${TDC} font-mono`}>{formatScore(c?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )
}

export default function LegalSection({ legal }: LegalSectionProps) {
  const supporting = rankByScore(legal.filter(l => l.side === 'supporting'), l => l.score, Infinity).top
  const contradicting = rankByScore(legal.filter(l => l.side === 'contradicting'), l => l.score, Infinity).top
  const pairs = pairBySide(supporting, contradicting)
  const topPairs = pairs.slice(0, TABLE_TOP_LIMIT)
  const restPairs = pairs.slice(TABLE_TOP_LIMIT)

  return (
    <section>
      <SectionHeading
        emoji="&#x2696;&#xFE0F;"
        title="Legal Framework"
        href="/how-it-works"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-[42%]`}>Laws and Frameworks Supporting</th>
              <th className={`${TH} text-center w-[8%]`}>Score</th>
              <th className={`${TH} w-[42%]`}>Laws and Constraints Complicating</th>
              <th className={`${TH} text-center w-[8%]`}>Score</th>
            </tr>
          </thead>
          <tbody>
            {pairs.length > 0 ? (
              <>
                {topPairs.map(([s, c], i) => (
                  <LegalPairRow key={s?.id ?? c?.id ?? i} s={s} c={c} />
                ))}
                <ExpandableRows moreCount={restPairs.length} colSpan={4}>
                  {restPairs.map(([s, c], i) => (
                    <LegalPairRow key={s?.id ?? c?.id ?? i} s={s} c={c} />
                  ))}
                </ExpandableRows>
              </>
            ) : (
              <tr>
                <td className={`${TD} text-[var(--muted-foreground)]`}>
                  <p>1. Local, state, federal laws that support this</p>
                  <p>2. International treaties</p>
                </td>
                <td className={TDC}>&nbsp;</td>
                <td className={`${TD} text-[var(--muted-foreground)]`}>
                  <p>1. Local, state, federal laws that contradict this</p>
                  <p>2. International treaties</p>
                </td>
                <td className={TDC}>&nbsp;</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
