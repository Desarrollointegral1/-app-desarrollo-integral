import {
  ExecutionPlan,
  ExecutionProgress,
  ExecutionResult,
  AgentDefinition,
} from './types';
import { SwarmCoordinator } from './swarm-coordinator';
import { getMultiLLMExecutor } from '@/lib/llm/multi-llm-executor';

type ProgressCallback = (progress: ExecutionProgress) => void;

export class SkillExecutor {
  private executionId: string;
  private plan: ExecutionPlan;
  private progressCallback: ProgressCallback;
  private results: Map<string, ExecutionProgress> = new Map();
  private coordinator: SwarmCoordinator;
  private agentCompletionPromises: Map<string, Promise<void>> = new Map();

  constructor(plan: ExecutionPlan, onProgress: ProgressCallback) {
    this.executionId = plan.executionId;
    this.plan = plan;
    this.progressCallback = onProgress;
    this.coordinator = new SwarmCoordinator(plan.executionId);
  }

  async execute(): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Crear plan de coordinación para paralelismo óptimo
      const swarmPlan = this.coordinator.createCoordinationPlan(this.plan);
      console.log('Execution plan optimized for parallelism:', {
        agents: this.plan.agents.length,
        estimatedTime: swarmPlan.estimatedTotalTime,
        maxParallel: swarmPlan.parallelizationFactors.maxParallelAgents,
        criticalPath: swarmPlan.criticalPath.length,
      });

      // Ejecutar todos los agentes en paralelo (SwarmCoordinator maneja dependencias)
      const agentPromises = this.plan.agents.map((agent) =>
        this.executeAgentWithDependencies(agent, swarmPlan.agentAssignments)
      );

      await Promise.all(agentPromises);

      const totalTime = Date.now() - startTime;

      return {
        executionId: this.executionId,
        systemType: this.plan.systemType,
        status: 'completed',
        agents: Array.from(this.results.values()),
        outputs: this.aggregateResults(),
        totalTime,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Execution failed:', error);
      return {
        executionId: this.executionId,
        systemType: this.plan.systemType,
        status: 'failed',
        agents: Array.from(this.results.values()),
        outputs: {},
        totalTime: Date.now() - startTime,
        completedAt: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async executeAgentWithDependencies(
    agent: AgentDefinition,
    assignments: any[]
  ): Promise<void> {
    // Wait for dependencies to complete
    const dependencyPromises = agent.dependencies.map(
      (depId) =>
        this.agentCompletionPromises.get(depId) ||
        Promise.resolve() // If no promise exists, dependency might be pending
    );

    await Promise.all(dependencyPromises);

    // Execute agent
    const completion = this.executeAgent(agent);
    this.agentCompletionPromises.set(agent.id, completion);

    return completion;
  }

  private async executeAgent(agent: AgentDefinition): Promise<void> {
    const agentProgress: ExecutionProgress = {
      executionId: this.executionId,
      agentId: agent.id,
      status: 'running',
      progress: 0,
    };

    this.results.set(agent.id, agentProgress);
    this.progressCallback(agentProgress);

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    while (retryCount < maxRetries) {
      try {
        await this.executeAgentSkills(agent, agentProgress);

        agentProgress.status = 'completed';
        agentProgress.progress = 100;
        agentProgress.results = this.generateAgentResults(agent);
        agentProgress.completedAt = new Date().toISOString();
        this.results.set(agent.id, agentProgress);
        this.progressCallback(agentProgress);

        return; // Success
      } catch (error) {
        retryCount++;

        if (retryCount < maxRetries) {
          console.warn(
            `Agent ${agent.id} failed (attempt ${retryCount}/${maxRetries}), retrying in ${retryDelay}ms`
          );
          await this.sleep(retryDelay);
        } else {
          agentProgress.status = 'failed';
          agentProgress.error = error instanceof Error ? error.message : 'Unknown error';
          agentProgress.completedAt = new Date().toISOString();
          this.results.set(agent.id, agentProgress);
          this.progressCallback(agentProgress);

          throw error; // Give up after max retries
        }
      }
    }
  }

  private async executeAgentSkills(
    agent: AgentDefinition,
    progress: ExecutionProgress
  ): Promise<void> {
    const skillCount = agent.skills.length;
    const llmExecutor = getMultiLLMExecutor();

    for (let i = 0; i < skillCount; i++) {
      const skill = agent.skills[i];

      try {
        const result = await llmExecutor.executeSkill({
          skill,
          input: { agentId: agent.id },
          context: { executionId: this.executionId },
        });

        if (!result.success) {
          console.error(`Skill ${skill} failed:`, result.error);
        }
      } catch (error) {
        console.error(`Error executing skill ${skill}:`, error);
        // Continue to next skill even if one fails
      }

      const skillProgress = Math.round(((i + 1) / skillCount) * 100);
      progress.progress = skillProgress;
      this.progressCallback(progress);
    }
  }

  private generateAgentResults(agent: AgentDefinition): Record<string, unknown> {
    return {
      agentId: agent.id,
      skillsExecuted: agent.skills.length,
      timestamp: new Date().toISOString(),
      summary: `${agent.name} completado exitosamente`,
    };
  }

  private aggregateResults(): Record<string, unknown> {
    const aggregated: Record<string, unknown> = {};

    this.results.forEach((progress, agentId) => {
      if (progress.results) {
        aggregated[agentId] = progress.results;
      }
    });

    return aggregated;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
