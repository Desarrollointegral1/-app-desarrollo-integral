import { mk, uid } from "./helpers.js";

// ═══════════════════════════════════════════════════════════════════════
// CEREBRO CENTRAL DE PLANES — Desarrollo Integral
// Todos los planes siguen la misma estructura:
//   1. Movilidad
//   2. Entrada en calor con banda
//   2.1 Entrada en calor con peso (disco / mancuerna / katana)
//   3. Ejercicios principales
// Las rutinas viven acá como bloques reutilizables; las PLANTILLAS los
// combinan. Para asignar a un alumno SIEMPRE usar clonarPlan() (ids nuevos).
// ═══════════════════════════════════════════════════════════════════════

export const PERIODIZACION_BASE=[{semana:1,series:2,reps:6,intensidad:"70%"},{semana:2,series:3,reps:6,intensidad:"75%"},{semana:3,series:2,reps:8,intensidad:"80%"},{semana:4,series:3,reps:8,intensidad:"80%"},{semana:5,series:2,reps:4,intensidad:"85%"},{semana:6,series:3,reps:4,intensidad:"85%"},{semana:7,series:2,reps:6,intensidad:"70%"},{semana:8,series:3,reps:6,intensidad:"75%"}];

// ── 1. RUTINAS DE MOVILIDAD ────────────────────────────────────────────
// CONTENIDO OFICIAL (lista de Lucas, ronda 9 — 2026-07-20). La movilidad
// "Completa" del alumno = piso y sentado + cuadrupedia + dinámica.

// Rutina 1 — piso y sentado
export const MOVILIDAD_PISO_SENTADO=[
  mk("Elevación de pierna (isquiotibiales)","Acostado, agarrá detrás de la rodilla, estirá la pierna y bajá."),
  mk("Estiramiento glúteo cruzado","Cruzá un pie sobre la otra pierna. Tirá del pie y empujá la rodilla hacia afuera."),
  mk("Puente de glúteos","Pies apoyados. Levantá la cadera y bajá lento."),
  mk("Estiramiento figura 4 (glúteo)","Tobillo sobre rodilla. Traé la pierna hacia el pecho."),
  mk("Flexión adelante sentado (una pierna)","Una pierna estirada. Inclinate hacia el pie."),
  mk("Mariposa (plantas juntas)","Juntá plantas de los pies. Espalda recta."),
  mk("Mariposa con inclinación","Desde ahí, inclinate hacia adelante."),
  mk("Apertura de piernas sentado","Piernas abiertas. Inclinate levemente adelante."),
  mk("90/90 cadera (rotación)","En 90/90, incliná el torso adelante y luego atrás."),
  mk("Apoyo atrás y apertura de pecho","Manos atrás. Abrí el pecho y mirá arriba."),
  mk("Rotación de cadera sentado","Llevá una rodilla hacia el talón contrario. Alternar."),
  mk("Elevación de piernas sentado","Elevá una pierna y luego la otra."),
  mk("Elevación asistida (detrás de rodillas)","Tomá detrás de rodillas y elevá alternando."),
];

// Rutina 2 — cuadrupedia
export const MOVILIDAD_CUADRUPEDIA=[
  mk("Gato–vaca (columna)","Redondeá la espalda y luego abrila."),
  mk("Superman en cuadrupedia","Estirá brazo y pierna opuestos."),
  mk("Rotación torácica con pierna extendida","Pasá el brazo por debajo y abrí hacia arriba."),
  mk("Postura del niño (atrás)","Llevá la cadera a los talones."),
  mk("Postura del niño lateral","Caminá manos a un lado."),
];

