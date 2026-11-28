/**
 * Pins the engine's output on the seeded corpus, so a seed or scoring change
 * that silently shifts the numbers quoted in docs and wiki pages fails loudly
 * here instead. The pinned scenario is the corpus's canonical story: the
 * Finland pilot evidence on the UBI belief is falsified, and the retraction
 * propagates.
 *
 * If this test fails after an intentional seed/engine change: update the pins
 * AND every sentence anywhere that quotes the old numbers (docs, wiki pages).
 * The pin exists precisely so that second step cannot be forgotten.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve(__dirname, 'tmp-seed-corpus-pins.test.db')
const REPO_ROOT = path.resolve(__dirname, '../..')

// ── The pins (1-decimal scale; toBeCloseTo precision 0 = ±0.5) ─────────────
const UBI_SLUG = 'universal-basic-income-should-be-implemented'
const UBI_SCORE_FRESH_SEED = 13.1
const UBI_SCORE_AFTER_FINLAND_RETRACTION = 9.6

/* eslint-disable @typescript-eslint/no-explicit-any */
let prisma: any
let propagateAllBeliefScores: any
let propagateBeliefScores: any
let fetchBeliefBySlug: any
let computeBeliefScores: any
/* eslint-enable @typescript-eslint/no-explicit-any */

function applyMigrations(file: string) {
  const db = new Database(file)
  const root = path.resolve(__dirname, '../../prisma/migrations')
  const dirs = fs
    .readdirSync(root)
    .filter(d => fs.existsSync(path.join(root, d, 'migration.sql')))
    .sort()
  for (const d of dirs) {
    db.exec(fs.readFileSync(path.join(root, d, 'migration.sql'), 'utf8'))
  }
  db.close()
}

beforeAll(async () => {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
  applyMigrations(DB_PATH)
  process.env.DATABASE_URL = `file:${DB_PATH}`

  execSync('npx tsx prisma/seed-beliefs.ts', {
    cwd: REPO_ROOT,
    env: { ...process.env, DATABASE_URL: `file:${DB_PATH}` },
    stdio: 'pipe',
  })

  ;({ prisma } = await import('@/lib/prisma'))
  ;({ propagateAllBeliefScores, propagateBeliefScores } = await import(
    '@/lib/propagate-belief-scores'
  ))
  ;({ fetchBeliefBySlug, computeBeliefScores } = await import(
    '@/features/belief-analysis/data/fetch-belief'
  ))

  await propagateAllBeliefScores()
}, 120_000)

afterAll(async () => {
  await prisma?.$disconnect()
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
})

describe('seed corpus pins: the quoted numbers stay true', () => {
  it(`fresh seed + engine pass puts the UBI belief at ${UBI_SCORE_FRESH_SEED}`, async () => {
    const belief = await prisma.belief.findUnique({
      where: { slug: UBI_SLUG },
      select: { positivity: true },
    })
    expect(belief.positivity).toBeCloseTo(UBI_SCORE_FRESH_SEED, 0)

    const computed = computeBeliefScores(await fetchBeliefBySlug(UBI_SLUG))
    expect(computed.overallScore).toBeCloseTo(UBI_SCORE_FRESH_SEED, 0)
  })

  it(`falsifying the Finland pilot drops UBI to ${UBI_SCORE_AFTER_FINLAND_RETRACTION} and records the event`, async () => {
    const finland = await prisma.evidence.findFirst({
      where: { description: { contains: 'Finland' } },
    })
    expect(finland).toBeTruthy()

    await prisma.evidence.update({
      where: { id: finland.id },
      data: { verificationStatus: 'FALSIFIED' },
    })
    await propagateBeliefScores(finland.beliefId, new Set(), 0, 'Finland pilot retraction')

    const belief = await prisma.belief.findUnique({
      where: { slug: UBI_SLUG },
      select: { id: true, positivity: true },
    })
    expect(belief.positivity).toBeCloseTo(UBI_SCORE_AFTER_FINLAND_RETRACTION, 0)
    expect(belief.positivity).toBeLessThan(UBI_SCORE_FRESH_SEED)

    // The accumulation ledger caught the retraction with its trigger.
    const event = await prisma.beliefScoreEvent.findFirst({
      where: { beliefId: belief.id, trigger: 'Finland pilot retraction' },
      orderBy: { id: 'desc' },
    })
    expect(event).toBeTruthy()
    expect(event.scoreAfter).toBeCloseTo(UBI_SCORE_AFTER_FINLAND_RETRACTION, 0)
  })
})
