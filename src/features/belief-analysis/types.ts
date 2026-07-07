// Types for the Belief Analysis template
// These map to the Prisma models but are used as plain objects in components

/**
 * Every per-row table on the belief page carries a nullable relationship
 * score: the ReasonRank performance of that row's own pro/con sub-debate
 * about its relationship to the belief. Rows enter and rank only by this
 * score — never by editorial placement. Null renders blank (Rule 6);
 * tables sort by score descending with the highest-scoring content first.
 */
export interface DefinitionItem {
  id: number
  term: string
  definition: string
  score?: number | null
  sortOrder: number
}

export interface TestablePredictionItem {
  id: number
  prediction: string
  timeframe: string | null
  verificationMethod: string | null
  /** "true" if the prediction follows when the belief is true, "false" otherwise. */
  followsIf?: string
  /** What has actually been observed so far, if anything. */
  resultSoFar?: string | null
  score?: number | null
  sortOrder: number
}

/** One row in the Falsifiability Test table: a realistic score-mover. */
export interface FalsifiabilityItemRow {
  id: number
  side: string // "strengthen" | "weaken"
  description: string
  score?: number | null
  sortOrder: number
}

/** One row in the Logical Anatomy table: a component claim of the belief. */
export interface ComponentClaimItem {
  id: number
  claim: string
  claimType: string | null // "Empirical" | "Causal" | "Definitional" | "Normative"
  stated: boolean
  /** If this part is false, does the belief survive? false = load-bearing. */
  survivesWithout: boolean | null
  unstatedAssumptions: string | null
  score?: number | null
  sortOrder: number
}

/** One row in the Benefits / Costs and Risks tables. */
export interface CostBenefitItemRow {
  id: number
  side: string // "benefit" | "cost"
  claim: string
  /** Category (units): dollars / life-years / hours / freedom. */
  category: string | null
  /** Magnitude in explicit category units. */
  magnitude: number | null
  /** Likelihood (0-1), computed from the claim's own pro/con argument scores. */
  likelihood: number | null
  /** Expected Value = Magnitude × Likelihood. Sort key for the table. */
  expectedValue: number | null
  sortOrder: number
  /** The claim's own belief page, when one exists. Its positivity is the
   *  engine-computed net that sources this row's derived likelihood. */
  claimBelief?: { id: number; slug: string; statement: string; positivity?: number } | null
}

