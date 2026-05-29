/**
 * ============================================================
 * ORCHESTRATOR INTERFACES — Dependency Injection
 * ============================================================
 *
 * Interfaces abstractas que permiten inyectar dependencias
 * en el orchestrator, desacoplando la arquitectura.
 *
 * Patrón: Dependency Injection + Strategy Pattern
 */

import { Specification, ExecutionResult, ExecutionPlan } from '@/app/api/orchestrator/types';

/**
 * Representa un agente ejecutable individual
 */
export interface Agent {
  id: string;
  name: string;
  description: string;
  skills: string[];
  priority: 1 | 2 | 3;
  dependencies: string[];
  execute(spec: Specification): Promise<AgentResult>;
  validate(spec: Specification): ValidationResult;
}

/**
 * Resultado de ejecución de un agente
 * Compatible con ExecutionProgress del orchestrator/types
 */
export interface AgentResult {
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  results?: Record<string, unknown>;
  error?: string;
  completedAt?: string;
}

/**
 * Validación pre-ejecución de un agente
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Ejecutor responsable de correr agentes en el orden correcto
 */
export interface Executor {
  execute(plan: ExecutionPlan, agents: Agent[]): Promise<ExecutionResult>;
  validatePlan(plan: ExecutionPlan, agents: Agent[]): Promise<ValidationResult>;
  canParallelize(agentIds: string[]): boolean;
}

/**
 * Coordinador que orquesta el flujo de ejecución
 * - Selecciona agentes
 * - Crea el plan
 * - Ejecuta con el executor
 * - Maneja retroalimentación
 */
export interface Coordinator {
  plan(spec: Specification): Promise<ExecutionPlan>;
  selectAgents(spec: Specification): Promise<Agent[]>;
  reconcileConflicts(results: AgentResult[]): AgentResult[];
  shouldRetry(result: ExecutionResult): boolean;
  improveSpec(spec: Specification, feedback: unknown): Promise<Specification>;
}

/**
 * Memoria central que persiste aprendizajes
 */
export interface Memory {
  recordExecution(
    executionId: string,
    goal: string,
    spec: Specification,
    result: ExecutionResult
  ): Promise<void>;
  recordDecision(decisionId: string, context: Record<string, unknown>, outcome: 'success' | 'failed'): Promise<void>;
  queryPatterns(keywords: string[]): Promise<PatternInfo[]>;
  getSuggestedAgents(keywords: string[]): Promise<AgentSuggestion[]>;
}

/**
 * Información de patrón aprendido
 */
export interface PatternInfo {
  keywords: string[];
  successRate: number;
  agentCount: number;
  avgDurationMs: number;
  examples: Array<{ specHash: string; successRate: number }>;
}

/**
 * Sugerencia de agente basada en aprendizaje
 */
export interface AgentSuggestion {
  agentId: string;
  confidence: number; // 0-1
  reason: string;
  historicalSuccessRate: number;
  recommendedPosition: 'primary' | 'secondary' | 'fallback';
}

/**
 * Factory para inyectar implementaciones
 */
export interface OrchestratorFactory {
  createExecutor(): Executor;
  createCoordinator(executor: Executor, memory: Memory): Coordinator;
  createMemory(): Memory;
  createAgents(spec: Specification): Promise<Agent[]>;
}

/**
 * Configuración del orchestrator con dependencias inyectables
 */
export interface OrchestratorConfig {
  factory: OrchestratorFactory;
  maxRetries?: number;
  maxParallelAgents?: number;
  timeoutMs?: number;
  enableFeedbackLoop?: boolean;
}

/**
 * Contexto ejecutivo para pasar entre componentes
 */
export interface ExecutionContext {
  executionId: string;
  specification: Specification;
  plan: ExecutionPlan;
  agents: Agent[];
  memory: Memory;
  results: AgentResult[];
  startTimeMs: number;
  attempt: number;
  maxAttempts: number;
}

/**
 * Manejador de conflictos entre resultados de agentes
 */
export interface ConflictResolver {
  detectConflicts(results: AgentResult[]): ConflictInfo[];
  resolve(conflict: ConflictInfo): AgentResult;
}

/**
 * Información sobre un conflicto detectado
 */
export interface ConflictInfo {
  type: 'contradiction' | 'incompatibility' | 'ordering_issue' | 'resource_conflict';
  affectedAgents: string[];
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestedResolution: string;
}

/**
 * Evaluador de calidad de resultados
 */
export interface QualityEvaluator {
  evaluate(result: ExecutionResult, spec: Specification): Promise<QualityScore>;
  detectGaps(result: ExecutionResult, spec: Specification): Promise<Gap[]>;
}

/**
 * Score de calidad de ejecución
 */
export interface QualityScore {
  overallScore: number; // 0-100
  completeness: number; // 0-100
  correctness: number; // 0-100
  performance: number; // 0-100
  issues: string[];
  shouldRetry: boolean;
}

/**
 * Gap detectado en el resultado
 */
export interface Gap {
  type: 'missing_requirement' | 'incomplete_feature' | 'quality_issue' | 'performance_issue';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestedAction: string;
}

/**
 * Listener de eventos del orchestrator
 */
export interface OrchestratorListener {
  onPlanCreated?(plan: ExecutionPlan): void;
  onAgentsSelected?(agents: Agent[]): void;
  onExecutionStarted?(context: ExecutionContext): void;
  onAgentCompleted?(result: AgentResult): void;
  onConflictDetected?(conflict: ConflictInfo): void;
  onExecutionCompleted?(result: ExecutionResult): void;
  onError?(error: Error): void;
}
