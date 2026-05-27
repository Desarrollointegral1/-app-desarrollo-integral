'use client';

/**
 * ============================================================
 * /monitor — Dashboard de salud del ecosistema de agentes
 * ============================================================
 */

import { useState, useEffect, useCallback } from 'react';

// ─── Tipos (reflejan SystemHealthReport de coalition-monitor.ts) ──────────────

interface AgentHealth {
  agentId:      string;
  agentName:    string;
  emoji:        string;
  successRate:  number;
  trend:        'up' | 'down' | 'stable';
  recentScores: number[];
  avgScore:     number;
  alert:        boolean;
  alertMsg:     string;
}

interface TaskTypeHealth {
  taskType:       string;
  avgScore:       number;
  totalRuns:      number;
  successRuns:    number;
  successRatio:   number;
  commonAgents:   string[];
  recommendation: string;
}

interface MonitorReport {
  generatedAt:        string;
  windowDays:         number;
  totalCoalitions:    number;
  successfulRate:     number;
  avgCollectiveScore: number;
  agentHealth:        AgentHealth[];
  taskTypeHealth:     TaskTypeHealth[];
  topIssues:          string[];
  recommendations:    string[];
  systemStatus:       'healthy' | 'warning' | 'critical';
}

// ─── Helpers visuales ─────────────────────────────────────────────────────────

const STATUS_COLOR = {
  healthy:  { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-400', label: '✅ Sistema saludable' },
  warning:  { bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   text: 'text-amber-400',   label: '⚠️  Advertencia'       },
  critical: { bg: 'bg-red-500/15',     border: 'border-red-500/40',     text: 'text-red-400',     label: '🚨 Estado crítico'    },
} as const;

const TREND_ICON = { up: '↑', down: '↓', stable: '→' } as const;
const TREND_COLOR = { up: 'text-emerald-400', down: 'text-red-400', stable: 'text-zinc-400' } as const;

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-400 w-8 text-right">{value}</span>
    </div>
  );
}

function SmallSparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return <span className="text-xs text-zinc-600">sin datos</span>;
  const max = Math.max(...scores, 1);
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * 60;
    const y = 16 - (s / max) * 14;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="64" height="18" className="opacity-70">
      <polyline points={pts} fill="none" stroke="#C8A96E" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MonitorPage() {
  const [report,  setReport]  = useState<MonitorReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [days,    setDays]    = useState(30);
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  const fetchReport = useCallback(async (windowDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/coalition/monitor?days=${windowDays}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar el reporte');
      setReport(data.report);
      setLastFetch(new Date().toLocaleTimeString('es-AR'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(days); }, [days, fetchReport]);

  const statusStyle = report ? STATUS_COLOR[report.systemStatus] : STATUS_COLOR.healthy;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 font-sans">

      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Monitor del Ecosistema
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Salud de la granja de agentes · Desarrollo Integral
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Selector de ventana */}
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-white/5 border border-white/10 text-sm text-zinc-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#C8A96E]/50"
            >
              <option value={7}>Última semana</option>
              <option value={30}>Último mes</option>
              <option value={90}>Últimos 3 meses</option>
            </select>
            <button
              onClick={() => fetchReport(days)}
              disabled={loading}
              className="flex items-center gap-2 bg-[#C8A96E]/10 hover:bg-[#C8A96E]/20 border border-[#C8A96E]/30 text-[#C8A96E] text-sm px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40"
            >
              {loading ? (
                <span className="inline-block w-3 h-3 border-2 border-[#C8A96E]/50 border-t-[#C8A96E] rounded-full animate-spin" />
              ) : '↻'}
              Actualizar
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
            <p className="mt-1 text-red-500/60 text-xs">¿Supabase configurado? Verificar NEXT_PUBLIC_SUPABASE_URL en .env.local</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !report && (
          <div className="space-y-4 animate-pulse">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-white/5 rounded-xl" />
            ))}
          </div>
        )}

        {report && (
          <>
            {/* Status global */}
            <div className={`mb-6 p-5 rounded-xl border ${statusStyle.bg} ${statusStyle.border}`}>
              <div className="flex items-center justify-between">
                <span className={`text-lg font-medium ${statusStyle.text}`}>{statusStyle.label}</span>
                <span className="text-xs text-zinc-500">
                  {lastFetch && `Actualizado ${lastFetch} · `}Ventana: {report.windowDays} días
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Coaliciones',      value: report.totalCoalitions },
                  { label: 'Tasa de éxito',    value: `${(report.successfulRate * 100).toFixed(0)}%` },
                  { label: 'Score promedio',   value: `${report.avgCollectiveScore}/100` },
                  { label: 'Problemas activos',value: report.topIssues.filter(i => !i.startsWith('✅')).length },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs text-zinc-500 mb-0.5">{label}</div>
                    <div className="text-xl font-semibold text-white">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grilla: Agentes + Issues */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

              {/* Salud por agente */}
              <div className="lg:col-span-2 bg-white/[0.03] border border-white/8 rounded-xl p-5">
                <h2 className="text-sm font-medium text-zinc-300 mb-4">Salud por agente</h2>
                <div className="space-y-3">
                  {report.agentHealth.map((a) => (
                    <div key={a.agentId} className={`p-3 rounded-lg ${a.alert ? 'bg-red-500/8 border border-red-500/20' : 'bg-white/[0.02]'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span>{a.emoji}</span>
                          <span className="text-sm text-zinc-200">{a.agentName}</span>
                          {a.alert && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">alerta</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <SmallSparkline scores={a.recentScores} />
                          <span className={`text-sm font-mono ${TREND_COLOR[a.trend]}`}>
                            {TREND_ICON[a.trend]} {(a.successRate * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      {a.avgScore > 0 && <ScoreBar value={a.avgScore} />}
                      {a.alertMsg && <p className="text-xs text-red-400/80 mt-1">{a.alertMsg}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues + Recomendaciones */}
              <div className="space-y-4">
                <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                  <h2 className="text-sm font-medium text-zinc-300 mb-3">Problemas detectados</h2>
                  <ul className="space-y-2">
                    {report.topIssues.map((issue, i) => (
                      <li key={i} className="text-xs text-zinc-400 flex gap-2">
                        <span className="text-zinc-600 shrink-0">·</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                  <h2 className="text-sm font-medium text-zinc-300 mb-3">Recomendaciones</h2>
                  <ul className="space-y-2">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-zinc-400 flex gap-2">
                        <span className="text-[#C8A96E] shrink-0">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Salud por tipo de tarea */}
            {report.taskTypeHealth.length > 0 && (
              <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                <h2 className="text-sm font-medium text-zinc-300 mb-4">Salud por tipo de tarea</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {report.taskTypeHealth.map((tt) => (
                    <div key={tt.taskType} className="p-3 bg-white/[0.02] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-300 capitalize">{tt.taskType.replace(/-/g, ' ')}</span>
                        <span className="text-xs text-zinc-500">{tt.totalRuns} runs</span>
                      </div>
                      <ScoreBar value={tt.avgScore} />
                      <p className="text-xs text-zinc-500 mt-2">
                        {tt.commonAgents.slice(0, 2).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <p className="mt-6 text-xs text-zinc-700 text-center">
              /api/coalition/monitor · Datos de Supabase · Generado {new Date(report.generatedAt).toLocaleString('es-AR')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
