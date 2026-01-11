# Idea Stock Exchange: One Page Per Topic

## The Architecture of Reason

**The Core Belief:** To cure the chaos of online discourse, we must create a single, unified page for every topic. This page must organize beliefs in three simultaneous dimensions—General to Specific, Weak to Strong, and Negative to Positive—allowing users to navigate complexity with the clarity of a map.

## The Problem

Right now, online discussions fail us in four critical ways:

1. **Topic Drift:** Conversations wander, losing focus and momentum.
2. **Scattered Arguments:** Brilliant insights vanish into endless, unsearchable comment threads.
3. **Repetition Without Progress:** We argue in circles, never building on what came before.
4. **No Collective Memory:** There is no record of what has been proven, disproven, or refined over time.

**The cost?** Lost insights, wasted energy, and debates that generate heat but no light.

## The Solution: Multi-Dimensional Belief Mapping

We solve this by treating ideas not as a stream of text, but as data points in a 3D space. Every topic page allows you to sort the chaos into order using three specific axes:

### Dimension 1: General → Specific (The Abstraction Ladder)
Navigate up to see the broader principles or down to explore specific policy implementations. This prevents "category errors" where people argue about specific laws when they actually disagree on fundamental philosophy.

### Dimension 2: Weak → Strong (The Confidence Scale)
Sort beliefs by intensity. Note that the strongest claims often have lower scores because they require a higher burden of proof. This dimension helps users distinguish between nuanced reality and dogmatic extremism.

### Dimension 3: Negative → Positive (The Valence Spectrum)
View the full spectrum of positions in one view. Instead of a binary "Pro/Con," we map the nuance of the debate, allowing users to find the exact point where they stand.

## Features

- **Topic Hubs:** Each major question gets its own hub where all perspectives converge
- **Multi-Dimensional Views:** Organize beliefs by abstraction, intensity, or valence
- **Master View:** See all three dimensions combined in one comprehensive table
- **Dynamic Scoring:** Track which beliefs have the strongest evidence and support
- **Hierarchical Navigation:** Move from general principles to specific implementations

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Components** - Modular, reusable UI components

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm
# 💡 Idea Stock Exchange

A marketplace where ideas are traded like stocks! Invest in concepts, innovations, and creative thinking through a virtual stock exchange mechanism.

## 🎯 Features

- **Trade Ideas**: Buy and sell idea shares with real-time price discovery
- **Dynamic Pricing**: Prices change based on supply and demand
- **Portfolio Management**: Track your investments and performance
- **Leaderboards**: See top investors and trending ideas
- **IPO System**: Launch your own ideas as tradeable stocks
- **Real-time Updates**: Live price feeds using Server-Sent Events

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm
# Idea Stock Exchange - Book Analysis Template

This repository contains templates and resources for the Idea Stock Exchange (ISE) book analysis framework.

## Overview

The ISE provides a comprehensive framework for analyzing books based on:
- **Logical Validity**: Internal consistency, fallacy count, evidence quality
- **Work Quality**: Writing style, clarity, engagement, originality
- **Belief Impact (R₀)**: Sales volume, citation count, cultural penetration

## Template Structure

The book analysis template (`templates/book-analysis-template.html`) includes:

1. **Overall Score Summary** - Key metrics for evaluating the book
2. **Best Evidence** - Supporting and weakening evidence with scoring
3. **Best Objective Criteria** - Measurable criteria for media strength
4. **Argument Trees** - Pro and con arguments with linkage scores
5. **Internal Analysis** - Claims audit weighted by centrality
6. **Predictions & Reality Check** - Verification of book predictions
7. **Interests & Motivations** - Stakeholder analysis
8. **Shared/Conflicting Interests** - Interest alignment analysis
9. **Foundational Assumptions** - Required beliefs for acceptance/rejection
10. **Cost-Benefit Analysis** - Benefits and costs evaluation
11. **Compromise Solutions** - Middle-ground positions
12. **Obstacles to Resolution** - Barriers to honest assessment
13. **Biases** - Cognitive biases affecting both sides
14. **Core Values Conflict** - Values analysis
15. **Topic Overlap** - ISE topic categorization

## Evidence Types

- **T1**: Peer-reviewed/Official
- **T2**: Expert/Institutional
- **T3**: Journalism/Surveys
- **T4**: Opinion/Anecdote

## Centrality Weights

- Core Thesis: 1.0
- Major Support: 0.7
- Examples: 0.4
- Footnotes: 0.1

## Usage

Use the template in `templates/book-analysis-template.html` as a starting point for analyzing books. Replace all placeholder text in brackets `[...]` with specific information about the book being analyzed.

## Links

