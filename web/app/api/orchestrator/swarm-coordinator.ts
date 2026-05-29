import { v4 as uuid } from 'uuid';
import { ExecutionPlan } from './types';
import {
  SwarmPlan,
  SwarmAgent,
  MessageChannel,
  Conflict,
  Resolution,
  SwarmMessage,
  AgentStateChange,
  SwarmMetrics,
} from './swarm-types';

export class SwarmCoordinator {
  private executionId: string;
  private agents: Map<string, SwarmAgent> = new Map();
  private messageQueue: SwarmMessage[] = [];
  private stateChangeHistory: AgentStateChange[] = [];
  private conflicts: Conflict[] = [];
  private resolutions: Resolution[] = [];
  private startTime: Date = new Date();

  constructor(executionId: string) {
    this.executionId = executionId;
  }

  /**
   * Create coordination plan from execution plan
   */
  createCoordinationPlan(plan: ExecutionPlan): SwarmPlan {
    // Initialize swarm agents
    plan.agents.forEach((agent) => {
      const swarmAgent: SwarmAgent = {
        ...agent,
        status: 'pending',
        dependenciesCompleted: agent.dependencies.length === 0,
      };
      this.agents.set(agent.id, swarmAgent);
    });

    // Calculate critical path using topological sort
    const criticalPath = this.calculateCriticalPath();

    // Setup communication channels
    const channels = this.setupCommunication();

    // Determine parallelization
    const agentAssignments = plan.agents.map((agent) => ({
      agentId: agent.id,
      responsibilities: agent.skills,
      estimatedDuration: 5 * 60 * 1000, // 5 min per agent default
      resources: {
        agentId: agent.id,
        maxConcurrent:
          plan.agents.filter((a) => a.parallel).length > 1 ? 2 : 1,
        timeoutSeconds: 300,
        retryAttempts: 3,
      },
      canRunInParallel: plan.agents
        .filter(
          (a) =>
            a.id !== agent.id &&
            !agent.dependencies.includes(a.id) &&
            !a.dependencies.includes(agent.id) &&
            a.parallel
        )
        .map((a) => a.id),
    }));

    // Calculate total time with parallelism
    const totalTime = this.calculateEstimatedTime(agentAssignments, criticalPath);

    return {
      executionId: this.executionId,
      agentAssignments,
      communicationChannels: channels,
      conflictResolution: [],
      criticalPath,
      estimatedTotalTime: totalTime,
      parallelizationFactors: {
        maxParallelAgents: Math.max(
          1,
          plan.agents.filter((a) => a.parallel).length
        ),
        bottlenecks: criticalPath, // Critical path agents are bottlenecks
      },
    };
  }

  /**
   * Setup communication channels between agents
   */
  setupCommunication(): MessageChannel[] {
    const channels: MessageChannel[] = [];

    this.agents.forEach((agent, agentId) => {
      agent.dependencies.forEach((depId) => {
        channels.push({
          id: `${depId}->${agentId}`,
          from: depId,
          to: agentId,
          protocol: 'direct', // Will upgrade to redis/supabase if needed
          isActive: false,
        });
      });
    });

    return channels;
  }

  /**
   * Monitor execution and handle state changes
   */
  async monitorExecution(
    getAgentStatus: (agentId: string) => Promise<SwarmAgent>
  ): Promise<void> {
    let allCompleted = false;
    const maxWaitTime = 30 * 60 * 1000; // 30 minutes max
    const startTime = Date.now();

    while (!allCompleted && Date.now() - startTime < maxWaitTime) {
      allCompleted = true;

      for (const [agentId, agent] of this.agents.entries()) {
        // Check if dependencies are completed
        const depsCompleted = agent.dependencies.every(
          (depId) => this.agents.get(depId)?.status === 'completed'
        );

        if (depsCompleted && agent.status === 'pending') {
          // Ready to run
          await this.updateAgentStatus(agentId, 'running');
        }

        if (
          agent.status === 'running' ||
          agent.status === 'pending' ||
          agent.status === 'failed'
        ) {
          allCompleted = false;
        }
      }

      // Wait before next check
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!allCompleted) {
      console.warn(
        'SwarmCoordinator: Max wait time exceeded, some agents not completed'
      );
    }
  }

  /**
   * Update agent status and track changes
   */
  async updateAgentStatus(
    agentId: string,
    newStatus: SwarmAgent['status'],
    error?: string
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const previousStatus = agent.status;

    agent.status = newStatus;
    if (newStatus === 'running') {
      agent.startedAt = new Date();
    } else if (newStatus === 'completed' || newStatus === 'failed') {
      agent.completedAt = new Date();
    }

    if (error) {
      agent.error = error;
    }

    // Record state change
    this.stateChangeHistory.push({
      agentId,
      previousState: previousStatus,
      newState: newStatus,
      timestamp: new Date(),
      reason: error,
    });

    // Check for dependent agents that can now run
    this.agents.forEach((depAgent, depAgentId) => {
      const dependencies = this.agents.get(agentId)?.dependencies || [];
      if (
        dependencies.includes(depAgentId) &&
        depAgent.status === 'pending' &&
        this.areAllDependenciesCompleted(depAgentId)
      ) {
        // Signal dependent agent to start
        this.sendMessage({
          id: uuid(),
          from: agentId,
          to: depAgentId,
          type: 'signal',
          payload: { signal: 'start' },
          timestamp: new Date(),
          retryCount: 0,
        });
      }
    });
  }

