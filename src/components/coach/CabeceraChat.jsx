import { Headphones, Volume, Volume2 } from "lucide-react";
import { NOMBRE_ENTRENADOR } from "./helpers.jsx";

// Header del panel de chat (logo, nombre, modo voz, lectura en voz, minimizar).
// Movido textualmente desde CoachFlotante.jsx (refactor 2026-08-18): solo JSX,
// todo el estado y los handlers viven en CoachFlotante.jsx y llegan por props.
export function CabeceraChat({
  BORDER,
  CIRCULO,
  GRAY,
  iniciarModoVoz,
  leerVoz,
  LOGO,
  modoVoz,
  RED,
  setAbierto,
  setLeerVoz,
  soportaLectura,
  soportaVoz,
  terminarModoVoz,
  TEXT,
}) {
  return (
    <div
      onClick={() => { if (modoVoz) terminarModoVoz(); setAbierto(false); }}
      title="Minimizar"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        background: "transparent",
        borderBottom: `1px solid ${BORDER}`,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: CIRCULO,
          border: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          overflow: "hidden",
          perspective: "140px",
          flexShrink: 0,
        }}
      >
        <img
          src={LOGO}
          alt=""
          style={{ width: 26, height: 26, marginBottom: 2, animation: "coachLogoSpin 6s ease-in-out infinite" }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: TEXT, fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>{NOMBRE_ENTRENADOR}</div>
        <div style={{ color: GRAY, fontSize: 11 }}>Desarrollo Integral</div>
      </div>
      {soportaVoz && soportaLectura && (
        <button
          aria-label="Entrenar en modo voz"
          title="Modo voz — entrená con Luqui hablándote"
          onClick={(e) => { e.stopPropagation(); iniciarModoVoz(); }}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            padding: 4,
            color: GRAY,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <Headphones size={18} strokeWidth={2} />
        </button>
      )}
      {soportaLectura && (
        <button
          aria-label={leerVoz ? "Desactivar lectura en voz" : "Leer respuestas en voz alta"}
          title={leerVoz ? "Voz activada" : "Leer en voz alta"}
          onClick={(e) => {
            e.stopPropagation();
            if (leerVoz) {
              try { window.speechSynthesis?.cancel(); } catch {}
            }
            setLeerVoz((v) => !v);
          }}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            padding: 4,
            opacity: leerVoz ? 1 : 0.5,
            color: leerVoz ? RED : GRAY,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {leerVoz ? <Volume2 size={18} strokeWidth={2} /> : <Volume size={18} strokeWidth={2} />}
        </button>
      )}
      <span
        aria-label="Minimizar"
        style={{ color: GRAY, fontSize: 22, lineHeight: 1, padding: 4 }}
      >
        ×
      </span>
    </div>
  );
}
