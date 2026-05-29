/**
 * ============================================================
 * API Route: /api/coalition/stream
 * Streaming de Coalición con Server-Sent Events (SSE)
 * ============================================================
 *
 * Mismas capacidades que /api/coalition (batch), pero emite
 * cada resultado en cuanto el agente termina.
 *
 * Protocolo SSE:
 *   event: coalition_start     → agentes seleccionados + contexto
 *   event: phase_update        → "Ronda 1 iniciada", "Code Specialist..." etc.
 *   event: agent_result        → output de un agente (N veces)
 *   event: coalition_synthesis → resumen integrado final (Claude call extra)
 *   event: coalition_end       → score + summary completo
 *   event: error               → error fatal
 *
 * Pipeline completo (igual al batch):
 *   1. Context Collector — lee archivos reales del proyecto
 *   2. Model Selector    — Sonnet/Haiku según agente + complejidad
 *   3. Two-round         — análisis paralelo → Code Specialist
 *   4. Timeout 45s       — Promise.race por agente
 *   5. Síntesis          — Claude call final que integra outputs
 *   6. Supabase          — persiste coalición + eventos
 * ============================================================
 */

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  AGENT_REGISTRY,
  resolveInterAgentConflicts,
  type AgentBid,
  type AgentResult,
  type ConflictResolution,
} from '@/lib/parallel-agents';
import { collectProjectContext, formatContextForPrompt } from '@/lib/context-collector';
import { selectModels, formatModelAssignments } from '@/lib/model-selector';
import { runCodeSpecialistWithTools, type FileWrite } from '@/lib/agent-tools';
import { getSupabaseAgents } from '@/lib/supabase-agents';
import {
  getLearningBoosts,
  recordCoalitionLearning,
  evaluateAgentPeers,
  publishAgentSpec,
  subscribeToAgentSpecs,
  formatImprovementsSummary,
} from '@/lib/coalition-improvements';

// ─── Rate limiter ─────────────────────────────────────────────────────────────

const RATE_LIMIT   = 10;
const WINDOW_MS    = 60 * 1000;
const AGENT_TIMEOUT_MS = 45_000; // Timeout por agente individual

interface RateEntry { count: number; windowStart: number }
const streamRateMap = new Map<string, RateEntry>();

function checkRateLimit(ip: string): boolean {
  const now   = Date.now();
  const entry = streamRateMap.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    streamRateMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count += 1;
  return false;
}

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

// ─── Confidence (espeja parallel-agents.ts) ───────────────────────────────────

function calculateConfidence(
  agent: (typeof AGENT_REGISTRY)[0],
  taskKeywords: string[]
): number {
  const taskLower  = taskKeywords.map((k) => k.toLowerCase());
  const agentKw    = agent.keywords.map((k) => k.toLowerCase());

  const matches = taskLower.filter((tk) =>
    agentKw.some((ak) => {
      if (ak.includes(tk) || tk.includes(ak)) return true;
      if (tk.length >= 5 && ak.length >= 5)
        return ak.startsWith(tk.slice(0, 5)) || tk.startsWith(ak.slice(0, 5));
      return false;
    })
  ).length;

  const byTask       = matches / Math.max(taskLower.length, 1);
  const byAgent      = matches / Math.max(agentKw.length, 1);
  const keywordScore = Math.min(Math.max(byTask, byAgent), 1) * 0.5;
  const domainScore  = agent.domains.some((d) =>
    taskLower.some((tk) => tk.includes(d) || d.includes(tk))
  ) ? 0.35 : 0;
  const successScore = agent.successRate * 0.15;

  return keywordScore + domainScore + successScore;
}

// ─── SSE helpers ──────────────────────────────────────────────────────────────

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ─── Timeout wrapper ──────────────────────────────────────────────────────────
// Envuelve una promesa con un timeout. Si el agente no responde en AGENT_TIMEOUT_MS,
// devuelve un AgentResult de error para no bloquear la coalición entera.

