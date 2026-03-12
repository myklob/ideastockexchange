/**
 * ReasonRank Scoring Engine — The Recursive Kernel
 *
 * Implements the five system invariants from the TDD:
 *
 * I1 — Propagation Continuity:
 *   A score change in a child MUST trigger re-calculation of all parents.
 *   Propagation recurses upward until delta < epsilon.
 *
 * I2 — The Death Match (Clamping):
 *   If counter-arguments > supporting arguments, the node is "dead."
 *   It contributes 0 to its parent. It does NOT propagate negative scores.
 *
 * I3 — Diminishing Returns (Uniqueness):
 *   Semantically identical arguments asymptote to the score of the
 *   single strongest instance. Volume cannot defeat logic.
 *
 * I4 — The Truth Anchor:
 *   Evidence flagged as FALSIFIED forces EvidenceScore to 0,
 *   collapsing the branch immediately.
 *
 * I5 — Edge Relevance:
 *   Relevance is a property of the EDGE, not the node.
 *   A true but irrelevant argument transmits 0 score.
 *
 * The score of a node is:
 *   Score(N) = IntrinsicScore(N) + ExtrinsicScore(N)
 *
 * IntrinsicScore = Base × UniquenessFactor × EvidenceScore
 * ExtrinsicScore = NetForce from children (clamped to >= 0)
 */

import { DependencyGraph } from './graph'
import type {
  GraphNode, ArgumentNode, EvidenceNode, ClaimNode,
  SupportsEdge, AttacksEdge,
  ScoreBreakdown, ReasonRankConfig, PropagationEvent,
} from './types'
import { DEFAULT_CONFIG, VERIFICATION_SCORES } from './types'

export class ReasonRankEngine {
  private graph: DependencyGraph
  private config: ReasonRankConfig
  private propagationLog: PropagationEvent[] = []

