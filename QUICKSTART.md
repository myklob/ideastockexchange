# Quick Start Guide

Get started with the Idea Stock Exchange Belief Scanner in minutes!

## Installation

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Download spaCy language model (optional, for enhanced NLP)
python -m spacy download en_core_web_sm
```

### 2. Configure API Keys

Copy the example configuration:

```bash
cp config/config.example.yaml config/config.yaml
```

Edit `config/config.yaml` and add your API keys:

```yaml
search:
  google:
    api_key: "YOUR_GOOGLE_API_KEY"
    cse_id: "YOUR_CSE_ID"
  bing:
    api_key: "YOUR_BING_API_KEY"

llm:
  provider: "anthropic"  # or "openai"
  anthropic_api_key: "YOUR_ANTHROPIC_KEY"
  # or
  openai_api_key: "YOUR_OPENAI_KEY"
```

### 3. Test the Installation

```bash
# Check service status
belief-scanner status
```

## Basic Usage

### Command Line

Scan a belief from the command line:

```bash
belief-scanner scan "Democracy requires informed citizens" \
  --output output/democracy.xml \
  --max-sources 30 \
  --depth 3
```

### Python API

Use the scanner in your Python code:

```python
from src.scanner import BeliefScanner
import asyncio

async def main():
    scanner = BeliefScanner()

    result = await scanner.scan_belief(
        belief="Climate action requires international cooperation",
        max_sources=25,
        depth=2
    )

    # Save as XML
    scanner.save_xml(result, "output/climate.xml")

    # Or access the data directly
    print(f"Found {len(result.reasons_to_agree)} reasons to agree")

asyncio.run(main())
```

### Synchronous API

For simpler use cases:

```python
from src.scanner import scan_belief_sync

result = scan_belief_sync(
    belief="Democracy requires informed citizens",
    output_path="output/democracy.xml",
    max_sources=20
)

print(f"Scan complete! Found {len(result.evidence)} evidence items")
```

## Understanding the Output

The scanner generates structured XML with:

### 1. **Arguments**
- Reasons to agree with the belief
- Reasons to disagree
- Sub-arguments supporting each reason
- Linkage scores showing argument strength

### 2. **Evidence**
- Books (with ISBNs)
- Academic papers (with DOIs)
- Articles, videos, podcasts
- Enriched metadata (authors, dates, publishers)

### 3. **Linkage Analysis**
Each argument includes:
- **Linkage Score** (-1.0 to +1.0): How strongly it supports/opposes
- **Justification**: Why this score was assigned
- **Inference Rule**: The logical connection
- **Counterarguments**: Potential objections

### 4. **Stress Tests**
Real-world violations or challenges:
- Historical failures
- Edge cases
- Implementation challenges
- Severity scores

### 5. **Proposals**
Structured recommendations with:
- Full argument trees
- Implementation steps
- Expected outcomes
- Potential objections and responses

## Configuration Options

### Scanning Options

```yaml
scanning:
  max_sources: 50          # Maximum sources to search
  depth: 3                 # How deep to explore sub-arguments
  concurrency: 5           # Concurrent requests
  include_books: true      # Search for book references
  include_podcasts: true   # Search for podcast references
  include_academic: true   # Search academic sources
```

### LLM Options

```yaml
llm:
  model: "claude-sonnet-4-5"  # or "gpt-4", "gpt-4-turbo"
  temperature: 0.7             # Creativity level (0-1)
  max_tokens: 4096             # Maximum response length
```

### Analysis Options

```yaml
analysis:
  stress_tests:
    enabled: true
    min_severity: 0.3        # Minimum severity to include
    max_tests_per_belief: 10

  proposals:
    enabled: true
    max_proposals_per_belief: 5
    min_priority: 0.3
```

## Common Commands

### Search Only (No Full Scan)

```bash
belief-scanner search "Renewable energy is necessary" --max-sources 20
```

### Validate XML Output

```bash
belief-scanner validate output/belief.xml
```

### Check Service Status

```bash
belief-scanner status
```

## API Keys

### Required APIs

1. **Google Custom Search API** (optional but recommended)
   - Get key: https://developers.google.com/custom-search
   - Create CSE: https://cse.google.com/

2. **Bing Search API** (optional alternative)
   - Get key: https://www.microsoft.com/en-us/bing/apis/bing-web-search-api

3. **Anthropic API** OR **OpenAI API** (required for LLM)
   - Anthropic: https://www.anthropic.com/api
   - OpenAI: https://platform.openai.com/

### Free APIs (No Key Required)

These are used automatically:
- OpenLibrary API (book metadata)
- CrossRef API (DOI lookups)
- iTunes API (podcast metadata)

## Troubleshooting

### "No search providers available"

Configure at least one search provider (Google or Bing) in `config/config.yaml`.

### "LLM client not properly configured"

Add your Anthropic or OpenAI API key to `config/config.yaml`.

### Rate Limiting

If you encounter rate limits:
- Reduce `max_sources`
- Decrease `concurrency` in config
- Add delays between requests

### Memory Issues

For large scans:
- Reduce `depth` parameter
- Limit `max_sources`
- Process in batches

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [examples/](examples/) for more usage patterns
- Review the [XML Schema](schemas/belief_schema.xsd) to understand the data structure
- Explore the [API documentation](docs/API.md)

## Getting Help

- Check the logs in `logs/scanner.log`
- Run with `--verbose` flag for detailed output
- Review the configuration in `config/config.yaml`
- Open an issue on GitHub

Happy scanning! 🔍
