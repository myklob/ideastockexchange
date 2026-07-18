import Link from 'next/link'
import type { EvidenceItem } from '../types'
import { TABLE_TOP_LIMIT } from '../lib/ranking'
import ExpandableRows from './ExpandableRows'

interface EvidenceSectionProps {
  evidence: EvidenceItem[]
}

function tierLabel(type: string): string {
  return ['T0', 'T1', 'T2', 'T3', 'T4'].includes(type) ? type : 'T?'
}

function linkPct(score: number | null | undefined): string {
  if (score == null) return ''
  return `${Math.round(score * 100)}%`
}

function impactCell(item: EvidenceItem): string {
  if (!item.impactScore) return ''
  const sign = item.side === 'supporting' ? '+' : '-'
  return `${sign}${Math.abs(item.impactScore).toFixed(1)}`
}

function EvidenceHalf({ item }: { item: EvidenceItem | undefined }) {
  if (!item) {
    return (
      <>
        <td className="border border-gray-300 px-3 py-2">&nbsp;</td>
        <td className="border border-gray-300 px-2 py-2 text-center">&nbsp;</td>
        <td className="border border-gray-300 px-2 py-2 text-center">&nbsp;</td>
        <td className="border border-gray-300 px-2 py-2 text-center">&nbsp;</td>
      </>
    )
  }
  return (
    <>
      <td className="border border-gray-300 px-3 py-2 align-top">
        {item.sourceUrl ? (
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
            {item.description}
          </a>
        ) : (
          item.description
        )}
      </td>
      <td className="border border-gray-300 px-2 py-2 text-center align-top text-xs font-semibold">{tierLabel(item.evidenceType)}</td>
      <td className="border border-gray-300 px-2 py-2 text-center align-top font-mono text-xs">{linkPct(item.linkageScore)}</td>
      <td className="border border-gray-300 px-2 py-2 text-center align-top font-mono text-xs">{impactCell(item)}</td>
    </>
  )
}

export default function EvidenceSection({ evidence }: EvidenceSectionProps) {
  const supporting = evidence.filter(e => e.side === 'supporting')
  const weakening = evidence.filter(e => e.side === 'weakening')
  const rowCount = Math.max(supporting.length, weakening.length, 1)
  const rows = Array.from({ length: rowCount }, (_, i) => i)
  const topRows = rows.slice(0, TABLE_TOP_LIMIT)
  const restRows = rows.slice(TABLE_TOP_LIMIT)

  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
        <span>&#128202;</span>
        <Link href="/algorithms/evidence-scores" className="text-[var(--accent)] hover:underline">Evidence Ledger</Link>
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-4 italic">
        Key: <strong>T1</strong>=Peer-reviewed/Official, <strong>T2</strong>=Expert/Institutional,{' '}
        <strong>T3</strong>=Journalism/Surveys, <strong>T4</strong>=Opinion/Anecdote,{' '}
        <strong>T0</strong>=Retracted/Fraudulent
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-green-100 text-center font-semibold px-3 py-2" colSpan={4}>
                ✅ Supporting Evidence
              </th>
              <th className="border border-gray-300 bg-red-100 text-center font-semibold px-3 py-2" colSpan={4}>
                ❌ Weakening Evidence
              </th>
            </tr>
            <tr className="bg-gray-100 text-xs">
              <th className="border border-gray-300 px-2 py-1.5 text-left w-[22%]">Evidence</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[7%]">Type</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[7%]">
                <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">Link</Link>
              </th>
              <th className="border border-gray-300 px-2 py-1.5 w-[7%]">Impact</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left w-[22%]">Evidence</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[7%]">Type</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[7%]">
                <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">Link</Link>
              </th>
              <th className="border border-gray-300 px-2 py-1.5 w-[7%]">Impact</th>
            </tr>
          </thead>
          <tbody>
            {topRows.map(i => (
              <tr key={i}>
                <EvidenceHalf item={supporting[i]} />
                <EvidenceHalf item={weakening[i]} />
              </tr>
            ))}
            <ExpandableRows moreCount={restRows.length} colSpan={8}>
              {restRows.map(i => (
                <tr key={i}>
                  <EvidenceHalf item={supporting[i]} />
                  <EvidenceHalf item={weakening[i]} />
                </tr>
              ))}
            </ExpandableRows>
          </tbody>
        </table>
      </div>
    </section>
  )
}
