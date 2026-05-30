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

  // Free-text section fields store one item per line; split into list rows.
  const lines = (text: string | null | undefined): string[] =>
    (text ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

  const va = belief.valuesAnalysis
  const ia = belief.interestsAnalysis

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
    values: va
      ? {
          motivation: {
            supportersAdvertised: lines(va.supportingAdvertised),
            supportersActual: lines(va.supportingActual),
            opponentsAdvertised: lines(va.opposingAdvertised),
            opponentsActual: lines(va.opposingActual),
          },
        }
      : undefined,
    interests:
      ia && (ia.sharedInterests || ia.conflictingInterests)
        ? {
            sharedVsConflicting: [
              {
                shared: ia.sharedInterests,
                conflicting: ia.conflictingInterests,
                why: null,
              },
            ],
          }
        : undefined,
    assumptions: belief.assumptions.length
      ? {
          accept: belief.assumptions.filter((a) => a.side === 'accept').map((a) => a.statement),
          reject: belief.assumptions.filter((a) => a.side === 'reject').map((a) => a.statement),
        }
      : undefined,
    objectiveCriteria: belief.objectiveCriteria.map((c) => ({
      criterion: c.description,
      currentStatus: c.currentStatus ?? null,
      threshold: c.thresholdForAgreement ?? null,
    })),
    costBenefit: belief.costBenefitAnalysis
      ? {
          benefits: lines(belief.costBenefitAnalysis.benefits),
          costs: lines(belief.costBenefitAnalysis.costs),
          shortTerm: lines(belief.impactAnalysis?.shortTermEffects),
          longTerm: lines(belief.impactAnalysis?.longTermEffects),
        }
      : undefined,
    resolution:
      belief.compromises.length || belief.obstacles.length || belief.biases.length
        ? {
            compromises: belief.compromises.map((c) => c.description),
            obstacles: belief.obstacles.map((o) => o.description),
            supporterBiases: belief.biases
              .filter((b) => b.side.includes('support'))
              .map((b) => b.biasType),
            opponentBiases: belief.biases
              .filter((b) => !b.side.includes('support'))
              .map((b) => b.biasType),
          }
        : undefined,
    mapping:
      belief.upstreamMappings.length || belief.downstreamMappings.length || belief.similarTo.length
        ? {
            upstreamSupport: belief.upstreamMappings
              .filter((m) => m.side === 'support')
              .map((m) => m.parentBelief.statement),
            upstreamOppose: belief.upstreamMappings
              .filter((m) => m.side !== 'support')
              .map((m) => m.parentBelief.statement),
            downstreamSupport: belief.downstreamMappings
              .filter((m) => m.side === 'support')
              .map((m) => m.childBelief.statement),
            downstreamOppose: belief.downstreamMappings
              .filter((m) => m.side !== 'support')
              .map((m) => m.childBelief.statement),
            moreExtreme: belief.similarTo
              .filter((s) => s.variant === 'extreme')
              .map((s) => s.toBelief.statement),
            moreModerate: belief.similarTo
              .filter((s) => s.variant === 'moderate')
              .map((s) => s.toBelief.statement),
          }
        : undefined,
    legal: belief.legalEntries.length
      ? {
          supporting: belief.legalEntries
            .filter((l) => l.side === 'supporting')
            .map((l) => l.description),
          contradicting: belief.legalEntries
            .filter((l) => l.side !== 'supporting')
            .map((l) => l.description),
        }
      : undefined,
    definitions: belief.definitions.map((d) => ({ term: d.term, definition: d.definition })),
    supports,
    linkMode: opts.linkMode,
  }
}
