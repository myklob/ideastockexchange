# Idea Stock Exchange

**Infrastructure for Human Reasoning**

A platform where ideas are evaluated like investments: scored by evidence quality, ranked by logical strength, and organized so humanity can finally build cumulative knowledge instead of arguing in circles forever.

---

## The Problem We're Solving

Every day, millions of people debate the same questions across thousands of websites. They make the same arguments, cite the same evidence, and reach the same impasses their grandparents did. Meanwhile:

- **Arguments scatter** across Reddit threads, Twitter replies, and comment sections, never to be found again
- **Repetition masquerades as debate** because nobody tracks what's already been proven or refuted
- **Tribal loyalty trumps evidence** because platforms reward engagement, not accuracy
- **Good ideas die in obscurity** while bad ones go viral through emotional manipulation

The Founders solved this problem for governance by creating institutions with checks, balances, and transparent processes. We're solving it for reasoning by creating infrastructure where evidence determines the strength of conclusions, not volume or popularity.

---

## How It Works

### One Page Per Topic

Every belief gets exactly one canonical page. No duplication, no fragmentation, no starting from scratch every time someone asks the same question.

When you search "Should we raise the minimum wage?", you find *the* page, with:
- All known arguments organized in pro/con columns
- Evidence quality scores for each claim
- Sub-arguments that support or attack each reason
- A running score that updates as new evidence arrives

### Three-Dimensional Organization

Beliefs are mapped across three dimensions simultaneously:

| Dimension | What It Shows | Example |
|-----------|---------------|---------|
| **General → Specific** | Navigate from principles to implementations | "Democracy is good" → "12-year term limits for Congress" |
| **Weak → Strong** | Sort by claim intensity (stronger claims need stronger evidence) | "EVs have benefits" → "EVs are essential for climate" |
| **Negative → Positive** | View the full spectrum of positions | "Social media destroys mental health" → "Social media connects humanity" |

### Evidence-Based Scoring

Every argument earns a score based on:

```
Conclusion Score = Σ(Pro Arguments × Linkage) − Σ(Con Arguments × Linkage)
```

Where each argument's strength depends on:
- **Evidence Quality** (0-10): How rigorous is the supporting research?
- **Linkage Score** (0-1): How directly does this evidence support *this specific* conclusion?
- **Logical Validity**: Does the argument contain fallacies?
- **Uniqueness**: Is this a new point or a duplicate?

Strong evidence with weak linkage contributes little. Weak evidence with strong linkage contributes little. Only strong, relevant evidence moves the needle.

---

## Core Components

### ReasonRank Algorithm

Like PageRank for ideas. Arguments that are supported by many strong sub-arguments rank higher. The system propagates confidence recursively, so a well-supported conclusion inherits strength from its entire evidence tree.

### Linkage Scores

Prevents irrelevant evidence from polluting conclusions. "Grass is green" might be true, but it has near-zero linkage to "We should legalize cannabis." Every evidence-to-conclusion connection is scored for relevance.

### Evidence Tiers

Not all sources are equal:

| Tier | Type | Quality Range |
|------|------|---------------|
| 1 | Meta-analysis of RCTs | 9-10 |
| 2 | Single large RCT | 8-9 |
| 3 | Observational studies | 6-7 |
| 4 | Expert opinion | 5-6 |
| 5 | Anecdote/single case | 1-2 |

### Truth Scores

Integrates multiple dimensions into a single confidence metric:

```
Truth Score = (Logical Validity × Evidence Quality × Verification Level) ± Counterargument Weight
```

Bounded between -1 (definitively false) and +1 (definitively true), with most contested beliefs landing somewhere in between.

---

## Applications

### wikiLaw: Debugging the Legal Code

Every law is a bet on reality: "If we enforce X, we'll get outcome Y." wikiLaw makes those bets auditable:

- **Plain-English Decode**: What the law actually changes
- **Stated vs. Operative Purpose**: Marketing copy vs. actual incentives
- **Evidence Audit**: Does the mechanism work?
- **Stakeholder Ledger**: Who wins, who loses, who pays?
- **Suggest a Change**: Propose versioned upgrades with required justification

### Book Analysis System

Books shape beliefs, but their logical validity varies wildly. The ISE generates "combat reports" for ideas:

- **Logical Validity Score** (0-100): How well do arguments survive scrutiny?
- **Claim-by-Claim Analysis**: Individual assertions scored by centrality
- **Prediction Tracking**: Did the book's forecasts come true?
- **Belief Impact (R₀)**: How far did these ideas spread?

