-- Central Memory Schema for Autonomous Swarm Orchestrator
-- Created: 2026-05-25
-- Purpose: Persistent storage for context, execution history, patterns, and embeddings

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Table: shared_context
-- Purpose: Store shared context, brand materials, project metadata
CREATE TABLE IF NOT EXISTS shared_context (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_shared_context_key ON shared_context(key);
CREATE INDEX idx_shared_context_user_id ON shared_context(user_id);

-- RLS for shared_context
ALTER TABLE shared_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own context"
  ON shared_context FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own context"
  ON shared_context FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own context"
  ON shared_context FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table: execution_history
-- Purpose: Track all executions for learning and pattern generation
CREATE TABLE IF NOT EXISTS execution_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal TEXT NOT NULL,
  spec JSONB NOT NULL,
  skills_used TEXT[] NOT NULL,
  duration_ms INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  results JSONB,
  errors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_execution_history_user_id ON execution_history(user_id);
CREATE INDEX idx_execution_history_created_at ON execution_history(created_at DESC);
CREATE INDEX idx_execution_history_status ON execution_history(status);
CREATE INDEX idx_execution_history_goal ON execution_history USING GIN(to_tsvector('english', goal));

-- RLS for execution_history
ALTER TABLE execution_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own execution history"
  ON execution_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own execution records"
  ON execution_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Table: patterns
-- Purpose: Store learned patterns from successful executions
CREATE TABLE IF NOT EXISTS patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keywords TEXT[] NOT NULL,
  best_skills TEXT[] NOT NULL,
  success_rate FLOAT DEFAULT 0.0,
  uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_patterns_user_id ON patterns(user_id);
CREATE INDEX idx_patterns_created_at ON patterns(created_at DESC);
CREATE INDEX idx_patterns_success_rate ON patterns(success_rate DESC);
CREATE INDEX idx_patterns_keywords ON patterns USING GIN(keywords);

-- RLS for patterns
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patterns"
  ON patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own patterns"
  ON patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns"
  ON patterns FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table: embeddings
-- Purpose: Store embeddings for semantic search of patterns
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  pattern_id UUID NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_embeddings_pattern_id ON embeddings(pattern_id);
CREATE INDEX idx_embeddings_user_id ON embeddings(user_id);
CREATE INDEX idx_embeddings_vector ON embeddings USING IVFFLAT (embedding OPERATOR CLASS VECTOR_IP_OPS) WITH (lists = 100);

-- RLS for embeddings
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own embeddings"
  ON embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own embeddings"
  ON embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Table: token_budget
-- Purpose: Track token usage across LLM providers
CREATE TABLE IF NOT EXISTS token_budget (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('claude', 'gpt', 'gemini')),
  max_tokens_month INTEGER NOT NULL DEFAULT 100000,
  tokens_spent INTEGER NOT NULL DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_token_budget_user_id ON token_budget(user_id);
CREATE INDEX idx_token_budget_provider ON token_budget(provider);

-- RLS for token_budget
ALTER TABLE token_budget ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own token budget"
  ON token_budget FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own token budget"
  ON token_budget FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function: update_execution_patterns
-- Purpose: Automatically update patterns based on successful executions
CREATE OR REPLACE FUNCTION update_execution_patterns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    -- Extract keywords from goal
    INSERT INTO patterns (keywords, best_skills, success_rate, uses, user_id)
    VALUES (
      string_to_array(LOWER(NEW.goal), ' '),
      NEW.skills_used,
      1.0,
      1,
      NEW.user_id
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_patterns
AFTER INSERT ON execution_history
FOR EACH ROW
EXECUTE FUNCTION update_execution_patterns();

-- Function: calculate_pattern_success_rate
-- Purpose: Update pattern success rate based on execution history
CREATE OR REPLACE FUNCTION calculate_pattern_success_rate(pattern_id UUID)
RETURNS FLOAT AS $$
DECLARE
  success_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT
    COUNT(CASE WHEN eh.status = 'success' THEN 1 END),
    COUNT(*)
  INTO success_count, total_count
  FROM execution_history eh
  WHERE eh.skills_used && (SELECT best_skills FROM patterns WHERE id = pattern_id);

  IF total_count = 0 THEN
    RETURN 0.0;
  END IF;

  RETURN CAST(success_count AS FLOAT) / CAST(total_count AS FLOAT);
END;
$$ LANGUAGE plpgsql;

-- Function: cleanup_old_records
-- Purpose: Clean up old execution records (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_records()
RETURNS void AS $$
BEGIN
  DELETE FROM execution_history
  WHERE created_at < NOW() - INTERVAL '90 days';

  DELETE FROM embeddings
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Table: agents
-- Purpose: Store dynamic agent definitions for orchestration
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  skills TEXT[] NOT NULL,
  priority INTEGER NOT NULL DEFAULT 2,
  available BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT true,
  cost_per_run INTEGER DEFAULT 2000,
  dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
  parallel BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_agents_agent_id ON agents(agent_id);
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_priority ON agents(priority);
CREATE INDEX idx_agents_enabled ON agents(enabled);

-- RLS for agents
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agents"
  ON agents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agents"
  ON agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents"
  ON agents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents"
  ON agents FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
