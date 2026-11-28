/**
 * Integration tests for the AI-agent ingestion contract, against a live
 * SQLite database built from the committed migration chain.
 *
 * Mock agents:
 *   - the over-claimer  (submits scores: rejected with the audit lock)
 *   - the label-poster  (submits topic-label cells: rejected, named mode)
 *   - the redundancy bot (resubmits paraphrases: EquivalenceCandidates, not
 *     new full-weight arguments)
 *   - the honest synthesizer (full valid batch: round-trips)
 *
 * Invariant regression tests, named after the invariants:
 *   - fallacy detection changes zero score fields
 *   - identical content under different agents produces identical structure
 *   - no ingestion path writes any score column
 *   - every placement has a five-step check row
 *   - any AuditLog batch payload replays against a clean database to the
 *     same structure
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve(__dirname, 'tmp-agent-ingest.test.db')

/* eslint-disable @typescript-eslint/no-explicit-any */
let prisma: any
let runIngest: any
let generateAgentKey: any
let hashAgentKey: any
let authenticateAgentKey: any
let SYSTEM_DETECTOR_AGENT_NAME: string
/* eslint-enable @typescript-eslint/no-explicit-any */

let agentAlphaId: string
let agentBetaId: string
let alphaKey: string

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

const honestPayload = (parentSlug: string, batchTitle = 'Honest synthesis') => ({
  batchTitle,
  sourceDocumentUrl: 'https://example.org/article',
  claims: [
    {
      statement:
        'A negative income tax reduces administrative overhead relative to categorical welfare programs',
      direction: 'pro',
      parentBeliefSlug: parentSlug,
      rationale: 'Extracted from section 3; the source argues consolidation cuts caseworker cost',
      fiveStepCheck: {
        parentWording: 'Universal basic income should be implemented',
        claimWording:
          'A negative income tax reduces administrative overhead relative to categorical welfare programs',
        howItSupports: 'Lower administrative cost removes a standard objection to implementation',
        provisionalEstimate: 0.8,
        flaggedBelowThreshold: false,
      },
      evidence: [
        {
          title: 'Administrative costs of means-tested transfers',
          sourceUrl: 'https://example.org/study',
          doi: '10.1000/xyz123',
          author: 'Doe, J.',
          publicationDate: '2024-01-15',
          tierClaim: 'T1',
        },
      ],
    },
  ],
})

async function createAgent(name: string): Promise<{ id: string; key: string }> {
  const agent = await prisma.agent.create({ data: { name, operator: 'Test Lab' } })
  const key = generateAgentKey()
  await prisma.agentApiKey.create({
    data: { agentId: agent.id, hashedKey: hashAgentKey(key) },
  })
  return { id: agent.id, key }
}

/** Structural fingerprint of everything one batch created, excluding ids,
 *  timestamps, and provenance (agent) columns. */
async function batchStructure(argumentIds: number[]) {
  const rows = await prisma.argument.findMany({
    where: { id: { in: argumentIds } },
    include: {
      belief: { select: { slug: true, statement: true, positivity: true } },
      parentBelief: { select: { slug: true } },
      linkageFiveStepCheck: true,
      linkageArguments: { orderBy: { statement: 'asc' } },
    },
    orderBy: { id: 'asc' },
  })
  const structures = []
  for (const arg of rows) {
    const evidence = await prisma.evidence.findMany({
      where: { beliefId: arg.beliefId },
      orderBy: { description: 'asc' },
    })
    structures.push({
      side: arg.side,
      status: arg.status,
      rationale: arg.rationale,
      claim: arg.claim,
      argumentScore: arg.argumentScore,
      linkageScore: arg.linkageScore,
      impactScore: arg.impactScore,
      importanceScore: arg.importanceScore,
      belief: arg.belief,
      parentSlug: arg.parentBelief.slug,
      fiveStep: arg.linkageFiveStepCheck && {
        parentWording: arg.linkageFiveStepCheck.parentWording,
        sourceWording: arg.linkageFiveStepCheck.sourceWording,
        mechanismSentence: arg.linkageFiveStepCheck.mechanismSentence,
        provisionalEstimate: arg.linkageFiveStepCheck.provisionalEstimate,
        flagNote: arg.linkageFiveStepCheck.flagNote,
      },
      counters: arg.linkageArguments.map((la: { statement: string; status: string; targetFactor: string | null; fallacyType: string | null; score: number | null }) => ({
        statement: la.statement,
        status: la.status,
        targetFactor: la.targetFactor,
        fallacyType: la.fallacyType,
        score: la.score,
      })),
      evidence: evidence.map((e: Record<string, unknown>) => ({
        side: e.side,
        description: e.description,
        sourceUrl: e.sourceUrl,
        doi: e.doi,
        pmid: e.pmid,
        isbn: e.isbn,
        author: e.author,
        publicationDate: e.publicationDate,
        tierClaim: e.tierClaim,
        tierVerified: e.tierVerified,
        evidenceType: e.evidenceType,
        evsScore: e.evsScore,
        linkageScore: e.linkageScore,
        impactScore: e.impactScore,
      })),
    })
  }
  return structures
}

