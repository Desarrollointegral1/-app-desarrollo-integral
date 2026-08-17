import { BarChart3 } from "lucide-react";
import { ejerciciosUnicos, mesActual } from "../utils/helpers.js";
import { S, card } from "../utils/theme.js";
import { SUFIJO, unidadDe } from "../utils/unidades.js";

// ── RESUMEN MENSUAL ───────────────────────────────────────────────────
export function ResumenMensual({ asistencia, historiales, plan, diario }) {
  const mes = new Date();
  const mesStr = mesActual().slice(0, 7);
  const diasMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const asistMes = asistencia.filter((d) => d.startsWith(mesStr)).length;
  const totalHasta = Array.from(
    { length: diasMes },
    (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1),
  ).filter((d) => d <= new Date()).length;
  const pct = totalHasta > 0 ? Math.round((asistMes / totalHasta) * 100) : 0;
  // 2026-08-13: los máximos del mes salen de TODOS los días del alumno (antes
  // solo del primer plan) y sin repetir el ejercicio que está en dos días.
  const ejercicios = ejerciciosUnicos(plan.dias.flatMap((d) => d.ejercicios || []));
  // Records del mes
  const records = ejercicios
    .map((ej) => {
      const histMes = (historiales[ej.id] || []).filter((h) => h.fecha.startsWith(mesStr));
      const max = histMes.length > 0 ? Math.max(...histMes.map((h) => h.peso)) : null;
      return { nombre: ej.nombre, max, unidad: unidadDe(ej) }; // 2026-08-12: kg/reps/seg según el ejercicio
    })
    .filter((e) => e.max !== null);
  const diarioMes = (diario || []).filter((d) => d.fecha.startsWith(mesStr));
  return (
    <div>
      {" "}
      <div style={{ color: S.white, fontWeight: 900, fontSize: 16, marginBottom: 14 }}>
        {" "}
        Resumen — {new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })}{" "}
      </div>{" "}
      {/* Stats */}{" "}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.green, fontWeight: 900, fontSize: 28 }}>{asistMes}</div>{" "}
          <div style={{ color: S.gray, fontSize: 14, marginTop: 2 }}>ENTRENOS</div>{" "}
        </div>{" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 900, fontSize: 28 }}>{pct}%</div>{" "}
          <div style={{ color: S.gray, fontSize: 14, marginTop: 2 }}>ASISTENCIA</div>{" "}
        </div>{" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 900, fontSize: 28 }}>{diarioMes.length}</div>{" "}
          <div style={{ color: S.gray, fontSize: 14, marginTop: 2 }}>ENTRADAS</div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Records del mes */}{" "}
      {records.length > 0 && (
        <div style={{ ...card, padding: 14, marginBottom: 14 }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
            Máximos del mes
          </div>{" "}
          {records.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                borderBottom: i < records.length - 1 ? "1px solid " + S.border : "none",
              }}
            >
              {" "}
              <div style={{ color: S.gray, fontSize: 13 }}>{r.nombre}</div>{" "}
              <div style={{ color: S.white, fontWeight: 700, fontSize: 14 }}>{r.max} {SUFIJO[r.unidad]}</div>{" "}
            </div>
          ))}{" "}
        </div>
      )}{" "}
      {/* Entradas del diario */}{" "}
      {diarioMes.length > 0 && (
        <div style={{ ...card, padding: 14 }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Diario del mes</div>{" "}
          {diarioMes
            .sort((a, b) => b.fecha.localeCompare(a.fecha))
            .map((e, i) => (
              <div
                key={i}
                style={{
                  marginBottom: i < diarioMes.length - 1 ? 10 : 0,
                  paddingBottom: i < diarioMes.length - 1 ? 10 : 0,
                  borderBottom: i < diarioMes.length - 1 ? "1px solid " + S.border : "none",
                }}
              >
                {" "}
                <div style={{ color: S.lgray, fontSize: 11, marginBottom: 4 }}>
                  {String(e.fecha).slice(0, 10)}{String(e.fecha).length > 10 ? ` · ${String(e.fecha).slice(11)} hs` : ""}
                </div>{" "}
                <div style={{ color: S.white, fontSize: 13 }}>{e.texto}</div>{" "}
              </div>
            ))}{" "}
        </div>
      )}{" "}
      {asistMes === 0 && records.length === 0 && (
        <div style={{ ...card, padding: 40, textAlign: "center" }}>
          <BarChart3 size={32} style={{ marginBottom: 8 }} />
          <div style={{ color: S.gray, fontSize: 13 }}>Sin actividad este mes todavía</div>
        </div>
      )}{" "}
    </div>
  );
}
