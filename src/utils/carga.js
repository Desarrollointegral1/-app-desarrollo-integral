// ============================================================
// LA FORMA DE CARGA DE CADA EJERCICIO — 2026-08-13
// ============================================================
// Pedido de Lucas: "creo que eso es lo mas importante en la app, el registro
// de los pesos, el registro de cuanta evolucion la persona hizo con sus pesos".
//
// EL PROBLEMA que resuelve este archivo: hasta hoy la app pedía "kilos" y no
// decía de qué. Con dos mancuernas de 10, un alumno anotaba 10 y otro 20. Con
// dos discos de 5 por lado en el press, uno anotaba 5, otro 10 y otro 30. La
// evolución comparaba números que no medían lo mismo, así que no medía nada.
//
// LA REGLA, aprobada por Lucas: **el alumno anota lo que ve, la app hace la
// cuenta**. Nadie suma discos con el celular en la mano entre serie y serie.
// Textual, sobre el press: "que cuando haga pecho plano sepa que tiene que
// poner el peso que uso de cada lado mas la barra el peso que tenga, por
// ejemplo 5 + 20 + 5 igual a 30 kilos".
//
// QUÉ ANOTA EL ALUMNO Y QUÉ GUARDA LA APP, forma por forma:
//
//   barra       la barra y los discos DE UN LADO   →  barra + (discos × 2)
//   mancuernas  el peso de UNA                     →  peso × 1 ó × 2
//   placa       lo que marca la placa              →  ese número
//   libre       el peso que agarra                 →  ese número
//   corporal    repeticiones                       →  repeticiones
//   lastre      repeticiones Y el lastre           →  las dos cosas
//   tiempo      segundos                           →  segundos
//   banda       repeticiones y nada más            →  repeticiones
//
// Sobre la banda, textual de Lucas: "en banda elastica contemos por
// repeticiones nada mas". Nada de color ni de nivel: una banda no tiene kilos
// comparables y no los vamos a inventar.
//
// DE DÓNDE SALE LA FORMA: del EQUIPAMIENTO del catálogo
// (catalogo_ejercicios.equipment_es), que viaja al plan cuando el ejercicio se
// suma — exactamente el mismo camino que ya recorre `unidad` desde la
// migración 038. No se carga a mano ejercicio por ejercicio.
//
// ESTE ARCHIVO ES LA ÚNICA REGLA. src/utils/unidades.js ya no tiene la suya:
// deduce la unidad a partir de la forma que se decide acá (ver UNIDAD_DE_FORMA
// abajo), así que kilos/repeticiones/segundos y la forma de carga no se pueden
// contradecir. El reparto que sale de acá es idéntico al de la migración 038 —
// eso está cubierto por tests en utils.test.js.

// ── LAS OCHO FORMAS ───────────────────────────────────────────────────
export const FORMAS = [
  "barra",       // barra olímpica/Z/Smith: barra + discos por lado
  "mancuernas",  // una o dos mancuernas (o kettlebells)
  "placa",       // máquina o polea: el número que marca la placa
  "libre",       // un objeto con peso propio: pelota medicinal, martillo, neumático
  "corporal",    // el propio cuerpo: se cuentan repeticiones
  "lastre",      // peso corporal CON peso extra: repeticiones y lastre
  "tiempo",      // isométricos y máquinas de tiempo: segundos
  "banda",       // banda elástica: repeticiones y nada más
];

// Qué unidad le corresponde a cada forma. Es la tabla que hace que
// unidades.js y este archivo no puedan discrepar.
//
// Por qué `lastre` es KILOS y no repeticiones: el ejercicio "Con peso extra"
// (dominadas con lastre, fondos con chaleco) ya venía registrándose en kilos
// desde la migración 038, y lo que progresa ahí es el lastre. Cambiarlo a
// repeticiones convertiría los 10 kg ya cargados de un alumno en "10 reps" y
// le rompería la evolución. Las repeticiones igual se guardan, en el detalle:
// "las dos cosas", como pidió Lucas.
export const UNIDAD_DE_FORMA = {
  barra: "kilos",
  mancuernas: "kilos",
  placa: "kilos",
  libre: "kilos",
  corporal: "repeticiones",
  lastre: "kilos",
  tiempo: "segundos",
  banda: "repeticiones",
};

