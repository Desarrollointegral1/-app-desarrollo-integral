-- ============================================================
-- FIX: identificadores camelCase del Brain Factory (idempotente)
-- ============================================================
-- La migración 001 declaró columnas camelCase SIN comillas, y Postgres
-- las bajó a minúsculas (createdAt → createdat). El código TypeScript
-- consulta con camelCase exacto vía PostgREST (case-sensitive), por lo
-- que el Brain Factory nunca pudo leer/escribir estas tablas.
-- Cada rename solo se ejecuta si la columna vieja todavía existe, así
-- el script puede correrse las veces que haga falta sin fallar.
-- Ejecutado con éxito en producción el 2026-07-08.
-- ============================================================

-- 1. RENOMBRAR COLUMNAS (solo si la versión en minúsculas existe)

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('brains', 'totaldocuments', 'totalDocuments'),
      ('brains', 'embeddingscount', 'embeddingsCount'),
      ('brains', 'querycount', 'queryCount'),
      ('brains', 'successrate', 'successRate'),
      ('brains', 'createdat', 'createdAt'),
      ('brains', 'updatedat', 'updatedAt'),
      ('brains', 'lastsyncedat', 'lastSyncedAt'),
      ('brains', 'githubsource', 'githubSource'),
      ('brains', 'specialisttype', 'specialistType'),
      ('brains', 'systemprompt', 'systemPrompt'),
      ('brains', 'topk', 'topK'),
      ('brain_documents', 'brainid', 'brainId'),
      ('brain_documents', 'sourceurl', 'sourceUrl'),
      ('brain_documents', 'sourcepath', 'sourcePath'),
      ('brain_documents', 'chunkcount', 'chunkCount'),
      ('brain_documents', 'totaltokens', 'totalTokens'),
      ('brain_documents', 'createdat', 'createdAt'),
      ('brain_documents', 'updatedat', 'updatedAt'),
      ('brain_queries', 'brainid', 'brainId'),
      ('brain_queries', 'retrieveddocuments', 'retrievedDocuments'),
      ('brain_queries', 'hasgap', 'hasGap'),
      ('brain_queries', 'gapdescription', 'gapDescription'),
      ('brain_queries', 'tokensused', 'tokensUsed'),
      ('brain_queries', 'responsetime', 'responseTime'),
      ('brain_queries', 'createdat', 'createdAt'),
      ('brain_embeddings', 'brainid', 'brainId'),
      ('brain_embeddings', 'documentid', 'documentId'),
      ('brain_embeddings', 'chunkindex', 'chunkIndex'),
      ('brain_embeddings', 'chunktext', 'chunkText'),
      ('brain_embeddings', 'createdat', 'createdAt'),
      ('brain_learning_queue', 'brainid', 'brainId'),
      ('brain_learning_queue', 'gaptype', 'gapType'),
      ('brain_learning_queue', 'proposeddocsource', 'proposedDocSource'),
      ('brain_learning_queue', 'createdat', 'createdAt'),
      ('brain_alerts', 'brainid', 'brainId'),
      ('brain_alerts', 'createdat', 'createdAt'),
      ('brain_alerts', 'resolvedat', 'resolvedAt'),
      ('skill_captures', 'brainid', 'brainId'),
      ('skill_captures', 'skillname', 'skillName'),
      ('skill_captures', 'createdat', 'createdAt')
    ) AS t(tbl, old_col, new_col)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = r.tbl
        AND column_name = r.old_col
    ) THEN
      EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', r.tbl, r.old_col, r.new_col);
    END IF;
  END LOOP;
END $$;

-- 2. RECREAR FUNCIONES (sus cuerpos referenciaban los nombres viejos)

CREATE OR REPLACE FUNCTION vector_search_brains(
  p_brain_id UUID,
  p_embedding VECTOR,
  p_k INT DEFAULT 5
)
RETURNS TABLE (
  document_id UUID,
  chunk_text TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    brain_embeddings."documentId",
    brain_embeddings."chunkText",
    (1 - (brain_embeddings.embedding <=> p_embedding))::FLOAT as similarity
  FROM brain_embeddings
  WHERE brain_embeddings."brainId" = p_brain_id
  ORDER BY brain_embeddings.embedding <=> p_embedding
  LIMIT p_k;
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE;

CREATE OR REPLACE FUNCTION update_brain_stats(p_brain_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE brains
  SET
    "totalDocuments" = (SELECT COUNT(*) FROM brain_documents WHERE "brainId" = p_brain_id),
    "queryCount" = (SELECT COUNT(*) FROM brain_queries WHERE "brainId" = p_brain_id),
    "successRate" = COALESCE(
      (SELECT COUNT(*) FILTER (WHERE "hasGap" = false)::FLOAT / NULLIF(COUNT(*), 0)
       FROM brain_queries WHERE "brainId" = p_brain_id),
      0
    ),
    "updatedAt" = now()
  WHERE id = p_brain_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION on_document_added()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_brain_stats(NEW."brainId");
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION on_query_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_brain_stats(NEW."brainId");
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. RECARGAR EL CACHÉ DE SCHEMA DE POSTGREST
NOTIFY pgrst, 'reload schema';
