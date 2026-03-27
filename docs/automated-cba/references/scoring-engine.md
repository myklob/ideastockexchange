# Scoring Engine Reference

## Evidence Tier System

Every piece of evidence supporting an argument receives a tier classification that caps its maximum truth contribution.

| Tier | Type | Max Truth Score | Examples |
|---|---|---|---|
| T1 | Peer-reviewed / Official Data | 10 | RCTs, meta-analyses, government statistics, replicated studies |
| T2 | Expert / Institutional | 7 | Expert testimony, institutional reports, professional consensus statements |
| T3 | Journalism / Surveys | 5 | Investigative journalism, opinion polls, market surveys, think tank reports |
| T4 | Opinion / Anecdote | 3 | Personal experience, editorial opinion, social media, unverified claims |

### Evidence Quality Sub-Dimensions

Each evidence item is scored across four dimensions (from the ISE Evidence Scores framework):

| Dimension | Weight | What It Measures |
|---|---|---|
| Internal Validity | 30% | Methodology rigor, design quality, execution |
| Statistical Soundness | 25% | Effect sizes, p-values, confidence intervals, sample size |
| Replicability | 25% | Independent verification (direct/systematic/conceptual) |
| Bias Resistance | 20% | Conflicts of interest, funding sources, selective reporting |

```
evidence_quality = (internal_validity * 0.30) + (statistical_soundness * 0.25)
                 + (replicability * 0.25) + (bias_resistance * 0.20)
```

Cap: evidence_quality cannot exceed the tier maximum.

## Argument Score Calculation

### Single Argument (No Sub-Arguments)

```
argument_score = truth_score * linkage_score * importance_score
```

Where:
- truth_score: 0-10 scale, based on evidence quality
- linkage_score: 0.0-1.0, how strongly this argument affects the parent
- importance_score: 0.0-1.0, relative priority among sibling arguments

### Argument with Sub-Arguments (Recursive)

```
effective_score(arg) = base_score(arg) + sum(
    effective_score(sub_arg) * linkage(sub_arg -> arg) * depth_attenuation(depth)
    for sub_arg in arg.sub_arguments
)

depth_attenuation(d) = 0.5^(d - 1)
```

### Depth Attenuation Table

| Depth | Attenuation Factor | Rationale |
|---|---|---|
| 1 (direct sub-argument) | 1.0 | Direct support, full weight |
| 2 | 0.50 | One step removed, halved |
| 3 | 0.25 | Two steps removed, quartered |
| 4 | 0.125 | Three steps removed, eighth |
| 5+ | 0.0625 | Diminishing returns, floor at this level |

This prevents "argument stacking" where someone builds a deep chain of speculative sub-arguments to inflate a weak top-level claim.

## Likelihood Score Derivation

### From Argument Scores to Probability

The likelihood that an impact actually occurs is derived from the battle between pro and con arguments:

```
pro_total = sum(effective_score(arg) for arg in pro_arguments)
con_total = sum(effective_score(arg) for arg in con_arguments)

# Normalize to 0-1 range
max_possible = pro_total + con_total
if max_possible == 0:
    likelihood = 0.5  # No arguments either way = maximum uncertainty
else:
    likelihood = pro_total / max_possible
```

### Interpretation Scale

| Likelihood | Meaning | Verbal Label |
|---|---|---|
| 0.00 - 0.10 | Virtually impossible | "Almost certainly won't happen" |
| 0.10 - 0.25 | Unlikely | "Probably won't happen" |
| 0.25 - 0.40 | Possible but improbable | "Could happen but doubtful" |
| 0.40 - 0.60 | Genuinely uncertain | "Could go either way" |
| 0.60 - 0.75 | Probable | "More likely than not" |
| 0.75 - 0.90 | Highly likely | "Probably will happen" |
| 0.90 - 1.00 | Virtually certain | "Almost certainly will happen" |

### Empty Tree Handling

If an impact has no argument tree yet:
- Set likelihood = 0.5 (maximum uncertainty)
- Flag as "UNSCORED: needs argument development"
- Do NOT display expected_value as if it were computed; mark it as provisional

## Expected Value Calculation

### Per-Item
```
expected_value = magnitude * likelihood_score
```

### Per-Category
```
net_category_value = sum(benefit EVs) - sum(cost EVs)
```

### Cross-Category Conversion (when requested)

Standard conversion rates (US defaults, adjust per context):

| Conversion | Rate | Source |
|---|---|---|
| Lives -> Dollars | $11.6M per statistical life | US EPA (2024) |
| Hours -> Dollars | $31.73/hour | US median wage (2024) |
| Freedom -> Dollars | Not standardized | Must be qualitative or use willingness-to-pay studies |
| Health (QALY) -> Dollars | $50,000-$150,000 per QALY | ICER threshold range |

Always disclose conversion rates when monetizing non-financial impacts. These are tools for comparison, not statements about the "real value" of a human life.

## Sensitivity Analysis

### Method
For each impact item i:
```
sensitivity_i = |magnitude_i * 1.0 - magnitude_i * 0.0| = |magnitude_i|
```

But more usefully, calculate the *swing* each item creates:
```
swing_i = |magnitude_i * (likelihood_high - likelihood_low)|
```

Where likelihood_high and likelihood_low represent the range of plausible likelihoods given the argument tree's uncertainty.

### Uncertainty Estimation
```
argument_agreement = 1 - (min(pro_total, con_total) / max(pro_total, con_total))
uncertainty = 1 - argument_agreement
likelihood_high = min(1.0, likelihood + uncertainty * 0.5)
likelihood_low = max(0.0, likelihood - uncertainty * 0.5)
```

High agreement (all pros or all cons) = low uncertainty = narrow range.
Even split = high uncertainty = wide range.

## Confidence Score

### Overall Analysis Confidence
```
confidence = mean(item_confidence for each impact item)

item_confidence = mean_evidence_tier_score / 10
    where mean_evidence_tier_score = average of all evidence tier maximums
    used in the item's argument tree
```

| Confidence Level | Score Range | Meaning |
|---|---|---|
| High | 0.7 - 1.0 | Well-evidenced, mostly T1/T2 sources |
| Moderate | 0.4 - 0.7 | Mixed evidence quality |
| Low | 0.0 - 0.4 | Mostly opinion/anecdote, speculative |

## Scenario Simulation

### Three-Scenario Model
```
optimistic: shift all likelihoods +0.15, cap at 1.0
base_case: as calculated
pessimistic: shift all likelihoods -0.15, floor at 0.0
```

### Asymmetric Scenario (more realistic)
```
optimistic: shift benefit likelihoods +0.15, cost likelihoods -0.10
pessimistic: shift benefit likelihoods -0.15, cost likelihoods +0.10
```

This reflects the common pattern where optimistic scenarios assume benefits materialize and costs don't, while pessimistic scenarios assume the reverse.

## Foundational Assumption Cascade

### How It Works
1. Identify foundational assumptions for each impact (e.g., "the technology exists", "funding is available", "political will exists")
2. Each assumption gets its own truth score
3. If a foundational assumption's truth score drops below 0.2:
```
cascade_factor = assumption_truth_score / 0.2
all_dependent_impact_likelihoods *= cascade_factor
```
4. At truth score = 0, all dependent impacts get likelihood = 0

This prevents the absurd situation where an analysis shows huge benefits from a program that can't actually be implemented.
