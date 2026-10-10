# Template: Product Review

> Generated from [`templates/product-review-template.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/product-review-template.html) by `tools/wiki_templates.py`. The HTML file is the template; edit it, not this page. CI regenerates this page and refuses a copy that has drifted.

**Kind:** Special analysis  
**Purpose:** A belief page specialised to "[Product] is the best [type] for [use]": a scorecard, then the ordinary two-sided tables.  
**Rendered by:** src/app/product-reviews/[slug]  

**Currency rules.** `tools/check_templates.py` refuses a template that uses the retired column names Argument Score or Evidence Score (the current names are Truth, Importance and Linkage), an em dash, an empty anchor, or an address that looks like an email; a topic template must carry the four magnitude bands Modest, Moderate, Strong and Total and treat engagement as a section, not a continuum. CI runs it on every change under `templates/`, and `tools/wiki_templates.py --check` refuses a wiki copy that differs from the HTML.

Square-bracketed text is a placeholder for the author to fill; a token with underscores, such as [Truth_Score], is a slot the software fills. A score cell is blank until a real page stands behind it. Each table on the built site carries a form that files a row in it; a form cannot be submitted from a wiki page, so the forms are left out here.

---
> **Builder notes**
>
> ===== ISE PRODUCT REVIEW MASTER TEMPLATE (July 2026) =====
> The consumer-market sibling of the Belief Analysis template: the page is a
> belief page for one product claim. Mirrored by the React implementation in
> src/app/product-reviews/[slug]/page.tsx and the section components in
> src/features/product-reviews/components/*. If you change this template,
> update that page. The two must stay in sync.
>
> HARD RULES (every generation must follow):
>   1. THE TITLE MUST CARRY A SCOPE: bare "best" fails the costability test
>      (compared to what, measured in what, for whom). The claim is always
>      "[Product] is the best [Product Type] for [use case or user profile]".
>   2. CRITERIA BEFORE BRANDS: fill the Category Criteria table before
>      touching performance or arguments. The criteria apply to every product
>      in the category and are the yardstick the rest of the page measures
>      against.
>   3. Every table row is a scored relationship and ranks by its score column,
>      never by editorial placement; the software shows each table's top five
>      rows and collapses the rest.
>   4. All scores stay [bracketed] until the ReasonRank engine computes them;
>      never fill a score cell for an empty row; never present a placeholder
>      as computed output. Scorecard cells are auto-derived from the tables
>      below, never hand-picked.
>   5. Hidden-interest attributions (affiliate money, ecosystem lock-in) are
>      scored claims requiring evidence, applied with equal suspicion to
>      recommenders of this product and recommenders of alternatives.
>   6. The Divergence Score on the trade-offs table is the score of the
>      sub-debate that the advertised optimization differs from the actual one.
>   7. Costs and benefits keep their units and never collapse across
>      categories unless the conversion is stated.
>   8. Worked examples (Ford trucks, Apple phones) live on hub pages and
>      instance lists, never inside this template.
>   9. Emoji section headers are this template's established convention;
>      table header rows use #f0f3f6; spell words out, no abbreviations,
>      no symbols in place of words.
>
> SECTION ORDER:
>   Header (breadcrumb / scoped-claim H1 / net score, category, price segment /
>   method line) → Scorecard → Category Criteria → Argument Trees →
>   Performance Against the Criteria → Design Trade-offs → Interests Behind
>   the Recommendations → Assumptions Required → Alternatives → Cost-Benefit
>   (total cost of ownership + total value delivered) → Who Should Buy This
>   (+ Decision rules) → Decision Obstacles → Biases in the Reviews → Media →
>   Recognition → Ecosystem and Lock-in → Contribute

Home (`/`) › Topics (`/topics`) › [Product Category] › [This Product]

AUTHORING RULES (hidden; readers never see this). This is the consumer-market sibling of the Belief Analysis template; the page is a belief page for one product claim. THE TITLE MUST CARRY A SCOPE: bare "best" fails the costability test (compared to what, measured in what, for whom), so the claim is always "[Product] is the best [Product Type] for [use case or user profile]". CRITERIA BEFORE BRANDS is this template's law: fill the Category Criteria table before touching performance or arguments; the criteria apply to every product in the category and are the yardstick the rest of the page measures against. Every table row is a scored relationship and ranks by its score column, never by editorial placement; the software shows each table's top five rows and collapses the rest. All scores stay [bracketed] until the ReasonRank engine computes them; never fill a score cell for an empty row; never present a placeholder as computed output. Scorecard cells are auto-derived from the tables below, never hand-picked. Argument cells follow the standalone-claim rule and the opening-words naming convention. Hidden-interest attributions (affiliate money, ecosystem lock-in) are scored claims requiring evidence, applied with equal suspicion to recommenders of this product and recommenders of alternatives. The Divergence Score on the trade-offs table is the score of the sub-debate that the advertised optimization differs from the actual one. Costs and benefits keep their units and never collapse across categories unless the conversion is stated. Worked examples (Ford trucks, Apple phones) live on hub pages and instance lists, never inside this template. This page maps to the /product-reviews/[slug] route in the repo; keep new sections backward-compatible with it. Emoji section headers are this template's established convention; table header rows use #f0f3f6; spell words out, no abbreviations, no symbols in place of words.

# [Product] is the best [Product Type] for [use case or user profile]

Net Belief Score: [Computed from argument scores] \| Category (`/topics`): [Product Type] > [Subcategory] > [Specific Brand / Model] \| Price segment: [Budget / Mid-range / Premium]

Method: ReasonRank (`/algorithms/reason-rank`) · Evidence Tiers (`/algorithms/evidence-scores`) · Linkage Scores (`/algorithms/linkage-scores`) · Cost-Benefit Analysis (`/cba`). All [bracketed] scores are placeholders until the engine computes them.

# 📊 Scorecard

| Bottom line | [One-sentence verdict scoped to the use case in the title] |
|---|---|
| Strongest reason to agree | [Argument] · Impact [XX] (auto-derived: top pro row in Argument Trees) |
| Strongest reason to disagree | [Argument] · Impact [XX] (auto-derived: top con row in Argument Trees) |
| Best for | [User profile] (auto-derived: top row of Who Should Buy This) |
| Not for | [User profile] (auto-derived: top "not ideal" row of Who Should Buy This) |
| What would change this verdict | [The measurement or price change that would flip the net score] |

# 🧪 Category Criteria: What Makes a Good [Product Type]?

| Criterion (applies to every product in the category) | How to measure it | Importance | Score |
|---|---|---|---|
| [Performance standard] | [Test, rating, or unit] | [XX] |   |
| [Reliability / durability metric] | [Failure-rate data, warranty claims, long-term tests] | [XX] |   |
| [Cost-effectiveness measure] | [Total cost of ownership per year or per unit of output] | [XX] |   |
| [Safety / quality standard] | [Certification, crash test, compliance rating] | [XX] |   |

# 🔍 Argument Trees (`/algorithms/reason-rank`)

| ✅ Reasons to Agree | Score | Linkage | Importance | Impact | ❌ Reasons to Disagree | Score | Linkage | Importance | Impact |
|---|---|---|---|---|---|---|---|---|---|
| [Complete claim, e.g. superior measured performance on [criterion], linked to its own belief page] |   |   |   |   | [Complete claim, e.g. inferior performance on [criterion], linked to its own belief page] |   |   |   |   |
| [Better total cost of ownership than [named rival], with units] |   |   |   |   | [Worse total cost of ownership than [named rival], with units] |   |   |   |   |
| [Higher reliability shown by [data source]] |   |   |   |   | [Lower reliability shown by [data source]] |   |   |   |   |

Net Belief Score = (sum of pro Impacts − sum of con Impacts), Impact = Score × Linkage × Importance, computed by the engine (`/algorithms/reason-rank`).

# 📂 Performance Against the Criteria

| Criterion (from the table above) | This product's measured performance | Category average / best rival | Evidence (source + tier) | Impact |
|---|---|---|---|---|
| [Criterion] | [Specific data, with units] | [Specific data, with units] | [Source] Tier 1 |   |
| [Criterion] | [Specific data, with units] | [Specific data, with units] | [Source] Tier 2 |   |

Tier key: Tier 1 independent lab tests and certified ratings · Tier 2 professional reviewer consensus, third-party-verified manufacturer data · Tier 3 aggregated user reviews, investigative journalism · Tier 4 individual testimonials, unverified manufacturer claims. See Evidence (`/algorithms/evidence-scores`).

# ⚖️ Design Trade-offs

|   | Optimizes for | Sacrifices | Score |
|---|---|---|---|
| Advertised (what the manufacturer says) | [Emphasized capability] | [Acknowledged trade-off, e.g. higher price] |   |
| Actual (what the design choices and evidence show) | [What the engineering actually prioritizes] | [The compromise the design actually requires] |   |
| Divergence Score | [How far the advertised optimization differs from the actual one; scored by its own sub-debate] |   |   |

# 💡 Interests Behind the Recommendations

| Those who recommend this product | Score | Those who recommend alternatives | Score |
|---|---|---|---|
| [Who they are, what they gain, what they optimize for] |   | [Who they are, what they gain, what they optimize for] |   |
| [Candidate hidden interest, e.g. affiliate revenue or ecosystem lock-in, with the evidence that supports the attribution] |   | [Candidate hidden interest, with the evidence that supports the attribution] |   |

# 📜 Assumptions (`/algorithms/assumptions`) Required

| Required to believe this is the best [Product Type] for [use case] | Score | Required to believe an alternative is better | Score |
|---|---|---|---|
| [The priority or weighting you must hold] |   | [The priority or weighting you must hold] |   |
| [The trade-off you must accept] |   | [The trade-off you must accept] |   |

# 🔄 Alternatives

| Alternative | Relationship | Key difference from this product | Score |
|---|---|---|---|
| [Product, linked to its own review page] | [Premium / Budget / Lateral] | [What it does better or differently, with units where possible] |   |
| [Product, linked to its own review page] | [Premium / Budget / Lateral] | [What it does better or differently] |   |

# 💰 Cost-Benefit Analysis (`/cba`)

### Total cost of ownership

| Cost item | Estimate (with units) | Type | Evidence (source + tier) | Score |
|---|---|---|---|---|
| [Purchase price] | [$X] | [Initial] | [Source] Tier 1 |   |
| [Maintenance, consumables, energy] | [$X per year] | [Ongoing] | [Source] Tier 2 |   |
| [Learning curve, switching costs, lock-in] | [Hours or $X] | [Hidden] | [Source] |   |
| [What the same money buys elsewhere] | [$X] | [Opportunity] | [Source] |   |

### Total value delivered

| Value item | Measure (with units) | Timeframe | Evidence (source + tier) | Score |
|---|---|---|---|---|
| [Performance on the key criteria] | [Measured result] | [Short-term (0-2 years)] | [Source] Tier 1 |   |
| [Durability, retained resale value] | [Expected lifespan, resale percentage] | [Long-term (3+ years)] | [Source] Tier 3 |   |
| [User satisfaction] | [Rating data] | [Short-term / Long-term] | [Source] |   |

# 👥 Who Should Buy This

| Ideal for | Score | Not ideal for | Score |
|---|---|---|---|
| [User type, need, budget profile] |   | [User type whose priorities point elsewhere] |   |

### Decision rules

| If you prioritize [criterion], buy [this product / named alternative], because [evidence] | Score |
|---|---|
| If you prioritize [criterion A]: buy [option] because [evidence] |   |
| If you prioritize [criterion B]: buy [option] because [evidence] |   |
| If you need both [A] and [B]: consider [compromise option] because [how it balances the trade-off] |   |
| If budget is the primary concern: [budget option] sacrifices [X] but delivers [Y] |   |

# 🚧 Decision Obstacles

| Why buyers overpay in this category | Score | Why buyers underinvest in this category | Score |
|---|---|---|---|
| [Category-specific pattern, e.g. brand loyalty outweighing measured value] |   | [Category-specific pattern, e.g. shopping on sticker price while ignoring total cost of ownership] |   |

# 🧠 Biases in the Reviews

| Distorting the positive reviews | Score | Distorting the negative reviews | Score |
|---|---|---|---|
| [e.g. post-purchase rationalization, affiliate incentives, brand halo] |   | [e.g. negativity bias, unrealistic expectations, user error blamed on the product] |   |

# 📚 Media (`/media`)

| Reviews supporting the verdict | Score | Reviews challenging the verdict | Score |
|---|---|---|---|
| [Resource (author / channel, year), type: video, written, head-to-head comparison, long-term user report] |   | [Resource (author / channel, year), type] |   |

# 🏆 Recognition

| Independent recognition (award, certifier, criteria) | Score | Manufacturer claims (marketing awards, self-selected statistics) | Score |
|---|---|---|---|
| [Third-party award with the criteria it used] |   | [Claim, and what it cherry-picks] |   |

# 🧭 Ecosystem and Lock-in

| Item | Type | Cost or commitment | Score |
|---|---|---|---|
| [Prerequisite or compatible system] | [Upstream: needed first] | [$X or commitment] |   |
| [Accessory or upgrade] | [Downstream: wanted after] | [$X] |   |
| [Future purchase this commits you to, difficulty of switching later] | [Lock-in] | [Switching cost] |   |

Contribute reviews, evidence, criteria, or alternatives: Contact me (`/contact`) · [GitHub](https://github.com/myklob/ideastockexchange)