beforeAll(async () => {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
  applyMigrations(DB_PATH)

  process.env.DATABASE_URL = `file:${DB_PATH}`

  ;({ prisma } = await import('@/lib/prisma'))
  ;({ runIngest, SYSTEM_DETECTOR_AGENT_NAME } = await import('@/lib/agent-ingest/ingest'))
  ;({ generateAgentKey, hashAgentKey, authenticateAgentKey } = await import('@/lib/agent-auth'))

  const alpha = await createAgent('mock-agent-alpha')
  const beta = await createAgent('mock-agent-beta')
  agentAlphaId = alpha.id
  agentBetaId = beta.id
  alphaKey = alpha.key
})

afterAll(async () => {
  await prisma?.$disconnect()
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
})

describe('bearer-key auth', () => {
  it('resolves a valid key to its agent and stamps lastUsed', async () => {
    const result = await authenticateAgentKey(`Bearer ${alphaKey}`)
    expect(result.ok).toBe(true)
    expect(result.agent.id).toBe(agentAlphaId)
    const key = await prisma.agentApiKey.findFirst({ where: { agentId: agentAlphaId } })
    expect(key.lastUsed).not.toBeNull()
  })

  it('rejects unknown and missing keys', async () => {
    expect((await authenticateAgentKey('Bearer ise_agent_nope')).ok).toBe(false)
    expect((await authenticateAgentKey(null)).ok).toBe(false)
  })

  it('rejects revoked keys', async () => {
    const gamma = await createAgent('mock-agent-gamma')
    await prisma.agentApiKey.updateMany({ where: { agentId: gamma.id }, data: { revoked: true } })
    const result = await authenticateAgentKey(`Bearer ${gamma.key}`)
    expect(result.ok).toBe(false)
    expect(result.status).toBe(401)
  })

  it('enforces the fixed-window rate limit', async () => {
    const delta = await createAgent('mock-agent-delta')
    process.env.AGENT_RATE_LIMIT_PER_MINUTE = '3'
    try {
      for (let i = 0; i < 3; i++) {
        expect((await authenticateAgentKey(`Bearer ${delta.key}`)).ok).toBe(true)
      }
      const limited = await authenticateAgentKey(`Bearer ${delta.key}`)
      expect(limited.ok).toBe(false)
      expect(limited.status).toBe(429)
    } finally {
      delete process.env.AGENT_RATE_LIMIT_PER_MINUTE
    }
  })
})

