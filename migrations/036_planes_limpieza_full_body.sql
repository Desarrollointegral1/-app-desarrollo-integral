-- 2026-08-10 — LIMPIEZA DE PLANES (pedido de Lucas)
--
-- 1) "Ver todos los planes" mostraba 7 filas de `planes_predeterminados`
--    llamadas "(reconstruido)", grupo "Reconstruidos", origen 'catalogo_v2',
--    sembradas el 2026-07-22 por un script de reconstrucción. Están mal de
--    verdad: las 7 tienen el MISMO gif (videos/0405-znQUdHY.gif) para todos
--    sus ejercicios y las descripciones están en castellano neutro ("Siéntate",
--    "Haz una pausa"), o sea de ANTES de que se reescribiera el catálogo en
--    voseo. La pantalla en sí sirve (es el ABM de las plantillas que arma el
--    profe con el Armador): lo que estaba mal era la semilla, así que se borra
--    la semilla, no la pantalla. Los planes ya asignados no se tocan:
--    crearPlanAlumno COPIA la plantilla a alumno_planes.
--
-- 2) Las 12 "Plantillas anteriores" de src/utils/planTemplates.js colapsan en
--    DOS sesiones full body distintas — el resto era la misma lista de
--    ejercicios con otra periodización, y la periodización ya vive en la tabla
--    `periodizaciones` desde el 2026-08-10:
--      · básico   PH001 RO001 PE002 CA001 CA003 JA003 GL003
--        (= "Basico" ⊇ "Acondicionamiento Principiante" = "Fuerza Principiante"
--           ≈ "Prep. Fisica Principiante")
--      · avanzado PH005 RO005 PE002 CA005 JA006 GL007
--        (= "Prep. Fisica Avanzado" = "Fuerza Avanzado" ≈ "Hipertrofia
--           Principiante" = "Hipertrofia Avanzado" ≈ "Acondicionamiento
--           Avanzado" — exactamente lo que dijo Lucas: "tienen los mismos
--           ejercicios y deben ser preparación física avanzada · Full Body")
--    El set avanzado YA era la variante "Bilateral": se la renombra en vez de
--    duplicarla. El básico no existía en `plan_variantes`: se crea.
--    Las dos van con dia_ciclo NULL a propósito — son full body, el mismo día
--    se puede repetir los 3 días de la semana.

-- ── 1. fuera la semilla vieja de "Ver todos los planes" ──────────────────
delete from planes_predeterminados where origen = 'catalogo_v2' and nombre like '%(reconstruido)';

-- ── 2. el set avanzado: "Bilateral" pasa a llamarse como pidió Lucas ─────
update plan_variantes set
  nombre = 'Preparación física avanzada · Full body',
  familia = 'full_body_avanzado',
  descripcion = 'Full body con barra: los seis patrones grandes en una sola sesión (press militar, sentadilla, banca, peso muerto, dominadas y hip thrust) más plancha de cierre. Es la sesión avanzada — la misma que antes aparecía repetida como Prep. Física Avanzado, Fuerza Avanzado e Hipertrofia. Al ser full body se puede asignar el MISMO día los 3 días de la semana; lo que cambia semana a semana son las series, las repeticiones y el porcentaje, que salen de la periodización del alumno.'
where familia = 'bilateral';

-- ── 3. el set básico: la variante que faltaba ────────────────────────────
insert into plan_variantes (estructura_id, nombre, familia, dia_ciclo, orden, descripcion, ejercicios)
select
  (select estructura_id from plan_variantes where estructura_id is not null limit 1),
  'Acondicionamiento físico básico · Full body básico',
  'full_body_basico',
  null,
  0,
  'La sesión de entrada, full body y sin barra: cajón, kettlebell, TRX y banda. Toca los mismos seis patrones que la avanzada pero con la versión más segura de cada uno, para el alumno que recién arranca o vuelve después de un parate. También se puede asignar los 3 días; la progresión la marca la periodización, no el cambio de ejercicios.',
  '[{"patron":"Hombro","catalogo_id":"0405","nombre":"Press militar sentado con mancuernas"},
    {"patron":"Sentadilla","catalogo_id":"3119","nombre":"Levantada de cajón"},
    {"patron":"Pecho","catalogo_id":"0025","nombre":"Press de banca plano con barra"},
    {"patron":"Peso muerto","catalogo_id":"DI-CA001","nombre":"Empuje de cadera con banda"},
    {"patron":"Peso muerto","catalogo_id":"DI-CA003","nombre":"Peso muerto con kettlebell"},
    {"patron":"Espalda","catalogo_id":"0808","nombre":"Remo inclinado en suspensión (TRX)"},
    {"patron":"Glúteo","catalogo_id":"1409","nombre":"Levantada de cadera con peso"}]'::jsonb
where not exists (select 1 from plan_variantes where familia = 'full_body_basico');

-- ── 4. "Unilateral" no tenía explicación y en la pantalla se ve el hueco ──
update plan_variantes set descripcion =
  'Full body a un brazo y una pierna. Mismos patrones, pero cada lado trabaja solo: sirve para emparejar diferencias entre lados y para exigir el equilibrio y el core sin subir el peso. Se puede alternar con la básica o la avanzada, o asignarla los 3 días.'
where familia = 'unilateral' and coalesce(descripcion, '') = '';
