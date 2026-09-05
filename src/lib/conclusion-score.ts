/**
 * Conclusion Score — the original Idea Stock Exchange scoring process.
 *
 * A faithful implementation of the algorithm in the founding Excel workbook
 * ("Conclusions about the Church with arguments in separate columns";
 * an early copy lives at docs/Example Argument, using excel, LDS Church.xlsx).
 * Every conclusion gets a page with reasons to agree and reasons to disagree
 * in separate columns; each reason may itself be a conclusion with its own
 * page, so scores are recursive:
 *
 *   linkage(edge) = (agree − disagree) / (agree + disagree)      in [−1, 1]
 *     from the edge's linkage sub-debate ("if the reason were true, would it
 *     actually support this conclusion?"); defaults to 1 when nobody has
 *     debated the linkage yet.
 *
 *   score(C) = nAgree − nDisagree
 *            + m · ( Σ_agree score(child)·linkage − Σ_disagree score(child)·linkage )
 *
 * where m is the sub-argument multiplier (the workbook's Index!O1 = 0.7; its
 * per-sheet formulas predate that cell and use m = 1). Each listed reason
 * counts one point toward its column whether or not it has its own page; the
 * recursive term only adds what the reason's own debate has earned.
 *
 * The modern engine (src/core/scoring/scoring-engine.ts) generalizes every
 * term of this process: the linkage ratio became scoreLinkageDebate, the
 * multiplier became damping/depth attenuation, and raw counts became
 * truth × linkage × importance × uniqueness. This module keeps the original
 * process runnable and testable; the SQL twin is
 * sql/conclusion_score_process.sql and the PHP twin is
 * examples/php-score-retrieval/. The three must produce identical numbers on
 * the shared example data.
 */

export interface ConclusionNode {
  id: string;
  statement: string;
}

export type ReasonSide = "agree" | "disagree";

export interface ReasonEdge {
  parentId: string;
  childId: string;
  side: ReasonSide;
  /** Votes in this edge's linkage sub-debate. Omit (or 0/0) when undebated. */
  linkageAgree?: number;
  linkageDisagree?: number;
}

export interface EdgeContribution {
  childId: string;
  side: ReasonSide;
  childScore: number;
  linkageScore: number;
  /** childScore × linkageScore, before the sub-argument multiplier. */
  contribution: number;
}

export interface ConclusionScoreBreakdown {
  nodeId: string;
  agreeCount: number;
  disagreeCount: number;
  /** agreeCount − disagreeCount: one point per listed reason. */
  rawScore: number;
  /** Σ childScore·linkage over agree edges, before the multiplier. */
  agreeSubTotal: number;
  disagreeSubTotal: number;
  multiplier: number;
  /** rawScore + multiplier·(agreeSubTotal − disagreeSubTotal) */
  score: number;
  contributions: EdgeContribution[];
}

/** The workbook's Index!O1 cell. */
export const DEFAULT_SUB_ARGUMENT_MULTIPLIER = 0.7;

/** The workbook's per-sheet formulas, which predate Index!O1. */
export const LEGACY_SUB_ARGUMENT_MULTIPLIER = 1.0;

/**
 * (agree − disagree) / (agree + disagree), the workbook's linkage formula.
 * An undebated linkage returns `fallback` (1: assume the reason is on topic
 * until someone argues otherwise).
 */
export function linkageRatio(
  agree: number,
  disagree: number,
  fallback = 1
): number {
  const total = agree + disagree;
  if (total <= 0) return fallback;
  return (agree - disagree) / total;
}

export interface ConclusionScoreOptions {
  multiplier?: number;
}

/**
 * Score every node reachable through `edges`. Returns a breakdown per node so
 * a page can show the full derivation, not just the total.
 *
 * Cycles: a reason found supporting its own ancestry contributes 0 through
 * that back-edge, so a ring of claims can never amplify itself — each member
 * keeps only the structural one-point counts of its listed reasons. Each node
 * is evaluated as its own root (results computed under a cycle cut are not
 * reused), which keeps every node's score independent of evaluation order.
 */
export function computeConclusionScores(
  nodes: ConclusionNode[],
  edges: ReasonEdge[],
  options: ConclusionScoreOptions = {}
): Map<string, ConclusionScoreBreakdown> {
  const multiplier = options.multiplier ?? DEFAULT_SUB_ARGUMENT_MULTIPLIER;
  const childrenOf = new Map<string, ReasonEdge[]>();
  for (const edge of edges) {
    const list = childrenOf.get(edge.parentId);
    if (list) list.push(edge);
    else childrenOf.set(edge.parentId, [edge]);
  }

  const clean = new Map<string, ConclusionScoreBreakdown>();

  const evaluate = (
    nodeId: string,
    stack: Set<string>
  ): { score: number; tainted: boolean; breakdown: ConclusionScoreBreakdown } | { score: 0; tainted: true; breakdown: null } => {
    const cached = clean.get(nodeId);
    if (cached) return { score: cached.score, tainted: false, breakdown: cached };
    if (stack.has(nodeId)) return { score: 0, tainted: true, breakdown: null };
    stack.add(nodeId);

    let agreeCount = 0;
    let disagreeCount = 0;
    let agreeSubTotal = 0;
    let disagreeSubTotal = 0;
    let tainted = false;
    const contributions: EdgeContribution[] = [];

    for (const edge of childrenOf.get(nodeId) ?? []) {
      const linkageScore = linkageRatio(
        edge.linkageAgree ?? 0,
        edge.linkageDisagree ?? 0
      );
      const child = evaluate(edge.childId, stack);
      tainted = tainted || child.tainted;
      const contribution = child.score * linkageScore;
      contributions.push({
        childId: edge.childId,
        side: edge.side,
        childScore: child.score,
        linkageScore,
        contribution,
      });
      if (edge.side === "agree") {
        agreeCount += 1;
        agreeSubTotal += contribution;
      } else {
        disagreeCount += 1;
        disagreeSubTotal += contribution;
      }
    }

    stack.delete(nodeId);
    const rawScore = agreeCount - disagreeCount;
    const score = rawScore + multiplier * (agreeSubTotal - disagreeSubTotal);
    const breakdown: ConclusionScoreBreakdown = {
      nodeId,
      agreeCount,
      disagreeCount,
      rawScore,
      agreeSubTotal,
      disagreeSubTotal,
      multiplier,
      score,
      contributions,
    };
    if (!tainted) clean.set(nodeId, breakdown);
    return { score, tainted, breakdown };
  };

  const results = new Map<string, ConclusionScoreBreakdown>();
  const roots = new Set<string>([
    ...nodes.map((n) => n.id),
    ...edges.flatMap((e) => [e.parentId, e.childId]),
  ]);
  for (const rootId of roots) {
    const result = evaluate(rootId, new Set());
    if (result.breakdown) results.set(rootId, result.breakdown);
  }
  return results;
}

/** Convenience wrapper when only one conclusion's breakdown is needed. */
export function computeConclusionScore(
  nodeId: string,
  nodes: ConclusionNode[],
  edges: ReasonEdge[],
  options: ConclusionScoreOptions = {}
): ConclusionScoreBreakdown {
  const all = computeConclusionScores(nodes, edges, options);
  const found = all.get(nodeId);
  if (found) return found;
  const multiplier = options.multiplier ?? DEFAULT_SUB_ARGUMENT_MULTIPLIER;
  return {
    nodeId,
    agreeCount: 0,
    disagreeCount: 0,
    rawScore: 0,
    agreeSubTotal: 0,
    disagreeSubTotal: 0,
    multiplier,
    score: 0,
    contributions: [],
  };
}
