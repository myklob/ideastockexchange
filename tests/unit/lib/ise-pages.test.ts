import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEFAULT_CONSTANTS,
  IseScorer,
  classifyDispute,
  meetsCompletenessGate,
  questionOf,
  renderQuestion,
  scoreAllPages,
  scoreBeliefPage,
  summarizeCostBenefit,
  trimClosingPeriod,
  type IseDataset,
} from "@/lib/ise-pages";

const dataset: IseDataset = JSON.parse(
  readFileSync(resolve(__dirname, "../../../examples/ise-zoning/ise-zoning.json"), "utf8")
);

const ZONING = 1;

// Every page of the zoning example, as examples/ise-zoning/score_reference.py
// computes it: [truth, belief] and, for media pages, impact. The workbook, the
// Python reference and this engine are three implementations of one set of
// rules; these numbers are the contract between them. A change here means the
// rules changed, not that an implementation drifted.
const EXPECTED: Record<number, number[]> = {
  1: [0.5045045045, 0.5366014739],
  2: [0.5714285714, 0.5],
  3: [0.5833333333, 0.5],
  4: [0.5454545455, 0.25],
  5: [0.5, 0.0],
  6: [0.5, 0.0],
  7: [0.4166666667, -0.5],
  8: [0.5, 0.0],
  9: [0.5454545455, 0.25],
  10: [0.5, 0.0],
  11: [0.625, 0.625],
  12: [0.5555555556, 0.25],
  13: [0.5, 0.0],
  14: [0.4444444444, -0.25],
  15: [0.5, 0.5],
  16: [0.375, -0.5],
  17: [0.5, 0.0],
  18: [0.5, 0.0],
  19: [0.5555555556, 0.25],
  20: [0.5714285714, 0.25],
  21: [0.4444444444, -0.25],
  22: [0.375, -0.5],
  23: [0.375, -0.5],
  24: [0.625, 0.5],
  25: [0.5, 0.0],
  26: [0.6, 0.5],
  27: [0.5045045045, 0.0227272727],
  28: [0.5, 0.0],
  29: [0.5, 0.0],
  30: [0.4925373134, -0.0227272727],
  31: [0.5, 0.0],
  32: [0.5, 0.0],
  33: [0.5, 0.0],
  34: [0.5, 0.0],
  35: [0.4285714286, -0.25],
  36: [0.5, 0.0],
  37: [0.5714285714, 0.25],
  38: [0.5714285714, 0.25],
  39: [0.5, 0.0],
  40: [0.5714285714, 0.25],
  41: [0.5, 0.0],
  42: [0.5, 0.0],
  43: [0.5714285714, 0.25],
  44: [0.5, 0.0],
  45: [0.5, 0.0],
  46: [0.5, 0.0],
  47: [0.5, 0.0],
  48: [0.5, 0.0],
  49: [0.5, 0.0],
  50: [0.5, 0.0],
  51: [0.5, 0.0],
  52: [0.5, 0.0],
  53: [0.5, 0.0],
  54: [0.5714285714, 0.25],
  55: [0.42, -0.2857142857],
  56: [0.5714285714, 0.25, 0.5714285714],
  57: [0.5, 0.0, 0.5],
  58: [0.5714285714, 0.25, 0.5],
  59: [0.5, 0.0],
  60: [0.5, 0.0],
  61: [0.5, 0.0],
  62: [0.5, 0.0],
  63: [0.5, 0.0],
  64: [0.5, 0.0],
  65: [0.6, 0.25],
  66: [0.5, 0.0],
  67: [0.6, 0.25],
  68: [0.5, 0.0],
  69: [0.5, 0.0],
  70: [0.5, 0.0],
  71: [0.5, 0.0],
  72: [0.5, 0.0],
  73: [0.5, 0.0],
  74: [0.5, 0.0],
  75: [0.5, 0.0],
  76: [0.625, 0.625],
  77: [0.625, 0.625],
  78: [0.625, 0.625],
  79: [0.625, 0.625],
  80: [0.5, 0.5],
  81: [0.625, 0.625],
  82: [0.625, 0.625],
  83: [0.625, 0.625],
  84: [0.625, 0.625],
  85: [0.625, 0.625],
  86: [0.625, 0.625],
  87: [0.625, 0.625],
  88: [0.625, 0.625],
  89: [0.625, 0.625],
  90: [0.5, 0.5],
  91: [0.625, 0.625],
  92: [0.5, 0.5],
  93: [0.625, 0.625],
  94: [0.625, 0.625],
  95: [0.5, 0.5],
  96: [0.5, 0.0],
  97: [0.5, 0.0],
  98: [0.5714285714, 0.25],
  99: [0.5714285714, 0.25],
  100: [0.5, 0.0],
  101: [0.4285714286, -0.25],
  102: [0.5, 0.0],
  103: [0.4285714286, -0.25],
  104: [0.5, 0.0],
  105: [0.5, 0.0],
  106: [0.5714285714, 0.25],
  107: [0.5, 0.0],
  108: [0.5714285714, 0.25],
  109: [0.5, 0.0],
  110: [0.4285714286, -0.25],
  111: [0.5714285714, 0.25],
  112: [0.5, 0.0],
  113: [0.5, 0.0],
  114: [0.5, 0.0],
  115: [0.5, 0.0],
  116: [0.5, 0.0],
  117: [0.5, 0.0],
  118: [0.5, 0.0],
  119: [0.5714285714, 0.25],
  120: [0.5, 0.0],
  121: [0.5, 0.0],
  122: [0.5, 0.0],
  123: [0.5714285714, 0.25],
  124: [0.5, 0.0],
  125: [0.5, 0.0],
  126: [0.5, 0.0],
  127: [0.4285714286, -0.25],
  128: [0.5714285714, 0.25],
  129: [0.625, 0.625],
  130: [0.625, 0.625],
  131: [0.5, 0.5],};

