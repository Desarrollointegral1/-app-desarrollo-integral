import { Pause, Play } from "lucide-react";
import { NOMBRE_ENTRENADOR } from "./helpers.jsx";

// Barra de estado del modo voz (antes la rama `modoVoz ? (…)` del return).
// Movido textualmente desde CoachFlotante.jsx (refactor 2026-08-18): solo JSX,
// todo el estado y los handlers viven en CoachFlotante.jsx y llegan por props.
export function BarraModoVoz({
  BG,
  BORDER,
  CARD2,
  GRAY,
  pausarVoz,
  reanudarVoz,
  RED,
  terminarModoVoz,
  TEXT,
  vozEstado,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "12px 14px",
        background: "transparent",
        borderTop: `1px solid ${BORDER}`,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: GRAY,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: vozEstado === "hablando" ? RED : vozEstado === "escuchando" ? TEXT : GRAY,
            animation: vozEstado === "escuchando" ? "coachPulse 1.2s ease infinite" : "none",
            flexShrink: 0,
          }}
        />
        {vozEstado === "hablando"
          ? `${NOMBRE_ENTRENADOR} está hablando…`
          : vozEstado === "escuchando"
          ? "Escuchando… hablá"
          : vozEstado === "pensando"
          ? "Pensando…"
          : "En pausa"}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {vozEstado === "pausado" ? (
          <button
            onClick={reanudarVoz}
            style={{ background: TEXT, color: BG, border: "none", borderRadius: 20, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Play size={14} strokeWidth={2} />Reanudar
          </button>
        ) : (
          <button
            onClick={pausarVoz}
            style={{ background: CARD2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Pause size={14} strokeWidth={2} />Pausar
          </button>
        )}
        <button
          onClick={terminarModoVoz}
          style={{ background: "transparent", color: RED, border: `1px solid ${RED}`, borderRadius: 20, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          Terminar modo voz
        </button>
      </div>
    </div>
  );
}
