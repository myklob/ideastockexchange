import Link from 'next/link'
import type {
  ValuesAnalysisData,
  InterestsAnalysisData,
  ValueRankingItem,
  InterestEntryItem,
  SharedInterestItem,
  DisputeTypeItem,
  ObstacleItem,
} from '../types'

interface ConflictResolutionSectionProps {
  values: ValuesAnalysisData | null
  interests: InterestsAnalysisData | null
  valueRankings: ValueRankingItem[]
  interestEntries: InterestEntryItem[]
  sharedInterests: SharedInterestItem[]
  disputeTypes: DisputeTypeItem[]
  obstacles: ObstacleItem[]
}

function lines(text: string | null | undefined) {
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
function SharedValuesTable({ rows, whatWouldShift }: { rows: ValueRankingItem[]; whatWouldShift: string | null | undefined }) {
  const data = rows.length > 0 ? rows : [null, null, null]
  return (
    <table className="w-full border-collapse border border-gray-300 text-sm mb-2">
      <thead>
        <tr className="bg-gray-100">
          <th className={`${TH} w-[28%]`}>
            <Link href="/American%20values" className="text-[var(--accent)] hover:underline">Value</Link>
          </th>
          <th className={`${TH} text-center w-[12%]`}>Supporter Rank</th>
          <th className={`${TH} text-center w-[12%]`}>Opponent Rank</th>
          <th className={`${TH} w-[48%]`}>Why Rankings Differ on This Issue</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
            <td className={TD}>{row?.value ?? <span className="text-[var(--muted-foreground)] italic">[value]</span>}</td>
            <td className={`${TDC} font-mono`}>{rank(row?.supporterRank ?? null)}</td>
            <td className={`${TDC} font-mono`}>{rank(row?.opponentRank ?? null)}</td>
            <td className={TD}>{lines(row?.whyDiffer)}</td>
          </tr>
        ))}
        <tr className="bg-gray-100">
          <td className={TD} colSpan={4}>
            <strong>What would shift these rankings?</strong>{' '}
            {whatWouldShift ?? <span className="text-[var(--muted-foreground)] italic">What evidence, cost-benefit findings, or likelihood changes would cause either side to re-rank?</span>}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

/* ── Likely Interests of one side ───────────────────────────────────────── */
function InterestTable({ entries, headerClass }: { entries: InterestEntryItem[]; headerClass: string }) {
  const main = entries.filter(e => !e.pretextual)
  const pretextual = entries.filter(e => e.pretextual)
  const mainRows: Array<InterestEntryItem | null> = main.length > 0 ? main : [null]
  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className={headerClass}>
          <th className={`${TH} w-[30%]`}>
            <Link href="/Interests" className="text-[var(--accent)] hover:underline">Interest</Link>
          </th>
          <th className={`${TH} text-center w-[10%]`}>Prevalence</th>
          <th className={`${TH} text-center w-[12%]`}>
            <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">Linkage Confidence</Link>
          </th>
          <th className={`${TH} text-center w-[12%]`}>Validity</th>
          <th className={`${TH} w-[18%]`}>Evidence Basis</th>
          <th className={`${TH} w-[18%]`}>Connected Value</th>
        </tr>
      </thead>
      <tbody>
        {mainRows.map((e, i) => (
          <tr key={`m${i}`}>
            <td className={TD}>{e?.interest ?? <span>&nbsp;</span>}</td>
            <td className={TDC}>{e?.prevalence ?? <span>&nbsp;</span>}</td>
            <td className={TDC}>{e?.linkageConfidence ?? <span>&nbsp;</span>}</td>
            <td className={TDC}>{e?.validity ?? <span>&nbsp;</span>}</td>
            <td className={TD}>{e?.evidenceBasis ?? <span>&nbsp;</span>}</td>
            <td className={TD}>{e?.connectedValue ?? <span>&nbsp;</span>}</td>
          </tr>
        ))}
        {(pretextual.length > 0 ? pretextual : [null]).map((e, i) => (
          <tr key={`p${i}`} className="bg-gray-50 italic">
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
function SharedInterestsTable({ rows }: { rows: SharedInterestItem[] }) {
  const data: Array<SharedInterestItem | null> = rows.length > 0 ? rows : [null]
  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className="bg-green-100">
          <th className={`${TH} w-[40%]`}>Shared Interest</th>
          <th className={`${TH} text-center w-[12%]`}>Validity</th>
          <th className={`${TH} w-[48%]`}>Compromise direction it opens</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <td className={TD}>{row?.interest ?? <span>&nbsp;</span>}</td>
            <td className={TDC}>{row?.validity ?? <span>&nbsp;</span>}</td>
            <td className={TD}>{lines(row?.compromiseDirection)}</td>
          </tr>
        ))}
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
      </tbody>
    </table>
  )
}

/* ── Dispute Types ──────────────────────────────────────────────────────── */
function DisputeTypesTable({ rows }: { rows: DisputeTypeItem[] }) {
  const order = ['Empirical', 'Definitional', 'Values']
  const byType = (t: string) => rows.find(r => r.disputeType === t)
  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className={`${TH} w-[20%]`}>Dispute Type</th>
          <th className={`${TH} w-[40%]`}>The Specific Disagreement</th>
          <th className={`${TH} w-[40%]`}>Evidence That Would Move Both Sides</th>
        </tr>
      </thead>
      <tbody>
        {order.map((t, i) => {
          const row = byType(t)
          return (
            <tr key={t} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
              <td className={TD}><strong>{t}</strong></td>
              <td className={TD}>{lines(row?.disagreement)}</td>
              <td className={TD}>{lines(row?.evidenceThatMoves)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/* ── Primary Obstacles to Resolution ────────────────────────────────────── */
function ObstaclesTable({ obstacles }: { obstacles: ObstacleItem[] }) {
  const sup = obstacles.filter(o => o.side === 'supporter')
  const opp = obstacles.filter(o => o.side === 'opposition')
  const n = Math.max(sup.length, opp.length, 1)
  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className={`${TH} w-[50%]`}>Obstacles for Supporters</th>
          <th className={`${TH} w-[50%]`}>Obstacles for Opponents</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: n }, (_, i) => (
          <tr key={i}>
            <td className={TD}>{sup[i]?.description ?? <span>&nbsp;</span>}</td>
            <td className={TD}>{opp[i]?.description ?? <span>&nbsp;</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
}: ConflictResolutionSectionProps) {
  const supporterInterests = interestEntries.filter(e => e.side === 'supporter')
  const opponentInterests = interestEntries.filter(e => e.side === 'opponent')

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
          <span>&#129309;</span>
          <Link href="/automate%20conflict%20resolution" className="text-[var(--accent)] hover:underline">Conflict Resolution</Link>{' '}Framework
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Both sides of most debates share the same{' '}
          <Link href="/American%20values" className="text-[var(--accent)] hover:underline">values</Link>. They disagree about how to{' '}
          <strong>rank</strong> them, and that ranking shifts based on perceived{' '}
          <Link href="/cost-benefit%20analysis" className="text-[var(--accent)] hover:underline">costs, benefits</Link>, and{' '}
          <Link href="/Likelihood" className="text-[var(--accent)] hover:underline">likelihood of success</Link>.
        </p>
      </div>

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
