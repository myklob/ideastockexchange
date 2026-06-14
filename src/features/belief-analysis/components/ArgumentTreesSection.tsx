import Link from 'next/link'
import type { ArgumentWithBelief } from '../types'
import { justificationScore, truthShare, argumentMass } from '@/core/scoring/contrast-class'

interface ArgumentTreesSectionProps {
  arguments: ArgumentWithBelief[]
  totalPro: number
  totalCon: number
  netInterpretation: string | null
}

/** Signed argument score for the "Score" column. Blank until real scoring exists (Rule 6). */
function scoreCell(arg: ArgumentWithBelief): string {
  if (arg.argumentScore == null) return ''
  const v = arg.argumentScore
  return `${v >= 0 ? '+' : ''}${v.toFixed(0)}`
}

function linkCell(arg: ArgumentWithBelief): string {
  if (!arg.linkageScore) return ''
  return `${Math.round(arg.linkageScore * 100)}%`
}

function impactCell(arg: ArgumentWithBelief): string {
  if (!arg.impactScore) return ''
  const sign = arg.side === 'agree' ? '+' : '-'
  return `${sign}${Math.abs(arg.impactScore).toFixed(1)}`
}

/** The argument cell: claim label, inline famous quote (italic), then ~Author link. */
function ArgumentCell({ arg }: { arg: ArgumentWithBelief }) {
  const label = arg.claim ?? arg.belief.statement
  return (
    <>
      <Link href={`/beliefs/${arg.belief.slug}`} className="text-[var(--accent)] hover:underline">
        {label}
      </Link>
      {arg.famousQuote && (
        <span className="text-xs text-[#555]">
          {' '}<em>&ldquo;{arg.famousQuote}&rdquo;</em>
        </span>
      )}
      {arg.quoteAuthor && (
        <span className="text-xs text-[var(--muted-foreground)]">
          {' '}~
          {arg.quoteAuthorUrl ? (
            <a href={arg.quoteAuthorUrl} className="text-[var(--accent)] hover:underline">{arg.quoteAuthor}</a>
          ) : (
            arg.quoteAuthor
          )}
        </span>
      )}
    </>
  )
}

function HalfRow({ arg }: { arg: ArgumentWithBelief | undefined }) {
  if (!arg) {
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
      <td className="border border-gray-300 px-3 py-2 align-top"><ArgumentCell arg={arg} /></td>
      <td className="border border-gray-300 px-2 py-2 text-center align-top font-mono text-xs">{scoreCell(arg)}</td>
      <td className="border border-gray-300 px-2 py-2 text-center align-top font-mono text-xs">{linkCell(arg)}</td>
      <td className="border border-gray-300 px-2 py-2 text-center align-top font-mono text-xs font-semibold">{impactCell(arg)}</td>
    </>
  )
}

export default function ArgumentTreesSection({
  arguments: args,
  totalPro,
  totalCon,
  netInterpretation,
}: ArgumentTreesSectionProps) {
  const proArgs = args.filter(a => a.side === 'agree')
  const conArgs = args.filter(a => a.side === 'disagree')
  const rowCount = Math.max(proArgs.length, conArgs.length, 1)
  const rows = Array.from({ length: rowCount }, (_, i) => i)

  const net = totalPro - totalCon
  const netLabel = `${net >= 0 ? '+' : ''}${net.toFixed(1)}`

  // §4 of THE_DENOMINATOR: a bare net "+9.2" floats free. Divide it by the
  // belief's own total argument weight to get the justification score — the
  // share (implied probability) and margin a reader can actually act on.
  const hasArgs = totalPro > 0 || totalCon > 0
  const share = truthShare(totalPro, totalCon)
  const margin = justificationScore(totalPro, totalCon)
  const mass = argumentMass(totalPro, totalCon)

  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
        <span>&#128269;</span>
        <Link href="/Reasons" className="text-[var(--accent)] hover:underline">Argument Trees</Link>
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        Each argument is a belief with its own page. Scores are recursive: Argument Score ×{' '}
        <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">Linkage</Link> ×{' '}
        <Link href="/importance%20score" className="text-[var(--accent)] hover:underline">Importance</Link>{' '}
        = Impact. Pro and con impacts sum to the Net Belief Score.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-green-100 text-center font-semibold px-3 py-2" colSpan={4}>
                ✅ Reasons to Agree
              </th>
              <th className="border border-gray-300 bg-red-100 text-center font-semibold px-3 py-2" colSpan={4}>
                ❌ Reasons to Disagree
              </th>
            </tr>
            <tr className="bg-gray-100 text-xs">
              <th className="border border-gray-300 px-2 py-1.5 text-left w-[25%]">Argument</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[6%]">Score</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[6%]">
                <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">Link</Link>
              </th>
              <th className="border border-gray-300 px-2 py-1.5 w-[7%]">Impact</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left w-[25%]">Argument</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[6%]">Score</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[6%]">
                <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">Link</Link>
              </th>
              <th className="border border-gray-300 px-2 py-1.5 w-[7%]">Impact</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(i => (
              <tr key={i}>
                <HalfRow arg={proArgs[i]} />
                <HalfRow arg={conArgs[i]} />
              </tr>
            ))}
            <tr className="bg-gray-100 italic text-[#666]">
              <td className="border border-gray-300 px-3 py-2 text-right font-semibold" colSpan={3}>Pro Total:</td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-green-700">
                {totalPro > 0 ? `+${totalPro.toFixed(1)}` : ''}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right font-semibold" colSpan={3}>Con Total:</td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-red-700">
                {totalCon > 0 ? `-${totalCon.toFixed(1)}` : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-sm mt-4 p-2 bg-gray-100 border border-gray-300">
        <strong>Net Belief Score: {hasArgs ? netLabel : '[pending]'}.</strong>{' '}
        {hasArgs && share != null && (
          <span>
            The agree-case holds{' '}
            <strong>{Math.round(share * 100)}%</strong> of the argument weight, a{' '}
            <strong>{margin >= 0 ? '+' : ''}{Math.round(margin * 100)}-point</strong>{' '}
            margin{' '}
            <span className="text-[var(--muted-foreground)]">
              (mass {mass.toFixed(1)})
            </span>
            .{' '}
          </span>
        )}
        {netInterpretation ?? (
          <span className="text-[var(--muted-foreground)] italic">
            {hasArgs
              ? 'This is the internal denominator only — how lopsided the belief is versus its own rebuttals, not whether it beats its rivals.'
              : 'Interpretation appears once arguments are scored.'}
          </span>
        )}
      </p>
    </section>
  )
}
