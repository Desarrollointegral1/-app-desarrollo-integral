// ============================================================
// LA UNIDAD DE CADA EJERCICIO — 2026-08-12
// ============================================================
// Pedido de Lucas: "los ejercicios de peso corporal como la trx o fondo
// triceps no se cuenta por kilo sino por repeticiones... los ejercicios
// isometricos tipo plancha son por segundos".
//
// Son TRES unidades, no dos:
//   · kilos        — lleva carga externa (barra, mancuerna, polea, máquina)
//   · repeticiones — peso corporal o banda: se registra cuántas hizo
//   · segundos     — isométricos y máquinas de tiempo: cuánto aguantó
//
// La fuente de verdad es el CATÁLOGO (catalogo_ejercicios.unidad, migración
// 038) y el dato viaja al plan cuando el ejercicio se suma. Este archivo tiene
// la MISMA regla que la migración, para dos cosas que la base no puede hacer:
//   1) resolver un ejercicio viejo que quedó con la unidad sin definir,
//   2) resolver un ejercicio escrito a mano que nunca pasó por el catálogo.
//
// Por qué el valor nuevo se llama "repeticiones" y no "reps": 'reps' era el
// DEFAULT viejo de plan_ejercicios.unidad y estaba en el 95% de las filas
// significando "nadie definió esto" (se mostraba como KG). Si reusáramos ese
// nombre no habría forma de distinguir "el admin eligió repeticiones" de "esto
// viene sin definir". Por eso 'reps' se lee acá como "no definido" → se deduce.

export const UNIDADES = ["kilos", "repeticiones", "segundos"];

// Isométricos: lo que se registra es el tiempo. Gana sobre "peso corporal",
// porque una plancha es las dos cosas y lo que importa es cuánto aguantó.
const RE_ISOMETRICO =
  /(planch|isom|puente|hollow|superman|colgad|colgar|dead hang|l-sit|wall sit|estátic|estatic|sostenid)/i;

// Elementos que se miden por tiempo, no por carga.
const EQUIPO_POR_TIEMPO = new Set([
  "Rodillo", "Elíptico", "Bicicleta fija", "Escalador",
  "Máquina SkiErg", "Ergómetro de brazos", "Soga",
]);

// Sin número de carga posible: el propio cuerpo, o una banda que no tiene kilos.
const EQUIPO_SIN_CARGA = new Set([
  "Peso corporal", "Asistido", "Bosu", "Pelota de estabilidad",
  "Rueda abdominal", "Banda", "Banda elástica",
]);

/** La regla objetiva, idéntica a la de migrations/038_unidad_por_ejercicio.sql. */
export function unidadPorRegla({ nombre, nombre_es, equipment_es } = {}) {
  const n = String(nombre || nombre_es || "");
  if (RE_ISOMETRICO.test(n)) return "segundos";
  if (EQUIPO_POR_TIEMPO.has(equipment_es)) return "segundos";
  if (EQUIPO_SIN_CARGA.has(equipment_es)) return "repeticiones";
  return "kilos";
}

/**
 * La unidad de un ejercicio, venga de donde venga (catálogo, plan, plantilla).
 * Respeta lo que ya está definido y deduce solo cuando falta.
 */
export function unidadDe(ej) {
  const u = ej && ej.unidad;
  if (UNIDADES.includes(u)) return u;
  // 'reps' (default viejo), "" o undefined = sin definir → regla.
  return unidadPorRegla(ej || {});
}

/** Lo que dice el casillero que el alumno completa hoy. */
export const ETIQUETA_HOY = {
  kilos: "KG HOY",
  repeticiones: "REPS HOY",
  segundos: "SEG HOY",
};

/** Sufijo corto para historial, máximos y comparaciones. */
export const SUFIJO = {
  kilos: "kg",
  repeticiones: "reps",
  segundos: "seg",
};

/** Nombre para mostrar en el editor del admin. */
export const NOMBRE_UNIDAD = {
  kilos: "Kilos",
  repeticiones: "Repeticiones",
  segundos: "Segundos",
};

/** Texto de los botones +/- del stepper, para el aria-label. */
export const PASO_UNIDAD = {
  kilos: ["Restar un kilo", "Sumar un kilo"],
  repeticiones: ["Restar una repetición", "Sumar una repetición"],
  segundos: ["Restar un segundo", "Sumar un segundo"],
};
