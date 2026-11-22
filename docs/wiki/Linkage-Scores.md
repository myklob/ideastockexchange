# Linkage Scores

*[[Home]] > Page Design > **Linkage Scores***

**Linkage Scores: Measuring Logical Relevance**

A fact can be perfectly true and still have nothing to do with the argument it was dragged into. The Linkage Score is the number that says so. This page is the owner's explanation of the idea, kept whole, with each of its claims checked against the code that runs today. Where the code does something different, or something the owner's page never mentions, the page says so in the place it comes up, with the real formula, the real constants and a link to the file.

**Two engines, so two answers.** The repository has two scoring implementations, and they disagree about linkage in ways that matter.

- **The published site** is [`tools/static-site/`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md). It builds [myklob.github.io/ideastockexchange/beliefs/](https://myklob.github.io/ideastockexchange/beliefs/index.html) from two flat tables, `pages` and `edges`. When this page says "the site", it means this one.
- **The Next.js app** is [`src/core/scoring/`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts), with its database in [`prisma/schema.prisma`](https://github.com/myklob/ideastockexchange/blob/master/prisma/schema.prisma). "The app" means this one. Inside the app there is also a demo engine, the "protocol" engine under `/api/protocol`, which runs on an in-memory sample store ([`schlicht-data.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/epistemology/data/schlicht-data.ts)) and not on the belief pages.

Every status label below is one of: **runs on the site**, **runs in the app**, **runs only in the protocol demo**, **proposed, not built**, **replaced** (and by what), or **refused by design** (and why). Every number is labelled with its basis: the code (with its file), a calculation from the code, or the owner's judgment.

The formal, formula-by-formula companion to this page is [[Evidence to Conclusion Relevance Score]], which is the same factor under its older name. The page a linkage gets on the site is described in [[Template: Linkage Evaluation]].

## The problem: true but irrelevant

In traditional debate, people often win arguments by shouting facts that are technically true but completely irrelevant to the conclusion. The **Linkage Score** is the filter that solves this.

**Example:**

| Conclusion | Supporting Argument | Truth Score | Linkage Score |
|---|---|---|---|
| "We should implement a Carbon Tax." | "The sky is blue." | **100%** (Fact) | **0%** (Irrelevant) |
| "We should implement a Carbon Tax." | "Sweden has a Carbon Tax." | **100%** (Fact) | **30%** (Weak Relevance) |
| "We should implement a Carbon Tax." | "Carbon Taxes reduce emissions by 20%." | **85%** (Study) | **90%** (Direct Relevance) |

**The Critical Question:** "If this argument is true, how much does it *actually force* the conclusion to be true?"

Think of a linkage score as the width of the pipe between two ideas. Truth is how much water is in the tank. You can have a full tank (a fact nobody disputes) connected to the conclusion by a pipe the width of a drinking straw, and the conclusion stays bone dry. "The sky is blue" is a full tank with no pipe at all.

**Status of the numbers in that table.** They are the owner's judgment, typed to illustrate the idea. No engine computed them, and on the site no score is ever typed: a linkage score is the truth score of a page where people argue whether X bears on Y. Here is what each engine would do with those three rows if the numbers were real (a calculation from the code, with every unstated factor at its default):

| Supporting argument | Owner's formula, Truth x Linkage x Importance (Importance 1) | Site, argued rule: (2 x Truth - 1) x Conf x Link x Imp x Uniq (Conf 1, Imp 0.5, Uniq 1) | Site, count-every-reason rule (`tally.py`): Truth x Link x Imp x Uniq | App belief page: Truth x Link x Imp x Uniq x 100 (Imp 1.0, Uniq 1) |
|---|---|---|---|---|
| "The sky is blue." | 1.00 x 0 = **0** | (2 x 1 - 1) x 0 x 0.5 = **0** | 1 x 0 x 0.5 = **0** | **0** |
| "Sweden has a Carbon Tax." | 1.00 x 0.30 = **0.30** | 1 x 0.30 x 0.5 = **0.15** | 1 x 0.30 x 0.5 = **0.15** | **30** |
| "Carbon Taxes reduce emissions by 20%." | 0.85 x 0.90 = **0.765** | (2 x 0.85 - 1) x 0.90 x 0.5 = 0.70 x 0.45 = **0.315** | 0.85 x 0.90 x 0.5 = **0.3825** | **76.5** |

Every engine agrees on the first row, which is the whole point: a perfect truth with zero linkage contributes zero. They disagree about how much the 85% study is worth, because the site's argued rule only credits the part of a truth score that sits above the 50-50 line (0.85 becomes 0.70), and because the site starts importance at 0.5 while the app starts it at 1.0. Where those formulas come from is explained under [How we calculate linkage](#how-we-calculate-linkage).

The app's explainer page teaches the same lesson with its own carbon-tax table, also illustrative constants typed into the page (code: the `carbonTaxRows` array in [`src/app/algorithms/linkage-scores/page.tsx`](https://github.com/myklob/ideastockexchange/blob/master/src/app/algorithms/linkage-scores/page.tsx)). Its opening example is "The earth orbits the sun": a verified, 100% true statement, citing NASA, used to argue for a national carbon tax, and completely irrelevant.

| Conclusion: "We need a Carbon Tax" | Truth Score | Linkage Score | Why? |
|---|---|---|---|
| "Carbon taxes reduce emissions in countries that implement them." | 0.85 | +0.90 | Direct Evidence: Shows the policy achieves its stated goal. |
| "Climate change is real and human-caused." | 0.95 | +0.60 | Context: Establishes the problem exists, but doesn't prove this specific solution works. |
| "Many economists support market-based environmental policies." | 0.80 | +0.20 | Weak Support: Appeals to authority without showing the mechanism. |
| "Carbon has atomic number 6." | 1.00 | 0.00 | Irrelevant: Perfectly true, completely unrelated to policy effectiveness. |

The explainer frames the two questions that debate almost always mixes up: *Is this argument true?* (measured by the [[Truth Score]]) and *Does this argument actually connect to the conclusion?* (measured by the Linkage Score).

## The question, as each engine actually asks it

The owner's critical question asks how much the argument "actually forces" the conclusion. The app's explainer words it as "If this argument or evidence were 100% true, would it actually force the linked conclusion to be true?" On the published site nobody writes the question by hand. A linkage page's claim is assembled by formula from the two pages it connects, so nobody can reword X or Y into something easier to defend (code: `Corpus.question` in [`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py), and the matching spreadsheet formula in [`build_subpages.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/build_subpages.py)):

| Type of row | The claim the linkage page argues |
|---|---|
| Argument or Evidence, Direction Supports | If it were true that: X, it would significantly strengthen the conclusion that: Y |
| Argument or Evidence, Direction Weakens | If it were true that: X, it would significantly weaken the conclusion that: Y |
| Prediction | If it were **observed** that: X, it would significantly strengthen (or weaken) the conclusion that: Y |
| Interest (a "bearing" page) | If it were true that: X, it would matter to the interest: Y |
| Media | The work: X supports (or weakens) the conclusion that: Y |

The site says "significantly". The app's linkage page header, [[Template: Linkage Evaluation]] and `docs/ALGORITHMS.md` say "necessarily", and treat the score as the answer by degree: 1.0 means Y must move if X is true, 0 means X can be completely true and Y does not budge, and anything between means yes, but only if the hidden assumptions hold. Which word is canonical is open (see [Open questions](#open-questions-for-the-owner)).

Every linkage page on the site prints a readout under its score (code: the `readout` formula in `build_subpages.py`):

> Linkage score N on 0 to 1 (wiki scale -1 to +1: 2N-1). X passes truth T x Link N = T x N to Y before Y's own Imp and Uniq. 1 = if X is true, Y must move; 0 = X can be true and Y does not budge.

## Why linkage scores matter

### 1. Preventing the "Gish Gallop"

Debaters often overwhelm opponents with a blizzard of weak arguments. Without Linkage Scores, 100 weak arguments might outweigh 1 strong argument. With Linkage Scores, weak arguments (Linkage < 0.2) are mathematically silenced.

The app's explainer makes the same promise in sharper words, under the heading "The Data Dump (Neutralizing the 'Gish Gallop')": "Here are 50 studies about climate change, therefore carbon tax!" The studies might all be true. But if they don't specifically address whether a carbon tax works, their linkage scores are low. "The algorithm mathematically silences volume: 100 weak connections (0.1) are outweighed by a single strong one (0.9)."

**Status: proposed, not built, and the explainer's arithmetic is wrong.** No engine has a 0.2 cutoff, or any cutoff. Linkage is a multiplier, so it shrinks each weak argument; it does not delete it. And a hundred small numbers add up. A calculation under the site's argued rule, with each of the hundred weak reasons argued to truth 0.9 with confidence 1, Link 0.1, Imp 0.5, Uniq 1:

- each weak reason contributes (2 x 0.9 - 1) x 1 x 0.1 x 0.5 x 1 = **0.04**, and a hundred of them contribute **4.0**;
- the one strong reason, same truth and Link 0.9, contributes 0.8 x 0.9 x 0.5 = **0.36**.

Volume wins, eleven to one. The explainer's own numbers say the same thing: 100 x 0.1 = 10, which is more than 0.9, not less. The app's rule is additive too (see below), so it gives the same answer.

So what actually stops a gallop? Three things, none of them the linkage score alone:

1. **On the site, an argument nobody has argued is worth exactly zero.** A row contributes `(2 x Truth - 1)`, and a claim nobody has argued sits at 0.50, so a hundred unargued studies contribute 100 x 0 = 0, whatever their linkage (code: `_contrib` in [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py), pinned by `test_argument_alone_can_never_leave_the_neutral_point` in [`test_engines.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py)). The galloper has to win the argument on each of the hundred pages before any of them counts. That is the real defence, and it is brutal.
2. **Uniqueness.** Fifty studies "about climate change" are rarely fifty independent reasons for a carbon tax. They are one point ("the problem is real") made fifty ways. Each row has a uniqueness factor, read from a uniqueness page where someone argues the overlap; argued down to 0.02, fifty restatements weigh what one does (see [[The Redundancy Problem]] and [[Equivalency Score:]]). In the app, uniqueness is computed from text similarity to earlier same-side siblings and multiplied straight into the impact score (code: [`propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts)).
3. **Linkage, but as a discount, not a silencer.** Each weak reason weighs a tenth of what it would if it bore directly on the conclusion.

**The owner's direction (October 2026)** points away from silencing anything. For belief strength, the rule is to count the truly independent reasons to agree and disagree, rank how valid they are against each other, and let the weight of pro against con decide; contributions count from the moment they are posted and are argued down from there. A hundred genuinely independent weak reasons *should* add up to something. A hundred restatements of one reason should not. The site now publishes that starting rule beside the argued truth score on every belief page ("Counting every reason until it is argued down"; code: [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py); [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#tally)). Under it, a reason weighs `Truth x Linkage x Importance x Uniqueness` with no `(2 x Truth - 1)`, so the hundred weak, unargued studies weigh 100 x (0.5 x 0.1 x 0.5 x 1) = **2.5** against **0.225** for one strong unargued study: volume counts, and only uniqueness can say the hundred are really one. A hard cutoff at 0.2 would contradict that direction, so it stays labelled as proposed, with that conflict named.

### 2. Exposing non sequiturs

A non sequitur is an argument where the conclusion does not follow from the premise. *Argument: "Candidate X is a nice person." → Conclusion: "Candidate X will be a good President."* Linkage Score: **15%**. Being nice is a positive trait, but it has very low predictive power for executive competence.

**Status.** The 15% is the owner's judgment. How each engine catches a non sequitur:

- **On the site** (runs), it is a reason somebody writes. Every linkage page has two starter patterns built for exactly this, on the disagree side: **True but irrelevant** ("X can be true and Y does not budge") and **Missing step** ("X reaches Y only if a hidden assumption holds") (code: `patterns` and `pattern_note` in `build_subpages.py`). The reason is a claim with its own page, and it lowers the linkage only as far as it is argued to be true. Software raises no flag.
- **In the protocol demo** (runs only there), `detectNonSequitur` flags an argument as a **Non Sequitur** when its classification is `NON_SEQUITUR` or `|linkage| < 0.05`, and as **True but Irrelevant** when `|linkage| < 0.1` and its truth score is above 0.8, with the message "True but Irrelevant: This argument is factually accurate but has near-zero logical connection to the conclusion." (code: [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts); called by [`/api/protocol/[id]/linkage`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/protocol/%5Bid%5D/linkage/route.ts) and the epistemology `ArgumentCard`, not by any belief page). The owner's nice-candidate example at 15% would not trip either flag: 0.15 is above both thresholds. It would be classed `ANECDOTAL`.

### 3. Revealing hidden assumptions

A low Linkage Score often indicates a missing [[Assumption|Assumptions]]. *Argument: "We have global warming." → Conclusion: "We need a Carbon Tax."* (Linkage: 40%) What is missing? The assumption that *"Carbon Taxes are the most effective way to stop global warming."* When you add that assumption, the linkage strengthens.

This is the most useful thing a linkage score does, and the least obvious. A low linkage is a smoke alarm. It does not tell you where the fire is, but it tells you there is an unstated step between X and Y that somebody is quietly relying on. Name the step, give it a page, and now people can argue about the thing that was actually in dispute all along.

**Status.**

- **On the site** (runs), there are three places for the missing step. The linkage page has a **Hidden Assumptions** table, split into "Required for the linkage to hold" and "Required for the linkage to fail" (code: `assume` in `build_subpages.py`). The assumption can be written as a reason to agree on the linkage page (pattern **Mechanism**: "X leads to Y through a named pathway with few steps"). Or it can be filed on the belief page as a load-bearing component, in which case the belief's published truth cannot exceed the assumption's: `Truth, published = min(Truth argued, the smallest truth among load-bearing components that have a page of their own)` (code: `evaluate` in `score_reference.py`; [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts)). "When you add that assumption, the linkage strengthens" is true on the site only once the assumption is argued: an assumption written down and argued by nobody sits at 0.50 and adds exactly nothing (calculation from `_contrib`).
- **In the protocol demo** (runs only there), `shouldPromptForAssumption` fires when `|linkage|` is above 0.1 and at most 0.4, "suggesting that an intermediate belief could repair the chain" (code: `scoring-engine.ts`). The owner's 40% example sits exactly on the top edge of that band and would fire. The app's explainer says the prompt fires in "the moderate range (40 to 60%)", which does not match the function; the code is what runs, and the explainer is the thing to fix.

## How we calculate linkage

The Linkage Score is a multiplier between **-1.0** (Contradicts) and **+1.0** (Proves).

- **1.0 (Proof):** If the premise is true, the conclusion *must* be true. (Mathematical logic).
- **0.7 - 0.9 (Strong Support):** The argument provides direct, causal evidence for the conclusion.
- **0.4 - 0.6 (Context):** The argument provides helpful context but is not decisive.
- **0.1 - 0.3 (Weak):** Tangential or anecdotal connection.
- **0.0 (Irrelevant):** True facts that have no bearing on the topic.
- **-1.0 (Refutation):** If the premise is true, the conclusion *cannot* be true.

**Status of the scale.** The owner's bands survive in the app almost word for word; the site uses a different scale and gets to refutation another way. Side by side (code: `calculateLinkageFromDiagnostic` and `classifyLinkageScore` in `scoring-engine.ts`; the check table in `build_subpages.py` and `render_site.py`):

| Owner's band | App diagnostic wizard gives | App classifies a score as | On the site |
|---|---|---|---|
| 1.0 Proof | `proof` = 1.0, `DEDUCTIVE_PROOF` | `DEDUCTIVE_PROOF` when \|score\| is 0.95 or more | A linkage page approaches 1 as argued weight for it piles up, and never quite reaches it (the starting vote, below) |
| 0.7 - 0.9 Strong Support | `strong` = 0.8, `STRONG_CAUSAL` | `STRONG_CAUSAL` from 0.65 to below 0.95 | 0.7 and up is "Not flagged" in the linkage page's check table |
| 0.4 - 0.6 Context | `context` = 0.5, `CONTEXTUAL` | `CONTEXTUAL` from 0.35 to below 0.65 | Below 0.7 is flagged: "the action is to find better evidence for Y, not to reach with X." 0.50 is also where an unargued linkage page sits |
| 0.1 - 0.3 Weak | `weak` = 0.2, `ANECDOTAL` | `ANECDOTAL` from 0.05 to below 0.35 | Flagged; and below 0.5 the row counts toward "linkage leaning against relevance" (below) |
| 0.0 Irrelevant | "Blue Sky" filter answered no: 0.0, `NON_SEQUITUR` | `IRRELEVANT` when \|score\| is below 0.05 | Approaches 0 as argued weight against it piles up |
| -1.0 Refutation | Any of the above with direction `oppose`: the score is negated, so -0.2 to -1.0 | `CONTRADICTION` at -0.5 or below | **No negative linkage.** Refutation is handled by which side a row sits on and by the claim's own truth (below) |

**The site keeps linkage between 0 and 1, on purpose.** A site linkage score is a probability-like truth score: how much of X's truth reaches Y. Direction lives elsewhere. A row filed as a reason to disagree carries `sign = -1`, and a claim argued false enters as `(2 x Truth - 1)`, which is negative, so "a claim argued false counts against the side it was filed on: ten refuted reasons to agree weaken the belief instead of padding it" (code: the `_contrib` docstring in `score_reference.py`). The owner's -1 to +1 scale is still printed on every linkage page as the "wiki scale", `2 x Link - 1`. In the app's belief-page path the stored linkage is also 0 to 1, and the impact formula takes its absolute value "so the side alone controls direction" (code: `computeArgumentImpactScore` in `scoring-engine.ts`). Only the protocol demo carries a signed linkage all the way through.

### The real formulas

**On the site (runs).** A row's linkage is the truth score of its linkage page, or the labelled constant `DEFLINK = 1` when the row has no linkage page (code: `CONSTS = {'K': 1, 'UNARG': 0.5, 'DEFLINK': 1, 'DEFIMP': 0.5, 'DEFUNIQ': 1}` in `score_reference.py`). A linkage page is argued like any other claim, so its truth is the argued-truth rule:

```
Link = (POS + w x p0) / (POS + NEG + w)
```

where POS and NEG are the weights of the reasons for and against "X bears on Y", each reason weighing `sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq` with every factor read from its own page, and `p0 = 0.5`, `w = k = 1` for a linkage page that cites nothing (code: `Model._share` and `evidence.prior`; [method page, the formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula)). Yes, the reasons on a linkage page have linkage pages of their own. It is turtles, but each turtle is a page you can click on and argue with.

That `w x p0` term is one neutral vote at 0.50 mixed into every page. It is why the site's linkage never reaches exactly 0 or 1, and why one unanswered reason moves a page part of the way, not to certainty.

**In the app (runs on the belief pages).** When a linkage reason is added, changed or removed, `propagateFromLinkageChange` recomputes the argument's linkage from its published linkage reasons, saves it, and recomputes every ancestor's impact (code: `propagate-belief-scores.ts`). The formula is `calculateLinkageFromArguments`:

```
Link = A / (A + D)     clamped to [0, 1]; 0.5 when there are no reasons
```

where A and D are the sums of the typed `strength` of the agree and disagree reasons (default strength 0.5). The schema calls that strength "the legacy manual weight feeding the (A - D)/(A + D) aggregate until every row carries a computed score" (code: model `LinkageArgument` in `schema.prisma`). Draft reasons, such as detector output, are stored and shown but never counted.

**In the protocol demo (runs only there).** `resolveLinkageScore` takes the first of three sources that exists (code: `scoring-engine.ts`):

1. A full linkage debate, scored by `scoreLinkageDebate` as `(A - D) / (A + D)`, clamped to [-1, 1], 0.0 with no arguments, where A and D are the recursive raw impacts of the sub-arguments. This is the formula the app's explainer presents as the canonical one.
2. Community votes, by `aggregateLinkageVotes`: the weighted average of vote scores, clamped to [-1, 1]. Each vote's score comes from the diagnostic wizard (or an override, "for AI agents") and its weight is whatever the caller sends, from 0 to 10, default 1.0 (code: the request schema in [`/api/protocol/[id]/linkage/route.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/protocol/%5Bid%5D/linkage/route.ts)).
3. The static `linkageScore` field.

**The same debate, three answers.** The explainer's worked example: supporting arguments total A = 3, opposing arguments total D = 1. A calculation from each rule:

| Rule | Where it runs | Result |
|---|---|---|
| `(A - D) / (A + D)` = 2 / 4 | Protocol demo; the explainer | **0.50** on -1 to +1 ("the argument passes 50% of its potential weight up to the conclusion") |
| `A / (A + D)` = 3 / 4 | App belief pages | **0.75** on 0 to 1 |
| `(POS + 1 x 0.5) / (POS + NEG + 1)` = 3.5 / 5 | Published site (taking POS = 3, NEG = 1) | **0.70** on 0 to 1 |

The first two are the same information on two scales (0.75 on 0 to 1 is 0.50 on -1 to +1). The third is the second pulled slightly toward 0.50 by the starting vote; the more is argued, the less that vote matters. The explainer adds that if support and opposition are equal the signed score is 0.0, and "the argument contributes nothing until the community resolves the debate". On the app's belief pages a tie reads 0.5 and passes half its weight; on the site a tie reads 0.50 too.

### The formula integration

In the [[ReasonRank Algorithm|ReasonRank]], the total weight of an argument is:

> **Net Weight = [[Truth Score]] x Linkage Score x [Importance](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula)**

This means a "Perfect Truth" (100%) with "Zero Linkage" (0%) contributes **Zero** to the discussion. This automatically filters out noise.

The app's explainer gives the same three-way product as its "Master Formula", `Argument Impact = Truth Score x Linkage Score x Importance Score`, and spells out the filter it creates:

- True but irrelevant arguments are zeroed out (high truth, zero linkage).
- Relevant but false arguments are zeroed out (zero truth, high linkage).
- True and relevant but trivial arguments are minimized (high truth, high linkage, low importance).

**Status: the principle runs everywhere; the exact three-factor product runs nowhere.** Every engine multiplies linkage into an argument's weight, so zero linkage means zero contribution in all of them (calculation: anything times 0). But every engine adds factors the owner's formula does not have:

| Engine | What an argument contributes | Code |
|---|---|---|
| Owner's page | Truth x Linkage x Importance | |
| Site, argued truth score | sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq | `_contrib` in [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py) |
| Site, count-every-reason rule, printed beside it | Truth x Linkage x Importance x Uniqueness; a finding x (1 + ESIW x ERQ x ERP/100), uncapped | `weight` in [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) |
| App belief pages | sign x Truth x \|Linkage\| x Importance x Uniqueness x 100 | `computeArgumentImpactScore` in [`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts) |
| Protocol demo | ReasonRank x Linkage x Importance x Uniqueness, where ReasonRank = 0.15 x own truth + 0.85 x the sub-arguments' net (`DAMPING_FACTOR = 0.85`) | `scoreArgument` in `scoring-engine.ts` |

The second "zeroed out" bullet needs one correction for the site: a relevant but **false** argument is not zeroed there, it is turned around. A reason to agree argued to truth 0.1 contributes `(2 x 0.1 - 1) = -0.8` times its other factors, so it counts *against* the belief (calculation from `_contrib`). Only an argument nobody has argued, at 0.50, is zeroed. The count-every-reason rule zeroes neither: a false argument weighs nearly nothing (Truth near 0), and an unargued one weighs half.

The **Uniqueness** factor that every engine added is the defence against one point being made five ways; see [[The Redundancy Problem]]. **Confidence** gates how much of a page's truth passes upward according to how much work stands behind it; see [[Confidence Stability Scores]]. **Importance** on the site is its own argued page, "the most valid interest this row really speaks to", reading 0.5 until argued; see [[Likely Interests of Those Who Agree and Disagree]].

### Depth attenuation (the app's display, not a score)

The app's explainer adds a rule the owner's page does not have: "Arguments form networks, but linkage weakens with distance." Each level deeper an argument goes, its contribution to the top-level belief is multiplied by 0.5 raised to the power of its depth: Level 0 (direct argument) full weight, 0.5⁰ = 1.0; Level 1 (argument supporting the argument) half weight, 0.5¹ = 0.5; Level 2 (supporting the support) quarter weight, 0.5² = 0.25. The stated purpose: keep the conversation on direct, highly relevant evidence "rather than rewarding whoever can construct the longest theoretical chain".

**Status: runs in the app as a displayed number only.** `applyDepthAttenuation(score, depth) = score x 0.5^depth` is computed by the linkage page and API "for display purposes" (code: [`/api/arguments/[id]/linkage/route.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/arguments/%5Bid%5D/linkage/route.ts)), and `Argument.depth` stores the level. It does not enter the impact score that propagation writes. The app's at-stake ranking of edges uses the same 0.5 per level in its transmission weight, `|linkage| x importance x uniqueness x 0.5^depth` (code: [the at-stake ranking](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts)). **The site has none** and needs none for the purpose given: every level of a chain has to be argued to pass anything, and a chain of unargued pages reads 0.50 at every level, so it carries nothing. Long theoretical chains are taxed by the work they demand, not by a fixed discount.

### Proportional belief updating

The explainer's example of why linkage matters at scale: a landmark new study raises "CO₂ traps heat" by 10 points. "Climate change is real" (linked at 90%) automatically gains 9 points; "We should ban gas cars" (linked at 40%) automatically gains 4 points. "When a foundational premise changes, every downstream conclusion updates in proportion to how much it relies on that premise."

**Status: runs in both engines; the 9 and 4 are illustrative.** On the site every score is a pure function of the two tables, recomputed on every build, so one edit to a linkage page moves every conclusion that reads it, and [`changes.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/changes.py) prints what moved since the last revision. In the app `propagateFromLinkageChange` walks every ancestor. The real arithmetic is not `Truth x Link`: on the site a 10-point rise in a premise from 0.60 to 0.70 raises `(2 x Truth - 1)` from 0.2 to 0.4, and what reaches the conclusion is then multiplied by Confidence, Imp and Uniq and divided into a share (calculation from `score_reference.py`).

## Where a linkage starts before anyone argues it

This is the question the owner's page does not ask and every engine has to answer: what is the linkage of a reason nobody has challenged?

**The owner's direction (October 2026):** start trusting, the static site's 1, and lower it as people show a reason is unrelated or invalid, so contributors stay engaged; a link that is argued well must be able to rise. Any sensible starting guess (the contributor's record, topic relatedness, an AI estimate, or 0.5 where tokens are short) is acceptable.

What each engine does today (code as cited):

| Engine and situation | An unargued linkage reads | Fits the direction? |
|---|---|---|
| Site, row with no linkage page | **1** (`DEFLINK`). Printed in grey as "No linkage page yet: presumed relevant, reads 1"; the method page: "A reason placed under a conclusion is presumed relevant and the burden is on the challenger." | Yes. This is the rule the direction names. |
| Site, linkage page opened but nothing argued on it | **0.50**, the neutral start of every page | **No, in letter.** Opening a linkage page and arguing nothing halves the row's linkage, from 1 to 0.50. |
| App, `calculateLinkageFromArguments` with no reasons | **0.5**, "maximum uncertainty; no information either way" | Yes, as a permitted starting guess |
| App, a new argument posted from a belief page or by an agent | **0.1**, the schema default `linkageScore Float @default(0.1)`; score fields in the request are refused ("The engine computes scores.") | **No.** It starts a new reason at a tenth of its weight until somebody argues its linkage. |
| App, a new evidence row | **0.5** (`Evidence.linkageScore @default(0.5)`) | Yes |
| Protocol demo, `scoreLinkageDebate` with no arguments | **0.0**, "No arguments = no contribution (neutral, not assumed relevant)" | No. Demo only. |

(Code: `score_reference.py`, `render_site.py`, [`method.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/method.py); `scoring-engine.ts`; `schema.prisma`; [`/api/beliefs/[id]/arguments/route.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/beliefs/%5Bid%5D/arguments/route.ts) and [`ingest.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/agent-ingest/ingest.ts), both of which create the argument without a linkage and leave the schema default in place.)

