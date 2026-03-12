import Link from 'next/link'
import type { CostBenefitData } from '../types'
import SectionHeading from './SectionHeading'

interface CostBenefitSectionProps {
  cba: CostBenefitData | null
}

function renderLines(text: string | null): React.ReactNode {
  if (!text) return <span className="text-[var(--muted-foreground)] italic text-sm">Not yet analyzed</span>
  return text.split('\n').map((line, i) => (
    <span key={i}>{line}<br /></span>
  ))
}

function formatLikelihood(value: number | null): string {
  if (value === null) return '-'
  return `${(value * 100).toFixed(0)}%`
}

export default function CostBenefitSection({ cba }: CostBenefitSectionProps) {
  return (
    <section>
      <SectionHeading
        emoji="&#x1F4C9;"
        title="Cost-Benefit Analysis"
        href="/cost-benefit%20analysis"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left w-[40%] font-semibold bg-green-50">Potential Benefits</th>
              <th className="px-3 py-2 text-center w-[10%] font-semibold bg-green-50">
                <Link href="/Likelihood" className="text-[var(--accent)] hover:underline">Likelihood</Link>
              </th>
              <th className="px-3 py-2 text-left w-[40%] font-semibold bg-red-50">Potential Costs</th>
              <th className="px-3 py-2 text-center w-[10%] font-semibold bg-red-50">Likelihood</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 align-top text-sm">{renderLines(cba?.benefits ?? null)}</td>
              <td className="px-3 py-3 align-top text-center text-sm font-mono">
                {formatLikelihood(cba?.benefitLikelihood ?? null)}
              </td>
              <td className="px-3 py-3 align-top text-sm">{renderLines(cba?.costs ?? null)}</td>
              <td className="px-3 py-3 align-top text-center text-sm font-mono">
                {formatLikelihood(cba?.costLikelihood ?? null)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
