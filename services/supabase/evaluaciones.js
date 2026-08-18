import { supabase, LOG, ERR, limpiarPayload } from "./cliente.js";

// ──────────────────────────────────────────────────────────────────────
// PROTOCOLO DE EVALUACIÓN (tabla `evaluaciones`, migración 022)
// Batería simple: escalas 1-5 + checkboxes. El detalle vive en jsonb `datos`.
// Mismo patrón que bioimpedancia.
// ──────────────────────────────────────────────────────────────────────

export async function saveEvaluacion(alumno_id, datos) {
  // datos: { fecha, evaluador, nivel, objetivo, capacidades{}, movimiento{},
  //          seguridad{}, observaciones, plan_sugerido }
  const { fecha, evaluador, nivel, objetivo, ...resto } = datos;
  const payload = limpiarPayload({
    alumno_id,
    fecha: fecha || new Date().toISOString().split("T")[0],
    evaluador: evaluador || null,
    nivel: nivel || null,
    objetivo: objetivo || null,
    datos: resto, // capacidades, movimiento, seguridad, observaciones, plan_sugerido
  });

  LOG("saveEvaluacion", `⏳ Guardando evaluación para ${alumno_id}...`, payload);

  const { data, error } = await supabase
    .from("evaluaciones")
    .insert([payload])
    .select()
    .single();

  if (error) { ERR("saveEvaluacion", "Error guardando evaluación", error); throw error; }
  LOG("saveEvaluacion", `✅ Evaluación guardada`, data);
  return data;
}

export async function cargarEvaluaciones(alumno_id, limit = 50) {
  const { data, error } = await supabase
    .from("evaluaciones")
    .select("*")
    .eq("alumno_id", alumno_id)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) { ERR("cargarEvaluaciones", "Error cargando evaluaciones", error); return []; }
  return data || [];
}

export async function eliminarEvaluacion(id) {
  const { error } = await supabase.from("evaluaciones").delete().eq("id", id);
  if (error) { ERR("eliminarEvaluacion", error.message, error); throw error; }
}
