import Link from 'next/link'
import type { ArgumentWithBelief } from '../types'
import { TABLE_TOP_LIMIT } from '../lib/ranking'
import ExpandableRows from './ExpandableRows'

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

/** Importance column: blank until the argument itself is scored (Rule 6). */
function impCell(arg: ArgumentWithBelief): string {
  if (arg.argumentScore == null && !arg.impactScore) return ''
  return arg.importanceScore.toFixed(1)
}

/**
 * "Show the work" trace for agent-submitted arguments: the submitting agent,
 * its rationale, the five-step check answers, and the evidence provenance.
 * Provenance display only — none of this feeds any score.
 */
function AgentWorkTrace({ arg }: { arg: ArgumentWithBelief }) {
  const agent = arg.submittedByAgent
  if (!agent) return null
  const check = arg.linkageFiveStepCheck
  const evidence = (arg.belief.evidence ?? []).filter(e => e.retrievedByAgentId)
  return (
    <details className="mt-1 text-xs not-italic">
      <summary className="cursor-pointer text-[var(--muted-foreground)] hover:text-[var(--accent)]">
        &#129302; Show the work
      </summary>
      <div className="mt-1 space-y-1 border-l-2 border-gray-200 pl-2 text-[#555]">
        <p>
          <strong>Agent:</strong> {agent.name}
          {agent.operator && <> (operator: {agent.operator})</>}
        </p>
        {arg.rationale && <p><strong>Rationale:</strong> {arg.rationale}</p>}
        {check && (
          <div>
            <p className="font-semibold">Five-Step Linkage Check</p>
            {check.parentWording && <p>1. Parent wording: &ldquo;{check.parentWording}&rdquo;</p>}
            {check.sourceWording && <p>2. Claim wording: &ldquo;{check.sourceWording}&rdquo;</p>}
            {check.mechanismSentence && <p>3. Mechanism: {check.mechanismSentence}</p>}
            {check.provisionalEstimate != null && (
              <p>4. Author bracket: [{check.provisionalEstimate}] &mdash; superseded by the engine</p>
            )}
            {check.flagNote && <p>5. Flag: {check.flagNote}</p>}
          </div>
        )}
        {evidence.length > 0 && (
          <div>
            <p className="font-semibold">Evidence provenance</p>
            <ul className="list-disc ml-4">
              {evidence.map(e => (
                <li key={e.id}>
                  {e.sourceUrl ? (
                    <a href={e.sourceUrl} className="text-[var(--accent)] hover:underline">{e.description}</a>
                  ) : (
                    e.description
                  )}
                  {e.doi && <span className="font-mono"> doi:{e.doi}</span>}
                  {e.tierClaim && (
                    <span>
                      {' '}&mdash; claimed {e.tierClaim}
                      {e.tierVerified ? `, verified ${e.tierVerified}` : ', unverified'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  )
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
      <AgentWorkTrace arg={arg} />
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
        <td className="border border-gray-300 px-2 py-2 text-center">&nbsp;</td>
      </>
    )
  }
  return (
    <>
      <td className="border border-gray-300 px-3 py-2 align-top"><ArgumentCell arg={arg} /></td>
      <td className="border border-gray-300 px-2 py-2 text-center align-top font-mono text-xs">{scoreCell(arg)}</td>
      <td className="border border-gray-300 px-2 py-2 text-center align-top font-mono text-xs">
        {/* The linkage value links to the edge's own page: the debate about
            whether this argument actually bears on this belief. */}
        {linkCell(arg) ? (
          <Link
            href={`/arguments/${arg.id}/linkage`}
            className="text-[var(--accent)] hover:underline"
            title="Debate this linkage"
          >
            {linkCell(arg)}
          </Link>
        ) : (
          ''
        )}
      </td>
      <td className="border border-gray-300 px-2 py-2 text-center align-top font-mono text-xs">{impCell(arg)}</td>
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
  const topRows = rows.slice(0, TABLE_TOP_LIMIT)
  const restRows = rows.slice(TABLE_TOP_LIMIT)

  const net = totalPro - totalCon
  const netLabel = `${net >= 0 ? '+' : ''}${net.toFixed(1)}`

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
              <th className="border border-gray-300 bg-green-100 text-center font-semibold px-3 py-2" colSpan={5}>
                ✅ Reasons to Agree
              </th>
              <th className="border border-gray-300 bg-red-100 text-center font-semibold px-3 py-2" colSpan={5}>
                ❌ Reasons to Disagree
              </th>
            </tr>
            <tr className="bg-gray-100 text-xs">
              <th className="border border-gray-300 px-2 py-1.5 text-left w-[22%]">Argument</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[5%]">Score</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[5%]">
                <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">Link</Link>
              </th>
              <th className="border border-gray-300 px-2 py-1.5 w-[5%]">
                <Link href="/importance%20score" className="text-[var(--accent)] hover:underline">Imp</Link>
              </th>
              <th className="border border-gray-300 px-2 py-1.5 w-[6%]">Impact</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left w-[22%]">Argument</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[5%]">Score</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[5%]">
                <Link href="/Linkage%20Scores" className="text-[var(--accent)] hover:underline">Link</Link>
              </th>
              <th className="border border-gray-300 px-2 py-1.5 w-[5%]">
                <Link href="/importance%20score" className="text-[var(--accent)] hover:underline">Imp</Link>
              </th>
              <th className="border border-gray-300 px-2 py-1.5 w-[6%]">Impact</th>
            </tr>
          </thead>
          <tbody>
            {topRows.map(i => (
              <tr key={i}>
                <HalfRow arg={proArgs[i]} />
                <HalfRow arg={conArgs[i]} />
              </tr>
            ))}
            <ExpandableRows moreCount={restRows.length} colSpan={10}>
              {restRows.map(i => (
                <tr key={i}>
                  <HalfRow arg={proArgs[i]} />
                  <HalfRow arg={conArgs[i]} />
                </tr>
              ))}
            </ExpandableRows>
            <tr className="bg-gray-100 italic text-[#666]">
              <td className="border border-gray-300 px-3 py-2 text-right font-semibold" colSpan={4}>Pro Total:</td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-green-700">
                {totalPro > 0 ? `+${totalPro.toFixed(1)}` : ''}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right font-semibold" colSpan={4}>Con Total:</td>
              <td className="border border-gray-300 px-2 py-2 text-center font-mono text-red-700">
                {totalCon > 0 ? `-${totalCon.toFixed(1)}` : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-sm mt-4 p-2 bg-gray-100 border border-gray-300">
        <strong>Net Belief Score: {totalPro > 0 || totalCon > 0 ? netLabel : '[pending]'}.</strong>{' '}
        {netInterpretation ?? (
          <span className="text-[var(--muted-foreground)] italic">
            Interpretation appears once arguments are scored.
          </span>
        )}
      </p>
    </section>
  )
}
