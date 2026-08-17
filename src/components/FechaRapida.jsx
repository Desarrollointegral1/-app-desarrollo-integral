import { useState } from "react";
import { FONT_BODY, S } from "../utils/theme.js";

// ── SELECTOR DE FECHA SIN POPUP NATIVO (ronda 18) ─────────────────────
// A Lucas no le cierra el date picker nativo del sistema (asistencia y
// diario). Reemplazo: chips rápidos "Hoy / Ayer / Otro día" — "Otro día"
// despliega una lista inline de los últimos 14 días como pills verticales
// tocables. Sin <input type="date">, sin popup del sistema.
export function FechaRapida({ value, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const offset = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
  const hoyStr = offset(0), ayerStr = offset(1);
  const DIAS_L = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const label = (f) => {
    const [y, m, dd] = (f || "").split("-").map(Number);
    if (!y) return f;
    const d = new Date(y, m - 1, dd);
    return `${DIAS_L[d.getDay()]} ${String(dd).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
  };
  const labelCorto = (f) => label(f).slice(0, 3) + label(f).slice(label(f).indexOf(" "));
  const esOtro = value !== hoyStr && value !== ayerStr;
  const chip = (activo) => ({ flex: 1, background: activo ? S.white : S.card3, color: activo ? S.bg : S.gray, border: "1px solid " + (activo ? S.white : S.border2), borderRadius: 8, padding: "10px 6px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 });
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => { onChange(hoyStr); setAbierto(false); }} style={chip(value === hoyStr && !abierto)}>Hoy</button>
        <button onClick={() => { onChange(ayerStr); setAbierto(false); }} style={chip(value === ayerStr && !abierto)}>Ayer</button>
        <button onClick={() => setAbierto((v) => !v)} style={chip(esOtro || abierto)}>
          {esOtro ? labelCorto(value) : "Otro día"}
        </button>
      </div>
      {abierto && (
        <div className="di-slide" style={{ background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, marginTop: 8, padding: 6, maxHeight: 224, overflowY: "auto" }}>
          {Array.from({ length: 14 }, (_, i) => offset(i)).map((f) => (
            <button
              key={f}
              onClick={() => { onChange(f); setAbierto(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: value === f ? S.white : "transparent", color: value === f ? S.bg : S.white, border: "none", borderRadius: 6, padding: "10px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}
            >
              {f === hoyStr ? "Hoy · " + label(f) : f === ayerStr ? "Ayer · " + label(f) : label(f)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
