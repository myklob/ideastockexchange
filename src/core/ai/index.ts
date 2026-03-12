/**
 * Idea Stock Exchange - Distributed AI Framework
 *
 * Generate interconnected argument analysis pages using AI.
 * Supports multiple AI providers (Ollama, OpenAI, Anthropic, LM Studio)
 * and uses spare processing capacity for distributed task processing.
 *
 * @example
 * ```typescript
 * import {
 *   AIClient,
 *   AnalysisGenerator,
 *   PageGenerator,
 *   DistributedTaskQueue,
 *   createDefaultConfig
 * } from 'ise-distributed-ai-framework';
 *
 * // Initialize with default config
 * const config = createDefaultConfig();
 * const aiClient = new AIClient(config.ai);
 * const analysisGenerator = new AnalysisGenerator(aiClient, config);
 * const pageGenerator = new PageGenerator(config, analysisGenerator);
 *
 * // Generate analysis
 * const analysis = await analysisGenerator.generateFullAnalysis(
 *   "Climate change is primarily caused by human activity"
 * );
 *
 * // Generate HTML/Markdown pages
 * await pageGenerator.generateAllPages(analysis);
 * ```
 */

// Export types
export * from './types';

// Export AI client
export { AIClient, createAIClient, createAIClientFromEnv } from './ai-client';

// Export analysis generator
export { AnalysisGenerator } from './analysis-generator';

// Export page generator
export { PageGenerator } from './page-generator';

// Export task queue
export { DistributedTaskQueue, BackgroundDaemon } from './task-queue';

// Export default configuration factory
import { FrameworkConfig } from './types';

/**
 * Create default framework configuration
 */
export function createDefaultConfig(): FrameworkConfig {
  return {
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
}

/**
 * Quick start function - generates analysis with minimal setup
 */
export async function quickAnalysis(
  thesis: string,
  options?: {
    provider?: 'ollama' | 'openai' | 'anthropic' | 'lmstudio';
    model?: string;
    apiKey?: string;
    outputDir?: string;
    format?: 'html' | 'markdown' | 'json';
  }
): Promise<{
  analysis: import('./types').IssueAnalysis;
  files: string[];
}> {
  const { AIClient } = await import('./ai-client');
  const { AnalysisGenerator } = await import('./analysis-generator');
  const { PageGenerator } = await import('./page-generator');

  const config = createDefaultConfig();

  // Apply options
  if (options?.provider) config.ai.provider = options.provider;
  if (options?.model) config.ai.model = options.model;
  if (options?.apiKey) config.ai.apiKey = options.apiKey;
  if (options?.outputDir) config.output.outputDir = options.outputDir;
  if (options?.format) config.output.format = options.format;

  // Set API base for different providers
  if (options?.provider === 'openai') {
    config.ai.apiBase = 'https://api.openai.com/v1';
  } else if (options?.provider === 'anthropic') {
    config.ai.apiBase = 'https://api.anthropic.com/v1';
  } else if (options?.provider === 'lmstudio') {
    config.ai.apiBase = 'http://localhost:1234/v1';
  }

  const aiClient = new AIClient(config.ai);
  const analysisGenerator = new AnalysisGenerator(aiClient, config);
  const pageGenerator = new PageGenerator(config, analysisGenerator);

  const analysis = await analysisGenerator.generateFullAnalysis(thesis);
  const files = await pageGenerator.generateAllPages(analysis);

  return { analysis, files };
}
