/**
 * ============================================================
 * PARALLEL AGENTS — Paralelismo Real con Anthropic SDK
 * ============================================================
 *
 * Implementa múltiples llamadas simultáneas a la API de Anthropic
 * usando Promise.all(), una llamada por agente especialista.
 *
 * ARQUITECTURA:
 *   7 agentes especializados → todos con sus propios system prompts
 *   Promise.all() → ejecuta TODOS en paralelo realmente
 *   Resultados integrados → coalición emergente
 *
 * DIFERENCIA vs el viejo sistema:
 *   ANTES: Agentes ejecutaban en SECUENCIA (uno esperaba al otro)
 *   AHORA: Todos ejecutan al MISMO TIEMPO → 7x más rápido
 * ============================================================
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAgents } from './supabase-agents';
import { collectProjectContext, formatContextForPrompt, type ProjectContext } from './context-collector';
import { selectModels, type ModelAssignment } from './model-selector';
import { runCodeSpecialistWithTools, type FileWrite } from './agent-tools';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  domains: string[];
  keywords: string[];
  systemPrompt: string;
  successRate: number;
  avgMinutes: number;
}

export interface AgentBid {
  agentId: string;
  agentName: string;
  confidence: number;
  canDo: string[];
  reasoning: string;
  willingToLead: boolean;
}

export interface AgentResult {
  agentId: string;
  agentName: string;
  emoji: string;
  subtask: string;
  output: string;
  score?: number; // Peer-evaluation score (0-25)
  executionMs: number;
  tokensUsed: number;
  success: boolean;
  error?: string;
}

export interface CoalitionResult {
  taskDescription:  string;
  selectedAgents:   AgentBid[];
  results:          AgentResult[];
  peerScores:       Record<string, number>;
  collectiveScore:  number;
  totalExecutionMs: number;
  totalTokensUsed:  number;
  iterations:       number;
  // Nuevos campos
  contextUsed:       ProjectContext | null;
  modelAssignments:  Record<string, ModelAssignment>;
  filesToWrite:      FileWrite[];
  roundCount:        number;
  conflicts:         string[];    // Conflictos inter-agente detectados y resueltos
  learningApplied:   string;      // Descripción del ajuste de aprendizaje aplicado
  pattern: {
    taskType:   string;
    keywords:   string[];
    agentsUsed: string[];
    learning:   string;
  };
}

// ─── Registry de los 7 Agentes Especialistas ─────────────────────────────────

export const AGENT_REGISTRY: AgentConfig[] = [
  {
    id: 'agent-design-specialist',
    name: 'Design Specialist',
    emoji: '🎨',
    domains: ['visual', 'ux', 'ui', 'layout', 'typography', 'color', 'mobile', 'responsive', 'premium', 'branding', 'foto', 'imagen', 'social', 'banner', 'template'],
    keywords: ['diseña', 'diseño', 'visual', 'premium', 'ui', 'ux', 'navbar', 'hero', 'landing', 'componente', 'color', 'tipografía', 'layout', 'mobile', 'rediseña', 'mejora', 'foto', 'imagen', 'banner', 'social', 'variación'],
    systemPrompt: `Eres el Design Specialist de Desarrollo Integral.
MARCA: Desarrollo Integral — Centro de entrenamiento premium en Belgrano, Buenos Aires.
STACK: Next.js 16 + React 19 + Tailwind 4 + Framer Motion + GSAP.
COLORES: Gold #C8A96E, Dark #0a0a0a, Sage #6B8E71.
FONT: PP Formula (300, 500, 600, 700, 900).
ESTILO: Dark premium. Minimalista. Autoridad con calidez.
CONSTRAINTS: Imágenes < 100kb above-fold (performance). Animaciones 300ms cubic-bezier(0.23, 1, 0.32, 1).

CAPACIDADES ADICIONALES (Adobe Creative Cloud):
- adobe-batch-edit-photos: edición masiva de fotos del gym (contraste, corrección de color, marca de agua)
- adobe-create-social-variations: una imagen → formatos automáticos (Story 9:16, Post 1:1, Banner 16:9)
- adobe-design-from-template: crear variantes de diseño desde templates de la marca
- adobe-retouch-portraits: retocar fotos de entrenadores y atletas
- adobe-resize-photos-and-videos: redimensionar assets para web y mobile

Tu rol: Especificaciones visuales detalladas, decisiones de diseño, specs de componentes, plan de producción de assets visuales.
Tu output debe incluir: especificaciones exactas (colores, tipografía, spacing, animaciones), componentes afectados, handoff notes para el código, y cuando aplique: plan de producción de assets con Adobe.`,
    successRate: 0.94,
    avgMinutes: 8,
  },
  {
    id: 'agent-performance-specialist',
    name: 'Performance Specialist',
    emoji: '⚡',
    domains: ['performance', 'lighthouse', 'fcp', 'lcp', 'cls', 'ttfb', 'optimization', 'speed', 'bundle', 'caching', 'rápido', 'rápida', 'veloz', 'velocidad', 'optimizar'],
    keywords: ['rápido', 'rápida', 'velocidad', 'performance', 'lighthouse', 'fcp', 'lcp', 'optimiza', 'carga', 'bundle', 'cache', 'veloz', 'pesado', 'lento'],
    systemPrompt: `Eres el Performance Specialist de Desarrollo Integral.
MÉTRICAS ACTUALES: Lighthouse 78/100, FCP 2.1s, CTA click 4.2%, Mobile bounce 42%.
TARGETS: Lighthouse ≥ 95, FCP ≤ 0.8s, CTA click ≥ 8%, Mobile bounce ≤ 18%.
STACK: Next.js 16 + React 19 + Vercel deployment.

Tu rol: Restricciones de performance técnicas, plan de optimización, bottlenecks.
Tu output debe incluir: restricciones concretas (maxImageSize: 100kb above-fold, maxFonts: 3), plan específico (lazy loading, code splitting, WebP), métricas esperadas post-implementación.`,
    successRate: 0.91,
    avgMinutes: 6,
  },
  {
    id: 'agent-security-specialist',
    name: 'Security Specialist',
    emoji: '🔒',
    domains: ['security', 'vulnerabilities', 'headers', 'auth', 'rls', 'pii', 'compliance', 'audit', 'seguro', 'segura', 'seguridad', 'protección', 'privacidad'],
    keywords: ['seguro', 'segura', 'seguridad', 'vulnerabilidades', 'auth', 'pii', 'headers', 'compliance', 'auditoría', 'protege', 'privado', 'cifrado'],
    systemPrompt: `Eres el Security Specialist de Desarrollo Integral.
CONTEXTO: App Next.js con Supabase backend. Datos de clientes de fitness.
HEADERS REQUERIDOS: CSP, HSTS, X-Frame-Options, X-Content-Type-Options.
SUPABASE: RLS habilitado. Políticas de acceso por usuario autenticado.

Tu rol: Auditoría de seguridad, restricciones críticas, requisitos de compliance.
Tu output debe incluir: headers a implementar, vulnerabilidades detectadas (si las hay), restricciones para el equipo (VETO si es crítico), configuración next.config.ts.`,
    successRate: 0.96,
    avgMinutes: 5,
  },
  {
    id: 'agent-code-specialist',
    name: 'Code Specialist',
    emoji: '💻',
    domains: ['implementation', 'refactoring', 'testing', 'architecture', 'typescript', 'react', 'nextjs', 'api', 'código', 'implementar', 'rediseñar', 'mejorar'],
    keywords: ['implementa', 'código', 'refactoriza', 'tests', 'bug', 'error', 'build', 'deploy', 'component', 'api', 'rediseña', 'mejora', 'arregla', 'crea', 'actualiza'],
    systemPrompt: `Eres el Code Specialist de Desarrollo Integral.
STACK: Next.js 16.2.4, React 19.2.4, TypeScript strict, Tailwind 4, Framer Motion, GSAP.
RUTA DEL PROYECTO: C:\\Users\\lucas\\OneDrive\\Documentos\\Claude\\Projects\\App Desarrollo integral\\web.
REGLAS: No breaking changes. Tests requeridos para nuevos componentes. TypeScript strict mode.

Tu rol: Implementación técnica de los cambios, código TypeScript/React listo para usar.
Tu output debe incluir: código completo de componentes afectados, imports necesarios, notas de implementación.`,
    successRate: 0.97,
    avgMinutes: 12,
  },
  {
    id: 'agent-content-specialist',
    name: 'Content Specialist',
    emoji: '✍️',
    domains: ['copy', 'content', 'voice', 'brand-voice', 'seo', 'social', 'email', 'hook', 'cta'],
    keywords: ['copy', 'texto', 'contenido', 'mensaje', 'cta', 'hook', 'voz', 'marca', 'seo', 'social'],
    systemPrompt: `Eres el Content Specialist de Desarrollo Integral.
VOZ DE MARCA: Autoridad con calidez. Directo. Basado en datos. Sin rodeos.
TAGLINE: "El bienestar empieza con el movimiento".
AUDIENCIA: Atletas, personas con objetivos fitness, rehabilitación. Buenos Aires. Premium.
SEO: Local Buenos Aires. Keywords: entrenamiento personalizado, fisioterapia Belgrano, fitness premium.

Tu rol: Copy de CTAs, headlines, mensajes de la marca, microcopy de UI.
Tu output debe incluir: variantes de copy (3 opciones por pieza), justificación psicológica, SEO tags sugeridos.`,
    successRate: 0.89,
    avgMinutes: 5,
  },
  {
    id: 'agent-research-specialist',
    name: 'Research Specialist',
    emoji: '🔍',
    domains: ['research', 'competitive', 'market', 'user-research', 'data', 'insights', 'trends', 'seo', 'scraping', 'competitors', 'benchmark'],
    keywords: ['investiga', 'analiza', 'competencia', 'mercado', 'datos', 'tendencias', 'benchmark', 'comparación', 'seo', 'keywords', 'tráfico', 'rivales', 'busca', 'research'],
    systemPrompt: `Eres el Research Specialist de Desarrollo Integral.
CONTEXTO: Centro de entrenamiento 30 años de experiencia. Belgrano, Buenos Aires.
COMPETENCIA DIRECTA: Gyms premium porteños (CrossFit, Barry's, estudios boutique).
METODOLOGÍA DI: Evaluación → Planificación → Seguimiento (basado en datos, no suposiciones).

CAPACIDADES ADICIONALES (BrightData):
- competitive-intel: análisis automático de competidores (precios, servicios, copy, ofertas)
- seo-audit: auditoría SEO de cualquier URL (keywords, backlinks, Core Web Vitals)
- search: búsqueda web avanzada para tendencias de fitness en Argentina
- scraper-builder: construir scrapers para monitorear competencia automáticamente
- data-feeds: feeds de datos de la industria fitness/wellness en Latam

FUENTES PRIORITARIAS: Instagram de competidores, Google Maps reviews, Mercado Pago tendencias fitness BsAs.

Tu rol: Análisis, benchmark de competencia real (no teórico), insights de usuario, recomendaciones basadas en datos.
Tu output debe incluir: hallazgos clave con fuentes, benchmarks de competidores, recomendaciones accionables con datos concretos, plan de monitoreo continuo si aplica.`,
    successRate: 0.88,
    avgMinutes: 10,
  },
  {
    id: 'agent-media-specialist',
    name: 'Media Specialist',
    emoji: '🎥',
    domains: ['video', 'audio', 'images', 'generative', '3d', 'animation', 'assets'],
    keywords: ['video', 'imagen', 'media', 'asset', 'animación', '3d', 'audio', 'visual'],
    systemPrompt: `Eres el Media Specialist de Desarrollo Integral.
FORMATOS APROBADOS: WebM + MP4 (video), WebP + AVIF (imágenes).
LÍMITES: Video ≤ 5MB, imágenes above-fold ≤ 100kb.
ESTILO VISUAL: Dark premium. Gold #C8A96E. Movimiento y energía. Profesional.

Tu rol: Especificaciones de assets multimedia, optimización de media, plan de producción visual.
Tu output debe incluir: specs técnicas de media, estrategia de contenido visual, formatos y compresión recomendados.`,
    successRate: 0.85,
    avgMinutes: 10,
  },
  {
    id: 'agent-analytics-specialist',
    name: 'Analytics Specialist',
    emoji: '📊',
    domains: ['analytics', 'metrics', 'conversion', 'funnel', 'lighthouse', 'vercel', 'kpi', 'tracking', 'cro', 'heatmap', 'bounce', 'retention', 'datos', 'estadísticas'],
    keywords: ['analítica', 'métricas', 'conversión', 'funnel', 'bounce', 'retención', 'kpi', 'tráfico', 'usuarios', 'sesiones', 'cro', 'ab-test', 'heatmap', 'vercel', 'lighthouse', 'estadísticas', 'datos', 'dashboard'],
    systemPrompt: `Eres el Analytics Specialist de Desarrollo Integral.
MÉTRICAS ACTUALES (baseline registrado en Supabase):
  - Lighthouse Performance: 78/100 → target 95+
  - FCP (First Contentful Paint): 2.1s → target ≤ 0.8s
  - CTA Click Rate: 4.2% → target 8%+
  - Mobile Bounce Rate: 42% → target 18%

STACK DE ANALYTICS DISPONIBLE:
  - Vercel Analytics: métricas de performance (FCP, LCP, CLS, TTFB) por página y dispositivo
  - Vercel Speed Insights: Core Web Vitals en tiempo real
  - Supabase: tabla project_metrics con historial de KPIs
  - Google Search Console (si conectado): impresiones, CTR, posición promedio

CONTEXTO: Centro de entrenamiento premium. Las métricas más importantes son:
  1. CTA conversión (formulario de contacto) — ingreso directo
  2. Mobile bounce rate — audiencia urbana usa 80%+ mobile
  3. FCP/LCP — velocidad percibida = confianza = conversión

Tu rol: Interpretar métricas, detectar cuellos de botella en el funnel, proponer experimentos A/B, establecer KPIs por sección del sitio.
Tu output debe incluir: análisis de métricas actuales vs targets, hipótesis de qué está causando los gaps, experimentos concretos a implementar (con estimado de impacto %), métricas a monitorear post-cambio.`,
    successRate: 0.90,
    avgMinutes: 7,
  },
];

// ─── Función de Confidence Score ──────────────────────────────────────────────

function calculateConfidence(agent: AgentConfig, taskKeywords: string[]): number {
  const taskLower = taskKeywords.map((k) => k.toLowerCase());

  // Keyword matches — flexible: substring + raíz española (5 chars)
  const agentKeywordsLower = agent.keywords.map((k) => k.toLowerCase());
  const matches = taskLower.filter((tk) =>
    agentKeywordsLower.some((ak) => {
      if (ak.includes(tk) || tk.includes(ak)) return true;
      // Raíz: primeros 5 chars para manejar variaciones de género/número
      if (tk.length >= 5 && ak.length >= 5) {
        return ak.startsWith(tk.slice(0, 5)) || tk.startsWith(ak.slice(0, 5));
      }
      return false;
    })
  ).length;
  // Normalizar por el que dé mayor score
  const byTask  = matches / Math.max(taskLower.length, 1);
  const byAgent = matches / Math.max(agentKeywordsLower.length, 1);
  const keywordScore = Math.min(Math.max(byTask, byAgent), 1) * 0.5;

  // Domain detection
  const domainMatch = agent.domains.some((d) =>
    taskLower.some((tk) => tk.includes(d) || d.includes(tk))
  );
  const domainScore = domainMatch ? 0.35 : 0;

  // Historical success rate
  const successScore = agent.successRate * 0.15;

  return keywordScore + domainScore + successScore;
}

// ─── Función Principal: Coalición Paralela ────────────────────────────────────

export async function runParallelCoalition(
  taskDescription: string,
  options?: {
    apiKey?: string;
    model?: string;
    maxTokensPerAgent?: number;
    confidenceThreshold?: number;
    maxAgents?: number;
  }
): Promise<CoalitionResult> {
  const startTime = Date.now();
  const {
    apiKey = process.env.ANTHROPIC_API_KEY || '',
    model = process.env.COALITION_MODEL || 'claude-3-5-haiku-20241022',
    maxTokensPerAgent = 2048,
    confidenceThreshold = 0.55,
    maxAgents = 6,
  } = options ?? {};

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY no configurada. Agregar al .env.local.');
  }

  const client = new Anthropic({ apiKey });

  // FASE 1: Extraer keywords de la tarea
  const taskKeywords = taskDescription
    .toLowerCase()
    .split(/\s+|[,;.!?]/)
    .filter((w) => w.length > 3);

  // FASE 1b: Cargar success_rates dinámicos + ajustes de aprendizaje desde Supabase
  const defaultRates = Object.fromEntries(
    AGENT_REGISTRY.map((a) => [a.id, a.successRate])
  );
  let liveSuccessRates: Record<string, number> = defaultRates;
  let learningBoosts:    Record<string, number> = {};
  let learningPenalties: Record<string, number> = {};
  let learningSource = 'sin historial';

  try {
    const db = getSupabaseAgents();

    // Cargar rates actuales y ajustes de aprendizaje en paralelo
    const [rates, adjustments] = await Promise.all([
      db.getAgentSuccessRates(AGENT_REGISTRY.map((a) => a.id), defaultRates),
      db.getLearningAdjustments(taskKeywords.slice(0, 8)),
    ]);

    liveSuccessRates   = rates;
    learningBoosts     = adjustments.boosts;
    learningPenalties  = adjustments.penalties;
    learningSource     = adjustments.source;

    const boostCount   = Object.keys(learningBoosts).length;
    const penaltyCount = Object.keys(learningPenalties).length;
    if (boostCount > 0 || penaltyCount > 0) {
      console.log(`🧠 [Learning] ${learningSource}`);
      console.log(`   Boosts: ${boostCount} agentes | Penalties: ${penaltyCount} agentes`);
    } else {
      console.log(`[Coalition] Sin patrones previos — selección por confidence base`);
    }
  } catch {
    console.log(`[Coalition] Supabase no disponible — usando defaults`);
  }

  // FASE 2: Evaluar confidence de cada agente (con rates dinámicos + aprendizaje)
  const bids: AgentBid[] = AGENT_REGISTRY.map((agent) => {
    const liveRate   = liveSuccessRates[agent.id] ?? agent.successRate;
    const boost      = learningBoosts[agent.id]   ?? 0;
    const penalty    = learningPenalties[agent.id] ?? 0;

    const agentWithLiveRate = { ...agent, successRate: liveRate };
    const baseConfidence    = calculateConfidence(agentWithLiveRate, taskKeywords);
    // Aplicar ajuste de aprendizaje — clampeado a [0, 1]
    const confidence        = Math.min(Math.max(baseConfidence + boost - penalty, 0), 1);

    const learningNote = boost > 0
      ? ` (+${(boost * 100).toFixed(0)}% por historial exitoso)`
      : penalty > 0
      ? ` (-${(penalty * 100).toFixed(0)}% por historial bajo)`
      : '';

    return {
      agentId: agent.id,
      agentName: agent.name,
      confidence,
      canDo: agent.domains.slice(0, 3),
      reasoning: `Confidence ${(confidence * 100).toFixed(0)}% (base: ${(baseConfidence * 100).toFixed(0)}%, rate: ${(liveRate * 100).toFixed(0)}%${learningNote})`,
      willingToLead: confidence >= 0.80,
    };
  });

  // Regla especial: code SIEMPRE participa si hay 3+ agentes de diseño/content
  let selectedBids = bids.filter((b) => b.confidence >= confidenceThreshold);
  const designContentCount = selectedBids.filter((b) =>
    ['agent-design-specialist', 'agent-content-specialist', 'agent-media-specialist'].includes(b.agentId)
  ).length;

  const codeAgent = bids.find((b) => b.agentId === 'agent-code-specialist');
  const codeAlreadyIn = selectedBids.some((b) => b.agentId === 'agent-code-specialist');
  if (designContentCount >= 3 && !codeAlreadyIn && codeAgent) {
    selectedBids.push({ ...codeAgent, reasoning: codeAgent.reasoning + ' (forzado por regla: 3+ agentes design)' });
  }

  // Máximo 6 agentes por coalición (ordenar por confidence)
  selectedBids = selectedBids
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxAgents);

  // Fallback: si nadie supera el threshold, bajar a 0.50
  if (selectedBids.length === 0) {
    selectedBids = bids
      .filter((b) => b.confidence >= 0.50)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  if (selectedBids.length === 0) {
    throw new Error('No hay agentes disponibles para esta tarea. Verifica los keywords.');
  }

  // ── AGENTE PRIMARIO: Recolectar contexto real del proyecto ─────────────────
  console.log(`📁 [Context Collector] Recolectando contexto del proyecto...`);
  let projectContext: ProjectContext | null = null;
  try {
    projectContext = await collectProjectContext(taskDescription);
    console.log(`   ${projectContext.files.length} archivos leídos (${(projectContext.totalChars / 1000).toFixed(1)}k chars)`);
  } catch {
    console.warn(`   [Context Collector] No disponible — continuando sin contexto de archivos`);
  }

  const contextPrompt = projectContext ? formatContextForPrompt(projectContext) : '';

  // ── MODELO SELECTOR: Asignar modelo óptimo a cada agente ───────────────────
  const modelAssignments = selectModels(
    selectedBids.map((b) => b.agentId),
    taskDescription
  );
  console.log(`🧠 [Model Selector] ${Object.values(modelAssignments).filter(a => a.model.includes('sonnet')).length} Sonnet, ${Object.values(modelAssignments).filter(a => a.model.includes('haiku')).length} Haiku`);

  // ── DETECCIÓN DE MODO: ¿Una ronda o dos? ──────────────────────────────────
  // Dos rondas cuando: hay Code Specialist + al menos otro agente especialista
  // Ronda 1: análisis/specs (todos excepto Code)
  // Ronda 2: implementación (Code con outputs de Ronda 1)
  const hasCodeSpecialist = selectedBids.some((b) => b.agentId === 'agent-code-specialist');
  const analysisAgents    = selectedBids.filter((b) => b.agentId !== 'agent-code-specialist');
  const codeAgentBid      = selectedBids.find((b) => b.agentId === 'agent-code-specialist');
  const useTwoRounds      = hasCodeSpecialist && analysisAgents.length > 0;
  const roundCount        = useTwoRounds ? 2 : 1;

  console.log(`🚀 Modo: ${useTwoRounds ? '2 rondas (análisis → implementación)' : '1 ronda (paralelo directo)'}`);

  // Función auxiliar para ejecutar un agente NO-code con prompt caching
  const runAnalysisAgent = async (bid: AgentBid): Promise<AgentResult> => {
    const agentConfig    = AGENT_REGISTRY.find((a) => a.id === bid.agentId)!;
    const agentStartTime = Date.now();
    const agentModel     = modelAssignments[bid.agentId]?.model ?? model;

    try {
      const userPrompt = buildAgentPrompt(bid, taskDescription, selectedBids, contextPrompt);

      const response = await client.messages.create({
        model:      agentModel,
        max_tokens: maxTokensPerAgent,
        // Prompt caching del system prompt
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        system: [{ type: 'text', text: agentConfig.systemPrompt, cache_control: { type: 'ephemeral' } }] as any,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const content    = response.content[0];
      const outputText = content.type === 'text' ? content.text : '';

      return {
        agentId:     bid.agentId,
        agentName:   bid.agentName,
        emoji:       agentConfig.emoji,
        subtask:     agentConfig.domains[0],
        output:      outputText,
        executionMs: Date.now() - agentStartTime,
        tokensUsed:  response.usage.input_tokens + response.usage.output_tokens,
        success:     true,
      };
    } catch (error) {
      return {
        agentId:     bid.agentId,
        agentName:   bid.agentName,
        emoji:       agentConfig.emoji,
        subtask:     agentConfig.domains[0],
        output:      '',
        executionMs: Date.now() - agentStartTime,
        tokensUsed:  0,
        success:     false,
        error:       error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  };

  let results:             AgentResult[]            = [];
  let allFilesWritten:     FileWrite[]               = [];
  let conflictResolution:  ConflictResolution | null = null;

  if (useTwoRounds) {
    // ── RONDA 1: Agentes de análisis en paralelo ─────────────────────────────
    console.log(`🔵 Ronda 1: ${analysisAgents.length} agentes de análisis...`);
    const round1Results = await Promise.all(analysisAgents.map(runAnalysisAgent));
    console.log(`   Ronda 1 completada en ${Date.now() - startTime}ms`);

    // ── RONDA 1.5: Resolución de conflictos inter-agente ─────────────────────
    console.log(`🤝 Ronda 1.5: Resolviendo conflictos entre agentes...`);
    conflictResolution = await resolveInterAgentConflicts(
      client,
      taskDescription,
      round1Results,
      modelAssignments['agent-design-specialist']?.model ?? model, // Modelo para el árbitro
      undefined  // coalitionId aún no existe en este punto — se crea después de la ejecución
    );

    if (conflictResolution.hasConflicts) {
      console.log(`   ⚡ ${conflictResolution.conflicts.length} conflicto(s) resuelto(s)`);
      conflictResolution.conflicts.forEach((c) => console.log(`      - ${c}`));
    } else {
      console.log(`   ✅ Sin conflictos — specs consistentes`);
    }

    // ── RONDA 2: Code Specialist con specs reconciliadas ──────────────────────
    if (codeAgentBid) {
      console.log(`🟡 Ronda 2: Code Specialist con especificaciones${conflictResolution.hasConflicts ? ' reconciliadas' : ''}...`);
      const codeConfig     = AGENT_REGISTRY.find((a) => a.id === 'agent-code-specialist')!;
      const codeModel      = modelAssignments['agent-code-specialist']?.model ?? model;
      const codeStartTime  = Date.now();

      const codePrompt = buildCodeSpecialistPrompt(
        codeAgentBid,
        taskDescription,
        selectedBids,
        contextPrompt,
        // Usar specs reconciliadas en lugar del dump crudo de Ronda 1
        conflictResolution.resolvedSpecs
      );

      try {
        const { output, writtenFiles, tokensUsed } = await runCodeSpecialistWithTools(
          client,
          codeModel,
          codeConfig.systemPrompt,
          codePrompt,
          maxTokensPerAgent * 3 // Code Specialist tiene más tokens
        );

        allFilesWritten = writtenFiles;

        round1Results.push({
          agentId:     'agent-code-specialist',
          agentName:   'Code Specialist',
          emoji:       '💻',
          subtask:     'implementation',
          output:      output + (writtenFiles.length > 0
            ? `\n\n✅ **${writtenFiles.length} archivo(s) escritos directamente**:\n${writtenFiles.map((f) => `- \`${f.path}\`: ${f.description}`).join('\n')}`
            : ''),
          executionMs: Date.now() - codeStartTime,
          tokensUsed,
          success:     true,
        });
      } catch (err) {
        round1Results.push({
          agentId:     'agent-code-specialist',
          agentName:   'Code Specialist',
          emoji:       '💻',
          subtask:     'implementation',
          output:      '',
          executionMs: Date.now() - codeStartTime,
          tokensUsed:  0,
          success:     false,
          error:       err instanceof Error ? err.message : 'Error en Code Specialist',
        });
      }
    }

    results = round1Results;

  } else {
    // ── RONDA ÚNICA: todos en paralelo (sin Code Specialist o solo Code) ─────
    console.log(`🚀 Ejecutando ${selectedBids.length} agentes en paralelo...`);

    if (hasCodeSpecialist && codeAgentBid) {
      // Solo Code Specialist → usar tool_use
      const codeConfig    = AGENT_REGISTRY.find((a) => a.id === 'agent-code-specialist')!;
      const codeModel     = modelAssignments['agent-code-specialist']?.model ?? model;
      const codeStartTime = Date.now();
      const codePrompt    = buildAgentPrompt(codeAgentBid, taskDescription, selectedBids, contextPrompt);

      try {
        const { output, writtenFiles, tokensUsed } = await runCodeSpecialistWithTools(
          client, codeModel, codeConfig.systemPrompt, codePrompt, maxTokensPerAgent * 3
        );
        allFilesWritten = writtenFiles;
        results = [{
          agentId:     'agent-code-specialist',
          agentName:   'Code Specialist',
          emoji:       '💻',
          subtask:     'implementation',
          output:      output + (writtenFiles.length > 0
            ? `\n\n✅ **${writtenFiles.length} archivo(s) escritos**:\n${writtenFiles.map((f) => `- \`${f.path}\`: ${f.description}`).join('\n')}`
            : ''),
          executionMs: Date.now() - codeStartTime,
          tokensUsed,
          success:     true,
        }];
      } catch (err) {
        results = [{
          agentId: 'agent-code-specialist', agentName: 'Code Specialist', emoji: '💻',
          subtask: 'implementation', output: '', executionMs: Date.now() - codeStartTime,
          tokensUsed: 0, success: false, error: err instanceof Error ? err.message : 'Error',
        }];
      }

      // Los demás agentes si los hay
      const others = await Promise.all(
        selectedBids.filter((b) => b.agentId !== 'agent-code-specialist').map(runAnalysisAgent)
      );
      results = [...results, ...others];

    } else {
      results = await Promise.all(selectedBids.map(runAnalysisAgent));
    }
  }

  console.log(`✅ Todos completados en ${Date.now() - startTime}ms`);

  // Persistir en Supabase (silencioso — no bloquea si falla)
  let coalitionId: string | undefined;
  try {
    const db = getSupabaseAgents();
    coalitionId = await db.createCoalition({
      task_description: taskDescription,
      task_keywords: taskKeywords.slice(0, 10),
      agents_invited: AGENT_REGISTRY.map((a) => a.id),
      agents_selected: selectedBids.map((b) => b.agentId),
      agent_confidence_scores: Object.fromEntries(
        selectedBids.map((b) => [b.agentId, b.confidence])
      ),
    });
    await db.logEvent({
      event_type: 'coalition_started',
      level: 4,
      coalition_id: coalitionId,
      description: `Coalición paralela: ${selectedBids.length} agentes para "${taskDescription.slice(0, 60)}"`,
    });
  } catch {
    // Supabase no disponible — continuar con JSON fallback
  }

  // FASE 5: Peer-Evaluation real — agentes evalúan a sus pares con Claude
  console.log(`🔍 Peer evaluation (${results.filter((r) => r.success).length} agentes exitosos)...`);
  const peerScores = await runPeerEvaluation(client, taskDescription, results);

  const totalPossible = results.length * 25;
  const totalReceived = Object.values(peerScores).reduce((a, b) => a + b, 0);
  let collectiveScore = Math.round((totalReceived / totalPossible) * 100);
  let iterations = 1;

  // ── AUTO-ITERACIÓN: Re-ejecutar el agente con peor score si score colectivo < 75 ──
  if (collectiveScore < 75 && results.length > 1) {
    console.log(`⚠️  Score colectivo ${collectiveScore}/100 < 75 — auto-iteración activada`);

    // Encontrar el agente con peor score (que no sea Code Specialist para no re-ejecutar tools)
    // IMPORTANTE: los agentes fallidos (success=false, score=0) tienen prioridad sobre los exitosos
    const worstAgentResult = results
      .filter((r) => r.agentId !== 'agent-code-specialist')
      .sort((a, b) => {
        // Agentes fallidos siempre van primero (score efectivo -1)
        const scoreA = a.success ? (peerScores[a.agentId] ?? 0) : -1;
        const scoreB = b.success ? (peerScores[b.agentId] ?? 0) : -1;
        return scoreA - scoreB;
      })[0];

    if (worstAgentResult) {
      const worstBid = selectedBids.find((b) => b.agentId === worstAgentResult.agentId);
      console.log(`   Re-ejecutando: ${worstAgentResult.agentName} (score: ${peerScores[worstAgentResult.agentId]}/25)`);

      if (worstBid) {
        iterations = 2;
        const retryResult = await runAnalysisAgent(worstBid);

        // Reemplazar el resultado anterior por el nuevo
        const idx = results.findIndex((r) => r.agentId === worstAgentResult.agentId);
        if (idx >= 0) results[idx] = retryResult;

        // Re-evaluar solo el agente re-ejecutado (Haiku, rápido)
        if (retryResult.success) {
          const retryScores = await runPeerEvaluation(client, taskDescription, [retryResult]);
          peerScores[retryResult.agentId] = retryScores[retryResult.agentId] ?? 0;
        } else {
          peerScores[worstAgentResult.agentId] = 0;
        }

        const newTotal  = Object.values(peerScores).reduce((a, b) => a + b, 0);
        collectiveScore = Math.round((newTotal / totalPossible) * 100);
        console.log(`   Score tras iteración: ${collectiveScore}/100`);
      }
    }
  }

  // Generar patrón para aprendizaje
  const taskType = inferTaskType(taskKeywords);
  const learning = generateLearning(results, collectiveScore, taskDescription);

  // Guardar patrón y resultado en Supabase (silencioso)
  try {
    const db = getSupabaseAgents();
    await db.savePattern({
      task_type: taskType,
      keywords: taskKeywords.slice(0, 10),
      agents_used: selectedBids.map((b) => b.agentId),
      score: collectiveScore,
      time_minutes: Math.ceil((Date.now() - startTime) / 60000),
      learning,
      was_successful: collectiveScore >= 75,
      iteration_count: iterations,
    });

    if (coalitionId) {
      await db.updateCoalition(coalitionId, {
        final_score: collectiveScore,
        peer_scores: peerScores,
        outcome: collectiveScore >= 75 ? 'success' : 'escalated',
        duration_minutes: Math.ceil((Date.now() - startTime) / 60000),
      });
    }

    // Actualizar success_rate de cada agente participante
    await Promise.allSettled(
      results.map((r) => db.updateAgentSuccessRate(r.agentId, r.success))
    );
  } catch {
    // Supabase no disponible — continuar sin persistencia
  }

  return {
    taskDescription,
    selectedAgents:   selectedBids,
    results,
    peerScores,
    collectiveScore,
    totalExecutionMs: Date.now() - startTime,
    totalTokensUsed:  results.reduce((sum, r) => sum + r.tokensUsed, 0),
    iterations,
    // Nuevos campos
    contextUsed:      projectContext,
    modelAssignments,
    filesToWrite:     allFilesWritten,
    roundCount,
    conflicts:        conflictResolution?.conflicts ?? [],
    learningApplied:  learningSource,
    pattern: {
      taskType,
      keywords: taskKeywords.slice(0, 10),
      agentsUsed: selectedBids.map((b) => b.agentId),
      learning,
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAgentPrompt(
  bid: AgentBid,
  task: string,
  allSelected: AgentBid[],
  contextPrompt: string = ''
): string {
  const teammates = allSelected
    .filter((b) => b.agentId !== bid.agentId)
    .map((b) => `- ${b.agentName} (confidence: ${(b.confidence * 100).toFixed(0)}%)`)
    .join('\n');

  return `TAREA DE LA COALICIÓN: "${task}"

TU COALICIÓN HOY:
${teammates}

TU ROL EN ESTA TAREA:
Eres el experto en ${bid.canDo.join(', ')}.
Confidence de que puedes contribuir: ${(bid.confidence * 100).toFixed(0)}%.

INSTRUCCIÓN:
Analiza la tarea y entrega TU CONTRIBUCIÓN ESPECÍFICA basada en tu dominio de expertise.
Sé concreto, técnico y accionable. No seas vago.
Incluye especificaciones que el Code Specialist pueda implementar directamente.

FORMATO DE RESPUESTA:
## Análisis
[Tu análisis de la tarea desde tu perspectiva]

## Contribución
[Especificaciones concretas / plan / código / restricciones que aportas]

## Handoff
[Qué necesitan los otros agentes de ti para continuar]
${contextPrompt ? `\n${contextPrompt}` : ''}`;
}

function buildCodeSpecialistPrompt(
  bid: AgentBid,
  task: string,
  allSelected: AgentBid[],
  contextPrompt: string,
  round1Summary: string
): string {
  const teammates = allSelected
    .filter((b) => b.agentId !== bid.agentId)
    .map((b) => `- ${b.agentName}`)
    .join('\n');

  return `TAREA DE LA COALICIÓN: "${task}"

TU COALICIÓN HOY:
${teammates}

═══ OUTPUTS DE RONDA 1 — ESPECIFICACIONES DE TUS COLEGAS ═══

${round1Summary}

═══ FIN RONDA 1 ═══

INSTRUCCIÓN PARA EL CODE SPECIALIST:
Tienes las especificaciones completas de Design, Performance, Security y otros agentes.
AHORA IMPLEMENTA LOS CAMBIOS REALES en el proyecto usando tus herramientas (read_file, write_file).

PROCESO:
1. Usa read_file para leer los archivos que vas a modificar
2. Analiza el código existente junto con las specs de Ronda 1
3. Escribe el código actualizado con write_file (archivo completo, no fragmentos)
4. Usa run_build_check para verificar que no hay errores TypeScript
5. Resume qué cambios implementaste y por qué

REGLAS:
- Implementa TODOS los cambios solicitados por los agentes de Ronda 1
- No rompas código existente (leer antes de escribir)
- TypeScript strict: tipar todo correctamente
- No generes solo sugerencias — EJECUTA los cambios reales
${contextPrompt ? `\n${contextPrompt}` : ''}`;
}

// ─── Peer Evaluation real ─────────────────────────────────────────────────────
//
// Cada agente evalúa el output de uno o dos compañeros.
// Usa Claude Haiku (rápido y barato) en paralelo.
//
// Lógica de asignación:
//   Security  → evalúa Code (¿el código tiene vulnerabilidades?)
//   Performance → evalúa Code (¿la implementación es eficiente?)
//   Performance → evalúa Design (¿las animaciones impactan performance?)
//   Design    → evalúa Content (¿el copy es consistente con la marca visual?)
//   Analytics → evalúa Performance (¿las optimizaciones atacan los KPIs correctos?)
//   Research  → evalúa Content (¿el posicionamiento es preciso según datos?)
//
// Si el evaluador no está en la coalición → fallback a score heurístico.

const PEER_ASSIGNMENTS: Record<string, string[]> = {
  'agent-security-specialist':    ['agent-code-specialist'],
  'agent-performance-specialist': ['agent-code-specialist', 'agent-design-specialist'],
  'agent-design-specialist':      ['agent-content-specialist'],
  'agent-analytics-specialist':   ['agent-performance-specialist'],
  'agent-research-specialist':    ['agent-content-specialist'],
};

async function runPeerEvaluation(
  client:  Anthropic,
  task:    string,
  results: AgentResult[]
): Promise<Record<string, number>> {
  const scores: Record<string, number> = {};

  // Scores heurísticos de fallback para todos
  for (const r of results) {
    if (!r.success) {
      scores[r.agentId] = 0;
      continue;
    }
    const cfg   = AGENT_REGISTRY.find((a) => a.id === r.agentId);
    const base  = 17;
    const bonus = r.output.length > 500 ? 4 : r.output.length > 200 ? 2 : 0;
    const rate  = cfg ? Math.floor(cfg.successRate * 3) : 0;
    scores[r.agentId] = Math.min(base + bonus + rate, 25);
  }

  // Construir pares (evaluador, target) solo si ambos están en results
  const successfulIds = new Set(results.filter((r) => r.success).map((r) => r.agentId));

  const evalPairs: { evaluatorId: string; targetId: string }[] = [];
  for (const [evaluatorId, targetIds] of Object.entries(PEER_ASSIGNMENTS)) {
    if (!successfulIds.has(evaluatorId)) continue;
    for (const targetId of targetIds) {
      if (successfulIds.has(targetId)) {
        evalPairs.push({ evaluatorId, targetId });
      }
    }
  }

  if (evalPairs.length === 0) return scores; // Sin pares → devolver fallback

  // Ejecutar evaluaciones en paralelo (Haiku — 150 tokens cada una)
  const evalResults = await Promise.allSettled(
    evalPairs.map(async ({ evaluatorId, targetId }) => {
      const evaluator = AGENT_REGISTRY.find((a) => a.id === evaluatorId)!;
      const target    = results.find((r) => r.agentId === targetId)!;

      // Usar el modelo activo del entorno (mismo que el sistema usa globalmente)
      const evalModel = process.env.COALITION_MODEL || 'claude-3-5-haiku-20241022';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await (client.messages.create as any)({
        model:      evalModel,
        max_tokens: 80,
        system:     [{
          type: 'text',
          text: `Eres ${evaluator.name}. Evaluás el trabajo de un colega. Tu respuesta debe empezar OBLIGATORIAMENTE con el número del puntaje (0-25), seguido de dos puntos y la justificación. Ejemplo: "21: el análisis es técnicamente sólido y cubre los puntos críticos"`,
          cache_control: { type: 'ephemeral' },
        }],
        messages: [{
          role: 'user',
          content: `TAREA: "${task.slice(0, 100)}"
OUTPUT DE ${target.agentName}: ${target.output.slice(0, 400)}
Puntaje (0-25) desde tu perspectiva de ${evaluator.domains[0]}:`,
        }],
      });

      const text = (response.content[0]?.text as string) ?? '';
      // Regex robusto: acepta "21:", "SCORE: 21", "Score: 21", o simplemente "21" al inicio
      const match =
        text.match(/^(\d{1,2})\s*[:–-]/) ??     // "21: razón" o "21 - razón"
        text.match(/score[:\s]+(\d{1,2})/i) ??   // "SCORE: 21"
        text.match(/puntaje[:\s]+(\d{1,2})/i) ??  // "Puntaje: 21"
        text.match(/(\d{1,2})\s*\/\s*25/) ??      // "21/25"
        text.match(/\b(\d{1,2})\b/);              // cualquier número 0-25 como fallback
      const score = match ? Math.min(Math.max(parseInt(match[1], 10), 0), 25) : null;

      return { targetId, score, evaluatorId };
    })
  );

  // Promediar los scores reales con los heurísticos para los agentes evaluados
  const realScoresByTarget: Record<string, number[]> = {};
  for (const res of evalResults) {
    if (res.status === 'fulfilled' && res.value.score !== null) {
      const { targetId, score } = res.value;
      if (!realScoresByTarget[targetId]) realScoresByTarget[targetId] = [];
      realScoresByTarget[targetId].push(score);
    }
  }

  // Si un agente recibió evaluaciones reales, promediarlas (peso 70% real, 30% heurístico)
  for (const [targetId, realScores] of Object.entries(realScoresByTarget)) {
    const avgReal      = realScores.reduce((a, b) => a + b, 0) / realScores.length;
    const heuristic    = scores[targetId] ?? 18;
    scores[targetId]   = Math.round(avgReal * 0.70 + heuristic * 0.30);
  }

  const evalCount = Object.values(realScoresByTarget).flat().length;
  console.log(`   Peer eval: ${evalCount} evaluaciones reales de ${evalPairs.length} pares`);

  return scores;
}

// ─── Resolución de conflictos inter-agente ────────────────────────────────────
//
// Se ejecuta entre Ronda 1 y Ronda 2. Detecta contradicciones entre los
// outputs de los agentes de análisis (ej: Design dice "usa 600ms transitions",
// Performance dice "máximo 300ms") y genera especificaciones reconciliadas
// que el Code Specialist puede implementar sin ambigüedad.
//
// Usa message_bus de Supabase para dejar registro de los conflictos detectados.

export interface ConflictResolution {
  hasConflicts:      boolean;
  conflicts:         string[];          // descripción de cada conflicto detectado
  resolvedSpecs:     string;            // especificaciones reconciliadas para Code
  tokensUsed:        number;
}

export async function resolveInterAgentConflicts(
  client:        Anthropic,
  task:          string,
  round1Results: AgentResult[],
  model:         string,
  coalitionId?:  string
): Promise<ConflictResolution> {
  const successful = round1Results.filter((r) => r.success && r.output.length > 100);

  // Si hay 1 o menos agentes exitosos, no hay conflictos posibles
  if (successful.length <= 1) {
    return {
      hasConflicts:  false,
      conflicts:     [],
      resolvedSpecs: successful[0]?.output ?? '',
      tokensUsed:    0,
    };
  }

  const outputsSummary = successful
    .map((r) => `### ${r.emoji} ${r.agentName}\n${r.output.slice(0, 800)}`)
    .join('\n\n---\n\n');

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await (client.messages.create as any)({
      model,
      max_tokens: 1200,
      system: [{
        type: 'text',
        text: `Eres un árbitro técnico. Tu trabajo es detectar contradicciones entre las especificaciones de diferentes especialistas y resolverlas en un set de specs unificado que no tenga ambigüedades.

REGLAS PARA RESOLVER CONFLICTOS:
- Performance SIEMPRE gana sobre Design cuando hay contradicción (velocidad primero)
- Security SIEMPRE gana sobre cualquier otro agente (sin excepciones)
- En otros conflictos: priorizar la especificación más restrictiva
- Si no hay conflicto real (distintos aspectos del mismo tema), unificar sin cambiar nada`,
        cache_control: { type: 'ephemeral' },
      }],
      messages: [{
        role: 'user',
        content: `TAREA: "${task}"

OUTPUTS DE LOS ESPECIALISTAS:

${outputsSummary}

INSTRUCCIÓN:
1. Identifica contradicciones reales entre las specs (no diferencias de enfoque, sino specs que se excluyen mutuamente)
2. Resuelve cada conflicto aplicando las reglas de prioridad
3. Genera las "Especificaciones Reconciliadas": un documento único sin contradicciones que el Code Specialist puede implementar directamente

FORMATO DE RESPUESTA:
## Conflictos detectados
[lista de conflictos, o "Ninguno detectado"]

## Especificaciones Reconciliadas
[specs unificadas, incluyendo todas las contribuciones sin contradicción]`,
      }],
    });

    const content   = (response.content[0]?.text as string) ?? '';
    const tokens    = (response.usage.input_tokens as number) + (response.usage.output_tokens as number);

    // Detectar si hubo conflictos reales
    const conflictSection  = content.match(/## Conflictos detectados\n([\s\S]*?)(?=##|$)/)?.[1]?.trim() ?? '';
    const hasConflicts     = !conflictSection.toLowerCase().includes('ninguno');
    const conflictLines    = hasConflicts
      ? conflictSection.split('\n').filter((l) => l.trim().startsWith('-') || l.trim().match(/^\d+\./)).map((l) => l.trim())
      : [];

    const resolvedSection  = content.match(/## Especificaciones Reconciliadas\n([\s\S]*)/)?.[1]?.trim() ?? content;

    // Guardar en message_bus de Supabase si hay conflictos
    if (hasConflicts && coalitionId) {
      try {
        const db = getSupabaseAgents();
        await db.logEvent({
          event_type:   'inter_agent_conflicts',
          level:        3,
          coalition_id: coalitionId,
          description:  `${conflictLines.length} conflicto(s) detectado(s) y resuelto(s)`,
          metadata:     { conflicts: conflictLines, task: task.slice(0, 100) },
        });
      } catch { /* Supabase no crítico */ }
    }

    return {
      hasConflicts,
      conflicts:     conflictLines,
      resolvedSpecs: resolvedSection,
      tokensUsed:    tokens,
    };
  } catch {
    // Si la resolución falla, pasar los outputs originales sin modificar
    const fallbackSpecs = successful
      .map((r) => `=== ${r.agentName} ===\n${r.output}`)
      .join('\n\n');
    return {
      hasConflicts:  false,
      conflicts:     [],
      resolvedSpecs: fallbackSpecs,
      tokensUsed:    0,
    };
  }
}

