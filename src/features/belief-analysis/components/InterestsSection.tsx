import type {
  InterestsAnalysisData,
  InterestPriorityRankingItem,
  SharedConflictingInterestItem,
  InterestValueLinkItem,
} from '../types'
import SectionHeading from './SectionHeading'

interface InterestsSectionProps {
  interests: InterestsAnalysisData | null
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

function PriorityRankingsTable({ rows }: { rows: InterestPriorityRankingItem[] }) {
  const data: Array<InterestPriorityRankingItem | null> = rows.length > 0
    ? rows
    : [null, null, null]

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 text-left font-semibold w-[22%]">Interest</th>
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
                {row?.interest ?? <span className="text-[var(--muted-foreground)] italic">[interest]</span>}
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

function SharedVsConflictingTable({
  rows,
  fallbackShared,
  fallbackConflicting,
}: {
  rows: SharedConflictingInterestItem[]
  fallbackShared: string | null
  fallbackConflicting: string | null
}) {
  // If there are no structured rows, fall back to the legacy free-text fields
  // so existing data still renders without an empty section.
  const data: Array<SharedConflictingInterestItem | null> = rows.length > 0
    ? rows
    : (fallbackShared || fallbackConflicting
        ? [{
            sharedInterest: fallbackShared,
            conflictingInterest: fallbackConflicting,
            whyConflictExists: null,
          }]
        : [null])

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-blue-50">
            <th className="px-3 py-2 text-left font-semibold w-[30%]">Shared Interests</th>
            <th className="px-3 py-2 text-left font-semibold w-[30%]">Conflicting Interests</th>
            <th className="px-3 py-2 text-left font-semibold w-[40%]">Why the Conflict Exists</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="px-3 py-3 align-top">{renderLines(row?.sharedInterest ?? null)}</td>
              <td className="px-3 py-3 align-top">{renderLines(row?.conflictingInterest ?? null)}</td>
              <td className="px-3 py-3 align-top">{renderLines(row?.whyConflictExists ?? null)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InterestValueLinksTable({ rows }: { rows: InterestValueLinkItem[] }) {
  const data: Array<InterestValueLinkItem | null> = rows.length > 0
    ? rows
    : [null, null]

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 text-left font-semibold w-[20%]">Interest at Stake</th>
            <th className="px-3 py-2 text-left font-semibold w-[20%]">Side</th>
            <th className="px-3 py-2 text-left font-semibold w-[25%]">Value Elevated</th>
            <th className="px-3 py-2 text-left font-semibold w-[25%]">Value Deprioritized</th>
            <th className="px-3 py-2 text-center font-semibold w-[10%]">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="px-3 py-3 align-top">
                {row?.interest ?? <span className="text-[var(--muted-foreground)] italic">[interest]</span>}
              </td>
              <td className="px-3 py-3 align-top capitalize">
                {row ? (row.side === 'supporter' ? 'Supporters' : 'Opponents') : ''}
              </td>
              <td className="px-3 py-3 align-top">{row?.valueElevated ?? ''}</td>
              <td className="px-3 py-3 align-top">{row?.valueDeprioritized ?? ''}</td>
              <td className="px-3 py-3 align-top text-center text-xs font-mono">
                {row?.confidence != null ? `${Math.round(row.confidence * 100)}%` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function InterestsSection({ interests }: InterestsSectionProps) {
  const priorityRankings = interests?.priorityRankings ?? []
  const sharedVsConflicting = interests?.sharedVsConflicting ?? []
  const interestValueLinks = interests?.interestValueLinks ?? []

  return (
    <section>
      <SectionHeading
        emoji="&#x1F4A1;"
        title="Interests and Motivations"
        href="/Interests"
        subtitle="Interests are what people actually need or want. Positions are what they demand. Shared interests are where compromise lives. Conflicting interests are where honesty about trade-offs is required."
      />

      {/* 6a. Interest Priority Rankings */}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-2">Interest Priority Rankings</h3>
        <PriorityRankingsTable rows={priorityRankings} />
      </div>

      {/* 6b. Shared vs. Conflicting Interests with "Why the Conflict Exists" */}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-2">Shared vs. Conflicting Interests</h3>
        <SharedVsConflictingTable
          rows={sharedVsConflicting}
          fallbackShared={interests?.sharedInterests ?? null}
          fallbackConflicting={interests?.conflictingInterests ?? null}
        />
      </div>

      {/* 6c. How Interests Drive Value Rankings */}
      <div>
        <h3 className="text-base font-semibold mb-1">How Interests Drive Value Rankings</h3>
        <p className="text-xs text-[var(--muted-foreground)] italic mb-2">
          When your material interests are at stake, you conveniently deprioritize values
          that would cost you. This table maps the linkage.
        </p>
        <InterestValueLinksTable rows={interestValueLinks} />
      </div>
    </section>
  )
}
