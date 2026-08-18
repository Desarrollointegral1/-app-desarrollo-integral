import { NotebookPen } from "lucide-react";
import { EntradaDiarioAdmin } from "../../components/EntradaDiarioAdmin.jsx";
import { mesActual } from "../../utils/helpers.js";
import { card, S, segChip, segTrack, smallBtn } from "../../utils/theme.js";
import { HistorialAdmin } from "../HistorialAdmin.jsx";
import { ReportesAlumno } from "../ReportesAlumno.jsx";

// Sección "reportes" del AdminPanel. Solo JSX: todo el estado y los
// handlers viven en AdminPanel.jsx y llegan por props (refactor 2026-08-17).
export function SeccionReportes({
  al,
  alumnos,
  exportarReporteMensual,
  onUpdate,
  repMes,
  repTab,
  setRepMes,
  setRepTab,
  showToast,
}) {
  return (
    <>
      <div style={{ ...segTrack(), marginBottom: 14 }}>
        {[
          // 2026-08-10, pedido de Lucas ("el módulo evaluación, reportes
          // debería estar fusionado en reportes"): la tercera pestaña es la
          // que vivía en Evaluación → Reportes. No se llama "Reportes"
          // porque, ya adentro de Reportes, ese nombre no la distinguía de
          // las otras dos. Los rótulos son cortos porque con tres pestañas
          // el segmented control da ~113px por chip en un celular de 375px
          // y el texto se cortaba en "ASISTEN…"; el título completo de cada
          // pantalla aparece igual arriba del contenido.
          ["Asistencia", "asistencia"],
          ["Pesos máximos", "historial"],
          ["Resumen", "resumen"],
        ].map(([l, k]) => (
          // Con tres pestañas cada chip mide 96px en un celular de 375px y
          // segChip (theme.js, compartido) trae whiteSpace:nowrap: los
          // rótulos salían cortados ("ASISTEN…", "PESOS M…"). Se permite
          // que envuelvan en dos renglones sólo acá — cortar el nombre de
          // una pestaña es peor que un chip un poco más alto.
          <button key={k} onClick={() => setRepTab(k)} style={{ ...segChip(repTab === k), minWidth: 0, whiteSpace: "normal", lineHeight: 1.2, padding: "12px 4px", letterSpacing: 0 }}>
            {l}
          </button>
        ))}
      </div>{" "}
      {repTab === "historial" && <HistorialAdmin al={al} />}{" "}
      {repTab === "resumen" && <ReportesAlumno al={al} />}{" "}
      {repTab === "asistencia" && al && (() => {
        // ASISTENCIA (ex "Reportes"): días que el alumno entrenó, con hora si
        // existe (los registros nuevos guardan "YYYY-MM-DD HH:mm"; los viejos
        // son solo fecha — se leen igual). Los reportes son MENSUALES: se
        // elige el mes y se exporta el reporte institucional de ese mes.
        const registros = [...(al.asistencia || [])].sort((a, b) => b.localeCompare(a));
        const mesHoy = mesActual().slice(0, 7);
        // Meses disponibles: el actual siempre + los que tengan asistencia o diario.
        const mesesSet = new Set([mesHoy]);
        registros.forEach((r) => mesesSet.add(r.slice(0, 7)));
        (al.diario || []).forEach((d) => { if (d.fecha) mesesSet.add(String(d.fecha).slice(0, 7)); });
        const meses = [...mesesSet].sort((a, b) => b.localeCompare(a));
        const MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const labelMes = (m) => `${MESES_ES[Number(m.slice(5, 7)) - 1] || m} ${m.slice(0, 4)}`;
        const mesSel = meses.includes(repMes) ? repMes : mesHoy;
        const delMes = registros.filter((r) => r.startsWith(mesSel));
        return (
          <div>
            <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Asistencia — {al.nombre}
            </div>
            {/* Ronda 10: se sacó el botón grande "EXPORTAR REPORTE DEL MES EN
                CURSO" de acá — quedaba redundante con el botón "Exportar"
                chico de la fila del mes en curso, más abajo. */}
            {/* Meses estilo resumen bancario: una fila por mes con sus datos
                y su botón Exportar al lado. Tocar la fila muestra su detalle. */}
            <div style={{ ...card, overflow: "hidden", marginBottom: 12 }}>
              {meses.map((m, i) => {
                const cant = registros.filter((r) => r.startsWith(m)).length;
                const activo = mesSel === m;
                return (
                  <div
                    key={m}
                    onClick={() => setRepMes(m)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer", background: activo ? S.card2 : "transparent", borderLeft: "3px solid " + (activo ? S.white : "transparent"), borderBottom: i < meses.length - 1 ? "1px solid " + S.border : "none" }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ color: activo ? S.white : S.gray, fontWeight: 700, fontSize: 13 }}>
                        {labelMes(m)}{m === mesHoy ? <span style={{ color: S.green, fontSize: 14, fontWeight: 700, marginLeft: 6 }}>· EN CURSO</span> : ""}
                      </div>
                      <div style={{ color: S.lgray, fontSize: 11, marginTop: 1 }}>{cant} asistencia{cant === 1 ? "" : "s"}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); exportarReporteMensual(al, m); }}
                      style={smallBtn(activo ? S.white : S.gray)}
                    >
                      ⬇ Exportar
                    </button>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
                <div style={{ color: S.green, fontWeight: 900, fontSize: 22 }}>{delMes.length}</div>
                <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1 }}>{labelMes(mesSel).toUpperCase()}</div>
              </div>
              <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
                <div style={{ color: S.white, fontWeight: 900, fontSize: 22 }}>{registros.length}</div>
                <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1 }}>TOTAL HISTÓRICO</div>
              </div>
            </div>
            {delMes.length === 0 ? (
              <div style={{ ...card, padding: 30, textAlign: "center", color: S.gray, fontSize: 13, marginBottom: 12 }}>
                Sin asistencias registradas en {labelMes(mesSel)}
              </div>
            ) : (
              <div style={{ ...card, overflow: "hidden", marginBottom: 12 }}>
                {delMes.map((r, i) => {
                  const fecha = r.slice(0, 10);
                  const hora = r.length > 10 ? r.slice(11) : "";
                  const [yy, mm, dd] = fecha.split("-");
                  const fechaCorta = `${dd}/${mm}/${yy}`;
                  let diaSemana = "";
                  try {
                    diaSemana = new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long" });
                  } catch (e) {}
                  return (
                    <div key={r + "-" + i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: i < delMes.length - 1 ? "1px solid " + S.border : "none" }}>
                      <div style={{ color: S.white, fontSize: 13 }}>
                        <span style={{ textTransform: "capitalize", color: S.gray, fontSize: 11, marginRight: 8 }}>{diaSemana}</span>
                        {fechaCorta}
                      </div>
                      <div style={{ color: hora ? S.green : S.lgray, fontSize: 12, fontWeight: hora ? 700 : 400 }}>{`Horario: ${hora || "—"}`}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* ── DIARIO del alumno — vive acá abajo de la asistencia (ronda 9) ── */}
            <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", margin: "22px 0 12px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><NotebookPen size={14} />Diario — {al.nombre}</span>
            </div>
            {(al.diario || []).length === 0 ? (
              <div style={{ ...card, padding: 30, textAlign: "center" }}>
                <NotebookPen size={26} style={{ marginBottom: 8 }} />
                <div style={{ color: S.gray, fontSize: 13 }}>Sin entradas todavía</div>
              </div>
            ) : (
              [...(al.diario || [])].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).map((e, i) => (
                <EntradaDiarioAdmin
                  key={(e.fecha || "") + "-" + i}
                  entrada={e}
                  onResponder={(respuesta) => {
                    const nuevoDiario = (al.diario || []).map((d) => (d === e ? { ...d, respuesta } : d));
                    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, diario: nuevoDiario } : a)));
                    showToast && showToast("Respuesta guardada");
                  }}
                />
              ))
            )}
          </div>
        );
      })()}
    </>
  );
}
