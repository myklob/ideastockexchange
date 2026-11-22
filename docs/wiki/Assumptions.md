# Assumptions

Every argument is a building, and most of the building is underground. The sentence you read ("Universal Basic Income will reduce crime") is the paint on the front door. Holding it up are beams nobody mentioned: that people steal mostly out of need, that the money arrives where the need is, that nothing else changes at the same time. Knock out one of those beams and the house comes down, however lovely the paint.

This page is about finding those beams, labelling them, and testing them one at a time. It started as the owner's explanation on PBworks and had never been on the GitHub wiki. Everything that explanation said is kept below, section by section, and each claim now carries its real status: what the published site does today (with the formula and a link to the file), what the Next.js app does where it differs, what is proposed and not built, and what is refused by design and why.

Two engines in this repository touch assumptions, and they do very different amounts with them:

| Where | What it stores | What it does with it |
|---|---|---|
| The published site ([`tools/static-site/`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md), which builds [the live belief pages](https://myklob.github.io/ideastockexchange/beliefs/index.html)) | Component claims with a typed load-bearing flag, assumptions by side, an assumption stack per topic | **Caps a belief's truth score at its weakest load-bearing premise.** This is the one place an assumption moves a number. |
| The Next.js app ([`src/core/scoring/`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts) and the belief page) | `ComponentClaim` and `Assumption` rows in [`prisma/schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma) | Displays them. No scoring code reads either table. |

## The problem: the "wall of text" trap

When we communicate in long-form prose without structural links, three major problems occur:

- **Hidden Foundations:** Most arguments rely on **Unstated Assumptions** that the author takes for granted. Because they aren't labeled, the reader cannot challenge the root of the idea.
- **The Pivot Maneuver:** In a "wall of text," if you disprove one small point, the author can simply pivot to another part of the text. Because the "load-bearing" assumptions aren't identified, it is impossible to "topple" a false belief.
- **Cognitive Exhaustion:** It takes immense mental energy to manually deconstruct someone else's argument. Most people simply "react" to the tone rather than "analyze" the logic.

What the site does about each one today:

**Hidden Foundations: built, on the beliefs that have been taken apart.** Every belief page has a Logical Anatomy table with a "Stated?" column, and an implied component is a row like any other, with its own page and its own truth score. On the live site, 89 of the 125 component rows are marked as not stated (calculation: counting `stated: N` in [`content/edges.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/edges.csv), October 2026 build). So the site's beliefs lean on roughly two and a half unstated parts for every stated one, which is the owner's point made with numbers. The catch: only 42 of the 196 beliefs have had their anatomy filled in at all. The other 154 still have hidden foundations, and the page says so in its list of what the belief still needs (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), "the claim has not been split into its component parts").

**The Pivot Maneuver: built, in a way that makes pivoting expensive.** The site is one claim per page and one row per edge. A belief page's reasons are separate rows, each pointing at a page of its own, so "another part of the text" is another page with its own score. Better still, a row counts as `sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq` (code: [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)). A reason argued below 0.50 goes negative and counts *against* the side it was filed on. The scorer's own docstring puts it bluntly: "ten refuted reasons to agree weaken the belief instead of padding it." In a wall of text, a debunked point is quietly abandoned. Here it stays on the page as a debit.

**Cognitive Exhaustion: partly answered.** Nobody has to deconstruct an argument twice: the anatomy is done once, on a page anyone can read and argue. And the site tells you where your limited energy will do the most good. The "What to argue next" queue ranks claims by `work = rank x (1 - confidence)`, the share of the site resting on a claim times the share of its work still undone (code: [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py); see [ReasonRank on the method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank)). The sensitivity sweep names the single input that would change a belief's answer (see [what would change the answer](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity)). Reacting to tone is still free and analysing logic still costs effort; the site lowers the price, it does not abolish it.

## The vision: turning prose into architecture

The **Idea Stock Exchange** is designed to treat beliefs like physical structures. If you were inspecting a building, you wouldn't just look at the paint (the prose); you would check the foundation and the load-bearing beams (the assumptions).

### Why we must link arguments to assumptions

If we don't force this link, we are just shouting into the void. By creating a system that **automates the decomposition of text**, we achieve:

1. **Logical Transparency:** Every claim is explicitly tied to the assumptions required to make it true.
2. **Modular Debate:** Instead of arguing about a whole "belief," we can debate a single, specific assumption. If that assumption fails, the belief collapses automatically.
3. **Auditability:** We can generate a "Logic Score" for a belief based on how many of its underlying assumptions have been verified or debunked.

Status of each:

