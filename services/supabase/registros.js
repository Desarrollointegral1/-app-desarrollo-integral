import { supabase, LOG, ERR } from "./cliente.js";
// setVuelta ya no se usa acá (2026-08-13): el merge de vueltas lo hace la base
// en la RPC guardar_peso_vuelta — ver saveDailyWeight.
import { pesoRepresentativo } from "../../src/utils/pesos.js";

// ══════════════════════════════════════════════════════════════════════
// FLUJO 4: HISTORIAL DE PESOS
// ══════════════════════════════════════════════════════════════════════

export async function cargarPesos(alumno_id, fallback) {
  LOG("cargarPesos", `⏳ Cargando pesos de ${alumno_id}...`);

  // La fuente de verdad es registros_diarios (una fila por día, con un jsonb
  // {ejercicio_id: peso}). La tabla historial_pesos quedó inutilizable: su
  // FK apunta a una tabla "ejercicios" que la app no usa, así que cada insert
  // fallaba en silencio y el historial nunca se llenó.
  try {
    const { data, error } = await supabase
      .from("registros_diarios")
      .select("fecha, pesos")
      .eq("alumno_id", alumno_id)
      .order("fecha", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      LOG("cargarPesos", `ℹ️ Sin historial para ${alumno_id}. Pesos en cero.`);
      return fallback;
    }

    const pesos       = {};
    const historiales = {};

    data.forEach((row) => {
      Object.entries(row.pesos || {}).forEach(([eid, p]) => {
        // `p` puede ser un número (registro viejo, una sola vuelta) o un array
        // con una entrada por serie (2026-08-09, peso por vuelta).
        // pesoRepresentativo devuelve el máximo del día en los dos casos, que
        // es lo que miran el historial y los gráficos de evolución.
        const val = pesoRepresentativo(p);
        if (!val) return;
        pesos[eid] = val;
        if (!historiales[eid]) historiales[eid] = [];
        // `vueltas` va crudo para que la vista pueda mostrar las series del
        // día; `peso` sigue siendo un número para no romper a quien lo lea.
        historiales[eid].push({ peso: val, serie: 1, fecha: row.fecha, vueltas: p });
      });
    });

    LOG("cargarPesos", `✅ ${data.length} día(s) en ${Object.keys(historiales).length} ejercicio(s).`, pesos);
    return { pesos, historiales };

  } catch (e) {
    ERR("cargarPesos", "Error al cargar pesos", e);
    return fallback;
  }
}

// No-op: compatibilidad. Los pesos se guardan con savePeso() individualmente.
export async function guardarPesos(_id, _pesos, _historiales) {}


// ══════════════════════════════════════════════════════════════════════
// FLUJO 5: GUARDAR PESO EN TIEMPO REAL
//   App.jsx handlePeso() → savePeso()
//   SOLO ejercicios de plan.dias (principales).
// ══════════════════════════════════════════════════════════════════════

export async function savePeso(alumno_id, ejercicio_id, peso, serie = 1) {
  if (!peso || Number(peso) <= 0) {
    LOG("savePeso", `⏭️ Ignorado (peso 0): ${ejercicio_id}`);
    return;
  }

  const registro = {
    alumno_id,
    ejercicio_id,
    peso:  Number(peso),
    serie: Number(serie),
    fecha: new Date().toISOString().split("T")[0],
  };

  LOG("savePeso", `⏳ Insertando ${peso}kg → ${ejercicio_id}`, registro);

  const { data, error } = await supabase
    .from("historial_pesos")
    .insert(registro)
    .select()
    .single();

  if (error) {
    ERR("savePeso", "No se pudo guardar el peso", error);
    return;
  }

  LOG("savePeso", `✅ Guardado en historial_pesos:`, data);
}


export async function getHistorialPesos(alumno_id) {
  LOG("getHistorialPesos", `⏳ Historial completo de ${alumno_id}...`);

  const { data, error } = await supabase
    .from("historial_pesos")
    .select("*")
    .eq("alumno_id", alumno_id)
    .order("id", { ascending: false });

  if (error) {
    ERR("getHistorialPesos", "Error", error);
    return [];
  }

  LOG("getHistorialPesos", `✅ ${data?.length ?? 0} registros.`);
  return data || [];
}

// ────────────────────────────────────────────────────────────────────────
// REGISTROS DIARIOS: Guardar peso para un día específico
// ────────────────────────────────────────────────────────────────────────

/**
 * Guarda el peso de un ejercicio en el registro del día.
 *
 * `serie` (2026-08-09, pedido de Lucas "el peso se tiene que marcar por
 * vuelta"): si viene, el ejercicio guarda un array con una entrada por serie
 * en vez de un solo número. Sin `serie` se conserva el comportamiento viejo,
 * así que las llamadas que no la pasan siguen andando igual.
 *
 * Un peso vacío o 0 ya no se ignora cuando hay serie: es la forma de BORRAR
 * una vuelta mal cargada. Sin serie se mantiene el ignorado de siempre.
 */
