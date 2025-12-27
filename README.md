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
