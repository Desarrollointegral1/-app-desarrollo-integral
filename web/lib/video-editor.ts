/**
 * ============================================================
 * VIDEO EDITOR — Corte y edición de videos con FFmpeg + IA
 * ============================================================
 *
 * Dos modos:
 *   MANUAL — vos decís los timestamps exactos → FFmpeg corta
 *   SMART  — la IA transcribe el audio, analiza y decide los cortes sola
 *
 * Dependencias:
 *   - fluent-ffmpeg + @ffmpeg-installer/ffmpeg (bundled, sin instalar FFmpeg)
 *   - FAL.ai Whisper para transcripción (si tiene audio/habla)
 *   - Claude Haiku para planificar los cortes inteligentes
 *
 * Desde /charles:
 *   "cortá el video en C:\Videos\gym.mp4 del minuto 0:30 al 1:45"
 *   "hacé un highlight de 30 segundos del video gym.mp4"
 *   "sacá los silencios del video C:\Videos\clase.mp4"
 * ============================================================
 */

import path from 'path';
import fs   from 'fs';
import os   from 'os';
import Anthropic from '@anthropic-ai/sdk';
import { buildLearningContextPrompt } from './video-learning';

// ─── Inicialización de FFmpeg + FFprobe ──────────────────────────────────────
// ffmpeg-static v6.1.1 — tiene xfade, vignette, colorbalance (todos los filtros modernos)
// @ffprobe-installer — ffprobe bundled por plataforma
import ffmpegType from 'fluent-ffmpeg';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegStatic      = require('ffmpeg-static')              as string;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffprobeInstaller  = require('@ffprobe-installer/ffprobe') as { path: string };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpeg = require('fluent-ffmpeg') as typeof ffmpegType;
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TimeRange {
  start:  string;  // "00:00:05" o "5" (segundos)
  end:    string;  // "00:01:30" o "90" (segundos)
  label?: string;  // Nombre del segmento (ej: "intro", "highlight 1")
}

export interface ManualCutRequest {
  mode:         'manual';
  videoPath:    string;   // Ruta absoluta al video de entrada
  cuts:         TimeRange[];  // Segmentos a extraer
  outputPath?:  string;   // Ruta de salida (default: mismo directorio, _edited)
  concatenate?: boolean;  // true = une todos los cortes en un solo archivo, false = archivos separados
}

export interface SmartCutRequest {
  mode:              'smart';
  videoPath:         string;
  instructions:      string;   // "hacé un highlight de 30s", "sacá los silencios", "resumí en 1 minuto"
  targetDurationSec?: number;  // Duración objetivo en segundos
  outputPath?:       string;
}

export type VideoCutRequest = ManualCutRequest | SmartCutRequest;

export interface VideoSegment {
  index:      number;
  start:      string;
  end:        string;
  label:      string;
  outputPath: string;
  durationSec: number;
}

export interface VideoEditResult {
  success:        boolean;
  mode:           'manual' | 'smart';
  inputPath:      string;
  inputDuration:  number;   // segundos
  segments:       VideoSegment[];
  finalOutputPath?: string; // Si concatenate=true
  transcript?:    string;   // Si se usó transcripción
  cutPlan?:       string;   // Razonamiento de la IA (modo smart)
  processingMs:   number;
  savedBytes?:    number;   // Cuánto se redujo el tamaño
  error?:         string;
}

// ─── Helpers de tiempo ────────────────────────────────────────────────────────

/** Convierte "01:23:45", "01:23", "90" → segundos */
export function timeToSeconds(time: string): number {
  if (!time) return 0;
  const trimmed = time.trim();

  // Si es solo un número → segundos directos
  if (/^\d+(\.\d+)?$/.test(trimmed)) return parseFloat(trimmed);

  // HH:MM:SS o MM:SS
  const parts = trimmed.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

/** Convierte segundos → "HH:MM:SS" */
export function secondsToTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

// ─── Obtener duración del video ───────────────────────────────────────────────

export function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err: Error | null, metadata: ffmpegType.FfprobeData) => {
      if (err) return reject(err);
      resolve(metadata.format.duration ?? 0);
    });
  });
}

// ─── Obtener metadata completa ────────────────────────────────────────────────

export interface VideoMetadata {
  duration:    number;
  width?:      number;
  height?:     number;
  fps?:        number;
  bitrate?:    number;
  codec?:      string;
  hasAudio:    boolean;
  sizeBytes:   number;
  format:      string;
}

