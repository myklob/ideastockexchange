# Media

## Why we link media to beliefs

To effectively challenge flawed ideas, we must identify the **most impactful media** (books, documentaries, podcasts, images and scientific studies) that significantly influence each belief.

- Linking **supporting and opposing media** side by side encourages balanced understanding.
- Extracting arguments from media sources (books, poems, films) and analyzing them prevents misinformation.
- This process promotes critical thinking and a willingness to consider alternative perspectives.

That is the owner's case, and it still stands. A film teaches its ethics to more people than every analysis of those ethics put together. Nobody changed their mind about the death penalty because of a well-formatted table; plenty changed it because of a movie. If a debate platform ignores the books and films that actually carry beliefs into people's heads, it is studying the plumbing and ignoring the water.

The rest of this page says what the running code does with the idea: the real formulas, constants and defaults, where the code has moved past the 2025 version of this page, and where the code and the owner's October 2026 direction on scoring disagree. Nothing proposed has been dropped for being unbuilt; it is labelled proposed.

**Two engines.** The repository runs two implementations that disagree about media. The **published site** is `tools/static-site/`, which builds [myklob.github.io/ideastockexchange/beliefs/](https://myklob.github.io/ideastockexchange/beliefs/index.html). The **Next.js app** is `src/core/scoring/` plus its pages under `src/app/media/`. Where this page says "the site does", it means the first; "the app does" means the second. A third, older implementation of a popularity-weighted book score sits in `src/features/books/` and cannot run (see [Retired and dormant: the books feature](#retired-and-dormant-the-books-feature)).

**Two questions, kept apart on purpose.** Every work page on the site opens with the same sentence (code: `render_media` in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)): "Is it well made? That is argued on this page, under Quality Arguments. Is what it backs true? That is argued on the belief pages that cite it, and this page only reads their scores. A third question, whether it changed anything, is argued under Influence Arguments." A beautifully made propaganda film and a clumsy pamphlet that happens to be right are both real things, and a score that blends craft with truth lets the first borrow credibility it has not earned. The media template states the same rule as its authoring rule 6: "Craft and truth are scored on different tables and never mixed."

## How it works

Our platform allows users to:

1. Submit **top media choices** that support or oppose specific beliefs.
2. Provide **pro/con arguments** explaining why each media item is important.
3. Rank submissions based on argument performance and overall scores.

What each step is today:

