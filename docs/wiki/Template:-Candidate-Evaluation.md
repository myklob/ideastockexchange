# Template: Candidate Evaluation

> Generated from [`templates/candidate-evaluation-template.html`](https://github.com/myklob/ideastockexchange/blob/master/templates/candidate-evaluation-template.html) by `tools/wiki_templates.py`. The HTML file is the template; edit it, not this page. CI regenerates this page and refuses a copy that has drifted.

**Kind:** Special analysis  
**Purpose:** A belief page specialised to "[Candidate] is the most qualified candidate for [office]": objective criteria defined for the office before the candidates are compared, then the ordinary argument trees, evidence ledger and conflict resolution framework.  
**Rendered by:** follows the belief page; no dedicated renderer  

**Currency rules.** `tools/check_templates.py` refuses a template that uses the retired column names Argument Score or Evidence Score (the current names are Truth, Importance and Linkage), an em dash, an empty anchor, or an address that looks like an email; a topic template must carry the four magnitude bands Modest, Moderate, Strong and Total and treat engagement as a section, not a continuum. CI runs it on every change under `templates/`, and `tools/wiki_templates.py --check` refuses a wiki copy that differs from the HTML.

Square-bracketed text is a placeholder for the author to fill; a token with underscores, such as [Truth_Score], is a slot the software fills. A score cell is blank until a real page stands behind it. Each table on the built site carries a form that files a row in it; a form cannot be submitted from a wiki page, so the forms are left out here.

---
> **Builder notes**
>
> ─── Breadcrumb ───────────────────────────────────────────────────────────

Home (`/`) › Topics (`/topics`) › Elections (`/topics`) › [Country] › [State] › [Office]

> **Builder notes**
>
> ─── Title ───────────────────────────────────────────────────────────────

# Belief: “[Candidate Full Name] is the most qualified candidate for [Office] in [Jurisdiction].”

> **Builder notes**
>
> ─── Belief meta-box ─────────────────────────────────────────────────────

Topic: Elections → [Country] → [State/Province] → [Office]  
Belief Positivity Towards Topic: [+XX%]  
Claim Strength (`/algorithms/strong-to-weak`): [Modest / Moderate / Strong / Total] ([XX%])  
Each section builds a complete analysis from multiple angles. [View the full technical documentation on GitHub](https://github.com/myklob/ideastockexchange).

---

> **Builder notes**
>
> ─── ISE Example Callout ─────────────────────────────────────────────────

🏛️ How Candidate Evaluation (`/candidate-evaluation`) Works Inside the ISE

A user creates a belief page: *“[Candidate Full Name] is the most qualified candidate for [Office] in [Jurisdiction].”* It is filed at `Elections → [Country] → [State] → [Office]` and instantly inherits the same structural template every belief on the platform uses: Argument Trees (`/algorithms/reason-rank`), Evidence Scoring (`/algorithms/evidence-scores`), Objective Criteria weighting (`/algorithms/objective-criteria`), Cost-Benefit Analysis (`/cba`), and Conflict Resolution mapping.

No special configuration. No editorial setup. No custom rules for politicians. The architecture is identical whether evaluating a tax proposal, a scientific claim, or a Senate candidate.

The Criteria Come First, and Apply to Everyone

Before [Candidate Full Name]’s page existed, the [Office] node already contained a scored, community-built set of Objective Criteria (`/algorithms/objective-criteria`): which qualifications matter most for this office, which policy domains carry the highest Importance Scores (`/algorithms/importance-score`), and what measurable performance indicators distinguish effective officeholders from ineffective ones.  
[Candidate Full Name]’s page inherits those criteria automatically. So does every other candidate. The goalposts are fixed before the campaign begins, and they are fixed equally.

Arguments Are Scored, Not Curated

When users submit arguments, each one is evaluated across three independent dimensions:

- Truth Score (`/algorithms/truth-scores`): Is the claim factually accurate and supported by linked evidence?

- Linkage Score (`/algorithms/linkage-scores`): Does this argument actually connect to the question of [Office] qualification?

- Importance Score (`/algorithms/importance-score`): How central is this criterion within the pre-defined evaluation framework?

Outrage cannot override structure. Visibility does not equal weight.

No Agenda. No Moderator Bias. No Exceptions.

ReasonRank (`/algorithms/reason-rank`) does not know it is evaluating a politician. It applies the same recursive logic used everywhere else in the system. The output is not “who dominated the debate stage.” It is “who scores highest under the criteria the public agreed upon before campaign noise began.”

---

> **Builder notes**
>
> ─── Objective Criteria ───────────────────────────────────────────────────

## 🎯 Objective Criteria (`/algorithms/objective-criteria`): Pre-Defined for This Office

These criteria were set by the community before this candidate’s page was created. They apply equally to every candidate filing under this office node.

| Criterion | Importance (`/algorithms/importance-score`) | Linkage (`/algorithms/linkage-scores`) | Type | Weight |
|---|---|---|---|---|
| [Criterion 1, e.g., Legislative track record & effectiveness] | [XX%] | [XX%] | [Outcome] | [XX%] |
| [Criterion 2, e.g., Relevant policy domain expertise] | [XX%] | [XX%] | [Competence] | [XX%] |
| [Criterion 3, e.g., Ethical conduct & conflict-of-interest disclosures] | [XX%] | [XX%] | [Ethics] | [XX%] |
| [Criterion 4, e.g., Constituent service quality] | [XX%] | [XX%] | [Service] | [XX%] |
| [Criterion 5, e.g., Campaign rhetoric style / debate performance] | [XX%] | [XX%] | [Style] | [XX%] |
| [Criterion 6, e.g., Personal lifestyle / tabloid coverage] | [XX%] | [XX%] | [Personal] | [XX%] |

See: Objective Criteria Scoring Methodology (`/algorithms/objective-criteria`)

---

> **Builder notes**
>
> ─── Argument Trees ───────────────────────────────────────────────────────

## 🔍 Argument Trees (`/algorithms/reason-rank`)

Each reason is a belief with its own page. Scoring is recursive based on truth (`/algorithms/truth-scores`), linkage (`/algorithms/linkage-scores`), and importance (`/algorithms/importance-score`).

> **Builder notes**
>
> Pro arguments

| Top Scoring (`/algorithms`) Reasons to Agree | Truth Score | Linkage Score (`/algorithms/linkage-scores`) | Impact |
|---|---|---|---|
| [Pro argument 1, e.g., Sponsored three bipartisan bills that passed into law] (`/beliefs/[slug-1]`) | [+XX] | [XX%] ([Strong Causal]) | [+XX.X] |
| [Pro argument 2, e.g., Ranked top-10% for constituent casework resolution] (`/beliefs/[slug-2]`) | [+XX] | [XX%] ([Strong Causal]) | [+XX.X] |
| [Pro argument 3] (`/beliefs/[slug-3]`) | [+XX] | [XX%] ([Contextual]) | [+XX.X] |
| Total Pro: |   |   | [+XX.X] |

> **Builder notes**
>
> Con arguments

| Top Scoring (`/algorithms`) Reasons to Disagree | Truth Score | Linkage Score (`/algorithms/linkage-scores`) | Impact |
|---|---|---|---|
| [Con argument 1, e.g., Missed 22% of floor votes in the last session] (`/beliefs/[slug-4]`) | [-XX] | [XX%] ([Strong Causal]) | [-XX.X] |
| [Con argument 2, e.g., Tabloid story / personal conduct allegation] (`/beliefs/[slug-5]`) | [-XX] | [XX%] ([Anecdotal]) | [-XX.X] |
| [Con argument 3] (`/beliefs/[slug-6]`) | [-XX] | [XX%] ([Contextual]) | [-XX.X] |
| Total Con: |   |   | [-XX.X] |

See: Argument Scoring Methodology (`/algorithms/reason-rank`)

---

> **Builder notes**
>
> ─── Evidence Ledger ──────────────────────────────────────────────────────

## ⚖️ Evidence Ledger (`/algorithms/evidence-scores`)

Weighing the raw data. Quality scores based on methodology, verifiability, and source independence.

| Supporting Evidence (Pro) | Quality | Weakening Evidence (Con) | Quality |
|---|---|---|---|
| [Voting record / official report title]<br> Source: [Institution / Official Source] ([Year])<br> Finding: [Brief summary of what the data shows] | [XX%]<br>(Official Record) | [Attendance / performance audit title]<br> Source: [Institution / Official Source] ([Year])<br> Finding: [Brief summary] | [XX%]<br>(Peer Reviewed) |
| [Independent expert endorsement / analysis] | [XX%] | [Counter-analysis or contradictory data point] | [XX%] |

See: Evidence Scoring Methodology (`/algorithms/evidence-scores`)

---

> **Builder notes**
>
> ─── Conflict Resolution Framework ───────────────────────────────────────

## 🤝 Conflict Resolution Framework

### 💰 Interests & Motivations

| Interests of Supporters | Interests of Opponents |
|---|---|
| 1. [Interest: e.g., Effective representation on policy X]<br> 2. [Interest: e.g., Track record of delivering constituent results]<br> 3. [Interest: e.g., Bipartisan coalition-building] | 1. [Interest: e.g., Concern over missed votes / attendance]<br> 2. [Interest: e.g., Disagreement on key policy position]<br> 3. [Interest: e.g., Preference for another candidate’s expertise] |

### 📜 Foundational Assumptions (`/algorithms/assumptions`)

| To Hold Position | You Must Believe These Assumptions (General → Specific) |
|---|---|
| +50% to +100%<br>(Supporter) | 1. [Worldview]: [e.g., Legislative effectiveness is the primary metric for senatorial quality]<br> 2. [Values]: [e.g., Bipartisan accomplishment outweighs partisan purity]<br> 3. [Causal]: [e.g., Past track record predicts future performance]<br> 4. [Topic-specific]: [e.g., [Candidate] has demonstrated this track record] |
| -50% to -100%<br>(Opponent) | 1. [Worldview]: [e.g., Attendance and engagement are non-negotiable minimums]<br> 2. [Values]: [e.g., Absenteeism signals disrespect for the role]<br> 3. [Causal]: [e.g., Missed votes translate directly to unrepresented constituents]<br> 4. [Topic-specific]: [e.g., [Candidate]’s 22% miss rate disqualifies them] |

### 💸 Cost-Benefit Analysis (`/cba`)

| Benefits of Supporting This Candidacy | Costs / Risks of Supporting This Candidacy |
|---|---|
| 1. [Benefit: e.g., Proven ability to pass bipartisan legislation]<br> 2. [Benefit: e.g., Strong constituent services record]<br> 3. [Benefit: e.g., Policy expertise in the office’s most critical domains] | 1. [Risk: e.g., Attendance concerns may worsen under full term pressure]<br> 2. [Risk: e.g., Policy positions diverge from district median on issue X]<br> 3. [Risk: e.g., Ethical disclosure gaps remain unresolved] |

### ⏳ Short vs. Long-Term Impact

| Short-Term Impact (0–2 years) | Long-Term Impact (2+ years) |
|---|---|
| 1. [Short-term: e.g., Immediate committee assignments and seniority effects]<br> 2. [Short-term: e.g., Constituent morale and representation quality] | 1. [Long-term: e.g., Legislative legacy and structural policy outcomes]<br> 2. [Long-term: e.g., Precedent set for accountability standards in the seat] |

### 🤝 Compromise Positions

| What Both Sides Might Agree On | Possible Compromise Positions |
|---|---|
| 1. [Shared: e.g., The office requires both policy expertise and reliable attendance]<br> 2. [Shared: e.g., Constituent service quality is a non-partisan priority] | 1. [Compromise: e.g., Evaluate candidates on the weighted criteria rather than any single issue]<br> 2. [Compromise: e.g., Demand concrete commitments on attendance before endorsing] |

### 🚧 Obstacles to Resolution

| Structural Obstacles | Motivational Obstacles |
|---|---|
| 1. [Structural: e.g., Media incentives reward scandal over policy analysis]<br> 2. [Structural: e.g., Partisan framing prevents cross-party evidence sharing] | 1. [Motivational: e.g., Tribal loyalty overrides objective evaluation]<br> 2. [Motivational: e.g., Donors benefit from keeping the debate emotional] |

---

> **Builder notes**
>
> ─── Core Values Conflict ─────────────────────────────────────────────────

## ⚖️ Core Values Conflict

| Values Supporting This Candidacy | Values Opposing This Candidacy |
|---|---|
| Advertised:<br> 1. [e.g., Effectiveness & proven results]<br> 2. [e.g., Bipartisan cooperation]<br><br> Actual (critics say):<br> 1. [e.g., Incumbent protection]<br> 2. [e.g., Loyalty to existing donor class] | Advertised:<br> 1. [e.g., Accountability & constituent duty]<br> 2. [e.g., Principle over pragmatism]<br><br> Actual (critics say):<br> 1. [e.g., Opposition for partisan reasons]<br> 2. [e.g., Preference for a competing candidate] |

---

> **Builder notes**
>
> ─── Biases ───────────────────────────────────────────────────────────────

## 🧠 Cognitive & Institutional Biases

| Bias | How It Distorts This Evaluation |
|---|---|
| In-group Loyalty Bias | [e.g., Partisans overlook attendance failures for their own candidate while amplifying the same data against opponents.] |
| Availability Heuristic | [e.g., A recent tabloid story feels more important than a decade of voting records because it is more memorable.] |
| Halo / Horn Effect | [e.g., One strong policy win is generalized to overall excellence; one scandal is generalized to total disqualification.] |
| Media Amplification Bias | [e.g., Outrage-generating stories receive 10× more coverage than equivalent legislative achievements.] |

---

> **Builder notes**
>
> ─── Evidence Spectrum (3 Spectrums applied to candidate) ────────────────

## 📊 Spectrum 1: Positivity Toward This Candidacy (Negative ↔ Positive)

| Position | Core Belief / Claim | Top Underlying Argument | Belief Score | Media |
|---|---|---|---|---|
| -100%<br>(Strongly Oppose) | [Candidate] is completely unfit for [Office]. | [e.g., Ethical disqualifier / severe attendance failure] | [-XX] | [Link] |
| -50%<br>(Skeptical) | [Candidate] has significant shortcomings that outweigh their record. | [e.g., Attendance record / policy divergence] | [-XX] | [Link] |
| 0%<br>(Neutral) | [Candidate] is an average candidate, neither the best nor the worst option. | [e.g., Mixed record requiring context-by-context evaluation] | [0] | [Link] |
| +50%<br>(Supportive) | [Candidate] is well-qualified and has a solid track record for [Office]. | [e.g., Bipartisan legislative effectiveness] | [+XX] | [Link] |
| +100%<br>(Strongly Support) | [Candidate] is the most qualified candidate for [Office] in [Jurisdiction]. | [e.g., Unmatched policy expertise + proven constituent results] | [+XX] | [Link] |

See: Full Positivity Framework \| Why We Need This Spectrum

---

> **Builder notes**
>
> ─── Media Resources ──────────────────────────────────────────────────────

## 📚 Best Media & Resources

Curated resources sorted by positivity score and informational value.

| Title | Medium | Bias / Tone | Positivity | Claim Strength | Escalation | Key Insight |
|---|---|---|---|---|---|---|
| [Title, e.g., voting record analysis piece] | [Article / Report] | [Academic / Neutral] | [+XX%] | [XX%] | [1–6] | [One sentence summary] |
| [Title, e.g., critical investigative piece] | [Article / Investigative] | [Critical] | [-XX%] | [XX%] | [1–6] | [One sentence summary] |

See: Media Framework (`/media`)

---

> **Builder notes**
>
> ─── Related Topics ───────────────────────────────────────────────────────

## 🔗 Related Topics

| Broader Categories (Parents) | Specific Sub-Issues (Children) | Related Beliefs (Siblings) |
|---|---|---|
| Elections (`/topics`), [Country] Elections, [State] Politics | [Candidate]’s position on [Issue 1], [Candidate]’s attendance record, [Candidate]’s donor sources | [Other candidate belief pages in this election], [Equivalent belief pages in other elections] |

---

> **Builder notes**
>
> ─── Overall Score ────────────────────────────────────────────────────────

Score: [+XX.X] (`/algorithms/reason-rank`) (based on argument scores)  
Strength-adjusted score: [XX.X%] (`/algorithms/strong-to-weak`)  
(applies [XX]% burden-of-proof factor for [Weak/Moderate/Strong/Extreme] claim)

---

> **Builder notes**
>
> ─── Contribute ───────────────────────────────────────────────────────────

## 📬 Contribute

Contact me (`/contact`) to add beliefs, strengthen arguments, or link new evidence.  
[GitHub](https://github.com/myklob/ideastockexchange) for technical implementation and scoring algorithms.
