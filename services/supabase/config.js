import { supabase, LOG, ERR } from "./cliente.js";

// ══════════════════════════════════════════════════════════════════════
// CONFIG GLOBAL DE LA APP (tabla app_config — migrations/007)
//   Valores compartidos por todos los alumnos, ej. videos de movilidad.
//   Si la tabla todavía no existe, devuelve null y la app usa el default.
// ══════════════════════════════════════════════════════════════════════

export async function getAppConfig(clave) {
  try {
    const { data, error } = await supabase
      .from("app_config")
      .select("valor")
      .eq("clave", clave)
      .maybeSingle();
    if (error) { LOG("getAppConfig", `⚠️ ${error.message}`); return null; }
    return data?.valor ?? null;
  } catch (e) {
    return null;
  }
}

export async function setAppConfig(clave, valor) {
  const { error } = await supabase
    .from("app_config")
    .upsert({ clave, valor, actualizado_en: new Date().toISOString() }, { onConflict: "clave" });
  if (error) { ERR("setAppConfig", `No se pudo guardar "${clave}" (¿corrió la migración 007?)`, error); return false; }
  LOG("setAppConfig", `✅ Config "${clave}" guardada.`);
  return true;
}

// Predeterminados de PREPARACIÓN (2026-08-10): las 3 versiones de movilidad y
// la entrada en calor que arrancan para todos los alumnos. Viven en app_config
// (claves prep_*) — ver src/utils/preparacion.js para la regla de herencia.
// Se traen las 4 de una sola consulta: la vista del alumno ya hace un
// getAppConfig para los videos y no vale la pena sumarle 4 roundtrips.
export async function getPrepGlobales() {
  try {
    const { data, error } = await supabase
      .from("app_config")
      .select("clave, valor")
      .like("clave", "prep_%");
    if (error) { LOG("getPrepGlobales", `⚠️ ${error.message}`); return {}; }
    const mapa = {};
    (data || []).forEach((r) => { mapa[String(r.clave).replace(/^prep_/, "")] = r.valor; });
    return mapa;
  } catch (e) {
    return {};
  }
}

// Predeterminados de PERIODIZACIÓN (2026-08-10): 4 objetivos × 2 niveles en la
// tabla `periodizaciones`, campo jsonb `semanas`. Es el NIVEL 1 del mismo
// esquema de dos niveles que la preparación — ver src/utils/periodizacion.js.
// Se devuelven indexados por "objetivo|nivel" para no repetir el find().
//
// 2026-08-12 — versión que además trae el NOMBRE de cada planificación.
// POR QUÉ: la columna `nombre` existía desde el día uno y NADIE la leía; las
// pantallas armaban el título con las constantes OBJETIVOS × NIVELES de
// src/utils/periodizacion.js, así que renombrar la fila en la base no cambiaba
// nada en pantalla. Un renombre que no se ve es un renombre mentiroso.
//
// Va aparte y no cambia la firma de listarPeriodizaciones() a propósito: esa
// devuelve el mapa de semanas y hay código que hace `perGlobales[clave]`
// esperando el array. Una sola consulta para las dos cosas.
export async function listarPeriodizacionesConNombres() {
  const vacio = { semanas: {}, nombres: {} };
  try {
    const { data, error } = await supabase
      .from("periodizaciones")
      .select("objetivo, nivel, nombre, semanas");
    if (error) { LOG("listarPeriodizaciones", `⚠️ ${error.message}`); return vacio; }
    const semanas = {}, nombres = {};
    (data || []).forEach((r) => {
      const k = `${r.objetivo}|${r.nivel}`;
      semanas[k] = r.semanas || [];
      if (r.nombre) nombres[k] = r.nombre;
    });
    return { semanas, nombres };
  } catch (e) {
    return vacio;
  }
}

export async function listarPeriodizaciones() {
  return (await listarPeriodizacionesConNombres()).semanas;
}

// 2026-08-12 — renombrar una planificación. La fila se identifica por
// (objetivo, nivel), que es lo que la referencia desde el alumno
// (rm.periodizacion_ref): cambiar el NOMBRE no toca esa clave, así que ningún
// alumno pierde su herencia al renombrar. Por eso el objetivo y el nivel no
// son editables — son el id, no la etiqueta.
export async function renombrarPeriodizacion(objetivo, nivel, nombre) {
  const { error } = await supabase
    .from("periodizaciones")
    .update({ nombre: nombre || null })
    .eq("objetivo", objetivo)
    .eq("nivel", nivel);
  if (error) { ERR("renombrarPeriodizacion", `No se pudo renombrar ${objetivo}/${nivel}`, error); return false; }
  LOG("renombrarPeriodizacion", `✅ ${objetivo}/${nivel} → "${nombre}"`);
  return true;
}

// 2026-08-12 — renombrar / redescribir un plan de entrenamiento
// (plan_variantes). Se actualiza por `id`, y ni `familia` ni `dia_ciclo` se
// tocan: son lo que usa agruparVariantes() para armar los grupos y lo que
// varianteAPlan() convierte en plan. El nombre es puro texto de pantalla —
// nada apunta a una variante por nombre.
export async function renombrarVariantePlan(id, patch) {
  const { error } = await supabase.from("plan_variantes").update(patch).eq("id", id);
  if (error) { ERR("renombrarVariantePlan", "No se pudo guardar la variante", error); return false; }
  LOG("renombrarVariantePlan", `✅ variante ${id} guardada.`);
  return true;
}

// VARIANTES DE PLAN (2026-08-10): las 10 rutinas que escribió Lucas
// (bilateral · unilateral · ppl · hibrida_2 · hibrida_3). Estaban en la base
// desde antes y NINGUNA pantalla las leía — por eso no había forma de
// asignarlas y el plan de la alumna de prueba quedaba vacío. Se traen crudas;
// la conversión al shape de plan la hace varianteAPlan (src/utils/planVariantes.js).
export async function listarVariantesPlan() {
  try {
    const { data, error } = await supabase
      .from("plan_variantes")
      // config (2026-08-10): la estructura del día que trae la variante —
      // modo por tiempo del circuito, core intercalado del plan de Jacobo.
      .select("id, nombre, familia, dia_ciclo, descripcion, ejercicios, config")
      .order("familia")
      .order("dia_ciclo", { nullsFirst: true });
    if (error) { LOG("listarVariantesPlan", `⚠️ ${error.message}`); return []; }
    LOG("listarVariantesPlan", `✅ ${(data || []).length} variantes.`);
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function guardarPeriodizacion(objetivo, nivel, semanas) {
  const { error } = await supabase
    .from("periodizaciones")
    .update({ semanas })
    .eq("objetivo", objetivo)
    .eq("nivel", nivel);
  if (error) { ERR("guardarPeriodizacion", `No se pudo guardar ${objetivo}/${nivel}`, error); return false; }
  LOG("guardarPeriodizacion", `✅ ${objetivo}/${nivel} guardada (${(semanas || []).length} semanas).`);
  return true;
}
