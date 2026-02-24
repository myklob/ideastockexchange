import { prisma } from '@/lib/prisma'
import type { BeliefWithRelations, BeliefScores } from '../types'
import {
  calculateTruthScoreBreakdown,
  calculateConfidenceStabilityScore,
  calculateObjectiveCriteriaScore,
  aggregateObjectiveCriteriaScores,
  aggregateMediaScores,
  calculateTopicOverlapScore,
} from '@/core/scoring/all-scores'
import { calculateEVS, getEvidenceTypeWeight } from '@/core/scoring/scoring-engine'

/** Shared include clause for all belief queries — includes all score-related fields. */
const BELIEF_INCLUDE = {
  arguments: {
    include: {
      belief: {
        select: { id: true, slug: true, statement: true, positivity: true },
      },
    },
    orderBy: { impactScore: 'desc' as const },
  },
  evidence: { orderBy: { impactScore: 'desc' as const } },
  objectiveCriteria: { orderBy: { totalScore: 'desc' as const } },
  valuesAnalysis: true,
  interestsAnalysis: true,
  assumptions: true,
  costBenefitAnalysis: true,
  impactAnalysis: true,
  compromises: true,
  obstacles: true,
  biases: true,
  mediaResources: true,
  legalEntries: true,
  upstreamMappings: {
    include: {
      parentBelief: { select: { id: true, slug: true, statement: true } },
      childBelief: { select: { id: true, slug: true, statement: true } },
    },
  },
  downstreamMappings: {
    include: {
      parentBelief: { select: { id: true, slug: true, statement: true } },
      childBelief: { select: { id: true, slug: true, statement: true } },
    },
  },
  similarTo: {
    include: {
      fromBelief: { select: { id: true, slug: true, statement: true } },
      toBelief: { select: { id: true, slug: true, statement: true } },
    },
  },
  similarFrom: {
    include: {
      fromBelief: { select: { id: true, slug: true, statement: true } },
      toBelief: { select: { id: true, slug: true, statement: true } },
    },
  },
} as const

/** Fetch a complete belief with all analysis sections */
export async function fetchBeliefBySlug(slug: string): Promise<BeliefWithRelations | null> {
  const belief = await prisma.belief.findUnique({
    where: { slug },
    include: BELIEF_INCLUDE,
  })

  return belief as BeliefWithRelations | null
}

/** Fetch a belief by numeric ID */
export async function fetchBeliefById(id: number): Promise<BeliefWithRelations | null> {
  const belief = await prisma.belief.findUnique({
    where: { id },
    include: BELIEF_INCLUDE,
  })

  return belief as BeliefWithRelations | null
}

/** List all beliefs (for the /beliefs index page) */
export async function fetchAllBeliefs() {
  return prisma.belief.findMany({
    select: {
      id: true,
      slug: true,
      statement: true,
      category: true,
      subcategory: true,
      positivity: true,
    },
    orderBy: { updatedAt: 'desc' },
  })
}

