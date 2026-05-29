'use client';

/**
 * ============================================================
 * /responder — Asistente de respuestas en el estilo de Caro
 * ============================================================
 * UN solo cuadro: Lucas pega el mensaje del cliente o escribe una
 * instrucción corta, y sale el email completo en el estilo de Caro.
 *
 * Memoria: el estilo base viene de fábrica (en el backend). Cada vez que
 * Lucas guarda una respuesta, se suma a la memoria (localStorage) y se
 * usa como ejemplo en las próximas. Así aprende de cada interacción.
 *
 * Estilos inline: globals.css no compila utilidades Tailwind.
 */

import { useState, useEffect, useCallback, CSSProperties } from 'react';
import { createClient } from '@supabase/supabase-js';

interface LearnedExample {
  input: string;
  reply: string;
}

type Persona = 'lucas' | 'caro';
type Channel = 'whatsapp' | 'mail';

const STORAGE_KEY = 'responder-memory-v2';
const PREFS_KEY = 'responder-prefs-v1';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const GOLD = 'var(--gold)';
const GREEN = 'var(--sage)';
const BORDER = 'var(--border)';

// Funciones de Supabase
async function loadMemoryFromSupabase(): Promise<LearnedExample[]> {
  try {
    const { data, error } = await supabase
      .from('responder_memory')
      .select('input, reply')
      .order('created_at', { ascending: true });
    if (error) {
      console.warn('Error cargando memoria:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Error en Supabase:', err);
    return [];
  }
}

async function saveMemoryToSupabase(examples: LearnedExample[]): Promise<void> {
  try {
    // Borrar todo y re-insertar (simple, pero funciona)
    await supabase.from('responder_memory').delete().neq('id', 0);
    if (examples.length > 0) {
      await supabase
        .from('responder_memory')
        .insert(examples.map(ex => ({ input: ex.input, reply: ex.reply })));
    }
  } catch (err) {
    console.warn('Error guardando memoria:', err);
  }
}

const S: Record<string, CSSProperties> = {
  main: { minHeight: '100vh', background: 'var(--bg)', color: 'var(--t1)', padding: '40px 16px', fontFamily: 'inherit' },
  wrap: { maxWidth: 720, margin: '0 auto' },
  header: { marginBottom: 28 },
  logo: { height: 56, width: 'auto', display: 'block', marginBottom: 10 },
  h1: { fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', color: GREEN, margin: 0 },
  sub: { fontSize: 14, color: 'var(--t2)', marginTop: 6 },
  memLine: { fontSize: 13, color: 'var(--t3)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 },
  linkBtn: { fontSize: 13, color: GREEN, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' },
  label: { display: 'block', fontSize: 14, color: 'var(--t2)', margin: '0 0 8px' },
  textarea: { width: '100%', padding: 14, borderRadius: 12, background: 'var(--bg3)', border: `1px solid ${BORDER}`, color: 'var(--t1)', fontSize: 15, lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' },
  primaryBtn: { padding: '12px 26px', borderRadius: 12, background: GREEN, color: '#0a0a0a', fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer', marginTop: 14 },
  replyWrap: { marginTop: 24 },
  replyLabel: { fontSize: 14, color: GREEN, marginBottom: 8, display: 'block' },
  replyBox: { width: '100%', padding: 16, borderRadius: 12, background: 'var(--bg2)', border: `1px solid ${GREEN}`, color: 'var(--t1)', fontSize: 15, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 180 },
  actions: { display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  actionBtn: { fontSize: 14, padding: '8px 18px', borderRadius: 10, border: `1px solid ${GREEN}`, color: GREEN, background: 'transparent', cursor: 'pointer' },
  actionBtnFilled: { fontSize: 14, padding: '8px 18px', borderRadius: 10, border: `1px solid ${GREEN}`, color: '#0a0a0a', background: GREEN, cursor: 'pointer', fontWeight: 500 },
  hint: { fontSize: 12, color: 'var(--t3)', marginTop: 8 },
  error: { fontSize: 14, color: '#f87171', marginTop: 12 },
  memPanel: { marginTop: 20, padding: 16, borderRadius: 12, border: `1px solid ${BORDER}`, background: 'var(--bg2)' },
  memItem: { padding: 10, borderRadius: 8, background: 'var(--bg3)', border: `1px solid ${BORDER}`, marginBottom: 8, fontSize: 13 },
  toggleRow: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 18 },
  toggleGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  toggleLabel: { fontSize: 12, color: 'var(--t3)' },
  segment: { display: 'inline-flex', borderRadius: 10, border: `1px solid ${BORDER}`, background: 'var(--bg3)', padding: 3, gap: 3 },
  segBtn: { padding: '8px 16px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--t2)', fontSize: 14, cursor: 'pointer', minWidth: 80, fontFamily: 'inherit' },
  segBtnActive: { padding: '8px 16px', borderRadius: 8, border: 'none', background: GREEN, color: '#0a0a0a', fontSize: 14, cursor: 'pointer', minWidth: 80, fontWeight: 600, fontFamily: 'inherit' },
};

export default function ResponderPage() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [memory, setMemory] = useState<LearnedExample[]>([]);
  const [persona, setPersona] = useState<Persona>('lucas');
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showMemory, setShowMemory] = useState(false);

  useEffect(() => {
    (async () => {
      // Cargar memoria de Supabase
      const supabaseMemory = await loadMemoryFromSupabase();
      if (supabaseMemory.length > 0) {
        setMemory(supabaseMemory);
      } else {
        // Fallback a localStorage si Supabase no tiene nada
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) setMemory(JSON.parse(raw) as LearnedExample[]);
        } catch {
          /* memoria corrupta — ignorar */
        }
      }

      // Cargar preferencias de localStorage
      try {
        const prefs = localStorage.getItem(PREFS_KEY);
        if (prefs) {
          const p = JSON.parse(prefs) as { persona?: Persona; channel?: Channel };
          if (p.persona) setPersona(p.persona);
          if (p.channel) setChannel(p.channel);
        }
      } catch {
        /* ignorar */
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ persona, channel }));
  }, [persona, channel]);

  const persist = useCallback((next: LearnedExample[]) => {
    setMemory(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    saveMemoryToSupabase(next);
  }, []);

  const generate = async () => {
    if (!input.trim()) {
      setError('Pegá el mensaje del cliente o escribí qué querés decir.');
      return;
    }
    setLoading(true);
    setError('');
    setReply('');
    setCopied(false);
    setSaved(false);
    try {
      const res = await fetch('/api/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          persona,
          channel,
          learnedExamples: memory.slice(-15), // últimos 15 aprendidos
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error generando respuesta');
      setReply(data.reply || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const copyReply = async () => {
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const learnFromReply = () => {
    if (!input.trim() || !reply.trim()) return;
    persist([...memory, { input: input.trim(), reply: reply.trim() }]);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const removeMemory = (idx: number) => persist(memory.filter((_, i) => i !== idx));
  const clearMemory = () => {
    if (confirm('¿Borrar toda la memoria aprendida? (el estilo base de Caro se mantiene)')) persist([]);
  };

  return (
    <main style={S.main}>
      <div style={S.wrap}>
        <div style={S.header}>
          <img src="/logos/giver-logo.png" alt="Giver" style={S.logo} />
          <h1 style={S.h1}>Giving</h1>
          <div style={S.memLine}>
            <span>🧠 {memory.length} {memory.length === 1 ? 'ejemplo aprendido' : 'ejemplos aprendidos'} (además del estilo de fábrica)</span>
            <button style={S.linkBtn} onClick={() => setShowMemory((s) => !s)}>
              {showMemory ? 'ocultar' : 'ver memoria'}
            </button>
          </div>
        </div>

        {showMemory && (
          <section style={S.memPanel}>
            {memory.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>
                Todavía no aprendió nada nuevo. Cada vez que guardás una respuesta, se suma acá.
              </p>
            ) : (
              <>
                {memory.map((m, idx) => (
                  <div key={idx} style={S.memItem}>
                    <div style={{ color: 'var(--t2)' }}><b>Entrada:</b> {m.input.slice(0, 120)}{m.input.length > 120 ? '…' : ''}</div>
                    <div style={{ color: 'var(--t3)', marginTop: 4 }}>{m.reply.slice(0, 120)}{m.reply.length > 120 ? '…' : ''}</div>
                    <button style={{ ...S.linkBtn, marginTop: 6 }} onClick={() => removeMemory(idx)}>quitar</button>
                  </div>
                ))}
                <button style={{ ...S.linkBtn, marginTop: 4 }} onClick={clearMemory}>borrar toda la memoria</button>
              </>
            )}
          </section>
        )}

        <section style={{ marginTop: 24 }}>
          <div style={S.toggleRow}>
            <div style={S.toggleGroup}>
              <span style={S.toggleLabel}>Quién responde</span>
              <div style={S.segment}>
                <button style={persona === 'lucas' ? S.segBtnActive : S.segBtn} onClick={() => setPersona('lucas')}>Lucas</button>
                <button style={persona === 'caro' ? S.segBtnActive : S.segBtn} onClick={() => setPersona('caro')}>Caro</button>
              </div>
            </div>
            <div style={S.toggleGroup}>
              <span style={S.toggleLabel}>Canal</span>
              <div style={S.segment}>
                <button style={channel === 'whatsapp' ? S.segBtnActive : S.segBtn} onClick={() => setChannel('whatsapp')}>WhatsApp</button>
                <button style={channel === 'mail' ? S.segBtnActive : S.segBtn} onClick={() => setChannel('mail')}>Mail</button>
              </div>
            </div>
          </div>

          <label style={S.label}>Mensaje que te llegó o lo que querés decir:</label>
          <textarea
            style={{ ...S.textarea, minHeight: 140 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'Ej: pegá el mensaje que te mandaron…\no escribí: "preguntale si puede el lunes a las 12:30h"'}
          />
          <br />
          <button style={{ ...S.primaryBtn, opacity: loading ? 0.5 : 1 }} onClick={generate} disabled={loading}>
            {loading ? 'Escribiendo…' : 'Generar respuesta'}
          </button>

          {error && <p style={S.error}>{error}</p>}

          {reply && (
            <div style={S.replyWrap}>
              <label style={S.replyLabel}>Respuesta {persona === 'caro' ? 'de Caro' : 'de Lucas'} (podés editarla antes de copiar):</label>
              <textarea style={S.replyBox} value={reply} onChange={(e) => setReply(e.target.value)} />
              <div style={S.actions}>
                <button style={S.actionBtnFilled} onClick={copyReply}>
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
                <button style={S.actionBtn} onClick={learnFromReply}>
                  {saved ? '✓ Guardado en memoria' : 'Guardar como ejemplo (aprende)'}
                </button>
              </div>
              <p style={S.hint}>
                Si editaste el texto para que quede como te gusta, apretá &quot;Guardar como ejemplo&quot; para que la próxima salga mejor.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
