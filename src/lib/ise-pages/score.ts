/**
 * The scorer for the page / edge model.
 *
 * Every number on every page is computed here from two tables, pages and
 * edges; nothing is stored, so no score can go stale. The rules are the ones
 * the zoning workbook implements in formulas and
 * examples/ise-zoning/score_reference.py implements in Python — the three
 * agree by construction, and tests/unit/lib/ise-pages.test.ts pins every one
 * of the example's 131 pages against the reference output.
 *
 *   row score          = Truth x Link x Imp x Uniq
 *   prediction         = sign x (2 x Truth - 1) x Link x Imp x Uniq
 *   page truth (argued)= (POS + k x 0.5) / (POS + NEG + k)
 *   page truth         = min(argued, weakest load-bearing component with a page)
 *   belief score       = POS - NEG, open-ended
 *   importance page    = max over listed interests of Validity x Bears
 *   media page         = quality and impact, each by the page-truth rule
 *
 * A multiplier with no page of its own reads a labelled constant (DEFLINK,
 * DEFIMP, DEFUNIQ) and a row with no page reads UNARG, so an unargued page
 * reads 0.5 rather than certainty. Who wrote a row never enters any formula.
 */

import {
  DEFAULT_CONSTANTS,
  SPECIAL_KINDS,
  type IseConstants,
  type IseDataset,
  type IseEdge,
  type IsePage,
} from "./types";

export interface PageScore {
  /** Total of the agree side of the page's argument table. */
  pro: number;
  con: number;
  /** Evidence ledger totals; 0 on the kinds that have no ledger. */
  supp: number;
  weak: number;
  /** Net prediction contribution; 0 on the kinds that have no predictions. */
  pred: number;
  /** POS - NEG, open-ended. The headline. */
  belief: number;
  /** 0 to 1, after the anatomy cap. What other pages read as a multiplier. */
  truth: number;
  /** The truth score before the cap, or null on kinds that cannot be capped. */
  raw: number | null;
  /** Media pages only: how far the work has shaped what people think. */
  impact: number | null;
}

const isPageRef = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 1;

/**
 * Scores a set of pages and edges.
 *
 * Construction is cheap (it only indexes the edges); every score is computed
 * on first read and memoized. A page that names itself or one of its own
 * ancestors as a row would recurse forever, which the workbook prevents by
 * hand; here such a read returns the unargued constant instead, so a cycle
 * degrades one multiplier rather than hanging the process.
 */
export class IseScorer {
  readonly constants: IseConstants;
  readonly pages: Map<number, IsePage>;
  private readonly edgesByPage: Map<number, IseEdge[]>;
  private readonly memo = new Map<number, PageScore>();
  private readonly evaluating = new Set<number>();
  private cycleCuts = 0;

  constructor(dataset: IseDataset, overrides: Partial<IseConstants> = {}) {
    const named = Object.fromEntries(
      (dataset.constants ?? []).map((c) => [c.name, c.value])
    );
    this.constants = { ...DEFAULT_CONSTANTS, ...named, ...overrides };
    this.pages = new Map(dataset.pages.map((p) => [p.id, p]));
    this.edgesByPage = new Map();
    for (const edge of dataset.edges) {
      const list = this.edgesByPage.get(edge.page_id);
      if (list) list.push(edge);
      else this.edgesByPage.set(edge.page_id, [edge]);
    }
  }

  /** Every edge on a page, in entry order. Display order is by score, never by this. */
  edgesOf(pageId: number): IseEdge[] {
    return this.edgesByPage.get(pageId) ?? [];
  }

  /** The rows of one table on one page. */
  rows(pageId: number, section: string, side?: string): IseEdge[] {
    return this.edgesOf(pageId).filter(
      (e) => e.section === section && (side === undefined || e.side === side)
    );
  }

  /** The truth score of a page: what a row reading this page multiplies by. */
  truth(pageId: number): number {
    return this.evaluate(pageId).truth;
  }

  /** A multiplier: the named page's truth score, or the constant when there is no page. */
  private multiplier(pageId: number | null | undefined, fallback: number): number {
    return isPageRef(pageId) ? this.truth(pageId) : fallback;
  }

  /** (positive + k x 0.5) / (positive + negative + k). */
  private share(pro: number, con: number): number {
    const k = this.constants.K;
    return (pro + k * 0.5) / (pro + con + k);
  }

  /** Truth x Link x Imp x Uniq for one row. */
  rowScore(edge: IseEdge): number {
    const { UNARG, DEFLINK, DEFIMP, DEFUNIQ } = this.constants;
    return (
      this.multiplier(edge.claim_id, UNARG) *
      this.multiplier(edge.link_id, DEFLINK) *
      this.multiplier(edge.imp_id, DEFIMP) *
      this.multiplier(edge.uniq_id, DEFUNIQ)
    );
  }

  /**
   * A prediction's contribution: sign x (2 x Truth - 1) x Link x Imp x Uniq.
   * A pending prediction reads 0.5 and so contributes nothing either way.
   */
  predictionScore(edge: IseEdge, sign: 1 | -1): number {
    const { UNARG, DEFLINK, DEFIMP, DEFUNIQ } = this.constants;
    return (
      sign *
      (2 * this.multiplier(edge.claim_id, UNARG) - 1) *
      this.multiplier(edge.link_id, DEFLINK) *
      this.multiplier(edge.imp_id, DEFIMP) *
      this.multiplier(edge.uniq_id, DEFUNIQ)
    );
  }

