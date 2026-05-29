-- ============================================================
-- SEED DATA: Patrones Baseline para Learning Loop
-- ============================================================
--
-- Este script inserta patrones de éxito inicial en learning_patterns.
-- Representa ejecuciones exitosas típicas por tipo de tarea.
--
-- Datos baseline = punto de referencia para que el sistema de
-- aprendizaje entienda qué combinaciones funcionan bien.
--
-- Ejecutar una sola vez al inicializar Supabase.
-- ============================================================

-- 1. Diseño y UI — Design Specialist lidera
INSERT INTO learning_patterns (
  task_type, keywords, agents_used, score, time_minutes,
  learning, was_successful, created_at
) VALUES
(
  'diseño',
  ARRAY['diseño', 'ui', 'navbar', 'hero', 'visual'],
  ARRAY['agent-design-specialist'],
  92,
  8,
  'Design Specialist solo lidera tareas visuales simples',
  true,
  NOW()
),
(
  'diseño_mixto',
  ARRAY['rediseña', 'premium', 'landing', 'componente'],
  ARRAY['agent-design-specialist', 'agent-code-specialist'],
  88,
  15,
  'Design + Code juntos para rediseños con implementación',
  true,
  NOW()
);

-- 2. Performance — Performance Specialist lidera
INSERT INTO learning_patterns (
  task_type, keywords, agents_used, score, time_minutes,
  learning, was_successful, created_at
) VALUES
(
  'performance',
  ARRAY['rápido', 'fcp', 'lighthouse', 'optimiza', 'velocidad'],
  ARRAY['agent-performance-specialist', 'agent-code-specialist', 'agent-analytics-specialist'],
  90,
  12,
  'Performance mejora con Code + Analytics para medición',
  true,
  NOW()
);

-- 3. Seguridad — Security Specialist SIEMPRE
INSERT INTO learning_patterns (
  task_type, keywords, agents_used, score, time_minutes,
  learning, was_successful, created_at
) VALUES
(
  'seguridad',
  ARRAY['seguridad', 'auth', 'headers', 'vulnerabilidades', 'compliance'],
  ARRAY['agent-security-specialist', 'agent-code-specialist'],
  96,
  10,
  'Security Specialist + Code Specialist = máxima confianza',
  true,
  NOW()
);

-- 4. Código — Code Specialist lidera
INSERT INTO learning_patterns (
  task_type, keywords, agents_used, score, time_minutes,
  learning, was_successful, created_at
) VALUES
(
  'código',
  ARRAY['implementa', 'código', 'componente', 'refactoriza', 'api'],
  ARRAY['agent-code-specialist'],
  95,
  10,
  'Code Specialist solo para implementaciones limpias',
  true,
  NOW()
);

-- 5. Contenido y Copy — Content Specialist
INSERT INTO learning_patterns (
  task_type, keywords, agents_used, score, time_minutes,
  learning, was_successful, created_at
) VALUES
(
  'contenido',
  ARRAY['copy', 'texto', 'cta', 'mensaje', 'seo'],
  ARRAY['agent-content-specialist', 'agent-research-specialist'],
  88,
  7,
  'Content + Research para copy con datos de respaldo',
  true,
  NOW()
);

-- 6. Análisis e Investigación
INSERT INTO learning_patterns (
  task_type, keywords, agents_used, score, time_minutes,
  learning, was_successful, created_at
) VALUES
(
  'investigación',
  ARRAY['investiga', 'análiza', 'competencia', 'benchmark', 'mercado'],
  ARRAY['agent-research-specialist', 'agent-analytics-specialist'],
  87,
  15,
  'Research + Analytics para análisis profundo',
  true,
  NOW()
);

-- 7. Media y Assets
INSERT INTO learning_patterns (
  task_type, keywords, agents_used, score, time_minutes,
  learning, was_successful, created_at
) VALUES
(
  'media',
  ARRAY['video', 'imagen', 'media', 'asset', 'animación'],
  ARRAY['agent-media-specialist', 'agent-design-specialist'],
  85,
  12,
  'Media + Design para assets optimizados',
  true,
  NOW()
);

-- 8. Auditoría Completa — Coalición completa
INSERT INTO learning_patterns (
  task_type, keywords, agents_used, score, time_minutes,
  learning, was_successful, created_at
) VALUES
(
  'auditoría',
  ARRAY['auditoría', 'completa', 'revisar', 'analizar', 'mejora'],
  ARRAY['agent-security-specialist', 'agent-code-specialist', 'agent-performance-specialist', 'agent-analytics-specialist', 'agent-research-specialist'],
  82,
  20,
  'Auditoría con 5+ agentes da visión 360° del sistema',
  true,
  NOW()
);

-- 9. Tareas Mixtas — La más común
INSERT INTO learning_patterns (
  task_type, keywords, agents_used, score, time_minutes,
  learning, was_successful, created_at
) VALUES
(
  'mejora_general',
  ARRAY['mejora', 'optimiza', 'actualiza', 'moderniza'],
  ARRAY['agent-design-specialist', 'agent-performance-specialist', 'agent-code-specialist'],
  85,
  18,
  'Mejoras requieren mínimo 3 agentes para perspectivas múltiples',
  true,
  NOW()
);

-- ============================================================
-- NOTA: Estos son datos iniciales con scores altos (85-96).
--
-- Representan "best practices" del equipo. Con el uso real,
-- el learning loop va a:
-- 1. Registrar coaliciones reales en coalition_history
-- 2. Actualizarse con scores reales (menos idealizados)
-- 3. Ajustar confidence de agentes dinámicamente
--
-- Los datos baseline sirven como punto de partida hasta que
-- hay suficiente historial real (20-30 coaliciones).
-- ============================================================