describe("the zoning example scores identically in every implementation", () => {
  const scores = scoreAllPages(dataset);

  it("covers all 131 pages", () => {
    expect(scores.size).toBe(131);
    expect(Object.keys(EXPECTED)).toHaveLength(131);
  });

  it("reproduces the reference truth and belief score of every page", () => {
    for (const [id, expected] of Object.entries(EXPECTED)) {
      const score = scores.get(Number(id));
      expect(score, `page ${id}`).toBeDefined();
      expect(score!.truth, `page ${id} truth`).toBeCloseTo(expected[0], 9);
      expect(score!.belief, `page ${id} belief`).toBeCloseTo(expected[1], 9);
      if (expected.length > 2) {
        expect(score!.impact, `page ${id} impact`).toBeCloseTo(expected[2], 9);
      } else {
        expect(score!.impact, `page ${id} impact`).toBeNull();
      }
    }
  });
});

describe("the scoring rules", () => {
  const scorer = new IseScorer(dataset);

  it("multiplies Truth x Link x Imp x Uniq on a reason", () => {
    const row = scorer.rows(ZONING, "argument", "agree")[0];
    const expected =
      scorer.truth(row.claim_id!) *
      scorer.truth(row.link_id!) *
      scorer.truth(row.imp_id!) *
      DEFAULT_CONSTANTS.DEFUNIQ;
    expect(scorer.rowScore(row)).toBeCloseTo(expected, 12);
  });

  it("reads a labelled constant wherever a row has no page", () => {
    expect(scorer.rowScore({ page_id: ZONING, section: "argument", position: 99 })).toBeCloseTo(
      DEFAULT_CONSTANTS.UNARG * DEFAULT_CONSTANTS.DEFLINK * DEFAULT_CONSTANTS.DEFIMP * DEFAULT_CONSTANTS.DEFUNIQ,
      12
    );
  });

  it("opens an unargued page at 0.5 rather than at certainty", () => {
    const bare: IseDataset = { pages: [{ id: 1, kind: "claim", text: "Nobody has argued this." }], edges: [] };
    expect(new IseScorer(bare).truth(1)).toBe(0.5);
  });

  it("moves one unrebutted reason part of the way, not all the way", () => {
    const one: IseDataset = {
      pages: [
        { id: 1, kind: "claim", text: "Parent." },
        { id: 2, kind: "claim", text: "One reason nobody has answered." },
      ],
      edges: [{ page_id: 1, section: "argument", side: "agree", position: 1, claim_id: 2, uniq_id: null }],
    };
    // Truth 0.5 x Link 1 x Imp 0.5 x Uniq 1 = 0.25 of a point, so (0.25 + 0.5) / (0.25 + 1).
    expect(new IseScorer(one).truth(1)).toBeCloseTo(0.6, 12);
  });

  it("gives a pending prediction no weight either way", () => {
    const pending: IseDataset = {
      pages: [
        { id: 1, kind: "belief", text: "Parent." },
        { id: 2, kind: "claim", text: "Not yet observed." },
      ],
      edges: [{ page_id: 1, section: "prediction", side: "agree", position: 1, claim_id: 2 }],
    };
    const scored = new IseScorer(pending);
    expect(scored.evaluate(1).pred).toBe(0);
    expect(scored.truth(1)).toBe(0.5);
  });

  it("caps a page at its weakest load-bearing component", () => {
    const card = scoreBeliefPage(scorer, ZONING);
    expect(card.truthArgued).toBeGreaterThan(card.truth);
    expect(card.truth).toBeCloseTo(card.weakestLoadBearing!, 12);
  });

  it("does not cap on a component that has no page of its own", () => {
    const uncapped: IseDataset = {
      pages: [{ id: 1, kind: "belief", text: "Parent." }],
      edges: [
        { page_id: 1, section: "argument", side: "agree", position: 1, text: "A reason with no page." },
        { page_id: 1, section: "component", position: 1, text: "A part nobody has argued.", attrs: { lb: "Y" } },
      ],
    };
    const card = scoreBeliefPage(new IseScorer(uncapped), 1);
    expect(card.weakestLoadBearing).toBeNull();
    expect(card.truth).toBeCloseTo(card.truthArgued, 12);
  });

  it("takes an importance page as the largest validity x bears", () => {
    const rows = scorer.rows(11, "interest_listing").filter((e) => e.claim_id);
    const effective = rows.map((e) => scorer.truth(e.claim_id!) * (e.bearing_id ? scorer.truth(e.bearing_id) : 1));
    expect(scorer.truth(11)).toBeCloseTo(Math.max(...effective), 12);
  });

  it("scores a media page's quality and impact separately", () => {
    const media = scorer.evaluate(58);
    expect(media.truth).toBeCloseTo(0.5714285714, 9);
    expect(media.impact).toBeCloseTo(0.5, 9);
  });

  it("cannot be amplified by a page that names itself as a reason", () => {
    const ring: IseDataset = {
      pages: [
        { id: 1, kind: "claim", text: "A." },
        { id: 2, kind: "claim", text: "B." },
      ],
      edges: [
        { page_id: 1, section: "argument", side: "agree", position: 1, claim_id: 2 },
        { page_id: 2, section: "argument", side: "agree", position: 1, claim_id: 1 },
      ],
    };
    // The back edge reads the neutral constant instead of recursing, and a
    // score computed under that cut is not cached, so both members of the ring
    // read the same whichever one is scored first.
    const scored = new IseScorer(ring);
    expect(scored.truth(1)).toBeCloseTo(0.6153846154, 9);
    expect(scored.truth(2)).toBeCloseTo(0.6153846154, 9);
    const reversed = new IseScorer(ring);
    expect(reversed.truth(2)).toBeCloseTo(scored.truth(2), 12);
  });
});

