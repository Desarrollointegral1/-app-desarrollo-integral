import { renderTexto } from "./helpers.jsx";

// Lista de burbujas del chat + indicador «escribiendo…».
// Movido textualmente desde CoachFlotante.jsx (refactor 2026-08-18): solo JSX,
// todo el estado y los handlers viven en CoachFlotante.jsx y llegan por props.
export function ListaMensajes({
  CARD2,
  enviando,
  GRAY,
  mensajes,
  RED,
  scrollRef,
  TEXT,
}) {
  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "14px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {mensajes.map((m, i) => (
        <div
          key={i}
          style={{
            alignSelf: m.rol === "user" ? "flex-end" : "flex-start",
            maxWidth: "82%",
            background: m.rol === "user" ? RED : CARD2,
            color: m.rol === "user" ? "#fff" : TEXT,
            padding: "9px 12px",
            borderRadius: 14,
            borderBottomRightRadius: m.rol === "user" ? 4 : 14,
            borderBottomLeftRadius: m.rol === "user" ? 14 : 4,
            fontSize: 14,
            lineHeight: 1.45,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {renderTexto(m.texto)}
        </div>
      ))}
      {enviando && (
        <div
          style={{
            alignSelf: "flex-start",
            background: CARD2,
            color: GRAY,
            padding: "9px 12px",
            borderRadius: 14,
            fontSize: 14,
          }}
        >
          escribiendo…
        </div>
      )}
    </div>
  );
}
