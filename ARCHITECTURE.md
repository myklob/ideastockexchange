# wikiLaw Architecture

## Design Philosophy

wikiLaw is built on a simple premise: **legislation should be debuggable**. Just as software engineers inspect code, test assumptions, and propose patches, citizens should be able to audit laws, challenge their operating logic, and suggest evidence-based improvements.

This document explains the technical and conceptual architecture that makes that possible.

## Core Architectural Principles

### 1. Separation of Claims from Evidence

Laws make implicit claims about reality. wikiLaw makes them explicit and trackable:

- **Assumption Layer**: "Severity of punishment deters crime"
- **Evidence Layer**: Studies, data, and logical arguments that support/refute
- **Linkage Layer**: Which laws depend on which assumptions

This separation allows us to:
- Reuse assumptions across laws (many laws assume deterrence works)
- Update evidence once and propagate to all dependent laws
- Identify clusters of laws built on shaky foundations

### 2. Structured Skepticism Over Free-Form Commentary

Traditional legal commentary is unstructured prose. wikiLaw enforces **diagnostic templates**:

- Evidence must declare its type, quality metrics, and limitations
- Proposals must specify mechanism, tradeoffs, and falsifiability criteria
- Arguments must link to underlying assumptions

This structure makes **low-quality argumentation expensive**. You can't handwave; you must show your work.

### 3. Versioned Truth with Quality Scores

Not all evidence is created equal. We track:

- **Methodological rigor**: Was this a randomized trial or an anecdote?
- **Replicability**: Can others independently verify this?
- **Transparency**: Are limitations and conflicts disclosed?

Quality scores aren't censorship—they're **truth-in-advertising**. Users can still cite weak evidence, but they can't pretend it's strong.

### 4. Proposal as Pull Request

Changing a law should work like changing code:

1. **Fork** the current version
2. **Propose** specific text changes with justification
3. **Review** mechanism, evidence, and tradeoffs
4. **Merge** if it survives scrutiny (politically)

This makes proposals **directly comparable**. Instead of dueling position papers, you get structured alternatives with explicit differences.

## Type System Design

### ISE Core Types (`lib/types/ise-core.ts`)

These foundational types power the entire framework:

```typescript
Evidence → QualityScore + Source + Limitations
Assumption → Statement + Testability + Evidence[]
Interest → Stakeholder + Goal + Metrics
LinkageScore → From + To + Strength
```

**Why this matters**: These are cross-cutting concepts. An assumption used in criminal justice might also appear in education policy. By making them first-class types, we enable pattern recognition across domains.

### wikiLaw Types (`lib/types/wikilaw.ts`)

Domain-specific types for legal analysis:

```typescript
Law → {
  plainEnglish: string
  statedPurpose: string
  operativePurpose: string
  operatingAssumptions: Assumption[]
  evidenceAudit: EvidenceAudit
  justificationTest: JustificationTest
  stakeholderLedger: StakeholderLedger
  implementationTracker: ImplementationTracker
}
```

Each section answers a specific question:
- **Evidence Audit**: Does it work?
- **Justification Test**: Is it justified?
- **Stakeholder Ledger**: Who pays the price?
- **Implementation Tracker**: What actually happens?

### LawProposal Type

Proposals mirror the law structure but add:

```typescript
LawProposal → {
  goal: ProposalGoal          // What are you fixing?
  mechanism: ProposalMechanism // How will it work?
  evidenceBase: Evidence[]     // Why should we believe you?
  tradeoffAudit: Tradeoffs     // What are the costs?
  aiAnalysis: AIAnalysis       // Gap detection
}
```

**Key innovation**: `acknowledgesDownsides` boolean and `honestyScore`. Proposals that admit tradeoffs earn credibility. Those that don't get flagged.

## Component Architecture

### Atomic Design for Diagnostics

Components are organized by diagnostic function, not by UI pattern:

```
DiagnosticSection     → Container with severity signaling
EvidenceCard          → Quality-scored evidence display
AssumptionCard        → Testable belief with evidence
StakeholderCard       → Impact on specific group
```

Each component is **information-dense but scannable**. No fluff, no marketing copy—just data and analysis.

### Progressive Disclosure

