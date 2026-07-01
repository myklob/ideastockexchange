/**
 * AI-powered belief-page section generator.
 *
 * Generates the two sections whose absence blocks scoring the most:
 * • Objective criteria — the measurable yardsticks for the belief, with the
 *   four quality dimensions (validity/reliability/independence/linkage) that
 *   feed calculateObjectiveCriteriaScore.
 * • Arguments — reasons to agree/disagree, created as first-class child
 *   Beliefs joined by Argument edges so the ReasonRank propagation scores
 *   them like any human-submitted reason.
 *
 * Uses the configured AI provider (AI_PROVIDER/AI_API_KEY/AI_MODEL env vars),
 * same as the debate-topic generator. Nothing here fabricates evidence
 * citations: evidence requires real sources (Rule 5 — no broken links), so it
 * stays human-curated.
 */

import { createAIClientFromEnv } from '@/core/ai/ai-client'
import type { LinkageClassification } from '@/generated/prisma/enums'
import { calculateObjectiveCriteriaScore } from '@/core/scoring/all-scores'
import { propagateBeliefScores } from '@/lib/propagate-belief-scores'
import { prisma } from '@/lib/prisma'

// ─── Configuration check ─────────────────────────────────────────

const KEY_PLACEHOLDER = 'your-api-key-here'

/**
 * Whether the AI layer is usable: hosted providers need a real key; local
 * providers (ollama/lmstudio/custom) are assumed reachable when selected.
 */
export function isAIConfigured(): { configured: boolean; reason?: string } {
  const provider = process.env.AI_PROVIDER || 'ollama'
  if (provider === 'anthropic' || provider === 'openai') {
    const key = process.env.AI_API_KEY
    if (!key || key === KEY_PLACEHOLDER) {
      return {
        configured: false,
        reason:
          `AI_PROVIDER is "${provider}" but AI_API_KEY is not set. ` +
          'Set AI_API_KEY in the environment (see .env.example), or point ' +
          'AI_PROVIDER at a local model (ollama) with AI_API_BASE.',
      }
    }
  }
  return { configured: true }
}

// ─── Shared plumbing ─────────────────────────────────────────────

const SYSTEM_PROMPT =
  'You are an expert epistemologist for the Idea Stock Exchange, a platform that ' +
  'scores beliefs by the strength of their evidence and arguments. You produce ' +
  'rigorous, balanced, structured JSON. Output ONLY valid JSON, no prose.'

function safeParseJson<T>(text: string, fallback: T): T {
  const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const match = cleaned.match(/[[{][\s\S]*[\]}]/)
    if (match) {
      try {
        return JSON.parse(match[0]) as T
      } catch {
        return fallback
      }
    }
    return fallback
  }
}

async function callAI(prompt: string): Promise<string> {
  const client = createAIClientFromEnv()
  const response = await client.complete({
    systemPrompt: SYSTEM_PROMPT,
    prompt,
    maxTokens: 3000,
    responseFormat: 'json',
  })
  return response.content
}

const clamp01 = (n: unknown, fallback = 0.5) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80)
}

// ─── Objective criteria generation ───────────────────────────────

interface GeneratedCriterion {
  description: string
  howToMeasure: string
  currentStatus: string
  target: string
  criteriaType: string
  validityScore: number
  reliabilityScore: number
  independenceScore: number
  linkageScore: number
}

export async function generateObjectiveCriteria(beliefId: number): Promise<{
  created: number
  criteria: Array<{ id: number; description: string; totalScore: number }>
}> {
  const belief = await prisma.belief.findUniqueOrThrow({
    where: { id: beliefId },
    select: { id: true, statement: true, objectiveCriteria: { select: { description: true } } },
  })

  const existing = belief.objectiveCriteria.map(c => c.description)
  const prompt = `Belief under analysis: "${belief.statement}"

Propose the 3-5 BEST objective criteria for measuring whether this belief is true — specific, quantifiable metrics an honest skeptic and an honest supporter would both accept as relevant.
${existing.length ? `\nAlready covered (do not repeat):\n${existing.map(d => `- ${d}`).join('\n')}\n` : ''}
Return a JSON array where each element has exactly these fields:
{
  "description": "Name of the metric (one line)",
  "howToMeasure": "Concretely how it is measured and by whom",
  "currentStatus": "What the data currently shows, honestly ('unknown' if unknown)",
  "target": "The threshold that would confirm or falsify the belief",
  "criteriaType": "one of: economic | scientific | social | legal | technical",
  "validityScore": 0.0-1.0 (does it measure what it claims?),
  "reliabilityScore": 0.0-1.0 (can different people measure it consistently?),
  "independenceScore": 0.0-1.0 (is the data source neutral?),
  "linkageScore": 0.0-1.0 (how directly does it bear on THIS belief?)
}`

  const raw = await callAI(prompt)
  const parsed = safeParseJson<GeneratedCriterion[]>(raw, [])
  const usable = parsed.filter(
    c => typeof c?.description === 'string' && c.description.trim().length > 0,
  )

  const created: Array<{ id: number; description: string; totalScore: number }> = []
  for (const c of usable.slice(0, 5)) {
    const dims = {
      validityScore: clamp01(c.validityScore),
      reliabilityScore: clamp01(c.reliabilityScore),
      independenceScore: clamp01(c.independenceScore),
      linkageScore: clamp01(c.linkageScore),
    }
    const { totalScore } = calculateObjectiveCriteriaScore({
      id: 0,
      description: c.description,
      criteriaType: c.criteriaType ?? null,
      ...dims,
    })
    const row = await prisma.objectiveCriteria.create({
      data: {
        beliefId: belief.id,
        description: c.description.trim(),
        howToMeasure: typeof c.howToMeasure === 'string' ? c.howToMeasure : null,
        currentStatus: typeof c.currentStatus === 'string' ? c.currentStatus : null,
        target: typeof c.target === 'string' ? c.target : null,
        criteriaType: typeof c.criteriaType === 'string' ? c.criteriaType : 'scientific',
        ...dims,
        totalScore,
      },
      select: { id: true, description: true, totalScore: true },
    })
    created.push(row)
  }

  return { created: created.length, criteria: created }
}