describe("the zoning belief page's scorecard", () => {
  const scorer = new IseScorer(dataset);
  const card = scoreBeliefPage(scorer, ZONING);

  it("adds the three lines into the belief score", () => {
    expect(card.argumentScore + card.evidenceScore + card.pred).toBeCloseTo(card.belief, 12);
  });

  it("counts four scored reasons a side and a two-sided evidence ledger", () => {
    expect(card.counts.reasonsAgree).toBe(4);
    expect(card.counts.reasonsDisagree).toBe(4);
    expect(card.counts.evidenceSupporting).toBe(4);
    expect(card.counts.evidenceWeakening).toBe(2);
    expect(card.counts.predictions).toBe(8);
    expect(card.meetsCompletenessGate).toBe(true);
  });

  it("reports how many scored rows still rest on a presumed constant", () => {
    expect(card.presumptions.noLinkagePage).toBe(0);
    expect(card.presumptions.noImportancePage).toBe(0);
    expect(card.presumptions.noUniquenessPage).toBe(card.counts.scoredRows - 1);
  });

  it("refuses a single net when the cost-benefit units differ", () => {
    expect(card.costBenefit.mixedUnits).toBe(true);
    expect(card.costBenefit.net).toBeNull();
    expect(card.costBenefit.ratio).toBeNull();
    expect(card.costBenefit.categories).toHaveLength(6);
    for (const category of card.costBenefit.categories) {
      expect(category.net).toBeCloseTo(category.benefit - category.cost, 12);
    }
  });

  it("nets within one unit when only one is in play", () => {
    const single: IseDataset = {
      pages: [
        { id: 1, kind: "belief", text: "Parent." },
        { id: 2, kind: "claim", text: "A benefit." },
        { id: 3, kind: "claim", text: "A cost." },
      ],
      edges: [
        { page_id: 1, section: "cba", side: "agree", position: 1, claim_id: 2, category: "dollars", magnitude: 100 },
        { page_id: 1, section: "cba", side: "disagree", position: 1, claim_id: 3, category: "dollars", magnitude: 40 },
        { page_id: 1, section: "category", position: 1, text: "dollars" },
      ],
    };
    const summary = summarizeCostBenefit(new IseScorer(single), 1);
    expect(summary.mixedUnits).toBe(false);
    expect(summary.benefitTotal).toBeCloseTo(50, 12);
    expect(summary.costTotal).toBeCloseTo(20, 12);
    expect(summary.net).toBeCloseTo(30, 12);
    expect(summary.ratio).toBeCloseTo(2.5, 12);
  });

  it("names the pages it reads and which of them are one-sided", () => {
    expect(card.pagesRead.length).toBe(128);
    expect(card.pagesFailingGate.every((id) => !meetsCompletenessGate(scorer, id))).toBe(true);
    expect(card.pagesFailingGate.length).toBeLessThan(card.pagesRead.length);
  });

  it("reports what is still at stake in pending predictions", () => {
    expect(card.pointsAtStake).toBeGreaterThan(0);
    expect(card.falsifiabilityIndex).toBeGreaterThan(0);
    expect(card.falsifiabilityIndex).toBeLessThanOrEqual(1);
  });
});

