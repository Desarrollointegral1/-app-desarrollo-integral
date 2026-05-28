/**
 * ============================================================
 * VIDEO LEARNING — Sistema de Aprendizaje de Preferencias de Corte
 * ============================================================
 *
 * Aprende cómo le gustan los cortes a Lucas con el tiempo:
 *   - Guarda cada operación de corte en Supabase
 *   - Analiza patrones: duración, estilo, segmentos preferidos
 *   - Cuando hace un corte nuevo, recupera los más parecidos
 *   - La IA usa esos ejemplos para replicar el estilo
 *
 * También gestiona las carpetas de output:
 *   - Local:        C:\Users\lucas\Videos\DI-Media\
 *   - Google Drive: C:\Users\lucas\Google Drive\Mi unidad\DI-Media\
 *   - Ambas se sincronizan automáticamente via la app de Drive
 * ============================================================
 */

import fs   from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type { VideoEditResult, VideoSegment } from './video-editor';

// ─── Cliente Supabase (server-side con service role) ─────────────────────────

function getSupabase() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Gestión de carpetas de output ───────────────────────────────────────────

export interface MediaFolders {
  local:   string;
  gdrive:  string | null;
  exists:  { local: boolean; gdrive: boolean };
}

export function getMediaFolders(): MediaFolders {
  const local  = process.env.VIDEO_LOCAL_PATH
    ?? path.join(process.env.USERPROFILE ?? 'C:\\Users\\lucas', 'Videos', 'DI-Media');
  const gdrive = process.env.VIDEO_GDRIVE_PATH ?? null;

  // Crear carpetas si no existen
  if (!fs.existsSync(local)) {
    try { fs.mkdirSync(local, { recursive: true }); } catch { /* noop */ }
  }
  if (gdrive && !fs.existsSync(gdrive)) {
    try { fs.mkdirSync(gdrive, { recursive: true }); } catch { /* noop */ }
  }

  return {
    local,
    gdrive,
    exists: {
      local:  fs.existsSync(local),
      gdrive: gdrive ? fs.existsSync(gdrive) : false,
    },
  };
}

/**
 * Genera una ruta de output con nombre descriptivo.
 * Ej: DI-Media/2026-05-28_gym-session_highlight_30s.mp4
 */
export function generateOutputPath(
  sourceFile: string,
  label:      string,
  durationSec?: number
): { local: string; gdrive: string | null } {
  const folders  = getMediaFolders();
  const date     = new Date().toISOString().slice(0, 10);
  const baseName = path.basename(sourceFile, path.extname(sourceFile))
    .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 30);
  const labelClean = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 20);
  const durStr   = durationSec ? `_${Math.round(durationSec)}s` : '';
  const ext      = path.extname(sourceFile) || '.mp4';
  const fileName = `${date}_${baseName}_${labelClean}${durStr}${ext}`;

  return {
    local:  path.join(folders.local, fileName),
    gdrive: folders.gdrive ? path.join(folders.gdrive, fileName) : null,
  };
}

// ─── Hash del video (primeros 4MB) ───────────────────────────────────────────

function hashVideoFile(filePath: string): string {
  try {
    const fd     = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4 * 1024 * 1024);  // 4MB
    const read   = fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);
    return crypto.createHash('sha256').update(buffer.subarray(0, read)).digest('hex').slice(0, 16);
  } catch {
    return 'unknown';
  }
}

// ─── Detección de estilo/tags ─────────────────────────────────────────────────

function detectStyleTags(
  segments:     VideoSegment[],
  instructions: string | undefined,
  durationRatio: number
): string[] {
  const tags   = new Set<string>();
  const instr  = (instructions ?? '').toLowerCase();

  // Por duración ratio
  if (durationRatio < 0.2)  tags.add('very-tight');
  if (durationRatio < 0.35) tags.add('tight');
  if (durationRatio > 0.6)  tags.add('loose');

  // Por longitud de segmentos
  const avgSec = segments.reduce((s, seg) => s + seg.durationSec, 0) / (segments.length || 1);
  if (avgSec < 5)  tags.add('fast-cuts');
  if (avgSec > 30) tags.add('long-takes');

  // Por keywords en instrucción
  if (instr.includes('highlight') || instr.includes('mejor'))   tags.add('highlights');
  if (instr.includes('silencio') || instr.includes('silenc'))   tags.add('no-silence');
  if (instr.includes('resumen') || instr.includes('resumí'))    tags.add('summary');
  if (instr.includes('intro') || instr.includes('presentaci'))  tags.add('intro-style');
  if (instr.includes('reel') || instr.includes('instagram'))    tags.add('social-media');
  if (instr.includes('acción') || instr.includes('accion'))     tags.add('action');
  if (instr.includes('clase') || instr.includes('evaluaci'))    tags.add('educational');

  // Por labels de segmentos
  for (const seg of segments) {
    const l = (seg.label ?? '').toLowerCase();
    if (l.includes('highlight')) tags.add('highlights');
    if (l.includes('intro'))     tags.add('intro-style');
    if (l.includes('action'))    tags.add('action');
  }

  return [...tags];
}

