-- Auditoría 2026-08-02: 8 policies de RLS usan el subquery escalar
-- (select id from alumnos where user_id = auth.uid()). Si user_id se
-- duplicara (bug de provisioning / restore), ese subquery tira
-- "more than one row" y TODAS las queries del usuario fallan sin explicación.
-- Índice único parcial como red de contención.
create unique index if not exists alumnos_user_id_unico
  on public.alumnos (user_id) where user_id is not null;
create unique index if not exists admins_user_id_unico
  on public.admins (user_id) where user_id is not null;
