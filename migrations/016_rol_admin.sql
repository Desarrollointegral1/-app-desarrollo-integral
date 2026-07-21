-- ══════════════════════════════════════════════════════════════════════
-- 016: ROL DE ADMINISTRADOR (punto 12, ronda 2026-07-21) — YA APLICADA
-- vía MCP el 2026-07-21.
--
-- Nueva columna `rol` en admins: 'entrenador' (default, Lucas/Ariel) o
-- 'kinesiologa' (Griselda). Por ahora solo queda el dato asignable y
-- visible — NO restringe todavía la vista de la kinesióloga a solo
-- alumnos de rehabilitación (documentado como pendiente futuro).
--
-- Como admins tiene RLS sin policies (nadie la lee/escribe directo con la
-- anon key, ver migración 004), se agregan 2 RPC SECURITY DEFINER nuevas
-- en el mismo patrón que login_admin_rpc/crear_admin_rpc:
--   - listar_admins_rpc(): todos los admins SIN pin_hash (para la lista
--     de gestión en Configuración → Crear admin).
--   - actualizar_rol_admin_rpc(p_id, p_rol): cambia el rol de un admin.
-- crear_admin_rpc se reemplaza para aceptar p_rol opcional (default
-- 'entrenador') sin romper la firma vieja (nombre/codigo/pin_hash/email).
-- ══════════════════════════════════════════════════════════════════════

alter table admins add column if not exists rol text not null default 'entrenador';
alter table admins add constraint admins_rol_check check (rol in ('entrenador','kinesiologa'));

create or replace function public.listar_admins_rpc()
returns setof jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  return query
    select to_jsonb(a) - 'pin_hash'
    from admins a
    order by a.created_at;
end;
$$;

revoke all on function public.listar_admins_rpc() from public;
grant execute on function public.listar_admins_rpc() to anon, authenticated;

create or replace function public.actualizar_rol_admin_rpc(p_id uuid, p_rol text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin admins%rowtype;
begin
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

revoke all on function public.actualizar_rol_admin_rpc(uuid, text) from public;
grant execute on function public.actualizar_rol_admin_rpc(uuid, text) to anon, authenticated;

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
  if coalesce(trim(p_nombre), '') = '' or coalesce(trim(p_codigo), '') = '' then
    raise exception 'Nombre y username son obligatorios';
  end if;
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
