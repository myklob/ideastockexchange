# 🏗️ Idea Stock Exchange — Full Feature Architecture

## **1. Core Concept**

The ISE is a **crowdsourced reasoning engine** — a platform where:

* Every **belief**, **argument**, **piece of evidence**, and **media item** is treated as a *trackable object* with its own truth score.
* Users **contribute**, **challenge**, and **link** these objects through structured reasoning.
* The system dynamically updates each item's **score** based on pro/con performance and evidence quality — similar to a stock market's price.
* The whole system works as a transparent **marketplace of ideas** ranked by truth, evidence, and importance.

---

## **2. Core Objects (Database Models)**

| **Entity**                     | **Description**                                                                         | **Core Attributes**                                                                                | **Relations**                        | **Status** |
| ------------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------- |
| **Belief**                     | A claim about reality, policy, or ethics (e.g. "Raising minimum wage reduces poverty.") | Title, Description, Category, Truth Score, Importance Score, Confidence, Tags                      | Linked to Arguments, Evidence, Media | ✅ Implemented (partial) |
| **Argument (Pro/Con)**         | Logical reasoning supporting or opposing a Belief                                       | Type (Pro/Con), Logic Validity, Strength, Linkage Score, Author, Timestamps                        | Linked to Beliefs and Evidence       | ✅ Implemented |
| **Evidence**                   | Data, study, quote, or reference used to support an Argument                            | Source, Quality Score, Verification Score, Linkage Score, Type (Empirical/Testimonial/Theoretical) | Linked to Arguments and Media        | ✅ Implemented |
| **Media**                      | Film, book, podcast, article, meme, etc.                                                | Title, Genre, Impact/Reach, Media Truth Score, Internal/External Linkage                           | Linked to Beliefs it influences      | 🔄 Planned (Phase 4) |
| **User**                       | Participant contributing arguments, evidence, or ratings                                | Profile, Reputation Score, Contributions, CBO status, History, Incentive Wallet                    | Linked to all contributions          | ✅ Implemented (basic) |
| **CBO (Chief Belief Officer)** | User with greatest score-changing contributions for a Belief                            | Share % of ad revenue, Reputation, Historical Impact                                               | Linked to Beliefs and Contributions  | 🔄 Planned (Phase 3) |
| **Community/Topic Page**       | Group of related beliefs (e.g. "Climate Change", "Free Speech")                         | Aggregated Truth/Importance Scores, Summary, Discussion                                            | Linked to Beliefs and Media          | 🔄 Planned (Phase 2) |

---

## **3. Scoring Algorithms**

Each object has its own scoring mechanism, derived from others:

### **3.1 Truth Score** 🔄 Planned (Phase 2)

```text
Truth Score = (Logical Validity × Evidence Quality × Verification Level) ± Counterargument Weight
```

* Auto-updated whenever arguments or evidence are added or re-evaluated.
* Bounded between -1 (false) and +1 (true).

**Current Implementation:**
- We have **Conclusion Score (CS)** instead: `CS = Σ((RtA - RtD) × ES × LC × VC × LR × UD × AI)`
- Bounded between 0-100

### **3.2 Evidence Verification Score** ✅ Implemented

* Assesses the reliability of cited data, studies, or claims.
* Based on cross-referencing, independent replication, and credibility of source.
* Tied to external APIs (e.g. CrossRef, PubMed, fact-checking databases) - **Planned**

**Current Implementation:**
- Credibility Score: `50 + (verifiedCount × 10) - (disputedCount × 10)`
- Verification statuses: unverified, pending, verified, disputed, debunked
- User verification tracking with notes

### **3.3 Linkage Score** ✅ Implemented

* Measures connection strength between objects.
* Derived from user arguments like "This evidence strongly supports this belief."
* Weighted by the argument's performance (how well it withstands pro/con attacks).

**Current Implementation:**
- Linkage Relevance (LR) score: 0-1 scale
- Related beliefs with linkage strength (0-1)
- Relationship types: supports, opposes, related

### **3.4 Importance Score** 🔄 Planned (Phase 2)

