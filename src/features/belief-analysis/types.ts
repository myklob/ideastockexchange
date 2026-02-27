// Types for the Belief Analysis template
// These map to the Prisma models but are used as plain objects in components

export interface BeliefWithRelations {
  id: number
  slug: string
  statement: string
  category: string | null
  subcategory: string | null
  deweyNumber: string | null
  positivity: number
  /** Confidence Stability Score (0-1): how settled this belief's score is under scrutiny. */
  stabilityScore: number
  /**
   * Claim Strength (0-1): how much this belief asserts, and therefore how much evidence
   * it requires to be defensible. Four bands: Weak (0.2) / Moderate (0.5) / Strong (0.8) / Extreme (1.0).
   * A weak claim can achieve a high score with modest evidence. An extreme claim must earn its
   * score through extraordinary evidence — or it scores near zero. See /algorithms/strong-to-weak.
   */
  claimStrength: number

  arguments: ArgumentWithBelief[]
  evidence: EvidenceItem[]
  objectiveCriteria: ObjectiveCriteriaItem[]
  valuesAnalysis: ValuesAnalysisData | null
  interestsAnalysis: InterestsAnalysisData | null
  assumptions: AssumptionItem[]
  costBenefitAnalysis: CostBenefitData | null
  impactAnalysis: ImpactData | null
  compromises: CompromiseItem[]
  obstacles: ObstacleItem[]
  biases: BiasItem[]
  mediaResources: MediaItem[]
  legalEntries: LegalItem[]
  upstreamMappings: MappingItem[]
  downstreamMappings: MappingItem[]
  similarTo: SimilarBeliefItem[]
  similarFrom: SimilarBeliefItem[]
}

export interface ArgumentWithBelief {
  id: number
  side: string
  linkageScore: number
  impactScore: number
  /** Importance Score (0-1): how much this argument moves the probability needle. */
  importanceScore: number
  linkageType: string
  /** ECLS = Evidence-to-Conclusion, ACLS = Argument-to-Conclusion */
  linkageScoreType: string
  /** Depth in the belief tree (0 = direct child). Used for depth attenuation. */
  depth: number
  belief: {
    id: number
    slug: string
    statement: string
    positivity: number
  }
}

export interface EvidenceItem {
  id: number
  side: string
  description: string
  sourceUrl: string | null
  evidenceType: string
  sourceIndependenceWeight: number
  replicationQuantity: number
  conclusionRelevance: number
  replicationPercentage: number
  /** Evidence Verification Score (EVS): computed quality weight for this evidence item. */
  evsScore: number
  linkageScore: number
  impactScore: number
}

export interface ObjectiveCriteriaItem {
  id: number
  description: string
  independenceScore: number
  linkageScore: number
  criteriaType: string | null
  totalScore: number
}

export interface ValuesAnalysisData {
  supportingAdvertised: string | null
  supportingActual: string | null
  opposingAdvertised: string | null
  opposingActual: string | null
}

export interface InterestsAnalysisData {
  supporterInterests: string | null
  opponentInterests: string | null
  sharedInterests: string | null
  conflictingInterests: string | null
}

export interface AssumptionItem {
  id: number
  side: string
  statement: string
  strength: string
}

export interface CostBenefitData {
  benefits: string | null
  benefitLikelihood: number | null
  costs: string | null
  costLikelihood: number | null
}

export interface ImpactData {
  shortTermEffects: string | null
  shortTermCosts: string | null
  longTermEffects: string | null
  longTermChanges: string | null
}

export interface CompromiseItem {
  id: number
  description: string
}

export interface ObstacleItem {
  id: number
  side: string
  description: string
}

export interface BiasItem {
  id: number
  side: string
  biasType: string
  description: string | null
}

export interface MediaItem {
  id: number
  side: string
  mediaType: string
  title: string
  author: string | null
  url: string | null
  /** Media Truth Score (0-1): flags editorializing, sensationalism, or misleading framing. */
  truthScore: number
  /** Media Genre Score (0-1): reliability weight based on source genre classification. */
  genreScore: number
  /** Genre classification (e.g., peer_reviewed, news_report, opinion). */
  genreType: string
  /** Reliability tier matching Evidence tiers: T1–T4. */
  reliabilityTier: string
}

