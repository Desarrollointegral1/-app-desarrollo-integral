/**
 * ============================================================
 * CREATIVE MEDIA — Generación de Imágenes y Videos vía API
 * ============================================================
 *
 * Proveedor principal: FAL.ai
 *   - Imágenes: Flux Schnell (rápido) / Flux Pro (calidad)
 *   - Videos:   Kling v1.6 (texto→video) / CogVideoX (artístico)
 *
 * Pipeline:
 *   1. Idea bruta del usuario
 *   2. Claude Haiku refina la idea → prompt optimizado
 *   3. FAL.ai genera el media
 *   4. Devuelve URL pública
 *
 * Uso desde /charles:
 *   "generá una imagen de un atleta entrenando en gym premium"
 *   "hacé un video de 5s mostrando la metodología DI"
 *   "crea una imagen para Instagram del centro"
 * ============================================================
 */

import Anthropic from '@anthropic-ai/sdk';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video';

export type ImageModel =
  | 'fal-ai/flux/schnell'   // Rápido, gratis primeros 10/día, $0.003/imagen — ideal para pruebas
  | 'fal-ai/flux-pro'       // Calidad máxima, $0.05/imagen
  | 'fal-ai/flux-realism';  // Fotorrealismo, $0.02/imagen

export type VideoModel =
  | 'fal-ai/kling-video/v1.6/standard/text-to-video'  // 5s, $0.08/video
  | 'fal-ai/kling-video/v1.6/pro/text-to-video'       // 10s, alta calidad, $0.28/video
  | 'fal-ai/cogvideox-5b';                             // Artístico, $0.05/video

export interface CreativeRequest {
  rawIdea:     string;      // Idea bruta del usuario — sin elaborar
  mediaType?:  MediaType;   // 'image' | 'video' — si no se especifica, se detecta automático
  style?:      string;      // Estilo deseado: 'premium', 'energético', 'minimalista', etc.
  ratio?:      '1:1' | '16:9' | '9:16' | '4:3';  // Proporción (default: 16:9)
  duration?:   5 | 10;     // Solo para video (segundos, default: 5)
  quality?:    'fast' | 'quality';  // fast = modelo rápido barato, quality = mejor modelo
  context?:    string;      // Contexto adicional (ej: "para Instagram Stories")
}

export interface RefinedPrompt {
  original:       string;
  refined:        string;
  negativePrompt: string;
  mediaType:      MediaType;
  reasoning:      string;
}

export interface CreativeResult {
  success:        boolean;
  mediaType:      MediaType;
  url?:           string;       // URL pública del media generado
  thumbnailUrl?:  string;       // Solo para video
  duration?:      number;       // Solo para video (segundos)
  width?:         number;
  height?:        number;
  refinedPrompt:  RefinedPrompt;
  model:          string;
  generationMs:   number;
  cost?:          string;       // Costo aproximado en USD
  error?:         string;
  previewHtml?:   string;       // HTML listo para mostrar
}

// ─── Detección automática de tipo de media ────────────────────────────────────

const VIDEO_KEYWORDS = [
  'video', 'vídeo', 'clip', 'animación', 'animado', 'movimiento', 'secuencia',
  'reels', 'reel', 'shorts', 'story animada', 'timelapse', 'cinematic', 'cine',
  'veo', 'veo2', 'film', 'filmá', 'grabá',
];

const IMAGE_KEYWORDS = [
  'imagen', 'foto', 'fotografía', 'diseño', 'banner', 'poster', 'thumbnail',
  'ilustración', 'render', 'visual', 'gráfico', 'flyer', 'portada',
  'imagen para', 'foto de', 'diseñá', 'crea una imagen',
];

export function detectMediaType(idea: string): MediaType {
  const lower = idea.toLowerCase();
  const videoScore = VIDEO_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  const imageScore = IMAGE_KEYWORDS.filter((kw) => lower.includes(kw)).length;

  if (videoScore > imageScore) return 'video';
  if (imageScore > videoScore) return 'image';

  // Default: imagen (más rápido, más barato, más feedback)
  return 'image';
}

// ─── Refinamiento de idea con Claude Haiku ────────────────────────────────────

