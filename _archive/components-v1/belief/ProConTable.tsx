import { Argument } from '@/lib/types'

function linkageLabel(label: string): string {
  switch (label) {
    case 'Strong':    return 'Strong'
    case 'Moderate':  return 'Moderate'
    case 'Context':   return 'Context'
    case 'Weak':      return 'Weak'
    case 'Anecdotal': return 'Anecdotal'
    default:          return label
  }
}

function LinkageBadge({ linkage, label }: { linkage: number; label: string }) {
  const fraction = linkage / 100
  let colorClass = 'bg-gray-100 text-gray-700 border-gray-300'
  if (fraction < 0.05) colorClass = 'bg-red-50 text-red-500 border-red-200'
  else if (fraction < 0.35) colorClass = 'bg-orange-50 text-orange-700 border-orange-300'
  else if (fraction < 0.65) colorClass = 'bg-gray-50 text-gray-600 border-gray-300'
  else if (fraction < 0.95) colorClass = 'bg-blue-50 text-blue-800 border-blue-400'
  else colorClass = 'bg-green-50 text-green-800 border-green-500'

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded border ${colorClass}`}
    >
      <span>{linkage}%</span>
      <span className="text-[10px] text-[var(--muted-foreground)]">({linkageLabel(label)})</span>
    </span>
  )
}

function ContributionBadge({ linkage, truth }: { linkage: number; truth: number }) {
  const fraction = (linkage / 100) * (truth / 100)
  const pct = (fraction * 100).toFixed(0)
  let colorClass = 'bg-gray-50 text-gray-600 border-gray-300'
  if (fraction >= 0.65) colorClass = 'bg-green-50 text-green-800 border-green-500'
  else if (fraction >= 0.35) colorClass = 'bg-blue-50 text-blue-800 border-blue-300'
  else if (fraction >= 0.10) colorClass = 'bg-orange-50 text-orange-700 border-orange-300'
  else colorClass = 'bg-red-50 text-red-600 border-red-200'

  return (
    <span
      title="Contribution = Linkage Score × Truth Score"
      className={`inline-flex items-center text-xs font-mono px-2 py-0.5 rounded border ${colorClass}`}
    >
      {pct}%
    </span>
  )
}

function ArgTable({ rows, side }: { rows: Argument[]; side: 'pro' | 'con' }) {
  const isPro = side === 'pro'
  const total = rows.reduce((s, r) => s + parseFloat(r.impact.replace(/[^0-9.\-]/g, '') || '0'), 0)

  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className={isPro ? 'bg-green-50' : 'bg-red-50'}>
          <th className="px-3 py-2 text-left w-[48%] font-semibold">
            Top Scoring Reasons to {isPro ? 'Agree' : 'Disagree'}
          </th>
          <th className="px-3 py-2 text-center w-[13%] font-semibold">Truth Score</th>
          <th className="px-3 py-2 text-center w-[14%] font-semibold">Linkage Score</th>
          <th className="px-3 py-2 text-center w-[12%] font-semibold" title="Linkage Score × Truth Score">
            Contribution
          </th>
          <th className="px-3 py-2 text-center w-[13%] font-semibold">Impact</th>
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map(r => (
            <tr key={r.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-3 text-sm">{r.title}</td>
              <td className="px-3 py-3 text-center text-sm font-mono">
                {r.truth}%
              </td>
              <td className="px-3 py-3 text-center">
                <LinkageBadge linkage={r.linkage} label={r.linkageLabel} />
              </td>
              <td className="px-3 py-3 text-center">
                <ContributionBadge linkage={r.linkage} truth={r.truth} />
              </td>
              <td className={`px-3 py-3 text-center text-sm font-bold font-mono ${isPro ? 'text-green-700' : 'text-red-700'}`}>
                {r.impact}
              </td>
            </tr>
          ))
        ) : (
          <tr className="border-b border-gray-200">
            <td className="px-3 py-3 text-sm text-[var(--muted-foreground)] italic" colSpan={5}>
              No arguments yet. Be the first to contribute.
            </td>
          </tr>
        )}
        <tr className="bg-gray-100 font-semibold">
          <td colSpan={4} className="px-3 py-2 text-right text-sm">Total {isPro ? 'Pro' : 'Con'}:</td>
          <td className={`px-3 py-2 text-center text-sm font-mono ${isPro ? 'text-green-700' : 'text-red-700'}`}>
            {isPro ? '+' : '-'}{Math.abs(total).toFixed(1)}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export function ProConTable({ proArgs, conArgs }: { proArgs: Argument[]; conArgs: Argument[] }) {
  return (
    <>
      <div className="mb-6 overflow-x-auto">
        <ArgTable rows={proArgs} side="pro" />
      </div>
      <div className="overflow-x-auto">
        <ArgTable rows={conArgs} side="con" />
      </div>
    </>
  )
}
