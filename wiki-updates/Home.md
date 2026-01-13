# Welcome to the Idea Stock Exchange Wiki

We're building an open, evidence-based platform to **rank arguments, measure belief strength, and automate conflict resolution** — bringing structure to online debate.

---

## 🚀 Quick Start

**New to the project?** Start here:
- **[Getting Started](Getting-Started)** - Setup instructions, prerequisites, and first steps
- **[Architecture Overview](Architecture-Overview)** - System design and technical stack
- **[API Documentation](API-Documentation)** - REST API endpoints and usage
- **[Database Schema](Database-Schema)** - Data models and relationships

---

## 📚 Core Concepts & Algorithms

### Scoring & Ranking Systems

**[ReasonRank: Google's PageRank for Arguments](ReasonRank:-Google's-PageRank-for-Arguments)**
Adapts PageRank to assess argument strength. Just as PageRank values sites based on link quality, **ReasonRank values conclusions based on supporting arguments** — factoring in logic, evidence, and relevance.

**Implementation**: The current ReasonRank algorithm combines:
- Truth Score (30%) - Accuracy of arguments
- Importance Score (25%) - Significance to the debate
- Relevance Score (20%) - Topical relevance
- Vote Score (15%) - Community consensus (sigmoid normalized)
- Media Score (8%) - Supporting evidence quality
- Recency Boost (2%) - Exponential decay favoring newer arguments

See **[ReasonRank](ReasonRank)** for implementation details.

---

**[Truth Score: Logical Fallacy + Evidence Verification](Truth-Score)**
Integrates two powerful measures:
- **Logical Fallacy Score** — measures the degree and impact of fallacies
- **[Evidence Verification Score (EVS)](Evidence-Verification-Score-(EVS))** — evaluates claim support via independent, rigorous evidence

Combined, these scores **quantify argument credibility** and encourage reasoning grounded in logic and verifiable fact.

---

**[Evidence-to-Conclusion Relevance Score](Evidence-to-Conclusion-Relevance-Score)**
Measures the **relevance and causal strength** between evidence, intermediate arguments, and final conclusions using:
- Link weighting in reasoning chains
- Adapted PageRank model reflecting collective judgment on relevance

---

### Impact & Influence

**[Impact Algorithm: Argument Importance & Belief Impact Scores](Confidence-Stability-Scores)**
- **Argument Importance Score** — measures how much a belief depends on a specific argument
- **Belief Impact Score (BIS)** — combines argument strength with cost-benefit analysis to assess real-world consequences

These scores identify the **most influential arguments** and societally significant beliefs.

**[Belief Stability Confidence Score](Confidence-Stability-Scores)**
Measures belief score stability over time based on:
- Depth of analysis
- Unresolved sub-arguments
- Consistency across repeated evaluations

---

### Quality Control & Organization

**[Equivalency Score](Equivalency-Score:)**
Groups equivalent or similar arguments to keep debates **focused and concise**:
- Calculated using semantic similarity + argument performance
- Displays "better ways of saying the same thing" to reduce clutter

**[Media Evidence System](Media)**
Comprehensive evidence library supporting:
- Books, videos, articles, papers, podcasts, documentaries
- Credibility and bias scoring
- Position tagging (SUPPORTS/REFUTES/NEUTRAL)
- Quality tiers (peer-reviewed → speculation)

---

## 🏛️ Applications

**[wikiLaw: Evidence-Based Legal Analysis](wikiLaw)**
Revolutionary application for analyzing legislation and legal documents:
- **Plain-English Decoding** - Simplify complex legal language
- **Purpose Auditing** - Compare stated vs. operative intent
- **Evidence Audits** - Validate mechanistic claims in legislation
- **Stakeholder Ledgers** - Track impact on different constituencies
- **Law Proposals** - Version-controlled improvements with justification

