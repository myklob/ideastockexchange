/**
 * The evidence-store bridge: a topic-page ledger row linked to an engine
 * Evidence node derives quality, linkage, and standing from the engine at
 * read time, so the audit-lock promise holds for the ledger, not just for
 * belief scores. Acceptance: falsifying the engine node visibly flips the
 * linked ledger row to FALSIFIED, and the falsification also zeroes that
 * evidence's contribution to its belief's computed score.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve(__dirname, 'tmp-evidence-bridge.test.db')

/* eslint-disable @typescript-eslint/no-explicit-any */
let prisma: any
let getDebateTopic: any
let fetchBeliefById: any
let computeBeliefScores: any
/* eslint-enable @typescript-eslint/no-explicit-any */

let beliefId: number
let engineEvidenceId: number
let ledgerRowId: number

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

  ;({ prisma } = await import('@/lib/prisma'))
  ;({ getDebateTopic } = await import('@/features/debate-topics/db'))
  ;({ fetchBeliefById, computeBeliefScores } = await import(
    '@/features/belief-analysis/data/fetch-belief'
  ))

  const belief = await prisma.belief.create({
    data: { slug: 'bridge-test-belief', statement: 'The bridge test belief' },
  })
  beliefId = belief.id

  const engineEvidence = await prisma.evidence.create({
    data: {
      beliefId,
      side: 'supporting',
      description: 'Peer-reviewed study backing the belief',
      evidenceType: 'T1',
      evsScore: 0.9,
      linkageScore: 0.85,
      impactScore: 40,
      verificationStatus: 'VERIFIED',
    },
  })
  engineEvidenceId = engineEvidence.id

  const topic = await prisma.debateTopic.create({
    data: {
      slug: 'bridge-test-topic',
      title: 'Bridge Test',
      definition: 'A test topic.',
      scope: 'Test scope.',
      evidenceItems: {
        create: [
          {
            side: 'supporting',
            title: 'Bridged row',
            source: 'Journal',
            finding: 'Finding text',
            // Deliberately wrong stored copies: the bridge must override them.
            qualityScore: 10,
            linkage: 0.1,
            standing: 'DISPUTED',
            tier: 'T1',
            argument: 'the claim it bears on',
            engineEvidenceId,
          },
          {
            side: 'weakening',
            title: 'Unlinked seed row',
            source: 'White paper',
            finding: 'Illustration',
            qualityScore: 45,
            linkage: 0.55,
            standing: 'DISPUTED',
            tier: 'T3',
            argument: 'a seed illustration',
          },
        ],
      },
    },
    include: { evidenceItems: { orderBy: { id: 'asc' } } },
  })
  ledgerRowId = topic.evidenceItems[0].id

  await prisma.debatePosition.create({
    data: {
      topicId: topic.id,
      positionScore: 50,
      positionLabel: 'Supportive',
      coreBelief: 'Supportive belief',
      topArgument: 'the claim it bears on',
      evidenceId: ledgerRowId,
    },
  })
})

afterAll(async () => {
  await prisma?.$disconnect()
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
})

describe('evidence bridge: ledger rows derive from the engine node', () => {
  it('a linked row overrides its stored copies with engine values', async () => {
    const topic = await getDebateTopic('bridge-test-topic')
    const bridged = topic.evidenceItems.find((e: { id: number }) => e.id === ledgerRowId)
    expect(bridged.derivedFromEngine).toBe(true)
    expect(bridged.standing).toBe('VERIFIED')
    expect(bridged.linkage).toBeCloseTo(0.85, 5)
    expect(bridged.qualityScore).toBe(90)
  })

  it('an unlinked row keeps its stored seed values', async () => {
    const topic = await getDebateTopic('bridge-test-topic')
    const seed = topic.evidenceItems.find((e: { title: string }) => e.title === 'Unlinked seed row')
    expect(seed.derivedFromEngine).toBe(false)
    expect(seed.standing).toBe('DISPUTED')
    expect(seed.qualityScore).toBe(45)
  })

  it('falsifying the engine node flips the ledger row and zeroes the belief contribution', async () => {
    const before = computeBeliefScores(await fetchBeliefById(beliefId))

    await prisma.evidence.update({
      where: { id: engineEvidenceId },
      data: { verificationStatus: 'FALSIFIED' },
    })

    const topic = await getDebateTopic('bridge-test-topic')
    const bridged = topic.evidenceItems.find((e: { id: number }) => e.id === ledgerRowId)
    expect(bridged.standing).toBe('FALSIFIED')

    // The position row pointing at this ledger row still points at it — the
    // page renders that link struck via the FALSIFIED standing.
    const position = topic.positions.find((p: { positionScore: number }) => p.positionScore === 50)
    expect(position.evidenceId).toBe(ledgerRowId)

    // And the retraction propagates into the belief's own computed score:
    // supporting evidence weight drops to zero.
    const after = computeBeliefScores(await fetchBeliefById(beliefId))
    expect(before.overallScore).toBeGreaterThan(0)
    expect(after.overallScore).toBe(0)
  })

  it('deleting the engine node leaves the ledger row standing (SET NULL)', async () => {
    await prisma.evidence.delete({ where: { id: engineEvidenceId } })
    const topic = await getDebateTopic('bridge-test-topic')
    const row = topic.evidenceItems.find((e: { id: number }) => e.id === ledgerRowId)
    expect(row).toBeTruthy()
    expect(row.engineEvidenceId).toBeUndefined()
    expect(row.derivedFromEngine).toBe(false)
  })
})
