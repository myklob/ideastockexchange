/**
 * Integration tests for three-way (Truth / Importance / Linkage) score
 * propagation through a live SQLite database.
 *
 * Builds an isolated temp database from the committed migration chain, points
 * the Prisma singleton at it (via DATABASE_URL set before any import that pulls
 * `@/lib/prisma`), seeds a small belief graph, and asserts that editing each of
 * the three child-score sources ripples up to the parent argument's impact and
 * the parent belief's net score.
 *
 * Covers acceptance criteria 1–3 and the cycle-safety requirement of Task 6.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve(__dirname, 'tmp-propagation.test.db')

// Module-level handles populated in beforeAll after DATABASE_URL is set, so the
// Prisma singleton binds to the temp database rather than the default dev.db.
/* eslint-disable @typescript-eslint/no-explicit-any */
let prisma: any
let propagateBeliefScores: any
let propagateFromLinkageChange: any
/* eslint-enable @typescript-eslint/no-explicit-any */

// Seeded ids, filled during setup.
let gpId: number          // parent conclusion
let truthChildId: number  // the reason (Truth edge)
let impChildId: number    // the importance sub-belief (Importance edge)
let mainArgId: number     // gp ← truthChild, importance from impChild

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

  // Dynamic imports AFTER DATABASE_URL is set so the singleton binds correctly.
  ;({ prisma } = await import('@/lib/prisma'))
  ;({ propagateBeliefScores, propagateFromLinkageChange } = await import(
    '@/lib/propagate-belief-scores'
  ))

  const belief = (statement: string, slug: string) =>
    prisma.belief.create({ data: { slug, statement } })

  const gp = await belief('Adopt ranked-choice voting', 'rcv-gp')
  const truthChild = await belief('RCV eliminates the spoiler effect', 'rcv-truth')
  const impChild = await belief('The spoiler effect is a major, solvable problem', 'rcv-importance')
  const grand = await belief('Supporting sub-point', 'rcv-grand')
  gpId = gp.id
  truthChildId = truthChild.id
  impChildId = impChild.id

  // Give truthChild a net truth of 1.0 (single agree argument, full impact).
  await prisma.argument.create({
    data: {
      parentBeliefId: truthChild.id,
      beliefId: grand.id,
      side: 'agree',
      linkageScore: 1.0,
      importanceScore: 1.0,
      impactScore: 60,
    },
  })

  // Give impChild a net score of +50 → derived importance 0.75.
  // pro 30, con 10 → overall = (30 - 10) / 40 * 100 = 50.
  await prisma.argument.create({
    data: {
      parentBeliefId: impChild.id,
      beliefId: grand.id,
      side: 'agree',
      linkageScore: 1.0,
      importanceScore: 1.0,
      impactScore: 30,
    },
  })
  await prisma.argument.create({
    data: {
      parentBeliefId: impChild.id,
      beliefId: grand.id,
      side: 'disagree',
      linkageScore: 1.0,
      importanceScore: 1.0,
      impactScore: -10,
    },
  })

  // The main argument under test: gp ← truthChild, importance sourced from impChild.
  const mainArg = await prisma.argument.create({
    data: {
      parentBeliefId: gp.id,
      beliefId: truthChild.id,
      importanceBeliefId: impChild.id,
      side: 'agree',
      linkageScore: 0.8,
      importanceScore: 1.0, // stale manual value; derivation should overwrite it
      impactScore: 0,
    },
  })
  mainArgId = mainArg.id
}, 60_000)

afterAll(async () => {
  if (prisma) await prisma.$disconnect()
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
})

describe('Importance edge: editing the importance sub-belief', () => {
  it('derives importanceScore from the sub-belief and recomputes impact', async () => {
    await propagateBeliefScores(impChildId)

    const arg = await prisma.argument.findUnique({ where: { id: mainArgId } })
    // impChild net score +50 → importance 0.75 (overwrites the stale 1.0).
    expect(arg.importanceScore).toBeCloseTo(0.75, 5)
    // impact = +1.0(truth) × 0.8(linkage) × 0.75(importance) × 100 = 60.
    expect(arg.impactScore).toBeCloseTo(60, 5)
  })

  it('updates the parent belief net score with no manual entry', async () => {
    const gp = await prisma.belief.findUnique({ where: { id: gpId } })
    // gp has a single agree argument (impact 60) → net score +100.
    expect(gp.positivity).toBeCloseTo(100, 5)
  })

  it('reacts when the importance sub-belief is weakened', async () => {
    // Flip the importance debate negative: net score becomes -50 → importance 0.25.
    await prisma.argument.updateMany({
      where: { parentBeliefId: impChildId, side: 'agree' },
      data: { impactScore: 10 },
    })
    await prisma.argument.updateMany({
      where: { parentBeliefId: impChildId, side: 'disagree' },
      data: { impactScore: -30 },
    })

    await propagateBeliefScores(impChildId)

    const arg = await prisma.argument.findUnique({ where: { id: mainArgId } })
    expect(arg.importanceScore).toBeCloseTo(0.25, 5)
    // impact = 1.0 × 0.8 × 0.25 × 100 = 20.
    expect(arg.impactScore).toBeCloseTo(20, 5)
  })
})

