-- ══════════════════════════════════════════════════════════════════════
-- 018: PLANES PREDETERMINADOS (plantillas) + ORIGEN (punto 6, 2026-07-21)
-- YA APLICADA vía MCP el 2026-07-21.
--
-- El Armador (CatalogoExplorer modo="armador") hasta ahora creaba
-- directamente una asignación real para un alumno (alumno_planes). Punto
-- 6 pide separar dos cosas:
--   1) El Armador solo crea/edita PLANTILLAS (no ligadas a un alumno) →
--      tabla nueva planes_predeterminados.
--   2) La asignación a un alumno específico se hace aparte (Admin →
--      Alumno → "Asignar plan"), copiando una plantilla a una fila real
--      de alumno_planes (con sus propios plan_dias/plan_ejercicios, para
--      no perder el historial de pesos por ejercicio que ya usa esa
--      estructura).
--
-- "Origen" (columna en alumno_planes): los planes viejos (pre-catálogo,
-- creados a mano por Lucas antes de esta ronda) quedan con origen NULL y
-- se filtran fuera del Armador/asignación — Lucas los va a recrear de
-- cero. Las asignaciones nuevas (desde una plantilla del Armador) se
-- marcan origen='catalogo_v2'.
-- ══════════════════════════════════════════════════════════════════════

alter table alumno_planes add column if not exists origen text;

create table if not exists planes_predeterminados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  grupo text default '',
  dias jsonb not null default '[]'::jsonb,
  origen text not null default 'catalogo_v2',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table planes_predeterminados enable row level security;
create policy "allow all" on planes_predeterminados for all using (true) with check (true);
