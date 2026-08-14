// ============================================================
// CON QUÉ SE HACE CADA EJERCICIO — 2026-08-13, podado el 2026-08-14
// ============================================================
// POR QUÉ ESTE ARCHIVO ES CHICO — NO LO VUELVAS A AGRANDAR.
//
// El 2026-08-13 acá vivía un selector de carga completo: el alumno tocaba la
// barra, después los discos de un lado, y la app hacía la suma. Lucas lo probó
// y lo rechazó, textual: "estuve viendo lo que hiciste con el peso, quedó
// mucho, tiene que ser más simple, la gente no sabe cargar tantos botones, muy
// complicado... la persona tiene que poder hacer la cuenta mentalmente y luego
// completar".
//
// La premisa estaba invertida. No es "el alumno anota lo que ve y la app hace
// la cuenta": es **el alumno hace la cuenta en la cabeza y escribe un número**.
// Un solo casillero, el stepper de siempre, y al lado una línea que le
// recuerde qué sumar. Nada más.
//
// Si alguna vez volvés a pensar en un selector de discos: ya se construyó, ya
// se probó, y el dueño de la app lo sacó. Lo que queda acá es lo único que
// sirvió de aquel trabajo: saber CON QUÉ se hace cada ejercicio (barra,
// mancuernas, banda, peso corporal…) a partir del equipamiento del catálogo.
// Eso decide dos cosas: la unidad (kilos/repeticiones/segundos) y qué dice la
// línea de ayuda.
//
// DE DÓNDE SALE LA FORMA: del EQUIPAMIENTO del catálogo
// (catalogo_ejercicios.equipment_es), que viaja al plan cuando el ejercicio se
// suma — el mismo camino que ya recorre `unidad` desde la migración 038. No se
// carga a mano ejercicio por ejercicio.
//
// ESTE ARCHIVO ES LA ÚNICA REGLA. src/utils/unidades.js no tiene la suya:
// deduce la unidad de la forma que se decide acá (UNIDAD_DE_FORMA), así que
// kilos/repeticiones/segundos y la forma no se pueden contradecir. El reparto
// es idéntico al de la migración 038 — hay tests en utils.test.js que lo
// verifican equipamiento por equipamiento.

// ── LAS OCHO FORMAS ───────────────────────────────────────────────────
export const FORMAS = [
  "barra",       // barra olímpica/Z/Smith
  "mancuernas",  // una o dos mancuernas (o kettlebells)
  "placa",       // máquina o polea: el número que marca la placa
  "libre",       // un objeto con peso propio: pelota medicinal, martillo, neumático
  "corporal",    // el propio cuerpo: se cuentan repeticiones
  "lastre",      // peso corporal CON peso extra
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
// le rompería la evolución.
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

// ── LA REFERENCIA AL LADO DEL CASILLERO (2026-08-14) ──────────────────
// Una línea, no un formulario. Solo donde el número puede salir mal si el
// alumno no piensa la cuenta: la barra (que pesa aunque esté sola, y los
// discos van de a dos) y las mancuernas (que suelen ser dos). En el resto el
// número es el que se lee en la máquina o el que se contó, y una frase de más
// sería ruido — por eso devuelve "" y la pantalla no muestra nada.
export const AYUDA_CARGA = {
  barra: "Sumá la barra más los discos de los dos lados",
  mancuernas: "Si usás dos, sumá las dos",
};

export const ayudaDe = (forma) => AYUDA_CARGA[forma] || "";

// ── LA REGLA OBJETIVA ─────────────────────────────────────────────────
// Isométricos: manda el tiempo. Una plancha es peso corporal Y es isométrica,
// y lo que interesa registrar es cuánto aguantó. Mismo regex que la migración
// 038 — no cambia ningún ejercicio de lugar.
const RE_ISOMETRICO =
  /(planch|isom|puente|hollow|superman|colgad|colgar|dead hang|l-sit|wall sit|estátic|estatic|sostenid)/i;

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
