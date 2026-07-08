/**
 * ============================================================
 * CHARLES ADAPTER — Reemplazo de Orchestrator v2 Legacy
 * ============================================================
 *
 * Propósito: Adaptador que traduce requests del formato orchestrator
 * hacia el sistema unificado de Charles/Coordinador Maestro.
 *
 * Diferencia:
 *   orchestrator v2 (legacy) → fragmentado, errores TypeScript
 *   charles (v3)             → unificado, 271 skills, auto-selección
 */

import { Specification, ExecutionPlan, ExecutionResult } from '@/app/api/orchestrator/types';
import { getUnifiedLLMAdapter } from './llm/unified-llm-adapter';
import { getCentralMemory } from './central-memory';

export interface CharlesConfig {
  autoSelectSkills: boolean;  // Si true, Charles elige skills automáticamente
  maxParallelAgents: number;  // Máximo de agentes en paralelo
  timeoutMs: number;           // Timeout total
}

export class CharlesAdapter {
  private config: CharlesConfig;
  private centralMemory = getCentralMemory();
  private llmAdapter = getUnifiedLLMAdapter();

  constructor(config: Partial<CharlesConfig> = {}) {
    this.config = {
      autoSelectSkills: true,
      maxParallelAgents: 6,
      timeoutMs: 300000, // 5 min
      ...config,
    };
  }

  /**
   * Traduce una Specification de orchestrator al flujo de Charles
   * y retorna un ExecutionResult compatible
   */
  async executeTask(spec: Specification): Promise<ExecutionResult> {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    try {
      // 1. Guardar en Central Memory para aprendizaje
      await this.centralMemory.recordExecution({
        id: executionId,
        goal: spec.objectives.join(', '),
        spec: spec as unknown as Record<string, unknown>,
        status: 'success',
        durationMs: 0,
        skillsUsed: [],
        results: {},
        errors: [],
        createdAt: new Date(),
        userId: 'anonymous',
      });

      // 2. Seleccionar skills automáticamente si está habilitado
      const selectedSkills = this.config.autoSelectSkills
        ? await this.autoSelectSkills(spec)
        : spec.suggestedSkills || [];

      // 3. Crear plan de ejecución
      const plan: ExecutionPlan = {
        executionId,
        systemType: spec.systemType,
        agents: [],
        estimatedTime: spec.estimatedTime || 60000,
        estimatedTokens: 10000,
        createdAt: new Date().toISOString(),
      };

      // 4. Ejecutar en paralelo (simulado — en producción llamaría a Charles API)
      const agents = await this.executeAgentsInParallel(selectedSkills, spec);
      plan.agents = agents.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        skills: a.skills,
        priority: a.priority as 1 | 2 | 3,
        dependencies: a.dependencies,
        parallel: true,
      }));

      const totalTime = Date.now() - startTime;

      // 5. Retornar resultado compatible con ExecutionResult
      const result: ExecutionResult = {
        executionId,
        systemType: spec.systemType,
        status: 'completed',
        agents: agents.map((a) => ({
          executionId,
          agentId: a.id,
          status: 'completed',
          progress: 100,
          results: a.output,
          completedAt: new Date().toISOString(),
        })),
        outputs: this.aggregateOutputs(agents),
        totalTime,
        completedAt: new Date().toISOString(),
        errors: [],
      };

      // 6. Guardar en Central Memory
      await this.centralMemory.recordExecution({
        id: executionId,
        goal: spec.objectives.join(', '),
        spec: spec as unknown as Record<string, unknown>,
        status: 'success',
        durationMs: totalTime,
        skillsUsed: selectedSkills,
        results: this.aggregateOutputs(agents),
        errors: [],
        createdAt: new Date(),
        userId: 'anonymous',
      });

      return result;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        executionId,
        systemType: spec.systemType,
        status: 'failed',
        agents: [],
        outputs: {},
        totalTime,
        completedAt: new Date().toISOString(),
        errors: [errorMessage],
      };
    }
  }

  /**
   * Auto-selecciona skills basado en keywords de la Specification
   */
  private async autoSelectSkills(spec: Specification): Promise<string[]> {
    const fullText = [
      ...spec.objectives,
      ...spec.constraints,
      ...spec.requirements,
    ]
      .join(' ')
      .toLowerCase();

    // Matriz simplificada de skills por keywords
    const skillMatrix: Record<string, string[]> = {
      diseño: ['design-taste-frontend', 'high-end-visual-design', 'ckm-design'],
      velocidad: ['performance-optimizer', 'performance-analyzer'],
      seguridad: ['security-audit', 'security-manager'],
      código: ['code-review', 'code-simplifier'],
      video: ['media-specialist'],
      contenido: ['content-specialist', 'ux-copy'],
      testing: ['test-gaps', 'verification-quality-assurance'],
    };

    const selected = new Set<string>();

    Object.entries(skillMatrix).forEach(([keyword, skills]) => {
      if (fullText.includes(keyword)) {
        skills.forEach((s) => selected.add(s));
      }
    });

    return Array.from(selected);
  }

  /**
   * Ejecuta múltiples agentes en paralelo
   */
  private async executeAgentsInParallel(
    skills: string[],
    spec: Specification
  ): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      skills: string[];
      priority: 1 | 2 | 3;
      dependencies: string[];
      output: Record<string, unknown>;
    }>
  > {
    // Simulación — en producción esto llamaría a Charles API real
    return skills.slice(0, this.config.maxParallelAgents).map((skill, idx) => ({
      id: `agent-${idx}`,
      name: skill,
      description: `Agent para ${skill}`,
      skills: [skill],
      priority: (Math.min(3, idx + 1) as 1 | 2 | 3),
      dependencies: [],
      output: {
        skill,
        executed: true,
        timestamp: new Date().toISOString(),
      },
    }));
  }

  /**
   * Agrega outputs de múltiples agentes
   */
  private aggregateOutputs(
    agents: Array<{ id: string; output: Record<string, unknown> }>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    agents.forEach((agent) => {
      result[agent.id] = agent.output;
    });

    return result;
  }

  /**
   * Genera un ID único para ejecución
   */
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton para acceso global
let adapter: CharlesAdapter | null = null;

export function getCharlesAdapter(config?: Partial<CharlesConfig>): CharlesAdapter {
  if (!adapter) {
    adapter = new CharlesAdapter(config);
  }
  return adapter;
}
