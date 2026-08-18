import { supabase, LOG, ERR, makeUuid, limpiarPayload } from "./cliente.js";
import { _mapEjercicio, _savePlanDias, getPlanDias } from "./planes.js";

// ══════════════════════════════════════════════════════════════════════
// FLUJO 1: ARRANQUE
//   App.jsx mount → cargarDatos([]) → SELECT alumnos + getPlanDias
// ══════════════════════════════════════════════════════════════════════

// Columnas del alumno SIN la foto: las fotos son base64 gigantes (hubo una de
// 4.8MB) y bajarlas en la carga inicial hacía la app inusablemente lenta.
// Las fotos se hidratan aparte con cargarFotos() y se guardan solo cuando
// cambian con guardarFotoAlumno().
const COLS_ALUMNO_SIN_FOTO =
  // video_movilidad (2026-08-09): path del video del alumno tipo="video" — es
  // lo ÚNICO que ve esa pantalla, así que tiene que venir en la carga inicial
  // y en el login, no hidratarse después.
  "id,nombre,username,codigo,peso,altura,edad,fecha_nacimiento,email,tipo,plan_type,modalidad,video_movilidad,horarios,bioimpedancia,rm,asistencia,diario,plan_movilidad,plan_calor,plan_activacion,plan_periodizacion";

// Convierte un array crudo de plan_dias (con plan_ejercicios embebido) al
// shape { dia, subtitulo, ejercicios } que usa el resto de la app — mismo
// mapeo que getPlanDias/getPlanDiasPorAlumnoPlan, para que cargarDatos()
// devuelva exactamente la misma forma cargando todo en una sola consulta.
function _mapDiasEmbebidos(diasRaw) {
  return [...(diasRaw || [])]
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((d) => ({
      dia:       d.dia,
      subtitulo: d.subtitulo || "",
      // Estructura del día (2026-08-10, migración 037): core intercalado o al
      // final, finisher, y modo por tiempo. {} = como estaba antes.
      config:    d.config || {},
      ejercicios: [...(d.plan_ejercicios || [])]
        .sort((a, b) => a.orden - b.orden)
        .map(_mapEjercicio),
    }));
}

