import Link from 'next/link'
import type { EvidenceItem } from '../types'
import { TABLE_TOP_LIMIT } from '../lib/ranking'
import ExpandableRows from './ExpandableRows'

interface EvidenceSectionProps {
  evidence: EvidenceItem[]
}

/** Spelled-out tier label ("Tier 1"), per the no-abbreviated-headers rule. */
function tierLabel(type: string): string {
  const m = /^T([0-4])$/.exec(type)
  return m ? `Tier ${m[1]}` : type
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

/** The first few words of an argument's label, used to name it in "Bears On". */
function openingWords(text: string, count = 8): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= count) return text.trim()
  return `${words.slice(0, count).join(' ')}…`
}

/** "Finding (Producer, Year)" — producer/year fold into the description cell. */
function findingLabel(item: EvidenceItem): string {
  const meta = [item.producer, item.year != null ? String(item.year) : null]
    .filter(Boolean)
    .join(', ')
  return meta ? `${item.description} (${meta})` : item.description
}

/**
 * The "Bears On" cell: the specific argument this evidence bears on, named by
 * its opening words and linking into that argument's own sub-debate — or
 * "this belief" (plain text) when the evidence bears on the belief directly.
 */
function BearsOnCell({ item }: { item: EvidenceItem }) {
  const arg = item.bearsOnArgument
  if (!arg) return <span className="text-[var(--muted-foreground)]">this belief</span>
  return (
    <Link
      href={`/beliefs/${arg.belief.slug}`}
      className="text-[var(--accent)] hover:underline"
      title="The argument this evidence bears on"
    >
      {openingWords(arg.claim ?? arg.belief.statement)}
    </Link>
  )
}

function EvidenceHalf({ item }: { item: EvidenceItem | undefined }) {
  if (!item) {
    return (
      <>
        <td className="border border-gray-300 px-3 py-2">&nbsp;</td>
        <td className="border border-gray-300 px-2 py-2">&nbsp;</td>
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
            {findingLabel(item)}
          </a>
        ) : (
          findingLabel(item)
        )}
      </td>
      <td className="border border-gray-300 px-2 py-2 align-top text-xs">
        <BearsOnCell item={item} />
      </td>
      <td className="border border-gray-300 px-2 py-2 text-center align-top text-xs font-semibold whitespace-nowrap">
        {tierLabel(item.evidenceType)}
      </td>
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
        Tier key: <strong>Tier 1</strong>=Peer-reviewed/Official, <strong>Tier 2</strong>=Expert/Institutional,{' '}
        <strong>Tier 3</strong>=Journalism/Surveys, <strong>Tier 4</strong>=Opinion/Anecdote,{' '}
        <strong>Tier 0</strong>=Retracted/Fraudulent. Format each item as: Finding (Producer, Year).
        Evidence is data that can fail empirically; a reason that can only fail logically is an
        argument and belongs in the tree above, not here. Every item must also name what it{' '}
        <strong>bears on</strong>: a specific argument above, identified by its opening words, or
        this belief directly. Evidence that bears on nothing contributes nothing, no matter how
        true it is.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-green-100 text-center font-semibold px-3 py-2" colSpan={5}>
                ✅ Supporting Evidence
              </th>
              <th className="border border-gray-300 bg-red-100 text-center font-semibold px-3 py-2" colSpan={5}>
                ❌ Weakening Evidence
              </th>
            </tr>
            <tr className="bg-gray-100 text-xs">
              <th className="border border-gray-300 px-2 py-1.5 text-left w-[18%]">Evidence (Producer, Year)</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left w-[11%]">Bears On</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[6%]">Tier</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[6%]">
                <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">Linkage</Link>
              </th>
              <th className="border border-gray-300 px-2 py-1.5 w-[7%]">Impact</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left w-[18%]">Evidence (Producer, Year)</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left w-[11%]">Bears On</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[6%]">Tier</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[6%]">
                <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">Linkage</Link>
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
            <ExpandableRows moreCount={restRows.length} colSpan={10}>
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
