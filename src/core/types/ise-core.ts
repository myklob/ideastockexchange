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
 * Linkage Score - measures how strongly one concept depends on another
 * Used to map dependency trees between laws, assumptions, and evidence
 */
export interface LinkageScore {
  fromId: string;
  fromType: 'law' | 'assumption' | 'interest' | 'evidence';
  toId: string;
  toType: 'law' | 'assumption' | 'interest' | 'evidence';
  strength: number; // 0-100: how critical is this dependency?
  reasoning: string; // Why does this linkage exist?
  verifiedBy: string[];
  createdAt: Date;
}
