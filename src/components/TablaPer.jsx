import { Play } from "lucide-react";
import { S, card } from "../utils/theme.js";

// (PesoMaxAlumno se eliminó en la ronda 11 — quedó huérfano desde que "Peso
// Max" se sacó del admin. El peso máximo ahora se CALCULA solo, ver
// HistorialAdmin más abajo: es el mayor valor entre todos los registros de
// registros_diarios para ese ejercicio, sin importar si lo cargó el alumno
// en Principales o el entrenador desde Modo Entrenador.)
// ── TABLA PERIODIZACION ───────────────────────────────────────────────
function TablaPer({ data, semanaActual }) {
  return (
    <div style={{ ...card, overflow: "hidden" }}>
      {" "}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid " + S.border,
          color: S.white,
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        Tabla de Periodizacion
      </div>{" "}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        {" "}
        <thead>
          <tr style={{ background: S.card2 }}>
            {" "}
            <th style={{ padding: "8px 12px", color: S.gray, textAlign: "center" }}>SEM</th>{" "}
            {data[0] && data[0].fecha && (
              <th style={{ padding: "8px 12px", color: S.gray, textAlign: "center" }}>FECHA</th>
            )}{" "}
            <th style={{ padding: "8px 12px", color: S.gray, textAlign: "center" }}>S x R</th>{" "}
            <th style={{ padding: "8px 12px", color: S.gray, textAlign: "center" }}>INT.</th>{" "}
          </tr>
        </thead>{" "}
        <tbody>
          {data.map((r) => {
            const cur = r.semana === semanaActual;
            return (
              <tr
                key={r.semana}
                style={{ background: cur ? S.card2 : "transparent", borderBottom: "1px solid " + S.border }}
              >
                {" "}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    color: cur ? S.white : S.lgray,
                    fontWeight: cur ? 900 : 400,
                  }}
                >
                  {cur ? <Play size={11} style={{ verticalAlign: "-1px", marginRight: 2 }} /> : ""}
                  {r.semana}
                </td>{" "}
                {r.fecha && (
                  <td style={{ padding: "8px 12px", textAlign: "center", color: cur ? S.white : S.lgray }}>
                    {r.fecha}
                  </td>
                )}{" "}
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    color: cur ? S.white : S.lgray,
                    fontWeight: cur ? 700 : 400,
                  }}
                >
                  {r.series}x{r.reps}
                </td>{" "}
                <td style={{ padding: "8px 12px", textAlign: "center", color: cur ? S.green : S.lgray }}>
                  {r.intensidad || "—"}
                </td>{" "}
              </tr>
            );
          })}
        </tbody>{" "}
      </table>{" "}
    </div>
  );
}
