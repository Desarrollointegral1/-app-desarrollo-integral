/**
 * POST /api/video/produce
 * Pipeline completo de producción de video profesional.
 *
 * Diferencia vs /api/video:
 *   /api/video      → solo corta segmentos (sin música, sin transiciones)
 *   /api/video/produce → producción completa:
 *     corte inteligente + color grading + transiciones + música + Drive
 *
 * Body:
 * {
 *   videoPath: string,             ← ruta al video fuente
 *   style: 'gym' | 'corporate' | 'social',
 *   targetDurationSec?: number,    ← duración objetivo en segundos
 *   transition?: TransitionType,
 *   transitionDuration?: number,   ← segundos por transición (default: 0.8)
 *   colorGrade?: ColorGrade,       ← si se omite, se deduce del estilo
 *   muteOriginal?: boolean,        ← silenciar audio original (default: true)
 *   musicPath?: string,            ← ruta a MP3 local
 *   musicUrl?: string,             ← URL para descargar música
 *   musicVolume?: number,          ← 0.0-1.0 (default: 0.7)
 *   outputPath?: string,           ← si se omite, se genera automáticamente
 *   instructions?: string,         ← instrucción libre para la IA
 * }
 *
 * Ejemplo desde /charles:
 *   "hacé un reel de gym con transiciones rápidas y música energética"
 *   "producí un video corporativo con el archivo de la sesión del lunes"
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  produceVideo,
  type ProduceRequest,
  type ProductionStyle,
  type TransitionType,
  type ColorGrade,
} from '@/lib/video-producer';
import { getLearnedPreferences } from '@/lib/video-learning';
import path from 'path';

// ─── Rutas base permitidas (seguridad) ───────────────────────────────────────

const ALLOWED_BASE_DIRS = [
  'C:\\Users\\lucas\\Videos',
  'C:\\Users\\lucas\\OneDrive',
  'G:\\Mi unidad',
  'C:\\Users\\lucas\\Downloads',
  'C:\\Users\\lucas\\Desktop',
];

function isAllowedPath(filePath: string): boolean {
  if (filePath.includes('..')) return false;
  const normalized = path.resolve(filePath);
  return ALLOWED_BASE_DIRS.some((base) => normalized.startsWith(base));
}

// ─── POST — producción completa ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Partial<ProduceRequest> & { speedFactor?: number };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body JSON inválido' }, { status: 400 });
  }

  // Validaciones básicas
  if (!body.videoPath || typeof body.videoPath !== 'string') {
    return NextResponse.json(
      { success: false, error: 'videoPath requerido (ruta completa al video)' },
      { status: 400 }
    );
  }
  if (!body.style || !['gym', 'corporate', 'social'].includes(body.style)) {
    return NextResponse.json(
      { success: false, error: 'style requerido: gym | corporate | social' },
      { status: 400 }
    );
  }

  // Seguridad: solo rutas permitidas
  if (!isAllowedPath(body.videoPath)) {
    return NextResponse.json(
      { success: false, error: `Ruta no permitida: ${body.videoPath}` },
      { status: 403 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'ANTHROPIC_API_KEY no configurada' },
      { status: 500 }
    );
  }

  console.log(`[VideoProducer] Iniciando producción — style: ${body.style}, video: ${body.videoPath}`);
  const startTime = Date.now();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const result = await produceVideo(
    {
      videoPath:           body.videoPath,
      style:               body.style as ProductionStyle,
      targetDurationSec:   body.targetDurationSec,
      transition:          body.transition as TransitionType | undefined,
      transitionDuration:  body.transitionDuration,
      colorGrade:          body.colorGrade as ColorGrade | undefined,
      muteOriginal:        body.muteOriginal ?? true,
      musicPath:           body.musicPath,
      musicUrl:            body.musicUrl,
      musicVolume:         body.musicVolume ?? 0.7,
      speedFactor:         body.speedFactor,
      outputPath:          body.outputPath,
      instructions:        body.instructions,
    },
    anthropic
  );

  const totalMs = Date.now() - startTime;
  console.log(`[VideoProducer] ${result.success ? '✅' : '❌'} en ${totalMs}ms`);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error, pipeline: result.pipeline },
      { status: 500 }
    );
  }

  // Devolver perfil de aprendizaje actualizado
  const prefs = await getLearnedPreferences(body.instructions);

  return NextResponse.json({
    success:          true,
    outputPath:       result.outputPath,
    gdrivePath:       result.gdrivePath,
    style:            body.style,
    pipeline:         result.pipeline,
    segments:         result.segments,
    cutPlan:          result.cutPlan,
    finalDurationSec: result.finalDurationSec,
    processingMs:     totalMs,
    formatted:        result.formatted,
    ficha:            result.ficha,      // Ficha completa para enviar al cliente
    learningProfile: {
      totalCuts:    prefs.totalCutsDone,
      avgRating:    prefs.avgRating,
      styleSummary: prefs.styleSummary,
    },
  });
}

// ─── GET — info del endpoint ──────────────────────────────────────────────────

export async function GET() {
  const prefs = await getLearnedPreferences();

  return NextResponse.json({
    endpoint:    '/api/video/produce',
    description: 'Pipeline completo de producción de video: corte IA + color grading + transiciones + música',
    body: {
      videoPath:          'string — ruta completa al video fuente (requerido)',
      style:              'gym | corporate | social (requerido)',
      targetDurationSec:  'number — duración objetivo del resultado (opcional)',
      transition:         'fade | dissolve | slideright | slideleft | wipeleft | wiperight | smoothleft (opcional)',
      transitionDuration: 'number — segundos por transición, default 0.8 (opcional)',
      colorGrade:         'warm | cool | neutral | vibrant | cinematic (opcional, se deduce del style)',
      muteOriginal:       'boolean — silenciar audio original, default true (opcional)',
      musicPath:          'string — ruta a MP3 local (opcional)',
      musicUrl:           'string — URL para descargar música (opcional)',
      musicVolume:        'number 0.0-1.0 — volumen de la música, default 0.7 (opcional)',
      speedFactor:        'number — velocidad: 0.5=mitad, 0.8=lento, 1.0=normal, 1.5=rápido (opcional)',
      outputPath:         'string — ruta de salida personalizada (opcional)',
      instructions:       'string — instrucción libre para la IA (opcional)',
    },
    allowedBaseDirs: ALLOWED_BASE_DIRS,
    examples: {
      gymReel: {
        videoPath:        'C:\\Users\\lucas\\Videos\\gym-session.mp4',
        style:            'gym',
        targetDurationSec: 30,
        transition:       'dissolve',
        instructions:     'Highlights de entrenamiento, énfasis en la intensidad y la forma',
      },
      corporateVideo: {
        videoPath:        'C:\\Users\\lucas\\Videos\\sesion-lunes.mp4',
        style:            'corporate',
        targetDurationSec: 60,
        muteOriginal:     true,
        instructions:     'Mostrar el ambiente del centro, los equipos y el trabajo en equipo',
      },
    },
    learningProfile: {
      totalCuts:    prefs.totalCutsDone,
      avgRating:    prefs.avgRating,
      styleSummary: prefs.styleSummary,
    },
  });
}
