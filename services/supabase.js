import { createClient } from "@supabase/supabase-js";
// Mapa nombre→código oficial (M/E/C/P), fuente de verdad en planTemplates.js.
// Se usa en propagarEjercicioATodos para asignarle código en el momento a un
// ejercicio viejo que todavía no lo tiene, SI su nombre matchea uno oficial.
import { CODIGOS_EJERCICIO } from "../src/utils/planTemplates.js";
const _codigoOficialPorNombre = (nombre) => {
  for (const key of Object.keys(CODIGOS_EJERCICIO)) {
    if (key.slice(key.indexOf("|") + 1) === nombre) return CODIGOS_EJERCICIO[key];
  }
  return null;
};

// ── CONFIGURACION ──────────────────────────────────────────────────────
const SUPABASE_URL      = "https://tlxkghpytznkxgqslqzj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_KGJ75gHqy1gnVLpuf-7SyQ_IuByH1G8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── AUTH SEGURO (Edge Function auth-bridge) ────────────────────────────
// El login ya no valida el PIN en el cliente (era sha256 reversible y con
// las políticas abiertas cualquiera bajaba la base). Ahora el PIN se valida
// server-side (bcrypt + rate-limit) en la Edge Function `auth-bridge`, que
// devuelve un token con el que el cliente abre una sesión real de Supabase
// Auth — necesaria para que la RLS por-alumno funcione.
const AUTH_BRIDGE_URL = `${SUPABASE_URL}/functions/v1/auth-bridge`;

async function establecerSesion(codigo, pin, tipo) {
  const r = await fetch(AUTH_BRIDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ action: "login", codigo: String(codigo).trim(), pin, tipo }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.token_hash) {
    throw new Error(data.error || (tipo === "admin" ? "Código admin o PIN inválido" : "Código o PIN inválido"));
  }
  const { error } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: "email" });
  if (error) throw new Error("No se pudo iniciar sesión: " + error.message);
}

// Crea (si falta) el usuario de Auth del alumno y le setea el PIN salado.
// Operación de admin — manda el token de sesión del admin logueado.
async function provisionAlumno(alumnoId, pin) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || SUPABASE_ANON_KEY;
  const r = await fetch(AUTH_BRIDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "provision", alumnoId, pin }),
  });
  if (!r.ok) { const d = await r.json().catch(() => ({})); ERR("provisionAlumno", d.error || "provision falló", d); }
}

// Crea (si falta) el usuario de Auth de un ADMIN + PIN salado. Sin esto, un
// admin nuevo no puede loguearse (el login busca el usuario de Auth por user_id).
async function provisionAdmin(adminId, pin) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || SUPABASE_ANON_KEY;
  const r = await fetch(AUTH_BRIDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "provision", id: adminId, pin, tipo: "admin" }),
  });
  if (!r.ok) { const d = await r.json().catch(() => ({})); ERR("provisionAdmin", d.error || "provision admin falló", d); }
}

export async function desactivarAdmin(id, activo) {
  const { data, error } = await supabase.rpc("desactivar_admin_rpc", { p_id: id, p_activo: activo });
  if (error) { ERR("desactivarAdmin", error.message, error); throw new Error(error.message); }
  return data;
}

export async function cerrarSesionAuth() {
  try { await supabase.auth.signOut(); } catch (e) { ERR("cerrarSesionAuth", "signOut falló", e); }
}

// ── LOGGING ────────────────────────────────────────────────────────────
const LOG = (fn, msg, data) =>
  console.log(`%c[SUPABASE:${fn}]`, "color:#6ee7b7;font-weight:bold", msg, data ?? "");

// ERR muestra TODOS los campos que devuelve Supabase para no perder nada
const ERR = (fn, msg, err) => {
  console.group(`%c[SUPABASE:${fn}] ❌ ${msg}`, "color:#f87171;font-weight:bold");
  console.error("message :", err?.message  ?? err);
  console.error("code    :", err?.code);
  console.error("hint    :", err?.hint);
  console.error("details :", err?.details);
  console.error("status  :", err?.status);
  console.error("objeto  :", err);
  console.groupEnd();
};

// ── UTILIDAD: UUID ────────────────────────────────────────────────────
const makeUuid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){const r=Math.random()*16|0;const v=c==='x'?r:(r&0x3|0x8);return v.toString(16);});
const isUuid  = id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id||''));

// ── UTILIDAD: LIMPIAR PAYLOAD ─────────────────────────────────────────
// Elimina cualquier clave con valor undefined antes de enviar a Supabase.
// Evita errores "column X does not exist" cuando mandamos campos que la DB
// todavía no tiene o que el objeto de origen no trajo.
// Mantiene: null, "", 0, [], {} — solo saca undefined.
function limpiarPayload(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
}

// ── TEST DE CONEXION (corre al importar el módulo) ─────────────────────
// Buscá "[SUPABASE:init]" en consola al arrancar la app.
(async () => {
  console.log("%c[SUPABASE:init] 🔌 Probando conexión a Supabase...", "color:#fbbf24;font-weight:bold");
  try {
    const { data, error } = await supabase.from("alumnos").select("id").limit(1);
    if (error) {
      ERR("init", "Falló la prueba de conexión. Verificá URL, ANON KEY y que la tabla 'alumnos' exista.", error);
    } else {
      console.log(
        "%c[SUPABASE:init] ✅ Conexión OK. Tabla 'alumnos' accesible.",
        "color:#6ee7b7;font-weight:bold",
        `(${data?.length ?? 0} fila/s de prueba)`
      );
    }
  } catch (e) {
    ERR("init", "Error de red al conectar con Supabase", e);
  }
})();

// ──────────────────────────────────────────────────────────────────────
// SCHEMA SQL  →  Supabase Dashboard → SQL Editor
// ──────────────────────────────────────────────────────────────────────
//
// create table if not exists alumnos (
//   id                 text        primary key,
//   nombre             text        not null,
//   username           text,
//   codigo             text,
//   peso               text,
//   altura             text,
//   edad               text,
//   foto               text        default '',
//   horarios           jsonb       default '[]',
//   bioimpedancia      jsonb       default '[]',
//   rm                 jsonb       default '{}',
//   asistencia         jsonb       default '[]',
//   diario             jsonb       default '[]',
//   plan_movilidad     jsonb       default '[]',
//   plan_calor         jsonb       default '[]',
//   plan_activacion    jsonb       default '[]',
//   plan_periodizacion jsonb       default '[]',
//   created_at         timestamptz default now()
// );
//
// create table if not exists plan_dias (
//   id         uuid  primary key default gen_random_uuid(),
//   alumno_id  text  references alumnos(id) on delete cascade,
//   dia        text,
//   subtitulo  text,
//   orden      int   default 0
// );
//
// create table if not exists plan_ejercicios (
//   id           text  primary key,
//   plan_dia_id  uuid  references plan_dias(id) on delete cascade,
//   nombre       text,
//   descripcion  text  default '',
//   video        text  default '',
//   media_local  text  default '',
//   orden        int   default 0
// );
//
// create table if not exists historial_pesos (
//   id            uuid      primary key default gen_random_uuid(),
//   alumno_id     text      references alumnos(id) on delete cascade,
//   ejercicio_id  text      not null,
//   peso          numeric   not null,
//   serie         int       default 1,
//   fecha         date      default current_date,
//   created_at    timestamptz default now()
// );
//
// -- Si tenés RLS activado, agregá estas políticas para desarrollo:
// alter table alumnos         enable row level security;
// alter table plan_dias       enable row level security;
// alter table plan_ejercicios enable row level security;
// alter table historial_pesos enable row level security;
// create policy "allow all" on alumnos         for all using (true) with check (true);
// create policy "allow all" on plan_dias       for all using (true) with check (true);
// create policy "allow all" on plan_ejercicios for all using (true) with check (true);
// create policy "allow all" on historial_pesos for all using (true) with check (true);
// ──────────────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════
// FLUJO 1: ARRANQUE
//   App.jsx mount → cargarDatos([]) → SELECT alumnos + getPlanDias
// ══════════════════════════════════════════════════════════════════════

