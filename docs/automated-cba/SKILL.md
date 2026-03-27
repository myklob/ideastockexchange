---
name: automated-cba
description: >
  Automated Cost-Benefit Analysis engine using Idea Stock Exchange scoring logic.
  Use this skill whenever the user wants to analyze a policy, proposal, decision, product,
  or any choice by weighing costs against benefits. Trigger on: cost-benefit analysis,
  CBA, pros and cons analysis, policy analysis, trade-off analysis, expected value calculation,
  "should we do X", "is X worth it", "weigh the costs and benefits", impact analysis,
  decision analysis, risk-benefit analysis, or any request to systematically evaluate
  whether something is a good or bad idea. Also trigger when the user asks to compare
  two or more options by their outcomes, or when they want to assign scores or likelihoods
  to potential impacts. This skill applies the ISE's recursive argument-driven scoring
  system to produce rigorous, transparent, weighted expected-value analyses. Even if the
  user just says "analyze this proposal" or "is this a good idea" without mentioning
  CBA explicitly, this skill is probably what they need.
---

# Automated Cost-Benefit Analysis Skill

## What This Skill Does

This skill turns any policy, proposal, or decision into a structured, scored cost-benefit analysis where every potential impact is treated as a debatable claim. Instead of someone just asserting "this will cost $5 billion" and everyone nodding along, each cost and benefit gets its own argument tree. The likelihood of each impact is *derived from the performance of the arguments for and against it*, not pulled from thin air.

The core insight: a cost-benefit analysis is only as good as the likelihood estimates feeding it. And likelihood estimates are only as good as the reasoning behind them. So we make the reasoning explicit, score it, and let the math do the rest.

This is the Idea Stock Exchange's [Cost-Benefit Analysis](https://myclob.pbworks.com/w/page/156187122/cost-benefit%20analysis) framework, operationalized.

## The Four-Step Engine

### Step 1: Brainstorming (Identify All Impacts)

Generate or collect every potential cost and benefit. Classify each into exactly one category:

| Category | Gained (+) | Lost (-) | Unit |
|---|---|---|---|
| Financial | Dollars Gained | Dollars Lost | $ (USD or specified) |
| Human Life | Lives Saved | Lives Lost | Integer count |
| Freedom | Freedom Gained | Freedom Lost | Liberty Index % |
| Time | Hours Gained | Hours Lost | Person-hours |

These four vectors capture the dimensions people actually care about. Financial captures economic impact. Human Life captures mortality and safety. Freedom captures autonomy, rights, and civil liberties. Time captures productivity and quality of life.

**Expansion categories** (use when relevant):
- Health (QALYs gained/lost)
- Environmental (ecosystem damage/restoration, measured in standardized units)
- Social Cohesion (community trust gained/lost)
- Innovation (technological progress enabled/inhibited)

