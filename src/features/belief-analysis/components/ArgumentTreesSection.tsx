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

function ArgumentRow({ arg }: { arg: ArgumentWithBelief }) {
  const argScore = (arg.belief.positivity).toFixed(1)
  const linkage = (arg.linkageScore * 100).toFixed(0)
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
        <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
          {linkage}% <span className="text-[var(--muted-foreground)]">({linkageLabel(arg.linkageType)})</span>
        </span>
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
