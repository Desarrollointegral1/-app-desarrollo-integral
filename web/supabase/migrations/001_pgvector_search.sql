-- ============================================================
-- MIGRACIÓN: pgvector para búsqueda semántica en learning_patterns
-- ============================================================
--
-- INSTRUCCIONES:
--   1. Ir a https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj/sql
--   2. Pegar y ejecutar este script completo
--   3. Verificar que devuelve "Success" sin errores
--
-- QUÉ HACE:
--   a) Habilita la extensión pgvector (si no estaba habilitada)
--   b) Agrega columna task_embedding (vector de 1536 dims) a learning_patterns
--   c) Crea índice HNSW para búsqueda por cosine similarity (~fast~)
--   d) Crea la función find_patterns_by_vector que usa el índice
-- ============================================================

-- 1. Habilitar pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Agregar columna de embedding a learning_patterns (si no existe)
ALTER TABLE learning_patterns
  ADD COLUMN IF NOT EXISTS task_embedding vector(1536);

-- 3. Crear índice HNSW para búsqueda vectorial eficiente
--    (HNSW es más rápido que IVFFlat para tablas pequeñas-medianas)
CREATE INDEX IF NOT EXISTS learning_patterns_embedding_idx
  ON learning_patterns
  USING hnsw (task_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Función: buscar patrones similares por embedding
--    Retorna los patrones cuya similitud coseno supera el threshold.
--    Llamada desde supabase-agents.ts: db.findSimilarByVector(text, threshold, limit)
CREATE OR REPLACE FUNCTION find_patterns_by_vector(
  p_embedding  vector(1536),
  p_threshold  float    DEFAULT 0.70,
  p_limit      integer  DEFAULT 5
)
RETURNS TABLE (
  id              uuid,
  task_type       text,
  keywords        text[],
  agents_used     text[],
  score           integer,
  learning        text,
  gap_detected    text,
  was_successful  boolean,
  created_at      timestamptz,
  similarity      float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    task_type,
    keywords,
    agents_used,
    score,
    learning,
    gap_detected,
    was_successful,
    created_at,
    1 - (task_embedding <=> p_embedding) AS similarity
  FROM learning_patterns
  WHERE task_embedding IS NOT NULL
    AND 1 - (task_embedding <=> p_embedding) >= p_threshold
  ORDER BY task_embedding <=> p_embedding
  LIMIT p_limit;
$$;

-- 5. Verificación: mostrar cuántos patrones tienen embedding
SELECT
  COUNT(*) FILTER (WHERE task_embedding IS NOT NULL) AS "patrones con embedding",
  COUNT(*) AS "total patrones",
  'pgvector listo ✅' AS status
FROM learning_patterns;
