-- ══════════════════════════════════════════════════════════════════════
-- 019: EDITAR ADMIN EXISTENTE (punto 2, ronda 2026-07-21 #2)
--
-- Lucas pidió poder modificar los datos de un admin ya creado (nombre,
-- username, clave) desde Configuración → listado de Administradores.
-- admins sigue con RLS sin policies (ver migración 004/014/016) — el
-- update corre server-side en actualizar_admin_rpc, mismo patrón
-- SECURITY DEFINER que crear_admin_rpc/actualizar_rol_admin_rpc.
--
-- p_pin_hash es OPCIONAL (default null): si no se manda, la clave actual
-- no se toca (permite editar solo nombre/username sin forzar a
-- retipear el PIN).
-- ══════════════════════════════════════════════════════════════════════

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
  if coalesce(trim(p_nombre), '') = '' or coalesce(trim(p_codigo), '') = '' then
    raise exception 'Nombre y username son obligatorios';
  end if;
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

revoke all on function public.actualizar_admin_rpc(uuid, text, text, text) from public;
grant execute on function public.actualizar_admin_rpc(uuid, text, text, text) to anon, authenticated;
