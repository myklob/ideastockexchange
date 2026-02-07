# Idea Stock Exchange - Distributed AI Framework

Generate interconnected argument analysis pages using AI. This framework creates comprehensive issue analyses with recursive argument trees, evidence evaluation, and value conflict mapping - all linked together like Wikipedia for arguments.

## Features

- **Multi-Provider AI Support**: Works with Ollama (local), LM Studio, OpenAI, and Anthropic
- **Distributed Processing**: Uses spare CPU/memory capacity for background task processing
- **Recursive Arguments**: Each argument can expand into its own analysis page
- **Linked Pages**: Arguments link to sub-arguments, creating a navigable knowledge graph
- **Comprehensive Analysis**: Generates evidence, values, assumptions, cost-benefit, and more
- **Multiple Output Formats**: HTML, Markdown, and JSON

## Quick Start

### Using the CLI

```bash
# Install dependencies
cd distributed-ai-framework
npm install

# Run with default Ollama
npx ts-node cli.ts analyze "Universal basic income would reduce poverty"

# Use OpenAI
AI_PROVIDER=openai AI_API_KEY=sk-xxx npx ts-node cli.ts analyze "Your thesis"

# Generate markdown instead of HTML
npx ts-node cli.ts analyze --format markdown "Your thesis"
```

### Programmatic Usage

```typescript
import { quickAnalysis } from './index';

// Quick one-liner
const { analysis, files } = await quickAnalysis(
  "Climate change is primarily caused by human activity",
  { provider: 'ollama', model: 'llama3' }
);

console.log(`Score: ${analysis.finalScore} (${analysis.scoreInterpretation})`);
console.log(`Generated ${files.length} pages`);
```

### Advanced Usage

```typescript
import {
  AIClient,
  AnalysisGenerator,
  PageGenerator,
  DistributedTaskQueue,
  BackgroundDaemon,
  createDefaultConfig
} from './index';

// Create custom configuration
const config = createDefaultConfig();
config.ai.provider = 'openai';
config.ai.model = 'gpt-4';
config.ai.apiKey = process.env.OPENAI_API_KEY;
config.output.format = 'html';
config.analysis.maxDepth = 3;

// Initialize components
const aiClient = new AIClient(config.ai);
const analysisGenerator = new AnalysisGenerator(aiClient, config);
const pageGenerator = new PageGenerator(config, analysisGenerator);

// Generate analysis
const analysis = await analysisGenerator.generateFullAnalysis(
  "ICE is a $29 Billion Mess That Needs Reform"
);

// Generate all pages with recursive expansion
const files = await pageGenerator.generateAllPages(analysis);

// Or use the distributed task queue for batch processing
const taskQueue = new DistributedTaskQueue(
  config, aiClient, analysisGenerator, pageGenerator
);

const daemon = new BackgroundDaemon(taskQueue);
daemon.start();

// Add multiple theses to analyze
taskQueue.addAnalysisTask("First thesis", 5);
taskQueue.addAnalysisTask("Second thesis", 5);
taskQueue.addAnalysisTask("Third thesis", 5);

// Wait for completion
await taskQueue.waitForCompletion();
daemon.stop();
```

## CLI Commands

```bash
# Analyze a thesis
ise-cli analyze "Your thesis statement"

# With options
ise-cli analyze --format markdown --output ./my-output --depth 3 "Thesis"

# Start background daemon
ise-cli daemon start

# Add tasks to queue
ise-cli queue add "First thesis"
ise-cli queue add "Second thesis"

# Check status
ise-cli status

# Interactive mode
ise-cli interactive

# Initialize config file
ise-cli init
```

## Configuration

Create `ise-config.yaml` in your project directory:

```yaml
ai:
  provider: "ollama"          # ollama, openai, anthropic, lmstudio
  model: "llama3"
  api_base: "http://localhost:11434"
  # api_key: "sk-..."         # For OpenAI/Anthropic
  temperature: 0.7
  max_tokens: 4000

output:
  format: "html"              # html, markdown, json
  directory: "./output"
  base_url: "/w/page"
  include_styles: true
  generate_index: true

analysis:
  max_depth: 2                # Recursion depth for argument expansion
  min_score_for_expansion: 50 # Min score to expand into own page
  generate_links: true
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_PROVIDER` | AI provider to use | `ollama` |
| `AI_API_BASE` | API endpoint URL | `http://localhost:11434` |
| `AI_MODEL` | Model name | `llama3` |
| `AI_API_KEY` | API key (OpenAI/Anthropic) | - |
| `OUTPUT_DIR` | Output directory | `./output` |
| `OUTPUT_FORMAT` | Output format | `html` |

## Output Structure

Generated analyses include:

1. **Argument Trees**: Pro/con arguments with scores and sub-arguments
2. **Evidence**: Supporting and weakening evidence with quality tiers (T1-T4)
3. **Objective Criteria**: Measurable criteria for evaluating the thesis
4. **Values Conflict**: Advertised vs actual values for each side
5. **Assumptions**: What you must believe to accept/reject the thesis
6. **Cost-Benefit**: Potential benefits and costs of the position
7. **Compromise Solutions**: Practical solutions addressing both sides
8. **Obstacles**: Primary obstacles to resolution
9. **Interests**: Stakeholder analysis and shared/conflicting interests
10. **Legal Framework**: Supporting and contradicting laws
11. **Belief Mapping**: General to specific belief relationships
12. **Biases**: Cognitive biases affecting each side
13. **Final Score**: Calculated validity score with interpretation

## Distributed Processing

The framework includes a task queue that:

- Monitors system resources (CPU, memory)
- Processes tasks only when spare capacity is available
- Persists queue state to disk
- Supports multiple workers
- Automatically retries failed tasks

```typescript
// Start background processing
const daemon = new BackgroundDaemon(taskQueue);
daemon.start();

// Tasks process automatically when resources available
taskQueue.addAnalysisTask("Thesis 1");
taskQueue.addAnalysisTask("Thesis 2");

// Check status
const status = taskQueue.getStatus();
console.log(`CPU: ${status.systemInfo.cpuUsage}%`);
console.log(`Pending: ${status.pending}, Completed: ${status.completed}`);
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! Please see the main [Idea Stock Exchange repository](https://github.com/myklob/ideastockexchange) for guidelines.
