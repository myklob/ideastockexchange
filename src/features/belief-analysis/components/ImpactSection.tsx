import type { ImpactData } from '../types'
import SectionHeading from './SectionHeading'

interface ImpactSectionProps {
  impact: ImpactData | null
}

function renderLines(text: string | null): React.ReactNode {
  if (!text) return <span className="text-[var(--muted-foreground)] italic text-sm">Not yet analyzed</span>
  return text.split('\n').map((line, i) => (
    <span key={i}>{line}<br /></span>
  ))
}

export default function ImpactSection({ impact }: ImpactSectionProps) {
  return (
    <section>
      <SectionHeading emoji="&#x1F3AF;" title="Short vs. Long-Term Impacts" />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Short-Term (0-2 Years)</th>
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Long-Term (5+ Years)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 align-top text-sm">
                <strong>Immediate effects:</strong><br />
                {renderLines(impact?.shortTermEffects ?? null)}
                <br />
                <strong>Transition costs:</strong><br />
                {renderLines(impact?.shortTermCosts ?? null)}
              </td>
              <td className="px-3 py-3 align-top text-sm">
                <strong>Sustained effects:</strong><br />
                {renderLines(impact?.longTermEffects ?? null)}
                <br />
                <strong>Structural changes:</strong><br />
                {renderLines(impact?.longTermChanges ?? null)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
