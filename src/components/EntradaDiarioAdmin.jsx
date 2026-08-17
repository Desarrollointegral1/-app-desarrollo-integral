import { useState } from "react";
import { S, card, inp } from "../utils/theme.js";

// ── DIARIO ADMIN ──────────────────────────────────────────────────────
// Una entrada del diario vista por el admin, con la posibilidad de RESPONDER.
// La respuesta se guarda como campo `respuesta` dentro de la misma entrada
// (el diario es un array JSON en la columna `diario` — sin tocar el esquema).
export function EntradaDiarioAdmin({ entrada, onResponder }) {
  const [editando, setEditando] = useState(false);
  const [txt, setTxt] = useState(entrada.respuesta || "");
  const guardar = () => {
    if (!txt.trim()) return;
    onResponder(txt.trim());
    setEditando(false);
  };
  return (
    <div style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
      <div style={{ color: S.lgray, fontSize: 11, marginBottom: 6 }}>
        {String(entrada.fecha).slice(0, 10)}{String(entrada.fecha).length > 10 ? ` · ${String(entrada.fecha).slice(11)} hs` : ""}
      </div>
      <div style={{ color: S.white, fontSize: 14, lineHeight: 1.6 }}>{entrada.texto}</div>
      {entrada.respuesta && !editando ? (
        <div style={{ marginTop: 10, borderLeft: "3px solid " + S.green, paddingLeft: 10 }}>
          <div style={{ color: S.green, fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Respuesta del profe</div>
          <div style={{ color: S.white, fontSize: 13, lineHeight: 1.5 }}>{entrada.respuesta}</div>
          <button onClick={() => { setTxt(entrada.respuesta || ""); setEditando(true); }} style={{ background: "transparent", color: S.gray, border: "none", fontSize: 11, cursor: "pointer", padding: "4px 0", textDecoration: "underline" }}>Editar respuesta</button>
        </div>
      ) : editando ? (
        <div style={{ marginTop: 10 }}>
          <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={2} placeholder="Escribile una respuesta al alumno..." style={{ ...inp, resize: "vertical", marginBottom: 6 }} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={guardar} disabled={!txt.trim()} style={{ background: txt.trim() ? S.green : S.card2, color: txt.trim() ? "#fff" : S.lgray, border: "none", borderRadius: 6, padding: "7px 14px", fontWeight: 700, fontSize: 12, cursor: txt.trim() ? "pointer" : "default" }}>Responder</button>
            <button onClick={() => setEditando(false)} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 6, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditando(true)} style={{ marginTop: 8, background: "transparent", color: S.green, border: "1px solid " + S.green, borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>↩ Responder</button>
      )}
    </div>
  );
}
