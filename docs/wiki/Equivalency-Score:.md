# Equivalency Score

Two people walk into a debate and say the same thing in different words. "Carbon emissions cause climate change." "Climate change is driven by greenhouse gases." If the site gives each sentence its own page, the argument splits in two, the evidence splits in two, and a belief can be made to look twice as well supported by being said twice. The Equivalency Score is the number that asks, of any two claims, whether they are one claim wearing two outfits.

This page is the owner's 2025 design for that number, kept whole, with every mechanism now marked by what the code does with it. The short version: the published site computes a word-overlap similarity to find look-alike pairs, argues each pair on an equivalence page like any other claim, and gives the computed similarity exactly zero weight in the published number. The Next.js app runs a second measure with different constants and different bands. A third formula, a seventeen-step scorecard, sits in the database schema and feeds nothing published. The machine-learning half the 2025 page described exists only as code nothing imports.

**How to read the labels.** Each mechanism is marked *runs on the published site* (the static site at myklob.github.io, built from `tools/static-site/`), *runs in the Next.js app* (the product in `src/`), *proposed, not built*, *replaced* (by a named mechanism), or *refused by design* (the code does the opposite and says why). Every formula is quoted from the file that runs it, with a link. A number from arithmetic done for this page says "calculation". A statement of the owner's intent rather than of code says "owner's judgment".

Related pages: [[The Redundancy Problem]] for why duplicates matter to a score, [[Template: Belief Equivalence Scorecard]] for the page an equivalence is argued on, [[Truth Score]] for the rule that scores that page, [[One Page per Debate Topic]] for the principle this number serves, and the published site's [method page section on computed equivalency](https://myklob.github.io/ideastockexchange/beliefs/method.html#equivalency).

## The original framing

The 2025 page opened like this, and the framing stands:

> The **Equivalency Score (ES)** measures how similar two arguments or beliefs are. It's determined by combining:
> - **Computer-generated analysis** (semantic similarity + machine learning).
> - **User-generated evaluation** (pro/con reasoning and voting).
> - **Performance weighting** from **Validity Comparison Arguments (VCA)**.
>
> This creates a **dynamic, evolving score**, much like how stock prices reflect changing market sentiment over time.

Three parts, then: a Computer-Generated Equivalency Score (CES), a User-Generated Equivalency Score (UES), and a Validity Comparison Argument (VCA) that decides how much each of the first two is worth. The sections below take them in that order, then the blend, then what else the code does in this area that the 2025 page never mentioned.

One word about the stock-price sentence before going on. Scores on the published site are recomputed on every build, and `changes.py` reports what moved since the last revision, so the number does evolve. But nothing is traded, and sentiment is kept out of the score by rule: votes are shown beside it and never enter it (details under "Votes" below). The home page card "Votes vs the analysis" ranks the *gap* between what people voted and what the argument says; it does not let one move the other (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), the `votes` card). The only market mechanism anywhere in the repository is a specification, `docs/MARKET_LAYER_SPEC.md`, which nothing runs. *Status: the "evolving" half is implemented; the "market sentiment" half is refused by design.*

## The formula, and what it is wired to

The 2025 page gave the blend as:

```
ES(A,B) = w_ces * CES(A,B) + w_ues * UES(A,B)
```

where `w_ces + w_ues = 1` and `w_ces` and `w_ues` are set based on VCA results.

*Runs on the published site, with a default that makes the computed half vanish.* The exact formula is implemented as `Similarity.blend` in [`tools/static-site/similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py):

```python
def blend(self, equivalence_page, w_ces=0.0):
    """ES = w_ces x CES + w_ues x UES. w_ces is 0 until a validity comparison argument says otherwise, so
    by default the argued page decides and the computed number only reports."""
    sp = self.c.specs[equivalence_page]
    x, y = sp.get('x'), sp.get('y')
    ues = self.c.truth(equivalence_page)
    comp = self.between(x, y) if (x in self.texts and y in self.texts) else None
    es = ues if (comp is None or w_ces <= 0) else w_ces * comp + (1 - w_ces) * ues
    return {'ces': comp, 'ues': ues, 'w_ces': w_ces, 'es': es}
```

Read the default: `w_ces=0.0`. Nothing but the test suite ever calls `blend`, and no caller passes anything else. `test_the_wiki_blend_defaults_to_the_argued_page` in [`test_similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_similarity.py) pins `w_ces == 0.0` and `es == ues` for every equivalence page in the corpus, and separately checks that with `w_ces=0.5` the result is `0.5 x ces + 0.5 x ues`, so the algebra is right if anyone ever turns the dial. No page renders `es`. The published Equiv number is UES alone.

