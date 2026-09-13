/**
 * Prints every page's score from a page/edge dataset, the way
 * examples/ise-zoning/score_reference.py does, so the TypeScript engine can be
 * eyeballed against the Python reference and the workbook.
 *
 *   npx tsx scripts/score-ise-pages.ts [dataset.json] [--card <page id>]
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { IseScorer, questionOf, scoreBeliefPage, type IseDataset } from "../src/lib/ise-pages";

const args = process.argv.slice(2);
const cardFlag = args.indexOf("--card");
const cardId = cardFlag === -1 ? null : Number(args[cardFlag + 1]);
const file = args.find((a, i) => !a.startsWith("--") && i !== cardFlag + 1)
  ?? "examples/ise-zoning/ise-zoning.json";

const dataset: IseDataset = JSON.parse(readFileSync(resolve(file), "utf8"));
const scorer = new IseScorer(dataset);

const pct = (value: number | null, digits = 2) =>
  value === null ? "n/a" : value.toFixed(digits);

for (const page of [...dataset.pages].sort((a, b) => a.id - b.id)) {
  const score = scorer.evaluate(page.id);
  const impact = score.impact === null ? "" : `  impact ${pct(score.impact, 4)}`;
  console.log(
    `${String(page.id).padStart(4)} ${page.kind.padEnd(12)} truth ${pct(score.truth, 4)}` +
      `  belief ${score.belief >= 0 ? "+" : ""}${score.belief.toFixed(2)}${impact}`
  );
}

if (cardId !== null && Number.isFinite(cardId)) {
  const card = scoreBeliefPage(scorer, cardId);
  const page = scorer.pages.get(cardId);
  console.log(`\n${page ? questionOf(page, scorer.pages) : cardId}\n`);
  console.log(`Belief score        ${card.belief.toFixed(2)}`);
  console.log(`Truth score         ${pct(card.truth)} (argued ${pct(card.truthArgued)}, cap ${pct(card.weakestLoadBearing)})`);
  console.log(`Reasons             ${card.counts.reasonsAgree} agree / ${card.counts.reasonsDisagree} disagree`);
  console.log(`Evidence            ${card.counts.evidenceSupporting} supporting / ${card.counts.evidenceWeakening} weakening`);
  console.log(`Predictions         ${card.counts.predictions}, ${pct(card.pointsAtStake)} points at stake`);
  console.log(`Presumed constants  ${card.presumptions.noLinkagePage} linkage, ${card.presumptions.noImportancePage} importance, ${card.presumptions.noUniquenessPage} uniqueness (of ${card.counts.scoredRows} scored rows)`);
  console.log(`Dispute             ${card.disputeType ?? "nothing scored yet"}`);
  console.log(`Cost-benefit        ${card.costBenefit.mixedUnits ? "mixed units, read the nets by category" : `net ${pct(card.costBenefit.net)}`}`);
  console.log(`Pages read          ${card.pagesRead.length}, of which ${card.pagesFailingGate.length} are one-sided or empty`);
}