describe('Truth edge: editing the reason belief', () => {
  it('re-derives importance and recomputes impact from the truth child', async () => {
    // Restore importance belief to +50 (importance 0.75) for a clean assertion.
    await prisma.argument.updateMany({
      where: { parentBeliefId: impChildId, side: 'agree' },
      data: { impactScore: 30 },
    })
    await prisma.argument.updateMany({
      where: { parentBeliefId: impChildId, side: 'disagree' },
      data: { impactScore: -10 },
    })
    // Re-derive importance via the importance edge first.
    await propagateBeliefScores(impChildId)

    // Now propagate from the Truth child. truthChild truth stays 1.0.
    await propagateBeliefScores(truthChildId)

    const arg = await prisma.argument.findUnique({ where: { id: mainArgId } })
    expect(arg.importanceScore).toBeCloseTo(0.75, 5)
    expect(arg.impactScore).toBeCloseTo(60, 5)
  })
})

describe('Linkage edge: editing the linkage sub-debate', () => {
  it('recomputes linkage from the sub-debate and ripples to impact', async () => {
    // Two "agree" linkage arguments, no opposition → linkage A/(A+D) = 1.0.
    await prisma.linkageArgument.create({
      data: { argumentId: mainArgId, side: 'agree', statement: 'Direct causal mechanism', strength: 1.0 },
    })
    await prisma.linkageArgument.create({
      data: { argumentId: mainArgId, side: 'agree', statement: 'Corroborated by data', strength: 1.0 },
    })

    await propagateFromLinkageChange(mainArgId)

    const arg = await prisma.argument.findUnique({ where: { id: mainArgId } })
    expect(arg.linkageScore).toBeCloseTo(1.0, 5)
    // impact = 1.0(truth) × 1.0(linkage) × 0.75(importance) × 100 = 75.
    expect(arg.impactScore).toBeCloseTo(75, 5)
  })
})

describe('Uniqueness edge: restatements are discounted at scoring time', () => {
  it('persists uniqueness 1.0 and the child tree score for a lone argument', async () => {
    const arg = await prisma.argument.findUnique({ where: { id: mainArgId } })
    // Recomputed several times above; the only same-side sibling context is itself.
    expect(arg.uniquenessScore).toBeCloseTo(1.0, 5)
    // argumentScore = truthChild's own tree score (1.0 → 100), computed not hand-set.
    expect(arg.argumentScore).toBeCloseTo(100, 5)
  })

  it('discounts a near-duplicate same-side sibling and keeps the original whole', async () => {
    // A second reason under gp whose claim restates the first one nearly verbatim.
    const dupChild = await prisma.belief.create({
      data: { slug: 'rcv-truth-dup', statement: 'RCV eliminates the spoiler effect entirely' },
    })
    await prisma.argument.create({
      data: {
        parentBeliefId: gpId,
        beliefId: dupChild.id,
        side: 'agree',
        claim: 'RCV eliminates the spoiler effect',
        linkageScore: 0.8,
        importanceScore: 0.75,
        impactScore: 0,
      },
    })

    await propagateBeliefScores(dupChild.id)

    const args = await prisma.argument.findMany({
      where: { parentBeliefId: gpId, side: 'agree' },
      orderBy: { createdAt: 'asc' },
    })
    const original = args.find((a: { id: number }) => a.id === mainArgId)
    const duplicate = args.find((a: { id: number }) => a.id !== mainArgId)

    // The restatement is heavily discounted; the first statement keeps credit.
    expect(duplicate.uniquenessScore).toBeLessThan(0.5)
    expect(Math.abs(duplicate.impactScore)).toBeLessThan(
      Math.abs(duplicate.linkageScore) * duplicate.importanceScore * 100,
    )
    // Propagating the duplicate's child does not re-touch the original edge,
    // and the original's stored uniqueness stays undiscounted.
    expect(original.uniquenessScore).toBeCloseTo(1.0, 5)
  }, 20_000)

  it('a genuinely novel argument keeps ~full uniqueness', async () => {
    const novelChild = await prisma.belief.create({
      data: { slug: 'rcv-novel', statement: 'Ranked ballots raise turnout among independents' },
    })
    await prisma.argument.create({
      data: {
        parentBeliefId: gpId,
        beliefId: novelChild.id,
        side: 'agree',
        claim: 'Ranked ballots raise turnout among independents',
        linkageScore: 0.6,
        importanceScore: 1.0,
        impactScore: 0,
      },
    })

    await propagateBeliefScores(novelChild.id)

    const novel = await prisma.argument.findFirst({
      where: { parentBeliefId: gpId, beliefId: novelChild.id },
    })
    expect(novel.uniquenessScore).toBeGreaterThan(0.7)
  }, 20_000)
})

