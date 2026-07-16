-- ============================================================================
-- FIX RLS — admins, alumnos, bioimpedancia, registros_diarios
-- Generado 2026-07-16 a partir de la auditoría de Charles (Fase 1.2/1.3 del
-- plan maestro). NO SE EJECUTÓ AUTOMÁTICAMENTE — correr manualmente en el
-- SQL Editor de Supabase (Lucas), después de leer el aviso de más abajo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) ADMINS — hoy: "allow all" (FOR ALL TO public USING (true)) = cualquiera
--    con la anon key puede leer/crear/editar/borrar admins. Fix: la app solo
--    necesita LEER esta tabla para el login (loginAdmin hace select("*") y
--    compara el pin_hash en el cliente). No necesita insert/update/delete vía
--    anon key — eso se hace a mano desde el dashboard o con la service role key.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "allow all" ON admins;

CREATE POLICY "anon_select_admins" ON admins
  FOR SELECT TO public
  USING (true);

-- Sin política de INSERT/UPDATE/DELETE para "public" → quedan bloqueadas por
-- defecto con RLS habilitado. Correcto: crear/editar admins no debe poder
-- hacerse con la anon key.


-- ----------------------------------------------------------------------------
-- 2) ALUMNOS — hoy coexisten políticas específicas (auth_select_alumnos, etc.)
--    CON dos políticas permisivas ("allow all" y "dev_public_alumnos") que,
--    al ser permisivas, se combinan con OR y anulan a las específicas.
--    Fix: borrar las dos permisivas. Las específicas quedan tal cual están
--    (no se tocan acá porque no viven en este repo — fueron creadas directo
--    en el dashboard. Revisarlas junto con Lucas para confirmar que cubren
--    select/insert/update reales que la app necesita).
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "allow all" ON alumnos;
DROP POLICY IF EXISTS "dev_public_alumnos" ON alumnos;

-- Después de correr esto: probar login de alumno y las pantallas que tocan
-- la tabla alumnos (perfil, asignar plan, admin panel) ANTES de dar por
-- cerrado este punto — si algo se rompe, es porque las políticas específicas
-- (auth_select_alumnos, auth_insert_alumnos, etc.) no cubren ese caso.


-- ----------------------------------------------------------------------------
-- 3) BIOIMPEDANCIA y REGISTROS_DIARIOS — hoy: RLS habilitado, CERO políticas
--    → bloqueadas al 100% vía Data API, ni el propio flujo de la app puede
--    leer/escribir ahí hoy. Fix pragmático: habilitar select/insert/update
--    para "public" (mismo nivel de confianza que ya tiene alumnos en la
--    práctica), para que la app vuelva a funcionar.
--
--    LIMITACIÓN REAL (leer antes de aplicar): esta app no usa Supabase Auth
--    (auth.uid()) — el login es custom, por código+PIN, y todo el tráfico
--    pasa por la MISMA anon key para cualquier persona. Eso significa que
--    RLS acá no puede diferenciar "el alumno X solo ve sus propios datos de
--    X" — solo puede decidir "la anon key puede tocar esta tabla sí/no".
--    Un fix real (que si aísle a cada alumno de los datos de los demás)
--    requiere migrar el login a Supabase Auth o a una función Postgres
--    (RPC, SECURITY DEFINER) que verifique el PIN en el servidor y no en el
--    cliente. Eso es un cambio de arquitectura, no un ajuste de políticas —
--    queda anotado como pendiente de mediano plazo en el plan maestro.
-- ----------------------------------------------------------------------------
CREATE POLICY "anon_select_bioimpedancia" ON bioimpedancia
  FOR SELECT TO public USING (true);
CREATE POLICY "anon_insert_bioimpedancia" ON bioimpedancia
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "anon_update_bioimpedancia" ON bioimpedancia
  FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "anon_select_registros_diarios" ON registros_diarios
  FOR SELECT TO public USING (true);
CREATE POLICY "anon_insert_registros_diarios" ON registros_diarios
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "anon_update_registros_diarios" ON registros_diarios
  FOR UPDATE TO public USING (true) WITH CHECK (true);

-- ============================================================================
-- Fuera de alcance de este archivo (visto de paso en la auditoría, no se
-- toca acá): agent_registry, brain_*, message_bus, system_events,
-- learning_patterns, project_metrics, skill_captures, coalition_history,
-- brand_memory — RLS deshabilitado directamente. Si esas tablas tienen datos
-- reales (no solo de desarrollo/testing), avisar para auditarlas aparte.
-- ============================================================================
