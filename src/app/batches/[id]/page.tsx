import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { HONESTY_LINE } from '@/lib/agent-ingest/contract'

export const dynamic = 'force-dynamic'

interface BatchPageProps {
  params: Promise<{ id: string }>
}

/**
 * One ingestion batch: every claim a synthesized document decomposed into,
 * with placements, five-step checks, and evidence provenance. This page is
 * the pitch to encyclopedia-style projects — your article, exploded into
 * auditable parts.
 */
export default async function BatchPage({ params }: BatchPageProps) {
  const { id } = await params
  const batch = await prisma.ingestBatch.findUnique({
    where: { id },
    include: { agent: { select: { name: true, operator: true } } },
  })
  if (!batch) notFound()

  const claimLogs = await prisma.auditLog.findMany({
    where: { batchId: id, action: 'ingest_claim' },
    orderBy: { createdAt: 'asc' },
  })
  const argumentIds = claimLogs
    .map(log => parseInt(log.targetId, 10))
    .filter(n => Number.isFinite(n))

  const argumentsInBatch = await prisma.argument.findMany({
    where: { id: { in: argumentIds } },
    include: {
      belief: {
        select: {
          id: true, slug: true, statement: true,
          evidence: {
            select: {
              id: true, description: true, sourceUrl: true, doi: true, pmid: true,
              isbn: true, tierClaim: true, tierVerified: true,
            },
          },
        },
      },
      parentBelief: { select: { id: true, slug: true, statement: true } },
      linkageFiveStepCheck: true,
      equivalenceCandidatesAsNew: {
        include: { existingArgument: { include: { belief: { select: { slug: true, statement: true } } } } },
      },
      linkageArguments: { where: { status: 'draft' } },
    },
  })
  const argumentById = new Map(argumentsInBatch.map(a => [a.id, a]))

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <Link href="/batches" className="text-sm text-[var(--accent)] hover:underline">Batches</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-sm font-medium text-[var(--foreground)] truncate">{batch.title}</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">{batch.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-[var(--muted-foreground)] mb-4">
          <span>
            Submitted by <strong>{batch.agent.name}</strong>
            {batch.agent.operator ? ` (operator: ${batch.agent.operator})` : ''}
          </span>
          <span>{batch.createdAt.toISOString().replace('T', ' ').slice(0, 16)}</span>
          {batch.sourceDocumentUrl && (
            <a href={batch.sourceDocumentUrl} className="text-[var(--accent)] hover:underline">
              Source document
            </a>
          )}
        </div>
        <p className="text-xs italic border border-gray-300 bg-gray-50 p-2 mb-6">
          {HONESTY_LINE}
        </p>

        <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">
          Decomposed into {claimLogs.length} {claimLogs.length === 1 ? 'claim' : 'claims'}
        </h2>

        <div className="space-y-4">
          {claimLogs.map(log => {
            const arg = argumentById.get(parseInt(log.targetId, 10))
            if (!arg) return null
            const check = arg.linkageFiveStepCheck
            return (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-sm mb-1">
                  <span className={`font-mono text-xs px-1.5 py-0.5 rounded border mr-2 ${
                    arg.side === 'agree'
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-red-100 border-red-300 text-red-800'
                  }`}>
                    {arg.side === 'agree' ? 'PRO' : 'CON'}
                  </span>
                  <Link href={`/beliefs/${arg.belief.slug}`} className="font-semibold text-[var(--accent)] hover:underline">
                    {arg.belief.statement}
                  </Link>
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mb-2">
                  Placed under{' '}
                  <Link href={`/beliefs/${arg.parentBelief.slug}`} className="text-[var(--accent)] hover:underline">
                    {arg.parentBelief.statement}
                  </Link>
                </p>
                {arg.rationale && (
                  <p className="text-xs mb-2"><strong>Rationale:</strong> {arg.rationale}</p>
                )}
                {check && (
                  <div className="text-xs mb-2 border-l-2 border-gray-300 pl-2 space-y-0.5">
                    <p className="font-semibold">Five-Step Linkage Check</p>
                    {check.parentWording && <p>1. Parent wording: &ldquo;{check.parentWording}&rdquo;</p>}
                    {check.sourceWording && <p>2. Claim wording: &ldquo;{check.sourceWording}&rdquo;</p>}
                    {check.mechanismSentence && <p>3. Mechanism: {check.mechanismSentence}</p>}
                    {check.provisionalEstimate != null && (
                      <p>4. Author bracket: [{check.provisionalEstimate}] — superseded by the engine</p>
                    )}
                    {check.flagNote && <p>5. Flag: {check.flagNote}</p>}
                  </div>
                )}
                {arg.belief.evidence.length > 0 && (
                  <div className="text-xs mb-2">
                    <p className="font-semibold">Evidence provenance</p>
                    <ul className="list-disc ml-4">
                      {arg.belief.evidence.map(e => (
                        <li key={e.id}>
                          {e.sourceUrl ? (
                            <a href={e.sourceUrl} className="text-[var(--accent)] hover:underline">{e.description}</a>
                          ) : (
                            e.description
                          )}
                          {e.doi && <span className="font-mono"> doi:{e.doi}</span>}
                          {e.pmid && <span className="font-mono"> pmid:{e.pmid}</span>}
                          {e.isbn && <span className="font-mono"> isbn:{e.isbn}</span>}
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
                {arg.equivalenceCandidatesAsNew.length > 0 && (
                  <div className="text-xs mb-2 text-amber-800">
                    <p className="font-semibold">Redundancy candidates (stored, not scored)</p>
                    <ul className="list-disc ml-4">
                      {arg.equivalenceCandidatesAsNew.map(c => (
                        <li key={c.id}>
                          Resembles &ldquo;{c.existingArgument.belief.statement}&rdquo; (similarity {c.similarity.toFixed(2)})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {arg.linkageArguments.length > 0 && (
                  <div className="text-xs text-purple-800">
                    <p className="font-semibold">Drafted counter-arguments (detector output, awaiting review)</p>
                    <ul className="list-disc ml-4">
                      {arg.linkageArguments.map(la => (
                        <li key={la.id}>
                          <span className="font-mono">{la.fallacyType}</span> &rarr; {la.targetFactor}: {la.statement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-xs text-[var(--muted-foreground)] mt-6">
          Full move-by-move record on the <Link href="/audit" className="text-[var(--accent)] hover:underline">audit log</Link>.
        </p>
      </main>
    </div>
  )
}