// Rutina 3 — dinámica
export const MOVILIDAD_DINAMICA=[
  mk("Estocada al frente (cadera)","Pie adelante. Empujá la cadera hacia adelante."),
  mk("Estocada con estiramiento atrás","Estirá la pierna de atrás y bajá la cadera."),
  mk("Estocada a isquiotibiales","Cadera atrás, estirá la pierna de adelante."),
  mk("Rana (aductores)","Rodillas abiertas. Llevá la cadera atrás."),
  mk("Extensión en rana (columna)","Bajá el ombligo y levantá el pecho."),
  mk("Esfinge (boca abajo)","Apoyado en codos. Abrí el pecho."),
  mk("Cobra (extensión lumbar)","Empujá con manos y elevá el pecho."),
  mk("Nado boca abajo (brazos alternados)","Alterná brazos sin tocar el piso."),
];

// Movilidad COMPLETA = las tres rutinas oficiales en orden.
export const MOVILIDAD_COMPLETA=[
  ...MOVILIDAD_PISO_SENTADO,
  ...MOVILIDAD_CUADRUPEDIA,
  ...MOVILIDAD_DINAMICA,
];

// Compatibilidad: MOVILIDAD_BASE es lo que los planes asignan como movilidad
// del alumno — ahora apunta al contenido oficial completo.
export const MOVILIDAD_BASE=MOVILIDAD_COMPLETA;

// Versión CORTA (~8 min): subset balanceado de las tres rutinas oficiales.
export const MOVILIDAD_CORTA=[
  mk("Elevación de pierna (isquiotibiales)","Acostado, agarrá detrás de la rodilla, estirá la pierna y bajá."),
  mk("Estiramiento figura 4 (glúteo)","Tobillo sobre rodilla. Traé la pierna hacia el pecho."),
  mk("Puente de glúteos","Pies apoyados. Levantá la cadera y bajá lento."),
  mk("Mariposa (plantas juntas)","Juntá plantas de los pies. Espalda recta."),
  mk("90/90 cadera (rotación)","En 90/90, incliná el torso adelante y luego atrás."),
  mk("Gato–vaca (columna)","Redondeá la espalda y luego abrila."),
  mk("Postura del niño (atrás)","Llevá la cadera a los talones."),
  mk("Estocada al frente (cadera)","Pie adelante. Empujá la cadera hacia adelante."),
  mk("Estocada a isquiotibiales","Cadera atrás, estirá la pierna de adelante."),
  mk("Cobra (extensión lumbar)","Empujá con manos y elevá el pecho."),
];

// Rutina 4 — articulaciones y general
export const MOVILIDAD_ARTICULACIONES=[
  mk("Rotacion de tobillo","Apoyado en un pie, gira el otro tobillo hacia afuera y hacia adentro."),
  mk("Rotacion de rodillas","Con las manos en las rodillas, gira ambas hacia un lado y hacia el otro."),
  mk("Rotacion de rodillas alternada","Move una rodilla a cada lado, alternando."),
  mk("Circulos de cadera","Hace circulos con la cadera hacia un lado y hacia el otro."),
  mk("Bisagra de cadera","Con la espalda recta, lleva la cadera atras y volve."),
  mk("Circulos de hombros","Con los brazos abiertos, gira los hombros hacia adelante y hacia atras."),
  mk("Circulos de munecas","Gira las manos hacia adentro y hacia afuera."),
  mk("Movilidad de cuello","Lleva la cabeza a un lado y al otro, y hace circulos suaves."),
  mk("Flexion y extension de codos","Estira y dobla los codos de forma controlada."),
  mk("Elevacion de brazos","Subi los brazos arriba de la cabeza y bajalos."),
  mk("Elevacion de rodilla con apertura","Eleva una rodilla y abrila hacia afuera. Baja y cambia de lado."),
];

// ── 2. ENTRADA EN CALOR CON ELÁSTICO (Act. Elástico) ───────────────────
// CONTENIDO OFICIAL (lista de Lucas, ronda 9 — 2026-07-20).

export const CALOR_BANDA=[
  mk("Pasadas con banda (hombros)","Banda arriba y atrás con brazos estirados."),
  mk("Rotación interna con banda (codo al cuerpo)","Codo pegado. Llevá la mano al abdomen."),
  mk("Remo con banda (doble)","Tirá hacia el torso con ambas manos."),
  mk("Remo con palo (codos atrás)","Llevá codos atrás con el palo."),
  mk("Retracción escapular con palo","Juntá escápulas con el palo en la cintura."),
  mk("Jalón con banda (desde arriba)","Tirá la banda hacia abajo."),
  mk("Movilidad de tobillo (pie elevado, avance)","Avanzá la rodilla sobre el pie elevado."),
];

