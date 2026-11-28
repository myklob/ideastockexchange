/**
 * Interests and Motivation Dashboard — answers four questions, in order:
 *
 * 1. What are the most likely interests actually driving each side? A ranked
 *    list of competing hypotheses per side, not one guess.
 * 2. Which of those interests explain the real actions — the votes, the
 *    spending, the sacrifices — and not just the press releases? Interests
 *    are hypotheses, behavior is the data; the attribution that best predicts
 *    behavior wins the Linkage Accuracy. Where words and deeds diverge, the
 *    gap is evidence that an unstated interest is driving, and naming that
 *    hidden interest is itself a scored claim requiring evidence, applied
 *    with equal suspicion to both sides.
 * 3. Of the interests that are real, which are valid? Judged by objective
 *    criteria, never by who holds them or how much power they have.
 * 4. The payoff: what solutions satisfy the valid interests of both sides?
 *    The ranked solutions table is the whole point of the page; everything
 *    above it is input.
 *
 * Route: /beliefs/[slug]/interests
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatScore, TABLE_TOP_LIMIT } from '@/features/belief-analysis/lib/ranking'
import {
  RESOLUTION_FLOOR_VALIDITY,
  meetsResolutionFloor,
  rankByLinkageAccuracy,
  resolutionFloor,
  scoreSolution,
} from '@/features/belief-analysis/lib/interests'
import ExpandableRows from '@/features/belief-analysis/components/ExpandableRows'

interface PageProps {
  params: Promise<{ slug: string }>
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

function pct(value: number | null | undefined): string | null {
  if (value == null) return null
  return `${Math.round(value)}%`
}

function lines(text: string | null | undefined): React.ReactNode {
  if (!text) return <span>&nbsp;</span>
  return text.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)
}

interface InterestRow {
  id: number
  interest: string
  prevalence: string | null
  validity: string | null
  prevalenceScore: number | null
  linkageAccuracy: number | null
  validityScore: number | null
}

interface PromotedRow {
  id: number
  interest: string
  score: number | null
}

function InterestTable({ rows, promotedRows, headerClass }: {
  rows: InterestRow[]
  promotedRows: PromotedRow[]
  headerClass: string
}) {
  const top = rows.slice(0, TABLE_TOP_LIMIT)
  const rest = rows.slice(TABLE_TOP_LIMIT)
  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr>
          <th className={`${TH} w-[46%] ${headerClass}`}>Interest (a hypothesis about what drives this side)</th>
          <th className={`${TH} w-[18%] text-center ${headerClass}`}>Prevalence</th>
          <th className={`${TH} w-[18%] text-center ${headerClass}`}>Linkage Accuracy</th>
          <th className={`${TH} w-[18%] text-center ${headerClass}`}>Validity</th>
        </tr>
      </thead>
      <tbody>
        {(top.length > 0 ? top : [null]).map((row, i) => (
          <tr key={row?.id ?? i}>
            <td className={TD}>{row?.interest ?? <span>&nbsp;</span>}</td>
            <td className={`${TDC} font-mono`}>{pct(row?.prevalenceScore) ?? row?.prevalence ?? <span>&nbsp;</span>}</td>
            <td className={`${TDC} font-mono`}>{formatScore(row?.linkageAccuracy) ?? <span>&nbsp;</span>}</td>
            <td className={`${TDC} font-mono`}>{formatScore(row?.validityScore) ?? row?.validity ?? <span>&nbsp;</span>}</td>
          </tr>
        ))}
        <ExpandableRows moreCount={rest.length} colSpan={4}>
          {rest.map(row => (
            <tr key={row.id}>
              <td className={TD}>{row.interest}</td>
              <td className={`${TDC} font-mono`}>{pct(row.prevalenceScore) ?? row.prevalence ?? <span>&nbsp;</span>}</td>
              <td className={`${TDC} font-mono`}>{formatScore(row.linkageAccuracy) ?? <span>&nbsp;</span>}</td>
              <td className={`${TDC} font-mono`}>{formatScore(row.validityScore) ?? row.validity ?? <span>&nbsp;</span>}</td>
            </tr>
          ))}
        </ExpandableRows>
        {promotedRows.map(c => (
          <tr key={`u${c.id}`} className="bg-gray-50 italic">
            <td className={TD}>
              {c.interest}{' '}
              <span className="text-xs text-[#555] not-italic">(unstated — promoted from the candidates table below)</span>
            </td>
            <td className={TDC}>&nbsp;</td>
            <td className={`${TDC} font-mono`}>{formatScore(c.score) ?? <span>&nbsp;</span>}</td>
            <td className={TDC}>&nbsp;</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default async function InterestsDashboardPage({ params }: PageProps) {
  const { slug } = await params
  const belief = await prisma.belief.findUnique({
    where: { slug: decodeURIComponent(slug) },
    include: {
      interestEntries: true,
      interestsAnalysis: true,
      valuesAnalysis: true,
      sharedInterests: { orderBy: [{ validityScore: { sort: 'desc', nulls: 'last' } }, { sortOrder: 'asc' }] },
      unstatedInterestCandidates: {
        orderBy: [{ score: { sort: 'desc', nulls: 'last' } }, { sortOrder: 'asc' }],
      },
      interestSolutions: {
        include: { satisfactions: { include: { interest: true } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!belief) notFound()

  const interests = belief.interestEntries
  const supporters = rankByLinkageAccuracy(interests.filter(i => i.side === 'supporter' && !i.pretextual))
  const opponents = rankByLinkageAccuracy(interests.filter(i => i.side === 'opponent' && !i.pretextual))

  const candidates = belief.unstatedInterestCandidates
  const promoted = candidates.filter(c => c.promoted)

  // The payoff table: rank candidate solutions by how well they satisfy the
  // valid interests of both sides. Computed live from the satisfactions; the
  // stored score is only a fallback for solutions with no mapped interests.
  const solutions = belief.interestSolutions
    .map(s => {
      const breakdown = scoreSolution(
        s.satisfactions.map(sat => ({ satisfaction: sat.satisfaction, interest: sat.interest }))
      )
      const supporterNames = s.satisfactions
        .filter(sat => sat.interest.side === 'supporter' && meetsResolutionFloor(sat.interest.validityScore))
        .map(sat => sat.interest.interest)
      const opponentNames = s.satisfactions
        .filter(sat => sat.interest.side === 'opponent' && meetsResolutionFloor(sat.interest.validityScore))
        .map(sat => sat.interest.interest)
      const rankScore = s.satisfactions.length > 0 ? breakdown.total : (s.score ?? 0)
      return { ...s, breakdown, supporterNames, opponentNames, rankScore }
    })
    .sort((a, b) => b.rankScore - a.rankScore)

  const floor = resolutionFloor(belief.sharedInterests)

  // Conflict Readout: every line is derived from the tables below.
  const topSupporter = supporters[0] ?? null
  const topOpponent = opponents[0] ?? null
  const topCandidate = candidates[0] ?? null
  const bestSolution = solutions.find(s => s.rankScore > 0) ?? null
  const ia = belief.interestsAnalysis
  const va = belief.valuesAnalysis

  const topSolutions = solutions.slice(0, TABLE_TOP_LIMIT)
  const restSolutions = solutions.slice(TABLE_TOP_LIMIT)

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-2 text-sm">
          <Link href="/" className="font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-gray-400">/</span>
          <Link href="/beliefs" className="text-blue-700 hover:underline">Beliefs</Link>
          <span className="text-gray-400">/</span>
          <Link href={`/beliefs/${belief.slug}`} className="text-blue-700 hover:underline truncate max-w-[280px]">
            {belief.statement}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">Interests and Motivation</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]">
        <h1 className="text-2xl font-bold leading-tight mb-4">
          What actually drives each side of &ldquo;{belief.statement}&rdquo; — and which solutions
          satisfy the valid interests of both?
        </h1>

        <div className="bg-[#f7f9fb] border border-[#b0b8c1] border-l-4 border-l-[#2c5282] px-4 py-3 mb-6 text-sm">
          This page answers four questions, in order. <strong>One:</strong> the most likely
          interests driving each side — a ranked list of competing hypotheses, not one guess.{' '}
          <strong>Two:</strong> which interests explain the real actions, not just the press
          releases. Interests are hypotheses, behavior is the data, and the attribution that best
          predicts behavior wins the <strong>Linkage Accuracy</strong>: how well an interest
          explains the group&apos;s votes, spending, sacrifices, and what it tolerates. Talk is
          cheap evidence of motive; costly action is strong evidence. <strong>Three:</strong> of
          the interests that are real, which are valid — judged by objective criteria, never by who
          holds them or how much power they have. <strong>Four, the payoff:</strong> the solutions
          that satisfy the valid interests of both sides. Positions are what people demand;
          interests are why. The last table is the whole point of the page; everything above it is
          input.
        </div>

        {/* ── Conflict Readout (verdict-first, auto-derived) ────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">📋 Conflict Readout</h2>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <tbody>
              <tr>
                <td className={`${TD} bg-[#f0f3f6] w-1/4 font-semibold`}>Most likely driver, supporters</td>
                <td className={TD}>
                  {topSupporter ? (
                    <>
                      {topSupporter.interest}
                      {topSupporter.linkageAccuracy != null && (
                        <span className="text-xs text-[#555]"> · Linkage Accuracy {formatScore(topSupporter.linkageAccuracy)}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-[var(--muted-foreground)] italic">[pending — computed from the ranked hypotheses below]</span>
                  )}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className={`${TD} bg-[#f0f3f6] font-semibold`}>Most likely driver, opponents</td>
                <td className={TD}>
                  {topOpponent ? (
                    <>
                      {topOpponent.interest}
                      {topOpponent.linkageAccuracy != null && (
                        <span className="text-xs text-[#555]"> · Linkage Accuracy {formatScore(topOpponent.linkageAccuracy)}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-[var(--muted-foreground)] italic">[pending]</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className={`${TD} bg-[#f0f3f6] font-semibold`}>Primary conflict pair</td>
                <td className={TD}>
                  {ia?.primaryPairSupporter || ia?.primaryPairOpponent ? (
                    <>{ia?.primaryPairSupporter ?? '[supporter interest]'} vs {ia?.primaryPairOpponent ?? '[opponent interest]'}</>
                  ) : (
                    <span className="text-[var(--muted-foreground)] italic">[pending — see the head-to-head below]</span>
                  )}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className={`${TD} bg-[#f0f3f6] font-semibold`}>Strongest unstated candidate</td>
                <td className={TD}>
                  {topCandidate ? (
                    <>
                      {topCandidate.interest}{' '}
                      <span className="text-xs text-[#555]">
                        ({topCandidate.side}s{topCandidate.score != null && <> · score {formatScore(topCandidate.score)}</>}
                        {topCandidate.promoted && <> · promoted</>})
                      </span>
                    </>
                  ) : (
                    <span className="text-[var(--muted-foreground)] italic">[none yet — hypotheses must earn their place below]</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className={`${TD} bg-[#f0f3f6] font-semibold`}>Best solution so far</td>
                <td className={TD}>
                  {bestSolution ? (
                    <>
                      {bestSolution.solution}{' '}
                      <span className="text-xs text-[#555]">· score {bestSolution.rankScore.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-[var(--muted-foreground)] italic">[pending — ranked in the payoff table below]</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── 1. Most Likely Interests: ranked competing hypotheses ──── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">1. Most Likely Interests, Ranked</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            Multiple interest hypotheses per side, sorted by Linkage Accuracy, so &ldquo;most
            likely interest&rdquo; is a computed position, not an editor&apos;s pick. Prevalence
            estimates what share of the side each interest actually drives. Italic rows are
            unstated interests that earned promotion from the candidates table in section 2.
          </p>
          <h3 className="text-base font-semibold mb-2">Supporters</h3>
          <div className="mb-4">
            <InterestTable
              rows={supporters}
              promotedRows={promoted.filter(c => c.side === 'supporter')}
              headerClass="bg-green-100"
            />
          </div>
          <h3 className="text-base font-semibold mb-2">Opponents</h3>
          <InterestTable
            rows={opponents}
            promotedRows={promoted.filter(c => c.side === 'opponent')}
            headerClass="bg-red-100"
          />
        </section>

        {/* ── 2. Actions over words ──────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">
            2. Which Interests Explain Their Actions, Not Just Their Words?
          </h2>

          <h3 className="text-base font-semibold mb-1">Advertised versus revealed</h3>
          <p className="text-xs text-[var(--muted-foreground)] italic mb-2">
            Where words and deeds diverge, the gap is evidence that an unstated interest is doing
            the driving. A large advertised-versus-revealed gap is the opening evidence for the
            candidates table below.
          </p>
          <table className="w-full border-collapse border border-gray-300 text-sm mb-5">
            <thead>
              <tr>
                <th className={`${TH} w-1/4`}>&nbsp;</th>
                <th className={`${TH} w-[37%]`}>Supporters</th>
                <th className={`${TH} w-[38%]`}>Opponents</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${TD} bg-gray-100 font-semibold`}>Advertised reason</td>
                <td className={TD}>{lines(va?.supportingAdvertised)}</td>
                <td className={TD}>{lines(va?.opposingAdvertised)}</td>
              </tr>
              <tr>
                <td className={`${TD} bg-gray-100 font-semibold`}>Revealed driver (if different)</td>
                <td className={TD}>{lines(va?.supportingActual)}</td>
                <td className={TD}>{lines(va?.opposingActual)}</td>
              </tr>
              <tr>
                <td className={`${TD} bg-gray-100 font-semibold`}>Evidence for the gap</td>
                <td className={TD}>{lines(va?.supportingDivergenceEvidence)}</td>
                <td className={TD}>{lines(va?.opposingDivergenceEvidence)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className={`${TD} bg-gray-100 font-semibold`}>Divergence Score</td>
                <td className={`${TDC} font-mono`}>{formatScore(va?.supportingDivergenceScore) ?? <span>&nbsp;</span>}</td>
                <td className={`${TDC} font-mono`}>{formatScore(va?.opposingDivergenceScore) ?? <span>&nbsp;</span>}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-base font-semibold mb-1">Candidate unstated interests</h3>
          <p className="text-xs text-[var(--muted-foreground)] italic mb-2">
            On the ISE, &ldquo;your real reason is X&rdquo; is only sayable when X out-predicts the
            alternatives. Each hidden-motive hypothesis must name the specific behavior the stated
            interests fail to predict, bring evidence, and take a score — applied with equal
            suspicion to both sides. A candidate that earns its score is promoted into the ranked
            list in section 1.
          </p>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr>
                <th className={`${TH} w-[10%]`}>Side</th>
                <th className={`${TH} w-[22%]`}>Candidate unstated interest</th>
                <th className={`${TH} w-[26%]`}>Behavior it explains that stated interests do not</th>
                <th className={`${TH} w-[24%]`}>Evidence</th>
                <th className={`${TH} w-[8%] text-center`}>Score</th>
                <th className={`${TH} w-[10%] text-center`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(candidates.length > 0 ? candidates : [null]).map((c, i) => (
                <tr key={c?.id ?? i}>
                  <td className={`${TDC} capitalize`}>{c ? `${c.side}s` : <span>&nbsp;</span>}</td>
                  <td className={TD}>{c?.interest ?? <span>&nbsp;</span>}</td>
                  <td className={TD}>{c?.behaviorExplained ?? <span>&nbsp;</span>}</td>
                  <td className={TD}>{c?.evidence ?? <span>&nbsp;</span>}</td>
                  <td className={`${TDC} font-mono`}>{formatScore(c?.score) ?? <span>&nbsp;</span>}</td>
                  <td className={TDC}>
                    {c ? (
                      c.promoted ? <strong className="text-green-700">Promoted</strong> : 'Candidate'
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ── 3. Validity, firewalled ────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">3. Of the Real Interests, Which Are Valid?</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            Validity is judged by objective criteria, never by who holds the interest or how much
            power they have. Standalone Validity (how legitimate the interest is in general) and
            Claim Strength on this issue are different numbers; conflating them is a scoring error.
          </p>
          <h3 className="text-base font-semibold mb-1">
            Primary conflict pair, head to head
          </h3>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr>
                <th className={`${TH} w-[26%]`}>Interest in the pair</th>
                <th className={`${TH} w-[18%] text-center`}>Standalone Validity</th>
                <th className={`${TH} w-[18%] text-center`}>Claim strength on THIS issue</th>
                <th className={`${TH} w-[38%]`}>What drives its claim here</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={TD}><strong>{ia?.primaryPairSupporter ?? <span className="text-[var(--muted-foreground)] italic font-normal">[supporter interest]</span>}</strong></td>
                <td className={`${TDC} font-mono`}>{ia?.primaryPairSupporterValidity ?? <span>&nbsp;</span>}</td>
                <td className={TDC}>{ia?.primaryPairSupporterClaim ?? <span>&nbsp;</span>}</td>
                <td className={TD}>{lines(ia?.primaryPairSupporterDrives)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className={TD}><strong>{ia?.primaryPairOpponent ?? <span className="text-[var(--muted-foreground)] italic font-normal">[opponent interest]</span>}</strong></td>
                <td className={`${TDC} font-mono`}>{ia?.primaryPairOpponentValidity ?? <span>&nbsp;</span>}</td>
                <td className={TDC}>{ia?.primaryPairOpponentClaim ?? <span>&nbsp;</span>}</td>
                <td className={TD}>{lines(ia?.primaryPairOpponentDrives)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── 4. The payoff: solutions ───────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">4. Which Solutions Satisfy the Valid Interests of Both Sides?</h2>

          <h3 className="text-base font-semibold mb-1">The Resolution Floor</h3>
          <p className="text-xs text-[var(--muted-foreground)] italic mb-2">
            Shared interests with Validity of at least {RESOLUTION_FLOOR_VALIDITY} on both sides —
            build solutions on these first. Same threshold the CompromiseEngine ships, so wiki and
            code speak one language.
          </p>
          <table className="w-full border-collapse border border-gray-300 text-sm mb-5">
            <thead>
              <tr>
                <th className={`${TH} w-[40%] bg-green-100`}>Shared interest</th>
                <th className={`${TH} w-[14%] text-center bg-green-100`}>Validity</th>
                <th className={`${TH} w-[46%] bg-green-100`}>Compromise direction it opens</th>
              </tr>
            </thead>
            <tbody>
              {(floor.length > 0 ? floor : [null]).map((s, i) => (
                <tr key={s?.id ?? i}>
                  <td className={TD}>
                    {s?.interest ?? (
                      <span className="text-[var(--muted-foreground)] italic">
                        No shared interests clear the floor yet — score them in the belief page&apos;s Shared Interests table.
                      </span>
                    )}
                  </td>
                  <td className={`${TDC} font-mono`}>{formatScore(s?.validityScore) ?? <span>&nbsp;</span>}</td>
                  <td className={TD}>{lines(s?.compromiseDirection)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="text-base font-semibold mb-1">Candidate solutions, ranked</h3>
          <p className="text-xs text-[var(--muted-foreground)] italic mb-2">
            Ranked by how well each satisfies the valid interests of both sides. Two hard rules: a
            solution earns nothing for satisfying an interest that failed validity, and no interest
            counts extra because its holders are powerful. Lopsided solutions rank below balanced
            ones; a solution that satisfies only one side resolves nothing.
          </p>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr>
                <th className={`${TH} w-[30%]`}>Solution</th>
                <th className={`${TH} w-[24%]`}>Valid supporter interests satisfied</th>
                <th className={`${TH} w-[24%]`}>Valid opponent interests satisfied</th>
                <th className={`${TH} w-[11%] text-center`}>Supporter / Opponent</th>
                <th className={`${TH} w-[11%] text-center`}>Score</th>
              </tr>
            </thead>
            <tbody>
              {(topSolutions.length > 0 ? topSolutions : [null]).map((s, i) => (
                <tr key={s?.id ?? i}>
                  <td className={TD}>
                    {s ? (
                      <>
                        <strong>{s.solution}</strong>
                        {s.description && (
                          <>
                            <br />
                            <span className="text-xs text-[#555]">{s.description}</span>
                          </>
                        )}
                      </>
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </td>
                  <td className={TD}>{s ? (s.supporterNames.join('; ') || <span className="text-[var(--muted-foreground)] italic">none</span>) : <span>&nbsp;</span>}</td>
                  <td className={TD}>{s ? (s.opponentNames.join('; ') || <span className="text-[var(--muted-foreground)] italic">none</span>) : <span>&nbsp;</span>}</td>
                  <td className={`${TDC} font-mono`}>
                    {s && s.satisfactions.length > 0
                      ? `${s.breakdown.supporterScore.toFixed(2)} / ${s.breakdown.opponentScore.toFixed(2)}`
                      : <span>&nbsp;</span>}
                  </td>
                  <td className={`${TDC} font-mono font-bold`}>
                    {s ? (s.satisfactions.length > 0 ? s.rankScore.toFixed(2) : formatScore(s.score) ?? '') : <span>&nbsp;</span>}
                  </td>
                </tr>
              ))}
              <ExpandableRows moreCount={restSolutions.length} colSpan={5}>
                {restSolutions.map(s => (
                  <tr key={s.id}>
                    <td className={TD}><strong>{s.solution}</strong></td>
                    <td className={TD}>{s.supporterNames.join('; ') || <span className="text-[var(--muted-foreground)] italic">none</span>}</td>
                    <td className={TD}>{s.opponentNames.join('; ') || <span className="text-[var(--muted-foreground)] italic">none</span>}</td>
                    <td className={`${TDC} font-mono`}>{`${s.breakdown.supporterScore.toFixed(2)} / ${s.breakdown.opponentScore.toFixed(2)}`}</td>
                    <td className={`${TDC} font-mono font-bold`}>{s.rankScore.toFixed(2)}</td>
                  </tr>
                ))}
              </ExpandableRows>
            </tbody>
          </table>
        </section>

        {/* ── Contribute ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold mb-2">🔬 Contribute</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            <Link href="/contact" className="text-[var(--accent)] hover:underline">Contact me</Link>{' '}
            to add interest hypotheses, unstated-interest candidates with the behavior they explain,
            or candidate solutions.{' '}
            <a
              href="https://github.com/myklob/ideastockexchange"
              className="text-[var(--accent)] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>{' '}
            for the scoring algorithm. Back to the{' '}
            <Link href={`/beliefs/${belief.slug}`} className="text-[var(--accent)] hover:underline">
              belief page
            </Link>.
          </p>
        </section>
      </main>
    </div>
  )
}
