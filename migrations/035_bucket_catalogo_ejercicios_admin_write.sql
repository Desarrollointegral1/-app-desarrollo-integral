-- 2026-08-10 — BUG: "La imagen se generó pero no se pudo subir: Storage respondió 400".
-- Causa real, comprobada haciendo el POST a mano con un JWT de admin de verdad:
--   {"statusCode":"403","error":"Unauthorized",
--    "message":"new row violates row-level security policy","code":"AccessDenied"}
-- O sea: NO era el Content-Type, ni el nombre del archivo (el endpoint lo arma
-- con timestamp + random, sin tildes ni espacios), ni el upsert. El bucket
-- 'catalogo-ejercicios' se creó el 2026-07-21 y nunca tuvo policy de INSERT en
-- storage.objects: todo lo que hay adentro se subió con la service_role desde
-- scripts. El armador asistido sube con el JWT del profe, así que la RLS lo
-- frena — y storage-api devuelve ese 403 envuelto en un HTTP 400, que es lo que
-- confundía el diagnóstico.
-- Se copia el criterio de 027 (bucket 'ejercicios-videos'): escribe solo admin.
-- La lectura sigue sin policy porque el bucket es público.
create policy catalogo_ejercicios_solo_admin_write on storage.objects
  for all to authenticated
  using  (bucket_id = 'catalogo-ejercicios' and public.is_admin())
  with check (bucket_id = 'catalogo-ejercicios' and public.is_admin());
