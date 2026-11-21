# Evidence to Conclusion Relevance Score

The **Evidence to Conclusion Linkage Score (ECLS)** measures how strongly a piece of evidence (argument) supports or weakens a conclusion **if assumed true**. It helps us:

- Allocate points between arguments proportionally.
- Avoid **false cause** fallacies and other logical errors.
- Maintain **logical consistency** in debates.

That is the owner's definition, unchanged. The rest of this page says what the running code does with it, with the real formulas, constants and defaults, and where the code, the 2025 wiki page and the owner's October 2026 direction on scoring disagree. Nothing proposed has been dropped for being unbuilt; it is labelled proposed.

**One factor, three names.** This page is filed as "Evidence to Conclusion Relevance Score" and has always been titled "Evidence to Conclusion Linkage Score (ECLS)". The [[Evidence Verification Score (EVS)]] page calls the same thing ECRS, and [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py) uses "ECRS" in its EVS formula while the site's method page cites it as "wiki: Evidence to Conclusion Relevance Score". The code calls it **Link** or **Linkage Score**, and Prisma stores an enum `LinkageScoreType` with values `ECLS` and `ACLS`. They are all the same number: the multiplier on an argument row that says how much of the argument's truth reaches the conclusion it is filed under. The friendly essay on the idea is [[Linkage Scores]]; the page template is [[Template: Linkage Evaluation]].

