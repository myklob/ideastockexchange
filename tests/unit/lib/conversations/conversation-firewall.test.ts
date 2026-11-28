/**
 * Invariant: imported conversations are source material, never scoring
 * inputs. Transcripts, messages, and mined candidates must be absent from
 * every scoring-adjacent module, and the conversation write paths must never
 * touch a score column — the only way a conversation changes the graph is
 * integration through the ingestion firewall. Same posture (and same test
 * shape) as the agent-forum firewall.
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const SRC_ROOT = path.resolve(__dirname, '../../../../src')

const CONVERSATION_REFERENCE = /conversationThread|conversationMessage|argumentCandidate/i
const SCORING_PATH = /scoring|score|reasonrank|propagate|ranking|arbitrage|market/i

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : []
  })
}

describe('conversation firewall', () => {
  const allFiles = walk(SRC_ROOT)

  it('no scoring-adjacent module references conversation tables', () => {
    const scoringFiles = allFiles.filter(f => {
      const rel = path.relative(SRC_ROOT, f).replace(/\\/g, '/')
      // The conversation feature's own modules are allowed to reference them.
      if (rel.includes('conversations')) return false
      return SCORING_PATH.test(rel)
    })
    expect(scoringFiles.length).toBeGreaterThan(0)

    const offenders = scoringFiles.filter(f => CONVERSATION_REFERENCE.test(fs.readFileSync(f, 'utf8')))
    expect(offenders.map(f => path.relative(SRC_ROOT, f))).toEqual([])
  })

  it('conversation write paths never touch score columns', () => {
    const writePaths = allFiles.filter(f => {
      const rel = path.relative(SRC_ROOT, f).replace(/\\/g, '/')
      // outline.ts is the read-only organizer — it reads argumentScore to
      // rank rows (Rule 8) and writes nothing.
      return (
        (rel.startsWith('lib/conversations/') && !rel.endsWith('outline.ts')) ||
        rel.includes('api/v1/conversations')
      )
    })
    expect(writePaths.length).toBeGreaterThan(0)

    const scoreWrite = /linkageScore|impactScore|argumentScore|importanceScore|truthScore|evsScore|reasonRank/
    const offenders = writePaths.filter(f => scoreWrite.test(fs.readFileSync(f, 'utf8')))
    expect(offenders.map(f => path.relative(SRC_ROOT, f))).toEqual([])
  })
})
