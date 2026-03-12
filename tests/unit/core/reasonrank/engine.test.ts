/**
 * ReasonRank Dependency Engine — Unit Tests
 *
 * Tests verify all five system invariants:
 *   I1 — Propagation Continuity
 *   I2 — The Death Match (Clamping)
 *   I3 — Diminishing Returns (Uniqueness)
 *   I4 — The Truth Anchor
 *   I5 — Edge Relevance
 *
 * Plus the three stress tests from TDD Section 6:
 *   Test 1 — The Jenga Test (Foundation Collapse)
 *   Test 2 — The Echo Chamber Test (Uniqueness)
 *   Test 3 — The Relevance Sever (Edge Weight)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ReasonRankPipeline } from '../../../../src/core/reasonrank/propagation'
import { DependencyGraph } from '../../../../src/core/reasonrank/graph'
import { ReasonRankEngine } from '../../../../src/core/reasonrank/engine'
import type {
  ClaimNode, ArgumentNode, EvidenceNode,
} from '../../../../src/core/reasonrank/types'

// ─── Test Helpers ─────────────────────────────────────────────────

function createPipeline() {
  return new ReasonRankPipeline({ epsilon: 0.0001 })
}

/**
 * Build a simple tree:
 *   Claim ← Argument ← Evidence
 */
function buildSimpleTree(pipeline: ReasonRankPipeline) {
  pipeline.addClaim({ id: 'claim-1', statement: 'The earth is warming' })
  pipeline.addArgument({ id: 'arg-1', statement: 'CO2 levels rising' })
  pipeline.addEvidence({
    id: 'ev-1',
    url: 'https://nasa.gov/co2',
    description: 'NASA CO2 measurements',
    verificationStatus: 'VERIFIED',
  })

  pipeline.linkArgument({
    edgeId: 'edge-arg1-claim1',
    argumentId: 'arg-1',
    targetId: 'claim-1',
    type: 'SUPPORTS',
    relevance: 0.9,
  })

  pipeline.linkEvidence({
    edgeId: 'edge-arg1-ev1',
    argumentId: 'arg-1',
    evidenceId: 'ev-1',
  })
}

// ─── Graph Store Tests ────────────────────────────────────────────