// Lo que dice el rótulo del casillero: QUÉ tiene que anotar el alumno.
// Es la mitad del arreglo — el número solo no alcanza si no dice de qué es.
export const QUE_ANOTA = {
  barra: "La barra y los discos de UN lado",
  mancuernas: "El peso de UNA mancuerna",
  placa: "Lo que marca la placa",
  libre: "El peso que agarrás",
  corporal: "Cuántas repeticiones hiciste",
  lastre: "El lastre que te colgaste",
  tiempo: "Cuántos segundos aguantaste",
  banda: "Cuántas repeticiones hiciste",
};

// ── LA REGLA OBJETIVA ─────────────────────────────────────────────────
// Isométricos: manda el tiempo. Una plancha es peso corporal Y es isométrica,
// y lo que interesa registrar es cuánto aguantó. Mismo regex que la migración
// 038 y que unidades.js tenía hasta hoy — no cambia ningún ejercicio de lugar.
const RE_ISOMETRICO =
  /(planch|isom|puente|hollow|superman|colgad|colgar|dead hang|l-sit|wall sit|estátic|estatic|sostenid)/i;

// Nombres que delatan que el ejercicio se hace con UNA sola mancuerna aunque
// el catálogo diga "Mancuerna" a secas. Solo mueve el valor INICIAL del
// selector: el alumno cambia entre una y dos con un toque, siempre.
const RE_UNILATERAL = /(unilateral|a una mano|una mano|un brazo|a un brazo|una pierna|goblet|arranque|cargada|turco|remo a un)/i;

// El equipamiento del catálogo, agrupado por forma. Los nombres son los
// valores REALES de catalogo_ejercicios.equipment_es (verificados contra la
// base el 2026-08-13, 28 valores distintos en 1.343 ejercicios).
const EQUIPO_BARRA = new Set([
  "Barra", "Barra Z", "Barra olímpica", "Barra hexagonal", "Máquina Smith",
]);
const EQUIPO_MANCUERNAS = new Set(["Mancuerna", "Kettlebell"]);
const EQUIPO_PLACA = new Set(["Polea", "Máquina de palanca", "Prensa / Sled"]);
const EQUIPO_TIEMPO = new Set([
  "Rodillo", "Elíptico", "Bicicleta fija", "Escalador",
  "Máquina SkiErg", "Ergómetro de brazos", "Soga",
]);
const EQUIPO_CORPORAL = new Set([
  "Peso corporal", "Asistido", "Bosu", "Pelota de estabilidad", "Rueda abdominal",
]);
const EQUIPO_BANDA = new Set(["Banda", "Banda elástica"]);
const EQUIPO_LASTRE = new Set(["Con peso extra"]);

/**
 * La forma de carga por regla objetiva, a partir del nombre y del
 * equipamiento del catálogo. El orden importa: isométrico gana sobre todo.
 */
export function formaPorRegla({ nombre, nombre_es, equipamiento, equipment_es } = {}) {
  const n = String(nombre || nombre_es || "");
  const eq = equipamiento || equipment_es || "";
  if (RE_ISOMETRICO.test(n)) return "tiempo";
  if (EQUIPO_TIEMPO.has(eq)) return "tiempo";
  if (EQUIPO_BANDA.has(eq)) return "banda";
  if (EQUIPO_LASTRE.has(eq)) return "lastre";
  if (EQUIPO_CORPORAL.has(eq)) return "corporal";
  if (EQUIPO_BARRA.has(eq)) return "barra";
  if (EQUIPO_MANCUERNAS.has(eq)) return "mancuernas";
  if (EQUIPO_PLACA.has(eq)) return "placa";
  // Lo que queda son objetos con peso propio (pelota medicinal, martillo,
  // neumático) y el ejercicio viejo sin equipamiento cargado: se anota el
  // peso que agarra, tal cual. Es la misma cuenta que hacía la app hasta hoy,
  // así que un ejercicio sin dato no cambia de comportamiento.
  return "libre";
}

/**
 * La forma de un ejercicio venga de donde venga (catálogo, plan, plantilla).
 *
 * Si el ejercicio trae `unidad` DEFINIDA a mano por el admin (Biblioteca →
 * ficha del ejercicio) y no coincide con lo que dice la regla, gana el admin:
 * la decisión humana pesa más que el equipamiento. Solo se corrige la forma,
 * nunca la unidad.
 */
