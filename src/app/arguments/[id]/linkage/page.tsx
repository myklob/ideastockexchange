/**
 * Argument Linkage Debate Page
 *
 * Dedicated page for the nested debate about whether Argument X actually
 * supports Conclusion Y (its parent belief).
 *
 * Every linkage score badge on belief pages links here. Users can view the
 * community debate and add new arguments for or against the link.
 *
 * Route: /arguments/[id]/linkage
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { calculateLinkageFromArguments, applyDepthAttenuation } from '@/core/scoring/scoring-engine'
import AddLinkageArgumentForm from './AddLinkageArgumentForm'

interface PageProps {
  params: Promise<{ id: string }>
}

// ─── Linkage score badge ────────────────────────────────────────────────────

function LinkageBadge({ score }: { score: number }) {
  const pct = (score * 100).toFixed(0)
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
    <div className={`inline-flex flex-col items-center px-4 py-2 rounded border ${colorClass}`}>
      <span className="text-2xl font-bold font-mono">
        {score > 0 ? '+' : ''}{pct}%
      </span>
      <span className="text-xs uppercase tracking-wider mt-0.5">{label}</span>
    </div>
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
  const A = proWeight.toFixed(3)
  const D = conWeight.toFixed(3)
  const S = score.toFixed(3)
  const Att = attenuated.toFixed(3)

  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-4 my-4 text-sm font-mono">
      <p className="text-gray-500 mb-1 font-sans text-xs uppercase tracking-wide">
        Linkage Score formula: (A − D) / (A + D)
      </p>
      <p>A (supporting weight) = {A}</p>
      <p>D (opposing weight) = {D}</p>
      <p>
        LS = ({A} − {D}) / ({A} + {D}) ={' '}
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

// ─── Linkage argument row ───────────────────────────────────────────────────

function LinkageArgumentRow({
  la,
}: {
  la: { id: number; side: string; statement: string; strength: number; createdAt: Date }
}) {
  const isAgree = la.side === 'agree'
  return (
    <tr className={`border-b ${isAgree ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}`}>
      <td className="px-3 py-2 text-sm">{la.statement}</td>
      <td className="px-3 py-2 text-center text-xs font-mono">
        {la.strength.toFixed(2)}
      </td>
    </tr>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function ArgumentLinkageDebatePage({ params }: PageProps) {
  const { id } = await params
  const argumentId = Number(id)

  if (Number.isNaN(argumentId)) notFound()

  const arg = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      parentBelief: { select: { id: true, slug: true, statement: true } },
      belief: { select: { id: true, slug: true, statement: true } },
      linkageArguments: { orderBy: { strength: 'desc' } },
    },
  })

  if (!arg) notFound()

  const proArgs = arg.linkageArguments.filter(la => la.side === 'agree')
  const conArgs = arg.linkageArguments.filter(la => la.side === 'disagree')

  const proWeight = proArgs.reduce((s, la) => s + la.strength, 0)
  const conWeight = conArgs.reduce((s, la) => s + la.strength, 0)

  const linkageScore = calculateLinkageFromArguments(
    arg.linkageArguments.map(la => ({ side: la.side, strength: la.strength }))
  )

  const linkageTypeLabel = arg.linkageScoreType === 'ECLS'
    ? 'ECLS — Evidence-to-Conclusion Linkage'
    : 'ACLS — Argument-to-Conclusion Linkage'

  const maxRows = Math.max(proArgs.length, conArgs.length)

  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-2 text-sm">
          <Link href="/" className="font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-gray-400">/</span>
          <Link href="/beliefs" className="text-blue-700 hover:underline">Beliefs</Link>
          <span className="text-gray-400">/</span>
          <Link
            href={`/beliefs/${arg.parentBelief.slug}`}
            className="text-blue-700 hover:underline truncate max-w-[200px]"
          >
            {arg.parentBelief.statement}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500 truncate max-w-[140px]">Linkage Debate</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
            {linkageTypeLabel} · Depth {arg.depth}
          </p>
          <h1 className="text-2xl font-bold leading-tight mb-2">
            Does this argument actually support its conclusion?
          </h1>

          {/* Claim → Conclusion */}
          <div className="flex flex-col gap-2 my-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <div>
              <span className="text-xs font-semibold uppercase text-blue-500 block mb-0.5">
                Argument (child belief)
              </span>
              <Link
                href={`/beliefs/${arg.belief.slug}`}
                className="font-semibold text-blue-900 hover:underline"
              >
                {arg.belief.statement}
              </Link>
            </div>
            <div className="text-blue-400 text-center text-xl">↓ {arg.side === 'agree' ? 'supports' : 'opposes'}</div>
            <div>
              <span className="text-xs font-semibold uppercase text-blue-500 block mb-0.5">
                Conclusion (parent belief)
              </span>
              <Link
                href={`/beliefs/${arg.parentBelief.slug}`}
                className="font-semibold text-blue-900 hover:underline"
              >
                {arg.parentBelief.statement}
              </Link>
            </div>
          </div>

          {/* Linkage score */}
          <div className="flex items-center gap-4 mt-4">
            <LinkageBadge score={linkageScore} />
            <div className="text-sm text-gray-600">
              <p>
                <strong>Community Linkage Score</strong> — how strongly this argument
                connects to its conclusion, as determined by the nested debate below.
              </p>
              <p className="mt-1">
                <Link
                  href="/algorithms/linkage-scores"
                  className="text-blue-700 hover:underline text-xs"
                >
                  Learn how Linkage Scores work →
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── Formula breakdown ────────────────────────────────────── */}
        <FormulaBreakdown
          proWeight={proWeight}
          conWeight={conWeight}
          score={linkageScore}
          depth={arg.depth}
        />

        {/* ── Debate table ─────────────────────────────────────────── */}
        <h2 className="text-xl font-bold mb-3">
          The Debate: Does the link hold?
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Each row below is an argument for or against the logical connection. The Linkage Score
          is computed from these using <code className="bg-gray-100 px-1 rounded">(A&minus;D)/(A+D)</code>.
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr>
                <th className="border border-gray-300 px-3 py-2 bg-green-100 text-green-800 w-1/2 text-left">
                  Reasons the link IS valid ({proArgs.length})
                </th>
                <th className="border border-gray-300 px-3 py-2 bg-green-50 text-green-700 text-center">
                  Strength
                </th>
                <th className="border border-gray-300 px-3 py-2 bg-red-100 text-red-800 w-1/2 text-left">
                  Reasons the link is NOT valid ({conArgs.length})
                </th>
                <th className="border border-gray-300 px-3 py-2 bg-red-50 text-red-700 text-center">
                  Strength
                </th>
              </tr>
            </thead>
            <tbody>
              {maxRows === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-gray-400 italic">
                    No linkage arguments yet. Add the first one below.
                  </td>
                </tr>
              ) : (
                Array.from({ length: maxRows }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    {/* Pro cell */}
                    <td className="border border-gray-300 px-3 py-2 bg-green-50 text-sm align-top">
                      {proArgs[i]?.statement ?? ''}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 bg-green-50 text-center font-mono text-xs align-top">
                      {proArgs[i] ? proArgs[i].strength.toFixed(2) : ''}
                    </td>
                    {/* Con cell */}
                    <td className="border border-gray-300 px-3 py-2 bg-red-50 text-sm align-top">
                      {conArgs[i]?.statement ?? ''}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 bg-red-50 text-center font-mono text-xs align-top">
                      {conArgs[i] ? conArgs[i].strength.toFixed(2) : ''}
                    </td>
                  </tr>
                ))
              )}
              {/* Totals row */}
              <tr className="bg-gray-100 font-semibold text-sm">
                <td className="px-3 py-2 text-right" colSpan={1}>Total A:</td>
                <td className="px-3 py-2 text-center font-mono text-green-700">
                  {proWeight.toFixed(3)}
                </td>
                <td className="px-3 py-2 text-right" colSpan={1}>Total D:</td>
                <td className="px-3 py-2 text-center font-mono text-red-700">
                  {conWeight.toFixed(3)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Diagnostic callout ──────────────────────────────────── */}
        {Math.abs(linkageScore) >= 0.1 && Math.abs(linkageScore) <= 0.4 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded-r mb-6 text-sm">
            <strong>Missing assumption detected.</strong> This linkage score is in the moderate
            range (40&ndash;60%), which often indicates a hidden bridging assumption. Consider
            adding the unstated premise as a new{' '}
            <Link href="/algorithms/assumptions" className="text-blue-700 hover:underline">
              Assumption node
            </Link>{' '}
            to make the reasoning explicit and testable.
          </div>
        )}

        {Math.abs(linkageScore) < 0.1 && arg.linkageArguments.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 px-4 py-3 rounded-r mb-6 text-sm">
            <strong>True but Irrelevant.</strong> This argument has near-zero logical connection
            to the conclusion. It contributes essentially nothing to the parent belief score,
            regardless of its truth value.
          </div>
        )}

        {/* ── Add argument form ────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold mb-2">Add a Linkage Argument</h2>
          <p className="text-sm text-gray-600 mb-4">
            Does this argument&apos;s claim actually follow from its connection to the parent
            belief? Submit a reason the link is valid or invalid.
          </p>
          <AddLinkageArgumentForm argumentId={argumentId} />
        </section>
      </main>
    </div>
  )
}
