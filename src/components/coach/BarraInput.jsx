import { Mic } from "lucide-react";

// Barra de entrada: micrófono, textarea y enviar (antes la rama `: (…)` del return).
// Movido textualmente desde CoachFlotante.jsx (refactor 2026-08-18): solo JSX,
// todo el estado y los handlers viven en CoachFlotante.jsx y llegan por props.
export function BarraInput({
  BG,
  BORDER,
  CARD2,
  enviando,
  enviar,
  escuchando,
  input,
  inputRef,
  onKeyDown,
  RED,
  setInput,
  soportaVoz,
  TEXT,
  toggleEscucha,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: 10,
        background: "transparent",
        borderTop: `1px solid ${BORDER}`,
      }}
    >
      {soportaVoz && (
        <button
          aria-label={escuchando ? "Dejar de escuchar" : "Hablar por voz"}
          title="Hablar por voz"
          onClick={toggleEscucha}
          style={{
            background: escuchando ? RED : CARD2,
            color: escuchando ? "#fff" : TEXT,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            width: 44,
            fontSize: 18,
            cursor: "pointer",
            flexShrink: 0,
            animation: escuchando ? "coachPulse 1.2s ease infinite" : "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mic size={18} strokeWidth={2} />
        </button>
      )}
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={escuchando ? "Escuchando… hablá" : "Escribí tu mensaje…"}
        rows={1}
        style={{
          flex: 1,
          resize: "none",
          background: BG,
          color: TEXT,
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          padding: "9px 12px",
          fontSize: 14,
          fontFamily: "inherit",
          maxHeight: 100,
          outline: "none",
        }}
      />
      <button
        aria-label="Enviar"
        onClick={enviar}
        disabled={enviando || !input.trim()}
        style={{
          background: RED,
          color: "#fff",
          border: "none",
          borderRadius: 12,
          width: 44,
          fontSize: 18,
          cursor: enviando || !input.trim() ? "default" : "pointer",
          opacity: enviando || !input.trim() ? 0.5 : 1,
          flexShrink: 0,
        }}
      >
        ↑
      </button>
    </div>
  );
}
