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

// The argument tree of the worked zoning example (examples/ise-zoning/):
// the belief z1 with four reasons a side, each with its own sub-reasons, and
// the real linkage sub-debates from that example's linkage pages on the eight
// root edges. Shared verbatim with the SQL seed and the PHP demo.
const zoningNodes: ConclusionNode[] = [
  { id: "z1", statement: "Ending single-family-only zoning lowers housing costs in the cities that do it." },
  { id: "z2", statement: "Where cities have allowed more homes per lot, permits rose and rents grew more slowly than in comparable cities that did not." },
  { id: "z3", statement: "Zoning that caps homes per lot is the binding constraint on supply in high-cost metros." },
  { id: "z4", statement: "New market-rate homes lower rents in nearby existing buildings by pulling higher-income renters out of older housing." },
  { id: "z5", statement: "Allowing duplexes and small apartments on single-family lots adds homes without public subsidy." },
  { id: "z6", statement: "Upzoning alone produces few homes where land is expensive and construction costs are high." },
  { id: "z7", statement: "Allowing more units raises land values, which can raise the price of existing homes and displace lower-income residents." },
  { id: "z8", statement: "Neighborhood character, parking, school crowding and infrastructure capacity are real costs that fall on existing residents." },
  { id: "z9", statement: "Rents in Minneapolis and Austin also fell because of a building boom financed by cheap money in 2021-2022." },
  { id: "z21", statement: "Auckland's 2016 upzoning was followed by a permit surge concentrated in the upzoned areas." },
  { id: "z22", statement: "Minneapolis diverged from the rest of Minnesota on both permits and rents after 2019." },
  { id: "z23", statement: "The pattern repeats across cities with different demand conditions." },
  { id: "z24", statement: "The comparison cities differ in demand growth and land availability." },
  { id: "z25", statement: "Minneapolis also loosened rules on large apartment buildings along corridors." },
  { id: "z31", statement: "In the most regulated metros the price of a home exceeds its construction cost by a large regulatory premium." },
  { id: "z32", statement: "Metros that allow building absorbed large demand booms with prices near construction cost." },
  { id: "z33", statement: "Where lots allow only one home, the land price per home is the whole lot." },
  { id: "z34", statement: "Construction costs and financing, not zoning, are the binding constraint in many cities." },
  { id: "z35", statement: "In cities with weak demand, upzoning changes nothing because nobody wants to build." },
  { id: "z41", statement: "Studies of new buildings in several cities find rents in nearby existing buildings fall relative to controls." },
  { id: "z42", statement: "Each new unit starts a chain of moves that reaches lower-income neighborhoods within a few steps." },
  { id: "z43", statement: "New buildings can raise nearby rents through amenity effects." },
  { id: "z44", statement: "The effects are local and small; they do not add up to citywide affordability." },
  { id: "z51", statement: "Subsidized affordable units cost several hundred thousand dollars each in high-cost states." },
  { id: "z52", statement: "Private capital builds the homes, so the tool scales with demand rather than with the budget." },
  { id: "z53", statement: "Cheap for the city is not cheap for tenants displaced by redevelopment." },
  { id: "z54", statement: "Without subsidy, new units reach low-income households only slowly through filtering." },
  { id: "z61", statement: "SB 9 produced a few hundred applications statewide in its first year." },
  { id: "z62", statement: "Small projects on single lots cannot spread fixed costs, so most did not pencil out at 2022-2024 rates." },
  { id: "z63", statement: "Where land is expensive, the existing house is worth more than the redevelopment margin." },
  { id: "z64", statement: "Slow uptake in the first years is typical of zoning changes." },
  { id: "z65", statement: "SB 9 carried restrictions that other reforms avoid, so it tests a weak version of the reform." },
  { id: "z66", statement: "Oregon's and Minneapolis's reforms produced steady middle-housing permits within two years." },
  { id: "z71", statement: "Upzoning raises the value of land because the land can now hold more homes." },
  { id: "z72", statement: "Redevelopment of older rental buildings evicts the tenants in them." },
  { id: "z73", statement: "Studies of new construction find it lowers displacement risk for nearby low-income renters." },
  { id: "z74", statement: "A higher land value is a gain to the existing owner, not a cost to them." },
  { id: "z75", statement: "Displacement is worst where nothing gets built and rents rise across the board." },
  { id: "z81", statement: "Street parking gets scarcer when parking minimums are dropped." },
  { id: "z82", statement: "Fast-growing districts see school crowding before new schools are funded." },
  { id: "z83", statement: "Residents chose a neighborhood with a particular form and did not consent to its change." },
  { id: "z84", statement: "Most older neighborhoods have lost population since 1970, so their schools and pipes have spare capacity." },
  { id: "z85", statement: "New residents pay taxes that fund the infrastructure they use; infill is cheaper to serve than sprawl." },
  { id: "z91", statement: "Austin's record permits were financed at 3 percent rates; permits fell by about half in 2024." },
  { id: "z92", statement: "Rents fell across many Sun Belt metros in 2023-2025, including ones that did not reform zoning." },
  { id: "z93", statement: "Minneapolis's rent divergence from the state began before the boom and before the reform took effect." },
  { id: "z94", statement: "Cheap money was national; only the cities that allowed building turned it into supply." },
];

