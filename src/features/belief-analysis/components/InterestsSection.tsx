import type { InterestsAnalysisData } from '../types'
import SectionHeading from './SectionHeading'

interface InterestsSectionProps {
  interests: InterestsAnalysisData | null
}

function renderLines(text: string | null): React.ReactNode {
  if (!text) return <span className="text-[var(--muted-foreground)] italic text-sm">Not yet analyzed</span>
  return text.split('\n').map((line, i) => (
    <span key={i}>{line}<br /></span>
  ))
}

export default function InterestsSection({ interests }: InterestsSectionProps) {
  return (
    <section>
      <SectionHeading
        emoji="&#x1F4A1;"
        title="Interest & Motivations"
        href="/Interests"
      />

      {/* Supporters vs Opponents */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Supporters</th>
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Opponents</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 align-top text-sm">{renderLines(interests?.supporterInterests ?? null)}</td>
              <td className="px-3 py-3 align-top text-sm">{renderLines(interests?.opponentInterests ?? null)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Shared vs Conflicting Interests */}
      <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
        <span>&#x1F517;</span>
        Shared and Conflicting Interests
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-blue-50">
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Shared Interests</th>
              <th className="px-3 py-2 text-center w-1/2 font-semibold">Conflicting Interests</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 align-top text-sm">{renderLines(interests?.sharedInterests ?? null)}</td>
              <td className="px-3 py-3 align-top text-sm">{renderLines(interests?.conflictingInterests ?? null)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
