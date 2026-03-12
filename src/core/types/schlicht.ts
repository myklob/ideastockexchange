// Schlicht Protocol Types
// The standardized JSON format for computational epistemology

export type BeliefStatus = 'calibrated' | 'contested' | 'emerging' | 'archived'
export type Volatility = 'low' | 'medium' | 'high'
export type ArgumentSide = 'pro' | 'con'
export type EvidenceQualityTier = 'T1' | 'T2' | 'T3' | 'T4'
export type AgentRole =
  | 'logic_check'
  | 'evidence_curation'
  | 'adversary'
  | 'calibration'
  | 'compression'
  | 'base_rate'

/**
 * Classification of how evidence connects to a conclusion.
 * Used as metadata to seed linkage debate framing.
 */
export type LinkageType =
  | 'causal'               // Evidence represents a direct cause of the conclusion
  | 'necessary_condition'  // Evidence is required for the conclusion to be true
  | 'sufficient_condition' // Evidence alone is enough to prove the conclusion
  | 'strengthener'         // Evidence modifies probability without being a hard requirement

/**
 * Linkage Classification — the logical strength category of a connection.
 * Maps to a default score range and visual treatment.
 *
 * Range: -1.0 (Contradiction) to +1.0 (Deductive Proof)
 */
export type LinkageClassification =
  | 'DEDUCTIVE_PROOF'  // 1.0: If premise true, conclusion must be true
  | 'STRONG_CAUSAL'    // 0.7-0.9: Direct causal evidence
  | 'CONTEXTUAL'       // 0.4-0.6: Helpful context but not decisive
  | 'ANECDOTAL'        // 0.1-0.3: Tangential or minor example
  | 'IRRELEVANT'       // 0.0: No bearing on the topic
  | 'NON_SEQUITUR'     // 0.0: Flagged logical disconnect
  | 'CONTRADICTION'    // -1.0: Premise disproves conclusion

/**
 * Default score ranges for each linkage classification.
 */
export const LINKAGE_CLASSIFICATION_SCORES: Record<LinkageClassification, number> = {
  DEDUCTIVE_PROOF: 1.0,
  STRONG_CAUSAL: 0.8,
  CONTEXTUAL: 0.5,
  ANECDOTAL: 0.2,
  IRRELEVANT: 0.0,
  NON_SEQUITUR: 0.0,
  CONTRADICTION: -1.0,
}

/**
 * User diagnostic answers from the LinkageWizard.
 * These structured questions prevent Gish Galloping by forcing
 * users to justify relevance, not just assert it.
 */
export interface LinkageDiagnostic {
  /** Step 1: Does the argument support or oppose the conclusion? */
  direction: 'support' | 'oppose'
  /** Step 2: "Blue Sky" filter — if 100% true, does it force a change of mind? */
  isRelevant: boolean
  /** Step 3: How strong is the connection? (only if isRelevant = true) */
  strength?: 'proof' | 'strong' | 'context' | 'weak'
}

/**
 * A community vote on the linkage (logical relevance) of an argument.
 * Distinct from truth voting — this measures whether the logic connects.
 */
export interface LinkageVote {
  userId: string
  score: number        // -1.0 to 1.0
  weight: number       // Based on user reputation in "Logic"
  diagnostic?: LinkageDiagnostic
  createdAt: string
}

export interface SchilchtMetrics {
  truthScore: number        // 0-1
  confidenceInterval: number // 0-1
  volatility: Volatility
  adversarialCycles: number
  lastUpdated: string        // ISO 8601
}

export interface SchilchtAgent {
  id: string
  name: string
  role: AgentRole
  version: string
}

export interface DetectedFallacy {
  type: string
  description: string
  impact: number // negative number
}

export interface ArgumentContributor {
  type: 'human' | 'ai'
  name: string
  submittedAt: string // ISO 8601
}

export interface SchilchtArgument {
  id: string
  claim: string
  description: string
  side: ArgumentSide
  truthScore: number        // 0-1: Is the evidence factually accurate?
  linkageScore: number      // -1 to 1: How strongly does this connect to the parent claim?
  linkageDebate?: LinkageDebate  // The sub-debate that determines linkageScore (if present, linkageScore is derived from this)
  linkageClassification?: LinkageClassification  // Categorical classification of the connection strength
  linkageVotes?: LinkageVote[]   // Community votes on the linkage (logic, not truth)
  importanceScore?: number  // 0-1: How much does this argument move the probability? (default 1.0)
  uniquenessScore?: number  // 0-1: How unique is this among sibling arguments? (default 1.0, lower = more redundant)
  impactScore: number       // signed: positive for pro, negative for con (computed)
  certifiedBy: string[]     // agent names
  fallaciesDetected: DetectedFallacy[]
  subArguments?: SchilchtArgument[]  // recursive sub-arguments forming the argument tree
  contributor?: ArgumentContributor
  rebuttal?: {
    id: string
    statement: string
    confidence: number
  }
}

export interface SchilchtEvidence {
  id: string
  tier: EvidenceQualityTier
  tierLabel: string
  title: string
  linkageScore: number
}

export interface ProtocolLogEntry {
  id: string
  timestamp: string        // relative time label (e.g. "Now", "2s", "1m")
  agentName: string
  content: string
}

/**
 * A LinkageDebate is a sub-claim that evaluates the strength of the
 * connection between an argument/evidence and its parent claim.
 *
 * It inherits the same debatable structure as a SchilchtBelief:
 * pro/con argument trees, a computed score, and a status. This makes
 * even the relevance of an argument subject to the same profit-motive
 * and logical rigor as the claim itself.
 *
 * The LinkageDebate's ReasonRank score becomes the linkageScore of
 * the parent argument.
 */
export interface LinkageDebate {
  id: string
  subClaim: string            // e.g., "Evidence A supports Claim B"
  evidenceId: string          // ID of the argument/evidence being evaluated
  parentClaimId: string       // ID of the parent claim
  linkageType: LinkageType    // Classification of the connection
  proArguments: SchilchtArgument[]   // Reasons the link is strong
  conArguments: SchilchtArgument[]   // Reasons the link is weak/irrelevant
  linkageScore: number        // 0-1: derived from ReasonRank of this sub-debate
  status: BeliefStatus        // Same status model as any belief
  createdAt: string           // ISO 8601
  updatedAt: string           // ISO 8601
}

export interface SchilchtBelief {
  beliefId: string
  statement: string
  status: BeliefStatus
  metrics: SchilchtMetrics
  agents: Record<string, SchilchtAgent>
  proTree: SchilchtArgument[]
  conTree: SchilchtArgument[]
  evidence: SchilchtEvidence[]
  protocolLog: ProtocolLogEntry[]
  protocolStatus: {
    claimsPendingLogicCheck: number
    activeRedTeams: number
  }
}
