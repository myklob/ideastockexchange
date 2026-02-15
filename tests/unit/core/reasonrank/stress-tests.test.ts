/**
 * ReasonRank Stress Tests — TDD Section 6
 *
 * The system is not "done" until it passes these three scenarios automatically.
 *
 * Test 1: The Jenga Test (Foundation Collapse)
 *   Flag evidence as FALSIFIED → argument collapses → claim drops.
 *
 * Test 2: The Echo Chamber Test (Uniqueness)
 *   100 semantically identical arguments do NOT linearly increase score.
 *
 * Test 3: The Relevance Sever (Edge Weight)
 *   A strong but irrelevant argument contributes nothing.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ReasonRankPipeline } from '../../../../src/core/reasonrank/propagation'

// ═══════════════════════════════════════════════════════════════════
// TEST 1: THE JENGA TEST (Foundation Collapse)
// ═══════════════════════════════════════════════════════════════════

describe('Stress Test 1: The Jenga Test (Foundation Collapse)', () => {
  let pipeline: ReasonRankPipeline

  beforeEach(() => {
    pipeline = new ReasonRankPipeline({ epsilon: 0.0001 })
  })

  it('should collapse the entire tree when foundational evidence is falsified', () => {
    // ─── Build a high-scoring tree ────────────────────────────
    //
    //   Claim: "Vitamin D prevents COVID"
    //     ├── Arg1: "Clinical trials show efficacy" (SUPPORTS, rel=0.9)
    //     │     ├── SubArg1a: "Randomized controlled trial" (SUPPORTS, rel=1.0)
    //     │     │     └── Evidence: "Published RCT in Lancet" (VERIFIED)
    //     │     └── SubArg1b: "Meta-analysis confirms" (SUPPORTS, rel=0.8)
    //     │           └── Evidence: "Cochrane review" (VERIFIED)
    //     └── Arg2: "Biological mechanism" (SUPPORTS, rel=0.7)
    //           └── Evidence: "Receptor binding study" (VERIFIED)

    pipeline.addClaim({ id: 'claim', statement: 'Vitamin D prevents COVID' })

    pipeline.addArgument({ id: 'arg1', statement: 'Clinical trials show efficacy' })
    pipeline.addArgument({ id: 'arg2', statement: 'Biological mechanism understood' })
    pipeline.addArgument({ id: 'sub1a', statement: 'Randomized controlled trial' })
    pipeline.addArgument({ id: 'sub1b', statement: 'Meta-analysis confirms' })

    pipeline.addEvidence({
      id: 'ev-rct', url: 'https://lancet.com/rct', description: 'Published RCT', verificationStatus: 'VERIFIED',
    })
    pipeline.addEvidence({
      id: 'ev-meta', url: 'https://cochrane.org/review', description: 'Cochrane review', verificationStatus: 'VERIFIED',
    })
    pipeline.addEvidence({
      id: 'ev-bio', url: 'https://nature.com/binding', description: 'Receptor binding', verificationStatus: 'VERIFIED',
    })

    // Wire the tree
    pipeline.linkArgument({ edgeId: 'e1', argumentId: 'arg1', targetId: 'claim', type: 'SUPPORTS', relevance: 0.9 })
    pipeline.linkArgument({ edgeId: 'e2', argumentId: 'arg2', targetId: 'claim', type: 'SUPPORTS', relevance: 0.7 })
    pipeline.linkArgument({ edgeId: 'e3', argumentId: 'sub1a', targetId: 'arg1', type: 'SUPPORTS', relevance: 1.0 })
    pipeline.linkArgument({ edgeId: 'e4', argumentId: 'sub1b', targetId: 'arg1', type: 'SUPPORTS', relevance: 0.8 })

    pipeline.linkEvidence({ edgeId: 'e5', argumentId: 'sub1a', evidenceId: 'ev-rct' })
    pipeline.linkEvidence({ edgeId: 'e6', argumentId: 'sub1b', evidenceId: 'ev-meta' })
    pipeline.linkEvidence({ edgeId: 'e7', argumentId: 'arg2', evidenceId: 'ev-bio' })

    // ─── Verify the tree is high-scoring ─────────────────────
    const claimBefore = pipeline.getScoreValue('claim')
    const arg1Before = pipeline.getScoreValue('arg1')
    const sub1aBefore = pipeline.getScoreValue('sub1a')
    expect(claimBefore).toBeGreaterThan(0.5)

    // ─── Action: Falsify the RCT evidence (the foundation) ───
    const events = pipeline.falsifyEvidence('ev-rct')

    // ─── Required Output ─────────────────────────────────────
    // 1. Evidence score becomes 0
    const evScore = pipeline.getScoreValue('ev-rct')
    expect(evScore).toBe(0)

    // 2. The sub-argument using this evidence collapses to 0
    const sub1aAfter = pipeline.getScoreValue('sub1a')
    expect(sub1aAfter).toBe(0)

    // 3. The parent argument (arg1) should drop because its sub-argument collapsed
    const arg1After = pipeline.getScoreValue('arg1')
    expect(arg1After).toBeLessThan(arg1Before)

    // 4. The root claim score drops proportionally
    const claimAfter = pipeline.getScoreValue('claim')
    expect(claimAfter).toBeLessThan(claimBefore)

    // 5. Propagation events were generated (I1)
    expect(events.length).toBeGreaterThan(0)
    // Events should include the sub-argument, its parent, and the claim
    const affectedNodeIds = events.map(e => e.nodeId)
    expect(affectedNodeIds).toContain('sub1a')
  })

  it('should completely collapse a single-evidence chain', () => {
    // Simplest case: Claim ← Arg ← Evidence
    pipeline.addClaim({ id: 'claim', statement: 'Simple claim' })
    pipeline.addArgument({ id: 'arg', statement: 'Only argument' })
    pipeline.addEvidence({
      id: 'ev', url: 'http://source.com', description: 'Only evidence', verificationStatus: 'VERIFIED',
    })

    pipeline.linkArgument({ edgeId: 'e1', argumentId: 'arg', targetId: 'claim', type: 'SUPPORTS', relevance: 1.0 })
    pipeline.linkEvidence({ edgeId: 'e2', argumentId: 'arg', evidenceId: 'ev' })

    expect(pipeline.getScoreValue('claim')).toBeGreaterThan(0.5)

    // Falsify the only evidence
    pipeline.falsifyEvidence('ev')

    // Arg should be 0 (evidence score = 0)
    expect(pipeline.getScoreValue('arg')).toBe(0)
    // Claim should drop to 0.5 (no effective support)
    expect(pipeline.getScoreValue('claim')).toBe(0.5)
  })
})

// ═══════════════════════════════════════════════════════════════════
// TEST 2: THE ECHO CHAMBER TEST (Uniqueness)
// ═══════════════════════════════════════════════════════════════════

describe('Stress Test 2: The Echo Chamber Test (Uniqueness)', () => {
  let pipeline: ReasonRankPipeline

  beforeEach(() => {
    pipeline = new ReasonRankPipeline({ epsilon: 0.0001 })
  })

  it('should NOT increase score linearly with 100 identical arguments', () => {
    // ─── Setup ───────────────────────────────────────────────
    pipeline.addClaim({ id: 'claim', statement: 'Disputed thesis' })

    // Start with one valid argument
    pipeline.addArgument({ id: 'arg-original', statement: 'The original valid argument' })
    pipeline.linkArgument({
      edgeId: 'e-original', argumentId: 'arg-original', targetId: 'claim',
      type: 'SUPPORTS', relevance: 1.0,
    })

    const scoreWith1 = pipeline.getScoreValue('claim')

    // ─── Action: Bot injects 100 semantically identical arguments ─
    const argIds: string[] = ['arg-original']
    for (let i = 0; i < 100; i++) {
      const id = `arg-clone-${i}`
      argIds.push(id)
      pipeline.addArgument({ id, statement: `The same argument phrased differently #${i}` })
      pipeline.linkArgument({
        edgeId: `e-clone-${i}`, argumentId: id, targetId: 'claim',
        type: 'SUPPORTS', relevance: 1.0,
      })
    }

    // Mark all clones as highly similar to the original and to each other
    let simEdgeCount = 0
    for (let i = 1; i < argIds.length; i++) {
      // Each clone is similar to the original
      pipeline.markSimilar(argIds[0], argIds[i], 0.95, `sim-${simEdgeCount++}`)
      // Each clone is similar to its neighbors (for good measure)
      if (i > 1) {
        pipeline.markSimilar(argIds[i - 1], argIds[i], 0.95, `sim-${simEdgeCount++}`)
      }
    }

    // ─── Required Output ─────────────────────────────────────
    const scoreWith101 = pipeline.getScoreValue('claim')

    // 1. Score should NOT have increased linearly (101x)
    //    If linear, scoreWith101 would be dramatically higher.
    //    With uniqueness penalty, it should be capped.

    // 2. Score should create a logarithmic curve, capping at ~1.5x or ~2x
    //    the single-argument score (not 101x)
    const scoreRatio = scoreWith101 / scoreWith1
    expect(scoreRatio).toBeLessThan(3)

    // 3. Volume fails — 100 copies should not dramatically beat 1 original
    // The score should remain in a reasonable range
    expect(scoreWith101).toBeLessThanOrEqual(1.0)
    expect(scoreWith101).toBeGreaterThan(0)
  })

  it('should distinguish unique arguments from redundant ones', () => {
    pipeline.addClaim({ id: 'claim', statement: 'Multi-faceted thesis' })

    // 3 genuinely unique arguments
    pipeline.addArgument({ id: 'unique-1', statement: 'Economic argument' })
    pipeline.addArgument({ id: 'unique-2', statement: 'Environmental argument' })
    pipeline.addArgument({ id: 'unique-3', statement: 'Ethical argument' })

    pipeline.linkArgument({ edgeId: 'eu1', argumentId: 'unique-1', targetId: 'claim', type: 'SUPPORTS', relevance: 1.0 })
    pipeline.linkArgument({ edgeId: 'eu2', argumentId: 'unique-2', targetId: 'claim', type: 'SUPPORTS', relevance: 1.0 })
    pipeline.linkArgument({ edgeId: 'eu3', argumentId: 'unique-3', targetId: 'claim', type: 'SUPPORTS', relevance: 1.0 })

    const scoreUnique = pipeline.getScoreValue('claim')

    // Now create a claim with 3 redundant arguments
    pipeline.addClaim({ id: 'claim-redundant', statement: 'Same thesis, redundant args' })

    pipeline.addArgument({ id: 'dup-1', statement: 'Economic argument v1' })
    pipeline.addArgument({ id: 'dup-2', statement: 'Economic argument v2' })
    pipeline.addArgument({ id: 'dup-3', statement: 'Economic argument v3' })

    pipeline.linkArgument({ edgeId: 'ed1', argumentId: 'dup-1', targetId: 'claim-redundant', type: 'SUPPORTS', relevance: 1.0 })
    pipeline.linkArgument({ edgeId: 'ed2', argumentId: 'dup-2', targetId: 'claim-redundant', type: 'SUPPORTS', relevance: 1.0 })
    pipeline.linkArgument({ edgeId: 'ed3', argumentId: 'dup-3', targetId: 'claim-redundant', type: 'SUPPORTS', relevance: 1.0 })

    // Mark the redundant ones as similar
    pipeline.markSimilar('dup-1', 'dup-2', 0.9, 'sim-r1')
    pipeline.markSimilar('dup-2', 'dup-3', 0.9, 'sim-r2')
    pipeline.markSimilar('dup-1', 'dup-3', 0.9, 'sim-r3')

    const scoreRedundant = pipeline.getScoreValue('claim-redundant')

    // 3 unique arguments should produce a higher score than 3 redundant
    expect(scoreUnique).toBeGreaterThan(scoreRedundant)
  })
})

// ═══════════════════════════════════════════════════════════════════
// TEST 3: THE RELEVANCE SEVER (Edge Weight)
// ═══════════════════════════════════════════════════════════════════

describe('Stress Test 3: The Relevance Sever (Edge Weight)', () => {
  let pipeline: ReasonRankPipeline

  beforeEach(() => {
    pipeline = new ReasonRankPipeline({ epsilon: 0.0001 })
  })

  it('should drop claim score when argument relevance is severed', () => {
    // ─── Setup: A strong argument supports a claim ───────────
    pipeline.addClaim({ id: 'claim', statement: 'Thesis to defend' })
    pipeline.addArgument({ id: 'arg', statement: 'Strong argument (score=1.0)' })
    pipeline.addEvidence({
      id: 'ev', url: 'http://proof.com', description: 'Strong proof', verificationStatus: 'VERIFIED',
    })

    pipeline.linkArgument({
      edgeId: 'e-arg-claim', argumentId: 'arg', targetId: 'claim',
      type: 'SUPPORTS', relevance: 0.9,
    })
    pipeline.linkEvidence({ edgeId: 'e-arg-ev', argumentId: 'arg', evidenceId: 'ev' })

    const scoreBefore = pipeline.getScoreValue('claim')
    expect(scoreBefore).toBeGreaterThan(0.5)

    // Verify the argument itself is strong
    const argScore = pipeline.getScoreValue('arg')
    expect(argScore).toBeGreaterThan(0)

    // ─── Action: Users challenge relevance → edge drops to 0.01 ──
    pipeline.setEdgeRelevance('e-arg-claim', 0.01)

    // ─── Required Output ─────────────────────────────────────
    const scoreAfter = pipeline.getScoreValue('claim')

    // 1. Claim score drops as if the argument didn't exist
    expect(scoreAfter).toBeLessThan(scoreBefore)
    // Should be near 0.5 (no effective support)
    expect(scoreAfter).toBeCloseTo(0.5, 1)

    // 2. The argument itself remains "True" (its own score unchanged)
    const argScoreAfter = pipeline.getScoreValue('arg')
    expect(argScoreAfter).toBeGreaterThan(0)
    // Argument's intrinsic truth is unaffected by edge relevance
    expect(argScoreAfter).toBeCloseTo(argScore, 2)
  })

  it('should allow relevance to be restored', () => {
    pipeline.addClaim({ id: 'claim', statement: 'Thesis' })
    pipeline.addArgument({ id: 'arg', statement: 'Key argument' })

    pipeline.linkArgument({
      edgeId: 'e1', argumentId: 'arg', targetId: 'claim',
      type: 'SUPPORTS', relevance: 0.9,
    })

    const scoreHigh = pipeline.getScoreValue('claim')

    // Sever
    pipeline.setEdgeRelevance('e1', 0.0)
    const scoreSevered = pipeline.getScoreValue('claim')
    expect(scoreSevered).toBe(0.5)

    // Restore
    pipeline.setEdgeRelevance('e1', 0.9)
    const scoreRestored = pipeline.getScoreValue('claim')
    expect(scoreRestored).toBeCloseTo(scoreHigh, 2)
  })

  it('should handle partial relevance reduction proportionally', () => {
    pipeline.addClaim({ id: 'claim', statement: 'Thesis' })
    pipeline.addArgument({ id: 'arg', statement: 'Argument' })

    pipeline.linkArgument({
      edgeId: 'e1', argumentId: 'arg', targetId: 'claim',
      type: 'SUPPORTS', relevance: 1.0,
    })

    const scoreFull = pipeline.getScoreValue('claim')

    // Reduce relevance to half
    pipeline.setEdgeRelevance('e1', 0.5)
    const scoreHalf = pipeline.getScoreValue('claim')

    // Score should be between severed (0.5) and full
    expect(scoreHalf).toBeLessThan(scoreFull)
    expect(scoreHalf).toBeGreaterThan(0.5)
  })

  it('should demonstrate that truth and relevance are independent', () => {
    // An argument can be 100% true but 0% relevant
    pipeline.addClaim({ id: 'claim', statement: 'The sky is blue' })
    pipeline.addArgument({ id: 'arg', statement: 'Water is wet (true but irrelevant)' })
    pipeline.addEvidence({
      id: 'ev', url: 'http://h2o.com', description: 'Water properties', verificationStatus: 'VERIFIED',
    })

    pipeline.linkArgument({
      edgeId: 'e1', argumentId: 'arg', targetId: 'claim',
      type: 'SUPPORTS', relevance: 0.0, // true but irrelevant
    })
    pipeline.linkEvidence({ edgeId: 'e2', argumentId: 'arg', evidenceId: 'ev' })

    // Argument is strong
    const argBreakdown = pipeline.getScore('arg')
    expect(argBreakdown.finalScore).toBeGreaterThan(0)

    // But claim gets nothing from it
    const claimBreakdown = pipeline.getScore('claim')
    expect(claimBreakdown.supportingForce).toBe(0)
    expect(claimBreakdown.finalScore).toBe(0.5)
  })
})