/** One row in the Short vs. Long-Term Impacts sub-table. */
export interface ImpactEntryItem {
  id: number
  term: string // "short" | "long"
  description: string
  score?: number | null
  sortOrder: number
}

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
  /**
   * Specificity (0-1): position on the abstraction ladder, where 0 is a highly general
   * principle and 1 is a single concrete instance. The same evidence can support a
   * specific belief strongly while supporting its general parent only weakly — so
   * specificity has to live alongside valence and claim strength, not be folded into them.
   */
  specificity: number

  definitions: DefinitionItem[]
  falsifiability: string | null
  falsifiabilityConfirm: string | null
  falsifiabilityFalsify: string | null
  testablePredictions: TestablePredictionItem[]

  /** One-line interpretation of the Net Belief Score, shown beneath the argument trees. */
  netInterpretation: string | null
  /** Scorecard "Bottom line": one-sentence verdict scoped to the argument tree. */
  bottomLine?: string | null
  /** Scorecard "What would move this score most". */
  scoreMover?: string | null
  /** Logical Anatomy "Logical form" line. */
  logicalForm?: string | null
  /** Header metadata: related belief labels and beliefs this one supports (plain text). */
  relatedBeliefs: string | null
  supportsBeliefs: string | null

  /** High-stakes flag: posting goes through the speed-bump flow (steelman
   *  acknowledgment + principle consistency). Optional so existing data flows. */
  highStakes?: boolean

  valueRankings: ValueRankingItem[]
  interestEntries: InterestEntryItem[]
  sharedInterests: SharedInterestItem[]
  disputeTypes: DisputeTypeItem[]

  falsifiabilityItems?: FalsifiabilityItemRow[]
  componentClaims?: ComponentClaimItem[]
  costBenefitItems?: CostBenefitItemRow[]
  impactEntries?: ImpactEntryItem[]

  /**
   * The contrast class — the mutually exclusive rivals this belief is priced
   * against (the denominator made visible). Optional so existing beliefs keep
   * flowing; populate via seed as topic option sets land. See
   * docs/THE_DENOMINATOR.md and src/core/scoring/contrast-class.ts.
   */
  contrastClass?: ContrastClassData | null

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
  /** Short 2-6 word label for the Argument Trees cell; falls back to belief.statement. */
  claim: string | null
  /** Most famous supporting quote, rendered inline (italic) in the cell. */
  famousQuote: string | null
  /** Display name of the person who made the argument (rendered as ~Name). */
  quoteAuthor: string | null
  /** Link to that person's page; plain text when null (Rule 5). */
  quoteAuthorUrl: string | null
  /** The argument's own displayed score (the "Score" column). Null renders blank (Rule 6). */
  argumentScore: number | null
  /** Importance Score (0-1): how much this argument moves the probability needle. */
  importanceScore: number
  /** Uniqueness factor (0-1): signal added versus earlier same-side siblings.
   *  Null until the engine computes it at scoring time (Rule 6). Optional so
   *  existing Prisma data still flows. */
  uniquenessScore?: number | null
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
    /** Evidence provenance for the "show the work" trace. Optional so
     *  existing Prisma data still flows. */
    evidence?: AgentProvenanceEvidence[]
  }
  /** The belief sourcing this argument's Importance Score, if any. */
  importanceBeliefId: number | null
  importanceBelief: {
    id: number
    slug: string
    statement: string
    positivity: number
  } | null

  /** Agent-ingestion provenance (all optional so existing data still flows).
   *  Display and audit only — never a scoring input. */
  rationale?: string | null
  submittedByAgent?: { id: string; name: string; operator: string | null } | null
  linkageFiveStepCheck?: {
    parentWording: string | null
    sourceWording: string | null
    mechanismSentence: string | null
    /** The placement-time author bracket; the engine supersedes it. */
    provisionalEstimate: number | null
    dominantFactor: string | null
    flagNote: string | null
  } | null
}

/** Evidence provenance shown in an agent-submitted argument's work trace. */
export interface AgentProvenanceEvidence {
  id: number
  description: string
  sourceUrl: string | null
  doi: string | null
  pmid: string | null
  isbn: string | null
  /** The submitting agent's tier assertion; verified separately. */
  tierClaim: string | null
  tierVerified: string | null
  retrievedByAgentId: string | null
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
  /** Empirical standing (VERIFIED / UNVERIFIED / DISPUTED / FALSIFIED); factors
   *  into the engine-computed impact. Optional so existing data flows. */
  verificationStatus?: string | null
  /** The yardstick this row is measured by; its quality multiplies into the
   *  impact. Optional so existing data flows. */
  criterion?: { id: number; description: string; totalScore: number } | null
}

export interface ObjectiveCriteriaItem {
  id: number
  description: string
  validityScore: number
  reliabilityScore: number
  independenceScore: number
  linkageScore: number
  criteriaType: string | null
  totalScore: number
  /** The dedicated quality sub-belief when quality is derived from a debate.
   *  Optional so existing data flows. */
  criterionBeliefId?: number | null
  criterionBelief?: { id: number; slug: string; statement: string } | null
  /** How the criterion is measured (new template column). */
  howToMeasure?: string | null
  /**
   * Where the metric currently sits — e.g., "labor-force participation flat at 62.5%".
   * Optional; renders blank if not provided.
   */
  currentStatus?: string | null
  /** The target/threshold that would settle the debate (new template column). */
  target?: string | null
  /** Reading supporters predict — falls back to `target` when unset. */
  strengthenReading?: string | null
  /** Reading opponents predict; a criterion both sides expect to read the same tests nothing. */
  weakenReading?: string | null
  /**
   * The threshold both sides agreed (or could agree) constitutes resolution —
   * e.g., "+2pp sustained over 3 years would settle the debate".
   */
  thresholdForAgreement?: string | null
}

