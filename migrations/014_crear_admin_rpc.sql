-- ══════════════════════════════════════════════════════════════════════
-- 014: ALTA DE ADMINISTRADORES VÍA RPC (YA APLICADA 2026-07-21 vía MCP)
--
-- Bug: "Crear administrador" desde la app no creaba nada. La tabla admins
-- tiene RLS habilitado SIN policies (a propósito, desde la migración 004:
-- nadie la lee/escribe directo con la anon key — el login pasa por
-- login_admin_rpc). Pero crearAdmin() en services/supabase.js hacía un
-- INSERT directo → Postgres lo rechazaba con 42501 y el admin nuevo nunca
-- llegaba a la base. El login posterior fallaba con "Código admin inválido"
-- porque el registro no existía.
--
-- Fix: mismo patrón que el login — una función SECURITY DEFINER que corre
-- server-side, valida y nunca devuelve el pin_hash. crearAdmin() ahora
-- llama a esta RPC en vez de insertar directo.
-- ══════════════════════════════════════════════════════════════════════

create or replace function public.crear_admin_rpc(
  p_nombre text,
  p_codigo text,
  p_pin_hash text,
  p_email text default ''
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
  -- el cliente manda el SHA-256 hex del PIN (64 chars), igual que el login
  if p_pin_hash is null or length(p_pin_hash) <> 64 then
    raise exception 'PIN inválido';
  end if;
  if exists (select 1 from admins where codigo = upper(trim(p_codigo))) then
    raise exception 'El username "%" ya está en uso por otro admin', upper(trim(p_codigo));
  end if;

  insert into admins (nombre, codigo, pin_hash, email, activo)
  values (trim(p_nombre), upper(trim(p_codigo)), p_pin_hash, coalesce(p_email, ''), true)
  returning * into v_admin;

  return to_jsonb(v_admin) - 'pin_hash';
end;
$$;
