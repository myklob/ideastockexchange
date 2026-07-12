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
 * A per-belief pass cap prevents infinite loops in case of cyclic belief graphs.
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
}

// ─── Internal helpers ─────────────────────────────────────────────

/** Below this, a recomputed value counts as unchanged (float noise, not news). */
const SCORE_EVENT_EPSILON = 1e-6

/** Cycle guard: how many times one belief may be reprocessed per propagation. */
const MAX_PASSES_PER_BELIEF = 10

/**
 * Record a belief score movement in the accumulation ledger. The belief page
 * renders these as Score History — the visible proof that the debate
 * accumulates instead of restarting. Only real movements are recorded;
 * a propagation pass that lands on the same value writes nothing.
 */
async function recordScoreEvent(
  beliefId: number,
  before: { positivity: number; stabilityScore: number },
  after: { positivity: number; stabilityScore?: number },
  trigger: string,
): Promise<void> {
  const scoreChanged = Math.abs(after.positivity - before.positivity) > SCORE_EVENT_EPSILON
  const stabilityChanged =
    after.stabilityScore !== undefined &&
    Math.abs(after.stabilityScore - before.stabilityScore) > SCORE_EVENT_EPSILON
  if (!scoreChanged && !stabilityChanged) return

  await prisma.beliefScoreEvent.create({
    data: {
      beliefId,
      scoreBefore: before.positivity,
      scoreAfter: after.positivity,
      stabilityBefore: stabilityChanged ? before.stabilityScore : null,
      stabilityAfter: stabilityChanged ? (after.stabilityScore as number) : null,
      trigger,
    },
  })
}

/** Current persisted score fields, read just before an update overwrites them. */
async function persistedScoresFor(
  beliefId: number,
): Promise<{ positivity: number; stabilityScore: number } | null> {
  return prisma.belief.findUnique({
    where: { id: beliefId },
    select: { positivity: true, stabilityScore: true },
  })
}

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
 * Traversal is an iterative worklist rather than a visited-set recursion: a
 * belief reached through two converging paths (diamond) must be recomputed
 * after BOTH incoming edges are fresh, and its own ancestors refreshed again —
 * a visited-set would prune the second pass and leave ancestors stale. The
 * worklist dedups pending entries (a belief already queued is not queued
 * twice) and caps how many times any one belief can be processed, so cyclic
 * graphs still terminate.
 *
 * @param beliefId - The belief whose scores should propagate upward.
 * @param visited  - Out-param: every belief ID this call processed.
 * @param depth    - Starting depth (for result reporting).
 * @param trigger  - Human-readable cause, recorded on every score event this
 *                   pass produces (e.g. "argument #12 posted").
 */
export async function propagateBeliefScores(
  beliefId: number,
  visited: Set<number> = new Set(),
  depth: number = 0,
  trigger: string = 'propagation',
): Promise<PropagationResult> {
  const result: PropagationResult = {
    updatedArgumentIds: [],
    updatedBeliefIds: [],
    depth,
  }

  const queue: Array<{ id: number; depth: number }> = [{ id: beliefId, depth }]
  const pending = new Set<number>([beliefId])
  const passes = new Map<number, number>()
  // Uniqueness depends on sibling text, which propagation never edits, so the
  // per-parent redundancy scan is cacheable across the whole traversal.
  const uniquenessCache = new Map<number, Map<number, number>>()

  while (queue.length > 0) {
    const item = queue.shift()!
    pending.delete(item.id)
    passes.set(item.id, (passes.get(item.id) ?? 0) + 1)
    visited.add(item.id)
    result.depth = Math.max(result.depth, item.depth)

    await propagateOneBelief(item, queue, pending, passes, uniquenessCache, result, trigger)
  }

  return result
}