### Topic Overlap Scores

Determines which beliefs belong on which pages:

```
TopicRank = OverlapScore × TruthScore × (1 + DisagreementBoost) × RecencyWeight
```

So "CO2 emissions increase warming" ranks high on the Climate Change page (98% overlap) but low on the Individual Actions page (5% overlap).

### Collaborative Debate

Structured argumentation where:
- Arguments nest hierarchically (pro/con trees)
- Media sources link to arguments with position tags
- Voting surfaces quality, not popularity
- ReasonRank determines final rankings

---

## Technology

The platform has been prototyped across multiple tech stacks:

| Component | Options |
|-----------|---------|
| **Backend** | Node.js/Express, FastAPI (Python), or similar |
| **Database** | PostgreSQL, SQLite, MongoDB |
| **Frontend** | React, vanilla JS, or HTML templates |
| **NLP** | Sentence Transformers for semantic similarity |
| **Scoring** | Custom ReasonRank, fallacy detection, redundancy detection |

The architecture is intentionally modular. The core innovation is the *conceptual framework*, not any specific implementation.

---

## Getting Started

### For Users

1. **Browse existing topics** at [ideastockexchange.org](https://ideastockexchange.org) *(coming soon)*
2. **Add arguments** to conclusions you care about
3. **Submit evidence** with quality metadata
4. **Vote** on argument strength
5. **Watch scores update** as the community refines knowledge

### For Developers

```bash
# Clone the repository
git clone https://github.com/myklob/ideastockexchange.git
cd ideastockexchange

# Install dependencies
npm install  # or pip install -r requirements.txt

# Initialize database
npm run init-db  # or python database.py

# Start development server
npm run dev  # or python main.py
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

### For Framework Documentation

The canonical reference for all ISE concepts lives on PBworks:

- [One Page Per Topic](https://myclob.pbworks.com/w/page/159323433/One%20Page%20Per%20Topic)
- [Reasons](https://myclob.pbworks.com/Reasons)
- [Evidence](https://myclob.pbworks.com/w/page/159353568/Evidence)
- [Truth Scores](https://myclob.pbworks.com/w/page/21960078/truth)
- [Linkage Scores](https://myclob.pbworks.com/w/page/159338766/Linkage%20Scores)
- [Importance Scores](https://myclob.pbworks.com/importance%20score)
- [Cost-Benefit Analysis](https://myclob.pbworks.com/w/page/156187122/cost-benefit%20analysis)
- [Interests](https://myclob.pbworks.com/w/page/159301140/Interests)
- [Assumptions](https://myclob.pbworks.com/Assumptions)

---

## Why This Matters

### We're Building Infrastructure

Google organized web pages. Wikipedia organized facts. The Idea Stock Exchange organizes *arguments*, the fundamental building blocks of decision-making.

### Arguments Deserve Cumulative Progress

Science advances because each generation builds on previous work. Arguments should work the same way. Stop starting from scratch. Build cumulative reasoning.

### The AI Age Demands It

Before we create superintelligent machines, we should demonstrate that humans can reason systematically. The ISE is infrastructure for showing our work, making our assumptions transparent, and updating our beliefs when evidence changes.

---

## The Vision

Imagine a world where:

- **Policy debates reference canonical pages** instead of cherry-picked studies
- **Students learn critical thinking** by navigating real argument trees
- **Journalists link to evidence scores** instead of just quoting partisans
- **AI assistants cite their reasoning** through auditable argument chains
- **Disagreement becomes productive** because everyone sees both sides

This isn't utopian. It's engineering. The same institutional design thinking that gave us separation of powers, checks and balances, and amendment processes can give us infrastructure for collective reasoning.

The journey starts with a single page, organized by evidence, updated by the crowd, scored by math.

**Ready to help build it?** [Contact us](https://myclob.pbworks.com/w/page/160433328/Contact%20Me) or open a pull request.

---

## License

MIT License. The ideas are free. The code is free. The mission is bigger than any of us.

---

## Acknowledgments

- Benjamin Franklin and Thomas Jefferson for the pro/con methodology
- Google's PageRank for algorithmic inspiration
- Wikipedia for proving collaborative knowledge works at scale
- "Getting to Yes" by Fisher & Ury for conflict resolution principles
- Every contributor who believes reasoning can be systematic

---

*"No concept you form is valid unless you integrate it without contradiction into the sum of human knowledge."*