export function formaDe(ej) {
  const forma = formaPorRegla(ej || {});
  const u = ej && ej.unidad;
  if (u === "segundos" && forma !== "tiempo") return "tiempo";
  if (u === "repeticiones" && UNIDAD_DE_FORMA[forma] !== "repeticiones") return "corporal";
  // 'kilos' no fuerza nada: es el default viejo de la columna y hay ejercicios
  // de banda o peso corporal que lo arrastran sin que nadie lo haya elegido.
  return forma;
}

/** ¿Esta forma necesita el selector de carga, o alcanza con un número? */
export const NECESITA_SELECTOR = (forma) => forma === "barra" || forma === "mancuernas";

// ── LA CUENTA ─────────────────────────────────────────────────────────
const num = (v) => {
  const n = Number(v);
  return isFinite(n) && n > 0 ? n : 0;
};

// Los discos de 1,25 dejan totales tipo 22.500000000000004 en coma flotante.
// Se redondea a 2 decimales: no existe el disco de 1 gramo.
const redondear = (n) => Math.round(n * 100) / 100;

/**
 * EL NÚMERO QUE SE GUARDA — la función pura de toda esta historia.
 *
 * Recibe el DETALLE de una vuelta y devuelve el número que va a
 * `registros_diarios.pesos` y alimenta la evolución. En la unidad que le
 * corresponde a la forma (kilos, repeticiones o segundos).
 *
 * COMPATIBILIDAD HACIA ATRÁS: si le llega un número suelto (todo lo que ya
 * está registrado desde antes del 2026-08-13, que no tiene detalle) lo
 * devuelve tal cual. Un registro viejo es, simplemente, un registro del que no
 * sabemos de qué está hecho.
 */
export function pesoTotal(detalle) {
  if (detalle == null) return 0;
  if (typeof detalle === "number" || typeof detalle === "string") return num(detalle);
  switch (detalle.forma) {
    case "barra":
      // La cuenta que pidió Lucas: 5 + 20 + 5 = 30. El alumno anota la barra
      // (20) y lo que puso de UN lado (5); los discos van de a dos.
      return redondear(num(detalle.barra) + sumaDiscos(detalle.discos) * 2);
    case "mancuernas":
      // El alumno anota el peso de UNA. Dos mancuernas de 10 son 20 kg.
      return redondear(num(detalle.unitario) * (Number(detalle.cantidad) === 1 ? 1 : 2));
    case "corporal":
    case "banda":
      return num(detalle.reps);
    case "lastre":
      return num(detalle.lastre);
    case "tiempo":
      return num(detalle.segundos);
    case "placa":
    case "libre":
    default:
      return num(detalle.valor);
  }
}

/** Suma de los discos de un lado. Acepta el array o un número suelto. */
export function sumaDiscos(discos) {
  if (discos == null) return 0;
  if (!Array.isArray(discos)) return num(discos);
  return redondear(discos.reduce((a, d) => a + num(d), 0));
}

/**
 * EL DETALLE EN CASTELLANO — para que la próxima sesión sepa exactamente qué
 * cargar. Sin esto, el total de 30 kg no le dice al alumno si eran dos discos
 * de 5 en la barra de 20 o uno de 10 en la de 10.
 * Ej: "Barra 20 + 5 por lado" · "2 mancuernas de 10" · "8 reps con 10 kg".
 */
