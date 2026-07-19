-- ============================================================================
-- 007 — Tabla de configuración global de la app
--
-- Necesaria para que cosas compartidas por TODOS los alumnos persistan en la
-- base (hoy no hay dónde). Primer uso: los videos de la rutina de movilidad
-- (corta/larga) que se muestran al final de la sección Movilidad — antes se
-- editaban en el admin pero nunca se guardaban (bug silencioso: quedaban solo
-- en memoria hasta recargar).
--
-- La app funciona sin esta tabla (usa un valor por defecto del código), pero
-- los videos que cargues en Admin → Plan → Videos de movilidad solo quedan
-- guardados si esta migración corrió.
--
-- Mismo nivel de confianza que el resto (abierto a la clave pública) hasta el
-- sistema de sesiones real.
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_config (
  clave           text PRIMARY KEY,
  valor           jsonb NOT NULL DEFAULT '{}',
  actualizado_en  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_app_config" ON app_config;
DROP POLICY IF EXISTS "anon_insert_app_config" ON app_config;
DROP POLICY IF EXISTS "anon_update_app_config" ON app_config;

CREATE POLICY "anon_select_app_config" ON app_config
  FOR SELECT TO public USING (true);
CREATE POLICY "anon_insert_app_config" ON app_config
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "anon_update_app_config" ON app_config
  FOR UPDATE TO public USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

-- Verificación: tiene que devolver una fila por política (3)
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'app_config';
