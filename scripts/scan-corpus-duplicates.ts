/**
 * Corpus-wide redundancy scan — the scale step beyond the per-parent drift
 * guard. The posting flow only compares a new argument against its siblings
 * on the same parent belief, so the classic "scattered" case (the same point
 * made under two different parents) is never caught at the door. This script
 * sweeps every published argument pair ACROSS parents and persists
 * EquivalenceCandidate rows for matches, exactly like ingestion does for
 * siblings: stored, not scored — the uniqueness discount and human reviewers
 * take it from there.
 *
 * Idempotent: existing candidate pairs (either direction) are skipped.
 * Same-parent pairs are skipped too — the drift guard already covers them.
 *
 *   npx tsx scripts/scan-corpus-duplicates.ts             # scan and persist
 *   npx tsx scripts/scan-corpus-duplicates.ts --dry-run   # report only
 */

import { prisma } from '@/lib/prisma'
import { textSimilarity, EQUIVALENCE_CANDIDATE_THRESHOLD } from '@/lib/agent-ingest/similarity'

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const args = await prisma.argument.findMany({
    where: { status: 'published' },
    select: {
      id: true,
      parentBeliefId: true,
      claim: true,
      belief: { select: { statement: true } },
    },
    orderBy: { id: 'asc' },
  })

  const existing = await prisma.equivalenceCandidate.findMany({
    select: { argumentId: true, existingArgumentId: true },
  })
  const seen = new Set(
    existing.flatMap(c => [
      `${c.argumentId}:${c.existingArgumentId}`,
      `${c.existingArgumentId}:${c.argumentId}`,
    ]),
  )

  let compared = 0
  let found = 0
  for (let i = 0; i < args.length; i++) {
    for (let j = i + 1; j < args.length; j++) {
      const a = args[i]
      const b = args[j]
      // Same-parent pairs are the drift guard's jurisdiction.
      if (a.parentBeliefId === b.parentBeliefId) continue
      if (seen.has(`${b.id}:${a.id}`)) continue

      compared++
      const textA = a.claim ?? a.belief.statement
      const textB = b.claim ?? b.belief.statement
      const similarity = textSimilarity(textA, textB)
      if (similarity < EQUIVALENCE_CANDIDATE_THRESHOLD) continue

      found++
      console.log(
        `  cross-parent match (${similarity.toFixed(2)}): #${a.id} "${textA.slice(0, 60)}" ↔ #${b.id} "${textB.slice(0, 60)}"`,
      )
      if (dryRun) continue

      // Newer argument is the "new" side, mirroring the posting-time scan.
      await prisma.equivalenceCandidate.create({
        data: { argumentId: b.id, existingArgumentId: a.id, similarity },
      })
      await prisma.auditLog.create({
        data: {
          action: 'equivalence_candidate',
          targetType: 'Argument',
          targetId: String(b.id),
          rationale:
            `Corpus scan: argument resembles #${a.id} under a different parent ` +
            `(similarity ${similarity.toFixed(2)}). Stored for the engine; not scored by the scan.`,
        },
      })
      seen.add(`${b.id}:${a.id}`)
    }
  }

  console.log(
    `Scanned ${args.length} published arguments (${compared} cross-parent pairs compared): ` +
      `${found} candidate(s) ${dryRun ? 'found (dry run, nothing written)' : 'persisted'}.`,
  )
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
