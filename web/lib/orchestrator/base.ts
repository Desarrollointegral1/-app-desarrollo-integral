/**
 * ============================================================
 * ORCHESTRATOR BASE — Implementación Desacoplada
 * ============================================================
 *
 * Orquestador modular que usa inyección de dependencias.
 * Permite reemplazar componentes (Executor, Coordinator, Memory)
 * sin modificar el flujo principal.
 */

import { Specification, ExecutionResult, ExecutionPlan } from '@/app/api/orchestrator/types';
import {
  Agent,
  AgentResult,
  Coordinator,
  Executor,
  Memory,
  OrchestratorConfig,
  ExecutionContext,
  ConflictInfo,
  Gap,
  QualityEvaluator,
  OrchestratorListener,
} from './interfaces';

/**
 * Orchestrator base que orquesta el flujo completo
 */
export class BaseOrchestrator {
  private executor: Executor;
  private coordinator: Coordinator;
  private memory: Memory;
  private config: Required<OrchestratorConfig>;
  private qualityEvaluator?: QualityEvaluator;
  private listeners: OrchestratorListener[] = [];

  constructor(config: OrchestratorConfig) {
    this.executor = config.factory.createExecutor();
    this.memory = config.factory.createMemory();
    this.coordinator = config.factory.createCoordinator(this.executor, this.memory);

    this.config = {
      factory: config.factory,
      maxRetries: config.maxRetries ?? 3,
      maxParallelAgents: config.maxParallelAgents ?? 6,
      timeoutMs: config.timeoutMs ?? 300000,
      enableFeedbackLoop: config.enableFeedbackLoop ?? true,
    };
  }

  /**
   * Suscribirse a eventos del orchestrator
   */
  public subscribe(listener: OrchestratorListener): void {
    this.listeners.push(listener);
  }

  /**
   * Ejecutar especificación completa con reintentos
   */
  async execute(spec: Specification): Promise<ExecutionResult> {
    const executionId = this.generateExecutionId();
    const startTimeMs = Date.now();
    let attempt = 1;
    let lastResult: ExecutionResult | null = null;
    let currentSpec = spec;

    while (attempt <= this.config.maxRetries) {
      try {
        const context: ExecutionContext = {
          executionId,
          specification: currentSpec,
          plan: null as any, // será asignado abajo
          agents: [],
          memory: this.memory,
          results: [],
          startTimeMs,
          attempt,
          maxAttempts: this.config.maxRetries,
        };

        // 1. Crear plan de ejecución
        console.log(`[Orchestrator] Intento ${attempt}/${this.config.maxRetries}`);
        const plan = await this.coordinator.plan(currentSpec);
        context.plan = plan;
        this.notifyListeners('onPlanCreated', plan);

        // 2. Seleccionar agentes
        const agents = await this.coordinator.selectAgents(currentSpec);
        context.agents = agents;
        this.notifyListeners('onAgentsSelected', agents);

        // 3. Validar plan
        const validation = await this.executor.validatePlan(plan, agents);
        if (!validation.isValid) {
          throw new Error(`Plan validation failed: ${validation.errors.join(', ')}`);
        }

        // 4. Notificar inicio
        this.notifyListeners('onExecutionStarted', context);

        // 5. Ejecutar con timeout
        lastResult = await Promise.race([
          this.executor.execute(plan, agents),
          this.createTimeoutPromise(),
        ]);

        context.results = (lastResult.agents as AgentResult[]) || [];
        this.notifyListeners('onExecutionCompleted', lastResult);

        // 6. Evaluar calidad si existe evaluador
        if (this.qualityEvaluator && this.config.enableFeedbackLoop) {
          const quality = await this.qualityEvaluator.evaluate(lastResult, currentSpec);

          if (!quality.shouldRetry || attempt >= this.config.maxRetries) {
            // ✅ Éxito o máximo de intentos alcanzado
            lastResult.errors = quality.issues;
            await this.memory.recordExecution(
              executionId,
              currentSpec.objectives.join(', '),
              currentSpec,
              lastResult
            );
            return lastResult;
          }

          // 7. Detectar gaps para reintento
          const gaps = await this.qualityEvaluator.detectGaps(lastResult, currentSpec);
          if (gaps.length > 0) {
            console.log(`[Orchestrator] Detectados ${gaps.length} gaps, reintentando...`);

            // Mejorar spec basado en gaps
            currentSpec = await this.coordinator.improveSpec(currentSpec, { gaps, quality });
            attempt++;
            continue;
          }
        }

        // ✅ Éxito
        if (lastResult) {
          await this.memory.recordExecution(
            executionId,
            currentSpec.objectives.join(', '),
            currentSpec,
            lastResult
          );
        }
        return lastResult;
      } catch (error) {
        console.error(`[Orchestrator] Error en intento ${attempt}:`, error);

        if (attempt >= this.config.maxRetries) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.notifyListeners('onError', error instanceof Error ? error : new Error(String(error)));

          return {
            executionId,
            systemType: spec.systemType,
            status: 'failed',
            agents: [],
            outputs: {},
            totalTime: Date.now() - startTimeMs,
            completedAt: new Date().toISOString(),
            errors: [errorMessage],
          };
        }

        attempt++;
      }
    }

