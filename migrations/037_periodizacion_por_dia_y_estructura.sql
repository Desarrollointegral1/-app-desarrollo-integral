-- 037 · PERIODIZACIÓN POR DÍA + ESTRUCTURA DEL DÍA (2026-08-10)
--
-- Dos pedidos de Lucas mirando el plan real de Jacobo:
--
-- 1) "cada día tiene su progresión y puede tener una planificación distinta o
--    no... si todos los días hace el mismo ejercicio seguramente es la misma
--    planificación y progresión, o un día puede estar haciendo fuerza el otro
--    volumen".
--    → alumno_planes.periodizacion (jsonb, NULL = HEREDA la del alumno).
--    Es la misma regla de herencia que ya usan preparacion.js y
--    periodizacion.js: nivel de arriba que se hereda + copia propia marcada
--    explícitamente que nunca se pisa desde arriba. Acá la marca ES la
--    columna: NULL = comparte, array = propia. No hace falta una marca
--    aparte porque el contenido y la marca viven en el mismo lugar.
--    OJO: ya existía una columna `periodizacion_id uuid` sin usar en ninguna
--    parte del código (ninguna query la lee ni la escribe). No se toca ni se
--    reusa: las semanas son jsonb, no una FK.
--
-- 2) El día era una lista plana de ejercicios. El plan de Jacobo tiene core
--    INTERCALADO entre rondas (no al final) y un finisher al final; y el
--    circuito intermitente de fuerza no tiene series ni reps, tiene 30 s por
--    ejercicio × 4 rondas.
--    → plan_ejercicios.seccion  ('principal' | 'core' | 'finisher')
--    → plan_dias.config          jsonb con { modo, segundos, rondas, core }
--    → plan_variantes.config     lo mismo, para que una variante traiga su
--                                estructura cuando se asigna a un día.
--
-- TODOS los defaults son "como está hoy": periodizacion NULL (hereda),
-- seccion 'principal' (todo es bloque principal, que es lo que hay hoy),
-- config '{}' (modo reps, core al final). Ningún alumno ni plan existente
-- cambia de comportamiento al aplicar esta migración.

alter table alumno_planes   add column if not exists periodizacion jsonb;
alter table plan_ejercicios add column if not exists seccion text not null default 'principal';
alter table plan_dias       add column if not exists config  jsonb not null default '{}'::jsonb;
alter table plan_variantes  add column if not exists config  jsonb not null default '{}'::jsonb;

-- Que un typo ('Core', 'finisher ') no se cuele y desaparezca el ejercicio de
-- las tres listas de la vista del alumno.
alter table plan_ejercicios drop constraint if exists plan_ejercicios_seccion_check;
alter table plan_ejercicios add  constraint plan_ejercicios_seccion_check
  check (seccion in ('principal', 'core', 'finisher'));

comment on column alumno_planes.periodizacion is
  'Periodización PROPIA de este día. NULL = hereda alumnos.plan_periodizacion (2026-08-10).';
comment on column plan_ejercicios.seccion is
  'principal | core | finisher. Default principal = como estaba antes del 2026-08-10.';
comment on column plan_dias.config is
  '{ modo: reps|tiempo, segundos, rondas, core: intercalado|final }. {} = reps + core al final.';
comment on column plan_variantes.config is
  'Misma forma que plan_dias.config: la variante trae su estructura al asignarse a un día.';
