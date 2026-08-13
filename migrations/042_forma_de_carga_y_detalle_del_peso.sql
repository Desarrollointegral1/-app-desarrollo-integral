-- 042 — El peso se registra por FORMA DE CARGA — 2026-08-13
--
-- Pedido de Lucas: "creo que eso es lo mas importante en la app, el registro
-- de los pesos, el registro de cuanta evolucion la persona hizo con sus pesos".
--
-- EL PROBLEMA: la app pedía "kilos" y no decía de qué. Con dos mancuernas de
-- 10, un alumno anotaba 10 y otro 20. Con dos discos de 5 por lado en el
-- press, uno anotaba 5, otro 10 y otro 30. La evolución venía comparando
-- números que no medían lo mismo — o sea, no medía nada.
--
-- LA REGLA APROBADA: el alumno anota lo que ve, la app hace la cuenta.
-- Textual, sobre el press: "que cuando haga pecho plano sepa que tiene que
-- poner el peso que uso de cada lado mas la barra el peso que tenga, por
-- ejemplo 5 + 20 + 5 igual a 30 kilos". Y sobre la banda: "en banda elastica
-- contemos por repeticiones nada mas".
--
-- Tres cosas acá:
--   1. el EQUIPAMIENTO viaja del catálogo al plan (como ya viaja `unidad`),
--      porque de ahí sale la forma de carga — no se carga a mano ejercicio
--      por ejercicio;
--   2. el registro guarda LAS DOS COSAS: el total (para la evolución) y el
--      detalle (barra 20 + 5 por lado), para que la próxima sesión sepa qué
--      cargar;
--   3. los pesos SUGERIDOS (barras, discos, mancuernas) quedan en app_config,
--      editables por Lucas — la misma tabla y el mismo patrón que ya usan la
--      movilidad y la entrada en calor.
--
-- OJO CON EL PUNTO 3: NO es un inventario. Corrección textual de Lucas el
-- mismo día: "no puede basarse en lo que tengo porque trabajamos en distintos
-- gimnasios". Son los BOTONES que el alumno ve para tocar rápido; el peso que
-- no esté en la lista se escribe a mano en el momento, sin pasar por ninguna
-- pantalla de configuración (ver src/components/SelectorCarga.jsx). Si esta
-- lista fuera el único camino, le mentiría a la mitad de los alumnos.
--
-- COMPATIBILIDAD: nada migra ni se reescribe. Lo ya registrado es un número
-- suelto en `pesos` y se sigue leyendo igual; `pesos_detalle` arranca vacío y
-- significa exactamente eso — "no sabemos de qué está hecho este número".

-- ── 1. El equipamiento viaja al plan ──────────────────────────────────
alter table public.plan_ejercicios
  add column if not exists equipamiento text;

comment on column public.plan_ejercicios.equipamiento is
  'El equipment_es del catálogo (Barra · Mancuerna · Polea · Peso corporal…). De acá sale la FORMA DE CARGA: qué número anota el alumno y qué cuenta hace la app (2026-08-13, ver src/utils/carga.js).';

-- Backfill: los ejercicios que ya están en planes heredan el equipamiento del
-- catálogo. Se cruza por código primero (es el id real del catálogo) y por
-- nombre después, que es como se cruzan hoy el GIF y la unidad.
update public.plan_ejercicios pe
   set equipamiento = c.equipment_es
  from public.catalogo_ejercicios c
 where pe.equipamiento is null
   and pe.codigo is not null
   and c.codigo_di = pe.codigo
   and coalesce(c.equipment_es, '') <> '';

update public.plan_ejercicios pe
   set equipamiento = c.equipment_es
  from public.catalogo_ejercicios c
 where pe.equipamiento is null
   and lower(trim(c.nombre_es)) = lower(trim(pe.nombre))
   and coalesce(c.equipment_es, '') <> '';

-- ── 2. El detalle del peso ────────────────────────────────────────────
-- Mismo formato que `pesos`, en paralelo: { ejercicio_id: [detalle_vuelta_1,
-- detalle_vuelta_2, …] }. Cada detalle es un objeto chico
-- ({"forma":"barra","barra":20,"discos":[5]}) y null donde no se sepa.
alter table public.registros_diarios
  add column if not exists pesos_detalle jsonb not null default '{}'::jsonb;

