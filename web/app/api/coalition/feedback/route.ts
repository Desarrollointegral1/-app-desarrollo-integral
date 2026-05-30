/**
 * POST /api/coalition/feedback
 * ──────────────────────────────
 * Recibe el 👍/👎 del usuario sobre el resultado de un agente.
 * Actualiza el success_rate en Supabase con peso extra al feedback humano.
 *
 * Requiere autenticación:
 *   Header: Authorization: Bearer <JWT_TOKEN>
 *   (el token es extraído y validado por middleware de autenticación)
 *
 * Body: { coalitionId: string, agentId: string, rating: 'up'|'down', note?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAgents } from '@/lib/supabase-agents';
import { validateCoalitionOwnership } from '@/lib/coalition-auth';

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

    // AUTH VALIDATION: Extract user ID from request header
    // In production, this comes from JWT token validation middleware
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: missing x-user-id header' },
        { status: 401 }
      );
    }

    // AUTH VALIDATION: Verify user owns the coalition
    if (coalitionId) {
      const isOwner = await validateCoalitionOwnership(coalitionId, userId);
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Forbidden: not owner of this coalition' },
          { status: 403 }
        );
      }
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

      // Guardar patrón de aprendizaje si hay feedback exitoso
      if (wasSuccessful) {
        const keywords = (note || '')
          .toLowerCase()
          .split(/\s+|[,;.!?]/)
          .filter((w: string) => w.length > 3)
          .slice(0, 8);

        await db.saveLearningPattern({
          agentIds: [agentId],
          keywords: keywords.length > 0 ? keywords : ['feedback'],
          score: wasSuccessful ? 100 : 0,
          description: `Human feedback (${rating}) for ${agentId}${note ? `: ${note.slice(0, 50)}` : ''}`,
          context: { feedback: note, coalitionId, timestamp: Date.now() },
        });
      }

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
