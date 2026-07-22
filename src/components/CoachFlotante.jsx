import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * ============================================================
 * COACH FLOTANTE — asistente conversacional dentro de la app
 * ============================================================
 *
 * El logo del gimnasio flota sobre la app (arrastrable). Al tocarlo se abre un
 * chat estilo WhatsApp/ChatGPT que le habla al endpoint /web/api/coach con el
 * alumno logueado. El backend conoce los datos del alumno + el método de
 * Integral y lo puede guiar (entrenar, dudas, coaching).
 *
 * Props:
 *   - alumno: objeto del alumno logueado (necesita .id y .nombre)
 *   - iconUrl: data-URI del logo (ICON_WHITE de App.jsx)
 *   - S: tokens de tema activos (theme.js) para matchear la estética
 */

// Renderiza texto del coach preservando saltos de línea y **negrita** de forma
// segura (sin dangerouslySetInnerHTML — se parsea a nodos React).
function renderTexto(texto) {
  return texto.split("\n").map((linea, i) => {
    const partes = linea.split(/(\*\*[^*]+\*\*)/g).map((p, j) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <b key={j}>{p.slice(2, -2)}</b>;
      }
      return <React.Fragment key={j}>{p}</React.Fragment>;
    });
    return (
      <React.Fragment key={i}>
        {partes}
        {i < texto.split("\n").length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export default function CoachFlotante({ alumno, iconUrl, S }) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pos, setPos] = useState(null); // {x, y} del botón; null hasta montar
  const [habilitado, setHabilitado] = useState(false); // flag beta (ver abajo)
  const dragRef = useRef({ dragging: false, moved: false, dx: 0, dy: 0 });
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Posición inicial del botón: abajo a la derecha, arriba de la barra inferior.
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setPos({ x: w - 74, y: h - 150 });
  }, []);

  // FLAG BETA: el coach solo aparece para quien lo activa. Mientras Lucas
  // prueba, se abre la app UNA vez con ?coach=1 en la URL (queda guardado en
  // el dispositivo) y no lo ve ningún otro alumno. Se apaga con ?coach=0.
  // Cuando esté listo para todos, se elimina este gate.
  useEffect(() => {
    try {
      const q = new URL(window.location.href).searchParams.get("coach");
      if (q === "1") localStorage.setItem("coach_beta", "1");
      if (q === "0") localStorage.removeItem("coach_beta");
      setHabilitado(localStorage.getItem("coach_beta") === "1");
    } catch {}
  }, []);

  // Autoscroll al último mensaje.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensajes, enviando, abierto]);

  // Mensaje de bienvenida la primera vez que se abre.
  useEffect(() => {
    if (abierto && mensajes.length === 0) {
      const nombre = (alumno?.nombre || "").split(" ")[0];
      setMensajes([
        {
          rol: "assistant",
          texto: `¡Hola${nombre ? " " + nombre : ""}! Soy tu coach. Puedo guiarte la sesión de hoy paso a paso, contarte tips de técnica, o responderte dudas de entrenamiento. ¿Arrancamos?`,
        },
      ]);
    }
  }, [abierto, mensajes.length, alumno]);

  // ── Arrastre del botón (pointer events) ──────────────────────────────
  const onPointerDown = useCallback((e) => {
    dragRef.current = {
      dragging: true,
      moved: false,
      dx: e.clientX - pos.x,
      dy: e.clientY - pos.y,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }, [pos]);

  const onPointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d.dragging) return;
    const nx = e.clientX - d.dx;
    const ny = e.clientY - d.dy;
    // Marca que hubo arrastre real (umbral 5px) para distinguirlo de un tap.
    d.moved = d.moved || Math.hypot(nx - pos.x, ny - pos.y) > 5;
    const w = window.innerWidth;
    const h = window.innerHeight;
    setPos({
      x: Math.max(8, Math.min(w - 64, nx)),
      y: Math.max(8, Math.min(h - 64, ny)),
    });
  }, [pos]);

  const onPointerUp = useCallback((e) => {
    const d = dragRef.current;
    d.dragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (!d.moved) setAbierto((v) => !v); // fue un tap, no un arrastre
  }, []);

  async function enviar() {
    const texto = input.trim();
    if (!texto || enviando || !alumno?.id) return;
    setInput("");
    setMensajes((m) => [...m, { rol: "user", texto }]);
    setEnviando(true);
    try {
      const r = await fetch("/web/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumnoId: alumno.id, mensaje: texto }),
      });
      const data = await r.json();
      if (r.ok && data.status === "success") {
        setMensajes((m) => [...m, { rol: "assistant", texto: data.respuesta }]);
      } else {
        setMensajes((m) => [
          ...m,
          { rol: "assistant", texto: data.message || "Uy, algo falló. Probá de nuevo en un ratito." },
        ]);
      }
    } catch {
      setMensajes((m) => [
        ...m,
        { rol: "assistant", texto: "No me pude conectar. Fijate la conexión y probá de nuevo." },
      ]);
    } finally {
      setEnviando(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  if (!habilitado || !alumno?.id || !pos) return null;

  const RED = S?.red || "#e5484d";
  const CARD = S?.card || "#131313";
  const CARD2 = S?.card2 || "#1c1c1c";
  const BG = S?.bg || "#070707";
  const BORDER = S?.border || "#242424";
  const TEXT = S?.white || "#f2f2f2";
  const GRAY = S?.gray || "#9a9a9a";

  return (
    <>
      {/* Botón flotante (logo arrastrable) */}
      <button
        aria-label="Abrir coach"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: RED,
          border: "none",
          boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
          cursor: "grab",
          touchAction: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2147483000,
          padding: 0,
          transition: "transform 0.15s",
        }}
      >
        <img
          src={iconUrl}
          alt=""
          draggable={false}
          style={{ width: 34, height: 34, pointerEvents: "none", userSelect: "none" }}
        />
      </button>

      {/* Panel de chat */}
      {abierto && (
        <div
          role="dialog"
          aria-label="Coach"
          style={{
            position: "fixed",
            right: 14,
            bottom: 14,
            width: "min(92vw, 380px)",
            height: "min(72vh, 560px)",
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 18,
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 2147483001,
            fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              background: CARD,
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: RED,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <img src={iconUrl} alt="" style={{ width: 20, height: 20 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: TEXT, fontWeight: 700, fontSize: 15, lineHeight: 1.1 }}>Coach</div>
              <div style={{ color: GRAY, fontSize: 11 }}>Desarrollo Integral</div>
            </div>
            <button
              aria-label="Cerrar"
              onClick={() => setAbierto(false)}
              style={{
                background: "transparent",
                border: "none",
                color: GRAY,
                fontSize: 22,
                lineHeight: 1,
                cursor: "pointer",
                padding: 4,
              }}
            >
              ×
            </button>
          </div>

          {/* Mensajes */}
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

          {/* Input */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 10,
              background: CARD,
              borderTop: `1px solid ${BORDER}`,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribí tu mensaje…"
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
        </div>
      )}
    </>
  );
}
