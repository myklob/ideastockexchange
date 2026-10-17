# Automated Conflict Resolution Platform

A **systematic, discourse-driven platform** for resolving disputes, inspired by Wikipedia's collaborative editing model but designed for **structured, evidence-based decision-making**.

This platform:
- Lets anyone participate in conflict resolution.
- Ranks solutions based on evidence, not popularity.
- Updates conclusions dynamically when new evidence appears.

That was the promise in 2025, and the core of it now runs. Most arguments online are fought like trench warfare: two sides dig in, lob insults across no-man's-land, and nobody gains a yard. The idea here is to replace the trenches with a ledger. Every claim gets its own page, every reason for and against is a row, every row carries numbers you can multiply out yourself, and the disagreement that is actually driving the fight gets named out loud.

This page says what the code does with each promise: the real formulas, constants and defaults, where the code went somewhere the 2025 page did not expect, what is still only proposed, and what the code refuses to do on purpose (and why). Nothing proposed has been dropped for being unbuilt; it is labelled proposed.

**Two engines.** The repository runs two implementations that sometimes disagree. The **published site** is [`tools/static-site/`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md), which builds [myklob.github.io/ideastockexchange/beliefs/](https://myklob.github.io/ideastockexchange/beliefs/index.html) from two flat tables (4,263 pages and 9,472 rows today, plus 95 topics). The **Next.js app** is [`src/core/scoring/`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts) plus its belief pages under `src/app/beliefs/`. "The site does" means the first; "the app does" means the second.

## The page at a glance

Every promise the 2025 page made, and where it stands (source: an audit of the page against the code, October 2026, rechecked against the files linked below):

| Promise | Status | Where |
|---|---|---|
| Anyone can participate | **Built**, for anyone with a GitHub account | Forms under every table, [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) |
| Rank by evidence, not popularity | **Built.** A vote never moves a score | [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py) |
| Conclusions recalculate when evidence changes | **Built**, on every published build, not live in the browser | [`pages.yml`](https://github.com/myklob/ideastockexchange/blob/master/.github/workflows/pages.yml) |
| Wikipedia-style collaborative editing | **Replaced** by GitHub issue forms and pull requests | [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py), [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) |
| Getting to Yes principles | **Built**: all four have a scored section on every belief page | [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py) |
| Collective intelligence, not AI hype | **Built and enforced**: no model computes any published number | [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) |
| PageRank for arguments | **Built twice**, as two different things | [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py), [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts) |
| Eight-step NLP pipeline to separate people from the problem | **Mostly not built**; two steps **refused by design**, one **replaced by a flag** | [Separate People from the Problem](#separate-people-from-the-problem) |
| Seven-step interest analysis | **Mostly built**; IACI **not built**; IVS **renamed Validity** | [Focus on Interests, Not Positions](#focus-on-interests-not-positions) |
| Every belief has a structured, ranked page | **Built** | [the home page](https://myklob.github.io/ideastockexchange/beliefs/index.html) |

---

## How It Works

The platform applies:
- **Conflict resolution principles** from *Getting to Yes* (Harvard Negotiation Project).
- **Collective intelligence methods** (not AI hype).
- **Google's PageRank algorithm**, adapted to evaluate arguments and solutions.

When a belief changes, all dependent conclusions are **automatically recalculated** based on the latest and strongest evidence.

What each of those means in the code today:

### Getting to Yes, as page sections

Roger Fisher and William Ury's four principles are not a slogan here; each one is a named section of the published belief page with computed numbers in it (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)). The app's [`conflict-resolution.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/conflict-resolution.ts) cites them in its header: "Follows Fisher & Ury: push past positions ('I want X') to interests ('I need X because of Y'), because interests are where the overlap hides."

| Principle | Section on the site's belief page | Section on the site's topic page | App |
|---|---|---|---|
| Separate the people from the problem | Pages are claims, not people; **People on the Record** ("Who holds a belief never changes its score. These names carry history, not weight.") | **The Engagement Landscape** (a fact about the person, not the belief) | `PersonOnRecord` model ([`schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma)): "these rows carry history, not weight" |
| Insist on using objective criteria | **Objective Criteria** | **Best Objective Criteria for This Topic** | `calculateObjectiveCriteriaScore` in [`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts) |
| Focus on interests, not positions | **Interests, Not Positions**, with a computed **Primary conflict pair** | **Core Values Conflict** | `derivePrimaryConflictPair`, `findSharedInterests` |
| Invent options for mutual gain | **Shared interests**, **Best compromise**, ease of resolution | **Common Ground and Compromise** | `findCompromiseCandidates` |

Each is explained in its own section below.

### Collective intelligence, not AI hype

This one is enforced, not just hoped for. The published engine has "no model and no network" (code: [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py)). Every number on the site is either the truth score of a page people argued, or a labelled constant. The project's rule is blunt: a number a model asserted is the one thing the published engine refuses to carry.

The repository does hold an AI framework, `src/core/ai/`, for drafting analysis pages with a language model. Three of its modules produce numbers: [`scorer.py`](https://github.com/myklob/ideastockexchange/blob/master/src/core/ai/scorer.py) asks a model for an importance score from 0 to 100, and `overlap_engine.py` and `similarity.py` compute claim overlap from sentence-transformer embeddings (`all-MiniLM-L6-v2`, `SIMILARITY_THRESHOLD = 0.75`). Nothing imports the scoring half, and two of its files (`main.py` and `services.py`) do not parse. If any of it is ever wired to a page, the owner's standing rule is that it needs a page arguing it like every other factor.

### PageRank, twice

The repository has two things called ReasonRank, and they answer different questions.

**On the published site, ReasonRank never changes a truth score.** It asks what PageRank actually asks: not "is this page correct?" but "how much arrives here?" The walk starts at the beliefs, steps along rows in proportion to how much each row can carry, and restarts at the beliefs with probability 1 - d (code: [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py)):

```
capacity(row) = Link × Imp × Uniq
DAMPING = 0.85        TOLERANCE = 1e-12        ITERATIONS = 2000 (a cap the walk never reaches)
work(page) = rank × (1 - confidence)
```

Truth and confidence are left out of `capacity` on purpose: a ranking that fell when a claim was refuted would be measuring agreement, not dependence, and a page nobody has started work on is exactly the page the ranking exists to find. Every belief page prints **Relied on (ReasonRank)** and **Work value**. The example belief used throughout this page ranks first of the whole site by this walk (calculation, from the current tables).

**In the Next.js app, ReasonRank is the score itself** (code: [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)):

```
RR(A) = (1 - d) × baseTruth + d × f(proSubRank - conSubRank),   d = 0.85
TruthScore = ProRank / (ProRank + ConRank)
ProRank = Σ RR(arg) × linkage × importance × uniqueness   (pro arguments; ConRank likewise)
```

There, listing an unargued reason raises the score. On the published site it does not. That disagreement about whether volume counts is open decision 1 in the project's notes, and the owner has asked for the two rules to be compared on real pages before either one leads. See [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]].

### Automatic recalculation

Nothing is stored. Every score is computed from the two tables at build time, so changing one leaf changes every page above it on the next build (code: [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)). "Dynamically" in practice means: on every push to `master` that touches the site (code: [`pages.yml`](https://github.com/myklob/ideastockexchange/blob/master/.github/workflows/pages.yml)), and [`changes.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/changes.py) publishes what moved since the last revision. The app recomputes on mutation through `recalculateProtocolBelief`. No page recalculates live in your browser.

### The arithmetic underneath

Everything on this page rests on one rule, so here it is exactly (code: [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py); explained on [the method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula)):

```
row contribution   = sign × (2 × Truth - 1) × Confidence × Link × Imp × Uniq
page truth (argued) = (POS + w × p0) / (POS + NEG + w)
page truth          = min(argued, weakest load-bearing component that has its own page)
CONSTS = {'K': 1, 'UNARG': 0.5, 'DEFLINK': 1, 'DEFIMP': 0.5, 'DEFUNIQ': 1}
```

A claim nobody has argued sits at 0.5, so (2 × 0.5 - 1) = 0 and it contributes exactly nothing. Ten refuted reasons to agree count *against* the belief instead of padding it. `p0` and `w` come from the evidence a page declares (`etype`, `erq`, `erp`): `p0 = 0.5 + 0.5 × ESIW × (2 × ERP/100 - 1)` and `w = k × 2.0 × ERQ / (ERQ + 1)`, so replication is capped at `REP_CAP = 2.0` × k (code: [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py); [the method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts)). A page that declares nothing starts at 0.5 with weight 1. Confidence (0 to 1, from seven structural components, [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py)) says how much a page's score has earned the right to count.

Beside that argued score, every belief page now prints the owner's starting rule, **"Counting every reason until it is argued down"** (code: [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py); [the method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)). It drops the (2 × Truth - 1) and the confidence gate, so a reason counts from the moment it is posted:

```
a reason or prediction weighs   Truth × Linkage × Importance × Uniqueness
a finding weighs                the same, × (1 + ESIW × ERQ × ERP/100), uncapped
independent reasons on a side   the sum of Uniqueness over its reasons
share for                       (weight for + w × p0) / (weight for + weight against + w)
```

Nothing else reads the tally yet; the two rules are published side by side so they can be compared. See [[Truth Score]] and [[Evidence Verification Score (EVS)]].

---

## Why It Matters

Current online discourse (Twitter, Facebook, YouTube, etc.) is optimized for:
- Emotion over reason.
- Engagement over accuracy.
- Echo chambers over open-minded dialogue.

Our approach flips that:
- Structure > chaos.
- Evidence > emotion.
- Shared truth > tribal loyalty.

Those are slogans, but each one points at a mechanism you can check:

- **Engagement over accuracy is designed out.** No like count, view count or vote count feeds any number on the site. Votes exist (one GitHub account, one latest vote per claim, recorded in `content/votes.csv`), and the page prints them on the heading line as "N agree, M disagree; votes, not a score" (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py); the test suite checks every truth score is identical with and without the votes file). The home page then ranks the *gap* between the vote share and the truth score, widest first, once three or more people have voted on a claim ([what the list means](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes)). A wide gap is not a scandal; it is a map of where people need more time with the argument.
- **Echo chambers are designed out by symmetry.** Every two-sided section mirrors Supporters and Opponents (Rule 7 in [`BELIEF_PAGE_RULES.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/BELIEF_PAGE_RULES.md)). The same suspicion applied to one side's motives is applied to the other's.
- **Emotion is handled as a fact about people, not about beliefs.** The topic page's Engagement Landscape records how far people will go to act (from casual preference to civil disobedience), and "it never feeds the three-part address above. A casual supporter and someone willing to go to prison hold the same belief."

---

## Conflict Resolution Methods Implemented
1. [Separate the people from the problem](#separate-people-from-the-problem)
2. [Insist on using objective criteria](#insist-on-using-objective-criteria)
3. [Focus on interests, not positions](#focus-on-interests-not-positions)
4. [Invent options for mutual gain](#invent-options-for-mutual-gain)

(Items 2 and 4 used to link to a Google Sites editor page. They now link to the sections below, which describe what runs.)

---

## Separate People from the Problem

### Why?

Political conversations often get personal fast. People side with "their team" rather than engage with the actual issue. This platform:
- **Strips out personalities** and focuses only on claims and evidence.
- Uses **argument analysis algorithms** (NLP, logic scoring, machine learning) to break debates into components.
- **Shows the math** behind conclusions so bias and hidden agendas are exposed.

Think of it like replaying a controversial referee call: everyone sees the evidence, frame by frame.

What each of those three promises is today:

| Promise | Status | What the code does |
|---|---|---|
| Strips out personalities | **Partly, and differently.** Personalities are never *scored*, but they are not *hidden* | A page is a claim and a row is a claim-to-claim edge; no formula anywhere has an author term (code: [`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)). The edge column `who` means "who gains or pays: an interest", not who wrote it. People appear in one deliberate place, **People on the Record**, unscored. But every contributed row says who added it (below). |
| NLP, logic scoring, machine learning | **Logic scoring built; NLP and machine learning not built** | Decomposition into components is done by hand: a component row has a typed `type`, `stated` flag, load-bearing flag (`lb`) and `assumes`. "Which components are load-bearing is typed by the author, not argued." Logic is scored by the recursive truth rule and checked by graph shape ([`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py)). The only text processing is the lexical duplicate detector and the fallacy phrase list. |
| Shows the math | **Built** | "Every column is here so the row can be multiplied out and checked." Each belief page ends in a **Scoring Engine** table: Argument score, Evidence score, Prediction contribution, Belief score, Positive and Negative totals, Starting point and its weight, Truth score argued and capped, Relied on (ReasonRank), Work value, Complete, and the revision it was computed from. Every number is also exported as JSON. Hidden agendas get their own table, **Advertised versus actual motivations**, argued rather than detected. |

### How?

The 2025 plan was:
1. **Preprocessing**: Remove noise (emojis, URLs, etc.).
2. **Topic Modeling**: Group arguments by issue, not person.
3. **Sentiment Analysis**: Flag emotional attacks.
4. **Entity Recognition**: Detect when people are mentioned rather than the issue.
5. **Argument Consistency Tracking**: Show when someone uses a principle inconsistently.
6. **Anonymization**: Hide author identity during analysis.
7. **Ranking**: Prioritize logic and evidence over personalities.
8. **Continuous Learning**: Algorithms improve based on feedback.

Here is what happened to each step. The short version: the plan assumed a firehose of raw social-media comments to clean up. The site went the other way. Content arrives as one-sentence claims typed into a table, so most of the cleaning never needs to happen, and the two steps that would have let software quietly judge people were turned down.

| Step | Status | What runs instead, and where |
|---|---|---|
| 1. Preprocessing | **Not built, and not needed** | There is no raw text to clean: every row is a typed, one-sentence claim in a CSV. The duplicate detector tokenises claim text to content words (a published `STOP` list) and character 4-grams; it does not strip URLs or emoji ([`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py)). The only code resembling this step is `normalize_text` in the unwired `src/core/ai/similarity.py`. |
| 2. Topic Modeling | **Replaced** by a hand-filed topics table plus a computed duplicate detector | Every belief names its topic in the `topic` column and every page beneath inherits it; topics have parents, so the hierarchy is typed, not discovered (`content/topics.csv`, 95 topics; [the topics page](https://myklob.github.io/ideastockexchange/beliefs/topics.html)). The computed part is the duplicate detector: IDF-weighted Jaccard over content words averaged with IDF-weighted cosine over character 4-grams, flagging at `FLAG = 0.45` and treating a pair at `MERGE = 0.70` as one claim. No LDA, no fixed topic count anywhere. It "changes no score and cannot": `w_ces` is 0 until somebody argues the proxy tracks meaning. See [[Equivalency Score:]] and [[The Redundancy Problem]]. |
| 3. Sentiment Analysis | **Refused as a score; replaced by a flag that moves nothing** | No polarity, no filtering of rows by tone. [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) explains why: "a pattern matcher looking for 'attacking the person instead of the argument' would fire on the central legitimate argument on every page. A check that deducts points from the strongest claim in the corpus, silently, with no page to appeal to, is worse than no check." Since October 2026, following the owner's direction, [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) flags a *possible* fallacy by a short published phrase list (below). The flag is a question, not a verdict, and moves no score. |
| 4. Entity Recognition | **Not built**; people get one deliberate home instead | No named-entity recognition anywhere. Names belong in **People on the Record** ("Who, and what they said or did, as one sentence" and "Where it is on record"). A person named inside an argument row is not detected; Rule 3 (an argument is an atomic proposition) is the editorial guard. The nearest automatic catch is the fallacy flag **Attacking the person**, which fires on phrases like "he's a liar", "paid shills" or "only says that because". |
| 5. Argument Consistency Tracking | **Partly built, all typed** | The app has a **Cross-Context Consistency Check** table, "the hypocrisy detector, applied symmetrically": Value Deprioritized Here / Deprioritized By / Other Topic Where They Champion It / What This Suggests ([`ValuesSection.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/ValuesSection.tsx)). Every cell is typed, and today only the bespoke `/beliefs/set-aside-distractions-for-real-solutions` route renders it. The site's nearest thing is the **mirror test** argued by hand on every interest page: would the side accept the same need honored for its opponents? |
| 6. Anonymization | **Reversed on purpose**: identity is shown, never scored | "Every row a submission adds says who added it and when (`added_by`, `added`) and, for a source, where it can be read and the day it was checked (`url`, `checked`)... so the exports carry them and the page shows them under the row" ([`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py)). The row prints "Added by @login on date", linked to the GitHub profile. Votes are keyed by login. The app prints a famous quote's author as ~Name. What both engines guarantee is the thing anonymization was for: no person is ever a scoring input. |
| 7. Ranking | **Built** | Every table sorts by its row score, highest first, blanks last, top rows shown and the rest collapsed (Rule 8; [`ranking.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/lib/ranking.ts) in the app). The row score has no term for who said it. |
| 8. Continuous Learning | **Refused by design** | No parameter is learned from data or feedback. The constants (`K = 1`, `UNARG = 0.5`, `DEFLINK = 1`, `DEFIMP = 0.5`, `DEFUNIQ = 1`, `DAMPING = 0.85`) and the eighteen evidence tiers are pinned in a cross-implementation contract, [`conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py), that CI runs before it publishes anything. Changing a rule is `python3 conformance.py --write` and a reviewed diff, not a training step. Reader feedback arrives as rows and votes, which change the content, never the algorithm. |

**Why "shown, never scored" beat "hidden" (owner's judgment, as built).** Anonymity protects people from the mob, but it also hides the audit trail: who added this row, when, and from what source. A site that asks you to trust its numbers has to let you trace every one of them, including to the person who typed it. The site's answer is to make identity *visible and weightless*: you can see that @someone added a row, and it does not matter, because the row's score comes from the page that argues it.

### The possible-fallacy flags

What runs where step 3 used to be (code: [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py); [the method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks)). It reads reasons and objections only, never findings, and never their scores:

| Possible fallacy | What it is | Example phrases that raise the flag |
|---|---|---|
| Attacking the person | answers who said a thing instead of whether it is true | "he's a liar", "can't be trusted because she", "what do you expect from", "paid shills", "only says that because" |
| Appeal to popularity | treats how many believe a claim as evidence that it is true | "everyone knows", "most people agree", "common knowledge" |
| Appeal to authority | rests a claim on who endorses it rather than on the evidence they had | "experts agree", "trust the science", "according to the experts" |
| Slippery slope | claims a first step will lead to an extreme outcome without showing each step | "will inevitably lead to", "opens the floodgates", "next thing you know" |
| False choice | presents two options as the only ones when others exist | "the only alternative is", "there are only two options" |
| Sweeping generalization | states a rule with no exceptions where exceptions are likely | "all politicians are", "no one ever", "every single one" |
| Appeal to tradition | treats a practice as right because it is old | "it's always been done", "for generations," |
| Pointing at the other side | answers a criticism by saying the critic does the same thing | "what about the", "they do it too" |
| After, therefore because of | concludes that one thing caused another because it came first | "ever since ...,", "and then crime rose" |

Each flag shows the exact words that set it off and opens two prefilled forms on the flagged claim's own page: a reason to disagree saying it *is* the fallacy, and a reason to agree saying it is *not*. Whatever that argument concludes reaches the score through the ordinary rules; the flag never does. That is the difference between a smoke detector and a sprinkler system that floods the house every time somebody makes toast.

The flags sit in the **Structural Checks** panel beside nine graph-shape checks that read no prose at all (code: [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py)):

| How serious | Check | What sets it off |
|---|---|---|
| serious | Circular support | Following the reasons beneath a claim leads back to the claim itself. |
| serious | Assumes its own conclusion | A load-bearing premise rests on the claim, or is argued to be the same claim (equivalence 0.90 or more). |
| worth checking | The same page listed more than once | Two or more reason or evidence rows on one page read the same claim page. |
| worth checking | Rows that may be the same point twice | Two rows on one page read alike to the duplicate detector and no uniqueness page argues the overlap. |
| worth checking | Rests only on authority or experience | Every claim beneath the page is classified as an expert claim, expert testimony, an anecdote, a norm or a hunch. |
| worth checking | Evidence filed above the premise it bears on | The page cites findings and argues higher than it reads, because a load-bearing premise beneath it cites nothing. |
| worth checking | Costs and benefits given as single figures | A priced cost or benefit states one number and no range. |
| a note | Nothing stated would show it false | A belief lists no testable prediction. |
| a note | Nobody has argued the other side | Every reason and finding on the page is on one side. |

None changes a score. The two serious ones are also refused outright before publishing, because "a loop can hold any value at all and stay consistent, so there is no number to publish."

**The app does it differently.** Its regex detector ([`fallacy-detector.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/fallacy-detector.ts)) drafts a counter-argument and "deliberately returns NO numeric fields". But a fallacy claim that reaches 60% weighted agreement with at least 3 votes (`CONSENSUS_THRESHOLD = 0.6`, `CONSENSUS_QUORUM = 3`, [`consensus.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/consensus.ts)) publishes a counter-argument at strength 0.8 (major) or 0.5 (minor) into the linkage debate ([`claims.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/claims.ts)), so there a vote is what moves the number.

<details>
<summary>Original sketch (2023), not what runs</summary>

What runs instead is the typed-claim model above: [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) for duplicates and [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) for flags that move no score; no file in the project imports spaCy, TextBlob or scikit-learn's LDA.

```python
import re
import spacy
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from textblob import TextBlob

nlp = spacy.load("en_core_web_sm")

def preprocess(text):
    return re.sub(r'http\S+|www.\S+|@\S+|[^A-Za-z0-9\s]+', '', text).lower()

def topic_modeling(corpus):
    vec = CountVectorizer()
    data = vec.fit_transform(corpus)
    lda = LatentDirichletAllocation(n_components=5)
    lda.fit(data)
    return lda, vec

def sentiment(text):
    return TextBlob(text).sentiment.polarity

comments = [
    "This policy is a disaster for our economy.",
    "The policy is terrible, just like the person who proposed it!",
    "We need to focus on education and healthcare.",
]

cleaned = [preprocess(c) for c in comments]
lda, vec = topic_modeling(cleaned)

for c in cleaned:
    if sentiment(c) > -0.5:
        print(c)
```

(The sketch would have silently dropped the second comment's policy complaint along with its insult, which is the exact failure `integrity.py` warns about.)

</details>

---

## Insist on Using Objective Criteria

Pick the ruler before you measure. If two sides agree in advance that "median rent as a share of median income" settles whether housing got more affordable, the argument stops being about who shouts louder and becomes a question of reading a number. A good criterion is one where supporters and opponents *predict different readings*; a criterion both sides expect to come out the same way tests nothing.

**On the site** (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), [`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py)), every belief page has an **Objective Criteria** table and every topic page a **Best Objective Criteria for This Topic** table:

| Column | Where it comes from |
|---|---|
| Proposed criterion | A claim with its own page |
| Score | That criterion page's own truth score, by the ordinary rule |
| Validity (does it measure what is claimed?) | Typed label; "nothing reads them" |
| Reliability (would two observers get the same reading?) | Typed label |
| Linkage (how directly does the reading bear on this belief?) | Typed label; a Low validity or Low linkage greys the row |
| Importance (how much does the conclusion move once the reading is in?) | Typed label |
| Latest reading | Prints "not yet read" until somebody fills it with a sourced number |

Under each row the page prints how it is measured and what would strengthen or weaken it (the `method`, `strengthen` and `weaken` fields). An empty Latest Reading is deliberate: it is "the open invitation".

**In the app** ([`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts)), the four factors are different and they are averaged:

```
totalScore = (validityScore + reliabilityScore + independenceScore + linkageScore) / 4   (each 0 to 1, default 0.5)
label: excellent ≥ 0.80, good ≥ 0.60, moderate ≥ 0.40, weak > 0, invalid = 0
belief aggregate = Σ (totalScore × linkageScore) / Σ linkageScore
```

So the two engines disagree on the factor set (site: validity, reliability, linkage, importance; app: validity, reliability, *independence*, linkage) and on whether the factors are read at all. See [[Evidence to Conclusion Relevance Score]] for how a reading bears on a conclusion. The app's explainer is at `/algorithms/objective-criteria`.

---

## Focus on Interests, Not Positions

### Why?

When people lock into a "position" (e.g., "Build the wall"), they:

* Stop considering alternatives.
* Seek to "win" rather than solve.
* Ignore creative, mutually beneficial solutions.

Instead, **interests** look at *why* someone holds a view: the underlying values and needs.
Focusing here leads to more solutions both sides can live with.

The site's own section header says it in nine words: "Positions are what people say they want; interests are why." A position is the flag planted on the hill. The interest is the reason anyone wanted the hill: safety, money, dignity, a quiet street. Two armies fighting over one hill can sometimes both get what they actually wanted from two different hills.

### How?

The 2025 plan was:

1. **Identify values/interests** tied to each argument.
2. **Encourage submissions** of potential motives from participants.
3. **Reward agreement/disagreement analysis** of those motives.
4. **Use scoring algorithms** (ReasonRank, Linkage Scores, Truth Scores) to weigh them.
5. **Classify motives** (e.g., Maslow's needs).
6. **Rank importance** relative to other motives.
7. **Produce Interest Attribution Confidence Intervals (IACI)** and **Interest Validity Scores (IVS)**.

What each step is today:

| Step | Status | What runs, and where |
|---|---|---|
| 1. Identify values and interests tied to each argument | **Built** | Interests are tied to arguments through **importance pages**: an argument row's importance page lists up to five interests (the page prints "Interests listed N of 5"), each with a bearing page. Values are a typed table per belief (**Shared values, different rankings**: Value / Supporters rank / Opponents rank / Gap / Why the rankings differ). |
| 2. Encourage submissions of motives | **Built** | Every Interests sub-table ends in a form ("Add an interest": "A need somebody has, as one sentence"), and sub-tables not yet present get a first-row form. **Advertised versus actual motivations** is two-sided by construction. |
| 3. Reward agreement and disagreement analysis | **Partly built** | Every interest page and driver page is argued two ways. An interest page counts as complete only with at least one reason each way and both readings filled (`if_true`, `if_false`). The only reward is ranking: a belief that meets the core bar ([`publish.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/publish.py) `CORE_BAR`: reasons to agree, reasons to disagree, evidence, objective criteria, testable predictions or a falsifiability test, costs and benefits, interests on either side) comes first in every list. There is no reputation, karma or contributor incentive system. |
| 4. Weigh them with ReasonRank, Linkage Scores, Truth Scores | **Built** | Validity is the interest page's truth score; Drives is the driver page's truth score (the wiki's Linkage Accuracy); Bears is a linkage page's truth score. All three use the same page-truth rule as every other claim, and ReasonRank ranks interest pages by how much depends on them. Numbers are 0 to 1, not the 0 to 100 of [[Likely Interests of Those Who Agree and Disagree]]. |
| 5. Classify motives (e.g., Maslow's needs) | **Partly built, app only, typed** | The app's Interest Validity Debate carries a typed `maslowPrior` per interest (for example "Safety 70-85"), with the rule "Maslow is a prior, not a verdict: the reasons below can move the starting band up or down" ([`InterestValiditySection.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/InterestValiditySection.tsx)). Nothing classifies automatically. The site has no Maslow field; its only classification is the typed `value` column ("the value it serves"). |
| 6. Rank importance relative to other motives | **Built** | The site's importance page sorts its interests by **Effective** = Validity × Bears with a **Relative** column (share of the total). The site-wide interests page groups needs by party (the role or nationality named in "<who> need <what>"), ranks groups by how many beliefs list one of their interests, and ranks needs within a group by validity. The app's Interest Priority Rankings are typed ranks with a typed 0-1 "Confidence we are correctly attributing this ranking". |
| 7a. Interest Attribution Confidence Intervals (IACI) | **Not built**, under any name | No interval is computed or stored. The attribution question ("is this really why the side holds its position?") is answered by a point number: **Drives** on the site (0 to 1, default 0.5), `linkageAccuracy` in the app (0 to 100, typed). The nearest uncertainty readout is [`sensitivity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py), which finds which single input would flip a conclusion. IACI stays here as a **proposed** mechanism. |
| 7b. Interest Validity Scores (IVS) | **Replaced** by Validity | Same idea, shorter name. Site: the interest page's truth (0 to 1) from its own reasons, read identically on every page that lists the interest. App: a typed `validityScore` (0 to 100) gated by a Resolution Floor of 70 (below). The name IVS appears nowhere in code. |

### What a belief page computes from interests

On the site (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)):

| Number | What it asks | How it is settled |
|---|---|---|
| **Validity** | Should this need be honored? | The interest page's truth, settled by the **mirror test**: "would the side accept the same need honored for its opponents, and what happens if everyone pursues it? Who holds the need, how many of them there are and how much power they have never count." |
| **Drives** | Is this need really why the side holds its position? | A driver page's truth ("The interest X is what actually drives support for the belief Y"), "settled by the side's record, not its rhetoric". With no driver page it reads `UNARG = 0.5` ("No driver page yet, reads 0.5"). |
| **Score** | How much this interest is driving this side | Validity × Drives |
| **Primary conflict pair** | The one disagreement actually driving the debate | Computed, never typed: the interest with the highest Validity × Drives on each side, printed with both factors and the share a / (a + b) of paired weight on the supporting side. |

Why multiply? "So a cover story cannot lead a side and neither can a worthy need nobody is moved by." A motive that is real and illegitimate "stays in the table with its low validity: it is scored, not deleted, and the same suspicion applies to both sides."

**Worked example** (calculation, from the current tables): [Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html) lists four supporter interests and three opponent interests, each with a driver page. Nobody has yet argued any of those interest or driver pages, so every one reads Validity 0.50 × Drives 0.50 = 0.25. The primary conflict pair is therefore a tie, broken by listing order: [Citizens need government decisions made on the merits](https://myklob.github.io/ideastockexchange/beliefs/p/citizens-need-government-decisions.html) (0.50 × 0.50) against "Officials and their families need the same property rights and privacy as other citizens" (0.50 × 0.50), with 50% of the paired weight on each side. That is the honest reading of an unargued debate: the machinery is wired, and it says so by refusing to pick a winner. Argue one [driver page](https://myklob.github.io/ideastockexchange/beliefs/p/drives-citizens-need-government-barring-members.html) up or down and the pair moves.

### Importance comes from interests, and it is a max, not a mean

The 2025 code outline averaged importance across arguments. The engine does something different (code: [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)):

```
importance page = max over listed interests of (Validity × Bears)
Bears           = the bearing page's truth, else DEFLINK = 1
no interests listed  →  DEFIMP = 0.5
```

Then importance *multiplies* that row's contribution; it is never averaged across rows. A reason matters as much as the most legitimate need it bears on, not as much as the average of every need anybody mentioned. See [[Likely Interests of Those Who Agree and Disagree]] and [[Linkage Scores]].

### The app's version

The app ([`conflict-resolution.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/conflict-resolution.ts), [`interests.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/lib/interests.ts)) uses typed 0-100 numbers instead of argued pages:

```
driveScore      = linkageAccuracy × validityScore / 100     (validity defaults to 50 when null; linkage to 0)
primary pair    = highest driveScore on each side among interests that are not shared
RESOLUTION_FLOOR = 70   (RESOLUTION_FLOOR_VALIDITY = 70: a satisfied interest below it earns nothing)
```

It runs on the app's own belief page (through `conflict-pipeline.ts` into `ConflictResolutionSection`); the published site does not run it.

<details>
<summary>Original sketch (2023), not what runs</summary>

What runs instead is the max-over-interests rule above, in [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), with interests identified as their own pages on an importance page rather than as an attribute of each argument. (As written, the sketch raises `AttributeError`: `a.importance` is attribute access on a dict.)

```python
def evaluate_arguments(arguments):
    # Placeholder for scoring logic
    return sum(a.importance for a in arguments) / len(arguments)

def identify_interests(arguments):
    return [a.interest for a in arguments]

# Example usage
arguments = [{"importance": 0.8, "interest": "security"},
             {"importance": 0.6, "interest": "economic stability"}]

score = evaluate_arguments(arguments)
interests = identify_interests(arguments)

print(score, interests)
```

</details>

---

## Invent Options for Mutual Gain

The software does not invent anything. People do. What the software does is rank what people typed and, in the app, point at the disagreements small enough to win.

**On the site, belief page** (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)):

| Table | Columns | Scored how |
|---|---|---|
| **Shared interests** | Shared interest / A direction both could take | Each row is a page, by the ordinary truth rule |
| **Best compromise** | Compromise / What it rests on ("Rests on" premise and "Why difficult") | Each row is a page, by the ordinary truth rule |
| **Obstacles to resolution** | For supporters / For opponents | Each row is a page |

One number is derived from them, **ease of resolution** ([the method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#dispute)):

```
ease = max(compromise truth) × (1 - mean obstacle truth)      (mean obstacle truth reads 0.5 when none is listed)
```

On the example belief, the one compromise ("Bar individual stocks, sector funds and derivatives for the official, spouse and dependent...") and both obstacles are unargued at 0.50, so ease = 0.50 × (1 - 0.50) = 0.25 (calculation). Ease is shown beside the kind of dispute and not used to decide it.

**On the site, topic page**: **Common Ground and Compromise** pools three columns: Shared Interests ("Impacts both sides want"), Real Value Conflicts ("One side prices freedom, the other safety") and Proposed Compromises ("Deals someone has put forward"), drawn from the topic's own rows and from every belief page beneath it. Its caption is candid: "A compromise here is typed by its author; nothing on this site yet tests which disagreements a small change in likelihood would flip." See [Public office and private gain](https://myklob.github.io/ideastockexchange/beliefs/t/public-office-private-gain.html) for a filled one.

**In the app** ([`conflict-resolution.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/conflict-resolution.ts)), four outputs "fall out almost for free" from rows already scored, and "nothing feeds back into any score":

| Output | Rule | Constants |
|---|---|---|
| Shared interests | Cross-side interest statements paired by `mechanicalSimilarity`, kept only when both validities clear the floor; ranked by `pairedValidity = 2·sv·ov / (sv + ov)` (a harmonic mean, so a lopsided pair sinks) | `SHARED_INTEREST_SIMILARITY = 0.5`, `RESOLUTION_FLOOR = 70` |
| Primary conflict pair | Highest `driveScore` per side among interests not shared | validity default 50 |
| Genuine value conflicts | Shared values the two sides rank far apart | `minGap = 2` |
| Compromise candidates | Cost or benefit items where a small likelihood shift flips the sign of the category's net: `requiredShift = \|net\| / \|magnitude\|` | `ACHIEVABLE_SHIFT = 0.15` |

That last test is exactly what the site's topic caption admits it lacks. Whether to port it is an open question (below). See [[Likelihood of Costs and Benefits]].

---

## Mechanisms the 2025 page never named

The code grew several conflict-resolution tools the old page had no words for.

### The kind of dispute

Every belief page names what kind of disagreement it is, computed from its own tables, and the home page ranks beliefs hardest first: Values conflict, Mixed dispute, Linkage dispute, Factual dispute ([what the list means](https://myklob.github.io/ideastockexchange/beliefs/lists.html#hardest); code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py); [the method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#dispute)):

```
factual    = min(evidence weight for, against) / max(the two)            (0 when no finding carries weight)
linkshare  = share of argument rows whose linkage is below 0.5
value gap  = min(1, mean |supporters rank - opponents rank| / 3)
kind       = whichever leads both others by at least 0.1; otherwise Mixed dispute
```

On the example belief (calculation): the three value rankings are Honest government 1 vs 2, Property rights 3 vs 1, Open service to people of ordinary means 2 vs 3, so the mean gap is 1.33 and the scaled gap 0.44. Evidence two-sidedness is 0.23 and linkage share is 0. The value gap leads both by more than 0.1, so the page reads **Values conflict**. That is useful to know before anyone spends a week hunting for a study: no study settles whether property rights outrank honest government. A definitional dispute is listed but not computed.

This matters for conflict resolution because the cure depends on the disease. A factual dispute wants evidence. A linkage dispute wants someone to show the reason actually bears on the conclusion. A values conflict wants a compromise, because no amount of data makes one person's ranking of liberty and safety into another's.

### Two-sided tables for what usually goes unsaid

Each of these is mirrored for both sides (Rule 7), and each row is a page:

- **Advertised versus actual motivations** (Advertised / Actual, for supporters and for opponents).
- **Obstacles to resolution** (For supporters / For opponents).
- **Cognitive biases** (Affecting supporters / Affecting opponents).
- **Dispute types** (Type / What exactly is disputed / What would move it), with the computed kind marked "leading here".

### The Engagement Landscape and Core Values Conflict (topic pages)

The topic page records how far people go to act on a position, in four levels: **1. Preference** (passive lean), **2. Active Advocacy** (engaged participant), **3. Principled Non-Compliance** (conscientious objector), **4. Civil Disobedience** (principled lawbreaking). It is "a map of who will act, not a matching axis" and feeds no score. **Core Values Conflict** sets the advertised values each side claims beside the motivation critics attribute. See [[Template: Topic]].

### Contribution with a duplicate check

There is no server. Every table on a belief or topic page ends in a form that is a plain GET to a prefilled GitHub issue; there is also a propose-a-belief form. As you type, [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) checks your words against `data/claims_index.json` (`FLAG = 0.45`, `MERGE = 0.70`); [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) checks again with the full measure. At or above `MERGE` your submission *is* the existing claim and counts as your vote for it; between `FLAG` and `MERGE` the rows are added and a maintainer sees the near matches. A reworded version of an old argument becomes a vote for the old one instead of a second copy. That is how the site keeps a crowd from turning one point into fifty. "Anyone" therefore means anyone with a GitHub login, and a maintainer merges.

### Sensitivity, confidence and work value

[`sensitivity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py) asks the budget-office question: which single input, if it moved, would flip the answer? It reports "Moves it now" and "Moves it if settled", and the gap between them is the value of doing the work. Paired with ReasonRank's Work value, this tells a mediator where to dig first. See [[Confidence Stability Scores]] and [the method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity).

### What acting on a belief would cost and gain

Merit is made concrete as expected value: each cost or benefit is a claim whose truth is its Likelihood, Expected value = typed estimate × Likelihood, netted by unit and by interest in a **Who gains, who pays (by interest)** table. No party, person or group identity enters any formula. See [the method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba).

---

## The Goal

A web platform where:

* **Every belief has a structured page** with pros/cons ranked by strength.
* **Conflicts are resolved in public** using evidence and reason.
* **Policies are chosen based on merit**, not party loyalty.

This is **conflict resolution as public infrastructure**: a truth engine for democracy.

Where that stands:

- **Every belief has a structured page: built.** Every belief in the tables is published however far along it is, and no drafted argument is ever deleted (the owner's standing rule: quality is ranked, not gated). A belief meeting the core bar is complete and comes first in every ranking; every other belief is published with a `draft` mark saying what it still needs. Every table ranks its rows by score on both sides.
- **Conflicts resolved in public: built, with one deliberate restraint.** All argument, evidence, voting and review happens in a public repository, and each page classifies its own dispute and says what kind of work would move it. There is no verdict module: a page prints its numbers and does not tell the reader what to conclude from them.
- **Policies chosen on merit: partly built.** The pages are an input to a decision, not a decision procedure. Merit is operationalised as expected value across interests; whether anyone then chooses policies that way is outside the software.

---

## Where the site meets the owner's direction (October 2026)

The owner set standing direction on scoring in October 2026 (recorded in the project's `CLAUDE.md` and at the top of `docs/WIKI_AUDIT.md`). Here is how this page's mechanisms line up:

| Direction | What the site does today | Gap |
|---|---|---|
| **Volume**: count truly independent reasons, weigh pro against con, count contributions from the moment they are posted. For choices of action, cost and benefit across every legitimate interest. | The argued truth score counts an unargued reason as exactly 0. [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) prints the owner's rule beside it. On the example belief the argued score reads 0.61 before its load-bearing cap and 0.50 after it; the tally reads 0.57 from 5 independent reasons for and 5.5 against (calculation). Interests feed importance and the Who gains, who pays table. | Which rule leads is to be settled by comparing them on real pages. Interest and driver pages are counted under the argued rule only. |
| **Votes**: attention, never validity; track what is popular apart from what holds up. | Matches: votes shown on the heading line, never scored, and the vote-vs-truth gap is its own ranked list. | The app lets reputation-weighted linkage votes set an edge's linkage when no linkage debate exists (`aggregateLinkageVotes`), and a 60% vote confirm a fallacy claim that then moves a score. |
| **Fallacies**: software may flag, nothing is final, a flag is argued like any claim and moves no score. | Matches: [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) flags by a published phrase list and opens forms to argue each flag. | The app's vote-confirmed fallacy claim is a different route to the same place. |
| **Linkage with no argument**: start trusting, fall when argued down, rise when argued well. | `DEFLINK = 1` with no linkage page, and Bears reads 1 on importance pages, which matches. Drives, the interest equivalent of linkage, starts at `UNARG = 0.5`. | Whether Drives should also start trusting (at 1) is not decided. The app's `driveScore` starts linkage at 0 when null. |
| **Evidence weight**: prefer no ceiling. | The tally uses ESIW × ERQ × ERP/100 uncapped. The argued score's starting point caps replication at `REP_CAP = 2.0` × k. | An interest page can declare evidence like any page, but none does yet. |

---

## Open questions for the owner

These came out of the October 2026 audit. Where the owner's direction already answers part of one, that is said.

1. **Should contributor identity be hidden or shown-and-never-scored?** The 2025 page promised anonymization; the code writes `added_by` into every contributed row and shows it. Options: (a) keep the code's rule and call it "identity shown for provenance, never scored" (this page describes it that way); (b) stop rendering `added_by` on pages but keep it in exports and votes; (c) drop it from intake entirely, losing the audit trail.
2. **Tone and fallacy detection.** *Largely answered by the owner's direction*: flags are allowed, argued, and move no score, which is what [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) now does. Still open: whether any score deduction is ever wanted (it would break "every number is a link to the page that argues it" and need a conformance diff), and whether the app's vote-confirmed route should match the site's argue-it route.
3. **Which interest engine is canonical?** The site's argued Validity × Drives (0 to 1, defaults 0.5) or the app's typed `linkageAccuracy × validityScore / 100` with a Resolution Floor of 70 and harmonic-mean pairing? Options: (a) site canonical, app labelled provisional; (b) port the Resolution Floor and pairing into the site as computed outputs; (c) keep both and say so, which the project's notes warn is the outcome that costs.
4. **Objective criteria: four typed labels nothing reads (site) or four averaged scores (app), and is the fourth factor Importance or Independence?** Options: (a) a criterion's only score is its page's truth, labels are advice; (b) argue each factor on its own page and combine them; (c) accept two surfaces and label the app's provisional.
5. **Does the owner still want an attribution confidence *interval* (IACI), or is a point score (Drives) the design?** Options: (a) drop the interval and rename the step Drives; (b) derive a displayed range from the driver page's confidence and the sensitivity sweep, as a readout, not a score; (c) keep IACI as proposed (this page does).
6. **Should Maslow classification exist on the site?** Options: (a) a typed Maslow band on interest pages as a label only; (b) a Maslow band as an evidence-style prior that sets p0 on an interest page, a rule change needing a conformance diff; (c) keep validity purely argued.
7. **Should the app's compromise-candidate test (a likelihood shift of 0.15 or less flips a category net) be ported to the site**, whose topic caption says it has no such test? Options: (a) port it as a computed Common Ground output; (b) leave it app-only and say so; (c) drop it from the app too.
8. **Should Drives start trusting?** The direction on linkage says an unargued link starts trusting. Drives is the interest analogue of linkage but starts at 0.5, which is why every unargued interest in the example reads 0.25 and the primary conflict pair is a tie. Starting it at 1 would let Validity alone pick the pair until someone argues a driver page down.

---

## Related pages

- [[Template: Conflict Analysis]], [[Template: Interest Validity Debate]], [[Template: Stakeholder Profile]], [[Template: Stakeholder Index]], [[Template: Belief Analysis]], [[Template: Topic]], [[Template: Linkage Evaluation]], [[Templates]]
- [[Likely Interests of Those Who Agree and Disagree]] for interests in depth; [[Linkage Scores]] for Bears and Drives; [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]] for the signed row rule; [[ReasonRank]] and [[ReasonRank: Google's PageRank for Arguments]] for the two ReasonRanks; [[Equivalency Score:]] and [[The Redundancy Problem]] for the duplicate detector; [[Confidence Stability Scores]]; [[Likelihood of Costs and Benefits]]; [[Assumptions]]; [[Pros and Cons on the Same Page]]; [[One Page per Debate Topic]]; [[Electronic Democracy]]; [[Evidence‐based policy]]
- On the live site: [the home page](https://myklob.github.io/ideastockexchange/beliefs/index.html), [what every ranking means](https://myklob.github.io/ideastockexchange/beliefs/lists.html), [the method page](https://myklob.github.io/ideastockexchange/beliefs/method.html), [kind of dispute](https://myklob.github.io/ideastockexchange/beliefs/method.html#dispute), [structural checks and fallacy flags](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks), [the example belief](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html), [the example topic](https://myklob.github.io/ideastockexchange/beliefs/t/public-office-private-gain.html)
- Code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py), [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py), [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py), [`conflict-resolution.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/conflict-resolution.ts), [`templates/conflict-analysis.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/conflict-analysis.html)
- [[Home]]
