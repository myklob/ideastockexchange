# Idea Stock Exchange

> Every political debate starts from scratch. Every rebuttal gets reinvented. Nothing accumulates. The ISE fixes that.

The **Idea Stock Exchange** is an open-source platform that gives every argument a permanent home — scored, linked, and organized so that debates actually move forward instead of cycling endlessly.

Think Wikipedia for debates, but with a scoring engine that evaluates the strength of each argument, not just its popularity.

---

## What It Does

Every belief on the platform gets two independent scores:

| Score | What It Measures | Who Controls It |
|-------|-----------------|-----------------|
| **ReasonRank** | Logical structure + evidence quality | The algorithm |
| **Market Price** | Crowd conviction | The prediction market |

When ReasonRank and Market Price diverge, you've found an arbitrage opportunity — a claim that's either more solid than people think, or more fragile.

**TruthScore** = LogicalValidity × EvidenceQuality. The market can be wrong. That's the whole point.

---

## Live Examples

These belief pages show the ISE template in action — each one has pro/con argument trees, evidence scored by type (T1=peer-reviewed through T4=opinion), objective criteria, biases, and conflict resolution:

| Belief | Positivity | Net Score | Status |
|--------|-----------|-----------|--------|
| [America should reform its immigration laws](http://myclob.pbworks.com/w/page/21957696/) | +80% | +186 | ✅ Complete |
| [America should invest in energy research](http://myclob.pbworks.com/w/page/21957696/) | +85% | +262 | ✅ Complete |
| [America should encourage legal immigration](http://myclob.pbworks.com/w/page/21957696/) | +85% | +232 | ✅ Complete |
| [America should streamline high-skill worker recruitment](http://myclob.pbworks.com/w/page/21957696/) | +85% | +216 | ✅ Complete |
| [America should end illegal immigration](http://myclob.pbworks.com/w/page/21957696/) | +60% | +34 | ✅ Complete |
| [America should aim for one billion citizens](http://myclob.pbworks.com/w/page/21957696/) | +55% | +20 | ✅ Complete |
| [A strong America is good for the planet](http://myclob.pbworks.com/w/page/21957696/) | +70% | +70 | ✅ Complete |

---

## The Scoring System

Each argument in a belief tree gets three scores:

- **Truth (0–100):** How well-supported is the claim?
- **Linkage (0–100%):** How directly does this argument connect to the root belief?
- **Importance (0–100):** How much does this argument shift the overall score?

**Weighted Score** = Truth × Linkage

Evidence is classified by type:
- **T1** = Peer-reviewed study / government data
- **T2** = Expert institutional report
- **T3** = Quality journalism / survey
- **T4** = Opinion / anecdote (lowest weight)

The net belief score = sum of weighted pro arguments − sum of weighted con arguments.

---

## Architecture

- **Framework:** Next.js with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Market Engine:** Constant Product Market Maker (CPMM)
- **Scoring Engine:** ReasonRank algorithm
- **Frontend:** React + TailwindCSS

Key tables: `claims`, `liquidity_pools`, `shares`, `user_portfolios`, `evidence`, `sub_arguments`

```sh
npm install
npx prisma generate
npx prisma db push
npm run dev
```

---

## 🤝 How to Contribute

### For Developers
- Clone the repo and run `npm install && npx prisma generate && npm run dev`
- Pick an open issue labeled `good first issue` or `help wanted`
- **Priority areas:** belief scoring pipeline, Belief Equivalency Engine, frontend belief display components

### For Researchers & Writers
- Use the [Belief Template](http://myclob.pbworks.com/w/page/21959883/Template) to add or improve a belief page
- Score arguments using Truth, Linkage, and Importance
- Add Falsifiability Conditions and Burden of Proof to any belief page missing them
- Classify evidence by type: T1 through T4

### For Everyone
- ⭐ **Star the repo** — it costs nothing and helps attract contributors
- Share a belief page on social media with **#IdeaStockExchange**
- Submit a new belief as a [GitHub Issue](https://github.com/myklob/ideastockexchange/issues) using the belief taxonomy template
- Join the [Discussions](https://github.com/myklob/ideastockexchange/discussions)

All contributions follow the daily review protocol. See `OBJECTIVE.md` for standards.

---

## Templates

| Template | Purpose | Link |
|----------|---------|------|
| Belief Analysis | Full pro/con belief page | [View](http://myclob.pbworks.com/w/page/21959883/Template) |
| Topic Organization | Beliefs grouped by spectrum position | [View](http://myclob.pbworks.com/w/page/162490623/Beliefs_on_topic_organized_by_Spectrum_Positions) |
| Product Review | Rate books, films, tools with ISE scoring | [View](http://myclob.pbworks.com/w/page/162496863/Product%20Review%20Template) |
| Media | Evidence and media resources | [View](http://myclob.pbworks.com/w/page/21958666/media) |
| Belief Equivalency | Compare belief strength across topics | [View](http://myclob.pbworks.com/w/page/163582959/Belief_equivalency_Score) |

---

**License:** MIT
