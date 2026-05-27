import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CentralMemory } from './index';
import {
  SharedContext,
  ExecutionRecord,
  Pattern,
  PatternAnalysis,
  ExecutionHistory,
  Decision,
  Suggestion,
  TokenBudget,
  CentralMemoryConfig,
} from './types';

export class SupabaseMemoryStore extends CentralMemory {
  private supabase: SupabaseClient;
  private userId: string = 'anonymous'; // Default, should be set from auth context

  constructor(config: CentralMemoryConfig) {
    super(config);

    this.supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });

    // Try to get authenticated user
    this.initializeUser();
  }

  private async initializeUser() {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (user) {
        this.userId = user.id;
      }
    } catch (error) {
      console.warn('Could not get authenticated user:', error);
    }
  }

  async getContext(key: string): Promise<unknown> {
    const cached = this.getCached(key);
    if (cached !== null) return cached;

    try {
      const { data, error } = await this.supabase
        .from('shared_context')
        .select('value')
        .eq('key', key)
        .single();

      if (error) {
        console.error('Error getting context:', error);
        return null;
      }

      this.setCached(key, data?.value);
      return data?.value || null;
    } catch (error) {
      console.error('Unexpected error in getContext:', error);
      return null;
    }
  }

  async setContext(key: string, value: unknown): Promise<void> {
    this.setCached(key, value); // Update cache immediately

    try {
      const { error } = await this.supabase.from('shared_context').upsert(
        {
          key,
          value: value as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

      if (error) {
        console.error('Error setting context:', error);
        throw error;
      }
    } catch (error) {
      console.error('Unexpected error in setContext:', error);
      throw error;
    }
  }

  async queryPatterns(keywords: string[]): Promise<Pattern[]> {
    const cacheKey = `patterns:${keywords.join(',')}`;
    const cached = this.getCached<Pattern[]>(cacheKey);
    if (cached !== null) return cached;

    try {
      // Query patterns that contain any of the keywords
      const { data, error } = await this.supabase.from('patterns').select('*');

      if (error) {
        console.error('Error querying patterns:', error);
        return [];
      }

      // Filter patterns by keyword match and sort by success rate
      const filtered = (data || [])
        .filter((p: any) =>
          keywords.some((kw) => p.keywords.includes(kw.toLowerCase()))
        )
        .sort((a: any, b: any) => b.success_rate - a.success_rate)
        .map((p: any) => ({
          id: p.id,
          keywords: p.keywords,
          bestSkills: p.best_skills,
          successRate: p.success_rate,
          uses: p.uses,
          createdAt: new Date(p.created_at),
        }));

      this.setCached(cacheKey, filtered);
      return filtered;
    } catch (error) {
      console.error('Unexpected error in queryPatterns:', error);
      return [];
    }
  }

  async findSimilar(goal: string): Promise<ExecutionHistory[]> {
    const cacheKey = `similar:${goal}`;
    const cached = this.getCached<ExecutionHistory[]>(cacheKey);
    if (cached !== null) return cached;

    try {
      // Simple keyword-based similarity search
      const keywords = goal.toLowerCase().split(' ');

      const { data, error } = await this.supabase
        .from('execution_history')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error finding similar executions:', error);
        return [];
      }

      // Filter by keyword match
      const similar = (data || [])
        .filter((e: any) => {
          const goalMatch = e.goal.toLowerCase().includes(goal.toLowerCase());
          const keywordMatch = keywords.some((kw) =>
            e.goal.toLowerCase().includes(kw)
          );
          return goalMatch || keywordMatch;
        })
        .map((e: any) => ({
          id: e.id,
          goal: e.goal,
          spec: e.spec,
          skillsUsed: e.skills_used,
          durationMs: e.duration_ms,
          status: e.status,
          results: e.results,
          errors: e.errors || [],
          createdAt: new Date(e.created_at),
          userId: e.user_id,
        }));

      this.setCached(cacheKey, similar);
      return similar;
    } catch (error) {
      console.error('Unexpected error in findSimilar:', error);
      return [];
    }
  }

  async recordExecution(exec: ExecutionRecord): Promise<void> {
    try {
      const { error } = await this.supabase.from('execution_history').insert({
        id: exec.id,
        goal: exec.goal,
        spec: exec.spec,
        skills_used: exec.skillsUsed,
        duration_ms: exec.durationMs,
        status: exec.status,
        results: exec.results,
        errors: exec.errors,
        user_id: this.userId,
        created_at: exec.createdAt.toISOString(),
      });

      if (error) {
        console.error('Error recording execution:', error);
        throw error;
      }

      // Clear relevant caches
      this.cache.forEach((_, key) => {
        if (key.startsWith('similar:') || key.startsWith('patterns:')) {
          this.cache.delete(key);
        }
      });
    } catch (error) {
      console.error('Unexpected error in recordExecution:', error);
      throw error;
    }
  }

  async recordDecision(decision: Decision): Promise<void> {
    try {
      // Store decisions in shared_context as a list
      const decisionsKey = `decisions:${this.userId}`;
      const existing = (await this.getContext(decisionsKey)) as Decision[] | null;
      const decisions = existing || [];
      decisions.push(decision);

      await this.setContext(decisionsKey, decisions);
    } catch (error) {
      console.error('Error recording decision:', error);
      throw error;
    }
  }

  async analyzePatternsFor(keywords: string[]): Promise<PatternAnalysis> {
    try {
      const patterns = await this.queryPatterns(keywords);

      if (patterns.length === 0) {
        return {
          patterns: [],
          recommendedSkills: [],
          confidenceScore: 0,
          estimatedDuration: 0,
          historicalSuccessRate: 0,
        };
      }

      // Aggregate data from patterns
      const allSkills = new Set<string>();
      let totalSuccessRate = 0;
      let totalDuration = 0;

      patterns.forEach((p) => {
        p.bestSkills.forEach((s) => allSkills.add(s));
        totalSuccessRate += p.successRate;
        totalDuration += 15 * 60 * 1000; // estimate 15 min per pattern
      });

      const avgSuccessRate = totalSuccessRate / patterns.length;
      const estimatedDuration = totalDuration / patterns.length;

      return {
        patterns,
        recommendedSkills: Array.from(allSkills),
        confidenceScore: avgSuccessRate * 100,
        estimatedDuration: Math.round(estimatedDuration),
        historicalSuccessRate: avgSuccessRate,
      };
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      return {
        patterns: [],
        recommendedSkills: [],
        confidenceScore: 0,
        estimatedDuration: 0,
        historicalSuccessRate: 0,
      };
    }
  }

  async getSuggestions(goal: string): Promise<Suggestion[]> {
    try {
      const analysis = await this.analyzePatternsFor(goal.split(' '));

      return analysis.recommendedSkills.map((skill, index) => ({
        skill,
        reason: `Recommended based on similar objectives (${Math.round(analysis.historicalSuccessRate * 100)}% success rate)`,
        priority: (index < 3 ? index + 1 : 3) as 1 | 2 | 3,
        estimatedImpact: analysis.historicalSuccessRate,
      }));
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  async getTokenBudget(provider: 'claude' | 'gpt' | 'gemini'): Promise<TokenBudget> {
    const cacheKey = `tokens:${provider}`;
    const cached = this.getCached<TokenBudget>(cacheKey);
    if (cached !== null) return cached;

    try {
      const budgetKey = `token_budget:${provider}`;
      const budget = (await this.getContext(budgetKey)) as Partial<TokenBudget> | null;

      const result: TokenBudget = {
        provider,
        maxTokensMonth: budget?.maxTokensMonth || 100000,
        tokensSpent: budget?.tokensSpent || 0,
        tokensRemaining:
          (budget?.maxTokensMonth || 100000) - (budget?.tokensSpent || 0),
        lastReset: budget?.lastReset
          ? new Date(budget.lastReset)
          : new Date(),
      };

      this.setCached(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error getting token budget:', error);
      return {
        provider,
        maxTokensMonth: 100000,
        tokensSpent: 0,
        tokensRemaining: 100000,
        lastReset: new Date(),
      };
    }
  }

  async updateTokenSpent(
    provider: 'claude' | 'gpt' | 'gemini',
    tokensUsed: number
  ): Promise<void> {
    try {
      const budget = await this.getTokenBudget(provider);
      const updated: TokenBudget = {
        ...budget,
        tokensSpent: budget.tokensSpent + tokensUsed,
        tokensRemaining: budget.tokensRemaining - tokensUsed,
      };

      const budgetKey = `token_budget:${provider}`;
      await this.setContext(budgetKey, updated);

      // Update cache
      const cacheKey = `tokens:${provider}`;
      this.setCached(cacheKey, updated);
    } catch (error) {
      console.error('Error updating token spent:', error);
      throw error;
    }
  }
}