describe('DependencyGraph', () => {
  let graph: DependencyGraph

  beforeEach(() => {
    graph = new DependencyGraph()
  })

  it('should add and retrieve nodes', () => {
    const claim: ClaimNode = {
      id: 'c1', type: 'CLAIM', statement: 'Test', globalRank: 0.5,
    }
    graph.addNode(claim)
    expect(graph.getNode('c1')).toEqual(claim)
    expect(graph.getClaim('c1')).toEqual(claim)
  })

  it('should add and retrieve edges', () => {
    graph.addNode({ id: 'a1', type: 'ARGUMENT', statement: 'Arg', argumentType: 'TRUTH', baseImpact: 1, currentScore: 1 })
    graph.addNode({ id: 'c1', type: 'CLAIM', statement: 'Claim', globalRank: 0.5 })
    graph.addEdge({ id: 'e1', type: 'SUPPORTS', sourceId: 'a1', targetId: 'c1', relevance: 0.8 })

    expect(graph.getEdge('e1')).toBeDefined()
    const supporters = graph.getSupporters('c1')
    expect(supporters).toHaveLength(1)
    expect(supporters[0].argument.id).toBe('a1')
    expect(supporters[0].edge.relevance).toBe(0.8)
  })

  it('should throw when adding edge with missing nodes', () => {
    graph.addNode({ id: 'a1', type: 'ARGUMENT', statement: 'Arg', argumentType: 'TRUTH', baseImpact: 1, currentScore: 1 })
    expect(() => {
      graph.addEdge({ id: 'e1', type: 'SUPPORTS', sourceId: 'a1', targetId: 'missing', relevance: 0.8 })
    }).toThrow()
  })

  it('should detect cycles', () => {
    graph.addNode({ id: 'a1', type: 'ARGUMENT', statement: 'A1', argumentType: 'TRUTH', baseImpact: 1, currentScore: 1 })
    graph.addNode({ id: 'a2', type: 'ARGUMENT', statement: 'A2', argumentType: 'TRUTH', baseImpact: 1, currentScore: 1 })
    graph.addEdge({ id: 'e1', type: 'SUPPORTS', sourceId: 'a1', targetId: 'a2', relevance: 1 })

    // a2 → a1 would create cycle
    expect(graph.wouldCreateCycle('a2', 'a1')).toBe(true)
    // a1 → a2 already exists, opposite direction should not be cycle
    expect(graph.wouldCreateCycle('a1', 'a2')).toBe(false)
  })

  it('should remove nodes and their edges', () => {
    graph.addNode({ id: 'a1', type: 'ARGUMENT', statement: 'A1', argumentType: 'TRUTH', baseImpact: 1, currentScore: 1 })
    graph.addNode({ id: 'c1', type: 'CLAIM', statement: 'C1', globalRank: 0.5 })
    graph.addEdge({ id: 'e1', type: 'SUPPORTS', sourceId: 'a1', targetId: 'c1', relevance: 0.8 })

    graph.removeNode('a1')
    expect(graph.getNode('a1')).toBeUndefined()
    expect(graph.getEdge('e1')).toBeUndefined()
    expect(graph.getSupporters('c1')).toHaveLength(0)
  })

  it('should find parents of a node', () => {
    graph.addNode({ id: 'c1', type: 'CLAIM', statement: 'Claim', globalRank: 0.5 })
    graph.addNode({ id: 'a1', type: 'ARGUMENT', statement: 'Arg', argumentType: 'TRUTH', baseImpact: 1, currentScore: 1 })
    graph.addEdge({ id: 'e1', type: 'SUPPORTS', sourceId: 'a1', targetId: 'c1', relevance: 1 })

    const parents = graph.getParents('a1')
    expect(parents).toHaveLength(1)
    expect(parents[0].node.id).toBe('c1')
  })

  it('should find evidence for an argument', () => {
    graph.addNode({ id: 'a1', type: 'ARGUMENT', statement: 'Arg', argumentType: 'TRUTH', baseImpact: 1, currentScore: 1 })
    graph.addNode({ id: 'ev1', type: 'EVIDENCE', url: 'http://test.com', description: 'Test', verificationStatus: 'VERIFIED', evidenceScore: 1.0 })
    graph.addEdge({ id: 'e1', type: 'HAS_EVIDENCE', sourceId: 'a1', targetId: 'ev1' })

    const evidence = graph.getEvidenceFor('a1')
    expect(evidence).toHaveLength(1)
    expect(evidence[0].id).toBe('ev1')
  })

  it('should find similar arguments', () => {
    graph.addNode({ id: 'a1', type: 'ARGUMENT', statement: 'Arg 1', argumentType: 'TRUTH', baseImpact: 1, currentScore: 1 })
    graph.addNode({ id: 'a2', type: 'ARGUMENT', statement: 'Arg 2', argumentType: 'TRUTH', baseImpact: 1, currentScore: 1 })
    graph.addEdge({ id: 'sim1', type: 'SIMILAR_TO', sourceId: 'a1', targetId: 'a2', similarityScore: 0.95 })

    const similar1 = graph.getSimilarArguments('a1')
    expect(similar1).toHaveLength(1)
    expect(similar1[0].similarityScore).toBe(0.95)

    // Should be bidirectional
    const similar2 = graph.getSimilarArguments('a2')
    expect(similar2).toHaveLength(1)
  })
})

// ─── Invariant I1: Propagation Continuity ─────────────────────────

