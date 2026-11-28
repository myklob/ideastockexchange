/**
 * Adapter: map a live Belief row (with relations) into the pure HTML
 * generator's BeliefHtmlInput. The DB is the source of truth; this is the
 * only place that knows how DB fields map onto the canonical template.
 *
 * Pure mapping (no DB calls) so it is unit-testable. The publish script
 * (scripts/generate-belief-html.ts) does the fetching and passes the rows in,
 * including the parent arguments used to build the "Supports:" backlinks.
 */

import type { BeliefWithRelations } from '@/features/belief-analysis/types'
import { computeBeliefScores } from '@/features/belief-analysis/data/fetch-belief'
import type { BeliefHtmlInput, ArgRow, SupportsBacklink } from './belief-html'

/** A parent edge: an argument on some OTHER belief that uses this belief as its reason. */
export interface ParentEdge {
  parentStatement: string
  parentSlug: string | null
  argumentLabel: string | null
}

export interface FromBeliefOptions {
  parents?: ParentEdge[]
  linkMode?: 'file' | 'route'
}

export function beliefToHtmlInput(
  belief: BeliefWithRelations,
  opts: FromBeliefOptions = {},
): BeliefHtmlInput {
  const scores = computeBeliefScores(belief)

  const args: ArgRow[] = belief.arguments.map((a) => ({
    label: a.belief.statement,
    side: a.side === 'disagree' ? 'disagree' : 'agree',
    childSlug: a.belief.slug,
    // Truth column shows the child belief's net score (positivity, -100..+100).
    truthScore: a.belief.positivity,
    importanceScore: a.importanceScore,
    importanceSlug: a.importanceBelief?.slug ?? null,
    linkageScore: a.linkageScore,
    argumentId: a.id,
    // impactScore is 0 by default in the DB; treat a true zero as "pending"
    // so unscored edges don't render a misleading +0 (Rule 6).
    impactScore: a.impactScore === 0 ? null : a.impactScore,
  }))

  const supports: SupportsBacklink[] = (opts.parents ?? []).map((p) => ({
    parentStatement: p.parentStatement,
    parentSlug: p.parentSlug,
    argumentLabel: p.argumentLabel,
  }))

  return {
    slug: belief.slug,
    statement: belief.statement,
    category: belief.category,
    subcategory: belief.subcategory,
    netScore: scores.overallScore,
    args,
    evidence: belief.evidence.map((e) => ({
      tier: e.evidenceType,
      source: e.description,
      stance: e.side === 'weakening' ? 'Weakens' : 'Supports',
      bearsOn: '',
      linkage: null,
    })),
    objectiveCriteria: belief.objectiveCriteria.map((c) => ({
      criterion: c.description,
      currentStatus: c.currentStatus ?? null,
      threshold: c.thresholdForAgreement ?? null,
    })),
    definitions: belief.definitions.map((d) => ({ term: d.term, definition: d.definition })),
    supports,
    linkMode: opts.linkMode,
  }
}
