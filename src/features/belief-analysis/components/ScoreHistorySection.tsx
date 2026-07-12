import type { ScoreEventItem } from '../types'
import SectionHeading from './SectionHeading'
import ExpandableRows from './ExpandableRows'
import { TABLE_TOP_LIMIT } from '../lib/ranking'

interface ScoreHistorySectionProps {
  events: ScoreEventItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

function formatWhen(date: Date): string {
  return new Date(date).toISOString().slice(0, 10)
}

function delta(before: number, after: number): { text: string; className: string } {
  const d = after - before
  const text = `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}`
  return { text, className: d >= 0 ? 'text-green-700' : 'text-red-600' }
}

function EventRow({ event }: { event: ScoreEventItem }) {
  const d = delta(event.scoreBefore, event.scoreAfter)
  return (
    <tr>
      <td className={`${TDC} font-mono text-xs`}>{formatWhen(event.createdAt)}</td>
      <td className={`${TDC} font-mono`}>
        {event.scoreBefore.toFixed(1)} → {event.scoreAfter.toFixed(1)}
      </td>
      <td className={`${TDC} font-mono font-semibold ${d.className}`}>{d.text}</td>
      <td className={`${TD} text-sm text-[var(--muted-foreground)]`}>{event.trigger}</td>
    </tr>
  )
}

/**
 * The accumulation ledger, rendered: every engine-computed movement of this
 * belief's score, with the move that caused it. The visible answer to the
 * clean-slate problem — this debate accumulates instead of restarting.
 * Events are written only by score propagation; nothing here is hand-entered.
 */
export default function ScoreHistorySection({ events }: ScoreHistorySectionProps) {
  if (events.length === 0) return null

  const top = events.slice(0, TABLE_TOP_LIMIT)
  const rest = events.slice(TABLE_TOP_LIMIT)

  return (
    <section>
      <SectionHeading
        emoji="&#x1F4C8;"
        title="Score History"
        subtitle="Every engine-computed movement of this score, latest first, with the move that caused it. Debates here accumulate instead of restarting."
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={TH}>When</th>
              <th className={TH}>Score</th>
              <th className={TH}>Change</th>
              <th className={TH}>What moved it</th>
            </tr>
          </thead>
          <tbody>
            {top.map(event => (
              <EventRow key={event.id} event={event} />
            ))}
            <ExpandableRows moreCount={rest.length} colSpan={4}>
              {rest.map(event => (
                <EventRow key={event.id} event={event} />
              ))}
            </ExpandableRows>
          </tbody>
        </table>
      </div>
    </section>
  )
}
