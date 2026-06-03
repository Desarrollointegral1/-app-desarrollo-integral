/**
 * ============================================================
 * AGENT SELECTION LOGIC
 * Extraído de parallel-agents.ts para mejorar mantenibilidad
 * ============================================================
 *
 * Contiene la lógica de:
 * - Cálculo de confidence score
 * - Selección de agentes por keywords + domains + success rate
 * - Reglas especiales (Code Specialist forced entry, etc)
 */

import type { AgentConfig, AgentBid } from './parallel-agents';

// ─── Pesos dinámicos de confidence ────────────────────────────────────────────

interface ConfidenceWeights {
  keyword: number;
  domain: number;
  successRate: number;
}

// Pesos INICIALES — cuando no hay suficientes datos reales
const INITIAL_WEIGHTS: ConfidenceWeights = {
  keyword: 0.50,
  domain: 0.35,
  successRate: 0.15,
};

// Pesos CON DATOS REALES — cuando agentes tienen > 100 ejecuciones cada uno
// El success_rate se vuelve mucho más importante (0.50 vs 0.15)
const REAL_DATA_WEIGHTS: ConfidenceWeights = {
  keyword: 0.25,
  domain: 0.25,
  successRate: 0.50,
};

/**
 * Selecciona pesos basado en si hay datos reales disponibles.
 * Con > 100 ejecuciones por agente, el success_rate es crucial.
 *
 * MEJORA 9: Adaptive Confidence Weights
 * - Sin datos (<100 ejecuciones): Confiar en keywords + domain
 * - Con datos (≥100 ejecuciones): Confiar más en success_rate histórico
 */
function selectWeights(agent: AgentConfig): ConfidenceWeights {
  const hasRealData = (agent.dataPoints ?? 0) >= 100;

  if (hasRealData) {
    // ✅ Agente tiene datos reales → success_rate es CRÍTICO
    console.log(`[Weights] ${agent.name}: REAL DATA (${agent.dataPoints} ejecuciones) → success_rate weight=0.50`);
    return REAL_DATA_WEIGHTS;
  }

  // ⏳ Agente es nuevo o sin suficientes datos → usar keywords/domain como señales
  console.log(`[Weights] ${agent.name}: NO DATA (${agent.dataPoints ?? 0} ejecuciones) → keyword weight=0.50`);
  return INITIAL_WEIGHTS;
}

/**
 * Calcula confidence score para un agente basado en:
 * - Keyword matches
 * - Domain match
 * - Historical success rate
 *
 * Pesos adaptativos: con datos reales, el success_rate importa más.
 */
export function calculateConfidence(agent: AgentConfig, taskKeywords: string[]): number {
  const taskLower = taskKeywords.map((k) => k.toLowerCase());
  const weights = selectWeights(agent);

  // Keyword matches — flexible: substring + raíz española (5 chars)
  const agentKeywordsLower = agent.keywords.map((k) => k.toLowerCase());
  const matches = taskLower.filter((tk) =>
    agentKeywordsLower.some((ak) => {
      if (ak.includes(tk) || tk.includes(ak)) return true;
      // Raíz: primeros 5 chars para manejar variaciones de género/número
      if (tk.length >= 5 && ak.length >= 5) {
        return ak.startsWith(tk.slice(0, 5)) || tk.startsWith(ak.slice(0, 5));
      }
      return false;
    })
  ).length;

  // Normalizar por el que dé mayor score
  const byTask  = matches / Math.max(taskLower.length, 1);
  const byAgent = matches / Math.max(agentKeywordsLower.length, 1);
  const keywordScore = Math.min(Math.max(byTask, byAgent), 1) * weights.keyword;

  // Domain detection
  const domainMatch = agent.domains.some((d) =>
    taskLower.some((tk) => tk.includes(d) || d.includes(tk))
  );
  const domainScore = domainMatch ? weights.domain : 0;

  // Historical success rate (dinámico según pesos)
  const successScore = agent.successRate * weights.successRate;

  return keywordScore + domainScore + successScore;
}

/**
 * Selecciona agentes para una coalición basado en confidence score,
 * reglas especiales, y límites máximos
 */
export function selectAgents(
  bids: AgentBid[],
  options: {
    confidenceThreshold?: number;
    maxAgents?: number;
    taskDescription?: string;
  } = {}
): AgentBid[] {
  const { confidenceThreshold = 0.55, maxAgents = 6, taskDescription = '' } = options;

  // Detectar tareas problemáticas donde necesitamos estrategia especial
  const isNavbarRedesign = /navbar|nav.*redesign|menú|navegacion.*completá/i.test(taskDescription);

  let selectedBids = bids.filter((b) => b.confidence >= confidenceThreshold);

  // REGLA ESPECIAL: navbar-redesign es problemática (14/100 score)
  // Estrategia: Code + Performance primero, Design con penalización
  if (isNavbarRedesign) {
    // Prioritizar Code + Performance
    const performanceAgent = bids.find((b) => b.agentId === 'agent-performance-specialist');
    const codeAgent = bids.find((b) => b.agentId === 'agent-code-specialist');
    const designAgent = selectedBids.find((b) => b.agentId === 'agent-design-specialist');

    selectedBids = selectedBids.filter((b) => b.agentId !== 'agent-design-specialist');

    // Agregar Performance si no está
    if (performanceAgent && !selectedBids.find((b) => b.agentId === 'agent-performance-specialist')) {
      selectedBids.push({ ...performanceAgent, reasoning: performanceAgent.reasoning + ' (navbar: Performance first strategy)' });
    }

    // Agregar Code si no está
    if (codeAgent && !selectedBids.find((b) => b.agentId === 'agent-code-specialist')) {
      selectedBids.push({ ...codeAgent, reasoning: codeAgent.reasoning + ' (navbar: Code specialist required)' });
    }

    // Design solo si tiene confianza ALTA (0.65+)
    if (designAgent && designAgent.confidence >= 0.65) {
      selectedBids.push({
        ...designAgent,
        confidence: designAgent.confidence - 0.15, // Penalizar confianza por problemas previos
        reasoning: designAgent.reasoning + ' (navbar: Design con penalización por underperformance previo)',
      });
    }
  }

  // Regla especial: code SIEMPRE participa si hay 3+ agentes de diseño/content
  const designContentCount = selectedBids.filter((b) =>
    ['agent-design-specialist', 'agent-content-specialist', 'agent-media-specialist'].includes(b.agentId)
  ).length;

  const codeAgent = bids.find((b) => b.agentId === 'agent-code-specialist');
  const codeAlreadyIn = selectedBids.some((b) => b.agentId === 'agent-code-specialist');
  if (designContentCount >= 3 && !codeAlreadyIn && codeAgent && !isNavbarRedesign) {
    selectedBids.push({ ...codeAgent, reasoning: codeAgent.reasoning + ' (forzado por regla: 3+ agentes design)' });
  }

  // Máximo N agentes por coalición (ordenar por confidence)
  selectedBids = selectedBids
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxAgents);

  // Fallback: si nadie supera el threshold, bajar a 0.50
  if (selectedBids.length === 0) {
    selectedBids = bids
      .filter((b) => b.confidence >= 0.50)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  return selectedBids;
}
