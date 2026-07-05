// The show-your-work firewall. One entry point turns a validated batch into
// stored structure: Belief / Argument / Evidence / LinkageFiveStepCheck /
// EquivalenceCandidate / draft counter-arguments / AuditLog rows.
//
// Invariants enforced here:
//   - Ingestion never writes scores. No score column is ever passed; the only
//     numeric estimate stored is the five-step author bracket.
//   - Agent identity is orthogonal to score: agentId lands only in provenance
//     columns, so identical payloads from different agents produce
//     structurally identical rows.
//   - Every placement carries a completed Five-Step Linkage Check.
//   - Redundancy is stored (EquivalenceCandidate), not scored.
//   - Fallacy detections become draft counter-arguments, never penalties.
//   - Every mutation gets an AuditLog row with the mandatory rationale, and
//     the batch row stores the full payload for replay.

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { validateIngestPayload } from './validate-claim'
import { textSimilarity, EQUIVALENCE_CANDIDATE_THRESHOLD } from './similarity'
import { detectFallacies } from './fallacy-detector'
import { slugify, deSlug } from './slug'
import { FAILURE_MODES, type IngestClaimInput, type ValidationIssue } from './contract'
import { isGraphFrozen, GRAPH_FREEZE_MESSAGE } from '@/lib/markets/epoch'

type Tx = Prisma.TransactionClient

export const SYSTEM_DETECTOR_AGENT_NAME = 'system:fallacy-detector'

export interface IngestedClaimResult {
  statement: string
  beliefId: number
  beliefSlug: string
  parentBeliefId: number
  parentBeliefSlug: string
  argumentId: number
  evidenceIds: number[]
  equivalenceCandidates: { existingArgumentId: number; similarity: number }[]
  draftedCounterArguments: { id: number; fallacyType: string; targetFactor: string }[]
}

export type IngestOutcome =
  | { ok: true; batchId: string; claims: IngestedClaimResult[] }
  | { ok: false; status: number; issues: ValidationIssue[]; auditLock?: boolean }

async function audit(
  tx: Tx,
  row: {
    agentId: string | null
    batchId: string | null
    action: string
    targetType: string
    targetId: string | number
    rationale: string
    payload?: unknown
  },
) {
  await tx.auditLog.create({
    data: {
      agentId: row.agentId,
      batchId: row.batchId,
      action: row.action,
      targetType: row.targetType,
      targetId: String(row.targetId),
      rationale: row.rationale,
      payload: row.payload === undefined ? null : JSON.stringify(row.payload),
    },
  })
}

async function ensureSystemDetectorAgent(tx: Tx) {
  const existing = await tx.agent.findUnique({ where: { name: SYSTEM_DETECTOR_AGENT_NAME } })
  if (existing) return existing
  return tx.agent.create({
    data: {
      name: SYSTEM_DETECTOR_AGENT_NAME,
      operator: 'Idea Stock Exchange',
      description:
        'Automated fallacy detector. Drafts counter-arguments that enter the tree ' +
        'and get scored like anything else. Never docks a score.',
      isSystem: true,
    },
  })
}

async function resolveBeliefBySlug(tx: Tx, slug: string, statement?: string) {
  const existing = await tx.belief.findUnique({ where: { slug } })
  if (existing) return { belief: existing, created: false }
  const belief = await tx.belief.create({
    data: { slug, statement: statement ?? deSlug(slug) },
  })
  return { belief, created: true }
}