// Columnas del alumno SIN la foto: las fotos son base64 gigantes (hubo una de
// 4.8MB) y bajarlas en la carga inicial hacía la app inusablemente lenta.
// Las fotos se hidratan aparte con cargarFotos() y se guardan solo cuando
// cambian con guardarFotoAlumno().
const COLS_ALUMNO_SIN_FOTO =
  "id,nombre,username,codigo,peso,altura,edad,fecha_nacimiento,email,tipo,plan_type,modalidad,horarios,bioimpedancia,rm,asistencia,diario,plan_movilidad,plan_calor,plan_activacion,plan_periodizacion";

export async function cargarDatos(fallback) {
  LOG("cargarDatos", "⏳ Cargando alumnos (sin fotos)...");
  try {
    const { data: rows, error } = await supabase
      .from("alumnos")
      .select(COLS_ALUMNO_SIN_FOTO)
      .order("nombre");

    if (error) throw error;

    if (!rows || rows.length === 0) {
      LOG("cargarDatos", "ℹ️ Tabla vacía. Retornando fallback.");
      return fallback;
    }

    LOG("cargarDatos", `Recibidos ${rows.length} alumno(s). Cargando planes...`);

    const alumnos = await Promise.all(
      rows.map(async (row) => {
        const planes = await cargarPlanesXDia(row.id, row);
        // Mantener 'plan' para compatibilidad, apuntando al primer plan
        const planCompat = planes.length > 0 ? planes[0] : {
          movilidad:     row.plan_movilidad     || [],
          calor:         row.plan_calor         || [],
          activacion:    row.plan_activacion    || [],
          periodizacion: row.plan_periodizacion || [],
          dias: [],
        };
        return {
          id:            row.id,
          nombre:        row.nombre,
          username:      row.username      || "",
          codigo:        row.codigo        || "",
          peso:          row.peso          || "",
          altura:        row.altura        || "",
          edad:          row.edad          || "",
          // slice(0,10) por si la base devuelve timestamp — el input date necesita YYYY-MM-DD
          fecha_nacimiento: (row.fecha_nacimiento || "").slice(0, 10),
          email:         row.email         || "",
          tipo:          row.tipo          || "entrenamiento",
          plan_type:     row.plan_type     || null,
          modalidad:     row.modalidad     || "",
          foto:          "", // se hidrata después con cargarFotos()
          horarios:      row.horarios      || [],
          bioimpedancia: row.bioimpedancia || [],
          rm:            row.rm            || {},
          asistencia:    row.asistencia    || [],
          diario:        row.diario        || [],
          planes,
          plan: {
            movilidad:     planCompat.movilidad     || [],
            calor:         planCompat.calor         || [],
            activacion:    planCompat.activacion    || [],
            periodizacion: planCompat.periodizacion || [],
            dias:          planCompat.dias          || [],
          },
        };
      })
    );

    LOG("cargarDatos", `✅ ${alumnos.length} alumno(s) listos.`, alumnos.map(a => a.nombre));
    return alumnos;

  } catch (e) {
    ERR("cargarDatos", "No se pudo cargar. ¿Existe la tabla 'alumnos'?", e);
    return fallback;
  }
}

// Hidrata las fotos DESPUÉS de la carga inicial, sin bloquear el arranque.
// Devuelve un mapa { alumno_id: foto } solo con los que tienen foto.
export async function cargarFotos() {
  try {
    const { data, error } = await supabase
      .from("alumnos")
      .select("id,foto")
      .neq("foto", "");
    if (error) throw error;
    const mapa = {};
    (data || []).forEach((r) => { if (r.foto) mapa[r.id] = r.foto; });
    LOG("cargarFotos", `✅ ${Object.keys(mapa).length} foto(s) hidratada(s).`);
    return mapa;
  } catch (e) {
    ERR("cargarFotos", "No se pudieron cargar las fotos", e);
    return {};
  }
}

// Guarda SOLO la foto de un alumno. Es el único camino de escritura de fotos:
// el upsert general (_guardarAlumno) nunca toca la columna foto para no
// re-subir megas de base64 en cada guardado.
export async function guardarFotoAlumno(alumno_id, foto) {
  try {
    const { error } = await supabase
      .from("alumnos")
      .update({ foto: foto || "" })
      .eq("id", alumno_id);
    if (error) throw error;
    LOG("guardarFotoAlumno", `✅ Foto guardada para ${alumno_id} (${Math.round((foto || "").length / 1024)} KB).`);
    return true;
  } catch (e) {
    ERR("guardarFotoAlumno", `No se pudo guardar la foto de ${alumno_id}`, e);
    return false;
  }
}


// ══════════════════════════════════════════════════════════════════════
// FLUJO 1b: CREAR ALUMNO NUEVO (INSERT DIRECTO)
//   AdminPanel.crearAlumno() → insertAlumno(al)
//   → supabase.from("alumnos").insert(payload).select()
//   → Logea exactamente qué se envía y qué responde Supabase
// ══════════════════════════════════════════════════════════════════════

export async function insertAlumno(al) {
  const payload = limpiarPayload({
    id:                 al.id,
    nombre:             al.nombre,
    username:           al.username           || null,
    codigo:             al.codigo             || null,
    peso:               al.peso               || null,
    altura:             al.altura             || null,
    edad:               al.edad               || null,
    fecha_nacimiento:   al.fecha_nacimiento   || null,
    email:              al.email              || null,
    tipo:               al.tipo, // undefined se elimina en limpiarPayload
    modalidad:          al.modalidad, // puede no existir la columna (migración 009) — hay fallback abajo
    foto:               al.foto               || '',
    horarios:           al.horarios           || [],
    bioimpedancia:      al.bioimpedancia      || [],
    rm:                 al.rm                 || {},
    asistencia:         al.asistencia         || [],
    diario:             al.diario             || [],
    plan_movilidad:     al.plan?.movilidad     || [],
    plan_calor:         al.plan?.calor         || [],
    plan_activacion:    al.plan?.activacion    || [],
    plan_periodizacion: al.plan?.periodizacion || [],
  });

  console.log("[DEBUG crearAlumno] Enviando a Supabase →", payload);

  try {
    let { data, error } = await supabase
      .from("alumnos")
      .insert(payload)
      .select();

    // Si la columna "modalidad" todavía no existe (falta migración 009),
    // reintenta sin ese campo para no romper el alta.
    if (error && "modalidad" in payload && /(column .*modalidad.* does not exist|find the 'modalidad' column)/i.test(error.message || "")) {
      LOG("insertAlumno", "⚠️ Columna 'modalidad' no existe todavía (falta migración 009), insertando sin modalidad");
      delete payload.modalidad;
      ({ data, error } = await supabase.from("alumnos").insert(payload).select());
    }

    console.log("[DEBUG crearAlumno] Respuesta Supabase →", data, error);

    if (error) {
      ERR("insertAlumno", `No se pudo crear "${al.nombre}"`, error);
      return { ok: false, error };
    }

    if (!data || !data[0]) {
      ERR("insertAlumno", "Supabase no devolvió datos después del insert", null);
      return { ok: false, error: new Error("No data returned") };
    }

    LOG("insertAlumno", `✅ Alumno "${al.nombre}" insertado.`, data);

    // Guardar el plan de días en tablas normalizadas
    if (al.plan?.dias?.length) {
      await _savePlanDias(al.id, al.plan.dias);
    }

    return { ok: true, data: data[0] };

  } catch (e) {
    ERR("insertAlumno", "Excepción inesperada al insertar alumno", e);
    return { ok: false, error: e };
  }
}

// ══════════════════════════════════════════════════════════════════════
// FLUJO 2: GUARDAR ALUMNO(S)
//   App.jsx useEffect[alumnos] → guardarDatos(alumnos)
//   Solo corre si alumnos.length > 0 (evita guardar array vacío al arrancar).
// ══════════════════════════════════════════════════════════════════════

