# Idea Stock Exchange: Competitive Strategy

**Audience:** Contributors deciding how to build features, outsiders evaluating the project, and future Mike when he forgets what the plan was.
**Purpose:** Answer the question "how do we compete with Kalshi and Polymarket?" honestly.
**Status:** Living document. Edit when the strategy changes.

---

## The one-sentence pitch

The Idea Stock Exchange is a prediction market where people bet on whether a belief's score will be above or below a threshold at the end of the month. The score is computed from the underlying argument graph, so the only way to move the score is to post better arguments. This is simultaneously a market and a reasoning platform, and the two halves reinforce each other.

---

## Who we're not competing with

Most of Kalshi's and Polymarket's volume is in event markets: elections, sports, weather, corporate earnings, Fed rate decisions. These are binary events with clean external resolution. A judge rings a bell, the outcome is observed, contracts settle.

**We don't do that, and we shouldn't try.** Competing on event markets means competing on liquidity, UX polish, regulatory infrastructure, and speed to market. Kalshi has CFTC approval, hundreds of millions in funding, and years of head start. Polymarket has Polygon, crypto-native distribution, and a brand. We have none of those advantages and no realistic path to acquiring them.

If you ever hear the project describe itself as "Polymarket but for beliefs," correct the record. That framing guarantees failure. It sets us up to lose on every axis Polymarket is strong on and ignores the axis where we're actually different.

---

## The gap we fill that they can't

Prediction markets only work on events with external resolution. This limits them to a narrow slice of the questions people actually care about.

The questions that matter most are the ones that never resolve:

- Does universal basic income improve outcomes?
- Is carbon pricing effective at reducing emissions?
- Do charter schools outperform traditional public schools?
- Is nuclear power safer than renewables?
- Should the US adopt single-payer healthcare?

Nobody rings a bell on these questions. There's no binary resolution date. No contract can settle on "is UBI good" because "good" depends on values, timeframe, comparison group, and about fifteen other things that people disagree about.

Polymarket and Kalshi cannot touch these questions. Not because they haven't tried, but because their whole mechanism requires external resolution. They resolve on *facts* (did Biden win, did the Fed cut rates). They can't resolve on *arguments*.

We can, because we resolve on an internal fact: the output of our own scoring engine at a specific date. The scoring engine evaluates the arguments that exist in the graph at snapshot time. If you want to move the score, you post better arguments, better evidence, or tighter linkages. The market creates a financial incentive to engage seriously with the reasoning.

**This is the gap.** The world has roughly 10,000 questions that matter and maybe 100 of them are event-market-resolvable. We're going after the other 9,900.

---

## How the two halves reinforce each other

### Why markets need the reasoning platform

Without the scoring engine, a market on "is UBI good" has nothing to settle against. You'd need a judge, and judges bring bias. You'd need a committee, and committees bring politics. You'd need external polls, and polls measure popularity, not truth.

The scoring engine solves the resolution problem. A belief's score at epoch N is a defined computation over a defined graph at a defined time. The inputs are public, the algorithm is public, the output is reproducible. Contracts settle against the snapshot. Nobody needs to trust a judge.

### Why the reasoning platform needs markets