* Separate from truth — measures the **real-world consequence** of a belief.
* Derived from arguments about *cost-benefit*, *ethical significance*, or *policy impact*.

**Future Implementation:**
- Importance field in Belief model
- Cost-benefit analysis framework
- Ethical impact assessment
- Policy impact calculator

### **3.5 Epistemic Impact** 🔄 Planned (Phase 2)

```text
Epistemic Impact = Truth Score × Reach (Audience Size) × Linkage Strength
```

* Used for ranking **media** and **arguments** by their total influence on collective reasoning.

**Future Implementation:**
- Reach tracking (views, shares, citations)
- Media influence calculation
- Cultural impact graphs
- Trending algorithm based on epistemic impact

### **3.6 User Reputation / CBO Impact** 🔄 Planned (Phase 3)

* Measures a user's influence on improving the platform's knowledge accuracy.
* Algorithm:

  ```text
  Contribution Impact = |Δ Truth Score| × Durability × Evidence Quality
  ```
* Highest Impact contributors per belief become **Chief Belief Officers (CBOs)**.

**Current Implementation:**
- Basic reputation field (integer)
- Not automatically calculated

**Future Implementation:**
- Automatic reputation calculation
- Contribution impact tracking
- CBO selection algorithm
- Ad revenue distribution system

---

## **4. User Interaction Features**

### **4.1 Belief Pages** ✅ Implemented

* Each belief has a single, permanent page.
* Structured like a **Wikipedia + Debate.org hybrid**, with:

  * Belief statement ✅
  * Dynamic Truth Score graph over time 🔄 Planned
  * Top pro/con arguments ✅
  * Linked evidence/media ⚠️ Partial (evidence exists, media planned)
  * Summary written by top contributors 🔄 Planned
  * Historical versioning 🔄 Planned

**Current Features:**
- Statement, description, category, tags ✅
- Supporting/opposing arguments with tabs ✅
- Conclusion score display ✅
- Related beliefs sidebar ✅
- View tracking ✅
- Edit/delete for owners ✅

**Planned Features:**
- Score history graph
- Collaborative summary editing
- Version control (Git-like)
- Contribution timeline

### **4.2 Argument Builder** ✅ Implemented

* Step-by-step guided interface to create new pro/con arguments.
* Prompts users for:

  * Premises ✅ (via content field)
  * Logical structure (deductive, causal, analogy, etc.) 🔄 Planned
  * Supporting evidence ⚠️ Partial (evidence form exists, integration pending)
  * Counterarguments 🔄 Planned (via sub-arguments)

**Current Features:**
- Type selector (supporting/opposing) ✅
- Rich textarea with validation ✅
- Character counter (10-2000 chars) ✅
- Quality guidelines ✅
- Sub-argument support (model level) ✅

**Planned Features:**
- Logical structure selector
- Evidence attachment during argument creation
- Counterargument prompts
- Argument templates

### **4.3 Evidence Submission** ✅ Implemented

* Users attach citations, files, or quotes.
* The system requests metadata:

  * Type (study, observation, expert testimony) ✅
  * Source credibility ✅
  * Verification method ✅
* Peer review and automated checks (e.g. AI-based credibility analysis). 🔄 Planned

**Current Features:**
- 8 evidence types ✅
- Source information (URL, author, publication, date) ✅
- Scholarly metadata (DOI, ISBN, PMID, citations) ✅
- Tag system ✅
- Verification tracking ✅

**Planned Features:**
- AI-based credibility analysis
- Automatic DOI/PMID lookup
- CrossRef/PubMed integration
- Plagiarism detection
- File upload support

### **4.4 Scoring Panel** ✅ Implemented

* Allows users to:

  * Rate logical validity (0–1) ✅ (automated via fallacy detection)
  * Rate evidence quality (0–1) ✅ (via verification)
  * Suggest linkages between beliefs ⚠️ Partial (related beliefs exist, UI pending)
  * Upvote or downvote arguments based on reasoning strength, not popularity ✅