Every impact item needs:
- `id`: Unique identifier
- `description`: Clear statement of the impact (phrased as a testable claim)
- `category`: One of the categories above
- `direction`: "benefit" or "cost"
- `magnitude`: Numeric estimate of the impact size (in the category's units)
- `magnitude_justification`: Why this number, what's it based on
- `likelihood_score`: Computed (never manually assigned), range 0.0 to 1.0
- `expected_value`: magnitude x likelihood_score
- `argument_tree`: The pro/con debate about whether this impact will actually occur

### Step 2: Likelihood Debate (Score Each Impact)

This is where the ISE magic happens. Every impact claim becomes a mini-belief page with its own argument tree.

For example, if someone claims "Universal basic income will cost $3 trillion annually":
- That $3T figure has **arguments supporting its likelihood** (CBO estimates, existing program costs extrapolated, etc.)
- And **arguments against its likelihood** (labor force changes would offset costs, economic growth effects, etc.)

Each argument in the tree gets three scores, following the ISE's established scoring system:

**Truth Score (0-10)**: How well-supported is this argument by evidence?
- Read `references/scoring-engine.md` for the full evidence tier system (T1-T4)
- 8-10: Supported by T1 evidence (peer-reviewed, replicated)
- 5-7: Supported by T2 evidence (expert/institutional)
- 3-4: Supported by T3 evidence (journalism/surveys)
- 1-2: Supported by T4 evidence (opinion/anecdote)
- 0: No evidence provided

**Linkage Score (0.0-1.0)**: How strongly does proving this argument affect the parent impact's likelihood?
- This is the critical ISE innovation. A true argument with 0 linkage contributes nothing.
- See [Linkage Scores](https://myclob.pbworks.com/w/page/159338766/Linkage%20Scores) for the full framework.
- Ask: "If this argument is true, how much does it *necessarily* change the probability of the parent impact occurring?"

**Importance Score (0.0-1.0)**: How much does this argument matter relative to other arguments in the same tree?
- See [Importance Score](https://myclob.pbworks.com/importance%20score) for the full framework.
- Prevents minor points from diluting major ones.

**Argument Score Calculation:**
```
argument_score = truth_score * linkage_score * importance_score
```

**Recursive Sub-Arguments:**
Arguments can have their own sub-arguments. When they do:
```
effective_argument_score = base_score + sum(sub_argument_contributions)
sub_argument_contribution = sub_arg_score * depth_attenuation
depth_attenuation = 0.5^(depth - 1)
```

This means:
- Level 1 sub-arguments contribute at 100%
- Level 2 sub-arguments contribute at 50%
- Level 3 sub-arguments contribute at 25%
- This prevents deep, speculative argument chains from accumulating undue influence

**Likelihood Score Derivation:**
```
raw_score = sum(pro_argument_scores) - sum(con_argument_scores)
max_possible = sum(all_argument_scores_if_maxed)
normalized = (raw_score / max_possible + 1) / 2
likelihood_score = clamp(normalized, 0.0, 1.0)
```

Result: 0.0 = impossible, 0.5 = genuinely uncertain, 1.0 = certain.

### Step 3: De-Duplication and Independence

This is mandatory. Without it, someone can game the system by restating the same argument five different ways and getting five times the credit.

**Impact-Level De-Duplication:**
Compare all impact items within and across categories. If two impacts are semantically similar:
```
similarity_score = semantic_overlap(impact_A, impact_B)  # 0.0 to 1.0
if similarity_score > 0.3:
    adjusted_value_B = value_B * (1 - similarity_score)
```

**Argument-Level De-Duplication:**
Within each argument tree, similar arguments should not fully stack:
```
for each pair of arguments in the same tree:
    overlap = semantic_similarity(arg_A, arg_B)
    if overlap > 0.5:
        weaker_arg.effective_score *= (1 - overlap)
```

**Independence Check:**
Ask for each argument: "If I removed argument A, would argument B still be just as strong?" If yes, they're independent. If no, they share logical foundation and the overlap must be discounted.

Read `references/deduplication.md` for the full algorithm with worked examples.

### Step 4: Aggregation and Output

**Per-Item Expected Value:**
```
expected_value = magnitude * likelihood_score
```

**Per-Category Net Value:**
```
net_value_category = sum(benefit_EVs in category) - sum(cost_EVs in category)
```

**Total Score:**
```
total_score = sum(all benefit EVs) - sum(all cost EVs)
```

Note: Categories with different units (dollars vs. lives vs. hours) cannot be naively summed. Present them separately in the dashboard. If the user wants a single number, apply standard conversion rates (e.g., Value of Statistical Life for lives-to-dollars, median wage for hours-to-dollars) and note the conversion explicitly.

## Advanced Features

### Sensitivity Analysis
For each impact item, calculate:
```
sensitivity = |expected_value_if_likelihood_1.0 - expected_value_if_likelihood_0.0|
```
Report the top 5 most sensitive items: these are where additional research or debate would most change the conclusion.

### Confidence Score
```
overall_confidence = mean(evidence_depth_scores across all argument trees)
```
Where evidence_depth_score reflects how much T1/T2 evidence backs the arguments. High confidence = lots of peer-reviewed evidence. Low confidence = mostly T4 anecdote.

### Scenario Simulation
Generate three scenarios:
- **Optimistic**: All likelihood scores shifted +0.15 (capped at 1.0)
- **Base case**: As calculated
- **Pessimistic**: All likelihood scores shifted -0.15 (floored at 0.0)

### Time Horizon Analysis
For each impact, optionally specify:
- `time_horizon`: "short" (0-2 years), "medium" (2-10 years), "long" (10+ years)
- Apply discount rate for future impacts (default 3% annually)

### User Reputation Weighting (Future Extension)
When multiple users contribute arguments, weight by track record:
```
weighted_score = argument_score * contributor_reputation
```
Not implemented in v1 but design the data model to support it.

### Foundational Assumption Cascade
If a foundational assumption for a benefit is proven false, the likelihood score for the entire branch drops to zero. Example: if "the technology exists to implement this" scores 0 on truth, every benefit that depends on that technology gets likelihood = 0 automatically.

### Conflict Resolution Highlighting
Automatically identify from the argument trees:
- **Shared interests**: Both sides want X (e.g., both want economic growth)
- **Conflicting values**: Side A prioritizes freedom, Side B prioritizes safety
- **Compromise candidates**: Impacts where small likelihood changes could flip the net category score

## Output Formats

Choose format based on context. Read `references/output-templates.md` for the full templates.

### React Dashboard (.jsx)
Use when: interactive exploration, presentation to stakeholders, embedding in web pages.
Features: expandable argument trees, live score recalculation, category breakdown charts, sensitivity visualization.

### HTML Report (.html)
Use when: sharing on PBworks, email distribution, static web embedding.
Features: score tables, category summary, argument tree tables, fully PBworks-paste-compatible.
**Critical**: All styles MUST be inline (no `<style>` blocks, no `class` attributes, no external CSS). PBworks strips everything except inline `style=""` attributes. Read `references/output-templates.md` for the exact PBworks-safe patterns and example markup. Use `<table>` for layout, not CSS Grid or Flexbox.

### Markdown Document (.md)
Use when: GitHub documentation, blog post drafts, quick summaries.
Features: clean tables, argument tree indentation, category totals.

### Selection Logic
- If user asks for "dashboard" or "interactive" or "app" -> React
- If user asks for "report" or "document" or mentions PBworks -> HTML
- If user asks for "summary" or "quick analysis" or mentions GitHub/blog -> Markdown
- If user doesn't specify -> React (most versatile)
- If user says "all of them" -> generate all three

## Workflow

### When user provides a specific topic/policy:

1. **Research phase**: Gather information about the proposal. Use web search if available.
2. **Brainstorm impacts**: Generate comprehensive list across all categories. Aim for 8-15 impacts minimum.
3. **Build argument trees**: For each impact, construct 3-5 pro and 3-5 con arguments with scores.
4. **Apply recursive scoring**: Calculate sub-argument contributions with depth attenuation.
5. **De-duplicate**: Run overlap detection on both impacts and arguments.
6. **Calculate**: Compute all expected values, category nets, and total score.
7. **Analyze**: Run sensitivity analysis, confidence scoring, and scenario simulation.
8. **Output**: Generate the requested format(s) with full breakdown.

### When user provides costs/benefits directly:

1. Classify and structure the provided items.
2. Fill in any missing categories (ask or infer).
3. Build argument trees for likelihood estimation.
4. Proceed from step 4 above.

### When user just asks "is X a good idea?":

1. Treat X as the proposal under analysis.
2. Run the full workflow from step 1.
3. Present the conclusion with the total score and category breakdown.

## ISE Integration Points

This skill is built on the Idea Stock Exchange's core infrastructure. When generating output, link to these canonical pages where relevant:

- [One Page Per Topic](https://myclob.pbworks.com/w/page/159323433/One%20Page%20Per%20Topic): Each impact = one debatable claim
- [Reasons](https://myclob.pbworks.com/Reasons): Argument tree structure
- [Evidence](https://myclob.pbworks.com/w/page/159353568/Evidence): Evidence backing arguments
- [Linkage Scores](https://myclob.pbworks.com/w/page/159338766/Linkage%20Scores): Relevance filtering
- [Importance Score](https://myclob.pbworks.com/importance%20score): Priority weighting
- [Truth](https://myclob.pbworks.com/w/page/21960078/truth): Composite truth measurement
- [Cost-Benefit Analysis](https://myclob.pbworks.com/w/page/156187122/cost-benefit%20analysis): The parent framework

## Principles

1. **Scores are computed, never manually assigned.** Every number traces back to scored arguments. No hand-waving.
2. **Symmetry is mandatory.** Costs and benefits get equal analytical rigor. No thumb on the scale.
3. **Arguments are not evidence.** An argument is a reason. Evidence is data. Don't conflate them. See [Evidence](https://myclob.pbworks.com/w/page/159353568/Evidence).
4. **Redundancy is the enemy of accuracy.** De-duplication isn't optional. Two versions of the same argument count once.
5. **Linkage prevents hijacking.** A true fact with zero relevance contributes zero. Period.
6. **Transparency over elegance.** Show the work. Every score should be auditable.
7. **The analysis evolves.** New arguments change scores. That's a feature, not a bug.
