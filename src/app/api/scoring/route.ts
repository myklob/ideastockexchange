import { NextResponse } from 'next/server'
import { getAllSchilchtBeliefs, getBeliefScoreBreakdown } from '@/features/epistemology/data/schlicht-data'
import { getAllCBAs } from '@/features/cost-benefit-analysis/data/cba-data'
import { scoreLikelihoodEstimate } from '@/core/scoring/scoring-engine'

/**
 * GET /api/scoring
 *
 * Returns a complete view of how all scoring systems connect.
 * This endpoint demonstrates the unified scoring engine in action
 * across both Protocol beliefs and CBA likelihood estimates.
 */
export async function GET() {
  const beliefs = getAllSchilchtBeliefs()
  const cbas = getAllCBAs()

  const protocolScores = beliefs.map((belief) => {
    const breakdown = getBeliefScoreBreakdown(belief.beliefId)
    return {
      id: belief.beliefId,
      statement: belief.statement,
      status: belief.status,
      scores: {
        truth_score: belief.metrics.truthScore,
        confidence_interval: belief.metrics.confidenceInterval,
        volatility: belief.metrics.volatility,
      },
      breakdown: breakdown
        ? {
            pro_argument_strength: breakdown.proArgumentStrength,
            con_argument_strength: breakdown.conArgumentStrength,
            evidence_score: breakdown.evidenceScore,
            average_linkage: breakdown.linkageScore,
            argument_count: breakdown.proArgumentCount + breakdown.conArgumentCount,
            evidence_count: breakdown.evidenceCount,
          }
        : null,
    }
  })

  const cbaScores = cbas.map((cba) => ({
    id: cba.id,
    title: cba.title,
    status: cba.status,
    summary: {
      total_expected_benefits: cba.totalExpectedBenefits,
      total_expected_costs: cba.totalExpectedCosts,
      net_expected_value: cba.netExpectedValue,
    },
    items: cba.items.map((item) => {
      const activeEstimate = item.likelihoodBelief.estimates.find((e) => e.isActive)
      const activeBreakdown = activeEstimate
        ? scoreLikelihoodEstimate(activeEstimate)
        : null

      return {
        id: item.id,
        title: item.title,
        type: item.type,
        predicted_impact: item.predictedImpact,
        likelihood: {
          active_probability: item.likelihoodBelief.activeLikelihood,
          status: item.likelihoodBelief.status,
          confidence_interval: item.likelihoodBelief.confidenceInterval,
          competing_estimates: item.likelihoodBelief.estimates.length,
        },
        expected_value: item.expectedValue,
        active_estimate_breakdown: activeBreakdown
          ? {
              reason_rank_score: activeBreakdown.reasonRankScore,
              pro_strength: activeBreakdown.proStrength,
              con_strength: activeBreakdown.conStrength,
              argument_count: activeBreakdown.argumentBreakdowns.length,
            }
          : null,
      }
    }),
  }))

  return NextResponse.json(
    {
      scoring_engine: 'unified-v1',
      description:
        'All scoring — Protocol beliefs, CBA likelihoods, evidence verification, linkage — ' +
        'flows through a single scoring engine. This endpoint shows the current state of all scores.',
      score_types: {
        reason_rank:
          'Foundation score. Argument tree strength after adversarial scrutiny. Used by both Protocol and CBA.',
        truth_score:
          'ReasonRank applied to logical validity and empirical verification. 0-1 normalized.',
        linkage_score:
          'ReasonRank applied to evidence-to-conclusion relevance. High = directly relevant.',
        evidence_score:
          'EVS = ESIW * log2(ERQ+1) * ECRS * ERP. Weights peer-reviewed > expert > journalism > opinion.',
        importance_weight:
          'Combines ReasonRank with cost/benefit analysis weighting. How much this argument matters.',
        likelihood_score:
          'ReasonRank applied to probability predictions. Competing estimates argue for their probability.',
        objective_criteria:
          'Highest ReasonRank-scoring standards for measuring belief strength.',
      },
      formula: 'TruthScore = ProRank / (ProRank + ConRank) + EvidenceContribution, where each arg ReasonRank = (1-d) × baseTruth + d × f(proSubRank - conSubRank)',
      protocol_beliefs: protocolScores,
      cost_benefit_analyses: cbaScores,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Protocol': 'scoring-engine-v1',
      },
    }
  )
}
