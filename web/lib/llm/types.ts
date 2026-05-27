export type LLMProvider = 'claude' | 'gpt' | 'gemini';

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  examples?: Array<{
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  }>;
}

export interface LLMExecutionInput {
  skill: SkillDefinition | string; // Can be skill name or full definition
  input: Record<string, unknown>;
  context?: Record<string, unknown>;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface SkillResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  tokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  llmProvider: LLMProvider;
  executionTime: number; // milliseconds
  retryCount: number;
  stopReason?: string;
}

export interface LLMExecutorConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number; // milliseconds
}

export interface TokenUsage {
  provider: LLMProvider;
  tokensUsed: number;
  timestamp: Date;
  skillId?: string;
}

export interface TokenBudgetInfo {
  provider: LLMProvider;
  maxTokensMonth: number;
  tokensSpent: number;
  tokensRemaining: number;
  percentageUsed: number;
  daysUntilReset: number;
  lastReset: Date;
}

export interface MultiLLMConfig {
  claude?: {
    apiKey: string;
    model?: string;
  };
  gpt?: {
    apiKey: string;
    model?: string;
  };
  gemini?: {
    apiKey: string;
    model?: string;
  };
  timeout?: number; // Default timeout per skill
  maxRetries?: number; // Default max retries
}

export interface ExecutionAttempt {
  provider: LLMProvider;
  attemptNumber: number;
  startTime: Date;
  endTime?: Date;
  success: boolean;
  error?: string;
  tokensUsed?: number;
  result?: SkillResult;
}

export interface UserPrompt {
  message: string;
  options: string[];
  defaultOption?: string;
  timeout?: number; // milliseconds
}
