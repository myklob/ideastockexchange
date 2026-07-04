/**
 * Provenance verification job: for Evidence rows carrying a DOI whose
 * tierVerified is still null, look the DOI up on CrossRef and record the
 * verified tier. This confirms metadata the engine may weight later — it
 * never writes a score.
 *
 *   npx tsx scripts/verify-provenance.ts [--limit 50]
 */

import { prisma } from '@/lib/prisma'
import { lookupDoi, tierForCrossrefType } from '@/lib/agent-ingest/connectors/crossref'

async function main() {
  const limitIdx = process.argv.indexOf('--limit')
  const limit = limitIdx >= 0 ? parseInt(process.argv[limitIdx + 1], 10) : 50

  const unverified = await prisma.evidence.findMany({
    where: { doi: { not: null }, tierVerified: null },
    take: Number.isFinite(limit) && limit > 0 ? limit : 50,
  })
  console.log(`${unverified.length} evidence row(s) with unverified DOIs.`)

  for (const evidence of unverified) {
    const metadata = await lookupDoi(evidence.doi as string)
    if (!metadata) {
      console.log(`  #${evidence.id} doi:${evidence.doi} — did not resolve on CrossRef; left unverified.`)
      continue
    }
    const tier = tierForCrossrefType(metadata.type)
    if (!tier) {
      console.log(`  #${evidence.id} doi:${evidence.doi} — resolved (${metadata.type}); no tier mapping, left unverified.`)
      continue
    }
    await prisma.evidence.update({
      where: { id: evidence.id },
      data: { tierVerified: tier },
    })
    const agrees = evidence.tierClaim === tier ? 'matches claim' : `claim was ${evidence.tierClaim ?? 'unset'}`
    console.log(`  #${evidence.id} doi:${evidence.doi} — verified ${tier} (${agrees}).`)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
