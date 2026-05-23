// ════════════════════════════════════════════════════════════════════════
// NUEVAS FUNCIONES PARA ARQUITECTURA SIMPLIFICADA
// Imports: supabase desde supabase.js
// ════════════════════════════════════════════════════════════════════════

import { supabase } from "./supabase.js";

const LOG = (fn, msg, data) =>
  console.log(`%c[SUPABASE:${fn}]`, "color:#6ee7b7;font-weight:bold", msg, data ?? "");

const ERR = (fn, msg, err) => {
  console.error(`[SUPABASE:${fn}] ❌ ${msg}`, err?.message || err);
};

// ═══════════════════════════════════════════════════════════════════════
// ENTRENAMIENTOS (Estructura de días de entrenamiento)
// ═══════════════════════════════════════════════════════════════════════

export async function cargarEntrenamientos(alumno_id) {
  LOG("cargarEntrenamientos", `⏳ Cargando entrenamientos para ${alumno_id}...`);
  try {
    const { data, error } = await supabase
      .from("entrenamientos")
      .select("*")
      .eq("alumno_id", alumno_id)
      .order("numero_dia");

    if (error) throw error;

    LOG("cargarEntrenamientos", `✅ ${data?.length || 0} entrenamientos cargados`);
    return data || [];
  } catch (e) {
    ERR("cargarEntrenamientos", e.message, e);
    return [];
  }
}

