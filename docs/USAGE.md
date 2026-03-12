# Usage Guide

## Getting Started

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up Your Local LLM

Choose one of these options:

#### Option A: Ollama (Recommended)

```bash
# Install Ollama from https://ollama.ai
# Then pull a model
ollama pull llama3
ollama serve
```

#### Option B: LM Studio

1. Download LM Studio from https://lmstudio.ai
2. Download a model (e.g., Llama 3, Mistral)
3. Start the local server on port 1234
4. Update `config.yaml`:
   ```yaml
   llm:
     provider: "lmstudio"
     api_base: "http://localhost:1234/v1"
   ```

#### Option C: OpenAI-Compatible API

For any OpenAI-compatible endpoint:

```yaml
llm:
  provider: "openai-compatible"
  api_base: "http://your-endpoint:port"
  model: "your-model-name"
```

### 3. Test Connection

```bash
python -m src.cli test
```

## Basic Usage

### Generate a Single Topic

#### From a JSON file:

```bash
python -m src.cli generate --topic "Universal Healthcare" --input examples/healthcare.json
```

#### From a description:

```bash
python -m src.cli generate \
  --topic "Gun Control" \
  --description "Some people believe stricter gun laws reduce violence, while others argue they violate the Second Amendment and don't address root causes."
```

### Batch Generate Multiple Topics

```bash
python -m src.cli batch --input examples/batch_topics.json
```

### Update an Existing Topic

```bash
python -m src.cli update --topic "Universal Healthcare" --add-belief "New perspective on rural healthcare access"
```

## Input Format

### JSON Structure

```json
{
  "topic_name": "Your Topic Name",
  "raw_beliefs": [
    {
      "text": "First belief or argument",
      "source": "Where this comes from (optional)"
    },
    {
      "text": "Second belief or argument",
      "source": "Another source"
    }
  ],
  "related_topics": {
    "general": ["Broader topics"],
    "specific": ["More specific sub-topics"],
    "related": ["Related parallel topics"]
  },
  "context": {
    "any_key": "Any additional context you want to provide"
  }
}
```

### Batch Format

For batch processing, wrap multiple topics in an array:

```json
[
  { "topic_name": "Topic 1", "raw_beliefs": [...] },
  { "topic_name": "Topic 2", "raw_beliefs": [...] }
]
```

## Output

Generated HTML files are saved to the `topics/` directory (configurable in `config.yaml`).

Each file is named using a slugified version of the topic name:
- "Universal Healthcare" → `universal-healthcare.html`
- "Climate Change Policy" → `climate-change-policy.html`

## Advanced Configuration

### Customize the Template

Edit `templates/topic-template.html` to change the layout or styling of generated pages.

The template uses Jinja2 syntax. Available variables:

- `{{ topic_name }}`
- `{{ importance_score }}`
- `{{ engagement_score }}`
- `{{ purpose.moral_ends.belief }}`
- `{{ purpose.moral_ends.score }}`
- etc.

### Adjust LLM Parameters

In `config.yaml`:

```yaml
llm:
  temperature: 0.7    # Lower = more focused, higher = more creative
  max_tokens: 2000    # Maximum response length
```

### Change Output Directory

```yaml
output:
  directory: "my-topics"  # Custom output folder
  base_url: "/custom/path"  # Custom URL base for links
```

## Troubleshooting

### "Connection failed" Error

1. **Check if LLM server is running**
   - Ollama: `ollama serve` should be running
   - LM Studio: Local server should be started

2. **Verify the API base URL**
   ```bash
   # For Ollama
   curl http://localhost:11434/api/generate -d '{"model":"llama3","prompt":"hi"}'

   # For LM Studio
   curl http://localhost:1234/v1/models
   ```

3. **Check the model name**
   ```bash
   # List available Ollama models
   ollama list
   ```

### "Could not parse JSON" Error

The LLM response wasn't valid JSON. Try:

1. Lowering the temperature (makes responses more structured)
2. Using a different model
3. Adding more context to your prompt

### Slow Generation

- Use a smaller model (e.g., `llama3:8b` instead of `llama3:70b`)
- Reduce `max_tokens` in config
- Use a GPU-accelerated setup for Ollama/LM Studio

## Tips for Best Results

1. **Provide 5-10 diverse beliefs** for each topic - more perspectives = better analysis
2. **Include both pro and con arguments** to get balanced output
3. **Be specific with topic names** - "Universal Healthcare in the US" is better than just "Healthcare"
4. **Add context** - the `context` field helps the LLM understand the topic better
5. **Review and iterate** - generated pages can be updated with new beliefs as you refine

## Example Workflow

```bash
# 1. Initialize project
python -m src.cli init

# 2. Test connection
python -m src.cli test

# 3. Create a custom input file
cat > my-topic.json <<EOF
{
  "topic_name": "Remote Work",
  "raw_beliefs": [
    {"text": "Remote work increases productivity and work-life balance"},
    {"text": "In-person collaboration is essential for innovation"},
    {"text": "Remote work reduces costs for both employers and employees"}
  ]
}
EOF

# 4. Generate the page
python -m src.cli generate --topic "Remote Work" --input my-topic.json

# 5. View the output
open topics/remote-work.html
```

## Next Steps

- See [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- See [EXAMPLES.md](EXAMPLES.md) for more examples
- Check [FAQ.md](FAQ.md) for common questions