describe("classifying the dispute", () => {
  it("says nothing until something is scored", () => {
    expect(classifyDispute(0, 0, 0, null)).toBeNull();
  });

  it("calls two-sided evidence a factual dispute", () => {
    expect(classifyDispute(4, 0.9, 0.1, 0)).toBe("Factual dispute");
  });

  it("calls reasons whose relevance is contested a linkage dispute", () => {
    expect(classifyDispute(4, 0.1, 0.8, 0)).toBe("Linkage dispute");
  });

  it("calls a wide value-ranking gap a values conflict", () => {
    expect(classifyDispute(4, 0.1, 0.1, 3)).toBe("Values conflict");
  });

  it("reads as mixed when no indicator leads the others by 0.1", () => {
    expect(classifyDispute(4, 0.5, 0.5, 1.5)).toBe("Mixed dispute");
  });
});

describe("the question of a formula-built page", () => {
  const scorer = new IseScorer(dataset);

  it("assembles a linkage question from the two pages it connects", () => {
    const page = scorer.pages.get(14)!;
    const question = questionOf(page, scorer.pages);
    expect(question).toContain("If it were true that:");
    expect(question).toContain("it would significantly weaken the conclusion that:");
    expect(question).toContain("Ending single-family-only zoning lowers housing costs in the cities that do it");
  });

  it("asks whether a prediction were observed, not whether it were true", () => {
    const observed = renderQuestion(
      { id: 9, kind: "linkage", type: "Prediction", direction: "Supports" },
      { x: "Rents fall in reformed metros.", y: "The reform works." }
    );
    expect(observed).toContain("If it were observed that:");
  });

  it("asks an interest linkage whether the row matters to the need", () => {
    const bearing = renderQuestion(
      { id: 9, kind: "linkage", type: "Interest" },
      { x: "Permits rose.", y: "Renters need housing prices they can afford." }
    );
    expect(bearing).toContain("it would matter to the interest:");
  });

  it("renders importance, uniqueness, equivalence and driver questions", () => {
    expect(
      renderQuestion({ id: 9, kind: "importance", rowkind: "reason to agree" }, { x: "A reason.", y: "A belief." })
    ).toContain("addresses the most important interest at stake in the belief:");
    expect(renderQuestion({ id: 9, kind: "uniqueness" }, { x: "A.", y: "B." })).toContain(
      "makes a different point from:"
    );
    expect(renderQuestion({ id: 9, kind: "equivalence" }, { x: "A.", y: "B." })).toContain(
      "makes the same claim as:"
    );
    expect(
      renderQuestion({ id: 9, kind: "driver", direction: "Opposition" }, { x: "An interest.", y: "A belief." })
    ).toContain("is what actually drives opposition to the belief that:");
  });

  it("says what is missing until both ends are named", () => {
    expect(renderQuestion({ id: 9, kind: "linkage" }, { x: "Only one end." })).toContain(
      "the question writes itself"
    );
  });

  it("drops a closing period but keeps one that belongs to an initial", () => {
    expect(trimClosingPeriod("Rents fell.")).toBe("Rents fell");
    expect(trimClosingPeriod("A paper by J.")).toBe("A paper by J.");
    expect(trimClosingPeriod("No period here")).toBe("No period here");
  });
});
