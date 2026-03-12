/**
 * wikiLaw type definitions
 * The Operating System for Law - types for debugging legislation
 */

import {
  Evidence,
  Assumption,
  Interest,
  CostBenefitItem,
  TruthAssessment,
  LinkageScore
} from './ise-core';

/**
 * Core Law entity - represents a single statute, regulation, or legal rule
 */
export interface Law {
  id: string;

  // Basic metadata
  jurisdiction: string; // State, city, federal
  category: LawCategory;
  officialTitle: string;
  citationCode: string; // e.g., "CA Penal Code § 1234"
  enactedDate: Date;
  lastAmended?: Date;
  status: 'active' | 'repealed' | 'suspended' | 'under_review';

  // Plain-English decode
  plainEnglishSummary: string;
  realWorldImpact: string; // What actually changes for people?

  // Stated vs. Operative purpose
  statedPurpose: string; // What the law claims to do
  operativePurpose: string; // What incentives it actually creates
  purposeGap?: string; // Analysis of mismatch (if any)

  // The core diagnostic data
  operatingAssumptions: Assumption[]; // Beliefs this law depends on
  evidenceAudit: EvidenceAudit;
  justificationTest: JustificationTest;
  stakeholderLedger: StakeholderLedger;
  implementationTracker: ImplementationTracker;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

/**
 * Categories for organizing laws by domain
 */
export type LawCategory =
  | 'criminal_justice'
  | 'housing'
  | 'taxation'
  | 'education'
  | 'healthcare'
  | 'labor'
  | 'environment'
  | 'business_regulation'
  | 'transportation'
  | 'civil_rights'
  | 'election_law'
  | 'other';

/**
 * Evidence Audit - the strongest arguments for and against effectiveness
 */
export interface EvidenceAudit {
  effectiveness: {
    pro: Evidence[];
    con: Evidence[];
    empiricalStudies: string[]; // Links to research
    realWorldExamples: RealWorldExample[];
  };

  // Does it achieve its stated goal?
  achievesStatedGoal: TruthAssessment;

  // What about unintended consequences?
  unintendedConsequences: UnintendedConsequence[];
}

/**
 * Real-world example of this law in action
 */
export interface RealWorldExample {
  jurisdiction: string;
  description: string;
  outcome: 'positive' | 'negative' | 'mixed' | 'unclear';
  source: string;
  date: Date;
}

/**
 * Unintended consequence discovered or predicted
 */
export interface UnintendedConsequence {
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  affectedPopulation: string;
  evidence: Evidence[];
  likelihood: number; // 0-100
}

/**
 * Justification Test - constitutional and values-based scrutiny
 */
export interface JustificationTest {
  // Constitutional analysis
  constitutionalIssues: ConstitutionalIssue[];

  // American Values alignment (from MyClob framework)
  valuesAlignment: ValuesAlignment[];

  // Reversibility test: Does this survive when the other tribe is in power?
  reversibilityTest: {
    survives: boolean;
    reasoning: string;
    vulnerabilities: string[];
  };

  // Proportionality: Does the restriction match the harm?
  proportionality: {
    harmPrevented: string;
    restrictionImposed: string;
    isProportional: boolean;
    reasoning: string;
  };
}

/**
 * Constitutional issue or conflict
 */
export interface ConstitutionalIssue {
  provision: string; // e.g., "First Amendment", "Equal Protection Clause"
  conflict: string;
  severity: 'potential' | 'likely' | 'clear_violation';
  precedent: string[]; // Relevant case law
}

/**
 * Alignment with American Values framework
 */
export interface ValuesAlignment {
  value: AmericanValue;
  alignment: 'supports' | 'neutral' | 'conflicts';
  reasoning: string;
  importance: 'core' | 'significant' | 'minor';
}

export type AmericanValue =
  | 'equal_protection'
  | 'due_process'
  | 'free_speech'
  | 'free_association'
  | 'property_rights'
  | 'limited_government'
  | 'rule_of_law'
  | 'individual_liberty'
  | 'democratic_participation';

/**
 * Stakeholder Ledger - who pays, who benefits, who gets hurt
 */
export interface StakeholderLedger {
  winners: StakeholderImpact[];
  losers: StakeholderImpact[];
  silentVictims: StakeholderImpact[]; // Second-order effects