async function propagateOneBelief(
  item: { id: number; depth: number },
  queue: Array<{ id: number; depth: number }>,
  pending: Set<number>,
  passes: Map<number, number>,
  uniquenessCache: Map<number, Map<number, number>>,
  result: PropagationResult,
  trigger: string,
): Promise<void> {
  const beliefId = item.id

  // ── Step 1: Compute the child belief's current truth score ──────
  const childBelief = await fetchBeliefById(beliefId)
  if (!childBelief) return

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
    const before = await persistedScoresFor(beliefId)
    await prisma.belief.update({
      where: { id: beliefId },
      data: { positivity: childScores.overallScore },
    })
    if (before) {
      await recordScoreEvent(beliefId, before, { positivity: childScores.overallScore }, trigger)
    }
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

  if (affectedArguments.size === 0) {
    // This belief is not a child of any other belief — propagation stops here.
    return
  }

  // ── Step 3: Recompute impactScore for each affected argument ────
  // Each argument is recomputed from its OWN four inputs, not from the
  // triggering belief alone: an importance-edge argument keeps its separate
  // truth child, and vice versa. truthScoreFor memoizes per-belief lookups;
  // siblingUniquenessFor memoizes the per-parent redundancy scan.
  const truthScoreCache = new Map<number, number>([[beliefId, childTruthScore]])
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
    parentBeliefIds.add(arg.parentBeliefId)
  }

  // ── Step 4: Recompute each parent belief's stability score ──────
  // We fetch fresh data for each parent so the updated impactScores are included.
  for (const parentBeliefId of parentBeliefIds) {
    const parentBelief = await fetchBeliefById(parentBeliefId)
    if (!parentBelief) continue

    const parentScores = computeBeliefScores(parentBelief)

    const parentBefore = await persistedScoresFor(parentBeliefId)
    await prisma.belief.update({
      where: { id: parentBeliefId },
      data: {
        stabilityScore: parentScores.stabilityScore,
        // Also persist the parent's computed overallScore so its own parent
        // argument-tree tables see the correct "Argument Score" for this belief.
        positivity: parentScores.overallScore,
      },
    })
    if (parentBefore) {
      await recordScoreEvent(
        parentBeliefId,
        parentBefore,
        { positivity: parentScores.overallScore, stabilityScore: parentScores.stabilityScore },
        trigger,
      )
    }

    result.updatedBeliefIds.push(parentBeliefId)

    // ── Step 5: Continue to each parent's own ancestors ───────────
    // Skip only if the parent is already queued (it will run after every
    // in-flight edge update lands) or has hit the cycle cap.
    if (!pending.has(parentBeliefId) && (passes.get(parentBeliefId) ?? 0) < MAX_PASSES_PER_BELIEF) {
      pending.add(parentBeliefId)
      queue.push({ id: parentBeliefId, depth: item.depth + 1 })
    }
  }
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
 * Starts from every true leaf — beliefs with no argument tree of their own
 * (which includes isolated beliefs) — and propagates each upward; ancestors,
 * converging paths included, are reached by the worklist. Used by
 * POST /api/scoring/propagate-all and by the seed chain, so a fresh dev
 * database starts with engine-computed scores rather than hand-typed
 * placeholders.
 */
export async function propagateAllBeliefScores(): Promise<FullPropagationResult> {
  const allBeliefIds = await prisma.belief.findMany({ select: { id: true } })
  const beliefIdsWithChildren = await prisma.argument.findMany({
    select: { parentBeliefId: true },
    distinct: ['parentBeliefId'],
  })

  const hasChildrenSet = new Set(beliefIdsWithChildren.map((a) => a.parentBeliefId))
  const startBeliefIds = allBeliefIds
    .map((b) => b.id)
    .filter((id) => !hasChildrenSet.has(id))

  const visited = new Set<number>()
  const result: FullPropagationResult = {
    startedFrom: startBeliefIds.length,
    updatedArguments: 0,
    updatedBeliefs: 0,
    maxDepth: 0,
  }

  for (const id of startBeliefIds) {
    if (visited.has(id)) continue
    const pass = await propagateBeliefScores(id, visited, 0, 'full recompute')
    result.updatedArguments += pass.updatedArgumentIds.length
    result.updatedBeliefs += pass.updatedBeliefIds.length
    result.maxDepth = Math.max(result.maxDepth, pass.depth)
  }

  // Every belief above a leaf is reached by the worklist, but cycle members
  // with no leaf beneath them are not. Sweep any belief not yet visited.
  for (const { id } of allBeliefIds) {
    if (visited.has(id)) continue
    const pass = await propagateBeliefScores(id, visited, 0, 'full recompute')
    result.updatedArguments += pass.updatedArgumentIds.length
    result.updatedBeliefs += pass.updatedBeliefIds.length
    result.maxDepth = Math.max(result.maxDepth, pass.depth)
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
    select: {
      beliefId: true,
      // Drafts are unreviewed detector output — "a detection is an argument,
      // never a penalty" (LinkageArgument.status): they must not move scores.
      linkageArguments: {
        where: { status: 'published' },
        select: { side: true, strength: true },
      },
    },
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