**How much this matters today** (a calculation run against the site's content tables on 2026-10-17, [`content/pages.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/pages.csv) and [`content/edges.csv`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/content/edges.csv)): there are 34 linkage pages (15 for arguments, 8 for evidence, 6 for predictions, 3 for media, 2 bearing pages for interests). Of 2,060 argument, evidence and prediction rows on belief pages, 29 have a linkage page; the other 2,031 read `DEFLINK = 1`. Every one of the 34 linkage pages reads exactly 0.50, because each of their reasons is a sentence typed into the table with no claim page of its own, and a reason with no page contributes 0. So on the 29 rows that have one, linkage is 0.50; on every other row it is 1. On the argued truth score this changes nothing yet, because the claims on those rows are themselves unargued and contribute 0 at any linkage. On the count-every-reason rule it halves those 29 rows. The site's README records that a mutation sweep could change `DEFLINK` without failing a test, "because almost no row has a linkage, importance or uniqueness page yet": the constant is what most rows actually read. Each belief page counts its rows still resting on the presumption ("no linkage page"), so the presumption is visible rather than silent.

## Community evaluation

How do we determine the score? Users are asked specific diagnostic questions:

1. **Necessity:** "If this argument were proven false, would the conclusion suffer?"
2. **Sufficiency:** "Does this argument alone justify the conclusion?"
3. **Directness:** "How many logical steps are required to connect A to B?"

**Status, question by question.**

| Owner's question | On the site | In the app |
|---|---|---|
| Necessity | **Runs as a pattern.** "Necessity: no realistic way for X to be true without Y moving" is a starter pattern for reasons to agree on every linkage page. The separately argued Necessity Score the wiki describes for assumptions is **not computed**; a typed load-bearing flag decides which premise can cap a belief ([method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun)). | The explainer asks it ("If this argument were proven false, would the conclusion suffer significantly?"). The wizard does not. `generateLinkageSubClaim` can phrase a debate as `"X" is a necessary condition for "Y"`, and nothing calls it. |
| Sufficiency | **Not a pattern.** The closest site wording is the readout's "1 = if X is true, Y must move". | The explainer asks it. The wizard's `proof` answer (1.0, `DEDUCTIVE_PROOF`) is the sufficient case. `generateLinkageSubClaim` has `is sufficient to prove`, also called by nothing. |
| Directness | **Runs as a pattern and a check.** "Mechanism: X leads to Y through a named pathway with few steps" is a starter pattern, and step 3 of every linkage page's check table asks for "How X bears on Y, in one sentence" (the `bridge` column). If the sentence cannot be written cleanly, X probably does not bear on Y. | Depth attenuation (above), display only. |

The app's protocol demo asks a different three: **Direction** (support or oppose), the **"Blue Sky" filter** ("if 100% true, does it force a change of mind?"; a no gives 0.0 and `NON_SEQUITUR`), and **Strength** (proof 1.0, strong 0.8, context 0.5, weak 0.2) (code: `LinkageDiagnostic` in [`schlicht.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/types/schlicht.ts); `calculateLinkageFromDiagnostic`). The code comment gives the reason for asking questions rather than offering a slider: it "prevents 'Gish Galloping' by requiring justification for relevance." The explainer lists four, Direction, Relevance, Necessity and Sufficiency, and adds two automated checks: "True but Irrelevant" and the missing-assumption prompt, both covered above.

**What replaced the questionnaire on the site: reasons, not answers.** Nobody on the site answers a question with a number. They write a reason, one complete sentence, on the linkage page, on the agree side ("X bears on Y") or the disagree side ("it does not"), and that reason gets its own page where its truth is argued. The four starter patterns per side are scaffolding, not fixed content (code: `patterns` and `pattern_note` in `build_subpages.py`):

| Reasons to agree that X bears on Y | Reasons to disagree that X bears on Y |
|---|---|
| **Mechanism:** X leads to Y through a named pathway with few steps. | **Missing step:** X reaches Y only if a hidden assumption holds. |
| **Necessity:** no realistic way for X to be true without Y moving. | **True but irrelevant:** X can be true and Y does not budge. |
| **Scope fit:** same people, place and time. | **Scope mismatch:** X is about a different population, scale or time. |
| **Monotonicity:** more X means more Y across the whole range. | **Wrong parent:** X really supports a different claim than Y. |

The app's database stores the same idea as a `pattern` field on each `LinkageArgument` ("Mechanism", "Necessity", "True But Irrelevant", "Parent-mechanism mismatch"), with the note that rows "enter and rank by their own scores, never by pattern order" (code: `schema.prisma`). The app's audit lock is the same rule as the site's: linkage scores are computed from the linkage argument tree, never hand-assigned as final, and a request that tries to set `linkageScore` is refused.

### Votes on relevance: shown, never scored

Every row on a site belief page carries a yes and no under the heading "Does it bear on that page?" (or "Bears on this:"), and the linkage page's own heading takes the same vote with the same counts. The counts print as "N yes, M no; votes, not a score" (code: `relevance_links` and `edge_vote_links` in `render_site.py`). The note on every linkage page: "Votes are shown as what people think, next to what the analysis says, and never move a score." That is the owner's direction on votes: they may decide what is promoted and given attention, never what is valid, and the gap between the two is worth showing because it says where people need more time with the argument.

The app is not consistent with that yet. The belief-page path never reads votes: the `LinkageVote` table exists and the linkage API returns its rows, and nothing scores them. But the protocol demo's `aggregateLinkageVotes` lets a weighted average of votes **set** an argument's linkage whenever no linkage debate exists. The explainer says those votes are "weighted by each voter's established reputation in logical reasoning, not general popularity"; the code takes the weight from the request body, 0 to 10, default 1.0, and computes no reputation at all. Status: **runs only in the protocol demo**, contrary to the owner's direction on votes, and the reputation weighting is **proposed, not built**.

## The linkage page on the site

Build the page only when the connection is contested or load-bearing; a routine linkage stays a presumption on the row. When it exists, a linkage page has (code: `render_special` in `render_site.py`; [[Template: Linkage Evaluation]] and [`templates/linkage-evaluation-template.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/linkage-evaluation-template.html)):

1. **The question as the heading**, built from X and Y, with the score badge and the relevance vote.
2. **The two pages it connects**, X ("Argument X") and Y ("Conclusion Y"), each with its own truth score. The linkage page never argues whether X or Y is true; each has its own page for that.
3. **Linkage Arguments**, reasons to agree and to disagree that X bears on Y, each ranked by its score, with the pattern as a lead-in. Then the totals: "Total agree · total disagree · linkage score".
4. **The check table**, five steps:
   1. Exact wording of Y, read from its page.
   2. Exact wording of X, read from its page.
   3. How X bears on Y, in one sentence.
   4. Computed linkage score, "N from a reason(s) to agree and b to disagree". Never a hand estimate.
   5. Flag if below 0.7 (a working rule of thumb): "Flagged: the action is to find better evidence for Y, not to reach with X." The 0.7 is the owner's judgment; nothing is scored by it.
5. **Hidden assumptions** required for the linkage to hold, and to fail.
6. **Bias risks**: biases that inflate this linkage score, and biases that deflate it.
7. **Definitions**, including: "A relevance fallacy (straw man, whataboutism, ad hominem) is a reason to disagree on this page, scored like any other row. An accusation with no support changes nothing."
8. **Forms under every table**, each a prefilled GitHub issue, because the site has no server.

The app's version of the same page lives at `/arguments/[id]/linkage` and adds Equivalent Rephrasings of X and of Y (with a signed **drift**: the linkage under a rephrasing minus the canonical linkage; if a linkage holds only under one phrasing, it is rhetoric), Failure Mode Worked Examples, and Where Else X and Y Are Used, because one argument can have a 90% linkage to one conclusion and 15% to another, and those are separate edges stored separately (code: models `LinkageRephrasing`, `LinkageFailureExample`, `LinkageFiveStepCheck` in `schema.prisma`).

**A live example.** The belief [Barring members of Congress and the president from owning or trading individual stocks would reduce the use of public office for private gain](https://myklob.github.io/ideastockexchange/beliefs/p/barring-members-congress-president.html) has a reason to agree: "Members regularly trade in the industries their own committees oversee, which puts a private financial stake on both sides of decisions they control." Its [linkage page](https://myklob.github.io/ideastockexchange/beliefs/p/argu-members-regularly-trade-barring-members.html) states the bridge, "The overlap is the conflict the ban targets, so if it exists the ban has something to remove", and argues it three ways (code: `content/edges.csv`):

| Side | Pattern | Reason |
|---|---|---|
| Agree | Mechanism | A holding in an industry a member regulates is the conflict the belief proposes to remove, so the argument is about the belief's own subject matter. |
| Agree | Scope fit | Same people, same decisions, same period. |
| Disagree | Missing step | Owning stock in a regulated industry and being influenced by it are different claims, and only the first is established. |

That disagree row is the owner's hidden-assumption point in the wild: the missing step is "holdings influence decisions", and until somebody gives it a page and argues it, the linkage page reads 0.50.

## Failure modes, worked

The app's explainer names five common linkage failures, each a way low linkage exposes a fallacy (code: [`/algorithms/linkage-scores`](https://github.com/myklob/ideastockexchange/blob/master/src/app/algorithms/linkage-scores/page.tsx)):

1. **The Data Dump (Neutralizing the "Gish Gallop").** "Here are 50 studies about climate change, therefore carbon tax!" Covered above, including why the arithmetic attached to it is wrong.
2. **The Emotional Bypass.** "Polar bears are dying, therefore carbon tax!" True, and affecting. But it does not establish that a carbon tax specifically will save polar bears over other interventions. High emotion, low linkage.
3. **The Credential Drop.** "A Nobel Prize-winning economist supports this, therefore it is right!" Appeals to authority are weak linkage unless the authority's specific reasoning is provided. Without the mechanism, it is name-dropping.
4. **The Correlation Shuffle.** "Countries with carbon taxes have lower emissions." Sounds strong, but is it causal? Perhaps those countries also have stricter regulations or different energy infrastructure. Correlation alone gets medium linkage. Proven causation gets high linkage.
5. **The Category Error (Hidden Assumptions).** "Taxes change behavior, therefore a carbon tax will reduce emissions." General principles need specific application, and moving from general to specific requires unstated [[Assumptions]]. (The explainer's "40 to 60%" prompt band is the one corrected above; the code's band is 0.1 to 0.4.)

The explainer is also the agreed home for fully worked failure examples with real names, so that one contested illustration never ships inside every page built from the template (code: the comment on `LinkageFailureExample` in `schema.prisma`). Its one worked row, quoted as the explainer gives it:

| Failure Mode | X (evidence or argument) | Y (claim it was placed under) | Why the linkage fails |
|---|---|---|---|
| Wrong parent (the Schiltz case) | Chief Judge Schiltz, January 2026: ICE violated 96 court orders in 74 cases. | MAGA broke the norms that constrain the powerful (insider trading, nepotism, financial disclosure). | X is about executive defiance of judicial orders, a separation-of-powers argument. Y is about wealthy people evading rules. Different mechanism, different parent. Correct parent for X is "MAGA defies judicial constraint," not Y. |

The lesson the explainer draws: the evidence is real, well documented and damning, and the linkage still fails, because the mechanism it demonstrates is not the mechanism the parent claim asserts. High truth, low linkage. The argument belongs in the graph; it just belongs under a different parent. People rarely invent evidence. They place real evidence under conclusions it does not support, which is why motivated reasoning shows up most clearly in where things are filed.

The published site has its own wrong-parent case, on the other side of the same stock-trading belief. The objection "The best-identified studies of actual returns find congressional portfolios underperform the market" has a [linkage page](https://myklob.github.io/ideastockexchange/beliefs/p/argu-best-identified-studies-barring-members.html) whose reasons to disagree include **Wrong parent**: "Portfolio returns bear on whether members trade profitably, not on whether holdings bias votes, and the belief rests on both", and **Scope mismatch**: "Average portfolio performance cannot detect a small number of well-timed trades, which is the conduct at issue." True evidence, possibly the wrong target.

## Fallacies are argued, not detected

Several of the failures above are textbook fallacies, which raises the obvious question: why not have software spot them and dock the score?

**Refused by design on the site, for the score; permitted for a flag.** The method page: "Fallacy detection is not done. The wiki specifies pattern-matching the prose for ten named fallacies, each deducting from a score. On a site whose subject is often officials acting on their own interests, a matcher looking for 'attacking the person rather than the argument' would fire on the central legitimate argument on page after page, and a score moved by a pattern match has no page anyone can argue with. A fallacy is argued instead, as a reason to disagree on the linkage page of the row it infects." (code: `method.py`; [method page, checks](https://myklob.github.io/ideastockexchange/beliefs/method.html#checks)).

Under the owner's direction (nothing is final; software may flag a possible fallacy, the flag is a claim people argue like any other, and a flag alone moves no score), [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) flags a reason whose wording matches a short, published phrase list, as a question with the words that set it off and two prefilled forms: a reason to disagree saying it is the fallacy, and a reason to agree saying it is not. The app does the same in its own shape: a detector may draft a linkage counter-argument with `targetFactor` "relevance" and a `fallacyType`, and it stays a draft, stored and never counted, until published. "A detection is an argument, never a penalty: no score changes when a detector fires." (code: model `LinkageArgument` in `schema.prisma`).

## What else reads the linkage score

The owner's page stops at the argument's weight. On the site, linkage also feeds these (each a calculation from the code named):

| Reader | What it does with linkage | Code |
|---|---|---|
| Kind of dispute | "Linkage leaning against relevance" is the share of reasons on both sides whose linkage reads below 0.50. If it leads evidence two-sidedness and the value gap by at least 0.1, the belief is a **Linkage dispute**: the sides accept the facts and argue about whether they bear on the belief. Feeds the [Hardest to resolve](https://myklob.github.io/ideastockexchange/beliefs/lists.html#hardest) list. Moves no score. | `render_site.py`; [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#dispute) |
| Testable Predictions | The share of predictions that are dated and have a linkage reading of 0.50 or more: dated, and argued to be diagnostic. | `render_site.py` |
| Confidence | Testability counts predictions that are dated and have a linkage page opened, never its score, so confidence cannot loop through the scorer. | [`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py) |
| ReasonRank, the dependence walk | Steps from a page to the pages it reads in proportion to `capacity(row) = Link x Imp x Uniq`. "A linkage page argued down to 0.2 really does transmit less, whatever happens to the claim", and "a linkage argued to 0 kills a row exactly as thoroughly as a claim argued false." | [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py); [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank) |
| Sensitivity | A linkage page is swept 0 to 1 like any other input to find whether, and where, the belief flips across 0.50. "Multiplier pages count: a linkage page is an input to the conclusion exactly as the claim is." | [`sensitivity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py); [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity) |
| Evidence Verification Score, displayed | `EVS = ESIW x ECRS x ERQ x (ERP/100)`, with the row's linkage standing in as ECRS, "so this reuses the linkage page rather than adding a fourth thing to argue". Shown, read by nothing. | `evs` in [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py); [[Evidence Verification Score (EVS)]] |
| Media | A work's row on a belief page scores `(2 x Quality - 1) x Bears x Influence x Imp`, where Bears is a linkage page of Type Media. Shown, not counted in the belief's score. | `render_site.py` |
| Importance | A bearing page (a linkage of Type Interest) says how far a row really speaks to an interest; the importance page takes the largest Validity x Bears. | `evaluate` in `score_reference.py` |

In the app, the at-stake ranking of edges counts an undebated linkage as an open gap, weight 0.25, measured as `1 / sqrt(1 + votes)` in the edge's linkage sub-debate: "An undebated linkage is an assumption, not a finding" (code: [the at-stake ranking](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts)).

**Two sub-types (app only).** The app tags each edge `ECLS` (Evidence-to-Conclusion Linkage Score, raw data to a belief, the default on evidence) or `ACLS` (Argument-to-Conclusion Linkage Score, one belief to its parent, the default on arguments) (code: `enum LinkageScoreType` in `schema.prisma`). The explainer's examples: a peer-reviewed atmospheric study at 95% linkage to "CO₂ traps heat" (ECLS); "Solar prices dropped 80%" at 75% linkage to "We should end fossil fuel subsidies" (ACLS). Both are scored the same way. The site makes no such distinction; the Type field on a linkage page only changes the wording of its question.

## Why this changes the game

Linkage Scores force debaters to focus on **Relevance** rather than just **Fact-Checking**. It moves the conversation from "Is this true?" to "Does this matter?"

This is how we separate a pile of random facts from a structured, logical argument.

The fact-checking industry spends its life on the first question. Most bad arguments survive it with flying colours, because most bad arguments are built from true parts. The scandal is almost never the fact. It is the leap.

## Open questions for the owner

The October 2026 direction settles the principle in each case below; the implementation choice is still open.

1. **Should opening an empty linkage page lower a row from 1 to 0.50?** The direction says start trusting. Today a row with no linkage page reads 1 and a row with an empty one reads 0.50, so the first act of challenging a link, before any reason is argued, halves it. Options: start a linkage page at `DEFLINK` instead of the neutral 0.50 (a change to `evidence.prior` or `_share` for linkage pages, with a conformance diff via `python3 conformance.py --write`); keep it and say on the page that an open challenge costs the row half its weight until argued back up; or treat a linkage page with no argued reasons as absent.
2. **Should the app's new arguments start at linkage 0.1?** The schema default contradicts the direction; the site's 1 and the app's own empty-debate 0.5 both fit it. Options: change `Argument.linkageScore @default(0.1)` to 1 or to 0.5; or set it from a stated starting guess (contributor record, topic relatedness, an AI estimate, labelled as a guess).
3. **Does a weak linkage ever silence an argument?** The owner's page says below 0.2 it does; no engine does; the direction on volume says contributions count from the start. Options: drop the cutoff and say the defence is uniqueness and argued truth; or publish a cutoff rule beside the current one and compare them on real pages, as `tally.py` does for volume.
4. **Is the canonical scale -1 to +1 or 0 to 1?** The owner's page and the protocol demo are signed; the site and the app's belief pages store 0 to 1 and carry direction by side and by `(2 x Truth - 1)`. Options: keep 0 to 1 stored and `2 x Link - 1` displayed, as the site's readout already does; or make linkage signed everywhere, which changes `score_reference.py` and the conformance contract.
5. **"Necessarily" or "significantly"?** The site's question says "significantly"; the template and the app say "necessarily". The word sets the bar every reason on a linkage page has to clear.

Two smaller things are corrections rather than decisions: the app explainer's "100 weak connections (0.1) are outweighed by a single strong one (0.9)" is arithmetically false under every engine, and its "moderate range (40 to 60%)" for the missing-assumption prompt does not match the code's 0.1 to 0.4.

## See also

- [[Truth Score]]: Measuring factual accuracy.
- [[Evidence Verification Score (EVS)]]: Evaluating data sources (the owner's "Evidence Framework").
- [[ReasonRank]]: The master algorithm; and [[ReasonRank: Google's PageRank for Arguments]] for the walk that steps by Link x Imp x Uniq.
- [[Assumptions]]: Bridging the gap in low-linkage arguments.
- [[Evidence to Conclusion Relevance Score]]: the same factor, formula by formula, with every default and every engine's version.
- [[Template: Linkage Evaluation]]: the page a contested linkage gets, section by section; and [[Templates]] for the rest.
- [[Argument Scores from Sub-Argument Scores]]: how a reason's own debate sets the truth that Link then scales.
- [[The Redundancy Problem]] and [[Equivalency Score:]]: the Uniqueness factor, the real defence against a gallop of restatements.
- [[Likely Interests of Those Who Agree and Disagree]]: importance, and the bearing page that is a linkage of Type Interest.
- [[Quantifying Reason: The Power of Truth Scores]] and [[Pros and Cons on the Same Page]]: why reasons on both sides sit together where their links can be compared.
- The site's [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula), its [labelled constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants), and its list of [rules the wiki states that the site does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun), where "Linkage as the agree share of all argued strength" sits beside what runs instead.

To help refine the Linkage scoring definitions, propose a change through the [repository](https://github.com/myklob/ideastockexchange) or the forms on any [belief page](https://myklob.github.io/ideastockexchange/beliefs/index.html).
