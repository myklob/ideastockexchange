#!/usr/bin/env node
/**
 * Distributed AI Framework - CLI Executable
 * Generate interconnected argument analysis pages using AI
 *
 * Usage:
 *   npx ts-node cli.ts analyze "Your thesis statement here"
 *   npx ts-node cli.ts daemon start
 *   npx ts-node cli.ts status
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { AIClient, createAIClient, createAIClientFromEnv } from './ai-client';
import { AnalysisGenerator } from './analysis-generator';
import { PageGenerator } from './page-generator';
import { DistributedTaskQueue, BackgroundDaemon } from './task-queue';
import { FrameworkConfig, AIProviderConfig, OutputConfig } from './types';

// Default configuration
const defaultConfig: FrameworkConfig = {
  ai: {
    provider: 'ollama',
    apiBase: 'http://localhost:11434',
    model: 'llama3',
    temperature: 0.7,
    maxTokens: 4000,
    timeout: 120000,
  },
  output: {
    format: 'html',
    outputDir: './output',
    baseUrl: '/w/page',
    linkPrefix: './',
    includeStyles: true,
    generateIndex: true,
  },
  queue: {
    maxConcurrentTasks: 2,
    taskTimeoutMs: 300000,
    retryAttempts: 3,
    priorityBoost: 1,
  },
  analysis: {
    maxDepth: 2,
    minScoreForExpansion: 50,
    evidenceTiers: ['T1', 'T2', 'T3', 'T4'],
    generateLinks: true,
  },
};

/**
 * Load configuration from file or environment
 */
function loadConfig(configPath?: string): FrameworkConfig {
  let config = { ...defaultConfig };

  // Try to load from config file
  const configFile = configPath || path.join(process.cwd(), 'ise-config.yaml');
  if (fs.existsSync(configFile)) {
    try {
      const yaml = require('js-yaml');
      const fileConfig = yaml.load(fs.readFileSync(configFile, 'utf-8'));
      config = mergeConfig(config, fileConfig);
      console.log(`[CLI] Loaded config from: ${configFile}`);
    } catch (error) {
      console.warn(`[CLI] Could not load config file: ${configFile}`);
    }
  }

  // Override with environment variables
  if (process.env.AI_PROVIDER) {
    config.ai.provider = process.env.AI_PROVIDER as AIProviderConfig['provider'];
  }
  if (process.env.AI_API_BASE) {
    config.ai.apiBase = process.env.AI_API_BASE;
  }
  if (process.env.AI_MODEL) {
    config.ai.model = process.env.AI_MODEL;
  }
  if (process.env.AI_API_KEY) {
    config.ai.apiKey = process.env.AI_API_KEY;
  }
  if (process.env.OUTPUT_DIR) {
    config.output.outputDir = process.env.OUTPUT_DIR;
  }
  if (process.env.OUTPUT_FORMAT) {
    config.output.format = process.env.OUTPUT_FORMAT as OutputConfig['format'];
  }

  return config;
}

/**
 * Merge configurations
 */
function mergeConfig(base: FrameworkConfig, override: Partial<FrameworkConfig>): FrameworkConfig {
  return {
    ai: { ...base.ai, ...override.ai },
    output: { ...base.output, ...override.output },
    queue: { ...base.queue, ...override.queue },
    analysis: { ...base.analysis, ...override.analysis },
  };
}

/**
 * Initialize the framework components
 */