function detectContextType(
  sourcePath:   string,
  instructions: string | undefined
): string {
  const src   = path.basename(sourcePath).toLowerCase();
  const instr = (instructions ?? '').toLowerCase();
  const combined = src + ' ' + instr;

  if (combined.includes('reel') || combined.includes('instagram') || combined.includes('story'))
    return 'social-reel';
  if (combined.includes('evaluaci'))
    return 'evaluation';
  if (combined.includes('clase') || combined.includes('class'))
    return 'class';
  if (combined.includes('highlight'))
    return 'highlight';
  if (combined.includes('gym') || combined.includes('sesion') || combined.includes('sesión'))
    return 'gym-session';
  return 'general';
}

// ─── Guardar resultado de corte en Supabase ───────────────────────────────────

export interface SaveCutOptions {
  result:      VideoEditResult;
  userRating?: number;   // 1-5
  userNotes?:  string;
  approved?:   boolean;
}

export async function saveCutToHistory(opts: SaveCutOptions): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase || !opts.result.success) return null;

  const { result } = opts;
  const totalOutputSec = result.segments.reduce((s, seg) => s + seg.durationSec, 0);
  const durationRatio  = result.inputDuration > 0
    ? totalOutputSec / result.inputDuration
    : 0;

  const styleInstructions = result.mode === 'smart'
    ? (result as VideoEditResult & { instructions?: string }).instructions
    : undefined;

  const styleTags   = detectStyleTags(result.segments, styleInstructions, durationRatio);
  const contextType = detectContextType(result.inputPath, styleInstructions);
  const sourceHash  = hashVideoFile(result.inputPath);

  const sourceSizeMB = (() => {
    try {
      return fs.statSync(result.inputPath).size / (1024 * 1024);
    } catch { return null; }
  })();

  const record = {
    source_path:      result.inputPath,
    source_hash:      sourceHash,
    source_duration:  result.inputDuration,
    source_size_mb:   sourceSizeMB,
    output_path:      result.finalOutputPath ?? result.segments[0]?.outputPath ?? '',
    output_duration:  totalOutputSec,
    duration_ratio:   durationRatio,
    cut_mode:         result.mode,
    instructions:     styleInstructions ?? null,
    segments_json:    result.segments.map((s) => ({
      start:       s.start,
      end:         s.end,
      label:       s.label,
      durationSec: s.durationSec,
    })),
    segment_count:    result.segments.length,
    style_tags:       styleTags,
    avg_segment_sec:  totalOutputSec / (result.segments.length || 1),
    min_segment_sec:  Math.min(...result.segments.map((s) => s.durationSec)),
    max_segment_sec:  Math.max(...result.segments.map((s) => s.durationSec)),
    context_type:     contextType,
    transcript_text:  result.transcript ?? null,
    processing_ms:    result.processingMs,
    user_rating:      opts.userRating ?? null,
    user_notes:       opts.userNotes ?? null,
    approved:         opts.approved ?? null,
  };

  const { data, error } = await supabase
    .from('video_cuts')
    .insert(record)
    .select('id')
    .single();

  if (error) {
    console.error('[VideoLearning] Error guardando corte:', error.message);
    return null;
  }

  // Actualizar perfil de estilo en background
  updateStyleProfile().catch(() => { /* noop */ });

  return data?.id ?? null;
}

// ─── Actualizar perfil de estilo (resumen aprendido) ─────────────────────────

