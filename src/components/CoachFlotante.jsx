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
 *   - iconWhite / iconBlack: data-URI del logo RECORTADO en blanco y en negro
 *     (ICON_WHITE_CROP / ICON_BLACK_CROP de App.jsx)
 *   - darkMode: para elegir el color del logo según el modo
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

export default function CoachFlotante({ alumno, iconWhite, iconBlack, darkMode, S }) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pos, setPos] = useState(null); // {x, y} del botón; null hasta montar
  const [habilitado, setHabilitado] = useState(false); // flag beta (ver abajo)
  const [escuchando, setEscuchando] = useState(false); // micrófono activo
  const [leerVoz, setLeerVoz] = useState(false); // leer las respuestas en voz alta
  const dragRef = useRef({ dragging: false, moved: false, dx: 0, dy: 0 });
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // ¿El navegador soporta dictado por voz? (Chrome/Edge sí; Safari iOS parcial)
  const SR =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const soportaVoz = !!SR;
  const soportaLectura = typeof window !== "undefined" && !!window.speechSynthesis;

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
      const porVoz = soportaVoz
        ? " Si te resulta más cómodo, tocá el micrófono y hablame — te escucho y te respondo."
        : "";
      setMensajes([
        {
          rol: "assistant",
          texto: `¡Hola${nombre ? " " + nombre : ""}! Soy tu coach. Puedo guiarte la sesión de hoy paso a paso, explicarte cada ejercicio con calma, o responderte cualquier duda.${porVoz} ¿Arrancamos?`,
        },
      ]);
    }
  }, [abierto, mensajes.length, alumno]);

  // Al minimizar/cerrar: cortar la voz y el micrófono.
  useEffect(() => {
    if (!abierto) {
      try { window.speechSynthesis?.cancel(); } catch {}
      try { recognitionRef.current?.stop(); } catch {}
      setEscuchando(false);
    }
  }, [abierto]);

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

  // Lee un texto en voz alta (voz en español si hay). Limpia el markdown.
  function hablar(texto) {
    if (!soportaLectura) return;
    const limpio = texto.replace(/[*#>_`]/g, "");
    const u = new SpeechSynthesisUtterance(limpio);
    u.lang = "es-AR";
    const voces = window.speechSynthesis.getVoices();
    const es = voces.find((v) => v.lang && v.lang.toLowerCase().startsWith("es"));
    if (es) u.voice = es;
    u.rate = 0.97;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  async function enviarMensaje(texto, porVoz = false) {
    texto = (texto || "").trim();
    if (!texto || enviando || !alumno?.id) return;
    setInput("");
    setMensajes((m) => [...m, { rol: "user", texto }]);
    setEnviando(true);
    let respuesta;
    try {
      const r = await fetch("/web/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumnoId: alumno.id, mensaje: texto }),
      });
      const data = await r.json();
      respuesta =
        r.ok && data.status === "success"
          ? data.respuesta
          : data.message || "Uy, algo falló. Probá de nuevo en un ratito.";
    } catch {
      respuesta = "No me pude conectar. Fijate la conexión y probá de nuevo.";
    }
    setMensajes((m) => [...m, { rol: "assistant", texto: respuesta }]);
    if (leerVoz || porVoz) hablar(respuesta);
    setEnviando(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function enviar() {
    enviarMensaje(input, false);
  }

  // Micrófono: dicta el mensaje y lo manda solo. Si dictó, lee la respuesta.
  function toggleEscucha() {
    if (!SR) return;
    if (escuchando) {
      recognitionRef.current?.stop();
      setEscuchando(false);
      return;
    }
    const rec = new SR();
    rec.lang = "es-AR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const dicho = e.results?.[0]?.[0]?.transcript || "";
      setEscuchando(false);
      if (dicho.trim()) enviarMensaje(dicho, true); // porVoz → lee la respuesta
    };
    rec.onerror = () => setEscuchando(false);
    rec.onend = () => setEscuchando(false);
    recognitionRef.current = rec;
    setEscuchando(true);
    try {
      rec.start();
    } catch {
      setEscuchando(false);
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
  // Logo b&w según el modo: en dark → círculo claro + logo negro; en light →
  // círculo oscuro + logo blanco (S.white es el color de texto, que se invierte
  // con el tema, así que sirve de fondo del círculo). Recortado como el de bienvenida.
  const LOGO = darkMode ? iconBlack : iconWhite;
  const CIRCULO = TEXT; // near-white en dark, near-negro en light

  return (
    <>
      {/* Animación del logo: péndulo 3D, igual que el de bienvenida. */}
      <style>{`@keyframes coachLogoSpin{0%{transform:rotateY(0)}25%{transform:rotateY(52deg)}50%{transform:rotateY(0)}75%{transform:rotateY(-52deg)}100%{transform:rotateY(0)}}@keyframes coachPulse{0%,100%{box-shadow:0 0 0 0 rgba(229,72,77,0.5)}50%{box-shadow:0 0 0 6px rgba(229,72,77,0)}}`}</style>

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
          background: CIRCULO,
          border: `1px solid ${BORDER}`,
          boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
          cursor: "grab",
          touchAction: "none",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          overflow: "hidden",
          perspective: "220px",
          zIndex: 2147483000,
          padding: 0,
          transition: "transform 0.15s",
        }}
      >
        <img
          src={LOGO}
          alt=""
          draggable={false}
          style={{
            width: 42,
            height: 42,
            marginBottom: 3,
            pointerEvents: "none",
            userSelect: "none",
            animation: "coachLogoSpin 6s ease-in-out infinite",
          }}
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
          {/* Header — clickeable para minimizar (además del ×) */}
          <div
            onClick={() => setAbierto(false)}
            title="Minimizar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              background: CARD,
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
              <div style={{ color: TEXT, fontWeight: 700, fontSize: 15, lineHeight: 1.1 }}>Coach</div>
              <div style={{ color: GRAY, fontSize: 11 }}>Desarrollo Integral</div>
            </div>
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
                }}
              >
                {leerVoz ? "🔊" : "🔈"}
              </button>
            )}
            <span
              aria-label="Minimizar"
              style={{ color: GRAY, fontSize: 22, lineHeight: 1, padding: 4 }}
            >
              ×
            </span>
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
                }}
              >
                🎤
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
        </div>
      )}
    </>
  );
}