function inferTaskType(keywords: string[]): string {
  const types: Record<string, string[]> = {
    'navbar-redesign': ['navbar', 'nav', 'navegación', 'menú'],
    'landing-full': ['landing', 'hero', 'página', 'home'],
    'performance-optimization': ['performance', 'velocidad', 'rápido', 'lighthouse'],
    'security-audit': ['seguridad', 'headers', 'vulnerabilidades'],
    'ui-component': ['componente', 'diseño', 'visual', 'ui'],
    'content-strategy': ['copy', 'contenido', 'texto', 'mensaje'],
    'analytics-review': ['analítica', 'métricas', 'conversión', 'funnel', 'bounce', 'kpi', 'tráfico', 'datos'],
    'competitive-research': ['competencia', 'benchmark', 'mercado', 'rivales', 'seo'],
    'media-production': ['video', 'imagen', 'foto', 'banner', 'social', 'asset'],
  };

  for (const [type, typeKeywords] of Object.entries(types)) {
    if (keywords.some((k) => typeKeywords.includes(k))) {
      return type;
    }
  }
  return 'general-task';
}

function generateLearning(results: AgentResult[], score: number, task: string): string {
  const successfulAgents = results.filter((r) => r.success).map((r) => r.agentName);
  const quality = score >= 85 ? 'excelente' : score >= 75 ? 'buena' : 'mejorable';

  return `Para "${task.slice(0, 50)}...": ${successfulAgents.join(' + ')} dieron resultado ${quality} (${score}/100). Tiempo paralelo ${Math.round(results[0]?.executionMs / 1000 || 0)}s.`;
}

