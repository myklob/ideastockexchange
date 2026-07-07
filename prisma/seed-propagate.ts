/**
 * Final step of the seed chain: run the scoring engine over the whole graph.
 *
 * The seed files hand-set linkage/impact placeholders so the pages render
 * something before the engine runs. This pass replaces every placeholder with
 * engine-computed output — impact = sign × truth × |linkage| × importance ×
 * uniqueness × 100, argumentScore = the child's own tree score — so a fresh
 * dev database starts with live scores, not bracketed illustrations.
 */
import { propagateAllBeliefScores } from '../src/lib/propagate-belief-scores'
import { prisma } from '../src/lib/prisma'

async function main() {
  const result = await propagateAllBeliefScores()
  console.log(
    `Engine pass complete: ${result.updatedArguments} argument edges and ` +
      `${result.updatedBeliefs} beliefs recomputed from ${result.startedFrom} leaves ` +
      `(max depth ${result.maxDepth}).`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
