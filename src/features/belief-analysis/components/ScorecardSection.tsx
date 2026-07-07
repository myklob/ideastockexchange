import Link from 'next/link'
import type { ArgumentWithBelief, BeliefScores, FalsifiabilityItemRow } from '../types'
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
  /** The full twelve-dimension engine readout. Optional so reuse sites
   *  (product reviews, legacy routes) keep working without it. */
  scores?: BeliefScores
}

/** One row of the twelve-dimension readout. */
interface DimensionRow {
  name: string
  value: number | null
  format: 'ratio' | 'signed' | 'percent'
  href: string | null
  note: string
}

function formatDimension(row: DimensionRow): string {
  if (row.value == null) return ''
  if (row.format === 'signed') return `${row.value >= 0 ? '+' : ''}${row.value.toFixed(1)}`
  if (row.format === 'percent') return `${Math.round(row.value * 100)}%`
  return row.value.toFixed(2)
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
  scores,
}: ScorecardSectionProps) {
  const impact = (a: ArgumentWithBelief) => (a.impactScore ? Math.abs(a.impactScore) : null)
  const bestPro = args.filter(a => a.side === 'agree').sort(byScoreDesc(impact))[0] ?? null
  const bestCon = args.filter(a => a.side === 'disagree').sort(byScoreDesc(impact))[0] ?? null

  const hasArgs = totalPro > 0 || totalCon > 0
  const net = totalPro - totalCon
  const netLabel = hasArgs ? `${net >= 0 ? '+' : ''}${net.toFixed(1)}` : '[pending]'

  const topMover = scoreMover ?? falsifiabilityItems[0]?.description ?? null

  // The twelve score dimensions, straight from the engine (computeBeliefScores).
  // Null values render blank (Rule 6); dimensions with an explainer route link
  // to it, so every number here is a doorway too.
  const dimensions: DimensionRow[] | null = scores
    ? [
        { name: 'Truth (net)', value: hasArgs ? scores.overallScore : null, format: 'signed', href: '/algorithms/truth-scores', note: 'normalized pro-vs-con balance, arguments + evidence' },
        { name: 'Logical validity', value: hasArgs ? scores.logicalValidityScore : null, format: 'ratio', href: '/algorithms/truth-scores', note: 'argument-side share of the truth score' },
        { name: 'Linkage (avg)', value: hasArgs ? scores.avgLinkageScore : null, format: 'ratio', href: '/algorithms/linkage-scores', note: 'mean relevance of the arguments on this page' },
        { name: 'Importance-weighted', value: hasArgs ? scores.importanceWeightedScore : null, format: 'ratio', href: '/algorithms/importance-score', note: 'pro share after weighting by how much each argument matters' },
        { name: 'Evidence (EVS)', value: hasArgs ? scores.aggregateEvidenceScore : null, format: 'ratio', href: '/algorithms/evidence-scores', note: 'supporting share of evidence-verification weight' },
        { name: 'CBA likelihood', value: scores.cbaLikelihoodScore, format: 'ratio', href: '/cba/about', note: 'benefit-vs-cost likelihood balance' },
        { name: 'Objective criteria', value: scores.objectiveCriteriaScore, format: 'ratio', href: '/algorithms/objective-criteria', note: 'pre-committed measurements, scored' },
        { name: 'Confidence stability', value: hasArgs ? scores.stabilityScore : null, format: 'ratio', href: null, note: `how settled the score is under scrutiny (${scores.stabilityStatus})` },
        { name: 'Media truth', value: scores.mediaTruthScore, format: 'ratio', href: null, note: 'average truth score of linked media' },
        { name: 'Media genre', value: scores.mediaGenreScore, format: 'ratio', href: null, note: 'reporting-vs-opinion mix of linked media' },
        { name: 'Uniqueness (avg)', value: hasArgs ? scores.topicOverlapScore : null, format: 'ratio', href: '/algorithms/unique-scores', note: 'how little the arguments restate each other' },
        { name: 'Strength-adjusted', value: hasArgs ? scores.strengthAdjustedScore : null, format: 'ratio', href: '/algorithms/strong-to-weak', note: `truth after the claim-strength penalty (claims ${scores.claimStrength.toFixed(1)})` },
      ]
    : null

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
                <Link href="/algorithms/reason-rank" className="text-[var(--accent)] hover:underline">ReasonRank</Link>{' '}
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
      {dimensions && (
        <details className="mt-3 text-sm border border-gray-300">
          <summary className="cursor-pointer px-3 py-2 bg-[#f0f3f6] font-semibold hover:text-[var(--accent)]">
            The twelve score dimensions (engine readout)
          </summary>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {dimensions.map((d, i) => (
                <tr key={d.name} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="border-t border-gray-300 px-3 py-1.5 w-1/4 font-medium">
                    {d.href ? (
                      <Link href={d.href} className="text-[var(--accent)] hover:underline">{d.name}</Link>
                    ) : (
                      d.name
                    )}
                  </td>
                  <td className="border-t border-gray-300 px-3 py-1.5 w-[12%] text-center font-mono text-xs">
                    {formatDimension(d)}
                  </td>
                  <td className="border-t border-gray-300 px-3 py-1.5 text-xs text-[#555]">{d.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
      <p className="text-sm mt-3 p-2 bg-[#f0f3f6] border border-gray-300">
        <strong>How to read this page:</strong> nothing here is placed by editorial choice. Every row
        in every table is itself a claim, and its Score is the{' '}
        <Link href="/algorithms/reason-rank" className="text-[var(--accent)] hover:underline">ReasonRank</Link>{' '}
        performance of the pro/con sub-debate about that claim, computed recursively down to the
        evidence. Every table sorts by Score, best content first; each table shows its top rows and
        collapses the rest until expanded. Score cells stay blank until real content exists to score.
      </p>
    </section>
  )
}
