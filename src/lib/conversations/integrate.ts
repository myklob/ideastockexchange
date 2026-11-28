// The "integrate" half: accepted candidates become Arguments through the
// SAME ingestion firewall as every other move — validated payload, five-step
// linkage check, mandatory rationale, audit rows, no scores. Review actions:
//   integrate — extend the belief page's outline with a new pro/con argument
//   fold      — combine: the point restates an existing argument; record that
//               and stop (no new row, no double-counting)
//   dismiss   — not an argument after all
// Nothing auto-integrates. The transcript stays inert until someone accountable
// pushes a candidate through.

import { prisma } from '@/lib/prisma'
import { runIngest, type IngestedClaimResult } from '@/lib/agent-ingest/ingest'
import { FAILURE_MODES, type IngestClaimInput, type ValidationIssue } from '@/lib/agent-ingest/contract'

export interface CandidateIntegration {
  candidateId: string
  /** Step 3 of the five-step check. When omitted, a draft mechanism is
   *  composed from the conversation context and the check is flagged for
   *  review — an auto-draft is never presented as a considered judgment. */
  howItSupports?: string
  /** Step 4 author bracket, [0,1]. Defaults to 0.5 (flagged). */
  provisionalEstimate?: number
  /** Correct the heuristic stance read when the reviewer knows better. */
  direction?: 'pro' | 'con'
}

export interface IntegrateRequest {
  integrate?: CandidateIntegration[]
  fold?: string[]
  dismiss?: string[]
}

export type IntegrateOutcome =
  | {
      ok: true
      batchId: string | null
      integrated: { candidateId: string; argumentId: number; beliefSlug: string }[]
      folded: string[]
      dismissed: string[]
      changedBeliefIds: number[]
    }
  | { ok: false; status: number; issues: ValidationIssue[]; auditLock?: boolean }

const issue = (path: string, message: string): ValidationIssue => ({
  mode: FAILURE_MODES.MALFORMED_BATCH,
  path,
  message,
})

/**
 * Apply one review pass over a thread's candidates. Integrations run as one
 * ingest batch (all-or-nothing, same replayable audit trail); folds and
 * dismissals are status moves with their own audit rows.
 */
