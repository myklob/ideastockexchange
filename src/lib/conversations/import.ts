// Conversation import: transcript in, pending candidates out. This is the
// "find" half of conversation integration — it stores the verbatim thread,
// mines candidate pro/con claims, resolves the permanent belief page the
// conversation plugs into, and runs the redundancy scan against the page's
// existing arguments. It writes NO graph rows: no Belief (beyond a named-slug
// stub), no Argument, no Evidence, no score. The graph moves only when
// integrate.ts pushes accepted candidates through the ingestion firewall.

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { validateConversationImport } from './contract'
import type { ValidationIssue } from '@/lib/agent-ingest/contract'
import { extractCandidates, type ExtractionResult } from './extract'
import {
  pickFocalBelief,
  scanNearestArgument,
  correctStanceByRestatement,
  type SiblingArgumentRow,
} from './match'
import { slugify } from '@/lib/agent-ingest/slug'

type Tx = Prisma.TransactionClient

export interface ImportedCandidate {
  id: string
  messageIndex: number
  statement: string
  direction: string
  band: string | null
  similarity: number | null
  nearestArgumentId: number | null
  evidenceUrls: string[]
}

export type ImportOutcome =
  | {
      ok: true
      threadId: string
      belief: { id: number; slug: string; statement: string } | null
      candidates: ImportedCandidate[]
      skipped: ExtractionResult['skipped']
    }
  | { ok: false; status: number; issues: ValidationIssue[] }

async function audit(
  tx: Tx,
  row: { agentId: string; action: string; targetType: string; targetId: string; rationale: string; payload?: unknown },
) {
  await tx.auditLog.create({
    data: {
      agentId: row.agentId,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      rationale: row.rationale,
      payload: row.payload === undefined ? null : JSON.stringify(row.payload),
    },
  })
}

/**
 * Import one conversation. Extraction runs twice when the focal belief is
 * resolved by matching rather than named: the second pass knows the focal
 * statement, so restatements of it are skipped and negation stances read
 * correctly. Extraction is cheap text work; correctness wins.
 */
export async function runConversationImport(agentId: string, rawPayload: unknown): Promise<ImportOutcome> {
  const validation = validateConversationImport(rawPayload)
  if (!validation.ok) return { ok: false, status: 422, issues: validation.issues }
  const payload = validation.payload

  // Resolve the permanent page this conversation plugs into.
  let focal: { id: number; slug: string; statement: string } | null = null
  let createdStub = false
  if (payload.beliefSlug) {
    const slug = slugify(payload.beliefSlug.trim())
    const existing = await prisma.belief.findUnique({ where: { slug } })
    if (existing) {
      focal = { id: existing.id, slug: existing.slug, statement: existing.statement }
    } else {
      // Same posture as ingestion's parent resolution: a named slug with no
      // page yet gets a stub page, so the conversation still has a home.
      const created = await prisma.belief.create({ data: { slug, statement: payload.beliefSlug.trim() } })
      focal = { id: created.id, slug: created.slug, statement: created.statement }
      createdStub = true
    }
  } else {
    const firstPass = extractCandidates(payload.messages, null)
    const beliefs = await prisma.belief.findMany({ select: { id: true, slug: true, statement: true } })
    const match = pickFocalBelief(payload.title, firstPass.candidates, beliefs)
    if (match) focal = match.belief
  }

  const extraction = extractCandidates(payload.messages, focal?.statement ?? null)

  // Redundancy scan targets: the focal page's existing arguments, labeled by
  // their claim label or their belief's statement.
  let siblings: SiblingArgumentRow[] = []
  if (focal) {
    const rows = await prisma.argument.findMany({
      where: { parentBeliefId: focal.id },
      include: { belief: { select: { statement: true } } },
    })
    siblings = rows.map(r => ({ id: r.id, side: r.side, statement: r.claim ?? r.belief.statement }))
  }

  const result = await prisma.$transaction(async tx => {
    const thread = await tx.conversationThread.create({
      data: {
        platform: payload.platform,
        title: payload.title.trim(),
        sourceUrl: payload.sourceUrl ?? null,
        beliefId: focal?.id ?? null,
        submittedByAgentId: agentId,
      },
    })
    if (createdStub && focal) {
      await audit(tx, {
        agentId,
        action: 'create_belief',
        targetType: 'Belief',
        targetId: String(focal.id),
        rationale: `Stub belief created for named slug "${focal.slug}" while importing conversation "${thread.title}".`,
      })
    }
    await audit(tx, {
      agentId,
      action: 'import_conversation',
      targetType: 'ConversationThread',
      targetId: thread.id,
      rationale:
        `Imported ${payload.messages.length}-message ${payload.platform} conversation "${thread.title}"` +
        (focal ? ` plugged into belief "${focal.slug}".` : ' with no matching belief page yet.'),
      payload,
    })

    const messages = []
    for (let i = 0; i < payload.messages.length; i++) {
      const m = payload.messages[i]
      messages.push(
        await tx.conversationMessage.create({
          data: {
            threadId: thread.id,
            index: i,
            authorHandle: m.author.trim(),
            body: m.body,
            postedAt: m.postedAt ? new Date(m.postedAt) : null,
          },
        }),
      )
    }

    const candidates: ImportedCandidate[] = []
    for (const c of extraction.candidates) {
      // Restating an opposite-side argument corrects the stance read: the
      // candidate lands on the side of the argument it restates.
      const correction = correctStanceByRestatement(c.statement, c.direction, siblings)
      const direction = correction?.direction ?? c.direction
      const nearest = correction?.nearest ?? scanNearestArgument(c.statement, direction, siblings)
      const row = await tx.argumentCandidate.create({
        data: {
          threadId: thread.id,
          messageId: messages[c.messageIndex].id,
          statement: c.statement,
          direction,
          contextQuote: c.contextQuote,
          evidenceUrls: c.evidenceUrls.length > 0 ? c.evidenceUrls.join('\n') : null,
          beliefId: focal?.id ?? null,
          nearestArgumentId: nearest?.argumentId ?? null,
          similarity: nearest?.similarity ?? null,
          band: nearest?.band ?? null,
        },
      })
      candidates.push({
        id: row.id,
        messageIndex: c.messageIndex,
        statement: c.statement,
        direction,
        band: row.band,
        similarity: row.similarity,
        nearestArgumentId: row.nearestArgumentId,
        evidenceUrls: c.evidenceUrls,
      })
      await audit(tx, {
        agentId,
        action: 'mine_candidate',
        targetType: 'ArgumentCandidate',
        targetId: row.id,
        rationale:
          `Mined ${direction} candidate from message #${c.messageIndex}` +
          (correction ? ` (stance corrected: restates opposite-side argument #${correction.nearest.argumentId}).` : '') +
          (nearest ? ` (nearest existing argument #${nearest.argumentId}, band ${nearest.band}).` : ' (no similar existing argument).'),
      })
    }

    return { threadId: thread.id, candidates }
  }, { timeout: 60_000 })

  return { ok: true, threadId: result.threadId, belief: focal, candidates: result.candidates, skipped: extraction.skipped }
}
