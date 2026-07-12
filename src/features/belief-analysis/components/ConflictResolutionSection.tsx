import Link from 'next/link'
import type {
  ValuesAnalysisData,
  InterestsAnalysisData,
  ValueRankingItem,
  InterestEntryItem,
  SharedInterestItem,
  DisputeTypeItem,
  ObstacleItem,
  CompromiseItem,
} from '../types'
import type { ConflictResolutionReadout } from '@/core/scoring/conflict-resolution'
import { byScoreDesc, formatScore, rankByScore, TABLE_TOP_LIMIT } from '../lib/ranking'
import ExpandableRows from './ExpandableRows'

interface ConflictResolutionSectionProps {
  values: ValuesAnalysisData | null
  interests: InterestsAnalysisData | null
  valueRankings: ValueRankingItem[]
  interestEntries: InterestEntryItem[]
  sharedInterests: SharedInterestItem[]
  disputeTypes: DisputeTypeItem[]
  obstacles: ObstacleItem[]
  /** Best Compromise Solutions — canonical position 7e, inside this framework. */
  compromises?: CompromiseItem[]
  /** Deep-dive link to the interests-and-motivation dashboard, when one exists. */
  interestsDashboardHref?: string
  /** The computed pipeline readout (shared interests, primary conflict pair,
   *  value conflicts, compromise candidates). Optional so reuse sites keep
   *  working without it. */
  readout?: ConflictResolutionReadout | null
}

function lines(text: string | null | undefined): React.ReactNode {
  if (!text) return <span>&nbsp;</span>
  return text.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)
}