// Compatibilidad: los planes viejos (bilateral/unilateral) referenciaban
// CALOR_BASE — ahora es el mismo contenido oficial con elástico.
export const CALOR_BASE=CALOR_BANDA;

// ── 2.1 ENTRADA EN CALOR CON PESO (disco / mancuerna / katana) ─────────

export const ACTIVACION_BASE=[
  mk("Rotacion con disco","Caderas fijas, giro de torso con disco."),
  mk("Buenos dias con disco","Torso adelante, espalda recta, disco al pecho."),
  mk("Jalon con mancuerna","Mancuerna sobre la cabeza, baja activando dorsal."),
  mk("Remo con disco","Codo hacia atras, activa dorsal."),
  mk("Peso muerto a una pierna sin peso","Foco en equilibrio y bisagra de cadera."),
  mk("Sentadilla bulgara sin peso","Pie trasero elevado, baja controlado."),
];

export const CALOR_PESO=[
  mk("Vuelta al mundo con disco","Sostene el disco al frente y rodea la cabeza pasandolo por arriba y atras."),
  mk("Remo con disco","Inclina el torso y tira el disco hacia el abdomen."),
  mk("Buenos dias con disco","Con el disco en el pecho, lleva la cadera atras y volve (bisagra de cadera)."),
  mk("Press arriba con disco","Con el disco en el pecho, empuja hacia arriba hasta estirar los brazos."),
  mk("Katana sobre la cabeza","Sostene la katana arriba y mantene el control del tronco."),
  mk("Paso al frente con katana","De pie, hace un paso hacia adelante llevando la katana hacia adelante."),
];

export const CALOR_MANCUERNA=[
  mk("Rotacion con mancuerna","Mancuerna detras del cuello, rota el tronco de lado a lado."),
  mk("Buenos dias con mancuerna","Flexion de cadera con espalda recta, mancuerna al pecho."),
  mk("Remo con mancuerna","Remo inclinado, espalda recta, codo hacia atras."),
  mk("Peso muerto a 1 pierna","Foco en equilibrio, bisagra de cadera, espalda recta."),
];

// ── 3. EJERCICIOS PRINCIPALES — TAXONOMÍA POR GRUPO MUSCULAR ───────────
// (Lucas, 2026-07-21.) Cada ejercicio principal pertenece a UN grupo
// muscular/patrón y tiene un código estable "prefijo + número de 3 dígitos".
// El número DENTRO del grupo es la progresión de dificultad (001 = el más
// fácil): los planes básicos usan los primeros de cada grupo, los avanzados
// los últimos. Fuente de verdad: esta lista ↔ biblioteca_ejercicios (codigo,
// grupo) ↔ Cerebro/desarrollo-integral/entrenamiento/CEREBRO-DE-PLANES.md.
//
// Punto 7 (confirmado, ronda 2026-07-21): este archivo sigue siendo el
// ÚNICO lugar donde vive el criterio de códigos (letra(s) de prefijo =
// grupo muscular ↔ GRUPOS_MUSCULARES de acá abajo; número = dificultad
// creciente). El criterio de 2 letras por grupo (PH/RO/PE/CA/JA/GL/CO) se
// mantiene sin cambios — no se pidió pasar a 1 letra. Lo nuevo del punto 5
// es que el código de cada ejercicio del CATÁLOGO (catalogo_ejercicios.
// codigo_di) ahora es editable a mano desde la Biblioteca (con validación
// de duplicado, ver CatalogoExplorer.jsx/validarCodigoDisponible en
// services/supabase.js) — la numeración de acá sigue siendo el punto de
// partida/referencia, pero el código real de un ejercicio puntual puede
// haber sido corregido a mano después.


