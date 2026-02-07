# IdeaStockExchange

A platform where ideas are valued like financial instruments. Claims rise and fall based on two independent forces: logical rigor and crowd conviction.

## Core Philosophy

**Arguments are investments.** Every claim functions as a dual-valued asset. It possesses a **ReasonRank** derived from logical proof and a **Market Price** determined by user betting and prediction market sentiment.

This dual-score system ensures that no single dimension of truth dominates. A claim can be logically airtight yet unpopular, or widely believed yet poorly supported. IdeaStockExchange tracks both dimensions independently, giving users a complete picture of each idea's standing.

## Key Concepts

### Truth Score

Truth Score: A composite metric representing the overall validity of a claim. It is calculated by combining the **Logical Validity Score** (structure of the argument) and the **Evidence Score** (quality and independence of supporting data).

The Truth Score is the final output of the ReasonRank algorithm. It is not a simple 0-1 accuracy rating. Instead, it synthesizes multiple dimensions of analysis into a single measure of claim validity.

### Evidence Score

The Evidence Score measures the reliability and independence of source data backing a claim. It evaluates factors such as:

- **Source credibility:** Is the data from a peer-reviewed study, a reputable institution, or an unverified source?
- **Independence:** Are multiple lines of evidence converging on the same conclusion, or does the claim rest on a single data point?
- **Reproducibility:** Can the evidence be independently verified?

Note: The Evidence Score is strictly a measure of data quality. It is one input into the Truth Score, not a synonym for it.

### Logical Validity Score

The Logical Validity Score evaluates the structural integrity of an argument. It checks whether conclusions follow from premises, whether logical fallacies are present, and whether the reasoning chain is internally consistent.

This score is the other primary input into the Truth Score.

## The Dual-Score System

IdeaStockExchange tracks two distinct and equally important scores for every claim.

### ReasonRank (The Truth Metric)

This score is objective. It measures the logical strength, evidence quality, and redundancy of an argument. ReasonRank cannot be bought. It must be earned through rigorous proof.

ReasonRank reflects the structural and evidential integrity of a claim:

- **Logical Validity:** Does the argument follow sound reasoning?
- **Evidence Quality:** Is the supporting data reliable and independent?
- **Redundancy:** Do multiple independent arguments converge on the same conclusion?
- **Counterargument Resilience:** Has the claim survived serious challenges?

The Truth Score is the final numeric output of the ReasonRank algorithm.

### Market Price (The Sentiment Metric)

This score is subjective. It represents the "wisdom of the crowd" through a betting market. Users wager virtual currency on whether a claim will be proven true or false.

Market Price reflects collective conviction:

- **Betting Volume:** How much virtual currency is staked on this claim?
- **Directional Sentiment:** Are users betting for or against?
- **Predictor Reputation:** Are the bettors historically accurate?
- **Market Momentum:** Is conviction rising or falling over time?

A high Market Price with a low ReasonRank signals popular belief without logical foundation. A high ReasonRank with a low Market Price signals rigorous proof that the crowd has not yet accepted.

## How It Works

1. **Submit a Claim:** A user posts a claim to the exchange. It starts with a neutral ReasonRank and an initial Market Price.
2. **Build the Case:** Other users contribute supporting or opposing arguments. Each argument is evaluated for logical validity and evidence quality, directly influencing the claim's ReasonRank.
3. **Place Your Bets:** Users wager IdeaCredits (virtual currency) on the claim's outcome via the prediction market. This activity sets the Market Price.
4. **Watch the Scores Diverge or Converge:** Over time, the ReasonRank and Market Price may align (indicating consensus between logic and sentiment) or diverge (indicating a gap between proof and belief).

## Getting Started

### Contributing Arguments (Influence ReasonRank)

1. Browse open claims on the exchange.
2. Submit evidence-backed arguments for or against a claim.
3. Your argument is scored for logical validity and evidence quality.
4. Strong arguments raise (or lower) the claim's ReasonRank.

### Placing Bets (Influence Market Price)

1. Review a claim's current ReasonRank and Market Price.
2. Stake IdeaCredits on whether you believe the claim will be validated or refuted.
3. Your bet shifts the Market Price based on volume and direction.
4. High performers in the market earn additional IdeaCredits and build a reputation as accurate predictors.

### Earning Reputation

- **Argument Quality:** Consistently contributing high-scoring arguments earns you a reputation as a rigorous thinker.
- **Prediction Accuracy:** Successfully betting on outcomes before they resolve earns you a reputation as an accurate predictor.
- **IdeaCredits:** Virtual currency earned through accurate predictions and high-quality contributions. IdeaCredits are not real money.

## Terminology Reference

| Term | Definition |
| --- | --- |
| **Truth Score** | Composite metric combining Logical Validity and Evidence Score. The final output of ReasonRank. |
| **Evidence Score** | Measures the reliability and independence of source data. One input into the Truth Score. |
| **Logical Validity Score** | Measures the structural soundness of an argument. One input into the Truth Score. |
| **ReasonRank** | The algorithm that produces the Truth Score. Evaluates logic, evidence, and redundancy. |
| **Market Price** | The crowd-determined value of a claim, set by betting volume and sentiment. |
| **Market Stake** | A bet placed by a user on a claim's outcome via the prediction market. |
| **IdeaCredits** | Virtual currency used for betting. Earned through accurate predictions and quality contributions. |

## Architecture

IdeaStockExchange separates truth-seeking from opinion-tracking at the architectural level. The ReasonRank engine and the prediction market operate as independent subsystems. Neither can influence the other's score directly. This separation ensures that popular opinion cannot corrupt logical evaluation, and that rigorous proof cannot suppress genuine crowd insight.

## License

This project is open source. See the LICENSE file for details.
