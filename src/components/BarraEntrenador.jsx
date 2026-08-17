import { Dumbbell } from "lucide-react";
import { S } from "../utils/theme.js";

// ── MODO ENTRENADOR (ronda 9) ─────────────────────────────────────────
// Barra fija que deja INEQUÍVOCO que se está operando como entrenador
// sobre la cuenta de un alumno, con salida directa al panel admin.
export function BarraEntrenador({ nombre, onVolver }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 300,
        background: S.red,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "8px 14px",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Dumbbell size={14} />Modo entrenador — {nombre}</span>
      </div>
      <button
        onClick={onVolver}
        style={{ background: "#fff", color: "#111", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 0.5, flexShrink: 0 }}
      >
        Volver al panel
      </button>
    </div>
  );
}
