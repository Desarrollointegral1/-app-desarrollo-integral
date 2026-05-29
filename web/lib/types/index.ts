/**
 * ============================================================
 * CENTRAL TYPE DEFINITIONS
 * ============================================================
 *
 * Fuente única de verdad para tipos, interfaces, y enums
 * utilizados en toda la aplicación.
 *
 * Importar desde aquí en lugar de archivos individuales
 * para mantener consistencia y facilitar cambios globales.
 */

// ─── System & Configuration ───────────────────────────────────────────────────

export type SystemType = 1 | 2 | 3 | 4;
export type AgentPriority = 1 | 2 | 3;

/**
 * Niveles de complejidad estimada
 */
export type ComplexityLevel = 'low' | 'medium' | 'high';

/**
 * Estado de ejecución de agentes
 */
export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Estado de resultado de ejecución
 */
export type ExecutionStatus = 'completed' | 'failed' | 'partial';

/**
 * Estilos de producción de video
 */
export type ProductionStyle = 'gym' | 'corporate' | 'social';

/**
 * Tipos de transición de video
 */
export type TransitionType = 'fade' | 'dissolve' | 'slideright' | 'slideleft' | 'wipeleft' | 'wiperight' | 'smoothleft';

/**
 * Estilos de color grading
 */
export type ColorGrade = 'warm' | 'cool' | 'neutral' | 'vibrant' | 'cinematic';

/**
 * Prioridad de requisitos
 */
export type RequirementPriority = 'primary' | 'secondary' | 'nice_to_have';

/**
 * Tipos de gaps detectados
 */
export type GapType = 'missing_skill' | 'missing_step' | 'quality_issue' | 'performance_issue' | 'missing_requirement' | 'incomplete_feature';

/**
 * Severidad de issues
 */
export type Severity = 'low' | 'medium' | 'high';

/**
 * Tipos de conflictos en orchestrator
 */
export type ConflictType = 'contradiction' | 'incompatibility' | 'ordering_issue' | 'resource_conflict';

// ─── Orchestrator & Execution ──────────────────────────────────────────────────

export interface Specification {
  objectives: string[];
  constraints: string[];
  requirements: string[];
  systemType: SystemType;
  estimatedComplexity: ComplexityLevel;
  estimatedTime?: number;
  // Central Memory enrichment
  previousExecutions?: Array<{
    goal: string;
    status: ExecutionStatus;
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
  status: AgentStatus;
  progress: number;
  error?: string;
  results?: Record<string, unknown>;
  completedAt?: string;
}

export interface ExecutionResult {
  executionId: string;
  systemType: SystemType;
  status: ExecutionStatus | 'completed' | 'failed';
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

// ─── LLM & AI ─────────────────────────────────────────────────────────────────

export type LLMProvider = 'anthropic' | 'openai' | 'google' | 'fallback';

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: LLMProvider;
}

export interface LLMResponse {
  provider: LLMProvider;
  content: string;
  tokensUsed: number;
  stopReason: string;
}

// ─── Video Processing ─────────────────────────────────────────────────────────

export interface ProduceRequest {
  videoPath: string;
  style: ProductionStyle;
  targetDurationSec?: number;
  transition?: TransitionType;
  transitionDuration?: number;
  colorGrade?: ColorGrade;
  muteOriginal?: boolean;
  musicPath?: string;
  musicUrl?: string;
  musicVolume?: number;
  speedFactor?: number;
  outputPath?: string;
  instructions?: string;
}

export interface ProduceResult {
  success: boolean;
  outputPath?: string;
  gdrivePath?: string;
  pipeline: string[];
  segments: { start: string; end: string; label: string }[];
  cutPlan?: string;
  processingMs: number;
  finalDurationSec?: number;
  error?: string;
  formatted?: string;
  ficha?: VideoFicha;
}

export interface VideoFicha {
  fecha: string;
  archivoFuente: string;
  duracionOriginal: string;
  duracionFinal: string;
  estilo: string;
  colorGrade: string;
  velocidad: string;
  transiciones: string;
  musica: string;
  audioOriginal: string;
  segmentos: { n: number; label: string; desde: string; hasta: string; duracion: string }[];
  formato: string;
  tamanoMB: number;
  archivosOutput: { local: string; drive?: string };
  resumenParaCliente: string;
}

// ─── Central Memory ───────────────────────────────────────────────────────────

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

export interface PatternAnalysis {
  patterns: Pattern[];
  recommendedSkills: string[];
  confidenceScore: number;
  estimatedDuration: number;
  historicalSuccessRate: number;
}

export interface Gap {
  type: GapType;
  description: string;
  severity: Severity;
  suggestedFix?: string;
  suggestedAction?: string;
}

export interface QualityMetrics {
  overallScore: number; // 0-100
  completeness: number;
  correctness: number;
  performance: number;
  securityScore?: number;
  issues: Gap[];
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
  priority: AgentPriority;
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
  cacheTTL?: number;
  enableEmbeddings?: boolean;
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
  priority: RequirementPriority;
  estimatedEffort: number;
  relatedSkills: string[];
}

// ─── Quality & Validation ────────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface QualityScore {
  overallScore: number; // 0-100
  completeness: number;
  correctness: number;
  performance: number;
  issues: string[];
  shouldRetry: boolean;
}

// ─── Feedback & Learning ──────────────────────────────────────────────────────

export interface Feedback {
  gaps: Gap[];
  metrics: QualityMetrics;
  suggestions: string[];
}

export interface ImprovedSpec {
  originalSpec: Record<string, unknown>;
  improvements: Record<string, unknown>;
  reasoning: string;
  expectedQualityIncrease: number;
}

// ─── Re-exports para compatibilidad ────────────────────────────────────────────

/**
 * Tipos que ya existían en orchestrator/types.ts
 * Se re-exportan aquí para centralización
 */
export * from '@/app/api/orchestrator/types';

/**
 * Interfaces del orchestrator desacoplado
 */
export * from '@/lib/orchestrator/interfaces';
