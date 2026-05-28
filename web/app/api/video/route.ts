/**
 * ============================================================
 * /api/video — Editor de Video con FFmpeg + IA
 * ============================================================
 *
 * POST /api/video
 *   Body modo MANUAL:
 *     { mode: "manual", videoPath: "C:\\..\\video.mp4", cuts: [{start, end, label}], concatenate: true }
 *   Body modo SMART:
 *     { mode: "smart", videoPath: "C:\\..\\video.mp4", instructions: "hacé un highlight de 30s", targetDurationSec: 30 }
 *
 * GET /api/video
 *   → Documentación + estado de FFmpeg
 *
 * SEGURIDAD: Solo permite rutas dentro de directorios aprobados.
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import path  from 'path';
import os    from 'os';
import {
  editVideo,
  getVideoMetadata,
  formatVideoEditResult,
  type ManualCutRequest,
  type SmartCutRequest,
} from '@/lib/video-editor';
import {
  saveCutToHistory,
  copyToGoogleDrive,
  getMediaFolders,
  generateOutputPath,
  getLearnedPreferences,
} from '@/lib/video-learning';

// ─── Seguridad: directorios permitidos ───────────────────────────────────────
// El sistema solo puede leer/escribir en estas rutas para evitar path traversal.
// Incluye el home del usuario y OneDrive donde está el proyecto.

const ALLOWED_BASE_DIRS = [
  os.homedir(),                           // C:\Users\lucas
  'C:\\Users\\lucas\\OneDrive',           // OneDrive
  'C:\\Users\\lucas\\Videos',             // Videos del usuario
  'C:\\Users\\lucas\\Desktop',            // Escritorio
  'C:\\Users\\lucas\\Downloads',          // Descargas
].map((d) => d.toLowerCase().replace(/\\/g, '/'));

function isPathAllowed(filePath: string): boolean {
  const normalized = filePath.toLowerCase().replace(/\\/g, '/');
  // Bloquear path traversal
  if (normalized.includes('..')) return false;
  return ALLOWED_BASE_DIRS.some((base) => normalized.startsWith(base));
}

// ─── GET — Documentación + estado de FFmpeg ──────────────────────────────────

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path as string;
  const folders    = getMediaFolders();
  const prefs      = await getLearnedPreferences();

  return NextResponse.json({
    endpoint:    '/api/video',
    description: 'Editor de video con FFmpeg + IA. Corta, recorta y edita videos.',
    ffmpegPath,
    ffmpegReady: !!ffmpegPath,
    folders,
    learningStats: {
      totalCuts:  prefs.totalCutsDone,
      avgRating:  prefs.avgRating,
      styleSummary: prefs.styleSummary,
      topTags:    prefs.topStyleTags,
    },
    modes: {
      manual: {
        description: 'Vos especificás los timestamps exactos',
        body: {
          mode:         '"manual"',
          videoPath:    'Ruta absoluta al video (ej: "C:\\\\Users\\\\lucas\\\\Videos\\\\gym.mp4")',
          cuts:         '[{ start: "00:00:05", end: "00:00:30", label: "intro" }]',
          concatenate:  'boolean — true: une todos en un archivo, false: archivos separados (default: true)',
          outputPath:   'string opcional — dónde guardar el resultado',
        },
        example: {
          mode:        'manual',
          videoPath:   'C:\\Users\\lucas\\Videos\\sesion_gym.mp4',
          cuts:        [
            { start: '00:00:10', end: '00:00:45', label: 'intro' },
            { start: '00:01:30', end: '00:02:15', label: 'highlight_ejercicio' },
            { start: '00:04:00', end: '00:04:30', label: 'cierre' },
          ],
          concatenate: true,
        },
      },
      smart: {
        description: 'La IA transcribe el audio, analiza y decide los cortes sola',
        body: {
          mode:              '"smart"',
          videoPath:         'Ruta absoluta al video',
          instructions:      'Qué querés: "30s de highlights", "sacá los silencios", "resumí en 1 minuto"',
          targetDurationSec: 'number opcional — duración objetivo en segundos',
          outputPath:        'string opcional — dónde guardar',
        },
        examples: [
          {
            mode:              'smart',
            videoPath:         'C:\\Users\\lucas\\Videos\\clase_fitness.mp4',
            instructions:      'Hacé un highlight de 30 segundos con los mejores momentos, empezá con acción',
            targetDurationSec: 30,
          },
          {
            mode:         'smart',
            videoPath:    'C:\\Users\\lucas\\Videos\\evaluacion.mp4',
            instructions: 'Sacá los silencios y los momentos donde no pasa nada interesante',
          },
        ],
      },
    },
    allowedBaseDirs: ALLOWED_BASE_DIRS,
    tip: 'Desde /charles: "cortá el video C:\\Users\\lucas\\Videos\\gym.mp4 del 0:30 al 1:45" o "hacé un highlight de 30s del video X"',
  });
}

// ─── POST — Editar video ──────────────────────────────────────────────────────

interface ManualBody {
  mode:         'manual';
  videoPath:    string;
  cuts:         { start: string; end: string; label?: string }[];
  concatenate?: boolean;
  outputPath?:  string;
}

interface SmartBody {
  mode:              'smart';
  videoPath:         string;
  instructions:      string;
  targetDurationSec?: number;
  outputPath?:       string;
}

type RequestBody = ManualBody | SmartBody;

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body inválido — se espera JSON' },
      { status: 400 }
    );
  }

  // Validaciones comunes
  if (!body.mode || !['manual', 'smart'].includes(body.mode)) {
    return NextResponse.json(
      { success: false, error: 'mode debe ser "manual" o "smart"' },
      { status: 400 }
    );
  }

  if (!body.videoPath || typeof body.videoPath !== 'string') {
    return NextResponse.json(
      { success: false, error: 'videoPath es requerido' },
      { status: 400 }
    );
  }

  // Normalizar path (Windows acepta / y \)
  const videoPath = path.resolve(body.videoPath);

  // Verificar seguridad de la ruta
  if (!isPathAllowed(videoPath)) {
    return NextResponse.json(
      {
        success: false,
        error:   `Ruta no permitida: ${videoPath}`,
        hint:    'Solo se permiten rutas dentro del directorio del usuario (C:\\Users\\lucas\\...)',
      },
      { status: 403 }
    );
  }

  // API keys
  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json(
      { success: false, error: 'ANTHROPIC_API_KEY no configurada' },
      { status: 503 }
    );
  }

  // Obtener metadata primero (valida que el archivo sea un video real)
  let metadata;
  try {
    metadata = await getVideoMetadata(videoPath);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:   `No se pudo leer el video: ${err instanceof Error ? err.message : String(err)}`,
        hint:    'Verificá que el archivo exista y sea un video válido (MP4, MOV, AVI, WebM)',
      },
      { status: 422 }
    );
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  // ── Helper: post-procesamiento común ─────────────────────────────────────
  // Guarda en Supabase + copia a Google Drive si corresponde
  async function postProcess(result: Awaited<ReturnType<typeof editVideo>>) {
    if (!result.success || !result.finalOutputPath) return { cutId: null, gdrivePath: null };

    // 1. Guardar en Supabase (aprendizaje)
    const cutId = await saveCutToHistory({ result }).catch(() => null);

    // 2. Copiar a Google Drive si está configurado
    const folders    = getMediaFolders();
    let   gdrivePath: string | null = null;

    if (folders.gdrive && folders.exists.gdrive) {
      const outputPaths = generateOutputPath(
        result.inputPath,
        result.mode === 'smart' ? 'highlight' : 'edited',
        result.segments.reduce((s, seg) => s + seg.durationSec, 0)
      );
      if (outputPaths.gdrive) {
        const copied = await copyToGoogleDrive(result.finalOutputPath, outputPaths.gdrive);
        if (copied) gdrivePath = outputPaths.gdrive;
      }
    }

    return { cutId, gdrivePath };
  }

  // ── Modo MANUAL ──────────────────────────────────────────────────────────
  if (body.mode === 'manual') {
    const manualBody = body as ManualBody;

    if (!manualBody.cuts || !Array.isArray(manualBody.cuts) || manualBody.cuts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'cuts es requerido en modo manual (array de {start, end})' },
        { status: 400 }
      );
    }

    const request: ManualCutRequest = {
      mode:        'manual',
      videoPath,
      cuts:        manualBody.cuts,
      concatenate: manualBody.concatenate ?? true,
      outputPath:  manualBody.outputPath,
    };

    const result = await editVideo(request, anthropic);
    const { cutId, gdrivePath } = await postProcess(result);

    return NextResponse.json(
      {
        ...result,
        metadata,
        cutId,
        gdrivePath,
        formatted: formatVideoEditResult(result),
        tip: cutId
          ? `✅ Guardado en historial (ID: ${cutId}). Podés calificarlo con POST /api/video/rate`
          : undefined,
      },
      { status: result.success ? 200 : 422 }
    );
  }

  // ── Modo SMART ────────────────────────────────────────────────────────────
  const smartBody = body as SmartBody;

  if (!smartBody.instructions || typeof smartBody.instructions !== 'string') {
    return NextResponse.json(
      { success: false, error: 'instructions es requerido en modo smart' },
      { status: 400 }
    );
  }

  const request: SmartCutRequest = {
    mode:              'smart',
    videoPath,
    instructions:      smartBody.instructions,
    targetDurationSec: smartBody.targetDurationSec,
    outputPath:        smartBody.outputPath,
  };

  const result = await editVideo(request, anthropic);
  const { cutId, gdrivePath } = await postProcess(result);

  return NextResponse.json(
    {
      ...result,
      metadata,
      cutId,
      gdrivePath,
      formatted: formatVideoEditResult(result),
      tip: cutId
        ? `✅ Guardado en historial (ID: ${cutId}). Calificalo: POST /api/video/rate {cutId, rating: 1-5}`
        : undefined,
    },
    { status: result.success ? 200 : 422 }
  );
}
