/**
 * ============================================================
 * /api/creative — Endpoint de Generación de Media Creativo
 * ============================================================
 *
 * POST /api/creative
 *   Body: CreativeRequest
 *   → Refina la idea con Claude → Genera imagen o video con FAL.ai
 *   → Devuelve URL pública + preview HTML
 *
 * GET /api/creative
 *   → Documentación del endpoint
 *
 * Desde /charles:
 *   "/charles generá una imagen de un atleta entrenando al amanecer"
 *   "/charles hacé un video cinematic de 5s del gym"
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  generateCreativeMedia,
  detectMediaType,
  type CreativeRequest,
} from '@/lib/creative-media';

// ─── GET — Documentación ──────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/creative',
    description: 'Generación de imágenes y videos con IA vía FAL.ai',
    requiresKey: 'FAL_API_KEY en .env.local',
    getKey: 'https://fal.ai → Settings → API Keys (gratis para empezar)',
    models: {
      image: {
        fast:    'fal-ai/flux/schnell    — ~3s   — $0.003/imagen — ideal para pruebas',
        quality: 'fal-ai/flux-pro        — ~8s   — $0.05/imagen  — calidad máxima',
      },
      video: {
        fast:    'kling-video/v1.6/standard — ~60-90s — $0.08/video',
        quality: 'kling-video/v1.6/pro      — ~60-90s — $0.28/video',
      },
    },
    body: {
      rawIdea:   'string — Idea bruta, en español o inglés',
      mediaType: "'image' | 'video' — Auto-detectado si no se especifica",
      style:     'string? — Estilo: "premium", "energético", "minimalista"',
      ratio:     "'1:1' | '16:9' | '9:16' | '4:3' — Default 16:9",
      duration:  '5 | 10 — Solo video, segundos. Default 5',
      quality:   "'fast' | 'quality' — Default: fast",
      context:   'string? — Uso final: "para Instagram Stories", "para el hero de la web"',
    },
    examples: [
      {
        rawIdea:   'atleta entrenando con pesas en gym premium oscuro, iluminación dramática',
        mediaType: 'image',
        quality:   'fast',
        ratio:     '16:9',
      },
      {
        rawIdea:   'video cinematic de un gym premium vacío al amanecer, luz dorada entrando por las ventanas',
        mediaType: 'video',
        quality:   'fast',
        duration:  5,
      },
    ],
  });
}

// ─── POST — Generar media ─────────────────────────────────────────────────────

interface RequestBody {
  rawIdea?:   string;
  mediaType?: 'image' | 'video';
  style?:     string;
  ratio?:     '1:1' | '16:9' | '9:16' | '4:3';
  duration?:  5 | 10;
  quality?:   'fast' | 'quality';
  context?:   string;
}

export async function POST(req: NextRequest) {
  const startMs = Date.now();

  // ── Validación de body ────────────────────────────────────────────────────
  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body inválido — se espera JSON' },
      { status: 400 }
    );
  }

  const { rawIdea, mediaType, style, ratio, duration, quality, context } = body;

  if (!rawIdea || typeof rawIdea !== 'string' || rawIdea.trim().length < 3) {
    return NextResponse.json(
      { success: false, error: 'rawIdea es requerido (mínimo 3 caracteres)' },
      { status: 400 }
    );
  }

  // ── Verificar API keys ────────────────────────────────────────────────────
  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json(
      { success: false, error: 'ANTHROPIC_API_KEY no configurada' },
      { status: 503 }
    );
  }

  const falKey = process.env.FAL_API_KEY;
  if (!falKey) {
    const detectedType = mediaType ?? detectMediaType(rawIdea);
    return NextResponse.json(
      {
        success:     false,
        error:       'FAL_API_KEY no configurada',
        setup:       [
          '1. Ir a https://fal.ai y crear cuenta (gratis)',
          '2. Settings → API Keys → Create Key',
          '3. Agregar a .env.local: FAL_API_KEY=tu-key-aqui',
          '4. Reiniciar el servidor: npm run dev',
        ],
        mediaType:   detectedType,
        rawIdea:     rawIdea.trim(),
        refinedHint: 'Una vez configurada la key, el sistema refinará tu idea automáticamente antes de generar.',
      },
      { status: 503 }
    );
  }

  // ── Construir request ──────────────────────────────────────────────────────
  const creativeRequest: CreativeRequest = {
    rawIdea:   rawIdea.trim(),
    mediaType: mediaType,
    style:     style,
    ratio:     ratio ?? '16:9',
    duration:  duration ?? 5,
    quality:   quality ?? 'fast',
    context:   context,
  };

  // ── Generar ────────────────────────────────────────────────────────────────
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  try {
    const result = await generateCreativeMedia(creativeRequest, anthropic);

    const totalMs = Date.now() - startMs;

    return NextResponse.json(
      {
        ...result,
        apiMs: totalMs,
      },
      { status: result.success ? 200 : 422 }
    );
  } catch (err) {
    console.error('[/api/creative] Error inesperado:', err);
    return NextResponse.json(
      {
        success:      false,
        error:        err instanceof Error ? err.message : 'Error interno inesperado',
        apiMs:        Date.now() - startMs,
      },
      { status: 500 }
    );
  }
}