export async function guardarDatos(alumnos) {
  // Nunca guardar un array vacío (evita sobreescribir con nada al arrancar)
  if (!alumnos || alumnos.length === 0) {
    LOG("guardarDatos", "⏭️ Array vacío, skip.");
    return;
  }

  LOG("guardarDatos", `⏳ Guardando ${alumnos.length} alumno(s)...`);

  for (const al of alumnos) {
    await _guardarAlumno(al);
  }

  LOG("guardarDatos", "✅ Guardado completo.");
}

// Guarda un solo alumno — separado para poder debuggear por individuo
async function _guardarAlumno(al) {
  const payload = limpiarPayload({
    id:                 al.id,
    nombre:             al.nombre,
    username:           al.username           || null,
    codigo:             al.codigo             || null,
    peso:               al.peso               || null,
    altura:             al.altura             || null,
    edad:               al.edad               || null,
    fecha_nacimiento:   al.fecha_nacimiento   || null,
    email:              al.email              || null,
    tipo:               al.tipo, // undefined se elimina en limpiarPayload
    modalidad:          al.modalidad, // puede no existir la columna (migración 009) — hay fallback abajo
    // foto NO va acá a propósito: se guarda solo vía guardarFotoAlumno()
    horarios:           al.horarios           || [],
    bioimpedancia:      al.bioimpedancia      || [],
    rm:                 al.rm                 || {},
    asistencia:         al.asistencia         || [],
    diario:             al.diario             || [],
    plan_movilidad:     al.plan?.movilidad     || [],
    plan_calor:         al.plan?.calor         || [],
    plan_activacion:    al.plan?.activacion    || [],
    plan_periodizacion: al.plan?.periodizacion || [],
  });

  LOG("_guardarAlumno", `→ UPSERT "${al.nombre}" (id: ${al.id})`, payload);

  let { data, error } = await supabase
    .from("alumnos")
    .upsert(payload, { onConflict: "id" })
    .select("id, nombre");  // pedimos respuesta para confirmar

  // Fallback: si la columna "modalidad" no existe todavía (falta migración
  // 009), reintenta sin ese campo — que un campo nuevo no rompa TODO el
  // guardado del alumno (mismo criterio que email en crearAlumnoConPIN).
  if (error && "modalidad" in payload && /(column .*modalidad.* does not exist|find the 'modalidad' column)/i.test(error.message || "")) {
    LOG("_guardarAlumno", "⚠️ Columna 'modalidad' no existe todavía (falta migración 009), guardando sin modalidad");
    delete payload.modalidad;
    ({ data, error } = await supabase.from("alumnos").upsert(payload, { onConflict: "id" }).select("id, nombre"));
  }

  if (error) {
    ERR("_guardarAlumno", `Falló UPSERT de "${al.nombre}"`, error);
    return;
  }

  LOG("_guardarAlumno", `✅ UPSERT confirmado:`, data);

  // Guardar plan de días (tablas normalizadas) — SOLO si el alumno no tiene
  // planes reales en alumno_planes. al.plan es una copia de compatibilidad de
  // planes[0] (cargarDatos): re-escribirla acá creaba filas huérfanas en
  // plan_dias(alumno_id) que ninguna vista lee (bug Vic 2026-07-21 — datos
  // muertos que confundían el diagnóstico del desfase admin→alumno).
  const tienePlanesReales = (al.planes || []).some((p) => p && !p._sintetico);
  if (al.plan?.dias && !tienePlanesReales) {
    await _savePlanDias(al.id, al.plan.dias);
  }
}


// ══════════════════════════════════════════════════════════════════════
// FLUJO 3: PLAN DE ENTRENAMIENTO
// ══════════════════════════════════════════════════════════════════════

export async function getPlanDias(alumno_id) {
  LOG("getPlanDias", `⏳ Cargando plan de alumno: ${alumno_id}`);

  // Intento 1: con .order("orden")
  let { data: dias, error } = await supabase
    .from("plan_dias")
    .select("*, plan_ejercicios(*)")
    .eq("alumno_id", alumno_id)
    .order("orden");

  // Si falla por columna inexistente, reintentamos sin order
  if (error) {
    LOG("getPlanDias", `⚠️ .order("orden") falló (${error.message}), reintentando sin order...`);
    ({ data: dias, error } = await supabase
      .from("plan_dias")
      .select("*, plan_ejercicios(*)")
      .eq("alumno_id", alumno_id));
  }

  if (error) {
    ERR("getPlanDias", `Error al cargar plan de ${alumno_id}`, error);
    return [];
  }

  if (!dias || dias.length === 0) {
    LOG("getPlanDias", `ℹ️ Sin días de plan para ${alumno_id}`);
    return [];
  }

  const result = dias.map((d) => ({
    dia:       d.dia,
    subtitulo: d.subtitulo || "",
    ejercicios: (d.plan_ejercicios || [])
      .sort((a, b) => a.orden - b.orden)
      .map((e) => ({
        id:         e.id,
        nombre:     e.nombre      || "",
        desc:       e.descripcion || "",
        video:      e.video       || "",
        codigo:     e.codigo      || "",
        gif:        e.gif         || "",
        unidad:     e.unidad      || "reps",
        mediaLocal: "",
        historial:  [],
      })),
  }));

  LOG(
    "getPlanDias",
    `✅ ${result.length} día(s), ${result.reduce((s, d) => s + d.ejercicios.length, 0)} ejercicio(s)`,
    result.map(d => d.dia)
  );
  return result;
}

export async function getPlanEjercicios(plan_dia_id) {
  LOG("getPlanEjercicios", `⏳ Ejercicios del día ${plan_dia_id}`);

  // Intento 1: con .order("orden")
  let { data, error } = await supabase
    .from("plan_ejercicios")
    .select("*")
    .eq("plan_dia_id", plan_dia_id)
    .order("orden");

  // Fallback sin order si la columna no existe
  if (error) {
    LOG("getPlanEjercicios", `⚠️ .order("orden") falló, reintentando sin order...`);
    ({ data, error } = await supabase
      .from("plan_ejercicios")
      .select("*")
      .eq("plan_dia_id", plan_dia_id));
  }

  if (error) {
    ERR("getPlanEjercicios", "Error al cargar ejercicios", error);
    return [];
  }

  LOG("getPlanEjercicios", `✅ ${data?.length ?? 0} ejercicio(s).`);
  return (data || []).map((e) => ({
    id:         e.id,
    nombre:     e.nombre      || "",
    desc:       e.descripcion || "",
    video:      e.video       || "",
    codigo:     e.codigo      || "",
    gif:        e.gif         || "",
    unidad:     e.unidad      || "reps",
    mediaLocal: "",
    historial:  [],
  }));
}

// ══════════════════════════════════════════════════════════════════════
// PLANES POR DÍA DE SEMANA
// ══════════════════════════════════════════════════════════════════════

