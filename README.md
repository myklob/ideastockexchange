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
