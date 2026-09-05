import { describe, it, expect } from "vitest";
import {
  computeConclusionScore,
  computeConclusionScores,
  linkageRatio,
  DEFAULT_SUB_ARGUMENT_MULTIPLIER,
  LEGACY_SUB_ARGUMENT_MULTIPLIER,
  type ConclusionNode,
  type ReasonEdge,
} from "@/lib/conclusion-score";

const node = (id: number, statement = `node ${id}`): ConclusionNode => ({
  id: String(id),
  statement,
});

const edge = (
  parent: number,
  child: number,
  side: "agree" | "disagree",
  linkageAgree = 0,
  linkageDisagree = 0
): ReasonEdge => ({
  parentId: String(parent),
  childId: String(child),
  side,
  linkageAgree,
  linkageDisagree,
});

// The belief-46 subtree from the founding workbook ("Mormons should not be
// afraid of investigating the truth about their religion"), text-only reasons
// normalized to leaf nodes 301+. At m = 1 the scores must equal the cached
// values in the original spreadsheet.
const churchNodes = [46, 47, 48, 296, 297, 45, 30, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311].map((id) => node(id));
const churchEdges: ReasonEdge[] = [
  edge(46, 47, "agree"),
  edge(46, 48, "agree"),
  edge(46, 296, "agree"),
  edge(46, 297, "agree"),
  edge(47, 45, "agree"),
  edge(47, 301, "agree"),
  edge(48, 302, "agree"),
  edge(48, 303, "agree"),
  edge(296, 304, "agree"),
  edge(297, 305, "agree"),
  edge(45, 30, "agree"),
  edge(45, 48, "agree"),
  edge(45, 306, "agree"),
  edge(45, 307, "agree"),
  edge(45, 308, "disagree"),
  edge(30, 309, "agree"),
  edge(30, 310, "agree"),
  edge(30, 311, "disagree"),
];

// The synthetic street-trees example: exercises linkage ratios and the
// multiplier. Shared verbatim with the SQL seed and the PHP demo.
const treeNodes = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => node(id));
const treeEdges: ReasonEdge[] = [
  edge(1, 2, "agree", 4, 0), // linkage (4-0)/(4+0) = 1.0
  edge(1, 3, "agree", 3, 1), // linkage (3-1)/(3+1) = 0.5
  edge(1, 4, "disagree", 3, 1),
  edge(2, 5, "agree"),
  edge(2, 6, "agree"),
  edge(3, 7, "agree"),
  edge(3, 8, "disagree"),
  edge(4, 9, "agree"),
];

describe("linkageRatio", () => {
  it("is (agree - disagree) / (agree + disagree)", () => {
    expect(linkageRatio(4, 0)).toBe(1);
    expect(linkageRatio(3, 1)).toBe(0.5);
    expect(linkageRatio(2, 2)).toBe(0);
    expect(linkageRatio(0, 4)).toBe(-1);
  });

  it("falls back to 1 when the linkage is undebated", () => {
    expect(linkageRatio(0, 0)).toBe(1);
    expect(linkageRatio(0, 0, 0.5)).toBe(0.5);
  });
});

describe("computeConclusionScores on the founding workbook subtree", () => {
  it("reproduces the original spreadsheet's cached scores at m = 1", () => {
    const scores = computeConclusionScores(churchNodes, churchEdges, {
      multiplier: LEGACY_SUB_ARGUMENT_MULTIPLIER,
    });
    const expected: Record<number, number> = {
      30: 1,
      48: 2,
      296: 1,
      297: 1,
      45: 6,
      47: 8,
      46: 16,
    };
    for (const [id, want] of Object.entries(expected)) {
      expect(scores.get(id)?.score, `node ${id}`).toBeCloseTo(want, 10);
    }
  });

  it("attenuates deep chains with the workbook's Index!O1 multiplier", () => {
    const scores = computeConclusionScores(churchNodes, churchEdges, {
      multiplier: 0.7,
    });
    // 45: 4 - 1 + 0.7·(1 + 2) = 5.1
    expect(scores.get("45")?.score).toBeCloseTo(5.1, 10);
    // 47: 2 + 0.7·5.1 = 5.57
    expect(scores.get("47")?.score).toBeCloseTo(5.57, 10);
    // 46: 4 + 0.7·(5.57 + 2 + 1 + 1) = 10.699
    expect(scores.get("46")?.score).toBeCloseTo(10.699, 10);
  });

  it("defaults to the Index!O1 multiplier", () => {
    expect(DEFAULT_SUB_ARGUMENT_MULTIPLIER).toBe(0.7);
    const breakdown = computeConclusionScore("46", churchNodes, churchEdges);
    expect(breakdown.multiplier).toBe(0.7);
    expect(breakdown.score).toBeCloseTo(10.699, 10);
  });

  it("gives a leaf reason a zero score but a one-point count upstream", () => {
    const scores = computeConclusionScores(churchNodes, churchEdges, {
      multiplier: 1,
    });
    expect(scores.get("302")?.score).toBe(0);
    const parent = scores.get("48");
    expect(parent?.agreeCount).toBe(2);
    expect(parent?.score).toBe(2);
  });
});