describe('Evidence edge: quality-weighted impacts, engine-derived', () => {
  let studyId: number

  it('recomputes EVS and impact from the row inputs, replacing hand-set values', async () => {
    // A verified T1 study with 3 replications; hand-set impact is wrong on purpose.
    const ev = await prisma.evidence.create({
      data: {
        beliefId: truthChildId,
        side: 'supporting',
        description: 'Peer-reviewed study, replicated three times',
        evidenceType: 'T1',
        replicationQuantity: 3,
        conclusionRelevance: 0.7,
        replicationPercentage: 1.0,
        linkageScore: 0.5,
        impactScore: 999,
        verificationStatus: 'VERIFIED',
      },
    })
    studyId = ev.id

    await propagateBeliefScores(truthChildId)

    const fresh = await prisma.evidence.findUnique({ where: { id: ev.id } })
    // EVS = 1.0 × log2(4) × 0.7 × 1.0 = 1.4; impact = 1.4 × 0.5 × 1.0 × 100 = 70.0
    expect(fresh.evsScore).toBeCloseTo(1.4, 5)
    expect(fresh.impactScore).toBeCloseTo(70, 5)
  }, 20_000)

  it('unverified evidence carries half weight until settled', async () => {
    const ev = await prisma.evidence.create({
      data: {
        beliefId: truthChildId,
        side: 'supporting',
        description: 'Same-quality study, not yet verified',
        evidenceType: 'T1',
        replicationQuantity: 3,
        conclusionRelevance: 0.7,
        replicationPercentage: 1.0,
        linkageScore: 0.5,
      },
    })

    await propagateBeliefScores(truthChildId)

    const fresh = await prisma.evidence.findUnique({ where: { id: ev.id } })
    // Same EVS 1.4, but UNVERIFIED factor 0.5 → 35.0
    expect(fresh.impactScore).toBeCloseTo(35, 5)
  }, 20_000)

  it('a retraction zeroes the impact and degrades every dependent conclusion', async () => {
    // Opposing mass must exist for the falsification to move the net ratio.
    await prisma.evidence.create({
      data: {
        beliefId: truthChildId,
        side: 'weakening',
        description: 'Countervailing dataset',
        evidenceType: 'T2',
        replicationQuantity: 1,
        conclusionRelevance: 0.8,
        replicationPercentage: 1.0,
        linkageScore: 0.7,
        verificationStatus: 'VERIFIED',
      },
    })
    await propagateBeliefScores(truthChildId)

    const beliefBefore = await prisma.belief.findUnique({ where: { id: truthChildId } })
    const parentBefore = await prisma.argument.findUnique({ where: { id: mainArgId } })

    await prisma.evidence.update({
      where: { id: studyId },
      data: { verificationStatus: 'FALSIFIED' },
    })
    await propagateBeliefScores(truthChildId)

    const study = await prisma.evidence.findUnique({ where: { id: studyId } })
    expect(study.impactScore).toBe(0)

    const beliefAfter = await prisma.belief.findUnique({ where: { id: truthChildId } })
    expect(beliefAfter.positivity).toBeLessThan(beliefBefore.positivity)

    // The upstream edge that leaned on this belief degrades too.
    const parentAfter = await prisma.argument.findUnique({ where: { id: mainArgId } })
    expect(parentAfter.impactScore).toBeLessThanOrEqual(parentBefore.impactScore)
  }, 20_000)

  it('weakening evidence lowers the belief net through the same channel', async () => {
    const before = await prisma.belief.findUnique({ where: { id: truthChildId } })
    await prisma.evidence.create({
      data: {
        beliefId: truthChildId,
        side: 'weakening',
        description: 'Contradicting official dataset',
        evidenceType: 'T1',
        replicationQuantity: 1,
        conclusionRelevance: 0.9,
        replicationPercentage: 1.0,
        linkageScore: 0.8,
      },
    })

    await propagateBeliefScores(truthChildId)

    const after = await prisma.belief.findUnique({ where: { id: truthChildId } })
    expect(after.positivity).toBeLessThan(before.positivity)
  }, 20_000)
})

