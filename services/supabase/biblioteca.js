import { supabase, LOG, ERR, SUPABASE_URL } from "./cliente.js";
// Mapa nombre→código oficial (M/E/C/P), fuente de verdad en planTemplates.js.
// Se usa en propagarEjercicioATodos para asignarle código en el momento a un
// ejercicio viejo que todavía no lo tiene, SI su nombre matchea uno oficial.
import { CODIGOS_EJERCICIO } from "../../src/utils/planTemplates.js";
const _codigoOficialPorNombre = (nombre) => {
  for (const key of Object.keys(CODIGOS_EJERCICIO)) {
    if (key.slice(key.indexOf("|") + 1) === nombre) return CODIGOS_EJERCICIO[key];
  }
  return null;
};

// ──────────────────────────────────────────────────────────────────────
// BIBLIOTECA DE EJERCICIOS
// ──────────────────────────────────────────────────────────────────────

export async function cargarBiblioteca() {
  const { data, error } = await supabase
    .from("biblioteca_ejercicios")
    .select("*")
    .order("usos", { ascending: false });
  if (error) { ERR("cargarBiblioteca", error.message, error); return []; }
  return data || [];
}

export async function guardarEjercicioBiblioteca(ej) {
  // Si ya existe por nombre exacto (case-insensitive), actualiza. Si no, inserta.
  const nombreNorm = ej.nombre.trim();
  const { data: existente } = await supabase
    .from("biblioteca_ejercicios")
    .select("id, usos")
    .ilike("nombre", nombreNorm)
    .maybeSingle();

  if (existente) {
    const update = {};
    if (ej.desc) update.descripcion = ej.desc;
    if (ej.video) update.video = ej.video;
    if (ej.gif) update.gif = ej.gif;
    update.usos = (existente.usos || 0) + 1;
    update.actualizado_en = new Date().toISOString();
    const { error } = await supabase.from("biblioteca_ejercicios").update(update).eq("id", existente.id);
    if (error) ERR("guardarEjercicioBiblioteca:update", error.message, error);
  } else {
    const { error } = await supabase.from("biblioteca_ejercicios").insert([{
      nombre: nombreNorm,
      descripcion: ej.desc || "",
      video: ej.video || "",
      gif: ej.gif || null,
      usos: 1,
    }]);
    if (error) ERR("guardarEjercicioBiblioteca:insert", error.message, error);
  }
}

export async function eliminarEjercicioBiblioteca(id) {
  const { error } = await supabase.from("biblioteca_ejercicios").delete().eq("id", id);
  if (error) { ERR("eliminarEjercicioBiblioteca", error.message, error); throw error; }
}

// Edición DIRECTA por id — a diferencia de guardarEjercicioBiblioteca (que
// matchea/crea por nombre, pensado para el autoguardado desde Principales),
// esta es la que usa la pantalla Biblioteca (punto 8/9, ronda 12): ahí se
// edita un ejercicio puntual ya existente (nombre, descripción, video y/o
// GIF manual) sin ambigüedad de "a cuál le pega por nombre".
export async function actualizarEjercicioBibliotecaPorId(id, patch) {
  const update = { actualizado_en: new Date().toISOString() };
  if (patch.nombre !== undefined) update.nombre = patch.nombre;
  if (patch.desc !== undefined) update.descripcion = patch.desc;
  if (patch.video !== undefined) update.video = patch.video;
  if (patch.gif !== undefined) update.gif = patch.gif || null;
  const { error } = await supabase.from("biblioteca_ejercicios").update(update).eq("id", id);
  if (error) { ERR("actualizarEjercicioBibliotecaPorId", error.message, error); return false; }
  LOG("actualizarEjercicioBibliotecaPorId", `✅ Actualizado ${id}`, update);
  return true;
}

