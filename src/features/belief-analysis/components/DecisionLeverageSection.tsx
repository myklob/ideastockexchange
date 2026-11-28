import Link from 'next/link'
import type { BeliefLeverageReadout, LeverageRow } from '../lib/leverage'
import SectionHeading from './SectionHeading'
import ExpandableRows from './ExpandableRows'
import { TABLE_TOP_LIMIT } from '../lib/ranking'
import {
  GAP_LABELS,
  LEVERAGE_CLASSES,
  NEGLIGIBLE_LEVERAGE,
  summarizeLeverage,
} from '@/core/scoring/decision-leverage'

interface DecisionLeverageSectionProps {
  leverage: BeliefLeverageReadout
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

const CLASS_STYLES: Record<string, string> = {
  crux: 'bg-red-50 text-red-800',
  'load-bearing': 'bg-green-50 text-green-800',
  'open-minor': 'bg-yellow-50 text-yellow-800',
  'settled-minor': 'bg-gray-100 text-gray-600',
}

function LeverageRowCells({ row }: { row: LeverageRow }) {
  const meta = LEVERAGE_CLASSES[row.classification]
  return (
    <tr>
      <td className={TD}>
        {row.childSlug ? (
          <Link href={`/beliefs/${row.childSlug}`} className="text-[var(--accent)] hover:underline">
            {row.label}
          </Link>
        ) : (
          row.label
        )}
        <span className="ml-2 text-xs text-[var(--muted-foreground)]">
          {row.side === 'agree' ? 'supports' : 'opposes'}
        </span>
      </td>
      <td className={`${TDC} font-mono font-semibold`}>{row.leverage.toFixed(1)}</td>
      <td className={`${TDC} font-mono text-xs`}>{row.weight.toFixed(2)}</td>
      <td className={`${TDC} font-mono text-xs`}>{row.openRange.toFixed(2)}</td>
      <td className={TD}>
        {row.nextStepHref ? (
          <Link href={row.nextStepHref} className="text-[var(--accent)] hover:underline">
            {GAP_LABELS[row.widestGap]}
          </Link>
        ) : (
          GAP_LABELS[row.widestGap]
        )}
      </td>
      <td className={TDC}>
        <span className={`text-xs px-2 py-0.5 rounded ${CLASS_STYLES[row.classification]}`}>
          {meta.label}
        </span>
      </td>
    </tr>
  )
}

/**
 * Where is this belief's score actually fragile? Every other number on the
 * page says what the score is; this table says which argument is worth the
 * next hour of anyone's attention — the edges that both carry the conclusion
 * and rest on little. Leverage is points of conclusion score still at stake
 * (transmission weight × unresolved range), engine-computed like everything
 * else here.
 */
export default function DecisionLeverageSection({ leverage }: DecisionLeverageSectionProps) {
  if (leverage.edges.length === 0) return null
  if (leverage.totalAtStake < NEGLIGIBLE_LEVERAGE) return null

  const top = leverage.edges.slice(0, TABLE_TOP_LIMIT)
  const rest = leverage.edges.slice(TABLE_TOP_LIMIT)

  return (
    <section>
      <SectionHeading
        emoji="&#x1F3AF;"
        title="Decision Leverage"
        href="/algorithms/decision-leverage"
        subtitle="Which argument is worth settling next. Leverage is the points of conclusion score still at stake on one edge: how much of a change it transmits, times how much about it is still open."
      />

      <p className="text-sm mb-3">{summarizeLeverage(leverage)}</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={TH}>Argument</th>
              <th className={TH}>Leverage</th>
              <th className={TH}>Weight</th>
              <th className={TH}>Open</th>
              <th className={TH}>What would settle it</th>
              <th className={TH}>Status</th>
            </tr>
          </thead>
          <tbody>
            {top.map(row => (
              <LeverageRowCells key={row.id} row={row} />
            ))}
            <ExpandableRows moreCount={rest.length} colSpan={6}>
              {rest.map(row => (
                <LeverageRowCells key={row.id} row={row} />
              ))}
            </ExpandableRows>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--muted-foreground)] mt-2">
        Leverage is an upper bound on movement, not a forecast: it assumes the unresolved part of
        an argument could resolve anywhere in its range. Direction is unknown by construction,
        which is exactly why the edge is worth investigating.{' '}
        {leverage.cruxes.length > 0 && (
          <>
            {LEVERAGE_CLASSES.crux.label}: {LEVERAGE_CLASSES.crux.guidance}
          </>
        )}
      </p>
    </section>
  )
}
