-- ══════════════════════════════════════════════════════════════════════
-- 015: CATÁLOGO COMPLETO DE EJERCICIOS (YA APLICADA 2026-07-21 vía MCP)
--
-- Base de TODA la biblioteca: los 1.324 ejercicios del dataset ExerciseDB
-- (repo hasaneyldrm/exercises-dataset; datos MIT, media © Gym visual con
-- permiso, 180×180, atribución obligatoria — ver NOTICE.md del dataset)
-- + las entradas custom DI (taxonomía PH/RO/PE/CA/JA/GL/CO que no existe
-- en el dataset, id 'DI-<codigo>', custom=true).
--
-- Esquema base = el CREATE TABLE de PostgreSQL que propone el propio
-- dataset en setup.html (id/name/category/body_part/equipment/target/
-- muscle_group/secondary_muscles/image/gif_url), extendido con:
--   nombre_es / *_es      → traducciones (script scripts/catalogo/)
--   instrucciones_es      → instructions.es del dataset
--   codigo_di             → taxonomía DI si matchea (data/catalogo-match-di.json)
--   grupo_di              → metadata de reagrupado DI (no es el filtro de la UI)
--   custom / editado      → origen y ediciones de Lucas
--   video                 → video propio (bucket ejercicios-videos)
--
-- La media vive en el bucket público `catalogo-ejercicios`:
--   images/  1.324 JPG (~12MB) · videos/ 1.324 GIF (~127MB)
-- image/gif_url guardan paths RELATIVOS (images/xxx.jpg) — la app antepone
-- la URL pública del bucket (mismo criterio que recomienda el dataset).
--
-- biblioteca_ejercicios NO se toca: sigue siendo lo que usan los planes
-- existentes; el catálogo es la nueva fuente de verdad para principales.
-- ══════════════════════════════════════════════════════════════════════

create table if not exists catalogo_ejercicios (
  id                 text primary key,
  nombre_es          text not null,
  nombre_en          text,
  categoria          text,
  body_part          text,
  equipment          text,
  equipment_es       text,
  target             text,
  target_es          text,
  muscle_group       text,
  muscle_group_es    text,
  secondary_muscles  jsonb default '[]',
  secondary_muscles_es jsonb default '[]',
  instrucciones_es   text default '',
  image              text default '',
  gif_url            text default '',
  video              text default '',
  codigo_di          text,
  grupo_di           text,
  custom             boolean default false,
  editado            boolean default false,
  attribution        text default '',
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create index if not exists idx_catalogo_codigo_di on catalogo_ejercicios (codigo_di) where codigo_di is not null;
create index if not exists idx_catalogo_target on catalogo_ejercicios (target);
create index if not exists idx_catalogo_equipment on catalogo_ejercicios (equipment);
create index if not exists idx_catalogo_categoria on catalogo_ejercicios (categoria);

alter table catalogo_ejercicios enable row level security;
drop policy if exists "allow all catalogo" on catalogo_ejercicios;
create policy "allow all catalogo" on catalogo_ejercicios for all using (true) with check (true);
