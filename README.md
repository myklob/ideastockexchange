# Idea Stock Exchange - Belief Argument Scanner

An intelligent system that scans the internet for arguments, evidence, and examples related to beliefs and organizes them in a structured framework. The system generates comprehensive XML representations with full metadata, linkage analysis, and argument trees.

## Overview

This software automatically:
- **Searches** the internet for arguments, evidence, and examples related to any belief
- **Organizes** content in the Idea Stock Exchange framework
- **Populates** all sections of the standard belief template
- **Creates** linked supporting sub-arguments with full provenance
- **Generates** structured XML with unique IDs and complete metadata
- **Enriches** data with ISBNs, URLs, podcast IDs, and other metadata
- **Analyzes** linkages between claims and generates supporting arguments
- **Identifies** real-world violations and stress tests
- **Develops** structured proposals with full argument trees

## Features

### Core Capabilities
- Multi-source web search (Google, Bing, academic databases)
- LLM-powered argument extraction and analysis
- Automatic metadata enrichment (ISBN, DOI, podcast feeds, etc.)
- Linkage scoring and relationship mapping
- Stress test identification
- Proposal generation with full argument trees

### Data Structure
- Beliefs with unique IDs
- Reasons to agree/disagree with hierarchical structure
- Evidence items with full metadata
- Linkage arguments with scoring
- Media references with source tracking
- Related beliefs (upstream/downstream)

## Architecture

```
belief-scanner/
├── src/
│   ├── models/           # Data models (Belief, Reason, Evidence, etc.)
│   ├── search/           # Web search integrations
│   ├── extraction/       # Content extraction and NLP
│   ├── analysis/         # Argument analysis and linkage scoring
│   ├── enrichment/       # Metadata enrichment
│   ├── generation/       # XML generation
│   └── utils/            # Utilities and helpers
├── schemas/              # XML schemas
├── config/               # Configuration files
├── examples/             # Example beliefs and outputs
└── tests/                # Test suite
```

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd ideastockexchange

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up configuration
cp config/config.example.yaml config/config.yaml
# Edit config.yaml with your API keys
```

## Quick Start

```python
from src.scanner import BeliefScanner

# Initialize scanner
scanner = BeliefScanner()

# Scan a belief
belief = "Elected Officials Must Respect the Rule of Law and the Constitution"
result = scanner.scan_belief(
    belief=belief,
    max_sources=50,
    depth=3,  # How many levels of sub-arguments to explore
    enrich_metadata=True
)

# Generate XML
xml_output = result.to_xml()
with open("belief_output.xml", "w") as f:
    f.write(xml_output)
```

## Configuration

Configure API keys and settings in `config/config.yaml`:

```yaml
search:
  google_api_key: "your-key"
  google_cse_id: "your-cse-id"
  bing_api_key: "your-key"

llm:
  provider: "anthropic"  # or "openai"
  api_key: "your-key"
  model: "claude-sonnet-4-5"

enrichment:
  enable_isbn_lookup: true
  enable_doi_lookup: true
  enable_podcast_lookup: true

output:
  xml_schema_version: "1.0"
  validate_xml: true
```

## XML Schema

The generated XML follows this structure:

```xml
<belief id="belief-uuid">
  <title>Elected Officials Must Respect the Rule of Law</title>
  <description>...</description>

  <reasons-to-agree>
    <reason id="reason-uuid" linkage-score="0.85">
      <title>Constitutional stability protects democracy</title>
      <description>...</description>
      <sub-arguments>
        <linked-belief id="linked-belief-uuid">
          <linkage-argument>...</linkage-argument>
        </linked-belief>
      </sub-arguments>
      <evidence>
        <evidence-item id="evidence-uuid" type="book">
          <title>The Federalist Papers</title>
          <metadata>
            <isbn>978-0-486-29053-8</isbn>
            <authors>Alexander Hamilton, James Madison, John Jay</authors>
          </metadata>
        </evidence-item>
      </evidence>
    </reason>
  </reasons-to-agree>

  <reasons-to-disagree>...</reasons-to-disagree>

  <related-beliefs>
    <upstream>...</upstream>
    <downstream>...</downstream>
  </related-beliefs>

  <stress-tests>...</stress-tests>

  <proposals>...</proposals>
</belief>
```

## Usage Examples

### Basic Scanning
```python
scanner = BeliefScanner()
result = scanner.scan_belief("Democracy requires informed citizens")
```

### Advanced Configuration
```python
result = scanner.scan_belief(
    belief="Climate action requires international cooperation",
    search_sources=["google", "bing", "semantic_scholar"],
    max_sources_per_type=20,
    include_podcasts=True,
    include_books=True,
    include_academic=True,
    depth=5,
    generate_stress_tests=True,
    generate_proposals=True
)
```

### Linkage Analysis
```python
# Analyze specific linkage
linkage = result.analyze_linkage(
    premise="Constitutional frameworks prevent tyranny",
    conclusion="Elected officials must respect the Constitution"
)
print(f"Linkage score: {linkage.score}")
print(f"Justification: {linkage.justification}")
```

## Development

### Running Tests
```bash
pytest tests/
```

### Code Style
```bash
black src/
flake8 src/
mypy src/
```

## API Keys Required

To use all features, you'll need:
- **Google Custom Search API** - Web search
- **Bing Search API** - Additional web search
- **Anthropic API** or **OpenAI API** - LLM analysis
- **OpenLibrary API** - Book metadata (free)
- **CrossRef API** - DOI lookups (free)
- **iTunes API** - Podcast metadata (free)

## License

MIT License - see LICENSE file

## Contributing

Contributions welcome! Please see CONTRIBUTING.md

## Roadmap

- [ ] Multi-language support
- [ ] Real-time collaborative editing
- [ ] Web interface
- [ ] Graph visualization
- [ ] Export to multiple formats (JSON, RDF, GraphML)
- [ ] Integration with academic databases
- [ ] Argument quality scoring
- [ ] Fact-checking integration
- [ ] Bias detection
- [ ] Historical argument tracking

## Contact

For questions or support, please open an issue on GitHub.