  // Distribution analysis
  wealthDistribution: 'progressive' | 'neutral' | 'regressive';
  concentrationOfBenefit: 'diffuse' | 'moderate' | 'concentrated';
  concentrationOfCost: 'diffuse' | 'moderate' | 'concentrated';
}

/**
 * Impact on a specific stakeholder group
 */
export interface StakeholderImpact {
  group: string;
  size: number; // Approximate number of people affected
  impactType: 'economic' | 'legal' | 'social' | 'health' | 'freedom';
  magnitude: CostBenefitItem['magnitude'];
  description: string;
  evidence: Evidence[];
}

/**
 * Implementation Tracker - statute vs. reality gap
 */
export interface ImplementationTracker {
  // How is it actually enforced?
  enforcementPattern: {
    statutoryRequirement: string;
    actualPractice: string;
    gap?: string;
    disparateImpact: boolean;
    evidence: Evidence[];
  }[];

  // Resources and capacity
  budgetAllocated: number;
  budgetRequired: number;
  enforcementCapacity: 'adequate' | 'strained' | 'inadequate';

  // Compliance and gaming
  complianceRate: number; // 0-100 (if measurable)
  commonWorkarounds: string[];
  regulatoryCapture: {
    present: boolean;
    description?: string;
    evidence?: Evidence[];
  };
}

/**
 * Proposal for changing a law - "Pull Request for Society"
 */
export interface LawProposal {
  id: string;
  lawId: string; // The law being amended

  // Metadata
  title: string;
  proposedBy: string;
  createdAt: Date;
  status: 'draft' | 'under_review' | 'accepted' | 'rejected' | 'implemented';

  // Required fields for structured proposal
  goal: ProposalGoal;
  mechanism: ProposalMechanism;
  evidenceBase: Evidence[];
  tradeoffAudit: ProposalTradeoffs;

  // The actual proposed change
  currentText: string;
  proposedText: string;
  changes: TextChange[];

  // Community review
  reviews: ProposalReview[];
  upvotes: number;
  downvotes: number;

  // AI analysis
  aiAnalysis?: AIProposalAnalysis;
}

/**
 * Goal of the proposal - tied to Interests framework
 */
export interface ProposalGoal {
  problem: string; // What measurable failure are you fixing?
  affectedPopulation: string;
  currentMetric: string; // Current state
  targetMetric: string; // Desired state
  linkedInterests: Interest[];
}

/**
 * Mechanism - how the change works
 */
export interface ProposalMechanism {
  causalChain: string; // "People will do X because Y"
  assumptions: Assumption[]; // What must be true for this to work?
  timeframe: string; // When would effects appear?
  requiredResources: string[];
}

/**
 * Tradeoff audit for proposal
 */
export interface ProposalTradeoffs {
  costs: CostBenefitItem[];
  benefits: CostBenefitItem[];
  risks: Risk[];

  // Honesty credit: Did proposer acknowledge downsides?
  acknowledgesDownsides: boolean;
  honestyScore: number; // 0-100
}

/**
 * Risk associated with proposal
 */
export interface Risk {
  description: string;
  likelihood: number; // 0-100
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
  mitigation?: string;
}

/**
 * Text change in proposal
 */
export interface TextChange {
  type: 'addition' | 'deletion' | 'modification';
  section: string;
  before?: string;
  after: string;
}

/**
 * Community review of a proposal
 */
export interface ProposalReview {
  id: string;
  reviewerId: string;
  createdAt: Date;

  // Structured feedback
  strengthsIdentified: string[];
  weaknessesIdentified: string[];
  questionsRaised: string[];
  suggestedImprovements: string[];

  // Assessment
  recommendationOverall: 'strongly_support' | 'support' | 'neutral' | 'oppose' | 'strongly_oppose';
  reasoning: string;

  // Specific critiques
  mechanismChallenges: string[]; // Flaws in causal logic
  evidenceGaps: string[]; // Missing data or weak evidence
  tradeoffsOverlooked: string[]; // Costs not accounted for
}

/**
 * AI analysis of proposal quality
 */
export interface AIProposalAnalysis {
  timestamp: Date;

  // Gap detection
  missingTradeoffs: string[];
  causalGaps: string[];
  assumptionFlaws: string[];

  // Citation quality
  citationChainAnalysis: {
    source: string;
    isOriginalResearch: boolean;
    citationDepth: number;
    credibilityScore: number;
  }[];

  // Logical consistency
  internalContradictions: string[];

  // Overall assessment
  qualityScore: number; // 0-100
  flagsForHumanReview: string[];
}

/**
 * Comparison between law versions
 */
export interface LawComparison {
  currentVersion: Law;
  proposedVersion: Law;

  differences: {
    field: string;
    current: any;
    proposed: any;
    impact: string;
  }[];

  aggregateImpact: {
    improvesEffectiveness: boolean;
    improvesJustification: boolean;
    reducesCost: boolean;
    reducesHarm: boolean;
    overallScore: number; // -100 to +100
  };
}
