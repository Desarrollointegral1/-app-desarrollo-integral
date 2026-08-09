-- ============================================================================
-- 034 — Sacar la rehabilitación de la app de entrenamiento (2026-08-09)
--
-- Etapa 2 de la migración a Rehab Integral (ver 033). La app de entrenamiento
-- ya no tiene vista, plan ni tipo de rehabilitación: eso vive en rehab/ con
-- sus propias tablas. Acá se limpia lo que quedó colgado en el esquema.
--
-- Verificado antes de correr: 0 alumnos con tipo = 'rehabilitacion' (los 7 son
-- 'entrenamiento') y 0 filas de biblioteca_ejercicios con categoria = 'rehab'.
-- No hay datos que preservar, así que se borra en vez de dejar código de
-- transición: la app está en beta y nadie depende de estas columnas.
--
-- Lo que NO se toca, a propósito:
--   · el bucket rehab-media y sus policies — la app de entrenamiento lo sigue
--     usando para el video del alumno "solo video", y Rehab Integral para la
--     foto/video del ejercicio. Renombrarlo invalidaría los paths guardados.
--   · admins.rol ('entrenador' | 'kinesiologa') — es lo que le da acceso a
--     Griselda a Rehab Integral, y se sigue asignando desde el panel admin.
-- ============================================================================

-- 1) biblioteca_ejercicios.categoria sólo existía para separar los ejercicios
--    de Griselda de los de entrenamiento (migración 010). Sin rehabilitación
--    en esta app, todas las filas son 'entrenamiento' y la columna no decide
--    nada.
alter table public.biblioteca_ejercicios drop column if exists categoria;

-- 2) alumnos.tipo queda con los dos únicos valores que la app sabe mostrar.
--    Sin este check, un 'rehabilitacion' escrito a mano dejaría al alumno en
--    una vista que ya no existe: entraría y no vería nada.
update public.alumnos set tipo = 'entrenamiento' where tipo not in ('entrenamiento', 'video');

alter table public.alumnos drop constraint if exists alumnos_tipo_check;
alter table public.alumnos add constraint alumnos_tipo_check
  check (tipo in ('entrenamiento', 'video'));

comment on column public.alumnos.tipo is
  'entrenamiento | video. La rehabilitación dejó de ser un tipo de alumno el 2026-08-09: es su propia app (rehab/) con la tabla pacientes.';
