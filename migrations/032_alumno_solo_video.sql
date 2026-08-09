-- 2026-08-09 · Tipo de alumno "video": entra y ve SOLO su video de movilidad.
-- Por qué una columna nueva y no reusar plan_movilidad: plan_movilidad es un
-- jsonb de EJERCICIOS que la vista de entrenamiento recorre con .map — meter
-- ahí un string rompería esa vista para cualquier alumno mal clasificado.
-- Es un path del bucket privado "rehab-media" (el mismo que ya usa
-- subirMediaRehab), no una URL pública: se resuelve con signed URL al mostrar.
-- No hace falta RLS nueva: rls_alumnos_select ya limita cada fila a
-- user_id = auth.uid(), así que el alumno lee su video y ningún otro.
alter table public.alumnos add column if not exists video_movilidad text;
comment on column public.alumnos.video_movilidad is
  'Path en el bucket privado rehab-media del video de movilidad personal (tipo = video). 2026-08-09.';
