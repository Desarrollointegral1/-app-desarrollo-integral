-- Auditoría 2026-08-02: el bucket público 'ejercicios-videos' permitía a
-- CUALQUIER alumno logueado subir archivos arbitrarios (hosting gratis de
-- lo que sea bajo el dominio de Supabase del proyecto). Se alinea con los
-- otros buckets: solo admin escribe. El bucket está vacío hoy.
-- La lectura sigue funcionando sin policy porque el bucket es público.
-- Único código que sube ahí: subirVideoEjercicio(), solo desde el panel admin.
drop policy if exists "Allow authenticated uploads" on storage.objects;
create policy ejercicios_videos_solo_admin_write on storage.objects
  for all to authenticated
  using  (bucket_id = 'ejercicios-videos' and public.is_admin())
  with check (bucket_id = 'ejercicios-videos' and public.is_admin());