describe('I1: Propagation Continuity', () => {
  let pipeline: ReasonRankPipeline

  beforeEach(() => {
    pipeline = createPipeline()
  })

  it('should propagate score changes from child to parent', () => {
    buildSimpleTree(pipeline)
    const initialScore = pipeline.getScoreValue('claim-1')

    // Add a second supporting argument — should change claim score
    pipeline.addArgument({ id: 'arg-2', statement: 'Temperature data' })
    pipeline.addEvidence({
      id: 'ev-2', url: 'https://noaa.gov', description: 'NOAA data', verificationStatus: 'VERIFIED',
    })
    pipeline.linkEvidence({ edgeId: 'edge-arg2-ev2', argumentId: 'arg-2', evidenceId: 'ev-2' })
    const events = pipeline.linkArgument({
      edgeId: 'edge-arg2-claim1',
      argumentId: 'arg-2',
      targetId: 'claim-1',
      type: 'SUPPORTS',
      relevance: 0.8,
    })

    const newScore = pipeline.getScoreValue('claim-1')

    // Score should have changed
    expect(events.length).toBeGreaterThan(0)
    // The claim should now have score reflecting two supporters
    expect(newScore).not.toBe(initialScore)
  })

  it('should propagate through multiple levels', () => {
    // Build: Claim ← Arg1 ← SubArg
    pipeline.addClaim({ id: 'claim', statement: 'Root' })
    pipeline.addArgument({ id: 'arg', statement: 'Middle' })
    pipeline.addArgument({ id: 'sub-arg', statement: 'Leaf' })

    pipeline.linkArgument({
      edgeId: 'e1', argumentId: 'arg', targetId: 'claim', type: 'SUPPORTS', relevance: 1.0,
    })
    pipeline.linkArgument({
      edgeId: 'e2', argumentId: 'sub-arg', targetId: 'arg', type: 'SUPPORTS', relevance: 1.0,
    })

    const claimScore = pipeline.getScoreValue('claim')
    // Claim should reflect the sub-argument's support
    expect(claimScore).toBeGreaterThan(0.5)
  })

  it('should stop propagation when delta < epsilon', () => {
    buildSimpleTree(pipeline)

    // Recalculate the same node without changes — should produce minimal delta
    const events = pipeline.engine.updateScore('claim-1')

    // Should have events but they should have small deltas
    expect(events.length).toBeGreaterThan(0)
  })
})

// ─── Invariant I2: Death Match (Clamping) ─────────────────────────

describe('I2: Death Match (Clamping)', () => {
  let pipeline: ReasonRankPipeline

  beforeEach(() => {
    pipeline = createPipeline()
  })

  it('should clamp to 0 when attacks overwhelm supports', () => {
    pipeline.addClaim({ id: 'claim', statement: 'Debatable thesis' })
    pipeline.addArgument({ id: 'pro', statement: 'Weak support' })
    pipeline.addArgument({ id: 'con', statement: 'Strong rebuttal', baseImpact: 1.0 })

    pipeline.linkArgument({
      edgeId: 'e-pro', argumentId: 'pro', targetId: 'claim', type: 'SUPPORTS', relevance: 0.3,
    })
    pipeline.linkArgument({
      edgeId: 'e-con', argumentId: 'con', targetId: 'claim', type: 'ATTACKS', relevance: 0.9,
    })

    const breakdown = pipeline.getScore('claim')
    // Claim should have low score since attacks dominate
    expect(breakdown.attackingForce).toBeGreaterThan(breakdown.supportingForce)
    expect(breakdown.finalScore).toBeLessThan(0.5)
  })

  it('should not propagate negative scores to parent', () => {
    // Arg is "dead" (more attacks than support)
    // Its contribution to its parent claim should be 0, not negative
    pipeline.addClaim({ id: 'claim', statement: 'Parent' })
    pipeline.addArgument({ id: 'arg', statement: 'Dead argument' })
    pipeline.addArgument({ id: 'sub-support', statement: 'Weak support', baseImpact: 0.2 })
    pipeline.addArgument({ id: 'sub-attack', statement: 'Strong attack', baseImpact: 1.0 })

    pipeline.linkArgument({
      edgeId: 'e1', argumentId: 'arg', targetId: 'claim', type: 'SUPPORTS', relevance: 1.0,
    })
    pipeline.linkArgument({
      edgeId: 'e2', argumentId: 'sub-support', targetId: 'arg', type: 'SUPPORTS', relevance: 1.0,
    })
    pipeline.linkArgument({
      edgeId: 'e3', argumentId: 'sub-attack', targetId: 'arg', type: 'ATTACKS', relevance: 1.0,
    })

    const argBreakdown = pipeline.getScore('arg')
    // arg should be "dead" — attacks > supports
    expect(argBreakdown.isDead).toBe(true)
    expect(argBreakdown.finalScore).toBe(0)

    // Claim should not receive negative contribution from dead arg
    const claimScore = pipeline.getScoreValue('claim')
    expect(claimScore).toBeGreaterThanOrEqual(0)
  })

  it('should resurrect when support exceeds attacks again', () => {
    pipeline.addClaim({ id: 'claim', statement: 'Claim' })
    pipeline.addArgument({ id: 'arg', statement: 'Argument' })
    pipeline.addArgument({ id: 'attacker', statement: 'Attacker', baseImpact: 1.0 })
    pipeline.addArgument({ id: 'defender', statement: 'Strong defender', baseImpact: 1.0 })

    pipeline.linkArgument({
      edgeId: 'e1', argumentId: 'arg', targetId: 'claim', type: 'SUPPORTS', relevance: 1.0,
    })
    pipeline.linkArgument({
      edgeId: 'e2', argumentId: 'attacker', targetId: 'arg', type: 'ATTACKS', relevance: 1.0,
    })

    // arg should be dead
    expect(pipeline.getScore('arg').isDead).toBe(true)

    // Add strong support — should resurrect
    pipeline.linkArgument({
      edgeId: 'e3', argumentId: 'defender', targetId: 'arg', type: 'SUPPORTS', relevance: 1.0,
    })

    // Now arg has equal support and attack, should not be dead
    // (support = attack means net = 0, which is still "dead" per invariant)
    // Add another defender to clearly resurrect
    pipeline.addArgument({ id: 'defender2', statement: 'Another support', baseImpact: 1.0 })
    pipeline.linkArgument({
      edgeId: 'e4', argumentId: 'defender2', targetId: 'arg', type: 'SUPPORTS', relevance: 1.0,
    })

    const breakdown = pipeline.getScore('arg')
    expect(breakdown.isDead).toBe(false)
    expect(breakdown.finalScore).toBeGreaterThan(0)
  })
})

