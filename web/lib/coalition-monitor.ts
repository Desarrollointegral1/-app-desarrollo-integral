/**
 * ============================================================
 * COALITION MONITOR — Agente Primario de Monitoreo
 * ============================================================
 *
 * Se invoca desde /api/coalition/monitor (GET).
 * Analiza el historial de coaliciones en Supabase y detecta:
 *
 *   1. Agentes en declive   — success_rate cayendo consistentemente
 *   2. Agentes estrella     — rendimiento mejorando
 *   3. Tareas problemáticas — tipos de tarea con score < 70 recurrente
 *   4. Salud del sistema    — ratio de coaliciones exitosas
 *   5. Recomendaciones      — acciones concretas para mejorar
 *
 * NO es autónomo — Lucas lo invoca cuando quiere el diagnóstico.
 * Futuro: puede ejecutarse en background con un cron.
 * ============================================================
 */

import { getSupabaseAgents } from './supabase-agents';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AgentHealth {
  agentId:      string;
  agentName:    string;
  emoji:        string;
  successRate:  number;        // Rate actual en Supabase
  trend:        'up' | 'down' | 'stable';
  recentScores: number[];      // Últimos scores de peer eval (de learning_patterns)
  avgScore:     number;        // Promedio de los últimos scores
  alert:        boolean;       // true si hay algo preocupante
  alertMsg:     string;
}

export interface TaskTypeHealth {
  taskType:       string;
  avgScore:       number;
  totalRuns:      number;
  successRuns:    number;
  successRatio:   number;
  commonAgents:   string[];
  recommendation: string;
}

export interface SystemHealthReport {
  generatedAt:        string;
  windowDays:         number;
  totalCoalitions:    number;
  successfulRate:     number;      // % coaliciones con score ≥ 75
  avgCollectiveScore: number;
  agentHealth:        AgentHealth[];
  taskTypeHealth:     TaskTypeHealth[];
  topIssues:          string[];    // Lista priorizada de problemas
  recommendations:    string[];    // Acciones concretas
  systemStatus:       'healthy' | 'warning' | 'critical';
}

// ─── Tipo interno para filas de learning_patterns ────────────────────────────

interface PatternRow {
  task_type:    string;
  agents_used:  string[];
  score:        number;
  was_successful?: boolean;
  created_at?:  string;
}

// ─── Mapa de nombres/emojis ───────────────────────────────────────────────────

const AGENT_META: Record<string, { name: string; emoji: string }> = {
  'agent-design-specialist':      { name: 'Design Specialist',      emoji: '🎨' },
  'agent-performance-specialist': { name: 'Performance Specialist',  emoji: '⚡' },
  'agent-security-specialist':    { name: 'Security Specialist',     emoji: '🔒' },
  'agent-code-specialist':        { name: 'Code Specialist',         emoji: '💻' },
  'agent-content-specialist':     { name: 'Content Specialist',      emoji: '✍️' },
  'agent-research-specialist':    { name: 'Research Specialist',     emoji: '🔍' },
  'agent-media-specialist':       { name: 'Media Specialist',        emoji: '🎥' },
  'agent-analytics-specialist':   { name: 'Analytics Specialist',    emoji: '📊' },
};

// ─── Función principal ────────────────────────────────────────────────────────

