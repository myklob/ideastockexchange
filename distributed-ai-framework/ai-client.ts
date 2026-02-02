/**
 * Distributed AI Framework - Multi-Provider AI Client
 * Supports Ollama, LM Studio, OpenAI, Anthropic, and custom endpoints
 */

import { AIProviderConfig, AIRequest, AIResponse } from './types';

// API Response types
interface OllamaResponse {
  response: string;
  model: string;
  eval_count?: number;
}

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
  model: string;
  usage?: { total_tokens: number };
}

interface AnthropicResponse {
  content: Array<{ text: string }>;
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
}

interface OllamaModelsResponse {
  models: Array<{ name: string }>;
}

export class AIClient {
  private config: AIProviderConfig;
  private requestCount: number = 0;
  private totalTokens: number = 0;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  /**
   * Send a completion request to the configured AI provider
   */
  async complete(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      let response: AIResponse;

      switch (this.config.provider) {
        case 'ollama':
          response = await this.ollamaComplete(request);
          break;
        case 'lmstudio':
          response = await this.openAICompatibleComplete(request);
          break;
        case 'openai':
          response = await this.openAIComplete(request);
          break;
        case 'anthropic':
          response = await this.anthropicComplete(request);
          break;
        case 'custom':
          response = await this.openAICompatibleComplete(request);
          break;
        default:
          throw new Error(`Unknown provider: ${this.config.provider}`);
      }

      response.latencyMs = Date.now() - startTime;
      this.requestCount++;
      this.totalTokens += response.tokensUsed;

      return response;
    } catch (error) {
      throw new Error(`AI request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ollama API completion
   */
  private async ollamaComplete(request: AIRequest): Promise<AIResponse> {
    const url = `${this.config.apiBase}/api/generate`;

    const body = {
      model: this.config.model,
      prompt: this.buildPrompt(request),
      stream: false,
      options: {
        temperature: request.temperature ?? this.config.temperature,
        num_predict: request.maxTokens ?? this.config.maxTokens,
      },
      format: request.responseFormat === 'json' ? 'json' : undefined,
    };

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json() as OllamaResponse;

    return {
      content: data.response,
      model: data.model,
      tokensUsed: data.eval_count || 0,
      latencyMs: 0,
    };
  }

  /**
   * OpenAI-compatible API (works with LM Studio, vLLM, etc.)
   */
  private async openAICompatibleComplete(request: AIRequest): Promise<AIResponse> {
    const url = `${this.config.apiBase}/chat/completions`;

    const messages = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      temperature: request.temperature ?? this.config.temperature,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
    };

    if (request.responseFormat === 'json') {
      body.response_format = { type: 'json_object' };
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json() as OpenAIResponse;

    return {
      content: data.choices[0].message.content,
      model: data.model,
      tokensUsed: data.usage?.total_tokens || 0,
      latencyMs: 0,
    };
  }

  /**
   * OpenAI API completion
   */
  private async openAIComplete(request: AIRequest): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key required');
    }

    const url = 'https://api.openai.com/v1/chat/completions';

    const messages = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      temperature: request.temperature ?? this.config.temperature,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
    };

    if (request.responseFormat === 'json') {
      body.response_format = { type: 'json_object' };
    }

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json() as OpenAIResponse;

    return {
      content: data.choices[0].message.content,
      model: data.model,
      tokensUsed: data.usage?.total_tokens || 0,
      latencyMs: 0,
    };
  }

  /**
   * Anthropic API completion
   */
  private async anthropicComplete(request: AIRequest): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key required');
    }

    const url = 'https://api.anthropic.com/v1/messages';

    const body: Record<string, unknown> = {
      model: this.config.model,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
      messages: [{ role: 'user', content: request.prompt }],
    };

    if (request.systemPrompt) {
      body.system = request.systemPrompt;
    }

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json() as AnthropicResponse;

    return {
      content: data.content[0].text,
      model: data.model,
      tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      latencyMs: 0,
    };
  }

  /**
   * Build the full prompt including system prompt
   */
  private buildPrompt(request: AIRequest): string {
    if (request.systemPrompt) {
      return `${request.systemPrompt}\n\n${request.prompt}`;
    }
    return request.prompt;
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if the AI provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (this.config.provider === 'ollama') {
        const response = await fetch(`${this.config.apiBase}/api/tags`);
        return response.ok;
      }

      // For other providers, try a minimal request
      await this.complete({
        prompt: 'Say "ok"',
        maxTokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List available models (Ollama only)
   */
  async listModels(): Promise<string[]> {
    if (this.config.provider !== 'ollama') {
      throw new Error('Model listing only supported for Ollama');
    }

    const response = await fetch(`${this.config.apiBase}/api/tags`);
    const data = await response.json() as OllamaModelsResponse;
    return data.models.map((m) => m.name);
  }

  /**
   * Get usage statistics
   */
  getStats(): { requestCount: number; totalTokens: number } {
    return {
      requestCount: this.requestCount,
      totalTokens: this.totalTokens,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Create AI client from configuration file
 */
export function createAIClient(configPath?: string): AIClient {
  // Default configuration
  const defaultConfig: AIProviderConfig = {
    provider: 'ollama',
    apiBase: 'http://localhost:11434',
    model: 'llama3',
    temperature: 0.7,
    maxTokens: 4000,
    timeout: 120000,
  };

  if (configPath) {
    try {
      const fs = require('fs');
      const yaml = require('js-yaml');
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(configContent);

      if (config.llm) {
        return new AIClient({
          provider: config.llm.provider || defaultConfig.provider,
          apiBase: config.llm.api_base || defaultConfig.apiBase,
          model: config.llm.model || defaultConfig.model,
          apiKey: config.llm.api_key,
          temperature: config.llm.temperature || defaultConfig.temperature,
          maxTokens: config.llm.max_tokens || defaultConfig.maxTokens,
          timeout: config.llm.timeout || defaultConfig.timeout,
        });
      }
    } catch (error) {
      console.warn(`Could not load config from ${configPath}, using defaults`);
    }
  }

  return new AIClient(defaultConfig);
}

/**
 * Create AI client from environment variables
 */
export function createAIClientFromEnv(): AIClient {
  const provider = (process.env.AI_PROVIDER || 'ollama') as AIProviderConfig['provider'];

  return new AIClient({
    provider,
    apiBase: process.env.AI_API_BASE || 'http://localhost:11434',
    model: process.env.AI_MODEL || 'llama3',
    apiKey: process.env.AI_API_KEY,
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
    timeout: parseInt(process.env.AI_TIMEOUT || '120000'),
  });
}