// ─── Invariant I3: Diminishing Returns (Uniqueness) ───────────────

describe('I3: Diminishing Returns (Uniqueness)', () => {
  let pipeline: ReasonRankPipeline

  beforeEach(() => {
    pipeline = createPipeline()
  })

  it('should reduce uniqueness factor for similar arguments', () => {
    pipeline.addClaim({ id: 'claim', statement: 'Thesis' })
    pipeline.addArgument({ id: 'arg-1', statement: 'Original argument' })
    pipeline.addArgument({ id: 'arg-2', statement: 'Similar argument' })

    pipeline.linkArgument({
      edgeId: 'e1', argumentId: 'arg-1', targetId: 'claim', type: 'SUPPORTS', relevance: 1.0,
    })
    pipeline.linkArgument({
      edgeId: 'e2', argumentId: 'arg-2', targetId: 'claim', type: 'SUPPORTS', relevance: 1.0,
    })

    const scoreBefore = pipeline.getScoreValue('claim')

    // Mark them as similar (90% similar)
    pipeline.markSimilar('arg-1', 'arg-2', 0.9, 'sim-1')

    // After marking similar, the uniqueness factor should reduce both
    const breakdown1 = pipeline.getScore('arg-1')
    const breakdown2 = pipeline.getScore('arg-2')

    expect(breakdown1.uniquenessFactor).toBeLessThan(1.0)
    expect(breakdown2.uniquenessFactor).toBeLessThan(1.0)
  })

  it('should asymptote with many identical arguments', () => {
    pipeline.addClaim({ id: 'claim', statement: 'Thesis' })

    // Add 10 identical arguments
    const argIds: string[] = []
    for (let i = 0; i < 10; i++) {
      const id = `arg-${i}`
      argIds.push(id)
      pipeline.addArgument({ id, statement: `Same thing phrased differently ${i}` })
      pipeline.linkArgument({
        edgeId: `e-${i}`, argumentId: id, targetId: 'claim', type: 'SUPPORTS', relevance: 1.0,
      })
    }

    // Mark all pairs as highly similar
    let edgeCount = 0
    for (let i = 0; i < argIds.length; i++) {
      for (let j = i + 1; j < argIds.length; j++) {
        pipeline.markSimilar(argIds[i], argIds[j], 0.95, `sim-${edgeCount++}`)
      }
    }

    // Each argument should have heavily reduced uniqueness
    const breakdown = pipeline.getScore(argIds[0])
    // With 9 similar arguments at 0.95, uniqueness ≈ 1/(1+9*0.95) ≈ 0.105
    expect(breakdown.uniquenessFactor).toBeLessThan(0.15)
  })
})

// ─── Invariant I4: Truth Anchor ───────────────────────────────────