The method page says so in its table of rules the site does not run ([method.html#notrun](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun)): "Equivalency as a blend of a computed and an argued half" is answered with "The argued equivalence page alone; the computed half carries weight zero." The reason, in the docstring of `similarity.py`: "w_ces is read from a VCA page when one exists and is 0 when none does, which is the same rule as everything else here: an input nobody has argued counts nothing. Until somebody argues that this lexical proxy tracks meaning well enough to act on, it does not act. It only points."

*Runs in the Next.js app, with the opposite emphasis.* `blendSimilarityLayers` in [`src/core/scoring/duplication-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/duplication-scoring.ts) has the same shape and different operands:

```ts
export const DEFAULT_LAYER_WEIGHTS = {
  layer1: 0.4,
  layer2: 0.6,
  layer3: 0.0,
} as const
```

Layer 1 is a mechanical token overlap, Layer 2 a semantic embedding score "from the backend", Layer 3 "community verification". Both computed layers get all the weight; the community layer gets none; a Layer 1 score at or above `MECHANICAL_EQUIVALENCE_THRESHOLD = 0.85` short-circuits to 1.0; when Layer 3 is null the weights renormalise across Layers 1 and 2. These weights are compile-time constants. Nothing derives them from how accurate either layer turned out to be.

So the one formula has two homes, and in one of them the human half is everything while in the other it is nothing. Which is right is one of the open questions at the end of this page.

## The computed half: CES

### What the 2025 page asked for

> The CES is calculated using:
> - **Semantic Similarity Metrics (SSM)**, comparing meaning and structure.
> - **Machine Learning Algorithms**, trained to recognize when two statements mean the same thing.
>
> Example: "Carbon emissions cause climate change" and "Climate change is driven by greenhouse gases" may receive a high CES.

*Replaced*, by a transparent lexical measure that reads words rather than meaning, for a stated reason. The semantic and machine-learned version is covered under "What the 2025 page asked for instead" below; nothing on either site runs it.

### What runs on the published site

The measure in `similarity.py` is two lexical signals over the claim text, averaged:

```python
def ces(text_a, text_b):
    """Computer-generated equivalency in [0,1]. Lexical, transparent, and no substitute for reading them."""
    return 0.5 * jaccard(words(text_a), words(text_b)) + 0.5 * cosine(grams(text_a), grams(text_b))
```

| Signal | What it catches | How |
|---|---|---|
| Jaccard overlap of content words | the same words in a different order | lowercase, strip everything but letters and digits, drop the stop words, take set intersection over set union |
| Cosine over character 4-grams | the same word in a different form, without a stemmer guessing | slide a 4-character window over the text, count each window, take the cosine of the two count vectors |

Inside the site's `Similarity` class both halves are weighted by inverse document frequency over the corpus, `Similarity.between(a, b) = 0.5 x wjaccard(words, idf) + 0.5 x cosine(idf-weighted 4-gram vectors)`, with

```python
def idf(docs):
    """log((N + 1) / (df + 1)) over the corpus, floored at 0. A term on every page tells you nothing."""
```

Why that matters, from the docstring: "Every belief here contains 'the president and members of Congress'; unweighted, that boilerplate alone put three plainly different policy proposals above the flag and a list of false alarms is a list nobody reads. Weighted, a word carries what it tells you apart from the rest of the corpus, and the shared subject of every page in a corpus about one subject carries almost nothing." The test `test_common_words_are_discounted_by_document_frequency` pins that a word on every page carries weight exactly 0.

The constants, all in `similarity.py` (code):

| Constant | Value | What it does |
|---|---|---|
| `FLAG` | 0.45 | "worth a human reading the pair; tuned so the list stays short enough to actually be read" |
| `MERGE` | 0.70 | "near-identical wording: the two pages are probably one page" |
| `IDF_FLOOR` | 0.05 | "a word this common carries no weight in the score, so pairing on it cannot find anything" |
| `JMIN` | 0.05 | "weighted word overlap below which the character half cannot carry a pair on its own" |
| `PAIRCAP` | 1,500,000 | "candidate pairs held at once, rarest word first, with what it could not reach reported" |
| `NGRAM` | 4 | the character window |
| `STOP` | 78 words | the, a, an, of, to, in, on, and, or, that, is, are, be, been, being, would, should, could, for, from, it, its, they, their, them, not, no, by, with, as, at, this, these, those, was, were, has, have, had, but, than, then, so, if, when, what, which, who, whom, whose, there, here, about, into, over, under, more, most, less, least, any, all, each, other, such, can, may, might, must, will, shall, do, does, did, one, two, up, down |

The measure runs over every page whose kind is belief, claim or interest and that has text. It compares pairs in two passes, because the two halves cost very different amounts: an inverted index gives the weighted word overlap exactly for every pair sharing an informative word, and the character half is paid only for pairs the word half says are worth it. A word is skipped only when its weight falls under `IDF_FLOOR`, never for being on many pages; the docstring records that an earlier rule (skip any word carried by more than sixty pages) "silently made two pages with identical text incomparable as soon as the words they shared sat on sixty-one", and that "a cheap check that quietly stops checking is worse than no check". Candidate pairs are opened rarest word first up to `PAIRCAP`, and `report()` names any claim the cap stopped it from examining rather than presenting a short list as a clean bill of health.

**What it misses and what it over-flags**, in the code's own words: "It will flag 'officials must not trade stocks' against 'officials must not trade bonds', which share nearly every word and say different things. It will miss 'the ban is unenforceable' against 'no agency could police it', which share none and say the same thing. So it is a reading queue, not a verdict, and a flagged pair is a prompt to open a uniqueness or equivalence page and argue it." Run through the unweighted `ces()` the first pair scores 0.650 (above `FLAG`, below `MERGE`) and the second scores exactly 0.0 (calculation).

**One measure, three ports.** The same formula and the same constants are written out in ES5 in [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) (`var FLAG = 0.45, MERGE = 0.70, NGRAM = 4`, the same `STOP` string, `score = 0.5 * wjaccard + 0.5 * dot`), which runs in the reader's browser as they type a claim into a form, and again in the `Matcher` class of [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py), which runs in the GitHub Action that reads the submitted issue. The `Matcher` docstring explains why there is no freedom here: "a weight that differs by a hair is enough to put a text on opposite sides of FLAG or MERGE here and on the page, which is the one thing the two must never do." All three build their IDF weights over the same list, `data/claims_index.json`, which `build()` writes from the full tables, drafts included.

### The carbon example, run

The 2025 page said the carbon pair "may receive a high CES". Through the shipped measures (calculation, run for this page):

| Measure | Result | Band |
|---|---|---|
| Published site `ces()` | 0.2857 (word Jaccard 0.25, 4-gram cosine 0.3214) | below `FLAG` 0.45, so never even flagged |
| Next.js `calculateBeliefEquivalencyScore` | 0.25 (mechanical Jaccard 0.25) | "related", not "identical" |

After normalisation the two sentences share only `climate` and `change`; the published measure's content words are `carbon emissions cause climate change` against `climate change driven greenhouse gases`. This is the paraphrase case the lexical measure is known to miss, and the method page lists it under "What this cannot do" ([method.html#limits](https://myklob.github.io/ideastockexchange/beliefs/method.html#limits)). The example is kept here as the 2025 page wrote it, and it should be read as the clearest statement of what the shipped measure does not do.

### Where the computed half appears, and what it is for

Here is the thing the 2025 page never quite said and the code says first: computed equivalency on the published site is not for merging pages. From the `similarity.py` docstring: "A score is padded by saying the same thing three times. The engine's defence against that is the uniqueness multiplier, and the uniqueness multiplier defaults to 1: a reason is presumed distinct until someone opens a page to argue the overlap. Nobody opens that page, because nobody notices. So the padding defence is off by default across a whole corpus, and the only way to notice is to read all 261 pages side by side, which nobody does either. A computed similarity reads them side by side in a tenth of a second and hands over a short list."

That short list shows up in four places (code: `similarity.py`, `render_site.py`, `integrity.py`, `method.py`):

| Where | What it shows |
|---|---|
| `Similarity.pairs()` | every pair above `FLAG`, most alike first, each with its `ces`, the equivalence page connecting the two if anyone has opened one, the uniqueness page if any, the pages both sit on (`shared_parent`), and a verdict: "probably one page" at or above `MERGE`, else "worth arguing the overlap" |
| `Similarity.unguarded()` | flagged pairs that sit on the same page with no uniqueness page between them: "the live padding risk" |
| Every belief page, under the Argument Trees | a line headed "Wording overlap, unargued" naming up to four unguarded pairs on that page with their scores, and a count of any further pairs (`render_site.py`) |
| Every belief and claim page's structural checks | "Rows that may be the same point twice", severity "worth checking", when two rows on one page read alike and no uniqueness page argues the overlap: "each is carrying its full weight. The measure reads wording, not meaning." ([`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py); listed at [method.html#checks](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks)) |
| The method page | the top 12 pairs with columns One claim, The other, Alike, Same page, Argued; the totals, how many pairs are hidden, how many candidates were compared, and which claims the cap left unexamined ([method.html#equivalency](https://myklob.github.io/ideastockexchange/beliefs/method.html#equivalency)) |

On the tables as of 17 October 2026 (calculation, from a build for this page): 3,988 claims carried text, 1,219,238 candidate pairs were held and 124,441 scored in full, no claim was left unreached, 216 pairs cleared `FLAG`, 149 of them were unguarded (same page, no uniqueness page), and 34 cleared `MERGE` with no equivalence page yet. The top pair scored 0.941: two findings on one page that the detector calls "probably one page".

**It changes no score.** `test_it_changes_no_score` in `test_similarity.py` computes every page's truth, runs the whole pair sweep, and checks that nothing moved. The detector points. It does not act.

### What the 2025 page asked for instead: semantic similarity and a trained model

*Proposed, not built on either site.* No spaCy appears anywhere in the repository or in [`tools/static-site/requirements.txt`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/requirements.txt), which lists `openpyxl>=3.1` and nothing else. The static site runs "with no model and no network" (docstring, `similarity.py`).

The nearest thing to the 2025 design is in `src/core/ai/`, which CLAUDE.md records as "a fifth [engine], and it is not in the same business":

- [`src/core/ai/similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/src/core/ai/similarity.py): `StatementSimilarityEngine`, a sentence-transformer (`EMBEDDING_MODEL` defaulting to `all-MiniLM-L6-v2`), scikit-learn `cosine_similarity` over the two embeddings, and a `SIMILARITY_THRESHOLD` read from the environment with default 0.75, used both for "similar statements" and for simple clustering at the same threshold.
- [`src/core/ai/overlap_engine.py`](https://github.com/myklob/ideastockexchange/blob/master/src/core/ai/overlap_engine.py): the same model; a semantic overlap of `min(similarity x 0.85 + keyword_boost, 1.0)` where the cosine is first rescaled from `[-1, 1]` to `[0, 1]` and the keyword boost is the share of topic keywords present times 0.15; combined signal weights semantic 0.40, taxonomy 0.25, citation 0.15, navigation 0.10, graph dependency 0.10; and a TopicRank of overlap 0.50, truth 0.30, disagreement 0.10, recency 0.10 with a recency decay `exp(-days / 30)`.

Both are imported only by `services.py`, which does not parse (CLAUDE.md: a `return` at line 785 followed by orphaned keyword arguments, in that state since the directory landed). No model is trained on anything; `all-MiniLM-L6-v2` is off the shelf. And there is a rule in the way even if the imports were fixed: CLAUDE.md says that "a number a model asserted is the one thing the published engine refuses to carry, so if any of this is ever wired to a page, it needs a page arguing it like every other factor." The Next.js blend reserves a 0.6-weight `semanticSimilarity` slot for exactly this, and no caller fills it.

The 2025 page's sample code for this half is kept at the bottom of this page, under "Original sketch".

## The argued half: UES

### What the 2025 page asked for

> Users contribute by:
> - Submitting **reasons** why two arguments are equivalent (or why one is superior).
> - Voting **up or down** on those reasons.
> - Engaging in **pro/con debates** about the equivalence claim.
>
> The **UES** reflects community consensus, updated continuously as new reasoning emerges.

### What runs on the published site: the equivalence page

*Runs on the published site.* Whether two beliefs make the same claim is itself a claim, so it gets a page and is argued like any other. The page kind is `equivalence` (one of nine kinds in [`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py): belief, claim, linkage, importance, interest, uniqueness, equivalence, driver, media). Its question is written by formula in `render_site.py`:

```python
elif k == 'equivalence': a, b = f'The belief: {q(x)}', f'makes the same claim as: {q(y)}'
```

It carries Reasons to agree and Reasons to disagree tables, a form under each, and Agree and Disagree vote links on its heading line like every other argued page (pinned by `test_linkage_importance_uniqueness_interest_media_and_equivalence_pages_take_part_too` in `test_render.py`). Reasons on it are about whether the two claims have the same truth conditions, never about whether either is true ([[Template: Belief Equivalence Scorecard]]).

**UES, in code, is `corpus.truth(equivalence_page)`**: the page's truth score, by the same rule as every page (code: [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)):

```
row contribution = sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq
page truth       = (POS + w x p0) / (POS + NEG + w)
```

with `p0 = 0.50` and `w = k = 1` for a page that cites no evidence (`CONSTS = {'K': 1, 'UNARG': 0.5, 'DEFLINK': 1, 'DEFIMP': 0.5, 'DEFUNIQ': 1}`). A reason nobody has argued has Truth 0.50, so `(2 x 0.5 - 1) = 0` and it contributes nothing; a reason argued false counts against the side it was filed on. That is the whole of "community consensus" here: argued weight, never a head count. And "updated continuously" means recomputed on every build of a static site, not on every click.

The verdict bands printed in the equivalence page's check table (code: `render_site.py`, the `equivalence` branch of the check table; `EQUIV_MERGE = 0.9`, "the score at which the site already calls two claims a merge candidate", near the top of [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)):

| Equivalence page truth | Verdict printed |
|---|---|
| 0.90 or more | Merge candidate |
| 0.50 to 0.90 | Overlapping: keep both, name the difference on each page |
| below 0.50 | Distinct claims: keep both pages, cross-link |

Note the two scales. The computed half flags at 0.45 and says "probably one page" at 0.70; the argued page says "merge candidate" at 0.90. They are different numbers answering different questions: how alike the words are, and how well the claim that they are one claim has survived argument.

**The three equivalence pages in the corpus today** (code: [`content/pages.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/pages.csv); scores are a calculation from a build on 17 October 2026):

| Page | X | Y | What separates them (typed) | Reasons agree / disagree | Truth today | `ces` |
|---|---|---|---|---|---|---|
| [equiv-barring-members-congress-members-congress](https://myklob.github.io/ideastockexchange/beliefs/p/equiv-barring-members-congress-members-congress.html) | [Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html) | [Members of Congress should be barred from owning any asset other than Treasury securities and diversified funds while in office](https://myklob.github.io/ideastockexchange/beliefs/p/members-congress-barred-owning.html) | "The broader version reaches every asset class rather than publicly traded shares." | 1 / 2 | 0.50 | 0.216 |
| [equiv-barring-members-congress-members-congress-2](https://myklob.github.io/ideastockexchange/beliefs/p/equiv-barring-members-congress-members-congress-2.html) | the same belief | [Members of Congress should be required to place individual stocks in a qualified blind trust](https://myklob.github.io/ideastockexchange/beliefs/p/members-congress-required-place.html) | "A blind trust removes control and keeps ownership; a ban removes ownership." | 2 / 1 | 0.50 | 0.269 |
| [equiv-letting-congress-overturn-president-barred](https://myklob.github.io/ideastockexchange/beliefs/p/equiv-letting-congress-overturn-president-barred.html) | [Letting Congress overturn a presidential pardon by a two-thirds vote of both chambers would reduce the use of the pardon power for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/letting-congress-overturn-presidential.html) | [A president should be barred from pardoning relatives, donors and co-defendants, with no general override](https://myklob.github.io/ideastockexchange/beliefs/p/president-barred-pardoning-relatives.html) | "One restricts who may be pardoned; the other lets Congress undo any grant." | 1 / 2 | 0.50 | 0.071 |

All three read 0.50, because every reason on them is a bare row with no page of its own beneath it, and a reason with no work behind it contributes 0. That is the argued-truth rule doing what it says: three typed reasons are three claims nobody has argued. All three are under the topic [public-office-private-gain](https://myklob.github.io/ideastockexchange/beliefs/t/public-office-private-gain.html).

### Where the argued number is read

Two tables on a belief page read an equivalence page's truth (code: `render_site.py`):

- **Similar Beliefs.** Rows are more extreme and more moderate wordings, each with a "Same claim?" column labelled Equiv: `H.num(c.pg(d.get('equiv'), UNARG), d.get('equiv'))`. A row with no equivalence page reads `UNARG = 0.50`, "a coin flip", shown in grey as a labelled constant. The section blurb: "Equiv is the truth score of an equivalence page. Near 1 means a merge candidate, not a new page."
- **Ways of Saying the Same Thing.** Rendered only when the page has at least one equivalence page. Columns Wording, Chars, Equiv, Verdict; rows sorted by character count, shortest first; per-row verdict "same claim: may stand in for this page" at or above 0.9, "overlapping claim: keep both, name the difference" at 0.5 to 0.9, "distinct claim" below. The footer says either "No equivalent scores 0.90 yet, so this page's own wording is used wherever space is short. Argue an equivalence page up to that line and the shortest wording that clears it takes over." or "The shortest wording whose equivalence scores at least 0.90 stands in for this page in breadcrumbs and index columns."

That stand-in is `Corpus.brief()`: "the shortest wording among this page's own and every equivalent whose equivalence page scores at least EQUIV_MERGE." It is the one place where the 2025 page's "why one is superior" has any counterpart, and the only kind of superiority recognised is succinctness. Nothing ranks one wording as better argued.

One more reader: the structural check "Assumes its own conclusion" (severity "serious") fires when a load-bearing premise of a page "is argued to be the same claim (equivalence 0.90 or more)" as the page itself (code: `integrity.py`).

### The 2025 sample's defaults, against the code

The 2025 page's worked function (kept whole under "Original sketch" below) hard-codes three things the code refuses:

| Sample default | What the code does |
|---|---|
| `vca_multiplier=0.8`, meaning 0.8 on the user score and 0.2 on the computed one | Published site: `w_ces = 0.0`, so 1.0 on the argued page. Next.js: `layer1 0.4 / layer2 0.6 / layer3 0.0`, so 1.0 on computed layers. Neither is 0.8/0.2. |
| `user_score = sum(user_scores) / len(user_scores) if user_scores else 0`, an average of community ratings | Nothing averages ratings anywhere. UES is argued truth. Votes are recorded and shown and never enter a number (next section). |
| An unargued equivalence returns 0 | Published site: the Similar Beliefs cell reads `UNARG = 0.50` for a row with no equivalence page, and an equivalence page with no argued rows reads 0.50 by the truth rule; 0 would mean "argued false". Next.js: `SimilarBelief.equivalencyScore Float @default(0.0)` in [`prisma/schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma), and [`SimilarBeliefsSection.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/SimilarBeliefsSection.tsx) renders 0.0 as blank under the belief page's Rule 6 ("blank scores until real"). Every stored Next.js value today was typed by a seed (0.72 in `seed-topics.ts`; 0.94, 0.85, 0.93, 0.62 in `seed-linkage-example.ts`; 0.55, 0.48 in `seed-belief-distractions.ts`), computed by nothing. |

So "what does an unargued equivalence read" has three answers in the repository: 0.50, blank, and the 2025 page's 0. It is open question 3 at the end.

### Votes

The 2025 page: users vote "up or down on those reasons" and the UES reflects it.

*Refused by design, on both sites, and stated in five places.* The owner's October 2026 direction is the rule: votes may decide what is promoted and given attention, never what is valid. The code already did this.

On the published site (code: [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py), `render_site.py`, [`content/votes.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/votes.csv), [`.github/ISSUE_TEMPLATE/vote.yml`](https://github.com/myklob/ideastockexchange/blob/master/.github/ISSUE_TEMPLATE/vote.yml)):

- A vote is a GitHub issue from a prefilled form, recorded as one row per `(key, on, login)` in `content/votes.csv` (columns `key, login, vote, issue, date, on`), latest wins. `on` is empty for a vote on whether a claim is true and holds a page key for a vote on whether the claim bears on that page, "a vote on the argument as an argument".
- The page shows the counts on the heading line after the score badge, worded "N agree, M disagree; votes, not a score", with a link to the issues that recorded them ([lists.html#votes](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes)).
- `VOTE_NOTE = 'Votes are shown as what people think, next to what the analysis says, and never move a score.'` (`render_site.py`). `NO_MOVE = 'A vote never moves a score; the page shows it next to what the analysis says, as what people think.'` (`intake.py`). The vote issue template: "it never moves a score." The README: "The engine rule stands: a claim nobody has argued is worth exactly nothing, however many people like it."
- The engine never reads `votes.csv`; the table is not in the workbook.

The one place a vote and a duplicate meet: when a reader submits a claim that scores at or above `MERGE = 0.70` against something already on the site, `contribute.js` changes the button to "This is already here: open it and vote" (when the match is a row on the same page) or "Already on the site; add it here as well" (when it is elsewhere), and `intake.py` re-checks with the real measure, labels the issue `duplicate`, records the submitter's **agree** vote for the existing claim ("you put it forward as true"), and adds no page. If the existing claim is not yet a row on the page it was submitted to, a pull request adds just that row, keeping the placement the reader proposed. `test_a_duplicate_becomes_a_vote_for_the_existing_claim_and_adds_no_rows` in `test_intake.py` pins it. Between `FLAG` and `MERGE` the rows are added and the maintainer is shown the near matches.

In the Next.js app (code: [`src/lib/consensus.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/consensus.ts), [`src/app/api/equivalence-candidates/[id]/votes/route.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/equivalence-candidates/%5Bid%5D/votes/route.ts), `prisma/schema.prisma`): a `GroupingVote` on an `EquivalenceCandidate` is `agree: true` ("same claim, group them") or `false` ("genuinely different, keep separate") with optional reasoning and a `weight` defaulting to 1.0 that "is never accepted from the voter" (the route returns 422 if a weight is sent; the schema says weights "come from track records, never from filing volume"). `resolveConsensus` settles at `CONSENSUS_THRESHOLD = 0.6` weighted agreement once `CONSENSUS_QUORUM = 3` votes are in, moving the candidate's `status` from `open` to `grouped` or `kept-separate` and writing `consensus` (the agree share). It never changes `similarity`, a truth score, or any published number. That is the furthest any vote goes in this codebase: it decides a merge *status*, which the schema comment compares to "how Wikipedia settles merge proposals".

## The weighting: VCA

The 2025 page:

> The VCA decides **how much weight** to give CES vs. UES.
> - If users demonstrate that CES is more accurate, the CES weight increases.
> - If the UES consistently produces better results, its weight grows.

*Proposed, not built.* There is no `vca` page kind; the nine kinds are listed above. `blend()` reads `w_ces` from its argument, nothing reads it from a page, and the only mentions of "validity comparison argument" in the code are `similarity.py` and `method.py` recording that none exists. Nothing anywhere records how accurate CES or UES turned out to be: no ground truth, no outcome tracking, no accuracy ledger. The Next.js weights are constants. The 2025 name "Validity Comparison Argument (VCA)" survives in no identifier.

What the published site does in its place is the rule it applies to every unargued input: weight 0 until a page argues otherwise. The owner's direction on linkage (start trusting, fall when argued down) points the other way for *linkage*, where the site presumes a reason relevant (`DEFLINK = 1`) until a linkage page says otherwise. For the computed half of equivalency the site made the opposite call, presuming the lexical proxy worthless until argued, and the method page gives its reason: "a number that silently discounts an argument and has no page behind it cannot be audited, and every other number on this site is a link to the page that argues it." Whether a VCA page kind should exist so the dial can be argued up is open question 1.

## The second implementation: the Next.js app

The 2025 page described one engine. The repository has a second, product-side one, with its own measure, constants and bands, and the belief page at `/beliefs/[slug]` reads it. *Runs in the Next.js app.*

**Mechanical similarity** (code: [`duplication-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/duplication-scoring.ts)). `normalizeClaim` lowercases, strips punctuation, tokenises, drops a stop list, canonicalises synonyms, folds negated antonyms ("not unintelligent" becomes "intelligent"), and sorts. `mechanicalSimilarity` is plain Jaccard over the two token sets (1.0 when both are empty, 0.0 when one is). The 19 synonym groups, each canonicalised to its alphabetically smallest member:

| Group | Canonical |
|---|---|
| decrease, lower, reduce | decrease |
| hike, increase, raise | hike |
| ban, forbid, prohibit | ban |
| allow, enable, permit | allow |
| build, construct | build |
| buy, purchase | buy |
| end, stop, terminate | end |
| fix, repair, resolve | fix |
| beneficial, good | beneficial |
| bad, detrimental, harmful | bad |
| clever, intelligent, smart | clever |
| foolish, stupid, unintelligent | foolish |
| fast, quick, rapid | fast |
| slow, sluggish | slow |
| rich, wealthy | rich |
| impoverished, poor | impoverished |
| accurate, true | accurate |
| false, inaccurate, incorrect | false |
| tax, taxation, taxes | tax |

The 6 negation words are not, no, never, neither, nor, without. The 21 antonym pairs: intelligent/unintelligent, intelligent/stupid, smart/dumb, good/bad, good/evil, true/false, correct/incorrect, honest/dishonest, legal/illegal, moral/immoral, possible/impossible, responsible/irresponsible, relevant/irrelevant, effective/ineffective, efficient/inefficient, logical/illogical, rational/irrational, agree/disagree, like/dislike, trust/distrust, approve/disapprove. Note the asymmetry with the published site: the Next.js measure has a synonym table and no IDF weighting; the published measure has IDF weighting and no synonym table.

**The belief equivalency score** (code: [`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts), `calculateBeliefEquivalencyScore`):

```ts
if (isMechanicalEquivalent) {            // mechanicalSim >= 0.85
  equivalencyScore = 1.0
} else if (semanticSimilarity !== null) {
  equivalencyScore = Math.max(0, Math.min(1, 0.4 * mechanicalSim + 0.6 * semanticSimilarity))
} else {
  equivalencyScore = mechanicalSim
}
```

| Score | Relationship | Recommendation (from the route) |
|---|---|---|
| 0.90 or more | identical | "Merge into one canonical page. Route all variants to the better-argued version." |
| 0.70 to 0.89 | near-identical | "Link the pages and cross-reference their argument trees. Keep separate but surface both." |
| 0.45 to 0.69 | overlapping | "Display as related beliefs on the spectrum, weaker or stronger versions of each other." |
| 0.20 to 0.44 | related | "Show as related beliefs. Separate argument trees; no merging." |
| below 0.20 | distinct | "Treat as distinct beliefs. Separate pages with no equivalency link." |

It is live at `POST /api/beliefs/equivalency` ([`route.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/beliefs/equivalency/route.ts)), which accepts an optional `semanticScore` in `[0, 1]` and reports `layersUsed`, and in the calculator on `/algorithms/belief-equivalency`. That explainer page's own band table prints ~100 / ~70 to 90 / ~40 to 70 / below ~40, which does not match the route's 0.90 / 0.70 / 0.45 / 0.20 (code: [`belief-equivalency/page.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/app/algorithms/belief-equivalency/page.tsx)); its worked meta-debate example gives "We should ban assault weapons" against "We should prohibit military-style rifles" a score of 85%, and the shipped function scores that pair 0.1667, "distinct" (calculation): `ban` and `prohibit` do canonicalise to `ban`, but `assault weapons` and `military style rifles` share nothing. The example is right about what should happen and wrong about what the code returns, which is the lexical measure's known failure again.

**The belief page's number.** `fetch-belief.ts` sets `beliefEquivalencyScore` to the maximum `equivalencyScore` over the belief's `similarTo` and `similarFrom` rows, or null when there are none; those stored values are the seed-typed ones listed above. `SimilarBeliefsSection` puts same-strength paraphrases at `PARAPHRASE_THRESHOLD = 0.95` into prose as merge candidates rather than into the table.

**Ingestion and the grouping vote** (code: [`src/lib/agent-ingest/similarity.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/similarity.ts), [`ingest.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/ingest.ts)). A third lexical measure, used only to propose:

```ts
return 0.7 * tokenSim + 0.3 * bigramSim
```

over tokens with a light suffix strip (`ing|ed|es|s` on tokens longer than 4) and a 50-word stop list. Thresholds: `EQUIVALENCE_CANDIDATE_THRESHOLD = 0.5` persists an `EquivalenceCandidate` row ("related-link": link the cluster, don't group); `RESTATEMENT_SPEEDBUMP_THRESHOLD = 0.8` makes the posting flow require acknowledging the existing row before posting ("a speed bump, not a block"; "restating stops counting as contributing"); `SAME_CLAIM_THRESHOLD = 0.95` sends the pair to the grouping vote as the presumptive merge. "The bands route; the community vote (GroupingVote, 60% weighted consensus) decides. No band auto-merges anything." The file header: "stored, not scored."

**Where the Next.js number does move a score.** [`propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts) computes `siblingUniquenessFor`: for each published argument under a parent, oldest first, `uniqueness = 1 - max(mechanicalSimilarity to every earlier argument on the same side)`, and multiplies it into the argument's impact. So in the app, two near-identical reasons filed on the same side do discount each other, automatically, with no page arguing it. This is the exact behaviour the published site refuses (next section).

## The dormant third formula: the seventeen-step scorecard

*Built in the schema, run by nothing published.* `EquivalenceAnalysis` in `prisma/schema.prisma` stores a seventeen-step analysis (raw beliefs, fast-path exact match after lowercasing and punctuation stripping, normalised cores, a semantic transformation map, synonym convergence across Merriam-Webster, Oxford, WordNet and an embedding model, strength delta across certainty, scope and causal force, structural relationship as same_claim / same_topic_different_claim / subset / different_topic, overlap, non-equivalence penalties, an argument battle, evidence overlap rate, network adjustment, verdict, audit trail, related pages, machine-readable JSON). The one route that computes from it, [`/api/equivalence/[slug]/score`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/equivalence/%5Bslug%5D/score/route.ts):

```
Overlap     = 0.25 x subject + 0.35 x predicate + 0.20 x context + 0.20 x mechanism
Equivalence = 0.40 x synonymConvergence + 0.40 x Overlap + 0.20 x argumentBalance + networkAdjustment - totalPenalty
```

clamped to `[0, 1]`, with verdicts merge at 0.90 or more, merge_with_note at 0.75, link at 0.50, else separate. Every component field defaults to 0 and is written by nothing but that route; `EquivalenceReason` and `ArgumentBattleItem` rows carry truth, linkage and importance each defaulting 0.5; `NetworkPosition` rows (upstream, downstream, evidence; `overlapPercent`, `sameCluster`) are computed by nothing. [[Template: Belief Equivalence Scorecard]] carries the whole procedure and says of it: "a SOFTWARE DESIGN, kept for reference. The built site does not run it: none of its weights (overlap 0.25 / 0.35 / 0.20 / 0.20, final 0.40 / 0.40 / 0.20, verdict bands 90 / 75 / 50) feeds any published number." It stays on the books as a proposal.

## Uniqueness: the relation the 2025 page implied and never stated

The point of knowing two rows are the same is to stop counting the second one twice. The two engines disagree about how.

| | Published site | Next.js app | docs/ALGORITHMS.md section 10 |
|---|---|---|---|
| Rule | `DEFUNIQ = 1`: "A reason is presumed distinct until a uniqueness page shows the overlap." Uniqueness reads a uniqueness page's truth or the constant ([method.html#constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants)). | `uniquenessFromSimilarities = 1 - max(similarity)`; `contributionFactor = 1 - similarity`: "if two arguments are 90% saying the same thing, the second one contributes 10% of its score, not 100%." `scoreArgument` multiplies `arg.uniquenessScore ?? 1.0`. | Four detectors (Levenshtein edit distance under 20% of length; Jaccard over 80%; TF-IDF cosine over 0.85; 3-gram overlap over 70%), then `Effective_Score = Original_Score x (1 - Redundancy_Penalty)` with penalty 0.5 for a soft duplicate (0.7 to 0.85) and 0.9 for a hard one (over 0.85). |
| Status | runs | runs, at propagation time | proposed, not built; listed at [method.html#notrun](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun) as "Uniqueness computed as one minus the highest similarity" |
| Why | "a number that silently discounts an argument and has no page behind it cannot be audited" (method page) | "even one near-identical prior argument is enough to mark the new argument as redundant. A single devastating counter-argument stated once is not made more valuable by ignoring the fact that 50 other users already made it." (`duplication-scoring.ts`) | |

Both reasons are good reasons. That is why it is open question 4. See [[The Redundancy Problem]] for the fuller argument.

## Why it matters

The 2025 page gave four reasons. Each with its status:

- **Reduces redundancy by detecting when two arguments are effectively the same.** *Implemented*, as the flag list, the belief-page overlap line, the structural check, the method-page table, the duplicate check as a reader types, and the intake re-check that turns a duplicate into a vote (published site); and as `EquivalenceCandidate` rows at 0.5, the speed bump at 0.8, the grouping proposal at 0.95, and `calculateTopicOverlapScore` counting pairs at or above 0.85 as duplicates (Next.js).
- **Links reasoning so evidence supporting one claim automatically supports others.** *Proposed, not built, on either site.* No row, score or evidence crosses between two pages an equivalence page connects. At 0.90 or more the shorter wording may stand in for the other in breadcrumbs and index columns (`brief()`), and both pages keep their own rows and scores; CLAUDE.md: "a score still rests on page and edge alone." The Next.js explainer promises that on a confirmed link "the sub-argument score cascade ensures that evidence and arguments from the merged pages propagate correctly into the canonical page's score", and no code reads `SimilarBelief.equivalencyScore` or `EquivalenceAnalysis` when scoring a belief. Kept as a proposal pending open question 5.
- **Improves debate quality by merging duplicate points and focusing on unique reasoning.** *Partly.* Merging is always a human act on both sites: the published site prints "Merge candidate" and merges nothing; the app's grouping vote changes a status and merges nothing. "Focusing on unique reasoning" is where the two engines split, as the uniqueness table above records.
- **Tracks confidence over time, just like financial markets track stock performance.** *Not implemented.* Confidence on the published site is a structural measure of how much work stands behind a page ([[Confidence Stability Scores]]), with the behavioural signals carrying weight zero; no equivalence score is kept as a time series; the only market is a spec nothing runs.

## Future improvements

The 2025 page listed three. Each with where it stands:

- **Refine machine learning models using debate platform history.** *Not started.* No training data, no training code, no model artefacts. The only learned component is the off-the-shelf `all-MiniLM-L6-v2` in `src/core/ai`, unwired.
- **Improve VCA tracking to adjust weights in real time.** *Not started, and blocked on the step before it:* there is no VCA to track. A `vca` page kind would have to be added first, and then an accuracy record for it to argue from.
- **Use argument graphs to propagate equivalency relationships across related debates.** *Partly, and as prioritisation rather than propagation.* `Similarity.shared_parent` and `by_parent` surface flagged pairs sitting under the same parent first, because "two near-identical rows under one conclusion are the padding the uniqueness multiplier exists to stop, and they are the ones worth flagging first." The Prisma `NetworkPosition` rows and `networkAdjustment` term are the propagation design, dormant.

## The owner's direction, and where this page sits against it

The owner's October 2026 direction on scoring (CLAUDE.md, "The owner's direction on scoring") governs where the 2025 page and the code disagree. Applied here (owner's judgment, as recorded there; status is the code's):

- **Volume.** Count the truly independent reasons and let pro weigh against con. Equivalency is what "truly independent" means in practice: the published site's count-every-reason rule, `tally.py` ([method.html#tally](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)), counts "independent reasons on a side" as the sum of Uniqueness over its reasons, and Uniqueness is still `DEFUNIQ = 1` until a uniqueness page argues it. So today the tally counts every listed reason as fully independent, and the duplicate detector's 149 unguarded pairs are exactly the rows where that is in doubt.
- **Votes.** Attention, never validity. Both sites comply; the app's grouping vote decides a merge status and nothing else.
- **Linkage.** Start trusting, fall when argued down. The site does that for linkage (`DEFLINK = 1`) and the opposite for computed equivalency (`w_ces = 0`). The owner's direction says "any sensible starting guess" for linkage is acceptable, including "an AI estimate"; whether the same latitude applies to a lexical similarity starting the equivalency dial above 0 is open question 1.
- **Fallacies.** A flag is a claim argued like any other and moves no score. Computed equivalency is already built that way: a flagged pair "is a prompt to open a uniqueness or equivalence page and argue it."
- **Evidence.** No ceiling. Not at issue on this page; an equivalence page can cite evidence like any page, and none of the three does yet.

## Open questions for the owner

Six things this page cannot settle, because each is a call rather than a bug.

1. **Should the computed half ever carry weight in a published equivalence score, and by what mechanism?** The 2025 page sets `w_ces` by a VCA and its sample defaults it to 0.2; the published site hard-codes 0.0 and has no VCA page kind; the Next.js engine gives computed layers 100%. Options: (a) add a `vca` page kind so an argued page can set `w_ces`, keep 0 as the unargued default; (b) drop VCA and state that computed similarity only proposes pairs, which is what the site does today; (c) adopt the Next.js fixed-weight blend and give up the argued-input rule for this one number.
2. **Do votes belong anywhere in the user-generated score?** Every engine says no. Options: (a) keep the rule and define UES as the argued truth of the equivalence page, votes shown beside it; (b) let a 60%-consensus "grouped" verdict count as the merge decision while still not entering the score, and document that as the one vote-driven step; (c) reinstate vote-driven UES, which reverses a rule stated in CLAUDE.md, the README, the method page and the issue template.
3. **What does an unargued equivalence read: 0.50, 0.0, or blank?** Published site 0.50; Next.js stored 0.0 rendered blank; the 2025 sample 0. Options: (a) 0.50 everywhere, with the Next.js default changed; (b) blank until a page exists, 0.50 once it has rows; (c) 0.0, which the published engine would read as "argued false".
4. **Which of the three formulas is canonical?** Published site: lexical 0.5/0.5 with FLAG 0.45 / MERGE 0.70 to propose, and the argued page at 0.5 / 0.9 to decide. Next.js: synonym Jaccard, 0.85 short-circuit, 0.4/0.6 blend, bands 0.90 / 0.70 / 0.45 / 0.20, plus the ingest measure 0.7/0.3 with 0.5 / 0.8 / 0.95. Dormant: the 0.40 / 0.40 / 0.20 scorecard with bands 90 / 75 / 50. Options: (a) name the published pair canonical and mark the other two proposed or retired; (b) move the Next.js engine onto the published measure and thresholds so the belief page and the site agree; (c) keep all three and label each with where it runs, which is what this page does.
5. **Should an equivalence above the merge line propagate evidence and scores between the two pages, or only choose a wording?** Options: (a) keep propagation out and state the promise as "a merge candidate is flagged for a human to merge"; (b) read the rows of an equivalent page (0.90 or more) into the other page's tables, which changes published scores and needs a conformance diff; (c) propagate only the wording and the cross-link, which is (a) said positively.
6. **Is a semantic (embedding or LLM) layer ever acceptable in a published number?** Options: (a) rule it out and keep lexical similarity as a reading queue; (b) allow it as a proposer only, flagging pairs and never scoring, which needs no rule change; (c) allow it in scores once a page argues that the model tracks meaning well enough, which is question 1 again.

## Original sketch (2025)

The 2025 page carried two Python samples. They are kept here whole. What runs instead is `ces()` and `Similarity.between` in [`tools/static-site/similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) for the computed half, `Corpus.truth` of an equivalence page for the argued half, and `Similarity.blend` with `w_ces = 0.0` for the combination.

<details><summary>Original sketch (2023), not what runs</summary>

**Example: Semantic Similarity Metric (SSM).** We can use spaCy to generate document vectors and compute cosine similarity.

```python
import spacy

# Load English language model
nlp = spacy.load("en_core_web_md")

def ssm_score(statement1, statement2):
    """
    Calculates semantic similarity between two statements.
    Returns a float between 0 (no similarity) and 1 (identical meaning).
    """
    doc1 = nlp(statement1)
    doc2 = nlp(statement2)
    return doc1.similarity(doc2)
```

**Example: Full Equivalency Score Calculation.**

```python
def equivalency_score(statement1, statement2, user_scores, vca_multiplier=0.8):
    """
    Calculates the overall Equivalency Score between two statements.

    statement1, statement2: str
    user_scores: list of floats from community ratings
    vca_multiplier: weight given to user-generated score based on VCA results
    """
    # Step 1: Calculate computer-generated score
    ssm = ssm_score(statement1, statement2)

    # Step 2: Calculate user-generated score (average of votes)
    user_score = sum(user_scores) / len(user_scores) if user_scores else 0

    # Step 3: Combine scores based on VCA weight
    final_score = (ssm * (1 - vca_multiplier)) + (user_score * vca_multiplier)

    return final_score
```

Three notes against the code. spaCy and `en_core_web_md` appear nowhere in the repository or its requirements. spaCy's `similarity` is a cosine and can go negative, so the docstring's promise of a float between 0 and 1 would not have held, whereas both shipped measures are pinned to `[0, 1]` with identical text at 1.0 and empty text at 0.0 without division by zero (`test_similarity.py`; `tests/unit/core/scoring/duplication-scoring.test.ts`). And `user_scores` depends on a list of ratings that no store provides: `votes.csv` holds agree or disagree per login, not ratings.

</details>

## Where to go next

- [[The Redundancy Problem]]: why saying a thing twice must not count twice, and the two engines' answers.
- [[Template: Belief Equivalence Scorecard]]: the page an equivalence is argued on, section by section, and the dormant seventeen-step scorecard in full.
- [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]]: the rule that scores an equivalence page.
- [[Linkage Scores]] and [[Evidence to Conclusion Relevance Score]]: the other presumed-until-argued multiplier, and the one where the site starts trusting.
- [[Confidence Stability Scores]]: why a reason with no page behind it contributes 0, which is why the three equivalence pages read 0.50.
- [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]]: where the uniqueness multiplier sits in the row formula.
- [[One Page per Debate Topic]] and [[Pros and Cons on the Same Page]]: the principle the whole number serves.
- The published site: [method.html#equivalency](https://myklob.github.io/ideastockexchange/beliefs/method.html#equivalency) for the live flag table, [method.html#notrun](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun) for the rules not run, [lists.html#votes](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes) for votes against the analysis.
- [[Home]] for the map of every page.