| Step | Published site | Next.js app |
|---|---|---|
| 1. Submit media for or against a belief | **Built, through GitHub.** Every belief page has an "Add a book, study or film" form under its Media Resources table, and the best-works page (`media.html`) has a "Propose a book, study or film" form with a picker listing every belief. Each form is a plain GET to a prefilled GitHub issue; [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) checks what you typed against `data/claims_index.json`, and [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) runs the same duplicate check on the issue, then opens a pull request or, for a duplicate, records a vote for the work already there. There are no accounts. | **Not built.** There is no submission form or API for media; every `MediaResource` row comes from a seed script ([`prisma/seed-beliefs.ts`](https://github.com/myklob/ideastockexchange/blob/master/prisma/seed-beliefs.ts)). |
| 2. Pro/con arguments for why each item matters | **Built.** Every work has its own page with two argued tables: **Quality Arguments** (is it well made?) and **Influence Arguments** (did it change what people think, say or do?). "Why it is important" is the Influence table. | **Partly built.** `/media/[id]` shows "Reasons This Is Good Media" and "Reasons This Is Not Good Media" (`MediaQualityArgument` rows). There is no influence-argument table; influence is one typed number, `reach`. |
| 3. Rank by argument performance and overall scores | **Built.** Media rows on a belief page sort by their row score (below). The best-works page ranks every work under five yardsticks with competition ranks, so ties share a rank. | **Built.** `/media` sorts by Epistemic Impact; the belief page's Media Resources section ranks each side by `impactScore`. |

### Supported media types

The 2025 page listed:

- Books
- Movies
- Songs
- Laws
- Websites & links
- Videos
- Images (e.g., political cartoons, photojournalism)
- Podcasts

What each engine accepts today:

| 2025 type | Published site | Next.js app |
|---|---|---|
| Books | `Book` | `book` |
| Movies | `Film` | `movie` (shown as "Film") |
| Songs | Not a kind; would land under "Other works" | `song` |
| Laws | **Not media.** Laws are filed in a separate **Legal Framework** section on each belief page (edges section `law`, sides read as `law_for` and `law_against`, code: [`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)), headed "Institutional agreement is a datum, not proof." | **Not media.** A separate `LegalEntry` model. |
| Websites & links | Not a kind. The `where_found` column holds a link for any work. | Not a kind. The `url` field holds a link for any work. |
| Videos | `Video` | No `video` type, though the genre table recognises the word (below) |
| Images | Not a kind | `image` |
| Podcasts | `Podcast` | `podcast` |

The site's full list is "Book, Study, Article, Report, Film, Podcast, Video" (code: `ise_tables.py`), shown on the best-works page as Best books, Best studies, Best reports, Best articles, Best films, Best podcasts, Best videos, plus **Other works** for anything else (code: `KINDS_OF_WORK` in `render_site.py`). The app's `mediaType` values are `book`, `article`, `podcast`, `movie`, `song`, `poem`, `image` and `scientific_paper` (code: [`prisma/schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma)). So the app has songs, poems and images and the site does not; the site has studies, reports and videos as their own kinds and the app does not.

## Examples

The 2025 page's examples:

- *Freakonomics* by Steven D. Levitt and Stephen J. Dubner: exploring hidden sides of social and economic phenomena.
- *An Inconvenient Truth* (Al Gore): highlighting urgency of climate action.

Both are **illustrative; neither is in any corpus.** *Freakonomics* appears nowhere in the repository. *An Inconvenient Truth* appears once, as a typed illustration in the app's explainer at `/algorithms/media-truth-score` ([`page.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/app/algorithms/media-truth-score/page.tsx)): Documentary, carrying "Climate change requires action", +0.70, "Core claims strong; some predictions overstated". The table is marked illustrative, and no code computed that +0.70.

Real examples, from the data:

- **On the published site** (calculation: the site's own engine run on `tools/static-site/content/` on 17 October 2026). The site files 177 works: 52 articles, 47 studies, 47 books, 22 reports, 6 films and 3 podcasts, across 196 beliefs. The belief [Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html) (topic: [Public office and private gain](https://myklob.github.io/ideastockexchange/beliefs/t/public-office-private-gain.html)) lists [Ziobrowski, Cheng, Boyd and Ziobrowski (2004)](https://myklob.github.io/ideastockexchange/beliefs/p/ziobrowski-cheng-boyd-ziobrowski.html) and [Insider, Conflicted Congress (2021 to 2023)](https://myklob.github.io/ideastockexchange/beliefs/p/insider-conflicted-congress-2021.html) as supporting, and [Eggers and Hainmueller, Capitol Losses](https://myklob.github.io/ideastockexchange/beliefs/p/eggers-hainmueller-capitol-losses.html) as weakening. The most-cited work is [On Her Game: Caitlin Clark and the Revolution in Women's Sports](https://myklob.github.io/ideastockexchange/beliefs/p/her-game-caitlin-clark.html) (Christine Brennan, 2025), listed on three belief pages under the [Caitlin Clark](https://myklob.github.io/ideastockexchange/beliefs/t/caitlin-clark.html) topic.
- **In the app** (code: the seed in `prisma/seed-beliefs.ts`). The universal basic income belief carries a reading list: *Utopia for Realists* (Rutger Bregman), *Give People Money* (Annie Lowrey), *The Case for Universal Basic Income* (Stanford Basic Income Lab) and *The Ezra Klein Show: Andrew Yang on UBI* supporting; *The War on Normal People (critique sections)* (Andrew Yang), *Why Universal Basic Income Is a Bad Idea* (Eduardo Porter, NYT) and *EconTalk: The Costs of Universal Basic Income* opposing.

## Scoring system for sorting media

### The 2025 proposal: an eight-factor Impact Score

```
Impact Score = Sales Data Score × Engagement Score × UGC Score × Citation Score × Viewership Score × Validity Score × Linkage Score × Unique Score
```

**Status: proposed 2025, not implemented in either engine, and its five popularity factors are refused by design on the published site.** Every factor survives below with what replaced it.

| Component | 2025 definition | What exists today |
|---|---|---|
| **Sales Data Score** | Copies sold (normalized 0 to 1). | **Not implemented.** No normalised sales score exists anywhere. The app has one raw audience integer, `reach` (default 0, described in the schema as "copies sold, box office, streams, citations"), never normalised, used only in Epistemic Impact. The site records no sales figure at all; `reach` is not even a column in its pages table (code: `PAGE_COLS` in `ise_tables.py`). |
| **Engagement Score** | Likes, shares, comments (normalized). | **Not implemented.** No likes, shares or comments field exists in either engine. The only `socialShares` input is in the dead books feature. |
| **UGC Score** | User ratings from platforms like Goodreads, IMDb. | **Refused as a multiplier on the site.** "Most entertaining" is a yardstick that "Nothing on this site computes". A reader may propose a measurement on a work's page, under Objective Criteria ("for example, the share of people who finish it, or audience scores on a named site"), with its latest reading and source. So a Goodreads or IMDb figure can appear only as a typed, sourced reading on one work, never as a factor. The app has no rating field. |
| **Citation Score** | Frequency in academic/media citations. | **Replaced twice, neither a citation frequency.** (1) "Most cited here" counts the belief pages on this site that list the work, "a count of where the work is used here, not of how good it is". (2) "Widely cited" and "Rarely cited" are starter patterns for argued reasons in the Influence Arguments table, so citation evidence moves Influence only through a reason row that wins its argument. External citation counts feed nothing. |
| **Viewership Score** | Audience reach (for video/live content). | **Not implemented as a factor.** Same fate as Sales: the app's `reach` is the only audience figure. The site's engine table prints Reach as "not recorded ... No work here has one yet, so nothing is multiplied by it". |
| **Validity Score** | Argument strength from our forum. | **Split in two, neither called Validity.** Craft became the argued **Quality** score; the truth of the message became **carried truth**, read from the belief pages (below). There is no forum: argument rows arrive through GitHub issue forms. |
| **Linkage Score** | Confidence that the media truly supports/opposes the belief. | **Built, as Bears (site) and centrality (app).** The meaning shifted from "does it support or oppose?" (now the side column) to "how much of the work rides on this belief?". The site defaults to 1 when nobody has argued it; the app defaults to 0.5. See [[Linkage Scores]]. |
| **Unique Score** | Avoids double-counting redundant arguments. | **Not implemented for works.** No media row in either engine has a uniqueness factor. Uniqueness pages exist on the site only for ordinary argument rows (`DEFUNIQ = 1`), so the reason rows on a work's own page can carry one, but the work itself cannot. See [[The Redundancy Problem]]. |

Why the popularity factors were refused, on the site's own stated reasoning (code: the `works-important` entry in `render_site.py`): "How many people a work reached is recorded separately and is not this number: a huge audience that already agreed changes little." Multiplying sales into a score measures how good a work was at finding customers. Ten million copies sold to people who already agreed is a choir hearing its own sermon. The site would rather argue whether a work changed anyone's mind, and keep the head count beside it as a fact.

### What the published site computes: the row on a belief page

Each belief page has a **Media Resources** section with two tables, **Supporting** and **Weakening**, each work on its own row with columns Work, Type, Bears, Quality, Influence, Importance and Score (code: `media_table` in `render_site.py`):

```
Score = (2 × Quality - 1) × Bears × Influence × Importance
```

| Factor | Where it comes from | Default when nobody has argued it |
|---|---|---|
| Quality | The work page's truth score, from its Quality Arguments | 0.50 (the neutral starting point) |
| Bears | The row's linkage page (a linkage page of Type Media) | `DEFLINK = 1` when no linkage page exists |
| Influence | The work page's Influence score, from its Influence Arguments | `UNARG = 0.5` |
| Importance | The row's importance page | `DEFIMP = 0.5` |

The five constants are `K = 1`, `UNARG = 0.5`, `DEFLINK = 1`, `DEFIMP = 0.5` and `DEFUNIQ = 1` (code: `CONSTS` in [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)).

Two rules make this row behave very differently from the 2025 product:

1. **It is signed.** Quality enters as `2 × Quality - 1`, on a scale from -1 to +1, so a work nobody has argued (Quality 0.50) scores exactly 0. Listing a book proves nothing until someone argues it is any good. That is the same rule every argument row on the site follows (see [[Truth Score]]).
2. **It is shown, not counted.** The section says so in print: "These rows are shown, not counted: the belief score above is arguments, evidence and predictions only, because a book is a container for reasons rather than a reason." The 2025 BAQS note below anticipated this; the site made it the rule for every media number.

**Worked example** (calculation, same build): every one of the 177 works on the site today has Quality 0.50 and Influence 0.50, because nobody has yet filed a quality or influence reason on any work page. So all 187 media rows on belief pages score exactly 0.00. On the congressional-trading belief, the Ziobrowski row reads (2 × 0.50 - 1) × 0.50 × 0.50 × 0.50 = 0. That row's Bears is 0.50 rather than 1 because someone opened a linkage page for it ([`medi-ziobrowski-cheng-boyd-barring-members`](https://myklob.github.io/ideastockexchange/beliefs/p/medi-ziobrowski-cheng-boyd-barring-members.html)) and nobody has argued it yet; an empty page reads its own starting point of 0.50. Only 3 of the 187 media rows have a linkage page; the other 184 read `DEFLINK = 1`. That is the honest state of the corpus: the works are filed, and the arguing about them has not started.

### What the published site computes: Quality and Influence on a work's own page

Both scores use the rule every truth score on the site uses (code: `_share` and `evaluate` in `score_reference.py`; method page: [method.html#media](https://myklob.github.io/ideastockexchange/beliefs/method.html#media)):

```
Quality   = (agree + w × p0) / (agree + disagree + w)    over the Quality Arguments rows
Influence = (agree + w × p0) / (agree + disagree + w)    over the Influence Arguments rows
```

where `p0 = 0.50` and `w = K = 1` unless the work page declares a source type, replication count and agreement share (`etype`, `erq`, `erp`), in which case [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py) sets the starting point as `p0 = 0.5 + 0.5 × ESIW × (2 × ERP/100 - 1)` and its weight as k times a replication reward capped at `REP_CAP = 2.0` (twice k). Each reason row contributes the same signed amount as any argument on the site:

```
row = sign × (2 × Truth - 1) × Conf × Link × Imp × Uniq
```

so a reason nobody has argued contributes exactly 0, and a refuted reason counts against the side it was filed on. A row lands on the side its sign puts it on, not the side it was filed on.

The starter patterns that seed each side (code: [`build_subpages.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/build_subpages.py)):

| Table | Reasons to agree | Reasons to disagree |
|---|---|---|
| Quality Arguments | **Accurate** (its facts check out), **Well reasoned** (its conclusions follow from its evidence), **Well made** (clear, well crafted, holds attention), **Primary sources** (built on original data or documents) | **Errors of fact** (checkable claims that are wrong), **Weak reasoning** (conclusions outrun the evidence), **Poorly made** (hard to follow or careless), **One-sided** (leaves out the strongest opposing case) |
| Influence Arguments | **Widely cited** (other work builds on it), **Changed minds on record** (people say it moved them), **Reached a broad audience** (sales, views, coverage), **Shaped policy** (laws or rulings cite it) | **Rarely cited** (little follows from it), **Preaching to the converted** (read only by those who already agreed), **Small audience** (few reached), **No trace in policy** (no decision cites it) |

Notice where sales and citations went. They did not vanish; they became *reasons* ("Reached a broad audience: sales, views, coverage"), which means somebody can answer them ("Preaching to the converted"). A sales figure as a multiplier cannot be argued with. A sales figure as a reason can.

The spreadsheet tooling (`build_subpages.py`) still calls the second table "Impact Arguments"; the rendered site calls it "Influence Arguments". Same table, same numbers.

### What the published site computes: Accuracy of what it backs

The site never argues a work's truth on the work's page. It reads it from the belief pages that cite the work (code: `carried_truth` and `work_accuracy` in `render_site.py`):

```
carried truth = 2 × Truth(belief) - 1,   turned around (negated) when the work weakens the belief
Accuracy of what it backs = Σ(carried truth × Bears) / Σ(Bears)   over the belief pages that cite the work
```

It is blank ("none yet") until some belief cites the work. A work that argues *against* a false belief scores well, which is the point. The work page's **Beliefs This Work Carries** table lists each citing belief with Bears, Centrality, the belief's truth and the carried truth, ranked by |carried truth × centrality|, largest either way first, with competition ranks; if every row reads the same, the rows are listed supports first rather than numbered.

**Worked example** (calculation, same build): [Some Exploratory Findings on the Development of Musical Tastes](https://myklob.github.io/ideastockexchange/beliefs/p/some-exploratory-findings-development.html) (Morris B. Holbrook and Robert M. Schindler, 1989, a study) weakens the belief [Popular music really was better in the 1970s and 1980s than it is today](https://myklob.github.io/ideastockexchange/beliefs/p/popular-music-really-was.html) (topic: [Popular music](https://myklob.github.io/ideastockexchange/beliefs/t/popular-music.html)), which reads 0.41. Carried truth = -(2 × 0.41 - 1) = +0.18, Bears = 1, so its Accuracy is +0.18, the joint highest on the site. Across all 177 works, Accuracy runs from -0.18 to +0.18, and 96 works read exactly 0.00, because the beliefs they back have not been argued off 0.50 either.

This is a weighted average, not a sum. A sum would grow with every belief a work is filed under, which is the padding the site exists to stop (method page: "a score that grows with listing is the padding this site exists to stop").

### What the published site computes: the five yardsticks for "best"

The best-works page (`media.html`, explained section by section on [lists.html#works](https://myklob.github.io/ideastockexchange/beliefs/lists.html#works)) answers "best by what?" with five yardsticks rather than one blended number (code: `WORK_MEASURES` in `render_site.py`):

| Yardstick | Column | How | Question it answers |
|---|---|---|---|
| Most accurate | Accuracy | computed | Does what it backs hold up? |
| Most important | Influence | computed | Did it change what people think, say or do? |
| Best made | Quality | computed | How well does it make its case? |
| Most entertaining | Reading | typed | Does it hold the people it reaches? |
| Most cited here | Beliefs | counted | How many beliefs on this site cite it? |

Plus any yardstick a reader proposes on a work's page under Objective Criteria; the same yardstick proposed on two works becomes one, because the duplicate check sends the second to the page the first one made. A typed reading whose category or wording mentions entertainment or enjoyment is filed under Most entertaining (code: the `ENTERTAINING` pattern). Typed readings are ranked only when every one of them is a number; otherwise the works are listed by title, "because two sentences cannot be put in order without someone arguing which is higher". A yardstick on which every work of a kind ties is named and not ranked, because "a numbered order among ties would be made up". Today that is Best made and Most important, since every work ties at 0.50 on both; Most accurate does tell works apart, because the beliefs they back have started to move.

The site's reasoning for refusing one number: "The most accurate work on a question, the most important one and the most entertaining one are often three different works."

### What the Next.js app computes: Media Truth Score and Epistemic Impact

The app scores a work from its **claim ledger**: `MediaClaim` rows, each a claim the work makes (`claimText`), linked to the belief page where that claim is evaluated (`beliefId`, nullable), with a centrality (`linkageScore`, default 0.5: "0.95 = the work's entire thesis, 0.15 = peripheral detail"). Code: [`media-truth.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/media-truth.ts):

```
signed truth of a claim = clamp(belief positivity / 100, -1, +1)
Media Truth Score = Σ(clamp(signed truth, -1, 1) × clamp(centrality, 0, 1)) / Σ(centrality)
                    over claims that have a linked belief and centrality > 0, clamped to -1..+1
Epistemic Impact  = Media Truth Score × reach
```

A claim with no linked belief contributes nothing, however central. With no scoreable claim at all, the score falls back to the work's **genre prior** and is labelled `basis: 'genre-prior'`. The header comment says the code wins when the explainer and the code disagree.

Worked examples, pinned by [`media-truth.test.ts`](https://github.com/myklob/ideastockexchange/blob/master/tests/unit/core/scoring/media-truth.test.ts):

| Case | Inputs | Result |
|---|---|---|
| *The Good Earth* (the explainer's example) | claims 0.85 × 0.95 (women valued for utility), 0.78 × 0.90 (land = identity/status), 0.92 × 0.75 (famine drives migration), 0.65 × 0.15 (architectural detail) | 2.297 / 2.75 = **+0.84** (calculation) |
| Debunked thesis, peer-reviewed genre | -0.9 × 0.95, +0.8 × 0.1 | below 0, far below the 0.90 prior: genre cannot save it |
| Accurate, modest reach | +0.85 × 5,000,000 | Epistemic Impact +4,250,000 |
| Wrong and popular | -0.6 × 50,000,000 | -30,000,000 |
| The blockbuster case | -0.85 × 2,000,000,000 | about -1,700,000,000 |
| Nobody saw it | -1 × 0 | 0 ("an unseen claim moves nobody") |

Epistemic Impact is the app's one place where audience size multiplies anything, and it multiplies a *signed* truth: a compelling work built on debunked claims reaching billions is a huge negative number, not a big positive one. That is the 2025 page's five popularity factors collapsed into one typed integer, with the Validity factor replaced by signed claim truth and no Unique factor. `/media` lists every work sorted by Epistemic Impact, with columns #, Title, Type, Related Belief, Side, Quality, Truth, Reach, Epistemic Impact and Directness.

**The genre prior** (code: [`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts)):

| Genre | Starting truth | Reliability (genre score) | Tier |
|---|---|---|---|
| peer_reviewed | 0.90 | 1.00 | T1 |
| institutional | 0.80 | 1.00 | T1 |
| investigative | 0.70 | 0.75 | T2 |
| news_report | 0.60 | 0.75 | T2 |
| editorial | 0.40 | 0.50 | T3 |
| opinion | 0.30 | 0.25 | T4 |
| social_media | 0.15 | 0.25 | T4 |
| unknown | 0.50 | 0.50 | T3 |

A stored genre is trusted only when it is one of these eight; otherwise the genre is inferred from the media type: `book` investigative, `article` news_report, `academic`/`journal`/`paper` peer_reviewed, `report` institutional, `podcast`/`video`/`blog`/`song`/`movie` opinion, `documentary` investigative, `tweet`/`post` social_media, `editorial` editorial, `opinion` opinion, `news` news_report, anything else unknown (code: `inferGenreFromMediaType` and `resolveGenreType`). The published site has no genre prior for works; a work page starts at 0.50 unless it declares evidence.

**A scale mismatch worth knowing** (calculation from the code): the genre prior is a number from 0 to 1, but the claim-based score runs from -1 to +1, and the app shows both on the signed scale. So a work with no claims always reads positive, from +0.15 (social media) to +0.90 (peer-reviewed), on a scale where 0 means balanced. In the seed, the five claimless works get Epistemic Impact from their priors alone: *Give People Money* 0.70 × 250,000 = 175,000; *The Case for Universal Basic Income* 0.80 × 300,000 = 240,000; *The Ezra Klein Show* 0.30 × 500,000 = 150,000; *The War on Normal People* 0.70 × 400,000 = 280,000; *EconTalk* 0.30 × 350,000 = 105,000. *Utopia for Realists* (investigative, reach 1,200,000; claims at centrality 0.95, 0.85 and 0.55) and *Why Universal Basic Income Is a Bad Idea* (editorial, reach 2,000,000; claims at 0.9 and 0.7) earn claim-based scores. The seed leaves the podcasts claimless on purpose "so the genre-prior fallback is visible in the live readout".

**Two numbers share one name in the app.** `MediaResource.truthScore` is an older stored 0 to 1 number (default 0.5, "Derived from genreType and reliabilityTier"), and `aggregateMediaScores` averages it, weighted by each work's `genreScore`, onto the belief scorecard as "Media truth: average truth score of linked media" and "Media genre: reporting-vs-opinion mix of linked media". That is not the signed claim-based score on `/media`. A work can read +0.70 on the belief scorecard and -0.40 on its own page.

Other app fields with no site counterpart: `qualityScore` (stored, default 0.5, "A beautifully crafted propaganda film can score high here"), `impactScore` (default 0.5, what the belief page ranks by), `directnessOfAdvocacy` (0 to 100, default 50: "100 = explicit thesis. 0 = purely implicit normalization through narrative") and `howItArgues` (free text). On `/media/[id]`, the displayed Quality Score is Σ|impactScore| of the pro quality arguments minus Σ|impactScore| of the con ones, an unbounded difference rather than the site's bounded share.

## Website features

The 2025 page promised:

- Submit media agreeing/disagreeing with a belief.
- Vote on media relevance and accuracy.
- Weigh credibility higher for users who:
  - Have read/seen the media
  - Have purchased or reviewed it
  - Written essays or analyses

| Feature | Status |
|---|---|
| Submit media agreeing or disagreeing with a belief | **Built on the site only**, through the GitHub issue forms described above. `test_render.py` checks that every belief is an option in the best-works page's picker. Nothing in the app lets a visitor add media. |
| Vote on media relevance and accuracy | **Built, and deliberately inert.** A work page has Agree and Disagree vote links on its heading; a work's row on a belief page carries the same plus "Bears on this: yes / no" (a vote on relevance) and, where the row has an importance page, "Matters here: yes / no". Votes land in `content/votes.csv`, "one row per (page key, on, GitHub login), latest wins; shown on the page, never scored" (README). Every page prints: "Votes are shown as what people think, next to what the analysis says, and never move a score." The app has no media votes. |
| Weigh credibility higher for readers, buyers, reviewers and essayists | **Not implemented.** No reader-status flag or credibility weight exists in either engine, and on the site the question is moot by design: votes carry zero weight whoever casts them, and contributions are reasons in tables, scored by argument rather than by contributor. The media template's header keeps a "Reviewed by [Name], [Date]" line as attribution, not weight. |

**The owner's direction (October 2026) on votes:** there are many scores; track what is popular separately from what stands up to analysis. Votes may decide what is promoted and given attention, never what is valid, and the gap between the two is worth showing because it says where people need more time with the argument. The site already does this: a home-page card ranks the gap between vote share and truth score once anyone has voted. A credibility weight for people who have read the work would fit that direction as a weight on *attention* (which works to show first), never on a score. The direction also names "the contributor's record" as an acceptable starting guess for an unargued linkage, so a reader's history could one day seed where a Bears page starts. Neither is built.

## Book scoring metrics (proposed 2025, superseded)

Nothing named BAS, BLS, BTS, BUS, BIS or BAQS exists in either engine under any name. Every formula is kept here, each labelled with what replaced it.

### Book Accuracy Score (BAS)

```
BAS = Σ(BLS × BTS × BUS × BIS)
```

- **BLS**: Book Linkage Score. Alignment between book points and belief.
- **BTS**: Book Truth Score. Average of logical soundness and verifiability scores.
- **BUS**: Book Uniqueness Score. Novelty of claims.
- **BIS**: Book Importance Score. Popularity, reviews, citations.

**Example BTS formula:**

```
BTS = (Logical Soundness Score + Verifiability Score) / 2
```

| 2025 metric | Status | What replaced it |
|---|---|---|
| BAS | **Superseded.** | Two weighted *averages*, not sums: the site's Accuracy of what it backs, Σ(carried truth × Bears) / Σ(Bears), and the app's Media Truth Score, Σ(signed truth × centrality) / Σ(centrality). Neither has a uniqueness or importance factor. The per-row product that does exist on the site, (2 × Quality - 1) × Bears × Influence × Importance, is one row per work per belief and is shown, not counted. |
| BLS | **Superseded** by Bears (site) and centrality (app). | The 2025 sample computed an unbounded sum of pro minus con. A site linkage page scores the bounded share (agree + w × p0) / (agree + disagree + w), between 0 and 1, and reads `DEFLINK = 1` when no page exists; the app's centrality is a stored number defaulting to 0.5. |
| BTS | **Refused by design.** | Both engines refuse to argue a work's truth on the work's page. Site: "Is what it backs true? That is argued on the belief pages that cite it, and this page only reads their scores." App (`media-truth.ts`): "each claim is evaluated at its own belief page, across ALL sources that make it". The reason is the one-claim-one-page rule: if *Freakonomics* and a journal article both claim the same thing, that claim should have one truth score, not one per book that repeats it. The (validity + verification) / 2 shape survives only at the belief level, in the app's `calculateTruthScoreBreakdown` ("Truth Score = (Logical Validity + Verification) / 2"). The media template still names a "Media Logical Validity Score" and says it "has no route here yet"; nothing computes it. |
| BUS | **Not implemented for works.** | Uniqueness pages exist as a kind on the site and multiply argument rows (default `DEFUNIQ = 1`), but no media row or media page carries one, and the app has no uniqueness field on media. Novelty of a work's claims is not measured. |
| BIS | **Superseded**, split three ways. | (1) **Influence**, argued on the work page, starting at 0.50. (2) **Importance**, the row's importance page on a belief page, default `DEFIMP = 0.5`. (3) **Reach**, typed: an integer in the app, "not recorded" on the site, and the one typed number the media template allows ("The one typed number is Reach, and it carries its source"). No averaging of sales, reviews and citations exists. |

### Book Aesthetic Quality Score (BAQS)

Evaluates:

- Clarity
- Flow
- Originality
- Style
- Engagement
- Grammar
- Brevity
- Humor
- Imagery

**Note:** BAQS may not affect belief scores unless linked to argument quality, but it helps identify "best" books for/against a belief.

**Status: superseded by the argued Quality score.** Craft on the site is the Quality Arguments table with its starter patterns (Accurate, Well reasoned, Well made: "clear, well crafted, holds attention", Primary sources; against them Errors of fact, Weak reasoning, Poorly made, One-sided), ranked on the best-works page as **Best made**. In the app, Part 2 of a work page, "Quality Arguments: Is This Media Good?", evaluates "craft, originality, entertainment value, emotional impact", with the note that quality is independent of truth. The 2025 caveat is now the implemented rule on the site, stronger than proposed: no media number affects a belief score at all. Humor and engagement, the part of BAQS about holding an audience, became the typed **Most entertaining** yardstick rather than a computed one.

<details><summary>Original sketch (2023), not what runs</summary>

What runs instead is the bounded share `(agree + w × p0) / (agree + disagree + w)` and the signed row `sign × (2 × Truth - 1) × Conf × Link × Imp × Uniq` in [`tools/static-site/score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), with media read by `media_table`, `carried_truth` and `work_accuracy` in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py); nothing in the repository produces the `pro_score`/`con_score` dictionaries these functions expect.

**Calculate BAS**

```python
def calculate_BAS(books):
    BAS = 0
    for book in books:
        BLS = calculate_BLS(book)
        BTS = calculate_BTS(book)
        BUS = calculate_BUS(book)
        BIS = calculate_BIS(book)
        BAS += BLS * BTS * BUS * BIS
    return BAS
```

**Book Linkage Score**

```python
def calculate_BLS(linkage_args):
    return sum(arg['pro_score'] - arg['con_score'] for arg in linkage_args)
```

**Book Truth Score**

```python
def calculate_BTS(logical_soundness_args, verifiability_args):
    LS = sum(arg['pro_score'] - arg['con_score'] for arg in logical_soundness_args)
    VS = sum(arg['pro_score'] - arg['con_score'] for arg in verifiability_args)
    return (LS + VS) / 2
```

**Book Uniqueness Score**

```python
def calculate_BUS(uniqueness_args):
    return sum(arg['pro_score'] - arg['con_score'] for arg in uniqueness_args)
```

**Book Importance Score**

```python
def calculate_BIS(SS, RS, CS):
    return (SS + RS + CS) / 3
```

</details>

Why the sums were not carried forward (the site's reasoning, method page on EVS): "an unbounded sum grows with every finding listed, and a score that grows with listing is the padding this site exists to stop." The site keeps exactly one unbounded number, EVS, and prints it while nothing reads it (see [[Evidence Verification Score (EVS)]]).

## Retired and dormant: the books feature

The 2025 page's idea of a popularity-weighted book score was once written as code, in [`src/features/books/services/book-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/books/services/book-scoring.ts). **It cannot run.** `book-service.ts` opens with `@ts-nocheck` and the note "Book models depend on a schema that is not active in the current SQLite setup", `prisma/schema.prisma` has no `Book` model, and the routes that import it (`/books/[id]`, `/api/books`, `/api/books/[id]/analysis`) would throw on first use. For the historical record, its formulas:

| Function | Formula |
|---|---|
| Belief impact ("Belief R0") | log10(sales + citations + socialShares), 0 when the total is 0 or less |
| Book quality | writingClarity × 0.2 + goalAchievement × 0.3 + readerEngagement × 0.2 + originality × 0.15 + historicalImportance × 0.15 |
| Claim validity | (AI × 0.3 + Crowd × 0.5 + Expert × 0.2) × 100 |
| Total impact on a belief | logicalValidity × quality × topicOverlap × log(reach) |
| Centrality weights | thesis 1.0, major 0.7, supporting 0.4, tangential 0.2, footnote 0.1 (unknown 0.5) |
| Time decay | none if verified within 12 months; otherwise 5% per year after 5 years, capped at 50% |
| Author truth equity | average book validity × 0.7 + prediction accuracy × 0.3; 50 for an author with no books |

The fixed weights (0.2, 0.3, 0.15) and the "AI 0.3" share are exactly what the published engine refuses: a number nobody argued, and a number a model asserted. CLAUDE.md is blunt that a number a model asserted "is the one thing the published engine refuses to carry".

## The work page, section by section

Each work on the site gets one page, laid out in the order of [`templates/media-analysis-template.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/media-analysis-template.html) (wiki twin: [[Template: Media Analysis]]), an order `test_render.py` pins. There is no score or verdict above the arguments; the scorecard is the Scoring Engine at the foot.

1. **Beliefs This Work Carries**: each citing belief, its Bears, centrality, truth and carried truth, and the Accuracy line.
2. **Quality Arguments**: craft only, "never about whether the beliefs it backs are true".
3. **Influence Arguments**: effect only; "a bad book can be influential".
4. **The Strongest Case Against What It Carries**: for each belief the work backs, the best-scoring reason on the other side, taken from that belief's own page, not written here. If the work leaves it out, that is a One-sided reason under Quality Arguments.
5. **Persuasion Patterns** (below).
6. **Who Gains if the Audience Believes It**: interests read from each belief's own page for the side the work takes, ranked by validity, plus any typed on the work page. "Listing them is not an accusation." See [[Likely Interests of Those Who Agree and Disagree]].
7. **Is It a Great Work? Evidence and Objective Criteria**: findings about quality (awards, critical consensus, documented errors, staying power) and proposed yardsticks with their latest reading. Shown, not counted; a finding moves Quality only through a reason that cites it.
8. **Predictions the Work Made**: borne out so far, and not borne out. A failed prediction is scored as a reason to disagree under Quality Arguments.
9. **Hidden Assumptions and Bias Risks**: what must hold for the scores to hold, and biases inflating or deflating them. See [[Assumptions]].
10. **Definitions**, then the **Scoring Engine** (Quality score, Influence score, Accuracy of what it backs, Beliefs citing it, Reach "not recorded", ReasonRank and Work value), then **Contribute**.

## Mechanisms the 2025 page never named

### Persuasion patterns, argued rather than penalised

The media template names five ways a work can carry a claim past a reader's guard (code: `PERSUASION` in `render_site.py`):

| Pattern | What it is | Where it is argued |
|---|---|---|
| Rewarded choice | The story rewards a choice whose documented real-world results run the other way, so the audience learns the reward, not the record. | Weak reasoning, under Quality Arguments; the record itself on the belief page. |
| Weakest opponent | The opposing view gets its least capable advocate, or is voiced only by the villain. | One-sided, under Quality Arguments. |
| Incoherent character | A character acts against their own established competence or values at the moment the plot needs the claim to land. | Weak reasoning; say which trait the scene contradicts and where it was established. |
| Emotional timing | Music, pacing and imagery peak exactly when the claim arrives, so it is felt before it can be examined. | The linkage page for how central the claim is. "Not a defect by itself: a true claim can be carried this way too." |
| Selected outcomes | The audience sees the cases where the behavior worked, never how often it does. | One-sided; how often it works goes on the belief page as evidence. |

"Naming a pattern is a reason like any other: it goes in a table above, draws replies, and changes nothing until it outscores them. There is no automatic penalty for an accusation." That is the owner's October 2026 direction on fallacies applied to media: software or a reader may flag, nothing is final, and a flag alone moves no score. Today no work page names one yet.

### The topic page's Best Media and Resources table

Every topic page (laid out like [[Template: Topic]]) has a **Best Media and Resources** table: every work cited on a belief page in the topic, sorted by Influence, with columns Title, Medium, Bias/Tone, Positivity, Claim Strength, Quality and Key Insight (code: `media_section` in `render_site.py`). The extras come from `topic_media` rows typed on the topic ("medium: Book | tone: Academic | positivity: +60 | strength: 50 | escalation: 2 | insight: ...", per `ise_tables.py`) and are displayed, never scored. Since every work ties at Influence 0.50 today, the order is not yet meaningful.

### ReasonRank and work value

Media rows are part of the network ReasonRank walks (`media_for` and `media_against` are among the row keys in [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py), damping 0.85), so each work page prints how much of the site relies on it and a **Work value** = ReasonRank × (1 - confidence): how much settling that work's page would be worth to everything above it. See [[ReasonRank]].

### What counts a work, and what does not

The owner's count-every-reason rule ([`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py), printed beside every belief's argued truth score) counts reasons, findings and predictions; it does not read media rows either. So no score on the site, argued or tallied, moves because a book was listed.

## Where the site meets the owner's direction (October 2026)

| Direction | What the site does with media today | Gap |
|---|---|---|
| **Volume**: count truly independent reasons, weigh pro against con, count contributions from the moment they are posted. | A work is "a container for reasons rather than a reason", so the work itself counts nowhere; the reasons it carries count when filed as reasons, evidence or predictions on the belief page. Reasons on a work's own page count under the argued rule (zero until argued). | The owner's judgment would apply the count-from-posting rule to the reason rows on work pages; `tally.py` does not read work pages yet. Whether a work's row should ever count is open (below). |
| **Votes**: attention, never validity. | Matches: votes shown, never scored. | None. |
| **Fallacies**: flag, argue, never final. | Matches: persuasion patterns are reasons with no automatic penalty. | None. |
| **Linkage with no argument**: start trusting, fall when argued down, rise when argued well. | Bears reads `DEFLINK = 1` with no linkage page, which matches. | Opening a linkage page that nobody has argued drops Bears from 1 to 0.50 (the Ziobrowski rows), so a row falls by being *examined*, not by being argued down (calculation). The app starts centrality at 0.5. |
| **Evidence weight**: prefer no ceiling. | A work page may declare `etype`/`erq`/`erp`, which sets where Quality and Influence start, with replication capped at `REP_CAP = 2.0` × k. | `tally.py` uses ESIW × ERQ × ERP/100 uncapped for findings, but it does not read work pages. |
| **Choices of action**: cost and benefit across every legitimate interest. | Who Gains if the Audience Believes It reads the interests from the belief pages. | No cost-benefit of a work's effect exists. |

## Conclusion

By linking media to the beliefs they support or challenge, and scoring them across **accuracy, truthfulness, uniqueness and importance**, we create a transparent, balanced and evidence-based framework for public discourse.

What that means in the code today: accuracy and truthfulness became one number, read from the belief pages a work backs (site: Accuracy of what it backs; app: Media Truth Score). Importance became argued Influence plus a typed Reach (site) or a typed reach multiplied into Epistemic Impact (app). Craft became its own argued Quality score. Uniqueness is absent from both engines for works. And every work, however famous, starts at the neutral point and has to be argued up from there, which is what turns a reading list into an argument.

## Open questions for the owner

1. **Should audience size ever multiply a media score, and in which role?** Options: (a) keep the site's rule: influence argued, reach typed and sourced beside it, nothing multiplied; (b) adopt the app's rule across both engines, reach × signed truth as a *ranking* called Epistemic Impact, never a score, which means adding a reach column to the pages table; (c) implement the 2025 normalised factors, which means defining the normalisations, the data sources and a page arguing each factor.
2. **Does a work's row count toward the belief score, or is it shown only?** Options: (a) shown, not counted, in both engines, and drop or relabel the app's "Media truth" scorecard row; (b) counted as evidence when the work is a primary source (a study), shown only when it is a container (a book or film), which needs a rule for the split; (c) counted everywhere, which reintroduces padding by citation.
3. **Where is a work's truth argued?** Options: (a) keep the design, retire BTS and strike the "Media Logical Validity Score" mention from the template; (b) add a third argued table on the work page for the work's own reasoning, kept apart from Quality and carried truth, with a page explaining why it is not double-counting "Well reasoned"; (c) restore BTS as a per-work truth score, which contradicts one claim, one page.
4. **Should uniqueness apply to works?** Options: (a) say deduplication happens at the claim level (two works carrying one claim link to one belief page); (b) add a Uniq factor to the site's media row so three works making one point do not show three equal rows; (c) add a novelty argument table, the 2025 BUS, as a sixth yardstick.
5. **Do votes on media ever carry weight, and are some voters weighted more?** The direction on votes points to (a): votes inert and shown, credibility weighting retired or used for display order only.
6. **Which Media Truth Score is canonical on the app's belief page**, the stored genre-derived `truthScore` or the signed claim-based score? Options: read `resolveMediaTruth` per work averaged by centrality; rename the row "Media genre prior"; or drop it.
7. **Sum or average?** Options: averages only and BAS marked superseded; an unbounded "how much is carried" total per belief, shown and read by nothing, as EVS is; or a summed BAS as the ranking on the best-works page.
8. **Which kinds of work does the site admit?** Add Song, Image and Website to the site's types; leave unusual works under Other works and say so; or unify both engines on one type list and one inferred-genre table.
9. **What happens to `src/features/books`?** Delete it and its three routes; restore it with a schema as a deliberate alternative engine with a conformance diff; or leave code that reads as working and is not.
10. **What should an unargued linkage read: 1.0 (site) or 0.5 (app)?** The direction (start trusting) points to 1.0. A follow-on: should an opened but unargued linkage page also read 1 rather than 0.50?
11. **Should a claimless work in the app read its genre prior on the signed scale?** Today a claimless tweet reads +0.15 where 0 means balanced. Options: map the prior onto the signed scale (2 × prior - 1), or show "no claims yet" and leave Epistemic Impact blank until a claim is linked.

## Related pages

- [[Template: Media Analysis]] (one work, one page), [[Template: Media Index]] (the shelf of works), [[Template: Why Pro and Con Media per Belief]] (the case for this page in template form), [[Templates]]
- [[Linkage Scores]] for Bears and centrality; [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]] for the signed row rule; [[The Redundancy Problem]] for uniqueness; [[Evidence Verification Score (EVS)]] for the one unbounded number; [[ReasonRank]] for work value; [[Pros and Cons on the Same Page]] for side-by-side tables; [[Likely Interests of Those Who Agree and Disagree]] for who gains
- On the live site: [the method page, media section](https://myklob.github.io/ideastockexchange/beliefs/method.html#media), [what each best-works yardstick means](https://myklob.github.io/ideastockexchange/beliefs/lists.html#works), [the starting values](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants), [the home page](https://myklob.github.io/ideastockexchange/beliefs/index.html)
- Code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), [`media-truth.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/media-truth.ts), [`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts), [`MediaResourcesSection.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/MediaResourcesSection.tsx)
- [[Home]]
