-- ══════════════════════════════════════════════════════════════════════
-- 031 — 2026-08-04: las RPC de gestión de admins quedan cerradas a `anon`
-- y el repo vuelve a reflejar lo que está aplicado en la base.
--
-- Qué pasaba: `admins` tiene RLS sin policies desde la migración 004 (nadie
-- la lee ni la escribe directo con la anon key), así que todo pasa por RPC
-- SECURITY DEFINER. Esas RPC se fueron creando en 014/016/019 con
-- `grant execute ... to anon, authenticated` y SIN chequeo de quién llama.
-- El guard `is_admin()` se agregó después directo en la base vía MCP y
-- nunca bajó a `migrations/` — el linter de Supabase seguía marcando
-- 0028/0029 (SECURITY DEFINER ejecutable por anon) y quien leyera el repo
-- veía las versiones viejas, sin guard. Esta migración cierra las dos
-- puntas y deja el estado real versionado.
--
-- Qué hace:
--   1. Borra el overload viejo de crear_admin_rpc de 4 args (quedó muerto
--      cuando 016 agregó p_rol; la app siempre manda los 5).
--   2. Redefine las 5 RPC de gestión con el guard `is_admin()` explícito
--      (mismo comportamiento que ya corre en producción, ahora en el repo).
--   3. Saca el execute a `public`/`anon`: solo `authenticated` — y adentro
--      igual hay que ser admin. Defensa en profundidad: sin sesión de Auth
--      no se llega ni a la puerta.
--   4. alumnos_congelar_identidad (029) es una función de TRIGGER y estaba
--      expuesta como /rest/v1/rpc/. Se revoca a todos: el trigger la sigue
--      ejecutando igual (Postgres chequea el privilegio al crear el
--      trigger, no al dispararlo).
--
-- NO se toca login_admin_rpc: es el login, tiene que seguir siendo
-- ejecutable por `anon` (valida el hash server-side y nunca devuelve
-- pin_hash; el rate-limit vive en la 004).
--
-- Por qué is_admin() alcanza como guard: lee app_metadata.role del JWT, que
-- solo escribe el edge function auth-bridge con la service_role key. El
-- cliente no lo puede falsificar, y loginAdmin() abre sesión real de Auth
-- (establecerSesion(codigo, pin, "admin")) antes de llamar a cualquiera de
-- estas RPC — el flujo legítimo del panel no se rompe.
-- ══════════════════════════════════════════════════════════════════════

-- 1) Overload muerto de crear_admin_rpc (pre-016, sin p_rol).
drop function if exists public.crear_admin_rpc(text, text, text, text);

-- 2) + 3) Redefinición con guard + grants cerrados.

create or replace function public.crear_admin_rpc(
  p_nombre text,
  p_codigo text,
  p_pin_hash text,
  p_email text default '',
  p_rol text default 'entrenador'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin admins%rowtype;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;
  if coalesce(trim(p_nombre), '') = '' or coalesce(trim(p_codigo), '') = '' then
    raise exception 'Nombre y username son obligatorios';
  end if;
  -- el cliente manda el SHA-256 hex del PIN (64 chars), igual que el login
  if p_pin_hash is null or length(p_pin_hash) <> 64 then
    raise exception 'PIN inválido';
  end if;
  if p_rol not in ('entrenador','kinesiologa') then
    p_rol := 'entrenador';
  end if;
  if exists (select 1 from admins where codigo = upper(trim(p_codigo))) then
    raise exception 'El username "%" ya está en uso por otro admin', upper(trim(p_codigo));
  end if;

  insert into admins (nombre, codigo, pin_hash, email, activo, rol)
  values (trim(p_nombre), upper(trim(p_codigo)), p_pin_hash, coalesce(p_email, ''), true, p_rol)
  returning * into v_admin;

  return to_jsonb(v_admin) - 'pin_hash';
end;
$$;

revoke all on function public.crear_admin_rpc(text, text, text, text, text) from public, anon;
grant execute on function public.crear_admin_rpc(text, text, text, text, text) to authenticated;

create or replace function public.actualizar_admin_rpc(
  p_id uuid,
  p_nombre text,
  p_codigo text,
  p_pin_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin admins%rowtype;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;
  if coalesce(trim(p_nombre), '') = '' or coalesce(trim(p_codigo), '') = '' then
    raise exception 'Nombre y username son obligatorios';
  end if;
  -- p_pin_hash opcional (019): si no viene, la clave actual no se toca
  if p_pin_hash is not null and length(p_pin_hash) <> 64 then
    raise exception 'PIN inválido';
  end if;
  if exists (select 1 from admins where codigo = upper(trim(p_codigo)) and id <> p_id) then
    raise exception 'El username "%" ya está en uso por otro admin', upper(trim(p_codigo));
  end if;

  update admins
  set nombre = trim(p_nombre),
      codigo = upper(trim(p_codigo)),
      pin_hash = coalesce(p_pin_hash, pin_hash)
  where id = p_id
  returning * into v_admin;

  if not found then
    raise exception 'Admin no encontrado';
  end if;

  return to_jsonb(v_admin) - 'pin_hash';
end;
$$;

revoke all on function public.actualizar_admin_rpc(uuid, text, text, text) from public, anon;
grant execute on function public.actualizar_admin_rpc(uuid, text, text, text) to authenticated;

create or replace function public.actualizar_rol_admin_rpc(p_id uuid, p_rol text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin admins%rowtype;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;
  if p_rol not in ('entrenador','kinesiologa') then
    raise exception 'Rol inválido: %', p_rol;
  end if;
  update admins set rol = p_rol where id = p_id returning * into v_admin;
  if not found then
    raise exception 'Admin no encontrado';
  end if;
  return to_jsonb(v_admin) - 'pin_hash';
end;
$$;

revoke all on function public.actualizar_rol_admin_rpc(uuid, text) from public, anon;
grant execute on function public.actualizar_rol_admin_rpc(uuid, text) to authenticated;

create or replace function public.desactivar_admin_rpc(p_id uuid, p_activo boolean)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin admins%rowtype;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;
  update admins set activo = p_activo where id = p_id returning * into v_admin;
  if not found then
    raise exception 'Admin no encontrado';
  end if;
  return to_jsonb(v_admin) - 'pin_hash';
end;
$$;

revoke all on function public.desactivar_admin_rpc(uuid, boolean) from public, anon;
grant execute on function public.desactivar_admin_rpc(uuid, boolean) to authenticated;

create or replace function public.listar_admins_rpc()
returns setof jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;
  return query
    select to_jsonb(a) - 'pin_hash'
    from admins a
    order by a.created_at;
end;
$$;

revoke all on function public.listar_admins_rpc() from public, anon;
grant execute on function public.listar_admins_rpc() to authenticated;

-- 4) Función de trigger: no tiene por qué ser llamable vía API REST.
revoke all on function public.alumnos_congelar_identidad() from public, anon, authenticated;