// ─── Argument generation ─────────────────────────────────────────

interface GeneratedArgument {
  statement: string
  claim: string
  side: 'agree' | 'disagree'
  linkageScore: number
  linkageType: string
}

const LINKAGE_TYPES = new Set<LinkageClassification>([
  'DEDUCTIVE_PROOF',
  'STRONG_CAUSAL',
  'CONTEXTUAL',
  'ANECDOTAL',
])

export async function generateArguments(
  beliefId: number,
  maxPerSide = 3,
): Promise<{
  created: number
  arguments: Array<{ id: number; side: string; claim: string; childSlug: string }>
}> {
  const belief = await prisma.belief.findUniqueOrThrow({
    where: { id: beliefId },
    select: {
      id: true,
      statement: true,
      category: true,
      arguments: { select: { beliefId: true, belief: { select: { statement: true } } } },
    },
  })

  const existing = belief.arguments.map(a => a.belief.statement)
  const prompt = `Belief under analysis: "${belief.statement}"

Generate the ${maxPerSide} STRONGEST reasons to agree AND the ${maxPerSide} STRONGEST reasons to disagree. Steel-man both sides equally — each reason must be a complete, independently-debatable claim (it becomes its own belief page).
${existing.length ? `\nAlready-present reasons (do not duplicate):\n${existing.map(s => `- ${s}`).join('\n')}\n` : ''}
Return a JSON array where each element has exactly these fields:
{
  "statement": "The full claim, one sentence, independently debatable",
  "claim": "2-6 word label for the argument table",
  "side": "agree" | "disagree",
  "linkageScore": 0.0-1.0 (IF the statement were true, how strongly would it support/oppose the belief?),
  "linkageType": "DEDUCTIVE_PROOF" | "STRONG_CAUSAL" | "CONTEXTUAL" | "ANECDOTAL"
}`

  const raw = await callAI(prompt)
  const parsed = safeParseJson<GeneratedArgument[]>(raw, [])
  const usable = parsed.filter(
    a =>
      typeof a?.statement === 'string' &&
      a.statement.trim().length > 0 &&
      (a.side === 'agree' || a.side === 'disagree'),
  )

  const perSide = { agree: 0, disagree: 0 }
  const created: Array<{ id: number; side: string; claim: string; childSlug: string }> = []
  const newChildIds: number[] = []

  for (const a of usable) {
    if (perSide[a.side] >= maxPerSide) continue
    const slug = slugify(a.statement)
    if (!slug) continue

    const child = await prisma.belief.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        statement: a.statement.trim(),
        category: belief.category,
      },
    })
    if (child.id === belief.id) continue

    const duplicate = await prisma.argument.findFirst({
      where: { parentBeliefId: belief.id, beliefId: child.id },
      select: { id: true },
    })
    if (duplicate) continue

    const label =
      typeof a.claim === 'string' && a.claim.trim().length > 0 ? a.claim.trim() : null
    const row = await prisma.argument.create({
      data: {
        parentBeliefId: belief.id,
        beliefId: child.id,
        side: a.side,
        claim: label,
        linkageScore: clamp01(a.linkageScore),
        linkageType: LINKAGE_TYPES.has(a.linkageType as LinkageClassification)
          ? (a.linkageType as LinkageClassification)
          : 'CONTEXTUAL',
      },
      select: { id: true, side: true },
    })
    perSide[a.side]++
    newChildIds.push(child.id)
    created.push({ id: row.id, side: row.side, claim: label ?? a.statement, childSlug: slug })
  }

  // Score the new edges through the same pipeline as human submissions.
  // Propagation walks upward from each child belief through its new edge.
  const visited = new Set<number>()
  for (const childId of newChildIds) {
    await propagateBeliefScores(childId, visited)
  }

  return { created: created.length, arguments: created }
}
