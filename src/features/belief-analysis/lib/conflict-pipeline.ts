/**
 * Adapter between the belief page's Prisma rows and the conflict-resolution
 * pipeline (src/core/scoring/conflict-resolution.ts). Read-only: the readout
 * renders beside the hand-curated tables and never writes back.
 */

import {
  analyzeConflict,
  type CbaItemInput,
  type ConflictResolutionReadout,
  type DisputeEvidenceInput,
  type InterestInput,
} from '@/core/scoring/conflict-resolution'
import type {
  ArgumentWithBelief,
  CostBenefitItemRow,
  EvidenceItem,
  InterestEntryItem,
  ValueRankingItem,
} from '../types'

/**
 * A cost/benefit row with its likelihood derived from the claim's own belief
 * page when one is linked — "computed from how THAT belief's pro/con arguments
 * score, never assigned by gut". Falls back to the stored value otherwise.
 */
export interface DerivedCbaItem extends CostBenefitItemRow {
  /** True when likelihood came from the linked claim belief's computed net. */
  likelihoodDerived: boolean
}

/** Map a belief net score (−100..+100) onto a likelihood (0..1). */
function likelihoodFromNet(net: number): number {
  return Math.max(0, Math.min(1, (net + 100) / 200))
}

export function deriveCbaItems(items: CostBenefitItemRow[]): DerivedCbaItem[] {
  return items.map((item) => {
    const net = item.claimBelief?.positivity
    if (net == null) return { ...item, likelihoodDerived: false }
    const likelihood = likelihoodFromNet(net)
    return {
      ...item,
      likelihood,
      expectedValue: item.magnitude != null ? Math.abs(item.magnitude) * likelihood : null,
      likelihoodDerived: true,
    }
  })
}

export function computeConflictReadout(
  interestEntries: InterestEntryItem[],
  valueRankings: ValueRankingItem[],
  costBenefitItems: CostBenefitItemRow[],
  evidence: EvidenceItem[] = [],
  argumentRows: ArgumentWithBelief[] = [],
): ConflictResolutionReadout {
  const interests: InterestInput[] = interestEntries
    .filter((e) => e.side === 'supporter' || e.side === 'opponent')
    .map((e) => ({
      id: e.id,
      side: e.side as 'supporter' | 'opponent',
      interest: e.interest,
      validityScore: e.validityScore ?? null,
      linkageAccuracy: e.linkageAccuracy ?? null,
      prevalenceScore: e.prevalenceScore ?? null,
    }))

  const rankings = valueRankings.map((r) => ({
    id: r.id,
    value: r.value,
    supporterRank: r.supporterRank,
    opponentRank: r.opponentRank,
  }))

  const cbaItems: CbaItemInput[] = deriveCbaItems(costBenefitItems)
    .filter((i) => i.side === 'benefit' || i.side === 'cost')
    .map((i) => ({
      id: i.id,
      side: i.side as 'benefit' | 'cost',
      claim: i.claim,
      category: i.category,
      magnitude: i.magnitude,
      likelihood: i.likelihood,
    }))

  const disputeEvidence: DisputeEvidenceInput[] = evidence
    .filter((e) => e.side === 'supporting' || e.side === 'weakening')
    .map((e) => ({
      side: e.side as 'supporting' | 'weakening',
      impact: e.impactScore,
    }))
  const argumentLinkages = argumentRows.map((a) => a.linkageScore)

  return analyzeConflict(interests, rankings, cbaItems, disputeEvidence, argumentLinkages)
}