export const GRUPOS_MUSCULARES=[
  { id:"hombro",  prefijo:"PH", nombre:"Hombro" },
  { id:"rodilla", prefijo:"RO", nombre:"Predominante de rodilla" },
  { id:"pecho",   prefijo:"PE", nombre:"Pecho" },
  { id:"cadera",  prefijo:"CA", nombre:"Predominante de cadera" },
  { id:"jalon",   prefijo:"JA", nombre:"Dorsales — Jalón" },
  { id:"gluteo",  prefijo:"GL", nombre:"Glúteo (puente / hip thrust)" },
  { id:"core",    prefijo:"CO", nombre:"Core" },
];

// unidad: "reps" (default) o "segundos" — la Plancha (CO004) se mide SIEMPRE
// en segundos, nunca en repeticiones.
const T=(codigo,grupo,nombre,desc,unidad)=>({codigo,grupo,nombre,desc,unidad:unidad||"reps"});
export const EJERCICIOS_PRINCIPALES=[
  // HOMBRO — de más fácil a más difícil
  T("PH001","hombro","Press Militar sentado con Mancuernas","Sentado, mancuernas a la altura de los hombros. Empujá hacia arriba con control y bajá lento."),
  T("PH002","hombro","Press Militar sentado con Mancuernas unilateral","Sentado, una mancuerna a la altura del hombro. Empujá hacia arriba de a un brazo, con el tronco firme."),
  T("PH003","hombro","Press Militar parado con Mancuernas","De pie, mancuernas a la altura de los hombros. Empujá hacia arriba sin arquear la espalda."),
  T("PH004","hombro","Press Militar parado con Mancuernas unilateral","De pie, una mancuerna al hombro. Empujá hacia arriba con el core activo para no ladearte."),
  T("PH005","hombro","Press Militar parado con Barra","De pie, barra a la altura de las clavículas. Empujá hacia arriba hasta estirar los brazos, sin arquear la zona lumbar."),
  T("PH006","hombro","Press Militar parado con Barra con split","Con un pie adelante y otro atrás (split), empujá la barra sobre la cabeza. La base te da estabilidad."),
  T("PH007","hombro","Press con Landmine","Con la barra anclada al piso (landmine), empujá el extremo hacia arriba y adelante con las dos manos."),
  T("PH008","hombro","Press con Landmine unilateral estricto","Landmine con una mano: empujá el extremo de la barra hacia arriba sin impulso, con el tronco firme."),
  T("PH009","hombro","Press con Landmine unilateral con split","Landmine con una mano y pies en split: empujá hacia arriba y adelante coordinando todo el cuerpo."),
  // PREDOMINANTE DE RODILLA
  T("RO001","rodilla","Levantada de cajon","Sentate y parate de un cajón a la altura de la rodilla, sin usar las manos. Bajá controlado hacia atrás."),
  T("RO002","rodilla","Sentadilla con TRX","Agarrado del TRX, bajá a la sentadilla usando las manos como ayuda y subí empujando el piso."),
  T("RO003","rodilla","Sentadilla con peso adelante","Con el peso al pecho (goblet), bajá con la espalda recta y los codos entre las rodillas."),
  T("RO004","rodilla","Sentadilla con barra adelante","Barra apoyada adelante, sobre los hombros. Bajá manteniendo el torso lo más vertical posible."),
  T("RO005","rodilla","Sentadilla con barra","Barra sobre la espalda. Bajá llevando la cadera atrás y doblando rodillas. Subí empujando el piso."),
  T("RO006","rodilla","Sentadilla con Trapbar","Adentro de la trapbar, bajá como en sentadilla con el pecho alto y subí empujando fuerte con las piernas."),
  T("RO007","rodilla","Zancada","Paso largo al frente, rodilla hacia afuera. Bajá controlado y volvé empujando con la pierna de adelante."),
  T("RO008","rodilla","Sentadilla Bulgara","Pie trasero elevado en un banco. Bajá controlado con el peso en la pierna de adelante."),
  T("RO009","rodilla","Subidas al cajon unilateral","Subí al cajón empujando con una sola pierna, sin impulsarte con la de abajo. Bajá lento."),
  // PECHO
  T("PE001","pecho","Flexiones en oblicuo","Manos apoyadas en un banco o superficie elevada. Bajá el pecho a la superficie y empujá."),
  T("PE002","pecho","Pecho plano","Acostado en banco plano, bajá la barra al pecho y empujá hacia arriba."),
  T("PE003","pecho","Pecho con Mancuernas","Acostado en banco plano con mancuernas. Bajá con control a los costados del pecho y empujá hacia arriba."),
  T("PE004","pecho","Pecho inclinado con mancuerna","Banco a 30-45°. Bajá las mancuernas con los codos controlados y empujá sin bloquear."),
  T("PE005","pecho","Pecho inclinado con barra","Banco a 30-45°. Bajá la barra a la parte alta del pecho y empujá hacia arriba."),
  // PREDOMINANTE DE CADERA (bisagra / peso muerto)
  T("CA001","cadera","Empuje de cadera con elastico","Banda en la cadera anclada atrás. Empujá la cadera hacia adelante y apretá glúteos. Volvé con control."),
  T("CA002","cadera","Peso muerto paloma","Parado en una pierna y sin peso, llevá el torso adelante y la pierna libre atrás (bisagra). Volvé sin perder el equilibrio."),
  T("CA003","cadera","Peso muerto con KB","Con la pesa rusa al frente, empujá la cadera atrás y bajá; volvé llevando la cadera adelante."),
  T("CA004","cadera","Peso muerto sumo con KB","Pies bien abiertos y puntas hacia afuera, la pesa entre las piernas. Bajá con la espalda recta y subí apretando glúteos."),
  T("CA005","cadera","Peso muerto con Barra","Barra cerca de las piernas. Empujá la cadera atrás, bajá con la espalda recta y subí llevando la cadera adelante."),
  T("CA006","cadera","Peso muerto con Trapbar","Adentro de la trapbar, agarrá las manijas y levantá empujando el piso, con la espalda firme."),
  T("CA007","cadera","Peso muerto a una pierna","Parado en una pierna con peso en la mano. Bisagra de cadera: torso adelante, pierna libre atrás. Foco en el equilibrio."),
  // DORSALES — JALÓN
  T("JA001","jalon","Jalon con elastico","Banda anclada arriba. Tirá hacia abajo con los dos brazos llevando los codos al torso."),
  T("JA002","jalon","Jalon con elastico unilateral","Banda anclada arriba. Tirá hacia abajo con un solo brazo, activando el dorsal."),
  T("JA003","jalon","Jalon con TRX parado Inclinado","Cuerpo inclinado agarrado del TRX. Tirá llevando el pecho a las manos y bajá lento."),
  T("JA004","jalon","Jalón unilateral con mancuerna","También conocido como remo a una mano: trabaja el dorsal ancho y corrige desequilibrios entre lados. Rodilla y mano contraria apoyadas en un banco plano, pierna del lado que trabaja firme en el suelo, espalda recta y cabeza alineada. Brazo extendido hacia el suelo, dejando descender el hombro para estirar el dorsal. Elevá la mancuerna traccionando desde el hombro, llevando el codo hacia el bolsillo sin separarlo del cuerpo. Bajá lento y controlado, manteniendo la tensión."),
  T("JA005","jalon","Jalon con TRX Vertical","Colgado del TRX casi vertical, tirá del cuerpo hacia arriba llevando los codos atrás."),
  T("JA006","jalon","Dominadas","Colgado de la barra, tirá del cuerpo hacia arriba hasta pasar la barbilla. Bajá controlado."),
  // GLÚTEO (puente / hip thrust)
  T("GL001","gluteo","Levantada de cadera","Acostado con los pies apoyados. Elevá la cadera apretando glúteos y bajá lento."),
  T("GL002","gluteo","Levantada de cadera con elastico entre rodillas","Igual que la levantada de cadera, con una banda entre las rodillas: empujá hacia afuera mientras subís."),
  T("GL003","gluteo","Levantada de cadera con peso","Acostado, peso sobre la cadera. Elevá la cadera y bajá controlado."),
  T("GL004","gluteo","Levantada de cadera unilateral con peso","Con una pierna apoyada y la otra libre, peso sobre la cadera. Empujá con el talón y elevá."),
  T("GL005","gluteo","Hip thrust","Espalda apoyada en un banco. Elevá la cadera hasta alinear rodillas, cadera y hombros. Apretá glúteos arriba."),
  T("GL006","gluteo","Hip thrust con peso","Espalda apoyada en un banco, peso sobre la cadera. Elevá la cadera y apretá glúteos arriba."),
  T("GL007","gluteo","Hip thrust con barra","Espalda en el banco, barra sobre la cadera. Elevá hasta la extensión completa y bajá con control."),
  // CORE
  T("CO001","core","DeadBug","Acostado boca arriba, brazos y rodillas al techo. Estirá brazo y pierna opuestos sin despegar la zona lumbar."),
  T("CO002","core","Superman","Boca abajo, elevá brazos y piernas al mismo tiempo apretando la espalda. Bajá lento."),
  T("CO003","core","Crunch abdominal","Acostado, subí el torso despacio sin tirar del cuello y bajá controlado."),
  T("CO004","core","Plancha","Antebrazos y puntas de pie apoyados, cuerpo en línea recta. Sostené la posición el tiempo indicado, sin dejar caer la cadera.","segundos"),
  T("CO005","core","Ruedita","De rodillas con la rueda al frente. Rodá hacia adelante manteniendo el core firme y volvé."),
  T("CO006","core","Ham Roller","Parado con la rueda abdominal al frente, pies a la altura de los hombros: hacé rodar el rodillo hacia adelante controlando el core, hasta el máximo estiramiento posible, y volvé a la posición inicial."),
  T("CO007","core","Landmine core rotation","De pie con la barra anclada (landmine), llevá el extremo de lado a lado rotando el tronco con los brazos estirados."),
];

