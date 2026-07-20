-- ============================================================================
-- 010 — Rehabilitación: biblioteca con categoría + bucket de media
--
-- ✅ YA APLICADA en Supabase el 2026-07-20 (vía MCP, sesión de Claude).
--    Este archivo queda como registro — NO hace falta correrla de nuevo.
--    (Es idempotente: si se corre otra vez no rompe nada.)
--
-- Contexto (2026-07-20):
-- 1) La app suma alumnos de REHABILITACIÓN (Griselda / osteopatía). Sus
--    ejercicios se guardan también en biblioteca_ejercicios para reutilizar,
--    separados de los de entrenamiento por la columna nueva `categoria`
--    ('entrenamiento' por defecto, 'rehab' para los de Griselda).
-- 2) El media de cada ejercicio (foto o video sacados con el celular en el
--    momento) se sube al bucket nuevo `rehab-media` (público, con policies
--    para la clave anon — mismo criterio que bioimpedancia-archivos en 006).
-- 3) FIX de paso: el bucket ejercicios-videos solo permitía INSERT al rol
--    `authenticated`, pero la app usa la clave anon → subir video desde el
--    admin fallaba. Se agrega policy pública para ese bucket.
-- ============================================================================

-- 1) Biblioteca: categoría de ejercicio
ALTER TABLE IF EXISTS biblioteca_ejercicios
ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'entrenamiento';

-- 2) Bucket público para media de rehabilitación
INSERT INTO storage.buckets (id, name, public)
VALUES ('rehab-media', 'rehab-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "rehab_media_select" ON storage.objects;
DROP POLICY IF EXISTS "rehab_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "rehab_media_delete" ON storage.objects;

CREATE POLICY "rehab_media_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'rehab-media');

CREATE POLICY "rehab_media_insert" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'rehab-media');

CREATE POLICY "rehab_media_delete" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'rehab-media');

-- 3) FIX: subir videos de ejercicios desde la app (clave anon)
DROP POLICY IF EXISTS "ejercicios_videos_insert_public" ON storage.objects;

CREATE POLICY "ejercicios_videos_insert_public" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'ejercicios-videos');

-- 4) Verificación
SELECT column_name FROM information_schema.columns
WHERE table_name = 'biblioteca_ejercicios' AND column_name = 'categoria';
SELECT id, public FROM storage.buckets WHERE id = 'rehab-media';