// ─── Función de Display para el Terminal/UI ────────────────────────────────────

export function formatCoalitionResult(result: CoalitionResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('⚡ COALICIÓN PARALELA — COMPLETADO');
  lines.push('═'.repeat(50));
  lines.push('');
  lines.push(`📋 TAREA: ${result.taskDescription}`);
  lines.push(`⏱️  Tiempo total: ${(result.totalExecutionMs / 1000).toFixed(1)}s`);
  lines.push(`🔢 Tokens usados: ${result.totalTokensUsed.toLocaleString()}`);
  lines.push(`📊 Score colectivo: ${result.collectiveScore}/100`);
  lines.push(`🔁 Iteraciones: ${result.iterations}`);
  lines.push('');
  lines.push('🤝 AGENTES EN COALICIÓN:');

  for (const agent of result.selectedAgents) {
    const agentResult = result.results.find((r) => r.agentId === agent.agentId);
    const score = result.peerScores[agent.agentId] || 0;
    const status = agentResult?.success ? '✅' : '❌';
    const config = AGENT_REGISTRY.find((a) => a.id === agent.agentId);
    lines.push(
      `  ${config?.emoji || '🤖'} ${agent.agentName.padEnd(28)} confidence: ${(agent.confidence * 100).toFixed(0)}%  score: ${score}/25  ${status}`
    );
  }

  lines.push('');
  lines.push('📚 APRENDIZAJE GUARDADO:');
  lines.push(`  Tipo: ${result.pattern.taskType}`);
  lines.push(`  ${result.pattern.learning}`);
  lines.push('');

  return lines.join('\n');
}

// ─── Export del API Route handler (Next.js) ────────────────────────────────────

export type { CoalitionResult as ParallelCoalitionResult };