const _taxPorCodigo=Object.fromEntries(EJERCICIOS_PRINCIPALES.map((e)=>[e.codigo,e]));
// px("PH001") → instancia fresca (id nuevo) del ejercicio de la taxonomía.
const px=(codigo)=>{
  const t=_taxPorCodigo[codigo];
  return {id:uid(),nombre:t.nombre,desc:t.desc,codigo:t.codigo,unidad:t.unidad,video:"",mediaLocal:"",historial:[]};
};

// CONTENIDO OFICIAL — plan de entrada: los primeros niveles de cada grupo.
export const PRINCIPALES_BASICO=()=>[
  px("PH001"), // Press Militar sentado con Mancuernas
  px("RO001"), // Levantada de cajon
  px("PE002"), // Pecho plano
  px("CA001"), // Empuje de cadera con elastico
  px("CA003"), // Peso muerto con KB
  px("JA003"), // Jalon con TRX parado Inclinado
  px("GL003"), // Levantada de cadera con peso
];

// Principales unificados Bilateral (= ex plan Complejo): los niveles altos
// de cada grupo, todo con barra.
export const PRINCIPALES_BILATERAL=()=>[
  px("PH005"), // Press Militar parado con Barra
  px("RO005"), // Sentadilla con barra
  px("PE002"), // Pecho plano
  px("CA005"), // Peso muerto con Barra
  px("JA006"), // Dominadas
  px("GL007"), // Hip thrust con barra
];