/**
 * One mutually exclusive option in a belief's contrast class — a rival answer
 * to the same topic question, competing for the same slot. The denominator for
 * the focal belief is the rest of this set (its best rival, in particular).
 */
export interface ContrastClassOption {
  /** Stable id, unique within the class. */
  id: string
  /** Short label for the option ("Targeted sanctions"). */
  label: string
  /** One-line description of the lever/option. */
  oneLine?: string | null
  /**
   * S(o): the option's argument-tree score on a common scale. May be signed.
   * Null renders blank (Rule 6) — the class is still shown, just without OCV.
   */
  score: number | null
  /** Slug to the option's own belief page; plain text when null (Rule 5). */
  slug?: string | null
  /** True for the focal belief — the page this contrast class lives on. */
  isFocal?: boolean
}

/** A belief's contrast class: the shared question plus the rival options. */
export interface ContrastClassData {
  /** The question the options compete to answer (lives on the topic). */
  question: string
  options: ContrastClassOption[]
}

/** One row in the Shared Values, Different Rankings table (new template). */
export interface ValueRankingItem {
  id: number
  value: string
  supporterRank: number | null
  opponentRank: number | null
  whyDiffer: string | null
  score?: number | null
  sortOrder: number
}

/** One row in the Likely Interests of Supporters / Opponents tables (new template). */
export interface InterestEntryItem {
  id: number
  side: string // "supporter" | "opponent"
  interest: string
  prevalence: string | null
  linkageConfidence: string | null
  validity: string | null
  evidenceBasis: string | null
  connectedValue: string | null
  pretextual: boolean
  score?: number | null
  sortOrder: number
  /** Numeric twins (0-100) feeding the conflict-resolution pipeline. Optional
   *  so existing Prisma data still flows. */
  prevalenceScore?: number | null
  linkageAccuracy?: number | null
  validityScore?: number | null
}

/** One row in the Shared Interests table (new template). */
export interface SharedInterestItem {
  id: number
  interest: string
  validity: string | null
  compromiseDirection: string | null
  score?: number | null
  sortOrder: number
}

/** One row in the Dispute Types table (new template). */
export interface DisputeTypeItem {
  id: number
  disputeType: string // "Empirical" | "Definitional" | "Values"
  disagreement: string | null
  evidenceThatMoves: string | null
  score?: number | null
  sortOrder: number
}

export interface ValuesAnalysisData {
  supportingAdvertised: string | null
  supportingActual: string | null
  opposingAdvertised: string | null
  opposingActual: string | null
  /** Advertised vs. Actual Motivations: evidence the two diverge, per side. */
  supportingDivergenceEvidence?: string | null
  opposingDivergenceEvidence?: string | null
  /** Divergence Score per side: performance of the sub-debate that advertised ≠ actual. */
  supportingDivergenceScore?: number | null
  opposingDivergenceScore?: number | null
  /** Answer to "What would shift these rankings?" beneath the Shared Values table. */
  whatWouldShift?: string | null
  /**
   * Optional structured rankings — top-3 values per side with cross-ranking and gap.
   * Empty array means "not yet collected"; the section renders placeholder rows.
   */
  priorityRankings?: ValuePriorityRankingItem[]
  /** Values both sides hold but rank differently here, with per-side context. */
  sharedPriorities?: SharedValuePriorityItem[]
  /** Where each side defends the value they deprioritize on this topic — hypocrisy detector. */
  crossContextChecks?: CrossContextConsistencyItem[]
}

/**
 * One value with its rank under each side. Gap is supporters' rank minus opponents'
 * rank in absolute terms (computed at render time if absent).
 */
export interface ValuePriorityRankingItem {
  value: string
  supportersRank: number | null
  opponentsRank: number | null
  /** Self-reported share (0-100) of each side that names this value as motivating. */
  selfReportedSupportersPct?: number | null
  selfReportedOpponentsPct?: number | null
  /** Confidence we are correctly attributing this ranking (0-1). */
  confidence?: number | null
  /** "observer-attributed" or "self-reported". */
  source?: 'observer-attributed' | 'self-reported' | null
}

