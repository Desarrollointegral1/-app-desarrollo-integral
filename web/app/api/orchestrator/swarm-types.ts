import { AgentDefinition } from './types';

export interface SwarmAgent extends AgentDefinition {
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  results?: Record<string, unknown>;
  dependenciesCompleted: boolean;
}

export interface MessageChannel {
  id: string;
  from: string; // agent id
  to: string; // agent id
  protocol: 'direct' | 'redis' | 'supabase';
  isActive: boolean;
}

export interface SwarmMessage {
  id: string;
  from: string;
  to: string;
  type: 'status' | 'data' | 'error' | 'signal';
  payload: Record<string, unknown>;
  timestamp: Date;
  retryCount: number;
}

export interface Conflict {
  id: string;
  type: 'resource' | 'dependency' | 'data_conflict';
  agentA: string;
  agentB: string;
  description: string;
  suggestedResolution?: string;
}

export interface Resolution {
  conflictId: string;
  action: 'serialize' | 'parallel_with_resource_limit' | 'skip_one' | 'merge';
  appliedAt: Date;
}

export interface ResourceAllocation {
  agentId: string;
  maxConcurrent: number;
  timeoutSeconds: number;
  retryAttempts: number;
}

export interface SwarmPlan {
  executionId: string;
  agentAssignments: {
    agentId: string;
    responsibilities: string[];
    estimatedDuration: number;
    resources: ResourceAllocation;
    canRunInParallel: string[]; // list of agent IDs that can run in parallel with this one
  }[];
  communicationChannels: MessageChannel[];
  conflictResolution: {
    scenario: string;
    resolution: string;
  }[];
  criticalPath: string[]; // sequence of agents on the critical path
  estimatedTotalTime: number; // minimum time to completion accounting for parallelism
  parallelizationFactors: {
    maxParallelAgents: number;
    bottlenecks: string[]; // agents that are bottlenecks
  };
}

export interface AgentStateChange {
  agentId: string;
  previousState: SwarmAgent['status'];
  newState: SwarmAgent['status'];
  timestamp: Date;
  reason?: string;
}

export interface SwarmMetrics {
  executionId: string;
  totalAgents: number;
  completedAgents: number;
  failedAgents: number;
  activeAgents: number;
  averageAgentDuration: number;
  longestRunningAgent?: string;
  shortestRunningAgent?: string;
  estimatedTimeRemaining: number;
}
