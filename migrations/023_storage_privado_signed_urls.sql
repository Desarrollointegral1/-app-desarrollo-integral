-- 023 — Storage privado + URLs firmadas (bioimpedancia, rehab-media) — 2026-07-24
--
-- Los buckets bioimpedancia-archivos y rehab-media eran públicos: cualquiera
-- con la URL directa podía leer los archivos sin expiración. Se pasan a
-- privados y la app resuelve signed URLs on-demand (helper getSignedUrl en
-- services/supabase.js). En la base se guarda el PATH del objeto, no la URL.
--
-- Lectura según quién consume el media:
--   · bioimpedancia-archivos: solo el admin lo ve  -> policy admin-only (ALL) ya existente.
--   · rehab-media: el alumno ve su video asignado   -> SELECT para cualquier autenticado;
--                  la kinesióloga/admin lo sube      -> escritura solo admin.

update storage.buckets set public = false where id in ('bioimpedancia-archivos', 'rehab-media');

-- Separar lectura de escritura en rehab-media (antes: único ALL con is_admin()).
drop policy if exists "rehab_media_admin" on storage.objects;

create policy "rehab_media_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'rehab-media');

create policy "rehab_media_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'rehab-media' and is_admin())
  with check (bucket_id = 'rehab-media' and is_admin());

-- bioimpedancia-archivos: la policy bio_archivos_admin (ALL, is_admin) ya cubre
-- SELECT solo-admin, no requiere cambios.
