import { v4 as uuid } from 'uuid';
import {
  Specification,
  ExecutionPlan,
  AgentDefinition,
  SystemType,
  AgentPriority,
} from './types';
import { SkillPlan } from './types';
import { CORE_AGENTS, SYSTEM_SEQUENCES } from './constants';
import { mapSpecificationToSkills } from './skill-mapper';
import { SwarmCoordinator } from './swarm-coordinator';
import { getAgentLoader, type DynamicAgent } from '@/lib/agent-loader';

export async function createExecutionPlanAsync(
  spec: Specification,
  skillPlan: SkillPlan
): Promise<ExecutionPlan> {
  const executionId = uuid();
  const systemType: SystemType = spec.systemType;
  const agentLoader = getAgentLoader();

  try {
    // Cargar agentes dinámicamente
    const dynamicAgents = await agentLoader.loadAgentsBySystem(systemType);

    // Convertir agentes dinámicos a AgentDefinition
    const agents: AgentDefinition[] = dynamicAgents.map((da) => {
      const priorityNum = typeof da.priority === 'number' ? da.priority : 2;
      const priority = Math.min(3, Math.max(1, priorityNum)) as AgentPriority;
      return {
        id: da.id,
        name: da.name,
        description: da.description,
        skills: da.skills,
        priority,
        dependencies: da.dependencies || [],
        parallel: da.parallel || false,
      };
    });

    const basePlan: ExecutionPlan = {
      executionId,
      systemType,
      agents,
      estimatedTime: skillPlan.estimatedTime,
      estimatedTokens: agents.length * 2000 + skillPlan.skills.length * 500,
      createdAt: new Date().toISOString(),
    };

    // Usar SwarmCoordinator para optimizar paralelismo
    try {
      const coordinator = new SwarmCoordinator(executionId);
      const swarmPlan = coordinator.createCoordinationPlan(basePlan);

      return {
        ...basePlan,
        estimatedTime: Math.round(swarmPlan.estimatedTotalTime),
        parallelizationInfo: {
          maxParallel: swarmPlan.parallelizationFactors.maxParallelAgents,
          bottlenecks: swarmPlan.parallelizationFactors.bottlenecks,
          criticalPathLength: swarmPlan.criticalPath.length,
        } as any,
      };
    } catch (error) {
      console.warn('SwarmCoordinator failed, using base plan:', error);
      return basePlan;
    }
  } catch (error) {
    console.warn('Dynamic agent loading failed, falling back to hardcoded:', error);
    // Fallback to original createExecutionPlan logic
    return createExecutionPlan(spec, skillPlan);
  }
}

export function createExecutionPlan(
  spec: Specification,
  skillPlan: SkillPlan
): ExecutionPlan {
  const executionId = uuid();
  const systemType: SystemType = spec.systemType;
  const sequenceAgents = SYSTEM_SEQUENCES[systemType].agents;

  // Crear agentes para la ejecución
  const agents: AgentDefinition[] = [];
  const processedAgents = new Set<string>();

  // Agregar agentes en orden secuencial del sistema
  sequenceAgents.forEach((agentId) => {
    if (processedAgents.has(agentId)) return;

    const baseAgent = CORE_AGENTS[agentId];
    if (!baseAgent) return;

    // Filtrar skills del agente basado en el skillPlan
    const agentSkills = baseAgent.skills.filter((skill) =>
      skillPlan.skills.includes(skill)
    );

    if (agentSkills.length === 0) {
      return; // Skip si no tiene skills relevantes
    }

    const agent: AgentDefinition = {
      ...baseAgent,
      skills: agentSkills.length > 0 ? agentSkills : baseAgent.skills,
    };

    agents.push(agent);
    processedAgents.add(agentId);
  });

  // Crear base ExecutionPlan
  const basePlan: ExecutionPlan = {
    executionId,
    systemType,
    agents,
    estimatedTime: skillPlan.estimatedTime,
    estimatedTokens: agents.length * 2000 + skillPlan.skills.length * 500,
    createdAt: new Date().toISOString(),
  };

  // Usar SwarmCoordinator para optimizar paralelismo
  try {
    const coordinator = new SwarmCoordinator(executionId);
    const swarmPlan = coordinator.createCoordinationPlan(basePlan);

    // Mejorar estimaciones con información del swarm
    return {
      ...basePlan,
      estimatedTime: Math.round(swarmPlan.estimatedTotalTime),
      // Metadata adicional disponible en swarmPlan
      parallelizationInfo: {
        maxParallel: swarmPlan.parallelizationFactors.maxParallelAgents,
        bottlenecks: swarmPlan.parallelizationFactors.bottlenecks,
        criticalPathLength: swarmPlan.criticalPath.length,
      } as any,
    };
  } catch (error) {
    console.warn('SwarmCoordinator failed, using base plan:', error);
    return basePlan;
  }
}

export function calculateAgentOrder(agents: AgentDefinition[]) {
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const ordered: AgentDefinition[] = [];
  const processed = new Set<string>();
  const processing = new Set<string>();

  function visit(agentId: string) {
    if (processed.has(agentId)) return;
    if (processing.has(agentId)) {
      throw new Error(`Circular dependency detected: ${agentId}`);
    }

    const agent = agentMap.get(agentId);
    if (!agent) return;

    processing.add(agentId);

    // Visit dependencies first
    agent.dependencies.forEach((dep) => {
      if (agentMap.has(dep)) {
        visit(dep);
      }
    });

    processing.delete(agentId);
    processed.add(agentId);
    ordered.push(agent);
  }

  agents.forEach((agent) => {
    visit(agent.id);
  });

  return ordered;
}

export function groupAgentsForExecution(
  agents: AgentDefinition[]
): AgentDefinition[][] {
  const ordered = calculateAgentOrder(agents);
  const groups: AgentDefinition[][] = [];
  const processed = new Set<string>();

  ordered.forEach((agent) => {
    // Buscar si todas las dependencias ya están procesadas
    const depsReady = agent.dependencies.every((dep) =>
      processed.has(dep)
    );

    if (depsReady) {
      // Crear un nuevo grupo si este agente no puede ejecutarse en paralelo con el anterior
      const lastGroup = groups[groups.length - 1];
      if (
        lastGroup &&
        lastGroup.some(
          (a) =>
            agent.dependencies.includes(a.id) || a.dependencies.includes(agent.id)
        )
      ) {
        groups.push([agent]);
      } else if (lastGroup && lastGroup[0].parallel && agent.parallel) {
        lastGroup.push(agent);
      } else {
        groups.push([agent]);
      }

      processed.add(agent.id);
    }
  });

  return groups;
}