**Current Features:**
- Vote on arguments (up/down) ✅
- Automated fallacy detection affects LC score ✅
- Evidence verification affects VC score ✅
- Score breakdown visualization ✅

**Planned Features:**
- Manual score adjustment (for moderators)
- Linkage suggestion UI
- Reasoning strength explanation
- Vote reasoning (why did you vote this way?)

### **4.5 Media Integration** 🔄 Planned (Phase 4)

* Database of films, books, articles, etc.
* Each linked to beliefs they promote or challenge.
* Automatic indexing from media APIs (IMDb, Goodreads, etc.).
* Calculated *Media Truth Score* and *Epistemic Impact*.

**Future Implementation:**
- Media model with fields: title, type, genre, year, creators
- Belief linkages (claims made by media)
- API integrations: IMDb, Goodreads, Spotify, YouTube
- Media Truth Score calculation
- Cultural impact tracking
- Recommendation engine

### **4.6 User Dashboard** ⚠️ Partial

* Tracks:

  * Personal contributions ✅ (via user model)
  * Score impact 🔄 Planned
  * Topics followed 🔄 Planned
  * Reputation growth 🔄 Planned
  * Ad revenue share (for CBOs) 🔄 Planned (Phase 3)
  * Network graph of belief influence 🔄 Planned

**Current Features:**
- Basic profile page
- Lists created beliefs and arguments
- Authentication status

**Planned Features:**
- Contribution timeline
- Impact metrics
- Following system
- Reputation graph over time
- CBO dashboard
- Earnings tracker

### **4.7 Incentive & Reward System** 🔄 Planned (Phase 3)

* Points for verified contributions.
* Reputation = weighting power in future scoring.
* Top contributor (CBO) per belief receives:

  * 5% of ad revenue tied to that belief's page.
  * Badge and historical credit in "score changers" leaderboard.
* Optional cryptocurrency or token integration (like TruthTokens).

**Future Implementation:**
- Points system
- Reputation-weighted voting
- Ad revenue integration
- Payment processing
- CBO badges and recognition
- Leaderboards
- Token/cryptocurrency option
- Bounty system for quality contributions

---

## **5. Visualization Tools**

| **Tool**                   | **Purpose**                                                 | **Status** |
| -------------------------- | ----------------------------------------------------------- | ---------- |
| **Truth Graphs**           | Show change in Truth Score over time.                       | 🔄 Planned |
| **Argument Maps**          | Visualize logical tree of pro/con arguments.                | ⚠️ Partial (hierarchical display exists) |
| **Linkage Network**        | Show interconnections between beliefs, evidence, and media. | 🔄 Planned |
| **Cultural Impact Graphs** | Display *Epistemic Impact* of major media (truth × reach).  | 🔄 Planned (Phase 4) |
| **User Influence Charts**  | Track who improved accuracy across domains.                 | 🔄 Planned |

Example:
A network graph could show how *"Raising minimum wage"* links to beliefs about *inflation*, *poverty*, *employment*, and how media like *Freakonomics* influenced those beliefs.

**Current Visualizations:**
- Score breakdown with progress bars ✅
- Hierarchical argument tree ✅
- Related beliefs list ✅

**Planned Visualizations:**
- D3.js/Vis.js network graphs
- Timeline charts
- Heat maps
- Force-directed graphs
- Sankey diagrams (argument flow)

---

## **6. Governance & Transparency**

### **6.1 Open Versioning** 🔄 Planned

* Every change to a belief, argument, or score is recorded.
* Full edit history and changelog visible publicly (like Git commit history).

**Future Implementation:**
- Version control system
- Diff visualization
- Change attribution
- Rollback capability
- Blame view (who changed what when)

### **6.2 Peer Review Layer** 🔄 Planned

* Users can challenge evidence or argument scores.
* Challenges trigger automated and human review.
* Reviewers earn reputation for accurate adjudication.

**Future Implementation:**
- Challenge submission form
- Review queue
- Reviewer reputation system
- Appeal process
- Resolution tracking

### **6.3 Auditable Algorithms** ✅ Implemented (Partial)

