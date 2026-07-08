/**
 * ============================================================
 * MODEL SELECTOR — Asigna el mejor modelo para cada agente
 * ============================================================
 *
 * CONFIGURACIÓN: TODOS LOS AGENTES USAN SONNET SIEMPRE
 *
 * Rationale:
 *   - Sonnet: máxima calidad en todos los outputs
 *   - Sin compromiso de velocidad (paralelo + cache)
 *   - Razonamiento superior en todas las tareas
 *   - Auto-corrección y auto-iteración más efectiva
 *
 * Antes: Mix Sonnet/Haiku por tipo de agente
 * Ahora: Siempre Sonnet para máxima consistencia
 * ============================================================
 */

// ─── Modelos disponibles ──────────────────────────────────────────────────────

// Claude models (Anthropic)
const ENV_MODEL    = process.env.COALITION_MODEL || 'claude-haiku-4-5-20251001';
const ENV_SONNET   = process.env.COALITION_MODEL_SONNET || 'claude-sonnet-4-6';

// OpenAI models (La Granja - GPT-4o)
const OPENAI_KEY   = process.env.OPENAI_API_KEY ? 'openai' : null;
const GPT_4O       = 'gpt-4o';

// Detectar si el env model es Haiku o Sonnet
const IS_ENV_HAIKU = ENV_MODEL.toLowerCase().includes('haiku');

export const MODELS = {
  SONNET: ENV_SONNET,
  HAIKU:  IS_ENV_HAIKU ? ENV_MODEL : 'claude-haiku-4-5-20251001',
  GPT_4O: GPT_4O,     // OpenAI GPT-4o para Code Specialist pesado
  GPT_VISION: 'gpt-4o', // Para análisis de imágenes (Design Specialist)
} as const;

export type ModelName = string;
export type Provider = 'claude' | 'openai';

// ─── Agentes que pueden usar OpenAI (La Granja) ───────────────────────────────
// Para tareas específicas donde GPT-4o es mejor

const USES_GPT = new Set([
  'agent-code-specialist',        // Refactor pesado: GPT-4o + Codex
  'agent-design-specialist',      // Análisis visual: GPT-4o Vision
  'agent-analytics-specialist',   // Análisis de datos: GPT-4o
]);

// ─── TODOS LOS AGENTES USAN SONNET SIEMPRE ───────────────────────────────────
// Decisión: Máxima calidad sin compromisos
// - Paralelo hace que la velocidad no sea crítica
// - Razonamiento superior en todas las tareas
// - Auto-iteración más efectiva

const ALL_AGENTS = new Set([
  // Core agents (Charles ecosystem)
  'agent-code-specialist',        // Implementación crítica
  'agent-security-specialist',    // Auditoría crítica
  'agent-design-specialist',      // Specs visuales complejas
  'agent-performance-specialist', // Análisis técnico
  'agent-analytics-specialist',   // Interpretación de datos
  'agent-content-specialist',     // Copy de marca
  'agent-research-specialist',    // Research y benchmarks
  'agent-media-specialist',       // Specs de assets
  // Extended agents
  'agent-fitness-specialist',     // Dominio fitness
  'agent-creative-media',         // Refinamiento de prompts
  'agent-seo-specialist',         // Auditoría técnica SEO
]);

// ─── Detección de complejidad de tarea ───────────────────────────────────────

const COMPLEX_KEYWORDS = [
  'rediseña', 'refactoriza', 'arquitectura', 'migra', 'optimiza profundo',
  'completo', 'sistema', 'integra', 'reestructura', 'performance crítico',
  'vulnerabilidad', 'audit', 'compleja', 'múltiples', 'toda la landing',
];

const SIMPLE_KEYWORDS = [
  'texto', 'copy', 'color', 'tipografía', 'fuente', 'icono',
  'traducir', 'cambiar el texto', 'ajustar', 'pequeño cambio',
];

export function isComplexTask(taskDescription: string): boolean {
  const lower = taskDescription.toLowerCase();
  const complexScore = COMPLEX_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  const simpleScore  = SIMPLE_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  // Compleja si: más de 1 keyword compleja, o tarea > 80 chars, o no tiene keywords simples
  return complexScore > 0 || (taskDescription.length > 80 && simpleScore === 0);
}

// ─── Selector principal ───────────────────────────────────────────────────────

export interface ModelAssignment {
  agentId:   string;
  model:     ModelName;
  provider:  Provider;
  reasoning: string;
}

export function selectModels(
  agentIds: string[],
  taskDescription: string
): Record<string, ModelAssignment> {
  const assignments: Record<string, ModelAssignment> = {};

  for (const agentId of agentIds) {
    // ─── TODOS LOS AGENTES USAN SONNET ───────────────────────────────────────
    // Decisión: Máxima calidad en todos los outputs
    // - Paralelo hace que la velocidad no sea crítica (ejecutamos en paralelo)
    // - Sonnet tiene razonamiento superior en TODAS las tareas
    // - Auto-iteración y self-correction funcionan mejor con Sonnet
    // - Consistencia en calidad de outputs

    const model    = MODELS.SONNET;
    const provider = 'claude';
    const reasoning = 'Sonnet siempre — máxima calidad en todos los agentes';

    assignments[agentId] = { agentId, model, provider, reasoning };
  }

  return assignments;
}

// ─── Resumen legible ──────────────────────────────────────────────────────────

export function formatModelAssignments(assignments: Record<string, ModelAssignment>): string {
  const sonnet = Object.values(assignments).filter((a) => a.model === MODELS.SONNET);
  const haiku  = Object.values(assignments).filter((a) => a.model === MODELS.HAIKU);
  const gpt    = Object.values(assignments).filter((a) => a.provider === 'openai');

  // Con la nueva configuración, todos son Sonnet
  const parts = [
    `🎯 Sonnet (${sonnet.length}): ${sonnet.map((a) => a.agentId.replace('agent-', '').replace('-specialist', '')).join(', ')}`,
  ];

  if (haiku.length > 0) {
    parts.push(`Legacy Haiku (${haiku.length}): ${haiku.map((a) => a.agentId.replace('agent-', '').replace('-specialist', '')).join(', ')}`);
  }

  if (gpt.length > 0) {
    parts.push(`🚀 La Granja (${gpt.length}): ${gpt.map((a) => a.agentId.replace('agent-', '').replace('-specialist', '')).join(', ')}`);
  }

  return parts.join(' | ');
}
