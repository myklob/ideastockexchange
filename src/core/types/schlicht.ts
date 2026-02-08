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
  linkageScore: number      // 0-1: How strongly does this connect to the parent claim?
  linkageDebate?: LinkageDebate  // The sub-debate that determines linkageScore (if present, linkageScore is derived from this)
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