**"Automates the decomposition of text": not built, by people instead.** No software splits prose into assumptions on either engine. On the site, a person splits the belief and types each part as a row; anyone can propose a component or an assumption through the forms on the page (see [How people add assumptions](#how-people-add-assumptions)). The nearest thing to automation is in the Next.js app: `shouldPromptForAssumption` in [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts) returns true when an argument's linkage is weak but not dead (`Math.abs(linkage) > 0.1 && Math.abs(linkage) <= 0.4`), "suggesting that an intermediate belief could repair the chain," and the `/api/protocol/[id]/linkage` route hands that back as `needsAssumption`. It suggests *that* an assumption is missing, never *which* one.

**Logical Transparency: built for 42 beliefs.** The Logical Anatomy table ties each belief to its component claims, and a "What it silently assumes" column says in words what each component leans on. Four pages also state their logical form outright, in the `form` column of `pages.csv`. One honest limit: the "silently assumes" column is plain text, not a linked page, so those deepest assumptions cannot yet be scored.

**Modular Debate: built, and the collapse really is automatic.** Each component is a page with its own reasons for and against. If a load-bearing component's score falls, the belief's score falls with it on the next build, with nobody touching the belief. The exact rule is in [The cap](#the-cap-a-conclusion-cannot-outrun-its-premises) below.

**Auditability and the "Logic Score": partly built, under different names.** No number counts verified and debunked assumptions. What exists instead, on every belief page with an anatomy:

| Readout | Formula | What reads it |
|---|---|---|
| Weakest load-bearing component | the lowest truth among components marked load-bearing that have a page | The cap on the truth score |
| Product of load-bearing truths | the product of those same truths | Nothing. Printed "for comparison and read by nothing" |
| Argued truth | what the rows argue before the cap | Shown beside the truth score so the gap is visible |
| Truth score | `min(argued, weakest)` | Every parent page |

(code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), the Logical Anatomy section; [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py) lines 208 and 209.) The product is the probability that every load-bearing part holds if they are independent; the cap uses the weakest part instead because it does not assume independence (code: the `CONJ` note in [`build_pages.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/build_pages.py)). A count of "how many assumptions verified, how many debunked" is still a proposal.

## A comparison: traditional vs. structured debate

The owner's table, with a column added for where the site stands today:

| Feature | Traditional "Wall of Text" | Idea Stock Exchange (Structured) | Status on the published site |
|---|---|---|---|
| **Foundation** | Hidden/Implied | Explicitly Listed & Linked | Built where filled in: 125 component rows on 42 beliefs, each a linked page; 233 assumption rows by side |
| **Navigation** | Linear (Start to Finish) | Non-Linear (Graph-Based) | Built: two flat tables, `pages` and `edges`, and every row is a link to the page it reads (see [[Belief Web Navigation]]) |
| **Focus** | Rhetoric and Persuasion | Necessity and Validity | Validity is argued and scored on every page. Necessity is a typed flag, not argued (see [The ranking algorithm](#c-the-ranking-algorithm)) |
| **Outcome** | Emotional Reaction | Structural Analysis | Built: the structural checks panel on every belief page, and the cap |
| **Efficiency** | Low (Circular Arguments) | High (Direct Foundation Testing) | Built, and enforced: the scorer refuses to publish a circular argument at all |

That last row is stronger than the owner's table claimed. A circular argument is not merely inefficient on the site; it cannot be published. `score_reference.py` raises `CircularSupport` ("A loop can hold any value at all and stay consistent, so the scorer refuses it by name"), and CI runs the cycle check in [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) before it builds anything.

## The "Import" (why this is urgent)

We live in an era of misinformation and deep polarization. Most of this is fueled by the fact that we are arguing about the *conclusions* of beliefs rather than the *assumptions* that lead to them.

The Idea Stock Exchange moves us from "I disagree with your conclusion" to "I disagree with Assumption #42, and here is why that makes your conclusion mathematically impossible." It changes the nature of human disagreement from a fight into an audit.

Here is what "mathematically impossible" looks like when the site actually does it. The cross-implementation contract in [`conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py) carries a belief whose reasons, findings and predictions argue it to **0.559**. One of its components is marked load-bearing: "A load-bearing component the record argues against," a page citing a public record with two replications, neither of which agreed. That premise starts at 0.05 (calculation: `p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1)` with ERP = 0 and the record tier's weight of 0.9, from [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py)). So the belief publishes at **0.05**, not 0.559. Every reason for it is still on the page, still argued, still counted in the 0.559. They just cannot lift a conclusion above a premise it needs. That is the audit the owner described: nobody shouted, and one beam took the house down.

(A small coincidence for the record: 42 is also the number of beliefs on the live site whose anatomy has been filled in.)

### How to explain this to the team

We need to frame this as **Building the Infrastructure for Truth**. We aren't just making another forum; we are making a "Logic Parser" that strips away the noise and leaves only the structural integrity of the idea.

**Status of the "Logic Parser": not built as software.** What strips away the noise today is the page format itself: one claim per page, arguments written as complete atomic propositions (Rule 3 of [`docs/BELIEF_PAGE_RULES.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/BELIEF_PAGE_RULES.md)), and the Logical Anatomy table. There is an LLM framework in [`src/core/ai/`](https://github.com/myklob/ideastockexchange/blob/master/src/core/ai/) for generating analysis pages, but nothing wires its output to a scored page, and a number a model asserts is the one thing the published engine refuses to carry (owner's standing rule, recorded in `CLAUDE.md`).

The PBworks original ended with an offer, from the AI assistant that helped draft it, to write a short "Executive Summary" or a "Manifesto" to send to potential team members. Neither was written. This page is the nearest thing to it, and [[Home]] is the front door.

## The cap: a conclusion cannot outrun its premises

This is the one mechanism in the repository that turns an assumption into arithmetic, so it gets the full treatment.

**What the published site does (code: [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), lines 207 to 209):**

```python
raw = self._share(pos, neg, pid)
lb = [self.truth(e['claim_id'], _seen) for e in self.rows(pid, 'component')
      if is_page(e.get('claim_id')) and str(e.get('attrs', {}).get('lb', '')).upper() == 'Y']
truth = min(raw, min(lb)) if lb else raw
```

In words:

- **Truth, argued** = `(POS + w x p0) / (POS + NEG + w)`, where POS and NEG are the positive and negative row contributions, and `p0` and `w` are where the page starts and how heavily (from [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py); a page that cites nothing starts at `p0 = 0.5` with `w = k = 1`).
- **Truth, published** = `min(Truth argued, the smallest truth among load-bearing components that have a page of their own)`. This is the number every parent page reads. (Explained on the [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts), under "And then the conclusion cannot outrun its premises.")

Three details decide how it behaves, and each one is pinned by a page in the conformance contract so that a port to another language cannot get it wrong:

| Case | What happens | Contract page | Expected numbers |
|---|---|---|---|
| A load-bearing premise is weaker than the argument | The premise caps the belief | Page 1, capped by page 6 | argued 0.559, published 0.05 |
| A load-bearing premise is *stronger* than the argument | Nothing. It is a minimum, not a replacement | Page 23 | premise 0.95, argued 0.4405, published 0.4405 |
| A load-bearing premise is stated in words but has no page yet | Caps nothing. A missing page is not truth 0 | Page 24 | published 0.50 |

(code: [`conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py), rule 6, and [`conformance/expected.json`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance/expected.json).) The contract says why page 23 exists: "A port that treats the cap as a replacement rather than a minimum reads 0.95." And page 24: "A port that reads a missing claim as truth 0 caps this page at 0."

**Why a minimum and not a product.** If a belief needs A and B and C, and they are independent, the chance all three hold is their product. The site computes that product and prints it, then deliberately does not use it, because the parts of a real argument are rarely independent and a product of correlated parts overstates the damage. The minimum is the one bound that holds whatever the correlation: a conjunction cannot be more probable than its least probable part (owner's judgment, as written in the `TRUTH` and `CONJ` notes of [`build_pages.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/build_pages.py)).

**What the Next.js app does: nothing.** `ComponentClaim.survivesWithout` exists ("If this part is false, does the belief survive? false = load-bearing"), the belief page shows it as "No = load-bearing", and no function in `src/core/scoring/` reads it. The app's belief scores are the same whether a belief has ten load-bearing parts or none.

### Worked example: a hot dog is a sandwich

The live belief [A hot dog is a sandwich](https://myklob.github.io/ideastockexchange/beliefs/p/hot-dog-sandwich.html) has three components, all implied, all marked load-bearing:

| Component claim | Type | Stated? | Load-bearing | What it silently assumes |
|---|---|---|---|---|
| A hot dog is a filling (the sausage) set inside a split roll, which is the form the standard dictionary definition of a sandwich describes. | Empirical | No | Yes | A hinged bun cut along one side counts as a split roll with bread on both sides of the filling. |
| Whether a food is a sandwich is settled by its structure rather than by what people customarily call it. | Normative | No | Yes | Consistency of a definition matters more than matching everyday speech when the two conflict. |
| Belonging to its own named food category does not stop a hot dog from also belonging to the sandwich category. | Normative | No | Yes | Food categories can nest, the way a cheesesteak is both a cheesesteak and a sandwich. |

Its reasons argue it to **0.531**. Each of the three components has a page, and nobody has argued any of them yet, so each sits at 0.50. The weakest is 0.50, so the belief publishes at **0.50**. The product of the three is 0.125, printed and read by nothing (calculation: the scorer run over `content/`, October 2026 build). In plain words: the hot dog people have made a slightly better case than the anti-hot-dog people, and none of it counts yet, because the whole fight secretly turns on whether structure beats usage, and nobody has argued that.

That is exactly the owner's "arguing about conclusions rather than assumptions," caught in the act by the arithmetic.

### Worked example: the stock-trading ban

[Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html) states its logical form outright: "(Officials' holdings currently influence official decisions) AND (removing the holdings removes the influence rather than relocating it) AND (a ban can be enacted and enforced). The normative component, that reducing conflicts is worth a narrower candidate pool, is separable."

| Component claim | Type | Stated? | Load-bearing | What it silently assumes |
|---|---|---|---|---|
| Officials' financial holdings currently influence how they vote and what they say. | Empirical | No | Yes | The observed overlap between holdings and committee jurisdiction reflects influence rather than coincidence |
| Removing the holding removes the influence rather than relocating it to a spouse, a partnership or a post-office job. | Causal | Yes | Yes | Substitution into uncovered vehicles is partial rather than complete |
| A holdings ban can be enacted and enforced against sitting members. | Empirical | No | Yes | A Congress will bind itself and a future Congress will not quietly unwind it |
| Reducing conflicts is worth a narrower candidate pool and a real compliance burden. | Normative | No | No | Trust in the institution outranks the convenience of the people in it |

Note the fourth row. The author judged that the belief survives that part being false (the ban could reduce private gain even if it is not worth the cost), so it is not load-bearing and caps nothing. That is the owner's Necessity test, applied by hand.

The belief cites findings and argues to **0.607**. Its three load-bearing premises cite nothing and sit at 0.50. It publishes at **0.50**. The structural checks panel flags this as "Evidence filed above the premise it bears on": the findings are real, but they are filed on the conclusion when they are findings about a premise, and evidence placed on a conclusion cannot lift a cap set beneath it (code: [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py)). Moving a finding down to the premise it supports changes what the argument says, so it is an editorial act and open decision 2 in `CLAUDE.md`, not a refactor.

**Across the whole site:** 21 of the 42 beliefs with an anatomy argue higher than they read, and all 21 read exactly 0.50, each held by an unargued load-bearing premise (calculation: the scorer over `content/`, October 2026 build; the method page counts this afresh on every build, because "a sentence that names a number goes stale the day a row is added"). The other 21 argue at or below 0.50, where the cap does not bind.

## What the site stores, table by table

### The Logical Anatomy table (every belief page)

Columns: Component claim, Type (Empirical, Causal, Definitional, Normative), Stated?, Load bearing (typed), Truth, What it silently assumes. A load-bearing row is highlighted. Under the table: the weakest load-bearing component, the argued truth, the truth score, and the product of load-bearing truths. The section links to the method page and says, every time, "Which components are load-bearing is typed by the author, not argued; the wiki's Necessity Score is not computed" (code: [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)). The template's version of the column reads "[Yes, if the belief does not survive this part being false]" (see [[Template: Belief Analysis]] and [`templates/belief-analysis-template.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/belief-analysis-template.html)).

In the data, a component is an edge with `section = component` and its extras in one cell: `type: Causal | stated: Y | lb: Y | assumes: ...` ([`ise_tables.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/ise_tables.py), `EXTRA['component'] = ['type', 'stated', 'lb', 'assumes']`).

### Assumptions by side (every belief page)

Two columns, "Required to accept the belief" and "Required to reject the belief", each row a claim with its own page and the vote counts beside it. There are 233 of these rows on the live site. **Status: shown, scored on their own pages, read by no formula on the belief.** The scorer reads `argument`, `evidence`, `prediction` and `component` rows when it scores a belief, and never `assumption` rows (code: `Model.evaluate` in [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)). So you can argue an assumption down on its own page, and the belief that lists it does not move unless the same claim is also a load-bearing component. That gap is open question 90 in [`docs/WIKI_AUDIT.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/WIKI_AUDIT.md), listed below.

### Hidden assumptions on the specialized pages

Linkage, importance, interest, uniqueness, equivalence, driver and media pages each carry a two-sided "Hidden assumptions required" table, labelled for what that page decides (code: [`build_subpages.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/build_subpages.py)):

| Page kind | Left column | Right column |
|---|---|---|
| Linkage | Required for the linkage to hold | Required for the linkage to fail |
| Importance | Required for this row to speak to the interests listed | Required for it to miss them |
| Interest | Required for this need to be real and legitimate | Required for it to be invalid |
| Uniqueness | Required for X to be distinct from Z | Required for X to be a restatement of Z |
| Equivalence | Required for the two claims to be the same | Required for them to differ |
| Driver | Required for X to drive the position | Required for X to be decorative |
| Media | Required for the quality and impact scores to hold | Required for them to fail |

Each row is "a claim with its own page, scored like any other," and like the belief page's assumptions it is read by no formula on the page it sits on. The linkage page is where hidden assumptions matter most: its "Missing step" pattern reads "X only reaches Y if [hidden assumption] is also true," and the linkage score is defined as "yes, but only if the assumptions named on this page hold" (see [[Linkage Scores]] and [[Template: Linkage Evaluation]]).

### The assumption stack (every topic page with an axis)

Topic pages carry an "Assumption Stack Behind Each Position" table. In the template's words: "Not a fourth axis. Continuum 3 sorts beliefs by altitude; this takes each stance and lists the assumptions a person must accept to hold it, which is how a fight at the bottom gets traced to its real root higher up." Three bands, four rungs each, general to specific (code: `STACK_BANDS` in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)):

| To hold position | Rungs |
|---|---|
| -100% to -50% (Strongly Oppose) | 1. Worldview, 2. Political/philosophical, 3. Causal claim, 4. Topic-specific |
| -20% to +20% (Nuanced/Mixed) | 1. Acknowledges complexity, 2. Both sides have valid points, 3. Context matters, 4. Implementation determines outcome |
| +50% to +100% (Strongly Support) | 1. Worldview, 2. Political/philosophical, 3. Causal claim, 4. Topic-specific |

On [Public office and private gain](https://myklob.github.io/ideastockexchange/beliefs/t/public-office-private-gain.html), the support band's stack runs from "Public power is held in trust, and a trustee may not profit from the trust" (worldview) down to "Disclosure alone has not stopped members trading in the industries their committees oversee" (topic-specific). The oppose band runs from "A capable person of ordinary means must be able to serve without a lawyer and without a pay cut" down to "Each new rule deters more candidates than it catches conflicts." Read the two worldview rungs side by side and you can see where the fight really lives; it is not about stock trading at all.

The support band also lists the load-bearing components of every belief filed under the topic, each with its truth score. The stack rows themselves (231 on the live site) are text and score nothing. See [[Template: Topic]].

## Checks that watch assumptions

[`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) reads the shape of the graph and prints a panel of structural faults on each belief page. Two concern assumptions directly:

| Severity | Check | What sets it off |
|---|---|---|
| serious | Assumes its own conclusion | A load-bearing premise rests on the claim, or is argued to be the same claim (equivalence 0.90 or more) |
| worth checking | Evidence filed above the premise it bears on | The page cites findings and argues higher than it reads, because a load-bearing premise beneath it cites nothing |

"Assumes its own conclusion" is begging the question in the strict sense. When the premise literally rests on the claim, that is also a loop, and the scorer refuses to publish it at all. The equivalence form is a flag. Every other check is a panel saying what to go and look at; none moves a score.

## How people add assumptions

Every belief page has forms under the Logical Anatomy section for a component claim ("One part of the claim above, as a claim of its own") and an assumption ("What must be true for a side to be right, as one sentence", filed "to accept the claim" or "to reject the claim"). Topic pages have a form for "an assumption behind a position." Each is a plain GET to a prefilled GitHub issue; [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) checks the wording against every claim already filed, so a duplicate becomes a vote for the existing claim, and [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) re-checks and opens a pull request.

**What a contributor cannot set: the load-bearing flag.** Intake writes "Type, whether it is stated, and whether it is load-bearing are left for the maintainer to mark" on every submitted component. So a reader can propose a premise but cannot make it cap anything. That is open question 92 in the audit.

## 1. System logic and conceptual workflow

The process moves from a broad belief to a structured debate about its foundations:

1. **Belief Submission:** A user posts a belief (e.g., "Universal Basic Income will reduce crime").
2. **Taxonomy Placement:** The belief is assigned a unique ID and nested within categories (Economics > Social Welfare).
3. **Assumption Identification:** Using standardized templates, users identify **Stated Assumptions** (explicitly mentioned) and **Unstated Assumptions** (logical prerequisites).
4. **The "Necessity" Argument:** This is the core engine. Users argue whether an assumption is *necessary* to accept the belief.
   - If Assumption A is false, does the Belief still hold?
   - If yes, the assumption is "Non-Essential."
   - If no, the assumption is "Load-Bearing."

Status of each step:

| Step | Status | What exists |
|---|---|---|
| 1. Belief Submission | Built | A propose-a-belief form on the home, topic and belief pages opens a prefilled GitHub issue; [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) checks it for duplicates and opens a pull request. Every belief is published, complete or draft, and drafts say what they still need. |
| 2. Taxonomy Placement | Built, with readable keys instead of opaque IDs | Each page has an integer id (`tab`) and a text key such as `hot-dog-sandwich`. Each belief is filed under one topic, and topics nest through a `parent` column in [`content/topics.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/topics.csv) (95 topics). The hot dog sits in Everyday arguments, under Humor. |
| 3. Assumption Identification | Built, by the author | The Stated? column on Logical Anatomy rows (36 stated, 89 implied) and the two assumption tables. "Standardized templates" are [[Template: Belief Analysis]] and [[Template: Topic]]. |
| 4. The Necessity argument | **Typed, not argued** | The If-false question is the load-bearing column, word for word in the app ("If this part is false, does the belief survive?") and in the template. But the answer is a Y or N the author types. Nobody argues it, and no score comes from it. |

Step 4 is the gap that matters. The owner called it "the core engine." Today it is a checkbox with consequences: tick it, and that premise can hold the whole belief at 0.50. The method page's list of rules the wiki states that the site does not run includes "A necessity score argued for each assumption", and gives what runs instead as "A typed load-bearing flag" ([method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun)).

## 2. Technical Requirement Specification (TRS)

**Project Title:** Project Axiom (The Belief Stock Exchange)

**Objective:** To develop a structured database and interface for the decomposition of arguments into categorized, ranked assumptions.

**Status of the name:** "Project Axiom" appears nowhere in the repository. The project is the Idea Stock Exchange.

### A. Database architecture

The system requires a relational database (SQL-based like PostgreSQL) to maintain the integrity of nested relationships.

| Table | Primary Columns | Purpose | What exists |
|---|---|---|---|
| **Categories** | `cat_id`, `name`, `parent_id` | Maintains the hierarchical nesting of topics. | Built as `topic`: `key`, `name`, `parent`, plus `definition`, `scope`, `axis` ([`content/topics.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/topics.csv)) |
| **Beliefs** | `belief_id`, `cat_id`, `statement`, `author_id` | Stores the core propositions with unique IDs. | Built as `page` with `kind = belief`: `id`, `topic`, `text`. No author column on pages; who added a row is stamped into the row (`added_by`, the GitHub login) by intake |
| **Assumptions** | `assump_id`, `belief_id`, `type`, `text` | Stores assumptions linked to beliefs; `type` flag for Stated vs. Unstated. | Built as `edge` rows with `section = component` (with `stated`, `type`, `lb`, `assumes`) or `section = assumption` (with `side`). Each points at its own `page` |
| **Arguments** | `arg_id`, `assump_id`, `stance`, `body` | Stores the "Why this assumption is/isn't necessary" text. | Partly built. Arguments about whether an assumption is **true** exist: they are the argument rows on the assumption's own page. Arguments about whether it is **necessary** do not exist anywhere |
| **Rankings** | `rank_id`, `assump_id`, `user_id`, `score` | Tracks the community consensus on the necessity of the assumption. | Votes exist as `vote` (`key`, `on_page`, `login`, `vote`, `issue`, `date`), one per person per claim, latest wins. **Votes never move a score**, by the owner's rule |

The export is real SQL. [`export_db.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/export_db.py) writes `schema.sql` and `data.sql` (with PostgreSQL-flavoured types such as `JSONB` for the extras), a SQLite file, JSON and XML, all downloadable from the [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#data). There is no running database server: the source of truth is two CSV tables in git, and **no score is ever stored**, every number is computed from `page` and `edge` on each build. The Next.js app does use a relational database (SQLite through Prisma), with `ComponentClaim` (`claim`, `claimType`, `stated`, `survivesWithout`, `unstatedAssumptions`, `score`) and `Assumption` (`side` "accept" or "reject", `statement`, `strength` defaulting to "MODERATE", `score`).

### B. Software and templates

To automate the intake of data, we need "Logic Templates" that force users to think in structured formats rather than free-form prose.

- **Belief Template:** A form requiring a Subject, a Predicate, and a Context (e.g., "X will do Y under condition Z").
- **Assumption Form:** A form that uses "If-Then" logic prompts. "If [Assumption] were proven false, the Belief would [Remain Valid / Become Invalid]."
- **Automated Classifier:** A Natural Language Processing (NLP) module to suggest categories based on keywords in the belief statement.

| Item | Status | What exists |
|---|---|---|
| Belief Template (Subject, Predicate, Context) | Proposed, not built as three fields | The propose-a-belief form takes one sentence. The structure is enforced by rule instead: Rule 3 of [`docs/BELIEF_PAGE_RULES.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/BELIEF_PAGE_RULES.md) requires every argument to be a complete, atomic proposition, and a belief can state its logical form ("[This belief] = [Part 1] AND [Part 2] AND ([Part 3] OR [Part 4])"). |
| Assumption Form (If-Then) | Built as a column, not as a form prompt | The prompt is the load-bearing column on the belief page in both engines. The contribution form does not ask it; the maintainer answers it. The linkage page asks the parallel question for every reason: "If it were true that X, it would necessarily strengthen Y" (see [[Template: Linkage Evaluation]]). |
| Automated Classifier (NLP) | Not built | Topics are filed by a person. What software does instead is catch duplicates: [`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py) scores every pair of claims by IDF-weighted word overlap and character 4-gram cosine, flags pairs at 0.45 and calls 0.70 "probably one page," and [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) runs the same rule as you type. It reads wording, not meaning, and it changes no score. Embedding-based similarity exists in `src/core/ai/` and is wired to nothing. |

### C. The ranking algorithm

The system must calculate a **Necessity Score**. This isn't a "Like" button; it is a weight assigned to an assumption based on its logical impact. If the majority of users (or a weighted group of experts) argue an assumption is "Load-Bearing," that assumption becomes a high-priority target for verification.

**Status: not computed, in either engine.** What runs instead:

- **On the site, necessity is binary and typed.** A component is load-bearing (Y) or not, and that flag alone decides which premise can cap a belief.
- **"A high-priority target for verification" is built, by different means.** The site already finds the premises worth checking, without a vote: the sensitivity sweep holds each input at false and at true, recomputes the whole graph, and reports how far the belief moves (an input that moves it by less than 0.005 is called inert) (code: [`sensitivity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py), which includes component rows among the inputs it tests). ReasonRank counts component rows as edges of the walk, so a premise many beliefs rest on ranks high in "What to argue next." And the belief page names the premise that is holding it down, in words.
- **In the app, Decision Leverage ranks argument edges by the conclusion score still at stake on each.** Careful with the name: it calls an edge "load-bearing" when its weight (`|linkage| x importance x uniqueness x 0.5^depth`) is at least 0.35 (`LOAD_BEARING_WEIGHT` in [`decision-leverage.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts)). That is a measure of how much of the conclusion an argument carries, not the If-false test, and it reads no `ComponentClaim`.
- **In the app, assumptions carry a strength badge** (CRITICAL, STRONG, MODERATE, WEAK) and a `score` column "performance of this assumption's pro/con sub-debate", filled by seed scripts. Nothing in `src/core/scoring/` computes either.

**"If the majority of users argue": partly refused, by the owner's rule on votes.** Under the October 2026 direction, votes may decide what is promoted and given attention, never what is valid. So the second half of the owner's sentence is fine as it stands: a majority calling a premise load-bearing could rightly make it "a high-priority target for verification," because that is attention. What the direction rules out is letting the same vote decide whether the premise caps the belief, because that is validity. A Necessity Score that people *argue*, the way they argue linkage, is consistent with the direction and is proposed (option (b) under open question 90 below).

## 3. Implementation plan for scientists and programmers

### Phase 1: Taxonomy and ID generation

Programmers must establish a UUID (Universally Unique Identifier) system for every belief. Scientists (Logicians/Linguists) must define the top-level categories to ensure the database doesn't become cluttered with overlapping topics.

**Status: replaced.** Pages have small integer ids and readable text keys (`barring-members-congress-president`), not UUIDs; a key is a URL ([`p/hot-dog-sandwich.html`](https://myklob.github.io/ideastockexchange/beliefs/p/hot-dog-sandwich.html)) a person can read. Top-level categories exist ([all topics](https://myklob.github.io/ideastockexchange/beliefs/topics.html)), set by the maintainer. Clutter is fought at the claim level rather than the topic level: the duplicate detector above, uniqueness pages that argue overlap, and equivalence pages that argue two wordings are one claim (see [[The Redundancy Problem]], [[Equivalency Score:]] and [[One Page per Debate Topic]]).

### Phase 2: The logic engine

Scientists will define the "Assumption Framework." This involves creating the criteria for what constitutes a "Stated" vs. "Unstated" assumption. Programmers will then build the frontend forms that enforce these rules during data entry.

**Status: partly built.** The framework exists as columns (Stated?, Type with four values, Load-bearing, What it silently assumes) and as rules in the belief page skill and template. No form enforces the Stated/Unstated criteria at entry; the maintainer marks them when a submitted component is merged.

### Phase 3: The "Argument Exchange"

Develop the interface where users "bet" on or rank the necessity of assumptions. The backend must handle many-to-one relationships, where dozens of different arguments can be attached to a single assumption.

**Status: the backend half is built, the betting half is not.** Many-to-one is native to the page/edge model: an assumption is a page, any number of argument and evidence rows can point at it, and the same page can sit under many beliefs at once (every page lists where else it is used). Betting on necessity is not built, and "ranking" by vote is shown and never scored. The stock-exchange metaphor survives in the name and in the [lists](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes) that rank the gap between how popular a belief is and how well it holds up.

## Mechanisms the owner's page never mentioned

- **The cap itself** and its three conformance cases, above. The owner's page describes the collapse; the code supplies the arithmetic, and the contract makes any port reproduce it.
- **The product of load-bearing truths**, computed and deliberately read by nothing, as the independence-assuming alternative to the minimum.
- **The "Evidence filed above the premise it bears on" check**, which tells an author that their evidence is real but in the wrong place.
- **The circular-support refusal**, which stops a premise that rests on its own conclusion from ever being published.
- **Hidden-assumption tables on seven kinds of specialized page**, not only on beliefs.
- **The assumption stack on topic pages**, three bands by four rungs, tracing a disagreement from worldview down to the specific claim.
- **The sensitivity sweep and the work queue**, which find the premises worth verifying without any vote.
- **The app's `shouldPromptForAssumption`**, which flags a linkage between 0.1 and 0.4 as probably missing a step.
- **A broken link in the app:** the belief page's Logical Anatomy heading links `/Assumptions`, a route that does not exist; the explainer lives at `/algorithms/assumptions` (code: [`AssumptionsSection.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/features/belief-analysis/components/AssumptionsSection.tsx)). That explainer also says that when an assumption's score falls, "the linkage that depended on it weakens, and propagation moves every conclusion downstream." No code in the app does that today.

## The owner's direction, and where today's code differs from it

The owner set the direction on scoring in October 2026: a score should promote good ideas and demote bad ones in the real world, and a rule should be published beside the current one and compared on real pages rather than swapped in unseen. Applied to assumptions:

- **Volume.** The direction says contributions count from the moment they are posted and are argued down from there. The cap does the opposite for premises: an unargued load-bearing premise reads 0.50 and caps at 0.50, which is why all 21 capped beliefs read exactly 0.50 however much has been argued above them. This is open decision 6 in `CLAUDE.md`. The owner's count-every-reason rule ([`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py), printed on every belief page as "Counting every reason until it is argued down", see the [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)) does not apply the cap at all, so the two numbers on a capped page show the difference side by side. Changing the argued rule waits on that comparison.
- **Votes.** Votes may decide what gets attention, never what is valid. A vote-built Necessity Score that caps a belief is therefore refused; a vote that raises a premise's priority for checking is allowed.
- **Fallacies.** Software may flag, nothing is final, and a flag moves no score. "Assumes its own conclusion" follows that rule in its equivalence form (a flag on the page); in its literal form it is a loop the scorer refuses, because a loop has no number to publish.
- **Linkage.** Start trusting, fall when argued down, rise when argued well. Necessity is the same kind of question as linkage ("does the conclusion need this?" against "does this bear on the conclusion?"), so by the owner's judgment applied by analogy, an argued necessity would start from a sensible guess and move both ways. Today it is a typed Y or N that cannot move at all.
- **Evidence.** The direction prefers evidence weight with no ceiling, and `tally.py` uses `ESIW x ERQ x ERP/100` uncapped. The argued rule's starting-point weight is capped at twice k (`w = k x 2 x ERQ / (ERQ + 1)`). For assumptions, the practical point is the stock-ban example: evidence only lifts a capped belief once it is filed on the premise it is about.

## Open decisions for the owner

These come from the wiki audit ([`docs/WIKI_AUDIT.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/WIKI_AUDIT.md)) and `CLAUDE.md`. They are the owner's to answer, not a session's.

1. **Should assumptions carry a score (the Necessity Score) or stay a typed load-bearing flag plus unscored lists?** (audit question 90) Options: (a) keep the typed flag and say so on the page (the current state); (b) add a necessity page per component, argued like a linkage page, whose truth decides whether and how far the component caps; (c) score the assumption lists as ordinary claims so "challenge an assumption" has a scored target on the belief.
2. **Can readers mark load-bearing premises through the forms, or is that author-only?** (audit question 92) Options: (a) author-only, and the page says a submitted component is marked by the maintainer before it can cap; (b) add `lb` to the contribution form and intake; (c) make it argued, which is option (b) of the first question.
3. **Should an unargued load-bearing premise cap at 0.50?** (`CLAUDE.md` open decision 6) It is conservative and correct as probability, and it is what holds every capped belief at 0.50. The owner's direction on volume points toward counting contributions from the start; changing it is a rule change with a conformance diff, and waits on comparing `tally.py` against the argued rule on real pages.
4. **Should the 233 "Required to accept / Required to reject" rows move anything?** Today they are read by no formula on the belief that lists them.
5. **Should the app adopt the cap?** The app stores `survivesWithout` and ignores it, so the same belief scores differently in the two engines whenever a premise is weak. This is one face of `CLAUDE.md` open decision 1, which engine leads.

## Related pages

- [[Truth Score]] and [[Quantifying Reason: The Power of Truth Scores]]: the number the cap limits.
- [[Linkage Scores]] and [[Evidence to Conclusion Relevance Score]]: the sister question to necessity, and where hidden assumptions on a reason live.
- [[Argument Scores from Sub-Argument Scores]]: how a premise's score climbs to the belief.
- [[Evidence Verification Score (EVS)]]: the evidence tiers that set where a premise starts.
- [[ReasonRank]] and [[Confidence Stability Scores]]: the work queue that finds premises worth checking.
- [[The Redundancy Problem]] and [[Equivalency Score:]]: the duplicate detector and why it scores nothing.
- [[Belief Web Navigation]] and [[One Page per Debate Topic]]: the graph the structure lives in.
- [[Likely Interests of Those Who Agree and Disagree]] and [[Automated Conflict Resolution Platform]]: what sits under a position besides assumptions.
- Templates: [[Template: Belief Analysis]] (Logical Anatomy and Assumptions by Side), [[Template: Topic]] (the assumption stack), [[Template: Linkage Evaluation]] (hidden assumptions on a reason), and the full list at [[Templates]].
- On the live site: [where a page starts and the cap](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts), [what would change the answer](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity), [ReasonRank](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank), [the structural checks](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks), [the owner's counting rule](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally), [rules the site does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun) and [what this cannot do](https://myklob.github.io/ideastockexchange/beliefs/method.html#limits).
