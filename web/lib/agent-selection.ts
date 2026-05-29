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

/**
 * Calcula confidence score para un agente basado en:
 * - Keyword matches (50%)
 * - Domain match (35%)
 * - Historical success rate (15%)
 */
export function calculateConfidence(agent: AgentConfig, taskKeywords: string[]): number {
  const taskLower = taskKeywords.map((k) => k.toLowerCase());

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
  const keywordScore = Math.min(Math.max(byTask, byAgent), 1) * 0.5;

  // Domain detection
  const domainMatch = agent.domains.some((d) =>
    taskLower.some((tk) => tk.includes(d) || d.includes(tk))
  );
  const domainScore = domainMatch ? 0.35 : 0;

  // Historical success rate
  const successScore = agent.successRate * 0.15;

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
  } = {}
): AgentBid[] {
  const { confidenceThreshold = 0.55, maxAgents = 6 } = options;

  // Regla especial: code SIEMPRE participa si hay 3+ agentes de diseño/content
  let selectedBids = bids.filter((b) => b.confidence >= confidenceThreshold);
  const designContentCount = selectedBids.filter((b) =>
    ['agent-design-specialist', 'agent-content-specialist', 'agent-media-specialist'].includes(b.agentId)
  ).length;

  const codeAgent = bids.find((b) => b.agentId === 'agent-code-specialist');
  const codeAlreadyIn = selectedBids.some((b) => b.agentId === 'agent-code-specialist');
  if (designContentCount >= 3 && !codeAlreadyIn && codeAgent) {
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