export async function cargarPlanesXDia(alumno_id, row) {
  LOG("cargarPlanesXDia", `⏳ Cargando planes por día para ${alumno_id}`);

  try {
    const { data: alPlanes, error } = await supabase
      .from("alumno_planes")
      .select("*")
      .eq("alumno_id", alumno_id);

    if (error) throw error;

    if (!alPlanes || alPlanes.length === 0) {
      LOG("cargarPlanesXDia", `ℹ️ Sin planes específicos, creando "Fijo"...`);
      const dias = await getPlanDias(alumno_id);
      return [{
        id: makeUuid(),
        dia_semana: "Fijo",
        nombre: "Plan Único",
        // Marca que este plan NO existe como fila de alumno_planes: se arma al
        // vuelo desde plan_dias(alumno_id). Editarlo se persiste por el camino
        // viejo (al.plan.dias → _guardarAlumno), no por actualizarPlanAlumnoDias.
        _sintetico: true,
        estado: "activo",
        dias,
        movilidad:     row.plan_movilidad     || [],
        calor:         row.plan_calor         || [],
        activacion:    row.plan_activacion    || [],
        periodizacion: row.plan_periodizacion || [],
      }];
    }

    const planesConDetalles = await Promise.all(
      alPlanes.map(async (ap) => {
        const dias = await getPlanDiasPorAlumnoPlan(ap.id);
        return {
          id: ap.id,
          dia_semana: ap.dia_semana,
          nombre: ap.nombre,
          estado: ap.estado,
          dias,
          movilidad:     row.plan_movilidad     || [],
          calor:         row.plan_calor         || [],
          activacion:    row.plan_activacion    || [],
          periodizacion: row.plan_periodizacion || [],
        };
      })
    );

    LOG("cargarPlanesXDia", `✅ ${planesConDetalles.length} plan(es) cargado(s)`, planesConDetalles.map(p => p.dia_semana));
    return planesConDetalles;

  } catch (e) {
    ERR("cargarPlanesXDia", "Error cargando planes por día", e);
    return [];
  }
}

export async function getPlanDiasPorAlumnoPlan(alumno_plan_id) {
  LOG("getPlanDiasPorAlumnoPlan", `⏳ Cargando días para plan ${alumno_plan_id}`);

  const { data: dias, error } = await supabase
    .from("plan_dias")
    .select("*, plan_ejercicios(*)")
    .eq("alumno_plan_id", alumno_plan_id)
    .order("orden");

  if (error) {
    ERR("getPlanDiasPorAlumnoPlan", `Error al cargar días`, error);
    return [];
  }

  if (!dias || dias.length === 0) {
    LOG("getPlanDiasPorAlumnoPlan", `ℹ️ Sin días para este plan`);
    return [];
  }

  const result = dias.map((d) => ({
    dia:       d.dia,
    subtitulo: d.subtitulo || "",
    ejercicios: (d.plan_ejercicios || [])
      .sort((a, b) => a.orden - b.orden)
      .map((e) => ({
        id:         e.id,
        nombre:     e.nombre      || "",
        desc:       e.descripcion || "",
        video:      e.video       || "",
        codigo:     e.codigo      || "",
        gif:        e.gif         || "",
        unidad:     e.unidad      || "reps",
        mediaLocal: "",
        historial:  [],
      })),
  }));

  LOG("getPlanDiasPorAlumnoPlan", `✅ ${result.length} día(s)`);
  return result;
}

// Borra DIRECTAMENTE el plan de un día de semana (ronda 12, punto 7): a
// diferencia de crearPlanAlumno (que borra-y-reemplaza), esto borra sin
// crear nada nuevo — el día deja de existir para el alumno (no queda ni
// "Sin plan"). ON DELETE CASCADE se lleva plan_dias/plan_ejercicios.
export async function eliminarPlanDia(alumno_id, dia_semana) {
  LOG("eliminarPlanDia", `⏳ Borrando plan de ${dia_semana} de ${alumno_id}`);
  const { error } = await supabase
    .from("alumno_planes")
    .delete()
    .eq("alumno_id", alumno_id)
    .eq("dia_semana", dia_semana);
  if (error) { ERR("eliminarPlanDia", `No se pudo borrar el plan de ${dia_semana}`, error); return false; }
  LOG("eliminarPlanDia", `✅ Plan de ${dia_semana} borrado`);
  return true;
}

// Renombra el plan asignado a un alumno (punto 7, ronda 2026-07-21 #2):
// solo cambia alumno_planes.nombre, no toca días/ejercicios ni ids —
// el historial de pesos (ligado a los ids de plan_ejercicios) queda intacto.
export async function renombrarPlanAlumno(alumno_plan_id, nuevoNombre) {
  LOG("renombrarPlanAlumno", `⏳ Renombrando plan ${alumno_plan_id} a "${nuevoNombre}"...`);
  const { error } = await supabase
    .from("alumno_planes")
    .update({ nombre: nuevoNombre })
    .eq("id", alumno_plan_id);
  if (error) { ERR("renombrarPlanAlumno", "No se pudo renombrar el plan", error); return false; }
  LOG("renombrarPlanAlumno", "✅ Plan renombrado");
  return true;
}

export async function crearPlanAlumno(alumno_id, dia_semana, plan_template, origen) {
  LOG("crearPlanAlumno", `⏳ Creando plan para ${dia_semana} de ${alumno_id}`);

  try {
    let nombre;
    if (typeof plan_template === 'string') {
      nombre = plan_template;
    } else if (plan_template.nombre) {
      nombre = plan_template.nombre;
    } else {
      const sub = plan_template?.dias?.[0]?.subtitulo || '';
      nombre = sub.includes('Unilateral') ? 'Unilateral' : sub.includes('Bilateral') ? 'Bilateral' : 'Plan';
    }
    const dias = typeof plan_template === 'string' ? [] : (plan_template.dias || []);

    // REEMPLAZO, no solapamiento: si el día ya tenía plan(es), se borran antes
    // de crear el nuevo (bug ronda 4: asignar plan a un día duplicaba planes).
    // El FK de plan_dias/plan_ejercicios es ON DELETE CASCADE, así que se
    // llevan sus días y ejercicios.
    const { error: delErr } = await supabase
      .from("alumno_planes")
      .delete()
      .eq("alumno_id", alumno_id)
      .eq("dia_semana", dia_semana);
    if (delErr) ERR("crearPlanAlumno", `No se pudo borrar el plan previo de ${dia_semana}`, delErr);

    // origen (punto 6, migración 018): 'catalogo_v2' cuando viene de una
    // plantilla del Armador/asignarPlanPredeterminado — sin pasar nada acá
    // (llamadas viejas) queda null, que es justamente lo que el punto 6
    // pide para poder filtrar "planes viejos, pre-catálogo".
    const { data: nuevoAlPlan, error } = await supabase
      .from("alumno_planes")
      .insert({
        alumno_id,
        nombre,
        dia_semana,
        estado: 'activo',
        ...(origen ? { origen } : {}),
      })
      .select()
      .single();

    if (error) {
      ERR("crearPlanAlumno", `No se pudo crear plan`, error);
      return { ok: false, error };
    }

    if (dias.length > 0) {
      await _savePlanDias(nuevoAlPlan.id, dias, true);
    }

    LOG("crearPlanAlumno", `✅ Plan creado para ${dia_semana}`);
    return { ok: true, data: nuevoAlPlan };

  } catch (e) {
    ERR("crearPlanAlumno", "Error creando plan", e);
    return { ok: false, error: e };
  }
}

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
    ejercicios: (d.ejercicios || []).map((ej) => ({ ...ej, id: undefined })),
  }));
  return crearPlanAlumno(alumno_id, dia_semana, { nombre: plantilla.nombre, dias: diasCopia }, "catalogo_v2");
}

// Reescribe los días+ejercicios de un plan por día (fila real de alumno_planes).
// Lo usa Admin → Plan → Principales para editar ejercicios puntuales de los
// planes ya asignados a los días que el alumno entrena.
export async function actualizarPlanAlumnoDias(alumno_plan_id, dias) {
  LOG("actualizarPlanAlumnoDias", `⏳ Actualizando días del plan ${alumno_plan_id}`);
  try {
    // La fila de alumno_planes puede haber sido reemplazada o borrada desde
    // otra sesión (prod y dev comparten la misma base; crearPlanAlumno
    // reemplaza planes con delete+insert de id nuevo). Escribir plan_dias con
    // ese id huérfano era la causa del FK 23503 recurrente en consola.
    const { data: existe, error: exErr } = await supabase
      .from("alumno_planes")
      .select("id")
      .eq("id", alumno_plan_id)
      .maybeSingle();
    if (exErr) throw exErr;
    if (!existe) {
      ERR("actualizarPlanAlumnoDias", `El plan ${alumno_plan_id} ya no existe en alumno_planes (reemplazado o borrado desde otra sesión) — no se guardan días huérfanos`, null);
      return false;
    }
    return (await _savePlanDias(alumno_plan_id, dias, true)) !== false;
  } catch (e) {
    ERR("actualizarPlanAlumnoDias", "Error actualizando plan", e);
    return false;
  }
}

