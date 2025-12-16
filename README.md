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
