-- 013 — RLS en las 14 tablas del ecosistema Charles V3 / Brain Factory
-- ═══════════════════════════════════════════════════════════════════
-- ✅ YA APLICADA en Supabase (tlxkghpytznkxgqslqzj) el 2026-07-21 vía Management API.
--    Este archivo queda versionado solo como registro — NO hay que correrla.
--
-- Contexto: estas 14 tablas (ajenas a la app de gestión) estaban sin RLS,
-- por lo que cualquiera con la anon key pública podía leerlas y escribirlas.
-- Todas están referenciadas por código vivo del ecosistema Charles/Brain Factory
-- (web/lib/supabase-agents.ts, web/lib/brain-factory/core/BrainFactory.ts,
-- web/lib/coalition-monitor.ts), que accede con SUPABASE_SERVICE_ROLE_KEY.
-- Como service_role bypasea RLS, se habilita RLS SIN políticas: anon y
-- authenticated quedan sin acceso, y el ecosistema sigue funcionando igual.
--
-- Backup previo de todas las filas: G:\Mi unidad\Cerebro\_inbox\backup-tablas-supabase\
--
-- Verificado post-aplicación (2026-07-21):
--   · anon SELECT brains → []  · anon INSERT brains → error 42501 (RLS)
--   · service_role SELECT brains → 4 filas · brain_documents → 1 fila
--   · tablas de la app intactas (biblioteca_ejercicios con anon OK)
--   · advisors de seguridad: 0 tablas con rls_disabled_in_public

alter table public.agent_registry       enable row level security;
alter table public.brain_alerts         enable row level security;
alter table public.brain_documents      enable row level security;
alter table public.brain_embeddings     enable row level security;
alter table public.brain_learning_queue enable row level security;
alter table public.brain_queries        enable row level security;
alter table public.brains               enable row level security;
alter table public.brand_memory         enable row level security;
alter table public.coalition_history    enable row level security;
alter table public.learning_patterns    enable row level security;
alter table public.message_bus          enable row level security;
alter table public.project_metrics      enable row level security;
alter table public.skill_captures       enable row level security;
alter table public.system_events        enable row level security;

-- Si algún día se necesita que un cliente anon/authenticated acceda a alguna
-- de estas tablas, crear una política explícita en vez de deshabilitar RLS.
