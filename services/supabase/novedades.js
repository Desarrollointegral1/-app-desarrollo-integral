import { supabase, ERR } from "./cliente.js";

// ──────────────────────────────────────────────────────────────────────
// NOVEDADES
// ──────────────────────────────────────────────────────────────────────

export async function cargarNovedades() {
  const { data, error } = await supabase
    .from("novedades")
    .select("*")
    .eq("activo", true)
    .order("fecha", { ascending: false });
  if (error) { ERR("cargarNovedades", error.message, error); return []; }
  return data || [];
}

export async function crearNovedad(novedad) {
  const { data, error } = await supabase
    .from("novedades")
    .insert([{ ...novedad, fecha: new Date().toISOString(), activo: true }])
    .select()
    .single();
  if (error) { ERR("crearNovedad", error.message, error); throw error; }
  return data;
}

export async function toggleNovedad(id, activo) {
  const { error } = await supabase.from("novedades").update({ activo }).eq("id", id);
  if (error) { ERR("toggleNovedad", error.message, error); throw error; }
}

export async function eliminarNovedad(id) {
  const { error } = await supabase.from("novedades").delete().eq("id", id);
  if (error) { ERR("eliminarNovedad", error.message, error); throw error; }
}
