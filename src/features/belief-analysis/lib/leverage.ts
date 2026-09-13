/**
 * Decision Leverage — database adapter for the belief page.
 *
 * Feeds the pure engine (src/core/scoring/decision-leverage.ts) from the
 * argument edges attached to one belief, and carries the display extras the
 * engine has no business knowing about: the child belief's slug and statement,
 * and the route a reader should follow to close the widest gap.
 *
 * Fetched separately from BELIEF_INCLUDE, like scoreEvents and usedIn, so
 * score propagation (which reuses that include) stays lean.
 */

import { prisma } from '@/lib/prisma'
import {
  computeBeliefLeverage,
  computeCorpusLeverage,
  NEGLIGIBLE_LEVERAGE,
  type BeliefLeverage,
  type CorpusBeliefSummary,
  type CorpusOpenQuestion,
  type EdgeLeverage,
  type LeverageEdgeInput,
  type ResolutionGaps,
} from '@/core/scoring/decision-leverage'

export interface LeverageRow extends EdgeLeverage {
  /** The child belief's slug, for the row link. Null when it has none. */
  childSlug: string | null
  childStatement: string
  /** Where a reader should go to close the widest gap. Null when no real
   *  route exists for it (Rule 5: never link a page that isn't there). */
  nextStepHref: string | null
}

export interface BeliefLeverageReadout extends Omit<BeliefLeverage, 'edges' | 'cruxes' | 'loadBearing'> {
  edges: LeverageRow[]
  cruxes: LeverageRow[]
  loadBearing: LeverageRow[]
}

/**
 * The route that closes each gap:
 *   evidence    — the child belief's own page, where evidence is filed.
 *   linkage     — the edge's linkage sub-debate.
 *   scoring     — the edge's impact-provenance page (factor-by-factor).
 *   examination — the child belief's page, where a counter-argument is added.
 */
function nextStepHref(
  gap: keyof ResolutionGaps,
  argumentId: number,
  childSlug: string | null,
): string | null {
  switch (gap) {
    case 'linkage':
      return `/arguments/${argumentId}/linkage`
    case 'scoring':
      return `/arguments/${argumentId}/score`
    case 'evidence':
    case 'examination':
      return childSlug ? `/beliefs/${childSlug}` : null
  }
}

/**
 * Everything the engine needs about one argument edge, in one place so the
 * single-belief and corpus queries cannot drift apart.
 */
const EDGE_SELECT = {
  id: true,
  side: true,
  claim: true,
  linkageScore: true,
  importanceScore: true,
  uniquenessScore: true,
  depth: true,
  argumentScore: true,
  belief: {
    select: {
      slug: true,
      statement: true,
      groundingScore: true,
      // The child's own sub-debate: is anyone arguing the other side?
      arguments: { where: { status: 'published' }, select: { side: true } },
      // Evidence counts as examination too, by side.
      evidence: { select: { side: true } },
    },
  },
  _count: { select: { linkageVotes: true } },
} as const

type EdgeRow = {
  id: number
  side: string
  claim: string | null
  linkageScore: number
  importanceScore: number
  uniquenessScore: number | null
  depth: number
  argumentScore: number | null
  belief: {
    slug: string
    statement: string
    groundingScore: number
    arguments: { side: string }[]
    evidence: { side: string }[]
  }
  _count: { linkageVotes: number }
}

function toEngineInput(edge: EdgeRow): LeverageEdgeInput {
  const sub = edge.belief.arguments
  const evidence = edge.belief.evidence
  return {
    id: edge.id,
    label: edge.claim ?? edge.belief.statement,
    side: edge.side === 'disagree' ? 'disagree' : 'agree',
    linkageScore: edge.linkageScore,
    importanceScore: edge.importanceScore,
    uniquenessScore: edge.uniquenessScore,
    depth: edge.depth,
    groundingScore: edge.belief.groundingScore,
    linkageVotes: edge._count.linkageVotes,
    argumentScore: edge.argumentScore,
    subAgreeCount: sub.filter(a => a.side === 'agree').length,
    subDisagreeCount: sub.filter(a => a.side !== 'agree').length,
    supportingEvidenceCount: evidence.filter(e => e.side === 'supporting').length,
    weakeningEvidenceCount: evidence.filter(e => e.side !== 'supporting').length,
    href: `/arguments/${edge.id}/score`,
  }
}

