/**
 * ReasonRank Dependency Engine
 *
 * A recursive scoring kernel where "Quality" is not a vote,
 * but a calculation of adversarial resilience.
 *
 * Citation Graph: If Node A links to Node B, and Node A is removed, Node B remains valid.
 * Dependency Graph: If Argument A supports Conclusion B, and Argument A is falsified,
 *   Conclusion B MUST degrade.
 *
 * @module reasonrank
 */

// Types
export type {
  VerificationStatus,
  ArgumentType,
  EdgeType,
  ClaimNode,
  ArgumentNode,
  EvidenceNode,
  GraphNode,
  SupportsEdge,
  AttacksEdge,
  HasEvidenceEdge,
  SimilarToEdge,
  GraphEdge,
  ScoreBreakdown,
  PropagationEvent,
  ReasonRankConfig,
} from './types'

export { DEFAULT_CONFIG, VERIFICATION_SCORES } from './types'

// Graph
export { DependencyGraph } from './graph'

// Engine
export { ReasonRankEngine } from './engine'

// Pipeline
export { ReasonRankPipeline } from './propagation'
export type {
  AddClaimInput,
  AddArgumentInput,
  AddEvidenceInput,
  LinkArgumentInput,
  LinkEvidenceInput,
} from './propagation'
