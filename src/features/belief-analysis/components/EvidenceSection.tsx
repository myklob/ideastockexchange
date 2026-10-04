import Link from 'next/link'
import type { EvidenceItem } from '../types'
import { TABLE_TOP_LIMIT } from '../lib/ranking'
import ExpandableRows from './ExpandableRows'
import {
  computeBeliefEvidenceExposure,
  readStanding,
  summarizeExposure,
  STANDINGS,
  HIGH_EXPOSURE_SHARE,
  NEGLIGIBLE_EXPOSURE,
  type StandingKey,
} from '@/core/scoring/evidence-exposure'

interface EvidenceSectionProps {
  evidence: EvidenceItem[]
}

/**
 * The engine's eighteen source types (tools/static-site/evidence.py, ESIW),
 * strongest first. The type sets where a finding's truth starts before anyone
 * argues it; the labels here are the spelled-out cell text.
 */
const SOURCE_TYPE_LABELS: Record<string, string> = {
  statistics: 'Statistics and data',
  record: 'Primary official record',
  rct: 'Randomized controlled trial',
  meta: 'Meta-analysis',
  observational: 'Observational study',
  historical: 'Historical trend',
  expert_data: 'Expert testimony with data',
  expert_claim: 'Expert or social media claim',
  anecdote: 'Personal anecdote',
  logic: 'Common sense or logic',
  analogy: 'Analogy',
  norm: 'Cultural norm',
  intuition: 'Intuition',
  news: 'News report',
  survey: 'Survey or poll',
  eyewitness: 'Eyewitness testimony',
  visual: 'Visual evidence',
  artifact: 'Historical artifact',
}

/**
 * Source type cell. A row still carrying one of the retired four tiers renders
 * it as plain "Tier N" text until it is reclassified; an unknown value renders
 * as typed.
 */
function sourceTypeLabel(type: string): string {
  const label = SOURCE_TYPE_LABELS[type]
  if (label) return label
  const m = /^T([0-4])$/.exec(type)
  return m ? `Tier ${m[1]}` : type
}

/** Confidence and Uniqueness columns: blank until the engine computes them (Rule 6). */
function ratioCell(value: number | null | undefined): string {
  if (value == null) return ''
  return value.toFixed(2)
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

const STANDING_STYLES: Record<StandingKey, string> = {
  verified: 'text-green-700',
  unverified: 'text-yellow-700',
  disputed: 'text-orange-700',
  falsified: 'text-red-700 line-through',
  unrecorded: 'text-gray-500',
}

/** Standing cell: what the lifecycle says about this row, and so how much of
 *  its impact the engine counts. Hover gives the consequence. */
function StandingCell({ item }: { item: EvidenceItem }) {
  const meta = STANDINGS[readStanding(item.verificationStatus)]
  return (
    <td
      className={`border border-gray-300 px-2 py-2 text-center align-top text-xs ${STANDING_STYLES[meta.key]}`}
      title={meta.descriptor}
    >
      {meta.label}
    </td>
  )
}

/** The first few words of an argument's label, used to name it in "Bears On". */
function openingWords(text: string, count = 8): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= count) return text.trim()
  return `${words.slice(0, count).join(' ')}…`
}

/** "Finding (Producer, Year)": producer and year fold into the description cell. */
function findingLabel(item: EvidenceItem): string {
  const meta = [item.producer, item.year != null ? String(item.year) : null]
    .filter(Boolean)
    .join(', ')
  return meta ? `${item.description} (${meta})` : item.description
}

