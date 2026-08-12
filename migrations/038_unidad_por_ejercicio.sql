-- 038 — La unidad de cada ejercicio sale del catálogo — 2026-08-12
--
-- Pedido textual de Lucas: "los ejercicios de peso corporal como la trx o
-- fondo triceps no se cuenta por kilo sino por repeticiones... los ejercicios
-- isometricos tipo plancha son por segundos".
--
-- Hasta hoy había DOS unidades y ninguna fuente de verdad: plan_ejercicios
-- tenía `unidad` con default 'reps' (que en la pantalla se mostraba como KG),
-- y la única forma de saber que una plancha iba por tiempo era un regex sobre
-- el nombre adentro de ItemCard.jsx. Un parche: cualquier isométrico que no
-- se llame "plancha" (puente, hollow, colgarse de la barra) se registraba en
-- kilos.
--
-- Desde acá la unidad es un dato del CATÁLOGO (los 1.343 ejercicios) y viaja
-- al plan cuando el ejercicio se suma. Tres valores, no dos:
--   · kilos        — lleva carga externa (barra, mancuerna, polea, máquina)
--   · repeticiones — peso corporal / banda: se cuenta cuántas hizo
--   · segundos     — isométricos y máquinas de tiempo: se cuenta cuánto aguantó
--
-- OJO con el valor viejo 'reps' de plan_ejercicios: NO significa
-- "repeticiones", significa "nadie lo definió" (era el default de la columna).
-- Por eso los valores nuevos se llaman distinto — así el código puede
-- distinguir "el admin eligió repeticiones" de "esto viene sin definir" y
-- deducirlo por regla. Ver src/utils/unidades.js, que implementa EXACTAMENTE
-- la misma regla que este archivo.

-- ── 1. El catálogo gana su columna ────────────────────────────────────
alter table public.catalogo_ejercicios
  add column if not exists unidad text not null default 'kilos';

alter table public.catalogo_ejercicios
  drop constraint if exists catalogo_ejercicios_unidad_check;
alter table public.catalogo_ejercicios
  add constraint catalogo_ejercicios_unidad_check
  check (unidad in ('kilos', 'repeticiones', 'segundos'));

comment on column public.catalogo_ejercicios.unidad is
  'Cómo se registra el ejercicio: kilos | repeticiones | segundos. Se asignó por regla objetiva el 2026-08-12 (038) y el admin la puede cambiar ejercicio por ejercicio desde la Biblioteca.';

-- ── 2. Asignación por regla objetiva ──────────────────────────────────
-- El orden importa: una plancha es peso corporal Y es isométrica — manda el
-- isométrico, porque lo que se registra es el tiempo, no las repeticiones.
update public.catalogo_ejercicios set unidad =
  case
    when nombre_es ~* '(planch|isom|puente|hollow|superman|colgad|colgar|dead hang|l-sit|wall sit|estátic|estatic|sostenid)'
      then 'segundos'
    -- Máquinas y elementos que se miden por tiempo, no por carga.
    when equipment_es in ('Rodillo','Elíptico','Bicicleta fija','Escalador','Máquina SkiErg','Ergómetro de brazos','Soga')
      then 'segundos'
    -- Sin número de carga posible: el propio cuerpo, o una banda que no tiene kilos.
    when equipment_es in ('Peso corporal','Asistido','Bosu','Pelota de estabilidad','Rueda abdominal','Banda','Banda elástica')
      then 'repeticiones'
    else 'kilos'
  end;
-- Reparto resultante (verificado el 2026-08-12 sobre los 1.343):
--   kilos 875 · repeticiones 401 · segundos 67

-- ── 3. Los planes ya asignados heredan la unidad del catálogo ─────────
-- Los 8 ejercicios que ya estaban en 'segundos' se dejan como están: alguien
-- los puso a mano y esa decisión gana sobre la regla.
update public.plan_ejercicios pe
set unidad = c.unidad
from public.catalogo_ejercicios c
where pe.unidad is distinct from 'segundos'
  and (
    (pe.codigo is not null and pe.codigo <> '' and c.codigo_di = pe.codigo)
    or lower(btrim(pe.nombre)) = lower(btrim(c.nombre_es))
  );

-- Lo que no matcheó contra el catálogo (ejercicios escritos a mano) se
-- resuelve con la misma regla, por nombre.
update public.plan_ejercicios
set unidad = case
    when nombre ~* '(planch|isom|puente|hollow|superman|colgad|colgar|dead hang|l-sit|wall sit|estátic|estatic|sostenid)' then 'segundos'
    else 'kilos'
  end
where unidad = 'reps';

alter table public.plan_ejercicios alter column unidad set default 'kilos';
