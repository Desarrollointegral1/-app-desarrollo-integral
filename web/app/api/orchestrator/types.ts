export type SystemType = 1 | 2 | 3 | 4;
export type AgentPriority = 1 | 2 | 3;

export interface Specification {
  objectives: string[];
  constraints: string[];
  requirements: string[];
  systemType: SystemType;
  estimatedComplexity: 'low' | 'medium' | 'high';
  estimatedTime?: number;
  // Central Memory enrichment
  previousExecutions?: Array<{
    goal: string;
    status: 'success' | 'failed' | 'partial';
    durationMs: number;
    skillsUsed: string[];
  }>;
  suggestedSkills?: string[];
  historicalSuccessRate?: number;
}

export interface SkillPlan {
  skills: string[];
  priorities: Record<string, AgentPriority>;
  dependencies: Record<string, string[]>;
  estimatedTime: number;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  skills: string[];
  priority: AgentPriority;
  dependencies: string[];
  parallel: boolean;
}

export interface ExecutionPlan {
  executionId: string;
  systemType: SystemType;
  agents: AgentDefinition[];
  estimatedTime: number;
  estimatedTokens: number;
  createdAt: string;
  parallelizationInfo?: {
    maxParallelAgents: number;
    criticalPath: string[];
    estimatedSpeedup: number;
  };
}

export interface ExecutionProgress {
  executionId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string;
  results?: Record<string, unknown>;
  completedAt?: string;
}

export interface ExecutionResult {
  executionId: string;
  systemType: SystemType;
  status: 'completed' | 'failed';
  agents: ExecutionProgress[];
  outputs: Record<string, unknown>;
  totalTime: number;
  completedAt: string;
  errors?: string[];
  parallelizationInfo?: {
    maxParallelAgents: number;
    actualParallel: number;
    criticalPath: string[];
  };
}