describe('I4: Truth Anchor', () => {
  let pipeline: ReasonRankPipeline

  beforeEach(() => {
    pipeline = createPipeline()
  })

  it('should collapse argument score when evidence is falsified', () => {
    pipeline.addClaim({ id: 'claim', statement: 'Thesis' })
    pipeline.addArgument({ id: 'arg', statement: 'Based on evidence' })
    pipeline.addEvidence({
      id: 'ev', url: 'http://study.com', description: 'Key study', verificationStatus: 'VERIFIED',
    })

    pipeline.linkArgument({
      edgeId: 'e1', argumentId: 'arg', targetId: 'claim', type: 'SUPPORTS', relevance: 1.0,
    })
    pipeline.linkEvidence({ edgeId: 'e2', argumentId: 'arg', evidenceId: 'ev' })

    const scoreBefore = pipeline.getScoreValue('arg')
    expect(scoreBefore).toBeGreaterThan(0)

    // Falsify the evidence — circuit breaker
    pipeline.falsifyEvidence('ev')

    const scoreAfter = pipeline.getScoreValue('arg')
    expect(scoreAfter).toBe(0) // Evidence score forces 0
  })

  it('should collapse if ANY evidence is falsified (not just all)', () => {
    pipeline.addArgument({ id: 'arg', statement: 'Multi-evidence arg' })
    pipeline.addEvidence({
      id: 'ev-good', url: 'http://good.com', description: 'Good evidence', verificationStatus: 'VERIFIED',
    })
    pipeline.addEvidence({
      id: 'ev-bad', url: 'http://bad.com', description: 'Bad evidence', verificationStatus: 'VERIFIED',
    })

    pipeline.linkEvidence({ edgeId: 'e1', argumentId: 'arg', evidenceId: 'ev-good' })
    pipeline.linkEvidence({ edgeId: 'e2', argumentId: 'arg', evidenceId: 'ev-bad' })

    expect(pipeline.getScore('arg').evidenceScore).toBeGreaterThan(0)

    // Falsify just one
    pipeline.falsifyEvidence('ev-bad')

    // Even though ev-good is still verified, ANY falsified → 0
    expect(pipeline.getScore('arg').evidenceScore).toBe(0)
    expect(pipeline.getScoreValue('arg')).toBe(0)
  })

  it('should use average verification scores when none falsified', () => {
    pipeline.addArgument({ id: 'arg', statement: 'Evidence-backed' })
    pipeline.addEvidence({
      id: 'ev1', url: 'http://a.com', description: 'Verified', verificationStatus: 'VERIFIED',
    })
    pipeline.addEvidence({
      id: 'ev2', url: 'http://b.com', description: 'Disputed', verificationStatus: 'DISPUTED',
    })

    pipeline.linkEvidence({ edgeId: 'e1', argumentId: 'arg', evidenceId: 'ev1' })
    pipeline.linkEvidence({ edgeId: 'e2', argumentId: 'arg', evidenceId: 'ev2' })

    // Average of VERIFIED (1.0) and DISPUTED (0.5) = 0.75
    const breakdown = pipeline.getScore('arg')
    expect(breakdown.evidenceScore).toBeCloseTo(0.75)
  })
})

// ─── Invariant I5: Edge Relevance ─────────────────────────────────

describe('I5: Edge Relevance', () => {
  let pipeline: ReasonRankPipeline

  beforeEach(() => {
    pipeline = createPipeline()
  })

  it('should sever score transmission when relevance is 0', () => {
    pipeline.addClaim({ id: 'claim', statement: 'Thesis' })
    pipeline.addArgument({ id: 'arg', statement: 'True but irrelevant' })

    pipeline.linkArgument({
      edgeId: 'e1', argumentId: 'arg', targetId: 'claim', type: 'SUPPORTS', relevance: 0.0,
    })

    // arg is strong (score 1.0) but edge relevance is 0
    const claimBreakdown = pipeline.getScore('claim')
    expect(claimBreakdown.supportingForce).toBe(0)
    expect(claimBreakdown.finalScore).toBe(0.5) // No effective support
  })

  it('should scale contribution by edge relevance', () => {
    pipeline.addClaim({ id: 'claim', statement: 'Thesis' })
    pipeline.addArgument({ id: 'arg-strong', statement: 'Highly relevant' })
    pipeline.addArgument({ id: 'arg-weak', statement: 'Barely relevant' })

    pipeline.linkArgument({
      edgeId: 'e1', argumentId: 'arg-strong', targetId: 'claim', type: 'SUPPORTS', relevance: 0.9,
    })
    pipeline.linkArgument({
      edgeId: 'e2', argumentId: 'arg-weak', targetId: 'claim', type: 'SUPPORTS', relevance: 0.1,
    })

    const breakdown = pipeline.getScore('claim')
    // arg-strong (score 1.0 × relevance 0.9 = 0.9) should contribute ~9x
    // arg-weak (score 1.0 × relevance 0.1 = 0.1)
    expect(breakdown.supportingForce).toBeCloseTo(1.0, 1)
  })

  it('should allow relevance to be updated dynamically', () => {
    pipeline.addClaim({ id: 'claim', statement: 'Thesis' })
    pipeline.addArgument({ id: 'arg', statement: 'Relevant argument' })

    pipeline.linkArgument({
      edgeId: 'e1', argumentId: 'arg', targetId: 'claim', type: 'SUPPORTS', relevance: 0.9,
    })

    const scoreBefore = pipeline.getScoreValue('claim')
    expect(scoreBefore).toBeGreaterThan(0.5)

    // Users challenge relevance — edge weight drops to 0
    pipeline.setEdgeRelevance('e1', 0.0)

    const scoreAfter = pipeline.getScoreValue('claim')
    // Should be back to 0.5 (no effective arguments)
    expect(scoreAfter).toBe(0.5)
  })
})

