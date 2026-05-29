import {
  SharedContext,
  ExecutionRecord,
  Pattern,
  PatternAnalysis,
  ExecutionHistory,
  Gap,
  Decision,
  Suggestion,
  TokenBudget,
  CentralMemoryConfig,
  OrganizedSpec,
} from './types';

export abstract class CentralMemory {
  protected config: CentralMemoryConfig;
  protected cache: Map<string, { value: unknown; expiresAt: number }> = new Map();

  constructor(config: CentralMemoryConfig) {
    this.config = {
      cacheTTL: 5 * 60 * 1000, // 5 minutes default
      ...config,
    };
  }

  // Lectura de contexto
  abstract getContext(key: string): Promise<unknown>;
  abstract setContext(key: string, value: unknown): Promise<void>;

  // Consulta de patrones
  abstract queryPatterns(keywords: string[]): Promise<Pattern[]>;
  abstract findSimilar(goal: string): Promise<ExecutionHistory[]>;

  // Grabación de datos
  abstract recordExecution(exec: ExecutionRecord): Promise<void>;
  abstract recordDecision(decision: Decision): Promise<void>;
  abstract recordPattern(keywords: string[], skillsUsed: string[], successRate: number): Promise<void>;

  // Análisis
  abstract analyzePatternsFor(keywords: string[]): Promise<PatternAnalysis>;
  abstract getSuggestions(goal: string): Promise<Suggestion[]>;

  // Token budgeting
  abstract getTokenBudget(provider: 'claude' | 'gpt' | 'gemini'): Promise<TokenBudget>;
  abstract updateTokenSpent(
    provider: 'claude' | 'gpt' | 'gemini',
    tokensUsed: number
  ): Promise<void>;

  // Learning & Suggestions
  abstract getSuggestedAgents(keywords: string[]): Promise<any[]>;
  abstract detectConflictPatterns(agentIds: string[]): Promise<any[]>;
  abstract getLearningFeedback(goal: string, executionId: string): Promise<any>;

  // Cache utilities
  protected getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (cached.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return cached.value as T;
  }

  protected setCached<T>(key: string, value: T, ttl?: number): void {
    const cacheTTL = ttl || this.config.cacheTTL || 5 * 60 * 1000;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + cacheTTL,
    });
  }

  protected clearCache(): void {
    this.cache.clear();
  }

  // Helper: estimate based on historical data
  async estimateDuration(skillCount: number, complexity: 'simple' | 'medium' | 'complex'): Promise<number> {
    const baseTime: Record<string, number> = {
      simple: 5 * 60 * 1000, // 5 minutes
      medium: 15 * 60 * 1000, // 15 minutes
      complex: 30 * 60 * 1000, // 30 minutes
    };

    const timePerSkill = 2 * 60 * 1000; // 2 minutes per skill
    const baseEstimate = baseTime[complexity];
    const totalEstimate = baseEstimate + skillCount * timePerSkill;

    return totalEstimate;
  }

  // Helper: get most successful skills for objective
  async getBestSkillsFor(objective: string): Promise<string[]> {
    try {
      const patterns = await this.queryPatterns(objective.split(' '));
      if (patterns.length === 0) return [];

      // Sort by success rate
      patterns.sort((a, b) => b.successRate - a.successRate);
      return patterns[0]?.bestSkills || [];
    } catch (error) {
      console.error('Error getting best skills:', error);
      return [];
    }
  }

  // Helper: check if should retry based on history
  async shouldRetryExecution(goal: string, failureCount: number): Promise<boolean> {
    if (failureCount >= 3) return false;

    const similar = await this.findSimilar(goal);
    if (similar.length === 0) return true;

    // Check if similar executions succeeded on retry
    const retrySuccessRate = similar.filter((s) => s.status === 'success').length / similar.length;
    return retrySuccessRate > 0.3; // If 30%+ of similar goals eventually succeeded, retry
  }
}

// Singleton instance
let instance: CentralMemory | null = null;

export function initializeCentralMemory(config: CentralMemoryConfig): CentralMemory {
  if (instance) {
    console.warn('CentralMemory already initialized');
    return instance;
  }

  // Import and instantiate the Supabase implementation
  const { SupabaseMemoryStore } = require('./supabase-store');
  instance = new SupabaseMemoryStore(config);
  return instance as CentralMemory;
}

export function getCentralMemory(): CentralMemory {
  if (!instance) {
    throw new Error('CentralMemory not initialized. Call initializeCentralMemory first.');
  }
  return instance as CentralMemory;
}

export * from './types';
