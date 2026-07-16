-- ============================================================================
-- FIX REAL para admins — reemplaza el enfoque de 003 (que Claude web señaló
-- correctamente: "SELECT TO public USING(true)" sigue dejando leer toda la
-- tabla, PIN hasheado incluido). Correr esto EN VEZ de la parte de "admins"
-- de 003_fix_rls_policies.sql (la parte de alumnos/bioimpedancia de 003 sigue
-- aplicando igual, ver nota al final de este archivo).
--
-- Idea: nada, salvo el login, necesita leer la tabla admins. Entonces la
-- bloqueamos del todo para la anon key, y el login pasa por una función que
-- corre con privilegios propios (SECURITY DEFINER), valida el PIN adentro,
-- y devuelve el admin SIN el pin_hash. La tabla en sí queda inaccesible.
-- ============================================================================

DROP POLICY IF EXISTS "allow all" ON admins;
DROP POLICY IF EXISTS "anon_select_admins" ON admins;
-- Sin ninguna política para "public": con RLS habilitado y cero políticas,
-- la tabla queda 100% bloqueada vía API — ni lectura ni escritura.

CREATE OR REPLACE FUNCTION login_admin_rpc(p_codigo text, p_pin_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin admins%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM admins WHERE codigo = upper(p_codigo);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código admin inválido';
  END IF;

  IF v_admin.pin_hash IS DISTINCT FROM p_pin_hash THEN
    RAISE EXCEPTION 'PIN incorrecto';
  END IF;

  IF v_admin.activo IS FALSE THEN
    RAISE EXCEPTION 'Admin desactivado';
  END IF;

  -- to_jsonb(...) - 'pin_hash' devuelve todas las columnas del admin MENOS
  -- el hash del PIN — nunca sale de la base.
  RETURN to_jsonb(v_admin) - 'pin_hash';
END;
$$;

-- Solo se puede ejecutar la función (no leer la tabla directo)
REVOKE ALL ON FUNCTION login_admin_rpc(text, text) FROM public;
GRANT EXECUTE ON FUNCTION login_admin_rpc(text, text) TO anon, authenticated;

-- ============================================================================
-- Pendiente real, no resuelto acá (para no romper la app hoy):
-- `alumnos`, `bioimpedancia`, `registros_diarios` SÍ necesitan que cualquiera
-- con la anon key pueda leer/escribir hoy (el admin panel lista TODOS los
-- alumnos, y no existe ningún mecanismo de sesión server-side todavía que
-- distinga "esto lo pide Ari" de "esto lo pide cualquiera"). Dejarlas
-- abiertas (como en 003) es un parche temporal, no la solución.
-- La solución real: una tabla de sesiones + funciones RPC como esta, para
-- cada operación que toca esas tablas (~10-15 funciones en
-- services/supabase.js). Es un proyecto de verdad, no un ajuste de política
-- — está anotado como tarea 1.3h en PLAN-MAESTRO.md para hacerlo bien, sin
-- apurarlo y sin romper lo que usan Lucas y Ari todos los días.
-- ============================================================================