export async function refineCreativeIdea(
  request: CreativeRequest,
  anthropic: Anthropic
): Promise<RefinedPrompt> {
  const mediaType = request.mediaType ?? detectMediaType(request.rawIdea);
  const ratio     = request.ratio ?? '16:9';
  const style     = request.style ?? 'premium dark cinematic';
  const context   = request.context ?? '';

  const systemPrompt = `Eres un experto en prompt engineering para generación de media con IA (imagen y video).
Tu trabajo: transformar una idea bruta en un prompt optimizado para FAL.ai (modelos Flux/Kling).

MARCA: Desarrollo Integral — Centro de entrenamiento premium en Belgrano, Buenos Aires.
ESTILO DE MARCA: Dark premium, minimalista, dorado (#C8A96E), energía controlada, profesional.
AUDIENCIA: Profesionales 28-45 años, zona norte CABA, alto poder adquisitivo.

REGLAS PARA EL PROMPT REFINADO:
- Usar terminología específica de generación visual (lighting, composition, style)
- Para imágenes: especificar cámara, lente, iluminación, mood, composición
- Para videos: especificar movimiento de cámara, ritmo, atmosfera, transiciones
- Mantener la esencia de la idea original del usuario
- Adaptar al estilo de la marca si no hay instrucciones contrarias
- Agregar calidad técnica: "8K", "photorealistic", "professional photography", etc.
- Negative prompt: lo que NO queremos ver

RESPONDER SOLO EN ESTE FORMATO JSON (sin markdown, sin comentarios):
{
  "refined": "el prompt optimizado en inglés, detallado y técnico",
  "negativePrompt": "low quality, blurry, amateur, watermark, text, distorted",
  "reasoning": "explicación breve en español de qué cambié y por qué"
}`;

  const userMsg = `IDEA BRUTA: "${request.rawIdea}"
TIPO: ${mediaType}
PROPORCIÓN: ${ratio}
ESTILO: ${style}
CONTEXTO ADICIONAL: ${context || 'ninguno'}

Refiná esta idea en un prompt optimizado para generar ${mediaType === 'image' ? 'una imagen' : 'un video'} de alta calidad.`;

  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 800,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: userMsg }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Respuesta inesperada del modelo de refinamiento');
  }

  try {
    // Limpiar el texto por si viene con markdown code blocks
    const cleaned = content.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(cleaned) as { refined: string; negativePrompt: string; reasoning: string };

    return {
      original:       request.rawIdea,
      refined:        parsed.refined,
      negativePrompt: parsed.negativePrompt,
      mediaType,
      reasoning:      parsed.reasoning,
    };
  } catch {
    // Fallback: usar idea original traducida al inglés de forma básica
    return {
      original:       request.rawIdea,
      refined:        `${request.rawIdea}, premium dark gym, professional photography, 8K, cinematic lighting, photorealistic`,
      negativePrompt: 'low quality, blurry, amateur, watermark, text overlay',
      mediaType,
      reasoning:      'Error al parsear respuesta — usando prompt básico',
    };
  }
}

// ─── Llamadas a FAL.ai ────────────────────────────────────────────────────────

interface FalImageResponse {
  images: { url: string; width: number; height: number; content_type: string }[];
  timings?: { inference: number };
  prompt?: string;
}

interface FalQueueResponse {
  request_id: string;
  status:     'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response_url?: string;
}

interface FalVideoResponse {
  video: { url: string; content_type: string };
}

interface FalStatusResponse {
  status:   'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response?: FalVideoResponse;
  error?:    string;
}

const RATIO_TO_IMAGE_SIZE: Record<string, string> = {
  '1:1':  'square_hd',
  '16:9': 'landscape_16_9',
  '9:16': 'portrait_16_9',
  '4:3':  'landscape_4_3',
};