async function ingestClaim(
  tx: Tx,
  agentId: string,
  batchId: string,
  claim: IngestClaimInput,
): Promise<IngestedClaimResult> {
  const parentResolution = await resolveBeliefBySlug(tx, claim.parentBeliefSlug.trim())
  const parent = parentResolution.belief
  if (parentResolution.created) {
    await audit(tx, {
      agentId, batchId,
      action: 'create_belief',
      targetType: 'Belief',
      targetId: parent.id,
      rationale: `Stub parent belief created for slug "${parent.slug}"; statement pending refinement.`,
    })
  }

  const statement = claim.statement.trim()
  const claimResolution = await resolveBeliefBySlug(tx, slugify(statement), statement)
  const claimBelief = claimResolution.belief
  if (claimResolution.created) {
    await audit(tx, {
      agentId, batchId,
      action: 'create_belief',
      targetType: 'Belief',
      targetId: claimBelief.id,
      rationale: claim.rationale,
    })
  }

  // Siblings BEFORE this argument exists, for the redundancy scan below.
  const siblings = await tx.argument.findMany({
    where: { parentBeliefId: parent.id },
    include: { belief: { select: { statement: true } } },
  })

  // No score field is passed: linkage/impact/importance stay at schema
  // defaults and argumentScore stays null (bracketed in the UI, Rule 6).
  const argument = await tx.argument.create({
    data: {
      parentBeliefId: parent.id,
      beliefId: claimBelief.id,
      side: claim.direction === 'pro' ? 'agree' : 'disagree',
      rationale: claim.rationale,
      submittedByAgentId: agentId,
    },
  })
  await audit(tx, {
    agentId, batchId,
    action: 'ingest_claim',
    targetType: 'Argument',
    targetId: argument.id,
    rationale: claim.rationale,
    payload: { statement, direction: claim.direction, parentBeliefSlug: claim.parentBeliefSlug },
  })

  const check = claim.fiveStepCheck
  await tx.linkageFiveStepCheck.create({
    data: {
      argumentId: argument.id,
      parentWording: check.parentWording,
      sourceWording: check.claimWording,
      mechanismSentence: check.howItSupports,
      provisionalEstimate: check.provisionalEstimate,
      flagNote: check.flaggedBelowThreshold
        ? (check.flagNote ?? 'Flagged below threshold by the submitting agent: find better evidence rather than reach.')
        : check.flagNote ?? null,
    },
  })
  await audit(tx, {
    agentId, batchId,
    action: 'linkage_check',
    targetType: 'LinkageFiveStepCheck',
    targetId: argument.id,
    rationale: check.howItSupports,
  })

  const evidenceIds: number[] = []
  for (const e of claim.evidence ?? []) {
    // Tier weighting math belongs to the engine; ingestion records metadata
    // only. evidenceType keeps its schema default and tierVerified stays null.
    const evidence = await tx.evidence.create({
      data: {
        beliefId: claimBelief.id,
        side: 'supporting',
        description: e.title,
        sourceUrl: e.sourceUrl ?? null,
        doi: e.doi ?? null,
        pmid: e.pmid ?? null,
        isbn: e.isbn ?? null,
        author: e.author ?? null,
        publicationDate: e.publicationDate ?? null,
        tierClaim: e.tierClaim ?? null,
        retrievedByAgentId: agentId,
      },
    })
    evidenceIds.push(evidence.id)
    await audit(tx, {
      agentId, batchId,
      action: 'add_evidence',
      targetType: 'Evidence',
      targetId: evidence.id,
      rationale: claim.rationale,
      payload: e,
    })
  }

  // Redundancy scan: stored, not scored. Similar siblings become
  // EquivalenceCandidate rows so the engine and human reviewers see the
  // cluster; the redundancy discount happens at scoring time, canonically.
  const equivalenceCandidates: { existingArgumentId: number; similarity: number }[] = []
  for (const sibling of siblings) {
    const siblingText = sibling.claim ?? sibling.belief.statement
    const similarity = textSimilarity(statement, siblingText)
    if (similarity >= EQUIVALENCE_CANDIDATE_THRESHOLD) {
      await tx.equivalenceCandidate.create({
        data: {
          argumentId: argument.id,
          existingArgumentId: sibling.id,
          similarity,
        },
      })
      equivalenceCandidates.push({ existingArgumentId: sibling.id, similarity })
      await audit(tx, {
        agentId, batchId,
        action: 'equivalence_candidate',
        targetType: 'Argument',
        targetId: argument.id,
        rationale:
          `Redundancy scan: new argument resembles existing argument #${sibling.id} ` +
          `(similarity ${similarity.toFixed(2)}). Stored for the engine; not scored at ingestion.`,
      })
    }
  }

  // Fallacy detections become draft counter-arguments in the linkage
  // sub-debate, authored by the system detector agent. No score changes.
  const draftedCounterArguments: { id: number; fallacyType: string; targetFactor: string }[] = []
  const detections = detectFallacies(`${statement}. ${claim.rationale}`)
  if (detections.length > 0) {
    const detector = await ensureSystemDetectorAgent(tx)
    for (const d of detections) {
      const counter = await tx.linkageArgument.create({
        data: {
          argumentId: argument.id,
          side: 'disagree',
          statement: d.counterStatement,
          pattern: d.fallacyType,
          status: 'draft',
          targetFactor: d.targetFactor,
          fallacyType: d.fallacyType,
          rationale: `Automated detector flagged "${d.matchedText}". The accusation enters the tree and lives or dies by its own sub-arguments.`,
          submittedByAgentId: detector.id,
        },
      })
      draftedCounterArguments.push({
        id: counter.id,
        fallacyType: d.fallacyType,
        targetFactor: d.targetFactor,
      })
      await audit(tx, {
        agentId: detector.id, batchId,
        action: 'draft_counter_argument',
        targetType: 'LinkageArgument',
        targetId: counter.id,
        rationale: `Detected ${d.fallacyType} ("${d.matchedText}") targeting ${d.targetFactor}. Drafted as an argument, not a penalty.`,
      })
    }
  }

  return {
    statement,
    beliefId: claimBelief.id,
    beliefSlug: claimBelief.slug,
    parentBeliefId: parent.id,
    parentBeliefSlug: parent.slug,
    argumentId: argument.id,
    evidenceIds,
    equivalenceCandidates,
    draftedCounterArguments,
  }
}

/**
 * Validate and ingest one batch. All-or-nothing: any named failure rejects
 * the whole batch so nothing partial persists, and the stored batch payload
 * can be replayed against a clean database to reproduce the same structure.
 *
 * Ingestion is a score-affecting graph write, so it honors the market
 * layer's epoch freeze window (reads stay open; see settlement docs).
 */
export async function runIngest(agentId: string, rawPayload: unknown, now = new Date()): Promise<IngestOutcome> {
  if (isGraphFrozen(now)) {
    return {
      ok: false,
      status: 423,
      issues: [{ mode: FAILURE_MODES.GRAPH_FREEZE, path: '', message: GRAPH_FREEZE_MESSAGE }],
    }
  }

  const validation = validateIngestPayload(rawPayload)
  if (!validation.ok) {
    return { ok: false, status: 422, issues: validation.issues, auditLock: validation.auditLock }
  }
  const payload = validation.payload

  const result = await prisma.$transaction(
    async tx => {
      const batch = await tx.ingestBatch.create({
        data: {
          agentId,
          title: payload.batchTitle,
          sourceDocumentUrl: payload.sourceDocumentUrl ?? null,
        },
      })
      await audit(tx, {
        agentId,
        batchId: batch.id,
        action: 'ingest_batch',
        targetType: 'IngestBatch',
        targetId: batch.id,
        rationale: payload.batchTitle,
        payload,
      })

      const claims: IngestedClaimResult[] = []
      for (const claim of payload.claims) {
        claims.push(await ingestClaim(tx, agentId, batch.id, claim))
      }
      return { batchId: batch.id, claims }
    },
    { timeout: 60_000 },
  )

  return { ok: true, ...result }
}
