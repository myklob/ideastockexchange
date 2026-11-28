/**
 * Escalation describes believers, not beliefs. The topic template promises it
 * never enters belief matching: beliefs are grouped on direction, magnitude,
 * and abstraction rung only. Enforced here as a source scan, same pattern as
 * the market firewall: scoring, equivalence, uniqueness, and ingest-matching
 * code must never reference escalation. It may appear only in the debate-topic
 * display layer and media metadata.
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const SRC_ROOT = path.resolve(__dirname, '../../../src')

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : []
  })
}

const ESCALATION = /escalat/i

describe('escalation firewall: an overlay on the page, never a matching coordinate', () => {
  it('no scoring, equivalence, or ingest-matching module references escalation', () => {
    const engineFiles = [
      ...walk(path.join(SRC_ROOT, 'core/scoring')),
      ...walk(path.join(SRC_ROOT, 'core/reasonrank')),
      ...walk(path.join(SRC_ROOT, 'lib/agent-ingest')),
      path.join(SRC_ROOT, 'lib/propagate-belief-scores.ts'),
      path.join(SRC_ROOT, 'lib/reason-rank.ts'),
      path.join(SRC_ROOT, 'lib/truth-score.ts'),
    ].filter(f => fs.existsSync(f))
    expect(engineFiles.length).toBeGreaterThan(3)
    const offenders = engineFiles.filter(f => ESCALATION.test(fs.readFileSync(f, 'utf8')))
    expect(offenders.map(f => path.relative(SRC_ROOT, f))).toEqual([])
  })

  it('inside src/core, escalation appears only in the debate-topic display types', () => {
    const allowed = new Set(['types/debate-topic.ts'])
    const offenders = walk(path.join(SRC_ROOT, 'core'))
      .filter(f => ESCALATION.test(fs.readFileSync(f, 'utf8')))
      .map(f => path.relative(path.join(SRC_ROOT, 'core'), f))
      .filter(f => !allowed.has(f))
    expect(offenders).toEqual([])
  })
})