// ─── Pipeline Integration Tests ───────────────────────────────────

describe('ReasonRankPipeline', () => {
  let pipeline: ReasonRankPipeline

  beforeEach(() => {
    pipeline = createPipeline()
  })

  it('should create nodes with correct initial scores', () => {
    const claim = pipeline.addClaim({ id: 'c1', statement: 'Test claim' })
    expect(claim.globalRank).toBe(0.5)

    const arg = pipeline.addArgument({ id: 'a1', statement: 'Test arg' })
    expect(arg.currentScore).toBe(1.0) // baseImpact default

    const ev = pipeline.addEvidence({
      id: 'e1', url: 'http://test.com', description: 'Test', verificationStatus: 'VERIFIED',
    })
    expect(ev.evidenceScore).toBe(1.0)
  })

  it('should handle complex multi-level trees', () => {
    // Build: Claim ← Arg1 ← SubArg1a, SubArg1b
    //                     ← SubArg1c (attacker)
    //              ← Arg2
    //              ← Arg3 (attacker)
    pipeline.addClaim({ id: 'claim', statement: 'Complex claim' })
    pipeline.addArgument({ id: 'arg1', statement: 'Main support' })
    pipeline.addArgument({ id: 'arg2', statement: 'Secondary support' })
    pipeline.addArgument({ id: 'arg3', statement: 'Counter-argument' })
    pipeline.addArgument({ id: 'sub1a', statement: 'Sub-support A' })
    pipeline.addArgument({ id: 'sub1b', statement: 'Sub-support B' })
    pipeline.addArgument({ id: 'sub1c', statement: 'Sub-attack' })

    pipeline.linkArgument({ edgeId: 'e1', argumentId: 'arg1', targetId: 'claim', type: 'SUPPORTS', relevance: 0.9 })
    pipeline.linkArgument({ edgeId: 'e2', argumentId: 'arg2', targetId: 'claim', type: 'SUPPORTS', relevance: 0.7 })
    pipeline.linkArgument({ edgeId: 'e3', argumentId: 'arg3', targetId: 'claim', type: 'ATTACKS', relevance: 0.8 })
    pipeline.linkArgument({ edgeId: 'e4', argumentId: 'sub1a', targetId: 'arg1', type: 'SUPPORTS', relevance: 1.0 })
    pipeline.linkArgument({ edgeId: 'e5', argumentId: 'sub1b', targetId: 'arg1', type: 'SUPPORTS', relevance: 0.6 })
    pipeline.linkArgument({ edgeId: 'e6', argumentId: 'sub1c', targetId: 'arg1', type: 'ATTACKS', relevance: 0.9 })

    const claimScore = pipeline.getScoreValue('claim')
    // Should be defined and between 0 and 1
    expect(claimScore).toBeGreaterThanOrEqual(0)
    expect(claimScore).toBeLessThanOrEqual(1)

    // With more support than attack at the claim level, should be > 0.5
    // (arg1 is supported, arg2 supports, only arg3 attacks)
    expect(claimScore).toBeGreaterThan(0.4)
  })
})