**[Automated Conflict Resolution Platform](Automated-Conflict-Resolution-Platform)**
Conflict-resolution engine that:
- Focuses on **interests, not positions**
- Evaluates solutions against **objective criteria**
- Scores proposals on **resolution likelihood**, factoring in cost-benefit trade-offs

**[Electronic Democracy](Electronic-Democracy)**
Structured democratic deliberation platform for evidence-based policymaking.

**[Evidence-Based Policy](Evidence‐based-policy)**
Tools and frameworks for grounding policy decisions in rigorous analysis.

---

## 💻 Technical Documentation

### For Developers

- **[Getting Started](Getting-Started)** - Local setup and development environment
- **[Architecture Overview](Architecture-Overview)** - System design, tech stack, and component interaction
- **[API Documentation](API-Documentation)** - Complete REST API reference
- **[Database Schema](Database-Schema)** - 40+ tables with relationships
- **[Frontend Architecture](Frontend-Architecture)** - Next.js app structure and React components
- **[Deployment Guide](Deployment-Guide)** - Production deployment instructions

### Key Technologies

**Frontend:**
- Next.js 16.1 with React 19 (App Router)
- TypeScript 5.9
- Tailwind CSS 4.1
- Zod schema validation

**Backend:**
- Express.js 4.18 with TypeScript
- Prisma 5.22 ORM
- PostgreSQL 14+ database
- JWT authentication

---

## 🎯 Feature Highlights

### Debate Platform
- **Hierarchical Arguments** - Tree-structured pro/con debates
- **Argument Merging** - Community-voted consolidation of duplicates
- **Voting System** - Upvote/downvote with karma allocation
- **Comment Threads** - Nested discussions on arguments

### Social Features
- Direct messaging between users
- Follow system and user blocking
- Notifications for activity
- Achievements and reputation

### Moderation
- Content reporting system
- Moderation actions (delete, hide, lock, ban, mute, warn, feature)
- Suggested edits for collaborative improvement
- Auto-save drafts to prevent content loss

### Education
- Classrooms with join codes
- Debate assignments
- Grading system
- Achievement badges

### Book Analysis
- Claim extraction with centrality weighting
- Fallacy detection (ad hominem, strawman, slippery slope, etc.)
- Contradiction tracking
- Evidence assessment with quality tiers
- Metaphor analysis
- Prediction mortuary (tracking forecast accuracy)

### Topic Organization
- **Topic Overlap System** - Maps beliefs across three dimensions:
  - General → Specific (abstraction levels)
  - Weak → Strong (claim intensity)
  - Negative → Positive (stance spectrum)
- One canonical page per topic (prevents fragmentation)

---

## 🌟 The Vision

By combining **crowdsourced reasoning** with structured scoring systems, we aim to:
- Make arguments **searchable, comparable, and ranked**
- Show the **strongest and weakest points** for any belief
- Foster productive, respectful, evidence-based debate
- Build **the internet's truth infrastructure**

### Design Principles

1. **Separation of Concerns** - Claims separated from evidence with explicit linkage scoring
2. **Structured Skepticism** - Diagnostic templates enforce analytical rigor
3. **Versioned Truth** - Quality scores based on methodology, not popularity
4. **Modular Type System** - Reusable core types (Evidence, Assumption, Interest, LinkageScore)
5. **No Gamification** - Quality metrics over engagement metrics
6. **Progressive Disclosure** - Simple overviews with deep audit trails available

---

## 📖 Additional Resources

- **[GitHub Repository](https://github.com/myklob/ideastockexchange)** - Source code and development
- **[Issue Tracker](https://github.com/myklob/ideastockexchange/issues)** - Report bugs or request features
- **[Quantifying Reason: The Power of Truth Scores](Quantifying-Reason:-The-Power-of-Truth-Scores)** - Philosophical foundation

---

> **Join us** in building the internet's truth infrastructure — where better arguments rise, weaker ones fall, and decisions are made with clarity.
