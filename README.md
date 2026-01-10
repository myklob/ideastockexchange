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