// ──────────────────────────────────────────────────────────────────────
// "GUARDAR PARA TODOS" (ronda 11)
// ──────────────────────────────────────────────────────────────────────
// Al editar un ejercicio desde el admin para UN alumno puntual, "Guardar"
// (de siempre) solo toca la copia de ESE alumno. "Guardar para todos"
// además:
//   1) actualiza el maestro en biblioteca_ejercicios (matched por código,
//      o por nombre exacto si el ejercicio es viejo y no tiene código —
//      en ese caso le pone el código en el momento);
//   2) propaga nombre/descripción/video a la copia de TODOS los alumnos
//      que tengan ese mismo ejercicio:
//      - Principales (categoria="principales"): están en la tabla
//        normalizada plan_ejercicios, así que un solo UPDATE con
//        .eq("codigo", codigo) (o .eq("nombre", nombreOriginal) si no
//        tiene código) toca TODAS las filas de TODOS los alumnos de una.
//      - Movilidad/Act. Elástico/Entrada en calor (categoria="movilidad"
//        |"calor"|"activacion"): son un array jsonb por alumno
//        (alumnos.plan_movilidad/plan_calor/plan_activacion). PostgREST
//        no soporta "actualizar el elemento N de un array jsonb" de forma
//        declarativa, así que se trae esa columna de TODOS los alumnos,
//        se parchea en JS el ejercicio que matchea (por código o nombre)
//        y se reescribe la columna completa SOLO en los alumnos que
//        tenían ese ejercicio.
export async function propagarEjercicioATodos({ categoria, codigo, nombreOriginal, form }) {
  const cambios = { nombre: (form.nombre || "").trim(), desc: form.desc || "", video: form.video || "", gif: form.gif || "" };
  // Si no traía código, pero su nombre matchea uno oficial de
  // planTemplates.js, se lo asignamos en este mismo momento (pedido
  // explícito: "asignale código en el momento").
  const codigoAAsignar = codigo || (nombreOriginal ? _codigoOficialPorNombre(nombreOriginal) : null);
  LOG("propagarEjercicioATodos", `⏳ Propagando "${cambios.nombre}" (categoria=${categoria}, codigo=${codigo || "sin código"}${!codigo && codigoAAsignar ? `, asignando ${codigoAAsignar} ahora` : ""})`);
  let alumnosActualizados = 0;
  let ejerciciosActualizados = 0;

  try {
    if (categoria === "principales") {
      // plan_ejercicios: una tabla normalizada, un solo UPDATE masivo.
      const patch = { nombre: cambios.nombre, descripcion: cambios.desc, video: cambios.video, gif: cambios.gif || null };
      if (!codigo && codigoAAsignar) patch.codigo = codigoAAsignar;
      let query = supabase.from("plan_ejercicios").update(patch);
      query = codigo ? query.eq("codigo", codigo) : query.eq("nombre", nombreOriginal);
      const { data, error } = await query.select("id");
      if (error) ERR("propagarEjercicioATodos", "Error actualizando plan_ejercicios", error);
      else ejerciciosActualizados = (data || []).length;
    } else if (["movilidad", "calor", "activacion"].includes(categoria)) {
      const col = "plan_" + categoria;
      const { data: filas, error } = await supabase.from("alumnos").select("id," + col);
      if (error) {
        ERR("propagarEjercicioATodos", `Error leyendo ${col} de alumnos`, error);
      } else {
        for (const fila of filas || []) {
          const arr = fila[col];
          if (!Array.isArray(arr) || arr.length === 0) continue;
          let cambio = false;
          const nuevo = arr.map((e) => {
            const matchCodigo = codigo && e.codigo === codigo;
            const matchNombre = !codigo && nombreOriginal && e.nombre === nombreOriginal;
            if (matchCodigo || matchNombre) {
              cambio = true;
              return { ...e, nombre: cambios.nombre, desc: cambios.desc, video: cambios.video, gif: cambios.gif || e.gif || "", codigo: e.codigo || codigoAAsignar || null };
            }
            return e;
          });
          if (cambio) {
            const { error: upErr } = await supabase.from("alumnos").update({ [col]: nuevo }).eq("id", fila.id);
            if (upErr) ERR("propagarEjercicioATodos", `Error escribiendo ${col} del alumno ${fila.id}`, upErr);
            else alumnosActualizados++;
          }
        }
      }
    }

    // Maestro: biblioteca_ejercicios (matched por código, o por nombre exacto
    // — y si no tenía código, se lo asigna en este mismo momento).
    if (codigo) {
      const { error } = await supabase
        .from("biblioteca_ejercicios")
        .update({ nombre: cambios.nombre, descripcion: cambios.desc, video: cambios.video, gif: cambios.gif || null, actualizado_en: new Date().toISOString() })
        .eq("codigo", codigo);
      if (error) ERR("propagarEjercicioATodos", "Error actualizando biblioteca_ejercicios por código", error);
    } else if (nombreOriginal) {
      const patchBiblio = { nombre: cambios.nombre, descripcion: cambios.desc, video: cambios.video, gif: cambios.gif || null, actualizado_en: new Date().toISOString() };
      if (codigoAAsignar) patchBiblio.codigo = codigoAAsignar;
      const { error } = await supabase
        .from("biblioteca_ejercicios")
        .update(patchBiblio)
        .ilike("nombre", nombreOriginal);
      if (error) ERR("propagarEjercicioATodos", "Error actualizando biblioteca_ejercicios por nombre", error);
    }

    const total = categoria === "principales" ? ejerciciosActualizados : alumnosActualizados;
    LOG("propagarEjercicioATodos", `✅ Propagado — ${total} destino(s) actualizado(s)`);
    return { ok: true, ejerciciosActualizados, alumnosActualizados, total };
  } catch (e) {
    ERR("propagarEjercicioATodos", "Error propagando ejercicio", e);
    return { ok: false, error: e, total: 0 };
  }
}