  /**
   * Check if all dependencies of an agent are completed
   */
  private areAllDependenciesCompleted(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    return agent.dependencies.every(
      (depId) => this.agents.get(depId)?.status === 'completed'
    );
  }

  /**
   * Send message between agents
   */
  sendMessage(message: SwarmMessage): void {
    this.messageQueue.push(message);
  }

  /**
   * Get messages for an agent
   */
  getMessagesForAgent(agentId: string): SwarmMessage[] {
    return this.messageQueue.filter((msg) => msg.to === agentId);
  }

  /**
   * Detect conflicts between agents
   */
  detectConflicts(): Conflict[] {
    const detected: Conflict[] = [];

    // Check for circular dependencies
    this.agents.forEach((agent, agentId) => {
      const visited = new Set<string>();
      if (this.hasCyclicDependency(agentId, visited)) {
        detected.push({
          id: uuid(),
          type: 'dependency',
          agentA: agentId,
          agentB: '', // Unknown other agent
          description: `Circular dependency detected for agent ${agentId}`,
        });
      }
    });

    // Check for resource conflicts
    const activeAgents = Array.from(this.agents.values()).filter(
      (a) => a.status === 'running'
    );
    if (activeAgents.length > 3) {
      detected.push({
        id: uuid(),
        type: 'resource',
        agentA: activeAgents[0].id,
        agentB: activeAgents[1].id,
        description: `Too many concurrent agents: ${activeAgents.length}`,
        suggestedResolution: 'Throttle parallelism',
      });
    }

    return detected;
  }

  /**
   * Check for cyclic dependencies
   */
  private hasCyclicDependency(
    agentId: string,
    visited: Set<string>
  ): boolean {
    if (visited.has(agentId)) return true;
    visited.add(agentId);

    const agent = this.agents.get(agentId);
    if (!agent) return false;

    for (const depId of agent.dependencies) {
      if (this.hasCyclicDependency(depId, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Resolve detected conflicts
   */
  resolveConflicts(conflicts: Conflict[]): Resolution[] {
    const resolutions: Resolution[] = [];

    conflicts.forEach((conflict) => {
      let resolution: Resolution;

      switch (conflict.type) {
        case 'dependency':
          // Serialize the conflicting agents
          resolution = {
            conflictId: conflict.id,
            action: 'serialize',
            appliedAt: new Date(),
          };
          break;

        case 'resource':
          // Limit concurrent execution
          resolution = {
            conflictId: conflict.id,
            action: 'parallel_with_resource_limit',
            appliedAt: new Date(),
          };
          break;

        default:
          resolution = {
            conflictId: conflict.id,
            action: 'skip_one',
            appliedAt: new Date(),
          };
      }

      resolutions.push(resolution);
      this.resolutions.push(resolution);
    });

    return resolutions;
  }

  /**
   * Rollback execution
   */
  async rollback(executionId: string): Promise<void> {
    console.log(`Rolling back execution ${executionId}`);

    // Mark running agents as rolled back
    this.agents.forEach((agent) => {
      if (agent.status === 'running') {
        agent.status = 'failed';
        agent.error = 'Rolled back';
      }
    });

    // Clear message queue
    this.messageQueue = [];

    console.log(`Rollback completed for execution ${executionId}`);
  }

  /**
   * Calculate critical path using topological sort
   */
  private calculateCriticalPath(): string[] {
    const path: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const dfs = (agentId: string) => {
      if (visited.has(agentId)) return;
      if (visiting.has(agentId)) return; // Cycle detection

      visiting.add(agentId);

      const agent = this.agents.get(agentId);
      if (agent) {
        agent.dependencies.forEach((depId) => dfs(depId));
      }

      visiting.delete(agentId);
      visited.add(agentId);
      path.push(agentId);
    };

    // Start from agents with no dependencies
    this.agents.forEach((agent, agentId) => {
      if (agent.dependencies.length === 0) {
        dfs(agentId);
      }
    });

    return path.reverse();
  }

  /**
   * Calculate estimated total time accounting for parallelism
   */
  private calculateEstimatedTime(
    assignments: SwarmPlan['agentAssignments'],
    criticalPath: string[]
  ): number {
    const criticalPathTime = assignments
      .filter((a) => criticalPath.includes(a.agentId))
      .reduce((sum, a) => sum + a.estimatedDuration, 0);

    return criticalPathTime; // Critical path is the bottleneck
  }

  /**
   * Get current swarm metrics
   */
  getMetrics(): SwarmMetrics {
    const completed = Array.from(this.agents.values()).filter(
      (a) => a.status === 'completed'
    ).length;
    const failed = Array.from(this.agents.values()).filter(
      (a) => a.status === 'failed'
    ).length;
    const active = Array.from(this.agents.values()).filter(
      (a) => a.status === 'running'
    ).length;

    const durations = Array.from(this.agents.values())
      .filter((a) => a.startedAt && a.completedAt)
      .map((a) =>
        a.completedAt!.getTime() - a.startedAt!.getTime()
      );

    const avgDuration =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    return {
      executionId: this.executionId,
      totalAgents: this.agents.size,
      completedAgents: completed,
      failedAgents: failed,
      activeAgents: active,
      averageAgentDuration: avgDuration,
      estimatedTimeRemaining:
        (this.agents.size - completed) * avgDuration,
    };
  }
}