* All scoring formulas open-source on GitHub. ✅
* Code reproducibility: "Show me how this truth score was computed." ⚠️ Partial
* Simulation tools for testing how weights affect outcomes. 🔄 Planned

**Current Implementation:**
- Open source code ✅
- Score breakdown visible ✅
- Formula documentation ✅

**Planned Features:**
- Score calculator tool
- Simulation sandbox
- Weight adjustment experiments
- A/B testing framework

### **6.4 Moderation Framework** 🔄 Planned

* Transparent rule set based on *argument quality, not ideology*.
* No bans for beliefs — only for manipulation, spam, or bad-faith reasoning.
* "Quarantine" status for unsupported claims pending review.

**Future Implementation:**
- Moderation guidelines
- Flagging system
- Quarantine workflow
- Appeal process
- Moderator dashboard
- Transparent moderation log

### **6.5 Consensus Building** ⚠️ Partial

* Every belief page shows:

  * Mean Truth Score ✅ (Conclusion Score)
  * Standard deviation (consensus spread) 🔄 Planned
  * Number of unique contributors ✅
  * Distribution of expertise levels 🔄 Planned

**Current Implementation:**
- Average conclusion score ✅
- Argument counts ✅
- View counts ✅

**Planned Features:**
- Consensus metrics
- Expertise tracking
- Disagreement visualization
- Credence distributions

---

## **7. AI Integration (Phase 5)**

* **Automated Claim Extraction:** Parse texts/media for factual or ethical claims. 🔄 Planned
* **Argument Suggestion Engine:** Suggest missing pro/con arguments. 🔄 Planned
* **Evidence Summarizer:** Use AI to summarize and verify cited studies. 🔄 Planned
* **Debate Companion:** AI coach helps users construct balanced reasoning. 🔄 Planned
* **Misinfo Detector:** Flags logically invalid or empirically contradicted claims. ⚠️ Partial (fallacy detection exists)

**Current AI Features:**
- Fallacy detection (pattern-based, not ML) ✅
- Redundancy detection (similarity algorithms) ✅

**Planned AI Features:**
- GPT integration for claim extraction
- Argument generation
- Evidence summarization
- Credibility assessment
- Fact-checking API integration
- Debate coaching chatbot
- Sentiment analysis
- Topic modeling

---

## **8. Developer Infrastructure**

| **Component**           | **Description**                                                | **Status** |
| ----------------------- | -------------------------------------------------------------- | ---------- |
| **Backend**             | Node.js + Express.js                                           | ✅ Implemented |
| **Database**            | MongoDB + Mongoose ORM                                         | ✅ Implemented |
| **Graph Database**      | Neo4j for linkage mapping                                      | 🔄 Planned |
| **Frontend**            | React + Vite + Tailwind CSS                                    | ✅ Implemented |
| **Version Control**     | GitHub + public commit log                                     | ✅ Implemented |
| **Data APIs**           | REST endpoints                                                 | ✅ Implemented |
| **GraphQL**             | GraphQL API layer                                              | 🔄 Planned |
| **Authentication**      | JWT + bcrypt                                                   | ✅ Implemented |
| **OAuth**               | Social login                                                   | 🔄 Planned |
| **Scoring Engine**      | Separate service with automated recalculations                 | ⚠️ Partial |
| **Analytics Dashboard** | For moderators and researchers                                 | 🔄 Planned |
| **Testing Suite**       | Unit + integration tests for score reliability                 | 🔄 Planned |
| **Real-time**           | WebSocket for live updates                                     | 🔄 Planned |
| **Caching**             | Redis for performance                                          | 🔄 Planned |
| **CDN**                 | Static asset delivery                                          | 🔄 Planned |
| **Email**               | Transactional email service                                    | 🔄 Planned |
| **File Storage**        | S3 or similar for uploads                                      | 🔄 Planned |

---

## **9. Expansion Modules**

