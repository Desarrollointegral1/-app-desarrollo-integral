-- ============================================================
-- MIGRACIÓN 002: Video Learning — Sistema de Aprendizaje de Cortes
-- ============================================================
-- INSTRUCCIONES: Pegar este SQL en Supabase SQL Editor y ejecutar
-- URL: https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj/sql
-- ============================================================

-- ── Tabla principal: historial de cada operación de corte ──────────────────

CREATE TABLE IF NOT EXISTS video_cuts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  -- Identificación del video fuente
  source_path     TEXT NOT NULL,        -- Ruta original del video
  source_hash     TEXT,                 -- SHA-256 primeros 4MB (para identificar videos iguales)
  source_duration FLOAT NOT NULL,       -- Duración original en segundos
  source_size_mb  FLOAT,               -- Tamaño del archivo original en MB

  -- Resultado del corte
  output_path     TEXT NOT NULL,        -- Dónde quedó el video editado
  output_duration FLOAT NOT NULL,       -- Duración del resultado en segundos
  duration_ratio  FLOAT NOT NULL,       -- output/source (0.3 = conservó 30% del video)

  -- Modo y parámetros
  cut_mode        TEXT NOT NULL CHECK (cut_mode IN ('manual', 'smart')),
  instructions    TEXT,                 -- Instrucción original del usuario (modo smart)
  segments_json   JSONB NOT NULL,       -- [{start, end, label, reason}]
  segment_count   INT NOT NULL,         -- Cantidad de segmentos

  -- Aprendizaje: preferencias detectadas
  style_tags      TEXT[] DEFAULT '{}',  -- ['fast-cuts', 'highlights', 'no-silence', 'action']
  avg_segment_sec FLOAT,               -- Duración promedio por segmento
  min_segment_sec FLOAT,               -- Segmento más corto
  max_segment_sec FLOAT,               -- Segmento más largo

  -- Feedback del usuario
  user_rating     INT CHECK (user_rating BETWEEN 1 AND 5),  -- 1-5 estrellas
  user_notes      TEXT,                 -- Notas libres del usuario
  approved        BOOLEAN DEFAULT NULL, -- true=le gustó, false=no, NULL=sin feedback

  -- Contexto
  context_type    TEXT,                 -- 'gym-session', 'class', 'evaluation', 'reel', 'highlight'
  transcript_text TEXT,                 -- Transcripción de audio si estaba disponible
  processing_ms   INT,                  -- Cuánto tardó en procesar

  -- Para búsqueda semántica futura
  embedding       vector(1536)          -- Embedding del estilo/instrucción para búsqueda similar
);

-- ── Índices ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS video_cuts_source_hash_idx    ON video_cuts (source_hash);
CREATE INDEX IF NOT EXISTS video_cuts_created_at_idx     ON video_cuts (created_at DESC);
CREATE INDEX IF NOT EXISTS video_cuts_cut_mode_idx       ON video_cuts (cut_mode);
CREATE INDEX IF NOT EXISTS video_cuts_duration_ratio_idx ON video_cuts (duration_ratio);
CREATE INDEX IF NOT EXISTS video_cuts_approved_idx       ON video_cuts (approved);
CREATE INDEX IF NOT EXISTS video_cuts_style_tags_idx     ON video_cuts USING GIN (style_tags);

-- HNSW para búsqueda semántica de estilos similares
CREATE INDEX IF NOT EXISTS video_cuts_embedding_idx ON video_cuts
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── Tabla de preferencias aprendidas (resumen) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS video_style_profile (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  -- Preferencias de duración aprendidas
  preferred_ratio_min   FLOAT DEFAULT 0.2,   -- Mínimo: conservar al menos 20%
  preferred_ratio_max   FLOAT DEFAULT 0.5,   -- Máximo: conservar hasta 50%
  preferred_ratio_avg   FLOAT DEFAULT 0.35,  -- Objetivo ideal: 35% del video original

  -- Preferencias de segmentos
  preferred_seg_min_sec FLOAT DEFAULT 3.0,   -- No cortar menos de 3 segundos
  preferred_seg_max_sec FLOAT DEFAULT 60.0,  -- No dejar más de 60 segundos de un tirón
  preferred_seg_avg_sec FLOAT DEFAULT 15.0,  -- Segmento promedio ideal

  -- Estilos más usados (aprendido de historial)
  top_style_tags        TEXT[] DEFAULT '{}',

  -- Contextos más frecuentes
  top_context_types     TEXT[] DEFAULT '{}',

  -- Estadísticas globales
  total_cuts_done       INT DEFAULT 0,
  total_hours_edited    FLOAT DEFAULT 0,
  avg_rating            FLOAT DEFAULT 0,

  -- Insights generados por IA
  style_summary         TEXT,  -- "Le gustan cortes rápidos, prefiere acción sobre explicación"
  last_analysis_at      TIMESTAMPTZ
);

-- Insertar perfil inicial (solo uno)
INSERT INTO video_style_profile (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ── Vista: resumen de cortes recientes ────────────────────────────────────────

CREATE OR REPLACE VIEW video_cuts_summary AS
SELECT
  id,
  created_at,
  source_path,
  cut_mode,
  instructions,
  segment_count,
  ROUND(source_duration::numeric) AS source_sec,
  ROUND(output_duration::numeric) AS output_sec,
  ROUND((duration_ratio * 100)::numeric, 1) AS kept_percent,
  style_tags,
  context_type,
  user_rating,
  approved
FROM video_cuts
ORDER BY created_at DESC;

-- ── RPC: obtener cortes similares por instrucción ─────────────────────────────

CREATE OR REPLACE FUNCTION find_similar_cuts(
  query_embedding vector(1536),
  match_count     INT DEFAULT 5,
  approved_only   BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id              UUID,
  instructions    TEXT,
  segments_json   JSONB,
  duration_ratio  FLOAT,
  style_tags      TEXT[],
  context_type    TEXT,
  user_rating     INT,
  similarity      FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    vc.id,
    vc.instructions,
    vc.segments_json,
    vc.duration_ratio,
    vc.style_tags,
    vc.context_type,
    vc.user_rating,
    1 - (vc.embedding <=> query_embedding) AS similarity
  FROM video_cuts vc
  WHERE
    vc.embedding IS NOT NULL
    AND (NOT approved_only OR vc.approved = TRUE)
  ORDER BY vc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── RLS: acceso público (mismo proyecto) ──────────────────────────────────────

ALTER TABLE video_cuts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_style_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_video_cuts"
  ON video_cuts FOR ALL
  USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_all_style_profile"
  ON video_style_profile FOR ALL
  USING (TRUE) WITH CHECK (TRUE);

-- ── Mensaje de confirmación ───────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migración 002 completada: tablas video_cuts y video_style_profile creadas';
END $$;
