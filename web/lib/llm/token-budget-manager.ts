import { getCentralMemory } from '../central-memory';
import { TokenBudgetInfo, LLMProvider, TokenUsage } from './types';

export class TokenBudgetManager {
  private centralMemory = getCentralMemory();

  // Default budgets (per month)
  private DEFAULT_BUDGETS = {
    claude: 500000,
    gpt: 100000,
    gemini: 100000,
  };

  // Alert thresholds
  private ALERT_THRESHOLD = 0.8; // 80%

  async getRemaining(provider: LLMProvider): Promise<number> {
    const info = await this.getBudgetInfo(provider);
    return info.tokensRemaining;
  }

  async trackUsage(provider: LLMProvider, tokensUsed: number): Promise<void> {
    try {
      // Record usage
      const usage: TokenUsage = {
        provider,
        tokensUsed,
        timestamp: new Date(),
      };

      const usageKey = `token:usage:${provider}`;
      const usageLog = (await this.centralMemory.getContext(usageKey)) as
        | TokenUsage[]
        | undefined;
      const usageList = usageLog || [];
      usageList.push(usage);

      await this.centralMemory.setContext(usageKey, usageList);

      // Update budget tracking
      await this.centralMemory.updateTokenSpent(provider, tokensUsed);

      // Check if should alert
      const newInfo = await this.getBudgetInfo(provider);
      if (newInfo.percentageUsed >= this.ALERT_THRESHOLD) {
        console.warn(
          `⚠️ Token budget alert for ${provider}: ${newInfo.percentageUsed.toFixed(1)}% used`
        );
      }
    } catch (error) {
      console.error(`Error tracking token usage for ${provider}:`, error);
      throw error;
    }
  }

  async getBudgetInfo(provider: LLMProvider): Promise<TokenBudgetInfo> {
    try {
      const budget = await this.getCentralMemory().getTokenBudget(provider);

      const tokensRemaining =
        budget.maxTokensMonth - budget.tokensSpent;
      const percentageUsed =
        (budget.tokensSpent / budget.maxTokensMonth) * 100;

      // Calculate days until reset
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const nextResetDate =
        currentMonth === 11
          ? new Date(currentYear + 1, 0, 1)
          : new Date(currentYear, currentMonth + 1, 1);

      const daysUntilReset = Math.ceil(
        (nextResetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        provider,
        maxTokensMonth: budget.maxTokensMonth,
        tokensSpent: budget.tokensSpent,
        tokensRemaining: Math.max(0, tokensRemaining),
        percentageUsed: Math.min(100, percentageUsed),
        daysUntilReset,
        lastReset: budget.lastReset,
      };
    } catch (error) {
      console.warn(`Could not get budget info for ${provider}:`, error);
      // Return default budget
      const maxTokens = this.DEFAULT_BUDGETS[provider];
      return {
        provider,
        maxTokensMonth: maxTokens,
        tokensSpent: 0,
        tokensRemaining: maxTokens,
        percentageUsed: 0,
        daysUntilReset: 30,
        lastReset: new Date(),
      };
    }
  }

  async exceedsLimit(provider: LLMProvider, estimatedTokens: number = 0): Promise<boolean> {
    try {
      const info = await this.getBudgetInfo(provider);
      return info.tokensRemaining < estimatedTokens;
    } catch (error) {
      console.warn(`Error checking limit for ${provider}:`, error);
      return false;
    }
  }

  async getAllBudgetInfo(): Promise<Record<LLMProvider, TokenBudgetInfo>> {
    const providers: LLMProvider[] = ['claude', 'gpt', 'gemini'];
    const budgets: Record<LLMProvider, TokenBudgetInfo> = {} as Record<LLMProvider, TokenBudgetInfo>;

    for (const provider of providers) {
      budgets[provider] = await this.getBudgetInfo(provider);
    }

    return budgets;
  }

  async resetBudget(provider: LLMProvider): Promise<void> {
    try {
      const budgetKey = `token_budget:${provider}`;
      const maxTokens = this.DEFAULT_BUDGETS[provider];

      await this.centralMemory.setContext(budgetKey, {
        provider,
        maxTokensMonth: maxTokens,
        tokensSpent: 0,
        lastReset: new Date(),
      });

      console.log(`✅ Token budget reset for ${provider}`);
    } catch (error) {
      console.error(`Error resetting budget for ${provider}:`, error);
      throw error;
    }
  }

  async resetAllBudgets(): Promise<void> {
    const providers: LLMProvider[] = ['claude', 'gpt', 'gemini'];
    for (const provider of providers) {
      await this.resetBudget(provider);
    }
  }

  private getCentralMemory() {
    return this.centralMemory;
  }
}

// Singleton
let instance: TokenBudgetManager | null = null;

export function getTokenBudgetManager(): TokenBudgetManager {
  if (!instance) {
    instance = new TokenBudgetManager();
  }
  return instance;
}