| **Module**                    | **Description**                                                      | **Status** |
| ----------------------------- | -------------------------------------------------------------------- | ---------- |
| **Policy Simulator**          | Uses importance + truth + cost-benefit to rank policy proposals.     | 🔄 Planned (Phase 6) |
| **CBO Dashboard**             | Tracks influence, payout, and contribution history per user.         | 🔄 Planned (Phase 3) |
| **Educational Mode**          | Classroom integration to teach reasoning and critical thinking.      | 🔄 Planned (Phase 6) |
| **Media Watchdog**            | Tracks misleading or manipulative entertainment by epistemic impact. | 🔄 Planned (Phase 4) |
| **Belief Evolution Timeline** | Displays how truth scores evolve over years with new data.           | 🔄 Planned (Phase 2) |
| **Global Alignment Map**      | Shows which cultures/groups differ in truth perception.              | 🔄 Planned (Phase 6) |

---

## **10. Roadmap Overview (GitHub Milestones)**

| **Phase**   | **Focus**         | **Deliverables**                                                  | **Status** | **Timeline** |
| ----------- | ----------------- | ----------------------------------------------------------------- | ---------- | ------------ |
| **Phase 1** | MVP Core          | Belief pages, arguments, evidence submission, basic truth scoring | ✅ **90% Complete** | Q1 2024 |
| **Phase 2** | Advanced Scoring  | Linkage, importance, epistemic impact, visualization              | 🔄 In Planning | Q2 2024 |
| **Phase 3** | Incentives        | CBO system, ad revenue share, reputation weighting                | 🔄 In Planning | Q3 2024 |
| **Phase 4** | Media Integration | Media truth scores, cultural impact tracking                      | 🔄 In Planning | Q4 2024 |
| **Phase 5** | AI Tools          | Argument suggestion, claim extraction, auto-verification          | 🔄 In Planning | Q1 2025 |
| **Phase 6** | Governance        | Peer review, moderation, version transparency                     | 🔄 In Planning | Q2 2025 |
| **Phase 7** | Global Expansion  | Multilingual support, institutional partnerships                  | 🔄 In Planning | Q3 2025 |

---

## **11. API Endpoints**

### **Authentication** ✅ Implemented
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### **Beliefs** ✅ Implemented
- `GET /api/beliefs` - List all (filtering, search, pagination)
- `GET /api/beliefs/:id` - Get single belief with arguments
- `POST /api/beliefs` - Create belief
- `PUT /api/beliefs/:id` - Update belief
- `DELETE /api/beliefs/:id` - Delete belief
- `GET /api/beliefs/:id/arguments` - Get all arguments for belief
- `POST /api/beliefs/:id/calculate-score` - Recalculate conclusion score

### **Arguments** ✅ Implemented
- `POST /api/arguments` - Create argument
- `PUT /api/arguments/:id` - Update argument
- `DELETE /api/arguments/:id` - Delete argument
- `POST /api/arguments/:id/vote` - Vote up/down

### **Evidence** ✅ Implemented
- `GET /api/evidence` - List all evidence
- `GET /api/evidence/:id` - Get single evidence
- `POST /api/evidence` - Create evidence
- `PUT /api/evidence/:id` - Update evidence
- `DELETE /api/evidence/:id` - Delete evidence
- `POST /api/evidence/:id/verify` - Verify evidence

### **Analysis** ✅ Implemented
- `POST /api/analysis/fallacies` - Detect fallacies in text
- `POST /api/analysis/fallacies/batch` - Batch fallacy analysis
- `GET /api/analysis/fallacies/:type` - Get fallacy info/education
- `POST /api/analysis/redundancy` - Find redundant arguments
- `POST /api/analysis/uniqueness` - Calculate argument uniqueness
- `POST /api/analysis/belief/:id/full-analysis` - Comprehensive analysis

### **Algorithms** ✅ Implemented
- `POST /api/argumentrank` - Calculate ReasonRank scores
- `POST /api/conclusion-score` - Calculate conclusion score
- `GET /api/examples/argumentrank` - Example calculation

### **Planned Endpoints** 🔄

