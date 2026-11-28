import type { TradeoffItem } from '../types'
import { formatScore } from '../../belief-analysis/lib/ranking'

interface TradeoffsSectionProps {
  tradeoffs: TradeoffItem[]
  /** How far the advertised optimization differs from the actual one. */
  divergenceNote?: string | null
  /** Score of the sub-debate that advertised differs from actual. */
  divergenceScore?: number | null
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

function cell(items: TradeoffItem[]): React.ReactNode {
  if (items.length === 0) return <span>&nbsp;</span>
  return items.map((t, i) => <span key={t.id}>{i > 0 && <br />}{t.description}</span>)
}

/** Best row score across a category's records, blank when none are scored. */
function rowScore(items: TradeoffItem[]): number | null {
  const scored = items.map(t => t.score).filter((s): s is number => s != null)
  return scored.length > 0 ? Math.max(...scored) : null
}

export default function TradeoffsSection({ tradeoffs, divergenceNote, divergenceScore }: TradeoffsSectionProps) {
  const advertised = tradeoffs.filter(t => t.category === 'advertised')
  const actual = tradeoffs.filter(t => t.category === 'actual')

  const row = (label: string, sub: string, items: TradeoffItem[], striped: boolean) => (
    <tr className={striped ? 'bg-gray-50' : ''}>
      <td className={`${TD} bg-[#f0f3f6]`}>
        <strong>{label}</strong> <span className="text-xs text-[#555]">({sub})</span>
      </td>
      <td className={TD}>{cell(items.filter(t => t.side === 'optimizes'))}</td>
      <td className={TD}>{cell(items.filter(t => t.side === 'sacrifices'))}</td>
      <td className={`${TDC} font-mono`}>{formatScore(rowScore(items)) ?? <span>&nbsp;</span>}</td>
    </tr>
  )

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">⚖️ Design Trade-offs</h2>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th className={`${TH} w-[20%]`}>&nbsp;</th>
            <th className={`${TH} w-[34%]`}>Optimizes for</th>
            <th className={`${TH} w-[34%]`}>Sacrifices</th>
            <th className={`${TH} w-[12%] text-center`}>Score</th>
          </tr>
        </thead>
        <tbody>
          {row('Advertised', 'what the manufacturer says', advertised, false)}
          {row('Actual', 'what the design choices and evidence show', actual, true)}
          <tr>
            <td className={`${TD} bg-[#f0f3f6]`}><strong>Divergence Score</strong></td>
            <td className={TD} colSpan={2}>
              {divergenceNote ?? (
                <span className="text-[var(--muted-foreground)] italic">
                  How far the advertised optimization differs from the actual one; scored by its own sub-debate.
                </span>
              )}
            </td>
            <td className={`${TDC} font-mono`}>{formatScore(divergenceScore) ?? <span>&nbsp;</span>}</td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
