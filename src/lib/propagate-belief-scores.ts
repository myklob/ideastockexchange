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
import {
  computeArgumentImpactScore,
  deriveImportanceFromBeliefScore,
  calculateLinkageFromArguments,
} from '@/core/scoring/scoring-engine'

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

// ─── Internal helpers ─────────────────────────────────────────────

/** Columns needed to recompute an argument edge's impact. */
const ARGUMENT_EDGE_SELECT = {
  id: true,
  parentBeliefId: true,
  beliefId: true,
  importanceBeliefId: true,
  side: true,
  linkageScore: true,
  importanceScore: true,
} as const

interface ArgumentEdge {
  id: number
  parentBeliefId: number
  beliefId: number
  importanceBeliefId: number | null
  side: string
  linkageScore: number
  importanceScore: number
}

/**
 * Resolve a belief's truth score (0–1), memoized per propagation pass so a
 * belief feeding many arguments is only scored once.
 */
async function truthScoreFor(beliefId: number, cache: Map<number, number>): Promise<number> {
  const cached = cache.get(beliefId)
  if (cached !== undefined) return cached

  const belief = await fetchBeliefById(beliefId)
  const score = belief ? computeBeliefScores(belief).importanceWeightedScore : 0
  cache.set(beliefId, score)
  return score
}

/**
 * Resolve an argument's effective Importance Score (0–1).
 *
 * When `importanceBeliefId` is set, importance is DERIVED from that belief's
 * net score (normalized to 0–1) so it tracks the live sub-debate about whether
 * the argument matters. When null, the manually-entered `importanceScore` is
 * used unchanged — keeping every pre-existing argument backward compatible.
 */
async function resolveEffectiveImportance(arg: {
  importanceBeliefId: number | null
  importanceScore: number
}): Promise<number> {
  if (arg.importanceBeliefId == null) return arg.importanceScore

  const importanceBelief = await fetchBeliefById(arg.importanceBeliefId)
  if (!importanceBelief) return arg.importanceScore

  const { overallScore } = computeBeliefScores(importanceBelief)
  return deriveImportanceFromBeliefScore(overallScore)
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

  // Persist the child belief's computed overallScore back to the positivity field
  // so that parent argument-tree tables always display the up-to-date score.
  await prisma.belief.update({
    where: { id: beliefId },
    data: { positivity: childScores.overallScore },
  })

  // ── Step 2: Find every argument edge that draws on this belief ──
  // A belief can feed a parent argument through THREE distinct edges:
  //   • Truth edge      (Argument.beliefId)           — the reason itself.
  //   • Importance edge (Argument.importanceBeliefId) — how much it matters.
  //   • Linkage edge    (linkage sub-debate)          — handled separately,
  //     via propagateFromLinkageChange, since it lives below the argument.
  // When this belief changes we must refresh every argument on the truth OR
  // importance edge, because both feed impactScore = Truth × Importance × Linkage.
  const truthEdges = await prisma.argument.findMany({
    where: { beliefId },
    select: ARGUMENT_EDGE_SELECT,
  })
  const importanceEdges = await prisma.argument.findMany({
    where: { importanceBeliefId: beliefId },
    select: ARGUMENT_EDGE_SELECT,
  })

  // Merge by id so an argument that uses this belief as BOTH its truth and
  // importance source is only recomputed once.
  const affectedArguments = new Map<number, ArgumentEdge>()
  for (const arg of [...truthEdges, ...importanceEdges]) {
    affectedArguments.set(arg.id, arg)
  }

  if (affectedArguments.size === 0) {
    // This belief is not a child of any other belief — propagation stops here.
    return result
  }

  // ── Step 3: Recompute impactScore for each affected argument ────
  // Each argument is recomputed from its OWN three inputs, not from the
  // triggering belief alone: an importance-edge argument keeps its separate
  // truth child, and vice versa. truthScoreFor memoizes per-belief lookups.
  const truthScoreCache = new Map<number, number>([[beliefId, childTruthScore]])
  const parentBeliefIds = new Set<number>()

  for (const arg of affectedArguments.values()) {
    const truth = await truthScoreFor(arg.beliefId, truthScoreCache)
    const importance = await resolveEffectiveImportance(arg)

    const newImpactScore = computeArgumentImpactScore(
      arg.side,
      truth,
      arg.linkageScore,
      importance,
    )

    await prisma.argument.update({
      where: { id: arg.id },
      // Persist the derived importance too, so rendered tables and later
      // truth-edge recomputes read a value consistent with the live debate.
      data: { impactScore: newImpactScore, importanceScore: importance },
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
      data: {
        stabilityScore: parentScores.stabilityScore,
        // Also persist the parent's computed overallScore so its own parent
        // argument-tree tables see the correct "Argument Score" for this belief.
        positivity: parentScores.overallScore,
      },
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

/**
 * Trigger propagation from a change in an argument's LINKAGE sub-debate.
 *
 * Mirrors {@link propagateFromArgumentChange}, but for the third score channel:
 * it first recomputes the argument's `linkageScore` from its current
 * LinkageArguments (the (A−D)/(A+D)-style sub-debate), persists it, then
 * propagates from the argument's child belief upward — which recomputes this
 * argument's impactScore with the fresh linkage and ripples to every ancestor.
 *
 * Call this whenever a LinkageArgument is added, edited, or removed.
 *
 * @param argumentId - The argument whose linkage sub-debate just changed.
 */
export async function propagateFromLinkageChange(argumentId: number): Promise<PropagationResult> {
  const arg = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: { beliefId: true, linkageArguments: { select: { side: true, strength: true } } },
  })

  if (!arg) {
    return { updatedArgumentIds: [], updatedBeliefIds: [], depth: 0 }
  }

  // Recompute linkage from the sub-debate and persist it before propagating,
  // so the upward recomputation of impactScore reads the up-to-date linkage.
  const newLinkageScore = calculateLinkageFromArguments(arg.linkageArguments)
  await prisma.argument.update({
    where: { id: argumentId },
    data: { linkageScore: newLinkageScore },
  })

  return propagateBeliefScores(arg.beliefId)
}
