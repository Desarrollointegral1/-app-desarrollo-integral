// ESTRUCTURA DEL DÍA — bloque principal · core · finisher · modo (2026-08-10)
//
// POR QUÉ existe: hasta hoy el día era UNA LISTA PLANA de ejercicios, y el
// plan real de Jacobo no entra ahí. Tres cosas del mismo hueco:
//
//   1. CORE INTERCALADO, no al final. Nota de Lucas en la lámina: "core
//      integrado entre rondas, no al final", "se repite 2 o 3 veces según
//      cantidad de series". Como lista plana, el core queda escrito último y
//      el alumno lo hace último — que es exactamente lo contrario.
//   2. FINISHER, siempre al final. "Fondos y bíceps solo cuando todo lo demás
//      está hecho". Sin bloque propio, un finisher es un ejercicio más y
//      compite por energía con el bloque principal.
//   3. MODO POR TIEMPO. El circuito intermitente de fuerza no tiene series ni
//      repeticiones: tiene 30 s por ejercicio × 4 rondas. La periodización
//      (series × reps × intensidad) no lo describe.
//
// TODO ES OPCIONAL Y EL DEFAULT ES "COMO ESTÁ HOY": sin `seccion` un
// ejercicio es del bloque principal, sin `config` el día va por repeticiones
// con el core al final. Un plan viejo se comporta igual que ayer.
//
// Este archivo es puro a propósito (sin React, sin Supabase): lo usan el
// cargador, la vista del alumno y los tests sin base ni navegador.

export const SECCIONES = ["principal", "core", "finisher"];

// La sección de un ejercicio, tolerante: cualquier cosa que no sea core o
// finisher es del bloque principal. Un dato raro tiene que dejar el ejercicio
// VISIBLE en la pantalla, no hacerlo desaparecer de las tres listas.
export const seccionDe = (ej) =>
  SECCIONES.includes(ej?.seccion) ? ej.seccion : "principal";

// Config del día con los defaults puestos. `core` es dónde va el core:
// "intercalado" (entre rondas del bloque principal) o "final".
export function configDia(dia) {
  const c = (dia && dia.config) || {};
  return {
    modo: c.modo === "tiempo" ? "tiempo" : "reps",
    // 30 s × 4 rondas es lo que pidió Lucas para el circuito; se usan de
    // default para que un día en modo tiempo mal cargado muestre algo
    // razonable en vez de "undefined s".
    segundos: Number(c.segundos) > 0 ? Number(c.segundos) : 30,
    rondas: Number(c.rondas) > 0 ? Number(c.rondas) : 4,
    // "final" es el default porque es lo que pasaba antes de este cambio: el
    // core estaba escrito al final de la lista plana. El plan que lo quiere
    // intercalado lo dice explícitamente.
    core: c.core === "intercalado" ? "intercalado" : "final",
  };
}

export const esPorTiempo = (dia) => configDia(dia).modo === "tiempo";

// Parte los ejercicios del día en sus tres bloques, conservando el orden
// dentro de cada uno.
export function bloquesDelDia(dia) {
  const out = { principal: [], core: [], finisher: [] };
  (dia?.ejercicios || []).forEach((ej) => out[seccionDe(ej)].push(ej));
  return out;
}

// La prescripción que se le muestra al alumno en cada tarjeta. En modo
// repeticiones es la semana de la periodización de siempre; en modo tiempo la
// periodización no aplica (no hay series ni reps) y se muestran los segundos y
// las rondas. Devolver el MISMO shape {series, reps, intensidad} deja que
// ItemCard siga sin enterarse de que existe el modo tiempo.
export function prescripcionDelDia(dia, semana) {
  const cfg = configDia(dia);
  if (cfg.modo !== "tiempo") return semana;
  return { series: cfg.rondas, reps: `${cfg.segundos} s`, intensidad: "" };
}

// Textos de pantalla. Viven acá y no en el JSX para poder testearlos y para
// que la vista del alumno y el resumen del plan digan exactamente lo mismo.
export function textoModo(dia) {
  const cfg = configDia(dia);
  return cfg.modo === "tiempo"
    ? `${cfg.segundos} s por ejercicio · ${cfg.rondas} rondas`
    : "";
}

export function textoCore(dia) {
  return configDia(dia).core === "intercalado"
    ? "Entre rondas, no al final — se repite 2 o 3 veces según cuántas series hagas"
    : "Al final del bloque principal";
}

export const TEXTO_FINISHER = "Recién cuando todo lo demás está hecho";
