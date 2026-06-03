-- Brain Factory Schema
-- Ejecuta esto en Supabase SQL Editor

-- Enable Vector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. TABLAS PRINCIPALES
CREATE TABLE IF NOT EXISTS brains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('nutrition', 'training', 'physiotherapy', 'development')),
  description TEXT,
  status TEXT DEFAULT 'ready' CHECK (status IN ('ready', 'processing', 'error', 'syncing')),
  totalDocuments INTEGER DEFAULT 0,
  embeddingsCount INTEGER DEFAULT 0,
  queryCount INTEGER DEFAULT 0,
  successRate FLOAT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now(),
  lastSyncedAt TIMESTAMP,
  githubSource TEXT,

  -- Especialista
  specialistType TEXT,  -- 'base' | 'nutrition' | 'training' | 'physiotherapy'
  systemPrompt TEXT,    -- Prompt personalizado del especialista
  temperature FLOAT DEFAULT 0.5,
  topK INTEGER DEFAULT 20,

  CONSTRAINT unique_domain_per_user UNIQUE(domain)
);

CREATE TABLE IF NOT EXISTS brain_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brainId UUID NOT NULL REFERENCES brains(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT CHECK (source IN ('user', 'github', 'skill', 'conversation', 'url')),
  sourceUrl TEXT,
  sourcePath TEXT,
  chunkCount INTEGER DEFAULT 0,
  totalTokens INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_brain FOREIGN KEY(brainId) REFERENCES brains(id)
);

CREATE TABLE IF NOT EXISTS brain_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brainId UUID NOT NULL REFERENCES brains(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  retrievedDocuments INTEGER DEFAULT 0,
  confidence FLOAT DEFAULT 0,
  hasGap BOOLEAN DEFAULT false,
  gapDescription TEXT,
  tokensUsed INTEGER DEFAULT 0,
  responseTime INTEGER DEFAULT 0,  -- ms
  createdAt TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_brain FOREIGN KEY(brainId) REFERENCES brains(id)
);

CREATE TABLE IF NOT EXISTS brain_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brainId UUID NOT NULL REFERENCES brains(id) ON DELETE CASCADE,
  documentId UUID NOT NULL REFERENCES brain_documents(id) ON DELETE CASCADE,
  chunkIndex INTEGER NOT NULL,
  chunkText TEXT NOT NULL,
  embedding VECTOR(1536),  -- Anthropic embedding size
  createdAt TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_brain FOREIGN KEY(brainId) REFERENCES brains(id),
  CONSTRAINT fk_document FOREIGN KEY(documentId) REFERENCES brain_documents(id)
);

CREATE TABLE IF NOT EXISTS brain_learning_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brainId UUID NOT NULL REFERENCES brains(id) ON DELETE CASCADE,
  gapType TEXT CHECK (gapType IN ('missing_doc', 'low_confidence', 'conflicting')),
  priority INTEGER CHECK (priority >= 1 AND priority <= 5),
  proposedDocSource TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'added')),
  createdAt TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_brain FOREIGN KEY(brainId) REFERENCES brains(id)
);

CREATE TABLE IF NOT EXISTS brain_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brainId UUID NOT NULL REFERENCES brains(id) ON DELETE CASCADE,
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT now(),
  resolvedAt TIMESTAMP,

  CONSTRAINT fk_brain FOREIGN KEY(brainId) REFERENCES brains(id)
);

CREATE TABLE IF NOT EXISTS skill_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brainId UUID NOT NULL REFERENCES brains(id) ON DELETE CASCADE,
  skillName TEXT NOT NULL,
  content TEXT NOT NULL,
  context TEXT,
  createdAt TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_brain FOREIGN KEY(brainId) REFERENCES brains(id)
);

-- 2. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_brains_domain ON brains(domain);
CREATE INDEX idx_brains_status ON brains(status);
CREATE INDEX idx_documents_brain ON brain_documents(brainId);
CREATE INDEX idx_documents_source ON brain_documents(source);
CREATE INDEX idx_queries_brain ON brain_queries(brainId);
CREATE INDEX idx_queries_date ON brain_queries(createdAt);
CREATE INDEX idx_embeddings_brain ON brain_embeddings(brainId);
CREATE INDEX idx_embeddings_doc ON brain_embeddings(documentId);

-- Índice vectorial para búsqueda (HNSW = más rápido)
CREATE INDEX idx_embeddings_vector ON brain_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_learning_queue_brain_status ON brain_learning_queue(brainId, status);
CREATE INDEX idx_alerts_brain ON brain_alerts(brainId, resolved);
CREATE INDEX idx_skill_captures_brain ON skill_captures(brainId);

-- 3. FUNCIONES ÚTILES

-- Función para búsqueda vectorial
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
    brain_embeddings.documentId,
    brain_embeddings.chunkText,
    (1 - (brain_embeddings.embedding <=> p_embedding))::FLOAT as similarity
  FROM brain_embeddings
  WHERE brain_embeddings.brainId = p_brain_id
  ORDER BY brain_embeddings.embedding <=> p_embedding
  LIMIT p_k;
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE;

-- Función para actualizar stats del brain
CREATE OR REPLACE FUNCTION update_brain_stats(p_brain_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE brains
  SET
    totalDocuments = (SELECT COUNT(*) FROM brain_documents WHERE brainId = p_brain_id),
    queryCount = (SELECT COUNT(*) FROM brain_queries WHERE brainId = p_brain_id),
    successRate = COALESCE(
      (SELECT COUNT(*) FILTER (WHERE hasGap = false)::FLOAT / NULLIF(COUNT(*), 0)
       FROM brain_queries WHERE brainId = p_brain_id),
      0
    ),
    updatedAt = now()
  WHERE id = p_brain_id;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGERS

-- Trigger para actualizar updatedAt
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brain_documents_update_timestamp
BEFORE UPDATE ON brain_documents
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger para actualizar stats cuando se agrega documento
CREATE OR REPLACE FUNCTION on_document_added()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_brain_stats(NEW.brainId);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brain_documents_insert_stats
AFTER INSERT ON brain_documents
FOR EACH ROW
EXECUTE FUNCTION on_document_added();

-- Trigger para actualizar stats cuando se hace query
CREATE OR REPLACE FUNCTION on_query_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_brain_stats(NEW.brainId);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brain_queries_insert_stats
AFTER INSERT ON brain_queries
FOR EACH ROW
EXECUTE FUNCTION on_query_created();

-- 5. PERMISO DE LECTURA A FUNCIONES
GRANT EXECUTE ON FUNCTION vector_search_brains TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_brain_stats TO anon, authenticated;

-- FIN DEL SCHEMA