export async function integrateCandidates(
  agentId: string,
  threadId: string,
  request: IntegrateRequest,
): Promise<IntegrateOutcome> {
  if (
    (request.integrate !== undefined && !Array.isArray(request.integrate)) ||
    (request.fold !== undefined && !Array.isArray(request.fold)) ||
    (request.dismiss !== undefined && !Array.isArray(request.dismiss))
  ) {
    return { ok: false, status: 422, issues: [issue('', 'integrate, fold, and dismiss must be arrays when present.')] }
  }
  const integrations = (request.integrate ?? []).filter(
    (s): s is CandidateIntegration => typeof s === 'object' && s !== null && typeof s.candidateId === 'string',
  )
  if (integrations.length !== (request.integrate ?? []).length) {
    return {
      ok: false,
      status: 422,
      issues: [issue('integrate', 'Each integrate entry must be an object with a candidateId.')],
    }
  }
  const foldIds = (request.fold ?? []).filter((id): id is string => typeof id === 'string')
  const dismissIds = (request.dismiss ?? []).filter((id): id is string => typeof id === 'string')
  if (integrations.length === 0 && foldIds.length === 0 && dismissIds.length === 0) {
    return { ok: false, status: 422, issues: [issue('', 'Nothing to do: provide integrate, fold, or dismiss.')] }
  }

  const thread = await prisma.conversationThread.findUnique({
    where: { id: threadId },
    include: { belief: true },
  })
  if (!thread) {
    return { ok: false, status: 404, issues: [issue('threadId', `No conversation thread "${threadId}".`)] }
  }

  const referencedIds = [
    ...integrations.map(s => s.candidateId),
    ...foldIds,
    ...dismissIds,
  ]
  const candidates = await prisma.argumentCandidate.findMany({
    where: { id: { in: referencedIds }, threadId },
    include: { message: true, belief: true },
  })
  const byId = new Map(candidates.map(c => [c.id, c]))

  const issues: ValidationIssue[] = []
  referencedIds.forEach(id => {
    const c = byId.get(id)
    if (!c) issues.push(issue(id, `Candidate "${id}" not found in this thread.`))
    else if (c.status !== 'pending') issues.push(issue(id, `Candidate "${id}" is already ${c.status}.`))
  })
  integrations.forEach(s => {
    const c = byId.get(s.candidateId)
    if (c && !c.belief) {
      issues.push(
        issue(
          s.candidateId,
          'Candidate has no matched belief page. Re-import the conversation with beliefSlug to give it a home first.',
        ),
      )
    }
    if (
      s.provisionalEstimate !== undefined &&
      !(typeof s.provisionalEstimate === 'number' && s.provisionalEstimate >= 0 && s.provisionalEstimate <= 1)
    ) {
      issues.push(issue(`${s.candidateId}.provisionalEstimate`, 'provisionalEstimate must be a number in [0,1].'))
    }
    if (s.direction !== undefined && s.direction !== 'pro' && s.direction !== 'con') {
      issues.push(issue(`${s.candidateId}.direction`, 'direction must be "pro" or "con".'))
    }
  })
  foldIds.forEach(id => {
    const c = byId.get(id)
    if (c && c.nearestArgumentId === null) {
      issues.push(issue(id, 'Cannot fold: no nearest existing argument was recorded for this candidate.'))
    }
  })
  if (issues.length > 0) return { ok: false, status: 422, issues }

  // Build the ingest batch. The firewall re-validates everything: standalone
  // claims, five-step completeness, evidence provenance, no score fields.
  let batchId: string | null = null
  const integrated: { candidateId: string; argumentId: number; beliefSlug: string }[] = []
  let ingestClaims: IngestedClaimResult[] = []

  if (integrations.length > 0) {
    const claims: IngestClaimInput[] = integrations.map(s => {
      const c = byId.get(s.candidateId)!
      const belief = c.belief!
      const autoDrafted = !s.howItSupports?.trim()
      const quote = c.contextQuote ?? c.statement
      return {
        statement: c.statement,
        direction: (s.direction ?? c.direction) as 'pro' | 'con',
        parentBeliefSlug: belief.slug,
        rationale:
          `Mined from ${thread.platform} conversation "${thread.title}", message #${c.message.index} ` +
          `by ${c.message.authorHandle}: "${quote}". Integrated from candidate ${c.id} by review.`,
        fiveStepCheck: {
          parentWording: belief.statement,
          claimWording: c.statement,
          howItSupports: s.howItSupports?.trim()
            ? s.howItSupports.trim()
            : `Offered in conversation as a ${s.direction ?? c.direction} point on the parent claim: "${quote}"`,
          provisionalEstimate: s.provisionalEstimate ?? 0.5,
          flaggedBelowThreshold: autoDrafted || (s.provisionalEstimate ?? 0.5) < 0.5,
          flagNote: autoDrafted
            ? 'Mechanism auto-drafted from conversation context; review the linkage before trusting it.'
            : undefined,
        },
        evidence: (c.evidenceUrls?.split('\n').filter(Boolean) ?? []).map(url => ({
          title: `Source shared by ${c.message.authorHandle} in "${thread.title}"`,
          sourceUrl: url,
        })),
      }
    })

    const outcome = await runIngest(agentId, {
      batchTitle: `Conversation integration: ${thread.title}`,
      sourceDocumentUrl: thread.sourceUrl ?? undefined,
      claims,
    })
    if (!outcome.ok) return outcome
    batchId = outcome.batchId
    ingestClaims = outcome.claims
  }

  const now = new Date()
  await prisma.$transaction(async tx => {
    for (let i = 0; i < integrations.length; i++) {
      const s = integrations[i]
      const claim = ingestClaims[i]
      await tx.argumentCandidate.update({
        where: { id: s.candidateId },
        data: {
          status: 'integrated',
          integratedArgumentId: claim.argumentId,
          integratedBatchId: batchId,
          resolvedAt: now,
        },
      })
      integrated.push({
        candidateId: s.candidateId,
        argumentId: claim.argumentId,
        beliefSlug: claim.parentBeliefSlug,
      })
      await tx.auditLog.create({
        data: {
          agentId,
          batchId,
          action: 'integrate_candidate',
          targetType: 'ArgumentCandidate',
          targetId: s.candidateId,
          rationale: `Candidate integrated as argument #${claim.argumentId} under "${claim.parentBeliefSlug}" via the ingestion firewall.`,
        },
      })
    }
    for (const id of foldIds) {
      const c = byId.get(id)!
      await tx.argumentCandidate.update({
        where: { id },
        data: { status: 'duplicate', resolvedAt: now },
      })
      await tx.auditLog.create({
        data: {
          agentId,
          action: 'fold_candidate',
          targetType: 'ArgumentCandidate',
          targetId: id,
          rationale:
            `Candidate folded as a restatement of existing argument #${c.nearestArgumentId} ` +
            `(similarity ${c.similarity?.toFixed(2) ?? '?'}). The conversation point is already on the page.`,
        },
      })
    }
    for (const id of dismissIds) {
      await tx.argumentCandidate.update({
        where: { id },
        data: { status: 'dismissed', resolvedAt: now },
      })
      await tx.auditLog.create({
        data: {
          agentId,
          action: 'dismiss_candidate',
          targetType: 'ArgumentCandidate',
          targetId: id,
          rationale: 'Candidate dismissed at review: not a usable standalone argument.',
        },
      })
    }
  }, { timeout: 60_000 })

  return {
    ok: true,
    batchId,
    integrated,
    folded: foldIds,
    dismissed: dismissIds,
    changedBeliefIds: [...new Set(ingestClaims.map(c => c.beliefId))],
  }
}