export async function getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err: Error | null, metadata: ffmpegType.FfprobeData) => {
      if (err) return reject(err);

      const videoStream  = metadata.streams.find((s: ffmpegType.FfprobeStream) => s.codec_type === 'video');
      const audioStream  = metadata.streams.find((s: ffmpegType.FfprobeStream) => s.codec_type === 'audio');
      const stats        = fs.statSync(videoPath);

      resolve({
        duration:  metadata.format.duration ?? 0,
        width:     videoStream?.width,
        height:    videoStream?.height,
        fps:       videoStream?.r_frame_rate
          ? eval(videoStream.r_frame_rate)  // "30/1" → 30
          : undefined,
        bitrate:   metadata.format.bit_rate ? parseInt(String(metadata.format.bit_rate)) : undefined,
        codec:     videoStream?.codec_name,
        hasAudio:  !!audioStream,
        sizeBytes: stats.size,
        format:    metadata.format.format_name ?? path.extname(videoPath).slice(1),
      });
    });
  });
}

// ─── Cortar un segmento con FFmpeg ────────────────────────────────────────────

function cutSegment(
  inputPath:  string,
  outputPath: string,
  start:      string,
  end:        string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startSec = timeToSeconds(start);
    const endSec   = timeToSeconds(end);
    const duration = endSec - startSec;

    if (duration <= 0) {
      return reject(new Error(`Segmento inválido: end (${end}) debe ser mayor que start (${start})`));
    }

    ffmpeg(inputPath)
      .setStartTime(startSec)
      .setDuration(duration)
      .output(outputPath)
      .outputOptions([
        '-c copy',          // Copia sin re-encodear → ultrarrápido
        '-avoid_negative_ts make_zero',
      ])
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

// ─── Concatenar segmentos ─────────────────────────────────────────────────────

function concatenateSegments(
  segmentPaths: string[],
  outputPath:   string
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (segmentPaths.length === 1) {
      // Solo un segmento → copiar directamente
      fs.copyFileSync(segmentPaths[0], outputPath);
      return resolve();
    }

    // Crear archivo de lista temporal para FFmpeg concat
    const listPath = path.join(os.tmpdir(), `concat_${Date.now()}.txt`);
    const listContent = segmentPaths
      .map((p) => `file '${p.replace(/\\/g, '/')}'`)
      .join('\n');
    fs.writeFileSync(listPath, listContent, 'utf-8');

    ffmpeg()
      .input(listPath)
      .inputOptions(['-f concat', '-safe 0'])
      .output(outputPath)
      .outputOptions(['-c copy'])
      .on('end', () => {
        fs.unlinkSync(listPath);
        resolve();
      })
      .on('error', (err: Error) => {
        try { fs.unlinkSync(listPath); } catch { /* noop */ }
        reject(err);
      })
      .run();
  });
}

// ─── Transcribir audio con FAL.ai Whisper ────────────────────────────────────

interface WhisperResult {
  text:     string;
  chunks?:  { timestamp: [number, number]; text: string }[];
}

export async function transcribeVideo(videoPath: string): Promise<WhisperResult | null> {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) return null;  // Sin key, saltear transcripción

  try {
    // FAL.ai Whisper acepta URLs públicas, no archivos locales directamente.
    // Para archivos locales, primero extraemos el audio y lo subimos.
    // Alternativa: leer el archivo como base64 y enviarlo.
    const audioPath = path.join(os.tmpdir(), `audio_${Date.now()}.mp3`);

    // Extraer audio del video
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate('64k')
        .output(audioPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });

    // Leer audio como base64
    const audioBuffer = fs.readFileSync(audioPath);
    const base64Audio = audioBuffer.toString('base64');
    fs.unlinkSync(audioPath);

    // Llamar a FAL.ai Whisper con data URL
    const response = await fetch('https://fal.run/fal-ai/whisper', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        audio_url:   `data:audio/mp3;base64,${base64Audio}`,
        language:    'es',
        task:        'transcribe',
        chunk_level: 'segment',
      }),
    });

    if (!response.ok) return null;

    const data = await response.json() as WhisperResult;
    return data;
  } catch {
    return null;  // Transcripción opcional — no romper el flujo si falla
  }
}

// ─── Planificador inteligente de cortes ──────────────────────────────────────

