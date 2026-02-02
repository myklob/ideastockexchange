import { SchilchtEvidence } from '@/lib/types/schlicht'

interface EvidenceTableProps {
  evidence: SchilchtEvidence[]
}

function getTierStyle(tier: string): string {
  switch (tier) {
    case 'T1':
      return 'bg-green-100 text-green-800'
    case 'T2':
      return 'bg-blue-100 text-blue-800'
    case 'T3':
      return 'bg-yellow-100 text-yellow-800'
    case 'T4':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function EvidenceTable({ evidence }: EvidenceTableProps) {
  return (
    <div className="bg-white border border-[var(--border)] rounded overflow-hidden">
      {evidence.map((ev, i) => (
        <div
          key={ev.id}
          className={`flex items-center justify-between px-4 py-3 ${
            i < evidence.length - 1 ? 'border-b border-gray-100' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${getTierStyle(ev.tier)}`}
            >
              {ev.tier} {ev.tierLabel}
            </span>
            <span className="text-sm text-[var(--foreground)]">{ev.title}</span>
          </div>
          <span className="text-xs bg-gray-100 text-[var(--muted-foreground)] px-2 py-0.5 rounded flex-shrink-0">
            Linkage: {(ev.linkageScore * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  )
}
