/**
 * Core Type Definitions
 *
 * All domain types for the Idea Stock Exchange.
 * Import from '@/core/types' instead of individual files.
 */

// Book types
export * from './book';

// Cost-Benefit Analysis types
export * from './cba';

// Core framework types
export * from './ise-core';

// ISE domain types (exclude Evidence which conflicts with ise-core)
export {
  type AbstractionLevel,
  type IntensityLevel,
  type ValenceType,
  type Belief,
  type Topic,
  type Argument,
  type SortDimension,
  type ViewOptions,
} from './ise';

// Schlicht epistemology types (exclude LinkageType which conflicts with ise-core)
export {
  type BeliefStatus,
  type Volatility,
  type ArgumentSide,
  type EvidenceQualityTier,
  type AgentRole,
  type LinkageClassification,
  LINKAGE_CLASSIFICATION_SCORES,
  type LinkageDiagnostic,
  type LinkageVote,
  type SchilchtMetrics,
  type SchilchtAgent,
  type DetectedFallacy,
  type ArgumentContributor,
  type SchilchtArgument,
  type SchilchtEvidence,
  type ProtocolLogEntry,
  type LinkageDebate,
  type SchilchtBelief,
} from './schlicht';

// WikiLaw legal framework types
export * from './wikilaw';
