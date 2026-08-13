-- 041 — El peso se guarda en el servidor, y se cierran los días huérfanos — 2026-08-13
--
-- Dos cosas que le hacen perder trabajo al alumno, encontradas en la
-- auditoría del 2026-08-12:
--
-- 1) DOS PESOS CARGADOS CASI JUNTOS SE PISABAN.
--    saveDailyWeight() hacía SELECT del jsonb `pesos` entero, lo modificaba en
--    el celular y lo volvía a escribir completo. El debounce es por casillero
--    (ejercicio:serie), así que dos casilleros cargados con pocos cientos de
--    milisegundos de diferencia lanzaban dos ciclos solapados: el segundo leyó
--    ANTES de que aterrizara el primero y lo pisó. La pantalla seguía
--    mostrando el peso (el estado local ya estaba actualizado), así que el
--    alumno se enteraba recién en el próximo login, si es que se enteraba.
--    Desde acá el merge lo hace la base adentro de UNA transacción con la fila
--    tomada (SELECT ... FOR UPDATE): el orden en que lleguen los pedidos deja
--    de importar. El cliente ya no lee-modifica-escribe: manda una vuelta.
--
-- 2) SEIS EJERCICIOS QUE NO VEÍA NADIE.
--    Un día de plan con alumno_plan_id NULL y sus 6 ejercicios igual: la RLS
--    se los escondía a la alumna (rls_pe_select filtra por alumno_plan_id) y
--    cargarDatos() los descartaba para el admin. Data escrita e invisible.
--    Acá se respaldan y se sacan; el camino que los escribía se cierra en
--    services/supabase.js (_savePlanDias no vuelve a escribir días sueltos si
--    el alumno ya tiene filas en alumno_planes).

-- ── 1. Guardado atómico de una vuelta ─────────────────────────────────
-- SECURITY INVOKER a propósito: corre con la RLS del que llama, así que un
-- alumno sigue pudiendo escribir SOLO su propio registro. No hay escalada.
create or replace function public.guardar_peso_vuelta(
  p_alumno_id    uuid,
  p_fecha        date,
  p_ejercicio_id text,
  p_peso         numeric,
  p_serie        int default null
)
returns jsonb
language plpgsql
security invoker
set search_path to 'public'
as $$
declare
  v_pesos  jsonb;
  v_actual jsonb;
  v_arr    jsonb;
  v_idx    int;
begin
  if p_alumno_id is null or p_fecha is null or coalesce(trim(p_ejercicio_id), '') = '' then
    raise exception 'guardar_peso_vuelta: faltan alumno, fecha o ejercicio';
  end if;

  -- La fila del día puede no existir todavía. El UNIQUE (alumno_id, fecha)
  -- hace que dos primeros pesos simultáneos no creen dos filas ni exploten.
  insert into registros_diarios (alumno_id, fecha, pesos)
  values (p_alumno_id, p_fecha, '{}'::jsonb)
  on conflict (alumno_id, fecha) do nothing;

  -- FOR UPDATE: acá se serializan las escrituras concurrentes. La segunda
  -- espera a la primera y lee lo que la primera ya dejó escrito.
  select coalesce(pesos, '{}'::jsonb) into v_pesos
    from registros_diarios
   where alumno_id = p_alumno_id and fecha = p_fecha
   for update;

  if v_pesos is null then
    -- La RLS no dejó ver ni crear la fila: mejor que el cliente se entere.
    raise exception 'guardar_peso_vuelta: no hay registro para % en %', p_alumno_id, p_fecha;
  end if;

  v_actual := v_pesos -> p_ejercicio_id;

  if p_serie is null then
    -- Formato viejo (un número por ejercicio). Un peso 0 o vacío se ignora,
    -- igual que hacía el cliente.
    if p_peso is null or p_peso <= 0 then
      return v_pesos;
    end if;
    v_pesos := jsonb_set(v_pesos, array[p_ejercicio_id], to_jsonb(p_peso));
  else
    -- Array por vuelta — MISMA semántica que setVuelta() en src/utils/pesos.js:
    -- serie 1-based, se rellena con null hacia adelante, y si no queda ninguna
    -- vuelta cargada el ejercicio se saca del registro en vez de dejar nulls.
    if jsonb_typeof(v_actual) = 'array' then
      v_arr := v_actual;
    elsif jsonb_typeof(v_actual) = 'number' and (v_actual #>> '{}')::numeric > 0 then
      v_arr := jsonb_build_array(v_actual);
    else
      v_arr := '[]'::jsonb;
    end if;

    v_idx := greatest(1, coalesce(p_serie, 1)) - 1;
    while jsonb_array_length(v_arr) <= v_idx loop
      v_arr := v_arr || 'null'::jsonb;
    end loop;

    if p_peso is not null and p_peso > 0 then
      v_arr := jsonb_set(v_arr, array[v_idx::text], to_jsonb(p_peso));
    else
      v_arr := jsonb_set(v_arr, array[v_idx::text], 'null'::jsonb);
    end if;

    if exists (select 1 from jsonb_array_elements(v_arr) x where jsonb_typeof(x) <> 'null') then
      v_pesos := jsonb_set(v_pesos, array[p_ejercicio_id], v_arr);
    else
      v_pesos := v_pesos - p_ejercicio_id;
    end if;
  end if;

  update registros_diarios
     set pesos = v_pesos, updated_at = now()
   where alumno_id = p_alumno_id and fecha = p_fecha;

  return v_pesos;
end;
$$;

comment on function public.guardar_peso_vuelta is
  'Guarda UNA vuelta de UN ejercicio en registros_diarios.pesos haciendo el merge dentro de la transacción (2026-08-13). Reemplaza el select+update del cliente, que perdía pesos cuando dos casilleros se guardaban casi juntos.';

grant execute on function public.guardar_peso_vuelta(uuid, date, text, numeric, int) to authenticated;

-- ── 2. Los 7 registros invisibles de Victoria Itatí ───────────────────
-- Antes de tocar nada, copia de lo que se saca (mismo criterio que los
-- *_backup_20260809). Si mañana resulta que ese día servía, está entero acá.
create table if not exists public.plan_dias_huerfanos_backup_20260813 as
select d.* from public.plan_dias d where d.alumno_plan_id is null
  and exists (select 1 from public.alumno_planes ap where ap.alumno_id = d.alumno_id);

create table if not exists public.plan_ejercicios_huerfanos_backup_20260813 as
select e.* from public.plan_ejercicios e
where e.plan_dia_id in (select id from public.plan_dias_huerfanos_backup_20260813);

alter table public.plan_dias_huerfanos_backup_20260813 enable row level security;
alter table public.plan_ejercicios_huerfanos_backup_20260813 enable row level security;

-- Se borran SOLO los días sueltos de alumnos que YA tienen planes por día:
-- para un alumno sin filas en alumno_planes, un día suelto es su plan real
-- (el sintético "Fijo") y no se toca.
delete from public.plan_dias d
 where d.alumno_plan_id is null
   and exists (select 1 from public.alumno_planes ap where ap.alumno_id = d.alumno_id);
-- plan_ejercicios cae por FK (ON DELETE CASCADE desde plan_dias).
