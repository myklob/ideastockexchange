import Link from 'next/link'
import type { ArgumentWithBelief } from '../types'
import SectionHeading from './SectionHeading'

interface ArgumentTreesSectionProps {
  arguments: ArgumentWithBelief[]
  totalPro: number
  totalCon: number
}

function linkageLabel(type: string): string {
  switch (type) {
    case 'DEDUCTIVE_PROOF': return 'Proof'
    case 'STRONG_CAUSAL': return 'Strong'
    case 'CONTEXTUAL': return 'Context'
    case 'ANECDOTAL': return 'Anecdotal'
    case 'IRRELEVANT': return 'Irrelevant'
    case 'NON_SEQUITUR': return 'Non Seq.'
    case 'CONTRADICTION': return 'Contradiction'
    default: return type
  }
}

function LinkageBadge({ arg }: { arg: ArgumentWithBelief }) {
  const linkage = (arg.linkageScore * 100).toFixed(0)
  const abs = Math.abs(arg.linkageScore)

  let colorClass = 'bg-gray-100 text-gray-700 border-gray-300'
  if (arg.linkageScore <= -0.5) colorClass = 'bg-red-100 text-red-800 border-red-400'
  else if (abs < 0.05) colorClass = 'bg-red-50 text-red-500 border-red-200'
  else if (abs < 0.35) colorClass = 'bg-orange-50 text-orange-700 border-orange-300'
  else if (abs < 0.65) colorClass = 'bg-gray-50 text-gray-600 border-gray-300'
  else if (abs < 0.95) colorClass = 'bg-blue-50 text-blue-800 border-blue-400'
  else colorClass = 'bg-green-50 text-green-800 border-green-500'

  return (
    <Link
      href={`/arguments/${arg.id}/linkage`}
      title="Click to debate this linkage score"
      className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded border ${colorClass} hover:opacity-80 transition-opacity`}
    >
      <span>{linkage}%</span>
      <span className="text-[10px] text-[var(--muted-foreground)]">
        ({linkageLabel(arg.linkageType)})
      </span>
      <span className="text-[10px] opacity-60" title="Click to debate this linkage">⚖</span>
    </Link>
  )
}

function ArgumentRow({ arg }: { arg: ArgumentWithBelief }) {
  const argScore = (arg.belief.positivity).toFixed(1)
  const impact = arg.impactScore.toFixed(1)

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="px-3 py-3">
        <Link
          href={`/beliefs/${arg.belief.slug}`}
          className="text-[var(--accent)] hover:underline text-sm"
        >
          {arg.belief.statement}
        </Link>
      </td>
      <td className="px-3 py-3 text-center text-sm font-mono">{argScore}</td>
      <td className="px-3 py-3 text-center">
        <LinkageBadge arg={arg} />
      </td>
      <td className="px-3 py-3 text-center text-sm font-bold font-mono">
        {arg.side === 'agree' ? '+' : '-'}{Math.abs(Number(impact))}
      </td>
    </tr>
  )
}

function EmptyRow() {
  return (
    <tr className="border-b border-gray-200">
      <td className="px-3 py-3 text-sm text-[var(--muted-foreground)] italic" colSpan={4}>
        No arguments yet. Be the first to contribute.
      </td>
    </tr>
  )
}

export default function ArgumentTreesSection({ arguments: args, totalPro, totalCon }: ArgumentTreesSectionProps) {
  const proArgs = args.filter(a => a.side === 'agree')
  const conArgs = args.filter(a => a.side === 'disagree')

  return (
    <section>
      <SectionHeading
        emoji="&#x1F50D;"
        title="Argument Trees"
        href="/Reasons"
        subtitle="Each reason is a belief with its own page. Scoring is recursive based on truth, linkage, and importance."
      />

      {/* Pro Arguments Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-green-50">
              <th className="px-3 py-2 text-left w-[60%] font-semibold">
                Top <Link href="/Scoring" className="text-[var(--accent)] hover:underline">Scoring</Link> Reasons to Agree
              </th>
              <th className="px-3 py-2 text-center w-[15%] font-semibold">Argument Score</th>
              <th className="px-3 py-2 text-center w-[13%] font-semibold">
                <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">Linkage Score</Link>
              </th>
              <th className="px-3 py-2 text-center w-[12%] font-semibold">Impact</th>
            </tr>
          </thead>
          <tbody>
            {proArgs.length > 0 ? (
              proArgs.map(arg => <ArgumentRow key={arg.id} arg={arg} />)
            ) : (
              <EmptyRow />
            )}
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={3} className="px-3 py-2 text-right text-sm">Total Pro:</td>
              <td className="px-3 py-2 text-center text-sm font-mono text-green-700">
                +{totalPro.toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Con Arguments Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-red-50">
              <th className="px-3 py-2 text-left w-[60%] font-semibold">
                Top <Link href="/Scoring" className="text-[var(--accent)] hover:underline">Scoring</Link> Reasons to Disagree
              </th>
              <th className="px-3 py-2 text-center w-[15%] font-semibold">Argument Score</th>
              <th className="px-3 py-2 text-center w-[13%] font-semibold">
                <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">Linkage Score</Link>
              </th>
              <th className="px-3 py-2 text-center w-[12%] font-semibold">Impact</th>
            </tr>
          </thead>
          <tbody>
            {conArgs.length > 0 ? (
              conArgs.map(arg => <ArgumentRow key={arg.id} arg={arg} />)
            ) : (
              <EmptyRow />
            )}
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={3} className="px-3 py-2 text-right text-sm">Total Con:</td>
              <td className="px-3 py-2 text-center text-sm font-mono text-red-700">
                -{totalCon.toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
