/**
 * Linkage Page — scores one linkage: whether X (an argument or piece of
 * evidence) supports or weakens Y (the claim it was placed under). Never
 * whether X or Y is true on its own.
 *
 * The page title IS the linkage question, in full words — no arrow notation
 * anywhere reader-facing. The question is asked at full strength ("would it
 * necessarily support Y?") and the Linkage Score is the answer as a degree.
 *
 * Every linkage score badge on belief pages links here. A dedicated page like
 * this exists because the connection is contested or load-bearing; routine
 * linkages live as rows on the belief page.
 *
 * Audit lock: the linkage score is computed from this page's own argument
 * tree. The Five-Step Check's provisional estimate is a placement-time
 * bracket that the computed score supersedes — never a hand-assigned final.
 *
 * Route: /arguments/[id]/linkage
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { calculateLinkageFromArguments, applyDepthAttenuation } from '@/core/scoring/scoring-engine'
import { formatScore, pairBySide, rankByScore, TABLE_TOP_LIMIT } from '@/features/belief-analysis/lib/ranking'
import ExpandableRows from '@/features/belief-analysis/components/ExpandableRows'
import AddLinkageArgumentForm from './AddLinkageArgumentForm'

interface PageProps {
  params: Promise<{ id: string }>
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

// ─── Linkage score badge ────────────────────────────────────────────────────

function LinkageBadge({ score }: { score: number }) {
  const abs = Math.abs(score)

  let colorClass = 'bg-gray-100 text-gray-700 border-gray-300'
  let label = 'Neutral'

  if (score <= -0.5) {
    colorClass = 'bg-red-100 text-red-800 border-red-400'
    label = 'Contradiction'
  } else if (abs < 0.05) {
    colorClass = 'bg-red-50 text-red-500 border-red-200'
    label = 'Irrelevant'
  } else if (abs < 0.35) {
    colorClass = 'bg-orange-50 text-orange-700 border-orange-300'
    label = 'Weak Link'
  } else if (abs < 0.65) {
    colorClass = 'bg-gray-50 text-gray-700 border-gray-400'
    label = 'Contextual'
  } else if (abs < 0.95) {
    colorClass = 'bg-blue-50 text-blue-800 border-blue-400'
    label = 'Strong Link'
  } else {
    colorClass = 'bg-green-50 text-green-800 border-green-500'
    label = 'Proof'
  }

  return (
    <span className={`inline-flex items-baseline gap-2 px-3 py-1 rounded border ${colorClass}`}>
      <span className="text-lg font-bold font-mono">{score.toFixed(2)}</span>
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </span>
  )
}

// ─── Score formula display ──────────────────────────────────────────────────

function FormulaBreakdown({
  proWeight,
  conWeight,
  score,
  depth,
}: {
  proWeight: number
  conWeight: number
  score: number
  depth: number
}) {
  const attenuated = applyDepthAttenuation(score, depth)
  const agree = proWeight.toFixed(3)
  const disagree = conWeight.toFixed(3)
  const S = score.toFixed(3)
  const Att = attenuated.toFixed(3)

  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-4 my-4 text-sm font-mono">
      <p className="text-gray-500 mb-1 font-sans text-xs uppercase tracking-wide">
        Linkage Score = (Agree total − Disagree total) / (Agree total + Disagree total)
      </p>
      <p>Agree total = {agree}</p>
      <p>Disagree total = {disagree}</p>
      <p>
        Linkage Score = ({agree} − {disagree}) / ({agree} + {disagree}) ={' '}
        <strong className="text-blue-800">{S}</strong>
      </p>
      {depth > 0 && (
        <p className="mt-1 text-gray-600">
          Depth {depth} attenuation: {S} × 0.5^{depth} ={' '}
          <strong className="text-purple-700">{Att}</strong>{' '}
          (effective contribution to parent)
        </p>
      )}
    </div>
  )
}

/**
 * Render-time alias for pattern names stored under their pre-July-2026
 * labels, so old rows display the current plain-words canon.
 */
const PATTERN_RENAMES: Record<string, string> = {
  'Parent-mechanism mismatch': 'Wrong parent',
  'Missing intermediate step': 'Missing step',
  'Scope or scale mismatch': 'Scope mismatch',
}

