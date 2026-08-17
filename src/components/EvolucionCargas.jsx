import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { ejerciciosUnicos } from "../utils/helpers.js";
import { S, card, inp } from "../utils/theme.js";
import { SUFIJO, unidadDe } from "../utils/unidades.js";
import MiniChart from "./MiniChart.jsx";

// ── EVOLUCION DE CARGAS ───────────────────────────────────────────────
export function EvolucionCargas({ historiales, plan }) {
  // 2026-08-13: `plan.dias` ahora llega con los días de TODOS los planes del
  // alumno (antes era solo planes[0], o sea un día de tres), y el mismo
  // ejercicio repetido en dos días se muestra una sola vez con el historial
  // unido — no dos entradas con la mitad de los registros cada una.
  const ejercicios = ejerciciosUnicos(plan.dias.flatMap((d) => d.ejercicios || []));
  const [selEj, setSelEj] = useState(ejercicios[0] && ejercicios[0].id);
  const ej = ejercicios.find((e) => e.id === selEj);
  const hist = historiales[selEj] || [];
  // Agrupar por mes
  const porMes = {};
  hist.forEach((h) => {
    const m = h.fecha.slice(0, 7);
    if (!porMes[m] || h.peso > porMes[m]) porMes[m] = h.peso;
  });
  const dataMes = Object.entries(porMes)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, peso]) => ({ fecha: mes, peso }));
  return (
    <div>
      {" "}
      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Evolucion de cargas por ejercicio
      </div>{" "}
      <select value={selEj || ""} onChange={(e) => setSelEj(e.target.value)} style={{ ...inp, marginBottom: 16 }}>
        {" "}
        {ejercicios.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nombre}
          </option>
        ))}{" "}
      </select>{" "}
      {hist.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: "center" }}>
          <TrendingUp size={32} style={{ marginBottom: 8 }} />
          <div style={{ color: S.gray, fontSize: 13 }}>Sin registros para {ej && ej.nombre}</div>
        </div>
      ) : (
        <div>
          {" "}
          <div style={{ ...card, padding: 14, marginBottom: 12 }}>
            {" "}
            <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Maximo por mes</div>{" "}
            {dataMes.length >= 2 ? (
              <MiniChart data={dataMes} color={S.green} />
            ) : (
              <div style={{ color: S.lgray, fontSize: 12 }}>Necesitas registros en al menos 2 meses.</div>
            )}{" "}
          </div>{" "}
          <div style={{ ...card, padding: 14 }}>
            {" "}
            <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
              Todos los registros
            </div>{" "}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              {" "}
              <thead>
                <tr style={{ background: S.card2 }}>
                  {" "}
                  <th style={{ padding: "6px 10px", color: S.gray, textAlign: "left" }}>Fecha</th>{" "}
                  <th style={{ padding: "6px 10px", color: S.gray, textAlign: "right" }}>Peso</th>{" "}
                </tr>
              </thead>{" "}
              <tbody>
                {" "}
                {[...hist].reverse().map((h, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid " + S.border }}>
                    {" "}
                    <td style={{ padding: "6px 10px", color: S.gray }}>{h.fecha}</td>{" "}
                    <td style={{ padding: "6px 10px", color: S.white, fontWeight: 700, textAlign: "right" }}>
                      {/* 2026-08-12: la unidad la manda el ejercicio, no siempre son kilos. */}
                      {h.peso} {SUFIJO[unidadDe(ej)]}
                    </td>{" "}
                  </tr>
                ))}{" "}
              </tbody>{" "}
            </table>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
}
