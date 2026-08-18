import { supabase, LOG, ERR, makeUuid, isUuid } from "./cliente.js";

// Un solo mapeo de plan_ejercicios para los cuatro lugares que lo hacían
// copiado (cargarDatos, getPlanDias, getPlanEjercicios, getPlanDiasPorAlumnoPlan).
// Se unificó al sumar `seccion` (2026-08-10): con cuatro copias, agregar un
// campo es agregarlo cuatro veces y olvidarse en una — y olvidarse acá
// significa que el core de un día vuelve a ser un ejercicio principal.
function _mapEjercicio(e) {
  return {
    id:         e.id,
    nombre:     e.nombre      || "",
    desc:       e.descripcion || "",
    video:      e.video       || "",
    codigo:     e.codigo      || "",
    gif:        e.gif         || "",
    unidad:     e.unidad      || "reps",
    // 2026-08-13: el equipamiento del catálogo viaja con el ejercicio porque
    // de ahí sale la FORMA DE CARGA (barra + discos por lado, dos mancuernas,
    // placa, banda…). Sin este dato la app volvería a pedir "kilos" a secas.
    equipamiento: e.equipamiento || "",
    seccion:    e.seccion     || "principal",
    mediaLocal: "",
    historial:  [],
  };
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
    config:    d.config || {},
    ejercicios: (d.plan_ejercicios || []).sort((a, b) => a.orden - b.orden).map(_mapEjercicio),
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
  return (data || []).map(_mapEjercicio);
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
          // Misma herencia por día que en cargarDatos (2026-08-10).
          periodizacion: ap.periodizacion || row.plan_periodizacion || [],
          periodizacion_propia: ap.periodizacion || null,
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
    config:    d.config || {},
    ejercicios: (d.plan_ejercicios || []).sort((a, b) => a.orden - b.orden).map(_mapEjercicio),
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

// PERIODIZACIÓN PROPIA DE UN DÍA (2026-08-10, migración 037).
// `semanas` = array → el día deja de compartir la del alumno y se queda con
// esa; `null` → vuelve a compartir. No hay una tercera marca en ningún lado:
// la columna ES la marca, así que no se puede desincronizar del contenido.
export async function guardarPeriodizacionDia(alumno_plan_id, semanas) {
  const propia = Array.isArray(semanas) && semanas.length > 0 ? semanas : null;
  LOG("guardarPeriodizacionDia", `⏳ Plan ${alumno_plan_id} → ${propia ? `${propia.length} semana(s) propias` : "vuelve a compartir la del alumno"}`);
  const { error } = await supabase
    .from("alumno_planes")
    .update({ periodizacion: propia })
    .eq("id", alumno_plan_id);
  if (error) { ERR("guardarPeriodizacionDia", "No se pudo guardar la periodización del día", error); return false; }
  LOG("guardarPeriodizacionDia", "✅ Guardada");
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
      await _savePlanDias(nuevoAlPlan.id, dias, true, alumno_id);
    }

    LOG("crearPlanAlumno", `✅ Plan creado para ${dia_semana}`);
    return { ok: true, data: nuevoAlPlan };

  } catch (e) {
    ERR("crearPlanAlumno", "Error creando plan", e);
    return { ok: false, error: e };
  }
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
    // Se trae también alumno_id: los días tienen que quedar con el dueño
    // puesto o el alumno no los ve (rls_pd_select filtra por alumno_id).
    const { data: existe, error: exErr } = await supabase
      .from("alumno_planes")
      .select("id, alumno_id")
      .eq("id", alumno_plan_id)
      .maybeSingle();
    if (exErr) throw exErr;
    if (!existe) {
      ERR("actualizarPlanAlumnoDias", `El plan ${alumno_plan_id} ya no existe en alumno_planes (reemplazado o borrado desde otra sesión) — no se guardan días huérfanos`, null);
      return false;
    }
    return (await _savePlanDias(alumno_plan_id, dias, true, existe.alumno_id)) !== false;
  } catch (e) {
    ERR("actualizarPlanAlumnoDias", "Error actualizando plan", e);
    return false;
  }
}

// Dos _savePlanDias concurrentes sobre el MISMO alumno/plan se pisan: el
// delete de uno borra los días recién insertados del otro y los inserts de
// ejercicios quedan huérfanos (FK 23503). Se serializan por destino.
const _colasPlanDias = new Map();

function _savePlanDias(idParam, dias, isAlumnoPlan = false, alumnoId = null) {
  const prev = _colasPlanDias.get(idParam) || Promise.resolve();
  const run = prev.then(() => _savePlanDiasImpl(idParam, dias, isAlumnoPlan, alumnoId));
  _colasPlanDias.set(idParam, run.catch(() => {}));
  return run;
}

