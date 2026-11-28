import Link from 'next/link'
import { Evidence, EvidenceTier } from '@/lib/types'

const tierBg: Record<EvidenceTier, string> = {
  T1: 'var(--tier-t1)',
  T2: 'var(--tier-t2)',
  T3: 'var(--tier-t3)',
  T4: 'var(--tier-t4)',
}

function scoreColor(q: number): string {
  if (q >= 80) return 'var(--score-excellent)'
  if (q >= 60) return 'var(--score-moderate)'
  return 'var(--score-weak)'
}

function EvidenceCell({ e }: { e?: Evidence }) {
  if (!e) return <td className="border border-[var(--border)] p-3 align-top" />
  return (
    <td className="border border-[var(--border)] p-3 align-top text-[13px]">
      <Link href="#" className="font-semibold text-[var(--accent)] no-underline hover:underline">
        {e.title}
      </Link>
      <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{e.source}</div>
      <div className="mt-1 leading-snug">{e.finding}</div>
    </td>
  )
}

function QualityCell({ e }: { e?: Evidence }) {
  if (!e) return <td className="border border-[var(--border)] p-3 align-top" />
  return (
    <td className="border border-[var(--border)] p-3 align-middle text-center">
      <span
        className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold font-mono text-white"
        style={{ background: tierBg[e.tier] }}
      >
        {e.tier}
      </span>
      <div
        className="font-mono font-bold mt-1 tabular-nums text-[13px]"
        style={{ color: scoreColor(e.quality) }}
      >
        {e.quality}%
      </div>
    </td>
  )
}

export function EvidenceLedger({ evidence }: { evidence: Evidence[] }) {
  const proEvidence = evidence.filter(e => e.side === 'pro')
  const conEvidence = evidence.filter(e => e.side === 'con')
  const rowCount = Math.max(proEvidence.length, conEvidence.length)

  return (
    <table className="w-full border-collapse border border-[var(--border-strong)] text-sm">
      <thead>
        <tr className="bg-[var(--muted)]">
          <th className="border border-[var(--border)] p-2.5 text-left font-semibold w-[46%]">Supporting Evidence</th>
          <th className="border border-[var(--border)] p-2.5 text-center font-semibold w-[8%]">Quality</th>
          <th className="border border-[var(--border)] p-2.5 text-left font-semibold w-[38%]">Weakening Evidence</th>
          <th className="border border-[var(--border)] p-2.5 text-center font-semibold w-[8%]">Quality</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rowCount }, (_, i) => (
          <tr key={i} className="hover:bg-gray-50 transition-colors">
            <EvidenceCell e={proEvidence[i]} />
            <QualityCell  e={proEvidence[i]} />
            <EvidenceCell e={conEvidence[i]} />
            <QualityCell  e={conEvidence[i]} />
          </tr>
        ))}
      </tbody>
    </table>
  )
}