The homepage gives you:
- High-level purpose gap detection
- Category and assumption tags
- Link to full diagnostic

The law page gives you:
- Complete diagnostic dashboard
- All evidence with quality scores
- Implementation gap analysis

This layering lets casual users spot problems quickly while allowing deep divers to audit everything.

## Data Flow

### Static Generation (Current)

```
example-laws.ts → Static data → Pre-rendered pages
```

All example laws are pre-rendered at build time. Fast, simple, demonstrates the concept.

### Future: Dynamic Data Layer

```
Database → API Routes → React Server Components → Client
```

When scaling to real legislative data:

1. **Scraping layer**: Pull statutes from state legal databases
2. **NLP layer**: Extract claims and identify assumptions
3. **Evidence layer**: Link to academic research, case outcomes
4. **Community layer**: User-submitted proposals and reviews
5. **AI layer**: Gap detection and quality scoring

### Why TypeScript is Critical

With hundreds of laws, thousands of assumptions, and complex dependency graphs, **type safety prevents catastrophic errors**:

- Can't link a law to an interest without proper structure
- Can't create evidence without quality scores
- Can't submit proposal without required fields

TypeScript turns conceptual rigor into compiler-enforced rigor.

## UI/UX Design Decisions

### No Gamification

Deliberately **no upvote counts, no badges, no karma**. Those systems reward engagement over accuracy. We want:

- Quality scores based on methodology, not popularity
- Proposals judged on evidence, not charisma
- Assumption challenges that cite data, not tribal affiliation

### Color-Coded Severity

Visual hierarchy based on **information criticality**, not aesthetics:

- 🟢 Green: Meets standard (constitutional, evidence-backed)
- 🟡 Yellow: Warning (purpose gap, weak evidence)
- 🔴 Red: Critical issue (rights violation, proven harm)

This lets you **triage** a law at a glance.

### No Ideological Tagging

We deliberately **don't label laws** "liberal" or "conservative." We tag them by:

- Category (housing, criminal justice)
- Operating assumptions (deterrence, market mechanisms)
- Affected stakeholders

This forces engagement with **mechanism** instead of tribe.

## Scalability Considerations

### One Page Per Topic

Each law gets exactly one canonical page. No fragmentation across:
- Reddit threads
- Blog posts
- Forum discussions
- Social media

This concentrates effort and prevents **context collapse**.

### Linkage Scores for Dependency Mapping

When you improve evidence for one assumption, it propagates to **all laws using that assumption**. When you identify a constitutional flaw in one law, you can flag similar laws with the same structure.

This turns debugging from linear (one law at a time) to **graph-based** (fix root causes).

### AI as Bullshit Detector, Not Oracle

AI doesn't decide what's true. It **flags gaps**:

- "You cited a think tank report, but it has no empirical study backing it"
- "You claimed X causes Y but didn't specify a mechanism"
- "You ignored enforcement costs in your tradeoff audit"

This makes **motivated reasoning expensive** without giving AI veto power.

## Integration with Broader ISE Platform

wikiLaw is a **vertical slice** of the Idea Stock Exchange:

- **Same type system**: Evidence, Assumptions, Interests
- **Same rigor**: Quality scores, falsifiability, tradeoff honesty
- **Same ethos**: No ideological ownership; ideas win by surviving reality

Other ISE verticals might include:
- **Policy proposals** (not yet law)
- **Scientific claims** (research papers)
- **Business strategies** (startup hypotheses)

Each uses the same debugging framework, applied to different domains.

## Why This Architecture Matters

Most legal tech focuses on **access** (making laws readable) or **automation** (contract review, research). wikiLaw focuses on **verification**:

- Does the law work as claimed?
- Are its assumptions justified?
- Could we do better with less harm?

This requires a fundamentally different architecture:

- Not a search engine (information retrieval)
- Not a forum (discussion platform)
- Not a petition site (advocacy tool)

It's a **testing ground for hypotheses about how society should work**, rendered in structured data with evidence trails.

When you build it this way, you can't hide behind rhetoric. Every claim is traceable. Every assumption is challengeable. Every proposal is comparable.

**The legal code stops being sacred when it becomes auditable.**

This architecture makes it auditable.
