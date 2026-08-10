// PERIODIZACIÓN EN DOS NIVELES — predeterminado global + copia por alumno
// (2026-08-10, pedido de Lucas: "lo tendría que poder cambiar el predeterminado
// desde la biblioteca de ejercicios, después también debería poder personalizar
// el de cada alumno si quiero").
//
// Es EXACTAMENTE el mismo esquema que ya usa la preparación (movilidad y
// entrada en calor) — no se inventa otro:
//
//   NIVEL 1 · predeterminado global  → tabla `periodizaciones`
//                                      (4 objetivos × 2 niveles, campo jsonb
//                                      `semanas`), se edita en Biblioteca →
//                                      "Periodizaciones"
//   NIVEL 2 · la del alumno          → la columna que ya existía,
//                                      alumnos.plan_periodizacion, editable
//                                      con PeriodizacionEditor como siempre
//
// REGLA DE HERENCIA (la misma que preparación): el alumno que nunca la tocó
// hereda los cambios del predeterminado; el que tiene la suya no se pisa nunca.
// Y la marca de "propia" es la MISMA que la de preparación (rm.prep_propias),
// no una segunda marca paralela: comparar contenidos para deducirlo sirve hoy
// y miente mañana, apenas Lucas edita el predeterminado.
//
// Diferencia con preparación: acá la herencia se resuelve al ESCRIBIR, no al
// leer. Las semanas se copian a plan_periodizacion cuando se asigna el
// predeterminado y cuando Lucas lo edita. Motivo concreto: la periodización se
// lee desde muchos lugares que no pasan por un helper común (PlanDelDia, el
// PDF, el reporte mensual, la vista del alumno), y todos leen plan.periodizacion
// directo. Copiar al escribir los deja a todos coherentes sin tocar ninguno.

import { esPrepPropia, conPrepPropia } from "./preparacion.js";

export const PERIODIZACION_ID = "periodizacion";

// Los 4 objetivos × 2 niveles que tiene la tabla `periodizaciones`.
export const OBJETIVOS = [
  { id: "hipertrofia", label: "Hipertrofia" },
  { id: "fuerza", label: "Fuerza" },
  { id: "acondicionamiento", label: "Acondicionamiento" },
  { id: "preparacion_fisica", label: "Preparación física" },
];
export const NIVELES = [
  { id: "principiante", label: "Principiante" },
  { id: "avanzado", label: "Avanzado" },
];

export const objetivoLabel = (id) => OBJETIVOS.find((o) => o.id === id)?.label || id || "";
export const nivelLabel = (id) => NIVELES.find((n) => n.id === id)?.label || id || "";

// Clave con la que se indexan los predeterminados en memoria.
export const clavePeriodizacion = (objetivo, nivel) => `${objetivo}|${nivel}`;

// ¿El alumno tiene periodización PROPIA (o hereda el predeterminado)?
export const esPeriodizacionPropia = (al) => esPrepPropia(al, PERIODIZACION_ID);

// Qué predeterminado hereda: { objetivo, nivel } o null si nunca se le asignó
// uno (por ejemplo, la periodización le vino con una plantilla de plan).
export const refPeriodizacion = (al) => al?.rm?.periodizacion_ref || null;

// Semanas del predeterminado adaptadas al alumno: se renumeran (el
// predeterminado puede tener 6 u 8 semanas) y se conservan las FECHAS que el
// alumno ya tenía cargadas semana por semana — el calendario es del alumno, no
// del predeterminado, y perderlo obligaría a recargar la fecha de inicio cada
// vez que Lucas corrige un número.
export function semanasParaAlumno(semanas, previas) {
  const viejas = previas || [];
  return (semanas || []).map((s, i) => {
    const out = { ...s, semana: i + 1 };
    if (viejas[i]?.fecha) out.fecha = viejas[i].fecha;
    if (viejas[i]?.anio) out.anio = viejas[i].anio;
    return out;
  });
}

// Asigna (o reasigna) un predeterminado al alumno: copia las semanas y deja la
// marca de herencia. Saca la marca de "propia" — vuelve a seguir al global.
export function conPeriodizacionDe(al, objetivo, nivel, semanas) {
  const propias = (al?.rm?.prep_propias || []).filter((x) => x !== PERIODIZACION_ID);
  return {
    ...al,
    rm: { ...(al?.rm || {}), prep_propias: propias, periodizacion_ref: { objetivo, nivel } },
    plan: { ...(al?.plan || {}), periodizacion: semanasParaAlumno(semanas, al?.plan?.periodizacion) },
  };
}

