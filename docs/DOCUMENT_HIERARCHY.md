# Idea Stock Exchange: Document Hierarchy

This document maps the ISE framework into a clear conceptual hierarchy. Use it as a reference for understanding how components relate and where to find detailed documentation.

---

## 1. Foundation Layer: Information Architecture

**Core Principle:** One Page Per Topic

| Concept | Purpose | Canonical Reference |
|---------|---------|---------------------|
| [One Page Per Topic](https://github.com/myklob/ideastockexchange/wiki) | Eliminates fragmentation by creating single canonical locations | Foundation for all ISE organization |
| [Topic Overlap Scores](https://github.com/myklob/ideastockexchange/wiki) | Determines which beliefs belong on which pages | Prevents misplacement of arguments |
| Multi-Dimensional Sorting | Organizes beliefs by generality, strength, and valence | Enables nuanced navigation |

**Key Insight:** Until every topic has exactly one home, we can't build cumulative knowledge. Duplication is the enemy of progress.

---

## 2. Argument Layer: Reasons and Structure

**Core Principle:** Arguments are the atomic units of reasoning

| Concept | Purpose | Canonical Reference |
|---------|---------|---------------------|
| [Reasons](https://github.com/myklob/ideastockexchange/wiki) | Pro/con arguments that support or oppose conclusions | Building blocks of all evaluations |
| [Assumptions](https://github.com/myklob/ideastockexchange/wiki) | Unstated premises required for arguments to work | Makes hidden logic visible |
| Argument Trees | Hierarchical structure showing how sub-arguments support parent claims | Enables recursive scoring |
| Fallacy Detection | Identifies logical errors in arguments | Reduces manipulation |

**Key Insight:** Arguments aren't just text, they're logical structures with dependencies, assumptions, and validity conditions.

---

## 3. Evidence Layer: Empirical Foundation

**Core Principle:** Evidence quality determines conclusion confidence

| Concept | Purpose | Canonical Reference |
|---------|---------|---------------------|
| [Evidence](https://github.com/myklob/ideastockexchange/wiki/Evidence-Verification-Score-(EVS)) | Empirical data supporting or opposing claims | Grounds arguments in reality |
| Evidence Quality Scores | Rates intrinsic reliability (methodology, replication, bias) | Prevents weak evidence from dominating |
| Evidence Tiers | Categorizes evidence types (RCT > observational > anecdote) | Establishes hierarchy of confidence |
| [Media](https://github.com/myklob/ideastockexchange/wiki/Media) | Books, articles, videos that transmit beliefs | Tracks influence and validity |

**Key Insight:** A single well-designed RCT outweighs a hundred anecdotes. Quality matters more than quantity.

---

## 4. Linkage Layer: Connecting Evidence to Conclusions

**Core Principle:** Relevance determines impact

| Concept | Purpose | Canonical Reference |
|---------|---------|---------------------|
| [Linkage Scores](https://github.com/myklob/ideastockexchange/wiki/Evidence-to-Conclusion-Relevance-Score) | Measures how well evidence supports specific conclusions | Prevents irrelevant evidence from polluting scores |
| Evidence-to-Conclusion Linkage | Evaluates directness of support/opposition | Strong evidence + weak linkage = low impact |
| Argument-to-Conclusion Linkage | Evaluates how well reasons support parent claims | Enables cascading validity |

**Key Insight:** "The sky is blue" might be true, but it has zero linkage to most conclusions. Relevance gates contribution.

---

## 5. Scoring Layer: Quantifying Truth

**Core Principle:** Scores must be calculable and auditable

| Concept | Purpose | Canonical Reference |
|---------|---------|---------------------|
| [Truth Scores](https://github.com/myklob/ideastockexchange/wiki/Truth-Score) | Master integration of all validity dimensions | Final confidence metric |
| [Importance Scores](https://github.com/myklob/ideastockexchange/wiki) | Measures real-world significance (separate from truth) | Prioritizes consequential beliefs |
| [Logical Validity Scores](https://github.com/myklob/ideastockexchange/wiki) | Evaluates argument structure independent of content | Catches invalid reasoning |
| ReasonRank | PageRank-style algorithm for argument importance | Propagates confidence recursively |

**Key Insight:** Every score must trace back to linked argument nodes. No manual scoring, no gaming, no hidden weights.

### Scoring Formulas

**Conclusion Score:**
```
CS = Σ(Pro_Arguments × Linkage) − Σ(Con_Arguments × Linkage)
```

**Truth Score:**
```
Truth = (Logical_Validity × Evidence_Quality × Verification_Level) ± Counterargument_Weight
```

**Evidence Contribution:**
```
Impact = Evidence_Quality (0-10) × Linkage (0-1)
```

---

## 6. Stakeholder Layer: Interests and Values

**Core Principle:** Understand motivations, not just positions

| Concept | Purpose | Canonical Reference |
|---------|---------|---------------------|
| [Interests](https://github.com/myklob/ideastockexchange/wiki) | What stakeholders actually care about (vs. stated positions) | Enables principled negotiation |
| [American Values](https://github.com/myklob/ideastockexchange/wiki) | Moral foundations underlying political positions | Maps value conflicts |
| [Cost-Benefit Analysis](https://github.com/myklob/ideastockexchange/wiki) | Systematic evaluation of tradeoffs | Quantifies real-world impact |
| Stakeholder Ledger | Who wins, who loses, who pays | Reveals hidden consequences |

**Key Insight:** Most disagreements aren't about facts, they're about values and interests. Make them visible.

---

## 7. Application Layer: Specific Use Cases

### wikiLaw (Legal Analysis)

| Component | Purpose |
|-----------|---------|
| Plain-English Decode | What the law actually does |
| Stated vs. Operative Purpose | Marketing vs. mechanism |
| Evidence Audit | Does the law work? |
| Justification Test | Constitutional compatibility |
| Implementation Tracker | Statute vs. reality gap |
| Suggest a Change | Versioned amendment proposals |

### Book Analysis System

| Component | Purpose |
|-----------|---------|
| Book Logical Validity Score | Overall argument quality |
| Claim-by-Claim Analysis | Individual assertion scoring |
| Centrality Weighting | Core thesis vs. footnotes |
| Prediction Tracking | Did forecasts come true? |
| Belief Impact (R₀) | How far did ideas spread? |

### Collaborative Debate Platform

| Component | Purpose |
|-----------|---------|
| Hierarchical Argument Trees | Visual structure of reasoning |
| Media-Argument Linking | Evidence attached to claims |
| Position-Based Arguments | Pro/Con/Neutral tagging |
| ReasonRank Ordering | Quality-based surfacing |

---

## 8. Meta Layer: Process and Governance

**Core Principle:** The system must be self-improving

| Concept | Purpose |
|---------|---------|
| Version History | Track how arguments evolve |
| Prediction Accountability | Score forecasters by accuracy |
| Chief Belief Officer (CBO) | Greatest score-changing contributor |
| Peer Review | Community validation of claims |
| Semantic Grouping | Automatic duplicate detection |

**Key Insight:** The platform should get smarter over time. Every interaction improves the knowledge base.

---

## How Components Interact

```
┌─────────────────────────────────────────────────────────────┐
│                    ONE PAGE PER TOPIC                        │
│                 (Information Architecture)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      ARGUMENTS                               │
│              (Reasons + Assumptions + Structure)             │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│       EVIDENCE          │     │        LINKAGE              │
│  (Quality + Tiers)      │────▶│   (Relevance Scoring)       │
└─────────────────────────┘     └─────────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        SCORES                                │
│        (Truth + Importance + Validity + ReasonRank)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATIONS                              │
│          (wikiLaw + Books + Debates + Policy)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: When to Use What

| If You Need To... | Use This Component |
|-------------------|-------------------|
| Find where a belief belongs | Topic Overlap Scores |
| Evaluate an argument's structure | Logical Validity Scores |
| Rate evidence quality | Evidence Quality Scores + Tiers |
| Determine if evidence supports a conclusion | Linkage Scores |
| Get overall confidence in a belief | Truth Scores |
| Understand real-world impact | Importance Scores + Cost-Benefit |
| Map stakeholder motivations | Interests + Values |
| Track how ideas spread | Media Analysis + Belief R₀ |
| Audit a law's effectiveness | wikiLaw components |
| Analyze a book's arguments | Book Analysis System |

---

## Guiding Principles

1. **Audit Lock:** Every score must trace to underlying arguments and evidence. No manual overrides.

2. **Show Your Math:** Every evaluation must be transparent and reproducible.

3. **Separate Validity from Importance:** A claim can be true but trivial, or false but consequential.

4. **Linkage Gates Impact:** Strong evidence with weak relevance contributes little.

5. **Cumulative Progress:** Build on previous work. Never start from scratch.

6. **No Tribal Ownership:** Good ideas win regardless of who proposed them.

7. **Falsifiability Required:** If you can't name what would prove you wrong, you're not making an argument.

---

## Next Steps

- **For Users:** Start with [One Page Per Topic](https://github.com/myklob/ideastockexchange/wiki) to understand the organizing principle
- **For Developers:** See [README.md](README.md) for implementation details
- **For Contributors:** Read the canonical wiki pages before proposing changes
- **For Researchers:** Explore the scoring algorithms in the `/lib` directories

---

*This hierarchy is itself subject to revision. If you see a better way to organize these concepts, propose it.*
