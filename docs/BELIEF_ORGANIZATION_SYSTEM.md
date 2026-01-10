# How the ISE Organizes Beliefs: Topics, Synonyms, Strength, and Positivity

> **The first universal system for organizing human knowledge by making scattered arguments structured, searchable, and cumulative.**

## Table of Contents

1. [Core Problem](#core-problem)
2. [The ISE Solution](#the-ise-solution)
3. [Seven Core Organizational Principles](#seven-core-organizational-principles)
4. [Technical Architecture](#technical-architecture)
5. [Implementation Status](#implementation-status)
6. [Getting Started](#getting-started)

---

## Core Problem

The ISE starts with a simple observation: **human knowledge isn't missing — it's disorganized.**

Everything we need already exists, scattered across:
- Blogs and books
- Wikipedia pages and PDFs
- Academic papers and podcasts
- Speeches, debates, and social media arguments

But none of it is **grouped, connected, or compared** in any universal way — which means we keep re-arguing the same points forever.

**The ISE fixes this** by creating a shared system for organizing beliefs by topic and linking every argument, piece of evidence, and source to exactly where it belongs.

---

## The ISE Solution

### The Organizing Principles

The ISE implements **seven core organizational principles** that transform chaos into clarity:

1. ✅ **Sorting Beliefs by Topic** - Multi-taxonomy integration
2. ✅ **Topic Pages as Control Panels** - Central hubs for each subject
3. ✅ **One Page Per Belief** - Deduplication across languages and synonyms
4. ✅ **Strength Scoring** - Measuring claim intensity (0-100)
5. ✅ **Positivity/Negativity Scoring** - Measuring valence (-100 to +100)
6. ✅ **Comprehensive Linkage** - Connecting everything to everything
7. ✅ **Automatic Updates** - Conclusions that evolve with evidence

---

## Seven Core Organizational Principles

### 1. Sorting Beliefs and Arguments by Topic

**Every belief gets assigned to one or more topics, subtopics, and sub-subtopics** — just like organizing a library.

#### Multi-Taxonomy Integration

Instead of inventing a new taxonomy, the ISE integrates the ones humanity already built:

| Taxonomy System | Coverage | Integration Status |
|----------------|----------|-------------------|
| **Dewey Decimal System** | General knowledge organization | 🔄 Planned |
| **Library of Congress Subject Headings** | Academic classification | 🔄 Planned |
| **Wikipedia Categories** | Crowdsourced taxonomy | ⚠️ Partial (via belief generator) |
| **OpenAlex Topics** | Academic research | 🔄 Planned |
| **Medical Subject Headings (MeSH)** | Medical/health sciences | 🔄 Planned |
| **UNESCO Fields of Science** | Scientific disciplines | 🔄 Planned |
| **Google Knowledge Graph** | Entity relationships | 🔄 Planned |

#### Topic Signatures (Belief DNA)

Every belief receives a **topic signature**, a kind of "idea-DNA" that captures its multi-domain nature.

**Example:** "Electric cars are good for the environment"

```
Topic Signature:
├── Technology → Transportation → Electric Vehicles
├── Environment → Climate → Emissions
├── Economics → Energy Markets
└── Ethics → Intergenerational → Harm Reduction
```

**Implementation:**
```javascript
{
  statement: "Electric cars are good for the environment",
  topicSignature: [
    { taxonomy: "technology", path: ["Transportation", "Electric Vehicles"] },
    { taxonomy: "environment", path: ["Climate", "Emissions"] },
    { taxonomy: "economics", path: ["Energy Markets"] },
    { taxonomy: "ethics", path: ["Intergenerational", "Harm Reduction"] }
  ]
}
```

### 2. Topic Pages: The Home Base for Each Subject

**Every topic gets a topic page that acts as the control panel for all beliefs in that area.**

#### What a Topic Page Contains

1. **All Related Beliefs** - Complete list with filtering
2. **Sorted by Polarity** - Positive → Neutral → Negative
3. **Sorted by Generality** - General → Specific
4. **Grouped by Similarity** - Similar beliefs clustered
5. **Best Arguments** - Top-ranked reasoning
6. **Top Evidence** - Highest-quality sources
7. **Key People** - Major contributors and stakeholders
8. **Relevant Data** - Studies, statistics, datasets

#### Example: "Electric Cars" Topic Page

**Positive Beliefs** (Sorted by strength):
- ✅ "Electric cars dramatically reduce lifetime emissions" (+85)
- ✅ "Electric cars reduce air pollution in cities" (+68)
- ✅ "Electric cars lower operating costs" (+55)

**Neutral/Descriptive Beliefs**:
- ⚪ "Electric cars require lithium-ion batteries" (0)
- ⚪ "Electric cars have higher upfront costs" (0)

**Negative Beliefs** (Sorted by strength):
- ❌ "Electric cars cause harmful mining impacts" (-55)
- ❌ "Electric cars increase demand for rare-earth minerals" (-38)
- ❌ "Electric car batteries degrade over time" (-25)

**Implementation Status:**
- ✅ Topic model exists (backend/models/Topic.js)
- ✅ Basic topic pages implemented
- 🔄 Enhanced sorting and filtering UI (planned)
- 🔄 Aggregate statistics display (planned)

### 3. One Page Per Belief (Across All Languages and Synonyms)

People express the same belief in hundreds of different ways:

- "Trump is an idiot"
- "Trump is stupid"
- "Trump isn't very smart"
- "Trump has low cognitive ability"
- "Trump is the dumbest president ever"

**Five sentences. One underlying belief.**

The ISE merges them into a **single belief page**.

#### How the ISE Knows They're the Same Belief

A **same-topic score** (0-100%) measures whether two statements refer to the same underlying claim using:

| Factor | Description | Weight |
|--------|-------------|--------|
| **Entity** | Same person or thing | 30% |
| **Attribute** | Intelligence vs. competence vs. morality | 25% |
| **Sentiment** | Positive or negative | 20% |
| **Strength** | Mild vs. extreme wording | 15% |
| **Synonyms/Antonyms** | Linguistic equivalence | 10% |

#### Same-Topic Score Examples

| Belief A | Belief B | Same-Topic Score | Notes |
|----------|----------|------------------|-------|
| "Trump is an idiot" | "Trump is a moron" | 100% | Same claim, same strength |
| "Trump is the dumbest president ever" | "Trump isn't very smart" | 100% | Same claim, different intensity |
| "Trump makes bad policy decisions" | "Trump is stupid" | 60% | Different attribute |
| "Biden is incompetent" | "Trump is an idiot" | 10% | Different entity |

**Implementation:**
- ✅ Semantic clustering implemented (backend/utils/semanticClustering.js)
- ✅ Similarity algorithms: Jaccard, Cosine, Levenshtein
- ✅ Duplicate detection on belief creation
- ✅ Similar beliefs displayed on belief pages

### 4. Strength Score: How Bold Is the Claim?

Every belief expression gets a **strength score (0-100)** that captures how intense the claim is — not whether it's true.

#### Strength Examples

| Statement | Strength | Why |
|-----------|----------|-----|
| "Trump is not very smart" | 20 | Mild negation |
| "Trump is dumb" | 40 | Direct negative |
| "Trump is extremely stupid" | 75 | Strong intensifier |
| "Trump is the dumbest president ever" | 100 | Superlative + absolute |

#### Strength Indicators

**What Increases Strength:**
- Adverbs: "very", "extremely", "incredibly"
- Comparatives: "worse", "better", "more"
- Superlatives: "best", "dumbest", "greatest"
- Absolutes: "always", "never", "completely"
- Exaggerators: "totally", "utterly", "absolutely"

**What Decreases Strength:**
- Hedges: "somewhat", "kind of", "perhaps"
- Qualifiers: "might", "could", "possibly"
- Conditionals: "if", "unless", "depending on"

**Implementation:**
```javascript
// New field in Belief model
{
  statement: String,
  strengthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  strengthAnalysis: {
    intensifiers: [String],
    hedges: [String],
    absolutes: [String],
    calculatedScore: Number
  }
}
```

**Status:**
- 🔄 Planned - Algorithm to be implemented
- 📝 Specification complete

### 5. Positivity / Negativity Score

Every belief gets a **valence score** that measures whether the claim is:

- **Positive**: "Electric cars help the planet" (+75)
- **Negative**: "Electric cars harm the planet" (-75)
- **Neutral**: "Electric cars use lithium batteries" (0)

#### Sentiment Scale

```
-100                    0                    +100
 |                      |                      |
 ▼                      ▼                      ▼
Very                 Neutral                 Very
Negative                                  Positive
```

#### Examples by Topic Type

**People:**
- +85: "Lincoln was a visionary leader"
- 0: "Lincoln was the 16th president"
- -85: "Lincoln violated constitutional rights"

**Technology:**
- +70: "Nuclear energy is clean and efficient"
- 0: "Nuclear energy uses uranium"
- -70: "Nuclear energy creates toxic waste"

**Policies:**
- +65: "Universal healthcare saves lives"
- 0: "Universal healthcare covers all citizens"
- -65: "Universal healthcare reduces quality of care"

**Implementation:**
- ✅ Sentiment polarity exists in Belief model
- ✅ Basic calculation implemented
- 🔄 Enhanced algorithm planned
- 🔄 Sentiment analysis API integration planned

### 6. Linking Evidence, Data, Books, People, and Arguments

Once a belief is deduplicated, scored, and sorted, the ISE attaches **everything connected to that belief**.

#### Comprehensive Linkage System

| Link Type | Description | Status |
|-----------|-------------|--------|
| **Arguments** | Reasons to agree/disagree with sub-arguments | ✅ Implemented |
| **Evidence** | Studies, data, citations (tiered by quality) | ✅ Implemented |
| **People** | Who agrees/disagrees + confidence intervals | 🔄 Planned |
| **Books & Media** | Supporting/opposing media items | 🔄 Planned (Phase 4) |
| **Values** | Values of supporters vs. opponents | 🔄 Planned |
| **Interests** | Stakeholder analysis | 🔄 Planned |
| **Assumptions** | Required premises | ✅ Implemented |
| **Cost-Benefit** | Quantified impacts | 🔄 Planned |
| **Laws** | Relevant legislation | ✅ Implemented |
| **Obstacles** | Barriers to resolution | 🔄 Planned |
| **Solutions** | Compromise proposals | ✅ Implemented (ConflictResolution model) |
| **Cognitive Biases** | Biases affecting reasoning | 🔄 Planned |

#### Evidence Quality Tiers

**Tier 1: Gold Standard**
- Peer-reviewed meta-analyses
- Randomized controlled trials
- Official government data
- Verified: ⭐⭐⭐⭐⭐

**Tier 2: High Quality**
- Expert analysis
- Institutional reports
- Peer-reviewed studies
- Verified: ⭐⭐⭐⭐

**Tier 3: Moderate Quality**
- Investigative journalism
- Well-designed surveys
- Expert opinions
- Verified: ⭐⭐⭐

**Tier 4: Lower Quality**
- Opinion pieces
- Anecdotal evidence
- Blog posts
- Verified: ⭐⭐

**Implementation:**
- ✅ Evidence model with verification
- ✅ Credibility scoring
- 🔄 Tier classification planned
- 🔄 Automated quality assessment planned

### 7. Why This Matters

#### The Problem Now

Right now, beliefs exist in:
- Tweets (lost in feeds)
- Comment sections (never indexed)
- Reddit threads (buried in subreddits)
- Blogs (scattered across domains)
- Books (locked in analog)
- Academic papers (behind paywalls)
- News articles (fragmented)
- Video essays (unsearchable)

Most arguments are **duplicated, unindexed, isolated, and forgotten** — so every generation rebuilds the same debates from scratch.

#### The ISE Solution

The ISE changes that:

✅ **One page per belief** - No duplication
✅ **One page per topic** - Central organization
✅ **One place for all arguments** - Complete picture
✅ **One shared structure** - Universal access
✅ **One system that updates** - Living conclusions

### Benefits

**For Individual Users:**
- Find existing discussions before duplicating
- Navigate beliefs by inherent properties
- Build upon existing arguments
- Track debate evolution
- Discover related beliefs

**For Society:**
- Stop repeating debates forever
- Reach conclusions without burning out
- Make thinking cumulative instead of exhausting
- Proportion beliefs to evidence strength
- Create institutional memory

**For Knowledge:**
- Transform scattered arguments into structured knowledge
- Make reasoning organized, not chaotic
- Enable evidence-based consensus
- Track how truth evolves over time
- Build collective intelligence

---

## Technical Architecture

### Data Models

#### Enhanced Belief Model

```javascript
const BeliefSchema = new mongoose.Schema({
  // Core Identity
  statement: { type: String, required: true, unique: true },
  description: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Multi-Dimensional Positioning
  dimensions: {
    specificity: { type: Number, min: 0, max: 100 },      // General → Specific
    sentimentPolarity: { type: Number, min: -100, max: 100 }, // Negative → Positive
  },

  // Scoring Systems
  conclusionScore: { type: Number, min: 0, max: 100 },    // Evidence strength
  strengthScore: { type: Number, min: 0, max: 100 },      // Claim intensity

  // Topic Organization
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  topicSignature: [{
    taxonomy: String,  // e.g., 'technology', 'environment'
    path: [String],    // e.g., ['Transportation', 'Electric Vehicles']
    confidence: Number // 0-1
  }],
  category: String,
  tags: [String],

  // Semantic Clustering (One Page Per Belief)
  similarBeliefs: [{
    beliefId: { type: mongoose.Schema.Types.ObjectId, ref: 'Belief' },
    similarityScore: { type: Number, min: 0, max: 1 },
    isOpposite: Boolean,
    mergedInto: Boolean,
  }],

  // Arguments and Evidence
  supportingArguments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Argument' }],
  opposingArguments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Argument' }],

  // Related Beliefs
  relatedBeliefs: [{
    beliefId: { type: mongoose.Schema.Types.ObjectId, ref: 'Belief' },
    relationship: { type: String, enum: ['supports', 'opposes', 'related'] },
    linkageStrength: { type: Number, min: 0, max: 1 }
  }],

  // Metadata
  status: { type: String, enum: ['draft', 'active', 'archived', 'merged'], default: 'active' },
  statistics: {
    views: { type: Number, default: 0 },
    supportingCount: { type: Number, default: 0 },
    opposingCount: { type: Number, default: 0 },
    totalArguments: { type: Number, default: 0 }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

#### Enhanced Topic Model

```javascript
const TopicSchema = new mongoose.Schema({
  // Core Identity
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  category: String,

  // Hierarchy
  parentTopic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  subTopics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],

  // External Taxonomy Integration
  taxonomyMappings: [{
    system: String,      // 'dewey', 'loc', 'wikipedia', 'openalex', 'mesh'
    code: String,        // External classification code
    name: String,        // External classification name
    confidence: Number   // Mapping confidence 0-1
  }],

  // Related Topics
  relatedTopics: [{
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    relevanceScore: Number
  }],

  // Aggregated Statistics
  statistics: {
    totalBeliefs: { type: Number, default: 0 },
    totalArguments: { type: Number, default: 0 },
    averageBeliefScore: { type: Number, default: 50 },
    averageSpecificity: { type: Number, default: 50 },
    averageSentiment: { type: Number, default: 0 },
    positiveBeliefs: { type: Number, default: 0 },
    neutralBeliefs: { type: Number, default: 0 },
    negativeBeliefs: { type: Number, default: 0 }
  },

  // Display Configuration
  featured: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### Services and Utilities

#### 1. Taxonomy Integration Service (NEW)

```javascript
// backend/services/taxonomyService.js

class TaxonomyService {
  // Map belief to multiple taxonomies
  async classifyBelief(statement, description) {
    const mappings = [];

    // Wikipedia categories (from content analysis)
    const wikiCategories = await this.getWikipediaCategories(statement);

    // Dewey Decimal (keyword-based mapping)
    const deweyCode = await this.mapToDewey(statement, description);

    // Library of Congress
    const locCode = await this.mapToLOC(statement, description);

    // Return combined topic signature
    return mappings;
  }

  // Get topic hierarchy
  async getTopicHierarchy(topicId) {
    // Returns: "Science > Physics > Quantum Mechanics"
  }
}
```

#### 2. Strength Scoring Service (NEW)

```javascript
// backend/services/strengthScoring.js

class StrengthScoringService {
  calculateStrength(statement) {
    let baseScore = 50;

    // Detect intensifiers (+10 each)
    const intensifiers = this.detectIntensifiers(statement);

    // Detect hedges (-10 each)
    const hedges = this.detectHedges(statement);

    // Detect superlatives (+20)
    const superlatives = this.detectSuperlatives(statement);

    // Detect absolutes (+15)
    const absolutes = this.detectAbsolutes(statement);

    const score = Math.max(0, Math.min(100,
      baseScore +
      (intensifiers.length * 10) -
      (hedges.length * 10) +
      (superlatives.length * 20) +
      (absolutes.length * 15)
    ));

    return {
      score,
      intensifiers,
      hedges,
      superlatives,
      absolutes
    };
  }

  detectIntensifiers(text) {
    const patterns = ['very', 'extremely', 'incredibly', 'highly', 'utterly'];
    return patterns.filter(p => text.toLowerCase().includes(p));
  }

  detectHedges(text) {
    const patterns = ['somewhat', 'kind of', 'perhaps', 'maybe', 'possibly'];
    return patterns.filter(p => text.toLowerCase().includes(p));
  }

  detectSuperlatives(text) {
    const patterns = ['best', 'worst', 'greatest', 'dumbest', 'smartest', 'most', 'least'];
    return patterns.filter(p => text.toLowerCase().includes(p));
  }

  detectAbsolutes(text) {
    const patterns = ['always', 'never', 'completely', 'totally', 'absolutely', 'entirely'];
    return patterns.filter(p => text.toLowerCase().includes(p));
  }
}
```

#### 3. Enhanced Semantic Clustering (EXISTING - To be enhanced)

```javascript
// backend/utils/semanticClustering.js

// Already implemented:
// - calculateSimilarity(statement1, statement2)
// - findSimilarBeliefs(statement, beliefs, threshold)
// - detectDuplicate(statement, beliefs, threshold)
// - clusterBeliefs(beliefs, threshold)
// - areOpposites(statement1, statement2)

// To add:
class SemanticClustering {
  // Enhanced same-topic score (0-100%)
  calculateSameTopicScore(belief1, belief2) {
    const entityMatch = this.matchEntity(belief1, belief2) * 0.30;
    const attributeMatch = this.matchAttribute(belief1, belief2) * 0.25;
    const sentimentMatch = this.matchSentiment(belief1, belief2) * 0.20;
    const strengthMatch = this.matchStrength(belief1, belief2) * 0.15;
    const synonymMatch = this.matchSynonyms(belief1, belief2) * 0.10;

    return Math.round((entityMatch + attributeMatch + sentimentMatch + strengthMatch + synonymMatch) * 100);
  }
}
```

### API Endpoints

#### New/Enhanced Endpoints

```
POST   /api/beliefs/calculate-strength
       Request: { statement: String }
       Response: { strengthScore: Number, analysis: Object }

POST   /api/beliefs/:id/update-scores
       Updates all dimensional scores (specificity, sentiment, strength)

GET    /api/topics/:id/organized
       Returns topic page with beliefs organized by polarity and strength

GET    /api/topics/search/taxonomy
       Query: taxonomy=dewey&code=500
       Returns topics matching external taxonomy codes

POST   /api/beliefs/deduplicate
       Finds and suggests merges for duplicate beliefs

GET    /api/beliefs/:id/full-context
       Returns belief with ALL linked content (arguments, evidence, people, laws, etc.)
```

---

## Implementation Status

### ✅ Fully Implemented (Phase 1)

1. **Core Belief System**
   - Belief CRUD operations
   - Argument creation and voting
   - Evidence submission and verification
   - Related beliefs linkage

2. **Scoring Algorithms**
   - Conclusion Score (6 components)
   - ReasonRank / ArgumentRank
   - Fallacy detection (10 types)
   - Redundancy detection

3. **Semantic Clustering**
   - Similarity calculation (Jaccard, Cosine, Levenshtein)
   - Duplicate detection
   - Similar belief suggestions

4. **Basic Topic System**
   - Topic model
   - Topic CRUD
   - Topic-belief associations

5. **Sentiment Analysis**
   - Basic polarity calculation
   - Positive/negative/neutral classification

### ⚠️ Partially Implemented

1. **Topic Pages**
   - ✅ Basic structure
   - 🔄 Enhanced organization by polarity
   - 🔄 Aggregate statistics display
   - 🔄 Sorting by multiple dimensions

2. **Dimensional Positioning**
   - ✅ Specificity calculation
   - ✅ Sentiment polarity
   - 🔄 Enhanced strength scoring

### 🔄 Planned Features

1. **Taxonomy Integration** (Phase 2)
   - Dewey Decimal mapping
   - Library of Congress integration
   - Wikipedia category sync
   - OpenAlex topic mapping
   - MeSH integration (medical)
   - UNESCO fields integration

2. **Enhanced Strength Scoring** (Phase 2)
   - Advanced intensity detection
   - Contextual analysis
   - Comparative strength

3. **Comprehensive Linkage** (Phases 3-4)
   - People/stakeholder tracking
   - Media integration
   - Values analysis
   - Interest mapping
   - Obstacle identification
   - Bias detection

4. **Advanced UI** (Phase 2-3)
   - 3D belief space visualization
   - Interactive topic hierarchies
   - Multi-dimensional filtering
   - Evolution timeline

---

## Getting Started

### For Developers

1. **Review the Architecture**
   ```bash
   cat docs/ARCHITECTURE.md
   cat docs/ONE_PAGE_PER_BELIEF.md
   cat docs/BELIEF_ORGANIZATION_SYSTEM.md  # This file
   ```

2. **Understand the Data Models**
   ```bash
   cat backend/models/Belief.js
   cat backend/models/Topic.js
   cat backend/models/Argument.js
   ```

3. **Explore the Services**
   ```bash
   cat backend/services/beliefGenerator.js
   cat backend/utils/semanticClustering.js
   ```

4. **Run the System**
   ```bash
   cd backend && npm install && npm run dev
   cd frontend && npm install && npm run dev
   ```

### For Contributors

See the [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Code style guidelines
- Pull request process
- Development workflow
- Testing requirements

### For Users

Visit the live platform at: **ideastockexchange.org** (coming soon)

Or run locally following the [README.md](../README.md) instructions.

---

## Vision Statement

> **The ISE is the first system that makes human reasoning organized, not chaotic.**

It lets us:
- **Stop getting tired** of thinking halfway through
- **Finally proportion** our beliefs to the actual strength of the reasoning
- **Stop repeating** the same debates forever
- **Reach good conclusions** without burning out
- **Make thinking cumulative** instead of exhausting

This organizational system makes **one page per topic** possible at scale, transforming scattered arguments into structured knowledge that updates automatically as evidence changes.

---

## Contribute

**Want to help build this system?**

- 📧 Contact: [GitHub Issues](https://github.com/myklob/ideastockexchange/issues)
- 💻 Code: [View on GitHub](https://github.com/myklob/ideastockexchange)
- 📚 Docs: [Technical Framework](./ARCHITECTURE.md)

**Areas to contribute:**
- Belief taxonomies and classification
- Topic page design and UX
- Semantic matching algorithms
- Evidence verification systems
- Taxonomy API integrations

---

**Built with ❤️ by the ISE community**

*Last updated: 2025-01-28*
