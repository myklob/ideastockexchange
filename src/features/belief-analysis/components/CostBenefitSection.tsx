import Link from 'next/link'
import type { CostBenefitData, ImpactData } from '../types'
import SectionHeading from './SectionHeading'

interface CostBenefitSectionProps {
  cba: CostBenefitData | null
  /**
   * Short vs. long-term impacts now render as a sub-table inside the CBA section
   * rather than a separate top-level section, per the new canonical template.
   */
  impact?: ImpactData | null
}

function renderLines(text: string | null): React.ReactNode {
  if (!text) return <span className="text-[var(--muted-foreground)] italic text-sm">Not yet analyzed</span>
  return text.split('\n').map((line, i) => (
    <span key={i}>{line}<br /></span>
  ))
}

function formatLikelihood(value: number | null | undefined): string {
  if (value == null) return ''
  return `${(value * 100).toFixed(0)}%`
}

export default function CostBenefitSection({ cba, impact }: CostBenefitSectionProps) {
  return (
    <section>
      <SectionHeading
        emoji="&#x1F4C9;"
        title="Cost-Benefit Analysis"
        href="/cost-benefit%20analysis"
      />

      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left w-1/2 font-semibold bg-green-50">
                🔔 Potential Benefits
              </th>
              <th className="px-3 py-2 text-left w-1/2 font-semibold bg-red-50">
                🔘 Potential Costs
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 align-top text-sm">
                {renderLines(cba?.benefits ?? null)}
                {cba?.benefitLikelihood != null && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">
                    <Link href="/Likelihood" className="text-[var(--accent)] hover:underline">
                      Likelihood
                    </Link>
                    : <span className="font-mono">{formatLikelihood(cba.benefitLikelihood)}</span>
                  </p>
                )}
              </td>
              <td className="px-3 py-3 align-top text-sm">
                {renderLines(cba?.costs ?? null)}
                {cba?.costLikelihood != null && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">
                    Likelihood: <span className="font-mono">{formatLikelihood(cba.costLikelihood)}</span>
                  </p>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Short vs. Long-Term sub-table (was separate ImpactSection) */}
      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span>🎯</span> Short vs. Long-Term
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left w-1/2 font-semibold">Short-Term (0-2 years)</th>
                <th className="px-3 py-2 text-left w-1/2 font-semibold">Long-Term (5+ years)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="px-3 py-3 align-top text-sm">
                  <strong>Immediate effects:</strong><br />
                  {renderLines(impact?.shortTermEffects ?? null)}
                </td>
                <td className="px-3 py-3 align-top text-sm">
                  <strong>Sustained effects:</strong><br />
                  {renderLines(impact?.longTermEffects ?? null)}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 align-top text-sm">
                  <strong>Transition costs:</strong><br />
                  {renderLines(impact?.shortTermCosts ?? null)}
                </td>
                <td className="px-3 py-3 align-top text-sm">
                  <strong>Structural changes:</strong><br />
                  {renderLines(impact?.longTermChanges ?? null)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
