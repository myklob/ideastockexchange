import Link from 'next/link'
import type {
  ValuesAnalysisData,
  ValuePriorityRankingItem,
  SharedValuePriorityItem,
  CrossContextConsistencyItem,
} from '../types'
import SectionHeading from './SectionHeading'

interface ValuesSectionProps {
  values: ValuesAnalysisData | null
}

function renderLines(text: string | null): React.ReactNode {
  if (!text) return <span className="text-[var(--muted-foreground)] italic text-sm">Not yet analyzed</span>
  return text.split('\n').map((line, i) => (
    <span key={i}>{line}<br /></span>
  ))
}

function rankCell(rank: number | null | undefined): string {
  if (rank == null) return '—'
  return `#${rank}`
}

function gapCell(a: number | null | undefined, b: number | null | undefined): string {
  if (a == null || b == null) return '—'
  return String(Math.abs(a - b))
}

function pctCell(supportersPct: number | null | undefined, opponentsPct: number | null | undefined): string {
  if (supportersPct == null && opponentsPct == null) return ''
  const s = supportersPct == null ? '—' : `${Math.round(supportersPct)}%`
  const o = opponentsPct == null ? '—' : `${Math.round(opponentsPct)}%`
  return `S ${s} / O ${o}`
}

function PriorityRankingsTable({ rows }: { rows: ValuePriorityRankingItem[] }) {
  const data: Array<ValuePriorityRankingItem | null> = rows.length > 0
    ? rows
    : [null, null, null]

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 text-left font-semibold w-[22%]">Value</th>
            <th className="px-3 py-2 text-center font-semibold w-[13%]">Supporters&apos; Rank</th>
            <th className="px-3 py-2 text-center font-semibold w-[13%]">Opponents&apos; Rank</th>
            <th className="px-3 py-2 text-center font-semibold w-[10%]">Gap</th>
            <th className="px-3 py-2 text-center font-semibold w-[14%]">Self-Reported %</th>
            <th className="px-3 py-2 text-center font-semibold w-[14%]">Confidence</th>
            <th className="px-3 py-2 text-left font-semibold w-[14%]">Source</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="px-3 py-3 align-top">
                {row?.value ?? <span className="text-[var(--muted-foreground)] italic">[value]</span>}
              </td>
              <td className="px-3 py-3 align-top text-center font-mono">{rankCell(row?.supportersRank)}</td>
              <td className="px-3 py-3 align-top text-center font-mono">{rankCell(row?.opponentsRank)}</td>
              <td className="px-3 py-3 align-top text-center font-mono">
                {gapCell(row?.supportersRank, row?.opponentsRank)}
              </td>
              <td className="px-3 py-3 align-top text-center text-xs font-mono">
                {row ? pctCell(row.selfReportedSupportersPct, row.selfReportedOpponentsPct) : ''}
              </td>
              <td className="px-3 py-3 align-top text-center text-xs font-mono">
                {row?.confidence != null ? `${Math.round(row.confidence * 100)}%` : ''}
              </td>
              <td className="px-3 py-3 align-top text-xs text-[var(--muted-foreground)]">
                {row?.source ?? ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SharedValuesTable({ rows }: { rows: SharedValuePriorityItem[] }) {
  const data: Array<SharedValuePriorityItem | null> = rows.length > 0 ? rows : [null, null]

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 text-left font-semibold w-[20%]">Shared Value</th>
            <th className="px-3 py-2 text-left font-semibold w-[40%]">Supporters&apos; Priority Context</th>
            <th className="px-3 py-2 text-left font-semibold w-[40%]">Opponents&apos; Priority Context</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="px-3 py-3 align-top">
                {row?.value ?? <span className="text-[var(--muted-foreground)] italic">[value]</span>}
              </td>
              <td className="px-3 py-3 align-top">{renderLines(row?.supportersContext ?? null)}</td>
              <td className="px-3 py-3 align-top">{renderLines(row?.opponentsContext ?? null)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CrossContextTable({ rows }: { rows: CrossContextConsistencyItem[] }) {
  const data: Array<CrossContextConsistencyItem | null> = rows.length > 0 ? rows : [null, null]

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 text-left font-semibold w-[20%]">Value Deprioritized Here</th>
            <th className="px-3 py-2 text-left font-semibold w-[15%]">Deprioritized By</th>
            <th className="px-3 py-2 text-left font-semibold w-[30%]">Other Topic Where They Champion It</th>
            <th className="px-3 py-2 text-left font-semibold w-[35%]">What This Suggests</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="px-3 py-3 align-top">
                {row?.value ?? <span className="text-[var(--muted-foreground)] italic">[value]</span>}
              </td>
              <td className="px-3 py-3 align-top capitalize">
                {row ? (row.deprioritizedBy === 'supporter' ? 'Supporters' : 'Opponents') : ''}
              </td>
              <td className="px-3 py-3 align-top">
                {row?.otherTopicSlug && row.otherTopic ? (
                  <Link href={`/beliefs/${row.otherTopicSlug}`} className="text-[var(--accent)] hover:underline">
                    {row.otherTopic}
                  </Link>
                ) : (
                  row?.otherTopic ?? ''
                )}
              </td>
              <td className="px-3 py-3 align-top">{renderLines(row?.whatThisSuggests ?? null)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ValuesSection({ values }: ValuesSectionProps) {
  const priorityRankings = values?.priorityRankings ?? []
  const sharedPriorities = values?.sharedPriorities ?? []
  const crossContextChecks = values?.crossContextChecks ?? []

  return (
    <section>
      <SectionHeading
        emoji="&#x2696;&#xFE0F;"
        title="Values Conflict Analysis"
        href="/American%20values"
        subtitle="Most disagreements are not value conflicts. They are priority conflicts. Both sides usually hold the same values but rank them differently on this topic."
      />

      {/* 5a. Value Priority Rankings */}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-1">Value Priority Rankings on This Topic</h3>
        <p className="text-xs text-[var(--muted-foreground)] italic mb-2">
          What values does each side prioritize when defending their position? The gap reveals
          whether this is a genuine value conflict or a priority conflict driven by interests.
        </p>
        <PriorityRankingsTable rows={priorityRankings} />
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          <strong>Column key:</strong> Rank = priority assigned on THIS topic (1 = highest).
          Gap = absolute ranking difference. Self-Reported % = share of each side that
          names this value as motivating. Source = observer-attributed or self-reported.
        </p>
      </div>

      {/* 5b. Shared Values, Different Priorities */}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-1">Shared Values, Different Priorities</h3>
        <p className="text-xs text-[var(--muted-foreground)] italic mb-2">
          Values both sides hold but rank differently on this topic. The question is not
          &ldquo;do they share this value?&rdquo; but &ldquo;why does the ranking shift here?&rdquo;
        </p>
        <SharedValuesTable rows={sharedPriorities} />
      </div>

      {/* 5c. Cross-Context Consistency Check */}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-1">Cross-Context Consistency Check</h3>
        <p className="text-xs text-[var(--muted-foreground)] italic mb-2">
          Where does each side defend the values they deprioritize on THIS topic? The
          hypocrisy detector, applied symmetrically.
        </p>
        <CrossContextTable rows={crossContextChecks} />
      </div>

      {/* 5d. Advertised vs. Actual Motivation (symmetric Supporters/Opponents) */}
      <div>
        <h3 className="text-base font-semibold mb-1">Advertised vs. Actual Motivation</h3>
        <p className="text-xs text-[var(--muted-foreground)] italic mb-2">
          What each side claims drives them vs. what the evidence suggests actually drives them.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-center w-1/2 font-semibold">Supporters</th>
                <th className="px-3 py-2 text-center w-1/2 font-semibold">Opponents</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="px-3 py-3 align-top text-sm">
                  <strong>Advertised:</strong><br />
                  {renderLines(values?.supportingAdvertised ?? null)}
                </td>
                <td className="px-3 py-3 align-top text-sm">
                  <strong>Advertised:</strong><br />
                  {renderLines(values?.opposingAdvertised ?? null)}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 align-top text-sm">
                  <strong>Actual (evidence-based):</strong><br />
                  {renderLines(values?.supportingActual ?? null)}
                </td>
                <td className="px-3 py-3 align-top text-sm">
                  <strong>Actual (evidence-based):</strong><br />
                  {renderLines(values?.opposingActual ?? null)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
