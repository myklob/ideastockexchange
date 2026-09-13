/**
 * The scorecard at the bottom of a belief page, and the readout a topic page
 * pulls from it.
 *
 * Nothing here is typed except the bottom line: every figure is a sum or a
 * product of rows the reader can see, and every truth score in it is read from
 * the page that argues it. The counts matter as much as the score — a +3 from
 * twelve reasons and a +3 from one are different animals, and a row still
 * resting on a presumed constant is a claim nobody has challenged yet.
 */

import { IseScorer, type PageScore } from "./score";
import { type IseEdge } from "./types";

export type DisputeType =
  | "Factual dispute"
  | "Linkage dispute"
  | "Values conflict"
  | "Mixed dispute";

export interface CategoryNet {
  category: string;
  benefit: number;
  cost: number;
  net: number;
}

export interface CostBenefitSummary {
  benefitTotal: number;
  costTotal: number;
  categories: CategoryNet[];
  /** True when more than one unit is in play, in which case there is no single net. */
  mixedUnits: boolean;
  /** Benefits minus costs, null when the units differ. */
  net: number | null;
  /** Benefit over cost, null when the units differ or nothing costs anything. */
  ratio: number | null;
}

export interface BeliefScorecard extends PageScore {
  pageId: number;
  /** pro - con, the argument line. */
  argumentScore: number;
  /** supp - weak, the evidence ledger line. */
  evidenceScore: number;
  /** Everything pulling the belief up, and everything pulling it down. */
  positive: number;
  negative: number;
  /** The truth score before the anatomy cap. */
  truthArgued: number;
  /** The lowest truth among load-bearing components that have a page. */
  weakestLoadBearing: number | null;
  /** The conjunction of the load-bearing truths: reported, never applied. */
  loadBearingProduct: number | null;
  /** Positive / (Positive + Negative), nothing mixed in. Null until something is scored. */
  agreeShare: number | null;
  counts: {
    reasonsAgree: number;
    reasonsDisagree: number;
    evidenceSupporting: number;
    evidenceWeakening: number;
    predictions: number;
    scoredRows: number;
  };
  /** Scored rows still resting on each labelled constant. */
  presumptions: {
    noLinkagePage: number;
    noImportancePage: number;
    noUniquenessPage: number;
  };
  /** Weight still exposed to the world in pending predictions. */
  pointsAtStake: number;
  /** Share of predictions that are diagnostic (Link at least 0.5) and dated. */
  falsifiabilityIndex: number | null;
  costBenefit: CostBenefitSummary;
  /** The weaker evidence side over the stronger: 1 is split down the middle. */
  evidenceTwoSidedness: number;
  /** Share of scored reasons whose linkage page scores below 0.5. */
  linkageLeanShare: number;
  /** Mean gap between the two sides' value rankings. */
  valueGap: number | null;
  disputeType: DisputeType | null;
  /** Strongest compromise x (1 - average obstacle truth). */
  easeOfResolution: number | null;
  /** High when the sides accept the same facts and argue about words or relevance. */
  misunderstandingIndex: number;
  /** At least one scored reason on each side. */
  meetsCompletenessGate: boolean;
  /** Pages whose score is read into a row here, and those that are one-sided or empty. */
  pagesRead: number[];
  pagesFailingGate: number[];
  bottomLine: string | null;
}

const MULTIPLIER_COLUMNS = [
  "claim_id",
  "link_id",
  "imp_id",
  "uniq_id",
  "drives_id",
  "equiv_id",
  "who_id",
  "bearing_id",
] as const;

const SCORED_SECTIONS = ["argument", "evidence", "prediction"] as const;

const isScoredRow = (edge: IseEdge) =>
  (typeof edge.claim_id === "number" && edge.claim_id >= 1) ||
  Boolean(edge.text && edge.text.trim());

const attr = (edge: IseEdge, key: string): unknown =>
  (edge.attrs as Record<string, unknown> | null | undefined)?.[key];

const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/**
 * Whether a page has been argued from both sides. A one-sided page can still
 * score high by the truth formula, so this says whether anyone has tried.
 */
export function meetsCompletenessGate(scorer: IseScorer, pageId: number): boolean {
  const page = scorer.pages.get(pageId);
  if (!page) return false;
  if (page.kind === "importance") {
    return scorer.rows(pageId, "interest_listing").some(isScoredRow);
  }
  const agree = scorer.rows(pageId, "argument", "agree").some(isScoredRow);
  const disagree = scorer.rows(pageId, "argument", "disagree").some(isScoredRow);
  if (page.kind === "interest") {
    return agree && disagree && Boolean(page.if_true) && Boolean(page.if_false);
  }
  return agree && disagree;
}

