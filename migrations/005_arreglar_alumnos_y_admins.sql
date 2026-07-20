-- ============================================================================
-- 005 — Arregla dos cosas encontradas al verificar contra la base real:
-- 1) ALUMNOS quedó bloqueada por completo (los alumnos no pueden loguearse
--    hoy) porque las políticas específicas que ya tenías (auth_select_alumnos,
--    etc.) dependen de auth.uid(), y esta app no usa Supabase Auth — auth.uid()
--    nunca tiene valor acá, así que esas políticas nunca dejan pasar nada.
-- 2) ADMINS sigue totalmente abierta (se puede leer con la clave pública,
--    PIN hasheado incluido) — el bloqueo que se intentó antes no quedó.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) ALUMNOS: restaurar acceso para que la app funcione hoy mismo.
--    (Mismo nivel de confianza que ya tienen bioimpedancia/registros_diarios
--    desde el fix anterior — no es la solución ideal, pero es la que hace
--    que la app funcione mientras se construye el sistema de sesiones real.)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_select_alumnos" ON alumnos;
DROP POLICY IF EXISTS "anon_insert_alumnos" ON alumnos;
DROP POLICY IF EXISTS "anon_update_alumnos" ON alumnos;

CREATE POLICY "anon_select_alumnos" ON alumnos
  FOR SELECT TO public USING (true);
CREATE POLICY "anon_insert_alumnos" ON alumnos
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "anon_update_alumnos" ON alumnos
  FOR UPDATE TO public USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 2) ADMINS: repetir el bloqueo + función segura, por si la vez anterior no
--    llegó a aplicarse completa. DROP IF EXISTS no falla si el nombre no
--    coincide exactamente, así que lo repetimos con todos los nombres
--    posibles que pudo haber tenido la política.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "allow all" ON admins;
DROP POLICY IF EXISTS "anon_select_admins" ON admins;

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  codigo text PRIMARY KEY,
  failed_attempts int NOT NULL DEFAULT 0,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION login_admin_rpc(p_codigo text, p_pin_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin admins%ROWTYPE;
  v_admin_found boolean;
  v_attempt admin_login_attempts%ROWTYPE;
  v_max_attempts int := 5;
  v_lock_minutes int := 15;
  v_codigo text := upper(p_codigo);
  v_ok boolean;
BEGIN
  SELECT * INTO v_attempt FROM admin_login_attempts WHERE codigo = v_codigo;

  IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > now() THEN
    RAISE EXCEPTION 'Demasiados intentos fallidos. Probá de nuevo en unos minutos.';
  END IF;

  SELECT * INTO v_admin FROM admins WHERE codigo = v_codigo;
  v_admin_found := FOUND;

  v_ok := v_admin_found
          AND v_admin.pin_hash IS NOT DISTINCT FROM p_pin_hash
          AND v_admin.activo IS TRUE;

  IF NOT v_ok THEN
    INSERT INTO admin_login_attempts (codigo, failed_attempts, last_attempt_at, locked_until)
    VALUES (v_codigo, 1, now(), NULL)
    ON CONFLICT (codigo) DO UPDATE SET
      failed_attempts = admin_login_attempts.failed_attempts + 1,
      last_attempt_at = now(),
      locked_until = CASE
        WHEN admin_login_attempts.failed_attempts + 1 >= v_max_attempts
        THEN now() + (v_lock_minutes || ' minutes')::interval
        ELSE NULL
      END;

    IF NOT v_admin_found THEN
      RAISE EXCEPTION 'Código admin inválido';
    ELSIF v_admin.activo IS FALSE THEN
      RAISE EXCEPTION 'Admin desactivado';
    ELSE
      RAISE EXCEPTION 'PIN incorrecto';
    END IF;
  END IF;

  DELETE FROM admin_login_attempts WHERE codigo = v_codigo;

  RETURN to_jsonb(v_admin) - 'pin_hash';
END;
$$;

REVOKE ALL ON FUNCTION login_admin_rpc(text, text) FROM public;
GRANT EXECUTE ON FUNCTION login_admin_rpc(text, text) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3) Verificación: esto tiene que devolver CERO filas para admins (si devuelve
--    alguna fila, avisame el resultado tal cual porque significa que sigue
--    quedando algo abierto).
-- ----------------------------------------------------------------------------
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'admins';