// ── PLANES CLÁSICOS (compatibilidad) ───────────────────────────────────

export const PLAN_BILATERAL={
  periodizacion:PERIODIZACION_BASE,movilidad:MOVILIDAD_BASE,calor:CALOR_BASE,activacion:ACTIVACION_BASE,
  dias:[{dia:"Sesion",subtitulo:"Ejercicios principales — Bilateral",ejercicios:PRINCIPALES_BILATERAL()}]
};

export const PLAN_UNILATERAL={
  periodizacion:PERIODIZACION_BASE,movilidad:MOVILIDAD_BASE,calor:CALOR_BASE,activacion:ACTIVACION_BASE,
  dias:[{dia:"Sesion",subtitulo:"Ejercicios principales — Unilateral",ejercicios:[
    px("PH004"), // Press Militar parado con Mancuernas unilateral
    px("RO007"), // Zancada
    px("PE004"), // Pecho inclinado con mancuerna
    px("CA007"), // Peso muerto a una pierna
    px("JA004"), // Jalon unilateral con mancuerna
    px("GL004"), // Levantada de cadera unilateral con peso
  ]}]
};

export const PLAN_BASE=PLAN_BILATERAL;

// ── PLANES NUEVOS ──────────────────────────────────────────────────────

export const PLAN_BASICO={
  periodizacion:PERIODIZACION_BASE,movilidad:MOVILIDAD_BASE,calor:CALOR_BANDA,activacion:CALOR_PESO,
  dias:[{dia:"Sesion",subtitulo:"Ejercicios principales — Basico",ejercicios:PRINCIPALES_BASICO()}]
};

