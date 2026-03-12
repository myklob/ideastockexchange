/**
 * ReasonRank Propagation Pipeline
 *
 * Implements the propagation pipeline from TDD Section 5.2.
 * Currently synchronous; designed for future BullMQ integration.
 *
 * The pipeline:
 * 1. Event: A mutation occurs (evidence added, argument created, etc.)
 * 2. Ingest: The mutation is written to the graph.
 * 3. Score Worker: Recalculates the affected node and propagates upward.
 * 4. Vector Worker: (Phase 3) Updates similarity edges.
 *
 * This module provides the orchestration layer that coordinates
 * graph mutations with score recalculation.
 */

import { DependencyGraph } from './graph'
import { ReasonRankEngine } from './engine'
import type {
  ClaimNode, ArgumentNode, EvidenceNode,
  SupportsEdge, AttacksEdge, HasEvidenceEdge, SimilarToEdge,
  VerificationStatus, ArgumentType, PropagationEvent,
  ReasonRankConfig,
} from './types'
import { VERIFICATION_SCORES } from './types'

// ─── Mutation Types ─────────────────────────────────────────────

export interface AddClaimInput {
  id: string
  statement: string
}

export interface AddArgumentInput {
  id: string
  statement: string
  argumentType?: ArgumentType
  baseImpact?: number
}

export interface AddEvidenceInput {
  id: string
  url: string
  description: string
  verificationStatus?: VerificationStatus
}

export interface LinkArgumentInput {
  edgeId: string
  argumentId: string
  targetId: string
  type: 'SUPPORTS' | 'ATTACKS'
  relevance?: number
}

export interface LinkEvidenceInput {
  edgeId: string
  argumentId: string
  evidenceId: string
}

// ─── Pipeline ───────────────────────────────────────────────────

export class ReasonRankPipeline {
  readonly graph: DependencyGraph
  readonly engine: ReasonRankEngine

  constructor(config: Partial<ReasonRankConfig> = {}) {
    this.graph = new DependencyGraph()
    this.engine = new ReasonRankEngine(this.graph, config)
  }

  // ─── Mutations (Write) ──────────────────────────────────────

  /**
   * Add a new Claim to the graph.
   * Claims start at 0.5 (maximum uncertainty).
   */
  addClaim(input: AddClaimInput): ClaimNode {
    const claim: ClaimNode = {
      id: input.id,
      type: 'CLAIM',
      statement: input.statement,
      globalRank: 0.5,
    }
    this.graph.addNode(claim)
    return claim
  }

  /**
   * Add a new Argument to the graph.
   * Arguments start with baseImpact as their score.
   */
  addArgument(input: AddArgumentInput): ArgumentNode {
    const argument: ArgumentNode = {
      id: input.id,
      type: 'ARGUMENT',
      statement: input.statement,
      argumentType: input.argumentType ?? 'TRUTH',
      baseImpact: input.baseImpact ?? 1.0,
      currentScore: input.baseImpact ?? 1.0,
    }
    this.graph.addNode(argument)
    return argument
  }

  /**
   * Add Evidence to the graph.
   * Evidence starts with a score based on its verification status.
   */
  addEvidence(input: AddEvidenceInput): EvidenceNode {
    const status = input.verificationStatus ?? 'UNVERIFIED'
    const evidence: EvidenceNode = {
      id: input.id,
      type: 'EVIDENCE',
      url: input.url,
      description: input.description,
      verificationStatus: status,
      evidenceScore: VERIFICATION_SCORES[status],
    }
    this.graph.addNode(evidence)
    return evidence
  }

  /**
   * Link an Argument to a Claim or another Argument via SUPPORTS or ATTACKS.
   * Triggers score propagation on the target.
   */
  linkArgument(input: LinkArgumentInput): PropagationEvent[] {
    const edge: SupportsEdge | AttacksEdge = {
      id: input.edgeId,
      type: input.type,
      sourceId: input.argumentId,
      targetId: input.targetId,
      relevance: input.relevance ?? 1.0,
    }
    this.graph.addEdge(edge)

    // Propagate: recalculate target and its ancestors
    return this.engine.updateScore(input.targetId)
  }

  /**
   * Link Evidence to an Argument.
   * Triggers score propagation from the argument upward.
   */
  linkEvidence(input: LinkEvidenceInput): PropagationEvent[] {
    const edge: HasEvidenceEdge = {
      id: input.edgeId,
      type: 'HAS_EVIDENCE',
      sourceId: input.argumentId,
      targetId: input.evidenceId,
    }
    this.graph.addEdge(edge)

    // Propagate: recalculate argument and its ancestors
    return this.engine.updateScore(input.argumentId)
  }

  /**
   * Falsify evidence — the circuit breaker.
   * Implements I4: Forces EvidenceScore to 0 and collapses the branch.
   */
  falsifyEvidence(evidenceId: string): PropagationEvent[] {
    return this.engine.falsifyEvidence(evidenceId)
  }

  /**
   * Update the relevance of a SUPPORTS or ATTACKS edge.
   * Implements I5: Edge Relevance.
   */
  setEdgeRelevance(edgeId: string, relevance: number): PropagationEvent[] {
    return this.engine.updateEdgeRelevance(edgeId, relevance)
  }

  /**
   * Mark two arguments as semantically similar.
   * Implements I3: Diminishing Returns.
   */
  markSimilar(argId1: string, argId2: string, similarityScore: number, edgeId: string): PropagationEvent[] {
    return this.engine.markSimilar(argId1, argId2, similarityScore, edgeId)
  }

  /**
   * Get the current score breakdown for any node.
   */
  getScore(nodeId: string): ReturnType<ReasonRankEngine['calculateScore']> {
    return this.engine.calculateScore(nodeId)
  }

  /**
   * Get the current score value for a node.
   */
  getScoreValue(nodeId: string): number {
    return this.engine.calculateScore(nodeId).finalScore
  }
}