export function resumenCarga(detalle) {
  if (detalle == null || typeof detalle !== "object") return "";
  const coma = (n) => String(redondear(n)).replace(".", ",");
  switch (detalle.forma) {
    case "barra": {
      const b = num(detalle.barra);
      const lado = sumaDiscos(detalle.discos);
      if (!b && !lado) return "";
      if (!lado) return `Barra ${coma(b)} sola`;
      const lista = (Array.isArray(detalle.discos) ? detalle.discos : [detalle.discos])
        .filter((d) => num(d) > 0)
        .map(coma)
        .join(" + ");
      return `Barra ${coma(b)} + ${lista} por lado`;
    }
    case "mancuernas": {
      const u = num(detalle.unitario);
      if (!u) return "";
      const cuantas = Number(detalle.cantidad) === 1 ? 1 : 2;
      return cuantas === 1 ? `1 mancuerna de ${coma(u)}` : `2 mancuernas de ${coma(u)}`;
    }
    case "lastre": {
      const l = num(detalle.lastre), r = num(detalle.reps);
      if (!l && !r) return "";
      if (!r) return `${coma(l)} kg de lastre`;
      return `${r} reps con ${coma(l)} kg de lastre`;
    }
    case "corporal": {
      const r = num(detalle.reps), l = num(detalle.lastre);
      if (!r) return "";
      return l ? `${r} reps con ${coma(l)} kg de lastre` : `${r} reps`;
    }
    case "banda":
      return num(detalle.reps) ? `${num(detalle.reps)} reps` : "";
    case "tiempo":
      return num(detalle.segundos) ? `${num(detalle.segundos)} seg` : "";
    case "placa":
      return num(detalle.valor) ? `Placa en ${coma(num(detalle.valor))}` : "";
    default:
      return num(detalle.valor) ? `${coma(num(detalle.valor))} kg` : "";
  }
}

/**
 * El detalle con el que arranca un casillero vacío.
 *
 * `barraKg` es el peso predeterminado de la barra — 20 kg, como pidió Lucas
 * ("predeterminado 20 y poder bajar o subir"). Se pasa desde el equipamiento
 * editable para que, si Lucas cambia cuál es la barra de la sala, el
 * predeterminado cambie con él.
 */
export function detalleVacio(forma, { barraKg = 20, nombre = "" } = {}) {
  switch (forma) {
    case "barra":
      return { forma, barra: barraKg, discos: [] };
    case "mancuernas":
      return { forma, unitario: 0, cantidad: RE_UNILATERAL.test(String(nombre)) ? 1 : 2 };
    case "corporal":
      return { forma, reps: 0, lastre: 0 };
    case "lastre":
      return { forma, reps: 0, lastre: 0 };
    case "tiempo":
      return { forma, segundos: 0 };
    case "banda":
      return { forma, reps: 0 };
    default:
      return { forma, valor: 0 };
  }
}

/**
 * Escribe el NÚMERO que el alumno tipeó en el campo simple (el stepper de
 * siempre) sin perder la forma. Sirve para las formas que no llevan selector:
 * placa, libre, corporal, lastre, tiempo y banda.
 */
export function conValorSimple(detalle, forma, valor) {
  const base = detalle && typeof detalle === "object" && detalle.forma === forma
    ? { ...detalle }
    : detalleVacio(forma);
  const n = num(valor);
  switch (forma) {
    case "corporal":
    case "banda":
      base.reps = n; break;
    case "lastre":
      base.lastre = n; break;
    case "tiempo":
      base.segundos = n; break;
    default:
      base.valor = n; break;
  }
  return base;
}

/**
 * Escribe el detalle de UNA vuelta y devuelve el valor nuevo del ejercicio.
 *
 * Misma semántica que setVuelta() en src/utils/pesos.js —serie 1-based, se
 * rellena con huecos hacia adelante— y misma que la RPC guardar_peso_vuelta de
 * la migración 042. Las tres tienen que coincidir o el detalle de la vuelta 3
 * terminaría explicando el peso de la vuelta 2.
 */
export function setDetalleVuelta(actual, serie, detalle) {
  const idx = Math.max(1, Number(serie) || 1) - 1;
  const arr = Array.isArray(actual) ? [...actual] : actual != null ? [actual] : [];
  while (arr.length <= idx) arr.push(null);
  arr[idx] = detalle || null;
  return arr.some((v) => v != null) ? arr : null;
}

/**
 * ¿El detalle que tenemos guardado describe de verdad este total?
 *
 * Un registro viejo (número suelto, sin detalle) y un registro que se editó a
 * mano después de armarlo con el selector quedan descolgados: mostrar
 * "Barra 20 + 5 por lado" al lado de un 45 sería mentirle al alumno. Cuando
 * esto devuelve false, la pantalla muestra el número pelado y nada más.
 */
export function detalleCoincide(detalle, total) {
  if (detalle == null || typeof detalle !== "object") return false;
  const t = num(total);
  if (!t) return false;
  return Math.abs(pesoTotal(detalle) - t) < 0.01;
}