async function generateImage(
  prompt:         RefinedPrompt,
  ratio:          string,
  quality:        'fast' | 'quality',
  falKey:         string
): Promise<{ url: string; width: number; height: number; model: string; cost: string }> {
  const model: ImageModel = quality === 'quality' ? 'fal-ai/flux-pro' : 'fal-ai/flux/schnell';
  const imageSize = RATIO_TO_IMAGE_SIZE[ratio] ?? 'landscape_16_9';

  const body: Record<string, unknown> = {
    prompt:          prompt.refined,
    image_size:      imageSize,
    num_images:      1,
    enable_safety_checker: false,
  };

  // Flux Schnell no acepta negative_prompt
  if (model !== 'fal-ai/flux/schnell') {
    body.negative_prompt = prompt.negativePrompt;
    body.num_inference_steps = 28;
    body.guidance_scale = 3.5;
  }

  const response = await fetch(`https://fal.run/${model}`, {
    method:  'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`FAL.ai image error (${response.status}): ${err}`);
  }

  const data = await response.json() as FalImageResponse;
  const img   = data.images[0];
  const cost  = quality === 'quality' ? '~$0.05' : '~$0.003';

  return { url: img.url, width: img.width, height: img.height, model, cost };
}

async function generateVideo(
  prompt:   RefinedPrompt,
  duration: 5 | 10,
  quality:  'fast' | 'quality',
  falKey:   string
): Promise<{ url: string; model: string; cost: string; durationSec: number }> {
  // Kling v1.6 — el mejor modelo de video disponible en FAL.ai
  const model: VideoModel = quality === 'quality'
    ? 'fal-ai/kling-video/v1.6/pro/text-to-video'
    : 'fal-ai/kling-video/v1.6/standard/text-to-video';

  const cost = quality === 'quality' ? '~$0.28' : '~$0.08';

  // Step 1: Encolar la generación (video es async, tarda 1-3 min)
  const enqueueResponse = await fetch(`https://queue.fal.run/${model}`, {
    method:  'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      prompt:   prompt.refined,
      duration: duration.toString(),
    }),
  });

  if (!enqueueResponse.ok) {
    const err = await enqueueResponse.text();
    throw new Error(`FAL.ai video enqueue error (${enqueueResponse.status}): ${err}`);
  }

  const queueData = await enqueueResponse.json() as FalQueueResponse;
  const requestId = queueData.request_id;

  if (!requestId) {
    throw new Error('FAL.ai no devolvió request_id');
  }

  // Step 2: Polling hasta completar (máx 3 minutos)
  const maxAttempts = 36; // 36 × 5s = 3 min
  let   attempts    = 0;

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Esperar 5s
    attempts++;

    const statusResponse = await fetch(
      `https://queue.fal.run/${model}/requests/${requestId}`,
      {
        headers: { 'Authorization': `Key ${falKey}` },
      }
    );

    if (!statusResponse.ok) continue;

    const statusData = await statusResponse.json() as FalStatusResponse;

    if (statusData.status === 'COMPLETED' && statusData.response?.video?.url) {
      return {
        url:         statusData.response.video.url,
        model,
        cost,
        durationSec: duration,
      };
    }

    if (statusData.status === 'FAILED') {
      throw new Error(`FAL.ai video failed: ${statusData.error ?? 'Error desconocido'}`);
    }

    // IN_QUEUE o IN_PROGRESS → seguir esperando
  }

  throw new Error('Timeout: el video tardó más de 3 minutos. Intentá de nuevo.');
}

// ─── Función principal ────────────────────────────────────────────────────────

