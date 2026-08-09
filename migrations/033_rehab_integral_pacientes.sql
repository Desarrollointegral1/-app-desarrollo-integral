-- ============================================================================
-- 033 — REHAB INTEGRAL: pacientes propios de Griselda (2026-08-09)
--
-- Por qué tablas nuevas y no reusar `alumnos`: decisión de Lucas — los
-- pacientes de rehabilitación van SEPARADOS de los alumnos del gimnasio.
-- Una persona que entrena y además se rehabilita es dos fichas distintas, a
-- propósito: el gimnasio no tiene por qué ver el motivo de consulta ni la
-- kinesióloga el plan de fuerza.
--
-- Por qué no hay tabla de "planes": Rehab Integral no tiene planes,
-- periodización ni peso por vuelta. Los ejercicios cuelgan directo del
-- paciente, ordenados. Eso es todo el modelo.
--
-- Acceso: `kine_actual()` devuelve el id del admin logueado SOLO si es
-- kinesióloga activa. Todas las policies comparan contra eso, así que un
-- entrenador (rol 'entrenador') no ve ni una fila aunque tenga sesión de
-- admin válida — que es literalmente el pedido ("Griselda ve sus pacientes;
-- nadie más").
-- ============================================================================

-- ── quién es la kinesióloga logueada ────────────────────────────────────────
-- SECURITY DEFINER porque `admins` tiene RLS sin policies desde la 004: sin
-- definer esta función no podría leer ni su propia fila.
create or replace function public.kine_actual()
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select a.id
  from admins a
  where a.user_id = auth.uid()
    and a.rol = 'kinesiologa'
    and a.activo
  limit 1
$$;

revoke all on function public.kine_actual() from public, anon;
grant execute on function public.kine_actual() to authenticated;

-- ── pacientes ───────────────────────────────────────────────────────────────
create table if not exists public.pacientes (
  id uuid primary key default gen_random_uuid(),
  kine_id uuid not null references public.admins (id) on delete cascade,
  nombre text not null,
  telefono text not null default '',
  email text not null default '',
  fecha_nacimiento date,
  motivo text not null default '',        -- motivo de consulta, en las palabras del paciente
  notas text not null default '',         -- observaciones de Griselda entre sesiones
  activo boolean not null default true,   -- alta médica = activo false, no se borra la ficha
  created_at timestamptz not null default now()
);

create index if not exists pacientes_kine_idx on public.pacientes (kine_id, activo);

alter table public.pacientes enable row level security;

drop policy if exists rls_pacientes_all on public.pacientes;
create policy rls_pacientes_all on public.pacientes
  for all to authenticated
  using (kine_id = public.kine_actual())
  with check (kine_id = public.kine_actual());

-- ── ejercicios asignados a un paciente ──────────────────────────────────────
-- `catalogo_id` queda como referencia blanda (text, sin FK) al ejercicio del
-- catálogo del que salió: si el catálogo cambia o se archiva un ejercicio, la
-- indicación que Griselda ya le dio al paciente no se toca. El nombre y las
-- indicaciones se copian en el momento por eso mismo.
create table if not exists public.paciente_ejercicios (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes (id) on delete cascade,
  nombre text not null,
  indicaciones text not null default '',
  media text not null default '',         -- path en el bucket privado rehab-media, o URL
  catalogo_id text,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists paciente_ejercicios_paciente_idx
  on public.paciente_ejercicios (paciente_id, orden);

alter table public.paciente_ejercicios enable row level security;

drop policy if exists rls_paciente_ejercicios_all on public.paciente_ejercicios;
create policy rls_paciente_ejercicios_all on public.paciente_ejercicios
  for all to authenticated
  using (exists (
    select 1 from public.pacientes p
    where p.id = paciente_ejercicios.paciente_id
      and p.kine_id = public.kine_actual()
  ))
  with check (exists (
    select 1 from public.pacientes p
    where p.id = paciente_ejercicios.paciente_id
      and p.kine_id = public.kine_actual()
  ));

comment on table public.pacientes is
  'Pacientes de Rehab Integral (Griselda). Separados de alumnos a propósito. 2026-08-09.';
comment on table public.paciente_ejercicios is
  'Ejercicios que Griselda le asigna a un paciente. Sin series/peso: no es entrenamiento. 2026-08-09.';
