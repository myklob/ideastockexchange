# Components

Global, reusable UI components shared across multiple features. A component belongs here only if it is used by **three or more** different features (Rule of Three). Feature-specific components stay inside their feature folder.

## Components

| Component | Purpose |
|-----------|---------|
| `ClaimCard.tsx` | Card view of a market claim. |
| `TradePanel.tsx` | Buy/sell panel for market positions. |
| `PortfolioView.tsx` | A user's open market positions. |
| `ArbitrageDashboard.tsx` | Cross-market arbitrage opportunities. |
| `StrengthSpectrumBar.tsx` | Claim-strength position on the weak↔extreme spectrum. |
| `debate-topic/` | Section components for `/debate-topics/[slug]` pages. |

The sample-data topic prototype components (AbstractionLadder, ConfidenceScale, ValenceSpectrum, MasterView, TopicObjectiveCriteria) were removed when `/topic/[id]` became a redirect to the database-backed `/topics/[slug]` hub pages, which render their own tables.