/** Compute all 11 ReasonRank scores for a belief */
export function computeBeliefScores(belief: BeliefWithRelations): BeliefScores {
  const proArgs = belief.arguments.filter(a => a.side === 'agree')
  const conArgs = belief.arguments.filter(a => a.side === 'disagree')

  // ── Raw totals ─────────────────────────────────────────────────────────
  const totalPro = proArgs.reduce((sum, a) => sum + Math.abs(a.impactScore), 0)
  const totalCon = conArgs.reduce((sum, a) => sum + Math.abs(a.impactScore), 0)

  const supportingEvidence = belief.evidence.filter(e => e.side === 'supporting')
  const weakeningEvidence = belief.evidence.filter(e => e.side === 'weakening')

  const totalSupportingEvidence = supportingEvidence.reduce((sum, e) => sum + Math.abs(e.impactScore), 0)
  const totalWeakeningEvidence = weakeningEvidence.reduce((sum, e) => sum + Math.abs(e.impactScore), 0)

  const totalPositive = totalPro + totalSupportingEvidence
  const totalNegative = totalCon + totalWeakeningEvidence
  const total = totalPositive + totalNegative
  const overallScore = total > 0 ? ((totalPositive - totalNegative) / total) * 100 : 0

  // ── 1. Truth Score (Logical Validity + Verification) ───────────────────
  // Compute EVS for each evidence item if not already stored
  const evidenceWithEVS = belief.evidence.map(ev => {
    const storedEVS = ev.evsScore
    const computedEVS = storedEVS > 0 ? storedEVS : calculateEVS({
      sourceIndependenceWeight: getEvidenceTypeWeight(ev.evidenceType),
      replicationQuantity: ev.replicationQuantity,
      conclusionRelevance: ev.conclusionRelevance,
      replicationPercentage: ev.replicationPercentage,
    })
    return { side: ev.side, evsScore: computedEVS, linkageScore: ev.linkageScore }
  })

  const truthBreakdown = calculateTruthScoreBreakdown(
    belief.arguments.map(a => ({
      side: a.side,
      truthScore: Math.max(0, Math.min(1, Math.abs(a.impactScore) / 100)),
      impactScore: a.impactScore,
    })),
    evidenceWithEVS,
  )

  // ── 2. Linkage Score ────────────────────────────────────────────────────
  const allArgs = belief.arguments
  const avgLinkageScore = allArgs.length > 0
    ? allArgs.reduce((sum, a) => sum + a.linkageScore, 0) / allArgs.length
    : 0.5

  // ── 3. Importance Score ─────────────────────────────────────────────────
  const importanceWeightedPro = proArgs.reduce(
    (s, a) => s + Math.abs(a.impactScore) * a.importanceScore, 0
  )
  const importanceWeightedCon = conArgs.reduce(
    (s, a) => s + Math.abs(a.impactScore) * a.importanceScore, 0
  )
  const importanceTotal = importanceWeightedPro + importanceWeightedCon
  const importanceWeightedScore = importanceTotal > 0
    ? importanceWeightedPro / importanceTotal
    : 0.5

  // ── 4. Evidence Score (EVS aggregate) ───────────────────────────────────
  const supportingEVS = evidenceWithEVS
    .filter(e => e.side === 'supporting')
    .reduce((s, e) => s + e.evsScore, 0)
  const weakeningEVS = evidenceWithEVS
    .filter(e => e.side === 'weakening')
    .reduce((s, e) => s + e.evsScore, 0)
  const totalEVS = supportingEVS + weakeningEVS
  const aggregateEvidenceScore = totalEVS > 0 ? supportingEVS / totalEVS : 0.5

  // ── 5. CBA Likelihood Score ─────────────────────────────────────────────
  const cba = belief.costBenefitAnalysis
  const cbaLikelihoodScore = (() => {
    if (!cba) return null
    const bl = cba.benefitLikelihood
    const cl = cba.costLikelihood
    if (bl === null && cl === null) return null
    const b = bl ?? 0.5
    const c = cl ?? 0.5
    return Math.max(0, Math.min(1, (b - c) / 2 + 0.5))
  })()

  // ── 6. Objective Criteria Score ─────────────────────────────────────────
  const criteriaScores = belief.objectiveCriteria.map(c =>
    calculateObjectiveCriteriaScore(c)
  )
  const objectiveCriteriaScore = aggregateObjectiveCriteriaScores(criteriaScores)

  // ── 7. Confidence Stability Score ───────────────────────────────────────
  const stabilityResult = calculateConfidenceStabilityScore(
    totalPro, totalCon, allArgs.length
  )

  // ── 8 & 9. Media Truth and Genre Scores ────────────────────────────────
  const mediaAgg = aggregateMediaScores(
    belief.mediaResources.map(m => ({
      truthScore: m.truthScore,
      genreScore: m.genreScore,
    }))
  )

  // ── 10. Topic Overlap Score ─────────────────────────────────────────────
  // Use argument statements as text proxies; if text not available use id+side
  const argTexts = allArgs.map(a => ({
    id: String(a.id),
    text: a.belief.statement + ' ' + a.side,
  }))
  const topicOverlapScore = argTexts.length > 1
    ? calculateTopicOverlapScore(argTexts).averageUniqueness
    : 1.0

  // ── 11. Belief Equivalency Score ────────────────────────────────────────
  const allSimilarScores = [
    ...belief.similarTo.map(s => s.equivalencyScore),
    ...belief.similarFrom.map(s => s.equivalencyScore),
  ]
  const beliefEquivalencyScore = allSimilarScores.length > 0
    ? Math.max(...allSimilarScores)
    : null

  return {
    totalPro,
    totalCon,
    totalSupportingEvidence,
    totalWeakeningEvidence,
    overallScore,
    logicalValidityScore: truthBreakdown.logicalValidityScore,
    verificationTruthScore: truthBreakdown.verificationTruthScore,
    avgLinkageScore,
    importanceWeightedScore,
    aggregateEvidenceScore,
    cbaLikelihoodScore,
    objectiveCriteriaScore,
    stabilityScore: stabilityResult.stabilityScore,
    stabilityStatus: stabilityResult.status,
    mediaTruthScore: mediaAgg.avgTruthScore,
    mediaGenreScore: mediaAgg.avgGenreScore,
    topicOverlapScore,
    beliefEquivalencyScore,
  }
}
