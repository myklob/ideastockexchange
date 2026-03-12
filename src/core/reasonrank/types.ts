/**
 * ReasonRank Dependency Engine — Type Definitions
 *
 * ReasonRank is a Dependency Engine, not a Citation Engine.
 * In a citation graph, removing a link leaves the target valid.
 * In a dependency graph, removing a premise collapses the conclusion.
 *
 * These types model the three node types (Claim, Argument, Evidence)
 * and four edge types (SUPPORTS, ATTACKS, HAS_EVIDENCE, SIMILAR_TO)
 * that form the reasoning graph.
 */

// ─── Verification Status ──────────────────────────────────────

export type VerificationStatus = 'VERIFIED' | 'FALSIFIED' | 'DISPUTED' | 'UNVERIFIED'

// ─── Argument Type ────────────────────────────────────────────

/** Whether an argument targets truth or relevance of its parent */
export type ArgumentType = 'TRUTH' | 'RELEVANCE'

// ─── Edge Types ───────────────────────────────────────────────

export type EdgeType = 'SUPPORTS' | 'ATTACKS' | 'HAS_EVIDENCE' | 'SIMILAR_TO'

// ─── Node Interfaces ──────────────────────────────────────────

/**
 * Claim — the root thesis.
 * A claim's score is entirely derived from its supporting/attacking arguments.
 */
export interface ClaimNode {
  id: string
  type: 'CLAIM'
  statement: string
  /** Computed: the global rank of this claim (0–1) */
  globalRank: number
}

/**
 * Argument — the structural beam.
 * An argument can support or attack a claim (or another argument).
 * Its score is recursively computed from its children and evidence.
 */
export interface ArgumentNode {
  id: string
  type: 'ARGUMENT'
  statement: string
  argumentType: ArgumentType
  /** Default impact before modifiers (default 1.0) */
  baseImpact: number
  /** Computed: the current recursive score of this argument (0–1) */
  currentScore: number
}

/**
 * Evidence — the anchor.
 * Evidence is the leaf-level ground truth that anchors the graph.
 * Falsified evidence acts as a circuit breaker (Invariant I4).
 */
export interface EvidenceNode {
  id: string
  type: 'EVIDENCE'
  url: string
  description: string
  verificationStatus: VerificationStatus
  /** Computed: evidence score (0 if FALSIFIED, else based on status) */
  evidenceScore: number
}

export type GraphNode = ClaimNode | ArgumentNode | EvidenceNode

// ─── Edge Interfaces ──────────────────────────────────────────

/**
 * SUPPORTS edge — an argument structurally supports a claim or argument.
 * Relevance is a property of the EDGE, not the node (Invariant I5).
 */
export interface SupportsEdge {
  id: string
  type: 'SUPPORTS'
  sourceId: string // Argument
  targetId: string // Claim or Argument
  /** How relevant this argument is to its parent (0–1). Severs transmission at 0. */
  relevance: number
}

/**
 * ATTACKS edge — an argument structurally attacks a claim or argument.
 * Counter-arguments reduce the net force applied to the parent.
 */
export interface AttacksEdge {
  id: string
  type: 'ATTACKS'
  sourceId: string // Argument
  targetId: string // Claim or Argument
  /** How relevant this attack is to its parent (0–1) */
  relevance: number
}

/**
 * HAS_EVIDENCE edge — links an argument to its evidence anchor.
 */
export interface HasEvidenceEdge {
  id: string
  type: 'HAS_EVIDENCE'
  sourceId: string // Argument
  targetId: string // Evidence
}

/**
 * SIMILAR_TO edge — inferred by ML, connects semantically similar arguments.
 * Used for the uniqueness/diminishing returns calculation (Invariant I3).
 */
export interface SimilarToEdge {
  id: string
  type: 'SIMILAR_TO'
  sourceId: string // Argument
  targetId: string // Argument
  /** Semantic similarity score (0–1). Higher = more redundant. */
  similarityScore: number
}

export type GraphEdge = SupportsEdge | AttacksEdge | HasEvidenceEdge | SimilarToEdge

// ─── Score Breakdown ──────────────────────────────────────────

/** Full breakdown of how a node's score was computed */
export interface ScoreBreakdown {
  nodeId: string
  /** Intrinsic score: base × uniqueness × evidence */
  intrinsicScore: number
  /** Uniqueness factor after diminishing returns (0–1) */
  uniquenessFactor: number
  /** Evidence score (0 if any FALSIFIED, else average) */
  evidenceScore: number
  /** Extrinsic score: net force from children */
  extrinsicScore: number
  /** Supporting force from children */
  supportingForce: number
  /** Attacking force from children */
  attackingForce: number
  /** Final computed score */
  finalScore: number
  /** Whether this node is "dead" (counter > support, clamped to 0) */
  isDead: boolean
}

// ─── Propagation Event ────────────────────────────────────────

export interface PropagationEvent {
  nodeId: string
  previousScore: number
  newScore: number
  delta: number
  depth: number
  timestamp: number
}

// ─── Configuration ────────────────────────────────────────────

export interface ReasonRankConfig {
  /** Minimum score change to trigger propagation (default 0.001) */
  epsilon: number
  /** Maximum propagation depth to prevent infinite loops (default 100) */
  maxDepth: number
  /** Base score for new arguments (default 1.0) */
  baseScore: number
}

export const DEFAULT_CONFIG: ReasonRankConfig = {
  epsilon: 0.001,
  maxDepth: 100,
  baseScore: 1.0,
}

// ─── Verification Score Mapping ───────────────────────────────

export const VERIFICATION_SCORES: Record<VerificationStatus, number> = {
  VERIFIED: 1.0,
  DISPUTED: 0.5,
  UNVERIFIED: 0.5,
  FALSIFIED: 0.0,
}
