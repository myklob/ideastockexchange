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

    // Should return (the per-belief pass cap breaks the cycle) rather than hang.
    const result = await propagateBeliefScores(a.id)
    expect(result).toHaveProperty('updatedBeliefIds')
    expect(Array.isArray(result.updatedArgumentIds)).toBe(true)
  }, 20_000)
})

describe('Converging paths (diamond)', () => {
  it('recomputes the far ancestor after BOTH incoming edges are fresh', async () => {
    // X feeds P1 and P2; P1 (agree) and P2 (disagree) both feed M; M feeds T.
    // M's truth must be computed with both edges refreshed (share 0.5), and
    // that value must reach the M→T edge. A visited-set traversal computed
    // the M→T edge on the P1 path while the P2→M edge was still stale zero,
    // stamping argumentScore 100 and never returning.
    const belief = (statement: string, slug: string) =>
      prisma.belief.create({ data: { slug, statement } })
    const x = await belief('Diamond leaf', 'diamond-x')
    const p1 = await belief('Diamond left parent', 'diamond-p1')
    const p2 = await belief('Diamond right parent', 'diamond-p2')
    const m = await belief('Diamond merge', 'diamond-m')
    const t = await belief('Diamond top', 'diamond-t')

    const edge = (parentBeliefId: number, beliefId: number, side: string) =>
      prisma.argument.create({
        data: { parentBeliefId, beliefId, side, linkageScore: 1.0, importanceScore: 1.0, impactScore: 0 },
      })

    await edge(p1.id, x.id, 'agree')
    await edge(p2.id, x.id, 'agree')
    await edge(m.id, p1.id, 'agree')
    await edge(m.id, p2.id, 'disagree')
    const topEdge = await edge(t.id, m.id, 'agree')

    await propagateBeliefScores(x.id)

    // P1 and P2 each end at truth 1.0 (a single agree child), so M's edges
    // land at +100 / −100 → M's importance-weighted truth is 0.5.
    const top = await prisma.argument.findUnique({ where: { id: topEdge.id } })
    expect(top.argumentScore).toBeCloseTo(50, 5)
    expect(top.impactScore).toBeCloseTo(50, 5)

    const mRow = await prisma.belief.findUnique({ where: { id: m.id } })
    expect(mRow.positivity).toBeCloseTo(0, 5)
  }, 20_000)
})