interface CutPlan {
  segments: { start: string; end: string; label: string; reason: string }[];
  reasoning: string;
}

async function planSmartCuts(
  instructions:      string,
  videoDuration:     number,
  targetDurationSec: number | undefined,
  transcript:        WhisperResult | null,
  anthropic:         Anthropic
): Promise<CutPlan> {
  const durationFormatted = secondsToTime(videoDuration);
  const transcriptText    = transcript?.text
    ? `\n\nTRANSCRIPCIÓN DEL AUDIO:\n${transcript.text.slice(0, 3000)}`
    : '\n\n(El video no tiene audio transcribible o no se pudo procesar.)';

  const chunksText = transcript?.chunks
    ? `\n\nSEGMENTOS CON TIMESTAMPS:\n${
        transcript.chunks
          .slice(0, 40)
          .map((c) => `[${secondsToTime(c.timestamp[0])} → ${secondsToTime(c.timestamp[1])}] ${c.text}`)
          .join('\n')
      }`
    : '';

  // ← Cargar preferencias aprendidas de historial
  const learningContext = await buildLearningContextPrompt(instructions);

  const system = `Eres un editor de video profesional especializado en contenido de fitness y marketing.
CONTEXTO: Desarrollo Integral — Centro de entrenamiento premium en Belgrano, Buenos Aires.
ESTILO: Contenido premium, energético, profesional. El corte debe enganchar en los primeros 3 segundos.

Tu trabajo: dada una instrucción del usuario y la información del video, planificar los timestamps exactos para cortar.
Devolvé SOLO un JSON válido (sin markdown, sin explicaciones fuera del JSON):
{
  "segments": [
    {"start": "00:00:05", "end": "00:00:30", "label": "intro", "reason": "porqué este segmento"}
  ],
  "reasoning": "explicación breve del criterio de edición en español"
}

REGLAS:
- Los timestamps deben estar en formato HH:MM:SS
- Cada segmento debe tener al menos 2 segundos
- No incluir más de 10 segmentos
- Si hay targetDuration, asegurate que la suma de segmentos sea ≈ ese tiempo
- Priorizar: momentos de acción, frases clave, cambios de ritmo
- Evitar: silencios largos, momentos estáticos, inicio/fin bruscos`;

  const user = `INSTRUCCIÓN: "${instructions}"
DURACIÓN TOTAL DEL VIDEO: ${durationFormatted} (${Math.round(videoDuration)}s)
DURACIÓN OBJETIVO: ${targetDurationSec ? `${targetDurationSec}s (${secondsToTime(targetDurationSec)})` : 'No especificada — editorial libre'}
${transcriptText}${chunksText}

${learningContext}

Planificá los cortes según la instrucción Y las preferencias aprendidas.`;

  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 600,
    system,
    messages:   [{ role: 'user', content: user }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as CutPlan;
  } catch {
    // Fallback: corte simple a la mitad si no se pudo parsear
    const mid    = videoDuration / 2;
    const target = targetDurationSec ?? Math.min(60, videoDuration * 0.3);
    return {
      segments: [{
        start:  secondsToTime(Math.max(0, mid - target / 2)),
        end:    secondsToTime(Math.min(videoDuration, mid + target / 2)),
        label:  'highlight',
        reason: 'Corte centrado — análisis automático',
      }],
      reasoning: 'Corte de emergencia — no se pudo procesar la instrucción',
    };
  }
}

// ─── Función principal: MODO MANUAL ──────────────────────────────────────────

