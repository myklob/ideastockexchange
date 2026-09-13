/**
 * The page / edge model: one claim per page, one row per edge.
 *
 * Field names are the column names of examples/ise-zoning/schema.sql and the
 * keys of examples/ise-zoning/ise-zoning.json, so a row read from SQL can be
 * handed to the scorer unchanged. No score is stored anywhere in this model;
 * every number is computed from pages and edges by src/lib/ise-pages/score.ts.
 */

export type PageKind =
  | "belief"
  | "claim"
  | "linkage"
  | "importance"
  | "interest"
  | "uniqueness"
  | "equivalence"
  | "driver"
  | "media";

/** Kinds whose question is rendered from x_id and y_id instead of stored. */
export const FORMULA_BUILT_KINDS: readonly PageKind[] = [
  "linkage",
  "importance",
  "uniqueness",
  "equivalence",
  "driver",
] as const;

/** Kinds that score only their own argument table (no evidence, predictions or anatomy). */
export const SPECIAL_KINDS: readonly PageKind[] = [
  "linkage",
  "importance",
  "interest",
  "uniqueness",
  "equivalence",
  "driver",
  "media",
] as const;

export interface IsePage {
  id: number;
  kind: PageKind;
  /** The claim. Null on the formula-built kinds: their question is rendered. */
  text?: string | null;
  topic?: string | null;
  /** First use: the page this one is a row of. Every use is in the edge table. */
  parent_id?: number | null;
  /** The row (X) of a formula-built page. */
  x_id?: number | null;
  /** The conclusion, belief, interest or other reason (Y). */
  y_id?: number | null;
  /** linkage: Argument | Evidence | Prediction | Interest | Media. media: Book | Study | ... */
  type?: string | null;
  /** linkage: Supports | Weakens. driver: Support | Opposition. */
  direction?: string | null;
  /** importance: which row of the parent page this scores. */
  rowkind?: string | null;
  value?: string | null;
  measured_by?: string | null;
  where_found?: string | null;
  if_true?: string | null;
  if_false?: string | null;
  latest?: string | null;
  bridge?: string | null;
  bottom_line?: string | null;
  positivity?: number | null;
  logical_form?: string | null;
}

/** One row of one table on one page. */
export interface IseEdge {
  id?: number;
  page_id: number;
  /** Which table on the page: argument, evidence, prediction, cba, component, ... */
  section: string;
  /** agree | disagree, extreme | moderate, x | y, or null for single lists. */
  side?: string | null;
  position: number;
  /** The row's own page: its Truth. Null means the unargued constant. */
  claim_id?: number | null;
  /** Typed text, only while the row has no page. */
  text?: string | null;
  link_id?: number | null;
  imp_id?: number | null;
  uniq_id?: number | null;
  drives_id?: number | null;
  equiv_id?: number | null;
  who_id?: number | null;
  bearing_id?: number | null;
  pattern?: string | null;
  /** Cost-benefit rows: the units. */
  category?: string | null;
  /** Cost-benefit rows: the estimate in those units. The one typed number. */
  magnitude?: number | null;
  deadline?: string | null;
  attrs?: Record<string, unknown> | null;
}

/**
 * The labelled constants. A multiplier with no page of its own reads one of
 * these, and the scorecard counts how many rows still rest on each.
 */
export interface IseConstants {
  /** Weight of the neutral start in the truth formula. */
  K: number;
  /** Truth of a row with no page yet. */
  UNARG: number;
  /** Linkage presumed when no linkage page exists: the burden is on the challenger. */
  DEFLINK: number;
  /** Importance with no importance page: the neutral start, neither trivial nor decisive. */
  DEFIMP: number;
  /** Uniqueness presumed when no uniqueness page exists. */
  DEFUNIQ: number;
}

export const DEFAULT_CONSTANTS: IseConstants = {
  K: 1,
  UNARG: 0.5,
  DEFLINK: 1,
  DEFIMP: 0.5,
  DEFUNIQ: 1,
};

export interface IseDataset {
  constants?: { name: string; value: number; meaning?: string }[];
  pages: IsePage[];
  edges: IseEdge[];
}