export async function generateCreativeMedia(
  request:   CreativeRequest,
  anthropic: Anthropic
): Promise<CreativeResult> {
  const startMs = Date.now();
  const falKey  = process.env.FAL_API_KEY;

  if (!falKey) {
    return {
      success:       false,
      mediaType:     request.mediaType ?? 'image',
      refinedPrompt: {
        original:       request.rawIdea,
        refined:        '',
        negativePrompt: '',
        mediaType:      request.mediaType ?? 'image',
        reasoning:      '',
      },
      model:         '',
      generationMs:  0,
      error:         'FAL_API_KEY no configurada. Conseguí tu key gratis en https://fal.ai (crea cuenta, Settings → API Keys)',
    };
  }

  // 1. Refinar la idea con Claude
  let refined: RefinedPrompt;
  try {
    refined = await refineCreativeIdea(request, anthropic);
  } catch (err) {
    return {
      success:       false,
      mediaType:     request.mediaType ?? 'image',
      refinedPrompt: {
        original:       request.rawIdea,
        refined:        request.rawIdea,
        negativePrompt: '',
        mediaType:      request.mediaType ?? 'image',
        reasoning:      'Error en refinamiento',
      },
      model:         '',
      generationMs:  Date.now() - startMs,
      error:         `Error refinando idea: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const ratio    = request.ratio   ?? '16:9';
  const quality  = request.quality ?? 'fast';
  const duration = request.duration ?? 5;

  // 2. Generar media
  try {
    if (refined.mediaType === 'image') {
      const result = await generateImage(refined, ratio, quality, falKey);

      return {
        success:       true,
        mediaType:     'image',
        url:           result.url,
        width:         result.width,
        height:        result.height,
        refinedPrompt: refined,
        model:         result.model,
        generationMs:  Date.now() - startMs,
        cost:          result.cost,
        previewHtml:   buildImageHtml(result.url, refined.original, result.width, result.height),
      };
    } else {
      const result = await generateVideo(refined, duration, quality, falKey);

      return {
        success:       true,
        mediaType:     'video',
        url:           result.url,
        duration:      result.durationSec,
        refinedPrompt: refined,
        model:         result.model,
        generationMs:  Date.now() - startMs,
        cost:          result.cost,
        previewHtml:   buildVideoHtml(result.url, refined.original, result.durationSec),
      };
    }
  } catch (err) {
    return {
      success:       false,
      mediaType:     refined.mediaType,
      refinedPrompt: refined,
      model:         refined.mediaType === 'image' ? 'fal-ai/flux/schnell' : 'fal-ai/kling-video',
      generationMs:  Date.now() - startMs,
      error:         err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── HTML de preview ──────────────────────────────────────────────────────────

function buildImageHtml(url: string, alt: string, width: number, height: number): string {
  return `<div style="max-width:800px;margin:16px 0;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.4)">
  <img src="${url}" alt="${alt}" width="${width}" height="${height}" style="width:100%;height:auto;display:block" loading="lazy" />
</div>
<p style="font-size:0.75rem;color:#666;margin-top:4px">
  <a href="${url}" target="_blank" rel="noopener">🔗 Abrir imagen en tamaño completo</a>
</p>`;
}

function buildVideoHtml(url: string, title: string, duration: number): string {
  return `<div style="max-width:800px;margin:16px 0;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.4)">
  <video controls autoplay loop muted style="width:100%;height:auto;display:block" title="${title}">
    <source src="${url}" type="video/mp4" />
    Tu browser no soporta video HTML5.
  </video>
</div>
<p style="font-size:0.75rem;color:#666;margin-top:4px">
  📹 Video ${duration}s — <a href="${url}" target="_blank" rel="noopener">🔗 Descargar</a>
</p>`;
}

// ─── Helper: Formatear resultado para el sistema de agentes ──────────────────

export function formatCreativeResultForAgent(result: CreativeResult): string {
  const lines: string[] = [];

  lines.push(`## 🎬 Creative Media Agent — ${result.success ? '✅ Generado' : '❌ Error'}`);
  lines.push('');
  lines.push(`**Idea original:** "${result.refinedPrompt.original}"`);
  lines.push(`**Tipo:** ${result.mediaType === 'image' ? '🖼️ Imagen' : '🎥 Video'}`);
  lines.push(`**Modelo:** \`${result.model}\``);
  lines.push(`**Tiempo:** ${(result.generationMs / 1000).toFixed(1)}s`);
  if (result.cost) lines.push(`**Costo:** ${result.cost}`);
  lines.push('');

  lines.push('### 🧠 Refinamiento de prompt');
  lines.push(`**Razonamiento:** ${result.refinedPrompt.reasoning}`);
  lines.push('');
  lines.push('**Prompt optimizado:**');
  lines.push(`> ${result.refinedPrompt.refined}`);
  lines.push('');

  if (result.success && result.url) {
    lines.push('### 🔗 Resultado');
    lines.push(`**URL:** ${result.url}`);
    if (result.width && result.height) {
      lines.push(`**Dimensiones:** ${result.width}×${result.height}px`);
    }
    if (result.duration) {
      lines.push(`**Duración:** ${result.duration}s`);
    }
    lines.push('');
    if (result.previewHtml) {
      lines.push('### Vista previa');
      lines.push(result.previewHtml);
    }
  } else if (result.error) {
    lines.push(`### ❌ Error: ${result.error}`);
  }

  return lines.join('\n');
}
