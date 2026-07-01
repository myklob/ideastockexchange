/**
 * CLI: detect and persist similar-belief edges.
 *
 *   npm run scores:similar [-- --threshold=0.35]
 *
 * Scores every belief pair for equivalency and writes SimilarBelief edges,
 * so parallel phrasings of the same claim are linked instead of running
 * redundant debates. Also runs at the end of `npm run db:seed`.
 */

import { detectSimilarBeliefs, DEFAULT_SIMILARITY_THRESHOLD } from '../src/lib/detect-similar-beliefs'
import { prisma } from '../src/lib/prisma'

async function main() {
  const thresholdArg = process.argv.find(a => a.startsWith('--threshold='))
  const threshold = thresholdArg
    ? Number(thresholdArg.split('=')[1])
    : DEFAULT_SIMILARITY_THRESHOLD

  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw new Error(`Invalid threshold: ${thresholdArg}. Expected a number in [0, 1].`)
  }

  const summary = await detectSimilarBeliefs(threshold)
  console.log('Similar-belief detection complete:')
  console.log(`  Beliefs scanned:   ${summary.beliefCount}`)
  console.log(`  Pairs examined:    ${summary.pairsExamined}`)
  console.log(`  Edges created:     ${summary.edgesCreated}`)
  console.log(`  Edges rescored:    ${summary.edgesUpdated}`)
  if (summary.matches.length > 0) {
    console.log(`  Matches at/above threshold ${threshold}:`)
    for (const m of summary.matches.slice(0, 15)) {
      console.log(
        `    [${m.equivalencyScore.toFixed(2)} ${m.relationship}] ` +
        `#${m.fromBeliefId} "${m.fromStatement}" <-> #${m.toBeliefId} "${m.toStatement}"`,
      )
    }
  } else {
    console.log('  No pairs at/above threshold.')
  }
}

main()
  .catch((e) => {
    console.error('Similar-belief detection failed:', e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
