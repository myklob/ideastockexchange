# Template: Conflict Analysis

> Generated from [`templates/conflict-analysis.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/conflict-analysis.html) by `tools/wiki_templates.py`. The HTML file is the template; edit it, not this page. CI regenerates this page and refuses a copy that has drifted.

**Kind:** Special analysis  
**Purpose:** One conflict between named stakeholders: ranked interest profiles, the evidence ledger testing linkage accuracy, judging the interests, the compromise engine, the duplicate reduction log.  
**Rendered by:** follows the belief page's conflict resolution framework; no dedicated renderer  

**Currency rules.** `tools/check_templates.py` refuses a template that uses the retired column names Argument Score or Evidence Score (the current names are Truth, Importance and Linkage), an em dash, an empty anchor, or an address that looks like an email; a topic template must carry the four magnitude bands Modest, Moderate, Strong and Total and treat engagement as a section, not a continuum. CI runs it on every change under `templates/`, and `tools/wiki_templates.py --check` refuses a wiki copy that differs from the HTML.

Square-bracketed text is a placeholder for the author to fill; a token with underscores, such as [Truth_Score], is a slot the software fills. A score cell is blank until a real page stands behind it. Each table on the built site carries a form that files a row in it; a form cannot be submitted from a wiki page, so the forms are left out here.

---
> **Builder notes**
>
> ISE TEMPLATE: Conflict / Belief Analysis Page
>     Usage: One page per conflict, policy debate, or belief claim.
>     This is the full stakeholder analysis template, the "conflict node"
>     where Stakeholder profiles and Interest nodes meet.
>
>     SECTIONS (in order):
>       0. Header + Summary Stats
>       1. Involved Stakeholders (demographics + power overview)
>       2. Ranked Interest Profiles (sorted by Validity | Confidence | Composite)
>       3. Evidence Validating the Motives (Linkage Accuracy test)
>       4. Judging the Interests (Validity test)
>       5. Shared Interests & Compromise Engine
>       6. Semantic Clustering (duplicate reduction log)
>       7. Contribute
>
>     Replace all [BRACKETED] placeholders with real data.

> **Builder notes**
>
> Breadcrumb

Home (`/`) › Topics (`/topics`) › [Parent Topic] › [Conflict Name]

> **Builder notes**
>
> ── PAGE HEADER ──

Topic: [Category] > [Subcategory]

Dewey: [number] \| ISE ID: [CFL-XXX]

ISE Interest Analysis Framework  
[GitHub](https://github.com/myklob/ideastockexchange)

# Conflict Node: [Conflict Name]

[Full description, 2-3 sentences providing context and defining the scope of this conflict node.]

> **Builder notes**
>
> Summary stats bar

[N]Stakeholders

[N]Interests Mapped

[N]High Validity (80+)

[N]Pending Evidence

[N]Invalid / Zero-Sum

[N]/100Resolution Score

Analysis scope: This page maps the underlying motivations of all stakeholders involved in this conflict. Interests are scored on Validity (ethical legitimacy, 0-100) and Linkage Accuracy (confidence this actually motivates the group, 0-100). The default sort surfaces the highest-validity, best-evidenced motivations first.

> **Builder notes**
>
> ════════════════════════════════════════════════════════════
>       SECTION 1, INVOLVED STAKEHOLDERS
>       One row per stakeholder. Link name to /stk/[id].
>       ════════════════════════════════════════════════════════════

## 👥 Involved Stakeholders

Representation and power overview. Click any stakeholder to view their full profile. Power = average of 5 dimensions (Political / Economic / Military / Narrative / Institutional).

> **Builder notes**
>
> mini power bars, P=Political E=Economic M=Military N=Narrative I=Institutional

> **Builder notes**
>
> Add one row per stakeholder

| Stakeholder | Position | Role in This Conflict | Pop. % | Rep. Conf. | Power (0-100) | Primary Power Lever |
|---|---|---|---|---|---|---|
| [Stakeholder Name] [One-line description] | Supporter | [e.g., Maximum Pressure Advocate] | [e.g., <0.1%] | [N]/100 | P[N] M[N]  
Avg: [avg] | [e.g., Military force, intelligence, institutional leverage] |
| [Stakeholder Name] [One-line description] | Opponent | [e.g., Multilateral Diplomat] | [e.g., ] | [N]/100 | E[N] I[N]  
Avg: [avg] | [e.g., Economic leverage, treaty authority, UNSC procedures] |

---

> **Builder notes**
>
> ════════════════════════════════════════════════════════════
>       SECTION 2, RANKED INTEREST PROFILES
>       Default sort: Composite (Validity×0.6 + Linkage×0.4) descending.
>       Supporter interests grouped first (green header), then Opponents (red).
>       ════════════════════════════════════════════════════════════

## 🎯 Ranked Interest Profiles, The "Why"

Extracted motivations scored by ethical legitimacy (Validity (`/algorithms/truth-scores`)) and confidence they actually drive behavior (Linkage Accuracy (`/algorithms/linkage-scores`)). Composite = Validity × 0.6 + Linkage × 0.4.  
*Sort by: [Composite ▼](?sort=composite) \| [Validity](?sort=validity) \| [Confidence](?sort=linkage) *

> **Builder notes**
>
> ── Supporter interests ──

> **Builder notes**
>
> ── Opponent interests ──

> **Builder notes**
>
> Invalid / zero-sum interest

| # | Stakeholder | Core Interest (The "Why") | Maslow Level | [Validity ▼](?sort=validity) (Legitimacy) | [Confidence ↕](?sort=linkage) (True Motivation?) | % Motivated | Composite |
|---|---|---|---|---|---|---|---|
| ✅ Coalition A, Supporter / Advocate Interests |   |   |   |   |   |   |   |
| 1 | [Stakeholder Name] Supporter | [Interest Name] [One-sentence description of this interest in this context] | Physiological | [e.g., 96] | [e.g., 88] [e.g., T2 Gov. Report] | [e.g., 90%] | [e.g., 93] |
| 2 | [Stakeholder Name] Supporter | [Interest Name] [One-sentence description] | Safety | [e.g., 85] | [e.g., 74] [e.g., T4 Expert Consensus] | [e.g., 60%] | [e.g., 81] |
| ❌ Coalition B, Opponent / Resistance Interests |   |   |   |   |   |   |   |
| 3 | [Stakeholder Name] Opponent | [Interest Name] [One-sentence description] | Safety | [e.g., 82] | [e.g., 85] [e.g., T2 IAEA Report] | [e.g., 80%] | [e.g., 83] |
| N | [Stakeholder Name] | [Interest Name] [Description] ⚠ Zero-sum / invalid, de-weighted | Invalid / Zero-Sum | [e.g., 10] | [e.g., 88] [e.g., Revealed Preferences] | [e.g., 35%] | [e.g., 41] |

Invalid interests are *not excluded*; they are scored low and de-weighted. High linkage accuracy on an invalid interest is informative: it tells us the motivation is real but illegitimate, which is different from a motivation that is both legitimate and real.

---

> **Builder notes**
>
> ════════════════════════════════════════════════════════════
>       SECTION 3, EVIDENCE LEDGER & LINKAGE TEST
>       One row per claim. Left column = evidence supporting the claim.
>       Right column = evidence or arguments challenging it.
>       ════════════════════════════════════════════════════════════

## 🔍 Evidence Ledger, Testing Linkage Accuracy (`/algorithms/evidence-scores`)

*Prove they actually want this.* Speculative mind-reading is de-weighted. If you claim a motive, you need evidence. Tier key: T1=Peer-Reviewed · T2=Gov/IGO Report · T3=Survey Data · T4=Expert Consensus · T5=Behavioral Evidence · T6=Journalism · T7=Anecdotal.

> **Builder notes**
>
> Add one row per testable linkage claim

| Claim / Interest Under Test | Side | Evidence Affirming the Linkage | Evidence / Arguments Challenging the Linkage | Quality / Tier |
|---|---|---|---|---|
| [Interest or Motive Claim] Stakeholder: [Stakeholder Name] | Pro-Pressure | ✅ Behavioral Match: [Description, e.g., "Budget allocations and institutional priorities align with stated concern"]<br><br> ✅ Expert Validation: [Source, e.g., RAND 2022], [one-sentence finding] | ❌ Pretextual Claim: [Description, e.g., "Zero-tolerance position on 5% civilian enrichment goes beyond nonproliferation to regime-change goals"]<br><br> ❌ Confounding Variable: [Description] | T2<br> [N]/100 |
| [Interest or Motive Claim] Stakeholder: [Stakeholder Name] | Pro-Engagement | ✅ [Evidence Type]: [Source], [Finding] | ❌ [Counter-argument type]: [Description] | T3<br> [N]/100 |

---

> **Builder notes**
>
> ════════════════════════════════════════════════════════════
>       SECTION 4, VALIDITY TEST
>       Not "is this motive real?" but "is it legitimate?"
>       ════════════════════════════════════════════════════════════

## ⚖️ Judging the Interests, Validity Test (`/algorithms/objective-criteria`)

Even if a motive is accurately identified, is it ethical and legitimate? Interests fail the validity test when they require others to lose, cannot survive universal application, or are satisfied through alternative means.

> **Builder notes**
>
> Add one row per interest under review

| Interest Under Review | Arguments for High Validity | Arguments for Low / De-weighted Validity |
|---|---|---|
| [Interest Name] Stakeholder: [Name] \| Maslow: [Level] Current score: [N]/100 | 1. Irreversible Harm: If this interest is ignored, [X population] suffers [permanent / catastrophic] loss.<br><br> 2. Universal Test: If all nations / actors held this interest, [outcome, e.g., "the nonproliferation regime would be stronger"].<br><br> 3. Scope of Impact: [How many people, how severely affected] | 1. Zero-Sum Domination: Satisfying this interest requires [other group] to [actively suffer / lose sovereignty / accept inferior outcome].<br><br> 2. Alternative Satisfaction: This [esteem / status] need can be met through [alternative means] without [cost to others].<br><br> 3. Reciprocity Failure: [This actor] would not accept the same standard applied to itself. |

---

> **Builder notes**
>
> ════════════════════════════════════════════════════════════
>       SECTION 5, COMPROMISE ENGINE
>       Shared high-validity interests + bridging proposals + trade-offs.
>       ════════════════════════════════════════════════════════════

## 🤝 Compromise Engine, Shared Interests & Bridging Proposals

The system surfaces interests with Validity ≥ 70 that appear on *both* sides of the conflict. These are the foundation for compromise. Build solutions on high-validity shared ground first.

> **Builder notes**
>
> Resolution potential score

Resolution Potential Score

[N]/100

Average validity of shared high-value interests across opposing stakeholders. Higher = more available common ground for compromise. [N] shared high-validity interests detected.

> **Builder notes**
>
> Shared interest cards (one per shared interest)

Physiological Avg Validity: [N]

### [Shared Interest Name]

[Short description] · Shared by [N] stakeholders ([N] supporters, [N] opponents)

Bridging Proposals:

1. [Proposal A, satisfies both sides' shared interest]

2. [Proposal B, alternative mechanism for the same goal]

3. [Proposal C, incremental step toward the shared interest]

Safety Avg Validity: [N]

### [Shared Interest Name]

[Short description] · Shared by [N] stakeholders

Bridging Proposals:

1. [Proposal A]

2. [Proposal B]

> **Builder notes**
>
> Add one card per shared high-validity interest

> **Builder notes**
>
> Remaining trade-offs table

### ⚠️ Structural Trade-offs (Require Political Resolution)

These interest pairs are in inherent tension, satisfying one reduces the other. They cannot be resolved algorithmically; they require explicit political choices.

> **Builder notes**
>
> Add one row per structural trade-off

| Interest A | Interest B | Tension Description |
|---|---|---|
| [Interest A Name] | [Interest B Name] | [One sentence, e.g., "Verifiable nuclear constraints require intrusive inspections the regime resists; regime survival drives defection from inspection agreements."] |

---

> **Builder notes**
>
> ════════════════════════════════════════════════════════════
>       SECTION 6, SEMANTIC CLUSTERING
>       Shows how raw brainstorm submissions were de-duplicated.
>       ════════════════════════════════════════════════════════════

## 🔗 Semantic Clustering, Duplicate Reduction Log (`/algorithms/combine-similar-beliefs`)

Raw interests submitted by crowd and AI are compared against the canonical registry. Submissions scoring ≥ 45 similarity are auto-merged; those below go to manual review. This table shows which raw phrases collapsed into which canonical interest nodes.

> **Builder notes**
>
> Add one row per clustering result

| Raw Submitted Phrases (before clustering) | Canonical Interest Node (after clustering) | Similarity Score | Status |
|---|---|---|---|
| "Stop Iranian nukes"<br> "Prevent Iran from acquiring weapons"<br> "No Iranian bomb" | Nuclear Non-Proliferation | 72 / 68 / 65 | ✓ Auto-clustered |
| "Regime survival" · "IRGC wants to stay in power" | Regime Survival (Islamic Republic) | 68 / 71 | ✓ Auto-clustered |
| "[Raw submission that didn't match anything]" | , Pending manual review | 38 | ⏳ Pending |

Algorithm note: The overall Conflict Resolution score updates when new evidence is added. Clustering uses Jaccard token overlap + bigram matching against canonical interest names, descriptions, and synonym clusters. [View the clustering logic on GitHub](https://github.com/myklob/ideastockexchange).

---

> **Builder notes**
>
> ── CONTRIBUTE ──

## 📬 Contribute to This Profile

This profile is dynamic. If you believe a stakeholder's motive has been mischaracterized (strawmanned) or an invalid interest is being treated as sacred:

- Submit evidence to correct a Linkage Accuracy score

- Submit an argument to challenge an Interest Validity score

- Merge duplicates, flag semantically identical interests

- Propose a bridging solution, add to the Compromise Engine

- Add a stakeholder, map a group not yet represented here

Contact us (`/contact`) \| [GitHub, full codebase and technical documentation](https://github.com/myklob/ideastockexchange)

> **Builder notes**
>
> /page
