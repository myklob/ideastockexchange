# Cost-Benefit Analysis Feature

Policy evaluation where every cost and benefit has a **Likelihood Score** that must survive adversarial scrutiny. Impacts only count if their probabilities survive attack.

## What This Module Does

- Renders the CBA Dashboard with line items (costs/benefits), competing likelihood estimates, and expected value summaries.
- Manages sample CBA data with nested likelihood beliefs.
- Houses CBA-specific UI components (line item cards, likelihood panels, argument forms).

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Likelihood as Nested Belief** | Each probability is itself a claim that must be argued for with evidence. |
| **Competing Estimates** | Multiple probability estimates coexist. The one backed by the strongest argument tree wins. |
| **Expected Value** | `Predicted Impact x Active Likelihood = Expected Value`. |
| **Active Likelihood** | The highest-scoring estimate after ReasonRank evaluation. |

## Folder Structure

```
cost-benefit-analysis/
  components/     CBA-specific UI (CBADashboard, LineItemCard, LikelihoodPanel)
  data/           Sample CBA data with competing estimates
```

## Scoring

CBA-specific scoring extensions live in `/src/core/scoring/cba-scoring.ts`. The unified engine in `scoring-engine.ts` applies ReasonRank to likelihood estimates.