/** Every page whose score is read into a row on this page. */
export function pagesReadBy(scorer: IseScorer, pageId: number): number[] {
  const seen = new Set<number>();
  for (const edge of scorer.edgesOf(pageId)) {
    for (const column of MULTIPLIER_COLUMNS) {
      const value = edge[column];
      if (typeof value === "number" && value >= 1 && value !== pageId) seen.add(value);
    }
  }
  return [...seen].sort((a, b) => a - b);
}

/** The cost-benefit table: expected value by row, netted only within one unit. */
export function summarizeCostBenefit(scorer: IseScorer, pageId: number): CostBenefitSummary {
  const { UNARG } = scorer.constants;
  const expectedValue = (edge: IseEdge) => {
    const magnitude = num(edge.magnitude);
    if (magnitude === null) return 0;
    const likelihood =
      typeof edge.claim_id === "number" && edge.claim_id >= 1
        ? scorer.truth(edge.claim_id)
        : UNARG;
    return magnitude * likelihood;
  };
  const benefits = scorer.rows(pageId, "cba", "agree");
  const costs = scorer.rows(pageId, "cba", "disagree");
  const benefitTotal = benefits.reduce((sum, e) => sum + expectedValue(e), 0);
  const costTotal = costs.reduce((sum, e) => sum + expectedValue(e), 0);

  // The units listed under the table, each typed once; the sums find their rows.
  const units = scorer
    .rows(pageId, "category")
    .map((e) => (e.text ?? "").trim())
    .filter(Boolean);
  const categories: CategoryNet[] = units.map((category) => {
    const benefit = benefits
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + expectedValue(e), 0);
    const cost = costs
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + expectedValue(e), 0);
    return { category, benefit, cost, net: benefit - cost };
  });

  const mixedUnits = units.length > 1;
  return {
    benefitTotal,
    costTotal,
    categories,
    mixedUnits,
    net: mixedUnits ? null : benefitTotal - costTotal,
    ratio: mixedUnits || costTotal === 0 ? null : benefitTotal / costTotal,
  };
}

