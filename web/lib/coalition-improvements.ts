/**
 * ============================================================
 * COALITION IMPROVEMENTS — Conectar, Aprender, Evaluar
 * ============================================================
 *
 * Integración de las 3 mejoras en el pipeline de agentes:
 *
 * MEJORA 2: Agentes conectados (MessageBroker)
 * - Cada agente publica sus specs en un canal
 * - Los demás pueden suscribirse para coordinar
 *
 * MEJORA 3: Learning loop (CentralMemory)
 * - Antes de ejecutar: consulta patrones de ejecutar exitosas
 * - Después de ejecutar: guarda patrón + ajusta confidence
 *
 * MEJORA 4: Peer evaluation (PeerEvaluator)
 * - Agentes reales (via Claude Haiku) revisan trabajo de otros
 * - Auto-iteración si score < 75
 * ============================================================
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { getCentralMemory } from './central-memory';
import { getMessageBroker } from './swarm/message-broker';
import { AgentResult } from './parallel-agents';

// Schema para parsear feedback de evaluación
const PeerEvaluationResponseSchema = z.object({
  score: z.number().min(0).max(25).default(13),
  feedback: z.string().max(500).default('No disponible'),
});

// ─── MEJORA 2: Agent Communication Channel ────────────────────────────────

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  fromAgentName: string;
  channel: string;
  type: 'spec' | 'question' | 'conflict' | 'confirmation';
  content: string;
  timestamp: Date;
  processed: boolean;
}

export async function publishAgentSpec(
  agentId: string,
  agentName: string,
  specs: string
): Promise<void> {
  try {
    const broker = await getMessageBroker();
    const channel = `coalition-specs`;

    await broker.publish(channel, {
      id: `${agentId}-${Date.now()}`,
      from: agentId,
      to: 'coalition',
      type: 'data',
      payload: {
        messageType: 'spec',
        agentId,
        agentName,
        specs,
      },
      timestamp: new Date(),
      retryCount: 0,
    } as any);
  } catch (error) {
    console.warn('[Coalition] Could not publish agent spec:', error);
  }
}

export async function subscribeToAgentSpecs(
  callback: (agentId: string, agentName: string, specs: string) => void
): Promise<string | null> {
  try {
    const broker = await getMessageBroker();
    const channel = `coalition-specs`;

    return await broker.subscribe(channel, (message: any) => {
      if (message.type === 'data' && message.payload?.messageType === 'spec') {
        callback(message.payload.agentId, message.payload.agentName, message.payload.specs);
      }
    });
  } catch (error) {
    console.warn('[Coalition] Could not subscribe to agent specs:', error);
    return null;
  }
}

// ─── MEJORA 3: Learning Loop Integration ──────────────────────────────────

export interface LearningContext {
  taskKeywords: string[];
  agentId: string;
  confidenceBoost: number;
  learningSource: string;
}

/**
 * Consultar patrones aprendidos ANTES de ejecutar agentes
 * Retorna boost de confidence para agentes que han tenido éxito con tareas similares
 */
export async function getLearningBoosts(
  taskKeywords: string[],
  agentIds: string[]
): Promise<Map<string, LearningContext>> {
  const boosts = new Map<string, LearningContext>();

  try {
    const memory = getCentralMemory();
    const patterns = await memory.queryPatterns(taskKeywords);

    if (patterns.length === 0) {
      return boosts; // Sin historial
    }

    // Calcular boost por agente basado en patrones exitosos
    for (const agentId of agentIds) {
      const agentPatterns = patterns.filter((p) =>
        (p as any).bestSkills?.some((skill: string) => skill.toLowerCase().includes(agentId.split('-')[1]))
      );

      if (agentPatterns.length > 0) {
        const avgSuccessRate = agentPatterns.reduce((sum, p) => sum + p.successRate, 0) / agentPatterns.length;
        let boost = 0;
        let source = '';

        if (avgSuccessRate >= 0.90) {
          boost = 0.08;
          source = `${agentPatterns.length} patrones exitosos (${(avgSuccessRate * 100).toFixed(0)}% success rate)`;
        } else if (avgSuccessRate >= 0.80) {
          boost = 0.05;
          source = `${agentPatterns.length} patrones buenos (${(avgSuccessRate * 100).toFixed(0)}% success rate)`;
        } else if (avgSuccessRate < 0.60) {
          boost = -0.03; // Penalización
          source = `${agentPatterns.length} patrones con bajo éxito (${(avgSuccessRate * 100).toFixed(0)}%)`;
        }

        if (boost !== 0) {
          boosts.set(agentId, {
            taskKeywords,
            agentId,
            confidenceBoost: boost,
            learningSource: source,
          });
        }
      }
    }
  } catch (error) {
    console.warn('[Coalition] Learning boost error:', error);
  }

  return boosts;
}