export async function cargarDatos(fallback) {
  LOG("cargarDatos", "⏳ Cargando alumnos y planes (1 consulta anidada)...");
  try {
    // Auditoría de performance 2026-08-02: antes era 1 query a alumnos + 1
    // por alumno (alumno_planes) + 1 por plan (plan_dias+plan_ejercicios) —
    // con 7 alumnos ya eran ~31 roundtrips, y escala linealmente con alumnos
    // × planes. plan_dias tiene DOS FKs (a alumno_planes vía alumno_plan_id,
    // y directo a alumnos vía alumno_id — verificado: TODAS las filas traen
    // alumno_id poblado, incluidas las que ya pertenecen a un alumno_plan),
    // así que se embebe plan_dias UNA sola vez desde alumnos y se agrupa por
    // alumno_plan_id en memoria — evita traerlo duplicado por los dos
    // caminos. Verificado contra prod con RLS real (sesión de alumna): la
    // agrupación coincide exacto con lo que devolvía el camino N+1 viejo.
    const { data: rows, error } = await supabase
      .from("alumnos")
      // 2026-08-10 (bug de Lucas: "no aparecen los ejercicios de Maria
      // Agustina"): los días de un plan por día se piden ANIDADOS bajo
      // alumno_planes, no colgados de alumnos. El embebido por alumno_id
      // asumía que toda fila de plan_dias traía alumno_id, y _savePlanDias
      // con isAlumnoPlan=true nunca lo llena: los 3 planes de ella tenían
      // alumno_id NULL, así que la consulta no devolvía NINGÚN día y sus 14
      // ejercicios (Jueves y Sábado) eran invisibles en toda la app. El
      // embebido suelto se queda solo para el plan sintético "Fijo", que sí
      // se guarda por alumno_id.
      .select(`${COLS_ALUMNO_SIN_FOTO},
        alumno_planes(id, dia_semana, nombre, estado, periodizacion,
          plan_dias(id, dia, subtitulo, orden, config,
            plan_ejercicios(id, nombre, descripcion, video, codigo, gif, unidad, equipamiento, seccion, orden))),
        plan_dias(id, dia, subtitulo, orden, alumno_plan_id, config,
          plan_ejercicios(id, nombre, descripcion, video, codigo, gif, unidad, equipamiento, seccion, orden))`)
      // 2026-08-04: los archivados (ver deleteAlumno/migración 030) no
      // aparecen en el listado normal del Dashboard.
      .eq("archivado", false)
      .order("nombre");

    if (error) throw error;

    if (!rows || rows.length === 0) {
      LOG("cargarDatos", "ℹ️ Tabla vacía. Retornando fallback.");
      return fallback;
    }

    LOG("cargarDatos", `Recibidos ${rows.length} alumno(s) con sus planes.`);

    const alumnos = rows.map((row) => {
      // Solo los días SUELTOS (sin plan por día): los del plan sintético "Fijo".
      const diasSueltos = (row.plan_dias || []).filter((d) => !d.alumno_plan_id);

      const alPlanes = row.alumno_planes || [];
      // 2026-08-13: si el alumno tiene planes por día Y ADEMÁS quedaron días
      // sueltos, esos días se descartaban acá y no los veía NADIE — ni la
      // alumna (la RLS le esconde sus ejercicios) ni el admin. Ahora se
      // muestran como un plan aparte, marcado, para que se puedan revisar y
      // borrar en vez de quedar como data fantasma. `_huerfano` hace que la
      // vista del alumno lo ignore al elegir el plan del día (App.jsx).
      const planHuerfano = alPlanes.length > 0 && diasSueltos.length > 0
        ? [{
            id: makeUuid(),
            dia_semana: "Sueltos",
            nombre: "Días sueltos (revisar)",
            _huerfano: true,
            estado: "activo",
            dias: _mapDiasEmbebidos(diasSueltos),
            movilidad: [], calor: [], activacion: [],
            periodizacion: row.plan_periodizacion || [],
          }]
        : [];
      const planes = alPlanes.length > 0
        ? alPlanes.map((ap) => ({
            id:            ap.id,
            dia_semana:    ap.dia_semana,
            nombre:        ap.nombre,
            estado:        ap.estado,
            dias:          _mapDiasEmbebidos(ap.plan_dias),
            movilidad:     row.plan_movilidad     || [],
            calor:         row.plan_calor         || [],
            activacion:    row.plan_activacion    || [],
            // PERIODIZACIÓN POR DÍA (2026-08-10, migración 037): la herencia
            // se resuelve ACÁ y `periodizacion` queda siendo la efectiva, así
            // los muchos lugares que la leen directo (PlanDelDia, PDF,
            // reporte mensual) no se enteran del cambio. El crudo va aparte
            // para que la pantalla del admin sepa si el día comparte o no.
            periodizacion: ap.periodizacion || row.plan_periodizacion || [],
            periodizacion_propia: ap.periodizacion || null,
          })).concat(planHuerfano)
        : [{
            id: makeUuid(),
            dia_semana: "Fijo",
            nombre: "Plan Único",
            // Marca que este plan NO existe como fila de alumno_planes: se arma al
            // vuelo desde plan_dias(alumno_id). Editarlo se persiste por el camino
            // viejo (al.plan.dias → _guardarAlumno), no por actualizarPlanAlumnoDias.
            _sintetico: true,
            estado: "activo",
            dias:          _mapDiasEmbebidos(diasSueltos),
            movilidad:     row.plan_movilidad     || [],
            calor:         row.plan_calor         || [],
            activacion:    row.plan_activacion    || [],
            periodizacion: row.plan_periodizacion || [],
          }];

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
        video_movilidad: row.video_movilidad || "", // 2026-08-09, alumnos tipo="video"
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
    });

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
    video_movilidad:    al.video_movilidad, // 2026-08-09 (migración 032); undefined se elimina en limpiarPayload
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

// Arma el objeto de columnas de un alumno. Separado de _guardarAlumno para
// poder comparar el estado actual contra el último guardado y mandar SOLO lo
// que cambió — ver payloadAlumno/guardarDatos abajo.
export function payloadAlumno(al) {
  return limpiarPayload({
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
    video_movilidad:    al.video_movilidad, // 2026-08-09 (migración 032); undefined se elimina en limpiarPayload
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
}

// Columnas que cambiaron entre el último payload guardado y el actual.
// Devuelve null si no cambió nada. La comparación es por JSON porque casi
// todas las columnas interesantes son jsonb (horarios, rm, asistencia,
// diario, los plan_*), donde === siempre daría distinto.
export function _columnasCambiadas(previo, actual) {
  if (!previo) return null; // sin referencia: el llamador manda todo
  const diff = {};
  for (const k of Object.keys(actual)) {
    if (k === "id") continue;
    if (JSON.stringify(previo[k]) !== JSON.stringify(actual[k])) diff[k] = actual[k];
  }
  // Una columna que estaba en el payload previo y desapareció del actual
  // (limpiarPayload saca los undefined) no se toca: no hay nada que escribir.
  return Object.keys(diff).length === 0 ? {} : diff;
}

/**
 * Guarda alumnos.
 *
 * `previos` es un Map(id → payload de la última vez que se guardó ese alumno).
 * Si viene, se escribe SOLO lo que cambió con un UPDATE parcial en vez de
 * pisar la fila completa con un upsert.
 *
 * Por qué importa (bug reportado por Lucas el 2026-08-09, "cambio algo y
 * vuelve a lo mismo"): el upsert mandaba las 20 columnas del alumno, así que
 * cualquier pestaña con el estado viejo en memoria revertía TODO lo que había
 * hecho la otra — no solo el campo que ella tocó. Con la app abierta en la
 * compu y en el celular a la vez (o dos pestañas), los cambios se pisaban
 * entre sí sin ningún aviso. Mandando solo las columnas tocadas, dos
 * pantallas editando cosas distintas del mismo alumno ya no se pisan.
 */
export async function guardarDatos(alumnos, previos) {
  // Nunca guardar un array vacío (evita sobreescribir con nada al arrancar)
  if (!alumnos || alumnos.length === 0) {
    LOG("guardarDatos", "⏭️ Array vacío, skip.");
    return;
  }

  LOG("guardarDatos", `⏳ Guardando ${alumnos.length} alumno(s)...`);

  for (const al of alumnos) {
    await _guardarAlumno(al, previos instanceof Map ? previos.get(al.id) : undefined);
  }

  LOG("guardarDatos", "✅ Guardado completo.");
}

// Guarda un solo alumno — separado para poder debuggear por individuo
async function _guardarAlumno(al, payloadPrevio) {
  const completo = payloadAlumno(al);

  // Camino nuevo: si sabemos qué había antes, se escribe solo la diferencia.
  const diff = _columnasCambiadas(payloadPrevio, completo);
  if (diff && Object.keys(diff).length === 0) {
    LOG("_guardarAlumno", `⏭️ "${al.nombre}" sin columnas cambiadas, skip.`);
    return;
  }
  const payload = diff ? { id: al.id, ...diff } : completo;
  const parcial = Boolean(diff);

  LOG("_guardarAlumno", `→ ${parcial ? `UPDATE parcial (${Object.keys(diff).join(", ")})` : "UPSERT completo"} "${al.nombre}" (id: ${al.id})`, payload);

  // UPDATE cuando sabemos qué cambió (no toca ninguna otra columna), UPSERT
  // cuando no hay referencia previa (alumno nuevo o primera carga).
  const escribir = (p) =>
    parcial
      ? supabase.from("alumnos").update(p).eq("id", al.id).select("id, nombre")
      : supabase.from("alumnos").upsert(p, { onConflict: "id" }).select("id, nombre");

  let { data, error } = await escribir(payload);

  // Fallback: si la columna "modalidad" no existe todavía (falta migración
  // 009), reintenta sin ese campo — que un campo nuevo no rompa TODO el
  // guardado del alumno (mismo criterio que email en crearAlumnoConPIN).
  if (error && "modalidad" in payload && /(column .*modalidad.* does not exist|find the 'modalidad' column)/i.test(error.message || "")) {
    LOG("_guardarAlumno", "⚠️ Columna 'modalidad' no existe todavía (falta migración 009), guardando sin modalidad");
    delete payload.modalidad;
    ({ data, error } = await escribir(payload));
  }

  if (error) {
    // 2026-08-13: LANZA en vez de loguear y seguir. Por acá pasan el diario y
    // la asistencia que carga el alumno: con el `return` de antes, guardarDatos
    // terminaba "ok", App.jsx daba el alumno por guardado en su snapshot y ese
    // cambio no se reintentaba nunca más. Se perdía sin ningún aviso.
    ERR("_guardarAlumno", `Falló UPSERT de "${al.nombre}"`, error);
    throw new Error(error.message || `No se pudo guardar a ${al.nombre}`);
  }

  LOG("_guardarAlumno", `✅ UPSERT confirmado:`, data);

  // Guardar plan de días (tablas normalizadas) — SOLO si el alumno no tiene
  // planes reales en alumno_planes. al.plan es una copia de compatibilidad de
  // planes[0] (cargarDatos): re-escribirla acá creaba filas huérfanas en
  // plan_dias(alumno_id) que ninguna vista lee (bug Vic 2026-07-21 — datos
  // muertos que confundían el diagnóstico del desfase admin→alumno).
  const tienePlanesReales = (al.planes || []).some((p) => p && !p._sintetico);
  if (al.plan?.dias && !tienePlanesReales) {
    // El chequeo de verdad está adentro de _savePlanDias y va contra la BASE:
    // este de acá depende del estado del cliente, que puede venir sin `planes`
    // (ver el comentario de los días huérfanos en _savePlanDiasImpl).
    if ((await _savePlanDias(al.id, al.plan.dias)) === false) {
      throw new Error(`No se pudo guardar el plan de ${al.nombre}`);
    }
  }
}

// 2026-08-04: "eliminar" un alumno ARCHIVA, nunca borra de verdad — un click
// equivocado en la lista del Dashboard (sin confirmación, solo el toast de
// "Deshacer" de 6s) borró en serio a un alumno y, por los ON DELETE CASCADE
// de las tablas relacionadas (bioimpedancia, planes, entrenamientos,
// registros_diarios, evaluaciones, historial_pesos), se llevó todo su
// historial con él, sin forma de deshacerlo pasados los 6s. Ver migración
// 030. `restaurarAlumno` es el camino de vuelta.
export async function deleteAlumno(alumno_id) {
  LOG("deleteAlumno", `⏳ Archivando alumno ${alumno_id}...`);
  const { error } = await supabase.from("alumnos").update({ archivado: true, archivado_en: new Date().toISOString() }).eq("id", alumno_id);
  if (error) { ERR("deleteAlumno", `No se pudo archivar ${alumno_id}`, error); return false; }
  LOG("deleteAlumno", `✅ Alumno ${alumno_id} archivado.`);
  return true;
}

export async function restaurarAlumno(alumno_id) {
  LOG("restaurarAlumno", `⏳ Restaurando alumno ${alumno_id}...`);
  const { error } = await supabase.from("alumnos").update({ archivado: false, archivado_en: null }).eq("id", alumno_id);
  if (error) { ERR("restaurarAlumno", `No se pudo restaurar ${alumno_id}`, error); return false; }
  LOG("restaurarAlumno", `✅ Alumno ${alumno_id} restaurado.`);
  return true;
}

export async function cargarAlumnosArchivados() {
  const { data, error } = await supabase
    .from("alumnos")
    .select("id, nombre, username, codigo, archivado_en")
    .eq("archivado", true)
    .order("archivado_en", { ascending: false });
  if (error) { ERR("cargarAlumnosArchivados", "Error al cargar archivados", error); return []; }
  return data || [];
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

// Interno compartido con auth.js (no sale por el barrel).
export { COLS_ALUMNO_SIN_FOTO };