comment on column public.registros_diarios.pesos_detalle is
  'De qué está hecho cada peso de `pesos`: barra + discos por lado, cuántas mancuernas, lastre. Misma forma que `pesos` (una entrada por vuelta). Vacío = registro viejo, del que solo sabemos el total (2026-08-13).';

-- ── 3. Guardado atómico del total Y del detalle ───────────────────────
-- Extiende guardar_peso_vuelta (migración 041) con el detalle. Se mantiene la
-- MISMA garantía: el merge lo hace la base adentro de la transacción con la
-- fila tomada, así que dos casilleros guardados casi juntos no se pisan.
create or replace function public.guardar_peso_vuelta(
  p_alumno_id    uuid,
  p_fecha        date,
  p_ejercicio_id text,
  p_peso         numeric,
  p_serie        int,
  p_detalle      jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path to 'public'
as $$
declare
  v_pesos   jsonb;
  v_det     jsonb;
  v_actual  jsonb;
  v_arr     jsonb;
  v_arrd    jsonb;
  v_idx     int;
begin
  if p_alumno_id is null or p_fecha is null or coalesce(trim(p_ejercicio_id), '') = '' then
    raise exception 'guardar_peso_vuelta: faltan alumno, fecha o ejercicio';
  end if;

  insert into registros_diarios (alumno_id, fecha, pesos)
  values (p_alumno_id, p_fecha, '{}'::jsonb)
  on conflict (alumno_id, fecha) do nothing;

  select coalesce(pesos, '{}'::jsonb), coalesce(pesos_detalle, '{}'::jsonb)
    into v_pesos, v_det
    from registros_diarios
   where alumno_id = p_alumno_id and fecha = p_fecha
   for update;

  if v_pesos is null then
    raise exception 'guardar_peso_vuelta: no hay registro para % en %', p_alumno_id, p_fecha;
  end if;

  v_actual := v_pesos -> p_ejercicio_id;

  if p_serie is null then
    if p_peso is null or p_peso <= 0 then
      return v_pesos;
    end if;
    v_pesos := jsonb_set(v_pesos, array[p_ejercicio_id], to_jsonb(p_peso));
    if p_detalle is not null then
      v_det := jsonb_set(v_det, array[p_ejercicio_id], jsonb_build_array(p_detalle), true);
    end if;
  else
    if jsonb_typeof(v_actual) = 'array' then
      v_arr := v_actual;
    elsif jsonb_typeof(v_actual) = 'number' and (v_actual #>> '{}')::numeric > 0 then
      v_arr := jsonb_build_array(v_actual);
    else
      v_arr := '[]'::jsonb;
    end if;

    v_arrd := v_det -> p_ejercicio_id;
    if jsonb_typeof(v_arrd) <> 'array' then v_arrd := '[]'::jsonb; end if;

    v_idx := greatest(1, coalesce(p_serie, 1)) - 1;
    while jsonb_array_length(v_arr)  <= v_idx loop v_arr  := v_arr  || 'null'::jsonb; end loop;
    while jsonb_array_length(v_arrd) <= v_idx loop v_arrd := v_arrd || 'null'::jsonb; end loop;

    if p_peso is not null and p_peso > 0 then
      v_arr := jsonb_set(v_arr, array[v_idx::text], to_jsonb(p_peso));
      -- El detalle solo se escribe si vino. Un guardado sin detalle (el
      -- stepper de siempre, o una app vieja todavía abierta en un celular)
      -- NO borra el detalle que ya estaba: borrarlo perdería la única
      -- explicación de ese número.
      if p_detalle is not null then
        v_arrd := jsonb_set(v_arrd, array[v_idx::text], p_detalle);
      end if;
    else
      v_arr  := jsonb_set(v_arr,  array[v_idx::text], 'null'::jsonb);
      v_arrd := jsonb_set(v_arrd, array[v_idx::text], 'null'::jsonb);
    end if;

    if exists (select 1 from jsonb_array_elements(v_arr) x where jsonb_typeof(x) <> 'null') then
      v_pesos := jsonb_set(v_pesos, array[p_ejercicio_id], v_arr);
      if exists (select 1 from jsonb_array_elements(v_arrd) x where jsonb_typeof(x) <> 'null') then
        v_det := jsonb_set(v_det, array[p_ejercicio_id], v_arrd, true);
      else
        v_det := v_det - p_ejercicio_id;
      end if;
    else
      v_pesos := v_pesos - p_ejercicio_id;
      v_det   := v_det   - p_ejercicio_id;
    end if;
  end if;

  update registros_diarios
     set pesos = v_pesos, pesos_detalle = v_det, updated_at = now()
   where alumno_id = p_alumno_id and fecha = p_fecha;

  return v_pesos;
end;
$$;

comment on function public.guardar_peso_vuelta(uuid, date, text, numeric, int, jsonb) is
  'Guarda el total Y el detalle de UNA vuelta haciendo el merge dentro de la transacción (2026-08-13). Extiende la versión de la migración 041 con `pesos_detalle`.';

-- La firma de 5 argumentos (migración 041) sobrevive como envoltorio: un
-- celular con la app vieja todavía abierta la sigue llamando y tiene que
-- seguir guardando. Delega en la nueva sin detalle.
create or replace function public.guardar_peso_vuelta(
  p_alumno_id    uuid,
  p_fecha        date,
  p_ejercicio_id text,
  p_peso         numeric,
  p_serie        int default null
)
returns jsonb
language sql
security invoker
set search_path to 'public'
as $$
  select public.guardar_peso_vuelta(p_alumno_id, p_fecha, p_ejercicio_id, p_peso, p_serie, null::jsonb);
$$;

grant execute on function public.guardar_peso_vuelta(uuid, date, text, numeric, int) to authenticated;
grant execute on function public.guardar_peso_vuelta(uuid, date, text, numeric, int, jsonb) to authenticated;

-- ── 4. Los pesos SUGERIDOS, editables por Lucas ──────────────────────
-- Textual: "tenemos distintas barras, de 20, de 18, de 11, Barra Olimpica
-- Romana Rulemanes, barra-ez-olimpica, eso tiene que poder modificarse,
-- predeterminado 20 y poder bajar o subir".
--
-- Va en app_config, la MISMA tabla donde ya viven la movilidad y la entrada en
-- calor (claves prep_*), y se edita con el mismo patrón: pantalla en la
-- Biblioteca, borrador en memoria, "GUARDAR". No se creó ninguna tabla nueva.
--
-- QUÉ ES DATO REAL Y QUÉ NO:
--   · las 5 barras y los 7 discos: los nombró Lucas;
--   · el PESO de la romana a rulemanes y de la EZ olímpica: NO lo dio, quedan
--     con "confirmar": true — un punto de partida, no un dato, y la pantalla
--     de edición los muestra marcados hasta que él los confirme;
--   · mancuernas y kettlebells: tampoco los dio, van los estándar de gimnasio
--     y se ajustan desde la misma pantalla.
insert into public.app_config (clave, valor)
values ('equipamiento', jsonb_build_object(
  'barras', jsonb_build_array(
    jsonb_build_object('id','b20','nombre','Barra de 20','peso',20),
    jsonb_build_object('id','b18','nombre','Barra de 18','peso',18),
    jsonb_build_object('id','b11','nombre','Barra de 11','peso',11),
    jsonb_build_object('id','romana','nombre','Barra olímpica romana a rulemanes','peso',20,'confirmar',true),
    jsonb_build_object('id','ez','nombre','Barra EZ olímpica','peso',10,'confirmar',true)
  ),
  -- DATO REAL de la sala, textual de Lucas: "los discos son de 1.25, 2.5, 5,
  -- 10, 15, 20 y 25". Siete, no seis: el de 25 no está en el juego estándar.
  'discos',      jsonb_build_array(1.25, 2.5, 5, 10, 15, 20, 25),
  'mancuernas',  jsonb_build_array(2,3,4,5,6,7,8,9,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40),
  'kettlebells', jsonb_build_array(4,6,8,10,12,16,20,24,28,32)
))
on conflict (clave) do nothing;
