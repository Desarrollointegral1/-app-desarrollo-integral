// ============================================================================
// REHAB INTEGRAL — capa de datos (2026-08-09)
// ============================================================================
// La app de Griselda es otra app, pero contra la MISMA base y el MISMO cliente
// de Supabase: reusa el login de admins (auth-bridge), el bucket privado
// rehab-media y el catálogo de 1343 ejercicios. Lo único propio son las dos
// tablas de la migración 033 (pacientes / paciente_ejercicios).
//
// Por qué un archivo aparte y no más funciones en services/supabase.js: ese
// archivo ya pasa las 2.600 líneas y es el de la app de entrenamiento. Rehab
// no tiene que crecer ahí adentro.
import { supabase, loginAdmin, cerrarSesionAuth, subirMediaRehab, getSignedUrl } from "./supabase.js";
import { normalizarBusqueda } from "../src/utils/ejercicioAsistido.js";

export { supabase, cerrarSesionAuth, subirMediaRehab, getSignedUrl };

// ── EL FILTRO DE GRISELDA ───────────────────────────────────────────────────
// Regla del dominio, textual de Lucas: "lo de ella es todo sin peso, máquina,
// barra, mancuernas, sólo movilidad, elásticos, peso corporal".
//
// Se implementa como lista blanca sobre `equipment_es` y no como lista negra a
// propósito: con lista negra, cada implemento nuevo que entre al catálogo
// aparecería por default en la app de rehabilitación. Acá, lo que no está
// declarado no entra.
//
// Verificado contra la base el 2026-08-09: 401 ejercicios sin archivar pasan
// el filtro (330 peso corporal + 56 banda + 7 banda elástica + 8 rodillo).
// El grupo "Movilidad" no se suma como criterio aparte porque de sus 6
// ejercicios, 5 ya entran por su implemento y el sexto es con mancuerna.
export const EQUIPO_REHAB = ["Peso corporal", "Banda", "Banda elástica", "Rodillo"];

let cacheCatalogo = null;

/** Los ejercicios del catálogo que Griselda puede usar. Se traen una sola vez. */
export async function cargarCatalogoRehab() {
  if (cacheCatalogo) return cacheCatalogo;
  const { data, error } = await supabase
    .from("catalogo_ejercicios")
    .select("id, nombre_es, nombre_en, instrucciones_es, equipment_es, grupo_di, gif_url, image, archivado")
    .in("equipment_es", EQUIPO_REHAB)
    .order("nombre_es");
  if (error) {
    console.error("[rehab:cargarCatalogoRehab]", error.message);
    return [];
  }
  cacheCatalogo = (data || []).filter((e) => !e.archivado);
  return cacheCatalogo;
}

/**
 * Busca por nombre sin distinguir tildes ni mayúsculas — Griselda escribe
 * "movilidad de tobillo" y el catálogo dice "Movilidad de tobillo con banda".
 * Reusa el normalizador del armador asistido para que las dos búsquedas de la
 * casa se comporten igual.
 */
export function buscarCatalogoRehab(catalogo, texto, max = 25) {
  const q = normalizarBusqueda(texto);
  if (!q) return catalogo.slice(0, max);
  const palabras = q.split(" ").filter(Boolean);
  return catalogo
    .filter((e) => {
      const n = normalizarBusqueda(e.nombre_es || e.nombre_en);
      return palabras.every((p) => n.includes(p));
    })
    .slice(0, max);
}

// ── SESIÓN ──────────────────────────────────────────────────────────────────
const LS_KINE = "rehab_kine";

/**
 * Login con el mismo mecanismo de admins de la app de entrenamiento, con un
 * corte extra: acá sólo entra la kinesióloga. Un entrenador con PIN válido
 * abre sesión y no ve NADA (las policies de la 033 le devuelven cero filas),
 * así que se le cierra la sesión y se le dice por qué en vez de dejarlo
 * adentro mirando una lista vacía sin explicación.
 */
export async function loginKine(codigo, pin) {
  const admin = await loginAdmin(codigo, pin);
  if (admin?.rol !== "kinesiologa") {
    await cerrarSesionAuth();
    throw new Error("Este usuario no es de rehabilitación. Rehab Integral es la app de kinesiología.");
  }
  const kine = { id: admin.id, nombre: admin.nombre };
  try { localStorage.setItem(LS_KINE, JSON.stringify(kine)); } catch { /* modo privado */ }
  return kine;
}