    // No debería llegar aquí, pero como fallback
    return lastResult || {
      executionId,
      systemType: spec.systemType,
      status: 'failed',
      agents: [],
      outputs: {},
      totalTime: Date.now() - startTimeMs,
      completedAt: new Date().toISOString(),
      errors: ['Max retries exceeded'],
    };
  }

  /**
   * Ejecutar sin reintentos (modo rápido)
   */
  async executeOnce(spec: Specification): Promise<ExecutionResult> {
    const executionId = this.generateExecutionId();
    const startTimeMs = Date.now();

    try {
      const plan = await this.coordinator.plan(spec);
      const agents = await this.coordinator.selectAgents(spec);

      const validation = await this.executor.validatePlan(plan, agents);
      if (!validation.isValid) {
        throw new Error(`Plan validation failed: ${validation.errors.join(', ')}`);
      }

      const result = await Promise.race([
        this.executor.execute(plan, agents),
        this.createTimeoutPromise(),
      ]);

      await this.memory.recordExecution(
        executionId,
        spec.objectives.join(', '),
        spec,
        result
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        executionId,
        systemType: spec.systemType,
        status: 'failed',
        agents: [],
        outputs: {},
        totalTime: Date.now() - startTimeMs,
        completedAt: new Date().toISOString(),
        errors: [errorMessage],
      };
    }
  }

  /**
   * Obtener recomendaciones basadas en memoria
   */
  async getSuggestions(spec: Specification): Promise<{ agentId: string; reason: string; confidence: number }[]> {
    const keywords = [...spec.objectives, ...spec.requirements, ...spec.constraints];
    const suggestions = await this.memory.getSuggestedAgents(keywords);

    return suggestions.map((s) => ({
      agentId: s.agentId,
      reason: s.reason,
      confidence: s.confidence,
    }));
  }

  /**
   * Obtener historial de patrones aprendidos
   */
  async getPatterns(keywords: string[]) {
    return this.memory.queryPatterns(keywords);
  }

  /**
   * Establecer evaluador de calidad
   */
  public setQualityEvaluator(evaluator: QualityEvaluator): void {
    this.qualityEvaluator = evaluator;
  }

  // ─── Privados ───────────────────────────────────────────────────────────────

  private notifyListeners(event: keyof OrchestratorListener, ...args: any[]): void {
    for (const listener of this.listeners) {
      const handler = listener[event] as any;
      if (handler) {
        try {
          handler.apply(listener, args);
        } catch (error) {
          console.error(`[Orchestrator] Error en listener ${event}:`, error);
        }
      }
    }
  }

  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Orchestrator timeout after ${this.config.timeoutMs}ms`)), this.config.timeoutMs)
    );
  }

  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Builder para crear orchestrator con configuración personalizada
 */
export class OrchestratorBuilder {
  private config: Partial<OrchestratorConfig> = {};
  private listeners: OrchestratorListener[] = [];

  setFactory(factory: any): this {
    this.config.factory = factory;
    return this;
  }

  setMaxRetries(max: number): this {
    this.config.maxRetries = max;
    return this;
  }

  setMaxParallelAgents(max: number): this {
    this.config.maxParallelAgents = max;
    return this;
  }

  setTimeoutMs(ms: number): this {
    this.config.timeoutMs = ms;
    return this;
  }

  enableFeedbackLoop(enable: boolean): this {
    this.config.enableFeedbackLoop = enable;
    return this;
  }

  addListener(listener: OrchestratorListener): this {
    this.listeners.push(listener);
    return this;
  }

  build(): BaseOrchestrator {
    if (!this.config.factory) {
      throw new Error('OrchestratorFactory is required');
    }

    const orchestrator = new BaseOrchestrator(this.config as OrchestratorConfig);
    for (const listener of this.listeners) {
      orchestrator.subscribe(listener);
    }

    return orchestrator;
  }
}

export default BaseOrchestrator;
