import { createClient } from "@supabase/supabase-js";

// ── CONFIGURACION ──────────────────────────────────────────────────────
const SUPABASE_URL      = "https://tlxkghpytznkxgqslqzj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_KGJ75gHqy1gnVLpuf-7SyQ_IuByH1G8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

export async function cargarDatos(fallback) {
  LOG("cargarDatos", "⏳ Cargando alumnos...");
  try {
    const { data: rows, error } = await supabase
      .from("alumnos")
      .select("*")
      .order("nombre");

    if (error) throw error;

    if (!rows || rows.length === 0) {
      LOG("cargarDatos", "ℹ️ Tabla vacía. Retornando fallback.");
      return fallback;
    }

    LOG("cargarDatos", `Recibidos ${rows.length} alumno(s). Cargando planes...`);

    const alumnos = await Promise.all(
      rows.map(async (row) => {
        const dias = await getPlanDias(row.id);
        return {
          id:            row.id,
          nombre:        row.nombre,
          username:      row.username      || "",
          codigo:        row.codigo        || "",
          peso:          row.peso          || "",
          altura:        row.altura        || "",
          edad:          row.edad          || "",
          foto:          row.foto          || "",
          horarios:      row.horarios      || [],
          bioimpedancia: row.bioimpedancia || [],
          rm:            row.rm            || {},
          asistencia:    row.asistencia    || [],
          diario:        row.diario        || [],
          plan: {
            movilidad:     row.plan_movilidad     || [],
            calor:         row.plan_calor         || [],
            activacion:    row.plan_activacion    || [],
            periodizacion: row.plan_periodizacion || [],
            dias,
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
    const { data, error } = await supabase
      .from("alumnos")
      .insert(payload)
      .select();

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

  LOG("_guardarAlumno", `→ UPSERT "${al.nombre}" (id: ${al.id})`, payload);

  const { data, error } = await supabase
    .from("alumnos")
    .upsert(payload, { onConflict: "id" })
    .select("id, nombre");  // pedimos respuesta para confirmar

  if (error) {
    ERR("_guardarAlumno", `Falló UPSERT de "${al.nombre}"`, error);
    return;
  }

  LOG("_guardarAlumno", `✅ UPSERT confirmado:`, data);

  // Guardar plan de días (tablas normalizadas)
  if (al.plan?.dias) {
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
    mediaLocal: "",
    historial:  [],
  }));
}

async function _savePlanDias(alumno_id, dias) {
  LOG("_savePlanDias", `⏳ Guardando ${dias.length} día(s) para ${alumno_id}`);

  // Borrar en cascada (plan_ejercicios se elimina por FK)
  const { error: delErr } = await supabase
    .from("plan_dias")
    .delete()
    .eq("alumno_id", alumno_id);

  if (delErr) {
    ERR("_savePlanDias", "Error al borrar plan anterior", delErr);
    return;
  }

  for (let i = 0; i < dias.length; i++) {
    const { data: diaRow, error: diaErr } = await supabase
      .from("plan_dias")
      .insert({ id: makeUuid(), alumno_id, dia: dias[i].dia||"Día", subtitulo: dias[i].subtitulo||"", orden: i })
      .select()
      .single();

    if (diaErr || !diaRow) {
      ERR("_savePlanDias", `No se pudo crear el día "${dias[i].dia}"`, diaErr);
      continue;
    }

    for (let j = 0; j < (dias[i].ejercicios || []).length; j++) {
      const ej = dias[i].ejercicios[j];
      // Usar el id del ejercicio si ya es UUID válido; sino generar uno nuevo
      const ejId = isUuid(ej.id) ? ej.id : makeUuid();
      const { error: ejErr } = await supabase.from("plan_ejercicios").insert({
        id:          ejId,
        plan_dia_id: diaRow.id,
        nombre:      ej.nombre      || "",
        descripcion: ej.desc        || "",
        video:       ej.video       || "",
        orden:       j,
        series:      null,
        reps:        null,
      });
      if (ejErr) ERR("_savePlanDias", `Error insertando "${ej.nombre}"`, ejErr);
    }
  }

  LOG("_savePlanDias", `✅ Plan guardado para ${alumno_id}.`);
}


// ══════════════════════════════════════════════════════════════════════
// FLUJO 4: HISTORIAL DE PESOS
// ══════════════════════════════════════════════════════════════════════

export async function cargarPesos(alumno_id, fallback) {
  LOG("cargarPesos", `⏳ Cargando pesos de ${alumno_id}...`);

  try {
    const { data, error } = await supabase
      .from("historial_pesos")
      .select("*")
      .eq("alumno_id", alumno_id)
      .order("id", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      LOG("cargarPesos", `ℹ️ Sin historial para ${alumno_id}. Pesos en cero.`);
      return fallback;
    }

    const pesos       = {};
    const historiales = {};

    data.forEach((row) => {
      const eid = row.ejercicio_id;
      pesos[eid] = row.peso;
      if (!historiales[eid]) historiales[eid] = [];
      historiales[eid].push({ peso: row.peso, serie: row.serie || 1, fecha: row.fecha });
    });

    LOG("cargarPesos", `✅ ${data.length} registro(s) en ${Object.keys(historiales).length} ejercicio(s).`, pesos);
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
    const { data: alumno, error } = await supabase
      .from("alumnos")
      .select("*")
      .eq("codigo", codigo.toUpperCase())
      .single();

    if (error || !alumno) {
      throw new Error("Código inválido");
    }

    if (!alumno.pin_hash) {
      throw new Error("PIN no configurado. Contacta al admin.");
    }

    const pinHash = await hashearPIN(pin);
    if (pinHash !== alumno.pin_hash) {
      throw new Error("PIN incorrecto");
    }

    if (alumno.activo === false) {
      throw new Error("Cuenta desactivada");
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
    const { data: admin, error } = await supabase
      .from("admins")
      .select("*")
      .eq("codigo", codigo.toUpperCase())
      .single();

    if (error || !admin) {
      throw new Error("Código admin inválido");
    }

    const pinHash = await hashearPIN(pin);
    if (pinHash !== admin.pin_hash) {
      throw new Error("PIN incorrecto");
    }

    if (admin.activo === false) {
      throw new Error("Admin desactivado");
    }

    LOG("loginAdmin", `✅ Login admin exitoso para ${admin.nombre}`);
    return admin;
  } catch (e) {
    ERR("loginAdmin", e.message, e);
    throw e;
  }
}

export async function crearAlumnoConPIN(nombre, codigo, pin, altura, peso) {
  LOG("crearAlumnoConPIN", `⏳ Creando alumno ${codigo}...`);

  try {
    let nuevoAlumno = {
      nombre,
      codigo: codigo.toUpperCase(),
      altura: parseInt(altura) || 0,
      peso: parseFloat(peso) || 0,
    };

    try {
      const pinHash = await hashearPIN(pin);
      nuevoAlumno.pin_hash = pinHash;
    } catch (e) {
      LOG("crearAlumnoConPIN", "⚠️ pin_hash no soportado, creando sin PIN");
    }

    const { data, error } = await supabase
      .from("alumnos")
      .insert([nuevoAlumno])
      .select();

    if (error) {
      throw new Error(error.message || "Error al crear alumno");
    }

    LOG("crearAlumnoConPIN", `✅ Alumno ${nombre} creado exitosamente`, data);
    return data?.[0] || nuevoAlumno;
  } catch (e) {
    ERR("crearAlumnoConPIN", e.message, e);
    throw e;
  }
}

export async function crearAdmin(nombre, codigo, pin, email) {
  LOG("crearAdmin", `⏳ Creando admin ${codigo}...`);

  try {
    const pinHash = await hashearPIN(pin);
    const nuevoAdmin = {
      id: makeUuid(),
      nombre,
      codigo: codigo.toUpperCase(),
      pin_hash: pinHash,
      email,
      activo: true,
    };

    const { error } = await supabase
      .from("admins")
      .insert([nuevoAdmin]);

    if (error) {
      throw new Error(error.message || "Error al crear admin");
    }

    LOG("crearAdmin", `✅ Admin ${nombre} creado exitosamente`);
    return nuevoAdmin;
  } catch (e) {
    ERR("crearAdmin", e.message, e);
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
