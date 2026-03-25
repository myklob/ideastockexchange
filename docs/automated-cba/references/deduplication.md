# De-Duplication and Independence Scoring

## Why This Matters

De-duplication is the immune system of the CBA engine. Without it, the analysis is trivially gameable: just rephrase the same argument five times and you've quintupled its influence. This is exactly the problem the ISE was built to solve, as described in [Grouping Similar Arguments](https://myclob.pbworks.com/w/page/159323433/One%20Page%20Per%20Topic).

## Two Levels of De-Duplication

### 1. Impact-Level De-Duplication

Different stakeholders will often submit the same impact phrased differently:
- "Job losses in the coal industry" vs. "Unemployment in fossil fuel sectors"
- "Reduced healthcare costs" vs. "Lower insurance premiums" vs. "Fewer hospital visits"

Sometimes these are genuinely different impacts (reduced healthcare costs and fewer hospital visits have different magnitudes and mechanisms). Sometimes they're the same thing counted twice.

**Algorithm:**
```
for each pair of impacts (A, B) in the same category:
    similarity = semantic_overlap(A.description, B.description)

    if similarity > 0.8:
        # Nearly identical; merge into one, keep the better-developed argument tree
        merge(A, B)

    elif similarity > 0.3:
        # Partial overlap; discount the weaker one
        weaker = min(A, B, key=lambda x: len(x.argument_tree))
        weaker.adjusted_magnitude *= (1 - similarity)
        weaker.overlap_note = f"Overlaps {similarity:.0%} with '{stronger.description}'"

    else:
        # Independent; no adjustment needed
        pass
```

### 2. Argument-Level De-Duplication

Within a single impact's argument tree, arguments can also overlap:
- Pro: "Carbon taxes reduce emissions" vs. "Pricing carbon creates market incentives to reduce emissions"
- These are the same argument. The second is a more detailed restatement of the first.

**Algorithm:**
```
for each pair of arguments (A, B) in the same tree and same direction (pro/pro or con/con):
    overlap = semantic_similarity(A.description, B.description)

    if overlap > 0.7:
        # Substantially similar; the weaker argument contributes only its unique portion
        weaker = min(A, B, key=lambda x: x.argument_score)
        weaker.effective_score *= (1 - overlap)
        weaker.redundancy_note = f"Shares {overlap:.0%} with '{stronger.description}'"

    elif overlap > 0.4:
        # Moderate overlap; partial discount
        weaker.effective_score *= (1 - overlap * 0.5)

    else:
        # Sufficiently different; no discount
        pass
```

## The Independence Test

Beyond semantic similarity, arguments can be logically dependent even when they sound different. The independence test asks:

**"If argument A were removed from the debate, would argument B's truth score change?"**

- If YES: They share logical foundation. Discount overlap.
- If NO: They're independent. Both count fully.

**Examples:**

Independent arguments (both count fully):
- "Roundabouts reduce fatalities" (safety argument)
- "Roundabouts reduce fuel consumption" (efficiency argument)
- Removing the safety data doesn't change the fuel consumption data.

Dependent arguments (overlap discount):
- "The CBO projects costs of $3T" (authority argument)
- "Multiple economic models confirm costs around $3T" (convergence argument)
- If the CBO model is the basis for those other models, removing CBO weakens the convergence claim.

## Practical Implementation (for Claude)

When building argument trees, apply this checklist for each argument:

1. **Semantic check**: Does this say essentially the same thing as another argument, just with different words?
2. **Causal check**: Does this argument derive from the same underlying evidence or assumption as another?
3. **Removal check**: If I deleted the strongest similar argument, would this one still stand on its own?

Score the overlap and apply the discount formula. Always note discounts in the output so the analysis is auditable.

## Worked Example

**Impact**: "Universal basic income will reduce poverty by 40%"

Pro arguments before de-duplication:
1. "Direct cash transfers lift people above poverty line" (score: 6.8)
2. "Giving money to poor people makes them less poor" (score: 5.2)
3. "Existing cash transfer programs (GiveDirectly) show 30-40% poverty reduction" (score: 7.5)
4. "Economic modeling predicts poverty reduction of 35-45%" (score: 6.0)

De-duplication analysis:
- Args 1 and 2: semantic similarity = 0.85 -> Merge. Keep arg 1 (better developed).
- Args 3 and 4: semantic similarity = 0.35 -> Partial overlap.
  - But independence test: Arg 3 (empirical evidence) and Arg 4 (modeling) share some data inputs.
  - Causal overlap estimated at 0.4.
  - Arg 4 (weaker) adjusted: 6.0 * (1 - 0.4) = 3.6

After de-duplication:
1. "Direct cash transfers lift people above poverty line" -> 6.8
2. ~~Merged into #1~~
3. "Existing cash transfer programs show 30-40% poverty reduction" -> 7.5
4. "Economic modeling predicts poverty reduction of 35-45%" -> 3.6 (discounted)

**Effective pro total: 17.9** (vs. naive total of 25.5, a 30% reduction)

This is a significant correction. Without de-duplication, the analysis would overstate confidence by counting the same evidence through multiple rhetorical lenses.

## Cross-Category De-Duplication

Sometimes the same underlying impact appears in multiple categories:
- "Workers lose jobs" appears under both "Dollars Lost" and "Hours Lost"
- The dollar impact (lost wages) and the hour impact (lost productive time) are measuring the same event in different units.

**Rule**: If two impacts in different categories describe the same event, only count the one most relevant to the user's decision framework. Flag the other as "accounted for in [category]" with a cross-reference.

Exception: If the impacts are genuinely additive (lost wages AND lost productive personal time beyond work hours), both count.
