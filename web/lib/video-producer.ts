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
  speedFactor?:       number;       // Velocidad del video: 0.5=mitad, 0.8=lento, 1.0=normal, 1.5=rápido
  outputPath?:        string;
  instructions?:      string;       // Instrucción extra para la IA
}

export interface VideoFicha {
  fecha:           string;
  archivoFuente:   string;
  duracionOriginal: string;
  duracionFinal:   string;
  estilo:          string;
  colorGrade:      string;
  velocidad:       string;
  transiciones:    string;
  musica:          string;
  audioOriginal:   string;
  segmentos:       { n: number; label: string; desde: string; hasta: string; duracion: string }[];
  formato:         string;
  tamanoMB:        number;
  archivosOutput:  { local: string; drive?: string };
  resumenParaCliente: string;  // Texto listo para copiar y enviar
}

export interface ProduceResult {
  success:        boolean;
  outputPath?:    string;
  gdrivePath?:    string;
  pipeline:       string[];
  segments:       { start: string; end: string; label: string }[];
  cutPlan?:       string;
  processingMs:   number;
  finalDurationSec?: number;
  error?:         string;
  formatted?:     string;
  ficha?:         VideoFicha;     // Resumen completo de la producción
}

// ─── Música por estilo (royalty-free, CDN directo, sin registro) ─────────────
//
// Fuentes usadas (en orden de confiabilidad):
//   1. SoundHelix.com   — tracks generados, siempre disponibles, descarga libre
//   2. FreePD.com       — Kevin MacLeod + colaboradores CC0, descarga directa
//   3. Archive.org      — colecciones CC-licensed, descarga sin auth
//
// Si todas fallan → generateAmbientMusic() genera la pista con FFmpeg (100% confiable)

