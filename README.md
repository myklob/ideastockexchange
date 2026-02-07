# IdeaStockExchange

A prediction market for ideas. Claims are valued based on two distinct metrics: ReasonRank (logical fundamentals) and Market Price (capital allocation). Users invest in claims to profit from the gap between an idea's logical integrity and its current market valuation.

## Core Philosophy

Ideas are commodities. Every claim on this platform has an intrinsic value derived from its logical structure and evidence base (ReasonRank), and a market value determined by capital allocation (Market Price). When these two values diverge, an arbitrage opportunity exists.

This system eliminates noise. Users only participate when they are willing to risk capital on being wrong. There is no social approval mechanism: no likes, no upvotes, no sentiment scores. The only signal is money on the line.

## Two Independent Valuation Systems

### ReasonRank (The Fundamentals)

ReasonRank is the intrinsic value of a claim. It is computed algorithmically by analyzing:

- **Logical Validity:** The structural soundness of the argument. Are the premises connected to the conclusion? Are there fallacies?
- **Evidence Quality:** The strength, relevance, and reliability of cited evidence. Peer-reviewed sources score higher than anecdotes.
- **Sub-Argument Depth:** Claims with well-developed "pro" and "con" sub-arguments receive deeper analysis. A claim with no counter-arguments is treated as under-examined.

ReasonRank operates independently of market activity. A claim can have a high ReasonRank and zero market interest. The algorithm does not care what users think: it cares what the logic supports.

**Score Range:** 0.0 (no logical merit) to 1.0 (airtight reasoning with strong evidence).

### Market Price (The Price)

Market Price is determined by a **Constant Product Market Maker (CPMM)**. Users buy YES or NO shares on any claim. The price adjusts automatically based on supply and demand.

**CPMM Formula:**

```
x * y = k

x = YES shares in the liquidity pool
y = NO shares in the liquidity pool
k = constant product (invariant)
```

When a user buys YES shares, `x` decreases and `y` increases, pushing the YES price up. The reverse happens for NO shares.

**Price Calculation:**

```
YES price = y / (x + y)
NO price  = x / (x + y)
```

Prices always sum to 1.0. A YES price of 0.70 means the market assigns a 70% probability that the claim is true.

### The Arbitrage Opportunity

When ReasonRank and Market Price diverge, rational actors profit:

| Scenario | ReasonRank | Market Price | Action | Rationale |
|---|---|---|---|---|
| Undervalued | 0.85 | 0.40 | Buy YES | Logic supports the claim but the market has not caught up. |
| Overvalued | 0.20 | 0.75 | Buy NO | The market is overpricing a logically weak claim. |
| Fairly Valued | 0.60 | 0.58 | Hold | No significant edge exists. |

The **Arbitrage Dashboard** surfaces claims with the largest gap between ReasonRank and Market Price. This is where profit opportunities live.

## TruthScore

TruthScore is a composite metric that reflects the fundamental quality of a claim. It is not a popularity measure.

```
TruthScore = LogicalValidity * EvidenceQuality
```

- **LogicalValidity** (0.0 to 1.0): Measures structural soundness of the argument chain.
- **EvidenceQuality** (0.0 to 1.0): Measures the strength and reliability of supporting evidence.

Market Price is a **separate variable** that reacts to TruthScore. It is never an input to TruthScore. The market can be wrong: that is the entire point.

## Investment Mechanics

### IdeaCredits

Users start with a balance of IdeaCredits (the platform currency). These credits are spent to buy shares in claims.

### Buying Shares

1. Select a claim.
2. Choose YES (the claim is true) or NO (the claim is false).
3. Specify the number of IdeaCredits to invest.
4. The CPMM calculates how many shares you receive based on current pool state.

### Resolution and Payout

When a claim resolves (via evidence, expert adjudication, or time expiry):
- **YES resolves correct:** YES shareholders receive 1.0 credit per share. NO shares are worth 0.
- **NO resolves correct:** NO shareholders receive 1.0 credit per share. YES shares are worth 0.

### User Portfolio

Every user has a portfolio tracking:
- **Current Holdings:** Active positions across all claims.
- **Realized P&L:** Profit and loss from resolved claims.
- **Unrealized P&L:** Paper gains/losses on open positions.
- **ROI:** Return on investment calculated from historical accuracy.

## Risk Allocation

Every investment is a risk allocation decision. Users signal their confidence not through social gestures but through capital commitment. A user who stakes 1,000 IdeaCredits on a claim is making a stronger statement than one who stakes 10: and they stand to lose more if they are wrong.

This mechanism filters noise. Frivolous claims attract no capital. Well-reasoned claims attract investment. The market rewards analytical skill and penalizes groupthink.

## Technical Architecture

- **Framework:** Next.js with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Market Engine:** Constant Product Market Maker (CPMM)
- **Scoring Engine:** ReasonRank algorithm (logical analysis)
- **Frontend:** React components with TailwindCSS

## Database Schema

Key tables:
- `claims`: Core claim data, ReasonRank score, TruthScore
- `liquidity_pools`: YES/NO share reserves, constant product invariant
- `shares`: Individual share ownership records
- `user_portfolios`: Aggregated ROI and P&L tracking
- `evidence`: Supporting evidence linked to claims
- `sub_arguments`: Pro/con arguments attached to claims

## Getting Started

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## License

MIT
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
