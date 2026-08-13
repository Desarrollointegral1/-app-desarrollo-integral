// VARIANTES DE PLAN → plan asignable a un alumno (2026-08-10)
//
// POR QUÉ existe este archivo: las 10 variantes que Lucas escribió viven en la
// tabla `plan_variantes` y hasta hoy NO se podían usar — estaban en la base,
// pero ninguna pantalla las ofrecía al asignar el plan de un día. Por eso el
// "Lunes · Bilateral" de la alumna de prueba quedaba vacío.
//
// NO se inventa un flujo nuevo de asignación: el camino que ya funciona es
// PLANTILLAS (planTemplates.js) → asignarPlanDia → crearPlanAlumno →
// _savePlanDias. Lo único que faltaba era traducir una variante al MISMO shape
// que consume ese camino. Eso es lo que hace `varianteAPlan`, y por eso es una
// función pura: se puede testear sin base ni navegador.
//
// La fila de `plan_variantes` guarda lo mínimo ({patron, catalogo_id, nombre}).
// Todo lo que el alumno ve en la pantalla del día — la explicación del
// ejercicio, el GIF y el código — vive en `catalogo_ejercicios` y se resuelve
// acá por `catalogo_id` (que es catalogo_ejercicios.id, NO codigo_di):
//
//   instrucciones_es → desc      gif_url → gif      codigo_di → codigo
//
// El `gif_url` del catálogo es un path RELATIVO al bucket público
// (videos/0043-xxx.gif). Guardarlo crudo en plan_ejercicios dejaría el GIF
// roto en la vista del alumno, así que se pasa siempre por catalogoMediaUrl.

import { catalogoMediaUrl } from "../../services/supabase.js";
import { uid } from "./helpers.js";

// Etiqueta legible de cada familia — se usa para agrupar los botones en la
// pantalla y para el subtítulo del día del plan.
// 2026-08-10: entraron las dos full body. La familia "bilateral" pasó a
// llamarse "full_body_avanzado" (migración 036) porque era exactamente la
// sesión que las plantillas viejas repetían como Prep. Física Avanzado,
// Fuerza Avanzado e Hipertrofia. Las tres full body van primero: son las que
// se pueden asignar los 3 días iguales, que es como entrena la mayoría.
// ── "SIN PLAN DE EJERCICIOS" (2026-08-12) ──────────────────────────────
// Pedido de Lucas: "los dos me tienen que dar la opción de dejar sin ningún
// predeterminado. sin plan." El sentinel ya existía suelto dentro de App.jsx
// como el string "__sin_plan__"; se sube acá para que el alta y el selector
// por día usen EL MISMO criterio en vez de inventar cada uno el suyo. No es un
// id de plantilla: significa "creá la fila del día, pero vacía a propósito"
// (distinto de no tener fila, que es no entrenar ese día).
export const SIN_PLAN = "__sin_plan__";

// Plan vacío listo para guardar. Función y no constante: si fuera un objeto
// compartido, dos días "sin plan" apuntarían al mismo array y editar uno
// tocaría el otro.
export const planVacio = () => ({
  nombre: "Sin plan",
  descripcion: "",
  dias: [],
  movilidad: [],
  calor: [],
  activacion: [],
  periodizacion: [],
});

// Valor con el que viaja una variante dentro de un <select> (el alta elige por
// día con un desplegable, no con la grilla de botones de SelectorPlanDia).
// El prefijo distingue una variante real del sentinel de "sin plan".
export const valorVariante = (v) => `v:${v?.id}`;

/**
 * Traduce lo elegido en el alta a un plan listo para crearPlanAlumno.
 * Devuelve { plan, origen } — `origen` es "catalogo_v2" solo cuando salió de
 * `plan_variantes`, igual que ya hacía asignarVarianteDia.
 * Es pura a propósito: el alta no se puede probar sin base ni login, así que
 * la decisión de qué plan se crea se testea acá.
 */