/** Rank one belief's argument edges by how much conclusion score they still hold. */
export async function fetchBeliefLeverage(beliefId: number): Promise<BeliefLeverageReadout> {
  const edges = await prisma.argument.findMany({
    where: { parentBeliefId: beliefId, status: 'published' },
    select: EDGE_SELECT,
  })

  const display = new Map<number, { childSlug: string | null; childStatement: string }>()

  const inputs: LeverageEdgeInput[] = edges.map(edge => {
    display.set(edge.id, {
      childSlug: edge.belief.slug,
      childStatement: edge.belief.statement,
    })
    return toEngineInput(edge)
  })

  const summary = computeBeliefLeverage(inputs)
  const decorate = (edge: EdgeLeverage): LeverageRow => {
    const extra = display.get(Number(edge.id))
    const childSlug = extra?.childSlug ?? null
    return {
      ...edge,
      childSlug,
      childStatement: extra?.childStatement ?? edge.label,
      nextStepHref: nextStepHref(edge.widestGap, Number(edge.id), childSlug),
    }
  }

  const rows = summary.edges.map(decorate)
  const byId = new Map(rows.map(row => [row.id, row]))

  return {
    ...summary,
    edges: rows,
    cruxes: summary.cruxes.map(e => byId.get(e.id)).filter((r): r is LeverageRow => r != null),
    loadBearing: summary.loadBearing
      .map(e => byId.get(e.id))
      .filter((r): r is LeverageRow => r != null),
  }
}

/**
 * Whether the section is worth rendering: at least one edge, and at least
 * half a point of conclusion score actually in play. A belief whose every
 * edge is settled gets no table (and no horizontal rule around it).
 */
export function hasLeverageToShow(readout: BeliefLeverageReadout): boolean {
  return readout.edges.length > 0 && readout.totalAtStake >= NEGLIGIBLE_LEVERAGE
}

// ─── Corpus work queue ────────────────────────────────────────────

export interface CorpusBeliefRow extends Omit<CorpusBeliefSummary, 'belief'> {
  belief: { id: number; slug: string; statement: string }
}

export interface CorpusQuestionRow extends Omit<CorpusOpenQuestion, 'belief'> {
  belief: { id: number; slug: string; statement: string }
  childSlug: string | null
  nextStepHref: string | null
}

export interface CorpusLeverageReadout {
  beliefs: CorpusBeliefRow[]
  openQuestions: CorpusQuestionRow[]
  totalAtStake: number
  fragileBeliefs: CorpusBeliefRow[]
  /** Beliefs that have at least one published argument edge. */
  beliefsConsidered: number
}

/**
 * The work queue: Decision Leverage across the whole corpus, so "where does
 * the next hour go?" has a ranked answer rather than a browse.
 *
 * One query for every published edge in the corpus, grouped in memory by
 * parent belief — not one query per belief. The per-edge payload is small
 * (side flags and counts), so this stays a single round trip as the corpus
 * grows.
 */
export async function fetchCorpusLeverage(): Promise<CorpusLeverageReadout> {
  const edges = await prisma.argument.findMany({
    where: { status: 'published' },
    select: {
      ...EDGE_SELECT,
      parentBelief: { select: { id: true, slug: true, statement: true } },
    },
  })

  const byParent = new Map<
    number,
    { belief: { id: number; slug: string; statement: string }; edges: LeverageEdgeInput[] }
  >()
  const childOf = new Map<number, string>()

  for (const edge of edges) {
    const parent = edge.parentBelief
    const group = byParent.get(parent.id) ?? { belief: parent, edges: [] }
    group.edges.push(toEngineInput(edge))
    byParent.set(parent.id, group)
    childOf.set(edge.id, edge.belief.slug)
  }

  const beliefRefs = new Map<string, { id: number; slug: string; statement: string }>()
  const corpus = computeCorpusLeverage(
    [...byParent.values()].map(group => {
      beliefRefs.set(String(group.belief.id), group.belief)
      return {
        belief: { id: group.belief.id, label: group.belief.statement },
        edges: group.edges,
      }
    }),
  )

  const resolveBelief = (id: string | number) =>
    beliefRefs.get(String(id)) ?? { id: Number(id), slug: '', statement: String(id) }

  const beliefRow = (summary: CorpusBeliefSummary): CorpusBeliefRow => ({
    ...summary,
    belief: resolveBelief(summary.belief.id),
  })

  return {
    beliefs: corpus.beliefs.map(beliefRow),
    fragileBeliefs: corpus.fragileBeliefs.map(beliefRow),
    totalAtStake: corpus.totalAtStake,
    beliefsConsidered: byParent.size,
    openQuestions: corpus.openQuestions.map(question => {
      const childSlug = childOf.get(Number(question.id)) ?? null
      return {
        ...question,
        belief: resolveBelief(question.belief.id),
        childSlug,
        nextStepHref: nextStepHref(question.widestGap, Number(question.id), childSlug),
      }
    }),
  }
}
