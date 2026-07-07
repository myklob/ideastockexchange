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
 * 4. Recompute A.impactScore = sign × B.truthScore × |A.linkageScore| ×
 *    A.importanceScore × A.uniquenessScore × 100, where uniqueness discounts
 *    restatements of earlier same-side siblings (the redundancy scan applied
 *    at scoring time).
 * 5. Update A.impactScore (plus the derived importance, uniqueness, and the
 *    child's own tree score as argumentScore) in the database.
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
  computeEvidenceImpactScore,
  deriveImportanceFromBeliefScore,
  calculateLinkageFromArguments,
  calculateEVS,
  getEvidenceTypeWeight,
  verificationFactorFor,
} from '@/core/scoring/scoring-engine'
import {
  mechanicalSimilarity,
  uniquenessFromSimilarities,
} from '@/core/scoring/duplication-scoring'

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
  /** Arguments whose impact actually MOVED (beyond rounding noise). Batch
   *  passes iterate until this reaches zero, settling ordering artifacts. */
  changedArgumentIds: number[]
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
  impactScore: true,
} as const

interface ArgumentEdge {
  id: number
  parentBeliefId: number
  beliefId: number
  importanceBeliefId: number | null
  side: string
  linkageScore: number
  importanceScore: number
  impactScore: number
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
 * Compute the uniqueness factor for every argument edge attached to a parent
 * belief, memoized per propagation pass.
 *
 * Uniqueness is a property of an argument WITHIN its parent's tree: how much
 * new signal it adds versus the same-side arguments that were there first.
 * Oldest-first, so the original statement of a point keeps full credit and
 * each later restatement is discounted by its similarity to what already
 * stands (uniqueness = 1 − max similarity, per duplication-scoring). This is
 * the "stored, not scored" redundancy scan finally applied at scoring time.
 */
async function siblingUniquenessFor(
  parentBeliefId: number,
  cache: Map<number, Map<number, number>>,
): Promise<Map<number, number>> {
  const cached = cache.get(parentBeliefId)
  if (cached) return cached

  const siblings = await prisma.argument.findMany({
    where: { parentBeliefId, status: 'published' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      side: true,
      claim: true,
      belief: { select: { statement: true } },
    },
  })

  const uniqueness = new Map<number, number>()
  const earlierTextsBySide = new Map<string, string[]>()

  for (const sibling of siblings) {
    const text = sibling.claim ?? sibling.belief.statement
    const earlier = earlierTextsBySide.get(sibling.side) ?? []
    const similarities = earlier.map((prior) => mechanicalSimilarity(text, prior))
    uniqueness.set(sibling.id, uniquenessFromSimilarities(similarities))
    earlierTextsBySide.set(sibling.side, [...earlier, text])
  }

  cache.set(parentBeliefId, uniqueness)
  return uniqueness
}

/**
 * Recompute the derived quality score for every criterion on a belief's page
 * whose quality is sourced from a dedicated sub-belief ("X is a good measure
 * of Y"). The recursive part of the criteria layer: totalScore is whatever
 * that sub-debate earns, mapped from its net (−100..+100) onto [0, 1] — never
 * a hand-set constant. Runs before evidence recomputation, because linked
 * evidence impacts carry the criterion's quality factor.
 */
async function recomputeCriterionScores(beliefId: number): Promise<number[]> {
  const rows = await prisma.objectiveCriteria.findMany({
    where: { beliefId, criterionBeliefId: { not: null } },
    select: {
      id: true,
      totalScore: true,
      criterionBelief: { select: { positivity: true } },
    },
  })

  const updated: number[] = []
  for (const row of rows) {
    if (!row.criterionBelief) continue
    const derived = deriveImportanceFromBeliefScore(row.criterionBelief.positivity)
    if (Math.abs(derived - row.totalScore) > 1e-9) {
      await prisma.objectiveCriteria.update({
        where: { id: row.id },
        data: { totalScore: derived },
      })
      updated.push(row.id)
    }
  }
  return updated
}

/**
 * Recompute the engine-derived EVS and impact for every evidence row on a
 * belief, persisting changed values. Evidence carries weight by quality —
 * EVS from its own verification inputs, times its evidence-to-conclusion
 * linkage, times the quality of the yardstick that measured it — never a
 * hand-tuned number. Runs before the belief's own score is computed so the
 * fresh impacts feed the totals.
 */
async function recomputeEvidenceImpacts(beliefId: number): Promise<number[]> {
  const rows = await prisma.evidence.findMany({
    where: { beliefId },
    select: {
      id: true,
      side: true,
      evidenceType: true,
      replicationQuantity: true,
      conclusionRelevance: true,
      replicationPercentage: true,
      evsScore: true,
      linkageScore: true,
      impactScore: true,
      verificationStatus: true,
      criterion: {
        select: { totalScore: true, criterionBeliefId: true },
      },
    },
  })

  const updated: number[] = []
  for (const row of rows) {
    const evs = calculateEVS({
      sourceIndependenceWeight: getEvidenceTypeWeight(row.evidenceType),
      replicationQuantity: row.replicationQuantity,
      conclusionRelevance: row.conclusionRelevance,
      replicationPercentage: row.replicationPercentage,
    })
    // The yardstick factor: evidence measured by a scored criterion carries
    // that criterion's quality; unlinked evidence is unpenalized.
    const criterionQuality = row.criterion ? row.criterion.totalScore : 1
    const impact = computeEvidenceImpactScore(
      row.side,
      evs,
      row.linkageScore,
      verificationFactorFor(row.verificationStatus),
      criterionQuality,
    )

    if (Math.abs(impact - row.impactScore) > 1e-9 || Math.abs(evs - row.evsScore) > 1e-9) {
      await prisma.evidence.update({
        where: { id: row.id },
        data: { evsScore: evs, impactScore: impact },
      })
      updated.push(row.id)
    }
  }
  return updated
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
    return { updatedArgumentIds: [], updatedBeliefIds: [], depth, changedArgumentIds: [] }
  }
  visited.add(beliefId)

