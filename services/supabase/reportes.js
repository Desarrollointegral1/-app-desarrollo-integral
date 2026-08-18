import { supabase, LOG, ERR } from "./cliente.js";
import { resumirPesos } from "../../src/utils/pesos.js";

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

    // Pesos por ejercicio (promedio, máximo, mínimo, días con carga).
    // Antes hacía Number(peso) directo: con el formato por vuelta (array,
    // 2026-08-09) daba NaN y arruinaba el promedio del mes. Ahora cada día
    // aporta su peso representativo, en src/utils/pesos.js.
    const pesosPromedio = resumirPesos(registros);

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
