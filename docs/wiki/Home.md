# Home

**Welcome to the Idea Stock Exchange Wiki.** We are building an open, evidence-based platform to **rank arguments, measure belief strength, and automate conflict resolution**, bringing structure to online debate.

Think of a stock exchange where the thing being traded is a claim, and the price is set by argument instead of by shouting. A claim's price rises when good reasons and solid evidence are filed under it and falls when they are knocked down. Nobody gets to buy a higher price with volume, money or a mob. That is the whole idea; the rest of this wiki is the machinery.

Two of the three promises in that first sentence run today. Arguments are ranked and belief strength is measured, on every page of the published site at [myklob.github.io/ideastockexchange/beliefs](https://myklob.github.io/ideastockexchange/beliefs/index.html). "Automate conflict resolution" is a set of readouts (shared interests, the interest driving each side, the kind of dispute, how easy it would be to settle) that help people resolve a conflict; no software resolves one on its own.

**About this page.** Rewritten October 2026. The previous Home (last edited 2025-08-09) predates the published site, its [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html), the Next.js app's `/algorithms` index and the conformance contract, which are where the running rules are now written down. It also had two dead links (to "Better-Ways-of-Saying-the-Same-thing", a page that never existed, and to "Automated-Conflict-Resolution", deleted in November 2023); they now point at [[Equivalency Score:]] and [[Automated Conflict Resolution Platform]]. Every claim below about the code names its file. Where a statement is the owner's judgment rather than something the code does, it says so.

## Where the numbers come from

The repository carries more than one scoring engine, and they disagree on purpose in a few places. Every mechanism on this page is labelled with the engine that runs it.

| Engine | Where | Status |
|---|---|---|
| The published site | [`tools/static-site/`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/README.md), scorer of record [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py) | Runs. Builds every page at myklob.github.io/ideastockexchange/beliefs/ from two flat tables (`content/pages.csv` and `content/edges.csv`). CI runs its tests before it publishes anything. |
| The Next.js app | [`src/core/scoring/`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts) | Runs inside the app (`/beliefs/[slug]`, `/algorithms/*`, `/leverage`, `/media`). Its numbers never reach the published site. |
| The page/edge model | [`src/lib/ise-pages/`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/ise-pages/types.ts) | Proposed successor, complete and tested, imported by no route. |
| The founding workbook's process | [`src/lib/conclusion-score.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/conclusion-score.ts) with SQL and PHP twins | Kept for reference. Unwired. |
| The AI framework | `src/core/ai/` | Unwired. Two of its files (`main.py`, `services.py`) do not parse. A number a model asserts is the one thing the published engine refuses to carry. |

The running rules are pinned by a **conformance contract**: [`tools/static-site/conformance.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/conformance.py) with `conformance/corpus.json` and `conformance/expected.json`, holding 25 pages, 26 edges, the five constants and the 18 evidence tiers, checked to a tolerance of 1e-9. A port of the engine to any language can be held to the same numbers without reading this repository. A deliberate rule change means regenerating that file and reviewing the diff.

Where the two running engines differ, here is how (the code, by file):

| Question | Published site | Next.js app |
|---|---|---|
| What one argument row adds | `sign × (2 × Truth − 1) × Confidence × Link × Imp × Uniq` | `rawImpact = ReasonRank × linkage × importance × uniqueness` |
| Does listing an unargued reason raise a score? | No. Truth 0.5 gives `2 × 0.5 − 1 = 0`. | Yes. Truth is `ProRank / (ProRank + ConRank)` over summed impacts. |
| Do votes move a score? | Never. Shown beside the score. | Linkage votes can set a linkage; confirmed fallacy claims add a counter-argument. |
| Fallacies | Flagged by wording, argued like any claim, moving no score | Structured accusations confirmed by 60% weighted consensus |
| A link nobody has argued | Linkage 1 (trusted) | Linkage debate 0.0 with no arguments, scale −1 to +1 |
| Duplicates | Flagged, never scored; uniqueness presumed 1 | Uniqueness = 1 − the highest similarity to an earlier sibling, multiplied in |
| Evidence | Sets a page's starting point, bounded to [0.05, 0.95] | `ESIW × log2(ERQ + 1) × ECRS × ERP` adds up to ±0.2 to truth |

### The owner's direction on scoring (October 2026)

The owner settled the questions the 2026 wiki audit raised, and set the goal: a score that promotes good ideas and demotes bad ones in the real world. Whatever rule does that best wins, so a new rule is published beside the current one and compared on real pages before it replaces anything. In the owner's words, summarised:

- **Volume.** For belief strength, start from the number of truly independent reasons to agree and disagree, rank how valid they are against each other, and let the weight of pro against con decide. Contributions count from the moment they are posted and are argued down from there. For choices of action, weigh costs and benefits across every stakeholder with a legitimate interest, both the quantity and the quality of interests met. *Today:* [`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py) prints this rule on every belief page as "Counting every reason until it is argued down", beside the argued truth score, and no other number reads it yet.
- **Votes.** Votes may decide what gets attention, never what is valid. Track what is popular apart from what holds up, and show the gap. *Today:* the published site does exactly this.
- **Fallacies.** Nothing is final. Software may flag a possible fallacy; the flag is a claim people argue for and against, and a flag alone moves no score. *Today:* [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) does exactly this.
- **Linkage.** Start trusting, lower it when a reason is shown unrelated or invalid, and let a well-argued link rise. *Today:* the published site starts at 1 and the linkage page's own score moves it either way.
- **Evidence.** Prefer an evidence weight with no ceiling, so a body of replicated work can outweigh opinion by 15 or 200 times. *Today:* `tally.py` weighs a finding by `1 + ESIW × ERQ × ERP/100`, uncapped. The argued truth score still uses the bounded starting point.

## Read in this order

This page, [[Home]], is the map. Read the pages below roughly in this order: first why the pages look the way they do, then how a score is made, then the parts that deal with decisions and people, then what it is all for, and finally the templates every page is built from.

### Stage 1: Why a page looks the way it does

1. **[[Pros and Cons on the Same Page]].** Why every idea gets one page with the best reasons to agree and to disagree side by side, instead of pro-wage articles on progressive sites and anti-wage articles on libertarian ones. It explains the two-column layout, the "hardware problem" and "virtue-vice problem" that make side-by-side reading matter, and how interest mapping goes beyond a binary. Every belief page on the published site is built this way.
2. **[[One Page per Debate Topic]].** One page per topic, with beliefs organised on three dimensions at once: general to specific, weak to strong, negative to positive. It explains the four ways online debate fails (topic drift, scattered arguments, repetition without progress, no collective memory). On the site each topic is a page such as [Government ethics](https://myklob.github.io/ideastockexchange/beliefs/t/government-ethics.html), and a subject nobody takes a side on (History, Music) is a directory with no continuum.
3. **[[Belief Web Navigation]].** What you see when you click any belief: reasons to agree and to disagree sorted by strength, the beliefs it depends on (upstream) and the beliefs it supports (downstream). The page's original sort key was Contribution Score = Linkage Score × Belief Score; the site now sorts every table by its signed row score, strongest first on each side.
4. **[[Assumptions]].** The "wall of text" trap (hidden foundations, the pivot maneuver, cognitive exhaustion) and why load-bearing assumptions must be pulled out where they can be attacked. It carries a technical requirement specification and a three-phase implementation plan. The site lists assumptions in two columns with a typed load-bearing flag; the argued "necessity score" the page proposes is not run.

### Stage 2: How a score is made

5. **[[ReasonRank]].** The short overview: the Belief Score is the output, built from truth, linkage, equivalency, fallacy penalties and evidence. Its sample ranks arguments by vote share, which both engines replaced with scores computed from argument structure. Read it for the intent, then the next page for the mechanics.
6. **[[ReasonRank: Google's PageRank for Arguments]].** The PageRank analogy in full, with the original matrix sketch (pro and con matrices, damping 0.85, 100 iterations, TF-IDF uniqueness, user feedback, sentiment). It explains the three things that now carry the name: the signed scoring rule, a true PageRank walk that measures what depends on a claim, and the Next.js damped recursion.
7. **[[Argument Scores from Sub-Argument Scores]].** The recursion that makes the whole thing scale: an argument's score is computed from the arguments beneath it, so truth flows upstream. It works a "Should we build roundabouts?" example and covers quality control (semantic clustering, community validation, expert review).
8. **[[Truth Score]].** The original framing: Truth = a Logical Fallacy Score plus an Evidence Verification Score, with a fallacy list and a machine-learning outline. It says what replaced each half: fallacy flags argued like claims, and evidence that sets where a page's truth starts.
9. **[[Quantifying Reason: The Power of Truth Scores]].** A second draft of Truth Score with a six-step algorithm, the score's role in the larger system and an alternate explanation. Read it after Truth Score; it adds context rather than a different rule.
10. **[[Evidence Verification Score (EVS)]].** The 16-row table of how far each kind of source can move a claim (statistics 0.90 down to historical artifacts 0.10), replication quantity (ERQ), replication agreement (ERP), and the formula `EVS = ESIW × ECRS × ERQ × (ERP/100)`. The published site prints that sum in every Evidence Ledger and scores with a bounded starting point built from the same three inputs.
11. **[[Linkage Scores]].** The friendly essay on "true but irrelevant": "The sky is blue" is 100% true and 0% relevant to a carbon tax. It explains how linkage stops the Gish Gallop, exposes non sequiturs and drags hidden assumptions into the open.
12. **[[Evidence to Conclusion Relevance Score]].** The technical version of linkage: if this argument were true, how much would it support the conclusion? It gives the wiki's agree-share formula, with seven steps, and the three rules that actually run (published site, Next.js, founding workbook).
13. **[[The Redundancy Problem]].** Why volume is not votes: a courtroom where one side may call the same witness a hundred times. It proposes duplication scoring (two arguments 90% the same, the second counts 10%) in three layers (mechanical, semantic, community) and says which parts run.
14. **[[Equivalency Score:]].** How to decide that two wordings are one claim: a blend of a computed similarity and an argued one, `ES = w_ces × CES + w_ues × UES`. The published site computes the similarity, flags pairs, and gives the computed half weight zero so the argued equivalence page decides.
15. **[[Confidence Stability Scores]].** The proposal to weight a belief by how stable its score has been under scrutiny, from votes, visitors, evaluations and score variance over time. The site replaced it with a structural confidence measure of how much work stands behind a page; every behavioural signal carries weight 0 by design.

### Stage 3: Decisions, people and media

16. **[[Likelihood of Costs and Benefits]].** Why a cost or benefit is multiplied by a likelihood that is itself argued, not guessed: a $1,000,000 benefit at 50% contributes exactly $500,000, and a $10M catastrophic risk at 10% subtracts $1M. On the site the likelihood is the truth score of the cost or benefit's own page; competing estimates with intervals are proposed, not run.
17. **[[Likely Interests of Those Who Agree and Disagree]].** Score the "why" behind beliefs with two numbers: Linkage Accuracy (are we right about which interests move which group?) and Interest Validity (how legitimate is that interest?). Ugly interests are not deleted; they get bad scores. On the site an interest scores Validity × Drives.
18. **[[Automated Conflict Resolution Platform]].** The platform overview: the four *Getting to Yes* principles, an eight-step language-processing pipeline and a seven-step interest analysis ending in IACI and IVS scores. The four principles run as scored page sections; most of the pipeline is proposed, and two steps (sentiment flagging, hiding who wrote a row) are refused.
19. **[[Media]].** Link the most influential books, films, podcasts and studies to the beliefs they support or oppose. The page's eight-factor sorting product, Book Accuracy Score and aesthetic score were replaced: each work has its own page with argued Quality and Influence, and sales or views touch no number in either engine.

### Stage 4: What it is for

20. **[[Electronic Democracy]].** A manifesto for running policy debate on a pro/con platform, with cost-benefit analysis across seven dimensions (Financial, Time, Freedom, Security, Autonomy, Risk, Health). The scoring it sketches runs; the political program (party, candidates, pledges) has no code, and votes never move a score.
21. **[[Evidence‐based policy]].** How the platform serves evidence-based policy through five contributions: a database linking conclusions to assumptions, scores from argument strength, automatic recalculation, a hub for evidence, and transparency. Each is built, in a shape the page describes loosely: two flat tables, a full recomputation on every build, and every number exported.

### Stage 5: The templates

22. **[[Templates]].** The index of every page template, generated from the HTML files under `templates/`, which are the copies the code follows. Read it once to see the kinds of page (page templates, index templates, special analyses, an explainer), then open the one you need.
23. **[[Template: Belief Analysis]].** One belief with every section in the canonical order, from argument trees and the Evidence Ledger through costs and benefits, interests and definitions. It is the source of truth for section order, and the live belief page is built around it.
24. **[[Template: Topic]].** One topic: the three continua that give every belief a fixed address, the assumption stack, the core values conflict, common ground and the evidence ledger. A topic with no axis renders as a directory instead.
25. **[[Template: Linkage Evaluation]].** One linkage, "If X were true, it would necessarily strengthen Y", argued pro and con. Its truth score is the Link factor of the row it belongs to; a row with no linkage page is presumed relevant (Linkage 1).
26. **[[Template: Interest Validity Debate]].** One interest, written as a need with a subject, argued for validity with the alibi test and the mirror test. Bad motives are scored, not deleted.
27. **[[Template: Stakeholder Profile]].** One group of people with a stake: who they are, what they need, the three scores every need carries, and the beliefs they have a stake in. Interests are named for concrete groups, never "supporters" or "opponents".
28. **[[Template: Stakeholder Index]].** Who has a stake across the whole site: the groups, shared needs, and the primary conflict pair on each belief. It states the rule that power never counts.
29. **[[Template: Media Analysis]].** One work (book, film, study, podcast): the beliefs it carries, quality and influence arguments, the strongest case it leaves out, and who gains if the audience believes it. It absorbed the two retired media templates (Media Quality and Media Belief Argument) on 2026-10-03.
30. **[[Template: Media Index]].** The ranked list of works of one kind (best books, best films): what "best" can mean, the ranked works, and how to propose a yardstick or a work.
31. **[[Template: Why Pro and Con Media per Belief]].** The explainer for why every belief lists the works for and against it side by side: the influence gap and the danger of low directness.
32. **[[Template: Belief Equivalence Scorecard]].** Two wordings of what may be one claim, argued. Its truth score is what decides whether two pages merge.
33. **[[Template: Conflict Analysis]].** One conflict between named stakeholders: ranked interest profiles, the evidence testing linkage accuracy, the compromise engine and the duplicate reduction log.
34. **[[Template: Candidate Evaluation]].** A belief page specialised to "[Candidate] is the most qualified candidate for [office]", with objective criteria defined for the office before any candidate is compared.
35. **[[Template: Product Review]].** A belief page specialised to "[Product] is the best [type] for [use]": a scorecard, then the ordinary two-sided tables.

## The ideas on one page, and what runs today

The old Home made seven promises and a vision. Each is kept below in its original words, followed by what the code does with it.

### ReasonRank: Google's PageRank for arguments

> Google's PageRank can be adapted to assess the strength of pro/con arguments. Just as PageRank values a site based on the quality of links, **ReasonRank values conclusions based on the strength of supporting arguments**, factoring in logic, evidence, and relevance.

**Status: implemented, as three different things under one name.** Read [[ReasonRank: Google's PageRank for Arguments]], [[ReasonRank]] and [[Argument Scores from Sub-Argument Scores]] for depth; the method page's [formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula) and [ReasonRank](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank) sections give the running rules.

**1. The scoring rule (published site, [`score_reference.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/score_reference.py)).** Every row on every page is an edge to another page, and contributes

```
row contribution = sign × (2 × Truth − 1) × Confidence × Link × Imp × Uniq
page truth (argued) = (POS + w × p0) / (POS + NEG + w)
page truth = min(argued, weakest load-bearing component that has its own page)
belief score = POS − NEG   (open-ended)
```

POS and NEG are the positive and negative contributions as magnitudes, so a reason to agree that is argued false lands on the disagree side. `p0` and `w` come from the evidence a page cites (see Truth Score below). A factor with no page reads a labelled constant: `K = 1`, `UNARG = 0.5`, `DEFLINK = 1`, `DEFIMP = 0.5`, `DEFUNIQ = 1` (the `CONSTS` line of `score_reference.py`).

A calculation, to see it move. One reason to agree, argued to truth 0.8, with confidence 1, no linkage or uniqueness page (both 1) and no importance page (0.5), contributes `(2 × 0.8 − 1) × 0.5 = 0.3`. A page that cites nothing starts at `p0 = 0.5`, `w = 1`, so it reads `(0.3 + 0.5) / (0.3 + 0 + 1) = 0.615`. Now leave that reason unargued at 0.5: it contributes `(2 × 0.5 − 1) = 0`, and the page stays at 0.50. By induction an argument graph in which nothing cites the world reads exactly 0.50 forever, and [`test_engines.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_engines.py) (`test_argument_alone_can_never_leave_the_neutral_point`) pins that.

**2. The walk (published site, [`reasonrank.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/reasonrank.py)).** This is the part the name is borrowed for, and it is not a score of whether a claim is true. It asks how much of the site's conclusions flow through a claim. A random walk starts evenly at the beliefs and steps along rows in proportion to `capacity = Link × Imp × Uniq`, with `DAMPING = 0.85`, restarting at the beliefs with probability 0.15. It stops when the change falls below `TOLERANCE = 1e-12`, under a cap of `ITERATIONS = 2000` it never reaches, and the residual is reported. Truth and confidence are deliberately left out, so a refuted claim that four conclusions still rest on keeps its rank. Rank against confidence gives the work queue: `work = rank × (1 − confidence)`.

**3. The Next.js recursion ([`scoring-engine.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/scoring-engine.ts)).** A leaf argument's ReasonRank is its base truth. Otherwise `subArgScore = 0.5 + 0.5 × (proSubRank − conSubRank) / numSubArgs` and `ReasonRank = (1 − 0.85) × baseTruth + 0.85 × subArgScore`, with `DAMPING_FACTOR = 0.85`. Each argument's `rawImpact = ReasonRank × linkage × importance × uniqueness`, and a belief's truth is `ProRank / (ProRank + ConRank)` (0.5 with no arguments) plus an evidence contribution of up to ±0.2, clamped to [0.01, 0.99]. It is one bottom-up pass with no iteration count.

**"Factoring in logic, evidence, and relevance."** Evidence and relevance are factors in both engines. Logic as a separate factor exists only in the Next.js app, through confirmed fallacy claims (see Truth Score). The published site has no logical-validity factor; a fallacy is argued as a reason on the claim's own page.

**"By quantity and quality" (from the linked page).** This is the one open disagreement. The published site's argued rule refuses quantity: an unargued reason is worth zero. The Next.js engine counts it, because adding an unargued pro raises `ProRank`. The owner's direction (above) is to count truly independent reasons from the moment they are posted, and the published site now prints that rule ([`tally.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/tally.py)) beside the argued score so the two can be compared on real pages:

```
a reason or prediction weighs   Truth × Linkage × Importance × Uniqueness
a finding weighs                the same × (1 + ESIW × ERQ × ERP/100), uncapped
independent reasons on a side   the sum of Uniqueness over its reasons
share for                       (weight for + w × p0) / (weight for + weight against + w)
```

**"User feedback (votes, credibility scores)" (from the linked page).** The published site refuses it: "A vote never moves a score" ([`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py)), pinned by `test_no_vote_moves_any_score` in [`test_render.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/test_render.py). The Next.js app lets two kinds in: a weighted average of linkage votes (clamped to [−1, 1]) sets an argument's linkage when no linkage debate exists, and fallacy claims are confirmed by weighted consensus. The original sketch's mean-of-feedback multiplier exists in neither. The owner's direction sides with the published site: votes buy attention, not validity.

### Truth Score: logical fallacy + evidence verification

> We integrate two powerful measures:
> - **Logical Fallacy Score**, which measures the degree and impact of fallacies in an argument.
> - **Evidence Verification Score**, which evaluates how well the claim is supported by independent, rigorous evidence.
>
> Combined, these scores **quantify argument credibility** and encourage reasoning grounded in both logic and verifiable fact.

**Status: the pairing survives as the owner's framing; both halves were replaced.** Read [[Truth Score]], [[Quantifying Reason: The Power of Truth Scores]] and [[Evidence Verification Score (EVS)]].

**The fallacy half.** No score called a Logical Fallacy Score exists in any engine.

- *Published site, flags.* [`fallacy.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/fallacy.py) is a short, readable list of phrases, not a model, for nine named fallacies: Attacking the person, Appeal to popularity, Appeal to authority, Slippery slope, False choice, Sweeping generalization, Appeal to tradition, Pointing at the other side, and After, therefore because of. It fires on reasons and objections (not findings), phrases each flag as a question, shows the words that set it off, and links two prefilled forms on the flagged claim's page: one to argue it is the fallacy, one to argue it is not. What that argument concludes moves the claim's truth through the ordinary rules; the flag never does. This is the owner's direction built.
- *Published site, structural checks.* [`integrity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/integrity.py) runs nine checks on the shape of the graph, none of which changes a score: Circular support and Assumes its own conclusion (serious, and the scorer refuses to publish a corpus containing either, because a loop can hold any value and stay consistent); The same page listed more than once, Rows that may be the same point twice, Rests only on authority or experience, Evidence filed above the premise it bears on, and Costs and benefits given as single figures (worth checking); Nothing stated would show it false and Nobody has argued the other side (a note). Why no deductions: on a corpus "whose whole subject is officials acting on financial interests, a pattern matcher looking for 'attacking the person instead of the argument' would fire on the central legitimate argument on every page."
- *Next.js app, structured accusations* ([`src/lib/fallacy/claims.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/claims.ts), [`consensus.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/consensus.ts), [`calibration.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/fallacy/calibration.ts)). An accusation is a template with six fields (fallacy type from a catalog, quoted text, an explanation, missing elements, evidence links, consequences). It is confirmed only by weighted consensus at `CONSENSUS_THRESHOLD = 0.6` with `CONSENSUS_QUORUM = 3`, each voter weighted by a credibility multiplier between `CREDIBILITY_FLOOR = 0.3` and `CREDIBILITY_CEILING = 1.4`. A confirmed claim publishes a counter-argument into the target's linkage sub-debate at strength 0.8 (major) or 0.5 (minor); that is its only wired effect on a score. A validity ladder (no fallacy 0.95, one minor 0.75, one major 0.45, two or more 0.25) and a bridge into `scoreArgument` as `truth × (1 − Σ|impact|/100)` are defined and tested but called by nothing in `src/`. A regex detector drafts counter-arguments and returns no numbers.
- *Proposed, not built:* machine-learning detection of fallacies and a confidence interval on the detection.

**The evidence half.** The wiki's formula, `EVS = ESIW × ECRS × ERQ × (ERP/100)` summed over a belief's evidence, is computed by `evs()` in [`evidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/evidence.py) and printed in every Evidence Ledger "for comparison; no score reads it". What scores is a starting point for a claim's truth:

```
p0 = 0.5 + 0.5 × ESIW × (2 × ERP/100 − 1)
w  = k × 2 × ERQ / (ERQ + 1)        k = 1, REP_CAP = 2.0
truth = (POS + w × p0) / (POS + NEG + w)
```

Because the strongest source weighs 0.90, `p0` stays in [0.05, 0.95], and replication can at most double a page's weight (1 replication 1.00, 2 gives 1.33, 3 gives 1.50, 10 gives 1.82). ESIW is the wiki's 16-row table in its order with its weights, with two transcription notes: the wiki's rank-2 band "0.85-0.80" is split RCT 0.85, meta-analysis 0.80 in listing order, and an unranked `record` tier (statute, judicial holding, agency rule, sworn filing) is added at 0.90. A page with no source type reads `NOSOURCE = 0.0`, which leaves it at the coin flip. ECRS is the row's linkage page, not a fourth thing to argue. The Next.js app uses `ESIW × log2(ERQ + 1) × ECRS × ERP` over five tiers (T0 retracted 0.05, T1 1.0, T2 0.75, T3 0.5, T4 0.25, default 0.5). See the method page on [where a page starts](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts) and [EVS](https://myklob.github.io/ideastockexchange/beliefs/method.html#evs).

**"Combined."** The Next.js app's `calculateTruthScoreBreakdown` ([`all-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/all-scores.ts)) averages a logical-validity half (the pro share of argued weight) and a verification half when both exist. It used to average every argument regardless of side, so one strong objection could lift a belief from 0.600 to 0.775; it now takes the pro share. The published site does no two-part combination: evidence sets the start, argument moves it.

### Linkage scores: connecting evidence to conclusions

> Our system measures the **relevance and causal strength** between evidence, intermediate arguments, and final conclusions. The method:
> - Weighs each link in the reasoning chain.
> - Uses an adapted PageRank model to reflect collective judgment on relevance.

**Status: implemented; the "adapted PageRank" became an argued page.** Read [[Linkage Scores]] and [[Evidence to Conclusion Relevance Score]], and the template [[Template: Linkage Evaluation]].

The test is one question: *if this argument were true, how much would it force the conclusion?* "The sky is blue" is true and irrelevant to a carbon tax, so its row should carry nothing however true it is.

- *Published site.* Every row has a `link` factor. It is the truth score of that row's linkage page, scored by the same argued rule as any page, or `DEFLINK = 1` when nobody has opened one. That matches the owner's direction: start trusting, fall when argued down, rise when argued well. Readers can mark "Bears on this: yes / no"; that vote is shown and never scored.
- *Next.js app* (`scoring-engine.ts`). Linkage comes from, in order, a linkage debate, community votes, then a stored field. The debate scores `(A − D) / (A + D)` on −1 to +1, 0.0 with no arguments, so a link can actively contradict. Bands: −0.5 or below CONTRADICTION, under 0.05 in size IRRELEVANT, under 0.35 ANECDOTAL, under 0.65 CONTEXTUAL, under 0.95 STRONG_CAUSAL, otherwise DEDUCTIVE_PROOF. Decision Leverage also reports each edge's transmission weight, `|linkage| × importance × uniqueness × 0.5^depth`.
- *The wiki's own formula*, the agree share of argued strength on [0, 1] with 0.0 when there are no reasons to agree, is not run as written; the published site shrinks the same share toward the page's starting point.

### Impact algorithm: argument importance and belief impact scores

> - **Argument Importance Score** measures how much a belief depends on a specific argument.
> - **Belief Impact Score (BIS)** combines argument strength with cost-benefit analysis to assess the real-world consequences of accepting a belief.
>
> These scores help identify the **most influential arguments** and the beliefs that most affect society.

**Status: importance runs; "Belief Impact Score" is a proposed name with no code.** The old heading linked to Confidence Stability Scores, which never mentions importance. No wiki page covers this yet; read [[Likelihood of Costs and Benefits]] for the cost-benefit half and [[Electronic Democracy]] for why it matters.

**Argument Importance, as it runs.**

- *Published site.* An importance page scores the largest `Validity × Bears` among the interests it lists (Bears is the bearing page's truth, else `DEFLINK`), and a row with no importance page reads `DEFIMP = 0.5`.
- *Next.js app.* `calculateImportanceScore` clamps a 0 to 1 input and labels it decisive at 0.85 or more, significant at 0.65, moderate at 0.40, minor at 0.15, else negligible; `deriveImportanceFromBeliefScore = (overallScore + 100) / 200`.
- *"How much a belief depends on an argument", answered literally.* The published site's [sensitivity sweep](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity) ([`sensitivity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/sensitivity.py)) names the single input that would flip a conclusion: it finds where a page's truth crosses `FLIP = 0.5` by bisection (`STEPS = 16`, about 1.5e-5), ignores inputs that move the answer by less than `INERT = 0.005`, looks `DEPTH = 6` levels down, and reports "moves it now" beside "moves it if settled". The Next.js app's Decision Leverage ([`decision-leverage.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/decision-leverage.ts)) ranks edges by `weight × openRange × 100`, where `weight = |linkage| × importance × uniqueness × 0.5^depth` and the open range weighs four gaps (evidence 0.40, linkage 0.25, scoring 0.15, examination 0.20). An edge is load-bearing at weight 0.35 or more, open at 0.40, negligible under 0.5 points, and a belief is fragile when one edge carries 0.5 or more of its total.

**Belief Impact Score, what serves it today.** Each cost or benefit is a claim page whose likelihood is its truth score. The published site computes `expected value = magnitude × truth`, with a low-to-high band from `mag_low` and `mag_high`, a net by unit of measure, and who gains and who pays by interest (see the method page on [costs and benefits](https://myklob.github.io/ideastockexchange/beliefs/method.html#cba)). Every estimate is currently a single figure, and every belief page says so; filling the ranges is the owner's estimate to make. The Next.js app has `calculateExpectedValue` and a separate CBA engine ([`cba-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/cba-scoring.ts)) with different rules. Beware the name collision: the only `beliefImpact` in code is a book's reach, `log10(sales + citations + shares)` ([`book-scoring.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/features/books/services/book-scoring.ts)), and [[Media]] uses "BIS" for a Book Importance Score.

### Redundancy reduction: discourse de-duplication

> We group equivalent or highly similar arguments so debates stay **focused and concise**.
> - **Equivalency Score**, calculated using semantic similarity + argument performance.
> - Displays "better ways of saying the same thing" to reduce clutter.

**Status: flagged and displayed; nothing merges on its own.** The old link went to "Better-Ways-of-Saying-the-Same-thing", which never existed. Read [[The Redundancy Problem]] and [[Equivalency Score:]], and the template [[Template: Belief Equivalence Scorecard]].

The problem is real and old: post the same point 147 ways and a naive counter thinks you have 147 reasons.

- *Published site* ([`similarity.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/similarity.py)). The computed similarity is lexical, with "no model and no network": `CES = 0.5 × IDF-weighted Jaccard of content words + 0.5 × IDF-weighted cosine over character 4-grams`. It flags pairs at `FLAG = 0.45` and calls them "probably one page" at `MERGE = 0.70`, ignores words so common their weight falls under `IDF_FLOOR = 0.05`, needs word overlap of at least `JMIN = 0.05`, and holds at most `PAIRCAP = 1,500,000` candidate pairs. The wiki's blend `ES = w_ces × CES + (1 − w_ces) × UES` is implemented in `blend()` with `w_ces = 0.0` by default, so the argued equivalence page alone decides and the computed half "changes no score and cannot". Uniqueness reads a uniqueness page's truth or `DEFUNIQ = 1`. See the method page on [equivalency](https://myklob.github.io/ideastockexchange/beliefs/method.html#equivalency).
- *Next.js app.* [`propagate-belief-scores.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/lib/propagate-belief-scores.ts) multiplies `uniqueness = 1 − the highest similarity to an earlier same-side sibling` (plain Jaccard) into every impact. `calculateBeliefEquivalencyScore` returns 1.0 when mechanical similarity reaches 0.85, else `0.4 × mechanical + 0.6 × semantic`, with bands identical 0.90, near-identical 0.70, overlapping 0.45, related 0.20. `clusterArguments` exists and is called by nothing.
- *"Better ways of saying the same thing."* Belief pages carry a similar-beliefs table with more extreme and more moderate wordings and a "Same claim?" column; the Next.js belief page's `SimilarBeliefsSection` labels high-equivalency pairs as merge candidates. Nothing yet ranks wordings of one claim as better.
- *Proposed, not built:* the Validity Comparison Argument that would set the computed weight, and the spaCy semantic model.

### Automated conflict resolution

> Our conflict-resolution engine:
> - Focuses on **interests, not positions**.
> - Evaluates solutions against **objective criteria**.
> - Scores proposals on **resolution likelihood**, factoring in cost-benefit trade-offs and compromise requirements.

**Status: the first two run as scored page sections; "resolution likelihood" is proposed under that name.** The old link pointed at a page deleted in 2023. Read [[Automated Conflict Resolution Platform]] and [[Likely Interests of Those Who Agree and Disagree]], with the templates [[Template: Conflict Analysis]], [[Template: Interest Validity Debate]], [[Template: Stakeholder Profile]] and [[Template: Stakeholder Index]].

- *Interests, not positions.* On the published site each interest is a need with a subject ("parents need ..."), scored `Validity × Drives`. Validity is argued on the interest's own page by the mirror test (would the side accept the same need honored for its opponents?), and who holds the need, how many of them there are and how much power they have never count ([`render_site.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/render_site.py)). Drives asks whether this need really explains the position, settled by the side's record. The primary conflict pair is the highest `Validity × Drives` on each side. The Next.js app ([`conflict-resolution.ts`](https://github.com/myklob/ideastockexchange/blob/master/src/core/scoring/conflict-resolution.ts)) finds shared interests at similarity 0.5 or more with validity at least `RESOLUTION_FLOOR = 70` on both sides, ranked by the harmonic mean of validities.
- *Objective criteria.* Each criterion is a claim page and its score is that page's truth, with a column for the latest reading. The Next.js app scores a criterion `(validity + reliability + independence + linkage) / 4`, excellent at 0.80, good at 0.60, moderate at 0.40, else weak. Neither engine scores a solution against the criteria; both score the criterion.
- *Resolution likelihood, what exists.* The published site computes `ease of resolution = truth of the best-argued compromise × (1 − mean truth of the obstacles, or 0.50 when none is listed)`, and a [kind of dispute](https://myklob.github.io/ideastockexchange/beliefs/method.html#dispute) (Factual dispute, Linkage dispute, Values conflict, or Mixed dispute) from evidence two-sidedness, the share of reasons with linkage below 0.50, and the value-ranking gap divided by 3: whichever leads both others by 0.1 names it. The [Hardest to resolve](https://myklob.github.io/ideastockexchange/beliefs/lists.html#hardest) list ranks beliefs by it. The site says plainly that "nothing on this site yet tests which disagreements a small change in likelihood would flip". The Next.js app does run that test: a cost or benefit is a compromise candidate when `requiredShift = |category net| / |magnitude|` is at most `ACHIEVABLE_SHIFT = 0.15`.
- *Completeness.* A belief is complete on the published site only when it has reasons both ways, evidence, objective criteria, predictions or a falsifiability test, costs and benefits, and interests on either side (`CORE_BAR` in [`publish.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/publish.py)). Every other belief is still published, marked draft with what it lacks, and ranked below the complete ones; nothing drafted is ever deleted.
- *Proposed, not built:* the Platform page's language pipeline (topic modelling, sentiment analysis, entity recognition) and its IACI confidence intervals. Hiding who wrote a row is reversed by design: every contributed row carries its contributor's GitHub login.

### Belief stability confidence score

> Measures how stable a belief's score is over time based on:
> - Depth of analysis.
> - Unresolved sub-arguments.
> - Stability across repeated evaluations.
>
> A belief with **thousands of hours of stable analysis** carries more weight than one quickly assessed.

**Status: replaced by structural confidence; "over time" is recorded but turned into no number.** Read [[Confidence Stability Scores]], and the method page on [confidence](https://myklob.github.io/ideastockexchange/beliefs/method.html#confidence).

- *Published site* ([`confidence.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/confidence.py)). Confidence is computed from one snapshot of how much work stands behind a page, with weights grounding 0.30, two_sided 0.20 (1.0 if both sides are argued, 0.35 if one, 0 if none), scrutiny 0.20 (share of link, importance and uniqueness slots with an argued page), breadth 0.15 (`saturate(rows + predictions, 6)`), depth 0.05 (`saturate(levels below, 3)`), sourcing 0.05 and testability 0.05, renormalised over the parts a page can carry, where `saturate(n, half) = n / (n + half)`. Bands: established 0.75, developing 0.45, early 0.15. Confidence multiplies a row's contribution and never caps truth: at confidence 0 a claim moves its parent not at all, however true it looks.
- *Next.js app* (`all-scores.ts`). `stabilityScore = min(1, argumentCount / 10) × (0.4 + 0.6 × |pro − con| / (pro + con))`, robust at 0.75, established 0.50, developing 0.25, else fragile. It is stored and displayed and multiplies nothing.
- *Stability across repeated evaluations.* The seven behavioural signals (up and down votes, weekly visitors, dwell time, edit frequency, duplicate submission attempts, evaluation responses, score variance over time) carry weight 0 and read "no data", because "there is one snapshot and no user". A per-belief score history exists in the app ([`/api/beliefs/[id]/history`](https://github.com/myklob/ideastockexchange/blob/master/src/app/api/beliefs/%5Bid%5D/history/route.ts)) and the site's `changes.py` reports what moved since the last revision; neither feeds a number yet. The Next.js engagement firewall test keeps engagement out of ranking.
- *"Thousands of hours."* Hours are not measured; work is. Weight follows confidence, the work queue ranks pages by `rank × (1 − confidence)`, and the sensitivity sweep separates what moves a conclusion now from what would move it once settled.

## Rules the old pages state that the site does not run

Older wiki pages and `docs/ALGORITHMS.md` describe more rules than the published site applies. The method page lists each one with what runs instead, under [Rules in the wiki this site does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun), so nobody mistakes a published number for the output of a rule that was never applied. The sixteen, by name:

| Rule in the old pages | What the published site runs instead |
|---|---|
| Conclusion score divided by depth and by the number of arguments | No division; a row passes its page's truth, gated by confidence |
| Evidence quality from four ratings (internal validity, statistical soundness, replicability, bias resistance) | Source type, replications and agreement set where a finding starts |
| Evidence start values by kind (meta-analysis 1.0, peer-reviewed 0.8, anecdote 0.1) | The evidence tiers, keeping every start between 0.05 and 0.95 |
| Truth on a scale from −1 to +1 | Truth from 0 to 1; −1 to +1 appears only inside a row as `2 × Truth − 1` |
| Logical validity from weighted fallacy deductions | Not computed; structural checks and fallacy flags move no score |
| Topic overlap and TopicRank | Each belief filed under one topic by an author |
| ReasonRank restarting evenly across every argument | The walk restarts at the beliefs only |
| Importance from scope, magnitude, reversibility and urgency | An importance page: largest validity × bears among its interests |
| Uniqueness computed as one minus the highest similarity | Presumed distinct until a uniqueness page is argued |
| Equivalency as a blend of computed and argued halves | The argued equivalence page alone |
| Lifecycle multipliers (active 1.0, weakened 0.7, conditional 0.8, outdated 0.3, refuted 0.1) | None; a row argued false scores below zero |
| Only the first of several rows making one point counts, plus a corroboration boost | A uniqueness factor per row; replication rewarded up to twice k |
| Linkage as the agree share of all argued strength | That share shrunk toward the page's starting point |
| Likelihood as the winning estimate among competing ones | The truth score of the cost or benefit's own page |
| A necessity score argued for each assumption | A typed load-bearing flag |
| Behavioural confidence signals | Weight zero |

## The vision

> By combining **crowdsourced reasoning** with structured scoring systems, we aim to:
> - Make arguments **searchable, comparable, and ranked**.
> - Show the **strongest and weakest points** for any belief.
> - Foster productive, respectful, evidence-based debate.

What exists for each, today:

- **Searchable, comparable, ranked.** The [home page](https://myklob.github.io/ideastockexchange/beliefs/index.html) has a "Find a claim" search over `data/pages_index.json`. Every ranking is explained on [lists.html](https://myklob.github.io/ideastockexchange/beliefs/lists.html): what it shows, how it is worked out and why it is tracked, including [who has a stake](https://myklob.github.io/ideastockexchange/beliefs/lists.html#stake), [topics](https://myklob.github.io/ideastockexchange/beliefs/lists.html#topics) and [works](https://myklob.github.io/ideastockexchange/beliefs/lists.html#works); topics are browsable at [topics.html](https://myklob.github.io/ideastockexchange/beliefs/topics.html). Complete beliefs rank first, then by belief score, scored rows and confidence. Every page's numbers are also published as JSON (`p/<key>.json`) and in JSON, XML, SQL and SQLite exports, so anyone can recompute them; [the data section](https://myklob.github.io/ideastockexchange/beliefs/method.html#data) says how. In the Next.js app: `/beliefs`, `/leverage` and `/media`.
- **Strongest and weakest points.** Every table is ranked strongest first on its own side (Rule 8 in [`docs/BELIEF_PAGE_RULES.md`](https://github.com/myklob/ideastockexchange/blob/master/docs/BELIEF_PAGE_RULES.md)), with the top rows shown and the rest collapsed. Each belief names its strongest reason for and against, the sensitivity sweep names the one input that would flip it, and the structural checks name what to go and look at.
- **Crowdsourced, without a server.** Every table on a belief page carries a form that opens a prefilled GitHub issue, and so do the propose-a-belief forms. [`contribute.js`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/contribute.js) checks what you type against `data/claims_index.json`, so a duplicate becomes a vote for the claim already there; [`intake.py`](https://github.com/myklob/ideastockexchange/blob/master/tools/static-site/intake.py) repeats the check, records a vote in `content/votes.csv` or opens a pull request. Crowd input enters as rows to be argued, never as weight. Votes appear after the score badge, and once anyone has voted the [votes list](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes) ranks the gap between what people vote and what the analysis says, which is where people most need more time with the argument.
- **Where better arguments rise and weaker ones fall.** On the published site truth enters as `2 × Truth − 1`, so a refuted reason to agree counts against the belief and a refuted objection counts for it. In the Next.js app a refuted argument's impact falls toward zero but never changes sides.

What the site will not claim, it says on the method page under [limits](https://myklob.github.io/ideastockexchange/beliefs/method.html#limits) and [labelled constants](https://myklob.github.io/ideastockexchange/beliefs/method.html#constants).

> **Join us** in building the internet's "truth infrastructure", where better arguments rise, weaker ones fall, and decisions are made with clarity.

## A note on an older page with this name

The repository once held a different `docs/wiki/Home.md` describing a React, Express and MongoDB stack the project does not have, with a "Conclusion Score CS = sum((RtA − RtD) × ES × LC × VC × LR × UD × AI)" and "Credibility = 50 + verifiedCount × 10 − disputedCount × 10". It is archived under `_archive/wiki-2026-10/dev-docs/Home.md` as a historical document. Nothing runs it; do not sync it over this page.
