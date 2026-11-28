# Template: Belief Equivalence Scorecard

> Generated from [`templates/belief-equivalence-scorecard-template.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/belief-equivalence-scorecard-template.html) by `tools/wiki_templates.py`. The HTML file is the template; edit it, not this page. CI regenerates this page and refuses a copy that has drifted.

**Kind:** Special analysis  
**Purpose:** Two wordings of what may be one claim: the equivalence arguments, the check table, hidden assumptions and bias risks, definitions. The page whose truth score decides whether two pages merge.  
**Rendered by:** tools/static-site/similarity.py (the computed duplicate detector that proposes pairs); render_site.py equivalents and EQUIV_MERGE  

**Currency rules.** `tools/check_templates.py` refuses a template that uses the retired column names Argument Score or Evidence Score (the current names are Truth, Importance and Linkage), an em dash, an empty anchor, or an address that looks like an email; a topic template must carry the four magnitude bands Modest, Moderate, Strong and Total and treat engagement as a section, not a continuum. CI runs it on every change under `templates/`, and `tools/wiki_templates.py --check` refuses a wiki copy that differs from the HTML.

Square-bracketed text is a placeholder for the author to fill; a token with underscores, such as [Truth_Score], is a slot the software fills. A score cell is blank until a real page stands behind it. Each table on the built site carries a form that files a row in it; a form cannot be submitted from a wiki page, so the forms are left out here.

---
> **Builder notes**
>
> ===== ISE BELIEF EQUIVALENCE PAGE TEMPLATE (October 2026: brought to the page the static site builds) =====
> Whether two beliefs make the same claim is itself a claim, so it gets a page and is argued like any other:
> reasons to agree that X and Y are the same claim, reasons to disagree, and a score computed from them by the
> same row rule as every page (sign x (2 x Truth - 1) x Confidence x Linkage x Importance x Uniqueness), starting
> at 0.50. Reasons here are about whether the two claims have the same truth conditions, never about whether
> either is true. A score of 0.90 or more marks a merge candidate; below that both pages stay.
>
> SECTION ORDER (built site):
>   Header (the question as the title, the equivalence score on the heading line, Used on)
>   The two beliefs (Belief X and Belief Y, each with its truth score)
>   1. Equivalence Arguments (two stacked tables, # / Reason (pattern) / Truth / Confidence / Linkage /
>      Importance / Uniqueness / Score; a totals line; a Pattern note)
>   2. Check Table (exact X, exact Y, what separates them (typed), the computed score, the verdict with the
>      0.90 merge line, the bottom line (typed))
>   3. Hidden assumptions and bias risks (when either has rows: required for the two to be the same / to
>      differ; biases toward merging / splitting)
>   4. Definitions, Where This Page Is Used, Scoring Engine, Contribute
>
> The seventeen-step weighted scorecard further down is a SOFTWARE DESIGN, kept for reference. The built site
> does not run it: none of its weights (overlap 0.25 / 0.35 / 0.20 / 0.20, final 0.40 / 0.40 / 0.20, verdict
> bands 90 / 75 / 50) feeds any published number.

The belief: [X] makes the same claim as: [Y] [Equivalence_Score]

Used on: [The belief page whose Similar Beliefs or Ways of Saying the Same Thing table reads this score]

| Belief X | [X, linked to its own page] | Truth [X_Truth] |
|---|---|---|
| Belief Y | [Y, linked to its own page] | Truth [Y_Truth] |

# ⚖️ Equivalence Arguments

One page per belief. Reasons here are about whether the two claims have the same truth conditions, never about whether either is true. Each reason is a claim with its own page, scored by the same row rule as every page, so a reason nobody has argued reads exactly 0. The four rows per side are starter patterns; rows enter and rank by their own scores.

### ✅ Reasons to agree that X and Y are the same claim

| # | Reason (pattern) | Truth | Confidence | Linkage | Importance | Uniqueness | Score |
|---|---|---|---|---|---|---|---|
| 1 | Same truth conditions: in any world where X holds, Y holds, and the other way round: [show it]. |   |   |   |   |   |   |
| 2 | Same evidence settles both: no finding could support one and weaken the other: [name the evidence both turn on]. |   |   |   |   |   |   |
| 3 | Interchangeable in arguments: swapping one for the other changes no argument tree: [show an argument that reads the same with either]. |   |   |   |   |   |   |
| 4 | Same scope: same people, place and time: [show the match]. |   |   |   |   |   |   |

### ❌ Reasons to disagree (X and Y differ)

| # | Reason (pattern) | Truth | Confidence | Linkage | Importance | Uniqueness | Score |
|---|---|---|---|---|---|---|---|
| 1 | Different scope: X and Y cover different people, places, times or assets: [name the difference]. |   |   |   |   |   |   |
| 2 | Different mechanism: X and Y claim the same result by different routes, so different evidence settles each: [name the routes]. |   |   |   |   |   |   |
| 3 | One-way implication: X implies Y but Y does not imply X: [show the case that separates them]. |   |   |   |   |   |   |
| 4 | Different magnitude: X and Y differ in how much they claim, so an objection that sinks one leaves the other standing: [name it]. |   |   |   |   |   |   |

Total agree [Agree_Total] · total disagree [Disagree_Total] · equivalence score [Equivalence_Score]. The score is this page’s truth: the agree share of the scored weight, shrunk toward the 0.50 starting point by weight k. Pattern: Same truth conditions: any world where one holds, the other holds. Same evidence settles both: no finding could split them. Interchangeable in arguments: swapping them changes no argument tree. Same scope: same people, place, time. Different scope, mechanism or magnitude: a nameable difference. One-way implication: X implies Y but not back.

# ✅ Check Table

| Step | Question | Answer for this pair |
|---|---|---|
| 1 | Exact wording of X, read from its page | [Verbatim. No paraphrase.] |
| 2 | Exact wording of Y, read from its page | [Verbatim. No paraphrase.] |
| 3 | What separates them, in one sentence (typed) | [The single difference that would make a reader keep both pages, or "nothing".] |
| 4 | Computed equivalence score | [Score], read from the two tables above, never typed |
| 5 | Verdict | [Merge candidate (0.90 or more) / Overlapping: keep both, name the difference on each page (0.50 to 0.90) / Distinct claims: keep both pages, cross-link (below 0.50)] |
| 6 | Bottom line, typed by the author after the tables above | [Optional. One sentence.] |

The merge line is 0.90. At or above it the two pages are one claim: the shorter wording may stand in for the other where space is short, and the pages are merge candidates. Between 0.50 and 0.90 both pages stay and each names the difference. Below 0.50 they are distinct claims, cross-linked. Only the one-sentence bridge and the bottom line are typed; everything else is read from the pages it names.

## Hidden Assumptions and Bias Risks

| Required for the two claims to be the same | Score | Required for them to differ | Score |
|---|---|---|---|
|   |   |   |   |

| Biases toward merging | Score | Biases toward splitting | Score |
|---|---|---|---|
|   |   |   |   |

## Definitions

Equivalence score: this page’s truth score. The Similar Beliefs table on X’s page shows it as Equiv. Near 1 marks a merge candidate, not a new page.

---

Software design: the seventeen-step equivalence scorecard

A proposed procedure for comparing two beliefs to decide whether they should be merged, linked, or kept separate. It is a design for the ISE software and is not run by the built site: none of the weights, bands or verdicts below feeds a published number. The argued page above is what the site builds.

Index

!

# ⚖️ Step 1: Raw Beliefs Under Comparison

| Label | Raw Belief Statement | Source Page |
|---|---|---|
| Belief X |   |   |
| Belief Y |   |   |

# ⚡ Step 2: Fast Path Collapse Test

*If both beliefs are word-for-word identical after lowercasing and punctuation stripping, skip to Verdict = MERGE.*

| Check | Result | Auto-Merge? |
|---|---|---|
| Exact match after normalization (lowercase, strip punctuation) |   |   |
| Fast path passed? |   |   |

# 📝 Step 3: Normalized Core Claims

*Strip hedging, filler, and scope qualifiers. Extract the minimal logical core.*

| Label | Normalized Statement | Normalization Notes |
|---|---|---|
| Belief X |   |   |
| Belief Y |   |   |

Normalization Argument Battle:

| ✅ Normalization is correct because… | ❌ Normalization is wrong because… | Score |
|---|---|---|
|   |   |   |

# 🗺️ Step 4: Semantic Transformation Map

*Map each element of Belief X to the corresponding element of Belief Y.*

| Belief X Element | Belief Y Element | Relationship | Notes |
|---|---|---|---|
|   |   | identical / synonym / antonym / different |   |
|   |   |   |   |
|   |   |   |   |

# 🔤 Step 5: Synonym Convergence Score

*Formula: average agreement rate across all synonym claims.*

| Term X | Term Y | Merriam-Webster | Oxford | WordNet | Embedding Model | Agreement Rate |
|---|---|---|---|---|---|---|
|   |   | ✓ / ✗ | ✓ / ✗ | ✓ / ✗ | ✓ / ✗ | / 4 |
|   |   |   |   |   |   | / 4 |

| Synonym Convergence Score | % |
|---|---|

# 💪 Step 6: Strength Delta

*Measures how much the two beliefs differ in certainty, scope, and causal force.*

| Dimension | Belief X | Belief Y | Delta (0–1) |
|---|---|---|---|
| Certainty (absolute vs. probable) |   |   |   |
| Scope (universal vs. local) |   |   |   |
| Causal Force (necessary vs. contributing) |   |   |   |
| Overall Strength Delta: |   |   |   |

# 🏗️ Step 7: Structural Relationship Classification

| Classification | Description |
|---|---|
| ☐ Same claim | Identical or synonym-level semantic content |
| ☐ Same topic, different claim | Same subject domain but distinct logical assertions |
| ☐ Subset / superset | One belief is a narrower or broader version of the other |
| ☐ Different topic | No meaningful semantic overlap |

Selected Classification:

Structural Argument Battle:

| ✅ Classification is correct because… | ❌ Classification is wrong because… | Score |
|---|---|---|
|   |   |   |

# 📊 Step 8: Overlap Score

*Formula: (Subject × 0.25) + (Predicate × 0.35) + (Context × 0.20) + (Mechanism × 0.20)*

| Dimension | Belief X | Belief Y | Overlap (0–1) |
|---|---|---|---|
| Subject (who or what) × 0.25 |   |   |   |
| Predicate (what is claimed) × 0.35 |   |   |   |
| Context (conditions) × 0.20 |   |   |   |
| Mechanism (causal path) × 0.20 |   |   |   |
| Weighted Overlap Score: |   |   | % |

# 🚫 Step 9: Non-Equivalence Triggers

*Any checked trigger applies a penalty to the final score.*

| Trigger | Present? (✓/✗) | Penalty Applied |
|---|---|---|
| Different causal chains (same conclusion, opposite mechanisms) |   |   |
| Different supporting evidence (no shared citations) |   |   |
| Different foundational assumptions |   |   |
| Different policy implications |   |   |
| Total Penalty: |   |   |

Trigger Argument Battle:

| ✅ Triggers correctly identified because… | ❌ Triggers incorrectly flagged because… | Score |
|---|---|---|
|   |   |   |

# ⚔️ Step 10: Argument Battle: Is This Equivalence Real?

| ✅ Pro-Equivalence Arguments | Truth | Linkage | Importance | Contribution |
|---|---|---|---|---|
|   |   |   |   |   |
|   |   |   |   |   |
| Pro-Equivalence Score: |   |   |   |   |

| ❌ Anti-Equivalence Arguments | Truth | Linkage | Importance | Contribution |
|---|---|---|---|---|
|   |   |   |   |   |
|   |   |   |   |   |
| Anti-Equivalence Score: |   |   |   |   |

| Argument Balance (Pro / (Pro + Anti)): | % |
|---|---|

# 📋 Step 11: Shared vs. Distinct Evidence and Arguments

| Shared Evidence / Arguments | Unique to Belief X | Unique to Belief Y |
|---|---|---|
| 1.<br>2.<br>3. | 1.<br>2. | 1.<br>2. |

| Evidence / Argument Overlap Rate: | % |
|---|---|

# 🧮 Step 12: Final Equivalence Score

*Equivalence = (0.40 × Synonym Score) + (0.40 × Overlap Score) + (0.20 × Argument Balance) − Penalties*

| Component | Weight | Score (0–1) | Weighted |
|---|---|---|---|
| Synonym Convergence Score (Step 5) | 0.40 |   |   |
| Overlap Score (Step 8) | 0.40 |   |   |
| Argument Balance (Step 10) | 0.20 |   |   |
| Network Position Adjustment (Step 14) | ± |   |   |
| Non-Equivalence Penalties (Step 9) | − |   |   |
| Final Equivalence Score: |   |   | % |

# 🏁 Step 13: Verdict and Action

| Score Range | Verdict | Action |
|---|---|---|
| 90–100% | 🔴 MERGE | Redirect one page to the other; combine all arguments |
| 75–89% | 🟠 MERGE with note | Merge with a footnote explaining the phrasing difference |
| 50–74% | 🟡 LINK only | Add a "similar belief" link; keep both pages separate |
| < 50% | 🟢 SEPARATE | No action needed; beliefs are distinct |

| Final Verdict: |   | Canonical Page (if merge): |   | Linkage Score: |
|---|---|---|---|---|

Verdict Argument Battle:

| ✅ Verdict is correct because… | ❌ Verdict is wrong because… | Score |
|---|---|---|
|   |   |   |

# 🕸️ Step 14: Network Position Adjustment

*Beliefs that share the same upstream beliefs, downstream beliefs, or evidence cluster are more likely equivalent.*

| Network Layer | Belief X Items | Belief Y Items | Overlap % | Same Cluster? |
|---|---|---|---|---|
| Upstream (parent beliefs) |   |   |   |   |
| Downstream (child beliefs) |   |   |   |   |
| Evidence (shared citations) |   |   |   |   |
| Network Position Adjustment: |   |   | % |   |

# 📜 Step 15: Audit Trail

| Analyst Type: | human / ai / hybrid | Analyst ID: |   |
|---|---|---|---|
| Confidence: | high / medium / low | Review Date: |   |
| Reviewed By: |   | Trigger Reason: |   |
| Revised From: |   | Revision Notes: |   |

# 🔗 Step 16: Related Pages

| Page Type | Link / Title |
|---|---|
| Belief X Source Page |   |
| Belief Y Source Page |   |
| Canonical Page (if merged) |   |
| Related Equivalence Analyses |   |

# 💻 Step 17: Machine-Readable Output

*JSON schema for programmatic import/export of this equivalence analysis.*

{ "schema_version": "1.0", "analysis_type": "belief_equivalence", "slug": "", "beliefs": { "x": { "raw": "", "normalized": "", "source": "" }, "y": { "raw": "", "normalized": "", "source": "" } }, "fast_path": { "passed": false, "auto_merge": false }, "synonym_convergence_score": 0, "strength_delta": { "certainty": { "x": "", "y": "", "delta": 0 }, "scope": { "x": "", "y": "", "delta": 0 }, "force": { "x": "", "y": "", "delta": 0 }, "overall": 0 }, "structural_relationship": "same_topic_different_claim", "overlap_score": { "subject": 0, "predicate": 0, "context": 0, "mechanism": 0, "weighted": 0 }, "non_equivalence_penalties": { "different_causal": 0, "different_evidence": 0, "different_assumptions": 0, "different_policy": 0, "total": 0 }, "argument_battle": { "pro_score": 0, "anti_score": 0, "balance": 0 }, "evidence_argument_overlap_rate": 0, "network_adjustment": 0, "final_equivalence_score": 0, "verdict": "separate", "canonical_page": null, "linkage_score": 0, "audit": { "analyst_type": "human", "analyst_id": null, "confidence": "medium", "reviewed_by": null, "review_date": null, "trigger_reason": null } }

[View the full codebase and technical documentation on GitHub](https://github.com/myklob/ideastockexchange).
