# Architecture

## System Overview

The Idea Stock Exchange Topic Page Generator is a modular system that uses local LLM instances to analyze beliefs and generate structured debate pages.

```
┌─────────────┐
│   Input     │
│  (JSON/Text)│
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  CLI Interface  │
│   (cli.py)      │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  Topic Generator     │
│  (generator.py)      │
│                      │
│  Orchestrates:       │
│  1. Belief Analysis  │
│  2. Scoring          │
│  3. Template Render  │
└─────────┬────────────┘
          │
    ┌─────┴─────┬───────────┬────────────┐
    ▼           ▼           ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐  ┌──────────┐
│  LLM   │  │ Belief │  │ Scorer │  │ Template │
│ Client │  │Analyzer│  │        │  │  Engine  │
└────────┘  └────────┘  └────────┘  └──────────┘
    │
    ▼
┌─────────────────────┐
│  Local LLM Provider │
│  (Ollama/LM Studio) │
└─────────────────────┘
```

## Components

### 1. LLM Client (`llm_client.py`)

**Purpose**: Unified interface for multiple LLM providers

**Key Features**:
- Supports Ollama, LM Studio, and OpenAI-compatible APIs
- Handles both text and JSON responses
- Automatic JSON extraction from markdown code blocks
- Connection testing

**Methods**:
- `generate(prompt, system_prompt)` - Generate text completion
- `generate_json(prompt, system_prompt)` - Generate structured JSON
- `test_connection()` - Verify LLM is accessible

### 2. Belief Analyzer (`belief_analyzer.py`)

**Purpose**: Categorize beliefs into ISE framework using LLM

**Framework Categories**:

```
Purpose (Goals & Values)
├── Moral Ends: What are the ethical goals?
├── Interests Served: Who benefits?
└── Values Alignment: What principles are involved?

Function (Performance & Results)
├── Ethical Means: Are the methods ethical?
├── Effectiveness: Does it achieve goals?
├── Efficiency: What's the cost/benefit?
└── Reliability: Is it consistent?

Form (Experience & Presentation)
├── Appeal: Is it attractive?
├── Order: Is it organized?
└── Harmony: Does it fit the context?

Neutral (Synthesis)
├── Synthesis: Reconciles both sides
├── Contextual: Depends on variables
└── Agnostic: Insufficient evidence
```

**Methods**:
- `analyze_beliefs(topic_name, raw_beliefs)` - Categorize all beliefs
- `categorize_single_belief(belief_text, topic)` - Categorize one belief
- `extract_importance_factors(topic, beliefs)` - Assess importance

### 3. Scorer (`scorer.py`)

**Purpose**: Calculate importance and engagement scores

**Importance Score** (0-100):
- Scale of impact (1-10)
- Number of people affected (1-10)
- Urgency/time sensitivity (1-10)
- Foundational value (1-10)
- Final score = average × 10

**Engagement Score** (0-100):
- Controversy level (1-10)
- Emotional resonance (1-10)
- Clarity of stakes (1-10)
- Accessibility (1-10)
- Final score = average × 10

**Belief Scores** (-100% to +100%):
- Positive: Supports the topic
- Negative: Opposes the topic
- Zero: Neutral perspective

### 4. Template Engine (`template_engine.py`)

**Purpose**: Render HTML pages using Jinja2

**Features**:
- Template validation
- URL slugification
- File management
- Custom Jinja2 filters

**Methods**:
- `render_topic_page(data)` - Render full page
- `validate_data(data)` - Check required fields
- `save_page(html, path)` - Write to file
- `slugify(text)` - Convert to URL-safe format

### 5. Topic Generator (`generator.py`)

**Purpose**: Main orchestrator that ties everything together

**Workflow**:

```
Input → Analyze Beliefs → Calculate Scores → Render Template → Save File
         (LLM)            (LLM)              (Jinja2)         (HTML)
```

**Methods**:
- `generate_from_input(data)` - Generate from structured JSON
- `generate_from_description(topic, desc)` - Generate from text
- `update_topic(topic, updates)` - Update existing page
- `batch_generate(file)` - Process multiple topics

### 6. CLI (`cli.py`)

**Purpose**: Command-line interface using Click

**Commands**:
- `init` - Initialize new project
- `test` - Test LLM connection
- `generate` - Generate single topic
- `batch` - Generate multiple topics
- `update` - Update existing topic

## Data Flow

### Example: Generating a Topic

