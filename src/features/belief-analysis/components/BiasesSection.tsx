import type { BiasItem } from '../types'
import SectionHeading from './SectionHeading'
import { formatScore, pairBySide, rankByScore, TABLE_TOP_LIMIT } from '../lib/ranking'
import ExpandableRows from './ExpandableRows'

interface BiasesSectionProps {
  biases: BiasItem[]
  /** Column header overrides (e.g. the product template's review-distortion wording). */
  leftHeader?: string
  rightHeader?: string
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

function formatBiasType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function BiasCell({ b }: { b: BiasItem | null }) {
  if (!b) return <span>&nbsp;</span>
  return (
    <>
      <strong>{formatBiasType(b.biasType)}</strong>
      {b.description && <span className="text-[var(--muted-foreground)]"> - {b.description}</span>}
    </>
  )
}

function BiasPairRow({ s, o }: { s: BiasItem | null; o: BiasItem | null }) {
  return (
    <tr>
      <td className={TD}><BiasCell b={s} /></td>
      <td className={`${TDC} font-mono`}>{formatScore(s?.score) ?? <span>&nbsp;</span>}</td>
      <td className={TD}><BiasCell b={o} /></td>
      <td className={`${TDC} font-mono`}>{formatScore(o?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )
}

export default function BiasesSection({
  biases,
  leftHeader = 'Biases Affecting Supporters',
  rightHeader = 'Biases Affecting Opponents',
}: BiasesSectionProps) {
  const supporters = rankByScore(biases.filter(b => b.side === 'supporter'), b => b.score, Infinity).top
  const opponents = rankByScore(biases.filter(b => b.side === 'opponent'), b => b.score, Infinity).top
  const pairs = pairBySide(supporters, opponents)
  const topPairs = pairs.slice(0, TABLE_TOP_LIMIT)
  const restPairs = pairs.slice(TABLE_TOP_LIMIT)

  return (
    <section>
      <SectionHeading
        emoji="&#x1F9E0;"
        title="Biases"
        href="/bias"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-[42%]`}>{leftHeader}</th>
              <th className={`${TH} text-center w-[8%]`}>Score</th>
              <th className={`${TH} w-[42%]`}>{rightHeader}</th>
              <th className={`${TH} text-center w-[8%]`}>Score</th>
            </tr>
          </thead>
          <tbody>
            {pairs.length > 0 ? (
              <>
                {topPairs.map(([s, o], i) => (
                  <BiasPairRow key={s?.id ?? o?.id ?? i} s={s} o={o} />
                ))}
                <ExpandableRows moreCount={restPairs.length} colSpan={4}>
                  {restPairs.map(([s, o], i) => (
                    <BiasPairRow key={s?.id ?? o?.id ?? i} s={s} o={o} />
                  ))}
                </ExpandableRows>
              </>
            ) : (
              <tr>
                <td className={`${TD} text-[var(--muted-foreground)]`}>
                  <p>1. Confirmation bias?</p>
                  <p>2. Motivated reasoning?</p>
                  <p>3. Availability heuristic?</p>
                </td>
                <td className={TDC}>&nbsp;</td>
                <td className={`${TD} text-[var(--muted-foreground)]`}>
                  <p>1. Confirmation bias?</p>
                  <p>2. Motivated reasoning?</p>
                  <p>3. Availability heuristic?</p>
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