describe('Criterion edge: yardsticks are scored sub-debates that weigh evidence', () => {
  let criterionId: number
  let criterionBeliefId: number
  let measuredEvidenceId: number

  it('derives a criterion quality from its sub-debate and weighs linked evidence by it', async () => {
    // The criterion sub-belief: "survey sentiment is a good measure" — argued
    // down hard (net −60 → quality 0.2).
    const criterionBelief = await prisma.belief.create({
      data: { slug: 'sentiment-is-a-good-measure', statement: 'Survey sentiment is a good measure of this question' },
    })
    criterionBeliefId = criterionBelief.id
    const refuter = await prisma.belief.create({
      data: { slug: 'sentiment-measures-perception', statement: 'Sentiment measures perception, not reality' },
    })
    await prisma.argument.create({
      data: {
        parentBeliefId: criterionBelief.id,
        beliefId: refuter.id,
        side: 'disagree',
        linkageScore: 0.8,
        importanceScore: 1.0,
        impactScore: -30,
      },
    })
    await prisma.argument.create({
      data: {
        parentBeliefId: criterionBelief.id,
        beliefId: refuter.id,
        side: 'agree',
        claim: 'cheap to collect at scale',
        linkageScore: 0.5,
        importanceScore: 1.0,
        impactScore: 7.5,
      },
    })

    const criterion = await prisma.objectiveCriteria.create({
      data: {
        beliefId: truthChildId,
        description: 'Survey sentiment about the topic',
        criterionBeliefId: criterionBelief.id,
        totalScore: 0.9, // wrong on purpose; the sub-debate supersedes it
      },
    })
    criterionId = criterion.id

    const measured = await prisma.evidence.create({
      data: {
        beliefId: truthChildId,
        side: 'supporting',
        description: 'Sentiment poll favoring the claim',
        evidenceType: 'T3',
        replicationQuantity: 1,
        conclusionRelevance: 0.8,
        replicationPercentage: 1.0,
        linkageScore: 0.8,
        verificationStatus: 'VERIFIED',
        criterionId: criterion.id,
      },
    })
    measuredEvidenceId = measured.id

    // Settle the criterion sub-belief first, then the page that uses it.
    await propagateBeliefScores(criterionBeliefId)
    await propagateBeliefScores(truthChildId)

    const freshCriterion = await prisma.objectiveCriteria.findUnique({ where: { id: criterionId } })
    // Sub-debate net: (7.5 − 30) / 37.5 × 100 = −60 → quality (−60+100)/200 = 0.2
    expect(freshCriterion.totalScore).toBeCloseTo(0.2, 2)

    const freshEvidence = await prisma.evidence.findUnique({ where: { id: measuredEvidenceId } })
    // EVS = 0.5(T3) × log2(2) × 0.8 × 1.0 = 0.4; unweighted impact would be
    // 0.4 × 0.8 × 100 = 32; the weak yardstick filters it to 32 × 0.2 = 6.4
    expect(freshEvidence.impactScore).toBeCloseTo(6.4, 1)
  }, 20_000)

  it('re-arguing the yardstick re-weighs the evidence and the page that uses it', async () => {
    // The criterion sub-debate improves: a strong agree argument lands.
    const support = await prisma.belief.create({
      data: { slug: 'sentiment-correlates-outcomes', statement: 'Sentiment correlates with measured outcomes here' },
    })
    await prisma.argument.create({
      data: {
        parentBeliefId: criterionBeliefId,
        beliefId: support.id,
        side: 'agree',
        linkageScore: 0.9,
        importanceScore: 1.0,
        impactScore: 45,
      },
    })

    await propagateBeliefScores(criterionBeliefId)

    const freshCriterion = await prisma.objectiveCriteria.findUnique({ where: { id: criterionId } })
    expect(freshCriterion.totalScore).toBeGreaterThan(0.2)

    const freshEvidence = await prisma.evidence.findUnique({ where: { id: measuredEvidenceId } })
    expect(freshEvidence.impactScore).toBeGreaterThan(6.5)
  }, 20_000)
})

describe('Cycle safety', () => {
  it('terminates when beliefs reference each other in a cycle', async () => {
    const a = await prisma.belief.create({ data: { slug: 'cycle-a', statement: 'Belief A' } })
    const b = await prisma.belief.create({ data: { slug: 'cycle-b', statement: 'Belief B' } })

    // A ← B and B ← A : a directed cycle in the argument graph.
    await prisma.argument.create({
      data: { parentBeliefId: a.id, beliefId: b.id, side: 'agree', linkageScore: 0.5, importanceScore: 1.0, impactScore: 0 },
    })
    await prisma.argument.create({
      data: { parentBeliefId: b.id, beliefId: a.id, side: 'agree', linkageScore: 0.5, importanceScore: 1.0, impactScore: 0 },
    })

    // Should return (the visited-set breaks the cycle) rather than hang.
    const result = await propagateBeliefScores(a.id)
    expect(result).toHaveProperty('updatedBeliefIds')
    expect(Array.isArray(result.updatedArgumentIds)).toBe(true)
  }, 20_000)
})