/**
 * Registrar ejecución exitosa como patrón aprendido
 */
export async function recordCoalitionLearning(
  taskKeywords: string[],
  agentsUsed: string[],
  results: AgentResult[],
  collectiveScore: number
): Promise<void> {
  try {
    const memory = getCentralMemory();
    const successRate = collectiveScore / 100;

    // Registrar patrón general
    await memory.recordPattern(
      taskKeywords,
      agentsUsed,
      successRate
    );

    // Registrar ejecución para feedback futuro
    for (const result of results) {
      if (result.success) {
        await memory.recordExecution({
          id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          goal: taskKeywords.join(' '),
          spec: { agentId: result.agentId },
          skillsUsed: [result.agentName],
          durationMs: result.executionMs,
          status: 'success',
          results: { output: result.output.slice(0, 500) },
          errors: [],
          createdAt: new Date(),
          userId: 'system',
        } as any);
      }
    }
  } catch (error) {
    console.warn('[Coalition] Learning record error:', error);
  }
}

// ─── MEJORA 4: Peer Evaluation ────────────────────────────────────────────

export interface PeerEvaluationScore {
  evaluatorAgent: string;
  targetAgent: string;
  score: number; // 0-25
  feedback: string;
  timestamp: Date;
}

export interface PeerEvaluationResult {
  agentId: string;
  evaluationScore: number; // promedio de todos los evaluadores (0-25)
  shouldRetry: boolean;
  evaluations: PeerEvaluationScore[];
}

/**
 * Evaluadores reales (Claude Haiku) que revisan trabajo de otros agentes
 *
 * Matriz de evaluación:
 * - Security → Code: ¿hay vulnerabilidades?
 * - Performance → Code + Design: ¿es eficiente? ¿impacta perf?
 * - Design → Content: ¿copy es consistente visualmente?
 * - Analytics → Performance: ¿optimizaciones atacan KPIs?
 */
