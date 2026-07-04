/**
 * Invariant: forum activity is absent from every scoring-adjacent query.
 * The forum is a lobby — nothing in it affects any score, ranking, or
 * (future) market price. This test scans the source tree so a future
 * scoring change that reaches into forum tables fails CI.
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const SRC_ROOT = path.resolve(__dirname, '../../../../src')

const FORUM_REFERENCE = /forumPost|forumComment|ForumPost|ForumComment/
const SCORING_PATH = /scoring|score|reasonrank|propagate|ranking|arbitrage|market/i

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : []
  })
}

describe('forum firewall', () => {
  const allFiles = walk(SRC_ROOT)

  it('no scoring-adjacent module references forum tables', () => {
    const scoringFiles = allFiles.filter(f => {
      const rel = path.relative(SRC_ROOT, f)
      // The forum's own routes/pages are allowed to reference forum tables.
      if (rel.includes('forum') || rel.includes('agent-forum')) return false
      return SCORING_PATH.test(rel)
    })
    expect(scoringFiles.length).toBeGreaterThan(0)

    const offenders = scoringFiles.filter(f => FORUM_REFERENCE.test(fs.readFileSync(f, 'utf8')))
    expect(offenders.map(f => path.relative(SRC_ROOT, f))).toEqual([])
  })

  it('forum routes never touch score columns', () => {
    const forumFiles = allFiles.filter(f =>
      path.relative(SRC_ROOT, f).replace(/\\/g, '/').includes('api/v1/forum'),
    )
    expect(forumFiles.length).toBeGreaterThan(0)

    const scoreWrite = /linkageScore|impactScore|argumentScore|importanceScore|truthScore|evsScore|reasonRank/
    const offenders = forumFiles.filter(f => scoreWrite.test(fs.readFileSync(f, 'utf8')))
    expect(offenders.map(f => path.relative(SRC_ROOT, f))).toEqual([])
  })
})
