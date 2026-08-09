// PREPARACIÓN EN DOS NIVELES — predeterminado global + copia por alumno
// (2026-08-10, pedido de Lucas: "quiero poder modificar los ejercicios de las
// 3 planillas... que eso sea predeterminado pero tengo que poder cambiar el
// predeterminado y a su vez poder modificar por alumno").
//
// El criterio es el MISMO que la app ya usa para los planes de entrenamiento
// (planes_predeterminados → crearPlanAlumno copia al alumno), sin inventar
// otro mecanismo:
//
//   NIVEL 1 · predeterminado global  → tabla app_config, claves prep_*
//                                      (se edita en Biblioteca → Preparación)
//   NIVEL 2 · lista propia del alumno → columnas jsonb que ya existen
//                                      (plan_movilidad / plan_calor) y el
//                                      jsonb `rm` para las dos versiones
//                                      nuevas de movilidad — mismo patrón
//                                      sin-migración que movilidad_default.
//
// REGLA DE HERENCIA (decidida el 2026-08-10): el alumno que nunca tocó una
// lista HEREDA los cambios del predeterminado; el que tiene lista propia no se
// pisa nunca. "Tener lista propia" NO se deduce comparando contenidos —
// comparar contra el global sirve hoy y miente mañana, apenas Lucas edita el
// predeterminado (todos pasarían a "distintos" de golpe). Es una marca
// explícita: rm.prep_propias, la lista de ids que el alumno tiene propios. Sin
// marca = heredado, y la pantalla lo muestra escrito.
//
// Los NOMBRES de los ejercicios no se tocan en ningún paso: la resolución de
// imágenes (ejerciciosMedia.js) es por nombre y tiene que seguir funcionando.

import {
  MOVILIDAD_ARTICULACIONES,
  MOVILIDAD_CORTA,
  MOVILIDAD_COMPLETA,
  CALOR_BASE,
} from "./planTemplates.js";

// Las 4 listas de preparación editables. `fallback` es el contenido del método
// que se usa mientras nadie haya guardado un predeterminado propio (app_config
// arranca vacío): la app nunca queda sin ejercicios.
export const PREP_LISTAS = [
  { id: "movilidad_superrapida", label: "Superrápida", grupo: "movilidad", fallback: MOVILIDAD_ARTICULACIONES },
  { id: "movilidad_corta",       label: "Corta",       grupo: "movilidad", fallback: MOVILIDAD_CORTA },
  { id: "movilidad_completa",    label: "Completa",    grupo: "movilidad", fallback: MOVILIDAD_COMPLETA },
  { id: "calor",                 label: "Entrada en calor", grupo: "calor", fallback: CALOR_BASE },
];

export const PREP_IDS = PREP_LISTAS.map((l) => l.id);
export const prepDef = (id) => PREP_LISTAS.find((l) => l.id === id);

// Clave en app_config del predeterminado global de una lista.
export const claveConfigPrep = (id) => `prep_${id}`;

// ¿El alumno tiene lista PROPIA de esta preparación (o hereda el global)?
export function esPrepPropia(al, id) {
  return (al?.rm?.prep_propias || []).includes(id);
}

// Dónde vive el override de cada lista dentro del alumno. Las dos versiones
// nuevas de movilidad van en `rm` para no pedir una migración por algo que ya
// tiene un patrón en la app (movilidad_default, secciones_config, dias_modo).
export function overrideDeAlumno(al, id) {
  if (!al) return null;
  if (id === "movilidad_completa") return al.plan?.movilidad || null;
  if (id === "calor") return al.plan?.calor || null;
  return al.rm?.[`lista_${id}`] || null;
}

// La lista que el alumno REALMENTE ve: propia si la tiene, si no el
// predeterminado global, si no el contenido del método.
export function listaDeAlumno(al, id, globales) {
  const def = prepDef(id);
  if (!def) return [];
  if (esPrepPropia(al, id)) {
    const propia = overrideDeAlumno(al, id);
    if (Array.isArray(propia) && propia.length > 0) return propia;
  }
  const global = globales && globales[id];
  if (Array.isArray(global) && global.length > 0) return global;
  return def.fallback;
}

// El predeterminado global vigente de una lista (sin mirar ningún alumno).
export function listaGlobal(id, globales) {
  const def = prepDef(id);
  if (!def) return [];
  const g = globales && globales[id];
  return Array.isArray(g) && g.length > 0 ? g : def.fallback;
}

// Devuelve el alumno con la lista guardada COMO PROPIA (marca + contenido).
// Puro: no toca la base, solo arma el objeto que después persiste el guardado
// normal de alumnos (guardarDatos escribe plan_movilidad / plan_calor / rm).
export function conPrepPropia(al, id, lista) {
  const propias = new Set(al?.rm?.prep_propias || []);
  propias.add(id);
  const rm = { ...(al.rm || {}), prep_propias: [...propias] };
  if (id === "movilidad_completa") return { ...al, rm, plan: { ...al.plan, movilidad: lista } };
  if (id === "calor") return { ...al, rm, plan: { ...al.plan, calor: lista } };
  return { ...al, rm: { ...rm, [`lista_${id}`]: lista } };
}

// Vuelve a heredar el predeterminado: saca la marca y limpia el override.
// La lista global se copia igual a la columna del alumno cuando es una de las
// dos que ya existían (plan_movilidad / plan_calor), porque hay lecturas viejas
// que leen esas columnas directo (PDF, reporte mensual) — que vean lo mismo
// que la app, no una lista vieja.
export function sinPrepPropia(al, id, globales) {
  const rm = { ...(al.rm || {}) };
  rm.prep_propias = (rm.prep_propias || []).filter((x) => x !== id);
  delete rm[`lista_${id}`];
  const lista = listaGlobal(id, globales);
  if (id === "movilidad_completa") return { ...al, rm, plan: { ...al.plan, movilidad: lista } };
  if (id === "calor") return { ...al, rm, plan: { ...al.plan, calor: lista } };
  return { ...al, rm };
}
