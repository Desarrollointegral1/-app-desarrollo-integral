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

// Los modelos se leen del entorno para que coincidan con COALITION_MODEL
// Si no hay env var se usa el fallback. La lógica SONNET/HAIKU sigue aplicando.
const ENV_MODEL    = process.env.COALITION_MODEL || 'claude-haiku-4-5-20251001';
const ENV_SONNET   = process.env.COALITION_MODEL_SONNET || 'claude-sonnet-4-5';

// Detectar si el env model es Haiku o Sonnet para asignar correctamente
const IS_ENV_HAIKU = ENV_MODEL.toLowerCase().includes('haiku');

export const MODELS = {
  SONNET: ENV_SONNET,
  HAIKU:  IS_ENV_HAIKU ? ENV_MODEL : 'claude-haiku-4-5-20251001',
} as const;

export type ModelName = string;

// ─── Agentes que siempre usan Sonnet ─────────────────────────────────────────
// Estos agentes generan output que se implementa directamente → necesitan precisión

const ALWAYS_SONNET = new Set([
  'agent-code-specialist',        // Escribe archivos reales
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
  reasoning: string;
}

export function selectModels(
  agentIds: string[],
  taskDescription: string
): Record<string, ModelAssignment> {
  const complex = isComplexTask(taskDescription);
  const assignments: Record<string, ModelAssignment> = {};

  for (const agentId of agentIds) {
    let model: ModelName;
    let reasoning: string;

    if (ALWAYS_SONNET.has(agentId)) {
      model     = MODELS.SONNET;
      reasoning = 'Siempre Sonnet — genera código/auditoría directamente implementable';
    } else if (ALWAYS_HAIKU.has(agentId)) {
      model     = MODELS.HAIKU;
      reasoning = 'Siempre Haiku — genera texto, suficiente velocidad y calidad';
    } else if (SONNET_ON_COMPLEX.has(agentId)) {
      model     = complex ? MODELS.SONNET : MODELS.HAIKU;
      reasoning = complex
        ? 'Sonnet — tarea compleja detectada, necesita razonamiento profundo'
        : 'Haiku — tarea simple, Haiku es suficiente';
    } else {
      model     = MODELS.HAIKU;
      reasoning = 'Haiku — agente de texto/specs, no requiere Sonnet';
    }

    assignments[agentId] = { agentId, model, reasoning };
  }

  return assignments;
}

// ─── Resumen legible ──────────────────────────────────────────────────────────

export function formatModelAssignments(assignments: Record<string, ModelAssignment>): string {
  const sonnet = Object.values(assignments).filter((a) => a.model === MODELS.SONNET);
  const haiku  = Object.values(assignments).filter((a) => a.model === MODELS.HAIKU);

  return [
    `Sonnet (${sonnet.length}): ${sonnet.map((a) => a.agentId.replace('agent-', '').replace('-specialist', '')).join(', ')}`,
    `Haiku  (${haiku.length}): ${haiku.map((a) => a.agentId.replace('agent-', '').replace('-specialist', '')).join(', ')}`,
  ].join(' | ');
}