  const result: PropagationResult = {
    updatedArgumentIds: [],
    updatedBeliefIds: [],
    depth,
    changedArgumentIds: [],
  }

  // ── Step 0: Refresh the belief's own criteria and evidence ──────
  // Criterion quality first (derived from criterion sub-debates), then
  // evidence impacts (EVS × linkage × verification × criterion quality) —
  // so the truth computed below already reflects the current quality,
  // standing, and yardstick of every row.
  await recomputeCriterionScores(beliefId)
  await recomputeEvidenceImpacts(beliefId)

  // ── Step 1: Compute the child belief's current truth score ──────
  const childBelief = await fetchBeliefById(beliefId)
  if (!childBelief) return result

  const childScores = computeBeliefScores(childBelief)
  // importanceWeightedScore (0–1) is the best single summary of "how true" the
  // child belief is, weighted by how much each argument moves the needle.
  const childTruthScore = childScores.importanceWeightedScore

  // Persist the child belief's computed overallScore back to the positivity field
  // so that parent argument-tree tables always display the up-to-date score.
  // Only when the belief has scored content of its own (arguments or evidence):
  // a leaf with nothing under it has no computed score, and stamping a 0 over
  // its editorial valence would fake a verdict that was never computed (Rule 6).
  const hasScoredContent = childBelief.arguments.length > 0 || childBelief.evidence.length > 0
  if (hasScoredContent) {
    await prisma.belief.update({
      where: { id: beliefId },
      data: { positivity: childScores.overallScore },
    })
  }

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

  // A belief can also feed a parent page through a CRITERION edge: this
  // belief may be the sub-debate that sources a criterion's quality score on
  // some other belief's page. Those pages must recompute too (their criterion
  // quality, their measured evidence, and their own net).
  const criterionParents = await prisma.objectiveCriteria.findMany({
    where: { criterionBeliefId: beliefId },
    select: { beliefId: true },
  })

  if (affectedArguments.size === 0 && criterionParents.length === 0) {
    // This belief feeds no other belief — propagation stops here.
    return result
  }

  // ── Step 3: Recompute impactScore for each affected argument ────
  // Each argument is recomputed from its OWN four inputs, not from the
  // triggering belief alone: an importance-edge argument keeps its separate
  // truth child, and vice versa. truthScoreFor memoizes per-belief lookups;
  // siblingUniquenessFor memoizes the per-parent redundancy scan.
  const truthScoreCache = new Map<number, number>([[beliefId, childTruthScore]])
  const uniquenessCache = new Map<number, Map<number, number>>()
  const parentBeliefIds = new Set<number>()

