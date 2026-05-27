/**
 * ============================================================
 * API Route: /api/coalition
 * Coalición de Agentes Paralelos — Anthropic SDK
 * ============================================================
 *
 * POST /api/coalition
 * Body: { task: string, options?: { maxAgents?: number, threshold?: number } }
 *
 * Rate limiting: 10 req/min por IP (in-memory, se resetea al reiniciar)
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { runParallelCoalition, formatCoalitionResult, type AgentResult } from '@/lib/parallel-agents';
import { detectExternalToolRequests, generateCharlesInstructions } from '@/lib/external-tools';
import fs   from 'fs';
import path from 'path';

// ─── Log de coalición en docs/DESARROLLO-INTEGRAL.md ─────────────────────────
function logCoalitionRun(task: string, score: number, agentCount: number, ms: number) {
  try {
    const docsPath = path.join(process.cwd(), 'docs', 'DESARROLLO-INTEGRAL.md');
    if (!fs.existsSync(docsPath)) return;

    let content = fs.readFileSync(docsPath, 'utf-8');
    const today  = new Date().toISOString().slice(0, 10);
    const entry  = `| ${today} | ${score}/100 | ${agentCount} agentes | ${Math.round(ms / 1000)}s | ${task.slice(0, 70)}${task.length > 70 ? '...' : ''} |`;
    const section = '## Historial de Coaliciones (auto-generado)';
    const header  = `${section}\n\n| Fecha | Score | Agentes | Tiempo | Tarea |\n|---|---|---|---|---|\n`;

    if (content.includes(section)) {
      // Insertar nueva fila justo después del header de tabla
      content = content.replace(
        /(\| Fecha \| Score \| Agentes \| Tiempo \| Tarea \|\n\|[-|]+\|\n)/,
        `$1${entry}\n`
      );
    } else {
      content += `\n\n${header}${entry}\n`;
    }

    // Actualizar timestamp
    content = content.replace(
      /\*\*Última actualización:\*\* .+/,
      `**Última actualización:** ${today}`
    );

    fs.writeFileSync(docsPath, content, 'utf-8');
  } catch {
    // No interrumpir el flujo si el log falla
  }
}

// ─── Síntesis final ───────────────────────────────────────────────────────────
// Un Claude call extra que integra todos los outputs en un plan coherente.

async function synthesizeResults(
  task: string,
  results: AgentResult[],
  apiKey: string
): Promise<string | null> {
  const successful = results.filter((r) => r.success);
  if (successful.length < 2) return null;

  try {
    const client = new Anthropic({ apiKey });
    const summary = successful
      .map((r) => `### ${r.emoji} ${r.agentName}\n${r.output.slice(0, 1200)}`)
      .join('\n\n---\n\n');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (client.messages.create as any)({
      model:      process.env.COALITION_MODEL || 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: [{
        type: 'text',
        text: `Eres un coordinador de equipos de IA. Toma los outputs de múltiples agentes especializados y produce UNA respuesta coherente, integrada y accionable. Sin redundancias. Sin lista de quién dijo qué. Una sola voz, un solo plan.`,
        cache_control: { type: 'ephemeral' },
      }],
      messages: [{
        role: 'user',
        content: `TAREA ORIGINAL: "${task}"

OUTPUTS DE LOS AGENTES:

${summary}

Produce una síntesis integrada: plan de acción unificado que combine todas las perspectivas.
- Organizado por tema (no por agente)
- Prioridades claras (qué hacer primero)
- Listo para ejecutar
- Máximo 400 palabras`,
      }],
    });

    return (response.content[0]?.text as string | undefined) ?? null;
  } catch {
    return null;
  }
}

// ─── Rate limiter in-memory ───────────────────────────────────────────────────
// Mapa: ip → { count, windowStart }
// Se resetea automáticamente cada WINDOW_MS.

const RATE_LIMIT = 10;          // máx requests por ventana
const WINDOW_MS  = 60 * 1000;   // ventana de 1 minuto

interface RateEntry { count: number; windowStart: number }
const rateLimitMap = new Map<string, RateEntry>();

function isRateLimited(ip: string): { limited: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // Primera request o ventana expirada — reset
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return { limited: false, remaining: RATE_LIMIT - 1, resetMs: WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT) {
    const resetMs = WINDOW_MS - (now - entry.windowStart);
    return { limited: true, remaining: 0, resetMs };
  }

  entry.count += 1;
  return { limited: false, remaining: RATE_LIMIT - entry.count, resetMs: WINDOW_MS - (now - entry.windowStart) };
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ─── POST — ejecutar coalición ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request);
  const { limited, remaining, resetMs } = isRateLimited(ip);

  if (limited) {
    return NextResponse.json(
      {
        success: false,
        error: `Rate limit alcanzado. Máximo ${RATE_LIMIT} requests/minuto.`,
        retryAfterMs: resetMs,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(resetMs / 1000)),
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil((Date.now() + resetMs) / 1000)),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { task, options } = body;

    if (!task || typeof task !== 'string' || task.trim().length === 0) {
      return NextResponse.json(
        { error: 'El campo "task" es requerido y debe ser un string no vacío.' },
        { status: 400 }
      );
    }

    if (task.length > 2000) {
      return NextResponse.json(
        { error: 'La tarea no puede superar 2000 caracteres.' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY no configurada en variables de entorno.' },
        { status: 500 }
      );
    }

    console.log(`[Coalition] IP=${ip} | Tarea: "${task.slice(0, 80)}..."`);
    const startTime = Date.now();

    const result = await runParallelCoalition(task.trim(), {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.COALITION_MODEL || 'claude-3-5-haiku-20241022',
      maxTokensPerAgent: parseInt(process.env.COALITION_MAX_TOKENS || '1024'),
      confidenceThreshold: options?.threshold ?? 0.50,
      maxAgents: options?.maxAgents ?? 6,
    });

    const totalMs = Date.now() - startTime;
    console.log(`[Coalition] Completado en ${totalMs}ms — Score: ${result.collectiveScore}/100`);

    // Log automático en docs/DESARROLLO-INTEGRAL.md
    logCoalitionRun(task.trim(), result.collectiveScore, result.selectedAgents.length, totalMs);

    // Síntesis final (call extra a Claude — paralela al formateo)
    const synthesis = await synthesizeResults(
      task.trim(),
      result.results,
      process.env.ANTHROPIC_API_KEY!
    );

    // Detectar herramientas externas (Adobe/BrightData) pedidas por los agentes
    const externalRequests = result.results.flatMap((r) =>
      r.success ? detectExternalToolRequests(r.output, r.agentId) : []
    );
    const charlesInstructions = generateCharlesInstructions(externalRequests);

    return NextResponse.json(
      {
        success: true,
        task: result.taskDescription,
        coalition: {
          agentsSelected: result.selectedAgents.map((a) => ({
            id: a.agentId,
            name: a.agentName,
            confidence: Math.round(a.confidence * 100),
            isLeader: a.willingToLead,
          })),
          agentCount: result.selectedAgents.length,
        },
        results: result.results.map((r) => ({
          agentId: r.agentId,
          agentName: r.agentName,
          emoji: r.emoji,
          success: r.success,
          output: r.output,
          score: result.peerScores[r.agentId] ?? 0,
          executionMs: r.executionMs,
          tokensUsed: r.tokensUsed,
          error: r.error,
          model: result.modelAssignments[r.agentId]?.model ?? 'unknown',
        })),
        summary: {
          collectiveScore: result.collectiveScore,
          totalExecutionMs: result.totalExecutionMs,
          totalTokensUsed: result.totalTokensUsed,
          iterations: result.iterations,
          roundCount: result.roundCount,
          parallelSpeedup: `${result.selectedAgents.length}x vs secuencial`,
          contextFiles: result.contextUsed?.files.length ?? 0,
          contextChars: result.contextUsed?.totalChars ?? 0,
        },
        filesWritten: result.filesToWrite.map((f) => ({
          path: f.path,
          description: f.description,
          sizeChars: f.content.length,
        })),
        conflicts:          result.conflicts,
        learningApplied:    result.learningApplied,
        synthesis,
        pattern:            result.pattern,
        formatted:          formatCoalitionResult(result),
        externalTools: {
          requests:     externalRequests.map((r) => ({ tool: r.tool, requestedBy: r.requestedBy })),
          instructions: charlesInstructions || null,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': String(remaining),
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    console.error('[Coalition] Error:', message);

    return NextResponse.json(
      {
        success: false,
        error: message,
        hint: message.includes('ANTHROPIC_API_KEY')
          ? 'Agrega ANTHROPIC_API_KEY a tu .env.local'
          : 'Verifica los logs del servidor para más detalles.',
      },
      { status: 500 }
    );
  }
}

// ─── GET — info del endpoint ──────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/coalition',
    description: 'Ejecuta una coalición de agentes especializados en paralelo (Promise.all)',
    rateLimit: `${RATE_LIMIT} requests/minuto por IP`,
    usage: {
      method: 'POST',
      body: {
        task: 'string — descripción de la tarea (máx 2000 chars)',
        options: {
          maxAgents: 'number (default: 6) — máximo de agentes en coalición',
          threshold: 'number (default: 0.50) — confidence mínimo para participar',
        },
      },
    },
    agents: [
      'agent-design-specialist 🎨',
      'agent-performance-specialist ⚡',
      'agent-security-specialist 🔒',
      'agent-code-specialist 💻',
      'agent-content-specialist ✍️',
      'agent-research-specialist 🔍',
      'agent-media-specialist 🎥',
      'agent-analytics-specialist 📊',
    ],
    parallelism: 'Real — Promise.all() + múltiples llamadas Anthropic simultáneas',
    model: process.env.COALITION_MODEL || 'claude-3-5-haiku-20241022',
  });
}
