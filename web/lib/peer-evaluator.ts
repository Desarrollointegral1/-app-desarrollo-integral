/**
 * ============================================================
 * PEER EVALUATOR — Evaluaciones Reales con Claude Haiku
 * ============================================================
 *
 * Implementa evaluaciones inter-agente usando Claude Haiku.
 * Cada agente evalúa a otros basado en criterios específicos.
 *
 * Tabla de evaluaciones:
 *   Security   → Code   (vulnerabilidades)
 *   Performance → Code + Design (eficiencia + impacto visual)
 *   Design     → Content (consistencia de marca)
 *   Analytics  → Performance (atacan KPIs correctos)
 *   Research   → Content (precisión del posicionamiento)
 * ============================================================
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AgentResult } from './parallel-agents';
import type { ProjectContext } from './context-collector';
import { getCachedPeerEvalScore, cachePeerEvalScore, getCacheStats } from './peer-eval-cache';

export interface EvaluationResult {
  evaluatorId: string;
  evaluatorName: string;
  targetId: string;
  targetName: string;
  score: number; // 0-25
  reasoning: string;
  durationMs: number;
  tokensUsed: number;
}

// ─── Configuración de evaluaciones ─────────────────────────────────────────────

const EVALUATION_RULES: Array<{
  evaluatorId: string;
  evaluatorName: string;
  targetId: string;
  targetName: string;
  criterion: string;
}> = [
  {
    evaluatorId: 'agent-security-specialist',
    evaluatorName: 'Security Specialist',
    targetId: 'agent-code-specialist',
    targetName: 'Code Specialist',
    criterion: '¿El código implementado tiene vulnerabilidades de seguridad (XSS, SQL injection, auth bypass)?'
  },
  {
    evaluatorId: 'agent-performance-specialist',
    evaluatorName: 'Performance Specialist',
    targetId: 'agent-code-specialist',
    targetName: 'Code Specialist',
    criterion: '¿La implementación es eficiente? ¿Hay queries N+1, renders innecesarios, o bundle bloating?'
  },
  {
    evaluatorId: 'agent-performance-specialist',
    evaluatorName: 'Performance Specialist',
    targetId: 'agent-design-specialist',
    targetName: 'Design Specialist',
    criterion: '¿Las animaciones/assets tendrán impacto negativo en performance? ¿Imágenes optimizadas?'
  },
  {
    evaluatorId: 'agent-design-specialist',
    evaluatorName: 'Design Specialist',
    targetId: 'agent-content-specialist',
    targetName: 'Content Specialist',
    criterion: '¿El copy propuesto es consistente con la marca visual (tono, autoridad, calidez)?'
  },
  {
    evaluatorId: 'agent-analytics-specialist',
    evaluatorName: 'Analytics Specialist',
    targetId: 'agent-performance-specialist',
    targetName: 'Performance Specialist',
    criterion: '¿Las optimizaciones de performance atacan los KPIs correctos (Lighthouse, FCP, conversión)?'
  },
  {
    evaluatorId: 'agent-research-specialist',
    evaluatorName: 'Research Specialist',
    targetId: 'agent-content-specialist',
    targetName: 'Content Specialist',
    criterion: '¿El posicionamiento/copy es preciso según datos reales del mercado y competencia?'
  },
];

// ─── System prompts por evaluador ──────────────────────────────────────────────

function buildEvaluatorSystemPrompt(evaluatorId: string): string {
  const prompts: Record<string, string> = {
    'agent-security-specialist': `Eres el Security Specialist evaluador de Desarrollo Integral.
Tu rol: revisar código/implementaciones por vulnerabilidades.
Busca: XSS, SQL injection, auth bypasses, datos sensibles expuestos, headers faltantes.
IMPORTANTE: Sé severo. Un pequeño hueco de seguridad = score bajo.
Responde SOLO con un número 0-25.`,

    'agent-performance-specialist': `Eres el Performance Specialist evaluador.
Tu rol: validar que implementaciones y assets no impacten negativamente performance.
Busca: queries N+1, renders innecesarios, imágenes mal optimizadas, animaciones pesadas.
Métricas objetivo: Lighthouse >= 95, FCP <= 0.8s, CTA >= 8%.
Responde SOLO con un número 0-25.`,

    'agent-design-specialist': `Eres el Design Specialist evaluador.
Tu rol: validar que copy sea consistente con marca visual.
Marca: Dark premium, minimalista, autoridad con calidez. Gold #C8A96E.
Busca: coherencia de voz, energía, profesionalismo.
Responde SOLO con un número 0-25.`,

    'agent-analytics-specialist': `Eres el Analytics Specialist evaluador.
Tu rol: validar que optimizaciones atacan KPIs correctos.
KPIs a mejorar: Lighthouse 78→95, FCP 2.1s→0.8s, CTA 4.2%→8%, Bounce 42%→18%.
Busca: cambios que realmente impactarán estas métricas.
Responde SOLO con un número 0-25.`,

    'agent-research-specialist': `Eres el Research Specialist evaluador.
Tu rol: validar que posicionamiento/copy es preciso.
Contexto: Centro de entrenamiento premium 30 años en Belgrano.
Competencia: CrossFit boxes, Barry's, estudios boutique.
Busca: precisión de datos, diferenciación clara, posicionamiento real.
Responde SOLO con un número 0-25.`,
  };

  return prompts[evaluatorId] || 'Eres un evaluador especializado. Responde SOLO con un número 0-25.';
}

// ─── Función principal de evaluación ───────────────────────────────────────────

export async function evaluateAgentOutputs(
  results: AgentResult[],
  taskDescription: string,
  projectContext: ProjectContext | null,
  options: { maxParallel?: number; timeoutMs?: number } = {}
): Promise<Record<string, number>> {
  const client = new Anthropic();
  const evaluations: EvaluationResult[] = [];
  const scores: Record<string, number> = {};

  // Usar valores por defecto para opciones
  const maxParallel = options.maxParallel ?? 3;
  const timeoutMs = options.timeoutMs ?? 15000;

  // Filtrar reglas: solo evaluar agentes que participaron
  const participatingIds = new Set(results.map(r => r.agentId));
  const applicableRules = EVALUATION_RULES.filter(
    r => participatingIds.has(r.evaluatorId) && participatingIds.has(r.targetId)
  );

  if (applicableRules.length === 0) {
    console.log('[PeerEval] No hay evaluaciones aplicables (agentes insuficientes)');
    return scores;
  }

  console.log(`[PeerEval] Ejecutando ${applicableRules.length} evaluaciones en paralelo...`);

  // Ejecutar en chunks de maxParallel para no sobrecargar la API
  for (let i = 0; i < applicableRules.length; i += maxParallel) {
    const chunk = applicableRules.slice(i, i + maxParallel);
    const evalPromises = chunk.map(rule =>
      evaluateSinglePair(
        client,
        rule,
        results,
        taskDescription,
        projectContext,
        timeoutMs
      )
    );

    const chunkResults = await Promise.all(evalPromises);
    evaluations.push(...chunkResults);
  }

  // Consolidar scores por agente evaluado
  for (const evaluation of evaluations) {
    scores[evaluation.targetId] = evaluation.score;
  }

  // Log de resultados
  console.log('[PeerEval] ✅ Evaluaciones completadas:');
  const cachedCount = evaluations.filter(e => e.reasoning.includes('[CACHED]')).length;
  const totalTokens = evaluations.reduce((sum, e) => sum + e.tokensUsed, 0);

  for (const evaluation of evaluations) {
    console.log(
      `  ${evaluation.evaluatorName} → ${evaluation.targetName}: ${evaluation.score}/25 (${evaluation.durationMs}ms)`
    );
  }

  // Log estadísticas de caché
  if (cachedCount > 0) {
    const cacheStats = getCacheStats();
    console.log(`[PeerEval] 📦 Caché: ${cachedCount}/${evaluations.length} hits | ${cacheStats.size} entradas activas | ${totalTokens} tokens totales`);
  }

  return scores;
}

// ─── Función auxiliar: evaluar un par específico ────────────────────────────────

async function evaluateSinglePair(
  client: Anthropic,
  rule: (typeof EVALUATION_RULES)[0],
  results: AgentResult[],
  taskDescription: string,
  projectContext: ProjectContext | null,
  timeoutMs: number
): Promise<EvaluationResult> {
  const startTime = Date.now();

  try {
    const targetResult = results.find(r => r.agentId === rule.targetId);
    if (!targetResult) {
      return {
        evaluatorId: rule.evaluatorId,
        evaluatorName: rule.evaluatorName,
        targetId: rule.targetId,
        targetName: rule.targetName,
        score: 0,
        reasoning: 'Agente no participó',
        durationMs: 0,
        tokensUsed: 0,
      };
    }

    // ── Intento de caché ──────────────────────────────────────────────────
    // Si ya evaluamos este mismo output, reutilizar el score
    const cachedScore = getCachedPeerEvalScore(targetResult.output);
    if (cachedScore !== null) {
      const durationMs = Date.now() - startTime;
      return {
        evaluatorId: rule.evaluatorId,
        evaluatorName: rule.evaluatorName,
        targetId: rule.targetId,
        targetName: rule.targetName,
        score: cachedScore,
        reasoning: `[CACHED] Evaluado por ${rule.evaluatorName}`,
        durationMs,
        tokensUsed: 0, // No consumimos tokens del caché
      };
    }

    // Construir contexto para la evaluación
    const contextStr = projectContext
      ? `\nCONTEXTO DEL PROYECTO:\n${projectContext.summary}`
      : '';

    const evaluationPrompt = `
TAREA: "${taskDescription}"

OUTPUT DEL AGENTE ${rule.targetName}:
${targetResult.output.slice(0, 2000)} ${targetResult.output.length > 2000 ? '...' : ''}
${contextStr}

PREGUNTA: ${rule.criterion}

Responde SOLO con un número entero entre 0 y 25.
0 = crítico/inaceptable
12-13 = aceptable
25 = excelente/sin defectos

NÚMERO:`;

    const response = await executeWithTimeout(
      client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 50,
        system: buildEvaluatorSystemPrompt(rule.evaluatorId),
        messages: [{ role: 'user', content: evaluationPrompt }],
      }),
      timeoutMs
    );

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '0';
    const score = extractScore(responseText);
    const durationMs = Date.now() - startTime;

    // ── Guardar en caché ──────────────────────────────────────────────────
    cachePeerEvalScore(targetResult.output, score);

    return {
      evaluatorId: rule.evaluatorId,
      evaluatorName: rule.evaluatorName,
      targetId: rule.targetId,
      targetName: rule.targetName,
      score,
      reasoning: `Evaluado por ${rule.evaluatorName}`,
      durationMs,
      tokensUsed: response.usage.output_tokens,
    };
  } catch (error) {
    console.error(`[PeerEval] Error evaluando ${rule.evaluatorName} → ${rule.targetName}:`, error);
    return {
      evaluatorId: rule.evaluatorId,
      evaluatorName: rule.evaluatorName,
      targetId: rule.targetId,
      targetName: rule.targetName,
      score: 12, // Score medio si hay error
      reasoning: `Error durante evaluación: ${error instanceof Error ? error.message : 'Unknown'}`,
      durationMs: Date.now() - startTime,
      tokensUsed: 0,
    };
  }
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function extractScore(text: string): number {
  const match = text.match(/\d+/);
  if (!match) return 12; // Default a aceptable
  const score = parseInt(match[0], 10);
  return Math.max(0, Math.min(25, score)); // Clamp a 0-25
}

function executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Evaluation timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

// ─── Helper: Calcular score colectivo ──────────────────────────────────────────

export function calculateCollectiveScore(
  peerScores: Record<string, number>,
  agentCount: number
): number {
  if (agentCount === 0) return 0;

  const scores = Object.values(peerScores);
  if (scores.length === 0) return 0;

  // Score colectivo = (suma / máximo posible) × 100
  const maxPossible = agentCount * 25;
  const totalScore = scores.reduce((a, b) => a + b, 0);
  return Math.round((totalScore / maxPossible) * 100);
}

// ─── Detectar y resolver conflictos ────────────────────────────────────────────

export interface ConflictResolution {
  detected: boolean;
  description: string;
  resolution: string;
}

export function detectConflicts(results: AgentResult[]): ConflictResolution {
  const descriptions = results
    .map(r => ({ id: r.agentId, desc: r.output.slice(0, 100) }))
    .filter(r => r.id.includes('design') || r.id.includes('performance'));

  // Heurística simple: si Design y Performance proponen cosas contradictorias
  if (descriptions.length >= 2) {
    const designOutput = results.find(r => r.agentId.includes('design'))?.output || '';
    const perfOutput = results.find(r => r.agentId.includes('performance'))?.output || '';

    // Detectar palabras contradictorias
    const designHasHeavy = designOutput.toLowerCase().includes('grande') ||
      designOutput.toLowerCase().includes('animación');
    const perfWantsLight = perfOutput.toLowerCase().includes('ligero') ||
      perfOutput.toLowerCase().includes('optimizar');

    if (designHasHeavy && perfWantsLight) {
      return {
        detected: true,
        description: 'Design propone assets/animaciones vs Performance quiere optimizar',
        resolution: 'Security > Performance > Design (Performance gana en este caso)',
      };
    }
  }

  return {
    detected: false,
    description: 'Sin conflictos detectados',
    resolution: '',
  };
}