describe("computeConclusionScores on the street-trees example", () => {
  it("weights each sub-score by its linkage ratio", () => {
    const scores = computeConclusionScores(treeNodes, treeEdges, {
      multiplier: 0.7,
    });
    // 2: two leaf reasons, no disagreement -> 2
    expect(scores.get("2")?.score).toBe(2);
    // 3: 1 - 1 = 0; 4: 1
    expect(scores.get("3")?.score).toBe(0);
    expect(scores.get("4")?.score).toBe(1);
    // 1: (2 - 1) + 0.7·(2·1.0 + 0·0.5 − 1·0.5) = 2.05
    expect(scores.get("1")?.score).toBeCloseTo(2.05, 10);
  });

  it("matches the hand calculation at m = 1", () => {
    const breakdown = computeConclusionScore("1", treeNodes, treeEdges, {
      multiplier: 1,
    });
    expect(breakdown.rawScore).toBe(1);
    expect(breakdown.agreeSubTotal).toBeCloseTo(2, 10);
    expect(breakdown.disagreeSubTotal).toBeCloseTo(0.5, 10);
    expect(breakdown.score).toBeCloseTo(2.5, 10);
  });

  it("exposes per-edge contributions for the derivation table", () => {
    const breakdown = computeConclusionScore("1", treeNodes, treeEdges, {
      multiplier: 0.7,
    });
    const byChild = new Map(breakdown.contributions.map((c) => [c.childId, c]));
    expect(byChild.get("2")).toMatchObject({
      side: "agree",
      childScore: 2,
      linkageScore: 1,
      contribution: 2,
    });
    expect(byChild.get("3")).toMatchObject({
      side: "agree",
      childScore: 0,
      linkageScore: 0.5,
      contribution: 0,
    });
    expect(byChild.get("4")).toMatchObject({
      side: "disagree",
      childScore: 1,
      linkageScore: 0.5,
      contribution: 0.5,
    });
  });
});

describe("edge cases", () => {
  it("scores an isolated node 0 with an empty breakdown", () => {
    const breakdown = computeConclusionScore("99", [node(99)], []);
    expect(breakdown.score).toBe(0);
    expect(breakdown.contributions).toHaveLength(0);
  });

  it("returns a zero breakdown for an unknown node", () => {
    const breakdown = computeConclusionScore("404", [], []);
    expect(breakdown.score).toBe(0);
  });

  it("a cycle keeps its structural counts but cannot amplify itself", () => {
    const nodes = [node(1), node(2)];
    const edges = [edge(1, 2, "agree"), edge(2, 1, "agree")];
    const scores = computeConclusionScores(nodes, edges, { multiplier: 1 });
    // Each node sees one listed reason (+1) plus that reason's own one-point
    // count, once — the back-edge is cut, so the ring never compounds, and
    // both members score identically regardless of evaluation order.
    expect(scores.get("1")?.score).toBe(2);
    expect(scores.get("2")?.score).toBe(2);
  });

  it("negative linkage lets a true-but-backfiring reason subtract", () => {
    // A reason whose linkage debate concluded it actually undermines the
    // conclusion it was filed under.
    const nodes = [node(1), node(2), node(3)];
    const edges = [
      edge(1, 2, "agree", 0, 4), // linkage -1
      edge(2, 3, "agree"),
    ];
    const scores = computeConclusionScores(nodes, edges, { multiplier: 1 });
    // node 2 scores 1; its contribution to 1 is 1·(-1) = -1 -> 1 + (-1) = 0
    expect(scores.get("1")?.score).toBe(0);
  });
});
