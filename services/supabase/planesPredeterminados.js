import { supabase, LOG, ERR } from "./cliente.js";
import { crearPlanAlumno } from "./planes.js";

// ══════════════════════════════════════════════════════════════════════
// PLANES PREDETERMINADOS — plantillas del Armador, NO ligadas a un alumno
// (punto 6, migración 018). El Armador solo crea/edita estas; la
// asignación a un alumno puntual es un paso aparte (asignarPlanPredeterminado).
// ══════════════════════════════════════════════════════════════════════

export async function listarPlanesPredeterminados() {
  LOG("listarPlanesPredeterminados", "⏳ Listando plantillas...");
  const { data, error } = await supabase
    .from("planes_predeterminados")
    .select("*")
    .order("grupo")
    .order("nombre");
  if (error) { ERR("listarPlanesPredeterminados", "Error listando plantillas", error); return []; }
  LOG("listarPlanesPredeterminados", `✅ ${(data || []).length} plantilla(s)`);
  return data || [];
}

export async function crearPlanPredeterminado(nombre, grupo, dias, nivel) {
  LOG("crearPlanPredeterminado", `⏳ Creando plantilla "${nombre}"...`);
  const { data, error } = await supabase
    .from("planes_predeterminados")
    .insert({ nombre, grupo: grupo || "", dias: dias || [], nivel: nivel || null })
    .select()
    .single();
  if (error) { ERR("crearPlanPredeterminado", "Error creando plantilla", error); return null; }
  LOG("crearPlanPredeterminado", `✅ Plantilla "${nombre}" creada.`);
  return data;
}

// Ronda 18: editar una plantilla existente desde "Ver todos los planes"
// (renombrar, cambiar categoría/nivel, editar ejercicios). Patch parcial:
// solo pisa las claves presentes ({ nombre, grupo, nivel, dias }).
export async function actualizarPlanPredeterminado(id, patch) {
  LOG("actualizarPlanPredeterminado", `⏳ Actualizando plantilla ${id}...`, patch);
  const { error } = await supabase
    .from("planes_predeterminados")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) { ERR("actualizarPlanPredeterminado", "Error actualizando plantilla", error); return false; }
  LOG("actualizarPlanPredeterminado", `✅ Plantilla ${id} actualizada.`);
  return true;
}

export async function eliminarPlanPredeterminado(id) {
  const { error } = await supabase.from("planes_predeterminados").delete().eq("id", id);
  if (error) { ERR("eliminarPlanPredeterminado", "Error eliminando plantilla", error); return false; }
  return true;
}

// Copia una plantilla a una fila REAL de alumno_planes para un alumno y
// día puntuales — mismo camino que crearPlanAlumno (reemplaza lo que
// hubiera ese día), pero con origen='catalogo_v2' y con ids NUEVOS en
// cada ejercicio (_savePlanDias los genera si no son uuid válidos) para
// que la plantilla y la instancia queden totalmente desacopladas: editar
// después el plan de ESTE alumno no toca la plantilla ni a otros alumnos
// que usen la misma plantilla.
export async function asignarPlanPredeterminado(alumno_id, dia_semana, plantilla) {
  LOG("asignarPlanPredeterminado", `⏳ Asignando "${plantilla.nombre}" a ${alumno_id} (${dia_semana})...`);
  const diasCopia = (plantilla.dias || []).map((d) => ({
    dia: d.dia || "Sesion",
    subtitulo: d.subtitulo || "",
    // La estructura viaja con la copia (2026-08-10): sin esto, asignar una
    // plantilla de circuito dejaba el día en modo repeticiones.
    config: d.config || {},
    ejercicios: (d.ejercicios || []).map((ej) => ({ ...ej, id: undefined })),
  }));
  return crearPlanAlumno(alumno_id, dia_semana, { nombre: plantilla.nombre, dias: diasCopia }, "catalogo_v2");
}
