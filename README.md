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
