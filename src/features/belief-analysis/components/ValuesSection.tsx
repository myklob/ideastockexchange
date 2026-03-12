import type { ValuesAnalysisData } from '../types'
import SectionHeading from './SectionHeading'

interface ValuesSectionProps {
  values: ValuesAnalysisData | null
}

function renderLines(text: string | null): React.ReactNode {
  if (!text) return <span className="text-[var(--muted-foreground)] italic text-sm">Not yet analyzed</span>
  return text.split('\n').map((line, i) => (
    <span key={i}>{line}<br /></span>
  ))
}

export default function ValuesSection({ values }: ValuesSectionProps) {
  return (
    <section>
      <SectionHeading
        emoji="&#x2696;&#xFE0F;"
        title="Core Values Conflict"
        href="/American%20values"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Supporting Values</th>
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Opposing Values</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 align-top text-sm">
                <strong>Advertised:</strong><br />
                {renderLines(values?.supportingAdvertised ?? null)}
                <br />
                <strong>Actual:</strong><br />
                {renderLines(values?.supportingActual ?? null)}
              </td>
              <td className="px-3 py-3 align-top text-sm">
                <strong>Advertised:</strong><br />
                {renderLines(values?.opposingAdvertised ?? null)}
                <br />
                <strong>Actual:</strong><br />
                {renderLines(values?.opposingActual ?? null)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--muted-foreground)] italic mt-2">
        (What supporters claim vs. what actually motivates them)
      </p>
    </section>
  )
}