// Dos _savePlanDias concurrentes sobre el MISMO alumno/plan se pisan: el
// delete de uno borra los días recién insertados del otro y los inserts de
// ejercicios quedan huérfanos (FK 23503). Se serializan por destino.
const _colasPlanDias = new Map();

function _savePlanDias(idParam, dias, isAlumnoPlan = false) {
  const prev = _colasPlanDias.get(idParam) || Promise.resolve();
  const run = prev.then(() => _savePlanDiasImpl(idParam, dias, isAlumnoPlan));
  _colasPlanDias.set(idParam, run.catch(() => {}));
  return run;
}

async function _savePlanDiasImpl(idParam, dias, isAlumnoPlan) {
  const deleteFilter = isAlumnoPlan ? "alumno_plan_id" : "alumno_id";
  LOG("_savePlanDias", `⏳ Guardando ${dias.length} día(s) para ${idParam}`);

  const { error: delErr } = await supabase
    .from("plan_dias")
    .delete()
    .eq(deleteFilter, idParam);

  if (delErr) {
    ERR("_savePlanDias", "Error al borrar plan anterior", delErr);
    return false;
  }

  for (let i = 0; i < dias.length; i++) {
    const insertData = { id: makeUuid(), dia: dias[i].dia||"Día", subtitulo: dias[i].subtitulo||"", orden: i };
    if (isAlumnoPlan) {
      insertData.alumno_plan_id = idParam;
    } else {
      insertData.alumno_id = idParam;
    }

    const { data: diaRow, error: diaErr } = await supabase
      .from("plan_dias")
      .insert(insertData)
      .select()
      .single();

    if (diaErr || !diaRow) {
      // 23503 = el padre (alumno o alumno_plan) ya no existe — otra sesión lo
      // borró/reemplazó mientras guardábamos. Seguir insertando solo spamea
      // el mismo FK error; se aborta todo el guardado.
      if (diaErr?.code === "23503") {
        ERR("_savePlanDias", `El destino ${idParam} ya no existe — guardado abortado`, diaErr);
        return false;
      }
      ERR("_savePlanDias", `No se pudo crear el día "${dias[i].dia}"`, diaErr);
      continue;
    }

    for (let j = 0; j < (dias[i].ejercicios || []).length; j++) {
      const ej = dias[i].ejercicios[j];
      const ejId = isUuid(ej.id) ? ej.id : makeUuid();
      const row = {
        id:          ejId,
        plan_dia_id: diaRow.id,
        nombre:      ej.nombre      || "",
        descripcion: ej.desc        || "",
        video:       ej.video       || "",
        codigo:      ej.codigo      || null,
        gif:         ej.gif         || null,
        unidad:      ej.unidad      || "reps",
        orden:       j,
      };
      let { error: ejErr } = await supabase.from("plan_ejercicios").insert(row);
      // 23505 = id duplicado (template compartido o guardado concurrente) → reintentar con id nuevo
      if (ejErr && ejErr.code === "23505") {
        row.id = makeUuid();
        ({ error: ejErr } = await supabase.from("plan_ejercicios").insert(row));
      }
      if (ejErr) ERR("_savePlanDias", `Error insertando "${ej.nombre}"`, ejErr);
    }
  }

  LOG("_savePlanDias", `✅ Plan guardado para ${idParam}.`);
  return true;
}


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
        const val = Number(p);
        if (!val) return;
        pesos[eid] = val;
        if (!historiales[eid]) historiales[eid] = [];
        historiales[eid].push({ peso: val, serie: 1, fecha: row.fecha });
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


// ══════════════════════════════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════════════════════════════

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

export async function cambiarPINAlumno(alumno_id, nuevoPIN) {
  LOG("cambiarPINAlumno", `⏳ Cambiando PIN de ${alumno_id}...`);
  try {
    const pin_hash = await hashearPIN(nuevoPIN);
    const { error } = await supabase.from("alumnos").update({ pin_hash }).eq("id", alumno_id);
    if (error) { ERR("cambiarPINAlumno", "No se pudo cambiar el PIN", error); return false; }
    await provisionAlumno(alumno_id, nuevoPIN); // PIN salado (bcrypt) + usuario de Auth
    LOG("cambiarPINAlumno", `✅ PIN actualizado.`);
    return true;
  } catch (e) {
    ERR("cambiarPINAlumno", "Error al hashear PIN", e);
    return false;
  }
}

export async function deleteAlumno(alumno_id) {
  LOG("deleteAlumno", `⏳ Eliminando alumno ${alumno_id}...`);
  const { error } = await supabase.from("alumnos").delete().eq("id", alumno_id);
  if (error) { ERR("deleteAlumno", `No se pudo eliminar ${alumno_id}`, error); return false; }
  LOG("deleteAlumno", `✅ Alumno ${alumno_id} eliminado.`);
  return true;
}

export async function getAlumno(alumno_id) {
  LOG("getAlumno", `⏳ Buscando alumno ${alumno_id}...`);

  const { data, error } = await supabase
    .from("alumnos")
    .select("*")
    .eq("id", alumno_id)
    .single();

  if (error || !data) {
    ERR("getAlumno", `No encontrado: ${alumno_id}`, error);
    return null;
  }

  const dias = await getPlanDias(alumno_id);
  const alumno = {
    ...data,
    plan: {
      movilidad:     data.plan_movilidad     || [],
      calor:         data.plan_calor         || [],
      activacion:    data.plan_activacion    || [],
      periodizacion: data.plan_periodizacion || [],
      dias,
    },
  };

  LOG("getAlumno", `✅ Encontrado: ${alumno.nombre}`, alumno);
  return alumno;
}

// ──────────────────────────────────────────────────────────────────────
// AUTENTICACION: CODIGO + PIN
// ──────────────────────────────────────────────────────────────────────

