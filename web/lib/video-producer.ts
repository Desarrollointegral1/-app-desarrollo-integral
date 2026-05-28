/**
 * ============================================================
 * VIDEO PRODUCER — Pipeline Completo de Producción
 * ============================================================
 *
 * Diferencia con video-editor.ts:
 *   video-editor  → corta segmentos, nada más
 *   video-producer → producción completa:
 *     1. Corte inteligente (IA decide segmentos)
 *     2. Color grading (calidez, contraste, saturación)
 *     3. Transiciones entre clips (crossfade elegante)
 *     4. Silenciar audio original
 *     5. Agregar música de fondo (descarga royalty-free)
 *     6. Fade-in/out de audio
 *     7. Export final a Drive
 *
 * Estilos disponibles:
 *   'real-estate' → cálido, elegante, piano suave
 *   'gym'         → energético, dinámico, beats
 *   'corporate'   → limpio, profesional, minimalista
 *   'social'      → rápido, vibrante, redes sociales
 * ============================================================
 */

import fs     from 'fs';
import path   from 'path';
import os     from 'os';
import https  from 'https';
import http   from 'http';
import Anthropic from '@anthropic-ai/sdk';

import ffmpegType from 'fluent-ffmpeg';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegStatic      = require('ffmpeg-static')              as string;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffprobeInstaller  = require('@ffprobe-installer/ffprobe') as { path: string };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpeg = require('fluent-ffmpeg') as typeof ffmpegType;
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

import { getVideoDuration, secondsToTime, timeToSeconds } from './video-editor';
import { generateOutputPath, copyToGoogleDrive, saveCutToHistory } from './video-learning';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ProductionStyle = 'real-estate' | 'gym' | 'corporate' | 'social';
export type TransitionType  = 'fade' | 'dissolve' | 'slideright' | 'slideleft' | 'wipeleft' | 'wiperight' | 'smoothleft';
export type ColorGrade      = 'warm' | 'cool' | 'neutral' | 'vibrant' | 'cinematic';

export interface ProduceRequest {
  videoPath:          string;
  style:              ProductionStyle;
  targetDurationSec?: number;       // Duración objetivo del video final
  transition?:        TransitionType;
  transitionDuration?: number;      // Segundos de transición (default: 0.8)
  colorGrade?:        ColorGrade;
  muteOriginal?:      boolean;      // Silenciar audio original (default: true)
  musicPath?:         string;       // Ruta local a archivo de música
  musicUrl?:          string;       // URL para descargar música
  musicVolume?:       number;       // 0.0-1.0 (default: 0.7)
  outputPath?:        string;
  instructions?:      string;       // Instrucción extra para la IA
}

export interface ProduceResult {
  success:        boolean;
  outputPath?:    string;
  gdrivePath?:    string;
  pipeline:       string[];         // Pasos ejecutados
  segments:       { start: string; end: string; label: string }[];
  cutPlan?:       string;
  processingMs:   number;
  finalDurationSec?: number;
  error?:         string;
  formatted?:     string;
}

// ─── Música por estilo (royalty-free, sin atribución requerida) ───────────────

const MUSIC_BY_STYLE: Record<ProductionStyle, string[]> = {
  'real-estate': [
    'https://www.bensound.com/bensound-music/bensound-slowmotion.mp3',
    'https://www.bensound.com/bensound-music/bensound-memories.mp3',
    'https://www.bensound.com/bensound-music/bensound-inspire.mp3',
  ],
  'gym': [
    'https://www.bensound.com/bensound-music/bensound-extremeaction.mp3',
    'https://www.bensound.com/bensound-music/bensound-energy.mp3',
  ],
  'corporate': [
    'https://www.bensound.com/bensound-music/bensound-creativeminds.mp3',
    'https://www.bensound.com/bensound-music/bensound-ukulele.mp3',
  ],
  'social': [
    'https://www.bensound.com/bensound-music/bensound-anewbeginning.mp3',
    'https://www.bensound.com/bensound-music/bensound-happiness.mp3',
  ],
};

// ─── Color grade por estilo ───────────────────────────────────────────────────

