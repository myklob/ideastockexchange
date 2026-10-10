# Template: Media Analysis

> Generated from [`templates/media-analysis-template.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/media-analysis-template.html) by `tools/wiki_templates.py`. The HTML file is the template; edit it, not this page. CI regenerates this page and refuses a copy that has drifted.

**Kind:** Page template  
**Purpose:** One work (book, film, study, podcast): its scorecard, the beliefs it carries, quality arguments, influence arguments, the strongest case it leaves out, persuasion patterns, who gains if the audience believes it, whether it is a great work, the predictions it made, hidden assumptions.  
**Rendered by:** tools/static-site/render_site.py (a media page); src/core/scoring/media-truth.ts and src/app/media/[id]  

**Currency rules.** `tools/check_templates.py` refuses a template that uses the retired column names Argument Score or Evidence Score (the current names are Truth, Importance and Linkage), an em dash, an empty anchor, or an address that looks like an email; a topic template must carry the four magnitude bands Modest, Moderate, Strong and Total and treat engagement as a section, not a continuum. CI runs it on every change under `templates/`, and `tools/wiki_templates.py --check` refuses a wiki copy that differs from the HTML.

Square-bracketed text is a placeholder for the author to fill; a token with underscores, such as [Truth_Score], is a slot the software fills. A score cell is blank until a real page stands behind it. Each table on the built site carries a form that files a row in it; a form cannot be submitted from a wiki page, so the forms are left out here.

---
> **Builder notes**
>
> ===== ISE MEDIA ANALYSIS TEMPLATE (v4, 2026-10-03, GitHub form) =====
> The per-work media page: one work, one page, the media-side twin of the
> Media Resources table on belief pages. Quality (is it well made?) and the
> beliefs the work carries (is what it carries true?) live on this one page;
> the older split into a belief-argument page and a separate quality page is
> retired. Mirrored by the React implementation in src/app/media/[id]/page.tsx
> and the engine in src/core/scoring/media-truth.ts. If you change this
> template, update that page. The two must stay in sync.
>
> The authoring rules readers never see are in the hidden paragraph at the top
> of the markup. Links point at this site's own routes; a page that has no
> route yet is named in plain text.
>
> SECTION ORDER (the published static site, tools/static-site/render_site.py
> render_media, follows it; where the two differ the line says "built site"):
>   Breadcrumb (Home > Media > Title; built site: Home > Books, studies and
>       reports > Best [kind] > Title, linking the list of best works)
>   Header line (Creator, Year, Kind, Where to find it, Reviewed by)
>   The two questions, kept apart on purpose
>   Scorecard (Quality Score, Influence Score, Reach, Media Truth Score,
>       Epistemic Impact, Bottom line) (built site: no score sits above the
>       arguments, so the same values are rows of the Scoring Engine at the
>       foot of the page, with the Bottom line just above it. Reach and
>       Epistemic Impact are software only until a work carries a typed Reach
>       with its source; the site prints "not recorded" rather than a guess.
>       Media Truth Score is printed as "Accuracy of what it backs".)
>   Beliefs This Work Carries (built site: read from the belief pages that
>       cite the work under Media Resources; centrality is that row's Bears
>       linkage page)
>   Quality Arguments
>   Influence Arguments
>   The Strongest Case the Work Leaves Out (built site: the best-scoring
>       reason on the other side of each belief page, read from that page)
>   Persuasion Patterns
>   Who Gains if the Audience Believes It (built site: the interests each
>       belief page lists for the side the work takes, plus rows on the page)
>   Is It a Great Work? Evidence and Objective Criteria (carried over from the
>       retired quality template)
>   Predictions the Work Made (from the owner's book analysis page)
>   Hidden Assumptions and Bias Risks
>   Worked Examples and Definitions (built site: Definitions only; the worked
>       examples have no route there yet)
>   Scoring Engine
>   Contribute (built site: a form under every table, and Agree and Disagree
>       vote links on the heading line; a vote never moves a score)
>   Version line
>
> A work is best until shown otherwise, and best by what is argued too. The
> list of works (templates/media_index.html, media.html on the built site)
> ranks each kind of work under every yardstick for best; a criterion typed
> in this page's Objective Criteria table is one of those yardsticks.

AUTHORING RULES (hidden text; leave in place, readers never see this). This is the per-work media page: one work, one page, the media-side twin of the Media Resources table on belief pages. 1. Nothing typed on this page is a score. Every number is read from a page (a belief page, a linkage page, the pro/con tables below) or computed from those. The one typed number is Reach, and it carries its source. 2. Enter every belief the work carries as the claim it actually advocates, in positive form, one row per belief. A work that mocks a position is entered as the claim its mockery advances. No topic-label cells: each row must read as a complete claim whose truth can be argued. 3. Rows rank by their score column, never by editorial placement. A row without a page is plain text and contributes 0 until its page exists. 4. No worked numbers on this page. Examples live on their own pages (the worked media evaluation and the Hamlet pages); link when the page exists, do not restate. 5. Naming a persuasion pattern (strawman, incoherent character, rewarded choice) is an argument like any other: it enters a table, gets replies, and changes nothing until it outscores them. No automatic penalty. 6. Craft and truth are scored on different tables and never mixed. A beautifully made work can carry false claims; a dull one can carry true ones. 7. Link this site's own routes (/media, /beliefs/[slug], /algorithms/*). Never link to a page that does not exist; use plain text until it does. Contact routes to /contact or the GitHub repository, never an email address. No em dashes anywhere on the page; use commas, parentheses, or separate sentences.

*Home (`/`) › Media (`/media`) › [Title]***

# [Title]

[Creator] · [Year] · [Book / Film / Series / Song / Image / Article / Study / Podcast / Video] · [Where to find it]([publisher, IMDb, journal or streaming URL]) · Reviewed by [Name], [Date]

Two questions, kept apart on purpose. Is it well made? That is craft, argued on this page. Is what it carries true? That is answered on the belief pages it links to, and this page only reads their scores. Multiply the second by how many people saw it and you get the number that matters: the work's net push on what people believe.

---

## 📋 Scorecard

| Score | Value | Read from | What it tells you |
|---|---|---|---|
| Quality Score | [0 to 1] | The Quality Arguments table below | How well the work makes its case: accurate, well reasoned, well made, built on primary sources. Says nothing about whether its message is true. |
| Influence Score | [0 to 1] | The Influence Arguments table below | Whether exposure changed anything: citations, minds changed on record, policy that traces to it. A huge audience that already agreed scores low here. |
| Reach | [N people] | Typed, with its source: [admissions, copies sold, views or circulation; source and date] | People exposed. The one typed number on the page, and the only one that is a measurement rather than a score. |
| Media Truth Score (`/algorithms/media-truth-score`) | [−1 to +1] | The Beliefs table below: each belief's truth, weighted by how central it is to the work | How true the work's message is, on balance. Negative means its central claims score false on their own pages. |
| Epistemic Impact | [±N] | Media Truth Score × Reach | Net push on collective belief, in truth-weighted exposures: each exposure counted at the truth value of what was seen. Large and negative is the dangerous quadrant: well made, widely seen, wrong. |

Bottom line: [One sentence scoped to what the tables below actually show. The only typed sentence in this box.]

Brackets are placeholders until the tables below are filled; a placeholder is never presented as a computed value. Formulas are in the Scoring Engine section at the end.

---

## 🔍 Beliefs This Work Carries

Every story argues for something, usually without saying so. Each row is one claim the work advances, in positive form, linked to the belief page where that claim is argued by everyone, not just by this work. Centrality says how much of the work rides on the claim; truth says how the claim fares on its own page. Rows rank by the size of their epistemic impact.

| Belief the work advances | How the work carries it | Centrality<br>media linkage (`/algorithms/linkage-scores`), 0 to 1 | Belief truth<br>from its page, −1 to +1 | Epistemic impact<br>truth × centrality × reach | On the belief page? |
|---|---|---|---|---|---|
| [[Claim, as a complete sentence]]([belief page URL, /beliefs/the-belief-slug]) | [Argued outright / Shown as admirable or rewarded / Assumed in the premise / Punished in a villain or a failure] | [0 to 1] | [±X] | [±N] | [Cited in its Media Resources table / Missing: add it] |
| Where in the work: [scene, chapter, lyric, frame or passage that carries the claim]<br>Centrality argued at: [[linkage page for this work and this belief]]([media linkage page URL, /arguments/the-edge-id/linkage]) (reasons the claim is or is not central to the work; a claim carried by the hero's rewarded choices can be more central than one a character states aloud) |   |   |   |   |   |
| [Second claim, as a complete sentence, plain text until its page exists] | [How carried] | [0 to 1] | 0 (no page yet) | 0 | [Missing: create the belief page first] |

Media Truth Score = sum of (belief truth × centrality) ÷ sum of centrality, across the rows above. A belief without a page reads 0 and contributes nothing until it has one. How a work carries a claim is a description, not a multiplier; it points the centrality debate at the right evidence. The mechanism, and why the claims a work never states aloud are often the ones it carries hardest, is on the Media Truth Score (`/algorithms/media-truth-score`) page.

---

## ⚖️ Quality Arguments

Craft only. Is the work accurate, well reasoned, well made, and built on primary sources? Reasons here are about the work itself, never about whether the beliefs it carries are true; that debate lives on their pages. A reason that names a persuasion pattern (see below) belongs on the right side of this table.

**✅ Reasons to agree the work is well made / ❌ Reasons to disagree**

| Argument | Score | Linkage (`/algorithms/linkage-scores`) | Importance (`/algorithms/importance-score`) | Impact | Argument | Score | Linkage (`/algorithms/linkage-scores`) | Importance (`/algorithms/importance-score`) | Impact |
|---|---|---|---|---|---|---|---|---|---|
| ACCURATE<br>[[Its checkable facts hold up: specific claim, in a sentence]]([argument page URL]) | [Score] | [Linkage] | [Importance] | [Impact] | ERRORS OF FACT<br>[[A checkable claim in the work that is wrong, in a sentence]]([argument page URL]) | [Score] | [Linkage] | [Importance] | [Impact] |
| WELL REASONED<br>[Its conclusions follow from its evidence: where, and why] | [Score] | [Linkage] | [Importance] | [Impact] | WEAK REASONING<br>[A conclusion that outruns the evidence shown, or a character made incoherent to reach it] | [Score] | [Linkage] | [Importance] | [Impact] |
| WELL MADE<br>[Clear, crafted, holds attention: the specific choice that earns this] | [Score] | [Linkage] | [Importance] | [Impact] | POORLY MADE<br>[Hard to follow, careless, or padded: where] | [Score] | [Linkage] | [Importance] | [Impact] |
| PRIMARY SOURCES<br>[Built on original data, documents or testimony: which] | [Score] | [Linkage] | [Importance] | [Impact] | ONE-SIDED<br>[The strongest opposing case it leaves out, linked from the table below] | [Score] | [Linkage] | [Importance] | [Impact] |
| Pro Total |   |   |   | [Pro_Total] | Con Total |   |   |   | [Con_Total] |

Impact = Score × Linkage × Importance for each row. Quality Score = Pro Total ÷ (Pro Total + \|Con Total\|), smoothed as in the Scoring Engine section so an empty table reads 0.5 rather than a verdict. The four lead-in words per side are starters, not fixed content; replace them when a better reason arrives. Reasoning quality has its own definition page, Media Logical Validity Score, on the wiki; it has no route here yet.

---

## 📣 Influence Arguments

Reach counts exposures. Influence asks whether the exposures did anything: is the work cited, did people say it changed their minds, does a law or ruling trace to it? Reasons here are about effect, never about quality; a bad book can be influential.

**✅ Reasons to agree the work has shaped what people think, say or do / ❌ Reasons to disagree**

| Argument | Score | Linkage (`/algorithms/linkage-scores`) | Importance (`/algorithms/importance-score`) | Impact | Argument | Score | Linkage (`/algorithms/linkage-scores`) | Importance (`/algorithms/importance-score`) | Impact |
|---|---|---|---|---|---|---|---|---|---|
| WIDELY CITED<br>[Other work builds on it: which, and how often] | [Score] | [Linkage] | [Importance] | [Impact] | RARELY CITED<br>[Little follows from it: the citation record] | [Score] | [Linkage] | [Importance] | [Impact] |
| CHANGED MINDS ON RECORD<br>[People say it moved them: surveys, testimony, documented reversals] | [Score] | [Linkage] | [Importance] | [Impact] | PREACHING TO THE CONVERTED<br>[Read or watched mainly by people who already agreed: the audience evidence] | [Score] | [Linkage] | [Importance] | [Impact] |
| REACHED A BROAD AUDIENCE<br>[Sales, admissions, views or coverage, beyond its natural constituency] | [Score] | [Linkage] | [Importance] | [Impact] | SMALL AUDIENCE<br>[Few reached, or reached briefly] | [Score] | [Linkage] | [Importance] | [Impact] |
| SHAPED POLICY<br>[A law, ruling, standard or budget that cites it] | [Score] | [Linkage] | [Importance] | [Impact] | NO TRACE IN POLICY<br>[No decision cites it; the change people credit it with predates it or has another documented cause] | [Score] | [Linkage] | [Importance] | [Impact] |
| Pro Total |   |   |   | [Pro_Total] | Con Total |   |   |   | [Con_Total] |

Influence Score = Pro Total ÷ (Pro Total + \|Con Total\|), smoothed as below. Reach is recorded separately and typed once: [N] people, measured as [admissions / copies sold / views / circulation], per [source, date]. A work credited with a change that predates it is the commonest error on this table; the date check belongs in the row.

---

## 🚫 The Strongest Case the Work Leaves Out

What a work omits shapes belief as much as what it shows. Each row is the best argument against a claim the work carries, taken from that belief's own page, not invented here. Every row doubles as a One-sided reason in the Quality table above.

| Omitted argument (linked to its page) | Against which belief above | Its score on the belief page | Where the work could have carried it |
|---|---|---|---|
| [[The strongest opposing argument, as a complete sentence]]([argument page URL]) | [Belief row it answers] | [Score] | [The scene, chapter or character that could have voiced it, and what the work gave that slot to instead] |

---

## 🎭 Persuasion Patterns

How a story carries a claim past the reader's guard. Naming a pattern is an argument, scored like any other: it goes into a table, draws replies, and changes nothing until it outscores them. There is no automatic penalty for an accusation. Each pattern usually scores twice: as a reason to disagree on Quality (weak reasoning or one-sided) and as a reason the claim is central on its linkage page, because a work that labors to carry a claim has made it central.

| Pattern | What it looks like | Where it scores on this page |
|---|---|---|
| Rewarded choice | The story rewards a choice whose documented real-world consequences run the other way, so the audience learns the reward, not the record. | Weak reasoning (Quality, disagree); centrality of the claim the choice embodies (linkage page, agree). The record itself is argued on the belief page, not here. |
| Weakest opponent | The opposing view gets its least capable advocate, or is voiced only by the villain. | One-sided (Quality, disagree). The row in The Strongest Case the Work Leaves Out names what a capable advocate would have said. |
| Incoherent character | A character acts against their own established competence or values at the moment the plot needs the claim to land. | Weak reasoning (Quality, disagree). Say which trait the scene contradicts and where that trait was established. |
| Emotional timing | Music, pacing and imagery peak exactly when the claim arrives, so it is felt before it can be examined. | Centrality (linkage page, agree): the work spends its strongest craft on this claim. Not a quality defect by itself; a true claim can be scored this way too. |
| Selected outcomes | The audience sees the cases where the behavior worked, never the base rate. | One-sided (Quality, disagree); the base rate belongs on the belief page as evidence. |

---

## 💡 Who Gains if the Audience Believes It

Each belief the work carries serves somebody. Listing them is not an accusation against the work; it is how a reader checks whether a claim is being carried because it is true or because it pays. Interests link to their own pages, where their validity is argued.

| Interest (linked to its page) | Belief above that serves it | How they gain, or what they pay, if the audience believes it |
|---|---|---|
| [[Who] need [what]]([interest page URL]) | [Belief row] | [Concrete gain or cost, in the interest's own units] |

---

## 🏆 Is It a Great Work? Evidence and Objective Criteria

Carried over from the retired quality template: the empirical side of the Quality question, so that the Quality Arguments above can cite findings and agreed measurements instead of restating them. Arguments fail logically and go in the Quality table; evidence fails empirically and goes here. Scores stay blank until the rows exist.

### Evidence Ledger for the Quality claim

Format each item as Finding (Producer, Year), and name which Quality argument above it bears on, by that argument's opening words. Tier 1 = peer-reviewed or official, Tier 2 = expert or institutional, Tier 3 = journalism or surveys, Tier 4 = opinion or anecdote. Standing is the verification lifecycle (Verified, Unverified, Disputed, Falsified). See the evidence scoring explainer (`/algorithms/evidence-scores`).

**✅ Supporting evidence (the work is well made) / ❌ Weakening evidence (it is not)**

| Evidence (Producer, Year) | Bears On | Tier | Standing | Linkage (`/algorithms/linkage-scores`) | Impact | Evidence (Producer, Year) | Bears On | Tier | Standing | Linkage (`/algorithms/linkage-scores`) | Impact |
|---|---|---|---|---|---|---|---|---|---|---|---|
| [Awards and recognition: won [Award] in [Year], nominated for [N] others (Awarding body, Year)] | [Well made] | [Tier] | Unverified |   |   | [Audience fatigue: audience scores sit well below critic scores (Aggregator, Year)] | [Poorly made] | [Tier] | Unverified |   |   |
| [Critical consensus: [N]% positive across [N] reviews (Aggregator, Year)] | [Well made] | [Tier] | Unverified |   |   | [Technical flaws: [specific issue] documented by [expert or body] (Producer, Year)] | [Poorly made / Errors of fact] | [Tier] | Unverified |   |   |
| [Cultural longevity: still widely read, watched or cited [N] years after release (Producer, Year)] | [Well made] | [Tier] | Unverified |   |   |   |   |   |   |   |   |

### Objective Criteria (`/algorithms/objective-criteria`) for a great [Book / Film / Song / Study]

Measurements both sides would accept in advance of seeing the result. Supporters and opponents of the Quality claim should predict different readings; a criterion both sides expect to come out the same way tests nothing. Keep at least one deliberately failing criterion, scored low with its reasons, so readers can see where the line is.

| Criterion | How to Measure | Reading That Would Strengthen | Reading That Would Weaken | Latest Reading | Score |
|---|---|---|---|---|---|
| Critical review aggregation | [Share of positive reviews on a named aggregator, with the review count] | [Above N% across at least N reviews] | [Below N%] |   |   |
| Awards per eligible category | [Wins and nominations divided by the categories the work was eligible for, by a named body] | [Wins in a majority of eligible categories] | [No nominations despite eligibility] |   |   |
| Longevity | [Still in print, in distribution or in syllabi N years after release; sales or citation counts by year] | [Sustained or rising use after N years] | [Out of print or unavailable within N years] |   |   |
| *[Failing criterion: one that feels relevant and is not, for example opening-weekend gross or chart position]*<br>[why it tracks marketing spend or release timing rather than the work] | [How it would be measured] | Low | Low |   | [low] |

---

## 🔮 Predictions the Work Made

What the work said would happen, and how it turned out. Shown, not counted: a prediction that failed is a reason to disagree under Quality Arguments (Errors of fact or Weak reasoning), where it is scored. Rows stay out until the work actually made the prediction; quote or cite where.

| Prediction (where in the work) | By when | How it turned out (source) |
|---|---|---|
| [What the work said would happen, as one sentence (chapter, scene or page)] | [Date or event] | [Borne out / Not borne out / Not settled yet, with the source that settles it] |

---

## 🧱 Hidden Assumptions and Bias Risks

What has to be true for the Quality and Influence scores above to hold, and the habits of thought that could be inflating or deflating them. Each is a claim with its own page, scored like any other; enter a premise the work's message needs as a belief row above, carried "assumed in the premise".

| Required for the scores to hold | Required for them to fail |
|---|---|
| [Assumption, as a complete sentence] | [Assumption, as a complete sentence] |

| Biases that inflate this work's scores | Biases that deflate them |
|---|---|
| [Bias, and where it shows] | [Bias, and where it shows] |

---

## 📚 Worked Examples and Definitions

Examples live on their own pages so this template never carries a frozen number: the worked media evaluation (the method worked by hand, labelled as illustration), the Hamlet quality page and Favorite Parts of Hamlet are on the wiki; link them from an instance of this page when a route for them exists here.

- Media Truth Score (`/algorithms/media-truth-score`): why stories outrun arguments, how claims are extracted and weighted by centrality, and the genre prior a work starts from.

- Media Quality Score: craft, scored apart from truth (defined in the Scorecard and Quality Arguments above; no separate route yet).

- Media Linkage Scores: centrality within the work, and the work's pull on each belief (the media case of Linkage Scores (`/algorithms/linkage-scores`)).

- Media Logical Validity Score: whether the work's own arguments hold together (no route yet; see Truth Scores (`/algorithms/truth-scores`) for the general rule).

- Linkage Scores (`/algorithms/linkage-scores`) and Importance Score (`/algorithms/importance-score`): the two multipliers on every argument row.

- Assumptions (`/algorithms/assumptions`): the premises a claim needs; enter a work's unstated premises as belief rows carried "assumed in the premise".

- Why we need to identify the best pro and con media for each belief (`/media/why-pro-con-media`): the case for keeping this table at all.

- The Belief Analysis template (templates/belief-analysis-template.html in the repository) for the belief pages this page links to; the Product Review template (templates/product-review-template.html, rendered at /product-reviews (`/product-reviews`)) for consumer products rather than works.

---

## 🧮 Scoring Engine

Every value on this page is computed from the tables above or read from a linked page. Nothing is typed except Reach and the bottom line.

| Quantity | How |
|---|---|
| Row Impact | Score × Linkage × Importance. Score is the row's own page score; Linkage and Importance are read from that row's linkage and importance pages, or from their starting constants when no page exists yet. |
| Quality Score, Influence Score | (Pro Total + 0.5k) ÷ (Pro Total + \|Con Total\| + k), with k = 1, so an empty table reads 0.5 and one strong row cannot read as certainty. With k = 0 this is the plain agree share. |
| Centrality | The agree share of the media linkage page for this work and this belief, computed the same way. |
| Belief truth | Read from the belief page, on the signed scale: −1 (debunked) through 0 (balanced, or no page yet) to +1 (well supported). |
| Media Truth Score | Sum of (belief truth × centrality) ÷ sum of centrality, over the Beliefs table. |
| Epistemic Impact | Media Truth Score × Reach. Unit: truth-weighted exposures. Per row: belief truth × centrality × Reach, which the Beliefs table ranks by. |
| Completeness | Both sides argued on both argument tables, at least one belief row with a page, Reach carrying a source. Until then the Scorecard shows placeholders, never values. |

Score pages define each term in full; this table only states how they combine. Where the engine in the repository (src/core/scoring/media-truth.ts) and a page disagree, the engine is canonical.

---

### Contribute

Add a belief the work carries, a reason on either side of either table, or the opposing case it left out. Every row is a claim with its own page or plain text until it has one; no row carries a typed score. New analyses and corrections: Contact (`/contact`), or open an issue or pull request on [the GitHub repository](https://github.com/myklob/ideastockexchange).

ISE Media Analysis template v4 (2026-10-03), GitHub form · Media (`/media`) · ~Myclob