  /** What is still undecided on a prediction row: Link x Imp x Uniq x (1 - |2T - 1|). */
  pointsAtStake(edge: IseEdge): number {
    const { UNARG, DEFLINK, DEFIMP, DEFUNIQ } = this.constants;
    const truth = this.multiplier(edge.claim_id, UNARG);
    return (
      this.multiplier(edge.link_id, DEFLINK) *
      this.multiplier(edge.imp_id, DEFIMP) *
      this.multiplier(edge.uniq_id, DEFUNIQ) *
      (1 - Math.abs(2 * truth - 1))
    );
  }

  /** Every score of one page. */
  evaluate(pageId: number): PageScore {
    const cached = this.memo.get(pageId);
    if (cached) return cached;

    const page = this.pages.get(pageId);
    if (!page) return this.neutralScore();

    // A page reached while it is still being evaluated is an ancestor of
    // itself. Reading the neutral constant breaks the loop without letting a
    // ring of claims amplify itself.
    if (this.evaluating.has(pageId)) {
      this.cycleCuts += 1;
      return this.neutralScore();
    }
    this.evaluating.add(pageId);
    const cutsBefore = this.cycleCuts;
    try {
      const score = this.computeScore(page);
      // A score computed under a cycle cut depends on where the walk started,
      // so it is not reused: every page is scored as its own root and a ring
      // reads the same from either member.
      if (this.cycleCuts === cutsBefore) this.memo.set(pageId, score);
      return score;
    } finally {
      this.evaluating.delete(pageId);
    }
  }

  private neutralScore(): PageScore {
    const truth = this.constants.UNARG;
    return { pro: 0, con: 0, supp: 0, weak: 0, pred: 0, belief: 0, truth, raw: null, impact: null };
  }

  private computeScore(page: IsePage): PageScore {
    const pageId = page.id;

    // An importance page has no argument table of its own: its score is the
    // largest Validity x Bears over the interests the row speaks to.
    if (page.kind === "importance") {
      const effective = this.rows(pageId, "interest_listing")
        .filter((e) => isPageRef(e.claim_id))
        .map(
          (e) =>
            this.truth(e.claim_id as number) *
            this.multiplier(e.bearing_id, this.constants.DEFLINK)
        );
      const truth = effective.length ? Math.max(...effective) : this.constants.UNARG;
      return { pro: 0, con: 0, supp: 0, weak: 0, pred: 0, belief: truth, truth, raw: null, impact: null };
    }

    const pro = this.total(this.rows(pageId, "argument", "agree"));
    const con = this.total(this.rows(pageId, "argument", "disagree"));

    // Linkage, interest, uniqueness, equivalence, driver and media pages score
    // their own argument table and nothing else.
    if (SPECIAL_KINDS.includes(page.kind)) {
      let impact: number | null = null;
      if (page.kind === "media") {
        impact = this.share(
          this.total(this.rows(pageId, "impact", "agree")),
          this.total(this.rows(pageId, "impact", "disagree"))
        );
      }
      return {
        pro,
        con,
        supp: 0,
        weak: 0,
        pred: 0,
        belief: pro - con,
        truth: this.share(pro, con),
        raw: null,
        impact,
      };
    }

    const supp = this.total(this.rows(pageId, "evidence", "agree"));
    const weak = this.total(this.rows(pageId, "evidence", "disagree"));
    const predictions = [
      ...this.rows(pageId, "prediction", "agree").map((e) => this.predictionScore(e, 1)),
      ...this.rows(pageId, "prediction", "disagree").map((e) => this.predictionScore(e, -1)),
    ];
    const predUp = predictions.filter((p) => p > 0).reduce((a, b) => a + b, 0);
    const predDown = predictions.filter((p) => p < 0).reduce((a, b) => a + b, 0);

    const positive = pro + supp + predUp;
    const negative = con + weak - predDown;
    const raw = this.share(positive, negative);

    // A conjunction cannot be more probable than its least probable necessary
    // part. Components with no page of their own do not cap anything.
    const loadBearing = this.rows(pageId, "component")
      .filter(
        (e) =>
          isPageRef(e.claim_id) &&
          String((e.attrs as Record<string, unknown> | null)?.lb ?? "").toUpperCase() === "Y"
      )
      .map((e) => this.truth(e.claim_id as number));
    const truth = loadBearing.length ? Math.min(raw, ...loadBearing) : raw;

    return {
      pro,
      con,
      supp,
      weak,
      pred: predictions.reduce((a, b) => a + b, 0),
      belief: pro - con + (supp - weak) + predictions.reduce((a, b) => a + b, 0),
      truth,
      raw,
      impact: null,
    };
  }

  private total(edges: IseEdge[]): number {
    return edges.reduce((sum, edge) => sum + this.rowScore(edge), 0);
  }
}

/** Convenience: one scorer, every page's score, keyed by page id. */
export function scoreAllPages(
  dataset: IseDataset,
  overrides: Partial<IseConstants> = {}
): Map<number, PageScore> {
  const scorer = new IseScorer(dataset, overrides);
  const out = new Map<number, PageScore>();
  for (const page of dataset.pages) out.set(page.id, scorer.evaluate(page.id));
  return out;
}