const COLOR_FILTERS: Record<ColorGrade, string> = {
  warm:      'eq=brightness=0.04:contrast=1.06:saturation=1.2:gamma=1.05,colorbalance=rs=0.05:gs=0:bs=-0.05',
  cool:      'eq=brightness=0.02:contrast=1.05:saturation=1.1,colorbalance=rs=-0.05:gs=0:bs=0.08',
  neutral:   'eq=brightness=0.02:contrast=1.04:saturation=1.1',
  vibrant:   'eq=brightness=0.03:contrast=1.1:saturation=1.4:gamma=1.05',
  cinematic: 'eq=brightness=0:contrast=1.15:saturation=0.9:gamma=0.95,vignette=PI/4',
};

const STYLE_TO_GRADE: Record<ProductionStyle, ColorGrade> = {
  'real-estate': 'warm',
  'gym':         'vibrant',
  'corporate':   'neutral',
  'social':      'vibrant',
};

// ─── Descarga de música ───────────────────────────────────────────────────────

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file     = fs.createWriteStream(destPath);

    const request = protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Seguir redireccionamiento
        file.close();
        fs.unlinkSync(destPath);
        downloadFile(res.headers.location!, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        reject(new Error(`HTTP ${res.statusCode} descargando ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    });

    request.on('error', (err) => {
      file.close();
      try { fs.unlinkSync(destPath); } catch { /* noop */ }
      reject(err);
    });
  });
}

async function getMusicTrack(
  style:      ProductionStyle,
  musicPath?: string,
  musicUrl?:  string
): Promise<string | null> {
  // 1. Si ya hay un archivo local → usarlo directamente
  if (musicPath && fs.existsSync(musicPath)) {
    return musicPath;
  }

  const tmpMusicPath = path.join(os.tmpdir(), `music_${style}_${Date.now()}.mp3`);

  // 2. Si hay una URL específica → descargar
  if (musicUrl) {
    try {
      await downloadFile(musicUrl, tmpMusicPath);
      if (fs.existsSync(tmpMusicPath) && fs.statSync(tmpMusicPath).size > 10000) {
        return tmpMusicPath;
      }
    } catch { /* fall through */ }
  }

  // 3. Intentar descargar por estilo
  const urls = MUSIC_BY_STYLE[style] ?? MUSIC_BY_STYLE['corporate'];
  for (const url of urls) {
    try {
      await downloadFile(url, tmpMusicPath);
      const size = fs.existsSync(tmpMusicPath) ? fs.statSync(tmpMusicPath).size : 0;
      if (size > 10000) return tmpMusicPath;
    } catch { /* try next */ }
  }

  return null; // No se pudo obtener música — continuar sin ella
}

// ─── Color grade un clip ──────────────────────────────────────────────────────

function applyColorGrade(
  inputPath:  string,
  outputPath: string,
  grade:      ColorGrade
): Promise<void> {
  return new Promise((resolve, reject) => {
    const filter = COLOR_FILTERS[grade];
    ffmpeg(inputPath)
      .videoFilter(filter)
      .audioCodec('copy')
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

// ─── Concatenar clips con crossfade ──────────────────────────────────────────

async function concatWithTransitions(
  clipPaths:          string[],
  outputPath:         string,
  transition:         TransitionType,
  transitionDuration: number
): Promise<void> {
  if (clipPaths.length === 0) throw new Error('No hay clips para concatenar');

  if (clipPaths.length === 1) {
    fs.copyFileSync(clipPaths[0], outputPath);
    return;
  }

  // Obtener duración de cada clip
  const durations: number[] = [];
  for (const p of clipPaths) {
    const dur = await getVideoDuration(p);
    durations.push(dur);
  }

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg();

    // Agregar todos los inputs
    for (const p of clipPaths) cmd.input(p);

    // Construir filter_complex con xfade encadenado
    const filters: string[] = [];
    let prevLabel  = '[0:v]';
    let timeOffset = 0;

    for (let i = 1; i < clipPaths.length; i++) {
      const outLabel    = i === clipPaths.length - 1 ? '[vfinal]' : `[v${i}]`;
      timeOffset       += durations[i - 1] - transitionDuration;
      const offset      = Math.max(0, timeOffset);

      filters.push(
        `${prevLabel}[${i}:v]xfade=transition=${transition}:duration=${transitionDuration}:offset=${offset.toFixed(3)}${outLabel}`
      );
      prevLabel = outLabel;
    }

    cmd
      .complexFilter(filters)
      .outputOptions([
        '-map [vfinal]',
        '-c:v libx264',
        '-crf 20',
        '-preset fast',
        '-an',         // Sin audio (se agrega después)
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

// ─── Agregar música (loop si es necesario) ────────────────────────────────────

function addMusicTrack(
  videoPath:   string,
  musicPath:   string,
  outputPath:  string,
  volume:      number,
  videoDuration: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const fadeDuration = Math.min(3, videoDuration * 0.1); // fade out last 10% o 3s
    const fadeStart    = videoDuration - fadeDuration;

    ffmpeg(videoPath)
      .input(musicPath)
      .inputOptions(['-stream_loop -1'])      // Loop música si es más corta
      .outputOptions([
        '-map 0:v',                           // Video del clip editado
        '-map 1:a',                           // Audio de la música
        '-c:v copy',                          // Sin re-encodear video
        '-c:a aac',
        '-b:a 192k',
        `-af volume=${volume},afade=t=out:st=${fadeStart.toFixed(1)}:d=${fadeDuration.toFixed(1)}`,
        '-shortest',                           // Cortar cuando termine el video
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

// ─── Planificador IA para producción ─────────────────────────────────────────

interface ProductionPlan {
  segments:  { start: string; end: string; label: string; reason: string }[];
  reasoning: string;
  style:     string;
}

async function planProduction(
  videoPath:    string,
  duration:     number,
  style:        ProductionStyle,
  targetSec:    number | undefined,
  instructions: string | undefined,
  anthropic:    Anthropic
): Promise<ProductionPlan> {

  const styleGuide: Record<ProductionStyle, string> = {
    'real-estate': `
Video inmobiliario profesional. CRITERIOS DE SELECCIÓN:
- MANTENER: tomas estáticas o lentas de habitaciones completas (muestran el espacio)
- MANTENER: panorámicas suaves que muestren amplitud
- MANTENER: tomas de detalles premium (ventanas, cocina, baño)
- ELIMINAR: movimientos bruscos de cámara o sacudidas
- ELIMINAR: tomas muy oscuras o borrosas
- ELIMINAR: silencios donde no se ve nada interesante
DURACIÓN IDEAL: 45-90 segundos. Ritmo tranquilo, elegante.`,
    'gym': `
Video de gym/fitness. CRITERIOS:
- MANTENER: momentos de acción, esfuerzo, movimiento
- MANTENER: tomas del espacio y equipamiento
- ELIMINAR: momentos muertos, silencios
DURACIÓN IDEAL: 30-60 segundos. Ritmo dinámico.`,
    'corporate': `
Video corporativo. CRITERIOS:
- MANTENER: tomas limpias y profesionales
- ELIMINAR: cualquier cosa informal o técnicamente deficiente
DURACIÓN IDEAL: 60-120 segundos. Ritmo moderado.`,
    'social': `
Video para redes sociales. CRITERIOS:
- MANTENER: los momentos más impactantes
- Ritmo rápido, primeros 3 segundos tienen que enganchar
DURACIÓN IDEAL: 15-30 segundos.`,
  };

  const system = `Eres un editor de video profesional especializado en producción ${style === 'real-estate' ? 'inmobiliaria' : style}.
${styleGuide[style]}

Respondé SOLO con JSON válido (sin markdown):
{
  "segments": [
    {"start": "00:00:05", "end": "00:00:25", "label": "living", "reason": "toma estática amplia del living"}
  ],
  "reasoning": "explicación breve de la selección",
  "style": "descripción del ritmo y look elegido"
}`;

  const user = `VIDEO: ${path.basename(videoPath)}
DURACIÓN TOTAL: ${secondsToTime(duration)} (${Math.round(duration)}s)
DURACIÓN OBJETIVO: ${targetSec ? `${targetSec}s` : 'editorial libre'}
INSTRUCCIÓN EXTRA: ${instructions ?? 'ninguna'}

Planificá la selección de segmentos para un video ${style === 'real-estate' ? 'inmobiliario' : style} profesional.`;

  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 800,
    system,
    messages:   [{ role: 'user', content: user }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as ProductionPlan;
  } catch {
    // Fallback: tomar el video completo o primeros targetSec segundos
    const end = targetSec ? Math.min(targetSec, duration) : duration;
    return {
      segments:  [{ start: '00:00:00', end: secondsToTime(end), label: 'full', reason: 'fallback' }],
      reasoning: 'Planificación por defecto',
      style:     style,
    };
  }
}

// ─── Pipeline principal ───────────────────────────────────────────────────────

export async function produceVideo(
  request:   ProduceRequest,
  anthropic: Anthropic
): Promise<ProduceResult> {
  const startMs   = Date.now();
  const pipeline: string[] = [];
  const tmpFiles: string[] = [];

  const cleanup = () => {
    for (const f of tmpFiles) {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch { /* noop */ }
    }
  };

  try {
    // ── Validar input ─────────────────────────────────────────────────────────
    if (!fs.existsSync(request.videoPath)) {
      return { success: false, pipeline, segments: [], processingMs: Date.now() - startMs,
               error: `Video no encontrado: ${request.videoPath}` };
    }

    const totalDuration = await getVideoDuration(request.videoPath);
    pipeline.push(`📹 Video leído: ${secondsToTime(totalDuration)} de duración`);

    const ext              = path.extname(request.videoPath) || '.mp4';
    const colorGrade       = request.colorGrade ?? STYLE_TO_GRADE[request.style];
    const transition       = request.transition ?? 'fade';
    const transitionDur    = request.transitionDuration ?? 0.8;
    const muteOriginal     = request.muteOriginal ?? true;
    const musicVolume      = request.musicVolume ?? 0.72;

    // ── Paso 1: Planificación IA ───────────────────────────────────────────────
    pipeline.push('🧠 IA analizando video...');
    const plan = await planProduction(
      request.videoPath, totalDuration, request.style,
      request.targetDurationSec, request.instructions, anthropic
    );
    pipeline.push(`✂️ ${plan.segments.length} segmentos seleccionados: ${plan.reasoning}`);

    // ── Paso 2: Cortar segmentos con color grade ───────────────────────────────
    pipeline.push(`🎨 Aplicando color grade "${colorGrade}"...`);
    const gradedClips: string[] = [];

    for (let i = 0; i < plan.segments.length; i++) {
      const seg       = plan.segments[i];
      const startSec  = timeToSeconds(seg.start);
      const endSec    = timeToSeconds(seg.end);
      const duration  = endSec - startSec;

      if (duration < 1) continue; // Saltar segmentos demasiado cortos

      // Cortar segmento crudo
      const rawClip = path.join(os.tmpdir(), `raw_${i}_${Date.now()}${ext}`);
      tmpFiles.push(rawClip);

      await new Promise<void>((res, rej) => {
        ffmpeg(request.videoPath)
          .setStartTime(startSec)
          .setDuration(duration)
          .outputOptions(['-c copy', '-avoid_negative_ts make_zero'])
          .output(rawClip)
          .on('end', () => res())
          .on('error', (e: Error) => rej(e))
          .run();
      });

      // Aplicar color grade
      const gradedClip = path.join(os.tmpdir(), `graded_${i}_${Date.now()}${ext}`);
      tmpFiles.push(gradedClip);

      await applyColorGrade(rawClip, gradedClip, colorGrade);
      gradedClips.push(gradedClip);
    }

    if (gradedClips.length === 0) {
      cleanup();
      return { success: false, pipeline, segments: [], processingMs: Date.now() - startMs,
               error: 'No se pudieron procesar los segmentos' };
    }

    pipeline.push(`✅ ${gradedClips.length} clips procesados con color grade`);

    // ── Paso 3: Concatenar con transiciones ────────────────────────────────────
    pipeline.push(`🎬 Aplicando transiciones "${transition}" (${transitionDur}s)...`);
    const mergedPath = path.join(os.tmpdir(), `merged_${Date.now()}${ext}`);
    tmpFiles.push(mergedPath);

    await concatWithTransitions(gradedClips, mergedPath, transition, transitionDur);
    pipeline.push('✅ Transiciones aplicadas');

    // ── Paso 4: Música ────────────────────────────────────────────────────────
    let finalPath: string;
    const outputPaths = generateOutputPath(
      request.videoPath,
      request.style,
      await getVideoDuration(mergedPath)
    );
    finalPath = request.outputPath ?? outputPaths.local;

    if (muteOriginal) {
      pipeline.push('🔇 Silenciando audio original...');

      // Intentar obtener música
      const musicTrack = await getMusicTrack(
        request.style, request.musicPath, request.musicUrl
      );

      if (musicTrack) {
        pipeline.push(`🎵 Música "${request.style}" descargada, mezclando...`);
        const mergedDuration = await getVideoDuration(mergedPath);
        await addMusicTrack(mergedPath, musicTrack, finalPath, musicVolume, mergedDuration);
        pipeline.push('✅ Música agregada con fade-out');
        try { fs.unlinkSync(musicTrack); } catch { /* noop */ }
      } else {
        // Sin música — exportar sin audio
        pipeline.push('⚠️ Música no disponible — exportando sin audio');
        await new Promise<void>((res, rej) => {
          ffmpeg(mergedPath)
            .outputOptions(['-c:v copy', '-an'])
            .output(finalPath)
            .on('end', () => res())
            .on('error', (e: Error) => rej(e))
            .run();
        });
      }
    } else {
      // Mantener audio original
      fs.copyFileSync(mergedPath, finalPath);
    }

    pipeline.push(`📁 Guardado en: ${finalPath}`);

    // ── Paso 5: Copiar a Google Drive ─────────────────────────────────────────
    let gdrivePath: string | undefined;
    if (outputPaths.gdrive) {
      const copied = await copyToGoogleDrive(finalPath, outputPaths.gdrive);
      if (copied) {
        gdrivePath = outputPaths.gdrive;
        pipeline.push(`☁️ Subido a Google Drive: ${outputPaths.gdrive}`);
      }
    }

    // ── Cleanup ────────────────────────────────────────────────────────────────
    cleanup();

    const finalDuration = await getVideoDuration(finalPath).catch(() => 0);

    // ── Guardar en historial para aprendizaje ─────────────────────────────────
    await saveCutToHistory({
      result: {
        success:         true,
        mode:            'smart',
        inputPath:       request.videoPath,
        inputDuration:   totalDuration,
        segments:        plan.segments.map((s, i) => ({
          index:       i,
          start:       s.start,
          end:         s.end,
          label:       s.label,
          outputPath:  finalPath,
          durationSec: timeToSeconds(s.end) - timeToSeconds(s.start),
        })),
        finalOutputPath: finalPath,
        cutPlan:         plan.reasoning,
        processingMs:    Date.now() - startMs,
      },
    }).catch(() => { /* noop — no interrumpir si falla */ });

    const totalMs = Date.now() - startMs;
    pipeline.push(`⏱️ Completado en ${(totalMs / 1000).toFixed(1)}s`);

    return {
      success:          true,
      outputPath:       finalPath,
      gdrivePath,
      pipeline,
      segments:         plan.segments,
      cutPlan:          plan.reasoning,
      processingMs:     totalMs,
      finalDurationSec: finalDuration,
      formatted:        formatProduceResult(finalPath, gdrivePath, pipeline, plan, finalDuration, totalMs),
    };

  } catch (err) {
    cleanup();
    return {
      success:      false,
      pipeline,
      segments:     [],
      processingMs: Date.now() - startMs,
      error:        err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Formatter ────────────────────────────────────────────────────────────────

function formatProduceResult(
  outputPath:   string,
  gdrivePath:   string | undefined,
  pipeline:     string[],
  plan:         ProductionPlan,
  durationSec:  number,
  totalMs:      number
): string {
  const lines: string[] = [
    '## 🎬 Video Producer — ✅ Producción Completada',
    '',
    `**Duración final:** ${secondsToTime(durationSec)} (${Math.round(durationSec)}s)`,
    `**Tiempo de proceso:** ${(totalMs / 1000).toFixed(1)}s`,
    '',
    '### 📋 Pipeline ejecutado',
    ...pipeline.map((p) => `- ${p}`),
    '',
    '### ✂️ Segmentos seleccionados por la IA',
    ...plan.segments.map((s) => `- **${s.label}** ${s.start} → ${s.end}: ${s.reason}`),
    '',
    '### 📁 Archivos de salida',
    `- **Local:** \`${outputPath}\``,
    gdrivePath ? `- **Google Drive:** \`${gdrivePath}\`` : '- Google Drive: no disponible',
  ];
  return lines.join('\n');
}