// ══════════════════════════════════════════════════════════════════════
// CATÁLOGO DE EJERCICIOS (dataset ExerciseDB + custom DI — migración 015)
// La media vive en el bucket público `catalogo-ejercicios`; la tabla
// guarda paths RELATIVOS (images/xxx.jpg · videos/xxx.gif). Los custom DI
// traen paths de la app (/ejercicios/xxx.gif) o URLs completas.
// ══════════════════════════════════════════════════════════════════════

const CATALOGO_MEDIA_BASE = `${SUPABASE_URL}/storage/v1/object/public/catalogo-ejercicios/`;

export function catalogoMediaUrl(path) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/") || path.startsWith("data:")) return path;
  return CATALOGO_MEDIA_BASE + path;
}

// Carga TODO el catálogo (1.344 filas). PostgREST corta en 1000 por
// default, así que se pagina con range(). Se llama on-demand al abrir la
// Biblioteca o el Armador (no en el arranque de la app).
export async function cargarCatalogo() {
  LOG("cargarCatalogo", "⏳ Cargando catálogo completo...");
  const PAGE = 1000;
  let all = [];
  for (let desde = 0; ; desde += PAGE) {
    const { data, error } = await supabase
      .from("catalogo_ejercicios")
      .select("id,nombre_es,nombre_en,categoria,equipment,equipment_es,target,target_es,muscle_group_es,secondary_muscles_es,instrucciones_es,image,gif_url,video,codigo_di,grupo_di,custom,editado,attribution,musculos,musculo_default,tags,tag_default,archivado,nivel,unidad")
      .order("nombre_es")
      .range(desde, desde + PAGE - 1);
    if (error) { ERR("cargarCatalogo", "Error cargando catálogo", error); return all; }
    all = all.concat(data || []);
    if (!data || data.length < PAGE) break;
  }
  LOG("cargarCatalogo", `✅ ${all.length} ejercicios de catálogo.`);
  return all;
}

// 2026-07-31 — el resumen del plan (modal, ver ResumenPlanModal.jsx) quiere
// mostrar el grupo muscular de cada ejercicio del día. Ese dato SOLO vive
// en catalogo_ejercicios (musculo_default/tag_default/tags/muscle_group_es
// /target_es) — biblioteca_ejercicios (la curada, la que ya se cargaba al
// loguear) no tiene ese campo. Traer el catálogo COMPLETO (1344 filas, con
// instrucciones/gif pesados) solo para esto sería desperdicio; esta versión
// pide solo las columnas de nombre+músculo, paginada igual que
// cargarCatalogo, y se llama on-demand al abrir el modal — no en el
// arranque de la app.
export async function cargarMusculosCatalogo() {
  const PAGE = 1000;
  let all = [];
  for (let desde = 0; ; desde += PAGE) {
    const { data, error } = await supabase
      .from("catalogo_ejercicios")
      .select("nombre_es,codigo_di,musculo_default,tag_default,tags,muscle_group_es,target_es")
      .range(desde, desde + PAGE - 1);
    if (error) { ERR("cargarMusculosCatalogo", error.message, error); return all; }
    all = all.concat(data || []);
    if (!data || data.length < PAGE) break;
  }
  return all;
}

