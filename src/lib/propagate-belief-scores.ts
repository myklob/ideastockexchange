/**
 * Recursive Belief Score Propagation
 *
 * Implements the core promise of the Idea Stock Exchange:
 * "When you strengthen or weaken an underlying fact, the algorithm
 * automatically updates the score of every conclusion connected to it."
 *
 * How it works (bottom-up propagation):
 *
 * 1. Given a belief B that changed (new evidence, updated linkage, etc.)
 * 2. Compute B's current truth score from its arguments and evidence.
 * 3. Find all Arguments where B is the child (i.e., B is the reason for
 *    some parent belief P). Each such argument A has a stored impactScore.
 * 4. Recompute A.impactScore = sign × B.truthScore × |A.linkageScore| × A.importanceScore × 100
 * 5. Update A.impactScore in the database.
 * 6. For each parent belief P whose argument was just updated:
 *    a. Recompute P's stability score from all its arguments' impactScores.
 *    b. Persist P's new stabilityScore.
 *    c. Recurse: propagate from P upward to P's own parent beliefs.
 *
 * A visited-set prevents infinite loops in case of cyclic belief graphs.
 *
 * This module is intentionally separated from the API layer so it can be
 * called from any mutation point: evidence added, linkage vote cast, etc.
 */

import { prisma } from '@/lib/prisma'
import { fetchBeliefById, computeBeliefScores } from '@/features/belief-analysis/data/fetch-belief'
import { computeArgumentImpactScore } from '@/core/scoring/scoring-engine'

// Re-export so callers can import from one place
export { computeArgumentImpactScore }

// ─── Types ───────────────────────────────────────────────────────

export interface PropagationResult {
  /** IDs of arguments whose impactScore was updated */
  updatedArgumentIds: number[]
  /** IDs of beliefs whose stabilityScore was updated */
  updatedBeliefIds: number[]
  /** Number of recursive levels traversed */
  depth: number
}

/**
 * Propagate score changes upward through the belief dependency graph.
 *
 * Starting from belief `beliefId`, this function:
 * 1. Computes the belief's current truth score.
 * 2. Updates the impactScore on every argument edge that uses this belief as a child.
 * 3. Recomputes each parent belief's stability score.
 * 4. Recurses to each parent belief.
 *
 * @param beliefId - The belief whose scores should propagate upward.
 * @param visited  - Set of already-visited belief IDs (prevents cycles).
 * @param depth    - Current recursion depth (for result reporting).
 */
export async function propagateBeliefScores(
  beliefId: number,
  visited: Set<number> = new Set(),
  depth: number = 0,
): Promise<PropagationResult> {
  if (visited.has(beliefId)) {
    return { updatedArgumentIds: [], updatedBeliefIds: [], depth }
  }
  visited.add(beliefId)

  const result: PropagationResult = {
    updatedArgumentIds: [],
    updatedBeliefIds: [],
    depth,
  }

  // ── Step 1: Compute the child belief's current truth score ──────
  const childBelief = await fetchBeliefById(beliefId)
  if (!childBelief) return result

  const childScores = computeBeliefScores(childBelief)
  // importanceWeightedScore (0–1) is the best single summary of "how true" the
  // child belief is, weighted by how much each argument moves the needle.
  const childTruthScore = childScores.importanceWeightedScore

  // ── Step 2: Find all arguments where this belief is the child ───
  // An argument links: parentBelief (the conclusion) ← belief (the reason).
  // When the reason's truth changes, the argument's impact changes too.
  const argumentsAsChild = await prisma.argument.findMany({
    where: { beliefId },
    select: {
      id: true,
      parentBeliefId: true,
      side: true,
      linkageScore: true,
      importanceScore: true,
    },
  })

  if (argumentsAsChild.length === 0) {
    // This belief is not a child of any other belief — propagation stops here.
    return result
  }

  // ── Step 3: Recompute impactScore for each argument edge ────────
  const parentBeliefIds = new Set<number>()

  for (const arg of argumentsAsChild) {
    const newImpactScore = computeArgumentImpactScore(
      arg.side,
      childTruthScore,
      arg.linkageScore,
      arg.importanceScore,
    )

    await prisma.argument.update({
      where: { id: arg.id },
      data: { impactScore: newImpactScore },
    })

    result.updatedArgumentIds.push(arg.id)
    parentBeliefIds.add(arg.parentBeliefId)
  }

  // ── Step 4: Recompute each parent belief's stability score ──────
  // We fetch fresh data for each parent so the updated impactScores are included.
  for (const parentBeliefId of parentBeliefIds) {
    const parentBelief = await fetchBeliefById(parentBeliefId)
    if (!parentBelief) continue

    const parentScores = computeBeliefScores(parentBelief)

    await prisma.belief.update({
      where: { id: parentBeliefId },
      data: { stabilityScore: parentScores.stabilityScore },
    })

    result.updatedBeliefIds.push(parentBeliefId)

    // ── Step 5: Recurse to each parent's own ancestors ────────────
    const childResult = await propagateBeliefScores(parentBeliefId, visited, depth + 1)
    result.updatedArgumentIds.push(...childResult.updatedArgumentIds)
    result.updatedBeliefIds.push(...childResult.updatedBeliefIds)
    result.depth = Math.max(result.depth, childResult.depth)
  }

  return result
}

/**
 * Trigger propagation from a single argument edge change.
 *
 * Call this whenever an argument's linkageScore is updated. It recomputes
 * the argument's impactScore immediately, then propagates the parent
 * belief's stability score upward through the graph.
 *
 * @param argumentId - The argument whose linkageScore just changed.
 */
export async function propagateFromArgumentChange(argumentId: number): Promise<PropagationResult> {
  const arg = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: { beliefId: true, parentBeliefId: true },
  })

  if (!arg) {
    return { updatedArgumentIds: [], updatedBeliefIds: [], depth: 0 }
  }

  // Propagate from the child belief upward through this argument to all ancestors.
  return propagateBeliefScores(arg.beliefId)
}