```python
# 1. User provides input
input_data = {
    "topic_name": "Universal Healthcare",
    "raw_beliefs": [
        {"text": "Healthcare is a human right"},
        {"text": "Government healthcare is inefficient"}
    ]
}

# 2. Generator orchestrates the process
generator = TopicPageGenerator(config)
output_path = generator.generate_from_input(input_data)

# Internal flow:
# 2a. Belief Analyzer categorizes beliefs using LLM
beliefs = analyzer.analyze_beliefs(topic, raw_beliefs)
# Returns: {
#   "purpose": {"moral_ends": {"score": "+85%", "belief": "..."}},
#   "function": {...},
#   "form": {...}
# }

# 2b. Scorer calculates importance using LLM
importance = scorer.calculate_importance_score(topic, beliefs)
# Returns: 78 (out of 100)

# 2c. Scorer calculates engagement using LLM
engagement = scorer.calculate_engagement_score(topic, beliefs)
# Returns: 82 (out of 100)

# 2d. Template engine renders HTML
template_data = {
    "topic_name": topic,
    "importance_score": importance,
    "engagement_score": engagement,
    "purpose": beliefs["purpose"],
    # ... etc
}
html = template_engine.render_topic_page(template_data)

# 2e. Save to file
template_engine.save_page(html, "topics/universal-healthcare.html")
```

## LLM Interaction

### Prompt Engineering

The system uses carefully crafted prompts for each task:

**Belief Categorization**:
```
System: You are an expert at analyzing beliefs...
User: Topic: [topic]
      Beliefs: [list]
      Categorize into Purpose/Function/Form framework.
      Respond with JSON: {...}
```

**Importance Scoring**:
```
System: You calculate importance based on scale, reach, urgency...
User: Topic: [topic]
      Beliefs: [summary]
      Calculate score 0-100.
      Respond with JSON: {"total_score": X, ...}
```

### JSON Parsing Strategy

1. Try direct JSON parsing
2. If fails, look for markdown code blocks
3. Extract JSON from ```json ... ```
4. If still fails, provide error feedback

## Configuration

### config.yaml Structure

```yaml
llm:
  provider: "ollama|lmstudio|openai-compatible"
  model: "model-name"
  api_base: "http://localhost:port"
  temperature: 0.7
  max_tokens: 2000

output:
  directory: "topics"
  base_url: "/w/page"

template_dir: "templates"
```

## Extension Points

### Adding New LLM Providers

1. Update `LLMClient` class in `llm_client.py`
2. Add provider-specific initialization
3. Implement `_generate_[provider]` method

### Adding New Belief Categories

1. Update framework in `belief_analyzer.py`
2. Modify template in `templates/topic-template.html`
3. Update validation in `template_engine.py`

### Custom Scoring Algorithms

1. Extend `Scorer` class in `scorer.py`
2. Add new calculation methods
3. Update template data structure

## Performance Considerations

### LLM Calls

Each topic generation makes approximately:
- 3-4 LLM calls (belief analysis, importance, engagement)
- ~6000 tokens total (varies by model and input)
- 10-30 seconds total (depends on model size and hardware)

### Optimization Strategies

1. **Use smaller models** - llama3:8b vs llama3:70b
2. **Batch related queries** - Combine analysis where possible
3. **Cache results** - Store intermediate analysis
4. **Parallel processing** - Process multiple topics concurrently

### Resource Usage

- **RAM**: 4-16GB (depends on model size)
- **Disk**: Minimal (JSON + HTML output)
- **GPU**: Optional but recommended for speed

## Error Handling

### Strategy

1. **Graceful degradation** - Use defaults when LLM fails
2. **Detailed logging** - Show what went wrong
3. **Validation** - Check data before rendering
4. **Retry logic** - Could be added for transient failures

### Common Errors

- **Connection refused**: LLM server not running
- **JSON parse error**: LLM didn't return valid JSON
- **Missing fields**: Input data incomplete
- **Model not found**: Model not available in LLM

## Testing

### Manual Testing

```bash
# Test LLM connection
python -m src.cli test

# Test with example
python -m src.cli generate -t "Test" -i examples/healthcare.json

# Validate output
ls -la topics/
```

### Future: Automated Testing

Could add:
- Unit tests for each component
- Integration tests for full workflow
- Mock LLM for deterministic testing
- Output validation tests

## Security Considerations

1. **Local-only**: No data sent to external services
2. **Input sanitization**: Escape HTML in beliefs
3. **File system safety**: Validate paths before writing
4. **Resource limits**: Max tokens prevents runaway generation

## Future Enhancements

Potential additions:
- Web UI for easier use
- Database storage for topics
- Version control for topic changes
- Multi-language support
- Collaborative editing
- Export to multiple formats
- Integration with existing wiki platforms