export interface SharedValuePriorityItem {
  value: string
  supportersContext: string | null
  opponentsContext: string | null
}

export interface CrossContextConsistencyItem {
  value: string
  /** Which side deprioritizes this value on the current topic. */
  deprioritizedBy: 'supporter' | 'opponent'
  /** Other belief / topic where this same side champions this value. */
  otherTopic: string | null
  /** Slug of the other belief if linkable; plain text otherwise. */
  otherTopicSlug?: string | null
  /** What the asymmetry suggests (interest-driven vs. principled). */
  whatThisSuggests: string | null
}

export interface InterestsAnalysisData {
  supporterInterests: string | null
  opponentInterests: string | null
  sharedInterests: string | null
  conflictingInterests: string | null
  /** Primary Conflict Pair: the ranking difference that drives the debate. */
  primaryPairSupporter?: string | null
  primaryPairSupporterValidity?: number | null
  primaryPairSupporterClaim?: string | null
  primaryPairSupporterDrives?: string | null
  primaryPairOpponent?: string | null
  primaryPairOpponentValidity?: number | null
  primaryPairOpponentClaim?: string | null
  primaryPairOpponentDrives?: string | null
  /** Optional structured rankings — same shape as Value Priority Rankings. */
  priorityRankings?: InterestPriorityRankingItem[]
  /** Per-conflict explanation of why the conflict exists. */
  sharedVsConflicting?: SharedConflictingInterestItem[]
  /** Maps interests at stake to the values each side elevates / deprioritizes. */
  interestValueLinks?: InterestValueLinkItem[]
  /**
   * Per-interest three-scope validity debates, per the Interest Validity Debate
   * Template. Expanded only when an interest's validity score is itself contested;
   * the quick two-score read lives in the rankings tables above. Empty array means
   * "not yet contested" and the section renders the template skeleton.
   */
  validityDebates?: InterestValidityDebate[]
}

/**
 * A single interest's validity debate across the three scopes (valid at all,
 * generally more/less valid than other interests, valid within a specific
 * scenario). Validity traces entirely to the scored reasons below — never to who
 * holds the interest or how loudly it is asserted. All scores are nullable so
 * cells render blank until grounded in real sub-arguments (Rule 6).
 */
export interface InterestValidityDebate {
  /** The interest stated as a need, fear, or desire. */
  interest: string
  /** Maslow band this interest starts from — a prior, not a verdict. e.g. "Safety 70-85". */
  maslowPrior?: string | null

  // ── Scope 1: Is this interest valid at all? ───────────────────────────────
  /** Reasons it IS valid, each tied to a validity criterion. */
  validReasons?: ValidityReasonItem[]
  /** Reasons it is NOT valid, each tied to a validity criterion. */
  invalidReasons?: ValidityReasonItem[]
  /** Resulting Interest Validity (0-100), traceable to the Scope 1 reasons. */
  validityScore?: number | null

  // ── Scope 2: More or less valid than other interests, in general? ─────────
  /** The interest plus competing interests, each with Maslow prior and current validity. */
  generalComparisons?: InterestComparisonItem[]
  /** Reasons this interest ranks higher than the comparison, in general. */
  ranksHigherReasons?: ValidityReasonItem[]
  /** Reasons the other interest ranks higher, in general. */
  ranksLowerReasons?: ValidityReasonItem[]
  /** General ranking verdict, e.g. "above the comparison by 12 points". */
  generalRanking?: string | null

  // ── Scope 3: Validity within specific conflicts or scenarios ──────────────
  /** One block per concrete scenario; a scenario fact can flip the general ranking. */
  scenarios?: InterestScenarioItem[]

  /** Objective, testable criteria a neutral party would use to judge this validity. */
  objectiveCriteria?: string[]
}

/**
 * One scored reason in a validity debate column. The reason is a short label
 * (named by its opening words, per Rule 3); the criterion is the standard it
 * leans on (e.g. "passes the universal test", "rests on a false premise").
 */
