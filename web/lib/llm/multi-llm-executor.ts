import {
  LLMProvider,
  SkillResult,
  LLMExecutionInput,
  MultiLLMConfig,
  ExecutionAttempt,
  UserPrompt,
} from './types';
import { getTokenBudgetManager } from './token-budget-manager';
import { ClaudeExecutor } from './claude-executor';
import { GPTExecutor } from './gpt-executor';
import { GeminiExecutor } from './gemini-executor';

export class MultiLLMExecutor {
  private config: MultiLLMConfig;
  private tokenBudgetManager = getTokenBudgetManager();
  private maxRetries: number = 3;
  private timeout: number = 300000; // 5 minutes
  private providers: LLMProvider[] = ['claude', 'gpt', 'gemini'];
  private executionAttempts: ExecutionAttempt[] = [];
  private claudeExecutor: ClaudeExecutor | null = null;
  private gptExecutor: GPTExecutor | null = null;
  private geminiExecutor: GeminiExecutor | null = null;

  constructor(config: MultiLLMConfig) {
    this.config = config;
    if (config.maxRetries !== undefined) this.maxRetries = config.maxRetries;
    if (config.timeout !== undefined) this.timeout = config.timeout;
    this.initializeExecutors();
  }

  private initializeExecutors(): void {
    if (this.config.claude?.apiKey) {
      this.claudeExecutor = new ClaudeExecutor(
        this.config.claude.apiKey,
        this.config.claude.model,
        this.timeout
      );
    }
    if (this.config.gpt?.apiKey) {
      this.gptExecutor = new GPTExecutor(
        this.config.gpt.apiKey,
        this.config.gpt.model,
        this.timeout
      );
    }
    if (this.config.gemini?.apiKey) {
      this.geminiExecutor = new GeminiExecutor(
        this.config.gemini.apiKey,
        this.config.gemini.model,
        this.timeout
      );
    }
  }

  async executeSkill(input: LLMExecutionInput): Promise<SkillResult> {
    const skillId =
      typeof input.skill === 'string' ? input.skill : input.skill.id;
    const startTime = Date.now();

    console.log(`[MultiLLMExecutor] Starting execution of skill: ${skillId}`);

    // Try each provider in sequence
    for (let attemptNumber = 1; attemptNumber <= this.maxRetries; attemptNumber++) {
      const provider = this.selectProvider(attemptNumber);

      if (!this.isProviderConfigured(provider)) {
        console.warn(
          `[MultiLLMExecutor] Provider ${provider} not configured, skipping attempt ${attemptNumber}`
        );
        continue;
      }

      const attempt: ExecutionAttempt = {
        provider,
        attemptNumber,
        startTime: new Date(),
        success: false,
      };

      try {
        console.log(
          `[MultiLLMExecutor] Attempting skill execution with ${provider} (attempt ${attemptNumber}/${this.maxRetries})`
        );

        // Check token budget before execution
        const remaining = await this.tokenBudgetManager.getRemaining(provider);
        if (remaining < 1000) {
          console.warn(
            `[MultiLLMExecutor] ${provider} token budget low (${remaining} remaining), trying next provider`
          );
          attempt.error = 'Insufficient token budget';
          this.executionAttempts.push(attempt);
          continue;
        }

        // Execute with timeout
        const result = await this.executeWithTimeout(provider, input);

        // Track token usage
        await this.tokenBudgetManager.trackUsage(
          provider,
          result.tokensUsed
        );

        attempt.success = true;
        attempt.endTime = new Date();
        attempt.result = result;
        this.executionAttempts.push(attempt);

        console.log(
          `[MultiLLMExecutor] ✅ Skill execution succeeded with ${provider}`
        );

        return result;
      } catch (error) {
        attempt.endTime = new Date();
        attempt.error = error instanceof Error ? error.message : String(error);
        this.executionAttempts.push(attempt);

        console.warn(
          `[MultiLLMExecutor] ❌ Attempt ${attemptNumber} with ${provider} failed:`,
          attempt.error
        );

        if (attemptNumber < this.maxRetries) {
          // Wait before next attempt (exponential backoff)
          const delayMs = Math.min(1000 * Math.pow(2, attemptNumber - 1), 10000);
          console.log(
            `[MultiLLMExecutor] Waiting ${delayMs}ms before next attempt...`
          );
          await this.sleep(delayMs);
        }
      }
    }

    // All attempts failed - escalate to user
    console.error(`[MultiLLMExecutor] ❌ All ${this.maxRetries} attempts failed`);

    const lastAttempt = this.executionAttempts[this.executionAttempts.length - 1];

    // In a real implementation, this would prompt the user
    // For now, return failure
    return {
      success: false,
      error: `All LLM providers failed after ${this.maxRetries} attempts. Last error: ${lastAttempt?.error || 'Unknown'}`,
      tokensUsed: 0,
      inputTokens: 0,
      outputTokens: 0,
      llmProvider: 'claude',
      executionTime: Date.now() - startTime,
      retryCount: this.maxRetries,
    };
  }

  private async executeWithTimeout(
    provider: LLMProvider,
    input: LLMExecutionInput
  ): Promise<SkillResult> {
    return Promise.race([
      this.executeLLM(provider, input),
      this.createTimeout(),
    ]);
  }

  private async executeLLM(
    provider: LLMProvider,
    input: LLMExecutionInput
  ): Promise<SkillResult> {
    let executor: ClaudeExecutor | GPTExecutor | GeminiExecutor | null = null;

    switch (provider) {
      case 'claude':
        executor = this.claudeExecutor;
        break;
      case 'gpt':
        executor = this.gptExecutor;
        break;
      case 'gemini':
        executor = this.geminiExecutor;
        break;
    }

    if (!executor) {
      throw new Error(`Provider ${provider} is not configured`);
    }

    return executor.execute(input);
  }

  private createTimeout(): Promise<SkillResult> {
    return new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Skill execution timeout exceeded (${this.timeout}ms)`
            )
          ),
        this.timeout
      )
    );
  }

  private selectProvider(attemptNumber: number): LLMProvider {
    // Attempt 1: Claude (primary)
    // Attempt 2: GPT (fallback)
    // Attempt 3: Gemini (fallback)
    const providerMap: Record<number, LLMProvider> = {
      1: 'claude',
      2: 'gpt',
      3: 'gemini',
    };

    return providerMap[attemptNumber] || 'gemini';
  }

  private isProviderConfigured(provider: LLMProvider): boolean {
    switch (provider) {
      case 'claude':
        return !!this.config.claude?.apiKey;
      case 'gpt':
        return !!this.config.gpt?.apiKey;
      case 'gemini':
        return !!this.config.gemini?.apiKey;
      default:
        return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getExecutionAttempts(): ExecutionAttempt[] {
    return this.executionAttempts;
  }

  clearAttempts(): void {
    this.executionAttempts = [];
  }
}

// Singleton instance
let instance: MultiLLMExecutor | null = null;

export function initializeMultiLLMExecutor(config: MultiLLMConfig): MultiLLMExecutor {
  instance = new MultiLLMExecutor(config);
  return instance;
}

export function getMultiLLMExecutor(): MultiLLMExecutor {
  if (!instance) {
    const config: MultiLLMConfig = {
      claude: {
        apiKey: process.env.CLAUDE_API_KEY || '',
        model: 'claude-sonnet-4-6',
      },
      gpt: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4-mini',
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        model: 'gemini-1.5-flash',
      },
    };

    instance = new MultiLLMExecutor(config);
  }

  return instance;
}