async function hashearPIN(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function loginConCodigo(codigo, pin) {
  LOG("loginConCodigo", `⏳ Validando alumno ${codigo}...`);

  try {
    // ilike compara sin distinguir mayúsculas/minúsculas — así "Juan",
    // "juan" y "JUAN" matchean igual sin importar cómo haya quedado
    // guardado el username en la base.
    // Sin "foto": puede pesar megas en base64 y el login no la necesita
    // (la app la hidrata aparte con cargarFotos()).
    // PIN validado server-side + sesión de Auth abierta acá (reemplaza el
    // chequeo sha256 del cliente).
    await establecerSesion(codigo, pin, "alumno");

    const { data: alumno, error } = await supabase
      .from("alumnos")
      .select(COLS_ALUMNO_SIN_FOTO)
      .ilike("codigo", codigo.trim())
      .single();

    if (error || !alumno) {
      throw new Error("No se pudo cargar el alumno");
    }

    LOG("loginConCodigo", `✅ Login exitoso para ${alumno.nombre}`);
    return alumno;
  } catch (e) {
    ERR("loginConCodigo", e.message, e);
    throw e;
  }
}

export async function loginAdmin(codigo, pin) {
  LOG("loginAdmin", `⏳ Validando admin ${codigo}...`);

  try {
    // Valida PIN admin server-side + abre sesión de Auth con rol admin.
    await establecerSesion(codigo, pin, "admin");
    const pinHash = await hashearPIN(pin);

    // La tabla admins ya no se lee directo (services/supabase.js no expone
    // pin_hash al cliente ni permite select("*") anónimo) — el chequeo del
    // PIN corre server-side en login_admin_rpc (migrations/004), que
    // devuelve el admin sin el pin_hash.
    const { data: admin, error } = await supabase.rpc("login_admin_rpc", {
      p_codigo: codigo.toUpperCase(),
      p_pin_hash: pinHash,
    });

    if (error || !admin) {
      throw new Error(error?.message || "Código admin inválido");
    }

    LOG("loginAdmin", `✅ Login admin exitoso para ${admin.nombre}`);
    return admin;
  } catch (e) {
    ERR("loginAdmin", e.message, e);
    throw e;
  }
}

export async function crearAlumnoConPIN(nombre, codigo, pin, altura, peso, fechaNacimiento, tipo, email, modalidad) {
  LOG("crearAlumnoConPIN", `⏳ Creando alumno ${codigo}...`);

  try {
    // Un código repetido rompía el login (dos filas → .single() falla y el
    // alumno ve "código/PIN inválido", caso Franco 2026-07-20). La base
    // ahora tiene índice único sobre upper(codigo); acá avisamos claro.
    const { data: yaExiste } = await supabase
      .from("alumnos")
      .select("id")
      .ilike("codigo", codigo.trim())
      .limit(1);
    if (yaExiste && yaExiste.length > 0) {
      throw new Error(`El código "${codigo.trim().toUpperCase()}" ya está en uso por otro alumno`);
    }

    let nuevoAlumno = {
      nombre,
      codigo: codigo.toUpperCase(),
      altura: parseInt(altura) || 0,
      peso: parseFloat(peso) || 0,
      tipo: tipo || "entrenamiento",
    };
    if (fechaNacimiento) nuevoAlumno.fecha_nacimiento = fechaNacimiento;
    if (email) nuevoAlumno.email = email;
    if (modalidad) nuevoAlumno.modalidad = modalidad;

    try {
      const pinHash = await hashearPIN(pin);
      nuevoAlumno.pin_hash = pinHash;
    } catch (e) {
      LOG("crearAlumnoConPIN", "⚠️ pin_hash no soportado, creando sin PIN");
    }

    let { data, error } = await supabase
      .from("alumnos")
      .insert([nuevoAlumno])
      .select();

    // Si la columna "email" todavía no existe en Supabase (falta correr la
    // migración 008), reintenta sin ese campo para no romper el alta.
    if (error && nuevoAlumno.email && /(column .*email.* does not exist|find the 'email' column)/i.test(error.message || "")) {
      LOG("crearAlumnoConPIN", "⚠️ Columna 'email' no existe todavía (falta migración 008), creando sin email");
      delete nuevoAlumno.email;
      ({ data, error } = await supabase.from("alumnos").insert([nuevoAlumno]).select());
    }

    // Ídem con "modalidad" (falta migración 009): reintenta sin ese campo.
    if (error && nuevoAlumno.modalidad && /(column .*modalidad.* does not exist|find the 'modalidad' column)/i.test(error.message || "")) {
      LOG("crearAlumnoConPIN", "⚠️ Columna 'modalidad' no existe todavía (falta migración 009), creando sin modalidad");
      delete nuevoAlumno.modalidad;
      ({ data, error } = await supabase.from("alumnos").insert([nuevoAlumno]).select());
    }

    if (error) {
      // 23505 = índice único de código (doble submit o código repetido)
      if (error.code === "23505") {
        throw new Error(`El código "${codigo.trim().toUpperCase()}" ya está en uso por otro alumno`);
      }
      throw new Error(error.message || "Error al crear alumno");
    }

    // Crea el usuario de Auth del alumno + PIN salado (necesario para que
    // pueda loguearse con la RLS activa).
    if (data?.[0]?.id) await provisionAlumno(data[0].id, pin);

    LOG("crearAlumnoConPIN", `✅ Alumno ${nombre} creado exitosamente`, data);
    return data?.[0] || nuevoAlumno;
  } catch (e) {
    ERR("crearAlumnoConPIN", e.message, e);
    throw e;
  }
}

export async function crearAdmin(nombre, codigo, pin, email, rol) {
  LOG("crearAdmin", `⏳ Creando admin ${codigo}...`);

  try {
    // La tabla admins tiene RLS sin policies (nadie la toca directo con la
    // anon key) — el INSERT directo fallaba con 42501 y el admin nunca se
    // creaba. El alta corre server-side en crear_admin_rpc (migración 014,
    // rol agregado en 016), mismo patrón que login_admin_rpc.
    const pinHash = await hashearPIN(pin);
    const { data: admin, error } = await supabase.rpc("crear_admin_rpc", {
      p_nombre: nombre,
      p_codigo: codigo,
      p_pin_hash: pinHash,
      p_email: email || "",
      p_rol: rol === "kinesiologa" ? "kinesiologa" : "entrenador",
    });

    if (error || !admin) {
      throw new Error(error?.message || "Error al crear admin");
    }

    // Crea el usuario de Auth del admin + PIN salado (si no, no puede loguearse).
    if (admin?.id) await provisionAdmin(admin.id, pin);

    LOG("crearAdmin", `✅ Admin ${nombre} creado exitosamente`);
    return admin;
  } catch (e) {
    ERR("crearAdmin", e.message, e);
    throw e;
  }
}

// Gestión de administradores con rol (punto 12, ronda 2026-07-21). La
// tabla admins sigue sin policies para anon — ambas funciones pasan por
// RPC SECURITY DEFINER (migración 016), nunca exponen pin_hash.
export async function listarAdmins() {
  LOG("listarAdmins", "⏳ Listando admins...");
  try {
    const { data, error } = await supabase.rpc("listar_admins_rpc");
    if (error) throw error;
    LOG("listarAdmins", `✅ ${(data || []).length} admin(s)`);
    return data || [];
  } catch (e) {
    ERR("listarAdmins", e.message, e);
    return [];
  }
}

export async function actualizarRolAdmin(id, rol) {
  LOG("actualizarRolAdmin", `⏳ Actualizando rol de ${id} a ${rol}...`);
  try {
    const { data, error } = await supabase.rpc("actualizar_rol_admin_rpc", {
      p_id: id,
      p_rol: rol,
    });
    if (error) throw error;
    LOG("actualizarRolAdmin", "✅ Rol actualizado");
    return data;
  } catch (e) {
    ERR("actualizarRolAdmin", e.message, e);
    return null;
  }
}

// Editar admin existente (punto 2, ronda 2026-07-21 #2): nombre/username
// siempre, clave solo si se tipeó una nueva (pin opcional). Mismo patrón
// RPC SECURITY DEFINER (migración 019) — admins no acepta writes directos.
export async function actualizarAdmin(id, nombre, codigo, pin) {
  LOG("actualizarAdmin", `⏳ Actualizando admin ${id}...`);
  try {
    const pinHash = pin && pin.length === 4 ? await hashearPIN(pin) : null;
    const { data: admin, error } = await supabase.rpc("actualizar_admin_rpc", {
      p_id: id,
      p_nombre: nombre,
      p_codigo: codigo,
      p_pin_hash: pinHash,
    });
    if (error || !admin) {
      throw new Error(error?.message || "Error al actualizar admin");
    }
    // Si cambió el PIN, re-salar el bcrypt del admin (lo que valida el login).
    if (pin && pin.length === 4) await provisionAdmin(id, pin);
    LOG("actualizarAdmin", `✅ Admin ${nombre} actualizado`);
    return admin;
  } catch (e) {
    ERR("actualizarAdmin", e.message, e);
    throw e;
  }
}

// ──────────────────────────────────────────────────────────────────────
// VIDEO UPLOADS (Supabase Storage)
// ──────────────────────────────────────────────────────────────────────

export async function subirVideo(archivo) {
  LOG("subirVideo", `⏳ Subiendo video ${archivo.name}...`);

  try {
    if (!archivo) throw new Error("No hay archivo");

    const nombreArchivo = `${Date.now()}_${archivo.name.replace(/\s+/g, "_")}`;

    const { data, error: uploadError } = await supabase.storage
      .from("ejercicios-videos")
      .upload(nombreArchivo, archivo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message || "Error al subir video");
    }

    const { data: urlData } = supabase.storage
      .from("ejercicios-videos")
      .getPublicUrl(nombreArchivo);

    LOG("subirVideo", `✅ Video subido: ${nombreArchivo}`, urlData);
    return urlData.publicUrl;
  } catch (e) {
    ERR("subirVideo", e.message, e);
    throw e;
  }
}