function withAgentTimeout(
  promise: Promise<AgentResult>,
  agentName: string
): Promise<AgentResult> {
  const timeoutPromise = new Promise<AgentResult>((resolve) =>
    setTimeout(
      () =>
        resolve({
          agentId:     'timeout',
          agentName,
          emoji:       '⏱️',
          subtask:     '',
          output:      '',
          executionMs: AGENT_TIMEOUT_MS,
          tokensUsed:  0,
          success:     false,
          error:       `Timeout: ${agentName} no respondió en ${AGENT_TIMEOUT_MS / 1000}s`,
          score:       0,
        }),
      AGENT_TIMEOUT_MS
    )
  );
  return Promise.race([promise, timeoutPromise]);
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  if (checkRateLimit(ip)) {
    return new Response(
      sseEvent('error', { message: `Rate limit: máx ${RATE_LIMIT} req/min` }),
      { status: 429, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  let task: string;
  let options: { maxAgents?: number; threshold?: number } | undefined;

  try {
    const body = await request.json();
    task    = body.task?.trim() ?? '';
    options = body.options;
  } catch {
    return new Response(
      sseEvent('error', { message: 'JSON inválido en el body' }),
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  if (!task) {
    return new Response(
      sseEvent('error', { message: 'El campo "task" es requerido' }),
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      sseEvent('error', { message: 'ANTHROPIC_API_KEY no configurada' }),
      { status: 500, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  const confidenceThreshold = options?.threshold  ?? 0.50;
  const maxAgents           = options?.maxAgents  ?? 6;
  const defaultModel        = process.env.COALITION_MODEL || 'claude-3-5-haiku-20241022';
  const maxTokensPerAgent   = parseInt(process.env.COALITION_MAX_TOKENS || '1024');

  // ── Selección de agentes ──────────────────────────────────────────────────
  const taskKeywords = task
    .toLowerCase()
    .split(/\s+|[,;.!?]/)
    .filter((w) => w.length > 3);

  // ── MEJORA 3: Consultar patrones aprendidos ANTES de seleccionar ──────────
  let learningApplied = '';
  const learningBoosts = await getLearningBoosts(taskKeywords, AGENT_REGISTRY.map((a) => a.id));

  let bids: AgentBid[] = AGENT_REGISTRY.map((agent) => {
    let confidence = calculateConfidence(agent, taskKeywords);

    // Aplicar boost de aprendizaje si existe
    const boost = learningBoosts.get(agent.id);
    if (boost) {
      confidence = Math.min(1, Math.max(0, confidence + boost.confidenceBoost));
      if (!learningApplied) learningApplied = boost.learningSource;
    }

    return {
      agentId:      agent.id,
      agentName:    agent.name,
      confidence,
      canDo:        agent.domains.slice(0, 3),
      reasoning:    `Confidence ${(confidence * 100).toFixed(0)}%${boost ? ` (boost: ${boost.confidenceBoost > 0 ? '+' : ''}${(boost.confidenceBoost * 100).toFixed(0)}%)` : ''}`,
      willingToLead: confidence >= 0.80,
    };
  });

  let selected = bids.filter((b) => b.confidence >= confidenceThreshold);

  // Regla: Code siempre si 3+ agentes design/content
  const dcCount = selected.filter((b) =>
    ['agent-design-specialist', 'agent-content-specialist', 'agent-media-specialist'].includes(b.agentId)
  ).length;
  const codeBidBase = bids.find((b) => b.agentId === 'agent-code-specialist');
  if (dcCount >= 3 && !selected.some((b) => b.agentId === 'agent-code-specialist') && codeBidBase) {
    selected.push(codeBidBase);
  }

  selected = selected.sort((a, b) => b.confidence - a.confidence).slice(0, maxAgents);

  if (selected.length === 0) {
    selected = bids
      .filter((b) => b.confidence >= 0.50)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  // ── ReadableStream para SSE ───────────────────────────────────────────────
  const startTime = Date.now();
  const client    = new Anthropic({ apiKey });

  const stream = new ReadableStream({
    async start(controller) {
      const enc  = new TextEncoder();
      const emit = (event: string, data: unknown) => {
        try {
          controller.enqueue(enc.encode(sseEvent(event, data)));
        } catch { /* cliente desconectado */ }
      };

      try {
        // ── FASE 1: Context Collector ───────────────────────────────────────
        emit('phase_update', { phase: 'context', message: '📁 Recolectando contexto del proyecto…' });

        let contextPrompt = '';
        let contextMeta   = { files: 0, chars: 0 };

        try {
          const ctx = await collectProjectContext(task);
          contextPrompt = formatContextForPrompt(ctx);
          contextMeta   = { files: ctx.files.length, chars: ctx.totalChars };
          console.log(`[Stream] Context: ${ctx.files.length} archivos, ${(ctx.totalChars / 1000).toFixed(1)}k chars`);
        } catch {
          console.warn('[Stream] Context Collector no disponible');
        }

        // ── FASE 2: Model Selector ──────────────────────────────────────────
        const modelAssignments = selectModels(selected.map((b) => b.agentId), task);
        console.log(`[Stream] Models: ${formatModelAssignments(modelAssignments)}`);

        // ── FASE 3: Two-round detection ─────────────────────────────────────
        const hasCode      = selected.some((b) => b.agentId === 'agent-code-specialist');
        const analysisOnly = selected.filter((b) => b.agentId !== 'agent-code-specialist');
        const codeBid      = selected.find((b) => b.agentId === 'agent-code-specialist');
        const useTwoRounds = hasCode && analysisOnly.length > 0;
        const roundCount   = useTwoRounds ? 2 : 1;

        // Emitir coalition_start con toda la info
        emit('coalition_start', {
          task,
          agentsSelected: selected.map((b) => ({
            id:         b.agentId,
            name:       b.agentName,
            confidence: Math.round(b.confidence * 100),
            isLeader:   b.willingToLead,
            emoji:      AGENT_REGISTRY.find((a) => a.id === b.agentId)?.emoji ?? '🤖',
            model:      modelAssignments[b.agentId]?.model ?? defaultModel,
          })),
          agentCount:  selected.length,
          contextFiles: contextMeta.files,
          contextChars: contextMeta.chars,
          roundCount,
        });

        // ── Helper: ejecutar un agente de análisis con timeout ──────────────
        const runAgent = (bid: AgentBid): Promise<AgentResult> => {
          const agentConfig = AGENT_REGISTRY.find((a) => a.id === bid.agentId)!;
          const agentModel  = modelAssignments[bid.agentId]?.model ?? defaultModel;
          const agentStart  = Date.now();

          const agentPromise = (async (): Promise<AgentResult> => {
            const teammates = selected
              .filter((b) => b.agentId !== bid.agentId)
              .map((b) => `- ${b.agentName} (${(b.confidence * 100).toFixed(0)}%)`)
              .join('\n');

            const userPrompt = `TAREA DE LA COALICIÓN: "${task}"

TU COALICIÓN HOY:
${teammates}

TU ROL EN ESTA TAREA:
Eres el experto en ${bid.canDo.join(', ')}.
Confidence: ${(bid.confidence * 100).toFixed(0)}%.

Analiza la tarea y entrega TU CONTRIBUCIÓN ESPECÍFICA — concreta, técnica, accionable.

## Análisis
[desde tu perspectiva]

## Contribución
[especificaciones / plan / restricciones concretas]

## Handoff
[qué necesitan los otros agentes de ti]
${contextPrompt ? `\n${contextPrompt}` : ''}`;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await (client.messages.create as any)({
              model:      agentModel,
              max_tokens: maxTokensPerAgent,
              system: [{ type: 'text', text: agentConfig.systemPrompt, cache_control: { type: 'ephemeral' } }],
              messages: [{ role: 'user', content: userPrompt }],
            });

            const outputText  = (response.content[0]?.text as string | undefined) ?? '';
            const execMs      = Date.now() - agentStart;
            const tokens      = (response.usage.input_tokens as number) + (response.usage.output_tokens as number);
            const detail      = outputText.length > 500 ? 4 : outputText.length > 200 ? 2 : 0;
            const rateBonus   = Math.floor(agentConfig.successRate * 3);
            const score       = Math.min(18 + detail + rateBonus, 25);

            const result = {
              agentId:     bid.agentId,
              agentName:   bid.agentName,
              emoji:       agentConfig.emoji,
              subtask:     agentConfig.domains[0],
              output:      outputText,
              executionMs: execMs,
              tokensUsed:  tokens,
              success:     true,
              score,
            };

            // ── MEJORA 2: Publicar specs en MessageBroker (los otros agentes pueden leer) ──
            try {
              await publishAgentSpec(bid.agentId, bid.agentName, outputText.slice(0, 1000));
            } catch {
              // MessageBroker no crítico
            }

            return result;
          })();

          return withAgentTimeout(agentPromise, bid.agentName);
        };

        // ── EJECUCIÓN: una o dos rondas ─────────────────────────────────────
        let allResults:         AgentResult[]                          = [];
        let allFilesWritten:    FileWrite[]                            = [];
        let conflictResolution: ConflictResolution | null = null;
        let peerEvaluations:    Map<string, any>                       = new Map();

        if (useTwoRounds) {
          // Ronda 1: análisis en paralelo, emitir cada uno al terminar
          emit('phase_update', {
            phase:   'round1',
            message: `🔵 Ronda 1: ${analysisOnly.length} agentes en paralelo…`,
          });

          const round1Promises = analysisOnly.map(async (bid) => {
            const result = await runAgent(bid);
            // Emitir en cuanto termina (no esperar a los demás)
            emit('agent_result', { ...result, model: modelAssignments[bid.agentId]?.model });
            return result;
          });

          const round1Results = await Promise.all(round1Promises);
          allResults.push(...round1Results);

          // ── MEJORA 4: Peer Evaluation ANTES de resolver conflictos ────────
          emit('phase_update', {
            phase:   'peer_evaluation',
            message: '🔍 Evaluación mutua entre agentes…',
          });

          const peerEvaluations = await evaluateAgentPeers(client, task, round1Results);
          let improvementsSummary = formatImprovementsSummary(learningApplied, null, peerEvaluations);

          // Auto-iteración: si score < 50% (13/25), re-ejecutar ese agente
          const agentsToRetry = Array.from(peerEvaluations.entries())
            .filter(([_, evalResult]) => evalResult.shouldRetry)
            .map(([agentId, _]) => round1Results.find((r) => r.agentId === agentId)!);

          if (agentsToRetry.length > 0) {
            emit('phase_update', {
              phase:   'retry',
              message: `⚠️ ${agentsToRetry.length} agente(s) necesitan mejora — re-ejecutando…`,
            });

            const retryPromises = agentsToRetry.map(async (failedResult) => {
              const failedBid = analysisOnly.find((b) => b.agentId === failedResult.agentId)!;
              const retryResult = await runAgent(failedBid);
              emit('agent_result', {
                ...retryResult,
                model: modelAssignments[failedBid.agentId]?.model,
                isRetry: true,
              });

              // Reemplazar resultado anterior
              const idx = allResults.findIndex((r) => r.agentId === failedResult.agentId);
              if (idx >= 0) allResults[idx] = retryResult;

              return retryResult;
            });

            await Promise.allSettled(retryPromises);
          }

          // Ronda 1.5: Resolución de conflictos inter-agente
          emit('phase_update', {
            phase:   'conflicts',
            message: '🤝 Verificando consistencia entre agentes…',
          });

          conflictResolution = await resolveInterAgentConflicts(
            client,
            task,
            allResults.filter((r) => r.agentId !== 'agent-code-specialist'),
            modelAssignments['agent-design-specialist']?.model ?? defaultModel,
          );

          if (conflictResolution.hasConflicts) {
            emit('phase_update', {
              phase:   'conflicts_resolved',
              message: `⚡ ${conflictResolution.conflicts.length} conflicto(s) resuelto(s) — specs reconciliadas`,
            });
          } else {
            emit('phase_update', {
              phase:   'conflicts_resolved',
              message: '✅ Specs consistentes entre agentes',
            });
          }

          // Ronda 2: Code Specialist con specs reconciliadas
          if (codeBid) {
            emit('phase_update', {
              phase:   'round2',
              message: `🟡 Ronda 2: Code Specialist implementando${conflictResolution.hasConflicts ? ' specs reconciliadas' : ''}…`,
            });

            const codeConfig = AGENT_REGISTRY.find((a) => a.id === 'agent-code-specialist')!;
            const codeModel  = modelAssignments['agent-code-specialist']?.model ?? defaultModel;
            const codeStart  = Date.now();

            const codePrompt = `TAREA DE LA COALICIÓN: "${task}"

═══ ESPECIFICACIONES DE RONDA 1${conflictResolution.hasConflicts ? ' (RECONCILIADAS — conflictos resueltos)' : ''} ═══

${conflictResolution.resolvedSpecs}

═══ FIN ESPECIFICACIONES ═══

INSTRUCCIÓN: Implementa los cambios reales usando tus herramientas (read_file, write_file, verify_files_written).

PROCESO:
1. Lee los archivos a modificar con read_file
2. Implementa los cambios según las specs anteriores
3. Escribe con write_file (archivo completo)
4. Verifica con run_build_check y verify_files_written
5. Resume qué implementaste
${contextPrompt ? `\n${contextPrompt}` : ''}`;

            try {
              const { output, writtenFiles, tokensUsed } = await runCodeSpecialistWithTools(
                client,
                codeModel,
                codeConfig.systemPrompt,
                codePrompt,
                maxTokensPerAgent * 3
              );

              allFilesWritten = writtenFiles;

              const codeResult: AgentResult = {
                agentId:     'agent-code-specialist',
                agentName:   'Code Specialist',
                emoji:       '💻',
                subtask:     'implementation',
                output:      output + (writtenFiles.length > 0
                  ? `\n\n✅ **${writtenFiles.length} archivo(s) escritos**:\n${writtenFiles.map((f) => `- \`${f.path}\`: ${f.description}`).join('\n')}`
                  : ''),
                executionMs: Date.now() - codeStart,
                tokensUsed,
                success:     true,
                score:       24, // Code Specialist siempre alto si implementó
              };

              emit('agent_result', { ...codeResult, model: codeModel });
              allResults.push(codeResult);
            } catch (err) {
              const errResult: AgentResult = {
                agentId:     'agent-code-specialist',
                agentName:   'Code Specialist',
                emoji:       '💻',
                subtask:     'implementation',
                output:      '',
                executionMs: Date.now() - codeStart,
                tokensUsed:  0,
                success:     false,
                error:       err instanceof Error ? err.message : 'Error en Code Specialist',
                score:       0,
              };
              emit('agent_result', { ...errResult, model: codeModel });
              allResults.push(errResult);
            }
          }

        } else {
          // Ronda única: todos en paralelo
          emit('phase_update', {
            phase:   'round1',
            message: `🚀 Ejecutando ${selected.length} agentes en paralelo…`,
          });

          const agentPromises = selected.map(async (bid) => {
            // Si el único es Code Specialist, usar tool_use directamente
            if (bid.agentId === 'agent-code-specialist' && selected.length === 1) {
              const codeConfig = AGENT_REGISTRY.find((a) => a.id === 'agent-code-specialist')!;
              const codeModel  = modelAssignments['agent-code-specialist']?.model ?? defaultModel;
              const codeStart  = Date.now();

              const codePrompt = `TAREA: "${task}"
Implementa los cambios directamente en el proyecto usando tus herramientas.
${contextPrompt ? `\n${contextPrompt}` : ''}`;

              try {
                const { output, writtenFiles, tokensUsed } = await runCodeSpecialistWithTools(
                  client, codeModel, codeConfig.systemPrompt, codePrompt, maxTokensPerAgent * 3
                );
                allFilesWritten = writtenFiles;
                const r: AgentResult = {
                  agentId: 'agent-code-specialist', agentName: 'Code Specialist', emoji: '💻',
                  subtask: 'implementation', output, executionMs: Date.now() - codeStart,
                  tokensUsed, success: true, score: 24,
                };
                emit('agent_result', { ...r, model: codeModel });
                return r;
              } catch (err) {
                const r: AgentResult = {
                  agentId: 'agent-code-specialist', agentName: 'Code Specialist', emoji: '💻',
                  subtask: 'implementation', output: '', executionMs: Date.now() - codeStart,
                  tokensUsed: 0, success: false,
                  error: err instanceof Error ? err.message : 'Error', score: 0,
                };
                emit('agent_result', { ...r, model: codeModel });
                return r;
              }
            }

            const result = await runAgent(bid);
            emit('agent_result', { ...result, model: modelAssignments[bid.agentId]?.model });
            return result;
          });

          allResults = await Promise.all(agentPromises);
        }

        // ── FASE 4: Score colectivo ─────────────────────────────────────────
        const totalScore    = allResults.reduce((s, r) => s + (r.score ?? 0), 0);
        const collectiveScore = Math.round((totalScore / (allResults.length * 25)) * 100);
        const totalTokens   = allResults.reduce((s, r) => s + r.tokensUsed, 0);

        // ── FASE 5: Síntesis final ──────────────────────────────────────────
        // Un Claude call extra que integra todos los outputs en una respuesta unificada.
        const successfulResults = allResults.filter((r) => r.success);

        if (successfulResults.length >= 2) {
          emit('phase_update', {
            phase:   'synthesis',
            message: '🧩 Sintetizando outputs en respuesta unificada…',
          });

          try {
            const summaryForSynthesis = successfulResults
              .map((r) => `### ${r.emoji} ${r.agentName}\n${r.output.slice(0, 1200)}`)
              .join('\n\n---\n\n');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const synthResponse = await (client.messages.create as any)({
              model:      defaultModel, // modelo activo del entorno
              max_tokens: 1024,
              system: [{
                type: 'text',
                text: `Eres un coordinador de equipos de IA. Tu único trabajo es tomar los outputs de múltiples agentes especializados y producir UNA respuesta coherente, integrada y accionable. Sin redundancias. Sin lista de quién dijo qué. Una sola voz, un solo plan.`,
                cache_control: { type: 'ephemeral' },
              }],
              messages: [{
                role: 'user',
                content: `TAREA ORIGINAL: "${task}"

OUTPUTS DE LOS AGENTES ESPECIALIZADOS:

${summaryForSynthesis}

Produce una síntesis integrada: un plan de acción unificado que combine todas las perspectivas.
- Organizado en secciones claras (no por agente, sino por tema)
- Prioridades claras (qué hacer primero)
- Handoff listo para ejecutar
- Máximo 400 palabras`,
              }],
            });

            const synthesis = (synthResponse.content[0]?.text as string | undefined) ?? '';

            if (synthesis) {
              emit('coalition_synthesis', {
                synthesis,
                tokensUsed: (synthResponse.usage.input_tokens as number) + (synthResponse.usage.output_tokens as number),
              });
            }
          } catch {
            // Síntesis no crítica — continuar sin ella
          }
        }

        // ── FASE 5.5: Registrar aprendizaje (MEJORA 3) ──────────────────────
        if (collectiveScore >= 75) {
          try {
            await recordCoalitionLearning(
              taskKeywords,
              selected.map((b) => b.agentId),
              allResults,
              collectiveScore
            );
          } catch {
            // Aprendizaje no crítico
          }
        }

        // ── FASE 6: Persistir en Supabase ───────────────────────────────────
        try {
          const db = getSupabaseAgents();
          const coalitionId = await db.createCoalition({
            task_description:        task,
            task_keywords:           taskKeywords.slice(0, 10),
            agents_selected:         selected.map((b) => b.agentId),
            agent_confidence_scores: Object.fromEntries(selected.map((b) => [b.agentId, b.confidence])),
            final_score:             collectiveScore,
            outcome:                 collectiveScore >= 75 ? 'success' : 'escalated',
            duration_minutes:        Math.ceil((Date.now() - startTime) / 60000),
          });
          await db.logEvent({
            event_type:   'coalition_stream_completed',
            level:        4,
            coalition_id: coalitionId,
            description:  `SSE coalición: ${selected.length} agentes | score: ${collectiveScore} | rondas: ${roundCount} | learning: ${learningApplied ? 'applied' : 'no_history'}`,
            metadata:     { contextFiles: contextMeta.files, filesWritten: allFilesWritten.length, peerEvaluations: peerEvaluations?.size ?? 0 },
          });
          await Promise.allSettled(
            allResults.map((r) => db.updateAgentSuccessRate(r.agentId, r.success))
          );
        } catch { /* Supabase no disponible */ }

        // ── Evento final ────────────────────────────────────────────────────
        emit('coalition_end', {
          collectiveScore,
          totalExecutionMs: Date.now() - startTime,
          totalTokensUsed:  totalTokens,
          parallelSpeedup:  `${selected.length}x vs secuencial`,
          iterations:       1,
          roundCount,
          contextFiles:     contextMeta.files,
          contextChars:     contextMeta.chars,
          conflicts:        conflictResolution?.conflicts ?? [],
          filesWritten:     allFilesWritten.map((f) => ({
            path:        f.path,
            description: f.description,
            sizeChars:   f.content.length,
          })),
          improvements: {
            learningApplied,
            peerEvaluationsCount: peerEvaluations.size,
            improvementsSummary: formatImprovementsSummary(learningApplied, null, peerEvaluations),
          },
        });

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error interno';
        console.error('[Stream] Error fatal:', message);
        emit('error', { message });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':    'text/event-stream',
      'Cache-Control':   'no-cache, no-transform',
      'Connection':      'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
