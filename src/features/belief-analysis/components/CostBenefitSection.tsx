import Link from 'next/link'
import type { CostBenefitData, ImpactData, CompromiseItem } from '../types'

interface CostBenefitSectionProps {
  cba: CostBenefitData | null
  /** Short vs. long-term impacts render as a sub-table inside the CBA section. */
  impact?: ImpactData | null
  /** Best Compromise Solutions render as a sub-table inside the CBA section. */
  compromises: CompromiseItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'

function lines(text: string | null | undefined): React.ReactNode {
  if (!text) return <span>&nbsp;</span>
  return text.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)
}

/** Join two free-text columns into one cell, skipping blanks. */
function joined(a: string | null | undefined, b: string | null | undefined): React.ReactNode {
  const parts = [a, b].filter(Boolean) as string[]
  if (parts.length === 0) return <span>&nbsp;</span>
  return lines(parts.join('\n'))
}

export default function CostBenefitSection({ cba, impact, compromises }: CostBenefitSectionProps) {
  const compromiseRows: Array<CompromiseItem | null> = compromises.length > 0 ? compromises : [null]

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
          <span>&#9878;</span>
          <Link href="/cba/about" className="text-[var(--accent)] hover:underline">Cost-Benefit Analysis</Link>
        </h2>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-1/2`}>Benefits</th>
              <th className={`${TH} w-1/2`}>Costs and Risks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}>{lines(cba?.benefits)}</td>
              <td className={TD}>{lines(cba?.costs)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span>&#127919;</span> Short vs. Long-Term Impacts
        </h3>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-1/2`}>Short-Term (0-2 Years)</th>
              <th className={`${TH} w-1/2`}>Long-Term (5+ Years)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}>{joined(impact?.shortTermEffects, impact?.shortTermCosts)}</td>
              <td className={TD}>{joined(impact?.longTermEffects, impact?.longTermChanges)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span>&#129309;</span>
          Best Compromise Solutions
        </h3>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-[33%]`}>Shared Premise Both Sides Accept</th>
              <th className={`${TH} w-[34%]`}>Proposed Synthesis</th>
              <th className={`${TH} w-[33%]`}>Why This Is Difficult</th>
            </tr>
          </thead>
          <tbody>
            {compromiseRows.map((c, i) => (
              <tr key={c?.id ?? i}>
                <td className={TD}>{lines(c?.sharedPremise)}</td>
                <td className={TD}>{lines(c?.synthesis ?? c?.description)}</td>
                <td className={TD}>{lines(c?.whyDifficult)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
