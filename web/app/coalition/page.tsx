'use client';

/**
 * /coalition — Pantalla visual de la granja de agentes en tiempo real
 *
 * Escribís la tarea → ves cómo cada agente trabaja en vivo → resultado final
 */

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AgentCard {
  agentId:     string;
  agentName:   string;
  emoji:       string;
  confidence:  number;
  model:       string;
  status:      'waiting' | 'running' | 'done' | 'error';
  output:      string;
  score:       number;
  executionMs: number;
  tokensUsed:  number;
  error?:      string;
}

interface CoalitionSummary {
  collectiveScore:  number;
  totalExecutionMs: number;
  totalTokensUsed:  number;
  parallelSpeedup:  string;
  contextFiles:     number;
}

// ─── Helpers visuales ─────────────────────────────────────────────────────────

const STATUS_STYLES: Record<AgentCard['status'], string> = {
  waiting: 'border-white/8 bg-white/[0.02] opacity-40',
  running: 'border-[#C8A96E]/50 bg-[#C8A96E]/5',
  done:    'border-emerald-500/30 bg-emerald-500/5 opacity-100',
  error:   'border-red-500/30 bg-red-500/5 opacity-100',
};

const PHASE_LABELS: Record<string, string> = {
  setup:       '⚙️  Preparando coalición...',
  round1:      '🚀 Agentes trabajando en paralelo',
  arbitration: '⚖️  Resolviendo conflictos entre agentes',
  round2:      '💻 Code Specialist implementando cambios',
  evaluation:  '🔍 Evaluación entre pares',
  synthesis:   '🧠 Sintetizando resultados finales',
  learning:    '📚 Guardando aprendizaje en Supabase',
  done:        '✅ Coalición completada',
};

function ScoreRing({ score, max = 25 }: { score: number; max?: number }) {
  const pct   = Math.min(score / max, 1);
  const color = pct >= 0.8 ? '#10b981' : pct >= 0.6 ? '#f59e0b' : '#ef4444';
  const r     = 18;
  const circ  = 2 * Math.PI * r;
  return (
    <svg width="48" height="48" className="shrink-0">
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
      <circle
        cx="24" cy="24" r={r} fill="none"
        stroke={color} strokeWidth="3.5"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="24" y="29" textAnchor="middle" fontSize="12" fontWeight="600" fill="white">
        {score}
      </text>
    </svg>
  );
}