async function _savePlanDiasImpl(idParam, dias, isAlumnoPlan, alumnoId) {
  LOG("_savePlanDias", `⏳ Guardando ${dias.length} día(s) para ${idParam}`);

  // ── POR QUÉ ESTE CHEQUEO VA ACÁ Y NO EN EL QUE LLAMA (2026-08-13) ──
  // El camino viejo (sin alumno_plan) escribe días con alumno_plan_id NULL. Si
  // el alumno YA tiene planes por día, esos días quedan invisibles para todo el
  // mundo: la RLS del alumno filtra plan_ejercicios por alumno_plan_id, y
  // cargarDatos los descartaba para el admin. Data escrita que no ve nadie —
  // le pasó a Victoria Itatí con 6 ejercicios (limpiado en la migración 041).
  //
  // El 2026-08-09 esto se intentó tapar en _guardarAlumno con
  // `tienePlanesReales` calculado sobre `al.planes` del ESTADO DEL CLIENTE. Por
  // eso no alcanzó: el objeto que llega puede no traer `planes` (recién creado,
  // reconstruido, o guardado justo después de crear el primer plan, cuando el
  // estado local todavía no se recargó) y el guard se abre solo. La verdad de
  // si el alumno tiene planes está en la BASE, así que se pregunta acá, en el
  // único lugar por donde pasan TODOS los caminos de escritura de días.
  if (!isAlumnoPlan) {
    const { data: yaTiene, error: apErr } = await supabase
      .from("alumno_planes")
      .select("id")
      .eq("alumno_id", idParam)
      .limit(1);
    if (apErr) {
      ERR("_savePlanDias", "No se pudo verificar si el alumno ya tiene planes por día", apErr);
      return false;
    }
    if (yaTiene && yaTiene.length > 0) {
      // No es un error del que llama (no hay nada que reintentar): es una
      // escritura que NO tiene que ocurrir. Por eso devuelve true y avisa.
      LOG("_savePlanDias", `⚠️ ${idParam} ya tiene planes por día: NO se escriben días sueltos (quedarían invisibles para el alumno y para el admin)`);
      return true;
    }
  }

  // El borrado del camino viejo se limita a los días SUELTOS (alumno_plan_id
  // null): desde que los días de un plan por día también guardan alumno_id
  // (ver abajo), borrar por alumno_id a secas se llevaría puestos los planes
  // por día del alumno. 2026-08-10.
  const q = supabase.from("plan_dias").delete();
  const { error: delErr } = await (isAlumnoPlan
    ? q.eq("alumno_plan_id", idParam)
    : q.eq("alumno_id", idParam).is("alumno_plan_id", null));

  if (delErr) {
    ERR("_savePlanDias", "Error al borrar plan anterior", delErr);
    return false;
  }

  // 2026-08-13: lo que no se pudo escribir se cuenta y se devuelve. Antes un
  // día o un ejercicio que fallaba solo dejaba una línea en la consola y la
  // función terminaba con "✅ Plan guardado": el entrenador se iba pensando que
  // el plan estaba completo y al alumno le faltaban ejercicios.
  const fallos = [];

  for (let i = 0; i < dias.length; i++) {
    // config (2026-08-10): estructura del día — modo por tiempo, dónde va el
    // core. Sin config el día queda '{}' y se comporta como siempre.
    const insertData = { id: makeUuid(), dia: dias[i].dia||"Día", subtitulo: dias[i].subtitulo||"", orden: i, config: dias[i].config || {} };
    if (isAlumnoPlan) {
      insertData.alumno_plan_id = idParam;
      // alumno_id NO es decorativo (mismo caso que alumno_plan_id en
      // plan_ejercicios, 2026-08-09): la política rls_pd_select deja al ALUMNO
      // leer sus días SOLO por alumno_id. Sin llenarlo, el día existe, el admin
      // lo ve y el alumno no ve nada — bug de Maria Agustina, 2026-08-10.
      if (alumnoId) insertData.alumno_id = alumnoId;
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
      fallos.push(dias[i].dia || `día ${i + 1}`);
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
        // 2026-08-13: null y no "" cuando no se sabe — la columna es nullable
        // a propósito, para poder distinguir "este ejercicio no pasó por el
        // catálogo" de "el catálogo dice que no lleva equipamiento".
        equipamiento: ej.equipamiento || null,
        // 2026-08-10: bloque al que pertenece (principal · core · finisher).
        // El check de la migración 037 solo acepta esos tres, así que se
        // normaliza acá en vez de dejar que un dato raro reviente el insert.
        seccion:     ["core", "finisher"].includes(ej.seccion) ? ej.seccion : "principal",
        orden:       j,
        // alumno_plan_id NO es decorativo: la política RLS que deja al ALUMNO
        // leer sus propios ejercicios filtra por esta columna
        // (rls_pe_select: alumno_plan_id in (planes del alumno)). Sin llenarla,
        // el ejercicio existe, el admin lo ve, y el alumno no ve nada —
        // encontrado el 2026-08-09 con 21 de 105 filas en NULL.
        ...(isAlumnoPlan ? { alumno_plan_id: idParam } : {}),
      };
      let { error: ejErr } = await supabase.from("plan_ejercicios").insert(row);
      // 23505 = id duplicado (template compartido o guardado concurrente) → reintentar con id nuevo
      if (ejErr && ejErr.code === "23505") {
        row.id = makeUuid();
        ({ error: ejErr } = await supabase.from("plan_ejercicios").insert(row));
      }
      if (ejErr) {
        ERR("_savePlanDias", `Error insertando "${ej.nombre}"`, ejErr);
        fallos.push(ej.nombre || "ejercicio sin nombre");
      }
    }
  }

  if (fallos.length) {
    ERR("_savePlanDias", `Quedaron ${fallos.length} sin guardar: ${fallos.join(", ")}`, null);
    return false;
  }

  LOG("_savePlanDias", `✅ Plan guardado para ${idParam}.`);
  return true;
}


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

// Internos compartidos con alumnos.js (no salen por el barrel).
export { _mapEjercicio, _savePlanDias };