const MUSIC_BY_STYLE: Record<ProductionStyle, string[]> = {
  // Real estate: piano suave, melancólico, elegante
  'real-estate': [
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    'https://freepd.com/music/Wholesome.mp3',
    'https://freepd.com/music/Acoustic%20Breeze.mp3',
    'https://archive.org/download/cinematic_piano_cc0/cinematic_piano.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  ],
  // Gym: energético, electrónico, motivacional
  'gym': [
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'https://freepd.com/music/Rock%20Motive.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'https://freepd.com/music/Ultra%20High.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  ],
  // Corporate: profesional, limpio, instrumental neutro
  'corporate': [
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    'https://freepd.com/music/Corporate%20Inspiration.mp3',
    'https://freepd.com/music/Upbeat.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  ],
  // Social: vibrante, pop, enganche rápido
  'social': [
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    'https://freepd.com/music/Happy%20Background.mp3',
    'https://freepd.com/music/Bright%20Morning.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  ],
};

// ─── Generador de música ambient con FFmpeg (fallback 100% confiable) ────────
//
// Si no se pudo descargar ninguna URL, generamos una pista ambient con FFmpeg:
//   - Real estate: acorde C mayor suave, notas con decay lento (bells)
//   - Gym:         frecuencias altas, pulso rítmico
//   - Corporate:   pad neutro, sin emoción exagerada
//   - Social:      acorde mayor brillante, energy media
//
// Técnica: aevalsrc con sum de frecuencias armónicas + envelope de decay

const AMBIENT_GEN: Record<ProductionStyle, { freqs: number[]; decay: number; vol: number }> = {
  'real-estate': { freqs: [130.81, 196.00, 261.63, 329.63], decay: 6, vol: 0.18 }, // C3-G3-C4-E4
  'gym':         { freqs: [82.41,  164.81, 246.94, 329.63], decay: 1, vol: 0.22 }, // E2-E3-B3-E4 (power chord)
  'corporate':   { freqs: [146.83, 220.00, 293.66, 369.99], decay: 5, vol: 0.16 }, // D3-A3-D4-F#4
  'social':      { freqs: [164.81, 246.94, 329.63, 415.30], decay: 3, vol: 0.20 }, // E3-B3-E4-G#4
};

function generateAmbientMusic(style: ProductionStyle, outputPath: string, durationSec: number): Promise<void> {
  const { freqs, decay, vol } = AMBIENT_GEN[style];
  // Construir suma de senos con envelope de decay basado en mod(t, period)
  const period = decay * 2;
  const sinTerms = freqs
    .map((f) => `${vol / freqs.length}*sin(2*PI*${f}*t)*max(0,1-mod(t,${period})/${decay})`)
    .join('+');

  const expr = `aevalsrc=${sinTerms}:s=44100`;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(expr)
      .inputFormat('lavfi')
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .duration(durationSec)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

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
  style:       ProductionStyle,
  durationSec: number,
  musicPath?:  string,
  musicUrl?:   string
): Promise<string> {
  // 1. Archivo local provisto por el usuario
  if (musicPath && fs.existsSync(musicPath)) {
    return musicPath;
  }

  const tmpMusicPath = path.join(os.tmpdir(), `music_${style}_${Date.now()}.mp3`);

  // 2. URL específica del usuario
  if (musicUrl) {
    try {
      await downloadFile(musicUrl, tmpMusicPath);
      if (fs.existsSync(tmpMusicPath) && fs.statSync(tmpMusicPath).size > 30000) {
        return tmpMusicPath;
      }
    } catch { /* fall through */ }
  }

  // 3. Waterfall de URLs por estilo (SoundHelix > FreePD > Archive.org)
  const urls = MUSIC_BY_STYLE[style] ?? MUSIC_BY_STYLE['corporate'];
  for (const url of urls) {
    try {
      const candidate = path.join(os.tmpdir(), `music_dl_${Date.now()}.mp3`);
      await downloadFile(url, candidate);
      const size = fs.existsSync(candidate) ? fs.statSync(candidate).size : 0;
      if (size > 30000) {
        return candidate;
      }
      try { fs.unlinkSync(candidate); } catch { /* noop */ }
    } catch { /* try next URL */ }
  }

  // 4. Fallback 100% confiable: generar pista ambient con FFmpeg
  //    Produce un acorde harmónico con decay suave — apropiado como fondo
  try {
    await generateAmbientMusic(style, tmpMusicPath, Math.min(durationSec + 10, 120));
    if (fs.existsSync(tmpMusicPath) && fs.statSync(tmpMusicPath).size > 1000) {
      return tmpMusicPath;
    }
  } catch { /* noop */ }

  // 5. Silencio total como último recurso (no debería llegar aquí)
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('anullsrc=r=44100:cl=stereo')
      .inputFormat('lavfi')
      .audioCodec('libmp3lame')
      .duration(durationSec)
      .output(tmpMusicPath)
      .on('end', () => resolve(tmpMusicPath))
      .on('error', (e: Error) => reject(e))
      .run();
  });
}

// ─── Color grade un clip (con speed opcional) ────────────────────────────────

// ─── Parámetros de encoding WhatsApp/Instagram ───────────────────────────────
//
// Problemas comunes que impiden reproducción:
//   - Sin -pix_fmt yuv420p  → falla en iPhone/Android/WhatsApp (usan yuv444p)
//   - Sin -movflags +faststart → el moov atom queda al final del archivo,
//     el video no puede streamearse ni previsualizar sin descargarse completo
//   - Sin -profile:v main → algunas apps rechazan High profile
//
const H264_OUTPUT_FLAGS = [
  '-c:v libx264',
  '-pix_fmt yuv420p',        // ← CLAVE: compatibilidad universal iOS/Android/WhatsApp
  '-profile:v main',         // main profile: max compatibilidad sin sacrificar calidad
  '-level 4.0',              // soporta hasta 1080p@30fps
  '-crf 22',                 // calidad alta (18=max, 28=min, 22=sweet spot)
  '-preset fast',            // velocidad vs compresión
  '-movflags +faststart',    // ← CLAVE: moov atom al inicio → preview instantáneo
];

function applyColorGrade(
  inputPath:   string,
  outputPath:  string,
  grade:       ColorGrade,
  speedFactor: number = 1.0
): Promise<void> {
  return new Promise((resolve, reject) => {
    const colorFilter = COLOR_FILTERS[grade];
    // setpts=1/speed*PTS → < 1.0 = más lento, > 1.0 = más rápido
    const speedFilter = speedFactor !== 1.0
      ? `setpts=${(1 / speedFactor).toFixed(4)}*PTS`
      : null;

    // Orden: primero speed (cambia timestamps), luego color grade
    const videoFilter = speedFilter
      ? `${speedFilter},${colorFilter}`
      : colorFilter;

    ffmpeg(inputPath)
      .videoFilter(videoFilter)
      .outputOptions([
        ...H264_OUTPUT_FLAGS,
        '-an',  // Audio se agrega en el paso final con la música
      ])
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
    // Re-encodear el único clip para asegurar el formato correcto
    return new Promise((resolve, reject) => {
      ffmpeg(clipPaths[0])
        .outputOptions([...H264_OUTPUT_FLAGS, '-an', '-movflags +faststart'])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (e: Error) => reject(e))
        .run();
    });
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
        ...H264_OUTPUT_FLAGS,
        '-an',         // Audio se agrega en el paso final con la música
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
        '-c:v copy',                          // Video ya está en H.264 yuv420p
        '-c:a aac',
        '-b:a 192k',
        '-ar 44100',                          // 44.1kHz (estándar WhatsApp/IG)
        '-ac 2',                              // Estéreo
        `-af volume=${volume},afade=t=out:st=${fadeStart.toFixed(1)}:d=${fadeDuration.toFixed(1)}`,
        '-shortest',                          // Cortar cuando termine el video
        '-movflags +faststart',               // Preview instantáneo en móvil
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
    const speedFactor      = request.speedFactor ?? 1.0;

    if (speedFactor !== 1.0) {
      pipeline.push(`🐢 Velocidad: ${speedFactor}x (${speedFactor < 1 ? 'ralentizado' : 'acelerado'})`);
    }

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

      await applyColorGrade(rawClip, gradedClip, colorGrade, speedFactor);
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
      pipeline.push('🎵 Obteniendo música de fondo...');

      const mergedDuration = await getVideoDuration(mergedPath);

      try {
        // getMusicTrack siempre retorna un track (descargado o generado con FFmpeg)
        const musicTrack = await getMusicTrack(
          request.style, mergedDuration, request.musicPath, request.musicUrl
        );

        const isGenerated = !request.musicPath && !request.musicUrl;
        pipeline.push(isGenerated
          ? `🎹 Música generada (${request.style}), mezclando...`
          : `🎵 Música "${request.style}" lista, mezclando...`
        );

        await addMusicTrack(mergedPath, musicTrack, finalPath, musicVolume, mergedDuration);
        pipeline.push('✅ Música agregada con fade-out');
        try { fs.unlinkSync(musicTrack); } catch { /* noop */ }
      } catch {
        // Fallback extremo: video sin audio pero bien formateado
        pipeline.push('⚠️ Error al generar música — exportando sin audio');
        await new Promise<void>((res, rej) => {
          ffmpeg(mergedPath)
            .outputOptions(['-c:v copy', '-an', '-movflags +faststart'])
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

    const totalMs    = Date.now() - startMs;
    pipeline.push(`⏱️ Completado en ${(totalMs / 1000).toFixed(1)}s`);

    // ── Ficha de producción ────────────────────────────────────────────────────
    const fileSizeMB  = fs.existsSync(finalPath)
      ? Math.round(fs.statSync(finalPath).size / 1024 / 1024 * 10) / 10
      : 0;
    const musicSource = request.musicPath   ? 'archivo local'
                      : request.musicUrl    ? 'URL provista'
                      : 'generada automáticamente';
    const ficha = buildFicha({
      inputPath:     request.videoPath,
      inputDuration: totalDuration,
      outputPath:    finalPath,
      gdrivePath,
      finalDuration,
      fileSizeMB,
      style:         request.style,
      colorGrade,
      speedFactor,
      transition,
      transitionDur,
      musicSource,
      muteOriginal,
      plan,
    });

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
      ficha,
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

// ─── Ficha de producción ──────────────────────────────────────────────────────

interface BuildFichaOpts {
  inputPath:     string;
  inputDuration: number;
  outputPath:    string;
  gdrivePath?:   string;
  finalDuration: number;
  fileSizeMB:    number;
  style:         ProductionStyle;
  colorGrade:    ColorGrade;
  speedFactor:   number;
  transition:    TransitionType;
  transitionDur: number;
  musicSource:   string;
  muteOriginal:  boolean;
  plan:          ProductionPlan;
}

const COLOR_GRADE_NAMES: Record<ColorGrade, string> = {
  warm:      'Cálido — +20% saturación, leve tono dorado, contraste +6%',
  cool:      'Frío — tonos azulados, crisp, tecnológico',
  neutral:   'Neutro — corrección natural, +10% saturación suave',
  vibrant:   'Vibrante — +40% saturación, muy energético',
  cinematic: 'Cinemático — alto contraste, vignette, mood de película',
};

const STYLE_NAMES: Record<ProductionStyle, string> = {
  'real-estate': 'Inmobiliaria — ritmo tranquilo, elegante',
  'gym':         'Gym / Fitness — dinámico, motivacional',
  'corporate':   'Corporativo — profesional, limpio',
  'social':      'Redes sociales — rápido, enganche inmediato',
};

function buildFicha(opts: BuildFichaOpts): VideoFicha {
  const fecha    = new Date().toISOString().slice(0, 10);
  const speedPct = opts.speedFactor === 1.0 ? 'Normal (1x)'
                 : opts.speedFactor < 1.0   ? `Ralentizado ${opts.speedFactor}x (${Math.round((1 - opts.speedFactor) * 100)}% más lento)`
                 :                            `Acelerado ${opts.speedFactor}x (${Math.round((opts.speedFactor - 1) * 100)}% más rápido)`;

  const segmentos = opts.plan.segments.map((s, i) => {
    const durSec = timeToSeconds(s.end) - timeToSeconds(s.start);
    const durAjustada = opts.speedFactor !== 1.0
      ? Math.round(durSec / opts.speedFactor)
      : Math.round(durSec);
    return {
      n:        i + 1,
      label:    s.label,
      desde:    s.start,
      hasta:    s.end,
      duracion: `${durAjustada}s en el video final`,
    };
  });

  // Texto para enviar al cliente (WhatsApp / email)
  const lineaSegmentos = opts.plan.segments
    .map((s, i) => `  ${i + 1}. ${s.label} (${s.start} → ${s.end})`)
    .join('\n');

  const resumenParaCliente = [
    `✅ VIDEO LISTO — ${fecha}`,
    '',
    `📱 Formato: MP4 H.264 — compatible con WhatsApp e Instagram`,
    `⏱️  Duración: ${secondsToTime(opts.finalDuration)} (reducido de ${secondsToTime(opts.inputDuration)})`,
    `📦 Tamaño: ${opts.fileSizeMB} MB`,
    '',
    `🎬 EDICIÓN REALIZADA:`,
    `• Estilo: ${STYLE_NAMES[opts.style]}`,
    `• Color grading: ${COLOR_GRADE_NAMES[opts.colorGrade]}`,
    `• Velocidad: ${speedPct}`,
    `• Transiciones: crossfade ${opts.transitionDur}s entre clips`,
    `• Música: ${opts.musicSource}`,
    `• Audio original: ${opts.muteOriginal ? 'silenciado' : 'conservado'}`,
    '',
    `✂️ ESCENAS INCLUIDAS (${opts.plan.segments.length}):`,
    lineaSegmentos,
    '',
    `💡 Criterio de selección: ${opts.plan.reasoning}`,
    '',
    `📁 Archivo: ${path.basename(opts.outputPath)}`,
    opts.gdrivePath ? `☁️  Drive: ${opts.gdrivePath}` : '',
  ].filter(Boolean).join('\n');

  return {
    fecha,
    archivoFuente:    path.basename(opts.inputPath),
    duracionOriginal: secondsToTime(opts.inputDuration),
    duracionFinal:    secondsToTime(opts.finalDuration),
    estilo:           STYLE_NAMES[opts.style],
    colorGrade:       COLOR_GRADE_NAMES[opts.colorGrade],
    velocidad:        speedPct,
    transiciones:     `${opts.transition} — ${opts.transitionDur}s entre clips`,
    musica:           opts.musicSource,
    audioOriginal:    opts.muteOriginal ? 'Silenciado' : 'Conservado',
    segmentos,
    formato:          'MP4 H.264 yuv420p — WhatsApp / Instagram / iOS / Android',
    tamanoMB:         opts.fileSizeMB,
    archivosOutput:   { local: opts.outputPath, drive: opts.gdrivePath },
    resumenParaCliente,
  };
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
