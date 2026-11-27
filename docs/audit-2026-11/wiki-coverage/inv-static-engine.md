# Inventory: the static site's scoring and analysis engine against the wiki

Area: `tools/static-site/` score_reference.py, evidence.py, confidence.py, sensitivity.py, reasonrank.py, tally.py,
similarity.py, integrity.py, fallacy.py, publish.py, predictions.py, conformance.py and conformance/, and the
guarantees table in `tools/static-site/README.md` (lines 47 to 77).

"Live wiki" means the 13 pages at github.com/myklob/ideastockexchange/wiki (unchanged since 2025-08-09). "Draft"
means `docs/wiki/` (October 2026). Each "No" was checked by grep of the live text under several names (for example
`2T`, `-1 to +1`, `neutral`, `coin`, `prior`, `start` for the starting point; `predict`, `falsif`, `deadline` for
predictions; `draft`, `publish`, `complete` for the publish bar; `circular`, `cycle`, `loop`, `begging` for the
structural checks; `sensitiv`, `flip`, `what would change` for sensitivity).

Paths are relative to `tools/static-site/` unless they start with `site/` (the fresh build) or `.github/`.

## Feature table

### The scoring rule (score_reference.py)

| Feature | Where | Wired? | Live wiki explains it? | Explained correctly? | docs/wiki draft covers it? | Priority |
|---|---|---|---|---|---|---|
| Signed row contribution: sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq, one formula for reasons, findings and predictions | score_reference.py:160-174; site/method.html#formula | published site | ReasonRank (Argument Ranking Algorithm); Evidence-to-Conclusion-Relevance-Score (Algorithm step 6) | Contradicts: ReasonRank ranks an argument by (pro_votes - con_votes) / total x evidence_strength; ECLS multiplies "truth/relevance" by linkage. Neither has the sign, the (2 x Truth - 1), confidence or importance, and the site reads no votes | Truth-Score.md ("One formula for every row"); Argument-Scores-from-Sub-Argument-Scores.md | High |
| An unargued claim contributes exactly 0, so every unsourced argument graph reads 0.50 forever (the neutral fixed point) | score_reference.py:163-166; evidence.py:6-19; test_engines.py:43 | published site | No | n/a | Argument-Scores-from-Sub-Argument-Scores.md ("by induction, everything reads 0.50"); Truth-Score.md; Evidence-based-policy.md | High |
| Argued page truth = (POS + w x p0) / (POS + NEG + w); a row lands on the side its sign puts it on, so a refuted objection counts as support | score_reference.py:152-155, 190-196, 265-268; conformance.py rules 4-5 | published site | Truth-Score; Evidence-to-Conclusion-Relevance-Score (formula) | Contradicts: Truth-Score says a truth score integrates a Logical Fallacy Score and the EVS; the site uses neither. ECLS gives agree / total with no starting vote, and 0 when nothing is argued | Truth-Score.md ("From rows to a page's truth") | High |
| Load-bearing cap: truth = min(argued, weakest load-bearing component with its own page); a premise with no page caps nothing | score_reference.py:269-270; conformance.py rule 6; `capped_by` in site/p/*.json | published site | No (Evidence-based-policy 1.1 says only "strong, interconnected assumptions") | n/a | Assumptions.md; Evidence-based-policy.md ("a cap, not a weight"); Truth-Score.md | High |
| Belief score = POS - NEG, open ended; the ranking on best.html | score_reference.py:271; site/best.html | published site | ReasonRank (Belief Score) | Outdated: lists truth, linkage, equivalency scores, logical fallacy penalties and evidence verification as inputs; the site's is weight for minus weight against, with no fallacy or equivalency term | ReasonRank.md ("What the Belief Score is, numerically") | High |
| A claim listed twice on a page and side counts once, at its strongest reading, in whichever section it sits | score_reference.py:176-188; conformance.py rule 4 | published site | No (Home, Evidence-based-policy 1.2 and Media mention de-duplication only as uniqueness) | n/a | Pros-and-Cons-on-the-Same-Page.md; Evidence-Verification-Score-(EVS).md | High |
| Labelled constants for a multiplier with no page: UNARG 0.5, DEFLINK 1, DEFIMP 0.5, DEFUNIQ 1, shown in grey | score_reference.py:34; site/method.html#constants | published site | No | n/a | Linkage-Scores.md; ReasonRank.md | High |
| Importance page = max over listed interests of Validity x Bears (Bears = bearing page, else DEFLINK) | score_reference.py:246-249; conformance.py rule 7 | published site | Home (Impact Algorithm) | Contradicts: Home defines the Argument Importance Score as how much a belief depends on an argument and links it to Confidence-Stability-Scores, which never mentions it; the site's importance is an argued page reading the strongest valid interest the row addresses | Likely-Interests-of-Those-Who-Agree-and-Disagree.md:434-437; Evidence-based-policy.md | High |
| Media page: quality from its argument table, impact from its impact table, each by the page-truth rule | score_reference.py:255-257; conformance.py rule 8 | published site | Media | Contradicts: Media gives Impact Score = Sales x Engagement x UGC x Citation x Viewership x Validity x Linkage x Unique; the site computes impact from argued impact rows | Media.md | Medium |
| Circular support is refused by name (CircularSupport) instead of scored | score_reference.py:120-123, 241-242; test_engines.py:325 | published site (build stops) | No | n/a | Argument-Scores-from-Sub-Argument-Scores.md; Belief-Web-Navigation.md | Medium |
| A chain of any length is scored without recursion (explicit-stack warm-up) | score_reference.py:218-231; test_engines.py:333 | published site | No | n/a | No | Low |
| `python3 score_reference.py <json>` prints every page's truth and belief score | score_reference.py:275-280 | maintainer CLI | No | n/a | No | Low |

### Where a page starts (evidence.py)

| Feature | Where | Wired? | Live wiki explains it? | Explained correctly? | docs/wiki draft covers it? | Priority |
|---|---|---|---|---|---|---|
| Evidence starting point: p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1), weight w = k x replication(ERQ); "Starts at" column of every Evidence Ledger | evidence.py:144-157; score_reference.py:156-159; site/method.html#starts | published site | Evidence-Verification-Score-(EVS) | Outdated: EVS is defined only as a summed score for a belief; the wiki never says a finding's tier and replications set where the finding's own page starts, which is the only thing that lets any score leave 0.50 | Evidence-Verification-Score-(EVS).md ("The published site: a starting point"); Truth-Score.md | High |
| ESIW tier weights (the wiki's sixteen ranks) | evidence.py:79-98 | published site | Evidence-Verification-Score-(EVS) 2.1 | Yes (every weight matches) | Evidence-Verification-Score-(EVS).md | High |
| Tier departures: rank 2 split into rct 0.85 and meta 0.80; added `record` tier 0.90; no type named = ESIW 0; tier typed in `etype`, not debated | evidence.py:61-70, 81-83, 99 | published site | Evidence-Verification-Score-(EVS) 2.1 | Outdated: one band 0.85-0.80 for two things, no primary-record tier, and "the category choice is debated in pro/con form with voting", which is not built | Evidence-Verification-Score-(EVS).md ("proposed, not built") | Medium |
| ERQ and ERP as inputs (independent replications; share consistent) | evidence.py:23-25, 134-140 | published site | Evidence-Verification-Score-(EVS) 2.2-2.3 | Yes | Evidence-Verification-Score-(EVS).md | Medium |
| Replication is bounded: replication(n) = 2n / (n + 1), at most 2 x k | evidence.py:101, 109-113 | published site | Evidence-Verification-Score-(EVS) 3 | Contradicts: EVS multiplies by ERQ with no bound; the truth score caps it at 2 x k (only tally.py uses it uncapped, per the owner's direction) | Evidence-Verification-Score-(EVS).md | High |
| Three input coercions: etype normalised, ERQ below 1 reads 1, ERP held in 0-100 | evidence.py:124-141; conformance.py rule 1 (pages 17-21) | published site | No | n/a | Evidence-Verification-Score-(EVS).md ("same three coercions") | Low |
| Overall EVS printed in the EVS column and under each Evidence Ledger, read by no score | evidence.py:160-164; site/method.html#evs | published site | Evidence-Verification-Score-(EVS) 3 | Outdated: the formula is right (ECRS = the row's linkage reading), but the wiki presents it as what ranks beliefs; on the site it decides nothing | Evidence-Verification-Score-(EVS).md ("computed, printed, read by nothing") | Medium |
| An empty linkage or uniqueness page starts at DEFLINK / DEFUNIQ (1.00), so opening one moves nothing (FACTOR_START) | evidence.py:103-106, 155-156; test_invariants.py:175 | published site | Evidence-to-Conclusion-Relevance-Score | Contradicts: the wiki's sample returns ECLS 0 when a linkage has no reasons | Outdated in drafts: Linkage-Scores.md:227 and :361 and Evidence-to-Conclusion-Relevance-Score.md:111 still say an opened empty linkage page reads 0.50 and list it as an open decision | High |
| Starting-point label with its working ("tier weight 0.90; starting point 0.5 + ... = 0.95") on every finding | evidence.py:167-190 | published site | No | n/a | Evidence-Verification-Score-(EVS).md | Low |

### How much a score counts (confidence.py)

| Feature | Where | Wired? | Live wiki explains it? | Explained correctly? | docs/wiki draft covers it? | Priority |
|---|---|---|---|---|---|---|
| Confidence: seven structural components (grounding 0.30, two-sided 0.20, scrutiny 0.20, breadth 0.15, depth 0.05, sourcing 0.05, testability 0.05), renormalised over those that apply; it gates a row's contribution, never caps truth | confidence.py:30-38, 69-133; Confidence column and "Confidence 40%. Weakest parts" line on each page | published site | Confidence-Stability-Scores; Home (Belief Stability Confidence Score) | Contradicts: the wiki computes BSS/ESS from vote ratios, weekly visitors, dwell time, PageRank and the standard deviation of scores over time; the site measures the work done on the page's structure | Confidence-Stability-Scores.md; detail Outdated: it says scrutiny counts slots that "name a page of their own" and testability needs a linkage page to exist, but `_worked` (confidence.py:62-67, 101-102, 124) counts only pages with a reason or interest on them | High |
| Confidence bands: established 0.75, developing 0.45, early 0.15, else unstarted | confidence.py:48, 145-148 | published site | No | n/a | Confidence-Stability-Scores.md ("Bands") | Medium |
| Behavioural signals (votes, visitors, dwell, edits, duplicate attempts, evaluations, variance) reported as "no data" at weight 0 | confidence.py:15-20, 39-40; site/method.html#confidence | published site | Confidence-Stability-Scores (factor list) | Outdated: lists them as live inputs; none is collected and none is scored | Confidence-Stability-Scores.md ("The 2025 factor list, each with its status") | Medium |
| TableCorpus: confidence from the two flat tables, for database ports | confidence.py:156-199 | maintainer (ports) | No | n/a | No | Low |

### What would change the answer (sensitivity.py)

| Feature | Where | Wired? | Live wiki explains it? | Explained correctly? | docs/wiki draft covers it? | Priority |
|---|---|---|---|---|---|---|
| "What Would Change the Answer" section: each input beneath a belief pinned false then true, with "Move" (today) and "If settled" (confidence held at 1) columns and a verdict per input | sensitivity.py:118-135, 170-225; render_site.py:654; `sensitivity` in site/p/*.json | published site | No | n/a | Pros-and-Cons-on-the-Same-Page.md ("What would change the answer"); Truth-Score.md | High |
| Flip point found by bisection (where a page crosses 0.50) | sensitivity.py:37-39, 136-147 | published site | No | n/a | ReasonRank.md; Truth-Score.md | Medium |
| Joint worst case: the three widest inputs moved against the belief at once | sensitivity.py:149-160, 215-217 | published site | No | n/a | No | Medium |
| Coverage disclosed: sweep depth 6, count of pages deeper, inputs below INERT 0.005 marked inert | sensitivity.py:40-43, 162-167 | published site | No | n/a | Automated-Conflict-Resolution-Platform.md (DEPTH = 6) | Low |
| One-sentence headline naming what the conclusion rests on ("That is the work queue") | sensitivity.py:227-260 | published site | No | n/a | Partly, in Pros-and-Cons-on-the-Same-Page.md | Low |

### How much depends on a claim (reasonrank.py)

| Feature | Where | Wired? | Live wiki explains it? | Explained correctly? | docs/wiki draft covers it? | Priority |
|---|---|---|---|---|---|---|
| ReasonRank as a damped walk from the beliefs (d = 0.85), stepping by row capacity Link x Imp x Uniq; deliberately ignores truth and confidence; changes no truth score; "Relied on" line on each page | reasonrank.py:1-60, 75-128; `reasonrank` in site/p/*.json | published site | ReasonRank: Google's PageRank for Arguments; Home | Contradicts: the wiki's ReasonRank iterates pro/con adjacency matrices to produce argument strength, with vote feedback, TF-IDF uniqueness and spaCy sentiment; the site's measures dependence, not validity. Only the damping 0.85 matches | ReasonRank:-Google's-PageRank-for-Arguments.md ("Part two: the walk") | High |
| Most relied on list | render_site.py:2980; site/relied.html | published site | No | n/a | Belief-Web-Navigation.md; ReasonRank:-Google's-PageRank-for-Arguments.md | Medium |
| Work value = rank x (1 - confidence) and the "What to argue next" queue | reasonrank.py:36-45, 162-183; render_site.py:2984, 3047; site/next.html | published site | No | n/a | ReasonRank:-Google's-PageRank-for-Arguments.md ("the work queue") | High |

### The owner's count-every-reason rule (tally.py)

| Feature | Where | Wired? | Live wiki explains it? | Explained correctly? | docs/wiki draft covers it? | Priority |
|---|---|---|---|---|---|---|
| "Counting every reason until it is argued down": weight = Truth x Link x Imp x Uniq, no (2 x Truth - 1), no confidence gate, share around the same p0 and w; printed beside the truth score, read by no other number | tally.py:1-66; render_site.py:770, 1097; `counting_every_reason` in site/p/*.json; site/method.html#tally | published site | No (ReasonRank: Google's PageRank says only "weigh arguments by quantity and quality") | n/a | Truth-Score.md; Evidence-Verification-Score-(EVS).md; ReasonRank.md | High |
| Uncapped finding strength: a finding weighs x (1 + ESIW x ERQ x ERP/100) | tally.py:30-34 | published site | Evidence-Verification-Score-(EVS) 3 (the product) | Outdated: the product is there, but not its use as an uncapped multiplier on a finding, which is the owner's stated preference | Evidence-Verification-Score-(EVS).md ("The owner's starting rule") | Medium |
| Independent reasons on a side = sum of Uniqueness over its reasons | tally.py:13-14, 48-59 | published site | No | n/a | Evidence-Verification-Score-(EVS).md; ReasonRank.md | Medium |
| "Where the two rules disagree" page comparing the two rules belief by belief | render_site.py:2735, 3072; site/compare.html | published site | No | n/a | No (no draft names the page) | High |

### Computed equivalency (similarity.py)

| Feature | Where | Wired? | Live wiki explains it? | Explained correctly? | docs/wiki draft covers it? | Priority |
|---|---|---|---|---|---|---|
| Duplicate detector (CES): IDF-weighted Jaccard of content words averaged with cosine over character 4-grams; FLAG 0.45, MERGE 0.70; flags pairs, moves no score (w_ces = 0 until a VCA page argues it) | similarity.py:1-60, 201-260; structural check "Rows that may be the same point twice"; site/grouping.html | published site | Equivalency-Score; Home (Redundancy Reduction) | Contradicts: the wiki's CES is spaCy vectors and machine learning, blended with UES into ES by VCA weights; the site's is lexical and carries weight zero | Equivalency-Score:.md ("What runs on the published site"); The-Redundancy-Problem.md | High |
| Opposite-meaning guard: a denial, a reversed comparison or a swapped antonym is never merged into a vote for the other claim | similarity.py:65-200 (negated, reverses, substitutes); used by intake.py and outline_file.py | published site (contribution path) | No | n/a | Equivalency-Score:.md | Medium |
| A near-identical submission (MERGE) becomes a vote for the claim already there; a close one (FLAG) is shown with agree and disagree links | similarity.MERGE / FLAG; README.md:288-293 | published site (contribution path) | No | n/a | The-Redundancy-Problem.md; Equivalency-Score:.md | Medium |
| UES is the equivalence page, argued like any page; votes do not enter it | score_reference.py:35 (SPECIAL 'equivalence'); similarity.py:12-13 | published site | Equivalency-Score (UES) | Outdated: the wiki builds UES from reasons plus up and down votes; on the site votes never move it | Equivalency-Score:.md ("The argued half: UES") | Medium |

### Structural checks (integrity.py)

| Feature | Where | Wired? | Live wiki explains it? | Explained correctly? | docs/wiki draft covers it? | Priority |
|---|---|---|---|---|---|---|
| Structural Checks panel: nine checks in three severities (circular support; assumes its own conclusion, equivalence 0.90 or more; same page twice; possible duplicate rows; rests only on authority; evidence filed above its premise; single-figure costs; no prediction; one-sided); none changes a score | integrity.py:36-49, 141-230; render_site.py:1129; `checks` in site/p/*.json; site/method.html#checks | published site | No (Truth-Score covers fallacy scoring, which the site refuses) | n/a | Truth-Score.md ("structural checks, and why no deductions"); Template:-Belief-Analysis.md | High |
| "Evidence filed above the premise it bears on": why beliefs that cite findings still read 0.50 (open decision 2) | integrity.py:46 | published site | No | n/a | Evidence-Verification-Score-(EVS).md; Truth-Score.md | High |
| "Costs and benefits given as single figures": a priced row with no mag_low / mag_high (open decision 3) | integrity.py:47 | published site | No | n/a | Likelihood-of-Costs-and-Benefits.md | Medium |
| Pre-publish cycle gate: `python3 integrity.py content/` exits non-zero and names the loop; runs in CI first | integrity.py:266-321; .github/workflows/check.yml:38; pages.yml:55 | CI | No | n/a | Argument-Scores-from-Sub-Argument-Scores.md; Belief-Web-Navigation.md | Medium |

### Possible fallacies (fallacy.py)

| Feature | Where | Wired? | Live wiki explains it? | Explained correctly? | docs/wiki draft covers it? | Priority |
|---|---|---|---|---|---|---|
| Fallacy flags: nine named patterns from a published phrase list, shown as a question with the words that set them off, with forms on the flagged claim's page to argue it is or is not the fallacy; reasons and objections only; a flag moves no score | fallacy.py:1-68; render_site.py:1129-1135; `possible_fallacies` in site/p/*.json | published site | Truth-Score; Quantifying Reason: The Power of Truth Scores | Contradicts: the wiki aggregates a Logical Fallacy Score that "adjusts overall Belief Scores by reducing weight for fallacious reasoning", via spaCy and ML; its four fallacies include red herring, which the site has no pattern for. Its steps 2-3 (flag, then argue for and against) do match | Truth-Score.md ("a flag is a question"); Quantifying-Reason:-The-Power-of-Truth-Scores.md | High |
| `python3 fallacy.py content/` lists every flag, most common pattern first | fallacy.py:71-82 | maintainer CLI | No | n/a | No | Low |

### What is published (publish.py)

| Feature | Where | Wired? | Live wiki explains it? | Explained correctly? | docs/wiki draft covers it? | Priority |
|---|---|---|---|---|---|---|
| Completeness bar CORE_BAR: reasons both ways, evidence, objective criteria, predictions or a falsifiability test, costs and benefits, interests; "Complete yes/no" line on each belief | publish.py:13-27; render_site.py:1301 | published site | No | n/a | ReasonRank.md ("What a published belief must have"); Pros-and-Cons-on-the-Same-Page.md | High |
| Every belief published; drafts marked "draft", saying what they still need, ranked after complete ones, listed in data/drafts.json (154 today) | render_site.py:4525-4597; site/data/drafts.json | published site | No | n/a | Evidence-based-policy.md; ReasonRank.md; Pros-and-Cons-on-the-Same-Page.md ("ranked rather than gated") | High |
| `--complete-only` gated build: complete beliefs and the pages beneath them; a row pointing at a draft keeps its words but not its link | publish.py:30-89; render_site.py:4631 | maintainer CLI | No | n/a | Evidence-based-policy.md | Low |

### Predictions (predictions.py)

| Feature | Where | Wired? | Live wiki explains it? | Explained correctly? | docs/wiki draft covers it? | Priority |
|---|---|---|---|---|---|---|
| Predictions tracker: every prediction sorted into overdue, due within 90 days, settled, later and undated, with a form to record what happened; "today" is the build revision's date | predictions.py:18-104; site/predictions.html; home card render_site.py:2991 | published site | No (the word "predict" is on no live page) | n/a | Pros-and-Cons-on-the-Same-Page.md:405 | High |
| Recording an outcome files a finding on the prediction's page; "came true" at truth 0.55 or more, "did not" at 0.45 or less; supports or undercuts the belief by side | predictions.py:5-11, 20, 87-111 | published site | No | n/a | Pros-and-Cons-on-the-Same-Page.md | Medium |
| Deadline reading: "By <when>; checked against <how>", a month or quarter to its last day, "now" to the build date | predictions.py:37-66 | published site | No | n/a | No | Low |

### Conformance (conformance.py, conformance/)

| Feature | Where | Wired? | Live wiki explains it? | Explained correctly? | docs/wiki draft covers it? | Priority |
|---|---|---|---|---|---|---|
| The cross-implementation contract: eight rules, five constants, eighteen tiers, compare to 1e-9 | conformance.py:1-75; conformance/corpus.json, expected.json | CI | No | n/a | Evidence-based-policy.md; ReasonRank.md; Evidence-Verification-Score-(EVS).md | Medium |
| `conformance.py` / `--check` / `--write` / `--print`; a rule change arrives as a reviewed diff | conformance.py:220-275; .github/workflows/check.yml:46; pages.yml:72 | CI and maintainer CLI | No | n/a | Evidence-based-policy.md | Medium |
| Contract files published beside the site for any port | site/data/conformance_corpus.json, conformance_expected.json | published site | No | n/a | Evidence-based-policy.md | Low |

### Publishing the analysis as data

| Feature | Where | Wired? | Live wiki explains it? | Explained correctly? | docs/wiki draft covers it? | Priority |
|---|---|---|---|---|---|---|
| Every page's numbers as p/<key>.json, indexed at data/pages_index.json: truth, argued truth, confidence, starts_at, reasonrank, work_value, checks, capped_by, sensitivity, counting_every_reason, possible_fallacies, complete | render_site.py:4600; site/p/*.json | published site | No | n/a | Evidence-based-policy.md; Home.md | Medium |

### The guarantees (README.md:47-77), each a feature

| Feature | Where | Wired? | Live wiki explains it? | Explained correctly? | docs/wiki draft covers it? | Priority |
|---|---|---|---|---|---|---|
| The guarantees list itself, each guarantee with the test that pins it | README.md:47-71 | maintainer | No | n/a | No (no draft collects them) | Medium |
| A reason nobody has argued adds exactly 0 | test_engines.py:43 | published site | No | n/a | Argument-Scores-from-Sub-Argument-Scores.md | High |
| Only evidence moves a page off its start | test_engines.py:43 | published site | ReasonRank (Guiding Principles) | Outdated: states the aim ("tie the strength of a conclusion to the strength of the evidence"), not the rule that argument alone can never move a score | Argument-Scores-from-Sub-Argument-Scores.md; Evidence-based-policy.md | High |
| Truth stays in 0 to 1; a row adds at most 1 | test_scoring.py:60, 120 | published site | No | n/a | ReasonRank.md; Pros-and-Cons-on-the-Same-Page.md | Medium |
| No number is NaN or infinite | test_invariants.py:114 | published site | No | n/a | No | Low |
| A circular argument is refused, not scored | test_engines.py:325 | published site | No | n/a | Argument-Scores-from-Sub-Argument-Scores.md | Medium |
| The scorer walks a chain of any length | test_engines.py:333 | published site | No | n/a | No | Low |
| The order rows are stored in changes nothing | test_invariants.py:81 | published site | No | n/a | No | Medium |
| A claim listed twice on a page counts once | test_invariants.py:52 | published site | No | n/a | Pros-and-Cons-on-the-Same-Page.md; Evidence-Verification-Score-(EVS).md | High |
| The same tables give the same site, byte for byte | test_invariants.py:148 | published site | No | n/a | No | Medium |
| Who added a row moves nothing | test_invariants.py:208 | published site | No | n/a | No | Medium |
| Opening an empty linkage page moves no score | test_invariants.py:175 | published site | Evidence-to-Conclusion-Relevance-Score | Contradicts: an unargued linkage reads 0 there | Outdated in Linkage-Scores.md and Evidence-to-Conclusion-Relevance-Score.md (still 0.50) | High |
| A row's kind of post (its tag) moves nothing | README.md:64; test_vocab.py | published site | No | n/a | No | Low |
| A claim that reads alike but says the opposite is never counted as a vote for the other | test_intake.py, test_outline_file.py | published site | No | n/a | Equivalency-Score:.md | Medium |
| A vote moves nothing | test_render.py:2505 | published site | ReasonRank; ReasonRank: Google's PageRank; Equivalency-Score; Confidence-Stability-Scores | Contradicts: all four make votes an input (vote share ranks arguments, `feedback_data` scales scores, votes build UES, vote ratios feed stability) | Truth-Score.md ("Votes are shown and never scored"); Confidence-Stability-Scores.md; ReasonRank.md | High |
| A fallacy flag moves nothing | test_fallacy.py:41 | published site | Truth-Score; Quantifying Reason | Contradicts: fallacies reduce the belief score there | Truth-Score.md | High |
| A computed similarity moves nothing | test_similarity.py:91 | published site | Equivalency-Score | Contradicts: CES is weighted into ES there | Equivalency-Score:.md | High |
| The second strength rule moves nothing else | test_tally.py:81 | published site | No | n/a | Truth-Score.md; Evidence-Verification-Score-(EVS).md | Medium |
| Every port gives the same numbers | conformance.py, run in CI | CI | No | n/a | Evidence-based-policy.md; ReasonRank.md | Medium |
| Not promised: near-duplicates count twice until a uniqueness page argues the overlap; agreeing replications are not duplicates | README.md:73-77 | published site | Evidence-based-policy 1.2; Media; Electronic-Democracy | Outdated: "uniqueness scores (avoiding double-counting)" reads as automatic; on the site uniqueness is presumed 1 until argued | The-Redundancy-Problem.md ("Reinforcement vs. Repetition") | Medium |

Totals: 77 rows. The live wiki addresses 25 of them: 2 correctly (the ESIW weights, and ERQ / ERP as inputs),
9 outdated, 14 contradicted. 52 are not on the live wiki at all. 63 are covered by some docs/wiki draft; 3 drafts
are outdated on one point (Linkage-Scores.md, Evidence-to-Conclusion-Relevance-Score.md on FACTOR_START;
Confidence-Stability-Scores.md on what counts as a worked multiplier).

### Side findings (not wiki gaps, but the same kind of drift)

- `site/method.html#notrun` ("Rules in the wiki this site does not run") attributes four rules to wiki pages the
  13-page live wiki does not contain: evidence start values by kind (meta-analysis 1.0, peer-reviewed 0.8,
  anecdote 0.1) to "wiki: ReasonRank"; a truth score on -1 to +1 to "wiki: Truth Score"; lifecycle multipliers to
  "wiki: Scoring System"; first-row-counts plus a corroboration boost to "wiki: Redundancy Problem". evidence.py:15-19
  makes the same ReasonRank claim. A reader following "the wiki" from the method page will not find them.
- Code docstrings cite docs/wiki files that do not exist under those names: `docs/wiki/Algorithms.md`
  (integrity.py:3; the file is `docs/ALGORITHMS.md`), `docs/wiki/Equivalency-Score.md` and
  `docs/wiki/Redundancy-Problem.md` (similarity.py:3; the files are `Equivalency-Score:.md` and
  `The-Redundancy-Problem.md`).
- publish.py:3-8 still says a belief is published only when it meets the bar and drafts stay out; since the owner's
  standing rule, every belief is published and the gate applies only to `--complete-only`.
- evidence.py:61 says "the sixteen rows of ESIW" while the dict holds eighteen keys (sixteen ranks, rank 2 split, plus
  `record`); conformance.py and the README say eighteen.

## Wiki gaps

- [ ] **Rewrite Truth Score around the rule that runs** (correct Truth-Score; correct Quantifying Reason). Say a truth score is (POS + w x p0) / (POS + NEG + w) over rows each worth sign x (2 x Truth - 1) x Confidence x Link x Imp x Uniq (score_reference.py:152-174), capped by the weakest load-bearing premise that has a page (:269-270), with no fallacy term; state the neutral fixed point (an unargued claim adds exactly 0, so an unsourced graph reads 0.50 forever, test_engines.py:43) and that a claim listed twice counts once at its strongest reading (:176-188). Draft: docs/wiki/Truth-Score.md.
- [ ] **Explain where a page starts, and keep the EVS sum as a printed number** (correct Evidence-Verification-Score-(EVS)). Add p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1) and w = k x 2 x ERQ / (ERQ + 1), bounded at 2 x k (evidence.py:109-157); record the rct/meta split, the added `record` tier and the no-type = 0 rule (:61-99); say the summed EVS is shown in every ledger and read by no score (:160-164), and that the owner's tally rule uses the same product uncapped (tally.py:30-34). Draft: docs/wiki/Evidence-Verification-Score-(EVS).md.
- [ ] **Correct the empty-linkage rule** (correct Evidence-to-Conclusion-Relevance-Score). Say a row with no linkage page reads DEFLINK 1 and an opened linkage page that cites nothing starts at 1.00 too, so a challenge moves nothing until argued (evidence.py:103-106; test_invariants.py:175), not 0 as the sample code returns. Fix docs/wiki/Linkage-Scores.md:227, :361 and Evidence-to-Conclusion-Relevance-Score.md:111 first, which still say 0.50.
- [ ] **Replace the stability page with the confidence that runs** (correct Confidence-Stability-Scores; correct Home "Belief Stability Confidence Score"). Give the seven structural components and weights, the renormalisation and the four bands (confidence.py:30-48, 69-148); say confidence gates a row's contribution and never caps truth; say the behavioural signals are reported as "no data" at weight 0 (:15-20). Fix the draft's scrutiny and testability wording to "a page with something argued on it" (:62-67).
- [ ] **Split ReasonRank into the scoring rule and the dependence walk** (correct ReasonRank: Google's PageRank for Arguments; correct ReasonRank). Say the site's ReasonRank is a damped walk (0.85) from the beliefs stepping by Link x Imp x Uniq that ranks how much depends on a claim, ignores truth and confidence and moves no score (reasonrank.py:1-60); add work value = rank x (1 - confidence) and the Most relied on and What to argue next lists (relied.html, next.html). Remove votes, TF-IDF uniqueness and sentiment as live inputs, and restate the Belief Score as POS - NEG (score_reference.py:271). Draft: docs/wiki/ReasonRank:-Google's-PageRank-for-Arguments.md, ReasonRank.md.
- [ ] **Add a "Votes and flags never score" section to Home** (add to Home; correct ReasonRank, Equivalency-Score, Confidence-Stability-Scores). State the four "moves nothing" guarantees, votes, fallacy flags, computed similarity and the second strength rule (README.md:67-70), each with its test, because four live pages say the opposite for votes.
- [ ] **Rewrite fallacy detection as a flag that is argued** (correct Truth-Score "Algorithm Outline" and Quantifying Reason "Role in the Larger System"). Name the nine published patterns (fallacy.py:22-44), say each flag is a question showing the words that set it off with forms on the flagged claim's page, and that it reduces no score (test_fallacy.py:41); keep steps 2-3 of the outline, drop step 7's aggregation and the score adjustment.
- [ ] **Correct the computed half of the Equivalency Score** (correct Equivalency-Score; add to Home "Redundancy Reduction"). Say CES is lexical (IDF-weighted word Jaccard plus character 4-gram cosine, FLAG 0.45, MERGE 0.70) and carries weight 0 until a VCA page argues it (similarity.py:1-60); UES is the argued equivalence page and votes do not enter it; a denial, reversed comparison or antonym is never merged (similarity.py:65-200); near-duplicates count twice until a uniqueness page argues it (README.md:73-77). Draft: docs/wiki/Equivalency-Score:.md, The-Redundancy-Problem.md.
- [ ] **What a belief page shows beside its score** (new page, "Reading a belief page"). Cover What Would Change the Answer (Move today vs If settled, flip point, joint worst case of the three widest, depth 6 disclosed; sensitivity.py:118-225), the Structural Checks panel and its nine checks (integrity.py:36-49), especially "Evidence filed above the premise it bears on", the "Counting every reason until it is argued down" figure (tally.py) and the "Where the two rules disagree" page (compare.html). No live page mentions any of these; no draft names compare.html.
- [ ] **Predictions and how they turned out** (new page, or add to Truth-Score under falsifiability). Explain the tracker's five groups and 90-day window, that "today" is the build revision's date, and that an outcome is a sourced finding on the prediction's page, "came true" at 0.55 or more (predictions.py:5-111; predictions.html). The live wiki never uses the word "predict".
- [ ] **How a belief becomes complete, and why drafts are published** (new page, or add to Home). List the CORE_BAR parts (publish.py:13-21), say every belief is published and drafts are marked and ranked after complete ones, listed in data/drafts.json (render_site.py:4525-4597), and that `--complete-only` builds the gated site. Fix publish.py:3-8, which says the opposite.
- [ ] **Importance and media scores as argued pages** (correct Home "Impact Algorithm"; correct Media). Say importance = max over listed interests of Validity x Bears (score_reference.py:246-249) and a media page's impact comes from its argued impact rows (:255-257), not a product of sales, engagement and viewership.
- [ ] **The guarantees and the conformance contract, for maintainers and porters** (new page, "Guarantees and conformance"). Reproduce the README guarantees table (README.md:53-71) with each pinning test, the eight contract rules, constants and eighteen tiers (conformance.py:15-58), the `--check` / `--write` / `--print` flags and CI gates (check.yml:38, 46), the published data/conformance_*.json, and p/<key>.json as the per-page data export. No live page and no single draft collects these.
- [ ] **Make the method page's "wiki" citations resolvable** (correct site/method.html#notrun and evidence.py:15-19, or publish the pages they cite). Four rules are attributed to wiki pages (ReasonRank start values, Truth Score -1 to +1, Scoring System, Redundancy Problem) that the live wiki does not contain; and fix the docstring paths in integrity.py:3 and similarity.py:3.
