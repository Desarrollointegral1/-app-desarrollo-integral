/**
 * ============================================================
 * SUPABASE AGENTS CLIENT
 * Cliente para las 7 tablas del sistema de agentes
 * ============================================================
 *
 * Tablas:
 *   agent_registry      → 7 agentes con success rates
 *   learning_patterns   → patrones aprendidos
 *   coalition_history   → historial de coaliciones
 *   message_bus         → mensajes peer-to-peer
 *   brand_memory        → datos de marca
 *   project_metrics     → métricas del proyecto
 *   system_events       → log del sistema
 * ============================================================
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AgentRow {
  id: string;
  display_name: string;
  status: 'available' | 'busy' | 'offline';
  domains: string[];
  keywords: string[];
  skills: string[];
  can_constrain: string[];
  constraints: Record<string, unknown>;
  avg_execution_minutes: number;
  success_rate: number;
  total_tasks: number;
  successful_tasks: number;
  updated_at: string;
}

export interface LearningPatternRow {
  id?: string;
  task_type: string;
  keywords: string[];
  agents_used: string[];
  score: number;
  time_minutes?: number;
  learning?: string;
  gap_detected?: string;
  iteration_count?: number;
  was_successful?: boolean;
  created_at?: string;
}

export interface CoalitionHistoryRow {
  id?: string;
  task_description: string;
  task_keywords?: string[];
  agents_invited?: string[];
  agents_selected?: string[];
  agent_confidence_scores?: Record<string, number>;
  final_score?: number;
  peer_scores?: Record<string, number>;
  iterations?: number;
  outcome?: 'success' | 'escalated' | 'failed';
  duration_minutes?: number;
  created_at?: string;
}

export interface MessageBusRow {
  id?: string;
  coalition_id?: string;
  message_type: 'broadcast' | 'bid' | 'constraint' | 'claim' | 'result' | 'score' | 'veto';
  from_agent: string;
  to_agent?: string;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  payload: Record<string, unknown>;
  processed?: boolean;
}

export interface ProjectMetricRow {
  id?: string;
  metric_name: string;
  current_value: string;
  target_value?: string;
  unit?: string;
  delta?: string;
  notes?: string;
}

export interface SystemEventRow {
  id?: string;
  event_type: string;
  level?: number;
  agent?: string;
  coalition_id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// ─── Embedding helpers ────────────────────────────────────────────────────────
//
// Genera un vector de 1536 dimensiones a partir de texto.
// Estrategia con fallback:
//   1. OpenAI text-embedding-3-small (si OPENAI_API_KEY configurada) → vectores reales
//   2. Fallback: TF-IDF simplificado con 1536 dims → funcional para búsqueda por overlap
//
// El vector se almacena en learning_patterns.task_embedding (vector(1536) en pgvector).

const VOCAB_SIZE = 1536; // dimensiones del vector (igual que text-embedding-3-small)

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function buildTfIdfVector(text: string): number[] {
  const vec = new Array<number>(VOCAB_SIZE).fill(0);
  const tokens = text
    .toLowerCase()
    .split(/\s+|[^a-záéíóúüñ]+/i)
    .filter((t) => t.length > 2);

  const freq: Record<string, number> = {};
  for (const t of tokens) {
    freq[t] = (freq[t] ?? 0) + 1;
  }

  for (const [token, count] of Object.entries(freq)) {
    const idx = hashString(token) % VOCAB_SIZE;
    // TF normalizado
    vec[idx] += count / tokens.length;
  }

  // L2-normalize para que el coseno funcione correctamente
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.slice(0, 8192);

  // Intento 1: Voyage AI — 200M tokens gratis/mes, recomendado por Anthropic
  // Modelo: voyage-3-lite → 512 dims (escalado a 1536 con padding de ceros)
  // Docs: https://docs.voyageai.com/reference/embeddings-api
  const voyageKey = process.env.VOYAGE_API_KEY;
  if (voyageKey) {
    try {
      const resp = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${voyageKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'voyage-3-lite',  // 512 dims, gratis tier
          input: [input],
        }),
      });
      if (resp.ok) {
        const json = await resp.json() as { data: { embedding: number[] }[] };
        const vec512 = json.data[0].embedding;
        // Escalar de 512 → 1536 dims repitiendo 3 veces (mantiene similitud coseno)
        const vec1536 = [...vec512, ...vec512, ...vec512];
        const norm = Math.sqrt(vec1536.reduce((s, v) => s + v * v, 0)) || 1;
        return vec1536.map((v) => v / norm);
      }
    } catch {
      // Silencioso — caer a siguiente opción
    }
  }

  // Intento 2: OpenAI text-embedding-3-small (si tiene crédito cargado)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const resp = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input,
          dimensions: VOCAB_SIZE,
        }),
      });
      if (resp.ok) {
        const json = await resp.json() as { data: { embedding: number[] }[] };
        return json.data[0].embedding;
      }
    } catch {
      // Silencioso — caer a fallback
    }
  }

  // Fallback final: TF-IDF determinístico (no semántico, pero útil para overlap)
  return buildTfIdfVector(text);
}

// ─── Cliente principal ────────────────────────────────────────────────────────

export class SupabaseAgentsClient {
  private client: SupabaseClient;
  private static instance: SupabaseAgentsClient | null = null;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        'Supabase no configurado. Agregar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY al .env.local'
      );
    }

    this.client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  static getInstance(): SupabaseAgentsClient {
    if (!this.instance) {
      this.instance = new SupabaseAgentsClient();
    }
    return this.instance;
  }

  // ── Agent Registry ──────────────────────────────────────────────────────────

  async getAgents(): Promise<AgentRow[]> {
    const { data, error } = await this.client
      .from('agent_registry')
      .select('*')
      .eq('status', 'available')
      .order('success_rate', { ascending: false });

    if (error) throw new Error(`Error leyendo agentes: ${error.message}`);
    return data || [];
  }

  async updateAgentSuccessRate(agentId: string, wasSuccessful: boolean): Promise<void> {
    const { error } = await this.client.rpc('update_agent_success_rate', {
      p_agent_id: agentId,
      p_was_successful: wasSuccessful,
    });
    if (error) throw new Error(`Error actualizando success_rate: ${error.message}`);
  }

  /**
   * Carga los success_rates actuales de Supabase para los agentes dados.
   * Retorna un mapa agentId → successRate (0-1).
   * Si un agente no existe en la DB, retorna el valor default.
   */
  async getAgentSuccessRates(
    agentIds: string[],
    defaults: Record<string, number>
  ): Promise<Record<string, number>> {
    const { data, error } = await this.client
      .from('agent_registry')
      .select('id, success_rate')
      .in('id', agentIds);

    if (error) throw new Error(`Error leyendo success_rates: ${error.message}`);

    const result: Record<string, number> = { ...defaults };
    for (const row of (data ?? [])) {
      result[row.id] = row.success_rate ?? defaults[row.id] ?? 0.85;
    }
    return result;
  }

  // ── Learning Patterns ───────────────────────────────────────────────────────

  async findSimilarPatterns(keywords: string[], minScore = 75): Promise<LearningPatternRow[]> {
    const { data, error } = await this.client.rpc('find_similar_patterns', {
      p_keywords: keywords,
      p_min_score: minScore,
    });
    if (error) throw new Error(`Error buscando patrones: ${error.message}`);
    return data || [];
  }

  /**
   * Busca patrones pasados por overlap de keywords y retorna los agentes
   * que tuvieron buen desempeño (score ≥ minScore) en tareas similares,
   * junto con los que tuvieron mal desempeño (score < penaltyBelow).
   *
   * Usado por el loop de aprendizaje: estos datos ajustan los confidence
   * scores antes de seleccionar la coalición.
   */
  async getLearningAdjustments(
    keywords: string[],
    minScore = 75,
    penaltyBelow = 60
  ): Promise<{
    boosts:    Record<string, number>;   // agentId → cuánto sumar al confidence
    penalties: Record<string, number>;   // agentId → cuánto restar al confidence
    source:    string;                   // descripción del patrón encontrado
  }> {
    // Buscar patrones con cualquier keyword en común
    const { data, error } = await this.client
      .from('learning_patterns')
      .select('agents_used, score, task_type, keywords, learning')
      .overlaps('keywords', keywords)
      .order('score', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) {
      return { boosts: {}, penalties: {}, source: 'sin historial previo' };
    }

    const boosts:    Record<string, number> = {};
    const penalties: Record<string, number> = {};

    for (const pattern of data) {
      const agents = (pattern.agents_used as string[]) ?? [];
      const score  = (pattern.score as number) ?? 0;

      if (score >= minScore) {
        // Agentes que funcionaron bien → boost proporcional al score
        const boost = score >= 90 ? 0.08 : score >= 80 ? 0.05 : 0.03;
        for (const agentId of agents) {
          boosts[agentId] = Math.max(boosts[agentId] ?? 0, boost);
        }
      } else if (score < penaltyBelow) {
        // Agentes que funcionaron mal → pequeña penalización
        const penalty = 0.03;
        for (const agentId of agents) {
          if (!(agentId in boosts)) { // no penalizar si en otro patrón fue bueno
            penalties[agentId] = Math.max(penalties[agentId] ?? 0, penalty);
          }
        }
      }
    }

    const bestPattern = data[0];
    const source = `patrón previo "${bestPattern.task_type}" (score: ${bestPattern.score}, ${data.length} patrones similares)`;

    return { boosts, penalties, source };
  }

  async savePattern(pattern: LearningPatternRow): Promise<string> {
    // Generar embedding del texto de la tarea para búsqueda semántica futura
    let embedding: number[] | undefined;
    try {
      const textToEmbed = [
        pattern.task_type,
        ...(pattern.keywords ?? []),
        pattern.learning ?? '',
      ].join(' ');
      embedding = await generateEmbedding(textToEmbed);
    } catch {
      // Embedding opcional — no bloquear si falla
    }

    const { data, error } = await this.client
      .from('learning_patterns')
      .insert({
        ...pattern,
        ...(embedding ? { task_embedding: JSON.stringify(embedding) } : {}),
      })
      .select('id')
      .single();

    if (error) throw new Error(`Error guardando patrón: ${error.message}`);
    return data.id;
  }

  // Búsqueda semántica por vector (requiere pgvector)
  async findSimilarByVector(text: string, threshold = 0.7, limit = 5): Promise<LearningPatternRow[]> {
    let embedding: number[];
    try {
      embedding = await generateEmbedding(text);
    } catch {
      return []; // Sin embedding, sin búsqueda vectorial
    }

    // Búsqueda por cosine similarity en pgvector
    const { data, error } = await this.client.rpc('find_patterns_by_vector', {
      p_embedding: JSON.stringify(embedding),
      p_threshold: threshold,
      p_limit: limit,
    });

    if (error) {
      // RPC no existe aún → fallback a keyword search
      return this.findSimilarPatterns(text.split(' ').filter((w) => w.length > 3));
    }
    return data || [];
  }

  // ── Coalition History ───────────────────────────────────────────────────────

  async createCoalition(coalition: CoalitionHistoryRow): Promise<string> {
    const { data, error } = await this.client
      .from('coalition_history')
      .insert(coalition)
      .select('id')
      .single();

    if (error) throw new Error(`Error creando coalición: ${error.message}`);
    return data.id;
  }

  async updateCoalition(
    id: string,
    update: Partial<CoalitionHistoryRow>
  ): Promise<void> {
    const { error } = await this.client
      .from('coalition_history')
      .update(update)
      .eq('id', id);

    if (error) throw new Error(`Error actualizando coalición: ${error.message}`);
  }

  // ── Message Bus ─────────────────────────────────────────────────────────────

  async publishMessage(message: MessageBusRow): Promise<void> {
    const { error } = await this.client.from('message_bus').insert(message);
    if (error) throw new Error(`Error publicando mensaje: ${error.message}`);
  }

  async getUnreadMessages(agentId: string, coalitionId?: string): Promise<MessageBusRow[]> {
    let query = this.client
      .from('message_bus')
      .select('*')
      .eq('processed', false)
      .or(`to_agent.eq.${agentId},to_agent.is.null`);

    if (coalitionId) {
      query = query.eq('coalition_id', coalitionId);
    }

    const { data, error } = await query.order('created_at');
    if (error) throw new Error(`Error leyendo mensajes: ${error.message}`);
    return data || [];
  }

  async markMessageProcessed(messageId: string): Promise<void> {
    const { error } = await this.client
      .from('message_bus')
      .update({ processed: true })
      .eq('id', messageId);

    if (error) throw new Error(`Error marcando mensaje: ${error.message}`);
  }

  // ── Brand Memory ────────────────────────────────────────────────────────────

  async getBrandData(key?: string): Promise<Record<string, unknown>> {
    let query = this.client.from('brand_memory').select('key, value, category');
    if (key) query = query.eq('key', key);

    const { data, error } = await query;
    if (error) throw new Error(`Error leyendo brand memory: ${error.message}`);

    const result: Record<string, unknown> = {};
    (data || []).forEach((row) => {
      result[row.key] = row.value;
    });
    return result;
  }

  // ── Project Metrics ─────────────────────────────────────────────────────────

  async getMetrics(): Promise<ProjectMetricRow[]> {
    const { data, error } = await this.client
      .from('project_metrics')
      .select('*')
      .order('measured_at', { ascending: false });

    if (error) throw new Error(`Error leyendo métricas: ${error.message}`);
    return data || [];
  }

  async saveMetric(metric: ProjectMetricRow): Promise<void> {
    const { error } = await this.client.from('project_metrics').insert(metric);
    if (error) throw new Error(`Error guardando métrica: ${error.message}`);
  }

  // ── System Events ───────────────────────────────────────────────────────────

  async logEvent(event: SystemEventRow): Promise<void> {
    const { error } = await this.client.from('system_events').insert(event);
    if (error) console.error(`Error logging event: ${error.message}`); // No-throw: logs son opcionales
  }

  // ── Health Check ────────────────────────────────────────────────────────────

  async healthCheck(): Promise<{ ok: boolean; agentCount: number; message: string }> {
    try {
      const { data, error } = await this.client
        .from('agent_registry')
        .select('id', { count: 'exact', head: false });

      if (error) return { ok: false, agentCount: 0, message: error.message };
      return { ok: true, agentCount: data?.length || 0, message: 'Supabase conectado ✅' };
    } catch (e) {
      return { ok: false, agentCount: 0, message: String(e) };
    }
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

let _client: SupabaseAgentsClient | null = null;

export function getSupabaseAgents(): SupabaseAgentsClient {
  if (!_client) _client = new SupabaseAgentsClient();
  return _client;
}
