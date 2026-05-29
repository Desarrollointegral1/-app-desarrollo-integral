/**
 * ============================================================
 * MODEL SELECTOR — Agente que decide el modelo por agente
 * ============================================================
 *
 * Cada agente de la coalición recibe el modelo óptimo para su
 * tipo de trabajo. No todos necesitan el mismo.
 *
 * REGLA GENERAL:
 *   - Trabajo complejo (código real, diseño técnico, seguridad) → Sonnet
 *   - Trabajo rápido (copy, research, specs de media)          → Haiku
 *
 * El selector también considera la complejidad de la tarea:
 * una tarea simple de contenido no necesita Sonnet aunque la
 * haga el Code Specialist.
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

// ─── Agentes que siempre usan Sonnet ─────────────────────────────────────────
// Estos agentes generan output que se implementa directamente → necesitan precisión

const ALWAYS_SONNET = new Set([
  'agent-security-specialist',    // Auditoría crítica — un error = vulnerabilidad
]);

// ─── Agentes que usan Sonnet en tareas complejas, Haiku en simples ────────────

const SONNET_ON_COMPLEX = new Set([
  'agent-design-specialist',      // Specs detalladas de UI/UX
  'agent-performance-specialist', // Análisis técnico de bottlenecks
  'agent-analytics-specialist',   // Interpretación de métricas
]);

// ─── Agentes que siempre usan Haiku ──────────────────────────────────────────
// Generan texto de calidad sin necesitar razonamiento profundo

const ALWAYS_HAIKU = new Set([
  'agent-content-specialist',  // Copy y texto de marca
  'agent-research-specialist', // Research y benchmarks
  'agent-media-specialist',    // Specs de assets multimedia
  'agent-fitness-specialist',  // Validación de dominio fitness — texto especializado
  'agent-creative-media',      // Refinamiento de prompts + coordinación con FAL.ai
  'agent-video-producer',      // Producción completa de video — planificación y pipeline
]);

// ─── SEO usa Sonnet en tareas complejas (auditoría técnica) ──────────────────
// SEO técnico (schema, sitemap, Core Web Vitals) requiere razonamiento preciso

const SONNET_ON_COMPLEX_EXTRA = new Set([
  'agent-seo-specialist',     // Auditoría técnica SEO + implementación schema.org
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
  const complex = isComplexTask(taskDescription);
  const assignments: Record<string, ModelAssignment> = {};
  const hasOpenAI = !!OPENAI_KEY && process.env.OPENAI_API_KEY;

  for (const agentId of agentIds) {
    let model: ModelName;
    let provider: Provider;
    let reasoning: string;

    // ─── Lógica La Granja: usar GPT-4o cuando está disponible y apropiado ──
    if (hasOpenAI && USES_GPT.has(agentId) && complex) {
      // Code Specialist en tarea pesada → GPT-4o (Codex)
      if (agentId === 'agent-code-specialist') {
        model     = MODELS.GPT_4O;
        provider  = 'openai';
        reasoning = 'GPT-4o (Codex) — refactor pesado, OpenAI disponible';
      }
      // Design Specialist en auditoría → GPT-4o Vision
      else if (agentId === 'agent-design-specialist') {
        model     = MODELS.GPT_VISION;
        provider  = 'openai';
        reasoning = 'GPT-4o Vision — análisis visual complejo, OpenAI disponible';
      }
      // Analytics en análisis de datos → GPT-4o
      else if (agentId === 'agent-analytics-specialist') {
        model     = MODELS.GPT_4O;
        provider  = 'openai';
        reasoning = 'GPT-4o — análisis de datos complejo, OpenAI disponible';
      }
      else {
        model     = MODELS.SONNET;
        provider  = 'claude';
        reasoning = 'Sonnet — fallback, tarea compleja';
      }
    }
    // ─── Fallback: Claude default ──
    else if (ALWAYS_SONNET.has(agentId)) {
      model     = MODELS.SONNET;
      provider  = 'claude';
      reasoning = 'Siempre Sonnet — genera código/auditoría crítica';
    } else if (ALWAYS_HAIKU.has(agentId)) {
      model     = MODELS.HAIKU;
      provider  = 'claude';
      reasoning = 'Siempre Haiku — texto, suficiente velocidad';
    } else if (SONNET_ON_COMPLEX.has(agentId) || SONNET_ON_COMPLEX_EXTRA.has(agentId)) {
      model     = complex ? MODELS.SONNET : MODELS.HAIKU;
      provider  = 'claude';
      reasoning = complex ? 'Sonnet — complejo' : 'Haiku — simple';
    } else {
      model     = MODELS.HAIKU;
      provider  = 'claude';
      reasoning = 'Haiku — agente de texto';
    }

    assignments[agentId] = { agentId, model, provider, reasoning };
  }

  return assignments;
}

// ─── Resumen legible ──────────────────────────────────────────────────────────

export function formatModelAssignments(assignments: Record<string, ModelAssignment>): string {
  const sonnet = Object.values(assignments).filter((a) => a.model === MODELS.SONNET);
  const haiku  = Object.values(assignments).filter((a) => a.model === MODELS.HAIKU);
  const gpt    = Object.values(assignments).filter((a) => a.provider === 'openai');

  const parts = [
    `Sonnet (${sonnet.length}): ${sonnet.map((a) => a.agentId.replace('agent-', '').replace('-specialist', '')).join(', ')}`,
    `Haiku  (${haiku.length}): ${haiku.map((a) => a.agentId.replace('agent-', '').replace('-specialist', '')).join(', ')}`,
  ];

  if (gpt.length > 0) {
    parts.push(`🚀 La Granja (${gpt.length}): ${gpt.map((a) => a.agentId.replace('agent-', '').replace('-specialist', '')).join(', ')}`);
  }

  return parts.join(' | ');
}