// ══════════════════════════════════════════════════════════════════════
// BIOIMPEDANCIA (archivos)
// ══════════════════════════════════════════════════════════════════════

const BIO_BUCKET = "bioimpedancia-archivos";

// Redimensiona una imagen a máx. 900px de lado y la devuelve como data URL
// JPEG (~100-200KB). Fallback para cuando Storage no está habilitado.
async function _fotoADataUrl(file, maxLado = 900, calidad = 0.8) {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", calidad);
}

async function _ensureBioBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets && buckets.find(b => b.name === BIO_BUCKET)) return;
  await supabase.storage.createBucket(BIO_BUCKET, { public: true });
}

export async function cargarBioimpedancia(alumno_id) {
  const { data, error } = await supabase
    .from("bioimpedancia")
    .select("id, alumno_id, fecha, archivo_url, nombre_archivo, created_at")
    .eq("alumno_id", alumno_id)
    .order("fecha", { ascending: false });
  if (error) { ERR("cargarBioimpedancia", error.message, error); return []; }
  return data || [];
}

export async function guardarBioimpedancia(alumno_id, datos) {
  // datos: { fecha, archivo (File object) }
  let archivo_url = null;
  let nombre_archivo = null;

  if (datos.archivo) {
    await _ensureBioBucket();
    const ext = datos.archivo.name.split(".").pop();
    const key = `${alumno_id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BIO_BUCKET)
      .upload(key, datos.archivo, { cacheControl: "3600", upsert: false });
    if (upErr) { ERR("guardarBioimpedancia/upload", upErr.message, upErr); throw upErr; }
    const { data: urlData } = supabase.storage.from(BIO_BUCKET).getPublicUrl(key);
    archivo_url = urlData.publicUrl;
    nombre_archivo = datos.archivo.name;
  }

  const row = { alumno_id, fecha: datos.fecha || new Date().toISOString().split("T")[0], archivo_url, nombre_archivo };
  const { data, error } = await supabase.from("bioimpedancia").insert([row]).select().single();
  if (error) { ERR("guardarBioimpedancia", error.message, error); throw error; }
  return data;
}

export async function eliminarBioimpedancia(id, archivo_url) {
  // Eliminar archivo de storage si existe
  if (archivo_url) {
    try {
      const path = archivo_url.split(`/${BIO_BUCKET}/`)[1];
      if (path) await supabase.storage.from(BIO_BUCKET).remove([path]);
    } catch (e) { /* no bloquear si falla el storage */ }
  }
  const { error } = await supabase.from("bioimpedancia").delete().eq("id", id);
  if (error) { ERR("eliminarBioimpedancia", error.message, error); throw error; }
}

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

// ──────────────────────────────────────────────────────────────────────
// REHABILITACIÓN (migración 010 — 2026-07-20)
// El media (foto/video del celular) va al bucket público "rehab-media" y la
// URL se guarda en el campo `video` del ejercicio (plan_ejercicios ya
// persiste nombre/descripcion/video — no hace falta esquema nuevo).
// ──────────────────────────────────────────────────────────────────────

const REHAB_BUCKET = "rehab-media";

export async function subirMediaRehab(archivo) {
  LOG("subirMediaRehab", `⏳ Subiendo ${archivo.name} (${Math.round(archivo.size / 1024)} KB)...`);
  const ext = (archivo.name.split(".").pop() || "bin").toLowerCase();
  const key = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(REHAB_BUCKET)
    .upload(key, archivo, { cacheControl: "3600", upsert: false });
  if (error) { ERR("subirMediaRehab", error.message, error); throw new Error(error.message || "Error al subir"); }
  const { data } = supabase.storage.from(REHAB_BUCKET).getPublicUrl(key);
  LOG("subirMediaRehab", `✅ Subido: ${key}`);
  return data.publicUrl;
}

// Igual que guardarEjercicioBiblioteca pero en la categoría 'rehab' (los
// ejercicios de Griselda no se mezclan con los de entrenamiento).
export async function guardarEjercicioBibliotecaRehab(ej) {
  const nombreNorm = ej.nombre.trim();
  const { data: existente } = await supabase
    .from("biblioteca_ejercicios")
    .select("id, usos")
    .ilike("nombre", nombreNorm)
    .eq("categoria", "rehab")
    .maybeSingle();

  if (existente) {
    const update = { usos: (existente.usos || 0) + 1, actualizado_en: new Date().toISOString() };
    if (ej.desc) update.descripcion = ej.desc;
    if (ej.video) update.video = ej.video;
    const { error } = await supabase.from("biblioteca_ejercicios").update(update).eq("id", existente.id);
    if (error) ERR("guardarEjercicioBibliotecaRehab:update", error.message, error);
  } else {
    const { error } = await supabase.from("biblioteca_ejercicios").insert([{
      nombre: nombreNorm,
      descripcion: ej.desc || "",
      video: ej.video || "",
      usos: 1,
      categoria: "rehab",
    }]);
    if (error) ERR("guardarEjercicioBibliotecaRehab:insert", error.message, error);
  }
}

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

// ══════════════════════════════════════════════════════════════════════════
// NUEVAS FUNCIONES - REDISEÑO v2
// ══════════════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────────────
// PLANES: Asignar plan (bilateral/unilateral) a alumno
// ────────────────────────────────────────────────────────────────────────

export async function assignPlanToStudent(alumno_id, plan_type) {
  if (!['bilateral', 'unilateral'].includes(plan_type)) {
    ERR("assignPlanToStudent", `Tipo de plan inválido: ${plan_type}`);
    return null;
  }

  const { data, error } = await supabase
    .from("alumnos")
    .update({ plan_type, fecha_asignacion_plan: new Date().toISOString() })
    .eq("id", alumno_id)
    .select()
    .single();

  if (error) {
    ERR("assignPlanToStudent", `Error asignando plan a ${alumno_id}`, error);
    return null;
  }

  LOG("assignPlanToStudent", `✅ Plan '${plan_type}' asignado a ${alumno_id}`);
  return data;
}

// ────────────────────────────────────────────────────────────────────────
// REGISTROS DIARIOS: Guardar peso para un día específico
// ────────────────────────────────────────────────────────────────────────

export async function saveDailyWeight(alumno_id, fecha, ejercicio_id, peso) {
  if (!peso || Number(peso) <= 0) {
    LOG("saveDailyWeight", `⏭️ Ignorado (peso 0): ${ejercicio_id}`);
    return;
  }

  // Primero obtener el registro del día
  const { data: existing, error: fetchError } = await supabase
    .from("registros_diarios")
    .select("id, pesos")
    .eq("alumno_id", alumno_id)
    .eq("fecha", fecha)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    ERR("saveDailyWeight", "Error al obtener registro", fetchError);
    return;
  }

  const pesos = existing?.pesos || {};
  pesos[ejercicio_id] = Number(peso);

  let result;
  if (existing) {
    // Actualizar registro existente
    const { data, error } = await supabase
      .from("registros_diarios")
      .update({ pesos, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      ERR("saveDailyWeight", "Error actualizando pesos", error);
      return;
    }
    result = data;
  } else {
    // Crear nuevo registro
    const { data, error } = await supabase
      .from("registros_diarios")
      .insert([{
        alumno_id,
        fecha,
        pesos,
      }])
      .select()
      .single();

    if (error) {
      ERR("saveDailyWeight", "Error creando registro", error);
      return;
    }
    result = data;
  }

  LOG("saveDailyWeight", `✅ Peso ${peso}kg → ${ejercicio_id} en ${fecha}`, result);
  return result;
}

// ────────────────────────────────────────────────────────────────────────
// REGISTROS DIARIOS: Marcar asistencia
// ────────────────────────────────────────────────────────────────────────

export async function saveDailyAttendance(alumno_id, fecha, presente) {
  const { data: existing, error: fetchError } = await supabase
    .from("registros_diarios")
    .select("id")
    .eq("alumno_id", alumno_id)
    .eq("fecha", fecha)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    ERR("saveDailyAttendance", "Error al obtener registro", fetchError);
    return;
  }

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("registros_diarios")
      .update({ presente, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      ERR("saveDailyAttendance", "Error actualizando asistencia", error);
      return;
    }
    result = data;
  } else {
    const { data, error } = await supabase
      .from("registros_diarios")
      .insert([{
        alumno_id,
        fecha,
        presente,
      }])
      .select()
      .single();

    if (error) {
      ERR("saveDailyAttendance", "Error creando registro", error);
      return;
    }
    result = data;
  }

  LOG("saveDailyAttendance", `✅ Asistencia (${presente ? '✅' : '❌'}) marcada para ${fecha}`);
  return result;
}

// ────────────────────────────────────────────────────────────────────────
// BIOIMPEDANCIA: Guardar medición completa
// ────────────────────────────────────────────────────────────────────────

export async function saveBioimpedanciaCompleta(alumno_id, datos, foto = null) {
  // datos: { fecha, hora, peso, grasa_corporal, masa_muscular, grasa_visceral,
  //          imc, altura, edad, conclusion, objetivo }
  // foto: File opcional — se sube al bucket y queda linkeada al registro.
  // conclusion/objetivo van en la columna jsonb `metadata` (no requieren migración).

  let archivo_url = null;
  let nombre_archivo = null;
  if (foto) {
    try {
      await _ensureBioBucket();
      const ext = (foto.name.split(".").pop() || "jpg").toLowerCase();
      const key = `${alumno_id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BIO_BUCKET)
        .upload(key, foto, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from(BIO_BUCKET).getPublicUrl(key);
      archivo_url = urlData.publicUrl;
      nombre_archivo = foto.name;
    } catch (e) {
      // Storage puede estar bloqueado por RLS (ver migrations/006). Mientras
      // tanto la foto se guarda embebida en el registro, redimensionada para
      // que no pese: mismo patrón que ya usa la foto de perfil del alumno.
      LOG("saveBioimpedanciaCompleta", "⚠️ Storage bloqueado, guardando foto embebida.", e?.message);
      archivo_url = await _fotoADataUrl(foto);
      nombre_archivo = foto.name;
    }
  }

  const metadata = {};
  if (datos.conclusion) metadata.conclusion = datos.conclusion;
  if (datos.objetivo) metadata.objetivo = datos.objetivo;

  const payload = limpiarPayload({
    alumno_id,
    fecha: datos.fecha || new Date().toISOString().split("T")[0],
    hora: datos.hora,
    peso: datos.peso ? Number(datos.peso) : null,
    grasa_corporal: datos.grasa_corporal ? Number(datos.grasa_corporal) : null,
    masa_muscular: datos.masa_muscular ? Number(datos.masa_muscular) : null,
    grasa_visceral: datos.grasa_visceral ? Number(datos.grasa_visceral) : null,
    imc: datos.imc ? Number(datos.imc) : null,
    altura: datos.altura ? Number(datos.altura) : null,
    edad: datos.edad ? Number(datos.edad) : null,
    archivo_url,
    nombre_archivo,
    metadata: Object.keys(metadata).length ? metadata : undefined,
  });

  LOG("saveBioimpedanciaCompleta", `⏳ Guardando bioimpedancia para ${alumno_id}...`, payload);

  const { data, error } = await supabase
    .from("bioimpedancia")
    .insert([payload])
    .select()
    .single();

  if (error) {
    ERR("saveBioimpedanciaCompleta", "Error guardando bioimpedancia", error);
    throw error;
  }

  LOG("saveBioimpedanciaCompleta", `✅ Bioimpedancia guardada`, data);
  return data;
}