export async function evaluateAgentPeers(
  client: Anthropic,
  task: string,
  results: AgentResult[]
): Promise<Map<string, PeerEvaluationResult>> {
  const evaluations = new Map<string, PeerEvaluationResult>();

  try {
    // Matriz de evaluadores → targets
    const evaluationMatrix: Record<string, string[]> = {
      'agent-security-specialist': ['agent-code-specialist'],
      'agent-performance-specialist': ['agent-code-specialist', 'agent-design-specialist'],
      'agent-design-specialist': ['agent-content-specialist'],
      'agent-analytics-specialist': ['agent-performance-specialist'],
      'agent-research-specialist': ['agent-content-specialist'],
    };

    const evaluatorPrompts = new Map<string, string>();

    // Generar prompts de evaluación
    evaluatorPrompts.set('agent-security-specialist',
      `Eres auditor de seguridad. Revisa el código anterior.
      ¿Hay vulnerabilidades? ¿Headers faltantes? ¿SQL injection, XSS, CSRF?
      Score 0-25: 0=crítico, 13=aceptable, 25=excelente`
    );

    evaluatorPrompts.set('agent-performance-specialist',
      `Eres especialista en performance. Revisa código y diseño anteriores.
      ¿El código es eficiente? ¿Las animaciones impactan FCP? ¿Bundle size?
      Score 0-25: 0=muy lento, 13=aceptable, 25=optimizado`
    );

    evaluatorPrompts.set('agent-design-specialist',
      `Eres revisor de diseño. Revisa el copy anterior.
      ¿Es consistente con la marca visual? ¿Tiene jerarquía? ¿Es legible?
      Score 0-25: 0=inconsistente, 13=aceptable, 25=premium`
    );

    evaluatorPrompts.set('agent-analytics-specialist',
      `Eres especialista en Analytics. Revisa las optimizaciones de performance anteriores.
      ¿Atacan los KPIs correctos? ¿FCP, CTA, bounce? ¿Hay métrica a monitorear?
      Score 0-25: 0=no ataca KPIs, 13=aceptable, 25=perfectamente alineado`
    );

    evaluatorPrompts.set('agent-research-specialist',
      `Eres investigador. Revisa el copy anterior.
      ¿Es basado en datos? ¿Posicionamiento preciso? ¿Tone of voice correcto?
      Score 0-25: 0=especulativo, 13=aceptable, 25=data-driven`
    );

    // Ejecutar evaluaciones
    for (const [evaluatorId, targetIds] of Object.entries(evaluationMatrix)) {
      const evaluator = results.find((r) => r.agentId === evaluatorId);
      const evaluatorPrompt = evaluatorPrompts.get(evaluatorId);

      if (!evaluator || !evaluatorPrompt || !evaluator.success) {
        continue; // Saltar si el evaluador no ejecutó exitosamente
      }

      for (const targetId of targetIds) {
        const target = results.find((r) => r.agentId === targetId);
        if (!target || !target.success) continue;

        try {
          // Claude Haiku evalúa (económico + rápido)
          const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            system: evaluatorPrompt,
            messages: [{
              role: 'user',
              content: `TAREA: "${task}"

TRABAJO A EVALUAR (${target.agentName}):
${target.output.slice(0, 800)}

Evalúa. Dale score 0-25. Una justificación brevísima.`,
            }],
          });

          const feedbackBlock = response.content[0];
          const feedback = feedbackBlock && 'text' in feedbackBlock ? feedbackBlock.text : '';

          // Parser robusto: busca "score: XX" o solo números, con fallback seguro
          let score = 13; // default
          const scorePatterns = [
            /score\s*[:=]\s*(\d{1,2})/i,  // "score: 18" o "score=18"
            /(\d{1,2})[\/\-]\s*25/,        // "18/25" o "18-25"
            /^(\d{1,2})$/m,                // línea con solo número
            /(\d{1,2})/                    // cualquier número
          ];

          for (const pattern of scorePatterns) {
            const match = feedback.match(pattern);
            if (match && match[1]) {
              const parsed = parseInt(match[1], 10);
              if (!isNaN(parsed)) {
                score = Math.min(25, Math.max(0, parsed));
                break;
              }
            }
          }

          // Acumular evaluación
          if (!evaluations.has(targetId)) {
            evaluations.set(targetId, {
              agentId: targetId,
              evaluationScore: 0,
              shouldRetry: false,
              evaluations: [],
            });
          }

          const existing = evaluations.get(targetId)!;
          existing.evaluations.push({
            evaluatorAgent: evaluatorId,
            targetAgent: targetId,
            score,
            feedback: feedback.slice(0, 100),
            timestamp: new Date(),
          });

        } catch (err) {
          console.warn(`[Coalition] Peer evaluation error: ${evaluatorId} → ${targetId}`, err);
        }
      }
    }

    // Calcular scores promedio y auto-iteración
    for (const [agentId, evalResult] of evaluations) {
      if (evalResult.evaluations.length > 0) {
        const avgScore = evalResult.evaluations.reduce((s, e) => s + e.score, 0) / evalResult.evaluations.length;
        evalResult.evaluationScore = avgScore;
        evalResult.shouldRetry = avgScore < 13; // < 50% es retry
      }
    }

  } catch (error) {
    console.error('[Coalition] Peer evaluation fatal error:', error);
  }

  return evaluations;
}

/**
 * Resumen de mejoras para mostrar al usuario
 */
export function formatImprovementsSummary(
  learningApplied: string,
  messageChannelId: string | null,
  peerEvaluations: Map<string, PeerEvaluationResult>
): string {
  let summary = '';

  if (learningApplied) {
    summary += `\n📚 **Aprendizaje aplicado**: ${learningApplied}`;
  }

  if (messageChannelId) {
    summary += `\n💬 **Comunicación**: Agentes conectados vía canal ${messageChannelId.slice(0, 8)}…`;
  }

  if (peerEvaluations.size > 0) {
    const retryCount = Array.from(peerEvaluations.values()).filter((e) => e.shouldRetry).length;
    const avgScores = Array.from(peerEvaluations.values())
      .map((e) => e.evaluationScore)
      .filter((s) => s > 0);

    if (avgScores.length > 0) {
      const avgPeerScore = Math.round(avgScores.reduce((a, b) => a + b, 0) / avgScores.length);
      summary += `\n🔍 **Evaluación mutua**: ${avgPeerScore}/25 puntos promedio${retryCount > 0 ? ` | ${retryCount} agente(s) recomendados para re-ejecutar` : ' | ✅ Todos aprobados'}`;
    }
  }

  return summary;
}