#### **Media** (Phase 4)
- `GET /api/media` - List all media
- `GET /api/media/:id` - Get single media item
- `POST /api/media` - Create media
- `PUT /api/media/:id` - Update media
- `DELETE /api/media/:id` - Delete media
- `GET /api/media/:id/beliefs` - Get beliefs influenced by media
- `POST /api/media/:id/calculate-truth-score` - Calculate media truth score

#### **CBO** (Phase 3)
- `GET /api/cbo/leaderboard` - Get top CBOs
- `GET /api/cbo/:userId` - Get CBO dashboard for user
- `GET /api/cbo/:userId/earnings` - Get revenue share for user
- `POST /api/cbo/:userId/payout` - Process payout

#### **Communities** (Phase 2)
- `GET /api/communities` - List all communities/topics
- `GET /api/communities/:id` - Get community details
- `POST /api/communities` - Create community
- `PUT /api/communities/:id` - Update community
- `GET /api/communities/:id/beliefs` - Get beliefs in community

#### **Reputation** (Phase 3)
- `GET /api/reputation/:userId` - Get user reputation details
- `GET /api/reputation/:userId/history` - Get reputation history
- `POST /api/reputation/calculate` - Recalculate all reputations

#### **Notifications** (Phase 6)
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

---

## **12. Database Schema Details**

### **User Model** ✅ Implemented
```javascript
{
  username: String (unique, 3-50 chars),
  email: String (unique, validated),
  password: String (hashed with bcrypt),
  role: String (user/moderator/admin),
  reputation: Number (default 0),
  createdBeliefs: [ObjectId],
  createdArguments: [ObjectId],
  votedArguments: [{argumentId, vote}],
  createdAt: Date,
  updatedAt: Date
}
```

**Planned Additions:**
- `cboBeliefs: [ObjectId]` - Beliefs where user is CBO
- `followedTopics: [ObjectId]`
- `followers: [ObjectId]`
- `following: [ObjectId]`
- `reputationHistory: [{score, date, reason}]`
- `earnings: Number`
- `expertiseAreas: [String]`

