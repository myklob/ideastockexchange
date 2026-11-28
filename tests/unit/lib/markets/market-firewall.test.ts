/**
 * The absolute rule everything else depends on: market prices and volume
 * never feed back into the scoring engine. Data flows one way — the engine
 * publishes scores, the market settles against them.
 *
 * Enforced here as a source scan in both directions:
 *   1. Market-layer code never WRITES to graph models (Belief, Argument,
 *      Evidence, linkage tables) — it may read them to quote and snapshot.
 *   2. Scoring/graph code never READS market tables. If you ever find
 *      yourself wiring market data back into scoring, stop and re-read the
 *      core invariants.
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const SRC_ROOT = path.resolve(__dirname, '../../../../src')

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : []
  })
}

const MARKET_DIRS = [
  path.join(SRC_ROOT, 'lib/markets'),
  path.join(SRC_ROOT, 'app/api/v1/market'),
  path.join(SRC_ROOT, 'app/api/v1/oracle'),
  path.join(SRC_ROOT, 'app/markets'),
]

// Graph writes look like prisma.<graphModel>.<mutating verb>.
const GRAPH_WRITE = /\.(belief|argument|evidence|linkageArgument|linkageFiveStepCheck|linkageAssumption|linkageVote)\.(create|update|upsert|delete|createMany|updateMany|deleteMany)\b/

// Market reads inside scoring code look like references to market models —
// including the legacy sim layer (LiquidityPool/Share price fields), so the
// older prototype can't leak into scoring unnoticed either.
const MARKET_REFERENCE = /marketContract|marketPosition|marketOrder|marketTrade|priceTick|marketBundle|marginLoan|epochSnapshot|liquidityPool|pricePerShare|yesShares|noShares/i

describe('market firewall: markets read scores, never write them', () => {
  it('no market-layer file writes to a graph model', () => {
    const files = MARKET_DIRS.flatMap(walk)
    expect(files.length).toBeGreaterThan(5)
    const offenders = files.filter(f => GRAPH_WRITE.test(fs.readFileSync(f, 'utf8')))
    expect(offenders.map(f => path.relative(SRC_ROOT, f))).toEqual([])
  })

  it('no scoring or graph module references market tables', () => {
    const scoringFiles = [
      ...walk(path.join(SRC_ROOT, 'core/scoring')),
      ...walk(path.join(SRC_ROOT, 'core/reasonrank')),
      path.join(SRC_ROOT, 'lib/propagate-belief-scores.ts'),
      path.join(SRC_ROOT, 'lib/reason-rank.ts'),
      path.join(SRC_ROOT, 'lib/truth-score.ts'),
      path.join(SRC_ROOT, 'features/belief-analysis/data/fetch-belief.ts'),
      path.join(SRC_ROOT, 'lib/agent-ingest/ingest.ts'),
    ].filter(f => fs.existsSync(f))
    expect(scoringFiles.length).toBeGreaterThan(3)
    const offenders = scoringFiles.filter(f => MARKET_REFERENCE.test(fs.readFileSync(f, 'utf8')))
    expect(offenders.map(f => path.relative(SRC_ROOT, f))).toEqual([])
  })
})
