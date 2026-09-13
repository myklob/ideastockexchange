/**
 * The Idea Stock Exchange page / edge model.
 *
 * One claim per page, one row per edge, no stored scores. This is the shape
 * the zoning example workbook holds in tabs and formulas, the shape
 * examples/ise-zoning/schema.sql holds in two tables, and the shape the web
 * pages read: see examples/ise-zoning/README.md for how the three line up.
 */

export * from "./types";
export * from "./score";
export * from "./scorecard";
export * from "./questions";