async function updateStyleProfile(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { data: cuts } = await supabase
    .from('video_cuts')
    .select('duration_ratio, avg_segment_sec, style_tags, context_type, user_rating')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!cuts || cuts.length === 0) return;

  const approved = cuts.filter((c: { user_rating?: number }) => (c.user_rating ?? 3) >= 3);
  const sample   = approved.length > 5 ? approved : cuts;

  const ratios    = sample.map((c: { duration_ratio: number }) => c.duration_ratio).filter(Boolean);
  const avgSecs   = sample.map((c: { avg_segment_sec: number }) => c.avg_segment_sec).filter(Boolean);
  const ratings   = cuts.filter((c: { user_rating?: number }) => c.user_rating).map((c: { user_rating: number }) => c.user_rating);

  // Contar tags y contextos más frecuentes
  const tagCounts: Record<string, number>  = {};
  const ctxCounts: Record<string, number>  = {};
  for (const cut of sample) {
    for (const tag of (cut.style_tags ?? [])) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    if (cut.context_type) ctxCounts[cut.context_type] = (ctxCounts[cut.context_type] ?? 0) + 1;
  }

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
  const topCtx  = Object.entries(ctxCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);

  const avg = (arr: number[]) => arr.length
    ? arr.reduce((a, b) => a + b, 0) / arr.length
    : 0;

  const totalHours = (cuts as { output_duration?: number }[]).reduce(
    (s: number, c) => s + (c.output_duration ?? 0), 0
  ) / 3600;

  await supabase
    .from('video_style_profile')
    .update({
      preferred_ratio_min:   Math.min(...ratios) || 0.2,
      preferred_ratio_max:   Math.max(...ratios) || 0.5,
      preferred_ratio_avg:   avg(ratios) || 0.35,
      preferred_seg_avg_sec: avg(avgSecs) || 15,
      top_style_tags:        topTags,
      top_context_types:     topCtx,
      total_cuts_done:       cuts.length,
      total_hours_edited:    Math.round(totalHours * 10) / 10,
      avg_rating:            Math.round(avg(ratings) * 10) / 10 || 0,
      updated_at:            new Date().toISOString(),
    })
    .eq('id', '00000000-0000-0000-0000-000000000001');
}

// ─── Recuperar preferencias aprendidas ───────────────────────────────────────

export interface LearnedPreferences {
  preferredRatioAvg:  number;
  preferredSegAvgSec: number;
  topStyleTags:       string[];
  topContextTypes:    string[];
  totalCutsDone:      number;
  avgRating:          number;
  recentExamples:     SimilarCut[];
  styleSummary:       string;
}

export interface SimilarCut {
  instructions: string | null;
  segmentsJson: object;
  durationRatio: number;
  styleTags:    string[];
  contextType:  string | null;
  userRating:   number | null;
}

export async function getLearnedPreferences(
  currentInstructions?: string
): Promise<LearnedPreferences> {
  const supabase = getSupabase();

  const defaults: LearnedPreferences = {
    preferredRatioAvg:  0.35,
    preferredSegAvgSec: 15,
    topStyleTags:       [],
    topContextTypes:    [],
    totalCutsDone:      0,
    avgRating:          0,
    recentExamples:     [],
    styleSummary:       'Sin historial aún — aprendiendo de tus primeros cortes.',
  };

  if (!supabase) return defaults;

  // Obtener perfil global
  const { data: profile } = await supabase
    .from('video_style_profile')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();

  // Obtener cortes recientes más valorados
  const { data: recent } = await supabase
    .from('video_cuts')
    .select('instructions, segments_json, duration_ratio, style_tags, context_type, user_rating')
    .order('created_at', { ascending: false })
    .limit(10);

  const recentExamples: SimilarCut[] = (recent ?? []).map((r: {
    instructions: string | null;
    segments_json: object;
    duration_ratio: number;
    style_tags: string[];
    context_type: string | null;
    user_rating: number | null;
  }) => ({
    instructions: r.instructions,
    segmentsJson: r.segments_json,
    durationRatio: r.duration_ratio,
    styleTags:    r.style_tags,
    contextType:  r.context_type,
    userRating:   r.user_rating,
  }));

  // Generar resumen de estilo legible
  const styleSummary = buildStyleSummary(profile, recentExamples);

  return {
    preferredRatioAvg:  profile?.preferred_ratio_avg  ?? 0.35,
    preferredSegAvgSec: profile?.preferred_seg_avg_sec ?? 15,
    topStyleTags:       profile?.top_style_tags ?? [],
    topContextTypes:    profile?.top_context_types ?? [],
    totalCutsDone:      profile?.total_cuts_done ?? 0,
    avgRating:          profile?.avg_rating ?? 0,
    recentExamples,
    styleSummary,
  };
}

