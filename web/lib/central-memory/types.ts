// Central Memory Type Definitions

export interface SharedContext {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updatedAt: Date;
}

export interface ExecutionRecord {
  id: string;
  goal: string;
  spec: Record<string, unknown>;
  skillsUsed: string[];
  durationMs: number;
  status: 'success' | 'failed' | 'partial';
  results: Record<string, unknown>;
  errors: string[];
  createdAt: Date;
  userId: string;
}

export interface Pattern {
  id: string;
  keywords: string[];
  bestSkills: string[];
  successRate: number;
  uses: number;
  createdAt: Date;
}

export interface Embedding {
  id: string;
  content: string;
  embedding: number[]; // vector(1536)
  patternId: string;
  createdAt: Date;
}

export interface PatternAnalysis {
  patterns: Pattern[];
  recommendedSkills: string[];
  confidenceScore: number;
  estimatedDuration: number;
  historicalSuccessRate: number;
}

export interface ExecutionHistory {
  id: string;
  goal: string;
  spec: Record<string, unknown>;
  skillsUsed: string[];
  durationMs: number;
  status: 'success' | 'failed' | 'partial';
  results: Record<string, unknown>;
  errors: string[];
  createdAt: Date;
  userId: string;
}

export interface Gap {
  type: 'missing_skill' | 'missing_step' | 'quality_issue' | 'performance_issue';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestedFix: string;
}

export interface QualityMetrics {
  overallScore: number; // 0-100
  completeness: number;
  correctness: number;
  performance: number;
  securityScore: number;
  issues: Gap[];
}

export interface Feedback {
  gaps: Gap[];
  metrics: QualityMetrics;
  suggestions: string[];
}

export interface Decision {
  id: string;
  context: Record<string, unknown>;
  decision: string;
  outcome: 'success' | 'failed';
  timestamp: Date;
  relatedObjective: string;
}

export interface Suggestion {
  skill: string;
  reason: string;
  priority: 1 | 2 | 3;
  estimatedImpact: number;
}

export interface TokenBudget {
  provider: 'claude' | 'gpt' | 'gemini';
  maxTokensMonth: number;
  tokensSpent: number;
  tokensRemaining: number;
  lastReset: Date;
}

export interface CentralMemoryConfig {
  supabaseUrl: string;
  supabaseKey: string;
  cacheTTL?: number; // milliseconds, default 5 minutes
  enableEmbeddings?: boolean; // enable semantic search with embeddings
}

export interface ResourceAllocation {
  cpuCores: number;
  memoryMb: number;
  timeoutSeconds: number;
}

export interface OrganizedSpec {
  originalGoal: string;
  deduplicatedObjectives: string[];
  prioritizedRequirements: Requirement[];
  detectedGaps: Gap[];
  relatedPatterns: Pattern[];
  estimatedDuration: number;
  recommendedApproach: string;
}

export interface Requirement {
  id: string;
  description: string;
  priority: 'primary' | 'secondary' | 'nice_to_have';
  estimatedEffort: number;
  relatedSkills: string[];
}

export interface ImprovedSpec {
  originalSpec: Record<string, unknown>;
  improvements: Record<string, unknown>;
  reasoning: string;
  expectedQualityIncrease: number;
}
