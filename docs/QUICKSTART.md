# Quick Start Guide

Get up and running with Idea Stock Exchange in 5 minutes!

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Initialize database
python -c "from database import init_db; init_db()"
```

## Option 1: Run the Demo

See the system in action with example data:

```bash
python demo.py
```

This will:
- Create sample statements
- Show semantic similarity matching
- Demonstrate argument tracking
- Display clustering results

## Option 2: Use the CLI

### Add a statement

```bash
python cli.py add "Artificial intelligence will transform education" --author "John Doe" --platform "Twitter"
```

### Search for similar statements

```bash
python cli.py search "AI in schools"
```

### Add an argument

```bash
python cli.py argue 1 "AI tutors can provide personalized learning" --type agree --author "Jane Smith"
```

### View a statement with all details

```bash
python cli.py show 1
```

### Collect statements from a URL

```bash
python cli.py collect "https://example.com/article" --type blog --save
```

### View statistics

```bash
python cli.py stats
```

## Option 3: Use the Web Interface

### Start the server

```bash
python main.py
```

### Open in browser

Navigate to: http://localhost:8000/index.html

### Features

- Add statements manually
- Search for similar statements
- Collect from URLs
- Add arguments (agree/disagree)
- View real-time statistics

## Option 4: Use the API

### Start the server

```bash
python main.py
```

### View API docs

Navigate to: http://localhost:8000/docs

### Example API calls

Add a statement:
```bash
curl -X POST "http://localhost:8000/statements" \
  -H "Content-Type: application/json" \
  -d '{"text": "Your statement here", "author": "Author Name"}'
```

Search:
```bash
curl -X POST "http://localhost:8000/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "your search query", "limit": 10}'
```

## Next Steps

1. **Read the full README.md** for detailed documentation
2. **Explore the API** at http://localhost:8000/docs
3. **Customize settings** in `.env` file
4. **Integrate into your workflow** using the Python API

## Configuration

Edit `.env` file:

```env
SIMILARITY_THRESHOLD=0.75    # How similar statements need to be (0-1)
EMBEDDING_MODEL=all-MiniLM-L6-v2  # Sentence transformer model
MAX_SIMILAR_STATEMENTS=10    # Max similar statements to show
```

## Troubleshooting

### "Module not found" error
```bash
pip install -r requirements.txt
```

### Database errors
```bash
rm statements.db
python -c "from database import init_db; init_db()"
```

### Server won't start
Check if port 8000 is already in use:
```bash
lsof -i :8000
```

## Example Workflow

1. **Collect statements** from various sources:
   ```bash
   python cli.py collect "https://blog1.com/article" --save
   python cli.py collect "https://blog2.com/post" --save
   ```

2. **Auto-cluster** similar statements:
   ```bash
   python cli.py cluster
   ```

3. **Search** for specific topics:
   ```bash
   python cli.py search "climate change solutions"
   ```

4. **Add arguments** to interesting statements:
   ```bash
   python cli.py argue 5 "Supporting evidence here" --type agree
   ```

5. **View the full picture**:
   ```bash
   python cli.py show 5
   ```

## Tips

- Use **semantic search** - search by meaning, not just keywords
- **Similar statements** are automatically linked when added
- **Arguments** help track reasoning and debate
- **Clustering** reveals common themes across many statements
- **Lower similarity threshold** finds more matches (but less precise)
- **Higher similarity threshold** finds fewer but more precise matches

## Need Help?

- Full documentation: README.md
- API documentation: http://localhost:8000/docs
- GitHub issues: Report bugs and request features

Happy exploring!
