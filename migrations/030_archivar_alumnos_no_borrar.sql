-- ══════════════════════════════════════════════════════════════════════
-- 030 — 2026-08-04: borrar un alumno pasa a ser un ARCHIVADO, no un DELETE.
-- Motivo real: un click equivocado en el botón de eliminar de la lista del
-- Dashboard borró de verdad a un alumno (Agustina Riera, datos de prueba)
-- — como todas las tablas relacionadas (bioimpedancia, planes,
-- entrenamientos, registros_diarios, evaluaciones, historial_pesos) tienen
-- ON DELETE CASCADE sobre alumnos, se perdió todo junto y sin forma de
-- deshacerlo pasados los 6s del toast de "Deshacer".
--
-- Mismo patrón que ya usa catalogo_ejercicios.archivado (migración 021):
-- un alumno archivado no aparece en el Dashboard ni puede loguearse, pero
-- la fila y TODO lo relacionado (por FK, nunca se llega a borrar) sigue
-- vivo en la base — recuperable desde el panel admin en cualquier momento.
-- Aplicada en Supabase el 2026-08-04 vía MCP (apply_migration).
-- ══════════════════════════════════════════════════════════════════════
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS archivado boolean NOT NULL DEFAULT false;
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS archivado_en timestamptz;