### **Belief Model** ✅ Implemented
```javascript
{
  statement: String (unique, 10-500 chars),
  description: String (0-2000 chars),
  author: ObjectId (ref: User),
  category: String (enum),
  tags: [String],
  conclusionScore: Number (0-100),
  supportingArguments: [ObjectId],
  opposingArguments: [ObjectId],
  relatedBeliefs: [{beliefId, relationship, linkageStrength}],
  statistics: {
    views: Number,
    supportingCount: Number,
    opposingCount: Number,
    totalArguments: Number
  },
  status: String (draft/active/archived/flagged),
  trending: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Planned Additions:**
- `truthScore: Number (-1 to 1)` - Separate from conclusion score
- `importanceScore: Number (0-100)`
- `confidenceLevel: Number (0-1)`
- `epistemicImpact: Number`
- `cbo: ObjectId` - Chief Belief Officer
- `communityId: ObjectId`
- `version: Number`
- `versionHistory: [{version, changes, date, author}]`
- `consensusMetrics: {mean, stdDev, expertise}`

### **Argument Model** ✅ Implemented
```javascript
{
  content: String (10-2000 chars),
  type: String (supporting/opposing),
  beliefId: ObjectId (ref: Belief),
  author: ObjectId (ref: User),
  scores: {
    overall: Number (0-100),
    logical: Number (0-100),
    linkage: Number (0-100),
    importance: Number (0-100),
    evidenceStrength: Number (0-1),
    logicalCoherence: Number (0-1),
    verificationCredibility: Number (0-1),
    linkageRelevance: Number (0-1),
    uniqueness: Number (0-1),
    argumentImportance: Number (0-1)
  },
  evidence: [ObjectId],
  subArguments: [ObjectId],
  parentArgument: ObjectId,
  votes: {up: Number, down: Number},
  reasonRankScore: Number,
  status: String (active/flagged/removed),
  createdAt: Date,
  updatedAt: Date
}
```

**Planned Additions:**
- `logicalStructure: String` - Type of argument (deductive, causal, etc.)
- `premises: [String]`
- `conclusion: String`
- `fallaciesDetected: [{type, confidence, explanation}]`
- `counterarguments: [ObjectId]`
- `scoreHistory: [{score, date}]`

### **Evidence Model** ✅ Implemented
```javascript
{
  title: String (max 200 chars),
  description: String (max 1000 chars),
  type: String (enum: 8 types),
  source: {
    url: String,
    author: String,
    publication: String,
    date: Date
  },
  credibilityScore: Number (0-100),
  verificationStatus: String (enum),
  verifiedBy: [{user, status, notes, verifiedAt}],
  arguments: [ObjectId],
  submittedBy: ObjectId,
  tags: [String],
  metadata: {
    doi: String,
    isbn: String,
    pmid: String,
    citations: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Planned Additions:**
- `fileUrl: String` - For uploaded files
- `extractedClaims: [String]` - AI-extracted claims
- `relatedEvidence: [ObjectId]` - Similar evidence
- `citedBy: [ObjectId]` - Arguments citing this evidence

### **Media Model** 🔄 Planned (Phase 4)
```javascript
{
  title: String,
  type: String (film/book/podcast/article/meme),
  genre: [String],
  year: Number,
  creators: [String],
  description: String,
  externalIds: {
    imdb: String,
    isbn: String,
    spotify: String,
    youtube: String
  },
  mediaTruthScore: Number,
  epistemicImpact: Number,
  reach: {
    views: Number,
    sales: Number,
    ratings: Number
  },
  beliefsPromoted: [{beliefId, linkageStrength}],
  beliefsChallenged: [{beliefId, linkageStrength}],
  analysis: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **Community Model** 🔄 Planned (Phase 2)
```javascript
{
  name: String,
  description: String,
  category: String,
  beliefs: [ObjectId],
  moderators: [ObjectId],
  members: [ObjectId],
  aggregatedScores: {
    avgTruthScore: Number,
    avgImportanceScore: Number,
    consensusLevel: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## ✅ **Implementation Status Summary**

### **Fully Implemented (Phase 1 - 90%)**
- ✅ User authentication and authorization
- ✅ Belief CRUD operations
- ✅ Argument CRUD operations with voting
- ✅ Evidence submission with verification
- ✅ Conclusion Score calculation (6 components)
- ✅ ReasonRank/ArgumentRank algorithm
- ✅ Fallacy detection (10 types)
- ✅ Redundancy detection (4 algorithms)
- ✅ Evidence verification system
- ✅ Hierarchical argument trees
- ✅ Score breakdown visualization
- ✅ Related beliefs linkage
- ✅ Search and filtering
- ✅ RESTful API
- ✅ Responsive UI with Tailwind

### **Partially Implemented**
- ⚠️ Evidence display in arguments (API exists, UI missing)
- ⚠️ Sub-argument creation (model supports, no UI)
- ⚠️ User dashboard (basic, needs enhancement)
- ⚠️ Analysis API integration (endpoints exist, frontend doesn't use)

### **Planned Features**
- 🔄 Truth Score (separate from Conclusion Score)
- 🔄 Importance Score
- 🔄 Epistemic Impact
- 🔄 Media integration
- 🔄 CBO system
- 🔄 Community/Topic pages
- 🔄 Policy Simulator
- 🔄 Reputation calculation
- 🔄 Visualization tools (graphs, networks)
- 🔄 Version control/history
- 🔄 Peer review system
- 🔄 AI integrations
- 🔄 Real-time updates
- 🔄 Testing suite
- 🔄 API documentation

---

## **The Vision Summary**

The ISE combines:

* **Wikipedia's structure** - Permanent pages for knowledge
* **StackOverflow's reputation system** - Quality through community validation
* **Prediction market dynamics** - Truth scores that update with new information
* **GitHub's transparency** - Open source, versioned, auditable
* **Academic peer review standards** - Evidence-based verification
* **Social network scale** - Broad participation and engagement

…to create a **living, open-source system for evaluating truth and importance** — where ideas are scored, evidence is tracked, and influence is transparent.

---

**This architecture document will evolve as the platform grows. Contributions and feedback welcome!**
