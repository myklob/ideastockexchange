/**
 * CLI: recompute every stored score from its formula.
 *
 *   npm run scores:recompute
 *
 * Runs the leaf pass (Evidence EVS, ObjectiveCriteria totals) then the
 * bottom-up graph propagation (argument impact/argumentScore, belief
 * positivity/stability). Safe to run any time; also runs at the end of
 * `npm run db:seed` so seeded data is always formula-consistent.
 */

import { recomputeAllScores } from '../src/lib/recompute-all-scores'
import { prisma } from '../src/lib/prisma'

async function main() {
  const summary = await recomputeAllScores()
  console.log('Score recomputation complete:')
  console.log(`  Evidence EVS updated:        ${summary.evidenceUpdated}`)
  console.log(`  Objective criteria updated:  ${summary.criteriaUpdated}`)
  console.log(`  Leaf beliefs propagated:     ${summary.startBeliefCount}`)
  console.log(`  Argument scores rewritten:   ${summary.totalUpdatedArguments}`)
  console.log(`  Belief scores rewritten:     ${summary.totalUpdatedBeliefs}`)
  console.log(`  Max propagation depth:       ${summary.maxDepth}`)
}

main()
  .catch((e) => {
    console.error('Score recomputation failed:', e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