  constructor(graph: DependencyGraph, config: Partial<ReasonRankConfig> = {}) {
    this.graph = graph
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ─── Public API ───────────────────────────────────────────────

  /**
   * Calculate the score for a single node.
   * This is the core recursive formula from TDD Section 4.
   */
  calculateScore(nodeId: string): ScoreBreakdown {
    const node = this.graph.getNode(nodeId)
    if (!node) throw new Error(`Node ${nodeId} not found`)

    switch (node.type) {
      case 'CLAIM':
        return this.calculateClaimScore(node)
      case 'ARGUMENT':
        return this.calculateArgumentScore(node)
      case 'EVIDENCE':
        return this.calculateEvidenceScore(node)
    }
  }

  /**
   * Recalculate a node's score and propagate changes upward.
   * Implements Invariant I1 (Propagation Continuity).
   *
   * Returns all propagation events that occurred.
   */
  updateScore(nodeId: string): PropagationEvent[] {
    this.propagationLog = []
    this.propagateUpward(nodeId, 0)
    return this.propagationLog
  }

  /**
   * Flag evidence as FALSIFIED and propagate the collapse.
   * Implements Invariant I4 (Truth Anchor).
   */
  falsifyEvidence(evidenceId: string): PropagationEvent[] {
    const evidence = this.graph.getEvidence(evidenceId)
    if (!evidence) throw new Error(`Evidence ${evidenceId} not found`)

    this.graph.updateNode(evidenceId, {
      verificationStatus: 'FALSIFIED',
      evidenceScore: 0,
    } as Partial<EvidenceNode>)

    // Find all arguments that use this evidence and propagate
    this.propagationLog = []
    const argumentsUsingEvidence = this.findArgumentsForEvidence(evidenceId)
    for (const argId of argumentsUsingEvidence) {
      this.propagateUpward(argId, 0)
    }

    return this.propagationLog
  }

  /**
   * Update the relevance of an edge and propagate.
   * Implements Invariant I5 (Edge Relevance).
   */
  updateEdgeRelevance(edgeId: string, newRelevance: number): PropagationEvent[] {
    const edge = this.graph.getEdge(edgeId)
    if (!edge) throw new Error(`Edge ${edgeId} not found`)
    if (edge.type !== 'SUPPORTS' && edge.type !== 'ATTACKS') {
      throw new Error('Can only update relevance on SUPPORTS or ATTACKS edges')
    }

    this.graph.updateEdge(edgeId, { relevance: Math.max(0, Math.min(1, newRelevance)) })

    // Propagate from the target (parent) of this edge
    this.propagationLog = []
    this.propagateUpward(edge.targetId, 0)
    return this.propagationLog
  }

  /**
   * Add a SIMILAR_TO edge between arguments and recalculate uniqueness.
   * Implements Invariant I3 (Diminishing Returns).
   */
  markSimilar(argId1: string, argId2: string, similarityScore: number, edgeId: string): PropagationEvent[] {
    this.graph.addEdge({
      id: edgeId,
      type: 'SIMILAR_TO',
      sourceId: argId1,
      targetId: argId2,
      similarityScore: Math.max(0, Math.min(1, similarityScore)),
    })

    // Recalculate both arguments and their parents
    this.propagationLog = []
    this.propagateUpward(argId1, 0)
    this.propagateUpward(argId2, 0)
    return this.propagationLog
  }

  /**
   * Get the current propagation log (for debugging/testing).
   */
  getPropagationLog(): PropagationEvent[] {
    return [...this.propagationLog]
  }

  // ─── Score Calculations ───────────────────────────────────────

  /**
   * Calculate intrinsic score for an argument.
   * IntrinsicScore = Base × UniquenessFactor × EvidenceScore
   *
   * Implements:
   * - I3 (Uniqueness/Diminishing Returns)
   * - I4 (Truth Anchor via EvidenceScore)
   */
  private calculateIntrinsicScore(argument: ArgumentNode): {
    intrinsicScore: number
    uniquenessFactor: number
    evidenceScore: number
  } {
    // Base score
    const base = argument.baseImpact

    // I3: Uniqueness — asymptotic decay for similar arguments
    const uniquenessFactor = this.calculateUniquenessFactor(argument.id)

    // I4: Evidence score — FALSIFIED evidence forces 0
    const evidenceScore = this.calculateEvidenceScoreForArgument(argument.id)

    const intrinsicScore = base * uniquenessFactor * evidenceScore

    return { intrinsicScore, uniquenessFactor, evidenceScore }
  }

  /**
   * Calculate extrinsic score from children.
   * This is the "Net Force" applied by supporting and attacking children.
   *
   * Implements:
   * - I2 (Death Match / Clamping)
   * - I5 (Edge Relevance)
   */
  private calculateExtrinsicScore(nodeId: string): {
    extrinsicScore: number
    supportingForce: number
    attackingForce: number
    maxPossibleSupport: number
    isDead: boolean
  } {
    const supporters = this.graph.getSupporters(nodeId)
    const attackers = this.graph.getAttackers(nodeId)

    // Calculate supporting force: Σ(child.score × edge.relevance)
    // I5: Relevance multiplier on the EDGE severs transmission at 0
    let supportingForce = 0
    let maxPossibleSupport = 0
    for (const { argument, edge } of supporters) {
      supportingForce += argument.currentScore * edge.relevance
      maxPossibleSupport += edge.relevance // max if child score were 1.0
    }

    // Calculate attacking force: Σ(child.score × edge.relevance)
    let attackingForce = 0
    for (const { argument, edge } of attackers) {
      attackingForce += argument.currentScore * edge.relevance
    }

    // I2: Death Match — if attacks >= supports AND there are attackers, node is dead
    // NetForce is clamped to 0 (no negative propagation)
    const netForce = supportingForce - attackingForce
    const isDead = netForce <= 0 && attackingForce > 0
    const extrinsicScore = Math.max(0, netForce)

    return { extrinsicScore, supportingForce, attackingForce, maxPossibleSupport, isDead }
  }

  /**
   * Full score calculation for a Claim node.
   * Claims have no intrinsic score — they are pure aggregators.
   *
   * Uses a Bayesian prior: starts at 0.5 (maximum uncertainty) and
   * shifts based on the balance of supporting vs attacking forces.
   * More support → higher score; more attacks → lower score.
   * Adding additional support always increases the score (unlike a
   * simple ratio which would stay at 1.0 with only supporters).
   */
  private calculateClaimScore(claim: ClaimNode): ScoreBreakdown {
    const PRIOR = 0.5
    const { extrinsicScore, supportingForce, attackingForce, maxPossibleSupport, isDead } =
      this.calculateExtrinsicScore(claim.id)

    let finalScore: number
    if (supportingForce === 0 && attackingForce === 0) {
      finalScore = 0.5 // No arguments = maximum uncertainty
    } else {
      // Bayesian update: prior pulls toward 0.5, evidence pushes away
      finalScore = (supportingForce + PRIOR) / (supportingForce + attackingForce + 2 * PRIOR)
    }

    return {
      nodeId: claim.id,
      intrinsicScore: 0,
      uniquenessFactor: 1,
      evidenceScore: 1,
      extrinsicScore,
      supportingForce,
      attackingForce,
      finalScore,
      isDead: false, // Claims can't die; they just have low scores
    }
  }

  /**
   * Full score calculation for an Argument node.
   *
   * Leaf nodes (no children): score = intrinsicScore
   *
   * Nodes with children: the children validate/invalidate the claim.
   *   - supportRealization: what fraction of possible support materialized (0–1)
   *   - attackDegradation: what fraction survives attacks (0–1)
   *   - finalScore = intrinsicScore × supportRealization × attackDegradation
   *
   * This ensures that when a child argument collapses (e.g. evidence falsified),
   * the parent's score degrades proportionally — the dependency model.
   */
  private calculateArgumentScore(argument: ArgumentNode): ScoreBreakdown {
    const { intrinsicScore, uniquenessFactor, evidenceScore } =
      this.calculateIntrinsicScore(argument)
    const { extrinsicScore, supportingForce, attackingForce, maxPossibleSupport, isDead } =
      this.calculateExtrinsicScore(argument.id)

    let finalScore: number
    if (isDead) {
      // I2: Dead — contributes 0 to parent
      finalScore = 0
    } else {
      const hasChildren = this.graph.getChildren(argument.id).length > 0
      if (!hasChildren) {
        // Leaf node: score is purely intrinsic
        finalScore = intrinsicScore
      } else {
        // Support realization: how much of the max possible support materialized
        // If all supporters have full scores, this is 1.0.
        // If a supporter collapses (evidence falsified), this drops.
        const supportRealization = maxPossibleSupport > 0
          ? supportingForce / maxPossibleSupport
          : 1.0

        // Attack degradation: what fraction survives attacks
        // With no attacks, full intrinsic survives.
        // With attacks, only the surviving fraction remains.
        const attackDegradation = attackingForce > 0 && supportingForce > 0
          ? Math.max(0, 1 - attackingForce / supportingForce)
          : attackingForce > 0 ? 0 : 1.0

        finalScore = intrinsicScore * supportRealization * attackDegradation
      }
    }

    // Clamp to [0, 1]
    finalScore = Math.max(0, Math.min(1, finalScore))

    return {
      nodeId: argument.id,
      intrinsicScore,
      uniquenessFactor,
      evidenceScore,
      extrinsicScore,
      supportingForce,
      attackingForce,
      finalScore,
      isDead,
    }
  }

  /**
   * Score for an Evidence node (trivial — based on verification status).
   */
  private calculateEvidenceScore(evidence: EvidenceNode): ScoreBreakdown {
    return {
      nodeId: evidence.id,
      intrinsicScore: evidence.evidenceScore,
      uniquenessFactor: 1,
      evidenceScore: evidence.evidenceScore,
      extrinsicScore: 0,
      supportingForce: 0,
      attackingForce: 0,
      finalScore: evidence.evidenceScore,
      isDead: evidence.verificationStatus === 'FALSIFIED',
    }
  }

  // ─── Invariant Implementations ────────────────────────────────

  /**
   * I3: Diminishing Returns / Uniqueness Factor
   *
   * UniquenessFactor = 1 / (1 + Σ similarityScores)
   *
   * If N semantically identical arguments exist, each one's effective
   * contribution asymptotes toward the score of a single instance.
   * Volume cannot defeat logic.
   */
  private calculateUniquenessFactor(argumentId: string): number {
    const similar = this.graph.getSimilarArguments(argumentId)
    if (similar.length === 0) return 1.0

    // Sum of similarity scores weighted by the other argument's current score
    const totalSimilarity = similar.reduce(
      (sum, { similarityScore }) => sum + similarityScore,
      0
    )

    // Asymptotic decay: 1 / (1 + totalSimilarity)
    // 0 similar args → 1.0 (full contribution)
    // 1 identical arg (sim=1.0) → 0.5
    // 2 identical args → 0.33
    // N identical args → 1/(1+N)
    return 1 / (1 + totalSimilarity)
  }

  /**
   * I4: Truth Anchor — Evidence Score
   *
   * If ANY linked evidence is FALSIFIED → score is 0.
   * Otherwise, average of verification scores.
   */
  private calculateEvidenceScoreForArgument(argumentId: string): number {
    const evidenceNodes = this.graph.getEvidenceFor(argumentId)

    if (evidenceNodes.length === 0) {
      return 1.0 // No evidence = base assumption holds
    }

    // I4: Circuit breaker — any FALSIFIED evidence kills the branch
    const hasFalsified = evidenceNodes.some(e => e.verificationStatus === 'FALSIFIED')
    if (hasFalsified) return 0

    // Average verification scores
    const totalScore = evidenceNodes.reduce((sum, e) => sum + e.evidenceScore, 0)
    return totalScore / evidenceNodes.length
  }

  // ─── Propagation ──────────────────────────────────────────────

  /**
   * I1: Propagation Continuity
   *
   * Recursively propagate score changes upward through the graph.
   * Stops when delta < epsilon or maxDepth is reached.
   */
  private propagateUpward(nodeId: string, depth: number): void {
    if (depth >= this.config.maxDepth) return

    const node = this.graph.getNode(nodeId)
    if (!node) return

    // Calculate new score
    const breakdown = this.calculateScore(nodeId)
    const previousScore = this.getCurrentScore(node)
    const delta = Math.abs(breakdown.finalScore - previousScore)

    // Update the node's stored score
    this.applyScore(node, breakdown.finalScore)

    // Log the propagation event
    this.propagationLog.push({
      nodeId,
      previousScore,
      newScore: breakdown.finalScore,
      delta,
      depth,
      timestamp: Date.now(),
    })

    // I1: If delta >= epsilon, propagate to all parents
    if (delta >= this.config.epsilon) {
      const parents = this.graph.getParents(nodeId)
      for (const { node: parent } of parents) {
        this.propagateUpward(parent.id, depth + 1)
      }
    }
  }

  /**
   * Get the current stored score for a node.
   */
  private getCurrentScore(node: GraphNode): number {
    switch (node.type) {
      case 'CLAIM':
        return node.globalRank
      case 'ARGUMENT':
        return node.currentScore
      case 'EVIDENCE':
        return node.evidenceScore
    }
  }

  /**
   * Apply a new score to a node.
   */
  private applyScore(node: GraphNode, score: number): void {
    switch (node.type) {
      case 'CLAIM':
        this.graph.updateNode(node.id, { globalRank: score } as Partial<ClaimNode>)
        break
      case 'ARGUMENT':
        this.graph.updateNode(node.id, { currentScore: score } as Partial<ArgumentNode>)
        break
      case 'EVIDENCE':
        this.graph.updateNode(node.id, { evidenceScore: score } as Partial<EvidenceNode>)
        break
    }
  }

  /**
   * Find all arguments that reference a given evidence node.
   */
  private findArgumentsForEvidence(evidenceId: string): string[] {
    const args: string[] = []
    for (const node of this.graph.getAllNodes()) {
      if (node.type === 'ARGUMENT') {
        const evidence = this.graph.getEvidenceFor(node.id)
        if (evidence.some(e => e.id === evidenceId)) {
          args.push(node.id)
        }
      }
    }
    return args
  }
}