Without markets, a reasoning platform is a wiki. Wikis work for some things (Wikipedia) and fail for others (every "structured debate" site that's ever existed). The difference is engagement. Wikipedia works because people care deeply about their topics. Debate platforms fail because nobody has a reason to come back.

Markets solve the engagement problem. Money on the line is the oldest and most reliable mechanism for getting humans to think carefully. Polymarket's election markets are more accurate than most pollsters, not because traders are smarter than pollsters, but because traders have skin in the game and pollsters don't. We're applying the same principle to arguments.

Users who bet on a belief score have a direct financial incentive to scrutinize the arguments on both sides. They'll find weak evidence and attack it. They'll find missing arguments and add them. They'll identify dubious linkages and challenge them. Every one of these actions improves the graph.

### The design choice this creates

A bettor can also post arguments. This is unusual. In a normal prediction market, you can't edit the resolution condition. In our market, a bettor who's long on "UBI score > 0.6" can post new pro-UBI arguments. Two things follow:

**First, this is a feature, not a bug.** Letting bettors edit the graph is exactly how we get engagement. The whole point is that they care because they have money on the line. Removing that would be like Polymarket refusing to let bettors follow the news.

**Second, the design has to handle it.** A bettor can't just spam low-quality arguments to inflate their side, because:

- Weak arguments drag down the parent column's average (spam backfires mechanically)
- Duplicate arguments compress to one node (volume doesn't matter)
- Fallacy accusations can challenge bad arguments (and those accusations are themselves scored arguments)
- Linkage sub-markets let users bet against relevance claims
- The scoring formula is public, so sophisticated manipulation is visible

This is the central engineering challenge: make the scoring engine robust enough that bettors trying to move the score *by posting bad arguments* fail, and bettors trying to move the score *by posting good arguments* succeed. When that works, the market turns adversarial self-interest into truth-seeking.

This is exactly the mechanism Robin Hanson has been pointing at for decades. We're applying it to a substrate he didn't have — a computed argument score rather than an external event.

---

## Why we survive the "bettors manipulate the score" attack

The obvious failure mode: someone bets big on "score > 0.7," then spams pro-arguments to push the score past 0.7, then cashes out. If this works, the system is broken.

Here's why it doesn't work:

**Duplicate compression.** Ten thousand pro-arguments that say the same thing in different words compress to one node. You can't spam your way to a higher score, because the scoring engine sees through synonym attacks.

**Weak arguments backfire.** Low-quality pro-arguments drag down the average quality of the pro column. Post 500 evidence-free one-liners and your side's score goes *down*, not up. The scoring engine penalizes spam automatically.

**Linkage challenges.** For each argument someone posts, other users can bet that the linkage is weak. If the argument doesn't actually support the conclusion, the linkage sub-market punishes the attacker.

**Evidence scrutiny.** Arguments with bad citations get low evidence scores. Fake citations, misrepresented studies, and cherry-picked data fail here.

**Fallacy counter-arguments.** If someone posts a fallacious argument, other users can post structured fallacy accusations. Those accusations go through the same scoring pipeline. A successful fallacy accusation reduces the target argument's contribution.

**Transparency.** The scoring algorithm is public. Every score is a deterministic function of the graph. Sophisticated manipulation leaves visible traces. Coordinated brigading produces detectable graph patterns.

The net effect: the only reliable way to move the score is to post arguments that *survive attack*. Which means the market pays people to find and defend the truth, because the truth is what survives attack.

This is the whole thesis. If the thesis is wrong, the project doesn't work. If it's right, we have something nobody else has.

---

## Revenue model

**Transaction fees on every bet.** Same as Polymarket and Kalshi. Proven model. No reason to innovate here.

Rough scale: if daily volume is $1M, a 1% fee generates $10K/day ($3.65M/year). To get there, we need users who care about the beliefs we're scoring, not users who just want to gamble (those users will always prefer Polymarket because it has more markets and faster resolution).

**Eventually: data licensing.** The argument graph is a real asset. A dense, well-scored argument graph on major policy questions is useful to:

- Academic researchers studying public reasoning
- Think tanks and policy institutions
- Corporate strategy teams making high-stakes decisions
- Foundations deciding where to allocate funding
- Newsrooms wanting to show "here's the strongest argument on each side"

This is a longer-term revenue stream and not the near-term focus. But it's why the argument graph matters independently of the market. If the market disappeared tomorrow, the graph would still be valuable.

**Never: ads, sponsored content, or manipulated scores.** Any of these would destroy the integrity of the scoring engine, which is the entire asset. Hard no.

---

## Regulatory strategy

**Phase 1: Play money only.** No real currency, no withdrawals, no regulatory exposure. Users compete for reputation and position on leaderboards. This can run indefinitely, in any jurisdiction, without legal risk. It's also the right phase to debug the scoring engine and market mechanics without consequences.

**Phase 2: Limited real money in permissive jurisdictions.** Once the play-money version is stable and has an engaged user base, we explore real-money versions in jurisdictions that allow it. This means consulting lawyers, probably starting offshore, and accepting that US users may be restricted.

**Phase 3: Full regulated markets, maybe.** Kalshi spent years getting CFTC approval. If we ever go this route, it's a multi-year, multi-million-dollar regulatory process. We do it only if the project has succeeded enough at Phase 2 to justify the investment.

**We do not skip phases.** Polymarket paid $1.4M in CFTC fines for operating without approval and lost US users for years. We don't repeat that mistake.

**We build every phase in a way that doesn't foreclose the next.** Play-money contract structure should mirror what real-money contracts would look like. Settlement mechanics should be production-grade even during the play-money phase. Code written in Phase 1 should not need to be rewritten in Phase 2.

---

## Staged plan

### Phase 1: Build the scoring engine (current)

Engineering spec covers this. Not market-related except that the scoring engine is the foundation everything else sits on.

### Phase 2: Play-money prediction market layer

- Monthly epoch snapshots for settlement
- Binary contract structure: "Belief X score > Y at epoch N, yes/no"
- Simple order book or AMM (LMSR is the standard choice; see engineering spec extension)
- Leaderboard showing top traders, top argument-posters, top fallacy-finders
- UI that makes the connection between posting arguments and moving prices explicit

**Goal:** prove the flywheel works. Users engage with arguments because they have money on the line. Argument quality improves because good arguments win bets. Bad arguments lose money and die. If this doesn't work at play-money scale, the project doesn't work at all, and we find out cheaply.

### Phase 3: Argument graph density

Build out the canonical belief pages across policy domains (energy, climate, immigration, healthcare, education). This is mostly content work and is already underway via the PBworks-to-Blogger migration. A prediction market on sparse argument graphs produces boring markets. Dense graphs produce interesting ones.

### Phase 4: Real-money pilot

Jurisdictional research, legal setup, KYC/AML infrastructure, limited launch in permissive markets. This is where real money and real lawyers enter the picture. Do not touch this phase until Phase 2 has proven the mechanics work.

### Phase 5: Research and institutional partnerships

License the graph to researchers. Partner with newsrooms to display "here's the scored argument map" alongside opinion pieces. Work with think tanks on policy-question graphs. This is the long-horizon revenue diversification.

No fixed dates on any of these. We build as best we can. Each phase is shippable as a stand-alone product.

---

## Why this might actually work

Most "wiki for debates" or "structured reasoning platform" projects have failed. Debatepedia died. Kialo has a loyal but tiny user base. Arguman.org is a ghost town. The pattern is clear: people don't come to structured reasoning platforms voluntarily, because structured reasoning is hard and there's no reward for doing it.

The market is the reward. Not because we're turning thinking into gambling, but because a small amount of money at stake is the cleanest known mechanism for getting humans to pay attention. Prediction markets demonstrate this repeatedly: traders on Polymarket election markets are more accurate than pollsters, not because they're smarter, but because they lose money when they're wrong.

We're applying that mechanism to arguments instead of events. It might work. It might not. If it doesn't, we've built a reasoning platform, which still has value. If it does, we have something nobody else has: a market that pays people to improve the quality of public reasoning.

That's worth building, regardless of whether it ever competes with Kalshi or Polymarket on volume. Those are games of a different kind. We're playing something adjacent, and the adjacency is the point.