export function planDeEleccion(valor, variantes, catalogoIdx) {
  if (!valor || valor === SIN_PLAN) return { plan: planVacio(), origen: null };
  const id = String(valor).startsWith("v:") ? String(valor).slice(2) : String(valor);
  const v = (variantes || []).find((x) => String(x.id) === id);
  if (!v) return { plan: planVacio(), origen: null };
  return { plan: { ...planVacio(), ...varianteAPlan(v, catalogoIdx || {}) }, origen: "catalogo_v2" };
}

export const FAMILIAS_VARIANTE = [
  { id: "full_body_basico",   label: "Full body básico",   dias: 1 },
  { id: "full_body_avanzado", label: "Full body avanzado", dias: 1 },
  { id: "unilateral",         label: "Unilateral",         dias: 1 },
  { id: "ppl",                label: "PPL (3 días)",       dias: 3 },
  { id: "hibrida_2",          label: "Híbrida (2 días)",   dias: 2 },
  { id: "hibrida_3",          label: "Híbrida (3 días)",   dias: 3 },
  // 2026-08-10 — las dos que destaparon la estructura del día:
  //   hipertrofia_2 · el plan real de Jacobo (core intercalado + finisher)
  //   circuito      · circuito intermitente de fuerza, 30 s × 8 × 4 rondas
  //                   (no tiene series ni reps: va por tiempo)
  { id: "hipertrofia_2",      label: "Hipertrofia (2 días)", dias: 2 },
  { id: "circuito",           label: "Circuito intermitente de fuerza", dias: 1 },
];

export const etiquetaFamilia = (familia) =>
  FAMILIAS_VARIANTE.find((f) => f.id === familia)?.label || familia || "Otras";

// Índice catalogo_id → fila del catálogo. Se arma una sola vez y se reusa para
// las 10 variantes en vez de un find() por ejercicio (el catálogo son 1.344
// filas y la pantalla las recorre en cada render).
export function indexarCatalogo(ejerciciosDelCatalogo) {
  const idx = {};
  (ejerciciosDelCatalogo || []).forEach((e) => {
    if (e && e.id != null) idx[String(e.id)] = e;
  });
  return idx;
}

// Nombre del plan tal como lo va a ver el admin en la grilla de días. Para las
// variantes de varios días se agrega el día del ciclo, porque si no tres filas
// de PPL se llaman igual y no hay forma de saber cuál se asignó.
export function nombreVariante(variante) {
  if (!variante) return "Plan";
  return variante.nombre || "Plan";
}

/**
 * Convierte una fila de `plan_variantes` al shape que espera crearPlanAlumno:
 *   { nombre, descripcion, dias:[{ dia, subtitulo, ejercicios:[...] }] }
 *
 * @param {object} variante  fila de plan_variantes (nombre, familia, dia_ciclo,
 *                           descripcion, ejercicios jsonb)
 * @param {Array|object} ejerciciosDelCatalogo  filas de catalogo_ejercicios, o
 *                           un índice ya armado con indexarCatalogo()
 */