export async function cutVideoManual(
  request: ManualCutRequest
): Promise<VideoEditResult> {
  const startMs   = Date.now();
  const inputPath = request.videoPath;

  if (!fs.existsSync(inputPath)) {
    return {
      success:       false,
      mode:          'manual',
      inputPath,
      inputDuration: 0,
      segments:      [],
      processingMs:  Date.now() - startMs,
      error:         `El archivo no existe: ${inputPath}`,
    };
  }

  let inputDuration = 0;
  try {
    inputDuration = await getVideoDuration(inputPath);
  } catch (err) {
    return {
      success:       false,
      mode:          'manual',
      inputPath,
      inputDuration: 0,
      segments:      [],
      processingMs:  Date.now() - startMs,
      error:         `No se pudo leer el video: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const ext       = path.extname(inputPath);
  const base      = path.basename(inputPath, ext);
  const dir       = path.dirname(inputPath);
  const outDir    = request.outputPath ? path.dirname(request.outputPath) : dir;
  const segments: VideoSegment[] = [];
  const tempFiles: string[] = [];

  for (let i = 0; i < request.cuts.length; i++) {
    const cut       = request.cuts[i];
    const label     = cut.label ?? `segment_${i + 1}`;
    const segPath   = request.concatenate
      ? path.join(os.tmpdir(), `${base}_seg${i}_${Date.now()}${ext}`)
      : path.join(outDir, `${base}_${label}${ext}`);

    if (request.concatenate) tempFiles.push(segPath);

    try {
      await cutSegment(inputPath, segPath, cut.start, cut.end);
      const durationSec = timeToSeconds(cut.end) - timeToSeconds(cut.start);
      segments.push({
        index:       i,
        start:       cut.start,
        end:         cut.end,
        label,
        outputPath:  segPath,
        durationSec,
      });
    } catch (err) {
      // Segmento falló — continuar con los otros
      console.error(`[VideoEditor] Error en segmento ${label}:`, err);
    }
  }

  let finalOutputPath: string | undefined;
  if (request.concatenate && segments.length > 0) {
    finalOutputPath = request.outputPath
      ?? path.join(dir, `${base}_edited${ext}`);
    await concatenateSegments(segments.map((s) => s.outputPath), finalOutputPath);

    // Limpiar temporales
    for (const tmp of tempFiles) {
      try { fs.unlinkSync(tmp); } catch { /* noop */ }
    }

    // Calcular ahorro de tamaño
    const origSize  = fs.statSync(inputPath).size;
    const finalSize = fs.statSync(finalOutputPath).size;

    return {
      success:         true,
      mode:            'manual',
      inputPath,
      inputDuration,
      segments,
      finalOutputPath,
      processingMs:    Date.now() - startMs,
      savedBytes:      origSize - finalSize,
    };
  }

  return {
    success:       segments.length > 0,
    mode:          'manual',
    inputPath,
    inputDuration,
    segments,
    processingMs:  Date.now() - startMs,
    error:         segments.length === 0 ? 'Ningún segmento se pudo cortar' : undefined,
  };
}

// ─── Función principal: MODO SMART ───────────────────────────────────────────

export async function cutVideoSmart(
  request:  SmartCutRequest,
  anthropic: Anthropic
): Promise<VideoEditResult> {
  const startMs   = Date.now();
  const inputPath = request.videoPath;

  if (!fs.existsSync(inputPath)) {
    return {
      success:       false,
      mode:          'smart',
      inputPath,
      inputDuration: 0,
      segments:      [],
      processingMs:  Date.now() - startMs,
      error:         `El archivo no existe: ${inputPath}`,
    };
  }

  let inputDuration = 0;
  try {
    inputDuration = await getVideoDuration(inputPath);
  } catch (err) {
    return {
      success:       false,
      mode:          'smart',
      inputPath,
      inputDuration: 0,
      segments:      [],
      processingMs:  Date.now() - startMs,
      error:         `No se pudo leer el video: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // 1. Transcribir audio (si tiene)
  const transcript = await transcribeVideo(inputPath);

  // 2. Planificar cortes con IA
  let plan: CutPlan;
  try {
    plan = await planSmartCuts(
      request.instructions,
      inputDuration,
      request.targetDurationSec,
      transcript,
      anthropic
    );
  } catch (err) {
    return {
      success:       false,
      mode:          'smart',
      inputPath,
      inputDuration,
      segments:      [],
      processingMs:  Date.now() - startMs,
      error:         `Error planificando cortes: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // 3. Ejecutar cortes
  const ext           = path.extname(inputPath);
  const base          = path.basename(inputPath, ext);
  const dir           = path.dirname(inputPath);
  const finalOutput   = request.outputPath ?? path.join(dir, `${base}_edited${ext}`);
  const segments: VideoSegment[]  = [];
  const tempFiles: string[] = [];

  for (let i = 0; i < plan.segments.length; i++) {
    const seg      = plan.segments[i];
    const segPath  = path.join(os.tmpdir(), `${base}_smart${i}_${Date.now()}${ext}`);
    tempFiles.push(segPath);

    try {
      await cutSegment(inputPath, segPath, seg.start, seg.end);
      const durationSec = timeToSeconds(seg.end) - timeToSeconds(seg.start);
      segments.push({
        index:       i,
        start:       seg.start,
        end:         seg.end,
        label:       seg.label,
        outputPath:  segPath,
        durationSec,
      });
    } catch (err) {
      console.error(`[VideoEditor Smart] Segmento ${i} falló:`, err);
    }
  }

  if (segments.length === 0) {
    return {
      success:       false,
      mode:          'smart',
      inputPath,
      inputDuration,
      segments:      [],
      transcript:    transcript?.text,
      cutPlan:       plan.reasoning,
      processingMs:  Date.now() - startMs,
      error:         'Ningún segmento se pudo cortar',
    };
  }

  // 4. Concatenar en archivo final
  await concatenateSegments(segments.map((s) => s.outputPath), finalOutput);

  // Limpiar temporales
  for (const tmp of tempFiles) {
    try { fs.unlinkSync(tmp); } catch { /* noop */ }
  }

  const origSize  = fs.statSync(inputPath).size;
  const finalSize = fs.statSync(finalOutput).size;

  return {
    success:         true,
    mode:            'smart',
    inputPath,
    inputDuration,
    segments,
    finalOutputPath: finalOutput,
    transcript:      transcript?.text?.slice(0, 500),  // Solo primeros 500 chars
    cutPlan:         plan.reasoning,
    processingMs:    Date.now() - startMs,
    savedBytes:      origSize - finalSize,
  };
}

// ─── Dispatcher principal ─────────────────────────────────────────────────────

export async function editVideo(
  request:   VideoCutRequest,
  anthropic: Anthropic
): Promise<VideoEditResult> {
  if (request.mode === 'manual') {
    return cutVideoManual(request);
  } else {
    return cutVideoSmart(request, anthropic);
  }
}

// ─── Formatear resultado para mostrar ─────────────────────────────────────────

export function formatVideoEditResult(result: VideoEditResult): string {
  const lines: string[] = [];

  lines.push(`## ✂️ Video Editor — ${result.success ? '✅ Completado' : '❌ Error'}`);
  lines.push('');
  lines.push(`**Modo:** ${result.mode === 'manual' ? '🎯 Manual (timestamps exactos)' : '🧠 Smart (IA decidió los cortes)'}`);
  lines.push(`**Video original:** \`${result.inputPath}\``);
  lines.push(`**Duración original:** ${secondsToTime(result.inputDuration)} (${Math.round(result.inputDuration)}s)`);
  lines.push(`**Tiempo de proceso:** ${(result.processingMs / 1000).toFixed(1)}s`);
  lines.push('');

  if (result.error) {
    lines.push(`### ❌ Error: ${result.error}`);
    return lines.join('\n');
  }

  if (result.cutPlan) {
    lines.push('### 🧠 Criterio de edición (IA)');
    lines.push(result.cutPlan);
    lines.push('');
  }

  if (result.transcript) {
    lines.push('### 🎙️ Transcripción (primeros 500 chars)');
    lines.push(`> ${result.transcript}`);
    lines.push('');
  }

  lines.push('### ✂️ Segmentos cortados');
  const totalDurationSec = result.segments.reduce((sum, s) => sum + s.durationSec, 0);
  for (const seg of result.segments) {
    lines.push(`- **${seg.label}**: ${seg.start} → ${seg.end} (${seg.durationSec}s)`);
    if (!result.finalOutputPath) {
      lines.push(`  📁 \`${seg.outputPath}\``);
    }
  }
  lines.push(`**Total cortado:** ${secondsToTime(totalDurationSec)} (${Math.round(totalDurationSec)}s)`);
  lines.push('');

  if (result.finalOutputPath) {
    lines.push('### 📁 Archivo final');
    lines.push(`\`${result.finalOutputPath}\``);

    if (result.savedBytes !== undefined) {
      const savedMB = (result.savedBytes / 1024 / 1024).toFixed(1);
      const pct     = result.inputDuration > 0
        ? Math.round((1 - totalDurationSec / result.inputDuration) * 100)
        : 0;
      lines.push(`**Reducción:** ${pct}% menos duración${savedMB !== '0.0' ? ` | ${savedMB > '0' ? `${savedMB}MB menos` : `${Math.abs(parseFloat(savedMB))}MB más`}` : ''}`);
    }
  }

  return lines.join('\n');
}
