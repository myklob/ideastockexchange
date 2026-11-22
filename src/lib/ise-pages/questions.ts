/**
 * The question of a formula-built page is rendered, never stored.
 *
 * A linkage, importance, uniqueness, equivalence or driver page connects two
 * other pages; naming those two pages is the whole of creating it, and the
 * question assembles itself from their claims. Storing the sentence instead
 * would let it drift from the pages it is about.
 */

import { type IsePage, type PageKind } from "./types";

const NEEDS_BOTH_PAGES =
  "(name the two pages this page connects; the question writes itself)";

/**
 * Drops a closing period before the claim is quoted inside a sentence, unless
 * the period belongs to an initial or abbreviation ("... J. Reuben Clark.").
 */
export function trimClosingPeriod(text: string): string {
  if (!text.endsWith(".")) return text;
  const before = text.slice(-2, -1);
  const isCapital = before !== "" && before === before.toUpperCase() && before !== before.toLowerCase();
  return isCapital ? text : text.slice(0, -1);
}

const quote = (text: string) => `"${trimClosingPeriod(text)}"`;

export interface QuestionContext {
  /** The claims of the two pages this page connects, in x, y order. */
  x?: string | null;
  y?: string | null;
}

/**
 * The one question a formula-built page argues. Returns the page's own text
 * for the kinds that store a claim (belief, claim, interest, media).
 */
export function renderQuestion(page: IsePage, context: QuestionContext): string {
  const kind: PageKind = page.kind;
  if (kind === "belief" || kind === "claim" || kind === "interest" || kind === "media") {
    return page.text ?? "";
  }
  const x = context.x?.trim();
  const y = context.y?.trim();
  if (!x || !y) return NEEDS_BOTH_PAGES;

  switch (kind) {
    case "linkage": {
      if (page.type === "Media") {
        const verb = page.direction === "Weakens" ? "weakens" : "supports";
        return `The work: ${quote(x)}\n${verb} the conclusion that: ${quote(y)}`;
      }
      if (page.type === "Interest") {
        return `If it were true that: ${quote(x)},\nit would matter to the interest: ${quote(y)}`;
      }
      const observed = page.type === "Prediction" ? "observed" : "true";
      const verb = page.direction === "Weakens" ? "weaken" : "strengthen";
      return `If it were ${observed} that: ${quote(x)},\nit would significantly ${verb} the conclusion that: ${quote(y)}`;
    }
    case "importance":
      return `This ${page.rowkind || "row"}: ${quote(x)}\naddresses the most important interest at stake in the belief: ${quote(y)}`;
    case "uniqueness":
      return `The reason: ${quote(x)}\nmakes a different point from: ${quote(y)}`;
    case "equivalence":
      return `The belief: ${quote(x)}\nmakes the same claim as: ${quote(y)}`;
    case "driver": {
      const towards = page.direction === "Opposition" ? "opposition to" : "support for";
      return `The interest: ${quote(x)}\nis what actually drives ${towards} the belief that: ${quote(y)}`;
    }
    default:
      return page.text ?? "";
  }
}

/** The question of a page, looking its two ends up in a page index. */
export function questionOf(page: IsePage, pages: Map<number, IsePage>): string {
  return renderQuestion(page, {
    x: page.x_id ? pages.get(page.x_id)?.text : null,
    y: page.y_id ? pages.get(page.y_id)?.text : null,
  });
}