export async function saveDailyWeight(alumno_id, fecha, ejercicio_id, peso, serie) {
  const porVuelta = serie != null;
  if (!porVuelta && (!peso || Number(peso) <= 0)) {
    LOG("saveDailyWeight", `⏭️ Ignorado (peso 0): ${ejercicio_id}`);
    return;
  }

  // 2026-08-13 — DOS CAMBIOS DE RAÍZ, los dos por pérdida de trabajo del alumno:
  //
  // 1) El merge lo hace la BASE (migración 041, guardar_peso_vuelta). Antes acá
  //    se hacía SELECT del jsonb `pesos` entero + UPDATE del jsonb entero, y el
  //    debounce de App.jsx es por casillero (ejercicio:serie): dos casilleros
  //    cargados con pocos cientos de milisegundos de diferencia lanzaban dos
  //    ciclos solapados y el segundo pisaba al primero con la versión vieja.
  //    Reproducido contra la base: dos escrituras sobre la misma lectura dejan
  //    {"ejB":[40]} y el peso de ejA desaparece. La RPC toma la fila (FOR
  //    UPDATE) y hace el merge adentro de la transacción: el orden deja de
  //    importar. La semántica de vueltas es la misma de setVuelta().
  //
  // 2) Si falla, LANZA. Antes logueaba y hacía `return`, así que el try/catch
  //    de registrarDia() (App.jsx) nunca se enteraba: el botón se ponía verde y
  //    el alumno se iba convencido de que había quedado guardado.
  const { data, error } = await supabase.rpc("guardar_peso_vuelta", {
    p_alumno_id: alumno_id,
    p_fecha: fecha,
    p_ejercicio_id: String(ejercicio_id),
    p_peso: peso === "" || peso == null ? null : Number(peso),
    p_serie: porVuelta ? Number(serie) : null,
    // 2026-08-14 — `p_detalle` va SIEMPRE en null. El 13 acá viajaba de qué
    // estaba hecho el peso (barra + discos), pero Lucas sacó el selector que
    // lo producía: el alumno hace la cuenta en la cabeza y escribe un número.
    // El parámetro se sigue mandando porque la RPC de la migración 042 lo
    // declara sin default, y en null NO pisa lo que ya esté guardado. La
    // columna `pesos_detalle` queda sin uso, con los datos de las pruebas.
    p_detalle: null,
  });

  if (error) {
    ERR("saveDailyWeight", "No se pudo guardar el peso", error);
    throw new Error(error.message || "No se pudo guardar el peso");
  }

  LOG("saveDailyWeight", `✅ Peso ${peso} → ${ejercicio_id} en ${fecha}`, data);
  return data;
}

// ────────────────────────────────────────────────────────────────────────
// REGISTROS DIARIOS: Marcar asistencia
// ────────────────────────────────────────────────────────────────────────

export async function saveDailyAttendance(alumno_id, fecha, presente) {
  // 2026-08-13 — mismo par de arreglos que saveDailyWeight:
  // · UPSERT contra el UNIQUE (alumno_id, fecha) en vez de select+insert/update.
  //   El camino viejo podía chocar con 23505 si el primer peso del día y la
  //   asistencia se guardaban a la vez (los dos creaban la fila). El upsert
  //   solo toca la columna `presente`: no pisa los pesos.
  // · Si falla, LANZA — antes registrarDia() daba el día por registrado igual.
  const { data, error } = await supabase
    .from("registros_diarios")
    .upsert(
      { alumno_id, fecha, presente, updated_at: new Date().toISOString() },
      { onConflict: "alumno_id,fecha" },
    )
    .select()
    .single();

  if (error) {
    ERR("saveDailyAttendance", "No se pudo marcar la asistencia", error);
    throw new Error(error.message || "No se pudo marcar la asistencia");
  }

  LOG("saveDailyAttendance", `✅ Asistencia (${presente ? '✅' : '❌'}) marcada para ${fecha}`);
  return data;
}

// ────────────────────────────────────────────────────────────────────────
// REGISTROS DIARIOS: Cargar pesos por día
// ────────────────────────────────────────────────────────────────────────

export async function cargarPesosPorDia(alumno_id, limit = 30) {
  const { data, error } = await supabase
    .from("registros_diarios")
    .select("fecha, pesos")
    .eq("alumno_id", alumno_id)
    .order("fecha", { ascending: false })
    .limit(limit);

  if (error) {
    ERR("cargarPesosPorDia", "Error cargando pesos diarios", error);
    return [];
  }

  return data || [];
}
