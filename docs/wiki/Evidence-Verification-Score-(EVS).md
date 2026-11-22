# Evidence Verification Score (EVS)

The **Evidence Verification Score (EVS)** is how the Idea Stock Exchange lets the world, rather than more argument, decide where a claim's truth score begins. It measures the degree to which a belief is supported by reliable, independent, and high-quality evidence, and it is built from three things anyone can check:

- **Independence and quality of sources**: what kind of thing the finding is (a published statistic, a randomized trial, a rumour on social media).
- **Replication consistency**: how many independent times the finding has been looked for, and what share of those looks agreed.
- **Relevance of evidence to the conclusion**: whether the finding bears on the claim it is filed under at all.

This page says what the 2025 definition was, what the published site does with those inputs today (with the real formulas and constants, and links to the code), what the Next.js app does where it differs, what is proposed and not built, and what is refused by design. Nothing here has been quietly dropped for being unbuilt; it has been labelled.

Two engines read these inputs, and they disagree. The **published site** (`tools/static-site/`, which builds [myklob.github.io/ideastockexchange/beliefs/](https://myklob.github.io/ideastockexchange/beliefs/index.html)) uses them to set a **starting point** for a finding's own truth score, prints the 2025 formula beside it as a diagnostic, and lets no ranking read that diagnostic. The **Next.js app** (`src/core/scoring/`) computes a different EVS with a logarithm and a different source-type table, and feeds it into a belief's truth score as a share. Where this page says "the site does", it means the first; "the app does" means the second. Where the two disagree with the owner's October 2026 direction on scoring, that direction is stated too.

## Why the score exists at all

The site's scoring rule has one feature that every other number on the site depends on: a row contributes `sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq` to the page above it (code: [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), the `_contrib` method). A claim nobody has argued sits at a truth of 0.50, so `(2 x 0.50 - 1)` is zero, so listing it is worth exactly nothing. That is the fix for padding a score by listing more reasons, and it is right.

It has a consequence that nobody noticed until the whole corpus was scored. A page with no rows reads 0.50. So it contributes nothing to its parent. So the parent reads 0.50. By induction, **every page of an argument graph in which nothing is cited reads exactly 0.50 forever**, however many reasons are listed and however cleverly they are argued. Run the scorer on a chain of a thousand claims with confidence forced to 1 and every one of them reads 0.50. The engine's own docstring puts it this way: reasoning about reasoning never touches the world (code: [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py), lines 6 to 19). The test `test_argument_alone_can_never_leave_the_neutral_point` in [`test_engines.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py) pins it on unsourced chains of 2, 5 and 40 pages, and the project's standing instruction is that if that test ever fails, something has let a score move without evidence, and that needs a reason rather than a fix to the test.

Something has to come in from outside the argument, and what comes in from outside is evidence. That is what EVS is for on the published site: a page may declare what it rests on, and that sets where its truth starts before anyone argues with it. A page that declares nothing starts at the coin flip, exactly as before. A finding that is a cited statistic does not.

The owner's direction (October 2026) agrees with the destination and disagrees about the road. Contributions should count from the moment they are posted and be argued down from there, because a rule under which work counts for nothing until someone proves it tells contributors their effort is wasted. That is why [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) now prints a second number beside every argued truth score (see "Four formulas" below). The argued rule and its pinned test are unchanged until the two have been compared on real pages.

## The three inputs

### Evidence Source Independence Weighting (ESIW)

ESIW weights evidence types by **independence** and **reliability**. The 2025 table had sixteen rows. The published site carries all sixteen, row for row and weight for weight, in the wiki's own order, plus one addition it marks as an addition (code: `ESIW` dict in [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py), lines 79 to 98; order pinned by `test_the_tier_order_is_the_wiki_s_order`). The two right-hand columns are what the site does with the weight: a finding every replication confirms starts at `0.5 + weight/2`, one every replication contradicts starts at `0.5 - weight/2` (calculation from the formula in the next section; the same two columns are printed on the site's [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts)).

| Rank | Evidence type (2025 wording) | Key the site accepts | Weight | Starts at, confirmed | Starts at, contradicted |
|------|------------------------------|----------------------|--------|----------------------|-------------------------|
| 1 | Statistics & Data (with sources) | `statistics` | 0.90 | 0.95 | 0.05 |
| (added) | Primary official record: statute, judicial holding, agency rule, sworn filing | `record` | 0.90 | 0.95 | 0.05 |
| 2 | Formal Scientific Studies: RCTs | `rct` | 0.85 | 0.925 | 0.075 |
| 2 | Formal Scientific Studies: Meta-analyses | `meta` | 0.80 | 0.90 | 0.10 |
| 3 | Observational & Correlational Studies | `observational` | 0.75 | 0.875 | 0.125 |
| 4 | Historical Trends (with references) | `historical` | 0.70 | 0.85 | 0.15 |
| 5 | Expert Testimony (with supporting data) | `expert_data` | 0.65 | 0.825 | 0.175 |
| 6 | Expert & Social Media Claims | `expert_claim` | 0.60 | 0.80 | 0.20 |
| 7 | Personal Experience / Anecdotes | `anecdote` | 0.55 | 0.775 | 0.225 |
| 8 | Common Sense / Logic | `logic` | 0.50 | 0.75 | 0.25 |
| 9 | Analogies / Metaphors | `analogy` | 0.45 | 0.725 | 0.275 |
| 10 | Cultural Norms | `norm` | 0.40 | 0.70 | 0.30 |
| 11 | Intuition / Gut Feeling | `intuition` | 0.35 | 0.675 | 0.325 |
| 12 | News & Media Reports | `news` | 0.30 | 0.65 | 0.35 |
| 13 | Surveys & Polls | `survey` | 0.25 | 0.625 | 0.375 |
| 14 | Eyewitness Testimony | `eyewitness` | 0.20 | 0.60 | 0.40 |
| 15 | Visual Evidence | `visual` | 0.15 | 0.575 | 0.425 |
| 16 | Historical Artifacts | `artifact` | 0.10 | 0.55 | 0.45 |
| (none) | No source type named, or a name matching no row | (blank) | 0.00 | 0.50 | 0.50 |

Three things on that table are not in the 2025 version, and each is a decision the code made that the owner has not yet ratified:

1. **The rank-2 band was split.** The 2025 table gave one band, "0.85-0.80", for "RCTs, Meta-analyses" together. The site reads it in listing order: RCT 0.85, meta-analysis 0.80. The code's own note says that read the other way round it would be 0.80 and 0.85, so this is a reading, not a fact (code: `evidence.py` lines 63 to 65).
2. **`record` was added at 0.90.** The sixteen categories have no row for a primary official record: a statute, a judicial holding, an agency rule, a sworn filing. For policy work that is most of the record, and (the code's example) calling *Ex parte Garland* a "historical trend" would be wrong. It is weighted with statistics because it is a primary document whose existence is not in dispute, and it is marked with a rank of `None` so a reader can see it is not the wiki's. Drop it and those rows fall to unclassified; nothing else depends on it (code: `evidence.py` lines 66 to 70 and 81). The conformance corpus already uses it (page 6), and so do many pages on the live site, for instance [the Supreme Court's holding on the pardon power](https://myklob.github.io/ideastockexchange/beliefs/p/supreme-court-held-pardon.html).
3. **No source reads 0.0, not 0.5.** `NOSOURCE = 0.0` (code: `evidence.py` line 99). A finding with no type named gets no pull either way and starts at exactly 0.50, "however many times it is cited". The name is matched on a normalised form (trimmed, lowercased, spaces and hyphens turned to underscores), so `Expert Claim` and `expert-claim` are both the `expert_claim` tier and not nothing (code: `classify()` at line 123; conformance pages 17 and 18 pin this).

The eighteen keys are the only values the `etype` column of the pages sheet accepts; the validator reads them straight from `evidence.ESIW` (code: [`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py), the `LISTS` dict). They also ship as a table in every data export (`evidence_tier` in the SQL and SQLite exports, code: [`export_db.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/export_db.py)) and inside `conformance_corpus.json`, so a port in another language needs nothing from this repository's source to run the contract.

**Classify what the claim says, not the instrument that produced it.** This is the one rule of thumb the engine's authors found they needed. "58 percent of Americans told a pollster X" is a published statistic and close to certain. "Americans believe X", inferred from the same poll, is survey evidence and much weaker. A meme visualising a published statistic is a statistic. A pundit asserting a claim on video is an expert or social media claim at best, and is usually an argument, not evidence. The tier belongs to the sentence on the page (code: `evidence.py` lines 57 to 59; the live example is [58 percent of Americans said the president grants too many pardons](https://myklob.github.io/ideastockexchange/beliefs/p/58-percent-americans-said.html), filed as `statistics`).

#### The app's table is different: five tiers, not eighteen

The Next.js app does not carry this table. It uses five tiers (code: `EVIDENCE_TYPE_WEIGHTS` in [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts), lines 108 to 118):

| Tier | Meaning (from the code's comments) | Weight |
|------|-----------------------------------|--------|
| T0 | Retracted / Fraudulent ("the foundation is gone, so is the weight") | 0.05 |
| T1 | Peer-reviewed / Official | 1.0 |
| T2 | Expert / Institutional | 0.75 |
| T3 | Journalism / Surveys | 0.5 |
| T4 | Opinion / Anecdote | 0.25 |
| unknown | anything else | 0.5 |

Prisma stores `evidenceType` with default `"T3"` and a separate `sourceIndependenceWeight` with default 0.5 ([`schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma), the `Evidence` model). The two tables do not just differ in resolution; they rank things in opposite directions. The 2025 table puts anecdote (0.55) above news (0.30) and surveys (0.25). The T-tiers put journalism and surveys (0.5) above opinion and anecdote (0.25). The top is 0.90 on the site and 1.0 in the app; the bottom is 0.10 on the site and 0.25 (or 0.05 for a retraction, which the 2025 table has no row for) in the app.

The belief page rules ([`docs/BELIEF_PAGE_RULES.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/BELIEF_PAGE_RULES.md), Rule 4) say "The old four tiers (T1 to T4) are retired; a row still carrying one renders it as plain text until it is reclassified", and the React ledger does render a `T3` as the words "Tier 3" ([`EvidenceSection.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/EvidenceSection.tsx), `sourceTypeLabel`). But every TypeScript scoring path still reads the T-tier weights: both evidence API routes, `fetch-belief.ts`, `grounding.ts` and `scoring-engine.ts`. So the status is: **retired on paper, live in every number the app prints.** The eighteen-key table exists only in Python.

#### "Debated in pro/con form with voting": proposed, not built

The 2025 page promised that the category choice for each piece of evidence is debated in pro/con form with voting to ensure accuracy. That sentence stays here with its status, which is **proposed and not implemented** in either engine.

On the site, `etype`, `erq` and `erp` are typed columns on the pages sheet (code: `ise_tables.py`, column notes for `etype`, `erq`, `erp`). The method page lists this as a known weakness in so many words: somebody decided that a newspaper's tally of public filings is a published statistic rather than a news report, and that decision moves the claim from 0.65 to 0.95; "The wiki says the category should itself be argued in pro and con form. Here it is typed, and a wrong call is not visible as a disagreement" (code: [`method.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/method.py), the Limits section). Linkage, importance and uniqueness each have an argued page whose truth is the multiplier; source type is the one factor that does not.

The voting half is contradicted by a standing rule, not an omission. Votes are recorded in `content/votes.csv` and shown on the heading line after the score badge, and `intake.py` states the rule as a constant: "A vote never moves a score; the page shows it next to what the analysis says, as what people think" (code: [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py), `NO_MOVE`). This matches the owner's October 2026 direction: votes may decide what is promoted and given attention, never what is valid, and the gap between the two is worth showing. So if classification is ever argued, it will be argued on a page, by the same rule as linkage, and the vote count will sit beside it as a measure of attention.

The app has something adjacent but not the same: an agent-submitted row carries a `tierClaim`, and a provenance job or a human confirms it as `tierVerified`. The exposure engine counts rows weighted by an unconfirmed claim and reports the number (`tierUnconfirmedCount`) without inventing a weight for it (code: [`evidence-exposure.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/evidence-exposure.ts), lines 35 to 38). That is review, not debate, and there is no vote on it either.

### Evidence Replication Quantity (ERQ)

The number of **independent replications** of a study or finding. Both engines agree on the meaning and differ on how the count enters the arithmetic (next section).

Defaults, which the 2025 page never stated: on the site a blank `erq` reads as 1, "the finding itself", and a value below 1 also reads as 1, because the weight formula reads it as how many independent looks at this exist and no page has had fewer than one. The absence is recorded so the label can say "no independent replication recorded" rather than pretending a count was typed (code: `classify()` in `evidence.py`, lines 130 to 132; conformance page 20 pins `erq=0` reading as 1). In the app, `replicationQuantity` is an `Int` with default 1.

### Evidence Replication Percentage (ERP)

The percentage of replications producing **consistent results**.

Defaults and coercions: on the site a blank `erp` reads 100, a trailing `%` is stripped, and the value is clamped into [0, 100]. The clamp is part of the rule and not tidying, because the repository's own SQL view of the same rule agreed with the Python scorer on all 261 pages of the live corpus and returned a truth starting point of **1.40** the first time it was handed an ERP of 150. That is not a probability. Conformance page 21 now pins it (code: `evidence.py` lines 133 to 136; [`conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py), rule 1 of the contract). In the app, `replicationPercentage` is a fraction 0 to 1 with default 1.0, not a percentage, and the formula does not divide by 100.

Both defaults mean an unreplicated finding is treated as fully consistent with itself, which the 2025 page never said and which the owner has not been asked about. It is listed under open decisions.

ERP also carries a property the 2025 page did not spell out: it decides **direction**. On the site, any finding at 50 percent agreement starts at exactly 0.50 whatever its tier, because a contested literature has established nothing (pinned by `test_half_agreement_starts_at_the_coin_flip_whatever_the_source`, which loops over all eighteen keys). A statistic every replication contradicts starts at 0.05, below an anecdote nobody has contradicted. Consistency is not a bonus multiplied onto quality; it is the sign.

### Evidence-to-Conclusion Relevance Score (ECRS)

The 2025 page listed a fourth input measuring how strongly the evidence **directly supports or weakens** a belief's conclusion:

- High ECRS: evidence would likely confirm the conclusion if infinitely replicated under ideal conditions.
- Low ECRS: evidence may be true but is **not directly relevant**.

Status: **superseded on the site by the linkage page; stored twice and multiplied three times in the app.**

On the site, relevance is not a fourth typed number. It is the row's **linkage page**, "a separate argument with its own reasons", the same page that every argument row has (see [[Linkage Scores]] and [[Evidence to Conclusion Relevance Score]]; the site's own wiki page for the factor is titled Evidence to Conclusion Linkage Score, ECLS, and Prisma's enum value is `ECLS`, so this page's name for it is the odd one out). The 2025 EVS product is still computed for display, with the row's linkage score standing in as ECRS, "so this reuses the linkage page rather than adding a fourth thing to argue" (code: `evs(row, ecrs)` in `evidence.py`, lines 154 to 158; `render_site.py` passes the row's linkage `l` as `ecrs`). The starting point deliberately excludes relevance altogether: "Source quality is a property of the claim, not of the place the claim is cited, and the same finding cited on four pages has one truth. How much a finding bears on a particular conclusion is the linkage page ... putting source quality on the edge as well would count it twice" (code: `evidence.py` lines 51 to 55). The test `test_source_quality_is_not_also_a_row_multiplier` pins that two differently sourced claims with the same truth contribute exactly the same to the page above.

The app kept ECRS as a stored field, `conclusionRelevance` (default 0.5), **and** a stored `linkageScore` (default 0.5), and relevance gets multiplied in more than once: `calculateEVS` includes `conclusionRelevance`; `computeEvidenceImpactScore` then multiplies that EVS by `linkageScore` (`scoring-engine.ts` lines 147 to 149); and `calculateTruthScoreBreakdown` multiplies the EVS by `linkageScore` again when building the verification half of the truth score ([`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts), lines 321 to 323). Nothing in the app defines what distinguishes "relevance" from "linkage", so the double count is a defect in waiting rather than a design. It is open decision 4 below.

## Four formulas, and which one does what

### The 2025 definition: computed, printed, read by nothing

```
EVS(evidence) = ESIW x ECRS x ERQ x (ERP / 100)
```

Where:
- **ESIW** = evidence category weight (independence and quality)
- **ECRS** = relevance score from pro/con performance (on the site, the row's linkage score)
- **ERQ** = number of replications
- **ERP** = replication success rate, as a percentage

The **Overall EVS** for a belief is the sum of EVS across all its evidence.

The site computes this exactly as written, `c['esiw'] * ecrs * c['erq'] * (c['erp'] / 100.0)`, prints it in an **EVS** column on every row of every Evidence Ledger, and prints the total under the table as "Evidence Verification Score N · supporting A · weakening B", with a note saying how many findings have no source type yet and how many have no replication count (code: `evidence.py` `evs()`; [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), `evidence_table()` and the `evs_for` / `evs_against` sums in `Corpus.stats`). The column header's hover text says what the number is: "Evidence Verification Score: how strong the evidence is, the wiki measure, read by nothing."

**Refused as a ranking, by design.** The 2025 page said EVS is "essential for ranking beliefs based on their evidentiary strength". No ranking on the site reads it: not truth, not confidence, not ReasonRank, not leverage. The reason is stated on the [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#evs): "an unbounded sum grows with every finding listed, and a score that grows with listing is the padding this site exists to stop." The same unboundedness is why it is shown: it tells apart a page resting on a body of replicated work (an EVS of 30) from one resting on a single uncorroborated claim (0.4), which a score capped between 0 and 1 cannot show. Note also that the 2025 sum, read literally, is signless: supporting and weakening evidence add together. Neither engine does that; the site prints the two sides separately and the app takes a share.

The owner's direction cuts across this refusal in one respect. The owner prefers an evidence weight with no ceiling, so a body of replicated work can outweigh opinion by 15 or 200 times. `tally.py` is the first rule built to that direction (below), and it uses exactly the unbounded product the site otherwise refuses to let rank anything. Which rule leads the page is to be settled by comparing them on real pages, not by argument on this one.

### The published site: a starting point for the finding's own page

This is what runs (code: `prior()` in [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py), lines 140 to 151; the truth rule in [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py); the whole contract in [`conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py), rule 1):

```
p0     = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)        where the page's truth starts
w      = k x replication(ERQ)                        how heavily that start counts, k = 1
replication(n) = REP_CAP x n / (n + 1)               REP_CAP = 2.0
truth  = (POS + w x p0) / (POS + NEG + w)             POS and NEG from the page's own rows
```

Read the first line at its corners. ERP decides which way a claim is pushed; ESIW decides how far it can be pushed, from nowhere at all when no source is named to nearly the whole way for a published statistic. A statistic every replication confirms starts at 0.95. The same statistic every replication contradicts starts at 0.05. The strongest source in the table weighs 0.90, so **p0 is confined to [0.05, 0.95]** and evidence alone never drives a claim all the way to certainty in either direction. Getting the last twentieth takes an argument, on a page. An eyewitness account confirmed starts at 0.60 and contradicted at 0.40, because eyewitness testimony was never going to settle much either way.

The second line is the replication reward, and it is **bounded**: 1 replication weighs 1.00, 2 weigh 1.33, 3 weigh 1.50, 4 weigh 1.60, 5 weigh 1.67, 10 weigh 1.82, 50 weigh 1.96, and the limit is 2.00 (calculation from `replication()`; the docstring gives the same sequence). So a prior backed by four independent replications takes more arguing to shift than one backed by a single paper, but no pile of replications can put a claim beyond argument. At `k = 1` even the strongest prior is within reach of a handful of objections, which is the intent: evidence opens the question, it does not close it. The test `test_even_the_strongest_prior_stays_within_reach_of_argument` builds a statistic with 50 replications at 100 percent agreement, files six sourced objections against it with confidence forced to 1, and checks that its truth falls under 0.5. The test `test_replication_is_bounded_so_volume_cannot_win` checks that a million replications still weigh less than `REP_CAP`.

The third line is where the start meets the argument. `w x p0` acts like `w` votes already cast at `p0` before the page's own rows are counted. A page that declares nothing reads `p0 = 0.5, w = k`, which is the neutral vote the engine always had. Nothing changes for a claim nobody has sourced.

The output lands on the belief page as the **Starts at** column of the Evidence Ledger, with a hover on every figure that shows the working with that row's own numbers, for instance: "tier weight 0.90; starting point 0.5 + 0.5 x 0.90 x (2 x 100/100 - 1) = 0.95; weight 1 x 2 x 1/(1 + 1) = 1.00" (code: `label()` and `working()` in `evidence.py`, lines 161 to 182). Under the table both formulas are printed with `k` filled in. The same rule is restated as a SQL view, `page_start`, in every database export, with the same three coercions, so an analyst can recompute it without the Python (code: `export_db.py`).

Two things this is **not**. It is not a row multiplier: the finding's source quality sets the finding's own truth, and the row above reads that truth through the ordinary row rule. And it is not a property of the belief: the inputs belong to the finding's page, and a belief reads evidence only through its evidence rows, each counted as `sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq`, so a finding at 0.50 contributes nothing however often it is listed. This replaces the 2025 framing of EVS as something a belief has. The 2025 page's intro sentence is kept at the top of this page because it still says what the inputs are for; the thing it describes is now located one level down.

### The owner's starting rule (tally.py): counted beside the truth score

The owner's October 2026 direction asked for a rule under which contributions count from the moment they are posted and evidence can weigh more than any argument without a ceiling. [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) is that rule, printed on every belief page beside the argued truth score under the heading "Counting every reason until it is argued down" and read by no other number (method page anchor [#tally](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)):

```
a reason or a prediction weighs    Truth x Linkage x Importance x Uniqueness
a finding weighs                   the same, x (1 + ESIW x ERQ x ERP/100)        uncapped
independent reasons on a side      the sum of Uniqueness over its reasons
share for                          (weight for + w x p0) / (weight for + weight against + w)
```

`ESIW x ERQ x ERP/100` is the 2025 EVS product without the relevance factor (relevance enters once, as the row's Linkage), with **no cap**: `finding_strength()` is zero when no source type is named, "so an unclassified finding weighs exactly what a reason does", and grows linearly with replications. The `p0` and `w` are the same starting point and weight the truth score uses, so one unanswered reason moves a page part of the way and not to certainty. What this rule drops from the argued rule is the `(2 x Truth - 1)` that makes an unargued reason worth exactly zero and the confidence gate that zeroes a row whose page has no work behind it; those two are why most argued truth scores in the corpus read 0.50. A vote enters neither rule.

### The Next.js app: a different EVS

The app's formula (code: `calculateEVS` in [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts), lines 120 to 136; the Prisma schema comment on `evsScore` states the same form):

```
EVS = ESIW x log2(ERQ + 1) x ECRS x ERP        ERP a fraction 0 to 1, no /100
```

with ESIW from the five T-tiers above. Replication enters as `log2(ERQ + 1)`: concave and unbounded. ERQ = 1 gives 1.0 in all three engines; ERQ = 3 gives 2.0 here, 1.50 on the site and 3 in the 2025 formula; ERQ = 10 gives 3.46 here, 1.82 on the site and 10 in 2025. The unit test pins `1.0 x log2(4) x 0.8 x 0.9` for a T1 study with 3 replications ([`scoring-engine.test.ts`](https://github.com/myklob/ideastockexchange/blob/master/tests/unit/core/scoring/scoring-engine.test.ts)).

What the app does with it:

- **Per row:** `impact = EVS x linkageScore x 10`, clamped to [0, 100], the same magnitude scale as an argument's impact. The code's own calibration note: a single well-replicated T1 study (EVS about 1 to 2, linkage 0.7 to 0.9) lands in the 7 to 18 range, comparable to a solid argument edge; a retracted T0 source collapses to about 0 (`computeEvidenceImpactScore`, lines 138 to 149).
- **Per belief, the evidence dimension:** `aggregateEvidenceScore = supportingEVS / (supportingEVS + weakeningEVS)`, 0.5 when there is no evidence (`all-scores.ts` lines 842 to 850). This is a bounded share, not the 2025 sum, and `/algorithms/evidence-scores` describes it as "supporting divided by (supporting + weakening)".
- **Inside the truth score:** the verification half of `calculateTruthScoreBreakdown` weights each row by `evsScore x linkageScore` (falling back to 0.1 when EVS was never computed), takes the supporting share, and clamps it to [0.01, 0.99]; 0.5 with no evidence (`all-scores.ts` lines 316 to 334).
- **Defaults** (Prisma `Evidence` model): `evidenceType "T3"`, `sourceIndependenceWeight 0.5`, `replicationQuantity 1`, `conclusionRelevance 0.5`, `replicationPercentage 1.0`, `linkageScore 0.5`, `evsScore 0.0`.

Under the app, the 2025 page's sample `study_2` (0.85 x 0.9 x 10 x 0.95 = 7.27) would read `1.0 x log2(11) x 0.9 x 0.95 = 2.96` if typed T1. The app has no starting point and no bound: its evidence enters as impact points summed beside argument impact ([`fetch-belief.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/data/fetch-belief.ts), `computeBeliefScores`). So the wiki now matches neither engine exactly, and the two engines do not match each other. That is open decision 3.

## A worked example, under all four rules

The 2025 page's three studies, with their keys corrected to the ones the site accepts (the 2025 keys `statistics_and_data`, `formal_scientific_studies_randomized_controlled_trials` and `formal_scientific_studies_meta_analysis` match no row after normalisation and would classify as no source, ESIW 0.0, which conformance page 19 pins). Numbers are calculations from the formulas above; the first three columns' products are the same arithmetic the 2025 script printed.

| Study | Key | ERQ | ERP | ECRS (as linkage) | 2025 EVS, displayed | Site starting point p0 | Site weight w | tally.py finding strength | App EVS if typed T1 |
|-------|-----|-----|-----|-------------------|---------------------|------------------------|---------------|---------------------------|---------------------|
| study_1 | `statistics` (0.90) | 5 | 90 | 0.8 | 0.9 x 0.8 x 5 x 0.90 = **3.24** | 0.5 + 0.5 x 0.90 x (1.8 - 1) = **0.86** | 2 x 5/6 = **1.67** | 0.9 x 5 x 0.9 = **4.05** | 1.0 x log2(6) x 0.8 x 0.9 = **1.86** |
| study_2 | `rct` (0.85) | 10 | 95 | 0.9 | 0.85 x 0.9 x 10 x 0.95 = **7.2675** | 0.5 + 0.5 x 0.85 x 0.9 = **0.8825** | 2 x 10/11 = **1.82** | 0.85 x 10 x 0.95 = **8.075** | 1.0 x log2(11) x 0.9 x 0.95 = **2.96** |
| study_3 | `meta` (0.80) | 3 | 85 | 0.7 | 0.8 x 0.7 x 3 x 0.85 = **1.428** | 0.5 + 0.5 x 0.80 x 0.7 = **0.78** | 2 x 3/4 = **1.50** | 0.8 x 3 x 0.85 = **2.04** | 1.0 x log2(4) x 0.7 x 0.85 = **1.19** |
| **Belief total** | | | | | **11.9355** (printed, read by nothing) | (none: p0 belongs to each finding) | | (each multiplies its own row) | share, not a sum |

Read across study_2. The 2025 rule says it is worth 7.27 units of evidence and the belief is worth the sum. The site says the finding's own page starts at 0.8825 with the weight of 1.82 votes, so a critic has to bring about two well-argued objections to drag it under the line, and the belief above reads that finding through `(2 x 0.8825 - 1) = 0.765` times the row's confidence, linkage, importance and uniqueness. `tally.py` says the row weighs `Truth x Link x Imp x Uniq x 9.075`, roughly nine reasons' worth, uncapped. The app says the row carries impact `2.96 x linkage x 10`, about 27 points at linkage 0.9.

### Example Python, as the site would read it

This runs stand-alone with no library. The first half is the 2025 script with the keys fixed; the second half calls the engine for the starting points shown in the table above.

```python
# The site's keys and weights (tools/static-site/evidence.py, ESIW). Three of the eighteen:
evidence_categories = {"statistics": 0.90, "rct": 0.85, "meta": 0.80}

evidence_data = {
    "study_1": {"category": "statistics", "erq": 5,  "erp": 90, "ecrs": 0.8},
    "study_2": {"category": "rct",        "erq": 10, "erp": 95, "ecrs": 0.9},
    "study_3": {"category": "meta",       "erq": 3,  "erp": 85, "ecrs": 0.7},
}

# The 2025 definition: displayed in the EVS column of every Evidence Ledger, read by no score
evidence_evs = {}
for study, d in evidence_data.items():
    esiw = evidence_categories[d["category"]]
    evidence_evs[study] = esiw * d["ecrs"] * d["erq"] * (d["erp"] / 100)
belief_evs = sum(evidence_evs.values())
print("Displayed EVS per study:", evidence_evs)        # 3.24, 7.2675, 1.428
print("Displayed EVS total:", belief_evs)              # 11.9355

# What the site actually scores: where each finding's own page starts, and how heavily
REP_CAP, k = 2.0, 1.0
for study, d in evidence_data.items():
    esiw = evidence_categories[d["category"]]
    p0 = 0.5 + 0.5 * esiw * (2 * d["erp"] / 100 - 1)
    w = k * REP_CAP * d["erq"] / (d["erq"] + 1)
    print(study, "starts at", round(p0, 4), "with weight", round(w, 2))
    # study_1 0.86 / 1.67   study_2 0.8825 / 1.82   study_3 0.78 / 1.5
```

<details><summary>Original sketch (2023), not what runs</summary>

What runs instead is `prior()`, `evs()` and `classify()` in [`tools/static-site/evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py), with the keys and defaults given above; this sketch's category keys classify as no source under that code.

```python
# Example: Evidence category weights
evidence_categories = {
    "statistics_and_data": 0.9,
    "formal_scientific_studies_randomized_controlled_trials": 0.85,
    "formal_scientific_studies_meta_analysis": 0.8
}

# Example replication and relevance data
evidence_data = {
    "study_1": {"category": "statistics_and_data", "erq": 5, "erp": 90, "ecrs": 0.8},
    "study_2": {"category": "formal_scientific_studies_randomized_controlled_trials", "erq": 10, "erp": 95, "ecrs": 0.9},
    "study_3": {"category": "formal_scientific_studies_meta_analysis", "erq": 3, "erp": 85, "ecrs": 0.7}
}

# Calculate EVS per evidence
evidence_evs = {}
for study, details in evidence_data.items():
    esiw = evidence_categories[details["category"]]
    evs = esiw * details["ecrs"] * details["erq"] * (details["erp"] / 100)
    evidence_evs[study] = evs

# Overall EVS for the belief
belief_evs = sum(evidence_evs.values())

print("EVS per study:", evidence_evs)
print("Overall EVS for belief:", belief_evs)
```

</details>

## Standing: the verification lifecycle (app only)

The 2025 page never said what the V in EVS verifies. The app answers with a lifecycle that the site does not have, so a reader needs to know which "verification" is meant.

In the app every evidence row may carry a `verificationStatus`, and the engine multiplies both the row's impact and its EVS by a lifecycle weight (code: `VERIFICATION_SCORES` in [`src/core/reasonrank/types.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/reasonrank/types.ts); applied in `fetch-belief.ts`, `verificationWeight()`):

| Standing | Weight the row counts at | Exposure (points that could still move on standing alone) |
|----------|--------------------------|------------------------------------------------------------|
| Verified | 1.0 | 0 |
| Unverified | 0.5 | 0.5 x impact |
| Disputed | 0.5 | 0.5 x impact |
| Falsified | 0.0 (and the retraction cascades to every score built on it) | 0 (already fired) |
| Unrecorded (no status on the row) | 1.0 | 1.0 x impact, the largest kind |

The last row is deliberate and documented: legacy rows predate the lifecycle and keep full weight, "which is exactly why they carry the largest exposure" (code: [`evidence-exposure.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/evidence-exposure.ts), `countedWeight` and `exposedWeight`). Do not "fix" this by defaulting unrecorded rows to verified; the project instructions say so in as many words. The readout on the belief page reports how many of the points the belief draws from evidence rest on standing nobody has established, how many rows are counted in full on no record, how many are weighted by an unconfirmed `tierClaim`, and, above a share of `HIGH_EXPOSURE_SHARE = 0.5`, that the score should be read as provisional; exposure below `NEGLIGIBLE_EXPOSURE = 0.5` points is not reported, because the rounding on a single impact score is the same size as the finding. The repository's `/leverage` page lists these rows corpus-wide.

**The site has no lifecycle.** Every row there is the Unrecorded case and counts in full, and its ledger prints no Standing column rather than a column reading Unrecorded on every row; its columns are `Finding / Bears on / Starts at / Truth / Confidence / Linkage / Importance / Uniqueness / Score / EVS` (rules doc, Evidence Ledger section: "Standing is software only"). On the site, the nearest thing to a retraction is a finding whose own page has been argued down, or whose `erp` records that its replications disagree.

## Mechanisms in this area the 2025 page never mentioned

Each of these exists in code and bears on how evidence counts. None was on the 2025 page.

- **Sourcing as a component of confidence (site).** Confidence, the multiplier that says how much of the work behind a page has been done, has a `sourcing` component with weight 0.05 out of 1.00: for each evidence row, half a point for citing a source at all and half a point for naming what kind of source it is, averaged over the rows, because "an uncategorised citation is a reference, not a verification, and the scorer cannot weigh it against anything" (code: [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py), `STRUCTURAL` and `parts()`). See [[Confidence Stability Scores]].
- **Evidence filed above the premise it bears on (site).** A page's truth is `min(argued, weakest load-bearing component)`. So a belief can cite seven findings, argue itself to 0.61, and read 0.50 because a necessary premise beneath it cites nothing; a conclusion cannot be more settled than a premise it needs. The structural checks say so on the page: "Put each finding on the premise it is a finding about" (code: [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py)). Re-filing a finding is an editorial act, not a refactor, which is why beliefs 1 and 4 of the live corpus still read 0.50 with evidence on them.
- **"Rests only on authority or experience" (site).** A second check flags a page beneath which every claim cites an expert, an anecdote, a norm or a hunch, and nothing is a measurement or a record (`integrity.py`, same function).
- **Intake (site).** A finding added through the GitHub issue form arrives with no evidence type, and the maintainer is told so: "The finding has no evidence type yet, so it starts at a coin flip until one is filled in" (code: `intake.py`, `NOTES`). The browser-side checker, [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js), matches the typed text against every claim already filed so a duplicate becomes a vote for the existing finding rather than a second row.
- **Grounding (app).** A separate engine answers "does this belief bottom out in evidence?": `direct = sum of tierWeight x |linkage|` over the belief's own evidence, `inherited = sum of |linkage| x grounding(child)` over argument edges, `grounding = raw / (raw + 1)`, saturating in [0, 1). Zero evidence anywhere in the subtree gives 0 ("Unfounded"); assertion volume cannot move it; a circular chain contributes exactly zero; one T1 study at linkage 0.9 gives 0.47 and three give about 0.73 (code: [`grounding.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/grounding.ts)). It reads the T-tier weights, so it inherits that table's status.
- **Conformance (site).** Pages 2 to 6 and 17 to 21 of the conformance corpus exist to pin this page's arithmetic: a confirmed statistic at 0.95; a statistic contradicted by 3 of 3 replications at 0.05 with weight 1.50; an observational finding at 50 percent agreement at 0.50; an unsourced assertion at 0.50; `Expert Claim` and `expert-claim` both at 0.80; "not a tier at all" at 0.50 with ESIW 0; `erq=0` at weight 1.00; `erp=150` at 0.95. `python3 conformance.py` prints "conforms" when the engine of record matches `expected.json`; a deliberate rule change means `python3 conformance.py --write` and a reviewed diff.

## Transparency

The 2025 page promised that all EVS calculations would be publicly visible, that all category assignments and scoring decisions would be open to community review, and that users could challenge evidence classification via the debate system. Status, promise by promise:

- **Calculations visible: implemented.** Every Evidence Ledger prints a Starts at figure with hover working, an EVS column, and totals under the table with both formulas and `k` filled in. The [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts) prints the eighteen-row tier table with both "starts at" columns and the formulas. The JSON, XML, SQL and SQLite exports carry an `evidence_tier` table and a `page_start` view that recomputes p0 and w. `conformance_corpus.json` and `conformance_expected.json` carry the tiers and the expected numbers, so a port can be checked without reading this repository's source. The app stores `evsScore` per row and has an explainer at `/algorithms/evidence-scores`, though that explainer describes the T-tier inputs in prose and prints no formula.
- **Category assignments open to review: visible, not contestable.** The ledger prints the tier under every finding ("Rests on: Statistics and data, with the source cited, 3 independent replications, 100% consistent") and the method page lists the classifications among the typed inputs with "an author's error". Review by reading is possible. There is no classification page, no form field that proposes a different `etype`, and the GitHub issue forms create rows or votes. **Proposed, not built.**
- **Challenge via the debate system: proposed, not built**, in both engines. The app's `tierClaim` / `tierVerified` pair is confirmation by a job or a human, not a debate, and a human editing a row through `/api/evidence/[id]` is an edit.

## Benefits, each with its real status

- **Encourages higher-quality evidence.** Implemented in both engines, with different magnitudes. On the site a confirmed statistic starts at 0.95 and a confirmed anecdote at 0.775; the gap is where the quality shows. In the app T1 weighs 1.0 and T4 weighs 0.25.
- **Rewards replication and consistency.** Implemented, but never linearly as the 2025 ERQ factor implied. The site caps replication at `2k` (`test_replication_is_bounded_so_volume_cannot_win`); the app uses `log2(ERQ + 1)`, unbounded but concave; only `tally.py` keeps the linear form, by the owner's direction. Consistency sets the direction on the site: 50 percent agreement starts every tier at exactly 0.50, and 0 percent agreement puts a statistic at 0.05.
- **Reduces bias from anecdotal or low-quality sources.** Implemented. Lower tiers move a claim less, not nothing: an anecdote confirmed starts at 0.775 and contradicted at 0.225; an eyewitness at 0.60 and 0.40; an artifact at 0.55 and 0.45. `test_a_weaker_source_moves_a_claim_less_than_a_stronger_one` pins the ordering. The owner's judgment, consistent with this: a weak source is still a contribution, and the way to beat it is a better source or an argument, not a filter.
- **Improves debate fairness and accuracy.** The owner's judgment, and the reason the whole table exists. The one measurable piece is on the site: a page cannot be moved by citing the same finding more often, and cannot be moved at all by citing a finding nobody has classified.

## Related and competing tables

Four other tables in this repository assign numbers to kinds of evidence, and a reader should know which ones are live. None of these four is read by any engine.

- The ReasonRank page's start values: meta-analysis 1.0, peer-reviewed study 0.8, anecdote 0.1, refuted evidence 0.0 (see [[ReasonRank: Google's PageRank for Arguments]]). `evidence.py` names them as the principle it implements and says they are "not what this file implements"; the eighteen tiers keep every starting point between 0.05 and 0.95 instead. The method page lists them under rules the engine does not run ([#notrun](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun)).
- `docs/ALGORITHMS.md`, "Evidence Type Defaults", as EQ ranges on 1 to 10: meta-analysis of RCTs 9-10, single large RCT 8-9, well-designed observational study 6-7, small study with no replication 4-5, expert opinion 5-6, anecdote or single case 1-2. Proposed; no engine reads it.
- `docs/EVIDENCE_QUALITY_SCORING.md`: `Evidence Impact = Quality Score (0-100) x Linkage Score (0-1)`, with quality from four methodology patterns, the first ("Transparent Measurement with Controls") at 40 percent weight. Proposed; the method page lists the four-ratings scheme among the wiki ideas the engine does not implement.
- The app's five T-tiers, above: live in the app, retired by the rules doc, absent from the site.

## The owner's direction, and where today's code differs from it

From CLAUDE.md, October 2026, as it bears on evidence:

- **Volume.** Count truly independent reasons, weigh pro against con, count contributions from the moment they are posted. The site's argued rule does the opposite for an unargued row (it counts zero); `tally.py` does what the direction says and is printed beside it. Comparison on real pages decides.
- **Evidence weight.** Prefer no ceiling, so a body of replicated work can outweigh opinion by 15 or 200 times. `tally.py` uses `ESIW x ERQ x ERP/100` uncapped for that reason. The site's starting point is capped at weight `2k` and p0 in [0.05, 0.95]; the app's `log2` is uncapped but slow. The direction and the site's bound are in open conflict and that is recorded, not hidden.
- **Votes.** Attention, never validity. Both engines' evidence paths agree; the 2025 page's "with voting" is the only place this page disagreed, and it is labelled above.
- **Linkage with no argument.** Start trusting (the site's `DEFLINK = 1`) and lower it when argued. The site's ECRS-as-linkage already does this; the app's default `linkageScore 0.5` does not.
- **Fallacies.** Not in this page's area except that a flag never moves a score, which means a flag on a finding's classification would be argued like any other claim.

## Open decisions for the owner

These are calls rather than bugs. The audit lists the options; this page lists the questions so a reader knows what is settled and what is not.

1. **Is EVS a score that ranks beliefs, or a displayed diagnostic?** The 2025 page said the former; the site computes the sum and refuses to let it rank; the app uses a bounded share; `tally.py` uses the uncapped product. Ratify one, or keep two names (EVS the sum, Starting point the prior) and say which the title means.
2. **Which source-type table is canonical:** the eighteen keys (sixteen from 2025 plus `record` and the 0.0 no-source default) or the app's five T-tiers? The two rank anecdote against news in opposite directions. Options include migrating the app onto the eighteen (with a data migration for its 26 seeded T-rows), publishing a mapping from the eighteen to T1 to T4, or keeping both and saying so.
3. **How should replication count enter:** linearly (2025 and `tally.py`), bounded `2n/(n+1)` capped at `2k` (site), or `log2(n+1)` (app)? Only ERQ = 1 agrees across all three.
4. **Is relevance a fourth typed factor or the linkage page?** The site says the linkage page and refuses a fourth factor; the app stores `conclusionRelevance` and `linkageScore` separately and multiplies relevance in three times.
5. **Should a finding's source type be argued on its own page,** like linkage, importance and uniqueness already are? If yes, the weight would come from the winning classification and the word "voting" leaves the page. If no, the method page's "Here it is typed" stands.
6. **Ratify or reject the two departures from the 2025 table:** `record` at 0.90, and the split RCT 0.85 / meta-analysis 0.80 rather than the reverse. Reversing the split is a conformance diff.
7. **Defaults.** Site: blank type 0.0, blank ERQ 1, blank ERP 100. App: blank type T3 (0.5), ERQ 1, ERP 1.0. A 0.0 versus 0.5 default for an unclassified source is the difference between no pull and half pull. A third option is to make `etype` mandatory at intake so the default never applies.
8. **What does the V in "Verification" mean now:** the source-type starting point (site), the Verified / Unverified / Disputed / Falsified lifecycle (app), or both under two names? The site has no lifecycle; adding one changes published numbers.

## Related pages

- [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]]: what the starting point feeds into.
- [[ReasonRank: Google's PageRank for Arguments]] and [[ReasonRank]]: the row rule and the walk that rank pages.
- [[Evidence to Conclusion Relevance Score]] and [[Linkage Scores]]: the factor this page's ECRS became.
- [[Confidence Stability Scores]]: where the `sourcing` component lives.
- [[Argument Scores from Sub-Argument Scores]] and [[The Redundancy Problem]]: how a finding's truth propagates upward, and why the same finding cited four times counts once.
- [[Media]] and [[Template: Media Analysis]]: a book or article is a container for findings, scored separately.
- [[Template: Belief Analysis]]: the Evidence Ledger columns on a belief page.
- Live: [the methodology page](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts), the [EVS note](https://myklob.github.io/ideastockexchange/beliefs/method.html#evs), the [constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants), and a belief whose ledger shows all of this: [Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html).