export function varianteAPlan(variante, ejerciciosDelCatalogo) {
  if (!variante) return { nombre: "Plan", descripcion: "", dias: [] };
  const idx = Array.isArray(ejerciciosDelCatalogo)
    ? indexarCatalogo(ejerciciosDelCatalogo)
    : (ejerciciosDelCatalogo || {});

  // Un día por tiempo (circuito) no tiene series ni repeticiones: sus ocho
  // ejercicios se miden en segundos. Ver src/utils/estructuraDia.js.
  const porTiempo = variante.config?.modo === "tiempo";

  const ejercicios = (variante.ejercicios || []).map((ej) => {
    const c = idx[String(ej.catalogo_id)] || null;
    // El NOMBRE gana el de la variante: Lucas eligió cómo se llama cada
    // ejercicio en la rutina, y ejerciciosMedia.js resuelve imágenes por
    // nombre. Solo se cae al del catálogo si la variante no trae ninguno.
    const nombre = ej.nombre || c?.nombre_es || "Ejercicio";
    return {
      id: uid(),
      nombre,
      // Sin instrucciones en el catálogo se deja el patrón (Pecho, Sentadilla…)
      // como pista, en vez de un campo vacío que no le dice nada al alumno.
      desc: c?.instrucciones_es || (ej.patron ? `Patrón: ${ej.patron}` : ""),
      codigo: c?.codigo_di || null,
      gif: catalogoMediaUrl(c?.gif_url || ""),
      // La unidad la define el ejercicio: las planchas van por tiempo. El
      // catálogo no tiene columna de unidad, así que se deduce del nombre —
      // es la única regla de negocio que la app ya aplica hoy (CO004).
      // El día en modo tiempo va TODO por tiempo (30 s por ejercicio): la
      // unidad es del día, no de cada ejercicio, así que se fuerza acá y no
      // hay que marcar ocho ejercicios uno por uno.
      unidad: porTiempo || /plancha/i.test(nombre) ? "segundos" : "reps",
      // 2026-08-13: el equipamiento del catálogo viaja con el ejercicio — de
      // ahí sale la FORMA DE CARGA (barra + discos por lado vs. dos
      // mancuernas). Sin esto, las rutinas asignadas desde una variante
      // volverían a pedir "kilos" a secas.
      equipamiento: c?.equipment_es || null,
      // Bloque al que pertenece (2026-08-10): principal · core · finisher.
      // Sin `seccion` en la variante queda "principal" — las 10 variantes
      // viejas siguen siendo exactamente lo que eran.
      seccion: ["core", "finisher"].includes(ej.seccion) ? ej.seccion : "principal",
      video: "",
      mediaLocal: "",
      historial: [],
    };
  });

  return {
    nombre: nombreVariante(variante),
    descripcion: variante.descripcion || "",
    dias: [
      {
        dia: variante.dia_ciclo ? `Día ${variante.dia_ciclo}` : "Sesión",
        subtitulo: variante.nombre || "",
        // La estructura del día viaja con la variante (2026-08-10): modo por
        // tiempo del circuito, core intercalado del plan de Jacobo.
        config: variante.config || {},
        ejercicios,
      },
    ],
  };
}

// Etiqueta CORTA para el botón: "Híbrida 3 días · Empuje + Peso muerto" no
// entra en un botón de celular. Dentro del grupo ya se sabe la familia, así
// que alcanza con el día del ciclo + la parte específica del nombre.
export function etiquetaVariante(variante) {
  if (!variante) return "";
  const partes = String(variante.nombre || "").split("·").map((s) => s.trim()).filter(Boolean);
  const corto = partes.length > 1 ? partes.slice(1).join(" · ") : (partes[0] || "Plan");
  return variante.dia_ciclo ? `Día ${variante.dia_ciclo} · ${corto}` : corto;
}

// Agrupa las variantes por familia respetando el orden de FAMILIAS_VARIANTE, y
// dentro de cada familia por dia_ciclo. Así los 3 días del PPL salen siempre
// 1-2-3 y no en el orden que devuelva PostgREST.
export function agruparVariantes(variantes) {
  const porFamilia = {};
  (variantes || []).forEach((v) => {
    const f = v.familia || "otras";
    (porFamilia[f] = porFamilia[f] || []).push(v);
  });
  const orden = FAMILIAS_VARIANTE.map((f) => f.id);
  return Object.keys(porFamilia)
    .sort((a, b) => {
      const ia = orden.indexOf(a), ib = orden.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })
    .map((familia) => ({
      familia,
      label: etiquetaFamilia(familia),
      // La descripción es la MISMA para los 3 días de una familia (Lucas la
      // escribió a nivel rutina, no a nivel día): se muestra una sola vez
      // arriba del grupo y no repetida en cada botón.
      descripcion: porFamilia[familia].find((v) => v.descripcion)?.descripcion || "",
      variantes: porFamilia[familia].sort((a, b) => (a.dia_ciclo || 0) - (b.dia_ciclo || 0)),
    }));
}
