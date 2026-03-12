import { NextResponse } from 'next/server'
import { getAllSchilchtBeliefs, getBeliefScoreBreakdown } from '@/features/epistemology/data/schlicht-data'
import { getAllCBAs } from '@/features/cost-benefit-analysis/data/cba-data'
import { scoreLikelihoodEstimate } from '@/core/scoring/scoring-engine'
import {
  calculateConfidenceStabilityScore,
  calculateTruthScoreBreakdown,
  calculateMediaScores,
  calculateBeliefEquivalencyScore,
  calculateTopicOverlapScore,
  aggregateObjectiveCriteriaScores,
  calculateObjectiveCriteriaScore,
  inferGenreFromMediaType,
} from '@/core/scoring/all-scores'

/**
 * GET /api/scoring
 *
 * Returns a complete view of how all scoring systems connect.
 * This endpoint demonstrates the unified scoring engine in action
 * across Protocol beliefs, CBA likelihood estimates, and all 11
 * ReasonRank score dimensions.
 */
export async function GET() {
  const beliefs = getAllSchilchtBeliefs()
  const cbas = getAllCBAs()

  const protocolScores = beliefs.map((belief) => {
    const breakdown = getBeliefScoreBreakdown(belief.beliefId)

    // ── 1. Truth Score (Logical Validity + Verification) ──────────────
    const truthBreakdown = calculateTruthScoreBreakdown(
      [...belief.proTree, ...belief.conTree].map(arg => ({
        side: arg.side,
        truthScore: arg.truthScore,
        fallacyPenalty: arg.fallaciesDetected.reduce(
          (s, f) => s + Math.abs(f.impact) / 100, 0
        ),
        impactScore: arg.impactScore,
      })),
      belief.evidence.map(ev => ({
        side: 'supporting',
        evsScore: 0.5,  // In-memory beliefs don't store EVS; use default
        linkageScore: ev.linkageScore,
      })),
    )

    // ── 7. Confidence Stability Score ─────────────────────────────────
    const proStrength = breakdown?.proArgumentStrength ?? 0
    const conStrength = breakdown?.conArgumentStrength ?? 0
    const argCount = (breakdown?.proArgumentCount ?? 0) + (breakdown?.conArgumentCount ?? 0)
    const stabilityResult = calculateConfidenceStabilityScore(proStrength, conStrength, argCount)

    // ── 10. Topic Overlap Score ────────────────────────────────────────
    const allArgs = [...belief.proTree, ...belief.conTree]
    const argTexts = allArgs.map(arg => ({ id: arg.id, text: arg.claim }))
    const topicOverlap = argTexts.length > 1
      ? calculateTopicOverlapScore(argTexts)
      : { averageUniqueness: 1.0, duplicatePairCount: 0 }

    return {
      id: belief.beliefId,
      statement: belief.statement,
      status: belief.status,

      // All 11 ReasonRank score dimensions
      scores: {
        // 1. Truth Scores
        truth_score: belief.metrics.truthScore,
        logical_validity_score: truthBreakdown.logicalValidityScore,
        verification_truth_score: truthBreakdown.verificationTruthScore,

        // 2. Linkage Score
        average_linkage_score: breakdown?.linkageScore ?? 0.5,

        // 3. Importance Score
        importance_weighted_score: breakdown
          ? breakdown.proArgumentStrength / Math.max(0.001, breakdown.proArgumentStrength + breakdown.conArgumentStrength)
          : 0.5,

        // 4. Evidence Score (EVS)
        evidence_score: breakdown?.evidenceScore ?? 0,
        evidence_count: breakdown?.evidenceCount ?? 0,

        // 5. Cost/Benefit Likelihood Score (handled via CBA system)
        cba_likelihood_score: null,  // CBA beliefs handled in cost_benefit_analyses section

        // 6. Objective Criteria Score (Protocol uses argument tree for this)
        objective_criteria_score: null,  // Not stored on in-memory Protocol beliefs

        // 7. Confidence Stability Score
        confidence_stability: stabilityResult.stabilityScore,
        stability_status: stabilityResult.status,

        // 8. Media Truth Score (Protocol beliefs don't have media resources)
        media_truth_score: null,

        // 9. Media Genre Score
        media_genre_score: null,

        // 10. Topic Overlap Score
        topic_overlap_score: topicOverlap.averageUniqueness,
        duplicate_argument_pairs: topicOverlap.duplicatePairCount,

        // 11. Belief Equivalency Score (not linked in Protocol beliefs)
        belief_equivalency_score: null,
      },

      // Legacy breakdown for backwards compatibility
      breakdown: breakdown
        ? {
            pro_argument_strength: breakdown.proArgumentStrength,
            con_argument_strength: breakdown.conArgumentStrength,
            evidence_score: breakdown.evidenceScore,
            average_linkage: breakdown.linkageScore,
            argument_count: argCount,
            evidence_count: breakdown.evidenceCount,
          }
        : null,

      // Meta
      confidence_interval: belief.metrics.confidenceInterval,
      volatility: belief.metrics.volatility,
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

      // ── 7. Confidence Stability for this CBA item ──────────────────
      const proS = activeBreakdown?.proStrength ?? 0
      const conS = activeBreakdown?.conStrength ?? 0
      const argCnt = activeBreakdown?.argumentBreakdowns.length ?? 0
      const itemStability = calculateConfidenceStabilityScore(proS, conS, argCnt)

      return {
        id: item.id,
        title: item.title,
        type: item.type,
        predicted_impact: item.predictedImpact,

        // 5. Cost/Benefit Likelihood Score
        likelihood: {
          active_probability: item.likelihoodBelief.activeLikelihood,
          status: item.likelihoodBelief.status,
          confidence_interval: item.likelihoodBelief.confidenceInterval,
          competing_estimates: item.likelihoodBelief.estimates.length,
        },
        expected_value: item.expectedValue,

        // ReasonRank breakdown for the active estimate
        active_estimate_breakdown: activeBreakdown
          ? {
              reason_rank_score: activeBreakdown.reasonRankScore,
              pro_strength: activeBreakdown.proStrength,
              con_strength: activeBreakdown.conStrength,
              argument_count: activeBreakdown.argumentBreakdowns.length,
              // 7. Stability on this estimate
              confidence_stability: itemStability.stabilityScore,
              stability_status: itemStability.status,
            }
          : null,
      }
    }),
  }))

  return NextResponse.json(
    {
      scoring_engine: 'unified-v2',
      description:
        'All 11 ReasonRank scoring dimensions — Protocol beliefs, CBA likelihoods, ' +
        'evidence verification, linkage, importance, objective criteria, confidence stability, ' +
        'media truth/genre, topic overlap, and belief equivalency — flow through a single engine.',

      // Documentation of all 11 score types
      score_types: {
        // Fundamental Scores
        '1_truth_score': {
          description: 'Foundation score. ReasonRank applied to logical validity and empirical verification.',
          components: ['logical_validity_score', 'verification_truth_score'],
          formula: 'TruthScore = (LogicalValidity + VerificationTruth) / 2',
        },
        '2_linkage_score': {
          description: 'Evidence-to-conclusion relevance. Tests whether the facts actually support THIS conclusion, not just point in the same direction.',
          formula: 'LS = (A − D) / (A + D) where A=pro-linkage-args, D=con-linkage-args',
        },
        '3_importance_score': {
          description: 'How much a specific argument moves the probability needle. Separates truth from relevance.',
          formula: 'impact = reasonRank × linkage × importanceScore × uniqueness',
        },
        '4_evidence_score': {
          description: 'EVS: source quality × replication × conclusion relevance × replication consistency.',
          formula: 'EVS = ESIW × log2(ERQ + 1) × ECRS × ERP',
        },
        '5_cba_likelihood_score': {
          description: 'Probability a projected cost or benefit will actually occur, based on argument tree strength.',
          formula: 'probability = ProRank / (ProRank + ConRank) across competing estimates',
        },
        '6_objective_criteria_score': {
          description: 'Performance against measurable benchmarks that don\'t depend on values or ideology.',
          formula: 'criteriaScore = independenceScore × linkageScore, aggregated by linkage weight',
        },
        '7_confidence_stability_score': {
          description: 'How settled a score is under sustained scrutiny. Stable scores have survived many arguments.',
          formula: 'stability = argDepthFactor × (0.4 + 0.6 × dominanceRatio)',
        },
        // Administrative Scores
        '8_media_truth_score': {
          description: 'Flags editorializing, sensationalism, or misleading framing in source material.',
          formula: 'mediaTruth = genreBaseTruth[genre] (peer_reviewed=0.9 → social_media=0.15)',
        },
        '9_media_genre_score': {
          description: 'Source reliability weight by genre. Mirrors evidence tier system (T1–T4) for media.',
          formula: 'genreScore = GENRE_RELIABILITY[genre] (T1=1.0, T2=0.75, T3=0.5, T4=0.25)',
        },
        '10_topic_overlap_score': {
          description: 'Prevents the same point from inflating a score because ten people said it slightly differently.',
          formula: 'uniqueness = 1 − maxSimilarityToAnyPriorArgument',
        },
        '11_belief_equivalency_score': {
          description: 'Identifies two differently-worded beliefs making the same underlying claim.',
          formula: 'equivalency = 0.4 × mechanicalSimilarity + 0.6 × semanticSimilarity',
        },
      },

      formula: 'TruthScore = ProRank / (ProRank + ConRank) + EvidenceContribution, where each arg ReasonRank = (1-d) × baseTruth + d × f(proSubRank - conSubRank)',
      protocol_beliefs: protocolScores,
      cost_benefit_analyses: cbaScores,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Protocol': 'scoring-engine-v2',
      },
    }
  )
}
