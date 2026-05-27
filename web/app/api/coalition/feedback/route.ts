/**
 * POST /api/coalition/feedback
 * ──────────────────────────────
 * Recibe el 👍/👎 del usuario sobre el resultado de un agente.
 * Actualiza el success_rate en Supabase con peso extra al feedback humano.
 *
 * Body: { coalitionId: string, agentId: string, rating: 'up'|'down', note?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAgents } from '@/lib/supabase-agents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coalitionId, agentId, rating, note } = body;

    if (!agentId || !rating || !['up', 'down'].includes(rating)) {
      return NextResponse.json(
        { error: 'Requiere: agentId (string) y rating ("up" | "down")' },
        { status: 400 }
      );
    }

    const wasSuccessful = rating === 'up';

    try {
      const db = getSupabaseAgents();

      // Actualizar success_rate del agente en Supabase
      // El feedback humano tiene más peso que el automático
      await db.updateAgentSuccessRate(agentId, wasSuccessful);

      // Loguear el evento
      await db.logEvent({
        event_type:   'human_feedback',
        level:        3,
        agent:        agentId,
        coalition_id: coalitionId,
        description:  `Feedback ${rating === 'up' ? '👍' : '👎'} para ${agentId}${note ? `: ${note}` : ''}`,
        metadata:     { rating, note, coalitionId },
      });

      // Si hay coalitionId, actualizar la coalición en el historial
      if (coalitionId) {
        await db.updateCoalition(coalitionId, {
          outcome: wasSuccessful ? 'success' : 'escalated',
        });
      }
    } catch (dbErr) {
      // Supabase no disponible — registrar en consola pero no fallar
      console.warn('[Feedback] Supabase no disponible:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Feedback ${rating === 'up' ? '👍' : '👎'} registrado para ${agentId}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    );
  }
}