export interface LegalItem {
  id: number
  side: string
  description: string
  jurisdiction: string | null
}

export interface MappingItem {
  id: number
  direction: string
  side: string
  parentBelief: { id: number; slug: string; statement: string }
  childBelief: { id: number; slug: string; statement: string }
}

export interface SimilarBeliefItem {
  id: number
  variant: string
  /** Belief Equivalency Score (0-1): how much these beliefs make the same underlying claim. */
  equivalencyScore: number
  fromBelief: { id: number; slug: string; statement: string }
  toBelief: { id: number; slug: string; statement: string }
}

// Computed scores for a belief — all 11 ReasonRank score dimensions
export interface BeliefScores {
  // ── Raw totals (unchanged from original) ───────────────────────────────
  totalPro: number
  totalCon: number
  totalSupportingEvidence: number
  totalWeakeningEvidence: number

  // ── 1. Truth Score (-100 to +100, same scale as positivity) ────────────
  overallScore: number
  /**
   * Logical Validity Score (0-1): structural soundness of the argument tree.
   * Reduced by detected fallacies and unsupported logical leaps.
   */
  logicalValidityScore: number
  /**
   * Verification Truth Score (0-1): empirical accuracy of the underlying facts.
   * Computed from EVS-weighted evidence quality and source independence.
   */
  verificationTruthScore: number

  // ── 2. Linkage Score ────────────────────────────────────────────────────
  /** Average linkage score across all arguments (0-1). */
  avgLinkageScore: number

  // ── 3. Importance Score ─────────────────────────────────────────────────
  /** Importance-weighted truth score (0-1): pro / (pro + con) after importance weighting. */
  importanceWeightedScore: number

  // ── 4. Evidence Score (EVS) ─────────────────────────────────────────────
  /** Aggregate Evidence Verification Score (0-1): supporting / (supporting + weakening) EVS. */
  aggregateEvidenceScore: number

  // ── 5. Cost/Benefit Likelihood Score ────────────────────────────────────
  /** Net CBA likelihood (0-1): how likely net benefits exceed net costs. Null if no CBA. */
  cbaLikelihoodScore: number | null

  // ── 6. Objective Criteria Score ─────────────────────────────────────────
  /** Aggregated objective criteria quality (0-1): independence × linkage, weighted. */
  objectiveCriteriaScore: number

  // ── 7. Confidence Stability Score ───────────────────────────────────────
  /** How settled the overall score is under sustained scrutiny (0-1). */
  stabilityScore: number
  /** Stability status: 'robust' | 'established' | 'developing' | 'fragile' */
  stabilityStatus: string

  // ── 8. Media Truth Score ────────────────────────────────────────────────
  /** Average media truth score across all linked resources (0-1). */
  mediaTruthScore: number

  // ── 9. Media Genre and Style Score ──────────────────────────────────────
  /** Average media genre reliability weight across all linked resources (0-1). */
  mediaGenreScore: number

  // ── 10. Topic Overlap Score ─────────────────────────────────────────────
  /** Average argument uniqueness (0-1). 1.0 = all arguments make distinct points. */
  topicOverlapScore: number

  // ── 11. Belief Equivalency Score ────────────────────────────────────────
  /** Max equivalency score with any similar belief (0-1). Null if no similar beliefs. */
  beliefEquivalencyScore: number | null

  // ── 12. Claim Strength / Strong-to-Weak Spectrum ─────────────────────────
  /**
   * The raw claim strength value (0–1) from the belief's own claimStrength field.
   * Weak (0.2) / Moderate (0.5) / Strong (0.8) / Extreme (1.0).
   */
  claimStrength: number
  /**
   * Strength-adjusted ReasonRank score (0–1): the overall score after applying the
   * burden-of-proof scaler. Formula: rawScore × (1.0 − 0.75 × claimStrength).
   * A weak claim with good evidence scores 0.75–0.95. An extreme claim with the
   * same evidence scores only 0.00–0.25. See /algorithms/strong-to-weak.
   */
  strengthAdjustedScore: number
}