function buildStyleSummary(
  profile: Record<string, unknown> | null,
  recent:  SimilarCut[]
): string {
  if (!profile || (profile.total_cuts_done as number) === 0) {
    return 'Sin historial aún — aprendiendo de tus primeros cortes.';
  }

  const parts: string[] = [];
  const ratio = profile.preferred_ratio_avg as number;
  const cuts  = profile.total_cuts_done as number;

  parts.push(`${cuts} corte${cuts !== 1 ? 's' : ''} registrado${cuts !== 1 ? 's' : ''}`);

  if (ratio < 0.25)      parts.push('estilo muy compacto (conserva ~' + Math.round(ratio * 100) + '% del video)');
  else if (ratio < 0.4)  parts.push('cortes ajustados (~' + Math.round(ratio * 100) + '% del original)');
  else                   parts.push('edición moderada (~' + Math.round(ratio * 100) + '% del original)');

  const tags = (profile.top_style_tags as string[]) ?? [];
  if (tags.includes('fast-cuts'))  parts.push('prefiere cortes rápidos');
  if (tags.includes('highlights')) parts.push('orientado a highlights');
  if (tags.includes('no-silence')) parts.push('elimina silencios');
  if (tags.includes('action'))     parts.push('prioriza momentos de acción');

  if ((profile.avg_rating as number) >= 4) parts.push('🌟 buena satisfacción con los resultados');

  return parts.join(' · ');
}

// ─── Prompt de contexto de aprendizaje para la IA ────────────────────────────

export async function buildLearningContextPrompt(
  instructions: string
): Promise<string> {
  const prefs = await getLearnedPreferences(instructions);

  if (prefs.totalCutsDone === 0) {
    return '(Sin historial de cortes previos — este es el primer corte del sistema)';
  }

  const lines: string[] = [
    '=== PREFERENCIAS APRENDIDAS DE LUCAS ===',
    `Historial: ${prefs.totalCutsDone} cortes anteriores`,
    `Estilo: ${prefs.styleSummary}`,
    `Duración a conservar: ~${Math.round(prefs.preferredRatioAvg * 100)}% del video`,
    `Duración promedio por segmento: ~${Math.round(prefs.preferredSegAvgSec)}s`,
  ];

  if (prefs.topStyleTags.length > 0) {
    lines.push(`Tags frecuentes: ${prefs.topStyleTags.join(', ')}`);
  }

  if (prefs.recentExamples.length > 0) {
    lines.push('');
    lines.push('Ejemplos de cortes anteriores que le gustaron:');
    for (const ex of prefs.recentExamples.slice(0, 3)) {
      const ratio = Math.round(ex.durationRatio * 100);
      const rating = ex.userRating ? `⭐${ex.userRating}` : '';
      const instr = ex.instructions ? `"${ex.instructions.slice(0, 60)}"` : '(manual)';
      lines.push(`  - ${instr} → conservó ${ratio}% ${rating}`);
    }
  }

  lines.push('=== FIN PREFERENCIAS ===');
  lines.push('');
  lines.push('Usá estas preferencias para calibrar los cortes del video actual.');

  return lines.join('\n');
}

// ─── Copiar a Google Drive ────────────────────────────────────────────────────

export async function copyToGoogleDrive(
  localPath: string,
  gdrivePath: string
): Promise<boolean> {
  try {
    const gdriveDir = path.dirname(gdrivePath);
    if (!fs.existsSync(gdriveDir)) {
      fs.mkdirSync(gdriveDir, { recursive: true });
    }
    fs.copyFileSync(localPath, gdrivePath);
    return true;
  } catch (err) {
    console.error('[VideoLearning] Error copiando a Google Drive:', err);
    return false;
  }
}

// ─── Dar feedback a un corte ──────────────────────────────────────────────────

export async function rateCut(
  cutId:   string,
  rating:  number,       // 1-5
  notes?:  string,
  approved?: boolean
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from('video_cuts')
    .update({
      user_rating: rating,
      user_notes:  notes ?? null,
      approved:    approved ?? (rating >= 3),
    })
    .eq('id', cutId);

  if (!error) {
    updateStyleProfile().catch(() => { /* noop */ });
  }

  return !error;
}

// ─── Ver historial de cortes ──────────────────────────────────────────────────

export async function getCutHistory(limit = 20): Promise<SimilarCut[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from('video_cuts_summary')
    .select('*')
    .limit(limit);

  return (data ?? []).map((r: Record<string, unknown>) => ({
    instructions: r.instructions as string | null,
    segmentsJson: {},
    durationRatio: r.kept_percent ? (r.kept_percent as number) / 100 : 0,
    styleTags:    r.style_tags as string[] ?? [],
    contextType:  r.context_type as string | null,
    userRating:   r.user_rating as number | null,
  }));
}