export async function guardarEntrenamiento(alumno_id, numero_dia, tipo_plan, ejercicios = []) {
  LOG("guardarEntrenamiento", `⏳ Guardando entrenamiento Día ${numero_dia}...`);
  try {
    // Asegurar que ejercicios sea array con los 6 principales
    const ejerciciosNormalizados = ejercicios.length > 0 ? ejercicios : [
      { id: 'hombro', nombre: 'Hombro', personalizado: false },
      { id: 'dom_rodilla', nombre: 'Dominante de Rodilla', personalizado: false },
      { id: 'pecho', nombre: 'Pecho', personalizado: false },
      { id: 'dom_cadera', nombre: 'Dominante de Cadera', personalizado: false },
      { id: 'espalda', nombre: 'Espalda', personalizado: false },
      { id: 'gluteos', nombre: 'Glúteos', personalizado: false },
    ];

    const { data, error } = await supabase
      .from("entrenamientos")
      .upsert({
        alumno_id,
        numero_dia,
        tipo_plan,
        ejercicios: ejerciciosNormalizados,
      })
      .select()
      .single();

    if (error) throw error;

    LOG("guardarEntrenamiento", `✅ Entrenamiento Día ${numero_dia} guardado`);
    return data;
  } catch (e) {
    ERR("guardarEntrenamiento", e.message, e);
    throw e;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// REGISTROS DIARIOS (Presencia + Pesos + Comentarios)
// ═══════════════════════════════════════════════════════════════════════

export async function guardarRegistroDiario(
  alumno_id,
  fecha,
  numero_dia_entrenamiento,
  presente,
  comentario,
  pesos
) {
  LOG("guardarRegistroDiario", `⏳ Registrando día ${fecha}...`);
  try {
    const payload = { alumno_id, fecha };

    if (numero_dia_entrenamiento !== null && numero_dia_entrenamiento !== undefined) {
      payload.numero_dia_entrenamiento = numero_dia_entrenamiento;
    }
    if (presente !== null && presente !== undefined) {
      payload.presente = presente;
    }
    if (comentario !== null && comentario !== undefined) {
      payload.comentario = comentario;
    }
    if (pesos && Object.keys(pesos).length > 0) {
      payload.pesos = pesos;
    }

    const { data, error } = await supabase
      .from("registros_diarios")
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;

    LOG("guardarRegistroDiario", `✅ Registro ${fecha} guardado`);
    return data;
  } catch (e) {
    ERR("guardarRegistroDiario", e.message, e);
    throw e;
  }
}

export async function cargarRegistrosDiarios(alumno_id, desde = 7) {
  LOG("cargarRegistrosDiarios", `⏳ Cargando registros de los últimos ${desde} días...`);
  try {
    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - desde);
    const fechaDesdeStr = fechaDesde.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("registros_diarios")
      .select("*")
      .eq("alumno_id", alumno_id)
      .gte("fecha", fechaDesdeStr)
      .order("fecha", { ascending: false });

    if (error) throw error;

    LOG("cargarRegistrosDiarios", `✅ ${data?.length || 0} registros cargados`);
    return data || [];
  } catch (e) {
    ERR("cargarRegistrosDiarios", e.message, e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// BIOIMPEDANCIA (Análisis corporal)
// ═══════════════════════════════════════════════════════════════════════

export async function guardarBioimpedancia(alumno_id, fecha, datos) {
  LOG("guardarBioimpedancia", `⏳ Guardando análisis para ${fecha}...`);
  try {
    const payload = {
      alumno_id,
      fecha,
      grasa_corporal: datos.grasaCorporal ? parseFloat(datos.grasaCorporal) : null,
      masa_muscular: datos.masaMuscular ? parseFloat(datos.masaMuscular) : null,
      peso: datos.peso ? parseFloat(datos.peso) : null,
      agua: datos.agua ? parseFloat(datos.agua) : null,
      nota: datos.nota || null,
      archivo_url: datos.archivoUrl || null,
    };

    const { data, error } = await supabase
      .from("bioimpedancia")
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;

    LOG("guardarBioimpedancia", `✅ Análisis guardado`);
    return data;
  } catch (e) {
    ERR("guardarBioimpedancia", e.message, e);
    throw e;
  }
}

export async function cargarBioimpedancia(alumno_id, dias = 30) {
  LOG("cargarBioimpedancia", `⏳ Cargando historial de bioimpedancia...`);
  try {
    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - dias);
    const fechaDesdeStr = fechaDesde.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("bioimpedancia")
      .select("*")
      .eq("alumno_id", alumno_id)
      .gte("fecha", fechaDesdeStr)
      .order("fecha", { ascending: false });

    if (error) throw error;

    LOG("cargarBioimpedancia", `✅ ${data?.length || 0} registros de bioimpedancia`);
    return data || [];
  } catch (e) {
    ERR("cargarBioimpedancia", e.message, e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// REPORTES MENSUALES
// ═══════════════════════════════════════════════════════════════════════

export async function generarReporteMensual(alumno_id, mes) {
  // mes = "2026-05" formato YYYY-MM
  LOG("generarReporteMensual", `⏳ Generando reporte para ${mes}...`);
  try {
    const { data: registros, error } = await supabase
      .from("registros_diarios")
      .select("*")
      .eq("alumno_id", alumno_id)
      .like("fecha", `${mes}%`)
      .order("fecha");

    if (error) throw error;

    // Procesar
    const asistencia = registros.filter((r) => r.presente).length;
    const pesos_maximos = {};
    const comentarios = [];

    registros.forEach((reg) => {
      if (reg.presente && reg.pesos) {
        Object.entries(reg.pesos).forEach(([ejercicio, peso]) => {
          if (!pesos_maximos[ejercicio]) pesos_maximos[ejercicio] = [];
          if (peso && peso > 0) pesos_maximos[ejercicio].push(peso);
        });
      }
      if (reg.comentario) comentarios.push(reg.comentario);
    });

    // Calcular promedios
    Object.keys(pesos_maximos).forEach((ej) => {
      if (pesos_maximos[ej].length > 0) {
        const promedio =
          pesos_maximos[ej].reduce((a, b) => a + b, 0) / pesos_maximos[ej].length;
        pesos_maximos[ej] = Math.round(promedio * 10) / 10;
      } else {
        delete pesos_maximos[ej];
      }
    });

    LOG("generarReporteMensual", `✅ Reporte generado. Asistencia: ${asistencia} días`);
    return { asistencia, pesos_maximos, comentarios };
  } catch (e) {
    ERR("generarReporteMensual", e.message, e);
    return { asistencia: 0, pesos_maximos: {}, comentarios: [] };
  }
}