- [Home](https://myclob.pbworks.com/w/page/21957696/Colorado%20Should)
- [Topics](https://myclob.pbworks.com/w/page/159323433/One%20Page%20Per%20Topic)
- [Book Analysis](https://myclob.pbworks.com/w/page/21956965/Books)
# Idea Stock Exchange - Book Analysis System

**Combat Reports for Ideas**: A comprehensive book analysis platform that generates systematic scrutiny across six logical battlegrounds, transforming subjective literary influence into quantifiable, transparent metrics.

## 🎯 Overview

The Idea Stock Exchange doesn't provide traditional book reviews—it generates **combat reports for ideas**. Every book submitted faces systematic scrutiny across six logical battlegrounds, with granular scoring for each claim, weighted by centrality to the book's thesis.

## 📊 Four-Dimensional Scoring Framework

Every book receives four independent scores:

1. **Book Logical Validity Score** (0-100): How well arguments survive logical scrutiny
2. **Book Quality Score** (0-100): Whether the book achieves its stated goals
3. **Topic Overlap Score** (0-100% per belief): How central a belief is to the book's thesis
4. **Belief Impact Weight**: Influence multiplier based on reach (log of sales + citations + shares)

### Final Impact Formula

```
Total Impact on Belief X = Logical Validity × Quality × Topic Overlap × log(Reach)
```

## ⚔️ The 6 Logic Battlegrounds

1. **Fallacy Autopsy Theater**: Tests logical structure—strawmen, ad hominem, post hoc reasoning
2. **Contradiction Trials**: Checks internal consistency
3. **Evidence War Rooms**: Verifies data and sources
4. **Metaphor MRI Scans**: Evaluates analogy accuracy
5. **Prediction Mortuaries**: Tracks forecasting accuracy
6. **Belief Transmission Labs**: Measures societal spread velocity ("Belief R₀")

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>

```bash
git clone https://github.com/yourusername/ideastockexchange.git
cd ideastockexchange
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
ideastockexchange/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with header/footer
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   └── topic/[id]/          # Dynamic topic pages
│       └── page.tsx
├── components/              # React components
│   ├── AbstractionLadder.tsx    # General to Specific view
│   ├── ConfidenceScale.tsx      # Weak to Strong view
│   ├── ValenceSpectrum.tsx      # Negative to Positive view
│   └── MasterView.tsx           # Combined 3D view
├── data/                    # Sample data
│   └── sampleData.ts        # Example topics and beliefs
├── lib/                     # Utilities
│   └── utils.ts             # Helper functions
├── types/                   # TypeScript definitions
│   └── index.ts             # Core type definitions
└── README.md
```

## Data Model

### Core Types

**Topic**: A subject for debate with multiple beliefs
- `id`: Unique identifier
- `title`: Topic name
- `description`: Brief explanation
- `beliefs`: Array of belief statements
- `parentTopics`: Related broader topics

**Belief**: A specific claim about a topic
- `statement`: The belief text
- `score`: Community rating
- `abstractionLevel`: General to Specific position
- `intensity`: Weak to Strong (claim strength)
- `valence`: Negative to Positive (stance)
- `hierarchyDepth`: Position in abstraction ladder

## Sample Topics

The application includes four example topics:

1. **Congressional Term Limits** - Demonstrates the Abstraction Ladder (General → Specific)
2. **Electric Cars** - Demonstrates the Confidence Scale (Weak → Strong)
3. **Social Media Impact** - Demonstrates the Valence Spectrum (Negative → Positive)
4. **Donald Trump's Capability** - Demonstrates the Master View (all dimensions combined)

## Extending the System

### Adding New Topics

1. Create belief data in `data/sampleData.ts`:
```typescript
export const myTopicBeliefs: Belief[] = [
  {
    id: 'mt-1',
    topicId: 'my-topic',
    statement: 'Your belief statement here',
    score: 50,
    abstractionLevel: 'general',
    hierarchyDepth: 0,
    intensity: 'moderate',
    intensityPercentage: 50,
    valence: 'moderately_positive',
    valenceScore: 40,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
```

2. Add the topic to `sampleTopics` array
3. Update `getTopicWithBeliefs()` function to include your topic

### Creating New Views

Create new components in `components/` that:
- Accept `beliefs: Belief[]` as props
- Use utility functions from `lib/utils.ts` for sorting/formatting
- Display data in a way that highlights specific dimensions

## The Vision

By giving every topic its own "room" where ideas can be organized across multiple dimensions, we create the infrastructure for collective intelligence. This isn't just better debate—it's a foundation for:

- Evidence-based governance
- Systematic conflict resolution
- Decisions that serve the common good

Ideas are tested, not just shouted. Evidence is gathered, not ignored. Progress is measured, not assumed.

**This is how democracy evolves. This is how we move from tribal warfare to collaborative wisdom.**

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this code for your own projects.

## Contact

Ready to help build it? Contact us to contribute to this vision of organized, rational discourse.

```bash
npm install
```

3. Initialize the database:
```bash
npm run init-db
```

4. Start the server:
```bash
npm start
```

5. Open your browser to:
```
http://localhost:3000
```

### Demo Account

- Username: `demo`
- Password: `demo123`

## 📖 How to Play

1. **Sign Up**: Create a free account and receive $10,000 in virtual currency
2. **Browse Ideas**: Explore the marketplace to find interesting ideas
3. **Trade**: Buy shares in ideas you believe in, sell when you think they've peaked
4. **Create**: Launch your own ideas with a unique ticker symbol
5. **Compete**: Climb the leaderboard and become the top investor!

## 🏗️ Architecture

### Technology Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Frontend**: Vanilla JavaScript (no framework)
- **Real-time**: Server-Sent Events for price updates

### Project Structure

```
ideastockexchange/
├── server.js                 # Main Express server
├── package.json              # Dependencies
├── db/
│   ├── database.js           # Database connection
│   └── models.js             # Data models (User, Idea, Holding, Transaction)
├── lib/
│   └── trading-engine.js     # Trading logic and price discovery
├── public/
│   ├── index.html            # Landing page
│   ├── market.html           # Idea marketplace
│   ├── idea.html             # Idea detail & trading page
│   ├── portfolio.html        # User portfolio
│   ├── create.html           # Create new idea
│   ├── leaderboard.html      # Top investors & ideas
│   ├── common.js             # Shared JavaScript utilities
│   └── style.css             # Styles
├── scripts/
│   └── init-db.js            # Database initialization script
└── test/
    └── test.js               # Basic tests
```

## 🎮 Pricing Algorithm

The price discovery mechanism adjusts prices based on trading activity:

```javascript
// Price movement based on trade size
impactFactor = shares_traded / shares_outstanding
baseMovement = impactFactor * 0.5  // 50% movement for 100% of shares
totalMovement = baseMovement + volatility

// Buy orders increase price, sell orders decrease price
newPrice = currentPrice * (1 ± totalMovement)
```

**Key Features:**
- Larger trades have bigger impact on price
- Market volatility adds randomness
- Minimum price floor of $1.00
- Real-time price updates

## 🧪 Testing

Run the test suite:

```bash
npm test
```

## 📝 API Documentation

### Authentication

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Ideas

- `GET /api/ideas` - List all ideas
- `GET /api/ideas/:ticker` - Get idea details
- `POST /api/ideas` - Create new idea (IPO)

### Trading

- `POST /api/trade/buy` - Buy shares
- `POST /api/trade/sell` - Sell shares

### Portfolio

- `GET /api/portfolio` - Get portfolio summary
- `GET /api/portfolio/transactions` - Get transaction history

### Market Data

- `GET /api/market/top` - Top performing ideas
- `GET /api/market/recent` - Recent trades
- `GET /api/leaderboard` - Top investors
- `GET /api/stream/prices` - SSE price stream

## 🎯 Ralph Wiggum Loop Validation

This project follows the "Ralph Wiggum Loop" methodology for validation:

✅ **Simplicity**: Can a 5-year-old understand it?
✅ **Functionality**: Does it work immediately?
✅ **Fun**: Is it engaging and enjoyable?
✅ **Feedback**: Do users see results right away?

See [RALPH_WIGGUM_VALIDATION.md](RALPH_WIGGUM_VALIDATION.md) for details.

## 📋 Project Goals

See [GOALS.md](GOALS.md) for the full list of project objectives.

## 🎨 Design Specifications

See [DESIGN.md](DESIGN.md) for detailed technical specifications.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🎉 Have Fun!

Remember, this is a game! The goal is to have fun, be creative, and enjoy the experience of trading ideas. The virtual currency has no real value, so take risks and experiment!

---

*"I'm learnding!" - Ralph Wiggum*
3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your database connection string:

```
DATABASE_URL="postgresql://user:password@localhost:5432/ideastockexchange?schema=public"
```

4. Set up the database:

```bash
npm run db:push
```

5. Seed the database with example books:

```bash
npm run db:seed
```

This will populate the database with four example books:

- **Hamlet** by William Shakespeare
- **Thinking, Fast and Slow** by Daniel Kahneman
- **Outliers** by Malcolm Gladwell
- **The Communist Manifesto** by Karl Marx & Friedrich Engels

6. Run the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Example Analyses

The seed data includes complete analyses demonstrating the ISE methodology:

### Thinking, Fast and Slow (88/100 validity)

- **Strong Claims**: Cognitive bias framework (92%), Statistical reasoning (88%)
- **Weak Claims**: Priming effects (60% - replication crisis)
- **Key Insight**: Statistical sections outperform narrative examples

### Outliers (72/100 validity)

- **Strong Claims**: 10,000-hour rule (80%)
- **Weak Claims**: Birth month effects (55% - correlation ≠ causation)
- **Fallacies**: Post hoc reasoning flagged throughout

### The Communist Manifesto (65/100 validity, 9.2/10 impact)

- **Belief Impact**: One of history's most influential texts (500M+ copies)
- **Key Insight**: Perfect example of validity/influence gap

## 🏗️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
# Idea Stock Exchange - Topic Overlap Scores

**ReasonRank Applied to Information Architecture**

A system for organizing knowledge using evidence-based **Topic Overlap Scores** (0-100%) to determine how beliefs (statements) belong to topic pages. Think of it as "PageRank for knowledge organization" — beliefs are ranked by relevance just as web pages are ranked by search engines.

---

## 📖 What Are Topic Overlap Scores?

**Core Concept:** Every belief can belong to multiple topics, but not equally. A Topic Overlap Score (0-100%) measures *how much of the belief is actually about that topic*.

### Example

**Belief:** "CO2 emissions from fossil fuels increase atmospheric warming."

| Topic | Overlap | Why |
|-------|---------|-----|
| Global Warming | 98% | Core causal story of the topic |
| CO2 Emissions | 92% | Directly about emissions mechanism |
| Fossil Fuels | 60% | Mentions fossil fuels as source |
| Government Policy | 12% | Policy is an implication, not the content |
| Individual Actions | 5% | Several steps downstream |

**Result:** This belief ranks on **Page 1** for "Global Warming," ranks lower for "Fossil Fuels," and is deep/optional for "Individual Actions."

---

## 🎯 Key Features

### 1. **Multi-Signal Overlap Calculation**
Combines 5 algorithmic signals:
- **Semantic Overlap** (40%): Keyword + meaning similarity using embeddings
- **Taxonomy Distance** (25%): Position in topic hierarchy
- **Citation Co-occurrence** (15%): Shared sources between belief and topic
- **User Navigation Behavior** (10%): Click-through and engagement data
- **Graph Dependency** (10%): Usage as reasons in argument trees

### 2. **Contestable Scores with Argument Trees**
- Every overlap score is a **claim** that can be debated
- Users add **pro/con arguments** with evidence
- Claims have **linkage scores** and **evidence tiers**
- Scores update when better arguments win

### 3. **TopicRank for Page Ordering**
Beliefs are ranked by a combined score:
```
TopicRank = OverlapScore × TruthScore × (1 + DisagreementBoost) × RecencyWeight
```

- **OverlapScore**: How relevant (this system)
- **TruthScore**: How well-supported by evidence
- **DisagreementBoost**: Highlights controversial but important beliefs
- **RecencyWeight**: Freshness decay

### 4. **User Controls: One Dataset, Many Views**
- **Strict Mode**: Show only beliefs with >80% overlap (core topic)
- **Comprehensive Mode**: Show beliefs with >20% overlap (includes context)
- **Science-First**: Weight empirical claims higher
- **Solutions-First**: Elevate policy/action beliefs

---

## 🏗️ Architecture

### Tech Stack
- **Backend:** FastAPI (Python)
- **Database:** SQLite with SQLAlchemy ORM
- **NLP:** Sentence Transformers (semantic embeddings)
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Scoring:** Custom multi-signal overlap engine

### Data Model

```
Topic
├─ name, description, keywords
├─ embedding_vector (for semantic similarity)
└─ hierarchy relationships (parent/child topics)

Statement (Belief)
├─ text, author, source
├─ embedding_vector
├─ truth_score (from argument trees)
└─ disagreement_score

TopicOverlapScore
├─ statement_id, topic_id
├─ overlap_score (0-100%)
├─ topic_rank (for page ordering)
└─ signal_breakdown (JSON: semantic, taxonomy, etc.)

OverlapClaim (contestable meta-claim)
├─ claimed_overlap (proposed score)
├─ status (proposed/accepted/contested)
└─ arguments (pro/con reasons with evidence)
```

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd ideastockexchange

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env
```

### 2. Initialize Database

```bash
# Initialize database schema
python database.py

# Populate demo data (climate change examples)
python demo_data.py
```

This creates:
- 6 topics (Global Warming, CO2 Emissions, Fossil Fuels, etc.)
- 7 sample statements with arguments
- ~20 overlap scores with signal breakdowns
- Topic hierarchy relationships
- Example overlap claims with argument trees

### 3. Run the Server

```bash
# Option 1: Direct
python main.py

# Option 2: With auto-reload (for development)
uvicorn main:app --reload

# Server runs on http://localhost:8000
```

### 4. Explore

- **Web Interface:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **OpenAPI Spec:** http://localhost:8000/openapi.json

---

## 💻 Usage Examples

### Via Web Interface

1. **Browse Topics**
   - View all topics with descriptions
   - Click a topic to see its "Page 1" (top-ranked beliefs)

2. **View Topic Pages**
   - See beliefs ranked by TopicRank
   - Examine overlap scores and signal breakdowns
   - Understand *why* each belief appears on the page

3. **Add New Data**
   - Create topics with keywords
   - Add statements (beliefs)
   - Calculate overlap scores between any statement-topic pair

### Via API

#### Create a Topic
```bash
curl -X POST http://localhost:8000/api/topics \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Artificial Intelligence",
    "description": "The theory and development of computer systems able to perform tasks that normally require human intelligence.",
    "keywords": ["AI", "machine learning", "neural networks", "automation"]
  }'
```

#### Create a Statement
```bash
curl -X POST http://localhost:8000/api/statements \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Large language models can generate human-like text through transformer architectures.",
    "author": "AI Researcher",
    "source_url": "https://example.com/llm-research"
  }'
```

#### Calculate Overlap Score
```bash
curl -X POST "http://localhost:8000/api/overlap/calculate?statement_id=1&topic_id=1"
```

Response:
```json
{
  "id": 1,
  "statement_id": 1,
  "topic_id": 1,
  "overlap_score": 87.5,
  "topic_rank": 78.3,
  "signal_breakdown": "{\"semantic\": 0.92, \"taxonomy\": 0.85, ...}",
  "calculated_at": "2025-12-27T12:00:00"
}
```

#### Get Topic Page (Ranked Beliefs)
```bash
curl "http://localhost:8000/api/topics/1/statements?min_overlap=50&page=1&page_size=20"
```

---

## 📊 How Overlap Scoring Works

### Signal Calculation

#### 1. Semantic Overlap (40% weight)
```python
# Generate embeddings using Sentence Transformers
statement_embedding = model.encode(statement.text)
topic_embedding = model.encode(topic.name + topic.description)

# Cosine similarity
semantic_score = cosine_similarity(statement_embedding, topic_embedding)

# Keyword boost (up to 15% bonus)
keyword_boost = (matching_keywords / total_keywords) * 0.15

final_semantic = (semantic_score * 0.85) + keyword_boost
```

#### 2. Taxonomy Distance (25% weight)
```python
# Direct match: 100%
# Parent/child: 75%
# Grandparent: 50%
# Sibling: 30%
# Unrelated: 0%
```

#### 3. Citation Co-occurrence (15% weight)
```python
# Jaccard similarity of source URLs
intersection = len(statement_sources & topic_common_sources)
union = len(statement_sources | topic_common_sources)
citation_score = intersection / union
```

#### 4. User Navigation Behavior (10% weight)
```python
# Click rate: 40%
# Engagement time: 30%
# Helpful votes: 30%
```

#### 5. Graph Dependency (10% weight)
```python
# How many core statements depend on this one?
dependency_ratio = dependencies_count / core_statements_count
```

### Combined Score
```python
final_overlap = (
    semantic * 0.40 +
    taxonomy * 0.25 +
    citation * 0.15 +
    navigation * 0.10 +
    graph_dependency * 0.10
) * 100  # Convert to 0-100%
```

---

## 🛠️ Configuration

Edit `.env` to customize:

```env
# Database
DATABASE_URL=sqlite:///./ideastockexchange.db

# Embeddings
EMBEDDING_MODEL=all-MiniLM-L6-v2
SIMILARITY_THRESHOLD=0.75

# Overlap Scoring Weights (adjust to emphasize different signals)
SEMANTIC_WEIGHT=0.40
TAXONOMY_WEIGHT=0.25
CITATION_WEIGHT=0.15
NAVIGATION_WEIGHT=0.10
GRAPH_WEIGHT=0.10

# TopicRank Weights
OVERLAP_WEIGHT=0.50
TRUTH_WEIGHT=0.30
DISAGREEMENT_BOOST=0.10
RECENCY_WEIGHT=0.10
```

---

## 📁 Project Structure

```
ideastockexchange/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   └── books/           # Book CRUD operations
│   ├── books/               # Book pages
│   │   ├── page.tsx         # Books listing
│   │   └── [id]/page.tsx    # Individual book analysis
│   ├── topics/              # Topics/beliefs pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   └── globals.css          # Global styles
├── lib/                     # Shared libraries
│   ├── db.ts               # Prisma client
│   ├── types.ts            # TypeScript types
│   ├── scoring.ts          # Scoring calculations
│   └── services/           # Business logic
│       ├── bookService.ts
│       └── logicBattlegrounds.ts
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
└── package.json
```

## 🔬 Key Features

### Weighted Argument Validity

Not all claims carry equal weight. Centrality weighting:

- Core thesis claims: Weight = 1.0
- Major supporting arguments: Weight = 0.7
- Examples and illustrations: Weight = 0.4
- Tangential points: Weight = 0.2
- Footnotes: Weight = 0.1

### Human + AI Synergy

Final validity scoring combines:

- AI Pattern Detection (30%): Scale analysis across thousands of books
- Crowd Contextual Nuance (50%): Domain-specific context evaluation
- Expert Deep Analysis (20%): Domain expertise in specific fields

### Time Decay for Evidence

Older claims lose validity if not re-verified, with special tracking for:

- Replication status (crucial for scientific claims)
- Last verification date
- Original publication date

## 📈 API Endpoints

### Books

- `GET /api/books` - List all books with scores
- `POST /api/books` - Create a new book
- `GET /api/books/:id` - Get book details
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book
- `GET /api/books/:id/analysis` - Get comprehensive analysis report

## 🎨 UI Components

The application features:

- **Homepage**: Introduction to the ISE framework
- **Books Listing**: Grid of analyzed books with scores
- **Book Analysis Page**: Comprehensive breakdown with:
  - Four-dimensional scores
  - Claim-by-claim analysis
  - Logic battlegrounds results
  - Topic overlap visualization
  - Author credibility metrics

## 🔧 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with examples
```

## 📊 Database Schema

The system uses a comprehensive relational schema:

- **Book**: Core book metadata and scores
- **Claim**: Individual testable claims within books
- **TopicOverlap**: Belief centrality to each book
- **Fallacy**: Logical fallacies identified (Battleground 1)
- **Contradiction**: Internal inconsistencies (Battleground 2)
- **Evidence**: Source verification (Battleground 3)
- **Metaphor**: Analogy accuracy (Battleground 4)
- **Prediction**: Forecasting accuracy (Battleground 5)
- **Author**: Author profiles with truth equity
- **User**: Contributor profiles with credibility scores

## 🌟 Core Principles

1. **Granular Analysis**: Individual claims scored, not just entire books
2. **Centrality Weighting**: Core arguments matter more than footnotes
3. **Transparent Metrics**: Every score is calculable and verifiable
4. **Validity ≠ Influence**: Track both independently
5. **Time-Aware**: Evidence quality changes as studies replicate or fail
6. **Crowd + AI + Expert**: Hybrid scoring prevents bias

## 🚦 Roadmap

- [ ] User authentication and contribution system
- [ ] Real-time collaborative claim evaluation
- [ ] Automated AI fallacy detection
- [ ] Citation graph visualization
- [ ] Belief transmission velocity tracking
- [ ] Author response system
- [ ] ISE Verified badge for 90%+ validity

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! The ISE transforms reading from passive consumption to active critical analysis.

---

**"Books don't own the truth—you and the crowd define it."**
├── models.py              # SQLAlchemy data models
├── database.py            # Database initialization
├── overlap_engine.py      # Overlap scoring algorithms
├── services.py            # Business logic layer
├── main.py                # FastAPI application
├── index.html             # Web interface
├── demo_data.py           # Demo data population script
├── requirements.txt       # Python dependencies
├── .env.example           # Configuration template
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

---

## 🔬 Testing with Demo Data

The demo data creates a climate change knowledge graph:

**Topics:**
1. Global Warming / Climate Change
2. CO2 Emissions
3. Fossil Fuels
4. Government Policy
5. Individual Actions
6. Climate Policy

**Example Statements:**
- "CO2 emissions from fossil fuels increase atmospheric warming" (high overlap with Global Warming)
- "Government carbon pricing reduces emissions" (high overlap with Climate Policy)
- "Individual lifestyle changes can reduce carbon footprints" (high overlap with Individual Actions)

**Test Scenarios:**
1. View "Global Warming" topic page → See highest-ranked beliefs (98% overlap)
2. Compare overlap scores for same statement across different topics
3. Examine signal breakdowns to understand *why* scores differ
4. Add arguments to overlap claims to contest scores

---

## 🎯 Use Cases

### 1. Knowledge Organization
- Organize research papers, articles, and claims by topic
- Automatically rank content by relevance instead of manual curation
- Show "Page 1" for core content, deeper pages for tangential material

### 2. Argument Mapping
- Build evidence-based argument trees
- Track which beliefs support/refute others
- Calculate truth scores based on argumentation

### 3. Educational Resources
- Create topic-based curricula with ranked learning materials
- Show core concepts first, advanced topics later
- Track conceptual dependencies

### 4. Debate Platforms
- Organize claims by topic relevance
- Highlight central vs. tangential arguments
- Surface controversial but important beliefs

---

## 🚧 Roadmap

### Implemented ✅
- [x] Multi-signal overlap calculation
- [x] Topic hierarchy (taxonomy distance)
- [x] TopicRank calculation
- [x] Argument trees for truth scoring
- [x] Contestable overlap claims with arguments
- [x] REST API with full CRUD
- [x] Web interface with topic pages
- [x] Signal breakdown visualization

### Planned 🔜
- [ ] Evidence tier system (1-5 quality ratings)
- [ ] User voting on arguments
- [ ] Prediction markets for truth scores
- [ ] Real user navigation tracking
- [ ] Advanced graph algorithms (PageRank-style)
- [ ] Multi-user collaboration features
- [ ] Export to knowledge graph formats (RDF, JSON-LD)
- [ ] Integration with external sources (Wikipedia, ArXiv, etc.)

---

## 📚 Learn More

### ReasonRank Framework
- [Reasons](https://myclob.pbworks.com/Reasons)
- [Evidence Tiers](https://myclob.pbworks.com/w/page/159353568/Evidence)
- [Linkage Scores](https://myclob.pbworks.com/w/page/159338766/Linkage%20Scores)
- [Truth Scores](https://myclob.pbworks.com/w/page/21960078/truth)
- [One Page Per Topic](https://myclob.pbworks.com/w/page/159323433/One%20Page%20Per%20Topic)

### Underlying Concepts
- **PageRank:** Google's algorithm for ranking web pages by importance
- **ReasonRank:** Applying PageRank principles to evidence and arguments
- **Semantic Embeddings:** Vector representations of meaning (Sentence Transformers)
- **Cosine Similarity:** Measure of similarity between two vectors

---

## 🤝 Contributing

Contributions are welcome! Areas of interest:

1. **Algorithmic improvements:** Better signal calculations, new signals
2. **Evidence integration:** Connect to external fact-checking databases
3. **User experience:** Improved visualizations, mobile UI
4. **Performance:** Optimize embedding calculations, caching strategies
5. **Documentation:** Tutorials, examples, case studies

---

## 📄 License

[Specify your license here]

---

## 🙏 Acknowledgments

This system implements the **Topic Overlap Scores** concept from the ReasonRank framework, which applies evidence-based reasoning to information architecture. The goal is to make knowledge organization auditable, contestable, and hard to game — just like the claims themselves.

**Every belief finds its place. Every placement is justified.**

---

## 📧 Contact

[Your contact information]

---

**Status:** ✨ Functional prototype implementing full specification
# Idea Stock Exchange

A platform for finding, linking, and tracking similar statements and their arguments across the internet. This system uses advanced NLP to identify semantically similar statements, aggregates them, and tracks reasons to agree or disagree with each statement.

## Features

- **Statement Collection**: Scrape and collect statements from blogs, forums, and web pages
- **Semantic Similarity**: Use sentence transformers to find statements that express the same idea in different words
- **Automatic Linking**: Automatically link similar statements together with similarity scores
- **Argument Tracking**: Track reasons to agree or disagree with each statement
- **Clustering**: Group statements that express the same core idea
- **Search**: Find statements similar to any query using semantic search
- **REST API**: Full-featured API for programmatic access
- **Web Interface**: Beautiful, responsive web UI for easy interaction

## Architecture

### Components

1. **Database Layer** (`models.py`, `database.py`)
   - SQLAlchemy ORM models for statements, arguments, clusters
   - SQLite database (easily upgradeable to PostgreSQL)
   - Many-to-many relationship tracking for similar statements

2. **Similarity Engine** (`similarity.py`)
   - Sentence transformers for semantic embedding generation
   - Cosine similarity calculation for finding similar statements
   - Text normalization and preprocessing
   - Automatic clustering algorithms

3. **Scraper Module** (`scraper.py`)
   - Async web scraping with aiohttp
   - Support for blogs, forums, and generic web pages
   - Respects robots.txt and rate limiting
   - Configurable content extraction

4. **Service Layer** (`services.py`)
   - Business logic for statement management
   - Automatic similarity detection and linking
   - Argument tracking and organization
   - Search functionality

5. **API Layer** (`main.py`)
   - FastAPI REST API
   - Automatic OpenAPI documentation
   - CORS support for web clients

6. **Web Interface** (`index.html`)
   - Modern, responsive UI
   - Real-time statistics
   - Statement search and management
   - Argument tracking interface

## Installation

### Prerequisites

- Python 3.8 or higher
- pip

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ideastockexchange
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
# IdeaStockExchange

A comprehensive debate platform inspired by Kialo, enhanced with integrated media lists to support evidence-based argumentation. IdeaStockExchange helps users engage in structured debates backed by books, videos, articles, documentaries, and other media sources.

## Vision

Debates and arguments often rely on more than just statements—they draw from books, documentaries, articles, and other media. By integrating these media into structured pro/con lists, IdeaStockExchange elevates the quality of discourse, provides comprehensive analyses, and addresses misinformation effectively.

## Key Features

### Core Debate Platform (Kialo-style)
- **Hierarchical Argument Structure**: Organize arguments in nested pro/con trees
- **Position-based Arguments**: Arguments can be Pro, Con, or Neutral (informational)
- **Debate Management**: Create, browse, and participate in public debates
- **User Authentication**: Secure registration and login system
- **Voting System**: Upvote/downvote arguments to surface quality content

### Media Integration
- **Multi-format Support**: Books, videos, articles, images, podcasts, documentaries, academic papers, and websites
- **Media Library**: Centralized repository of curated media sources
- **Argument-Media Linking**: Connect media to arguments with position tags (Supports/Refutes/Neutral)
- **Source Metadata**: Track credibility scores, bias ratings, authors, and publication dates
- **Relevance Scoring**: Rate how relevant each media item is to its linked argument

### Advanced Scoring & Ranking

#### ReasonRank Algorithm
A sophisticated ranking system that evaluates arguments based on:
- **Truth Score** (30%): Accuracy and factual correctness
- **Importance Score** (25%): Significance to the discussion
- **Relevance Score** (20%): Pertinence to the debate topic
- **Vote Score** (15%): Community voting (normalized with sigmoid function)
- **Media Score** (8%): Quality and quantity of supporting media
- **Recency Boost** (2%): Freshness of the argument

#### Media Score Calculation
Media support evaluation considers:
- Number and diversity of media sources
- Credibility of each source
- Relevance to the argument
- Position alignment (supporting vs. refuting)
- Balance of evidence

### Truth, Importance & Relevance Framework
- **Truth Score**: 0-1 rating for factual accuracy
- **Importance Score**: 0-1 rating for significance
- **Relevance Score**: 0-1 rating for topical relevance
- **Transparent Scoring**: Visible scores help users evaluate argument quality

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Zod schemas

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS Modules (no framework dependencies)

### Database Schema

#### Core Models
- **User**: Authentication and user profiles
- **Debate**: Discussion topics with metadata
- **Argument**: Nested pro/con arguments with scoring
- **Media**: Library of evidence sources
- **ArgumentMedia**: Junction table linking arguments to media
- **Vote**: User votes on arguments

#### Key Relationships
- Debates contain multiple Arguments
- Arguments can have child Arguments (nested structure)
- Arguments link to multiple Media items
- Media items can support/refute multiple Arguments
- Users can vote on Arguments

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd ideastockexchange

# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb ideastockexchange

# Copy environment file
cp .env.example .env

# Edit .env and configure:
# DATABASE_URL="postgresql://user:password@localhost:5432/ideastockexchange"
# JWT_SECRET="your-secret-key"
# PORT=3001

# Run database migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

### 3. Run the Application

#### Development Mode
```bash
# Terminal 1: Start backend server
npm run server:dev

# Terminal 2: Start frontend dev server
cd client
npm start
```

#### Production Mode
```bash
# Build both server and client
npm run build

# Start production server
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Prisma Studio: http://localhost:5555 (run `npm run prisma:studio`)

## Usage Guide

### Creating a Debate

1. Register/login to the platform
2. Navigate to "Create Debate"
3. Provide:
   - Title (required)
   - Description (optional, but recommended)
   - Tags (comma-separated)
   - Visibility (public/private)
4. Click "Create Debate"

### Adding Arguments

1. Open a debate
2. Click "Add Root Argument" or "Reply" on an existing argument
3. Choose position:
   - **Pro**: Agrees with parent/debate thesis
   - **Con**: Disagrees with parent/debate thesis
   - **Neutral**: Provides context/information
4. Write your argument
5. Submit

### Adding Media to Arguments

Media can be added when creating an argument or linked separately:

1. Go to Media Library
2. Click "Add Media"
3. Fill in media details:
   - Title, type, URL
   - Author, description
   - Credibility score (0-100%)
   - Bias score (-1 to 1: left/neutral/right)
4. Link media to arguments with position tags

### Voting & Scoring

- **Vote**: Click upvote/downvote on any argument
- **View Scores**: See Truth, Importance, Relevance scores on arguments
- **ReasonRank**: Arguments automatically ranked by the algorithm

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login and get JWT token

### Debates
- `GET /api/debates` - List all public debates
- `GET /api/debates/:id` - Get debate with argument tree
- `POST /api/debates` - Create debate (auth required)
- `PATCH /api/debates/:id` - Update debate (auth required)
- `DELETE /api/debates/:id` - Delete debate (auth required)

### Arguments
- `GET /api/arguments/:id` - Get argument with children
- `POST /api/arguments` - Create argument (auth required)
- `PATCH /api/arguments/:id` - Update argument (auth required)
- `POST /api/arguments/:id/score` - Update scores (auth required)
- `POST /api/arguments/:id/vote` - Vote on argument (auth required)
- `DELETE /api/arguments/:id/vote` - Remove vote (auth required)

### Media
- `GET /api/media` - List media (supports filtering and search)
- `GET /api/media/:id` - Get media details
- `POST /api/media` - Add media (auth required)
- `PATCH /api/media/:id` - Update media (auth required)
- `DELETE /api/media/:id` - Delete media (auth required)
- `POST /api/media/:mediaId/link/:argumentId` - Link media to argument

## Architecture Decisions

### Why PostgreSQL?
- Excellent support for relational data (debates, arguments, media)
- ACID compliance for data integrity
- JSON support for flexible metadata
- Powerful querying for complex argument trees

### Why Prisma?
- Type-safe database access
- Automatic migrations
- Excellent developer experience
- Built-in connection pooling

### ReasonRank Algorithm Design
The algorithm uses weighted factors to:
1. Surface high-quality, well-supported arguments
2. Balance community input with objective metrics
3. Reward evidence-based argumentation
4. Maintain recency without over-prioritizing new content

### Security Considerations
- JWT authentication with secure password hashing (bcrypt)
- Input validation with Zod schemas
- SQL injection prevention via Prisma
- XSS protection through React's built-in escaping
- CORS configuration for API access control

## Future Enhancements

### Planned Features
1. **AI-Powered Scoring**: Automated truth/relevance scoring using NLP
2. **Fact-Checking Integration**: Real-time verification via fact-checking APIs
3. **Advanced Media Verification**: Source credibility analysis
4. **Export Capabilities**: Generate debate summaries and reports
5. **Real-time Collaboration**: WebSocket support for live debates
6. **Recommendation Engine**: Suggest relevant debates and media
7. **Moderation Tools**: Flag inappropriate content, community guidelines
8. **Analytics Dashboard**: Debate engagement metrics
9. **Mobile App**: Native iOS/Android applications
10. **API Access**: Public API for third-party integrations

### Advanced Concepts
- **Automated Conflict Resolution**: Use ReasonRank to identify consensus
- **Cost-Benefit Analysis**: AI-powered analysis of policy debates
- **Dynamic Weighting**: Adjust scoring weights based on debate type
- **Explainable AI**: Transparency in automated scoring decisions

## Contributing

This project is open for contributions. Areas of interest:
- Improving the ReasonRank algorithm
- Adding AI/ML-based scoring
- Enhancing the UI/UX
- Adding fact-checking integrations
- Writing tests
- Documentation improvements

## License

MIT License - See LICENSE file for details

## Acknowledgments

Inspired by:
- **Kialo**: For structured debate visualization
- **Captain Fact**: For real-time fact-checking concepts
- **Reddit/HN**: For voting and ranking mechanisms
- **Wikipedia**: For community-driven knowledge curation

---

**Built with the mission to improve online discourse, reduce misinformation, and promote evidence-based decision-making.**
# Idea Stock Exchange

> **Building Infrastructure for Human Reasoning**

A platform for structured debate, algorithmic ranking, and collaborative intelligence to transform how we evaluate ideas and make decisions.

## 🌟 Overview

The Idea Stock Exchange (ISE) is a revolutionary platform that applies the time-tested pro/con methodology to internet-scale collaborative reasoning. Instead of scattering arguments across millions of web pages, ISE creates **one canonical location for each argument**, allowing humanity to systematically evaluate ideas and build cumulative knowledge.

### The Core Innovation

> "Allow everyone to 'talk' at once if we allow users to organize their contributions. Give one page per issue, then let users post comments within a column of reasons to agree OR within the reasons to disagree column."

This simple innovation of categorizing arguments into structured columns revolutionizes how we:
- **Debate** complex issues
- **Reach** informed conclusions
- **Think** systematically about problems
- **Build** on previous reasoning instead of starting from scratch

## 🎯 Key Features

### 1. **Structured Argumentation**
- **Pro/Con Columns**: Every conclusion has clear "Reasons to Agree" and "Reasons to Disagree"
- **Recursive Structure**: Arguments can themselves have supporting/opposing arguments
- **Argument Trees**: Visual representation of how evidence supports or opposes ideas

### 2. **Algorithmic Scoring**
- **ReasonRank**: PageRank-inspired algorithm for idea quality
- **Weighted Evidence**: Academic sources ranked higher than opinions
- **Linkage Scores**: Measures how well evidence actually supports claims
- **Recursive Scoring**: Sub-arguments contribute to parent argument scores

### 3. **Evidence-Based Reasoning**
- **Evidence Tiers**:
  - Peer-reviewed meta-analysis (weight: 1.0)
  - Peer-reviewed studies (weight: 0.9)
  - Expert consensus (weight: 0.85)
  - Verified data (weight: 0.8)
  - News reporting (weight: 0.6)
  - Expert opinion (weight: 0.7)
  - Anecdotal (weight: 0.3)
  - Personal opinion (weight: 0.2)

### 4. **Conflict Resolution Framework**
- Based on "Getting to Yes" principles
- **Interests** not positions: Understand underlying motivations
- **Objective criteria**: Debatable standards for resolution
- **Brainstorming**: Generate multiple solution options
- **Separation**: Judge ideas on merit, not who proposed them

### 5. **Collaborative Intelligence**
- **Community Voting**: Democratic evaluation of argument quality
- **Expert Weighting**: Specialists have more influence in their fields
- **Version Control**: Track how arguments evolve over time
- **Statistical Analysis**: Confidence intervals based on agreement/disagreement variance

## 🏗️ Architecture

### Database Structure

Like a family tree for arguments:

```
beliefs (conclusions & arguments)
   ↓
relationships (support/oppose connections)
   ↓
scores (calculated from recursive algorithm)
   ↓
evidence (supporting documentation)
   ↓
votes (community evaluation)
```

**Key Tables:**
- `beliefs` - All conclusions and arguments
- `relationships` - Which arguments support/oppose which conclusions
- `scores` - Calculated scores (-100 to +100)
- `evidence` - Books, studies, data sources
- `votes` - Community evaluations
- `users` - Platform participants
- `interests` - What people care about (for conflict resolution)

### Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express
- **Database**: SQLite (easily upgradable to PostgreSQL/MySQL)
- **Algorithms**: Custom scoring and ReasonRank implementations

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- SQLite3

### Installation

```bash
# Clone the repository
git clone https://github.com/myklob/ideastockexchange.git
cd ideastockexchange

# Install dependencies
npm install

# Initialize the database
# Database will be created automatically on first run

# Start the server
npm start

# For development with auto-reload
npm run dev
```

### Access the Platform

Open your browser to:
```
http://localhost:3000
```

## 📊 How It Works

### The Basic Formula

**Simple Version:**
```
Score = (Reasons to Agree) - (Reasons to Disagree)
```

**Advanced Recursive Formula:**
```
Score = Σ[(A(n,i)/n) × L] − Σ[(D(n,j)/n) × L] / (Total Reasons)

Where:
- n = depth level (1, 2, 3...)
- A(n,i) = agreement reasons at depth n
- D(n,j) = disagreement reasons at depth n
- L = linkage score (how well argument supports conclusion)
```

### Example: WWII Decision

**Main Conclusion:** "The United States should have joined WWII"

**Reasons to Agree:**
1. Nazis were committing systematic genocide (+98 linkage)
2. Need to defend allied nations (+85 linkage)
3. Prevent Nazi territorial expansion (+88 linkage)

**Reasons to Disagree:**
1. Cost in American lives was too high (+75 linkage)
2. Economic burden on US economy (+60 linkage)

**Sub-arguments:**
- "Nazis were committing genocide" is itself supported by:
  - Historical evidence of Holocaust (+99)
  - Concentration camps documented (+99)

The algorithm recursively calculates scores, with each level contributing proportionally less.

## 🎓 Use Cases

### Political Decisions
"Should we raise the minimum wage?"
- Structured evaluation of economic impacts
- See strongest arguments on both sides
- Evidence-weighted conclusions

### Scientific Theories
"Is string theory correct?"
- Academic evidence systematically organized
- Quality of sources automatically weighted
- Cumulative knowledge building

### Personal Decisions
"Should I buy an electric car?"
- Community-contributed pros/cons
- Personalize weights based on your values
- See latest data without re-researching

### Conflict Resolution
"Israeli-Palestinian Conflict"
- Map shared vs. conflicting interests
- Objective criteria for resolution
- Opposing sides forced to acknowledge each other's points

## 📈 What Makes ISE Different

### vs. Chat Rooms
❌ Chat: Everything resets to ground zero each time
✅ ISE: Cumulative progress, builds on previous discussions

### vs. Thread Forums
❌ Forums: Chaos, anyone can change subject anytime
✅ ISE: Structured, arguments categorized into columns

### vs. News Media
❌ Media: Profit-driven narratives, "winners and losers"
✅ ISE: Direct communication, evidence-based evaluation

### vs. Social Media
❌ Social: Echo chambers, confirmation bias
✅ ISE: Must see both sides, opposing arguments visible

## 🧮 Algorithms

### ReasonRank
Inspired by Google's PageRank, but for ideas:
- Arguments that are supported by many strong arguments rank higher
- Recursive importance calculation
- Dampening factor prevents circular reasoning

### Linkage Scoring
Prevents irrelevant arguments:
- "Grass is green" has low linkage to "Legalize drugs"
- Community votes on relevance
- Weak linkages contribute less to final score

### Confidence Intervals
Based on:
- Number of reasons posted
- Variance in evaluations
- Quality distribution of evidence
- Expert vs. general population agreement

## 🤝 Contributing

We're building infrastructure for how humanity thinks. Contributions welcome!

### Areas for Contribution

1. **Content**: Add arguments to important issues
2. **Code**: Improve algorithms, UI/UX, features
3. **Research**: Academic validation of scoring methods
4. **Design**: Better visualizations of argument trees
5. **Documentation**: Tutorials, guides, examples

### Contribution Guidelines

```bash
# Fork the repository
# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes
# Commit with clear messages
git commit -m "Add amazing feature"

# Push to your fork
git push origin feature/amazing-feature

# Open a Pull Request
```

## 📚 Documentation

- [How the Idea Stock Exchange Works](index.html) - Comprehensive explanation
- [ISE Framework](docs/ISE-Framework.md) - Theoretical foundation
- [API Documentation](docs/API.md) - Backend API reference
- [Database Schema](schema.sql) - Complete data structure
- [Algorithm Details](docs/Algorithms.md) - Scoring and ranking math

## 🗺️ Roadmap

### Phase 1: Core Platform (Current)
- [x] Basic argument structure
- [x] Pro/Con columns
- [x] Scoring algorithm
- [x] Database schema
- [x] REST API
- [ ] User authentication
- [ ] Basic visualization

### Phase 2: Enhanced Features
- [ ] Advanced argument tree visualization
- [ ] Real-time collaboration
- [ ] Mobile responsive design
- [ ] Evidence verification system
- [ ] Expert credentialing

### Phase 3: Scale & Intelligence
- [ ] Machine learning for argument classification
- [ ] Natural language processing for duplicate detection
- [ ] Automated fact-checking integration
- [ ] Recommendation engine
- [ ] Cross-language support

### Phase 4: Integration & Impact
- [ ] Browser extensions
- [ ] Social media integration
- [ ] Educational partnerships
- [ ] Policy decision support tools
- [ ] Academic research collaboration

## 🌍 Vision for the Future

### The Ultimate Goal

> "If we aren't organized we can't disprove stupid argument once and for all. We have to disprove it every time that argument will ever be made. However if we create comprehensive list of all reasons to agree or disagree with conclusions, and we let people classify specific arguments, it creates situation where there is only ONE place for specific argument to live. When there's no duplication, we can finally organize information and kill bad information once and for all."

### What Success Looks Like

- **Usage**: Millions of people using platform for decision-making
- **Content**: Comprehensive mapping of humanity's arguments
- **Quality**: Evidence-based conclusions becoming the norm
- **Impact**: Better societal decisions through systematic evaluation

### Why This Matters

**We're Building Infrastructure for Human Reasoning**

- Google organized web pages
- Wikipedia organized facts
- **ISE organizes arguments** - the fundamental building blocks of decision-making

**Arguments Deserve Same Treatment as Scientific Knowledge**

- Science progresses because each generation builds on previous work
- Arguments should work the same way
- Stop starting from scratch
- Build cumulative reasoning

## 📖 Philosophical Foundation

### Core Principles

1. **One Page Per Topic**: No duplication, canonical location for each argument
2. **Evidence Over Opinion**: Quality matters as much as quantity
3. **Transparency**: See both sides, no hidden arguments
4. **Recursion**: Arguments all the way down to verifiable facts
5. **Collaboration**: Collective intelligence > individual reasoning

### Inspirations

**Ayn Rand:**
> "No concept man forms is valid unless he integrates it without contradiction into the total sum of his knowledge."

**Extended by Mike Laub:**
> "No concept you form is valid unless you integrate it without contradiction into the sum of **human** knowledge."

## 🐛 Known Issues

- Database initialization requires manual trigger on first run
- Scoring algorithm needs optimization for large argument trees (>1000 nodes)
- Mobile UI needs responsive improvements
- Search functionality is basic (no fuzzy matching yet)

## 📜 License

MIT License - see [LICENSE](LICENSE) file

## 👥 Team

**Created by:** Mike Laub
**Contributors:** [See Contributors](https://github.com/myklob/ideastockexchange/contributors)

## 📞 Contact

- **GitHub**: [https://github.com/myklob/ideastockexchange](https://github.com/myklob/ideastockexchange)
- **Issues**: [Report a bug or request a feature](https://github.com/myklob/ideastockexchange/issues)
- **Discussions**:
  - [Good Idea Promoting Algorithm](http://groups.google.com/group/Good-Idea-Promoting-Algorithm)
  - [Idea Stock Exchange](http://groups.google.com/group/Idea-Stock-Exchange)

## 🙏 Acknowledgments

- Benjamin Franklin & Thomas Jefferson for pro/con methodology
- "Getting to Yes" by Fisher & Ury for conflict resolution framework
- Google's PageRank for algorithmic inspiration
- Wikipedia for demonstrating collaborative knowledge building
- All contributors and supporters of this vision

---

<p align="center">
  <strong>This is not just another website.</strong><br>
  <strong>This is an attempt to organize how humanity thinks.</strong>
</p>

<p align="center">
  <em>The template provides the structure. Your contributions provide the content.<br>
  Together, we build humanity's knowledge infrastructure for better decisions.</em>
</p>
# Idea Stock Exchange - Topic Page Generator

Automated system for generating structured topic pages using local LLM instances.

## Features

- 🤖 **Local LLM Integration** - Works with Ollama, LM Studio, or any OpenAI-compatible API
- 📊 **Automated Belief Analysis** - Categorizes beliefs into Purpose/Function/Form framework
- 🎯 **Smart Scoring** - Generates importance and engagement scores
- 🔄 **Batch Processing** - Process multiple topics at once
- 📝 **Template-Based** - Consistent HTML output following ISE framework
- 🛠️ **CLI Interface** - Easy command-line usage

## Quick Start

### Installation

```bash
pip install -r requirements.txt
```

4. Create environment configuration:
```bash
cp .env.example .env
```

5. Initialize the database:
```bash
python -c "from database import init_db; init_db()"
```

## Usage

### Starting the Server

Run the FastAPI server:
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload
```

The server will start on `http://localhost:8000`

### Accessing the Web Interface

Open your browser and navigate to:
```
http://localhost:8000/index.html
```

### API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Statements

- `POST /statements` - Create a new statement
- `GET /statements/{id}` - Get statement with similar statements
- `GET /statements/{id}/arguments` - Get arguments for a statement

### Arguments

- `POST /arguments` - Add an argument (reason to agree/disagree)

### Search

- `POST /search` - Search for similar statements

### Collection

- `POST /collect` - Collect statements from a URL

### Clustering

- `POST /cluster` - Auto-cluster similar statements

### Statistics

- `GET /stats` - Get system statistics

## Examples

### Adding a Statement via API

```bash
curl -X POST "http://localhost:8000/statements" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Climate change is the greatest threat to humanity",
    "author": "John Doe",
    "platform": "twitter"
  }'
```

### Searching for Similar Statements

```bash
curl -X POST "http://localhost:8000/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Global warming is dangerous",
    "limit": 10
  }'
```

### Adding an Argument

```bash
curl -X POST "http://localhost:8000/arguments" \
  -H "Content-Type: application/json" \
  -d '{
    "statement_id": 1,
    "text": "Scientific consensus supports this view",
    "argument_type": "agree"
  }'
```

### Collecting from a URL

```bash
curl -X POST "http://localhost:8000/collect" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/article",
    "source_type": "blog"
  }'
```

## Python Usage

### Using the Service Layer

```python
from database import SessionLocal, init_db
from services import StatementService

# Initialize database
init_db()

# Create a session
db = SessionLocal()

# Create service
service = StatementService(db)

# Add a statement
statement = service.add_statement(
    text="Renewable energy is the future",
    author="Jane Smith",
    platform="blog"
)

# Search for similar statements
results = service.search_statements("Solar power is important", limit=5)

# Add an argument
argument = service.add_argument(
    statement_id=statement.id,
    argument_text="Solar costs have dropped 90% in 10 years",
    argument_type="agree"
)

# Get statement with similar statements
full_statement = service.get_statement_with_similar(statement.id)
print(full_statement)
```

### Using the Scraper

```python
import asyncio
from scraper import StatementAggregator

async def collect_statements():
    aggregator = StatementAggregator()

    # Collect from a single URL
    result = await aggregator.collect_from_url(
        "https://example.com/article",
        source_type="blog"
    )

    print(f"Collected {len(result['statements'])} statements")

    # Collect from multiple URLs
    urls = [
        "https://example.com/post1",
        "https://example.com/post2"
    ]

    results = await aggregator.collect_from_urls(urls)

    for result in results:
        print(f"URL: {result['metadata']['url']}")
        print(f"Statements: {len(result['statements'])}")

# Run the async function
asyncio.run(collect_statements())
```

## Configuration

Edit `.env` file to configure:

- `DATABASE_URL`: Database connection string (default: SQLite)
- `EMBEDDING_MODEL`: Sentence transformer model (default: all-MiniLM-L6-v2)
- `SIMILARITY_THRESHOLD`: Minimum similarity score for linking (default: 0.75)
- `MAX_SIMILAR_STATEMENTS`: Maximum similar statements to show (default: 10)

## Database Schema

### Tables

- **statements**: Core statement data with embeddings
- **arguments**: Reasons to agree/disagree with statements
- **similar_statements**: Links between similar statements with scores
- **statement_clusters**: Groups of similar statements
- **statement_cluster_members**: Membership in clusters

## How It Works

1. **Statement Collection**: When a statement is added (manually or via scraping):
   - Text is normalized (lowercase, whitespace cleanup, etc.)
   - Semantic embedding is generated using sentence transformers
   - Statement is stored in the database

2. **Similarity Detection**: Automatically for each new statement:
   - Compare embedding with all existing statements
   - Calculate cosine similarity scores
   - Link statements above the similarity threshold
   - Create bidirectional links in the database

3. **Argument Tracking**: Arguments can be added to any statement:
   - Classified as "agree" or "disagree"
   - Linked to source statement
   - Can include author and source URL

4. **Clustering**: Statements can be grouped:
   - Automatic clustering based on similarity
   - Representative statement selected for each cluster
   - Useful for finding consensus or common themes

5. **Search**: Semantic search for statements:
   - Query is converted to embedding
   - Compared against all statements
   - Returns ranked results by similarity

## Performance Considerations

- **Embedding Generation**: First run downloads the model (~90MB)
- **Similarity Calculation**: O(n) for each new statement where n = existing statements
- **Database**: SQLite is sufficient for < 100k statements; use PostgreSQL for larger scales
- **Caching**: Embeddings are cached in the database to avoid recomputation

## Future Enhancements

- [ ] Twitter/X API integration
- [ ] Reddit API integration
- [ ] Real-time statement monitoring
- [ ] User accounts and permissions
- [ ] Voting system for argument strength
- [ ] Advanced clustering with hierarchical organization
- [ ] Export to various formats (CSV, JSON, etc.)
- [ ] Visualizations of statement networks
- [ ] Multi-language support
- [ ] Fact-checking integration

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

MIT License - feel free to use this for any purpose.

## Ethical Considerations

This tool is designed for:
- Research and analysis
- Understanding public discourse
- Aggregating diverse perspectives
- Identifying consensus and disagreement

Please use responsibly:
- Respect website terms of service
- Follow robots.txt
- Rate limit your requests
- Attribute sources appropriately
- Consider privacy implications
- Don't use for harassment or manipulation

## Support

For questions or issues, please open a GitHub issue.
### Configuration

Create a `config.yaml` file:

```yaml
llm:
  provider: "ollama"  # Options: ollama, lmstudio, openai-compatible
  model: "llama3"
  api_base: "http://localhost:11434"
  temperature: 0.7

output:
  directory: "topics"
  base_url: "/w/page"
```

### Usage

#### Generate a single topic page:

```bash
python -m src.cli generate --topic "Universal Healthcare" --input examples/healthcare.json
```

#### Generate from a text description:

```bash
python -m src.cli generate --topic "Climate Change" --description "Should we implement a carbon tax?"
```

#### Batch process multiple topics:

```bash
python -m src.cli batch --input examples/topics_batch.json
```

#### Update an existing topic:

```bash
python -m src.cli update --topic "Universal Healthcare" --add-belief "New perspective on costs"
```

## Input Format

### JSON Input Example:

```json
{
  "topic_name": "Universal Healthcare",
  "raw_beliefs": [
    {
      "text": "Healthcare is a human right and should be accessible to all",
      "source": "User submission"
    },
    {
      "text": "Government-run healthcare is inefficient and costly",
      "source": "Economic analysis"
    }
  ],
  "related_topics": {
    "general": ["Healthcare Policy"],
    "specific": ["Single Payer", "Public Option"],
    "related": ["Medical Costs", "Insurance Reform"]
  }
}
```

## How It Works

1. **Input Processing** - Accepts raw beliefs, arguments, and topic information
2. **LLM Analysis** - Uses local LLM to:
   - Categorize beliefs into Purpose/Function/Form framework
   - Identify sub-topics (Moral Ends, Effectiveness, etc.)
   - Generate importance and engagement scores
   - Analyze relationships between topics
3. **Template Population** - Fills HTML template with structured data
4. **Output Generation** - Creates formatted topic page

## Architecture

```
Input → LLM Client → Belief Analyzer → Scorer → Template Engine → HTML Output
```

## Supported LLM Providers

- **Ollama** - Recommended for local use
- **LM Studio** - Alternative local option
- **OpenAI-compatible APIs** - Any service with OpenAI-style endpoints

## Project Structure

```
├── src/
│   ├── cli.py              # Command-line interface
│   ├── generator.py        # Main topic page generator
│   ├── llm_client.py       # LLM provider integration
│   ├── belief_analyzer.py  # Categorizes beliefs
│   ├── scorer.py           # Calculates scores
│   └── template_engine.py  # HTML generation
├── templates/
│   └── topic-template.html # ISE framework template
├── topics/                  # Generated pages
├── examples/               # Sample inputs
└── docs/                   # Documentation
```

## Contributing

See CONTRIBUTING.md for guidelines on adding new features or improving the analyzer.

## License

MIT License - see LICENSE file
# 🧠 Idea Stock Exchange: The Truth Marketplace

> **A crowdsourced reasoning engine where ideas are scored like stocks, truth is transparent, and evidence determines value.**

The **Idea Stock Exchange (ISE)** is an open-source platform that treats every belief, argument, and piece of evidence as a trackable object with its own truth score—creating a transparent marketplace of ideas ranked by evidence, logic, and importance.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🎯 **Core Concept**

The ISE is more than a debate platform—it's a **dynamic knowledge evaluation system** where:

- Every **belief**, **argument**, **piece of evidence**, and **media item** is a *trackable object* with its own truth score
- Users **contribute**, **challenge**, and **link** these objects through structured reasoning
- The system dynamically updates each item's **score** based on pro/con performance and evidence quality
- The entire ecosystem becomes a transparent **marketplace of ideas** ranked by truth, evidence, and importance

Think of it as:
- **Wikipedia's structure** for organizing knowledge
- **StackOverflow's reputation system** for quality control
- **Prediction market dynamics** for truth discovery
- **GitHub's transparency** for open collaboration
- **Academic peer review** for verification
- **Social network scale** for broad participation

---

## 💰 **Revenue-Generating Features** 

The Idea Stock Exchange implements **six complementary revenue models** that align profit incentives with quality discourse:

1. **$ Advertising** - The internet is biased and trying to sell you something. You don't need to go to a bunch of different pages: you need quality, and an internet that doesn't promote AI slop or search-engine-optimized advertising campaigns. You need quality that is built from the ground up, that promotes the strongest beliefs by ranking and sorting pro/con arguments for whatever decision you need to make. 
2. **💳 Subscription Tiers** - Free/Premium/Enterprise plans with progressive features
3. **📈 Virtual Currency Investing** - Bet on beliefs like stocks (idea investing)
4. **🎮 Gamification** - Character stats derived from contribution quality
5. **❤️ Matching Services** - Dating/networking based on belief compatibility
6. **🔌 API Access** - Tiered rate limits for institutions and developers

**Key Innovation**: Users profit by finding undervalued beliefs and adding quality evidence—**aligning financial incentives with truth-seeking**.

**📖 Full Documentation**: See [MONETIZATION.md](./MONETIZATION.md) for complete API documentation and integration guide.

**Quick Start**:
```bash
npm run init-monetization  # Initialize achievements and subscriptions
```

---

## 📊 **The Conclusion Score (CS)**

At the heart of ISE is the **Conclusion Score**—a quantitative metric that evaluates the strength and validity of beliefs by analyzing arguments and evidence across **six dimensions**:

### **Component Summary**

| Component                      | Abbreviation | Description                                                               | Status |
| ------------------------------ | ------------ | ------------------------------------------------------------------------- | ------ |
| **Reasons to Agree/Disagree**  | RtA/RtD      | Strength and number of arguments supporting or opposing a conclusion      | ✅ Implemented |
| **Evidence Strength**          | ES           | Evaluates the reliability and relevance of supporting/disputing evidence  | ✅ Implemented |
| **Logical Coherence**          | LC           | Assesses logical structuring and the absence of fallacies in arguments    | ✅ Implemented |
| **Verification and Credibility** | VC         | Measures evidence credibility based on unbiased, independent sources      | ✅ Implemented |
| **Linkage and Relevance**      | LR           | Evaluates the argument's direct influence on the conclusion               | ✅ Implemented |
| **Uniqueness and Distinctiveness** | UD       | Recognizes originality, reducing redundancy in argumentation              | ✅ Implemented |
| **Argument Importance**        | AI           | Weighs the significance of an argument's impact on the conclusion         | ✅ Implemented |

### **Formula**

```
CS = Σ((RtA - RtD) × ES × LC × VC × LR × UD × AI)
```

This **algorithmic approach** ensures that well-supported, logically coherent, and unique arguments receive higher scores, promoting **informed decision-making**.

### **Example Calculation**

Assessing a policy's **CS** with:
- **RtA**: Scores of 4 and 3
- **RtD**: Score of 2
- **ES, LC, VC, LR, UD, AI**: Average weighted values of **0.8, 0.9, 1.0, 0.85, 0.9, and 0.95** respectively

```
CS = ((4 + 3 - 2) × 0.8 × 0.9 × 1.0 × 0.85 × 0.9 × 0.95) = 3.26
```

---

## 🔍 **Core Data Models**

| **Entity**                     | **Description**                                                                         | **Status** |
| ------------------------------ | --------------------------------------------------------------------------------------- | ---------- |
| **Belief**                     | A claim about reality, policy, or ethics (e.g., "Raising minimum wage reduces poverty") | ✅ Implemented |
| **Argument (Pro/Con)**         | Logical reasoning supporting or opposing a Belief                                       | ✅ Implemented |
| **Evidence**                   | Data, study, quote, or reference used to support an Argument                            | ✅ Implemented |
| **User**                       | Participant contributing arguments, evidence, or ratings                                | ✅ Implemented |
| **Media**                      | Film, book, podcast, article, meme that influences beliefs                              | 🔄 Planned (Phase 4) |
| **CBO (Chief Belief Officer)** | User with greatest score-changing contributions for a Belief (receives ad revenue share) | 🔄 Planned (Phase 3) |
| **Community/Topic Page**       | Group of related beliefs (e.g., "Climate Change", "Free Speech")                        | 🔄 Planned (Phase 2) |

---

## 🧮 **Advanced Algorithms**

### **1. ReasonRank / ArgumentRank** ✅ Implemented

**ReasonRank** is an adaptation of Google's **PageRank** algorithm to evaluate reasons based on the number and relative strength of pro/con reasons, factoring in sub-arguments.

```javascript
// ArgumentRank Implementation (JavaScript)
function argumentrank(M, num_iterations = 100, d = 0.85) {
  const N = M.length;
  let v = new Array(N).fill(1 / N);

  for (let i = 0; i < num_iterations; i++) {
    const newV = new Array(N).fill(0);

    for (let j = 0; j < N; j++) {
      let sum = 0;
      for (let k = 0; k < N; k++) {
        sum += M[k][j] * v[k];
      }
      newV[j] = d * sum + (1 - d) / N;
    }

    // Prevent negative scores and normalize
    v = newV.map(val => Math.max(0, val));
    const total = v.reduce((a, b) => a + b, 0);
    v = v.map(val => val / total);
  }

  return v;
}
```

### **2. Logical Fallacy Detection** ✅ Implemented

Automatically detects **10 types of logical fallacies**:
- Ad Hominem
- Straw Man
- False Dichotomy
- Appeal to Authority
- Slippery Slope
- Circular Reasoning
- Hasty Generalization
- Red Herring
- Appeal to Emotion
- Tu Quoque

Each fallacy is detected using pattern matching and reduces the **Logical Coherence (LC)** score.

### **3. Redundancy Detection** ✅ Implemented

Uses **4 similarity algorithms** to identify duplicate arguments:
1. Levenshtein distance
2. Jaccard similarity
3. TF-IDF + Cosine similarity
4. N-gram analysis

Redundant arguments have reduced **Uniqueness (UD)** scores.

### **4. Evidence Verification** ✅ Implemented

Crowdsourced credibility scoring where:
- Multiple users can verify or dispute evidence
- Credibility score = `50 + (verifiedCount × 10) - (disputedCount × 10)`
- Supports scholarly metadata: DOI, ISBN, PMID, citation count

### **5. Epistemic Impact** 🔄 Planned (Phase 2)

```
Epistemic Impact = Truth Score × Reach (Audience Size) × Linkage Strength
```

Used for ranking **media** and **arguments** by their total influence on collective reasoning.

### **6. Truth Score** 🔄 Planned (Phase 2)

```
Truth Score = (Logical Validity × Evidence Quality × Verification Level) ± Counterargument Weight
```

Bounded between -1 (false) and +1 (true).

### **7. Importance Score** 🔄 Planned (Phase 2)

Separate from truth—measures the **real-world consequence** of a belief based on cost-benefit, ethical significance, and policy impact.

---

## 🎨 **User Interaction Features**

### ✅ **Currently Implemented**

#### **Belief Pages**
- Single, permanent page for each belief
- Dynamic Conclusion Score display
- Tabbed view for Supporting/Opposing/All arguments
- Hierarchical argument trees
- Related beliefs sidebar
- View tracking

#### **Argument Builder**
- Visual type selector (Supporting/Opposing)
- Rich textarea with character counter (10-2000 chars)
- Real-time validation
- Quality guidelines
- Sub-argument support

#### **Evidence Submission**
- 8 evidence types: study, article, book, video, image, data, expert-opinion, other
- Source fields: URL, author, publication, date
- Scholarly metadata: DOI, ISBN, PMID, citations
- Tag system

#### **Voting Panel**
- Upvote/downvote on arguments
- Optimistic UI updates
- Vote tracking per user (prevents double voting)

#### **Score Breakdown**
- Comprehensive dashboard showing all 6 score components
- Progress bars with tooltips
- Formula display
- Real-time updates

### 🔄 **Planned Features**

#### **Phase 2: Advanced Scoring**
- Linkage network visualization
- Importance vs Truth scatter plots
- Belief evolution timeline
- Epistemic impact calculations

#### **Phase 3: Incentives & Governance**
- **CBO Dashboard**: Track influence, payout, and contribution history
- Ad revenue sharing (5% to top contributor per belief)
- Reputation-based voting weights
- Peer review layer for challenges

#### **Phase 4: Media Integration**
- Database of films, books, articles, podcasts
- Media Truth Score calculation
- Cultural impact tracking
- Automated indexing from media APIs (IMDb, Goodreads, etc.)

#### **Phase 5: AI Tools**
- Automated claim extraction from texts
- Argument suggestion engine
- Evidence summarizer
- Debate companion / coach
- Misinformation detector

#### **Phase 6: Community Features**
- Policy Simulator (rank proposals by truth + importance + cost-benefit)
- Educational Mode (classroom integration)
- Global Alignment Map (cultural differences in truth perception)
- Notifications and real-time updates

---

## 🛠️ **Technology Stack**

### **Backend**
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB + Mongoose ORM
- **Authentication**: JWT + bcrypt
- **Algorithms**: Custom JavaScript implementations for ArgumentRank, Fallacy Detection, Redundancy Detection

### **Frontend**
- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: Context API

### **Planned Additions**
- **Graph Database**: Neo4j for linkage mapping
- **Real-time**: WebSocket (Socket.io)
- **Caching**: Redis
- **Analytics**: Custom dashboard
- **Testing**: Jest + React Testing Library
- **API**: GraphQL endpoints

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 16+ and npm
- MongoDB 5+ (running locally or via MongoDB Atlas)
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/myklob/ideastockexchange.git
   cd ideastockexchange
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**

   Create `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ideastockexchange
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   NODE_ENV=development
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

6. **Run the application**

   Terminal 1 (Backend):
   ```bash
   cd backend
   npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

7. **Open your browser**

   Navigate to `http://localhost:5173`

---

## 📂 **Project Structure**

```
ideastockexchange/
├── backend/
│   ├── models/              # MongoDB schemas (User, Belief, Argument, Evidence)
│   ├── routes/              # API endpoints
│   ├── controllers/         # Business logic
│   ├── middleware/          # Authentication middleware
│   ├── utils/               # Algorithms (fallacy/redundancy detection)
│   ├── config/              # Database connection
│   └── server.js            # Main server + ArgumentRank algorithm
├── frontend/
│   └── src/
│       ├── pages/           # Main views (BeliefsList, BeliefDetails, AddArgument)
│       ├── components/      # Reusable UI components
│       ├── context/         # Auth state management
│       └── services/        # API layer
└── docs/                    # Documentation (coming soon)
```

---

## 🗺️ **Development Roadmap**

| **Phase**   | **Focus**                    | **Deliverables**                                                            | **Status** |
| ----------- | ---------------------------- | --------------------------------------------------------------------------- | ---------- |
| **Phase 1** | MVP Core                     | Belief pages, arguments, evidence submission, basic scoring                 | ✅ **90% Complete** |
| **Phase 2** | Advanced Scoring             | Linkage, importance, epistemic impact, visualization                        | 🔄 In Planning |
| **Phase 3** | Incentives                   | CBO system, ad revenue share, reputation weighting                          | 🔄 In Planning |
| **Phase 4** | Media Integration            | Media truth scores, cultural impact tracking                                | 🔄 In Planning |
| **Phase 5** | AI Tools                     | Argument suggestion, claim extraction, auto-verification                    | 🔄 In Planning |
| **Phase 6** | Governance                   | Peer review, moderation, version transparency                               | 🔄 In Planning |
| **Phase 7** | Global Expansion             | Multilingual support, institutional partnerships                            | 🔄 In Planning |

---

## 📈 **Current Features (Phase 1 - 90% Complete)**

### ✅ **Fully Functional**
- User authentication (register, login, JWT)
- Create/edit/delete beliefs
- Create/edit/delete arguments (supporting/opposing)
- Submit evidence with scholarly metadata
- Vote on arguments (up/down)
- View tracking and statistics
- Search and filter beliefs by category, status, score
- Hierarchical argument trees
- Comprehensive score breakdowns (6 components)
- **Fallacy Detection**: Automated logical fallacy identification
- **Redundancy Detection**: Duplicate argument identification
- **ReasonRank Algorithm**: PageRank-inspired scoring
- **Conclusion Score**: Multi-factor belief scoring
- **Evidence Verification**: Crowdsourced credibility scoring
- **Related Beliefs**: Linkage with relationship types

### ⚠️ **Partially Implemented**
- Evidence display in arguments (API exists, UI integration pending)
- Sub-argument creation (model supports, UI missing)
- Belief editing (route exists, full integration pending)
- Full analysis endpoints (powerful APIs exist, frontend doesn't use yet)

### 🔄 **Coming Soon (Phase 1 Completion)**
- Automated tests (unit + integration)
- API documentation (Swagger/OpenAPI)
- Rate limiting
- Email verification
- Password reset flow

---

## 🤝 **Contributing**

We welcome contributions! The ISE is a community-driven project.

### **How to Contribute**

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to branch** (`git push origin feature/AmazingFeature`)
5. **Open a pull request**

### **Contribution Areas**

- **Core Features**: Implement Phase 2-7 features
- **Algorithms**: Improve scoring, fallacy detection, redundancy detection
- **UI/UX**: Enhance components, add visualizations
- **Testing**: Write unit and integration tests
- **Documentation**: Improve guides, add tutorials
- **Bug Fixes**: Report and fix issues

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📜 **License**

This project is licensed under the **MIT License** – promoting openness and collaborative development.

See [LICENSE](LICENSE) for details.

---

## 📞 **Contact & Community**

- **GitHub**: [@myklob](https://github.com/myklob)
- **Twitter**: [@myclob](https://twitter.com/myclob)
- **Blog**: [myclob.blogspot.com](https://myclob.blogspot.com/)
- **Official Website**: [ideastockexchange.org](https://ideastockexchange.org/) *(coming soon)*

---

## 🙏 **Acknowledgements**

A huge thank you to all contributors and supporters of the **Idea Stock Exchange**. Your dedication to fostering **evidence-based discourse** is invaluable.

Special thanks to:
- The open-source community for foundational tools
- Academic researchers advancing computational argumentation
- Early testers and feedback providers

---

## 🌟 **Vision Statement**

> **The Idea Stock Exchange is more than just a platform—it's a movement toward transparent, logical, and evidence-based discussions. We're building the world's first living, open-source system for evaluating truth and importance—where ideas are scored, evidence is tracked, and influence is transparent.**

### **Join Us in Building a More Rational World**

Every argument you add, every fallacy you catch, every piece of evidence you verify—contributes to humanity's collective understanding of truth. Together, we can create a marketplace where good ideas rise and weak arguments fall, based on logic and evidence rather than rhetoric and popularity.

**Start contributing today!** 🚀

---

## 📚 **Additional Resources**

- [Architecture Documentation](docs/ARCHITECTURE.md) - Deep dive into system design
- [API Reference](docs/API.md) - Complete API documentation *(coming soon)*
- [Algorithm Explanations](docs/ALGORITHMS.md) - How scoring works *(coming soon)*
- [User Guide](docs/USER_GUIDE.md) - How to use the platform *(coming soon)*
- [Developer Guide](docs/DEVELOPER_GUIDE.md) - Setup and development workflow *(coming soon)*

---

**Built with ❤️ by the ISE community** | **Star ⭐ this repo to support the project!**