// ¿Cambió la PRESCRIPCIÓN (series/reps/intensidad/cantidad de semanas) o solo
// las fechas? El editor del alumno tiene un solo onChange y por ahí pasan las
// dos cosas: poner la fecha de inicio del plan mueve todas las semanas. Elegir
// cuándo arranca el mesociclo es del calendario del alumno, no de la
// prescripción — si eso rompiera la herencia, cualquier alumno dejaría de
// seguir el predeterminado el día que se le carga la fecha, que es siempre.
export function cambiaLaPrescripcion(previas, semanas) {
  const a = previas || [], b = semanas || [];
  if (a.length !== b.length) return true;
  return b.some((s, i) =>
    String(s.series) !== String(a[i].series) ||
    String(s.reps) !== String(a[i].reps) ||
    String(s.intensidad || "") !== String(a[i].intensidad || ""),
  );
}

// Editar la periodización del alumno la vuelve PROPIA (deja de heredar), salvo
// que el cambio hayan sido solo las fechas.
export function conPeriodizacionEditada(al, semanas) {
  if (!cambiaLaPrescripcion(al?.plan?.periodizacion, semanas)) {
    return { ...al, plan: { ...(al?.plan || {}), periodizacion: semanas } };
  }
  return conPrepPropia(al, PERIODIZACION_ID, semanas);
}

// ══════════════════════════════════════════════════════════════════════
// NIVEL 3 · LA PERIODIZACIÓN DEL DÍA (2026-08-10)
//
// Pedido de Lucas: "cada día tiene su progresión y puede tener una
// planificación distinta o no, depende de cómo esté montado; si todos los días
// hace el mismo ejercicio seguramente es la misma planificación y progresión,
// o un día puede estar haciendo fuerza el otro volumen".
//
// El caso NORMAL es una sola periodización compartida por todos los días, así
// que partirla no puede ser obligatorio. Es la MISMA herencia de arriba, un
// escalón más abajo: alumno → día (alumno_planes).
//
//   sin periodización propia (columna NULL) → el día usa la del alumno
//   con periodización propia (array)        → nunca se pisa desde el alumno
//
// A diferencia de los niveles 1-2, acá la marca NO es una entrada en
// rm.prep_propias: el contenido y la marca son la misma columna
// (alumno_planes.periodizacion). Motivo concreto: la marca de arriba vive en
// el alumno, y un alumno tiene N días — habría que indexarla por id de plan y
// mantener dos cosas sincronizadas para no ganar nada. NULL/array alcanza y no
// se puede desincronizar.
//
// La herencia se resuelve al LEER, en el cargador (services/supabase.js), y
// deja el resultado en plan.periodizacion: los muchos lugares que leen
// plan.periodizacion directo (PlanDelDia, el PDF, el reporte mensual) siguen
// funcionando sin tocar ninguno. El crudo se conserva aparte en
// plan.periodizacion_propia, que es lo único que mira la pantalla del admin.
// ══════════════════════════════════════════════════════════════════════

// ¿Este día tiene periodización PROPIA (o comparte la del alumno)?
export const esPeriodizacionDiaPropia = (plan) =>
  Array.isArray(plan?.periodizacion_propia) && plan.periodizacion_propia.length > 0;

// Las semanas que le corresponden a un día: las suyas si las tiene, si no las
// del alumno.
export const periodizacionDelDia = (plan, semanasAlumno) =>
  esPeriodizacionDiaPropia(plan) ? plan.periodizacion_propia : (semanasAlumno || []);

// Resumen para la pantalla: qué días comparten y cuál tiene la suya. Sin esto,
// en tres meses no hay forma de entender por qué un día progresa distinto.
// Se saltean los planes sintéticos ("Fijo"): no son filas de alumno_planes, no
// tienen dónde guardar una periodización propia.
export function resumenPeriodizacionDias(planes) {
  return (planes || [])
    .filter((p) => p && !p._sintetico)
    .map((p) => ({
      id: p.id,
      dia: p.dia_semana || p.nombre || "Día",
      propia: esPeriodizacionDiaPropia(p),
      semanas: p.periodizacion_propia || [],
    }));
}

// Al guardar un predeterminado en la Biblioteca: se lo baja a todos los alumnos
// que lo heredan y no lo tocaron. Los que tienen la suya propia no se tocan.
// Puro: devuelve el array nuevo y el guardado normal de alumnos persiste solo
// los que cambiaron (guardarDatos ya hace diff).
export function propagarPeriodizacion(alumnos, objetivo, nivel, semanas) {
  return (alumnos || []).map((a) => {
    const ref = refPeriodizacion(a);
    if (!ref || ref.objetivo !== objetivo || ref.nivel !== nivel) return a;
    if (esPeriodizacionPropia(a)) return a;
    return conPeriodizacionDe(a, objetivo, nivel, semanas);
  });
}
