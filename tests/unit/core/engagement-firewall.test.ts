/**
 * The founding claim of the scoring engine: engagement appears NOWHERE in the
 * calculation. A claim that goes viral gains nothing; a claim that survives
 * scrutiny gains everything. This firewall makes that claim structural, the
 * same way the market firewall enforces "prices never feed scores":
 *   1. Scoring/graph modules never mention an engagement signal.
 *   2. The graph and forum models in the schema never grow engagement columns.
 *   3. Scoring modules never read the forum tables.
 *   4. Inside src/core, engagement tokens appear only in allowlisted
 *      display-only type files.
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const REPO_ROOT = path.resolve(__dirname, '../../..')
const SRC_ROOT = path.join(REPO_ROOT, 'src')

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return /\.(ts|tsx|js)$/.test(entry.name) ? [full] : []
  })
}

// Curated word-boundary token list. Deliberately excludes generic words
// ("like", "share", "click") that appear in ordinary prose and market code —
// LMSR "shares" are equity, not engagement.
const ENGAGEMENT =
  /\b(viewCount|views|likes|upvotes?|downvotes?|reactions?|followers?|trending|popularity|impressions?|watchTime|readerEngagement|socialShares|crowdConsensus|replyCount|karma)\b/

const SCORING_FILES = () =>
  [
    ...walk(path.join(SRC_ROOT, 'core/scoring')),
    ...walk(path.join(SRC_ROOT, 'core/reasonrank')),
    ...walk(path.join(SRC_ROOT, 'lib/agent-ingest')),
    path.join(SRC_ROOT, 'lib/propagate-belief-scores.ts'),
    path.join(SRC_ROOT, 'lib/reason-rank.ts'),
    path.join(SRC_ROOT, 'lib/truth-score.ts'),
    path.join(SRC_ROOT, 'features/belief-analysis/data/fetch-belief.ts'),
    path.join(SRC_ROOT, 'features/belief-analysis/lib/ranking.ts'),
  ].filter(f => fs.existsSync(f))

describe('engagement firewall: virality never enters scoring', () => {
  it('no scoring or graph module references an engagement signal', () => {
    // The fallacy detector names "appeal-to-popularity" in order to PENALIZE
    // it — the one place the word belongs inside the engine.
    const allowed = new Set(['lib/agent-ingest/fallacy-detector.ts'])
    const files = SCORING_FILES()
    expect(files.length).toBeGreaterThan(5)
    const offenders = files
      .filter(f => ENGAGEMENT.test(fs.readFileSync(f, 'utf8')))
      .map(f => path.relative(SRC_ROOT, f))
      .filter(f => !allowed.has(f))
    expect(offenders).toEqual([])
  })

  it('graph and forum models carry no engagement columns', () => {
    const schema = fs.readFileSync(path.join(REPO_ROOT, 'prisma/schema.prisma'), 'utf8')
    const models = ['Belief', 'Argument', 'Evidence', 'ForumPost', 'ForumComment']
    const offenders: string[] = []
    for (const name of models) {
      const match = schema.match(new RegExp(`model ${name} \\{[\\s\\S]*?\\n\\}`))
      expect(match, `model ${name} should exist in schema`).toBeTruthy()
      if (match && ENGAGEMENT.test(match[0])) offenders.push(name)
    }
    expect(offenders).toEqual([])
  })

  it('no scoring module reads the forum tables', () => {
    const FORUM_REFERENCE = /\b(forumPost|forumComment)\b/
    const offenders = SCORING_FILES().filter(f =>
      FORUM_REFERENCE.test(fs.readFileSync(f, 'utf8')),
    )
    expect(offenders.map(f => path.relative(SRC_ROOT, f))).toEqual([])
  })

  it('inside src/core, engagement tokens appear only in allowlisted display types', () => {
    // wikilaw.ts carries upvotes/downvotes on a display-only proposal type
    // rendered by the legal-framework feature; it is never read by scoring.
    const allowed = new Set(['types/wikilaw.ts'])
    const offenders = walk(path.join(SRC_ROOT, 'core'))
      .filter(f => ENGAGEMENT.test(fs.readFileSync(f, 'utf8')))
      .map(f => path.relative(path.join(SRC_ROOT, 'core'), f))
      .filter(f => !allowed.has(f))
    expect(offenders).toEqual([])
  })
})