/**
 * The "Bears On" cell: the specific argument this evidence bears on, named by
 * its opening words and linking into that argument's own sub-debate, or
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
      <td className="border border-gray-300 px-2 py-2 text-center align-top text-xs font-semibold">
        {sourceTypeLabel(item.evidenceType)}
      </td>
      <StandingCell item={item} />
      <td className="border border-gray-300 px-2 py-2 text-center align-top font-mono text-xs">{ratioCell(item.confidenceScore)}</td>
      <td className="border border-gray-300 px-2 py-2 text-center align-top font-mono text-xs">{linkPct(item.linkageScore)}</td>
      <td className="border border-gray-300 px-2 py-2 text-center align-top font-mono text-xs">{ratioCell(item.uniquenessScore)}</td>
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

  // Retraction exposure: how much of the score drawn from evidence rests on
  // standing nobody has established. Reported only when there is evidence and
  // something actually at risk.
  const exposure = computeBeliefEvidenceExposure(evidence)
  const showExposure = evidence.length > 0 && exposure.exposedPoints >= NEGLIGIBLE_EXPOSURE
  const exposureStyle =
    exposure.exposedShare >= HIGH_EXPOSURE_SHARE
      ? 'bg-yellow-50 border-yellow-300'
      : 'bg-gray-50 border-gray-300'

  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
        <span>&#128202;</span>
        <Link href="/algorithms/evidence-scores" className="text-[var(--accent)] hover:underline">Evidence Ledger</Link>
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-4 italic">
        <strong>Source type</strong> is what kind of thing the finding is, one of the eighteen the
        engine knows, and it sets where the finding&apos;s truth starts before anyone argues it:
        statistics and data with the source cited, primary official record, randomized controlled
        trial, meta-analysis, observational study, historical trend, expert testimony with data,
        expert or social media claim, personal anecdote, common sense or logic, analogy, cultural
        norm, intuition, news report, survey or poll, eyewitness testimony, visual evidence,
        historical artifact (strongest first). Classify what the claim says, not the instrument
        that produced it. A finding with no source type named starts at 0.50 and pulls nothing
        either way; a row still carrying one of the retired four tiers shows it as plain text until
        it is reclassified. A row counts as sign × (2 × Truth − 1) × Confidence × Linkage ×
        Importance × Uniqueness, the same rule as the arguments above, so a finding nobody has
        argued or sourced reads exactly 0; Confidence and Uniqueness stay blank until the engine
        computes them. <strong>Standing</strong> is the verification
        lifecycle: verified rows count in full, unverified and disputed at half, falsified at
        nothing. Format each item as: Finding (Producer, Year). Evidence is data that can fail
        empirically; a reason that can only fail logically is an argument and belongs in the tree
        above, not here. Every item must also name what it <strong>bears on</strong>: a specific
        argument above, identified by its opening words, or this belief directly. Evidence that
        bears on nothing contributes nothing, no matter how true it is.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-green-100 text-center font-semibold px-3 py-2" colSpan={8}>
                ✅ Supporting Evidence
              </th>
              <th className="border border-gray-300 bg-red-100 text-center font-semibold px-3 py-2" colSpan={8}>
                ❌ Weakening Evidence
              </th>
            </tr>
            <tr className="bg-gray-100 text-xs">
              <th className="border border-gray-300 px-2 py-1.5 text-left w-[14%]">Evidence (Producer, Year)</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left w-[8%]">Bears On</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[7%]">Source type</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[5%]">Standing</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[4%]">Confidence</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[4%]">
                <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">Linkage</Link>
              </th>
              <th className="border border-gray-300 px-2 py-1.5 w-[4%]">
                <Link href="/algorithms/unique-scores" className="text-[var(--accent)] hover:underline">Uniqueness</Link>
              </th>
              <th className="border border-gray-300 px-2 py-1.5 w-[4%]">Impact</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left w-[14%]">Evidence (Producer, Year)</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left w-[8%]">Bears On</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[7%]">Source type</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[5%]">Standing</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[4%]">Confidence</th>
              <th className="border border-gray-300 px-2 py-1.5 w-[4%]">
                <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">Linkage</Link>
              </th>
              <th className="border border-gray-300 px-2 py-1.5 w-[4%]">
                <Link href="/algorithms/unique-scores" className="text-[var(--accent)] hover:underline">Uniqueness</Link>
              </th>
              <th className="border border-gray-300 px-2 py-1.5 w-[4%]">Impact</th>
            </tr>
          </thead>
          <tbody>
            {topRows.map(i => (
              <tr key={i}>
                <EvidenceHalf item={supporting[i]} />
                <EvidenceHalf item={weakening[i]} />
              </tr>
            ))}
            <ExpandableRows moreCount={restRows.length} colSpan={16}>
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

      {showExposure && (
        <p className={`text-sm mt-3 px-3 py-2 border rounded ${exposureStyle}`}>
          <strong>Retraction exposure.</strong> {summarizeExposure(exposure)}{' '}
          <Link href="/algorithms/evidence-scores" className="text-[var(--accent)] hover:underline">
            How evidence is weighted
          </Link>
          .
        </p>
      )}
    </section>
  )
}
