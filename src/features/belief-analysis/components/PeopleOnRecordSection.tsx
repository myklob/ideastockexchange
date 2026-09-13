import type { PersonOnRecordItem } from '../types'
import { pairBySide } from '../lib/ranking'

interface PeopleOnRecordSectionProps {
  people: PersonOnRecordItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'

function PersonCell({ p }: { p: PersonOnRecordItem | null }) {
  if (!p) return <span>&nbsp;</span>
  return (
    <>
      {p.sourceUrl ? (
        <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
          {p.name}
        </a>
      ) : (
        p.name
      )}
      {p.contested && (
        <span className="text-xs text-[#c0392b]">
          {' '}
          — listing contested{p.contestedNote ? `: ${p.contestedNote}` : ''}
        </span>
      )}
    </>
  )
}

/**
 * People on the Record: recorded public positions, preserved for tracing the
 * debate. Who holds a belief never changes its score — author identity is
 * orthogonal to the final score, so these names carry history, not weight.
 * Renders nothing when no positions are on record (empty scaffolding is not
 * analysis).
 */
export default function PeopleOnRecordSection({ people }: PeopleOnRecordSectionProps) {
  if (people.length === 0) return null

  const agreeing = people.filter(p => p.side === 'agree')
  const disagreeing = people.filter(p => p.side === 'disagree')
  const pairs = pairBySide(agreeing, disagreeing)

  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
        <span>&#128483;</span> People on the Record
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        Recorded public positions, preserved for tracing the debate. In the ISE, who holds a belief
        never changes its score: author identity is orthogonal to the final score, so these names
        carry history, not weight. Each listing is itself a debatable claim that the person actually
        holds the position; entries whose accuracy is contested are annotated.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-1/2`}>On record agreeing</th>
              <th className={`${TH} w-1/2`}>On record disagreeing</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map(([a, d], i) => (
              <tr key={a?.id ?? d?.id ?? i}>
                <td className={TD}><PersonCell p={a} /></td>
                <td className={TD}><PersonCell p={d} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
