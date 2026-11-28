import type { ProductReviewWithRelations } from '../types'
import type { ArgumentWithBelief } from '../../belief-analysis/types'
import { byScoreDesc } from '../../belief-analysis/lib/ranking'

interface ProductScorecardSectionProps {
  review: ProductReviewWithRelations
}

const TD = 'border border-gray-300 px-3 py-2 align-top'
const LABEL = `${TD} bg-[#f0f3f6] w-[30%] font-semibold`

function argLabel(arg: ArgumentWithBelief | null): React.ReactNode {
  if (!arg) return <span className="text-[var(--muted-foreground)] italic">[pending]</span>
  const impact = arg.impactScore ? ` · Impact ${Math.abs(arg.impactScore).toFixed(1)}` : ''
  return (
    <>
      {arg.claim ?? arg.belief.statement}
      {impact && <span className="text-xs text-[#555]">{impact}</span>}
    </>
  )
}

/**
 * The Scorecard. Every cell except Bottom line and What would change this
 * verdict is auto-derived from the tables below — never hand-picked.
 */
export default function ProductScorecardSection({ review }: ProductScorecardSectionProps) {
  const args = review.belief?.arguments ?? []
  const impact = (a: ArgumentWithBelief) => (a.impactScore ? Math.abs(a.impactScore) : null)
  const bestPro = args.filter(a => a.side === 'agree').sort(byScoreDesc(impact))[0] ?? null
  const bestCon = args.filter(a => a.side === 'disagree').sort(byScoreDesc(impact))[0] ?? null

  const ideal = review.userProfiles.filter(p => p.side === 'ideal')[0] ?? null
  const notIdeal = review.userProfiles.filter(p => p.side === 'not_ideal')[0] ?? null

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">📊 Scorecard</h2>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <tbody>
          <tr>
            <td className={LABEL}>Bottom line</td>
            <td className={TD}>
              {review.bottomLine ?? (
                <span className="text-[var(--muted-foreground)] italic">
                  One-sentence verdict scoped to the use case in the title.
                </span>
              )}
            </td>
          </tr>
          <tr className="bg-gray-50">
            <td className={LABEL}>Strongest reason to agree</td>
            <td className={TD}>
              {argLabel(bestPro)}{' '}
              <span className="text-[11px] text-[#999]">(auto-derived: top pro row in Argument Trees)</span>
            </td>
          </tr>
          <tr>
            <td className={LABEL}>Strongest reason to disagree</td>
            <td className={TD}>
              {argLabel(bestCon)}{' '}
              <span className="text-[11px] text-[#999]">(auto-derived: top con row in Argument Trees)</span>
            </td>
          </tr>
          <tr className="bg-gray-50">
            <td className={LABEL}>Best for</td>
            <td className={TD}>
              {ideal?.description ?? <span className="text-[var(--muted-foreground)] italic">[pending]</span>}{' '}
              <span className="text-[11px] text-[#999]">(auto-derived: top row of Who Should Buy This)</span>
            </td>
          </tr>
          <tr>
            <td className={LABEL}>Not for</td>
            <td className={TD}>
              {notIdeal?.description ?? <span className="text-[var(--muted-foreground)] italic">[pending]</span>}{' '}
              <span className="text-[11px] text-[#999]">(auto-derived: top &ldquo;not ideal&rdquo; row of Who Should Buy This)</span>
            </td>
          </tr>
          <tr className="bg-gray-50">
            <td className={LABEL}>What would change this verdict</td>
            <td className={TD}>
              {review.verdictChanger ?? (
                <span className="text-[var(--muted-foreground)] italic">
                  The measurement or price change that would flip the net score.
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