// ── PROGRESIONES POR OBJETIVO — ELIMINADAS EL 2026-08-10 ────────────────
// Eran 9 planes (Acondicionamiento/Prep. Física/Hipertrofia/Fuerza ×
// principiante/avanzado + PPL). Se fueron porque, mirando los EJERCICIOS y no
// los nombres, todos eran una de estas dos sesiones full body:
//   · PH001 RO001 PE002 CA003 JA003 GL003  → acond-principiante, fuerza-
//     principiante (idénticos) y pf-principiante (cambia solo RO005)
//   · PH005/PH001 RO005 PE002 CA005 JA006 GL007 → pf-avanzado, fuerza-avanzado,
//     hipertrofia-principiante e hipertrofia-avanzado (Lucas lo dijo textual:
//     "tienen los mismos ejercicios y deben ser preparación física avanzada")
// Lo único que los diferenciaba de verdad era la periodización (series/reps/%),
// y eso desde el 2026-08-10 vive en la tabla `periodizaciones`, editable desde
// la Biblioteca — no hardcodeado acá. Las dos sesiones quedaron como variantes
// en `plan_variantes` (migración 036), con su explicación y asignables por día.
// El PPL también salió: las 3 filas de la familia `ppl` lo cubren mejor (el de
// acá inventaba ejercicios sueltos con mkEj, fuera del catálogo).

// ── PLANTILLAS ──────────────────────────────────────────────────────────
// 2026-08-10: de 12 quedaron 3, y su ÚNICO trabajo hoy es el plan inicial al
// crear un alumno (App.jsx: el select por día del formulario). El plan de un
// día ya no se elige de acá: se elige de `plan_variantes` en SelectorPlanDia.
// Quedan estas 3 porque son las 3 formas de sesión realmente distintas — las
// otras 9 eran estas mismas con otra periodización.
export const PLANTILLAS=[
  { id:"basico",     nombre:"Full body básico",     descripcion:"Sesión de entrada: cajón, KB, TRX y banda.",           plan:PLAN_BASICO },
  { id:"bilateral",  nombre:"Full body avanzado",   descripcion:"Barra completa: militar, sentadilla, banca, peso muerto, dominadas e hip thrust.", plan:PLAN_BILATERAL },
  { id:"unilateral", nombre:"Unilateral",           descripcion:"A un brazo / una pierna, foco en equilibrio.",          plan:PLAN_UNILATERAL },
];