function patternName(pattern: string | null): string | null {
  if (!pattern) return null
  // Older seeds stored the pattern with an inline description ("Mechanism: X
  // causes Y through a named pathway") — keep only the name before the colon.
  const short = pattern.split(':')[0].trim()
  return PATTERN_RENAMES[short] ?? short
}

// ─── Rephrasings table ──────────────────────────────────────────────────────

interface RephrasingRow {
  id: number
  label: string | null
  text: string
  equivalencyScore: number | null
  linkageScore: number | null
  sortOrder: number
}

/** Drift = linkage under this phrasing minus the canonical linkage. Signed. */
function drift(row: RephrasingRow, canonical: number | null): string | null {
  if (row.linkageScore == null || canonical == null) return null
  const d = row.linkageScore - canonical
  return `${d >= 0 ? '+' : ''}${d.toFixed(2)}`
}

const REPHRASING_PLACEHOLDERS = [
  'Filler-stripped, plain language',
  'Active voice, named actor and date',
  'Mechanism-explicit form',
  'Quantified form, where possible',
  'Scope-narrowed form',
]

function RephrasingsTable({
  title,
  canonicalText,
  canonicalLinkage,
  equivalencyHeader,
  linkageHeader,
  rows,
}: {
  title: string
  canonicalText: string
  canonicalLinkage: number | null
  equivalencyHeader: string
  linkageHeader: string
  rows: RephrasingRow[]
}) {
  const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder)
  const body: Array<RephrasingRow | null> = sorted.length > 0 ? sorted : REPHRASING_PLACEHOLDERS.map(() => null)

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th className={`${TH} w-[6%]`}>#</th>
            <th className={`${TH} w-[54%]`}>Rephrasing</th>
            <th className={`${TH} w-[14%]`}>{equivalencyHeader}</th>
            <th className={`${TH} w-[14%]`}>{linkageHeader}</th>
            <th className={`${TH} w-[12%]`}>Drift</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={TD}>0</td>
            <td className={TD}><strong>{canonicalText}</strong></td>
            <td className={`${TD} font-mono`}>1.00</td>
            <td className={`${TD} font-mono`}>{canonicalLinkage != null ? canonicalLinkage.toFixed(2) : <span>&nbsp;</span>}</td>
            <td className={TD}>—</td>
          </tr>
          {body.map((row, i) => (
            <tr key={row?.id ?? `p${i}`} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className={TD}>{i + 1}</td>
              <td className={TD}>
                {row ? (
                  row.text
                ) : (
                  <span className="text-[var(--muted-foreground)] italic">[{REPHRASING_PLACEHOLDERS[i]}]</span>
                )}
              </td>
              <td className={`${TD} font-mono`}>{row?.equivalencyScore != null ? row.equivalencyScore.toFixed(2) : <span>&nbsp;</span>}</td>
              <td className={`${TD} font-mono`}>{row?.linkageScore != null ? row.linkageScore.toFixed(2) : <span>&nbsp;</span>}</td>
              <td className={`${TD} font-mono`}>{(row && drift(row, canonicalLinkage)) ?? <span>&nbsp;</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Cross-graph tables ─────────────────────────────────────────────────────

interface CrossGraphRow {
  id: number
  statement: string
  slug: string
  linkageScore: number
  argumentScore: number | null
}

function CrossGraphTable({ header, caption, columnHeader, rows }: {
  header: string
  caption: string
  columnHeader: string
  rows: CrossGraphRow[]
}) {
  const { top, rest } = rankByScore(rows, r => r.argumentScore)
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold mb-1">{header}</h3>
      <p className="text-xs text-[var(--muted-foreground)] italic mb-2">{caption}</p>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th className={`${TH} w-[62%]`}>{columnHeader}</th>
            <th className={`${TH} w-[19%] text-center`}>Linkage Score</th>
            <th className={`${TH} w-[19%] text-center`}>Argument Score of that linkage</th>
          </tr>
        </thead>
        <tbody>
          {top.length > 0 ? (
            <>
              {top.map(r => (
                <tr key={r.id}>
                  <td className={TD}>
                    <Link href={`/arguments/${r.id}/linkage`} className="text-[var(--accent)] hover:underline">
                      {r.statement}
                    </Link>
                  </td>
                  <td className={`${TDC} font-mono`}>{r.linkageScore ? r.linkageScore.toFixed(2) : ''}</td>
                  <td className={`${TDC} font-mono`}>{formatScore(r.argumentScore) ?? <span>&nbsp;</span>}</td>
                </tr>
              ))}
              <ExpandableRows moreCount={rest.length} colSpan={3}>
                {rest.map(r => (
                  <tr key={r.id}>
                    <td className={TD}>
                      <Link href={`/arguments/${r.id}/linkage`} className="text-[var(--accent)] hover:underline">
                        {r.statement}
                      </Link>
                    </td>
                    <td className={`${TDC} font-mono`}>{r.linkageScore ? r.linkageScore.toFixed(2) : ''}</td>
                    <td className={`${TDC} font-mono`}>{formatScore(r.argumentScore) ?? <span>&nbsp;</span>}</td>
                  </tr>
                ))}
              </ExpandableRows>
            </>
          ) : (
            <tr>
              <td className={`${TD} text-[var(--muted-foreground)] italic`}>None yet</td>
              <td className={TDC}>&nbsp;</td>
              <td className={TDC}>&nbsp;</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Two-sided scored tables (assumptions, bias risks) ──────────────────────

interface ScoredRow {
  id: number
  text: string
  score: number | null
}

function TwoSidedScoredTable({ leftHeader, rightHeader, left, right }: {
  leftHeader: string
  rightHeader: string
  left: ScoredRow[]
  right: ScoredRow[]
}) {
  const l = rankByScore(left, r => r.score, Infinity).top
  const r = rankByScore(right, x => x.score, Infinity).top
  const pairs = pairBySide(l, r)
  const topPairs = pairs.length > 0 ? pairs.slice(0, TABLE_TOP_LIMIT) : [[null, null] as [ScoredRow | null, ScoredRow | null]]
  const restPairs = pairs.slice(TABLE_TOP_LIMIT)

  const row = ([a, b]: [ScoredRow | null, ScoredRow | null], key: React.Key) => (
    <tr key={key}>
      <td className={TD}>{a?.text ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(a?.score) ?? <span>&nbsp;</span>}</td>
      <td className={TD}>{b?.text ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(b?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )

  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr>
          <th className={`${TH} w-[42%]`}>{leftHeader}</th>
          <th className={`${TH} w-[8%] text-center`}>Score</th>
          <th className={`${TH} w-[42%]`}>{rightHeader}</th>
          <th className={`${TH} w-[8%] text-center`}>Score</th>
        </tr>
      </thead>
      <tbody>
        {topPairs.map((pair, i) => row(pair, pair[0]?.id ?? pair[1]?.id ?? i))}
        <ExpandableRows moreCount={restPairs.length} colSpan={4}>
          {restPairs.map((pair, i) => row(pair, pair[0]?.id ?? pair[1]?.id ?? i))}
        </ExpandableRows>
      </tbody>
    </table>
  )
}

// ─── Failure mode patterns (generic scaffolding when no domain rows exist) ──

const FAILURE_MODE_PATTERNS = [
  {
    mode: 'Wrong parent',
    x: '[Real, well-documented X showing actor A violating constraint type 1]',
    y: '[Y claiming actor A violates constraint type 2]',
    why: '[X and Y run through different mechanisms and belong under different parents. The fluent reading is misleading; the correct parent for X is the type-1 claim.]',
  },
  {
    mode: 'True But Irrelevant',
    x: '[X that is well-evidenced and true]',
    y: '[Y that X is supposed to support]',
    why: '[Why the connection requires assumptions not in evidence.]',
  },
  {
    mode: 'Scope mismatch',
    x: '[X applies to a specific population, time, or context]',
    y: '[Y is a broader or different-scope claim]',
    why: '[Extrapolation requires an unstated similarity assumption.]',
  },
  {
    mode: 'Missing step',
    x: '[X]',
    y: '[Y, where the chain from X to Y has uncertain middle links]',
    why: '[Each missing step compounds uncertainty. Name the steps.]',
  },
  {
    mode: 'Reversal at scale',
    x: '[X is true at small scale]',
    y: '[Y is the same claim at large scale]',
    why: '[The relationship reverses or collapses outside the tested range.]',
  },
]

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function LinkagePage({ params }: PageProps) {
  const { id } = await params
  const argumentId = Number(id)

  if (Number.isNaN(argumentId)) notFound()

  const arg = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      parentBelief: { select: { id: true, slug: true, statement: true } },
      belief: { select: { id: true, slug: true, statement: true } },
      linkageArguments: {
        orderBy: [{ score: { sort: 'desc', nulls: 'last' } }, { sortOrder: 'asc' }, { strength: 'desc' }],
      },
      linkageRephrasings: { orderBy: { sortOrder: 'asc' } },
      linkageFiveStepCheck: true,
      linkageAssumptions: { orderBy: [{ score: { sort: 'desc', nulls: 'last' } }, { sortOrder: 'asc' }] },
      linkageBiasRisks: { orderBy: [{ score: { sort: 'desc', nulls: 'last' } }, { sortOrder: 'asc' }] },
      linkageFailureExamples: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!arg) notFound()

  // Cross-graph views: other claims X is placed under, and other support Y is built on.
  const [otherYs, otherXs] = await Promise.all([
    prisma.argument.findMany({
      where: { beliefId: arg.beliefId, id: { not: arg.id } },
      include: { parentBelief: { select: { slug: true, statement: true } } },
      orderBy: [{ argumentScore: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }],
    }),
    prisma.argument.findMany({
      where: { parentBeliefId: arg.parentBeliefId, id: { not: arg.id } },
      include: { belief: { select: { slug: true, statement: true } } },
      orderBy: [{ argumentScore: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }],
    }),
  ])

  // Draft rows (e.g. detector or fallacy-claim counter-arguments awaiting
  // review) are displayed but never counted: an accusation is an argument,
  // and it moves nothing until published.
  const publishedLinkageArgs = arg.linkageArguments.filter(la => la.status === 'published')
  const proArgs = arg.linkageArguments.filter(la => la.side === 'agree')
  const conArgs = arg.linkageArguments.filter(la => la.side === 'disagree')
  const proWeight = publishedLinkageArgs.filter(la => la.side === 'agree').reduce((s, la) => s + la.strength, 0)
  const conWeight = publishedLinkageArgs.filter(la => la.side === 'disagree').reduce((s, la) => s + la.strength, 0)

  const linkageScore = calculateLinkageFromArguments(
    publishedLinkageArgs.map(la => ({ side: la.side, strength: la.strength }))
  )
  const hasLinkageDebate = publishedLinkageArgs.length > 0
  const canonicalLinkage = hasLinkageDebate ? linkageScore : null

  const direction = arg.side === 'agree' ? 'Supports' : 'Weakens'
  const directionVerb = arg.side === 'agree' ? 'support' : 'weaken'
  const directionVerbs = arg.side === 'agree' ? 'supports' : 'weakens'
  const typeLabel = arg.linkageScoreType === 'ECLS'
    ? 'Evidence-to-Conclusion (ECLS)'
    : 'Argument-to-Conclusion (ACLS)'

  const xLabel = arg.claim ?? arg.belief.statement

  const linkagePairs = pairBySide(proArgs, conArgs)
  const topLinkagePairs = linkagePairs.slice(0, TABLE_TOP_LIMIT)
  const restLinkagePairs = linkagePairs.slice(TABLE_TOP_LIMIT)

  const check = arg.linkageFiveStepCheck
  const flagged = check?.provisionalEstimate != null && check.provisionalEstimate < 0.7

  const xRephrasings = arg.linkageRephrasings.filter(r => r.target === 'x')
  const yRephrasings = arg.linkageRephrasings.filter(r => r.target === 'y')

  const linkageArgCell = (la: (typeof proArgs)[number] | null) => (
    <>
      <td className={TD}>
        {la ? (
          <>
            {la.pattern && <strong>{patternName(la.pattern)}: </strong>}
            {la.statement}
            {la.status !== 'published' && (
              <span className="ml-2 text-xs italic text-gray-500">({la.status} &mdash; not counted)</span>
            )}
          </>
        ) : (
          <span>&nbsp;</span>
        )}
      </td>
      <td className={`${TDC} font-mono`}>{formatScore(la?.score) ?? <span>&nbsp;</span>}</td>
    </>
  )

  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-2 text-sm">
          <Link href="/" className="font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-gray-400">/</span>
          <Link href="/algorithms/linkage-scores" className="text-blue-700 hover:underline">Linkage Scores</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500 truncate max-w-[340px]">This Linkage</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]">
        {/* The title IS the linkage question, in full words — never arrow
            notation. Asked at full strength; the score answers by degree. */}
        <h1 className="text-2xl font-bold leading-tight mb-4">
          If {xLabel} were true, would it necessarily {directionVerb}{' '}
          {arg.parentBelief.statement}?
        </h1>

        <div className="bg-[#f7f9fb] border border-[#b0b8c1] border-l-4 border-l-[#2c5282] px-4 py-3 mb-4 text-sm">
          That is the only question on this page. The <strong>Linkage Score</strong> is the answer,
          as a degree: <strong>1.0</strong> means yes, Y must move if X is true. <strong>0</strong>{' '}
          means no, X can be completely true and Y doesn&apos;t budge. Anything in between means
          yes, but only if the assumptions named below hold. This page never debates whether X or Y
          is true; each has its own page for that.
        </div>

        <div className="text-sm space-y-1 mb-3">
          <p className="flex items-center gap-3 flex-wrap">
            <span><strong>Linkage Score:</strong></span>
            {hasLinkageDebate ? (
              <LinkageBadge score={linkageScore} />
            ) : (
              <span className="text-[var(--muted-foreground)] italic">[pending — computed from the linkage argument tree below]</span>
            )}
            <span>| <strong>Type:</strong>{' '}
              <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">{typeLabel}</Link>
            </span>
            <span>| <strong>Direction:</strong> {direction}</span>
          </p>
          <p>
            <strong>Argument or Evidence X:</strong>{' '}
            <Link href={`/beliefs/${arg.belief.slug}`} className="text-[var(--accent)] hover:underline">
              {arg.belief.statement}
            </Link>
          </p>
          <p>
            <strong>Claim Y:</strong>{' '}
            <Link href={`/beliefs/${arg.parentBelief.slug}`} className="text-[var(--accent)] hover:underline">
              {arg.parentBelief.statement}
            </Link>
          </p>
          <p>
            <strong>Contribution to Y:</strong>{' '}
            {arg.argumentScore != null && hasLinkageDebate ? (
              <span className="font-mono">
                {arg.argumentScore.toFixed(2)} × {linkageScore.toFixed(2)} = {(arg.argumentScore * linkageScore).toFixed(2)}
              </span>
            ) : (
              <span className="text-[var(--muted-foreground)] italic">
                [X argument score] × [linkage score] — computed from{' '}
              </span>
            )}
            {' '}<Link href="/algorithms/reason-rank" className="text-[var(--accent)] hover:underline text-xs">
              sub-argument scores
            </Link>
          </p>
          {arg.scopeNote && (
            <p><strong>Scope note:</strong> {arg.scopeNote}</p>
          )}
        </div>

        <p className="text-xs text-[#777] mb-8">
          A dedicated page like this exists because the connection is contested or load-bearing;
          routine linkages live as rows on the belief page, and every Linkage cell there links to
          its linkage page. Every score is computed by{' '}
          <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">ReasonRank</Link>{' '}
          from the tables below; every table ranks by its score column, and each table shows its
          top five rows and collapses the rest.
        </p>

        {/* ── 🔗 Linkage Arguments ─────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">🔗 Linkage Arguments</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            Every reason below is about whether X {directionVerbs} Y, not about whether X or Y is
            true. A claim that X is false belongs on X&apos;s page; a claim that Y is false belongs
            on Y&apos;s page. Each cell must read as a complete statement that makes sense on its
            own. Rows enter and rank by their own scores.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr>
                  <th className={`${TH} w-[42%] bg-green-100`}>✅ Reasons to agree that X {directionVerbs} Y</th>
                  <th className={`${TH} w-[8%] text-center bg-green-50`}>Score</th>
                  <th className={`${TH} w-[42%] bg-red-100`}>❌ Reasons to disagree that X {directionVerbs} Y</th>
                  <th className={`${TH} w-[8%] text-center bg-red-50`}>Score</th>
                </tr>
              </thead>
              <tbody>
                {linkagePairs.length > 0 ? (
                  <>
                    {topLinkagePairs.map(([p, c], i) => (
                      <tr key={p?.id ?? c?.id ?? i}>
                        {linkageArgCell(p)}
                        {linkageArgCell(c)}
                      </tr>
                    ))}
                    <ExpandableRows moreCount={restLinkagePairs.length} colSpan={4}>
                      {restLinkagePairs.map(([p, c], i) => (
                        <tr key={p?.id ?? c?.id ?? i}>
                          {linkageArgCell(p)}
                          {linkageArgCell(c)}
                        </tr>
                      ))}
                    </ExpandableRows>
                  </>
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-gray-400 italic border border-gray-300">
                      No linkage arguments yet. Add the first one below.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <FormulaBreakdown
            proWeight={proWeight}
            conWeight={conWeight}
            score={linkageScore}
            depth={arg.depth}
          />
          <p className="text-sm text-[var(--muted-foreground)] italic">
            Linkage arguments are scored by the same recursive engine as belief arguments. Each row
            has its own argument score; the Linkage Score for this page is the net aggregate of the
            two sides, (Agree total minus Disagree total) divided by (Agree total plus Disagree
            total), computed by the engine. The engine docs are canonical for the math. See{' '}
            <Link href="/algorithms/reason-rank" className="text-[var(--accent)] hover:underline">
              Argument Scores from Sub-Argument Scores
            </Link>.
          </p>
        </section>

        {/* ── 📝 Equivalent Rephrasings ────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">📝 Equivalent Rephrasings</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            If the same linkage holds across multiple phrasings of X and Y, it is logically robust.
            If it only holds under one phrasing, the linkage is rhetorical, not logical. Equivalency
            scores come from the{' '}
            <Link href="/algorithms/belief-equivalency" className="text-[var(--accent)] hover:underline">Belief Equivalency Engine</Link>;
            if a rephrasing produces a substantially different linkage score, the linkage is fragile
            and that fragility itself is informative.
          </p>
          <RephrasingsTable
            title="Rephrasings of X (the argument or evidence)"
            canonicalText={arg.belief.statement}
            canonicalLinkage={canonicalLinkage}
            equivalencyHeader="Equivalency to canonical X"
            linkageHeader="Linkage to Y under this phrasing"
            rows={xRephrasings}
          />
          <RephrasingsTable
            title="Rephrasings of Y (the claim being supported or weakened)"
            canonicalText={arg.parentBelief.statement}
            canonicalLinkage={canonicalLinkage}
            equivalencyHeader="Equivalency to canonical Y"
            linkageHeader="Linkage from X under this phrasing"
            rows={yRephrasings}
          />
          <p className="text-sm text-[#555]">
            <strong>Drift</strong> is signed and computed by the engine: the linkage score under
            the rephrased version minus the canonical linkage score. Negative drift means the
            linkage weakens under that phrasing; positive drift means it strengthens, which is
            common when a scope-narrowed claim links more tightly than the broad original. High
            drift in either direction means the linkage depends on specific wording. Low drift
            means the linkage survives translation, which is what we want.
          </p>
        </section>

        {/* ── ✅ Five-Step Linkage Check ───────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">✅ Five-Step Linkage Check</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            Every placement of evidence under a claim, or argument under a parent argument, should
            pass through these five steps. This forces transparency: a linkage score is only as
            defensible as the check that produced it.
          </p>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr>
                <th className={`${TH} w-[6%]`}>Step</th>
                <th className={`${TH} w-[30%]`}>Question</th>
                <th className={`${TH} w-[64%]`}>Answer for THIS placement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${TDC} font-bold`}>1</td>
                <td className={TD}>Exact wording of the parent claim Y</td>
                <td className={TD}>{check?.parentWording ?? arg.parentBelief.statement}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className={`${TDC} font-bold`}>2</td>
                <td className={TD}>Exact wording of the evidence or argument X</td>
                <td className={TD}>{check?.sourceWording ?? arg.belief.statement}</td>
              </tr>
              <tr>
                <td className={`${TDC} font-bold`}>3</td>
                <td className={TD}>How X {directionVerbs} Y, in one sentence</td>
                <td className={TD}>
                  {check?.mechanismSentence ?? (
                    <span className="text-[var(--muted-foreground)] italic">
                      If you cannot write this sentence cleanly, X probably doesn&apos;t {directionVerb} Y.
                    </span>
                  )}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className={`${TDC} font-bold`}>4</td>
                <td className={TD}>Provisional linkage estimate (0–1), bracketed</td>
                <td className={TD}>
                  {check?.provisionalEstimate != null ? (
                    <>
                      <span className="font-mono">[{check.provisionalEstimate.toFixed(2)}]</span>
                      {check.dominantFactor && <>, dominant factor: {check.dominantFactor}</>}.{' '}
                    </>
                  ) : (
                    <span className="text-[var(--muted-foreground)] italic">[Estimate], dominant factor: [relevance / network strength / contextual fit / uniqueness]. </span>
                  )}
                  <span className="text-xs text-[#555]">
                    This is the author&apos;s placement-time bracket; the computed score from the
                    linkage argument tree above supersedes it (audit lock).
                  </span>
                </td>
              </tr>
              <tr>
                <td className={`${TDC} font-bold`}>5</td>
                <td className={TD}>Flag if the estimate is below 0.7 (working heuristic)</td>
                <td className={TD}>
                  {check?.provisionalEstimate != null && (
                    flagged ? (
                      <strong className="text-red-700">Flagged. </strong>
                    ) : (
                      <strong className="text-green-700">Not flagged. </strong>
                    )
                  )}
                  {check?.flagNote ?? (
                    <span className="text-[var(--muted-foreground)] italic">
                      If flagged, the action is to find better evidence rather than reach with what is at hand.
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── 🔍 Failure Mode Worked Examples ──────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">🔍 Failure Mode Worked Examples</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            Linkage failures fall into recognizable patterns. Naming them creates muscle memory:
            once you have seen a wrong-parent case dissected, you start spotting them everywhere.
            The rows below hold examples from this linkage&apos;s own domain. Fully worked examples
            with real names live on the canonical{' '}
            <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">Linkage Scores</Link>{' '}
            page, not here, so that one contested illustration never ships inside every linkage page.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr>
                  <th className={`${TH} w-[22%]`}>Failure Mode</th>
                  <th className={`${TH} w-[30%]`}>X (evidence or argument)</th>
                  <th className={`${TH} w-[30%]`}>Y (claim it was placed under)</th>
                  <th className={`${TH} w-[18%]`}>Why the linkage fails</th>
                </tr>
              </thead>
              <tbody>
                {arg.linkageFailureExamples.length > 0
                  ? arg.linkageFailureExamples.map((f, i) => (
                      <tr key={f.id} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className={TD}><strong>{patternName(f.failureMode)}</strong></td>
                        <td className={TD}>{f.xText ?? <span>&nbsp;</span>}</td>
                        <td className={TD}>{f.yText ?? <span>&nbsp;</span>}</td>
                        <td className={TD}>{f.whyFails ?? <span>&nbsp;</span>}</td>
                      </tr>
                    ))
                  : FAILURE_MODE_PATTERNS.map((f, i) => (
                      <tr key={f.mode} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className={TD}><strong>{f.mode}</strong></td>
                        <td className={`${TD} text-[var(--muted-foreground)] italic`}>{f.x}</td>
                        <td className={`${TD} text-[var(--muted-foreground)] italic`}>{f.y}</td>
                        <td className={`${TD} text-[var(--muted-foreground)] italic`}>{f.why}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 🧭 Where Else X and Y Are Used ───────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">🧭 Where Else X and Y Are Used</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            A linkage is a single connection, but the graph it lives in matters. The tables below
            show other places X is used to support claims, and other arguments used to support Y.
            Both tables rank by{' '}
            <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">argument score</Link>,
            descending, which counts evidence quality and logical validity. Every row is itself a
            linkage with its own page like this one; each row links to that page, so the graph is
            navigable in both directions. Vote ratio is a secondary view, never the default and
            never an input to any score.
          </p>
          <CrossGraphTable
            header="Other claims X is placed under"
            caption="Same X, different Y. Useful for spotting whether X is being applied consistently or stretched into places it does not belong."
            columnHeader="Other Y (claim X also supports or weakens)"
            rows={otherYs.map(a => ({
              id: a.id,
              statement: a.parentBelief.statement,
              slug: a.parentBelief.slug,
              linkageScore: a.linkageScore,
              argumentScore: a.argumentScore,
            }))}
          />
          <CrossGraphTable
            header="Other arguments and evidence placed under Y"
            caption="Same Y, different X. Lets the reader see how this linkage compares to the other support Y is built on."
            columnHeader="Other X (argument or evidence supporting or weakening Y)"
            rows={otherXs.map(a => ({
              id: a.id,
              statement: a.claim ?? a.belief.statement,
              slug: a.belief.slug,
              linkageScore: a.linkageScore,
              argumentScore: a.argumentScore,
            }))}
          />
        </section>

        {/* ── 📜 Hidden Assumptions Required ───────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">📜 Hidden Assumptions Required</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            If the Linkage Score is below 1.0, something must be true in addition to X for Y to
            follow. Naming those assumptions is half the work of evaluating any linkage: they are
            the exact distance between this linkage and &ldquo;necessarily.&rdquo; Each assumption
            is itself a claim, scored by its own sub-debate. See{' '}
            <Link href="/algorithms/assumptions" className="text-[var(--accent)] hover:underline">Assumptions</Link>.
          </p>
          <TwoSidedScoredTable
            leftHeader="Required for the linkage to hold"
            rightHeader="Required for the linkage to fail"
            left={arg.linkageAssumptions.filter(a => a.side === 'hold').map(a => ({ id: a.id, text: a.statement, score: a.score }))}
            right={arg.linkageAssumptions.filter(a => a.side === 'fail').map(a => ({ id: a.id, text: a.statement, score: a.score }))}
          />
        </section>

        {/* ── 🧠 Bias Risks Specific to This Linkage ───────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">🧠 Bias Risks Specific to This Linkage</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            Motivated reasoning expresses itself most clearly through linkage placement, not through
            claims themselves. People rarely invent evidence; they place real evidence under
            conclusions it does not support. The wrong-parent failure mode is exactly this pattern.
            Each bias risk is a claim about this linkage&apos;s editors and evidence, scored like
            any other. See the{' '}
            Bias page.
          </p>
          <TwoSidedScoredTable
            leftHeader="Biases that inflate this linkage score"
            rightHeader="Biases that deflate this linkage score"
            left={arg.linkageBiasRisks.filter(b => b.side === 'inflate').map(b => ({ id: b.id, text: b.description, score: b.score }))}
            right={arg.linkageBiasRisks.filter(b => b.side === 'deflate').map(b => ({ id: b.id, text: b.description, score: b.score }))}
          />
        </section>

        {/* ── 📖 Definitions and Scoring Concepts ──────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">📖 Definitions and Scoring Concepts</h2>
          <div className="text-sm space-y-3">
            <p>
              <strong>The linkage question:</strong> If X were true, would it necessarily support
              (or weaken) Y? Asked at full strength; answered by degree.
            </p>
            <p>
              <strong>Linkage Score:</strong> The degree to which the answer to the linkage
              question is yes. Computed as Relevance × Network Strength × Contextual Fit ×
              Uniqueness. The engine docs are canonical for the math. See{' '}
              <Link href="/algorithms/linkage-scores" className="text-[var(--accent)] hover:underline">Linkage Scores</Link>.
            </p>
            <p>
              <strong>Evidence-to-Conclusion (ECLS) vs. Argument-to-Conclusion (ACLS):</strong>{' '}
              Evidence-to-Conclusion Linkage connects a study or data point to a conclusion.
              Argument-to-Conclusion Linkage connects a logical claim to a conclusion. The
              five-step check applies to both.
            </p>
            <p>
              <strong>Contribution to parent:</strong> An argument&apos;s effect on its parent claim
              equals Argument Score × Linkage Score. A perfect argument with a 0.3 linkage
              contributes less than a moderate argument with a 0.9 linkage. See{' '}
              <Link href="/algorithms/reason-rank" className="text-[var(--accent)] hover:underline">
                Argument scores from sub-argument scores
              </Link>.
            </p>
            <p>
              <strong>Equivalency Score:</strong> How similar two phrasings of the same statement
              are. Used in the rephrasings table to test linkage robustness. See the{' '}
              <Link href="/algorithms/belief-equivalency" className="text-[var(--accent)] hover:underline">Belief Equivalency Engine</Link>.
            </p>
            <p>
              <strong>Drift:</strong> The rephrasing&apos;s linkage score minus the canonical
              linkage score, computed by the engine. Signed: negative weakens, positive strengthens.
            </p>
            <p>
              <strong>Audit lock:</strong> Linkage scores are computed from sub-arguments, never
              assigned by hand. The provisional estimate in the Five-Step Check is a placement-time
              bracket, not a score. If the score on this page changes, the change traces to a
              specific edit in the linkage argument tree above.
            </p>
          </div>
        </section>

        {/* ── 🔬 Contribute ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold mb-2">🔬 Contribute</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Add a linkage argument below, or{' '}
            <Link href="/contact" className="text-[var(--accent)] hover:underline">contact me</Link>{' '}
            to add equivalent rephrasings or new failure mode examples.{' '}
            <a
              href="https://github.com/myklob/ideastockexchange"
              className="text-[var(--accent)] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>{' '}
            for the scoring algorithm.
          </p>
          <AddLinkageArgumentForm argumentId={argumentId} />
        </section>
      </main>
    </div>
  )
}
