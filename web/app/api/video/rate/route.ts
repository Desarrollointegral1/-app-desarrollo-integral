/**
 * POST /api/video/rate
 * Da feedback a un corte de video para que el sistema aprenda.
 *
 * Body: { cutId: string, rating: 1-5, notes?: string, approved?: boolean }
 *
 * Desde /charles:
 *   "calificá el último corte de video con 5 estrellas, me encantó el ritmo"
 *   "ese corte que hiciste no me gustó, demasiado largo"
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateCut, getLearnedPreferences } from '@/lib/video-learning';

export async function POST(req: NextRequest) {
  let body: { cutId?: string; rating?: number; notes?: string; approved?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body inválido' }, { status: 400 });
  }

  if (!body.cutId || typeof body.cutId !== 'string') {
    return NextResponse.json({ success: false, error: 'cutId requerido' }, { status: 400 });
  }
  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json(
      { success: false, error: 'rating requerido (1-5)' },
      { status: 400 }
    );
  }

  const ok = await rateCut(body.cutId, body.rating, body.notes, body.approved);

  if (!ok) {
    return NextResponse.json(
      { success: false, error: 'No se pudo guardar el rating — verificar Supabase' },
      { status: 500 }
    );
  }

  // Devolver perfil actualizado
  const prefs = await getLearnedPreferences();

  return NextResponse.json({
    success: true,
    message: `⭐ Rating ${body.rating}/5 guardado. El sistema aprende de tu feedback.`,
    updatedProfile: {
      totalCuts:    prefs.totalCutsDone,
      avgRating:    prefs.avgRating,
      styleSummary: prefs.styleSummary,
      topTags:      prefs.topStyleTags,
    },
  });
}

export async function GET() {
  const prefs = await getLearnedPreferences();
  return NextResponse.json({
    endpoint: '/api/video/rate',
    description: 'Da feedback a un corte para que el sistema aprenda tu estilo',
    body: {
      cutId:    'string — ID del corte (viene en la respuesta de /api/video)',
      rating:   'number 1-5 — qué tan bien quedó',
      notes:    'string opcional — notas libres',
      approved: 'boolean opcional — true si lo aprobás para usar como ejemplo',
    },
    currentProfile: {
      totalCuts:    prefs.totalCutsDone,
      avgRating:    prefs.avgRating,
      styleSummary: prefs.styleSummary,
      topTags:      prefs.topStyleTags,
    },
  });
}