function rank(n: number | null): string {
  return n == null ? '' : `#${n}`
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

/* ── Shared Values, Different Rankings ──────────────────────────────────── */
function ValueRow({ row, striped }: { row: ValueRankingItem | null; striped: boolean }) {
  return (
    <tr className={striped ? 'bg-gray-50' : ''}>
      <td className={TD}>{row?.value ?? <span className="text-[var(--muted-foreground)] italic">[value]</span>}</td>
      <td className={`${TDC} font-mono`}>{rank(row?.supporterRank ?? null)}</td>
      <td className={`${TDC} font-mono`}>{rank(row?.opponentRank ?? null)}</td>
      <td className={TD}>{lines(row?.whyDiffer)}</td>
      <td className={`${TDC} font-mono`}>{formatScore(row?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )
}

function SharedValuesTable({ rows, whatWouldShift }: { rows: ValueRankingItem[]; whatWouldShift: string | null | undefined }) {
  const { top, rest } = rankByScore(rows, r => r.score)
  const data: Array<ValueRankingItem | null> = top.length > 0 ? top : [null, null, null]
  return (
    <table className="w-full border-collapse border border-gray-300 text-sm mb-2">
      <thead>
        <tr className="bg-gray-100">
          <th className={`${TH} w-[24%]`}>
            Value
          </th>
          <th className={`${TH} text-center w-[10%]`}>Supporter Rank</th>
          <th className={`${TH} text-center w-[10%]`}>Opponent Rank</th>
          <th className={`${TH} w-[48%]`}>Why Rankings Differ on This Issue</th>
          <th className={`${TH} text-center w-[8%]`}>Score</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <ValueRow key={row?.id ?? i} row={row} striped={i % 2 === 1} />
        ))}
        <ExpandableRows moreCount={rest.length} colSpan={5}>
          {rest.map((row, i) => (
            <ValueRow key={row.id} row={row} striped={(top.length + i) % 2 === 1} />
          ))}
        </ExpandableRows>
        <tr className="bg-gray-100">
          <td className={TD} colSpan={5}>
            <strong>What would shift these rankings?</strong>{' '}
            {whatWouldShift ?? <span className="text-[var(--muted-foreground)] italic">What evidence, cost-benefit findings, or likelihood changes would cause either side to re-rank?</span>}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

/* ── Likely Interests of one side ───────────────────────────────────────── */
function InterestRow({ e }: { e: InterestEntryItem | null }) {
  return (
    <tr>
      <td className={TD}>{e?.interest ?? <span>&nbsp;</span>}</td>
      <td className={TDC}>{e?.prevalence ?? <span>&nbsp;</span>}</td>
      <td className={TDC}>{e?.linkageConfidence ?? <span>&nbsp;</span>}</td>
      <td className={TDC}>{e?.validity ?? <span>&nbsp;</span>}</td>
      <td className={TD}>{e?.evidenceBasis ?? <span>&nbsp;</span>}</td>
      <td className={TD}>{e?.connectedValue ?? <span>&nbsp;</span>}</td>
    </tr>
  )
}

function InterestTable({ entries, headerClass }: { entries: InterestEntryItem[]; headerClass: string }) {
  const main = entries.filter(e => !e.pretextual)
  const pretextual = entries.filter(e => e.pretextual)
  const { top, rest } = rankByScore(main, e => e.score)
  const mainRows: Array<InterestEntryItem | null> = top.length > 0 ? top : [null]
  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className={headerClass}>
          <th className={`${TH} w-[30%]`}>
            Interest
          </th>
          <th className={`${TH} text-center w-[10%]`}>Prevalence</th>
          <th className={`${TH} text-center w-[12%]`}>
            <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">Linkage Confidence</Link>
          </th>
          <th className={`${TH} text-center w-[12%]`}>Validity</th>
          <th className={`${TH} w-[18%]`}>Evidence Basis</th>
          <th className={`${TH} w-[18%]`}>Connected Value</th>
        </tr>
      </thead>
      <tbody>
        {mainRows.map((e, i) => (
          <InterestRow key={e?.id ?? `m${i}`} e={e} />
        ))}
        <ExpandableRows moreCount={rest.length} colSpan={6}>
          {rest.map(e => (
            <InterestRow key={e.id} e={e} />
          ))}
        </ExpandableRows>
        {(pretextual.length > 0 ? pretextual : [null]).map((e, i) => (
          <tr key={e?.id ?? `p${i}`} className="bg-gray-50 italic">
            <td className={TD}>{e?.interest ?? <em>Pretextual / Low-validity (if any)</em>}</td>
            <td className={TDC}>{e?.prevalence ?? <span>&nbsp;</span>}</td>
            <td className={TDC}>{e?.linkageConfidence ?? <span>&nbsp;</span>}</td>
            <td className={`${TDC} text-[#c0392b] font-bold`}>{e?.validity ?? '0-20'}</td>
            <td className={TD}>{e?.evidenceBasis ?? <span>&nbsp;</span>}</td>
            <td className={TD}>{e?.connectedValue ?? <span>&nbsp;</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ── Shared Interests + Primary Conflict Pair ───────────────────────────── */
function SharedInterestRow({ row }: { row: SharedInterestItem | null }) {
  return (
    <tr>
      <td className={TD}>{row?.interest ?? <span>&nbsp;</span>}</td>
      <td className={TDC}>{row?.validity ?? <span>&nbsp;</span>}</td>
      <td className={TD}>{lines(row?.compromiseDirection)}</td>
      <td className={`${TDC} font-mono`}>{formatScore(row?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )
}

function SharedInterestsTable({ rows }: { rows: SharedInterestItem[] }) {
  const { top, rest } = rankByScore(rows, r => r.score)
  const data: Array<SharedInterestItem | null> = top.length > 0 ? top : [null]
  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className="bg-green-100">
          <th className={`${TH} w-[36%]`}>Shared Interest</th>
          <th className={`${TH} text-center w-[12%]`}>Validity</th>
          <th className={`${TH} w-[44%]`}>Compromise direction it opens</th>
          <th className={`${TH} text-center w-[8%]`}>Score</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <SharedInterestRow key={row?.id ?? i} row={row} />
        ))}
        <ExpandableRows moreCount={rest.length} colSpan={4}>
          {rest.map(row => (
            <SharedInterestRow key={row.id} row={row} />
          ))}
        </ExpandableRows>
      </tbody>
    </table>
  )
}

function PrimaryConflictPair({ interests }: { interests: InterestsAnalysisData | null }) {
  const sup = interests?.primaryPairSupporter
  const opp = interests?.primaryPairOpponent
  return (
    <>
      <p className="text-sm mb-2">
        <strong>Primary pair:</strong>{' '}
        {sup || opp ? (
          <>{sup ?? '[Supporter interest]'} vs {opp ?? '[Opponent interest]'}</>
        ) : (
          <span className="text-[var(--muted-foreground)] italic">[Supporter interest] vs [Opponent interest]</span>
        )}
      </p>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className={`${TH} w-[26%]`}>Interest in the pair</th>
            <th className={`${TH} text-center w-[18%]`}>Standalone Validity</th>
            <th className={`${TH} text-center w-[18%]`}>Claim strength on THIS issue</th>
            <th className={`${TH} w-[38%]`}>What drives its claim here</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={TD}><strong>{sup ?? '[Supporter interest]'}</strong></td>
            <td className={TDC}>{interests?.primaryPairSupporterValidity ?? <span>&nbsp;</span>}</td>
            <td className={TDC}>{interests?.primaryPairSupporterClaim ?? <span>&nbsp;</span>}</td>
            <td className={TD}>{lines(interests?.primaryPairSupporterDrives)}</td>
          </tr>
          <tr className="bg-gray-50">
            <td className={TD}><strong>{opp ?? '[Opponent interest]'}</strong></td>
            <td className={TDC}>{interests?.primaryPairOpponentValidity ?? <span>&nbsp;</span>}</td>
            <td className={TDC}>{interests?.primaryPairOpponentClaim ?? <span>&nbsp;</span>}</td>
            <td className={TD}>{lines(interests?.primaryPairOpponentDrives)}</td>
          </tr>
        </tbody>
      </table>
    </>
  )
}

/* ── Advertised vs. Actual Motivations ──────────────────────────────────── */
function AdvertisedVsActual({ values }: { values: ValuesAnalysisData | null }) {
  const rowsDef: Array<[string, string | null | undefined, string | null | undefined]> = [
    ['Advertised reason', values?.supportingAdvertised, values?.opposingAdvertised],
    ['Actual driver (if different)', values?.supportingActual, values?.opposingActual],
    ['Evidence for divergence', values?.supportingDivergenceEvidence, values?.opposingDivergenceEvidence],
  ]
  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className={`${TH} w-[25%]`}>&nbsp;</th>
          <th className={`${TH} w-[37%]`}>Supporters</th>
          <th className={`${TH} w-[38%]`}>Opponents</th>
        </tr>
      </thead>
      <tbody>
        {rowsDef.map(([label, s, o]) => (
          <tr key={label}>
            <td className={`${TD} bg-gray-100`}><strong>{label}</strong></td>
            <td className={TD}>{lines(s)}</td>
            <td className={TD}>{lines(o)}</td>
          </tr>
        ))}
        <tr className="bg-gray-50">
          <td className={`${TD} bg-gray-100`}>
            <strong>Divergence Score</strong>{' '}
            <span className="text-[11px] text-[#555] font-normal">
              (performance of the sub-debate that advertised &ne; actual)
            </span>
          </td>
          <td className={`${TDC} font-mono`}>{formatScore(values?.supportingDivergenceScore) ?? <span>&nbsp;</span>}</td>
          <td className={`${TDC} font-mono`}>{formatScore(values?.opposingDivergenceScore) ?? <span>&nbsp;</span>}</td>
        </tr>
      </tbody>
    </table>
  )
}

/* ── Dispute Types ──────────────────────────────────────────────────────── */
function DisputeTypesTable({ rows }: { rows: DisputeTypeItem[] }) {
  const order = ['Empirical', 'Definitional', 'Values']
  // The three canonical types always render; populated types sort by score.
  const typed = order.map(t => ({ type: t, row: rows.find(r => r.disputeType === t) ?? null }))
  typed.sort(byScoreDesc(t => t.row?.score))
  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className={`${TH} w-[18%]`}>Dispute Type</th>
          <th className={`${TH} w-[37%]`}>The Specific Disagreement</th>
          <th className={`${TH} w-[37%]`}>Evidence That Would Move Both Sides</th>
          <th className={`${TH} text-center w-[8%]`}>Score</th>
        </tr>
      </thead>
      <tbody>
        {typed.map(({ type, row }, i) => (
          <tr key={type} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
            <td className={TD}><strong>{type}</strong></td>
            <td className={TD}>{lines(row?.disagreement)}</td>
            <td className={TD}>{lines(row?.evidenceThatMoves)}</td>
            <td className={`${TDC} font-mono`}>{formatScore(row?.score) ?? <span>&nbsp;</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ── Primary Obstacles to Resolution ────────────────────────────────────── */
function ObstaclePairRow({ sup, opp }: { sup: ObstacleItem | null; opp: ObstacleItem | null }) {
  return (
    <tr>
      <td className={TD}>{sup?.description ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(sup?.score) ?? <span>&nbsp;</span>}</td>
      <td className={TD}>{opp?.description ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(opp?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )
}

function ObstaclesTable({ obstacles }: { obstacles: ObstacleItem[] }) {
  const sup = [...obstacles.filter(o => o.side === 'supporter')].sort(byScoreDesc(o => o.score))
  const opp = [...obstacles.filter(o => o.side === 'opposition')].sort(byScoreDesc(o => o.score))
  const n = Math.max(sup.length, opp.length, 1)
  const rows = Array.from({ length: n }, (_, i) => i)
  const top = rows.slice(0, TABLE_TOP_LIMIT)
  const rest = rows.slice(TABLE_TOP_LIMIT)
  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className={`${TH} w-[42%]`}>Obstacles for Supporters</th>
          <th className={`${TH} text-center w-[8%]`}>Score</th>
          <th className={`${TH} w-[42%]`}>Obstacles for Opponents</th>
          <th className={`${TH} text-center w-[8%]`}>Score</th>
        </tr>
      </thead>
      <tbody>
        {top.map(i => (
          <ObstaclePairRow key={i} sup={sup[i] ?? null} opp={opp[i] ?? null} />
        ))}
        <ExpandableRows moreCount={rest.length} colSpan={4}>
          {rest.map(i => (
            <ObstaclePairRow key={i} sup={sup[i] ?? null} opp={opp[i] ?? null} />
          ))}
        </ExpandableRows>
      </tbody>
    </table>
  )
}

/* ── The computed pipeline readout ──────────────────────────────────────── */
function PipelineReadout({ readout }: { readout: ConflictResolutionReadout }) {
  const {
    sharedInterests: shared,
    primaryConflictPair: pair,
    valueConflicts,
    compromiseCandidates,
  } = readout
  const hasAny =
    shared.length > 0 || pair != null || valueConflicts.length > 0 || compromiseCandidates.length > 0

  return (
    <div className="border border-gray-300 bg-gray-50 p-3 text-sm space-y-3">
      <p className="font-semibold">
        Pipeline readout{' '}
        <span className="font-normal text-xs text-[var(--muted-foreground)]">
          — computed from the scored rows below, never hand-authored
        </span>
      </p>
      {!hasAny && (
        <p className="text-[var(--muted-foreground)] italic">
          Appears once this page carries scored interests, value rankings, and
          cost/benefit rows for the pipeline to read.
        </p>
      )}
      {shared.length > 0 && (
        <div>
          <p className="font-medium">Interests both sides actually share</p>
          <ul className="list-disc ml-5">
            {shared.slice(0, TABLE_TOP_LIMIT).map(s => (
              <li key={`${s.supporterId}-${s.opponentId}`}>
                &ldquo;{s.supporterInterest}&rdquo; ↔ &ldquo;{s.opponentInterest}&rdquo;{' '}
                <span className="font-mono text-xs">
                  (similarity {Math.round(s.similarity * 100)}%, paired validity{' '}
                  {s.pairedValidity.toFixed(0)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {pair && (
        <div>
          <p className="font-medium">Primary conflict pair (what actually drives the disagreement)</p>
          <p>
            Supporters: &ldquo;{pair.supporter.interest}&rdquo;{' '}
            <span className="font-mono text-xs">(drive {pair.supporterDrive.toFixed(0)})</span>{' '}
            vs. opponents: &ldquo;{pair.opponent.interest}&rdquo;{' '}
            <span className="font-mono text-xs">(drive {pair.opponentDrive.toFixed(0)})</span>.
            Drive = how well the interest explains the side&apos;s actual behavior, weighted by
            its standalone validity.
          </p>
        </div>
      )}
      {valueConflicts.length > 0 && (
        <div>
          <p className="font-medium">Genuine value conflicts (same values, priced apart)</p>
          <ul className="list-disc ml-5">
            {valueConflicts.slice(0, TABLE_TOP_LIMIT).map(v => (
              <li key={v.id}>
                {v.value}: supporters rank it #{v.supporterRank}, opponents #{v.opponentRank}{' '}
                <span className="font-mono text-xs">(gap {v.gap})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {compromiseCandidates.length > 0 && (
        <div>
          <p className="font-medium">
            Compromise candidates — a small likelihood shift flips a category&apos;s net
          </p>
          <ul className="list-disc ml-5">
            {compromiseCandidates.slice(0, TABLE_TOP_LIMIT).map(c => (
              <li key={c.itemId}>
                In <strong>{c.category}</strong> (net {c.net >= 0 ? '+' : ''}
                {c.net.toFixed(1)}): {c.direction === 'raise' ? 'raising' : 'lowering'} the
                likelihood of &ldquo;{c.claim}&rdquo; by just{' '}
                <span className="font-mono">{(c.requiredShift * 100).toFixed(0)}%</span> flips the
                category. This is a winnable, evidence-resolvable disagreement.
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function ConflictResolutionSection({
  values,
  interests,
  valueRankings,
  interestEntries,
  sharedInterests,
  disputeTypes,
  obstacles,
  compromises = [],
  interestsDashboardHref,
  readout,
}: ConflictResolutionSectionProps) {
  const supporterInterests = interestEntries.filter(e => e.side === 'supporter')
  const opponentInterests = interestEntries.filter(e => e.side === 'opponent')
  const rankedCompromises = rankByScore(compromises, c => c.score)

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
          <span>&#129309;</span>
          Conflict Resolution Framework
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Both sides of most debates share the same values. They disagree about how to{' '}
          <strong>rank</strong> them, and that ranking shifts based on perceived{' '}
          <Link href="/cba/about" className="text-[var(--accent)] hover:underline">costs, benefits</Link>, and{' '}
          <Link href="/cba/about" className="text-[var(--accent)] hover:underline">likelihood of success</Link>.
        </p>
      </div>

      {readout && <PipelineReadout readout={readout} />}

      <div>
        <h3 className="text-base font-semibold mb-1 flex items-center gap-2">
          <span>&#9878;</span> Shared Values, Different Rankings
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] italic mb-2">
          Both sides hold these values. The disagreement is about priority order. The value the two
          sides rank most differently usually is the primary conflict pair scored further below.
        </p>
        <SharedValuesTable rows={valueRankings} whatWouldShift={values?.whatWouldShift} />
      </div>

      <div>
        <h3 className="text-base font-semibold mb-1 flex items-center gap-2">
          <span>&#128161;</span> Likely Interests of Supporters
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] italic mb-2">
          Sorted by estimated prevalence. Linkage Confidence measures how sure we are this is actually
          why they support this belief. Validity measures how legitimate the interest is.
          {interestsDashboardHref && (
            <>
              {' '}For the ranked hypotheses, unstated-interest candidates, and the solutions that
              satisfy both sides&apos; valid interests, see the{' '}
              <Link href={interestsDashboardHref} className="text-[var(--accent)] hover:underline not-italic">
                full interests and motivation analysis
              </Link>.
            </>
          )}
        </p>
        <InterestTable entries={supporterInterests} headerClass="bg-green-100" />
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span>&#128161;</span> Likely Interests of Opponents
        </h3>
        <InterestTable entries={opponentInterests} headerClass="bg-red-100" />
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span>&#128279;</span> Shared and Conflicting Interests
        </h3>
        <h4 className="text-sm font-semibold mb-1">Shared Interests (foundation for compromise)</h4>
        <SharedInterestsTable rows={sharedInterests} />
        <h4 className="text-sm font-semibold mt-4 mb-1 flex items-center gap-2">
          <span>&#9876;</span> Primary Conflict Pair{' '}
          <span className="text-xs text-[#555] font-normal">(the ranking difference that drives this debate)</span>
        </h4>
        <PrimaryConflictPair interests={interests} />
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span>&#129309;</span>
          <Link href="/how-it-works" className="text-[var(--accent)] hover:underline">Best Compromise Solutions</Link>
        </h3>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-[28%]`}>Shared Premise Both Sides Accept</th>
              <th className={`${TH} w-[30%]`}>Proposed Synthesis</th>
              <th className={`${TH} w-[28%]`}>Why This Is Difficult</th>
              <th className={`${TH} text-center w-[14%]`}>Score (interests satisfied)</th>
            </tr>
          </thead>
          <tbody>
            {(rankedCompromises.top.length > 0 ? rankedCompromises.top : [null]).map((c, i) => (
              <tr key={c?.id ?? i}>
                <td className={TD}>{lines(c?.sharedPremise)}</td>
                <td className={TD}>{lines(c?.synthesis ?? c?.description)}</td>
                <td className={TD}>{lines(c?.whyDifficult)}</td>
                <td className={`${TDC} font-mono`}>{formatScore(c?.score) ?? <span>&nbsp;</span>}</td>
              </tr>
            ))}
            <ExpandableRows moreCount={rankedCompromises.rest.length} colSpan={4}>
              {rankedCompromises.rest.map(c => (
                <tr key={c.id}>
                  <td className={TD}>{lines(c.sharedPremise)}</td>
                  <td className={TD}>{lines(c.synthesis ?? c.description)}</td>
                  <td className={TD}>{lines(c.whyDifficult)}</td>
                  <td className={`${TDC} font-mono`}>{formatScore(c.score) ?? <span>&nbsp;</span>}</td>
                </tr>
              ))}
            </ExpandableRows>
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span>&#127917;</span> Advertised vs. Actual Motivations
        </h3>
        <AdvertisedVsActual values={values} />
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span>&#9878;</span> Dispute Types
        </h3>
        <DisputeTypesTable rows={disputeTypes} />
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span>&#128683;</span> Primary Obstacles to Resolution
        </h3>
        <ObstaclesTable obstacles={obstacles} />
      </div>
    </section>
  )
}
