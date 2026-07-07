/**
 * Score Provenance Page — the derivation of one argument edge's Impact,
 * factor by factor. Every Impact value on a belief page links here.
 *
 * Impact = sign × Truth × |Linkage| × Importance × Uniqueness × 100
 *
 * Each factor is itself a doorway into the sub-debate that produced it:
 * Truth is the child belief's own tree (click through to argue it), Linkage
 * has its own debate page, Importance is sourced from a dedicated sub-belief
 * when one exists, and Uniqueness shows exactly which earlier same-side
 * arguments this one overlaps. Nothing on this page is hand-assigned — it is
 * a read-only audit of engine output (Rule 6), and the way to change any
 * number is to win the sub-debate behind it.
 *
 * Route: /arguments/[id]/score
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { computeArgumentImpactScore } from '@/core/scoring/scoring-engine'
import { mechanicalSimilarity } from '@/core/scoring/duplication-scoring'

interface PageProps {
  params: Promise<{ id: string }>
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center font-mono text-sm'

function fmt(v: number | null | undefined, digits = 2): string {
  if (v == null) return ''
  return v.toFixed(digits)
}

export default async function ArgumentScorePage({ params }: PageProps) {
  const { id } = await params
  const argumentId = Number(id)
  if (!Number.isInteger(argumentId)) notFound()

  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      parentBelief: { select: { id: true, slug: true, statement: true } },
      belief: { select: { id: true, slug: true, statement: true, positivity: true } },
      importanceBelief: { select: { id: true, slug: true, statement: true } },
      linkageArguments: { select: { id: true } },
    },
  })
  if (!argument) notFound()

  // The uniqueness trace: which earlier same-side siblings does this argument
  // overlap, and by how much? Recomputed live with the same similarity the
  // engine uses, so the audit always matches the method.
  const siblings = await prisma.argument.findMany({
    where: {
      parentBeliefId: argument.parentBeliefId,
      side: argument.side,
      status: 'published',
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      claim: true,
      createdAt: true,
      belief: { select: { slug: true, statement: true } },
    },
  })
  const ownIndex = siblings.findIndex((s) => s.id === argument.id)
  const ownText =
    argument.claim ?? argument.belief.statement
  const earlier = ownIndex >= 0 ? siblings.slice(0, ownIndex) : []
  const overlaps = earlier
    .map((s) => ({
      id: s.id,
      label: s.claim ?? s.belief.statement,
      slug: s.belief.slug,
      similarity: mechanicalSimilarity(ownText, s.claim ?? s.belief.statement),
    }))
    .sort((a, b) => b.similarity - a.similarity)

  const truth = argument.argumentScore != null ? argument.argumentScore / 100 : null
  const uniqueness = argument.uniquenessScore
  const sign = argument.side === 'agree' ? 1 : -1

  // Recompute the product from the stored factors so drift is visible.
  const recomputed =
    truth != null
      ? computeArgumentImpactScore(
          argument.side,
          truth,
          argument.linkageScore,
          argument.importanceScore,
          uniqueness ?? 1,
        )
      : null
  const drifted = recomputed != null && Math.abs(recomputed - argument.impactScore) > 0.05

  const label = argument.claim ?? argument.belief.statement

  return (
    <div className="max-w-[960px] mx-auto px-4 py-8">
      <nav className="text-sm text-[var(--muted-foreground)] mb-6">
        <Link href="/beliefs" className="text-[var(--accent)] hover:underline">Beliefs</Link>
        {' › '}
        <Link href={`/beliefs/${argument.parentBelief.slug}`} className="text-[var(--accent)] hover:underline">
          {argument.parentBelief.statement}
        </Link>
        {' › '}
        <span>Impact provenance</span>
      </nav>

      <h1 className="text-2xl font-bold mb-2">How this impact was computed</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        The {argument.side === 'agree' ? 'reason to agree' : 'reason to disagree'}{' '}
        &ldquo;{label}&rdquo; contributes{' '}
        <strong className="font-mono">
          {argument.impactScore >= 0 ? '+' : ''}{argument.impactScore.toFixed(1)}
        </strong>{' '}
        to{' '}
        <Link href={`/beliefs/${argument.parentBelief.slug}`} className="text-[var(--accent)] hover:underline">
          {argument.parentBelief.statement}
        </Link>
        . Every factor below is a doorway: click it to enter the sub-debate that
        produced it, post evidence there, and this number — and every conclusion
        that depends on it — updates.
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={TH}>Factor</th>
              <th className={`${TH} text-center w-[12%]`}>Value</th>
              <th className={TH}>Where it comes from</th>
              <th className={`${TH} w-[24%]`}>Argue with it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}><strong>Truth</strong> (Argument Score)</td>
              <td className={TDC}>{truth != null ? fmt(truth) : ''}</td>
              <td className={TD}>
                The child belief&apos;s own tree score: how well &ldquo;{argument.belief.statement}&rdquo;
                holds up against its own reasons to agree and disagree.
                {truth == null && (
                  <span className="italic text-[var(--muted-foreground)]">
                    {' '}Not yet computed — the engine fills this on the next propagation pass.
                  </span>
                )}
              </td>
              <td className={TD}>
                <Link href={`/beliefs/${argument.belief.slug}`} className="text-[var(--accent)] hover:underline">
                  Open the sub-debate
                </Link>
              </td>
            </tr>
            <tr>
              <td className={TD}><strong>Linkage</strong></td>
              <td className={TDC}>{fmt(argument.linkageScore)}</td>
              <td className={TD}>
                If the argument were true, how much would it actually support the
                conclusion? Computed from this edge&apos;s own linkage debate
                ({argument.linkageArguments.length} linkage argument{argument.linkageArguments.length === 1 ? '' : 's'} so far).
              </td>
              <td className={TD}>
                <Link href={`/arguments/${argument.id}/linkage`} className="text-[var(--accent)] hover:underline">
                  Debate this linkage
                </Link>
              </td>
            </tr>
            <tr>
              <td className={TD}><strong>Importance</strong></td>
              <td className={TDC}>{fmt(argument.importanceScore)}</td>
              <td className={TD}>
                {argument.importanceBelief ? (
                  <>
                    Derived from the net score of the dedicated importance sub-belief
                    &ldquo;{argument.importanceBelief.statement}&rdquo; — the live debate
                    about whether this argument matters.
                  </>
                ) : (
                  <>
                    Placement-time weight. No importance sub-belief is attached yet, so
                    this factor is not yet debatable — attaching one turns it into a
                    live sub-debate.
                  </>
                )}
              </td>
              <td className={TD}>
                {argument.importanceBelief ? (
                  <Link href={`/beliefs/${argument.importanceBelief.slug}`} className="text-[var(--accent)] hover:underline">
                    Open the importance debate
                  </Link>
                ) : (
                  <Link href="/algorithms/importance-score" className="text-[var(--accent)] hover:underline">
                    How importance works
                  </Link>
                )}
              </td>
            </tr>
            <tr>
              <td className={TD}><strong>Uniqueness</strong></td>
              <td className={TDC}>{fmt(uniqueness)}</td>
              <td className={TD}>
                How much new signal this argument adds versus the {argument.side === 'agree' ? 'agree' : 'disagree'}-side
                arguments that were there first. A 90% restatement contributes ~10% of
                its weight — nobody wins by making one point five different ways.
                {uniqueness == null && (
                  <span className="italic text-[var(--muted-foreground)]">
                    {' '}Not yet computed — the engine fills this on the next propagation pass.
                  </span>
                )}
              </td>
              <td className={TD}>
                <Link href="/algorithms/unique-scores" className="text-[var(--accent)] hover:underline">
                  How uniqueness works
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="text-sm p-3 bg-gray-100 border border-gray-300 mb-8 font-mono">
        Impact = {sign > 0 ? '+1' : '−1'} × {truth != null ? fmt(truth) : 'truth'} ×{' '}
        {fmt(Math.abs(argument.linkageScore))} × {fmt(argument.importanceScore)} ×{' '}
        {uniqueness != null ? fmt(uniqueness) : '1.00'} × 100 ={' '}
        <strong>{recomputed != null ? `${recomputed >= 0 ? '+' : ''}${recomputed.toFixed(1)}` : '[pending]'}</strong>
        {drifted && (
          <span className="block mt-1 not-italic font-sans text-[var(--muted-foreground)]">
            Stored impact is {argument.impactScore.toFixed(1)} — the graph changed since the
            last engine pass; the next propagation reconciles them.
          </span>
        )}
      </div>

      <h2 className="text-lg font-bold mb-2">Uniqueness trace</h2>
      {earlier.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)] mb-8">
          This is the earliest {argument.side === 'agree' ? 'agree' : 'disagree'}-side argument on
          its parent — there is nothing before it to overlap, so it keeps full credit.
        </p>
      ) : (
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr>
                <th className={TH}>Earlier same-side argument</th>
                <th className={`${TH} text-center w-[16%]`}>Similarity</th>
              </tr>
            </thead>
            <tbody>
              {overlaps.map((o) => (
                <tr key={o.id}>
                  <td className={TD}>
                    <Link href={`/beliefs/${o.slug}`} className="text-[var(--accent)] hover:underline">
                      {o.label}
                    </Link>
                  </td>
                  <td className={TDC}>{Math.round(o.similarity * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            Uniqueness = 1 − the highest similarity above. The earliest statement of a
            point keeps full credit; later restatements are discounted.
          </p>
        </div>
      )}

      <div className="text-sm p-3 border border-gray-300 bg-gray-50">
        <p className="font-semibold mb-1">Challenge a number</p>
        <p>
          Scores on this page are engine output, never hand-assigned. To move one:
          add a reason on the{' '}
          <Link href={`/beliefs/${argument.belief.slug}`} className="text-[var(--accent)] hover:underline">
            child belief&apos;s page
          </Link>
          , post a linkage argument on{' '}
          <Link href={`/arguments/${argument.id}/linkage`} className="text-[var(--accent)] hover:underline">
            the linkage page
          </Link>
          , or read{' '}
          <Link href="/algorithms/reason-rank" className="text-[var(--accent)] hover:underline">
            how the ranking works
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
