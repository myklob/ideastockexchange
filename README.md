# Idea Stock Exchange

> A prediction market for ideas, where arguments are scored, not just shouted.

The Idea Stock Exchange is a long-term project to build systematic reasoning infrastructure for public discourse. It treats arguments like financial instruments: each claim has both an intrinsic value derived from logic and evidence (**ReasonRank**) and a market value determined by crowd conviction (**Market Price**). When the two diverge, an arbitrage opportunity exists. The goal is replacing the chronological chaos of social media with structured, evidence-scored debate that accumulates progress instead of relitigating the same questions forever.

> *We do not need more civic engagement. We need better organization of the engagement that already exists.*

## Three Pillars

### ReasonRank — the logic score

Every claim is scored on three independent dimensions:

- **Truth** — is the claim accurate and logically coherent?
- **Relevance** — does the supporting argument actually bear on the conclusion?
- **Importance** — how much does the argument move the parent claim if true?

An argument's contribution to its parent equals **Truth × Relevance × Importance**. Scoring is recursive: a claim's score is computed from the scores of its sub-arguments, the way Google's PageRank computed page authority from inbound links.

### Market Price — the conviction score

Independent of the logic score, users invest virtual currency (**IdeaCredits**) in claims via a constant-product market maker. Buying YES shares pushes the price up; buying NO pushes it down. Prices reflect the crowd's collective probability estimate, separately from whether the claim is logically sound.

### The arbitrage

When ReasonRank and Market Price diverge, rational actors profit:

| Scenario | ReasonRank | Market Price | Action | Rationale |
|---|---|---|---|---|
| Undervalued | High | Low | Buy YES | Logically supported claim the crowd hasn't caught up to yet. |
| Overvalued | Low | High | Buy NO | Popular claim that doesn't survive scrutiny. |
| Fairly valued | Aligned | Aligned | Hold | No edge. |

Both gaps are visible. No other platform shows you both numbers and lets you bet on the gap closing.

## Read the Methodology

The methodology is documented in detail across an open wiki. Start with the foundations:

- [Home page on PBworks](http://myclob.pbworks.com/w/page/21957696/Colorado%20Should) — the wiki's entry point
- [FAQ and common criticisms](http://myclob.pbworks.com/w/page/162495654/Frequently%20Questions%20and%20Critisisms) — eighteen questions answered, including "who decides what's true," "isn't this vulnerable to brigading," and "won't one political tribe dominate"
- [Truth Score](http://myclob.pbworks.com/w/page/21960078/truth) — the composite metric and what feeds into it
- [Linkage Scores (Relevance)](http://myclob.pbworks.com/w/page/159338766/Linkage%20Scores) — how the system catches the True-But-Irrelevant pattern
- [Importance Score](http://myclob.pbworks.com/w/page/162731388/Importance%20Score) — why an argument can be true and relevant but trivial
- [Logical Validity Score](http://myclob.pbworks.com/w/page/159235779/Logical%20Validity) — six logic battlegrounds: fallacies, contradictions, evidence trees, metaphor analysis, prediction tracking, validity inheritance
- [ReasonRank algorithm](http://myclob.pbworks.com/w/page/159300543/ReasonRank) — how the scores compose

## See It Applied

The methodology is being applied to real debates on Kialo:

- [Should Kialo let users post media that supports or weakens each belief?](https://www.kialo.com/should-kialo-let-users-post-media-that-supports-or-weakens-each-belief-65470) — proposal for a media-list feature with affiliate-revenue sustainability
- [Should arguments be debated in separate pro/con sections for Truth, Relevance, and Importance?](https://www.kialo.com/should-arguments-be-debated-in-separate-procon-sections-for-logical-validity-verification-importance-and-relevance-65463) — adoption of the three-dimension scoring on Kialo
- [Should politicians publicly rank the top ten pros and cons for each vote?](https://www.kialo.com/should-we-require-politicians-to-publicly-rank-the-top-10-procon-arguments-for-each-of-their-votes-60142) — show-your-work transparency for elected officials

## The Code

This repository is a [Next.js](https://nextjs.org) application:

- TypeScript frontend with React 19 (App Router)
- Prisma 7 with SQLite via `@prisma/adapter-better-sqlite3`
- Constant-product market maker for the Market Price layer
- ReasonRank engine for the logic layer
- Tailwind CSS v4

MIT licensed; contributors welcome.

### Getting Started

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and head to `/beliefs/[slug]` to see the canonical belief page — the heart of the product.

## Related Projects

- [Forward Party Colorado](https://sites.google.com/view/futureofpolitics/forward-colorado) — Process Party platform: parties competing on decision-making methodology, not ideology
- [How to Fix Search](https://sites.google.com/view/howtofixsearch/home) — applying the methodology to search engines and information ranking
- [How to Fix Twitter](https://sites.google.com/view/howtofixtwitter/home) — applying the methodology to social media and public conversation

## Contribute

Three ways to help:

- **Developers:** clone the repo, pick an issue labeled `good first issue` or `help wanted`. Priority areas include the belief scoring pipeline, the Belief Equivalency Engine, and frontend belief display components.
- **Researchers and writers:** use the [Belief Template](http://myclob.pbworks.com/w/page/21959883/Template) to add or improve a belief page. Score arguments using Truth, Relevance, and Importance. Classify evidence as **T1** (peer-reviewed), **T2** (expert/institutional), **T3** (journalism/survey), or **T4** (opinion/anecdote).
- **Everyone:** star the repo. Share a belief page on social media. Submit a new belief as a [GitHub issue](https://github.com/myklob/ideastockexchange/issues) using the belief taxonomy template. Join the discussion in [GitHub Discussions](https://github.com/myklob/ideastockexchange/discussions).

## License

MIT. Maintained by Mike Laub. Methodology documented on the [PBworks wiki](http://myclob.pbworks.com); code on [GitHub](https://github.com/myklob/ideastockexchange); applied examples on [Kialo](https://www.kialo.com).