**Two engines.** The repository runs two implementations that disagree. The **published site** is `tools/static-site/`, which builds [myklob.github.io/ideastockexchange/beliefs/](https://myklob.github.io/ideastockexchange/beliefs/index.html). The **Next.js app** is `src/core/scoring/`. A third, the **founding workbook** process in `src/lib/conclusion-score.ts` with SQL and PHP twins, is kept runnable for reference and wired to nothing; a fourth, `src/lib/ise-pages/`, is a proposed successor, also unwired. Where this page says "the site does", it means the first. "The app does" means the second.

## Why ECLS matters

Even a true statement may be irrelevant to a conclusion. The owner's example:

- "The grass is green" is true, but has **low linkage** to a carbon tax policy.
- "Global warming is real" has high linkage to a carbon tax, **if** the tax is proven to reduce global warming.

Notice the "if". The second claim's relevance depends on a third claim nobody has stated, that the tax reduces warming. That is the whole trick of a linkage score: it drags the hidden step into the open and gives it a page where it can be argued. A true claim with an unargued bridge to its conclusion is a suspension bridge with the middle span missing. It looks finished from either bank.

By assigning linkage scores, we:

- Prevent irrelevant truths from dominating discussions.
- Automatically adjust conclusion strength when supporting assumptions weaken.
- Build a **coherent network of interconnected reasoning**.

The app's explainer at `/algorithms/linkage-scores` ([`page.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/app/algorithms/linkage-scores/page.tsx)) teaches the same lesson with a carbon-tax table. Its numbers are illustrative constants typed into the page, not computed scores (code: the `carbonTaxRows` array):

| Conclusion: "We need a Carbon Tax" | Truth Score | Linkage Score | Why |
|---|---|---|---|
| "Carbon taxes reduce emissions in countries that implement them." | 0.85 | +0.90 | Direct evidence: shows the policy achieves its stated goal. |
| "Climate change is real and human-caused." | 0.95 | +0.60 | Context: establishes the problem exists, but does not prove this specific solution works. |
| "Many economists support market-based environmental policies." | 0.80 | +0.20 | Weak support: appeals to authority without showing the mechanism. |
| "Carbon has atomic number 6." | 1.00 | 0.00 | Irrelevant: perfectly true, completely unrelated to policy effectiveness. |

The same explainer carries a worked "Wrong parent" case (the Schiltz case): X is "Chief Judge Schiltz, January 2026: ICE violated 96 court orders in 74 cases"; Y is "MAGA broke the norms that constrain the powerful (insider trading, nepotism, financial disclosure)". The evidence is real, documented and damning, and the linkage still fails, because X is about executive defiance of judicial orders (a separation-of-powers argument) and Y is about wealthy people evading rules. Different mechanism, different parent. High truth, low linkage. The correct parent for X is "MAGA defies judicial constraint", not Y. The argument belongs in the graph; it just belongs under a different claim.

## The question every linkage page asks

On the published site a linkage is not a number somebody typed. It is a page whose claim is built by formula from the two pages it connects, so nobody rewords anything. The wording (code: `Corpus.question` in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), and the matching Excel formula in [`build_subpages.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/build_subpages.py); the same text in `src/lib/ise-pages/questions.ts`):

| Type of the row | The linkage page's claim |
|---|---|
| Argument or Evidence (Direction: Supports) | If it were true that: X, it would significantly strengthen the conclusion that: Y |
| Argument or Evidence (Direction: Weakens) | If it were true that: X, it would significantly weaken the conclusion that: Y |
| Prediction | If it were **observed** that: X, it would significantly strengthen (or weaken) the conclusion that: Y |
| Interest (a "bearing" page) | If it were true that: X, it would matter to the interest: Y |
| Media | The work: X supports (or weakens) the conclusion that: Y |

The Prediction variant is diagnosticity: a result both sides expect scores low. The Interest variant is how an importance page checks that a row really speaks to an interest it lists (see [[Likely Interests of Those Who Agree and Disagree]]). The Media variant asks whether a work supports the conclusion at all.

The site's formula says **significantly**. Three other places say **necessarily**: the header comment of [`build_pages.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/build_pages.py), section 3 of `docs/ALGORITHMS.md`, and the Next.js linkage page at `/arguments/[id]/linkage`, whose header frames the question as asked "at full strength (would it necessarily support Y?)" with the score as the answer by degree: 1.0 means Y must move if X is true, 0 means X can be completely true and Y does not budge, and in between means yes, but only if the named assumptions hold. [[Template: Linkage Evaluation]] uses "necessarily" too. The published pages' claim text is what readers argue about, so the word sets the bar a reason has to clear. Which word is canonical is an open question for the owner (below).

Every published linkage page prints this readout under its score (code: the `readout` formula in `build_subpages.py`):

> Linkage score N on 0 to 1 (wiki scale -1 to +1: 2N-1). X passes truth T x Link N = T x N to Y before Y's own Imp and Uniq. 1 = if X is true, Y must move; 0 = X can be true and Y does not budge.

A live example: the linkage page for "A holdings ban removes the conflict" under the belief that [barring members of Congress and the president from trading stocks would reduce the use of office for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html) is at [p/argu-holdings-ban-removes-barring-members.html](https://myklob.github.io/ideastockexchange/beliefs/p/argu-holdings-ban-removes-barring-members.html). At the time of writing the content tables hold 34 linkage pages (count from `tools/static-site/content/pages.csv`: 15 for arguments, 8 for evidence, 6 for predictions, 3 for media, 2 bearing pages for interests).

## Formula

The owner's formula, exactly as written in 2025:

```
ECLS(A, B) = (Σ Strength of Reasons to Agree with Linkage) / (Σ Total Strength of Arguments, Agree + Disagree)
```

Where:

- **A** = Evidence
- **B** = Conclusion
- Strength is determined by performance metrics from **user-generated pro/con reasons**.

ECLS ranges from:

- **0.0**: no reasons to agree with linkage.
- **1.0**: all reasons agree with linkage (none disagree).

That formula exists in the code in four shapes. Only one of them is the formula as written.

| Where | Rule | Range | Status |
|---|---|---|---|
| App, `calculateLinkageFromArguments` in [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts) | `A / (A + D)` over `LinkageArgument.strength`, clamped to [0, 1]; 0.5 with no arguments | 0 to 1 | **Runs.** This is what `/arguments/[id]/linkage`, `/api/arguments/[id]/linkage` and `propagateFromLinkageChange` compute. The wiki's form, exactly. |
| Published site, `Model._share` in [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py) | `(POS + w x p0) / (POS + NEG + w)`, the argued-truth rule, with `p0 = 0.5` and `w = k = 1` for a linkage page that cites nothing | 0 to 1, but never reaching either end with finite argued weight | **Runs.** The wiki's share shrunk toward the 0.50 starting point. Rule 5 of the conformance contract in [`conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py). |
| App, `scoreLinkageDebate` in `scoring-engine.ts`; founding workbook `linkageRatio` in [`conclusion-score.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/conclusion-score.ts); the SQL view `v_cs_edge_linkage` in [`conclusion_score_process.sql`](https://github.com/myklob/ideastockexchange/blob/master/sql/conclusion_score_process.sql) | `(A - D) / (A + D)`, signed | -1 to +1 | Built. `scoreLinkageDebate` is called only by the protocol demo (below); the workbook and SQL are reference implementations wired to no page. |
| Proposed successor, `share` in [`src/lib/ise-pages/score.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/ise-pages/score.ts) | `(pro + k x 0.5) / (pro + con + k)` over unsigned `Truth x Link x Imp x Uniq` rows | 0 to 1 | Built, tested, unwired. |

**How the two 0-to-1 forms relate** (calculation from the code). The site's `_share` is the wiki's agree share with one extra neutral vote of weight `k = 1` at 0.50 mixed in. One unopposed reason whose signed contribution is 1.0 reads `(1 + 0.5) / (1 + 1) = 0.75`, not 1.0. At the site's defaults the gap is wider still: a reason whose own page is argued to truth 1.0 with confidence 1 and no importance page contributes `(2 x 1 - 1) x 1 x 1 x 0.5 x 1 = 0.5` (importance defaults to `DEFIMP = 0.5`), so the linkage page reads `(0.5 + 0.5) / (0.5 + 1) = 0.667`. Pile on reasons and the starting vote stops mattering; the share approaches the wiki's as the argued weight grows. The site's definitions block puts it this way (code: `_defs_linkage` in `build_subpages.py`): the wiki's `(A - D) / (A + D)` form is `2 x this score - 1`, once enough is argued that the starting point no longer matters. That conversion, `2 x Link - 1`, is what the "wiki scale" in the readout prints.

**Why the signed form exists.** On a -1 to +1 scale a reason can do more than fail to support its conclusion; it can actively contradict it, and the sign carries that. `scoreLinkageDebate` documents it so: +1.0 means all arguments fully support the link (deductive proof), 0.0 means equal support and opposition, -1.0 means all arguments oppose the link (active contradiction). The site reaches the same effect a different way: a row's **truth** enters on the -1 to +1 scale as `(2 x Truth - 1)`, so a claim argued false counts against the side it was filed on, and the linkage multiplier stays a probability. Which scale is canonical is an open question (below).

**What "strength" means in each engine.** The wiki says strength comes from "performance metrics from user-generated pro/con reasons". Nothing reads a performance metric:

- On the site, each reason on a linkage page is itself a claim with its own page, and its strength is `sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq`, every factor read from a page or a labelled constant (code: `_contrib` in `score_reference.py`). Nothing typed is a score.
- In the app's belief-page path, strength is a typed `Float` on `LinkageArgument` with default 0.5, posted through `POST /api/arguments/[id]/linkage` with body `{side, statement, strength}`. The schema itself calls it "the legacy manual weight feeding the (A - D)/(A + D) aggregate until every row carries a computed score" (code: [`schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma), model `LinkageArgument`). `LinkageArgument.score` (`Float?`) is the intended computed replacement, used today only to rank rows, never in the aggregate.
- In `scoreLinkageDebate`, strength is each sub-argument's `rawImpact` from the recursive `scoreArgument`.
- In the workbook and SQL, strength is a count: one entry, one point.

**The range.** `calculateLinkageFromArguments` matches the wiki: 0 when none agree, 1 when all agree, pinned by tests in [`scoring-engine.test.ts`](https://github.com/myklob/ideastockexchange/blob/master/tests/unit/core/scoring/scoring-engine.test.ts). The site's page cannot reach 0.0 or 1.0 with finite argued weight, for the reason worked out above. One inconsistency inside the app a reader will meet: `/api/arguments/[id]/linkage` and the `FormulaBreakdown` box on `/arguments/[id]/linkage` print `(Agree total - Disagree total) / (Agree total + Disagree total)` as the label while the number both display comes from `A / (A + D)`; the explainer likewise gives the signed form and "from -1.0 (actively contradicts) to +1.0 (deductively proves)" for a product path that computes 0 to 1. The label is wrong, not the number.

## Where a linkage starts before anyone argues it

The 2025 page makes an undebated linkage read 0.0 ("no reasons to agree"), and the sample code below returns 0 when the total is 0. **No engine the product runs does this**, and the published one argues the opposite in print. Every real default:

| Engine and place | An undebated linkage reads | Basis |
|---|---|---|
| Published site, row with no linkage page | **1**, the labelled constant `DEFLINK` | `CONSTS = {'K': 1, 'UNARG': 0.5, 'DEFLINK': 1, 'DEFIMP': 0.5, 'DEFUNIQ': 1}` in `score_reference.py`. The label in `build_pages.py`: "A reason placed under a conclusion is presumed relevant until a linkage page says otherwise; the burden is on the challenger." The belief page prints it in grey as "No linkage page yet: presumed relevant, reads 1" (code: `render_site.py`), and the [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants) lists it among the labelled constants. |
| Published site, linkage page opened but with no rows | **0.50**, the neutral start | `_share(0, 0)` with `p0 = 0.5`, `w = 1`. The check table says "No reasons yet: the page reads the neutral start, 0.50" (code: `build_subpages.py`). So opening a linkage page and arguing nothing halves the row until someone argues it back up. That is a calculation from the code and a wrinkle worth knowing. |
| Proposed successor `src/lib/ise-pages/` | **1** (`DEFLINK`) | `DEFAULT_CONSTANTS` in [`types.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/ise-pages/types.ts): "Linkage presumed when no linkage page exists: the burden is on the challenger." |
| Founding workbook, `linkageRatio` | **1** (`fallback = 1`) | "assume the reason is on topic until someone argues otherwise" (`conclusion-score.ts`). |
| SQL view `v_cs_edge_linkage` | **1.0** | `CASE WHEN COUNT(e.entry_id) = 0 THEN 1.0`. |
| App, `calculateLinkageFromArguments` | **0.5**, "maximum uncertainty; no information either way" | Pinned by `should return 0.5 for empty arguments` in `scoring-engine.test.ts`. The linkage page shows a pending label, "computed from the linkage argument tree below", instead of a badge when there is no debate. |
| App, `scoreLinkageDebate` | **0.0**, "neutral, not assumed relevant" | Only the protocol demo calls it. |
| App, Prisma `Argument.linkageScore` | **0.1** | `linkageScore Float @default(0.1)`; `AddArgumentForm.tsx` says linkage "starts at the schema default and is debatable on the argument's linkage page". |
| App, Prisma `Evidence.linkageScore` | **0.5** | `linkageScore Float @default(0.5)`. |
| 2025 wiki | 0.0 | **Proposed and contradicted by design.** |

Four live defaults, none the wiki's. The site's README records why `DEFLINK` matters more than its one line suggests: a mutation sweep changed every constant in the five scoring modules one at a time and re-ran the suite, and `DEFLINK`, `DEFIMP` and `DEFUNIQ` survived, "because almost no row has a linkage, importance or uniqueness page yet", so these constants are "the multipliers most rows in this corpus actually read" (code: [`README.md`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md), "What a mutation sweep found"). The belief page's scorecard counts the rows still resting on the presumption as `NOLINK`, "Rows with no linkage page" (code: `build_pages.py`; `s['nolink']` in `render_site.py`), so the presumption is visible rather than silent.

**The owner's direction (October 2026)** settles the principle: start trusting, lower it as people show a reason is unrelated or invalid, and let a link that is argued well rise, so contributors stay engaged; any sensible starting guess (the contributor's record, topic relatedness, an AI estimate, or 0.5 where tokens are short) is acceptable. The published site's `DEFLINK = 1` with an argued page that can move it either way is that rule. The app's 0.5 is a permitted starting guess under the same direction. The wiki's 0.0 is the one choice the direction rules out: it would zero every row until someone proved its relevance, which tells contributors their work counts for nothing until somebody else does more work.

## Example mottos

The owner's five slogans, kept as written. Status: not implemented; no code, template or page carries any of them. They are copy, not a mechanism.

1. Making connections: Avoiding non-sequiturs with linkage scores.
2. Linkage scores: The missing link in practical reasoning.
3. Untangling ideas: Weaving a rational web.
4. Cutting causation confusion with linkage scores.
5. Bridging the gap between arguments.

## Algorithm

The 2025 page gave seven steps. Each is kept, with what runs beside it.

### 1. Identify potential linkages

*2025:* Allow users to tag one belief as a reason to support or oppose another.

*Status: implemented.* On the site every belief page carries an add-a-reason form under each side of its argument table. There is no server: the form is a plain GET to a prefilled GitHub issue, and the intake Action ([`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py)) turns the issue into a row in `content/edges.csv` or, when the claim already exists, into a vote (code: `add_form` in `render_site.py`; README, "People take part through GitHub"). [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) checks what is typed against `data/claims_index.json` as the reader types, so a duplicate becomes a vote for the claim already there. In the app, `AddArgumentForm.tsx` posts an `Argument` row with `side` "agree" or "disagree" linking a child belief to a parent belief; the form submits no score.

### 2. Assign unique IDs

*2025:* Each linkage gets a unique identifier (e.g., `A_B` = Belief A supports Belief B).

*Status: implemented, with different identifiers.* Nobody uses the underscore form.

- The site keys a linkage page as `<tag>-<three-word slug of X>-<two-word slug of Y>`, where the tag is the first four letters of the row's Type (`argu`, `evid`, `pred`, `inte`, `medi`, or `link` when no type is set), suffixed `-2`, `-3` on collision (code: `specs_to_tables` in [`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)). The key is a column in `pages.csv` and the URL is `p/<key>.html`. Example: `argu-holdings-ban-removes-barring-members`.
- The app keys the edge by `Argument.id`; the debate lives at `/arguments/[id]/linkage`, and `LinkageFiveStepCheck.argumentId` is `@unique`.
- The workbook and SQL use a `reason_id` such as `ez1-z2` with a unique `(conclusion_id, child_id, side)` constraint.

### 3. Collect pro and con arguments for each linkage

*2025:* Users submit reasons **for** ("strengtheners") or **against** ("weakeners") the linkage.

*Status: implemented, with different words.* On the site the linkage page's single two-sided table is "Linkage Arguments": "Reasons to agree that X bears on Y" and "Reasons to disagree that X bears on Y". Every reason there is about whether X bears on Y, never about whether X or Y is true; each has its own page for that. A Pattern column names the shape of each reason, four starters per side (code: `KINDS['linkage']` in `build_subpages.py`):

| Side | Pattern | Meaning |
|---|---|---|
| Agree | Mechanism | X leads to Y through a named pathway with few steps. |
| Agree | Necessity | No realistic way for X to be true without Y moving. |
| Agree | Scope fit | Same people, place and time. |
| Agree | Monotonicity | More X means more Y across the whole range. |
| Disagree | Missing step | X reaches Y only if a hidden assumption holds. |
| Disagree | True but irrelevant | X can be true and Y does not budge. |
| Disagree | Scope mismatch | X is about a different population, scale or time. |
| Disagree | Wrong parent | X really supports a different claim than Y. |

The patterns are starters, not fixed content; rows enter and rank by their own scores, never by pattern order. The app's `LinkageArgument.pattern` holds the same idea (its schema examples: "Mechanism", "Necessity", "True But Irrelevant", "Parent-mechanism mismatch").

Separately, every reason or finding row on a belief page carries **"Bears on this: yes / no"**, a vote on the argument as an argument rather than on its claim. It is stored in `content/votes.csv` with the `on` column set to the page the row sits on, counted apart from votes on whether the claim is true, shown with the words "votes, not a score", and never read by the engine (code: `relevance_links` and `edge_vote_links` in `render_site.py`; README, "A vote never moves a score"). The linkage page for that row, when there is one, takes the same vote on its heading with the same counts, under the lead "Does it bear on that page?". A row with an importance page also carries "Matters here: yes / no".

The words "strengthener" and "weakener" survive in code only as a `LinkageType` value in `scoring-engine.ts` and in section 3 of `docs/ALGORITHMS.md`, where they name a kind of edge, not a side of the linkage debate (next section).

### 4. Score each reason

*2025:* Use a `calculate_argument_strength()` function based on voting, credibility, and other metrics.

*Status: contradicted by design on the published site; partly built in the app.* The site's standing rule is that **a vote never moves a score** (README; `VOTE_NOTE` in `render_site.py`; `NO_MOVE` in `intake.py`: "A vote never moves a score; the page shows it next to what the analysis says, as what people think."). A reason's strength on a linkage page is its own page's argued truth times confidence, link, importance and uniqueness, every one read from a page. Credibility enters only as the evidence prior on the claim's own page, never as a multiplier on the row: "Source quality is deliberately not a factor here. It belongs to the claim, not to the place the claim is cited" (code: `_contrib` in `score_reference.py`). Behavioural signals (votes, visitors, dwell time) carry weight zero in [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py).

The app holds the wiki's mechanism in one place that runs and one that does not:

- **The protocol demo.** `/protocol/[id]` and its route `/api/protocol/[id]/linkage` ([`route.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/protocol/%5Bid%5D/linkage/route.ts)) take a linkage vote through a diagnostic wizard (direction `support` or `oppose`; `is_relevant`; strength `proof`, `strong`, `context` or `weak`; an optional `score_override` in [-1, 1] "for AI agents"; a `weight` from 0 to 10, default 1.0). `aggregateLinkageVotes` returns the weighted mean of vote scores clamped to [-1, 1]; `resolveLinkageScore` then picks, in priority order, a full `LinkageDebate` scored by `scoreLinkageDebate`, else the vote aggregate, else the static `linkageScore`. The beliefs it operates on come from in-memory sample data (`schlicht-data.ts`), not the database, and none of it touches a belief page.
- **The `LinkageVote` table.** `prisma/schema.prisma` has a `LinkageVote` model (`score Float`, `weight Float @default(1.0)`, `direction`, `isRelevant`, `strength`, unique per `(argumentId, userId)`). The only code that reads it is the battlefield players API, which averages a user's vote scores for a leaderboard. Nothing feeds a `LinkageVote` row into an argument's `linkageScore`.
- The explainer still promises that "Community votes on linkage are weighted by each voter's established reputation in logical reasoning, not general popularity." The `LinkageVote.weight` field is where that would live; nothing sets it from a reputation.

**The owner's direction** on votes: votes may decide what is promoted and given attention, never what is valid; track what is popular apart from what stands up to analysis, and show the gap. The site does exactly this (the [Votes vs the analysis](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes) list ranks the gap once three people have voted on a claim). The 2025 step 4, as written, is therefore **refused by design** on the site. A vote files a reason; a reason is argued; the argument moves the score.

### 5. Compute ECLS

*2025:* For each linkage, `ECLS = (Σ Strength of Agree Reasons) / (Σ Strength of All Reasons)`.

*Status: partial.* Exactly as written in the app's `calculateLinkageFromArguments`; shrunk toward 0.50 by the starting weight `k = 1` on the published site; signed in `scoreLinkageDebate`, the workbook and SQL. See the formula table above.

### 6. Apply linkage weight

*2025:* Multiply each argument's truth/relevance score by its ECLS to determine its **actual contribution** to the conclusion.

*Status: partial. Linkage multiplies, but never alone.*

| Engine | What a row contributes | Code |
|---|---|---|
| Published site | `sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq` | `_contrib` in `score_reference.py`; printed on the [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula) |
| App, `scoreArgument` | `rawImpact = ReasonRank x linkage x importance x uniqueness`, signed by side | `scoring-engine.ts` |
| App, belief-page propagation | `impactScore = sign x childTruth x |linkage| x importance x uniqueness x 100`, rounded to one decimal; `|linkage|` so the filed side alone sets direction | `computeArgumentImpactScore` in `scoring-engine.ts`, called from [`propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts) |
| App, simple impact | `round(truth x linkage x importance x 100)`, negated for con | `calculateArgumentImpact` |
| App, explainer | "Master Formula": Truth x Linkage x Importance | `/algorithms/linkage-scores` |
| App, linkage page | "Contribution to Y: argumentScore x linkageScore" | `/arguments/[id]/linkage`, the closest to the wiki's two-factor product |
| Founding workbook | `childScore x linkage`, then `x m = 0.7` (the workbook's `Index!O1`; the per-sheet formulas predate that cell and use `m = 1`) | `conclusion-score.ts` |
| `tally.py`, the owner's rule printed beside the truth score | `Truth x Linkage x Importance x Uniqueness x (1 + ESIW x ERQ x ERP/100)` for a finding; the same without the evidence term for a reason or prediction | [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) |

On the site, Truth enters on the -1 to +1 scale, so a refuted reason counts against its own side and an unargued one at 0.5 contributes exactly 0; Confidence ([`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py)) scales the row by how much of the work behind the claim's page has been done; Importance (`DEFIMP = 0.5` with no page) and Uniqueness (`DEFUNIQ = 1` with no page) multiply too. The 2025 two-factor product is the founding simplification these generalise.

### 7. Aggregate for conclusion score

*2025:* Sum weighted contributions from all supporting/weakening evidence.

*Status: partial. Every engine sums signed contributions; what it does with the sum differs, and the wiki's plain sum describes none exactly.*

- **Published site:** `belief score = POS - NEG` (open-ended) and `truth = (POS + w x p0) / (POS + NEG + w)`, then `min` with the weakest load-bearing component that has its own page (code: `Model.evaluate`; conformance rules 4 to 6). `POS` and `NEG` are the positive and negative contributions as magnitudes, so a row lands on the side its sign puts it on, not the side it was filed on.
- **App:** `scoreArgument` normalises the net of pro and con sub-arguments by their count, maps it to `subArgScore = 0.5 + normalizedNet x 0.5`, and blends `ReasonRank = (1 - d) x baseTruth + d x subArgScore` with `DAMPING_FACTOR d = 0.85` (15 percent from the argument's own truth, 85 percent from its sub-arguments). `scoreProtocolBelief` and `all-scores.ts` use `A / (A + D)`.
- **Founding workbook:** `score(C) = nAgree - nDisagree + m x (Σ agree childScore x linkage - Σ disagree childScore x linkage)`: one structural point per listed reason, whatever its linkage, plus 0.7 times what each reason's own debate has earned.

This is where the two engines disagree about **volume**, recorded in `CLAUDE.md` as open decision 1: on the site a listed reason nobody has argued is worth exactly zero; in the app, listing an unargued pro row raises the score. The owner's direction (October 2026) is to start from the quantity of truly independent reasons, rank their validity against each other, and let the weight of pro against con decide, with contributions counting from the moment they are posted. `tally.py` is that starting rule, printed on every belief page beside the argued truth score and read by no other number, so the two can be compared on real pages before either leads. For choices of action the question is different: costs and benefits across every stakeholder with a legitimate interest, scored in the cost-benefit section ([method page, costs and benefits](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba)).

## What else reads the linkage score

The 2025 page stops at "aggregate for conclusion score". The site reads Link in eight more places, none of which the page mentions. Each is a calculation from the code named.

| Reader | What it does with Link | Code |
|---|---|---|
| `NOLINK` on the scorecard | Counts scored rows whose Link is still `DEFLINK`: "their relevance has not been argued. The presumption favors the row; each of these is a claim nobody has challenged yet." | `build_pages.py`; `render_site.py` |
| `LINKSHARE`, "Reasons whose linkage leans against relevance" | Share of scored reasons on both sides whose linkage page reads below 0.5: "the sides accept the fact and argue about whether it bears on the belief." | `build_pages.py`; `render_site.py` |
| Kind of dispute | Whichever of evidence two-sidedness, `LINKSHARE` and the value gap (divided by 3, capped at 1) leads the other two by at least 0.1 names the page a Factual dispute, a **Linkage dispute** or a Values conflict; otherwise Mixed dispute. Feeds the [Hardest to resolve](https://myklob.github.io/ideastockexchange/beliefs/lists.html#hardest) list and the misunderstanding index, `(LINKSHARE + 1 if a definitional dispute is on the table) / 2`. Changes no score. | `render_site.py`; [method page, kind of dispute](https://myklob.github.io/ideastockexchange/beliefs/method.html#dispute) |
| Falsifiability index | The share of a belief's predictions that have a deadline **and** a linkage page reading at least 0.5: dated, and argued to be diagnostic. | `render_site.py` (`s['falsif']`) |
| Confidence, testability component | Structural only: a prediction counts if it is dated and someone has **opened** a linkage page for it. Deliberately never reads the linkage truth, so confidence cannot recurse through the scorer. | `confidence.py` |
| ReasonRank, the dependence walk | Steps from a page to the pages it reads in proportion to `capacity(row) = Link x Imp x Uniq`. "A linkage page argued down to 0.2 really does transmit less, whatever happens to the claim", and "a linkage argued to 0 kills a row exactly as thoroughly as a claim argued false." | [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py); see [[ReasonRank: Google's PageRank for Arguments]] |
| Sensitivity | A linkage page is an input like any other: its truth is pinned and swept 0 to 1 to find whether, and where, the belief flips across 0.5. "Multiplier pages count: a linkage page is an input to the conclusion exactly as the claim is." | [`sensitivity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py); [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity) |
| EVS display | The 2025 `EVS = ESIW x ECRS x ERQ x (ERP/100)` is still computed for display with the row's linkage standing in as ECRS, "so this reuses the linkage page rather than adding a fourth thing to argue". No ranking reads it. | `evs(row, ecrs)` in `evidence.py`; [[Evidence Verification Score (EVS)]] |

The app has one more: **Decision Leverage** ([`decision-leverage.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts), explained at `/algorithms/decision-leverage`, worked at `/leverage`) ranks a belief's edges by the conclusion score still at stake on each. Its transmission weight is `|linkage| x importance x uniqueness x 0.5^depth`, the impact formula with truth factored out, and one of its four resolution gaps is **linkage** at weight 0.25, measured as `1 / sqrt(1 + votes)` in the edge's linkage sub-debate: "An undebated linkage is an assumption, not a finding: the engine's default linkage value is doing the work, and nobody has checked it." The other gaps are evidence 0.40, scoring 0.15 and examination 0.20.

## Mechanisms the 2025 page never named

### Two sub-types: ECLS and ACLS

The app stores which kind of edge a linkage sits on (code: `enum LinkageScoreType { ECLS ACLS }` in `schema.prisma`): **ECLS**, Evidence-to-Conclusion Linkage Score, raw data to a belief, the default on `Evidence` rows; **ACLS**, Argument-to-Conclusion Linkage Score, a belief to its parent belief, the default on `Argument` rows. Both are scored by the same function. The explainer says they are "queried, displayed, and updated through separate data paths to maintain precision". The site makes no such distinction: an argument row and an evidence row each take a linkage page by the same rule, with the Type field (Argument, Evidence, Prediction, Interest, Media) changing only the question's wording.

### The five-step placement check and the 0.7 flag

Every linkage page carries a check table (code: `specific()` in `build_subpages.py`; the HTML version in `render_site.py`):

1. Exact wording of Y, read from its page.
2. Exact wording of X, read from its page.
3. How X bears on Y, in one sentence. If this sentence cannot be written cleanly, X probably does not bear on Y. (This is the `bridge` column in `pages.csv`.)
4. Computed linkage score, never a hand estimate: "N from a reason(s) to agree and b to disagree", or "No reasons yet: the page reads the neutral start, 0.50".
5. Flag if below 0.7, a working rule of thumb: "Flagged: the action is to find better evidence for Y, not to reach with X."

The app's `LinkageFiveStepCheck` model stores the same five steps per argument (`parentWording`, `sourceWording`, `mechanismSentence`, `provisionalEstimate` with a `dominantFactor` of relevance, network strength, contextual fit or uniqueness, and `flagNote`). Its step 4 is "a placement-time bracket only": the **audit lock** on the linkage page says linkage scores are computed from sub-arguments, never assigned by hand, and if the score changes, the change traces to a specific edit in the linkage argument tree. The 0.7 threshold is the owner's judgment, labelled a rule of thumb in both places. Nothing is scored by it.

### The linkage page's other sections

Beyond the argued table, the template ([[Template: Linkage Evaluation]]; [`linkage-evaluation-template.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/linkage-evaluation-template.html)) gives a linkage page: Equivalent Rephrasings of X and of Y (the app computes a **drift**, the rephrasing's linkage minus the canonical linkage, signed); Failure Mode Worked Examples; Where Else X and Y Are Used (each row another linkage page, since one argument can have a 0.90 linkage to one conclusion and 0.15 to another, stored separately); Hidden Assumptions Required (what must also hold for the linkage to hold, or to fail; see [[Assumptions]]); Bias Risks Specific to This Linkage (biases that inflate, and that deflate, this score); Definitions and Scoring Concepts; Where This Page Is Used; Scoring Engine; Contribute. On the site every one of those tables takes a form that files a row.

### Four linkage types, replacing a weighted sum

Section 3 of `docs/ALGORITHMS.md` records an older formula, now deprecated: `LS_old = (DR x 0.40) + (CS x 0.30) + (NC x 0.20) + (SC x 0.10)`. It was replaced by the sub-debate, and the four variables became metadata tags that seed the framing of the debate, with no weight:

| Type | Question | Example |
|---|---|---|
| Causal | Does the evidence represent a direct cause of the conclusion? | "Smoking causes lung cancer": evidence of carcinogens in tobacco |
| Necessary Condition | Is the evidence a requirement for the conclusion to be true? | "Democracy requires free speech": evidence of censorship effects |
| Sufficient Condition | Is the evidence alone enough to prove the conclusion? | "DNA match at crime scene": sufficient to place the suspect there |
| Strengthener/Weakener | Does the evidence modify the probability without being a hard requirement? | "Economic growth correlates with education": statistical evidence |

`generateLinkageSubClaim` in `scoring-engine.ts` builds the sub-claim from them: `"X" is a direct cause supporting "Y"`, `is a necessary condition for`, `is sufficient to prove`, `strengthens the case for`. Nothing on a page calls it; the site builds its question from the Type and Direction fields instead.

### Classification bands, the diagnostic wizard and depth attenuation (app)

`classifyLinkageScore` names a score (code: `scoring-engine.ts`): `CONTRADICTION` at or below -0.5; `IRRELEVANT` when `|score| < 0.05`; `ANECDOTAL` below 0.35; `CONTEXTUAL` below 0.65; `STRONG_CAUSAL` below 0.95; `DEDUCTIVE_PROOF` otherwise. `calculateLinkageFromDiagnostic` turns wizard answers into a score: not relevant gives `0.0` and `NON_SEQUITUR`; otherwise `proof` 1.0, `strong` 0.8, `context` 0.5, `weak` 0.2, negated when the direction is `oppose`. The explainer's four diagnostic questions are Direction (support or oppose), Relevance (if proven 100 percent true, would it force an update?), Necessity (if proven false, would the conclusion suffer significantly?) and Sufficiency (does it alone justify the conclusion?). All of this runs only in the protocol demo.

`applyDepthAttenuation(score, depth) = score x 0.5^depth`: level 0 full weight, level 1 half, level 2 a quarter, so "whoever can construct the longest theoretical chain" is not rewarded. The linkage API and page compute and display it; `Argument.depth` carries the level; Decision Leverage uses the same 0.5. The site has no depth attenuation of linkage: a linkage page's truth is read as-is, and the structure of the graph does the discounting (a deep chain of unargued pages reads 0.50 at every level, so it carries nothing).

### "True but Irrelevant" and the missing-assumption prompt (app, protocol demo only)

`detectNonSequitur` flags an argument as a non sequitur when its classification is `NON_SEQUITUR` or `|linkage| < 0.05`, and as "True but Irrelevant" when `|linkage| < 0.1` and `truthScore > 0.8`, with the message "True but Irrelevant: This argument is factually accurate but has near-zero logical connection to the conclusion." `shouldPromptForAssumption` fires when `|linkage|` is above 0.1 and at most 0.4, "suggesting that an intermediate belief could repair the chain". Both are called by `/api/protocol/[id]/linkage` and by nothing on a belief page. The explainer says the prompt fires "in the moderate range (40 to 60%)", which does not match the function's 0.1 to 0.4 band; the code is what runs. On the site the same idea is a Pattern on the disagree side ("True but irrelevant", "Missing step") and a reason somebody writes, not a flag software raises.

### Fallacies are argued, not detected

The 2025 page's second bullet, "avoid false cause fallacies", reads as detection. No engine pattern-matches for false cause or any fallacy and deducts. The method page is blunt (code: `method.py`, the structural-checks section): "Fallacy detection is not done. The wiki specifies pattern-matching the prose for ten named fallacies, each deducting from a score. On a site whose subject is often officials acting on their own interests, a matcher looking for 'attacking the person rather than the argument' would fire on the central legitimate argument on page after page, and a score moved by a pattern match has no page anyone can argue with. A fallacy is argued instead, as a reason to disagree on the linkage page of the row it infects." The workbook's how-to says the same: "What a fallacy accusation does: nothing by itself. 'This is a straw man' is a reason to disagree on the argument's linkage page; 'this study cherry-picks' is a reason to disagree on the finding's page" (code: `HOWTO` in `build_pages.py`).

What the site does do, under the owner's direction that software may flag and nothing is final: [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) flags a reason or objection whose wording matches a published phrase list, as a **question** on the belief page with the words that set it off and two prefilled forms on the flagged claim's own page, a reason to disagree saying it is the fallacy and a reason to agree saying it is not. The flag decides nothing and moves no score; whatever the argument concludes reaches the score through the ordinary rules ([method page, structural checks](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks)).

The app's version of the same rule: a detector may draft a `LinkageArgument` with `status` "draft", `targetFactor` "relevance" (or "logical-validity" or "evidence-quality") and a `fallacyType` such as "ad-hominem" or "cherry-picking". Drafts are displayed and never counted: the linkage page filters to `status === 'published'` before summing, and so does `propagateFromLinkageChange` (code: `/arguments/[id]/linkage/page.tsx`; `propagate-belief-scores.ts`). A `FallacyClaim` publishes its counter-argument only on weighted consensus of at least 60 percent (`src/lib/consensus.ts`). "No score is ever docked by the act of accusing." One legacy path remains: `scoreArgument` still multiplies truth by `(1 - Σ |impact| / 100)` over `fallaciesDetected`, in the protocol type only, not wired to a belief page.

### Automatic adjustment when assumptions weaken

*Status: implemented in both engines.* On the site every score is a pure function of the two tables and is recomputed on each build, so a one-row edit to a linkage page moves every conclusion that reads it, and [`changes.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/changes.py) prints what moved since the last git revision ("A one-word edit to a linkage page can move forty conclusions"). In the app, `propagateFromLinkageChange` recomputes the argument's `linkageScore` from its published `LinkageArguments`, persists it, then walks every ancestor recomputing `impactScore`. The explainer's example: a study raises "CO2 traps heat" by 10 points; "Climate change is real", linked at 90 percent, gains 9; "We should ban gas cars", linked at 40 percent, gains 4. Those figures are illustrative; the site's actual arithmetic passes `(2 x Truth - 1) x Conf x Link x Imp x Uniq`, not `Truth x Link`.

## How ECLS integrates into the platform

The 2025 page's three claims, with status:

- *Each Belief Score will eventually be multiplied by its ECLS when used as a reason in another debate.* **Implemented**; the "eventually" has happened in every engine. A row's Truth is the child page's own truth score, read live, and Link is the truth of the edge's linkage page (code: `self.pg(cid) x self.pg(link_id, DEFLINK)` in `score_reference.py`; `A.impactScore = sign x B.truthScore x |A.linkageScore| x importance x uniqueness x 100` on every propagation in the app).
- *This ensures that only relevant, well-supported linkages significantly influence conclusions.* **Partial.** Because the published default is 1 and almost no row has a linkage page, the filter is a presumption of relevance that bites only once a challenger argues a linkage page down. The `NOLINK` count and the grey "presumed relevant" label make the presumption visible rather than silently filtering. That is the owner's direction (start trusting), not a gap.
- *ECLS acts as a logical filter, ensuring that reasoning chains remain coherent.* **Partial**, as above. The site adds a structural check the wiki never asked for: before anything is published, [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) refuses a claim that supports itself, because a loop can hold any value and stay consistent. A linkage page under a claim is not the claim supporting itself; multiplier pages are excluded from that check.

One stale line elsewhere: the 2025 Home page said this score "uses an adapted PageRank model to reflect collective judgment on relevance". No engine applies PageRank to linkage. ReasonRank's walk restarts at the beliefs and steps by `Link x Imp x Uniq`; it reads Link and does not set it.

## Original sketch (2023), not what runs

<details><summary>Original sketch (2023), not what runs</summary>

What runs instead is `Model.evaluate` in [`tools/static-site/score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), reading `pages.csv` and `edges.csv`, with the rule pinned language-neutrally by [`conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py) and the zoning reference in `examples/ise-zoning/score_reference.py`; in the app, `calculateLinkageFromArguments` in `scoring-engine.ts`. No shipped code measures strength by text length, and the sample's `else 0` default differs from every shipped default (1, 0.5, 0.1).

```python
# Example data
beliefs = ["Belief A", "Belief B", "Belief C"]
potential_linkages = {
    "A_B": [
        {"argument": "A is supported by strong evidence", "type": "strengthener"},
        {"argument": "A is irrelevant to B", "type": "weakener"}
    ]
}

linkage_ecls = {}

def calculate_argument_strength(arg_text):
    # Placeholder: replace with real scoring logic
    return len(arg_text) / 10  # Example: strength = length-based

for linkage, arguments in potential_linkages.items():
    agree_strength = 0
    total_strength = 0
    
    for arg in arguments:
        strength = calculate_argument_strength(arg["argument"])
        total_strength += strength
        if arg["type"] == "strengthener":
            agree_strength += strength
    
    ecls = agree_strength / total_strength if total_strength > 0 else 0
    linkage_ecls[linkage] = ecls

print("ECLS Scores:", linkage_ecls)
```

The sample's structure (a dict of linkages, each a list of typed reasons, agree share) is what the two-table page/edge model realises: a linkage page is a row in `pages.csv` (`kind` = linkage, with `x`, `y`, `type`, `direction`) and its reasons are rows in `edges.csv` with section `argument`.

</details>

## Future enhancements

The 2025 list, each with its status.

- **Integrate machine learning to detect weak/strong linkages automatically.** *Refused by design for the number; permitted for the flag.* The only code that produces a linkage number from a model is [`analysis-generator.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/ai/analysis-generator.ts), which prompts a model for "A linkage score (0-100%) for how directly it supports the thesis" and multiplies `truthScore x linkageScore / 100`. Nothing imports it into a page. `CLAUDE.md` states that a number a model asserted is "the one thing the published engine refuses to carry"; if any of `src/core/ai/` is ever wired to a page, its number needs a page arguing it like every other factor. Both linkage pages say so in print: "Computed linkage score (never a hand estimate)" on the site, and the audit lock in the app. The sanctioned shape is the detector-drafted counter-argument: a detection is an argument that moves nothing until published. An AI estimate as a **starting** guess is within the owner's direction on linkage; an AI estimate as the score is not.
- **Track ECLS over time to monitor debate stability.** *Partial.* The site computes what moved since the previous git revision at build time (`changes.py`: pages, scores, threshold crossings), which covers linkage pages like any other page but stores no time series. The app records belief-level score history on propagation (positivity and stability before and after) but no per-edge linkage history. No per-linkage stability metric exists. See [[Confidence Stability Scores]].
- **Visualize argument linkages with graph networks.** *Not implemented.* No graph rendering exists anywhere. ReasonRank treats the corpus as a network and reports how much depends on each page, and the linkage page links X and Y as text, but neither draws an edge.

## Open questions for the owner

Five disagreements between this page, the code and itself that only the owner can settle. The October 2026 direction answers the principle in each case; the implementation choice is still open.

1. **What should an undebated linkage read?** 1 (published site, `ise-pages`, workbook, SQL), 0.5 (app `calculateLinkageFromArguments`, `Evidence` rows), 0.1 (`Argument.linkageScore`), 0.0 (2025 wiki, `scoreLinkageDebate`). The direction says start trusting and any sensible guess will do, which rules out 0.0 and leaves the rest. Options: adopt the site's 1 everywhere and change the Prisma defaults; keep the defaults distinct per engine and say which a reader is looking at; or set the app's default from a stated starting guess (the contributor's record, topic relatedness, an AI estimate).
2. **Which share is the score?** The raw `A / (A + D)` the wiki states (app), the share shrunk toward 0.50 by `k = 1` (site), or the signed `(A - D) / (A + D)` on -1 to +1 (three engines and the explainer). Options: declare the site's shrunk share canonical, document `k`, and fix the app's labels or switch it to the same rule; declare the signed form canonical, which lets a row carry negative linkage, and change `score_reference.py`, `ise-pages` and the conformance file (`python3 conformance.py --write` and a reviewed diff); or keep 0 to 1 as the stored multiplier and present `2 x Link - 1` as a display scale, as the site's readout already does.
3. **May votes, credibility or reputation ever move a linkage score?** The site says never; the protocol demo's `aggregateLinkageVotes` says yes with weights; the `LinkageVote` table exists and feeds nothing. The direction says votes decide attention, never validity. Options: affirm the no-vote rule and delete `aggregateLinkageVotes`, the `LinkageVote` scoring path and the explainer's reputation sentence; keep reputation-weighted votes in the app only and say the two sites differ; or keep votes as a displayed signal with the vote-versus-analysis gap as their only outlet, the current state on the site.
4. **Should the two-factor contribution become the five-factor signed rule, and should an unargued listed reason count?** The site's `sign x (2 x Truth - 1) x Conf x Link x Imp x Uniq` makes an unargued reason worth 0; the app's `A / (A + D)` over `rawImpact` lets volume count; the workbook adds a structural point per reason before linkage applies. The direction leans toward counting contributions from posting, and `tally.py` publishes that rule beside the argued one for comparison. Options: document the five-factor rule as the formula and the two-factor product as the founding simplification; pick the app's rule and change the site and conformance; or keep both labelled until the comparison on real pages is done. (`CLAUDE.md` open decision 1.)
5. **"Necessarily" or "significantly"?** The site's formula and `questions.ts` build every published linkage claim with "significantly"; `build_pages.py`'s comment, `docs/ALGORITHMS.md` and the app's page header say "necessarily". Options: standardise on "significantly" and fix the comment, the doc and the header; standardise on "necessarily" and regenerate every linkage page's claim (claim text is not scored, so numbers hold, and `changes.py` will show the diff); or keep "necessarily" as the full-strength question and "significantly" as the degree, as the app's header already frames it, and say so here.

## Related pages

- [[Linkage Scores]]: the essay on true-but-irrelevant, the Gish Gallop and hidden assumptions.
- [[Template: Linkage Evaluation]]: the page a linkage gets, section by section.
- [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]]: the number Link multiplies.
- [[Evidence Verification Score (EVS)]]: where ECRS, this same factor, enters the evidence formula.
- [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]]: the recursion that reads Link, and the dependence walk that steps by it.
- [[Argument Scores from Sub-Argument Scores]]: how a reason's own debate sets the truth that Link then scales.
- [[Assumptions]]: the hidden steps a low linkage usually points at.
- [[The Redundancy Problem]] and [[Equivalency Score:]]: the Uniq factor that sits beside Link on every row.
- [[Likely Interests of Those Who Agree and Disagree]]: the bearing page, a linkage of Type Interest.
- [[Confidence Stability Scores]]: what "tracking over time" became.
- The site's [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula), its [labelled constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants) and its table of [rules the wiki states that the site does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun), where this page's agree-share rule is listed beside what runs instead.
- The app's explainer at `/algorithms/linkage-scores`, an edge's debate at `/arguments/[id]/linkage`, and its impact derivation at `/arguments/[id]/score`.