function initFramework(config: FrameworkConfig): {
  aiClient: AIClient;
  analysisGenerator: AnalysisGenerator;
  pageGenerator: PageGenerator;
  taskQueue: DistributedTaskQueue;
} {
  const aiClient = new AIClient(config.ai);
  const analysisGenerator = new AnalysisGenerator(aiClient, config);
  const pageGenerator = new PageGenerator(config, analysisGenerator);
  const taskQueue = new DistributedTaskQueue(config, aiClient, analysisGenerator, pageGenerator);

  return { aiClient, analysisGenerator, pageGenerator, taskQueue };
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  // Show help if no command
  if (!command || command === 'help' || command === '-h' || command === '--help') {
    showHelp();
    return;
  }

  // Load configuration
  const configPath = args.includes('--config')
    ? args[args.indexOf('--config') + 1]
    : undefined;
  const config = loadConfig(configPath);

  // Initialize framework
  const { aiClient, analysisGenerator, pageGenerator, taskQueue } = initFramework(config);

  switch (command) {
    case 'analyze':
      await handleAnalyze(args.slice(1), config, analysisGenerator, pageGenerator);
      break;

    case 'daemon':
      await handleDaemon(args.slice(1), taskQueue);
      break;

    case 'queue':
      await handleQueue(args.slice(1), taskQueue);
      break;

    case 'status':
      await handleStatus(taskQueue, aiClient);
      break;

    case 'interactive':
      await handleInteractive(config, analysisGenerator, pageGenerator, taskQueue);
      break;

    case 'init':
      handleInit();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     Idea Stock Exchange - Distributed AI Framework CLI        ║
║     Generate interconnected argument analysis pages           ║
╚═══════════════════════════════════════════════════════════════╝

USAGE:
  ise-cli <command> [options]

COMMANDS:
  analyze <thesis>     Generate full analysis for a thesis statement
  daemon <action>      Control the background processing daemon
  queue <action>       Manage the task queue
  status               Show system and queue status
  interactive          Start interactive mode
  init                 Initialize config file in current directory
  help                 Show this help message

ANALYZE OPTIONS:
  ise-cli analyze "Your thesis statement here"
  ise-cli analyze --file thesis.txt
  ise-cli analyze --depth 3 "Thesis"
  ise-cli analyze --format markdown "Thesis"
  ise-cli analyze --output ./my-output "Thesis"

DAEMON COMMANDS:
  ise-cli daemon start      Start background processing
  ise-cli daemon stop       Stop background processing
  ise-cli daemon status     Check daemon status

QUEUE COMMANDS:
  ise-cli queue add "Thesis"    Add thesis to queue
  ise-cli queue list            List pending tasks
  ise-cli queue clear           Clear completed tasks
  ise-cli queue cancel <id>     Cancel a pending task

ENVIRONMENT VARIABLES:
  AI_PROVIDER      AI provider (ollama, openai, anthropic, lmstudio)
  AI_API_BASE      API endpoint URL
  AI_MODEL         Model name to use
  AI_API_KEY       API key (for OpenAI/Anthropic)
  OUTPUT_DIR       Output directory for generated pages
  OUTPUT_FORMAT    Output format (html, markdown, json)

EXAMPLES:
  # Analyze a thesis using local Ollama
  ise-cli analyze "Climate change is primarily human-caused"

  # Use OpenAI instead
  AI_PROVIDER=openai AI_API_KEY=sk-xxx ise-cli analyze "Thesis"

  # Generate markdown output
  ise-cli analyze --format markdown "Universal basic income is beneficial"

  # Start background daemon for batch processing
  ise-cli daemon start
  ise-cli queue add "First thesis"
  ise-cli queue add "Second thesis"

For more information, visit: https://github.com/myklob/ideastockexchange
`);
}

/**
 * Handle analyze command
 */
async function handleAnalyze(
  args: string[],
  config: FrameworkConfig,
  analysisGenerator: AnalysisGenerator,
  pageGenerator: PageGenerator
): Promise<void> {
  let thesis: string | undefined;
  let outputFormat = config.output.format;
  let outputDir = config.output.outputDir;
  let maxDepth = config.analysis.maxDepth;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--file' && args[i + 1]) {
      const filePath = args[++i];
      if (fs.existsSync(filePath)) {
        thesis = fs.readFileSync(filePath, 'utf-8').trim();
      } else {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }
    } else if (arg === '--format' && args[i + 1]) {
      outputFormat = args[++i] as typeof outputFormat;
    } else if (arg === '--output' && args[i + 1]) {
      outputDir = args[++i];
    } else if (arg === '--depth' && args[i + 1]) {
      maxDepth = parseInt(args[++i]);
    } else if (!arg.startsWith('--') && !arg.startsWith('-')) {
      thesis = arg;
    }
  }

  if (!thesis) {
    console.error('Error: No thesis provided');
    console.log('Usage: ise-cli analyze "Your thesis statement"');
    process.exit(1);
  }

  // Update config
  config.output.format = outputFormat;
  config.output.outputDir = outputDir;
  config.analysis.maxDepth = maxDepth;

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           Generating Argument Analysis                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  console.log(`Thesis: "${thesis.substring(0, 80)}${thesis.length > 80 ? '...' : ''}"`);
  console.log(`Output: ${outputDir} (${outputFormat})`);
  console.log(`Max Depth: ${maxDepth}`);
  console.log(`Model: ${config.ai.provider}/${config.ai.model}\n`);

  try {
    console.log('Generating analysis... (this may take a few minutes)\n');

    const analysis = await analysisGenerator.generateFullAnalysis(thesis);
    const files = await pageGenerator.generateAllPages(analysis);

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    Analysis Complete!                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    console.log(`Final Score: ${analysis.finalScore} (${analysis.scoreInterpretation})`);
    console.log(`Generated ${files.length} page(s):`);
    files.forEach(f => console.log(`  - ${f}`));
    console.log('\nOpen the output files in your browser to view the analysis.');

  } catch (error) {
    console.error('\nError generating analysis:', error);
    process.exit(1);
  }
}

/**
 * Handle daemon command
 */
async function handleDaemon(args: string[], taskQueue: DistributedTaskQueue): Promise<void> {
  const action = args[0];
  const daemon = new BackgroundDaemon(taskQueue);

  switch (action) {
    case 'start':
      console.log('Starting background daemon...');
      daemon.start();

      // Keep process running
      console.log('Daemon is running. Press Ctrl+C to stop.');
      process.on('SIGINT', () => {
        console.log('\nStopping daemon...');
        daemon.stop();
        process.exit(0);
      });

      // Keep the process alive
      await new Promise(() => {});
      break;

    case 'stop':
      daemon.stop();
      console.log('Daemon stopped');
      break;

    case 'status':
      console.log(`Daemon active: ${daemon.isActive()}`);
      break;

    default:
      console.error('Unknown daemon action. Use: start, stop, or status');
      process.exit(1);
  }
}

/**
 * Handle queue command
 */
async function handleQueue(args: string[], taskQueue: DistributedTaskQueue): Promise<void> {
  const action = args[0];

  switch (action) {
    case 'add':
      const thesis = args.slice(1).join(' ');
      if (!thesis) {
        console.error('Error: No thesis provided');
        process.exit(1);
      }
      const taskId = taskQueue.addAnalysisTask(thesis);
      console.log(`Added task: ${taskId}`);
      break;

    case 'list':
      const status = taskQueue.getStatus();
      console.log('\nTask Queue Status:');
      console.log(`  Pending: ${status.pending}`);
      console.log(`  Processing: ${status.processing}`);
      console.log(`  Completed: ${status.completed}`);
      console.log(`  Failed: ${status.failed}`);
      break;

    case 'clear':
      taskQueue.clearCompleted();
      console.log('Cleared completed tasks');
      break;

    case 'cancel':
      const cancelId = args[1];
      if (!cancelId) {
        console.error('Error: No task ID provided');
        process.exit(1);
      }
      const cancelled = taskQueue.cancelTask(cancelId);
      console.log(cancelled ? 'Task cancelled' : 'Task not found or not pending');
      break;

    default:
      console.error('Unknown queue action. Use: add, list, clear, or cancel');
      process.exit(1);
  }
}

/**
 * Handle status command
 */
async function handleStatus(taskQueue: DistributedTaskQueue, aiClient: AIClient): Promise<void> {
  const queueStatus = taskQueue.getStatus();
  const aiAvailable = await aiClient.isAvailable();
  const aiStats = aiClient.getStats();

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║              System Status                                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log('System Resources:');
  console.log(`  Platform: ${queueStatus.systemInfo.platform}`);
  console.log(`  CPU Usage: ${queueStatus.systemInfo.cpuUsage}%`);
  console.log(`  Memory Usage: ${queueStatus.systemInfo.memoryUsage}%`);

  console.log('\nAI Provider:');
  console.log(`  Available: ${aiAvailable ? 'Yes' : 'No'}`);
  console.log(`  Requests Made: ${aiStats.requestCount}`);
  console.log(`  Total Tokens: ${aiStats.totalTokens}`);

  console.log('\nTask Queue:');
  console.log(`  Pending: ${queueStatus.pending}`);
  console.log(`  Processing: ${queueStatus.processing}`);
  console.log(`  Completed: ${queueStatus.completed}`);
  console.log(`  Failed: ${queueStatus.failed}`);

  console.log('\nWorkers:');
  queueStatus.workers.forEach(w => {
    console.log(`  ${w.id}: ${w.status} (completed: ${w.completedCount})`);
  });
}

/**
 * Handle interactive mode
 */
async function handleInteractive(
  config: FrameworkConfig,
  analysisGenerator: AnalysisGenerator,
  pageGenerator: PageGenerator,
  taskQueue: DistributedTaskQueue
): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     Idea Stock Exchange - Interactive Mode                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  console.log('Commands: analyze, status, queue, help, exit\n');

  const prompt = (): void => {
    rl.question('ise> ', async (input) => {
      const parts = input.trim().split(' ');
      const cmd = parts[0];
      const cmdArgs = parts.slice(1);

      switch (cmd) {
        case 'analyze':
          const thesis = cmdArgs.join(' ');
          if (thesis) {
            try {
              console.log('Generating analysis...');
              const analysis = await analysisGenerator.generateFullAnalysis(thesis);
              await pageGenerator.generateAllPages(analysis);
              console.log(`Done! Score: ${analysis.finalScore}`);
            } catch (error) {
              console.error('Error:', error);
            }
          } else {
            console.log('Usage: analyze <thesis>');
          }
          break;

        case 'status':
          await handleStatus(taskQueue, new AIClient(config.ai));
          break;

        case 'queue':
          await handleQueue(cmdArgs, taskQueue);
          break;

        case 'help':
          console.log('Commands: analyze <thesis>, status, queue <add|list|clear>, exit');
          break;

        case 'exit':
        case 'quit':
          rl.close();
          process.exit(0);
          break;

        default:
          if (cmd) {
            console.log(`Unknown command: ${cmd}. Type 'help' for commands.`);
          }
      }

      prompt();
    });
  };

  prompt();
}

/**
 * Handle init command - create config file
 */
function handleInit(): void {
  const configContent = `# Idea Stock Exchange - Framework Configuration

# AI Provider settings
ai:
  # Provider: ollama, lmstudio, openai, anthropic, custom
  provider: "ollama"

  # Model name
  model: "llama3"

  # API endpoint
  api_base: "http://localhost:11434"

  # API key (for OpenAI/Anthropic)
  # api_key: "sk-..."

  # Generation settings
  temperature: 0.7
  max_tokens: 4000
  timeout: 120000

# Output settings
output:
  # Format: html, markdown, json
  format: "html"

  # Output directory
  directory: "./output"

  # Base URL for internal links
  base_url: "/w/page"

  # Link prefix for relative links
  link_prefix: "./"

  # Include CSS styles in HTML
  include_styles: true

  # Generate index page
  generate_index: true

# Task queue settings
queue:
  # Maximum concurrent tasks
  max_concurrent_tasks: 2

  # Task timeout in milliseconds
  task_timeout_ms: 300000

  # Retry attempts for failed tasks
  retry_attempts: 3

# Analysis settings
analysis:
  # Maximum recursion depth for argument expansion
  max_depth: 2

  # Minimum score to expand argument into own page
  min_score_for_expansion: 50

  # Generate linked pages for arguments
  generate_links: true
`;

  const configPath = path.join(process.cwd(), 'ise-config.yaml');

  if (fs.existsSync(configPath)) {
    console.log('Config file already exists: ise-config.yaml');
    return;
  }

  fs.writeFileSync(configPath, configContent);
  console.log('Created config file: ise-config.yaml');
  console.log('Edit this file to customize your settings.');
}

// Run CLI
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
