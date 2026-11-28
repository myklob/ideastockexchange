# The Redundancy Problem

*[[Home]] > Page Design > **The Redundancy Problem***

**Why Volume Is Not Votes**

Imagine a courtroom where one side is allowed to call the same witness a hundred times. Same testimony, slightly different phrasing each time. The jury, overwhelmed by repetition, starts to feel that this side must have more going for it. They do not. They just have more words.

This is how every major debate platform currently works. Arguments do not have to be original to be counted. They just have to be posted. The side that can generate the most restatements of the same claim wins by volume, not by logic.

The Idea Stock Exchange breaks this exploit with **Duplication Scoring**: if two arguments are 90% saying the same thing, the second one contributes 10% of its score, not 100%.

The deeper insight is that most debates, once you strip the redundancy, reduce to a surprisingly small number of distinct underlying arguments. 147 variations of "Trump is unintelligent" collapse into perhaps three core claims, each with its own evidence base and counterarguments. Duplication scoring does not oversimplify the debate; it reveals the actual structure underneath the noise. (The 147 and the three are the owner's illustration, not a count anyone ran.)

Think of it as the difference between a choir and a crowd. A crowd of a hundred people shouting the same slogan is one idea at high volume. A choir of four singing four different parts is four ideas. A scoring rule that cannot tell the two apart will always hand the prize to whoever brought the biggest crowd.

## How this page is built

This is the owner's explanation, written for PBworks and never before on the GitHub wiki, kept whole, with every claim it makes checked against the code that runs today. There was no audit row for it, so each check below was done by reading the source and, where a number was at stake, running it. Where the code does something different, or something the owner's page never mentions, the page says so where it comes up, with the real formula, the real constants and a link to the file.

**Two engines, so two answers.** The repository has two scoring implementations, and on this subject they disagree about something basic: whether a computer is allowed to discount an argument for sounding like another one.

- **The published site** is [`tools/static-site/`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md). It builds [myklob.github.io/ideastockexchange/beliefs/](https://myklob.github.io/ideastockexchange/beliefs/index.html) from two flat tables, `pages` and `edges`. "The site" on this page means this one.
- **The Next.js app** is [`src/core/scoring/`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/duplication-scoring.ts) plus the database code that calls it. "The app" means this one.
- **The Python backend** the owner's page cites (`backend/algorithms/duplication_scoring.py`) no longer runs anywhere. It was moved to [`_archive/python-backend/algorithms/duplication_scoring.py`](https://github.com/myklob/ideastockexchange/blob/master/_archive/python-backend/algorithms/duplication_scoring.py) on 11 June 2026, in the commit that archived "the dead Python backend / Vite frontend / CRA client / Express server stacks". Its classes are described below as **archived**.

Every status label is one of: **runs on the site**, **runs in the app**, **built in the app, called by nothing but its tests**, **archived**, **proposed, not built**, **replaced** (and by what), or **refused by design** (and why). Every number is labelled with its basis: the code (with its file), a calculation from the code (which I ran), or the owner's judgment.

## What runs today, in one table

| Mechanism on the owner's page | Published site | Next.js app |
|---|---|---|
| Duplicate discount: the second of two 90%-alike arguments keeps 10% | **Replaced.** A row's Uniqueness factor is the truth score of an argued uniqueness page, or `DEFUNIQ = 1` when nobody has opened one. A computed similarity never enters it. | **Runs in the app.** `uniqueness = 1 - max similarity` to earlier same-side siblings, multiplied into every argument's impact score at propagation time. Layer 1 only. |
| Layer 1, mechanical equivalence (synonyms, negated antonyms, Jaccard 0.85) | **Replaced** by a lexical detector (IDF-weighted word overlap plus character 4-gram cosine) that flags pairs and scores nothing. | **Runs in the app** as `mechanicalSimilarity()`. |
| Layer 2, semantic overlap by sentence embeddings | **Refused by design** as a score input; the lexical detector is the stated stand-in. | **Built, never fed.** `blendSimilarityLayers()` accepts a Layer 2 number; nothing in the app produces one. |
| Layer 3, a sub-debate on "are these saying the same thing?" | **Runs on the site.** It is the uniqueness page and the equivalence page, argued like any other page, and it is the only thing that sets the factor. | **Archived** as `EquivalenceSubDebate`; the TypeScript accepts a community score that nothing supplies. |
| Clusters with one summary and a drill-down | **Partly.** The flag list and the "probably one page" verdict; merging is a human act. | **Built, called by nothing but its tests** (`clusterArguments()`). |
| Novelty premium, 1.25 decaying with a 24-hour half-life | **Not built.** | **Built, called by nothing but its tests** (`noveltyMultiplier()`). |
| Corroboration boost, `MAX_BOOST x (1 - e^(-0.5 x weightedN))` | **Replaced** by the bounded replication weight in `evidence.py` (ceiling twice k), and by the uncapped evidence strength in `tally.py`. | **Built, called by nothing but its tests** (`corroborationBoost()`). |
| A duplicate submission is caught at the door | **Runs on the site, and is not on the owner's page.** The form checks as you type; the intake Action re-checks and turns a duplicate into a vote. | **Runs in the app, and is not on the owner's page.** Ingestion stores equivalence candidates and puts a speed bump in front of a restatement. |

The rest of this page goes through each row in the owner's order.

## How similarity scoring works

Similarity scoring operates in layers, from simple and automatable to complex and requiring community verification. Arguments are organized by topic alignment, topic overlap score, intensity, and specificity, which positions similar claims side by side before any scoring begins.

**Status of the organizing step.**

- **Topic alignment runs on the site, by hand.** Every belief names one topic in the `topic` column of [`content/pages.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/pages.csv), topics have parents in [`content/topics.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/topics.csv), and every page beneath a belief inherits it. Each topic gets a page (for example [Government ethics](https://myklob.github.io/ideastockexchange/beliefs/t/government-ethics.html) or [Crypto](https://myklob.github.io/ideastockexchange/beliefs/t/crypto.html)); the whole list is [topics.html](https://myklob.github.io/ideastockexchange/beliefs/topics.html).
- **Intensity and specificity run on the site as typed labels.** A belief's `positivity` places it from -100 to +100 on its topic's axis, and its `strength` says how absolute it is: Modest (hedged), Moderate (definite but bounded), Strong (near-universal) or Total (no exceptions). Both are "typed, never scored" ([`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)). The belief page's Similar Beliefs section lists more extreme and more moderate wordings side by side, each with the truth of its equivalence page.
- **A computed topic overlap score is not on the site.** The method page says so: "Each belief is filed under one topic by an author; topic lists are ordered by counts of reasons" ([method.html#notrun](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun)). In the app, `calculateTopicOverlapScore()` in [`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts) is a thin wrapper over the Layer 1 check: uniqueness `1 - max similarity` per item, and a count of pairs at or above 0.85.

## Layer 1: Mechanical Equivalence (Easy to Automate)

The first pass removes filler words and identifies statements that substitute synonyms or negated antonyms.

| Input A | Input B | Owner's result | App, `mechanicalSimilarity()` | Site, `ces()` |
|---------|---------|--------|---|---|
| "Taxes should be lower" | "Tax rates should be reduced" | **Equivalent** | 0.25 (not a duplicate) | 0.24 (not flagged) |
| "He is intelligent" | "He is not unintelligent" | **Equivalent** | **1.00** (duplicate) | 0.50 (flagged) |
| "The policy is harmful" | "The policy is bad" | **Equivalent** | **1.00** (duplicate) | 0.51 (flagged) |
| "Carbon emissions rise" | "Unemployment is increasing" | Not equivalent | 0.00 | 0.00 |

These equivalences are detectable algorithmically without any human judgment. They are handled first because they are cheap to catch and account for a large fraction of redundancy in real debates.

**Implementation, as the owner describes it:** Token-level [Jaccard similarity](https://en.wikipedia.org/wiki/Jaccard_index) over synonym-canonicalized, stopword-stripped text. Arguments scoring ≥ 0.85 Jaccard are flagged as mechanical duplicates without needing semantic analysis.

**Status: runs in the app, exactly as described** (code: [`src/core/scoring/duplication-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/duplication-scoring.ts)). `normalizeClaim()` lowercases, strips punctuation, drops stopwords, maps each word to the alphabetically first member of its synonym group, turns "not X" into X's antonym when X has one, and sorts. `jaccardSimilarity()` is `|A ∩ B| / |A ∪ B|`, and `MECHANICAL_EQUIVALENCE_THRESHOLD = 0.85`. The tables are short and fixed: 19 synonym groups (for example `['decrease', 'lower', 'reduce']` and `['foolish', 'stupid', 'unintelligent']`) and 21 antonym pairs (`intelligent`/`unintelligent`, `good`/`bad`, `legal`/`illegal` and so on). The Python original is **archived** as `MechanicalEquivalenceChecker`.

**What running the owner's own table shows** (a calculation from the code; the two right-hand columns above):

- **The headline example fails.** "Taxes should be lower" normalizes to `decrease tax`; "Tax rates should be reduced" normalizes to `rates reduced tax`. "reduced" is not in the synonym group (only "reduce" is, and there is no stemming), and "rates" is an extra word, so Jaccard is 1/4. The unit test that pins this behaviour uses "taxes should lower" against "taxes should reduce", which works only because both verbs are bare.
- **Negation is a blind spot, and a dangerous one.** "not" and "no" are on the stopword list. When the word after "not" has no listed antonym, "not" is simply deleted. So "The ban will work" and "The ban will not work" score **1.00**, a mechanical duplicate, and "Taxes should be lower" against "Taxes should not be lower" scores 1.00 too. In the app, the second of two such rows filed on the same side would get uniqueness 0. The app compares only same-side siblings, which keeps most opposites apart, but the measure itself cannot tell a claim from its denial.
- The two rows that do pass pass for the right reason: the antonym table turns "not unintelligent" into "intelligent", and the synonym table maps "harmful" and "bad" to the same token.

**What the site runs instead.** The published site has no synonym table and no 0.85 threshold. [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) computes two lexical signals over claim text and averages them:

```
ces(A, B) = 0.5 x Jaccard(content words) + 0.5 x cosine(character 4-grams)
```

On the corpus, both halves are weighted by inverse document frequency, `log((N + 1) / (df + 1))` floored at 0, so a phrase every page shares ("the president and members of Congress") carries almost nothing. The constants: `FLAG = 0.45` ("worth a human reading the pair"), `MERGE = 0.70` ("near-identical wording: the two pages are probably one page"), `NGRAM = 4`, `IDF_FLOOR = 0.05`, `JMIN = 0.05`, `PAIRCAP = 1,500,000`. The values in the table above are the unweighted `ces()`, run on the bare sentences. The file is blunt about what this is: "Not meaning." It "will flag 'officials must not trade stocks' against 'officials must not trade bonds', which share nearly every word and say different things" (0.65 unweighted), and "will miss 'the ban is unenforceable' against 'no agency could police it', which share none and say the same thing" (0.00). The site's stopword list also contains "not", "no", "more" and "less", so it shares the app's blind spot for negation: "The ban will work" against "The ban will not work" is 0.88, above `MERGE`.

The corpus shows the same failure in the wild. On the build I ran (17 October 2026), the most alike pair in the whole corpus, at 0.94 and labelled "probably one page", is [one study claim](https://myklob.github.io/ideastockexchange/beliefs/p/study-shows-most-top.html) saying most top-100 altcoins bought at the 2018 or 2022 lows "were still worth less four years later" and [its twin](https://myklob.github.io/ideastockexchange/beliefs/p/study-shows-most-top-2.html) saying they "were worth more". They are the two opposite outcomes of the falsifiability test on [a crypto belief](https://myklob.github.io/ideastockexchange/beliefs/p/most-cryptocurrencies-other-than.html), filed on opposite sides. The detector deleted the only two words that differ. This is exactly why the site lets the detector point and never lets it score.

## Layer 2: Semantic Overlap (Requires Judgment)

The harder cases are arguments that are related but not identical.

> "Donald Trump has a short attention span" and "Donald Trump is unintelligent."

These might be 70% overlapping (attention span as a component of intelligence), or they might be genuinely distinct claims worth scoring separately. The system assigns a **Similarity Score** between 0 and 100% and treats the second argument's contribution to the overall conclusion score as proportional to its uniqueness.

```
contribution(argN) = baseScore(argN) × (1 − similarity_to_prior_args)
```

At 70% similarity, the second argument contributes 30% of what it would contribute if it were entirely novel.

**Status of the formula: runs in the app, Layer 1 only.** The app's rule is `uniquenessFromSimilarities()`, `1 - max(similarities)`, clamped to [0, 1] and 1.0 for the first argument. It takes the maximum, not the average, and the code says why: "even one near-identical prior argument is enough to mark the new argument as redundant. A single devastating counter-argument stated once is not made more valuable by ignoring the fact that 50 other users already made it." The place it actually moves a number is `siblingUniquenessFor()` in [`src/lib/propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts): it loads a parent belief's published arguments oldest first, compares each one's text with the earlier arguments on the same side using `mechanicalSimilarity()`, and passes the result into

```
impactScore = sign x childTruth x |linkage| x importance x uniqueness x 100
```

(`computeArgumentImpactScore` in [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts), rounded to one decimal). Oldest first means the original statement of a point keeps full credit and the restatement pays. On the owner's attention-span pair, Layer 1 gives 0.33 (a calculation: `attention donald short span trump` against `donald foolish trump` share two of six tokens), so in the app the second would keep 67%, not the 30% the owner's illustrative 70% would leave it.

**Status on the site: replaced by an argued factor.** The site's row rule is

```
row contribution = sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq
```

([`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py); [method.html#formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula)). `Uniq` is the truth score of a uniqueness page, a page whose claim is that one row makes a point the other has not, or the labelled constant `DEFUNIQ = 1` when no such page exists ([method.html#constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants): "Presumed distinct until someone argues the overlap"). The method page gives the reason for refusing the computed version: "a number that silently discounts an argument and has no page behind it cannot be audited, and every other number on this site is a link to the page that argues it." The "Rules in the wiki this site does not run" table lists "Uniqueness computed as one minus the highest similarity" with "Presumed distinct until a uniqueness page is argued; the similarity is flagged and never scored" beside it.

So the owner's formula survives on the site in shape, with one swap: `(1 − similarity_to_prior_args)` is not computed, it is argued. A worked example follows under Layer 3.

**As clusters of similar arguments form**, the system generates a single high-quality summary for each cluster while maintaining a drill-down path to the original variations. Users see the best version of each distinct point rather than wading through every restatement, but nothing is discarded: the underlying nuances remain accessible to anyone who wants them.

**Status of clusters.** In the app, `clusterArguments()` groups scored arguments whose combined similarity is at least 0.70 (the default `similarityThreshold`), picks the member with the highest `baseScore` as representative, and sums members' effective contributions as `clusterScore`. **Built, called by nothing but its tests.** No page renders a cluster, and no code writes the "single high-quality summary". On the site, the nearest thing is the verdict on each flagged pair, "probably one page" at or above 0.70 and "worth arguing the overlap" between 0.45 and 0.70, plus the rule that no drafted argument is ever deleted: a merge, when a human makes one, keeps every row. The app has a separate routing scale for new submissions in [`src/lib/agent-ingest/similarity.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/similarity.ts) (`0.7 x token Jaccard + 0.3 x bigram Jaccard`, with a light suffix strip): at 0.5 or more it stores an `EquivalenceCandidate` row, at 0.8 the posting flow makes the writer acknowledge the existing argument first ("a speed bump, not a block"), and at 0.95 the pair goes to a grouping vote with a 60% weighted consensus. "No band auto-merges anything", and the file's header is explicit that this number is "stored, not scored".

**Novelty Premium**: To prevent novel arguments from getting buried before the community can evaluate them, the system grants a temporary score boost for genuinely unique perspectives. The boost decays exponentially with a 24-hour half-life:

```
multiplier(t) = 1.0 + 0.25 × 0.5^(t / 24h)
```

Once evaluated, the boost normalizes and the argument stands on its permanent score.

**Status: built in the app, called by nothing but its tests; not built on the site.** `noveltyMultiplier()` implements `floor + (peak - floor) x 0.5^(t / halflife)` with `NOVELTY_DEFAULTS = { peakMultiplier: 1.25, halflifeHours: 24, floor: 1.0, noveltyThreshold: 0.5 }`, which is the owner's formula exactly, plus one guard the owner's page does not mention: no boost at all when the argument's uniqueness is below 0.5, so a duplicate does not get a bonus for being fresh. Run, it gives 1.25 at posting, 1.125 at 24 hours, 1.0625 at 48 and 1.031 at 72 (a calculation). `scoreArgumentsForDuplication()` multiplies it in, but that pipeline is itself called only by tests; the propagation path that writes real scores uses uniqueness alone.

How the owner's October 2026 direction bears on it: votes and attention may decide what is promoted, never what is valid. A boost to a *score* for being new is a boost to validity for a reason that has nothing to do with being right. The same purpose (a new argument should not drown before anyone reads it) is served on the site by attention rankings instead of truth: the home page's lists and the what-to-argue-next queue rank by how much depends on a page and how little work stands behind it ([lists.html#hardest](https://myklob.github.io/ideastockexchange/beliefs/lists.html#hardest)), and a page nobody has started ranks high there precisely because nobody has started it. Whether a time-decaying premium should ever touch a score is open question 3 below.

**Implementation, as the owner describes it:** Sentence embeddings (via `sentence-transformers`) compute cosine similarity on the full logical structure (`claim + inference + conclusion`) rather than just the surface wording. This makes it much harder to fool with selective rewording of one component.

**Status: archived, and refused by design as a score input.** The archived `SemanticSimilarityScorer` did join claim, inference and conclusion into one string (`_argument_text`) and wrap `StatementSimilarityEngine` from [`src/core/ai/similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/src/core/ai/similarity.py), which loads `all-MiniLM-L6-v2` by default with `SIMILARITY_THRESHOLD = 0.75` from the environment. Without the ML package it fell back to character 3-gram Jaccard, "good enough for unit tests and development; not good enough for production". The archived backend runs nowhere, and nothing imports `src/core/ai/similarity.py`. In the app, `blendSimilarityLayers()` stands ready to take a Layer 2 number with `DEFAULT_LAYER_WEIGHTS = { layer1: 0.4, layer2: 0.6, layer3: 0.0 }`: it returns 1.0 at once when Layer 1 reaches 0.85; otherwise it averages the layers by weight, renormalizing across Layers 1 and 2 when Layer 3 is absent (so Layer 1 at 0.5 and Layer 2 at 0.7 blend to 0.62). The only caller, `scoreArgumentsForDuplication()`, falls back to Layer 1 when no semantic score is supplied, and nothing supplies one. The same 0.4/0.6 blend is used for display by `calculateBeliefEquivalencyScore()` in `all-scores.ts`, with bands identical (0.90), near-identical (0.70), overlapping (0.45), related (0.20) and distinct.

The site refuses the embedding as a score input for the reason [CLAUDE.md](https://github.com/myklob/ideastockexchange/blob/master/CLAUDE.md) gives for every model-produced number: a number a model asserted is the one thing the published engine refuses to carry, unless a page argues it. `similarity.py` says it plainly: its blend weight `w_ces` "is read from a VCA page when one exists and is 0 when none does ... an input nobody has argued counts nothing. Until somebody argues that this lexical proxy tracks meaning well enough to act on, it does not act. It only points." The same holds for any embedding that might replace it.

> See (owner's references): `backend/algorithms/duplication_scoring.py`, `SemanticSimilarityScorer`, now [archived](https://github.com/myklob/ideastockexchange/blob/master/_archive/python-backend/algorithms/duplication_scoring.py); and [`src/core/scoring/duplication-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/duplication-scoring.ts), `blendSimilarityLayers()`.

## Layer 3: Community Verification (For Anyone Interested Enough)

For any two arguments in the system, the ISE can open a sub-debate on a single question: *Are these saying the same thing?*

This sub-debate follows the same pro/con structure as any other belief page. Reasons to agree they are equivalent go in one column. Reasons to disagree go in the other. The resulting score feeds back into the similarity score between the two parent arguments.

In practice, most of this work will be done by AI. The machinery to have humans debate argument similarity at scale exists primarily to provide transparency and override capability: anyone who believes the automated similarity score is wrong can challenge it with evidence, and the system will update accordingly. **The AI does the heavy lifting; humans and the community provide the checks.**

**Implementation, as the owner describes it:** `EquivalenceSubDebate` data structure in `backend/algorithms/duplication_scoring.py`. The community score is blended into the final similarity estimate via configurable layer weights.

**Status on the site: runs, and it is the whole mechanism.** The site turns the owner's priority around. Layer 3 is not an override on top of a computed number; it is the only thing that sets the factor, and the computer's job is to tell people where to look. There are two page kinds for it:

- A **uniqueness page** argues whether one row on a page makes a point another row on the same page has not. Its truth score is that row's `Uniq`.
- An **equivalence page** argues whether two beliefs are the same claim. Its truth score is the `Equiv` printed in Similar Beliefs; near 1 means "a merge candidate, not a new page". It never multiplies a row (see [[Equivalency Score:]]).

Both score by the same rule as every page, `(POS + w x p0) / (POS + NEG + w)`, so an unargued one reads 0.50. The corpus has 2 uniqueness pages and 3 equivalence pages out of 4,263 pages (a count on the build of 17 October 2026).

**A worked example, from the live corpus.** The belief [Barring members of Congress and the President from trading stocks](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html) cites, as supporting evidence, the [Federal Reserve's 2022 rule](https://myklob.github.io/ideastockexchange/beliefs/p/federal-reserve-officials-have.html) barring its officials from holding individual stocks. It also has an argument saying the Fed adopted that rule and kept functioning. That overlap is argued on [a uniqueness page](https://myklob.github.io/ideastockexchange/beliefs/p/uniq-federal-reserve-officials-federal-reserve.html) whose reasons are typed as the categories Different evidence, Independent failure, Shared premise and Paraphrase ("The argument states that the Fed adopted the rule and kept functioning; the finding states that the Fed adopted the rule. The second sentence is contained in the first."). Its author's bottom line: "Largely redundant: the finding keeps a minority of its weight, which is the discount working as intended."

Here is what the engine does with the finding's row (a calculation from the code, on that build):

| Factor | Value | Where it comes from |
|---|---|---|
| Truth | 0.95 | The finding is a primary official record (ESIW 0.90), so it starts at `0.5 + 0.5 x 0.90 x (2 x 1 - 1) = 0.95` ([`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py)) |
| Confidence | 0.564 | How much work stands behind the finding's page ([[Confidence Stability Scores]]) |
| Link | 0.50 | Its linkage page, unargued |
| Imp | 0.50 | Its importance page, unargued |
| Uniq | **0.50** | The uniqueness page, whose four reasons are words without pages of their own, so it reads the neutral 0.50 |
| Row score | `(2 x 0.95 - 1) x 0.564 x 0.5 x 0.5 x 0.5` = **0.063** | Without the uniqueness page, `DEFUNIQ = 1` would make it 0.127 |

Two things are worth seeing. The discount works: the overlap costs the finding half its weight. And it works for an awkward reason: the page's reasons are not yet argued, so it sits at 0.50 by default, and opening a uniqueness page at all, before anyone argues it, halves the row (0.50 against the 1 it reads with no page). The second uniqueness page on the same belief shows the cost of that. [Its author's bottom line](https://myklob.github.io/ideastockexchange/beliefs/p/uniq-congress-will-enforce-ban-official.html) is "Distinct: they fail in different ways and would be refuted by different evidence", three of its four reasons argue distinctness, and it still reads 0.50, because typed sentences carry no score until they have pages. The linkage page has the same trap, and [[Linkage Scores]] raises it as that page's first open question. It is open question 2 here.

**Status in the app: archived, and an unfed input.** The archived `EquivalenceSubDebate` held `pro_score` and `con_score` and resolved to `pro / (pro + con)`, 0.5 with no data. The TypeScript accepts a `communityScores` map and a Layer 3 weight that defaults to 0.0 "until a community sub-debate has resolved"; no code fills the map. The app's own equivalence machinery (the `EquivalenceCandidate` rows and the 60% grouping vote above) decides merge status and never enters a uniqueness number.

**How the owner's direction bears on "the AI does the heavy lifting".** The direction on fallacies says software may flag, nothing is final, and a flag is argued like any claim and moves no score. The site applies exactly that rule to similarity: the detector is the AI's heavy lifting, done as flags, and the score moves only when people argue the flag. The direction on linkage ("any sensible starting guess, the contributor's record, topic relatedness, an AI estimate") would allow a computed similarity as the *starting* value of a uniqueness page, falling or rising as it is argued. Nothing does that today; it is open question 1.

## What the site does that the owner's page never mentions

Three mechanisms in this page's area run on the site and appear nowhere in the owner's text.

**1. The flag list, and the "unguarded" count.** `Similarity.pairs()` scores every pair of belief, claim and interest pages that share an informative word, flags those at or above 0.45, and records whether the two sit on the same page and whether a uniqueness or equivalence page already argues them. The method page prints the top twelve ([method.html#equivalency](https://myklob.github.io/ideastockexchange/beliefs/method.html#equivalency)) and a count. On the build of 17 October 2026 (a calculation from the code): 3,988 claims, 1,219,238 candidate pairs sharing a word, 124,441 scored in full, **216 pairs flagged**, 34 at or above the merge line with no equivalence page, and **149 "unguarded"**: two rows on the same page, alike, with no uniqueness page between them. The method page calls those "the live padding risk: each is scored as if it made a point the other did not." Every belief page with such a pair prints a "Wording overlap, unargued" line under its argument table ([`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)), and the structural checks list it as "Rows that may be the same point twice" ([`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py)). The detector also says what it did not examine rather than presenting a short list as a clean bill of health: a word is skipped only when it carries no weight, and claims left unreached at the candidate-pair limit are named.

**2. The duplicate check at the door.** Every form on the site runs [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) as the reader types. It scores the text against every claim in `data/claims_index.json` (published and draft) with a port of the same measure and the same `FLAG = 0.45` and `MERGE = 0.70`. Between the two it asks "Is it one of these?" with agree and disagree links on each. At `MERGE` or above it says "Already on the site", and if the match is already a row on this page the button becomes "This is already here: open it and vote". The GitHub Action [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) re-checks with the Python engine: at or above `MERGE` the submission "is the existing claim and is counted as the submitter's vote for it", labelled `duplicate`, and if the claim is not yet a row on the page it was submitted to, a pull request adds only that row so the placement is kept. Between `FLAG` and `MERGE` the rows are added and the maintainer is shown the near matches. This is the owner's "only the first counts" applied before a duplicate exists rather than after, and a vote never moves a score ("A vote never moves a score; the page shows it next to what the analysis says, as what people think").

There is a defect here, found while checking this page (a calculation from the code). Because "not" is a stopword, the denial of a claim already on the site matches it. Submitting "Congress will enforce a ban on itself, so the statute would put a symbol in place of the enforcement reform that could work" matches [the existing claim](https://myklob.github.io/ideastockexchange/beliefs/p/congress-will-enforce-ban.html) "Congress will **not** enforce a ban on itself, ..." at **0.981**, and intake would record it as a vote to *agree* with the claim the submitter was denying. That is open question 4.

**3. One claim, one page, one truth.** The deepest defence against repetition on the site is structural. A claim has exactly one page, and every row that uses it points at that page. `evidence.py` states the consequence for evidence: "Source quality is a property of the claim, not of the place the claim is cited, and the same finding cited on four pages has one truth." Citing a finding four times does not make it four findings; it makes four rows, each multiplied by its own linkage, importance and uniqueness, all reading one truth score.

## Two Guardrails Worth Knowing

### Reinforcement vs. Repetition

Ten different sources all citing evidence that smoking causes cancer should not create ten separate argument nodes. But those ten sources do matter: they increase the **Truth Score** of the single node they all support.

The ISE distinguishes:

| Pattern | What It Means | How It's Handled (owner) | Site today | App today |
|---------|---------------|-----------------|---|---|
| **Evidence Volume** | Multiple sources corroborating the same fact | Strengthens the node's Truth Score (rewarded) | **Rewarded, bounded.** One finding page records how many independent replications exist (`erq`) and what share agreed (`erp`); they set where its truth starts and how hard it is to move. | The corroboration boost is **built, called by nothing but its tests**. |
| **Argument Redundancy** | Multiple posts making the same logical point | Only the first counts; duplicates pay the penalty | **Each row carries a Uniq factor**, argued on a uniqueness page; nothing is "first". | **Runs**: oldest first, later same-side restatements discounted by `1 - max similarity`. |

Corroboration is rewarded. Repetition is not.

The corroboration boost uses a diminishing-returns formula:

```
boost = MAX_BOOST × (1 − e^(−0.5 × weightedN))
```

where `weightedN` weights each source by its quality tier (T1 peer-reviewed = 1.0, T4 anecdotal = 0.25). The tenth paper adds much less than the first.

**Status: built in the app, called by nothing but its tests.** `corroborationBoost()` in [`duplication-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/duplication-scoring.ts) uses `MAX_CORROBORATION_BOOST = 0.20` (an additive Truth Score boost, "20 percentage-point ceiling" in the archived Python's `EvidenceVolumeTracker`), `k = 0.5`, and `TIER_WEIGHTS = { T1: 1.00, T2: 0.75, T3: 0.50, T4: 0.25 }`, where T2 is "reputable" and T3 "secondary". Each source can carry a `corroborationWeight` (default 1.0). Run: one T1 source gives 0.079, two 0.126, three 0.155, five 0.184, nine 0.198, ten 0.199, twenty 0.200; four T4 anecdotes equal one T1 paper at 0.079. The tenth paper adds 0.0009, which is the owner's diminishing return made very literal.

**What the site runs instead.** The site keeps the owner's idea (one node, many sources, diminishing returns) and expresses it through the finding's own page ([method.html#starts](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts)):

```
p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)        where a finding's truth starts
w  = k x 2 x ERQ / (ERQ + 1)                      how hard it is to move, REP_CAP = 2
```

`ESIW` is the source type's weight from an 18-row table (statistics 0.90, primary official record 0.90, RCT 0.85, meta-analysis 0.80, observational study 0.75, down to historical artifact 0.10; see [[Evidence Verification Score (EVS)]]). The replication reward is 1.00 for one study, 1.33 for two, 1.50 for three, 1.80 for nine and 1.82 for ten, with a limit of 2.00: the tenth paper adds 0.018 (a calculation from `replication()` in [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py)). The file explains the ceiling: "Unbounded here is how a score gets padded, which is the thing this project exists to stop." Ten meta-analyses that all agree on smoking and cancer start the finding at `0.5 + 0.5 x 0.80 x 1 = 0.90`, with weight 1.82.

**Where the owner's direction differs.** The October 2026 direction prefers an evidence weight with no ceiling, "so a body of replicated work can outweigh opinion by 15 or 200 times". The site prints that rule beside the argued score on every belief page: [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) ([method.html#tally](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)) weighs a finding at `Truth x Link x Imp x Uniq x (1 + ESIW x ERQ x ERP/100)`, uncapped. The same ten agreeing meta-analyses there carry a strength of `0.80 x 10 x 1.0 = 8`, so the finding weighs nine times a bare reason, and each further paper adds another 0.80: no diminishing return at all. So three rules sit side by side: the owner's 2023 boost (saturating at +0.20, unwired), the site's argued rule (saturating at twice k), and the direction's tally (linear, uncapped, published for comparison). The direction says to compare them on real pages before one leads.

The volume direction also says what Uniq is *for*. It asks for "the quantity of truly independent reasons", and `tally.py` counts "independent reasons on a side" as **the sum of Uniqueness over its reasons**: "two reasons that say the same thing count as one once a uniqueness page says so." On the worked example above, the Fed finding weighs `0.95 x 0.5 x 0.5 x 0.5 x (1 + 0.90) = 0.226` in the tally, against 0.451 without its uniqueness page. Redundancy is not a side issue to the volume question. It is the definition of "independent".

> See (owner's references): `backend/algorithms/duplication_scoring.py`, `EvidenceVolumeTracker`, now archived; and `src/core/scoring/duplication-scoring.ts`, `corroborationBoost()`.

### Semantic Obfuscation

Using a thesaurus to make an old argument look new is a predictable manipulation attempt. The AI semantic engine maps the underlying **logic structure** (premise → inference → conclusion) rather than just the surface wording. If the logic is the same, the score is shared regardless of how the words are rearranged.

Wordsmithing does not produce a new argument node; it produces a restatement of an existing one.

**Why this works, in the owner's design:** Sentence embeddings operate on *meaning*, not vocabulary. "Carbon emissions warm the planet" and "Greenhouse gas release raises global temperatures" will produce embeddings with very high cosine similarity regardless of word-for-word differences. Composing the embedding from claim + inference + conclusion means that even partially-reworded arguments are caught when the core logic is unchanged.

**Status: proposed, not running.** No running code maps premise, inference and conclusion, and none computes an embedding. On the owner's own carbon example, both running measures score **0.00** (a calculation: the two sentences share no content word and few 4-grams). A thesaurus defeats both engines today. Rearranging the words does not: the app sorts tokens and the site uses sets, so word order alone never fools either. On the site, the defence against wordsmithing is the reader and the uniqueness page, prompted by the flag list when the wording overlaps and by nothing when it does not. That gap is real, and it is why open question 1 exists.

## Why This Matters for Every Debate

Without similarity scoring, the ISE would reproduce the core failure of every platform it is trying to replace: the side with more participants, more bots, or more time to post wins regardless of argument quality. A single devastating argument stated once would be buried under a hundred mediocre restatements of the opposing view.

With similarity scoring, what gets counted is not how many times something was said, but how many *distinct* things were said and how well-supported each one is. Repetition stops being a strategy. The only path to a higher score is a genuinely new argument or better evidence for an existing one.

On the site, the argued rule enforces that last sentence twice over, and not only through Uniq. A row contributes `(2 x Truth - 1)`, so a claim nobody has argued is worth exactly zero however many times it is listed; listing restatements of an unargued claim adds nothing even before anyone opens a uniqueness page (code: `score_reference.py`; pinned by `test_engines.py::test_argument_alone_can_never_leave_the_neutral_point`). The tally rule, which counts reasons from the moment they are posted as the owner's direction asks, has no such zero, so on the tally Uniq is the *only* defence, and with `DEFUNIQ = 1` it is off until someone argues the overlap. That is why the 149 unguarded pairs matter more under the direction than under the current argued rule.

Because scores update dynamically as new evidence arrives, you can watch beliefs evolve in real time. A policy belief might rise when new labor market data is published and fall when revised projections arrive. Each change is traceable to a specific argument node and the evidence that moved it. You are not just watching a debate; you are watching the weight of evidence shift.

**Status.** The site recomputes every score from the two tables on each build, which CI runs on every change, and [`changes.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/changes.py) publishes what moved since the last revision, and why, on the site's changes page. That is "traceable to a specific node", per revision rather than in real time. In the app, [`propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts) recomputes a belief and every conclusion above it whenever evidence or linkage changes, which is the real-time version, inside the app's database.

This connects directly to [[One Page per Debate Topic]] (the owner's "One Page Per Topic") and One Page Per Belief (see [[Template: Belief Analysis]] and [[Pros and Cons on the Same Page]]): by requiring every argument to be filed in a specific location in the argument hierarchy, we position similar claims side by side where their overlap is visible. **Categorization by topic and sub-topic is what makes similarity scoring tractable in the first place.** You cannot measure overlap between arguments you cannot find.

The code agrees with the owner here, and in a specific way. `Similarity.shared_parent()` checks whether two flagged claims sit on the same page, because "two near-identical rows under one conclusion are the padding the uniqueness multiplier exists to stop, and they are the ones worth flagging first." The app's propagation compares each argument only with the earlier arguments on the same side of the same parent. Both engines use the hierarchy to decide which pairs are worth comparing at all.

## The Impartial Standard: Objective Criteria

Similarity scoring tells us when two arguments are redundant. Objective Criteria scoring tells us what standards we are using to evaluate them in the first place.

Every category of debate requires its own criteria debate: what counts as evidence here, what metrics matter, what would change our minds. Defining the yardstick before measuring ensures that every candidate, policy, or claim in a category is evaluated against the same standard rather than against whatever metric happens to make one side look best.

Together, similarity scoring and objective criteria scoring solve the same problem from two directions: one prevents the same weak point from being counted a thousand times, and the other prevents the goalposts from moving every time a new participant arrives.

**Status.** On the site, every belief page has an Objective Criteria section fed by `criterion` rows in `content/edges.csv`, each carrying a reading and labelled validity, reliability, linkage and importance ([`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)); a topic page can carry criteria for the whole topic. Criteria are argued claims and shown; no rule reads them into a truth score, and having them is one of the requirements for a belief to count as complete (`publish.CORE_BAR`). The app has an explainer at `/algorithms/objective-criteria`. "Scoring" in the owner's sense, criteria checked automatically against every claim in a category, is proposed, not built.

## Traditional Debate vs. Idea Stock Exchange

| Traditional Debate | Idea Stock Exchange |
|---|---|
| Endless loops | Cumulative learning |
| Loudest voice wins | Best evidence wins |
| Isolated claims | Networked beliefs |
| Repetition = reinforcement | Refinement = progress |

## Implementation Reference

The owner's table, with each row's status as of October 2026.

| Component | Location | Purpose | Status |
|-----------|----------|---------|---|
| `MechanicalEquivalenceChecker` | `backend/algorithms/duplication_scoring.py` | Layer 1: synonym/antonym normalization | **Archived** to [`_archive/python-backend/`](https://github.com/myklob/ideastockexchange/blob/master/_archive/python-backend/algorithms/duplication_scoring.py) |
| `SemanticSimilarityScorer` | `backend/algorithms/duplication_scoring.py` | Layer 2: embedding-based cosine similarity | **Archived**; the embedding module it wrapped, `src/core/ai/similarity.py`, is imported by nothing |
| `EquivalenceSubDebate` | `backend/algorithms/duplication_scoring.py` | Layer 3: community verification data model | **Archived**; **replaced** on the site by uniqueness and equivalence pages |
| `DuplicationScorer` | `backend/algorithms/duplication_scoring.py` | Main orchestrator, all three layers (weights 0.4 and 0.6, threshold 0.85) | **Archived** |
| `NoveltyPremiumCalculator` | `backend/algorithms/duplication_scoring.py` | Temporary boost for genuinely new arguments | **Archived** (peak 1.25, half-life 24 hours) |
| `EvidenceVolumeTracker` | `backend/algorithms/duplication_scoring.py` | Corroboration vs. redundancy distinction | **Archived** (`MAX_CORROBORATION_BOOST = 0.20`, `k = 0.5`) |
| `mechanicalSimilarity()` | [`src/core/scoring/duplication-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/duplication-scoring.ts) | Layer 1 (TypeScript) | **Runs in the app**: belief-score propagation, the `/arguments/[id]/score` page, topic overlap, belief equivalency, and interest matching in `conflict-resolution.ts` |
| `blendSimilarityLayers()` | `src/core/scoring/duplication-scoring.ts` | Layer blending (TypeScript) | **Built, called only by the unused pipeline and tests**; no Layer 2 or 3 input exists |
| `scoreArgumentsForDuplication()` | `src/core/scoring/duplication-scoring.ts` | Full TypeScript pipeline | **Built, called by nothing but its tests**; propagation uses `mechanicalSimilarity()` and `uniquenessFromSimilarities()` directly |
| `clusterArguments()` | `src/core/scoring/duplication-scoring.ts` | Cluster generation for UI | **Built, called by nothing but its tests**; no UI renders clusters |
| `corroborationBoost()` | `src/core/scoring/duplication-scoring.ts` | Evidence volume boost (TypeScript) | **Built, called by nothing but its tests** |
| `noveltyMultiplier()` | `src/core/scoring/duplication-scoring.ts` | Novelty premium (TypeScript) | **Built, called by nothing but its tests** |

What the owner's table leaves out, and runs:

| Component | Location | Purpose | Status |
|---|---|---|---|
| `uniquenessFromSimilarities()`, `siblingUniquenessFor()` | `duplication-scoring.ts`, [`src/lib/propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts) | `1 - max similarity` to earlier same-side siblings, multiplied into impact | **Runs in the app** |
| `textSimilarity()`, `similarityBand()` | [`src/lib/agent-ingest/similarity.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/similarity.ts) | Routing new submissions: candidate 0.5, speed bump 0.8, grouping vote 0.95 | **Runs in the app**; stored, never scored |
| `DEFUNIQ` and the `uniq_id` multiplier | [`tools/static-site/score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py) | Uniq as the truth of an argued uniqueness page, 1 when none | **Runs on the site** |
| `Similarity` | [`tools/static-site/similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) | Flag list, merge candidates, unguarded pairs, per-page overlap line | **Runs on the site**; scores nothing by design |
| Duplicate check as you type | [`tools/static-site/contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) | Turns a duplicate into a vote before it is filed | **Runs on the site** |
| `Matcher` | [`tools/static-site/intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) | Re-checks each GitHub issue; at 0.70 or more, records an agree vote instead of a new page | **Runs on the site** |
| `replication()` | [`tools/static-site/evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py) | Bounded reward for independent replication, `REP_CAP = 2` | **Runs on the site** |
| `tally()` | [`tools/static-site/tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) | Independent reasons as the sum of Uniq; uncapped evidence strength | **Runs on the site**, printed beside the argued score and read by no other number |

The ReasonRank walk on the site also steps from page to page "in proportion to Link × Imp × Uniq" ([method.html#reasonrank](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank)), so a row argued redundant draws less of the corpus's attention as well as less weight. See [[ReasonRank: Google's PageRank for Arguments]].

## Open questions for the owner

The October 2026 direction settles the principle in each case; the implementation choice is still open.

1. **Should a computed similarity ever set the starting value of Uniq?** The direction on linkage allows "an AI estimate" as a starting guess that falls or rises as it is argued; the site holds computed similarity at weight 0 (`w_ces = 0`, `DEFUNIQ = 1`); the app applies `1 - max similarity` with no page behind it. Options: (a) keep flag-only on the site and say on this page that the defence is argued; (b) start a uniqueness page at `1 - ces` when the detector flags a same-page pair, labelled as a guess, and let argument move it (a rule change with a conformance diff via `python3 conformance.py --write`); (c) publish a computed-uniqueness rule beside the argued one, as `tally.py` does for volume, and compare them on real pages.
2. **Should opening an empty uniqueness page halve a row?** A row with no uniqueness page reads 1; a row with an unargued one reads 0.50, even when its author's own bottom line says "Distinct". Options: start an unargued uniqueness page at `DEFUNIQ` rather than 0.50; treat a uniqueness page with no scored reasons as absent; or keep it and say on the page that an open challenge costs the row half its weight until argued back up. This is the same question [[Linkage Scores]] asks about linkage pages.
3. **Should anything time-based touch a score?** The novelty premium (1.25, 24-hour half-life) is built and unwired. The direction on votes says attention may be promoted and validity may not. Options: delete `noveltyMultiplier()` and say novelty is handled by attention rankings; move it to a ranking (the what-to-argue-next queue) and keep it off scores; or wire it in, which makes truth depend on the clock.
4. **Should the duplicate check understand negation?** Both measures drop "not" and "no", so the app scores "The ban will work" and "The ban will not work" as identical, and the site's intake would record a submitted denial as an *agree* vote for the claim it denies (0.981 on a real claim). Options: take negation words off both stopword lists so a denial lands far from its claim; detect a negation-only difference and route it as a reason to disagree rather than a vote; or keep the measure and stop treating a `MERGE` match as an agree vote without the submitter confirming it. The first is a small change to `similarity.py`, `contribute.js` (which must stay in step, as `intake.py`'s `Matcher` docstring insists) and `duplication-scoring.ts`.
5. **Which engine's uniqueness rule leads?** The app discounts by computed similarity at propagation time; the site argues it. [[Equivalency Score:]] lists the same split as its open question 4, and CLAUDE.md's rule against a sixth engine applies: one should migrate onto the other.
6. **What happens to the unwired TypeScript?** `scoreArgumentsForDuplication()`, `clusterArguments()`, `corroborationBoost()`, `noveltyMultiplier()` and the Layer 2 and 3 inputs to `blendSimilarityLayers()` are tested and called by nothing. Wire each in (each changes published app numbers), or delete it and let this page record the decision.

## See Also

- Duplication Scores (the owner's companion page; no page by that name exists on this wiki, and [[Equivalency Score:]] covers the same ground)
- [[Equivalency Score:]]: the computed and argued halves of "are these the same claim", every formula, and the 2025 sketch.
- [[Linkage Scores]] and [[Evidence to Conclusion Relevance Score]]: the Link factor that sits beside Uniq on every row.
- [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]]: how row weights become page scores, and the walk that steps by Link × Imp × Uniq.
- One Page Per Belief: [[Template: Belief Analysis]], [[Pros and Cons on the Same Page]] and [[One Page per Debate Topic]].
- [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]]: the signed row rule that makes an unargued restatement worth zero.
- [[Evidence Verification Score (EVS)]]: the 18 source tiers and the replication weight that reward corroboration.
- [[Argument Scores from Sub-Argument Scores]]: how a uniqueness page's own score is built from its reasons.
- [[Confidence Stability Scores]]: the Confidence factor in the worked example.
- [[Template: Belief Equivalence Scorecard]]: the page an equivalence is argued on; [[Templates]] for the rest.
- The site's [method page on computed equivalency](https://myklob.github.io/ideastockexchange/beliefs/method.html#equivalency), its [labelled constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants), the [count-every-reason rule](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally), and its list of [rules the wiki states that the site does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun), where "Only the first of several rows making one point counts, plus a corroboration boost" sits beside "Neither. Each row has a uniqueness factor, and replications of a finding are rewarded up to twice k and no more."

To argue that two rows say the same thing, open a uniqueness page through the forms on any [belief page](https://myklob.github.io/ideastockexchange/beliefs/index.html), or propose a change through the [repository](https://github.com/myklob/ideastockexchange).
