# Idea Stock Exchange

> A prediction market for ideas, where arguments are scored, not just shouted.

**Stack:** Next.js (App Router) + TypeScript + React 19, Prisma 7 (SQLite for local dev, PostgreSQL in production), Tailwind CSS v4, Vitest. Not Astro, not MongoDB/Express; if you are pointing an AI tool at this repo, tell it that.

The Idea Stock Exchange is a long-term project to build systematic reasoning infrastructure for public discourse. Each claim gets one page, with every reason to agree and to disagree on the same page and the evidence under each reason, and a score computed from how well those reasons and that evidence hold up. The goal is replacing the chronological chaos of social media with structured, evidence-scored debate that accumulates progress instead of relitigating the same questions forever.

There are two things in this repository, and they do not do the same things:

- **The published site** ([myklob.github.io/ideastockexchange/beliefs](https://myklob.github.io/ideastockexchange/beliefs/)), built by `tools/static-site/` from two flat tables. This is what is live. It scores claims and lets anyone vote on them; it has no market, no currency and no betting.
- **The Next.js app** in `src/`, the older product, which is not published. It carries the market design described under "In the unpublished app" below.

> *We do not need more civic engagement. We need better organization of the engagement that already exists.*

## What the published site does

### ReasonRank: the logic score

Every claim's score comes from the reasons and evidence beneath it, and each reason is itself a claim with its own page, so scoring is recursive, the way Google's PageRank computed page authority from inbound links. A reason contributes to the claim above it:

**sign × (2 × Truth − 1) × Confidence × Linkage × Importance × Uniqueness**

- **Truth**: is the reason's own claim true, as argued on its own page?
- **Linkage** (relevance): if it were true, would the conclusion have to move?
- **Importance**: how much does it matter to the interests at stake?
- **Uniqueness**: does it make a point no other row has made?
- **Confidence**: how much of the work behind its page has been done?

A reason nobody has argued sits at Truth 0.50, so it contributes exactly nothing: a score cannot be padded by listing more reasons. What moves a score is a better argument or evidence, and the [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html) states every rule, including the ones in this project's wiki that the site does not run.

### Votes: what people think, shown and never scored

Anyone with a GitHub account can vote agree or disagree on a claim, and on whether a reason bears on the page it is filed under; only an account's latest vote counts. The counts are shown on the claim's heading line next to its score. Once three or more people have voted on a claim, the home page and the [lists](https://myklob.github.io/ideastockexchange/beliefs/lists.html#votes) rank the gap between the share who agree and the truth score, widest first. That gap is the site's version of the old arbitrage idea: a claim many people agree with that the analysis rates low, or the other way round, is where a reason is missing from the page. A vote never moves a score.

### In the unpublished app: Market Price and IdeaCredits

The Next.js app in `src/` carries a design the published site does not have. Independent of the logic score, users invest virtual currency (**IdeaCredits**) in claims via a constant-product market maker. Buying YES shares pushes the price up; buying NO pushes it down. Prices reflect the crowd's collective probability estimate, separately from whether the claim is logically sound.

The belief-score market layer at [`/markets`](docs/MARKET_LAYER_SPEC.md) goes further: binary contracts on where a belief page's engine score will land at the next monthly snapshot, with LMSR makers that graduate to an order book, atomic spreads, play-money leverage, meta-markets on algorithm changes, and a signed oracle endpoint external markets can settle against. One absolute rule: prices never feed back into scores.

In that design, when ReasonRank and Market Price diverge, rational actors profit:

| Scenario | ReasonRank | Market Price | Action | Rationale |
|---|---|---|---|---|
| Undervalued | High | Low | Buy YES | Logically supported claim the crowd hasn't caught up to yet. |
| Overvalued | Low | High | Buy NO | Popular claim that doesn't survive scrutiny. |
| Fairly valued | Aligned | Aligned | Hold | No edge. |

None of this is on the published site: there is no market, no currency and nothing to bet.

## Read the Methodology

Every rule the engine runs is stated on the published site's own method page, generated from
the same modules the pages use, so it cannot describe a rule the site is not running:

- [How every number is computed](https://myklob.github.io/ideastockexchange/beliefs/method.html): the whole methodology on one page
- [The one formula](https://myklob.github.io/ideastockexchange/beliefs/method.html#formula): what a scored row contributes, and what each factor reads when nobody has argued it
- [Where a page starts](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts): the evidence prior, the eighteen source tiers, and why an uncited argument graph sits at 0.50 forever
- [Confidence](https://myklob.github.io/ideastockexchange/beliefs/method.html#confidence): how much a score has earned the right to count
- [What would change the answer](https://myklob.github.io/ideastockexchange/beliefs/method.html#sensitivity): the single-input sweep
- [ReasonRank](https://myklob.github.io/ideastockexchange/beliefs/method.html#reasonrank): how much of the site depends on a claim
- [Rules in the wiki this site does not run](https://myklob.github.io/ideastockexchange/beliefs/method.html#notrun): each named, with what runs in its place
- [What this cannot do](https://myklob.github.io/ideastockexchange/beliefs/method.html#limits): the limits, stated by the engine rather than about it

## See It Applied

The methodology is being applied to real debates on Kialo:

- [Should Kialo let users post media that supports or weakens each belief?](https://www.kialo.com/should-kialo-let-users-post-media-that-supports-or-weakens-each-belief-65470): proposal for a media-list feature with affiliate-revenue sustainability
- [Should arguments be debated in separate pro/con sections for Truth, Relevance, and Importance?](https://www.kialo.com/should-arguments-be-debated-in-separate-procon-sections-for-logical-validity-verification-importance-and-relevance-65463): adoption of the three-dimension scoring on Kialo
- [Should politicians publicly rank the top ten pros and cons for each vote?](https://www.kialo.com/should-we-require-politicians-to-publicly-rank-the-top-10-procon-arguments-for-each-of-their-votes-60142): show-your-work transparency for elected officials

## The Code

The published site is built by `tools/static-site/` (Python, no server); see its README. The rest of this repository is a [Next.js](https://nextjs.org) application, not published:

- TypeScript frontend with React 19 (App Router)
- Prisma 7 with SQLite via `@prisma/adapter-better-sqlite3`
- Constant-product market maker for the Market Price layer (app only)
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

Open [http://localhost:3000](http://localhost:3000) and head to `/beliefs/[slug]` to see the app's belief page.

### Run a mock AI agent in ten minutes

The ISE is a show-your-work substrate for autonomous agents: an agent does not
publish conclusions, it files decomposed claims with linkage checks, evidence
provenance, and a rationale for every move ([the contract](docs/AI_AGENT_INTEGRATION_SPEC.md)).

```bash
# 1. Start the app (see Getting Started above), then mint an agent key:
npx tsx scripts/create-agent.ts --name demo-agent --operator "you"

# 2. Write a batch payload (shape documented in docs/AI_AGENT_INTEGRATION_SPEC.md):
cat > /tmp/batch.json <<'EOF'
{
  "batchTitle": "Demo: negative income tax",
  "claims": [{
    "statement": "A negative income tax reduces administrative overhead relative to categorical welfare programs",
    "direction": "pro",
    "parentBeliefSlug": "universal-basic-income-should-be-implemented",
    "rationale": "Consolidating categorical programs cuts caseworker cost",
    "fiveStepCheck": {
      "parentWording": "Universal basic income should be implemented",
      "claimWording": "A negative income tax reduces administrative overhead relative to categorical welfare programs",
      "howItSupports": "Lower administrative cost removes a standard objection to implementation",
      "provisionalEstimate": 0.8,
      "flaggedBelowThreshold": false
    },
    "evidence": [{
      "title": "Administrative costs of means-tested transfers",
      "doi": "10.1000/demo",
      "tierClaim": "T1"
    }]
  }]
}
EOF

# 3. File it through the audited ingestion API:
ISE_AGENT_KEY=<key from step 1> npx tsx scripts/ingest-batch.ts /tmp/batch.json
```

Then open [/audit](http://localhost:3000/audit): an AI asserted something, and
every part of its work (the placement, the five-step linkage check, the
evidence provenance, the rationale) is inspectable there and on the batch
page the API links back. Try submitting a score field or a bare topic label
and the API rejects it with the named failure mode. Scores stay bracketed
placeholders until the full ReasonRank engine computes them (market epoch
snapshots run a versioned provisional engine and are labeled as such);
nothing here pretends otherwise.

## Related Projects

- [Forward Party Colorado](https://sites.google.com/view/futureofpolitics/forward-colorado): Process Party platform: parties competing on decision-making methodology, not ideology
- [How to Fix Search](https://sites.google.com/view/howtofixsearch/home): applying the methodology to search engines and information ranking
- [How to Fix Twitter](https://sites.google.com/view/howtofixtwitter/home): applying the methodology to social media and public conversation

## Contribute

Three ways to help:

- **Developers:** clone the repo, pick an issue labeled `good first issue` or `help wanted`. Priority areas include the belief scoring pipeline, the Belief Equivalency Engine, and frontend belief display components.
- **Researchers and writers:** use the templates in [`templates/`](templates/) to add or improve a belief page. Argue Truth, Linkage, Importance and Uniqueness on pages of their own rather than typing a number. Classify each finding by one of the eighteen source types on the [method page](https://myklob.github.io/ideastockexchange/beliefs/method.html#starts).
- **Everyone:** add to a page from the page. Every belief on the [published site](https://myklob.github.io/ideastockexchange/beliefs/) carries a form under each of its tables (a reason to agree or disagree, a finding, a prediction, a criterion, a cost or benefit, an interest) and a propose-a-belief form; as you type, the page shows the claims already there that say the same thing, and a duplicate becomes a vote for the claim already on the site. Submitting opens a prefilled [GitHub issue](https://github.com/myklob/ideastockexchange/issues/new/choose), so you need a free GitHub account; an Action then records your vote or opens a pull request with your rows for the maintainer to merge. Votes are shown next to the score as what people think and never move it. Star the repo, share a belief page, or join the discussion in [GitHub Discussions](https://github.com/myklob/ideastockexchange/discussions).

## License

MIT. Maintained by Mike Laub. Methodology on the [published method page](https://myklob.github.io/ideastockexchange/beliefs/method.html); code on [GitHub](https://github.com/myklob/ideastockexchange); applied examples on [Kialo](https://www.kialo.com).