// ────────────────────────────────────────────────────────────────────────
// BIOIMPEDANCIA: Cargar historial completo
// ────────────────────────────────────────────────────────────────────────

export async function cargarBioimpedanciaCompleta(alumno_id, limit = 50) {
  const { data, error } = await supabase
    .from("bioimpedancia")
    .select("*")
    .eq("alumno_id", alumno_id)
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false })
    .limit(limit);

  if (error) {
    ERR("cargarBioimpedanciaCompleta", "Error cargando bioimpedancia", error);
    return [];
  }

  return data || [];
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

// ────────────────────────────────────────────────────────────────────────
// REPORTE MENSUAL: Obtener datos del mes para admin
// ────────────────────────────────────────────────────────────────────────

export async function getMonthlyReport(alumno_id, mes_yyyy_mm) {
  // mes_yyyy_mm: "2026-05"
  const mesStart = `${mes_yyyy_mm}-01`;
  const mesEnd = new Date(mes_yyyy_mm + "-01");
  mesEnd.setMonth(mesEnd.getMonth() + 1);
  const mesEndStr = mesEnd.toISOString().split("T")[0];

  try {
    // Obtener registros del mes
    const { data: registros, error: regError } = await supabase
      .from("registros_diarios")
      .select("*")
      .eq("alumno_id", alumno_id)
      .gte("fecha", mesStart)
      .lt("fecha", mesEndStr)
      .order("fecha", { ascending: true });

    if (regError) throw regError;

    // Obtener bioimpedancia del mes
    const { data: bioData, error: bioError } = await supabase
      .from("bioimpedancia")
      .select("*")
      .eq("alumno_id", alumno_id)
      .gte("fecha", mesStart)
      .lt("fecha", mesEndStr)
      .order("fecha", { ascending: false });

    if (bioError) throw bioError;

    // Procesar datos
    const asistencias = registros?.filter(r => r.presente).length || 0;
    const totalDias = registros?.length || 0;

    // Calcular pesos promedio
    const pesosPromedio = {};
    registros?.forEach(reg => {
      if (reg.pesos) {
        Object.entries(reg.pesos).forEach(([ejercicio, peso]) => {
          if (!pesosPromedio[ejercicio]) pesosPromedio[ejercicio] = [];
          pesosPromedio[ejercicio].push(Number(peso));
        });
      }
    });

    Object.keys(pesosPromedio).forEach(ejercicio => {
      const pesos = pesosPromedio[ejercicio];
      pesosPromedio[ejercicio] = {
        promedio: (pesos.reduce((a, b) => a + b) / pesos.length).toFixed(2),
        maximo: Math.max(...pesos),
        minimo: Math.min(...pesos),
        registros: pesos.length,
      };
    });

    const ultimaBio = bioData?.[0] || null;

    LOG("getMonthlyReport", `✅ Reporte generado para ${alumno_id} - ${mes_yyyy_mm}`);

    return {
      mes: mes_yyyy_mm,
      asistencias,
      totalDias,
      porcentajeAsistencia: totalDias > 0 ? ((asistencias / totalDias) * 100).toFixed(1) : 0,
      pesosPromedio,
      ultimaBioimpedancia: ultimaBio,
      totalBioimpedancias: bioData?.length || 0,
      registrosPorDia: registros || [],
      bioimpedancias: bioData || [],
    };
  } catch (error) {
    ERR("getMonthlyReport", "Error generando reporte", error);
    throw error;
  }
}

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
      .select("id,nombre_es,nombre_en,categoria,equipment,equipment_es,target,target_es,muscle_group_es,secondary_muscles_es,instrucciones_es,image,gif_url,video,codigo_di,grupo_di,custom,editado,attribution,musculos,musculo_default,tags,tag_default,archivado,nivel")
      .order("nombre_es")
      .range(desde, desde + PAGE - 1);
    if (error) { ERR("cargarCatalogo", "Error cargando catálogo", error); return all; }
    all = all.concat(data || []);
    if (!data || data.length < PAGE) break;
  }
  LOG("cargarCatalogo", `✅ ${all.length} ejercicios de catálogo.`);
  return all;
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
      categoria: "entrenamiento",
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
