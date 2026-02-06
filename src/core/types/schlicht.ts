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