/** Everything the bottom of a belief page reports, computed from its rows. */
export function scoreBeliefPage(scorer: IseScorer, pageId: number): BeliefScorecard {
  const { UNARG, DEFLINK } = scorer.constants;
  const page = scorer.pages.get(pageId);
  const score = scorer.evaluate(pageId);

  const args = {
    agree: scorer.rows(pageId, "argument", "agree").filter(isScoredRow),
    disagree: scorer.rows(pageId, "argument", "disagree").filter(isScoredRow),
  };
  const evidence = {
    agree: scorer.rows(pageId, "evidence", "agree").filter(isScoredRow),
    disagree: scorer.rows(pageId, "evidence", "disagree").filter(isScoredRow),
  };
  const predictions = [
    ...scorer.rows(pageId, "prediction", "agree").filter(isScoredRow),
    ...scorer.rows(pageId, "prediction", "disagree").filter(isScoredRow),
  ];

  const predictionScores = [
    ...scorer.rows(pageId, "prediction", "agree").map((e) => scorer.predictionScore(e, 1)),
    ...scorer.rows(pageId, "prediction", "disagree").map((e) => scorer.predictionScore(e, -1)),
  ];
  const predUp = predictionScores.filter((p) => p > 0).reduce((a, b) => a + b, 0);
  const predDown = predictionScores.filter((p) => p < 0).reduce((a, b) => a + b, 0);
  const positive = score.pro + score.supp + predUp;
  const negative = score.con + score.weak - predDown;

  const components = scorer.rows(pageId, "component").filter(
    (e) =>
      typeof e.claim_id === "number" &&
      e.claim_id >= 1 &&
      String(attr(e, "lb") ?? "").toUpperCase() === "Y"
  );
  const loadBearingTruths = components.map((e) => scorer.truth(e.claim_id as number));

  const scoredRows = [
    ...SCORED_SECTIONS.flatMap((section) => scorer.rows(pageId, section)),
  ].filter(isScoredRow);
  const presumptions = {
    noLinkagePage: scoredRows.filter((e) => !e.link_id).length,
    noImportancePage: scoredRows.filter((e) => !e.imp_id).length,
    noUniquenessPage: scoredRows.filter((e) => !e.uniq_id).length,
  };

  const reasons = [...args.agree, ...args.disagree];
  const linkageLeanShare = reasons.length
    ? reasons.filter((e) => (e.link_id ? scorer.truth(e.link_id) : DEFLINK) < 0.5).length /
      reasons.length
    : 0;

  const evidenceTwoSidedness =
    Math.max(score.supp, score.weak) === 0
      ? 0
      : Math.min(score.supp, score.weak) / Math.max(score.supp, score.weak);

  const gaps = scorer
    .rows(pageId, "value")
    .map((e) => {
      const supporter = num(attr(e, "srank"));
      const opponent = num(attr(e, "orank"));
      return supporter === null || opponent === null ? null : Math.abs(supporter - opponent);
    })
    .filter((g): g is number => g !== null);
  const valueGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;

  const compromises = scorer
    .rows(pageId, "compromise")
    .filter(isScoredRow)
    .map((e) =>
      typeof e.claim_id === "number" && e.claim_id >= 1 ? scorer.truth(e.claim_id) : UNARG
    );
  const obstacles = scorer
    .rows(pageId, "obstacle")
    .filter(isScoredRow)
    .map((e) =>
      typeof e.claim_id === "number" && e.claim_id >= 1 ? scorer.truth(e.claim_id) : UNARG
    );
  const easeOfResolution = compromises.length
    ? Math.max(...compromises) *
      (1 - (obstacles.length ? obstacles.reduce((a, b) => a + b, 0) / obstacles.length : 0.5))
    : null;

  const definitionalDispute = scorer
    .rows(pageId, "dispute")
    .some((e) => (e.text ?? "").toLowerCase() === "definitional" && Boolean(attr(e, "what")));

  const pagesRead = pagesReadBy(scorer, pageId);

  const diagnostic = predictions.filter(
    (e) => (e.link_id ? scorer.truth(e.link_id) : DEFLINK) >= 0.5 && Boolean(e.deadline)
  ).length;

  return {
    ...score,
    pageId,
    argumentScore: score.pro - score.con,
    evidenceScore: score.supp - score.weak,
    positive,
    negative,
    truthArgued: score.raw ?? score.truth,
    weakestLoadBearing: loadBearingTruths.length ? Math.min(...loadBearingTruths) : null,
    loadBearingProduct: loadBearingTruths.length
      ? loadBearingTruths.reduce((a, b) => a * b, 1)
      : null,
    agreeShare: positive + negative === 0 ? null : positive / (positive + negative),
    counts: {
      reasonsAgree: args.agree.length,
      reasonsDisagree: args.disagree.length,
      evidenceSupporting: evidence.agree.length,
      evidenceWeakening: evidence.disagree.length,
      predictions: predictions.length,
      scoredRows: scoredRows.length,
    },
    presumptions,
    pointsAtStake: predictions.reduce((sum, e) => sum + scorer.pointsAtStake(e), 0),
    falsifiabilityIndex: predictions.length ? diagnostic / predictions.length : null,
    costBenefit: summarizeCostBenefit(scorer, pageId),
    evidenceTwoSidedness,
    linkageLeanShare,
    valueGap,
    disputeType: classifyDispute(positive + negative, evidenceTwoSidedness, linkageLeanShare, valueGap),
    easeOfResolution,
    misunderstandingIndex: (linkageLeanShare + (definitionalDispute ? 1 : 0)) / 2,
    meetsCompletenessGate: meetsCompletenessGate(scorer, pageId),
    pagesRead,
    pagesFailingGate: pagesRead.filter((id) => !meetsCompletenessGate(scorer, id)),
    bottomLine: page?.bottom_line ?? null,
  };
}

/**
 * What kind of fight this is. The largest of the three indicators wins if it
 * leads both others by at least 0.1; otherwise the dispute reads as mixed.
 * A factual dispute wants more data, a linkage dispute wants the linkage pages
 * settled, and a values conflict wants compromise design, not another study.
 */
export function classifyDispute(
  scoredWeight: number,
  evidenceTwoSidedness: number,
  linkageLeanShare: number,
  valueGap: number | null
): DisputeType | null {
  if (scoredWeight === 0) return null;
  const values = valueGap === null ? 0 : Math.min(1, valueGap / 3);
  const leads = (a: number, b: number, c: number) => a >= b + 0.1 && a >= c + 0.1;
  if (leads(evidenceTwoSidedness, linkageLeanShare, values)) return "Factual dispute";
  if (leads(linkageLeanShare, evidenceTwoSidedness, values)) return "Linkage dispute";
  if (leads(values, evidenceTwoSidedness, linkageLeanShare)) return "Values conflict";
  return "Mixed dispute";
}