function AgentCardUI({ agent }: { agent: AgentCard }) {
  const [expanded, setExpanded] = useState(false);
  const modelLabel = agent.model
    ?.replace('claude-', '')
    .replace(/-\d{8}$/, '')
    .replace('-4-5', '');

  return (
    <div className={`rounded-xl border p-4 transition-all duration-500 ${STATUS_STYLES[agent.status]}`}>
      <div className="flex items-start gap-3">

        {/* Emoji + spinner */}
        <div className="relative shrink-0 text-xl mt-0.5">
          {agent.emoji}
          {agent.status === 'running' && (
            <span className="absolute -bottom-1 -right-1 w-3 h-3 border-2 border-[#C8A96E]/40 border-t-[#C8A96E] rounded-full animate-spin" />
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-sm font-medium text-zinc-200 truncate">{agent.agentName}</span>
            <div className="flex items-center gap-2 shrink-0 text-xs">
              {modelLabel && <span className="text-zinc-600 font-mono">{modelLabel}</span>}
              {agent.status === 'waiting' && <span className="text-zinc-700">en cola</span>}
              {agent.status === 'running' && <span className="text-[#C8A96E] animate-pulse">trabajando…</span>}
              {agent.status === 'done'    && <span className="text-zinc-500">{Math.round(agent.executionMs / 1000)}s</span>}
              {agent.status === 'error'   && <span className="text-red-400">error</span>}
            </div>
          </div>

          {/* Barra de confidence */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-0.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C8A96E]/50 rounded-full"
                style={{ width: `${agent.confidence}%` }}
              />
            </div>
            <span className="text-xs text-zinc-600 w-8 text-right">{agent.confidence}%</span>
          </div>

          {/* Output colapsable */}
          {agent.output && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1 mb-1"
              >
                {expanded ? '▲ ocultar' : '▼ ver output'}
              </button>
              {expanded && (
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto bg-white/[0.03] rounded-lg p-3 font-mono">
                  {agent.output.slice(0, 3000)}{agent.output.length > 3000 ? '\n…[truncado]' : ''}
                </pre>
              )}
            </>
          )}

          {agent.error && (
            <p className="mt-1 text-xs text-red-400">{agent.error}</p>
          )}
        </div>

        {/* Score ring */}
        {agent.status === 'done' && agent.score > 0 && (
          <ScoreRing score={agent.score} max={25} />
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CoalitionPage() {
  const [task,         setTask]         = useState('');
  const [running,      setRunning]      = useState(false);
  const [agents,       setAgents]       = useState<AgentCard[]>([]);
  const [phaseLabel,   setPhaseLabel]   = useState('');
  const [synthesis,    setSynthesis]    = useState('');
  const [summary,      setSummary]      = useState<CoalitionSummary | null>(null);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [filesWritten, setFilesWritten] = useState<{ path: string; description: string }[]>([]);
  const [learning,     setLearning]     = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agents.length, synthesis]);

  const reset = useCallback(() => {
    setAgents([]);
    setPhaseLabel('');
    setSynthesis('');
    setSummary(null);
    setErrorMsg('');
    setFilesWritten([]);
    setLearning('');
  }, []);

  const run = useCallback(async () => {
    if (!task.trim() || running) return;
    reset();
    setRunning(true);
    setPhaseLabel(PHASE_LABELS['setup']);

    try {
      const resp = await fetch('/api/coalition/stream', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ task: task.trim() }),
      });

      if (!resp.ok || !resp.body) {
        const data = await resp.json().catch(() => ({})) as { error?: string };
        setErrorMsg(data.error ?? `Error ${resp.status}`);
        setRunning(false);
        return;
      }

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try { handleSSEEvent(JSON.parse(raw) as Record<string, unknown>); }
          catch { /* fragmento parcial */ }
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setRunning(false);
    }
  }, [task, running, reset]);

  function handleSSEEvent(ev: Record<string, unknown>) {
    switch (ev.type as string) {
      case 'coalition_start': {
        const sel = (ev.selectedAgents as AgentCard[]) ?? [];
        setAgents(sel.map((a) => ({
          agentId:     a.agentId,
          agentName:   a.agentName,
          emoji:       a.emoji,
          confidence:  a.confidence,
          model:       (a as unknown as Record<string, string>).model ?? '',
          status:      'waiting' as const,
          output:      '',
          score:       0,
          executionMs: 0,
          tokensUsed:  0,
        })));
        setPhaseLabel(PHASE_LABELS['round1']);
        break;
      }
      case 'phase_update':
        setPhaseLabel(PHASE_LABELS[ev.phase as string] ?? String(ev.phase));
        break;
      case 'agent_start':
        setAgents((prev) => prev.map((a) =>
          a.agentId === ev.agentId ? { ...a, status: 'running' } : a
        ));
        break;
      case 'agent_result': {
        type R = { agentId: string; success: boolean; output: string; score: number; executionMs: number; tokensUsed: number; error?: string; model?: string };
        const r = ev as unknown as R;
        setAgents((prev) => prev.map((a) =>
          a.agentId === r.agentId ? {
            ...a,
            status:      r.success ? 'done' : 'error',
            output:      r.output ?? '',
            score:       r.score ?? 0,
            executionMs: r.executionMs ?? 0,
            tokensUsed:  r.tokensUsed ?? 0,
            error:       r.error,
            model:       r.model ?? a.model,
          } : a
        ));
        break;
      }
      case 'coalition_synthesis':
        setSynthesis(String(ev.synthesis ?? ''));
        setPhaseLabel(PHASE_LABELS['done']);
        break;
      case 'coalition_end':
        setSummary(ev.summary as CoalitionSummary);
        setFilesWritten((ev.filesWritten as { path: string; description: string }[]) ?? []);
        setLearning(String(ev.learningApplied ?? ''));
        break;
      case 'error':
        setErrorMsg(String(ev.message ?? 'Error desconocido'));
        setRunning(false);
        break;
    }
  }

  const doneCount  = agents.filter((a) => a.status === 'done').length;
  const activeCount = agents.filter((a) => a.status === 'running').length;
  const totalScore  = summary?.collectiveScore ?? 0;
  const scoreColor  = totalScore >= 80 ? 'text-emerald-400' : totalScore >= 60 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Granja de Agentes</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Los agentes trabajan en paralelo — ves cada uno al terminar en tiempo real
            </p>
          </div>
          {summary && (
            <div className="text-right">
              <div className={`text-3xl font-bold ${scoreColor}`}>
                {totalScore}<span className="text-sm text-zinc-600 font-normal">/100</span>
              </div>
              <div className="text-xs text-zinc-600">score colectivo</div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="mb-8 flex gap-3 items-start">
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run(); }}
            placeholder="Describí la tarea con tus palabras… (Ctrl+Enter para ejecutar)"
            rows={2}
            disabled={running}
            className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-[#C8A96E]/40 transition-colors disabled:opacity-40"
          />
          <button
            onClick={run}
            disabled={running || !task.trim()}
            className="shrink-0 h-[72px] px-6 bg-[#C8A96E] hover:bg-[#d4b57a] text-black text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {running ? (
              <span className="flex flex-col items-center gap-1.5">
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span className="text-xs">corriendo</span>
              </span>
            ) : 'Ejecutar'}
          </button>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Phase */}
        {phaseLabel && (
          <div className="mb-5 flex items-center gap-3">
            {running && <span className="w-2 h-2 rounded-full bg-[#C8A96E] animate-pulse shrink-0" />}
            <span className="text-sm text-zinc-400">{phaseLabel}</span>
            {agents.length > 0 && (
              <span className="ml-auto text-xs text-zinc-700">
                {doneCount}/{agents.length}
                {activeCount > 0 && ` · ${activeCount} activos`}
              </span>
            )}
          </div>
        )}

        {/* Grid de agentes */}
        {agents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {agents.map((a) => <AgentCardUI key={a.agentId} agent={a} />)}
          </div>
        )}

        {/* Archivos escritos */}
        {filesWritten.length > 0 && (
          <div className="mb-5 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
            <p className="text-sm font-medium text-emerald-400 mb-2">
              💻 {filesWritten.length} archivo{filesWritten.length > 1 ? 's' : ''} escritos al proyecto
            </p>
            <ul className="space-y-1">
              {filesWritten.map((f, i) => (
                <li key={i} className="text-xs text-zinc-400 flex gap-2">
                  <code className="text-emerald-400/80 shrink-0">{f.path}</code>
                  <span className="text-zinc-600">—</span>
                  <span>{f.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Métricas */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Tiempo total',   value: `${Math.round(summary.totalExecutionMs / 1000)}s` },
              { label: 'Tokens usados',  value: summary.totalTokensUsed.toLocaleString('es-AR') },
              { label: 'Speedup',        value: summary.parallelSpeedup },
              { label: 'Contexto leído', value: `${summary.contextFiles} archivos` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/[0.03] border border-white/8 rounded-xl p-3">
                <div className="text-xs text-zinc-600 mb-0.5">{label}</div>
                <div className="text-base font-semibold">{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Aprendizaje */}
        {learning && (
          <div className="mb-5 p-3 bg-white/[0.02] border border-white/8 rounded-xl">
            <span className="text-xs text-[#C8A96E]">🧠 Aprendizaje: </span>
            <span className="text-xs text-zinc-500">{learning}</span>
          </div>
        )}

        {/* Síntesis */}
        {synthesis && (
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-6">
            <h2 className="text-sm font-medium text-[#C8A96E] mb-4">🧠 Síntesis de Charles</h2>
            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {synthesis}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
