/**
 * ============================================================
 * API Route: /api/coalition/monitor
 * Agente Primario de Monitoreo del Ecosistema
 * ============================================================
 *
 * GET /api/coalition/monitor
 *   → Análisis de salud del sistema (últimos 30 días por defecto)
 *
 * GET /api/coalition/monitor?days=7
 *   → Análisis de la última semana
 *
 * Responde con:
 *   - systemStatus: 'healthy' | 'warning' | 'critical'
 *   - agentHealth: estado de cada agente (trend, scores, alerts)
 *   - taskTypeHealth: qué tipos de tareas funcionan bien/mal
 *   - topIssues: lista de problemas detectados
 *   - recommendations: acciones concretas
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { runCoalitionMonitor } from '@/lib/coalition-monitor';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') ?? '30', 10);

  if (isNaN(days) || days < 1 || days > 365) {
    return NextResponse.json(
      { error: 'Parámetro "days" inválido. Rango: 1-365.' },
      { status: 400 }
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json(
      {
        error:  'Supabase no configurado.',
        hint:   'Agregar NEXT_PUBLIC_SUPABASE_URL al .env.local',
        status: 'unavailable',
      },
      { status: 503 }
    );
  }

  try {
    console.log(`[Monitor] Analizando ecosistema (últimos ${days} días)...`);
    const startTime = Date.now();

    const report = await runCoalitionMonitor(days);

    console.log(`[Monitor] Completado en ${Date.now() - startTime}ms — Status: ${report.systemStatus}`);

    // Emojis para el log
    const statusEmoji = { healthy: '✅', warning: '⚠️', critical: '🚨' }[report.systemStatus];
    console.log(`[Monitor] ${statusEmoji} ${report.totalCoalitions} coaliciones analizadas | Éxito: ${(report.successfulRate * 100).toFixed(0)}% | Avg score: ${report.avgCollectiveScore}/100`);

    return NextResponse.json({
      ok:       true,
      report,
      meta: {
        analyzedAt:    report.generatedAt,
        windowDays:    days,
        durationMs:    Date.now() - startTime,
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[Monitor] Error:', message);

    return NextResponse.json(
      {
        ok:    false,
        error: message,
        hint:  'Verificar que Supabase tiene datos en learning_patterns y agent_registry',
      },
      { status: 500 }
    );
  }
}