// Cache por sesión (auditoría 2026-08-02): ResumenPlanModal re-bajaba las
// ~1.344 filas de músculos en cada apertura del resumen. El catálogo de
// músculos no cambia dentro de una sesión — se cachea la promesa como ya se
// hace con cargarCatalogoCached.
let _musculosCache = null;
export function cargarMusculosCatalogoCached() {
  if (!_musculosCache) _musculosCache = cargarMusculosCatalogo();
  return _musculosCache;
}

// Edición desde la app (biblioteca nueva): nombre, instrucciones, video
// propio. Marca editado=true para distinguir filas tocadas por Lucas.
export async function guardarEjercicioCatalogo(id, patch) {
  LOG("guardarEjercicioCatalogo", `⏳ Guardando ${id}...`, patch);
  const { error } = await supabase
    .from("catalogo_ejercicios")
    .update({ ...patch, editado: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) { ERR("guardarEjercicioCatalogo", "Error guardando", error); return false; }
  LOG("guardarEjercicioCatalogo", `✅ ${id} guardado.`);
  return true;
}

// Punto 5 (2026-07-21): código editable a mano desde la Biblioteca, CON
// validación de duplicados (no hay auto-reordenamiento de todo el grupo
// muscular — si Lucas quiere intercambiar dos códigos, edita cada uno por
// separado; el chequeo de duplicado evita que dos ejercicios compartan
// código sin querer). Si el ejercicio ya estaba asignado en planes de
// alumnos con el código viejo, esos planes se actualizan para seguir
// apuntando al ejercicio correcto (mismo criterio que
// propagarEjercicioATodos: UPDATE directo por código en plan_ejercicios).
export async function validarCodigoDisponible(codigo, idExcluir) {
  if (!codigo) return true;
  const { data, error } = await supabase
    .from("catalogo_ejercicios")
    .select("id")
    .eq("codigo_di", codigo)
    .neq("id", idExcluir || "")
    .limit(1);
  if (error) { ERR("validarCodigoDisponible", "Error validando código", error); return false; }
  return !(data && data.length > 0);
}

// Ronda 17 (punto 3): renombrar una categoría del catálogo — update masivo
// en catalogo_ejercicios, se propaga a TODOS los ejercicios que tenían esa
// categoría (a diferencia de codigo_di, acá no hace falta chequear
// duplicados: dos ejercicios pueden compartir categoría sin problema).
export async function renombrarCategoriaCatalogo(oldCategoria, newCategoria) {
  if (!oldCategoria || !newCategoria || oldCategoria === newCategoria) return true;
  LOG("renombrarCategoriaCatalogo", `⏳ "${oldCategoria}" → "${newCategoria}"...`);
  const { error, count } = await supabase
    .from("catalogo_ejercicios")
    .update({ categoria: newCategoria, editado: true }, { count: "exact" })
    .eq("categoria", oldCategoria);
  if (error) { ERR("renombrarCategoriaCatalogo", "Error renombrando categoría", error); return false; }
  LOG("renombrarCategoriaCatalogo", `✅ ${count ?? "?"} ejercicio(s) actualizados.`);
  return true;
}

export async function renombrarCodigoEjercicio(oldCode, newCode) {
  if (!oldCode || !newCode || oldCode === newCode) return true;
  LOG("renombrarCodigoEjercicio", `⏳ ${oldCode} → ${newCode} en plan_ejercicios y biblioteca_ejercicios...`);
  const { error: e1 } = await supabase.from("plan_ejercicios").update({ codigo: newCode }).eq("codigo", oldCode);
  if (e1) { ERR("renombrarCodigoEjercicio", "Error actualizando plan_ejercicios", e1); return false; }
  const { error: e2 } = await supabase.from("biblioteca_ejercicios").update({ codigo: newCode }).eq("codigo", oldCode);
  if (e2) { ERR("renombrarCodigoEjercicio", "Error actualizando biblioteca_ejercicios", e2); return false; }
  LOG("renombrarCodigoEjercicio", "✅ Código renombrado en las referencias existentes.");
  return true;
}

// Punto 4: flujo "Crear ejercicio nuevo" — el único lugar donde se sube
// media propia para un ejercicio del catálogo (editar uno existente NO
// permite reemplazar su media, ver CatalogoExplorer.jsx). Id custom con
// prefijo DI- para distinguirlo del dataset (mismo criterio que ronda 14).
export async function crearEjercicioCatalogo(payload) {
  const id = "DI-CUSTOM-" + Date.now().toString(36).toUpperCase();
  LOG("crearEjercicioCatalogo", `⏳ Creando ${id}...`, payload);
  const row = {
    id,
    nombre_es: payload.nombre_es,
    instrucciones_es: payload.instrucciones_es || "",
    categoria: payload.categoria || "waist",
    equipment_es: payload.tag_default || (payload.tags || [])[0] || "",
    target_es: payload.musculo_default || (payload.musculos || [])[0] || "",
    secondary_muscles_es: (payload.musculos || []).filter((m) => m !== payload.musculo_default),
    musculos: payload.musculos || [],
    musculo_default: payload.musculo_default || "",
    tags: payload.tags || [],
    tag_default: payload.tag_default || "",
    video: payload.video || "",
    codigo_di: payload.codigo_di || null,
    grupo_di: payload.grupo_di || null,
    nivel: payload.nivel || null,
    custom: true,
    editado: true,
  };
  const { data, error } = await supabase.from("catalogo_ejercicios").insert(row).select().single();
  if (error) { ERR("crearEjercicioCatalogo", "Error creando ejercicio", error); return null; }
  LOG("crearEjercicioCatalogo", `✅ ${id} creado.`);
  return data;
}

// B5: al elegir un ejercicio del catálogo para un plan, si no existe en
// biblioteca_ejercicios se agrega (con su codigo_di si lo tiene, o el
// próximo código custom X## libre) para que después sea taxonomizable.
// Devuelve el código con el que quedó en biblioteca.
export async function agregarCatalogoABiblioteca(item) {
  try {
    // ¿ya está? — por código DI o por nombre exacto
    let query = supabase.from("biblioteca_ejercicios").select("id,codigo,nombre");
    if (item.codigo_di) query = query.eq("codigo", item.codigo_di);
    else query = query.eq("nombre", item.nombre_es);
    const { data: existentes } = await query.limit(1);
    if (existentes && existentes.length > 0) return existentes[0].codigo;

    let codigo = item.codigo_di;
    if (!codigo) {
      // próximo X## libre
      const { data: xs } = await supabase
        .from("biblioteca_ejercicios")
        .select("codigo")
        .like("codigo", "X%");
      const max = (xs || []).reduce((m, r) => {
        const n = parseInt(String(r.codigo).slice(1), 10);
        return Number.isFinite(n) && n > m ? n : m;
      }, 0);
      codigo = "X" + String(max + 1).padStart(2, "0");
    }
    const { error } = await supabase.from("biblioteca_ejercicios").insert({
      nombre: item.nombre_es,
      descripcion: item.instrucciones_es || "",
      video: item.video || "",
      gif: catalogoMediaUrl(item.gif_url || ""),
      codigo,
      grupo: null,
    });
    if (error) { ERR("agregarCatalogoABiblioteca", "Error insertando", error); return codigo; }
    LOG("agregarCatalogoABiblioteca", `✅ "${item.nombre_es}" agregado a biblioteca como ${codigo}.`);
    return codigo;
  } catch (e) {
    ERR("agregarCatalogoABiblioteca", e.message, e);
    return item.codigo_di || null;
  }
}

// Cache module-level: el catálogo se carga una sola vez por sesión (lo
// comparten la Biblioteca, el Armador y el buscador del editor de planes).
let _catalogoCache = null;
export function cargarCatalogoCached() {
  if (!_catalogoCache) _catalogoCache = cargarCatalogo();
  return _catalogoCache;
}
