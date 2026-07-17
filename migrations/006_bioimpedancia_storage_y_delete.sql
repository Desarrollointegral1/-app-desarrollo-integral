-- ============================================================================
-- 006 — Bioimpedancia: fotos en Storage + borrado de registros
--
-- Contexto (2026-07-17):
-- 1) La app ahora permite adjuntar una FOTO a cada estudio de bioimpedancia.
--    El bucket "bioimpedancia-archivos" no existe o está bloqueado por RLS,
--    así que hoy la foto se guarda embebida en la fila (data URL comprimido).
--    Funciona, pero engorda las filas. Correr esta migración habilita el
--    almacenamiento correcto en Storage — la app lo usa sola apenas exista.
-- 2) La tabla bioimpedancia NO tiene política de DELETE: el botón "eliminar
--    estudio" hoy borra la tarjeta en pantalla pero la fila queda viva.
--
-- Mismo nivel de confianza que el resto de las tablas de datos (abierto a la
-- clave pública) — coherente con el estado actual documentado en
-- migrations/005 hasta que exista el sistema de sesiones real.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Bucket público para archivos de bioimpedancia
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('bioimpedancia-archivos', 'bioimpedancia-archivos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "bio_archivos_select" ON storage.objects;
DROP POLICY IF EXISTS "bio_archivos_insert" ON storage.objects;
DROP POLICY IF EXISTS "bio_archivos_delete" ON storage.objects;

CREATE POLICY "bio_archivos_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'bioimpedancia-archivos');

CREATE POLICY "bio_archivos_insert" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'bioimpedancia-archivos');

CREATE POLICY "bio_archivos_delete" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'bioimpedancia-archivos');

-- ----------------------------------------------------------------------------
-- 2) Bioimpedancia: permitir borrar registros desde la app
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_delete_bioimpedancia" ON bioimpedancia;

CREATE POLICY "anon_delete_bioimpedancia" ON bioimpedancia
  FOR DELETE TO public
  USING (true);

-- ----------------------------------------------------------------------------
-- 3) Alumnos: el botón "Eliminar alumno" del admin hoy falla en silencio
--    (la fila desaparece de la pantalla pero queda viva en la base, y el
--    alumno reaparece al recargar). Falta la política de DELETE.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_delete_alumnos" ON alumnos;

CREATE POLICY "anon_delete_alumnos" ON alumnos
  FOR DELETE TO public
  USING (true);

-- ----------------------------------------------------------------------------
-- 4) Verificación: las dos consultas tienen que devolver filas
-- ----------------------------------------------------------------------------
SELECT id, public FROM storage.buckets WHERE id = 'bioimpedancia-archivos';
SELECT policyname, cmd, tablename FROM pg_policies
WHERE (tablename = 'objects' AND policyname LIKE 'bio_archivos%')
   OR (tablename IN ('bioimpedancia', 'alumnos') AND cmd = 'DELETE');
