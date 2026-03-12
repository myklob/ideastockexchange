/**
 * Core type definitions for Idea Stock Exchange framework concepts
 * These foundational types underpin the wikiLaw implementation
 */

/**
 * Quality score for evidence and arguments
 * Based on rigor, replicability, and resistance to motivated reasoning
 */
export interface QualityScore {
  overall: number; // 0-100
  rigor: number; // Methodological soundness
  replicability: number; // Can it be independently verified?
  transparency: number; // Are assumptions and limitations explicit?
  timestamp: Date;
  scoredBy?: string; // Optional: who assessed this
}

/**
 * Evidence - empirical data or logical argument supporting/opposing a claim
 * Links to the Truth framework for verification
 */
export interface Evidence {
  id: string;
  type: 'empirical' | 'logical' | 'anecdotal' | 'expert_opinion';
  claim: string; // What does this evidence assert?
  source: string; // Citation, URL, or reference
  quality: QualityScore;
  context: string; // When/where does this apply?
  limitations: string[]; // Explicit weaknesses and boundaries
  supports: 'pro' | 'con' | 'mixed';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Assumption - a belief about how reality works that a law depends on
 * This is the key mechanism for exposing the operating logic of legislation
 */
export interface Assumption {
  id: string;
  statement: string; // "X causes Y" or "People respond to Z incentive"
  domain: string; // Economics, psychology, sociology, etc.
  testability: 'easily_testable' | 'testable' | 'difficult' | 'unfalsifiable';
  evidence: Evidence[]; // What data supports/refutes this?
  controversyLevel: number; // 0-100: how much disagreement exists?
  linkedLaws: string[]; // IDs of laws that depend on this assumption
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interest - a measurable goal or outcome that stakeholders care about
 * Not "what should be" but "what specific people actually want to happen"
 */
export interface Interest {
  id: string;
  stakeholder: string; // Who holds this interest?
  goal: string; // What specific outcome do they want?
  measurable: boolean; // Can success/failure be objectively determined?
  metrics: string[]; // How would you measure this?
  weight: number; // How important is this to the stakeholder? (0-100)
  conflictsWith: string[]; // IDs of incompatible interests
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cost-Benefit item for analyzing tradeoffs
 */
export interface CostBenefitItem {
  description: string;
  stakeholder: string; // Who pays/benefits?
  magnitude: 'low' | 'medium' | 'high' | 'critical';
  certainty: number; // 0-100: how confident are we this will occur?
  timeframe: 'immediate' | 'short_term' | 'long_term';
  evidence: Evidence[];
}

/**
 * Truth verification - framework for evaluating claims
 */
export interface TruthAssessment {
  claim: string;
  verificationMethod: 'empirical' | 'logical' | 'definitional' | 'value_judgment';
  confidence: number; // 0-100
  evidence: Evidence[];
  counterEvidence: Evidence[];
  consensusLevel: 'strong_consensus' | 'moderate_agreement' | 'contested' | 'no_consensus';
  lastVerified: Date;
}

/**
 * Base interface for any node that can be debated via pro/con arguments.
 * Both claims and linkage scores share this structure, enabling recursive
 * "performance-based" scoring where even the relevance of an argument
 * is subject to the same logical rigor as the claim itself.
 */
export interface DebatableNode {
  id: string;
  statement: string;           // The claim being debated
  proArguments: LinkageArgument[];
  conArguments: LinkageArgument[];
  score: number;               // 0-1: derived from ReasonRank of the debate
  status: 'emerging' | 'contested' | 'calibrated' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A simplified argument within a linkage debate.
 * Uses the same structure as top-level arguments to enable recursive scoring.
 */
export interface LinkageArgument {
  id: string;
  claim: string;
  side: 'pro' | 'con';
  truthScore: number;          // 0-1
  importanceScore: number;     // 0-1
  certifiedBy: string[];
  createdAt: Date;
}

/**
 * Classification of how evidence connects to a conclusion.
 * Used as metadata to seed linkage debate framing.
 */
export type LinkageType =
  | 'causal'               // Evidence represents a direct cause of the conclusion
  | 'necessary_condition'  // Evidence is required for the conclusion to be true
  | 'sufficient_condition' // Evidence alone is enough to prove the conclusion
  | 'strengthener';        // Evidence modifies probability without being a hard requirement

/**
 * Linkage Score - measures how strongly one concept supports/depends on another.
 *
 * The LS is NOT a static calculation. It is a dynamic score determined by its
 * own dedicated pro-con sub-arguments (a "Linkage Debate"). Every link between
 * evidence and a claim is treated as a sub-claim that must be defended and tested.
 *
 * Extends DebatableNode so it can hold its own list of pro and con arguments,
 * enabling the recursive "performance-based" scoring required by the framework.
 */
export interface LinkageScore extends DebatableNode {
  fromId: string;
  fromType: 'law' | 'assumption' | 'interest' | 'evidence';
  toId: string;
  toType: 'law' | 'assumption' | 'interest' | 'evidence';
  linkageType: LinkageType;    // Classification of the connection
  strength: number;            // 0-100: derived from the linkage debate ReasonRank
  reasoning: string;           // Auto-generated sub-claim, e.g., "Evidence A supports Claim B"
  verifiedBy: string[];
}