// ── CÓDIGOS DE EJERCICIO ────────────────────────────────────────────────
// M=Movilidad, E=Act. Elástico y C=Entrada en calor/activación con peso se
// asignan por orden de aparición (ronda 11). Los PRINCIPALES ya NO usan la
// serie P: desde 2026-07-21 tienen código de grupo muscular (PH/RO/PE/CA/
// JA/GL/CO + 3 dígitos) definido en EJERCICIOS_PRINCIPALES, arriba.
const _codCounters = { M: 0, E: 0, C: 0 };
const _codMap = {};
function _codigo(cat, nombre) {
  const key = cat + "|" + nombre;
  if (_codMap[key]) return _codMap[key];
  _codCounters[cat]++;
  const c = cat + String(_codCounters[cat]).padStart(2, "0");
  _codMap[key] = c;
  return c;
}
function _asignar(cat, arr) {
  (arr || []).forEach((e) => {
    if (e && e.nombre) e.codigo = _codigo(cat, e.nombre);
  });
  return arr;
}

// M — Movilidad: orden = versión Completa (piso/sentado → cuadrupedia →
// dinámica, la progresión que ya tenía el archivo), después el set aparte
// de Articulaciones (usado como "Entrada en calor superrápida").
_asignar("M", MOVILIDAD_COMPLETA);
_asignar("M", MOVILIDAD_CORTA); // mismos nombres que Completa → reusa códigos
_asignar("M", MOVILIDAD_ARTICULACIONES);

// E — Act. Elástico
_asignar("E", CALOR_BANDA);

// C — Entrada en calor / activación con peso (disco/mancuerna/katana)
_asignar("C", ACTIVACION_BASE);
_asignar("C", CALOR_PESO);
_asignar("C", CALOR_MANCUERNA);

// Principales: los códigos vienen de la taxonomía (px() los embebe al armar
// cada plan). Se registran igual en el mapa nombre→código para que
// "Guardar para todos" pueda asignar código por nombre a ejercicios viejos.
EJERCICIOS_PRINCIPALES.forEach((e) => { _codMap["P|" + e.nombre] = e.codigo; });

// Mapa nombre→código completo, para backfill/depuración.
export const CODIGOS_EJERCICIO = _codMap;

export const getPlantilla=(id)=>PLANTILLAS.find(p=>p.id===id)||PLANTILLAS[0];

// Bloques sueltos para armar planes a medida desde el admin
export const RUTINAS_MOVILIDAD=[
  { id:"base",          nombre:"Movilidad completa (oficial)", items:MOVILIDAD_COMPLETA },
  { id:"piso-sentado",  nombre:"Movilidad piso y sentado",   items:MOVILIDAD_PISO_SENTADO },
  { id:"cuadrupedia",   nombre:"Movilidad cuadrupedia",      items:MOVILIDAD_CUADRUPEDIA },
  { id:"dinamica",      nombre:"Movilidad dinamica",         items:MOVILIDAD_DINAMICA },
];

export const RUTINAS_CALOR=[
  { id:"banda-full",  nombre:"Entrada en calor con elastico (oficial)", items:CALOR_BANDA },
  // Ex "movilidad de articulaciones" — es un bloque aparte de la movilidad (CEREBRO-ENTRENAMIENTO 3.5)
  { id:"superrapida", nombre:"Entrada en calor superrapida", items:MOVILIDAD_ARTICULACIONES },
];

export const RUTINAS_ACTIVACION=[
  { id:"disco-base",  nombre:"Disco/mancuerna (base)", items:ACTIVACION_BASE },
  { id:"disco-katana",nombre:"Disco y katana",         items:CALOR_PESO },
  { id:"mancuerna",   nombre:"Mancuerna",              items:CALOR_MANCUERNA },
];

// Los templates son objetos compartidos con ids generados UNA vez al cargar el módulo.
// Asignarlos directo a más de un alumno duplica las claves primarias en plan_ejercicios.
// Siempre asignar una copia fresca con ids nuevos:
export const clonarPlan = (plan) => ({
  ...plan,
  periodizacion: (plan.periodizacion || []).map(p => ({ ...p })),
  movilidad:     (plan.movilidad     || []).map(e => ({ ...e })),
  calor:         (plan.calor         || []).map(e => ({ ...e })),
  activacion:    (plan.activacion    || []).map(e => ({ ...e })),
  dias: (plan.dias || []).map(d => ({
    ...d,
    ejercicios: (d.ejercicios || []).map(e => ({ ...e, id: uid() })),
  })),
});