const zoningEdges: ReasonEdge[] = [
  { parentId: "z1", childId: "z2", side: "agree", linkageAgree: 2, linkageDisagree: 1 },
  { parentId: "z1", childId: "z3", side: "agree", linkageAgree: 2, linkageDisagree: 1 },
  { parentId: "z1", childId: "z4", side: "agree", linkageAgree: 1, linkageDisagree: 1 },
  { parentId: "z1", childId: "z5", side: "agree", linkageAgree: 1, linkageDisagree: 2 },
  { parentId: "z1", childId: "z6", side: "disagree", linkageAgree: 1, linkageDisagree: 1 },
  { parentId: "z1", childId: "z7", side: "disagree", linkageAgree: 1, linkageDisagree: 2 },
  { parentId: "z1", childId: "z8", side: "disagree", linkageAgree: 2, linkageDisagree: 3 },
  { parentId: "z1", childId: "z9", side: "disagree", linkageAgree: 1, linkageDisagree: 1 },
  { parentId: "z2", childId: "z21", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z2", childId: "z22", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z2", childId: "z23", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z2", childId: "z24", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z2", childId: "z25", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z3", childId: "z31", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z3", childId: "z32", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z3", childId: "z33", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z3", childId: "z34", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z3", childId: "z35", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z4", childId: "z41", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z4", childId: "z42", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z4", childId: "z43", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z4", childId: "z44", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z5", childId: "z51", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z5", childId: "z52", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z5", childId: "z53", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z5", childId: "z54", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z6", childId: "z61", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z6", childId: "z62", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z6", childId: "z63", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z6", childId: "z64", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z6", childId: "z65", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z6", childId: "z66", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z7", childId: "z71", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z7", childId: "z72", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z7", childId: "z73", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z7", childId: "z74", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z7", childId: "z75", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z8", childId: "z81", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z8", childId: "z82", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z8", childId: "z83", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z8", childId: "z84", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z8", childId: "z85", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z9", childId: "z91", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z9", childId: "z92", side: "agree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z9", childId: "z93", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
  { parentId: "z9", childId: "z94", side: "disagree", linkageAgree: 0, linkageDisagree: 0 },
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

describe("computeConclusionScores on the zoning example", () => {
  it("scores the root from its counts, its children and their linkage", () => {
    const scores = computeConclusionScores(zoningNodes, zoningEdges, {
      multiplier: LEGACY_SUB_ARGUMENT_MULTIPLIER,
    });
    // Four reasons a side cancel, so the root's score is the sub-argument term:
    //   agree    z2 1x0.3333 + z3 1x0.3333 + z4 0x0 + z5 0x(-0.3333) = 0.6667
    //   disagree z6 0x0 + z7 (-1)x(-0.3333) + z8 1x(-0.2) + z9 0x0    = 0.1333
    const expected: Record<string, number> = {
      z1: 0.5333333333333333,
      z2: 1,
      z3: 1,
      z4: 0,
      z5: 0,
      z6: 0,
      z7: -1,
      z8: 1,
      z9: 0,
    };
    for (const [id, want] of Object.entries(expected)) {
      expect(scores.get(id)?.score, `node ${id}`).toBeCloseTo(want, 10);
    }
  });

  it("attenuates the sub-argument term with the workbook's Index!O1 multiplier", () => {
    const scores = computeConclusionScores(zoningNodes, zoningEdges, { multiplier: 0.7 });
    // Only the root carries sub-arguments through an edge, so only it moves.
    expect(scores.get("z1")?.score).toBeCloseTo(0.37333333333333335, 10);
    expect(scores.get("z2")?.score).toBeCloseTo(1, 10);
    expect(scores.get("z7")?.score).toBeCloseTo(-1, 10);
  });

  it("defaults to the Index!O1 multiplier", () => {
    expect(DEFAULT_SUB_ARGUMENT_MULTIPLIER).toBe(0.7);
    const breakdown = computeConclusionScore("z1", zoningNodes, zoningEdges);
    expect(breakdown.multiplier).toBe(0.7);
    expect(breakdown.score).toBeCloseTo(0.37333333333333335, 10);
  });

  it("lets a linkage debate that went against relevance flip an edge's sign", () => {
    const breakdown = computeConclusionScore("z1", zoningNodes, zoningEdges, { multiplier: 1 });
    const byChild = new Map(breakdown.contributions.map((c) => [c.childId, c]));
    // Two agree, three disagree on whether neighborhood costs bear on the
    // belief at all: LS = (2 - 3) / 5 = -0.2, so a disagree reason scoring +1
    // pulls the belief up rather than down.
    expect(byChild.get("z8")).toMatchObject({ side: "disagree", childScore: 1, linkageScore: -0.2 });
    expect(byChild.get("z8")!.contribution).toBeCloseTo(-0.2, 10);
  });

  it("gives a leaf reason a zero score but a one-point count upstream", () => {
    const scores = computeConclusionScores(zoningNodes, zoningEdges, { multiplier: 1 });
    expect(scores.get("z21")?.score).toBe(0);
    const parent = scores.get("z2");
    expect(parent?.agreeCount).toBe(3);
    expect(parent?.disagreeCount).toBe(2);
    expect(parent?.score).toBe(1);
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
