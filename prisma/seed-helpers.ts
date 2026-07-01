import { prisma } from '../src/lib/prisma'

/**
 * Delete all child rows owned by the given beliefs so a seed can recreate
 * them with createMany. Makes seeds idempotent: rerunning (or retrying after
 * a mid-run failure) replaces rows instead of duplicating argument edges,
 * evidence, and criteria — which would silently double-count belief scores.
 *
 * Deletes in FK-safe order (grandchildren before children).
 */
export async function resetBeliefChildren(beliefIds: number[]): Promise<void> {
  if (beliefIds.length === 0) return
  const ids = { in: beliefIds }

  await prisma.linkageArgument.deleteMany({
    where: { argument: { parentBeliefId: ids } },
  })
  await prisma.mediaQualityArgument.deleteMany({
    where: { mediaResource: { beliefId: ids } },
  })

  await prisma.argument.deleteMany({ where: { parentBeliefId: ids } })
  await prisma.evidence.deleteMany({ where: { beliefId: ids } })
  await prisma.objectiveCriteria.deleteMany({ where: { beliefId: ids } })
  await prisma.assumption.deleteMany({ where: { beliefId: ids } })
  await prisma.compromise.deleteMany({ where: { beliefId: ids } })
  await prisma.obstacle.deleteMany({ where: { beliefId: ids } })
  await prisma.biasEntry.deleteMany({ where: { beliefId: ids } })
  await prisma.mediaResource.deleteMany({ where: { beliefId: ids } })
  await prisma.legalEntry.deleteMany({ where: { beliefId: ids } })
  await prisma.beliefMapping.deleteMany({
    where: { OR: [{ parentBeliefId: ids }, { childBeliefId: ids }] },
  })
  await prisma.similarBelief.deleteMany({ where: { fromBeliefId: ids } })
}