describe('the honest synthesizer (happy path)', () => {
  let firstArgumentId: number

  it('round-trips a full valid batch', async () => {
    const result = await runIngest(agentAlphaId, honestPayload('ubi-should-be-implemented'))
    expect(result.ok).toBe(true)
    expect(result.claims).toHaveLength(1)
    firstArgumentId = result.claims[0].argumentId

    const argument = await prisma.argument.findUnique({
      where: { id: firstArgumentId },
      include: { belief: true, parentBelief: true },
    })
    expect(argument.side).toBe('agree')
    expect(argument.rationale).toContain('section 3')
    expect(argument.submittedByAgentId).toBe(agentAlphaId)
    expect(argument.parentBelief.slug).toBe('ubi-should-be-implemented')
  })

  it('invariant: every placement has a five-step check row', async () => {
    const check = await prisma.linkageFiveStepCheck.findUnique({
      where: { argumentId: firstArgumentId },
    })
    expect(check).not.toBeNull()
    expect(check.provisionalEstimate).toBe(0.8)
  })

  it('invariant: no ingestion path writes any score column', async () => {
    const argument = await prisma.argument.findUnique({ where: { id: firstArgumentId } })
    // Pristine schema defaults; nothing agent-supplied.
    expect(argument.argumentScore).toBeNull()
    expect(argument.linkageScore).toBe(0.1)
    expect(argument.impactScore).toBe(0)
    expect(argument.importanceScore).toBe(1.0)

    const evidence = await prisma.evidence.findFirst({
      where: { retrievedByAgentId: agentAlphaId },
    })
    expect(evidence.tierClaim).toBe('T1')
    expect(evidence.tierVerified).toBeNull()
    expect(evidence.evidenceType).toBe('T3') // schema default, NOT the tier claim
    expect(evidence.evsScore).toBe(0)
    expect(evidence.linkageScore).toBe(0.5)
    expect(evidence.impactScore).toBe(0)
  })

  it('writes an audit row for every mutation, with rationales', async () => {
    const logs = await prisma.auditLog.findMany({ where: { agentId: agentAlphaId } })
    const actions = logs.map((l: { action: string }) => l.action)
    for (const expected of ['ingest_batch', 'create_belief', 'ingest_claim', 'linkage_check', 'add_evidence']) {
      expect(actions).toContain(expected)
    }
    for (const log of logs) expect(log.rationale.length).toBeGreaterThan(0)
  })

  it('rejects a batch missing the five-step check, writing nothing', async () => {
    const before = await prisma.argument.count()
    const payload = honestPayload('ubi-should-be-implemented')
    delete (payload.claims[0] as Record<string, unknown>).fiveStepCheck
    const result = await runIngest(agentAlphaId, payload)
    expect(result.ok).toBe(false)
    expect(result.issues[0].mode).toBe('missing-five-step-check')
    expect(await prisma.argument.count()).toBe(before)
  })
})

describe('the over-claimer and the label-poster', () => {
  it('rejects submitted scores with the audit lock and writes nothing', async () => {
    const before = await prisma.auditLog.count()
    const payload = honestPayload('ubi-should-be-implemented') as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
    payload.claims[0].truthScore = 0.95
    const result = await runIngest(agentAlphaId, payload)
    expect(result.ok).toBe(false)
    expect(result.auditLock).toBe(true)
    expect(result.status).toBe(422)
    expect(await prisma.auditLog.count()).toBe(before)
  })

  it('rejects topic-label cells with the named failure mode', async () => {
    const payload = honestPayload('ubi-should-be-implemented')
    payload.claims[0].statement = 'Universal Basic Income'
    const result = await runIngest(agentAlphaId, payload)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i: { mode: string }) => i.mode === 'topic-label-cell')).toBe(true)
  })
})

describe('the redundancy bot', () => {
  it('paraphrase resubmission generates EquivalenceCandidates, not a scored argument', async () => {
    const payload = honestPayload('ubi-should-be-implemented', 'Redundancy bot batch')
    payload.claims[0].statement =
      'Categorical welfare programs carry higher administrative overhead than a negative income tax'
    const result = await runIngest(agentBetaId, payload)
    expect(result.ok).toBe(true)
    expect(result.claims[0].equivalenceCandidates.length).toBeGreaterThan(0)

    const candidates = await prisma.equivalenceCandidate.findMany({
      where: { argumentId: result.claims[0].argumentId },
    })
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates[0].similarity).toBeGreaterThanOrEqual(0.5)

    // Stored, not scored: the new argument still has no computed score.
    const argument = await prisma.argument.findUnique({ where: { id: result.claims[0].argumentId } })
    expect(argument.argumentScore).toBeNull()
  })
})