export interface ValidityReasonItem {
  /** Signed score, e.g. +35 / -20. Null renders blank (Rule 6). */
  score?: number | null
  /** The reason, named by its opening words (2-6 word label). */
  reason: string
  /** The validity criterion this reason leans on. */
  criterion?: string | null
}

/** One interest in the Scope 2 comparison table. */
export interface InterestComparisonItem {
  interest: string
  /** Maslow prior starting band, e.g. "Safety 70-85". */
  maslowPrior?: string | null
  /** Current validity (0-100). */
  currentValidity?: number | null
  /** True for the interest under analysis, false for a competing interest. */
  isThisInterest?: boolean
}

/** One concrete scenario in the Scope 3 contextual validity debate. */
export interface InterestScenarioItem {
  /** Describe the specific conflict. */
  scenario: string
  /** The interest it collides with in this scenario. */
  competingInterest?: string | null
  /** The scenario fact that moves the ranking (imminence, scale, reversibility, who else is affected). */
  scenarioFact?: string | null
  /** Reasons it should win here, each tied to a scenario fact. */
  winReasons?: ValidityReasonItem[]
  /** Reasons it should yield here, each tied to a scenario fact. */
  yieldReasons?: ValidityReasonItem[]
  /** In-scenario ranking verdict and why scenario facts caused it to differ from Scope 2. */
  inScenarioRanking?: string | null
}

export interface InterestPriorityRankingItem {
  interest: string
  supportersRank: number | null
  opponentsRank: number | null
  selfReportedSupportersPct?: number | null
  selfReportedOpponentsPct?: number | null
  confidence?: number | null
  source?: 'observer-attributed' | 'self-reported' | null
}

export interface SharedConflictingInterestItem {
  sharedInterest: string | null
  conflictingInterest: string | null
  /** Material, structural, or circumstantial reason the conflict exists. */
  whyConflictExists: string | null
}

export interface InterestValueLinkItem {
  interest: string
  side: 'supporter' | 'opponent'
  valueElevated: string | null
  valueDeprioritized: string | null
  confidence?: number | null
}

export interface AssumptionItem {
  id: number
  side: string
  statement: string
  strength: string
  score?: number | null
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
  /** Best Compromise Solutions, three-column form (new template). */
  sharedPremise?: string | null
  synthesis?: string | null
  whyDifficult?: string | null
  /** Score: share of both sides' interests this compromise satisfies. */
  score?: number | null
}

export interface ObstacleItem {
  id: number
  side: string
  description: string
  score?: number | null
}

export interface BiasItem {
  id: number
  side: string
  biasType: string
  description: string | null
  score?: number | null
}

export interface MediaItem {
  id: number
  side: string
  mediaType: string
  title: string
  author: string | null
  url: string | null
  year: number | null
  /** Media Truth Score (0-1): flags editorializing, sensationalism, or misleading framing. */
  truthScore: number
  /** Media Genre Score (0-1): reliability weight based on source genre classification. */
  genreScore: number
  /** Genre classification (e.g., peer_reviewed, news_report, opinion). */
  genreType: string
  /** Reliability tier matching Evidence tiers: T1–T4. */
  reliabilityTier: string
  /** Quality Score (0-1): technical merit of the work regardless of ideological content. */
  qualityScore: number
  /** Linkage Score (0-1): how central the linked belief is to this media's core argument. */
  linkageScore: number
  /** Impact Score (0-1): how much this media moves the needle on the linked belief. */
  impactScore: number
  /** Estimated audience size (copies sold, box office, streams, citations). */
  reach: number
  /** Directness of Advocacy (0-100): how explicitly the media argues for its beliefs. */
  directnessOfAdvocacy: number
  /** Free text describing how this media argues for/against the belief. */
  howItArgues: string | null
  /** Quality arguments about the media itself. */
  qualityArguments?: MediaQualityArgumentItem[]
}

export interface MediaQualityArgumentItem {
  id: number
  side: string
  statement: string
  argumentScore: number
  linkageScore: number
  impactScore: number
}

export interface LegalItem {
  id: number
  side: string
  description: string
  jurisdiction: string | null
  score?: number | null
}

export interface MappingItem {
  id: number
  direction: string
  side: string
  score?: number | null
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