  for (const arg of affectedArguments.values()) {
    const truth = await truthScoreFor(arg.beliefId, truthScoreCache)
    const importance = await resolveEffectiveImportance(arg)
    const siblingUniqueness = await siblingUniquenessFor(arg.parentBeliefId, uniquenessCache)
    const uniqueness = siblingUniqueness.get(arg.id) ?? 1

    const newImpactScore = computeArgumentImpactScore(
      arg.side,
      truth,
      arg.linkageScore,
      importance,
      uniqueness,
    )

    await prisma.argument.update({
      where: { id: arg.id },
      // Persist the derived importance and uniqueness too, so rendered tables,
      // the score-provenance page, and later truth-edge recomputes all read
      // values consistent with the live debate. argumentScore is the child
      // belief's own tree score (0–100) — the recursive "Score" column made
      // real (Rule 6: computed, never hand-assigned).
      data: {
        impactScore: newImpactScore,
        importanceScore: importance,
        uniquenessScore: uniqueness,
        argumentScore: Math.round(truth * 1000) / 10,
      },
    })

    result.updatedArgumentIds.push(arg.id)
    if (Math.abs(newImpactScore - arg.impactScore) > 0.05) {
      result.changedArgumentIds.push(arg.id)
    }
    parentBeliefIds.add(arg.parentBeliefId)
  }

  for (const cp of criterionParents) {
    parentBeliefIds.add(cp.beliefId)
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
    result.changedArgumentIds.push(...childResult.changedArgumentIds)
    result.depth = Math.max(result.depth, childResult.depth)
  }

  return result
}

export interface FullPropagationResult {
  startedFrom: number
  updatedArguments: number
  updatedBeliefs: number
  maxDepth: number
}

/**
 * Recompute scores for every belief in the database, bottom-up.
 *
 * Finds every leaf belief (never used as a reason) plus isolated beliefs, and
 * propagates each upward; the shared visited-set prevents redundant work when
 * leaves share ancestors. Used by POST /api/scoring/propagate-all and by the
 * seed chain, so a fresh dev database starts with engine-computed scores
 * rather than hand-typed placeholders.
 */
export async function propagateAllBeliefScores(): Promise<FullPropagationResult> {
  const allBeliefIds = await prisma.belief.findMany({ select: { id: true } })
  const beliefIdsUsedAsChild = await prisma.argument.findMany({
    select: { beliefId: true },
    distinct: ['beliefId'],
  })

  const usedAsChildSet = new Set(beliefIdsUsedAsChild.map((a) => a.beliefId))
  const startBeliefIds = allBeliefIds
    .map((b) => b.id)
    .filter((id) => !usedAsChildSet.has(id))

  const result: FullPropagationResult = {
    startedFrom: startBeliefIds.length,
    updatedArguments: 0,
    updatedBeliefs: 0,
    maxDepth: 0,
  }

  // A single leaf-up sweep can recompute an edge before a sub-debate it
  // depends on (e.g. an importance sub-belief on a cross-branch) has itself
  // settled — the visited-set skips the re-entry. Iterate whole passes until
  // no impact moves (bounded; each pass settles at least one more layer).
  const MAX_PASSES = 4
  for (let passIndex = 0; passIndex < MAX_PASSES; passIndex++) {
    const visited = new Set<number>()
    let changed = 0

    for (const id of startBeliefIds) {
      if (visited.has(id)) continue
      const pass = await propagateBeliefScores(id, visited)
      result.updatedArguments += pass.updatedArgumentIds.length
      result.updatedBeliefs += pass.updatedBeliefIds.length
      result.maxDepth = Math.max(result.maxDepth, pass.depth)
      changed += pass.changedArgumentIds.length
    }

    // Leaves reach their ancestors through recursion, but a mid-graph belief
    // whose leaf children carry no arguments of their own can be missed when
    // every leaf under it was already visited. Sweep any belief not yet visited.
    for (const { id } of allBeliefIds) {
      if (visited.has(id)) continue
      const pass = await propagateBeliefScores(id, visited)
      result.updatedArguments += pass.updatedArgumentIds.length
      result.updatedBeliefs += pass.updatedBeliefIds.length
      result.maxDepth = Math.max(result.maxDepth, pass.depth)
      changed += pass.changedArgumentIds.length
    }

    if (changed === 0) break
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
    return { updatedArgumentIds: [], updatedBeliefIds: [], depth: 0, changedArgumentIds: [] }
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
    return { updatedArgumentIds: [], updatedBeliefIds: [], depth: 0, changedArgumentIds: [] }
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