/**
 * Recupera la sesión al recargar la página. La autoridad es la base, no el
 * localStorage: el id sale de la función kine_actual() (la misma que gobierna
 * las policies), y el nombre guardado es sólo para el saludo del encabezado.
 */
export async function recuperarSesionKine() {
  const { data: { session } = {} } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: id, error } = await supabase.rpc("kine_actual");
  if (error || !id) return null;
  let nombre = "";
  try { nombre = JSON.parse(localStorage.getItem(LS_KINE) || "{}").nombre || ""; } catch { /* ignorar */ }
  return { id, nombre };
}

export async function salirKine() {
  try { localStorage.removeItem(LS_KINE); } catch { /* ignorar */ }
  await cerrarSesionAuth();
}

// ── PACIENTES ───────────────────────────────────────────────────────────────
export async function listarPacientes() {
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .order("activo", { ascending: false })
    .order("nombre");
  if (error) { console.error("[rehab:listarPacientes]", error.message); throw new Error("No se pudo cargar la lista de pacientes."); }
  return data || [];
}

export async function crearPaciente(kineId, p) {
  const { data, error } = await supabase
    .from("pacientes")
    .insert([{
      kine_id: kineId,
      nombre: (p.nombre || "").trim(),
      telefono: (p.telefono || "").trim(),
      email: (p.email || "").trim(),
      // El input date manda "" cuando está vacío y Postgres no lo acepta como date.
      fecha_nacimiento: p.fecha_nacimiento || null,
      motivo: (p.motivo || "").trim(),
      notas: (p.notas || "").trim(),
    }])
    .select()
    .single();
  if (error) { console.error("[rehab:crearPaciente]", error.message); throw new Error("No se pudo guardar el paciente."); }
  return data;
}

export async function actualizarPaciente(id, patch) {
  const limpio = { ...patch };
  if ("fecha_nacimiento" in limpio) limpio.fecha_nacimiento = limpio.fecha_nacimiento || null;
  const { data, error } = await supabase.from("pacientes").update(limpio).eq("id", id).select().single();
  if (error) { console.error("[rehab:actualizarPaciente]", error.message); throw new Error("No se pudo guardar el cambio."); }
  return data;
}

/** Alta médica: la ficha se conserva, deja de aparecer entre los activos. */
export async function archivarPaciente(id, activo) {
  return actualizarPaciente(id, { activo });
}

// ── EJERCICIOS DEL PACIENTE ─────────────────────────────────────────────────
export async function listarEjerciciosPaciente(pacienteId) {
  const { data, error } = await supabase
    .from("paciente_ejercicios")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("orden")
    .order("created_at");
  if (error) { console.error("[rehab:listarEjerciciosPaciente]", error.message); throw new Error("No se pudieron cargar los ejercicios."); }
  return data || [];
}

export async function agregarEjercicioPaciente(pacienteId, ej, orden) {
  const { data, error } = await supabase
    .from("paciente_ejercicios")
    .insert([{
      paciente_id: pacienteId,
      nombre: (ej.nombre || "").trim(),
      indicaciones: (ej.indicaciones || "").trim(),
      media: ej.media || "",
      catalogo_id: ej.catalogo_id || null,
      orden: orden ?? 0,
    }])
    .select()
    .single();
  if (error) { console.error("[rehab:agregarEjercicioPaciente]", error.message); throw new Error("No se pudo agregar el ejercicio."); }
  return data;
}

export async function actualizarEjercicioPaciente(id, patch) {
  const { data, error } = await supabase.from("paciente_ejercicios").update(patch).eq("id", id).select().single();
  if (error) { console.error("[rehab:actualizarEjercicioPaciente]", error.message); throw new Error("No se pudo guardar el ejercicio."); }
  return data;
}

export async function eliminarEjercicioPaciente(id) {
  const { error } = await supabase.from("paciente_ejercicios").delete().eq("id", id);
  if (error) { console.error("[rehab:eliminarEjercicioPaciente]", error.message); throw new Error("No se pudo borrar el ejercicio."); }
}