describe('the fallacy-bait agent', () => {
  it('invariant: fallacy detection changes zero score fields', async () => {
    const payload = honestPayload('fallacy-parent', 'Fallacy bait batch')
    payload.claims[0].statement =
      'Everyone knows the critics of this policy are corrupt liars funded by one study'
    const result = await runIngest(agentAlphaId, payload)
    expect(result.ok).toBe(true)
    expect(result.claims[0].draftedCounterArguments.length).toBeGreaterThan(0)

    // The flagged argument's score fields are byte-identical to a clean one's.
    const flagged = await prisma.argument.findUnique({ where: { id: result.claims[0].argumentId } })
    const clean = await runIngest(agentAlphaId, honestPayload('fallacy-parent', 'Clean control batch'))
    const control = await prisma.argument.findUnique({ where: { id: clean.claims[0].argumentId } })
    expect(flagged.argumentScore).toBe(control.argumentScore)
    expect(flagged.linkageScore).toBe(control.linkageScore)
    expect(flagged.impactScore).toBe(control.impactScore)
    expect(flagged.importanceScore).toBe(control.importanceScore)

    // The detections entered the tree as DRAFT counter-arguments with null
    // scores, authored by the system detector agent.
    const counters = await prisma.linkageArgument.findMany({
      where: { argumentId: result.claims[0].argumentId },
      include: { submittedByAgent: true },
    })
    expect(counters.length).toBe(result.claims[0].draftedCounterArguments.length)
    for (const counter of counters) {
      expect(counter.status).toBe('draft')
      expect(counter.score).toBeNull()
      expect(counter.submittedByAgent.name).toBe(SYSTEM_DETECTOR_AGENT_NAME)
      expect(counter.submittedByAgent.isSystem).toBe(true)
      expect(['relevance', 'logical-validity', 'evidence-quality']).toContain(counter.targetFactor)
    }
  })
})

describe('agent identity is orthogonal to score', () => {
  it('identical payloads under two agent keys produce structurally identical rows', async () => {
    const payload = honestPayload('identity-parent', 'Identity invariant batch')
    const first = await runIngest(agentAlphaId, payload)
    const second = await runIngest(agentBetaId, payload)
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)

    const [firstStructure] = await batchStructure([first.claims[0].argumentId])
    const [secondStructure] = await batchStructure([second.claims[0].argumentId])
    expect(secondStructure).toEqual(firstStructure)

    const firstArg = await prisma.argument.findUnique({ where: { id: first.claims[0].argumentId } })
    const secondArg = await prisma.argument.findUnique({ where: { id: second.claims[0].argumentId } })
    expect(firstArg.submittedByAgentId).toBe(agentAlphaId)
    expect(secondArg.submittedByAgentId).toBe(agentBetaId)
  })
})

describe('replay', () => {
  it('an AuditLog batch payload replays against a clean database to the same structure', async () => {
    // A statement unique to this test: evidence attaches to the claim belief,
    // so a shared statement would fold earlier batches' evidence into the
    // "original" snapshot.
    const payload = honestPayload('replay-parent', 'Replay batch')
    payload.claims[0].statement =
      'Replacing categorical welfare with a negative income tax lowers total administrative spending'
    const original = await runIngest(agentAlphaId, payload)
    expect(original.ok).toBe(true)

    const batchLog = await prisma.auditLog.findFirst({
      where: { batchId: original.batchId, action: 'ingest_batch' },
    })
    expect(batchLog.payload).not.toBeNull()
    const replayPayload = JSON.parse(batchLog.payload)

    const originalStructure = await batchStructure(
      original.claims.map((c: { argumentId: number }) => c.argumentId),
    )

    // Wipe the graph (agents/keys survive; they are provenance, not structure).
    await prisma.auditLog.deleteMany()
    await prisma.equivalenceCandidate.deleteMany()
    await prisma.linkageArgument.deleteMany()
    await prisma.linkageFiveStepCheck.deleteMany()
    await prisma.evidence.deleteMany()
    await prisma.argument.deleteMany()
    await prisma.ingestBatch.deleteMany()
    await prisma.belief.deleteMany()

    const replayed = await runIngest(agentBetaId, replayPayload)
    expect(replayed.ok).toBe(true)
    const replayedStructure = await batchStructure(
      replayed.claims.map((c: { argumentId: number }) => c.argumentId),
    )
    expect(replayedStructure).toEqual(originalStructure)
  })
})
