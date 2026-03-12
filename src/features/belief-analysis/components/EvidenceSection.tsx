import Link from 'next/link'
import type { EvidenceItem } from '../types'
import SectionHeading from './SectionHeading'

interface EvidenceSectionProps {
  evidence: EvidenceItem[]
  totalSupporting: number
  totalWeakening: number
}

function tierLabel(type: string): string {
  switch (type) {
    case 'T1': return 'T1'
    case 'T2': return 'T2'
    case 'T3': return 'T3'
    case 'T4': return 'T4'
    default: return type
  }
}

function tierStyle(type: string): string {
  switch (type) {
    case 'T1': return 'bg-green-100 text-green-800'
    case 'T2': return 'bg-blue-100 text-blue-800'
    case 'T3': return 'bg-yellow-100 text-yellow-800'
    case 'T4': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function EvidenceRow({ item }: { item: EvidenceItem }) {
  const evScore = (item.sourceIndependenceWeight * Math.log2(item.replicationQuantity + 1) *
    item.conclusionRelevance * item.replicationPercentage).toFixed(2)
  const linkage = (item.linkageScore * 100).toFixed(0)
  const impact = item.impactScore.toFixed(1)

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="px-3 py-3 text-sm">
        {item.sourceUrl ? (
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
            {item.description}
          </a>
        ) : (
          item.description
        )}
      </td>
      <td className="px-3 py-3 text-center text-sm font-mono">{evScore}</td>
      <td className="px-3 py-3 text-center text-sm font-mono">{linkage}%</td>
      <td className="px-3 py-3 text-center">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${tierStyle(item.evidenceType)}`}>
          {tierLabel(item.evidenceType)}
        </span>
      </td>
      <td className="px-3 py-3 text-center text-sm font-bold font-mono">
        {item.side === 'supporting' ? '+' : '-'}{Math.abs(Number(impact))}
      </td>
    </tr>
  )
}

function EmptyRow() {
  return (
    <tr className="border-b border-gray-200">
      <td className="px-3 py-3 text-sm text-[var(--muted-foreground)] italic" colSpan={5}>
        No evidence submitted yet.
      </td>
    </tr>
  )
}

export default function EvidenceSection({ evidence, totalSupporting, totalWeakening }: EvidenceSectionProps) {
  const supporting = evidence.filter(e => e.side === 'supporting')
  const weakening = evidence.filter(e => e.side === 'weakening')

  return (
    <section>
      <SectionHeading
        emoji="&#x1F52C;"
        title="Best Evidence"
        href="/Evidence"
        subtitle="Key: T1=Peer-reviewed/Official, T2=Expert/Institutional, T3=Journalism/Surveys, T4=Opinion/Anecdote"
      />

      {/* Supporting Evidence */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-green-50">
              <th className="px-3 py-2 text-left w-[50%] font-semibold">Top Supporting Evidence</th>
              <th className="px-3 py-2 text-center w-[15%] font-semibold">Evidence Score</th>
              <th className="px-3 py-2 text-center w-[13%] font-semibold">
                <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">Linkage Score</Link>
              </th>
              <th className="px-3 py-2 text-center w-[10%] font-semibold">Type</th>
              <th className="px-3 py-2 text-center w-[12%] font-semibold">Impact</th>
            </tr>
          </thead>
          <tbody>
            {supporting.length > 0 ? (
              supporting.map(item => <EvidenceRow key={item.id} item={item} />)
            ) : (
              <EmptyRow />
            )}
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={4} className="px-3 py-2 text-right text-sm">Total Contributing:</td>
              <td className="px-3 py-2 text-center text-sm font-mono text-green-700">
                +{totalSupporting.toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Weakening Evidence */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-red-50">
              <th className="px-3 py-2 text-left w-[50%] font-semibold">Top Weakening Evidence</th>
              <th className="px-3 py-2 text-center w-[15%] font-semibold">Evidence Score</th>
              <th className="px-3 py-2 text-center w-[13%] font-semibold">
                <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">Linkage Score</Link>
              </th>
              <th className="px-3 py-2 text-center w-[10%] font-semibold">Type</th>
              <th className="px-3 py-2 text-center w-[12%] font-semibold">Impact</th>
            </tr>
          </thead>
          <tbody>
            {weakening.length > 0 ? (
              weakening.map(item => <EvidenceRow key={item.id} item={item} />)
            ) : (
              <EmptyRow />
            )}
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={4} className="px-3 py-2 text-right text-sm">Total Weakening:</td>
              <td className="px-3 py-2 text-center text-sm font-mono text-red-700">
                -{totalWeakening.toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
