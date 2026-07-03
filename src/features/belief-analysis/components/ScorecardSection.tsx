import Link from 'next/link'
import type { ArgumentWithBelief, FalsifiabilityItemRow } from '../types'
import { byScoreDesc } from '../lib/ranking'

interface ScorecardSectionProps {
  arguments: ArgumentWithBelief[]
  totalPro: number
  totalCon: number
  /** One-sentence verdict scoped to what the argument tree actually supports. */
  bottomLine: string | null
  /** The single piece of evidence that would most change the verdict. */
  scoreMover: string | null
  /** Fallback for scoreMover: the top-ranked falsifiability score-movers. */
  falsifiabilityItems: FalsifiabilityItemRow[]
}

const TD = 'border border-gray-300 px-3 py-2 align-top'
const LABEL = `${TD} bg-[#f0f3f6] w-1/4 font-semibold`

function ArgumentLink({ arg }: { arg: ArgumentWithBelief | null }) {
  if (!arg) return <span className="text-[var(--muted-foreground)] italic">[pending]</span>
  return (
    <Link href={`/beliefs/${arg.belief.slug}`} className="text-[var(--accent)] hover:underline">
      {arg.claim ?? arg.belief.statement}
    </Link>
  )
}

/**
 * The Scorecard readout at the top of the page: the computed Net Belief Score
 * and the single highest-scoring row from each side of the argument tree.
 * Everything here is derived from scored content below — it is a readout of
 * the tables, not a prose summary (Rule 2 still applies to prose).
 */
export default function ScorecardSection({
  arguments: args,
  totalPro,
  totalCon,
  bottomLine,
  scoreMover,
  falsifiabilityItems,
}: ScorecardSectionProps) {
  const impact = (a: ArgumentWithBelief) => (a.impactScore ? Math.abs(a.impactScore) : null)
  const bestPro = args.filter(a => a.side === 'agree').sort(byScoreDesc(impact))[0] ?? null
  const bestCon = args.filter(a => a.side === 'disagree').sort(byScoreDesc(impact))[0] ?? null

  const hasArgs = totalPro > 0 || totalCon > 0
  const net = totalPro - totalCon
  const netLabel = hasArgs ? `${net >= 0 ? '+' : ''}${net.toFixed(1)}` : '[pending]'

  const topMover = scoreMover ?? falsifiabilityItems[0]?.description ?? null

  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
        <span>&#128203;</span> Scorecard
      </h2>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <tbody>
          <tr>
            <td className={LABEL}>Net Belief Score</td>
            <td className={TD}>
              <strong>{netLabel}</strong>
              {hasArgs && (
                <> · Pro +{totalPro.toFixed(1)} vs. Con -{totalCon.toFixed(1)}</>
              )}{' '}
              <span className="text-xs text-[#555]">
                · scores are the{' '}
                <Link href="/ReasonRank" className="text-[var(--accent)] hover:underline">ReasonRank</Link>{' '}
                performance of each row&apos;s pro/con sub-debate
              </span>
            </td>
          </tr>
          <tr className="bg-gray-50">
            <td className={LABEL}>Bottom line</td>
            <td className={TD}>
              {bottomLine ?? (
                <span className="text-[var(--muted-foreground)] italic">
                  One-sentence verdict, scoped to what the argument tree below actually supports.
                </span>
              )}
            </td>
          </tr>
          <tr>
            <td className={LABEL}>Strongest pro / con</td>
            <td className={TD}>
              <ArgumentLink arg={bestPro} /> · <ArgumentLink arg={bestCon} />
            </td>
          </tr>
          <tr className="bg-gray-50">
            <td className={LABEL}>What would move this score most</td>
            <td className={TD}>
              {topMover ?? (
                <span className="text-[var(--muted-foreground)] italic">
                  The single piece of evidence that would most change the verdict; see the Falsifiability Test below.
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="text-sm mt-3 p-2 bg-[#f0f3f6] border border-gray-300">
        <strong>How to read this page:</strong> nothing here is placed by editorial choice. Every row
        in every table is itself a claim, and its Score is the{' '}
        <Link href="/ReasonRank" className="text-[var(--accent)] hover:underline">ReasonRank</Link>{' '}
        performance of the pro/con sub-debate about that claim, computed recursively down to the
        evidence. Every table sorts by Score, best content first; each table shows its top rows and
        collapses the rest until expanded. Score cells stay blank until real content exists to score.
      </p>
    </section>
  )
}