export async function runCoalitionMonitor(
  windowDays = 30
): Promise<SystemHealthReport> {
  const db  = getSupabaseAgents();
  const now = new Date().toISOString();

  // ── 1. Leer datos base ──────────────────────────────────────────────────────
  const [agentRows, patternRows] = await Promise.all([
    db.getAgents(),
    // Leer los últimos patrones directamente por Supabase client
    fetchRecentPatterns(windowDays),
  ]);

  // ── 2. Salud por agente ─────────────────────────────────────────────────────
  const agentHealth: AgentHealth[] = Object.entries(AGENT_META).map(([agentId, meta]) => {
    const row = agentRows.find((r) => r.id === agentId);

    // Patrones donde participó este agente
    const agentPatterns = patternRows.filter(
      (p) => Array.isArray(p.agents_used) && (p.agents_used as string[]).includes(agentId)
    );

    const recentScores: number[] = agentPatterns
      .map((p) => p.score)
      .filter((s): s is number => typeof s === 'number')
      .slice(-10);

    const avgScore = recentScores.length > 0
      ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length)
      : 0;

    const successRate  = row?.success_rate ?? 0.85;
    const totalTasks   = row?.total_tasks ?? 0;
    const successTasks = row?.successful_tasks ?? 0;

    // Detectar tendencia: comparar primera mitad vs segunda mitad de scores recientes
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentScores.length >= 4) {
      const mid    = Math.floor(recentScores.length / 2);
      const first  = recentScores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
      const second = recentScores.slice(mid).reduce((a, b) => a + b, 0) / (recentScores.length - mid);
      if (second - first > 5) trend = 'up';
      else if (first - second > 5) trend = 'down';
    }

    // Detectar alertas
    let alert    = false;
    let alertMsg = '';

    if (successRate < 0.75) {
      alert    = true;
      alertMsg = `Success rate bajo: ${(successRate * 100).toFixed(0)}% (${successTasks}/${totalTasks})`;
    } else if (trend === 'down' && avgScore < 70) {
      alert    = true;
      alertMsg = `Tendencia a la baja — avg score ${avgScore}/100`;
    } else if (recentScores.length === 0 && totalTasks === 0) {
      alertMsg = 'Sin actividad registrada aún';
    }

    return {
      agentId,
      agentName:   meta.name,
      emoji:       meta.emoji,
      successRate,
      trend,
      recentScores,
      avgScore,
      alert,
      alertMsg,
    };
  });

  // ── 3. Salud por tipo de tarea ──────────────────────────────────────────────
  const taskTypeMap: Record<string, { scores: number[]; agents: string[][] }> = {};

  for (const p of patternRows) {
    const tt = (p.task_type as string) ?? 'general-task';
    if (!taskTypeMap[tt]) taskTypeMap[tt] = { scores: [], agents: [] };
    if (typeof p.score === 'number') taskTypeMap[tt].scores.push(p.score);
    if (Array.isArray(p.agents_used))  taskTypeMap[tt].agents.push(p.agents_used as string[]);
  }

  const taskTypeHealth: TaskTypeHealth[] = Object.entries(taskTypeMap).map(([taskType, data]) => {
    const avgScore     = data.scores.length > 0
      ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
      : 0;
    const successRuns  = data.scores.filter((s) => s >= 75).length;
    const totalRuns    = data.scores.length;
    const successRatio = totalRuns > 0 ? successRuns / totalRuns : 0;

    // Agentes más frecuentes en este tipo de tarea
    const agentFreq: Record<string, number> = {};
    for (const agentList of data.agents) {
      for (const agentId of agentList) {
        agentFreq[agentId] = (agentFreq[agentId] ?? 0) + 1;
      }
    }
    const commonAgents = Object.entries(agentFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => AGENT_META[id]?.name ?? id);

    let recommendation = '';
    if (avgScore < 65) {
      recommendation = `Revisar agentes seleccionados — score promedio ${avgScore}/100 es preocupante`;
    } else if (avgScore < 75) {
      recommendation = `Score ${avgScore}/100 mejorable — considerar aumentar threshold de confianza`;
    } else {
      recommendation = `Funcionando bien (${avgScore}/100) — mantener configuración actual`;
    }

    return { taskType, avgScore, totalRuns, successRuns, successRatio, commonAgents, recommendation };
  });

  // ── 4. Métricas globales ────────────────────────────────────────────────────
  const allScores: number[] = patternRows.map((p) => p.score).filter((s): s is number => typeof s === 'number');
  const totalCoalitions  = allScores.length;
  const successfulCount  = allScores.filter((s) => s >= 75).length;
  const successfulRate   = totalCoalitions > 0 ? successfulCount / totalCoalitions : 0;
  const avgCollectiveScore = totalCoalitions > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / totalCoalitions)
    : 0;

  // ── 5. Issues y recomendaciones ─────────────────────────────────────────────
  const topIssues: string[] = [];
  const recommendations: string[] = [];

  // Issues por agente
  for (const ah of agentHealth.filter((a) => a.alert)) {
    topIssues.push(`${ah.emoji} ${ah.agentName}: ${ah.alertMsg}`);
    if (ah.successRate < 0.75) {
      recommendations.push(`Revisar ${ah.agentName} — si sus outputs son pobres, considerar ajustar su system prompt o reducir su threshold de confidence`);
    }
  }

  // Issues por tipo de tarea
  for (const tt of taskTypeHealth.filter((t) => t.avgScore < 70 && t.totalRuns >= 3)) {
    topIssues.push(`Tarea "${tt.taskType}": avg ${tt.avgScore}/100 en ${tt.totalRuns} ejecuciones`);
    recommendations.push(`Para tareas "${tt.taskType}": probar con ${tt.commonAgents[0]} como agente principal y revisar el threshold`);
  }

  // Issue global
  if (successfulRate < 0.70) {
    topIssues.push(`⚠️ Solo ${(successfulRate * 100).toFixed(0)}% de coaliciones con score ≥ 75 — sistema bajo rendimiento global`);
    recommendations.push('Revisar el confidenceThreshold (actualmente 0.55) — bajarlo puede incorporar agentes poco preparados');
  }

  if (topIssues.length === 0) {
    topIssues.push('✅ Sin problemas detectados en la ventana analizada');
  }
  if (recommendations.length === 0) {
    recommendations.push('Sistema funcionando dentro de parámetros normales — continuar monitoreando');
  }

  // ── 6. Status global ────────────────────────────────────────────────────────
  const alertCount    = agentHealth.filter((a) => a.alert).length;
  const systemStatus: 'healthy' | 'warning' | 'critical' =
    alertCount >= 3 || successfulRate < 0.50 ? 'critical' :
    alertCount >= 1 || successfulRate < 0.70 ? 'warning'  :
    'healthy';

  return {
    generatedAt: now,
    windowDays,
    totalCoalitions,
    successfulRate,
    avgCollectiveScore,
    agentHealth,
    taskTypeHealth: taskTypeHealth.sort((a, b) => b.totalRuns - a.totalRuns),
    topIssues,
    recommendations,
    systemStatus,
  };
}

// ─── Helper: leer patrones recientes directamente ─────────────────────────────

async function fetchRecentPatterns(windowDays: number): Promise<PatternRow[]> {
  // Acceder al cliente de Supabase directamente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { createClient } = await import('@supabase/supabase-js') as any;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return [];

  const client  = createClient(url, key, { auth: { persistSession: false } });
  const cutoff  = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from('learning_patterns')
    .select('task_type, agents_used, score, was_successful, created_at')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[Monitor] Error leyendo patrones:', error.message);
    return [];
  }

  return (data ?? []) as PatternRow[];
}
