import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Headphones, Volume2, Volume, Mic, Play, Pause } from "lucide-react";

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

// 2026-07-31 — el entrenador virtual pasa a llamarse Luqui (pedido de Lucas).
const NOMBRE_ENTRENADOR = "Luqui";

// ── Texto → voz: preparación antes de leer en voz alta ──────────────────
// Lucas: "todo el tiempo lee los números, no interpreta lo que dice, queda
// muy robotizado". SpeechSynthesis lee "2x6" o "70%" letra por letra o de
// forma rara porque no son palabras — esto expande los patrones más
// comunes de esta app (series×repeticiones, porcentajes, kilos) a texto
// que se lee como lo diría una persona. No toca el CONTENIDO de la
// respuesta (eso lo genera el backend) — solo cómo se pronuncia.
function prepararParaVoz(texto) {
  return texto
    .replace(/[*#>_`]/g, "")
    // "2x6" / "2 x 6" / "2×6" → "2 series de 6 repeticiones"
    .replace(/\b(\d+)\s*[x×]\s*(\d+)\b/gi, "$1 series de $2 repeticiones")
    // "70%" → "70 por ciento"
    .replace(/(\d+)\s*%/g, "$1 por ciento")
    // "40kg" / "40 kg" → "40 kilos" (no toca "kg" si no viene después de un número)
    .replace(/(\d+)\s*kg\b/gi, "$1 kilos")
    .replace(/(\d+)\s*seg\b/gi, "$1 segundos");
}

// Elige la mejor voz en español disponible. Antes se quedaba con la PRIMERA
// que empezara con "es" — que en Windows/Chrome suele ser la voz local más
// robótica. Prioridad: voces de red (Google, generalmente mejores que las
// del sistema operativo) > es-AR/es-419 (acento rioplatense/latino, más
// cercano al alumno) > cualquier es-* como último recurso.
function elegirVozEs() {
  const voces = window.speechSynthesis.getVoices();
  const es = voces.filter((v) => v.lang && v.lang.toLowerCase().startsWith("es"));
  if (es.length === 0) return null;
  const puntaje = (v) => {
    let p = 0;
    if (!v.localService) p += 2; // voz de red: suele sonar mejor que la local
    if (/es-ar|es-419|es-mx|es-us/i.test(v.lang)) p += 1; // acento latino/rioplatense
    return p;
  };
  return [...es].sort((a, b) => puntaje(b) - puntaje(a))[0];
}

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

// 2026-07-31, pedido de Lucas: el ícono de Luqui pasa a vivir en la barra
// inferior fija (junto a Entrenamiento/Historial) — ya no hace falta el
// botón flotante arrastrable en mobile (`mostrarBoton=false` lo oculta, el
// panel se abre igual desde afuera con el ref). `panelBottom` corre el panel
// para que no quede tapado por esa barra.
const CoachFlotante = forwardRef(function CoachFlotante({ alumno, iconWhite, iconBlack, darkMode, S, mostrarBoton = true, panelBottom = 14 }, ref) {
  const [abierto, setAbierto] = useState(false);
  // 2026-07-31 — Lucas: "al clickear en otro módulo de abajo también se
  // tiene que cerrar Luqui" — `cerrar` se usa desde los otros botones de la
  // barra inferior (Historial/Entrenamiento) para no dejar el chat abierto
  // tapando la pantalla al navegar a otra sección.
  useImperativeHandle(ref, () => ({ abrir: () => setAbierto(true), cerrar: () => setAbierto(false), toggle: () => setAbierto((v) => !v) }), []);
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pos, setPos] = useState(null); // {x, y} del botón; null hasta montar
  const [habilitado] = useState(true); // beta cerrada 2026-07-26, abierto a todos los alumnos
  const [escuchando, setEscuchando] = useState(false); // micrófono activo (chat)
  const [leerVoz, setLeerVoz] = useState(false); // leer las respuestas en voz alta
  const [modoVoz, setModoVoz] = useState(false); // modo voz inmersivo (manos libres)
  const [vozEstado, setVozEstadoRaw] = useState("idle"); // hablando|escuchando|pensando|pausado|idle
  const dragRef = useRef({ dragging: false, moved: false, dx: 0, dy: 0 });
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const modoVozRef = useRef(false);
  const vozEstadoRef = useRef("idle");
  const reintentoRef = useRef(0);
  // Audio de Voicebox (voz local) del último consultarCoach — { base64, mime }
  // o null si no vino (Voicebox apagado/no configurado: se usa SpeechSynthesis).
  const ultimoAudioRef = useRef(null);
  const audioElRef = useRef(null); // <audio> de Voicebox sonando ahora, si hay
  // Setter que mantiene el ref en sync (para leer el estado en callbacks async).
  const setVozEstado = (e) => { vozEstadoRef.current = e; setVozEstadoRaw(e); };

  // Corta cualquier voz sonando ahora mismo (Voicebox o navegador) — se usa
  // en toda interrupción/barge-in y al pausar/cerrar el modo voz.
  function cortarVoz() {
    try { window.speechSynthesis?.cancel(); } catch {}
    try { audioElRef.current?.pause(); } catch {}
    audioElRef.current = null;
  }

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


  // Autoscroll al último mensaje.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensajes, enviando, abierto]);

  // Mensaje de bienvenida la primera vez que se abre.
  useEffect(() => {
    if (abierto && mensajes.length === 0) {
      const nombre = (alumno?.nombre || "").split(" ")[0];
      // 2026-07-31 — Lucas: "el chat de Luqui tiene mucho texto en el primer
      // mensaje". Se corta a lo esencial; el resto (voz, modo guiado) el
      // alumno lo descubre solo tocando los íconos del header.
      setMensajes([
        {
          rol: "assistant",
          texto: `Hola${nombre ? " " + nombre : ""}, soy ${NOMBRE_ENTRENADOR}. ¿En qué te ayudo?`,
        },
      ]);
    }
  }, [abierto, mensajes.length, alumno]);

  // 2026-07-31: la transcripción del modo voz vive ahora en el MISMO panel
  // de chat (ver `scrollRef` más abajo, que ya se re-scrollea con
  // `mensajes`) — la pantalla completa aparte que tenía su propio scroll
  // se sacó, así que este efecto quedó redundante.

  // Al desmontar: cortar voz y micrófono.
  useEffect(() => () => {
    modoVozRef.current = false;
    cortarVoz();
    try { recognitionRef.current?.stop(); } catch {}
  }, []);

  // Al minimizar/cerrar el chat (no en modo voz): cortar la voz y el micrófono.
  useEffect(() => {
    if (!abierto && !modoVozRef.current) {
      cortarVoz();
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
  // Habla un texto en voz alta. `alTerminar` se llama al terminar (para
  // encadenar el modo voz: hablar → escuchar).
  function hablar(texto, alTerminar) {
    if (ultimoAudioRef.current) { reproducirAudioVoicebox(ultimoAudioRef.current, alTerminar); return; }
    if (!soportaLectura) { alTerminar && alTerminar(); return; }
    const u = new SpeechSynthesisUtterance(prepararParaVoz(texto));
    u.lang = "es-AR";
    const es = elegirVozEs();
    if (es) u.voice = es;
    u.rate = 0.97;
    if (alTerminar) {
      let yaTermino = false;
      const terminarUnaVez = () => { if (yaTermino) return; yaTermino = true; alTerminar(); };
      u.onend = terminarUnaVez;
      u.onerror = terminarUnaVez;
      // Salvavidas: si por un bug del navegador onend/onerror nunca disparan
      // (síntoma reportado: "empieza a hablar y no para"), no dejar la app
      // colgada esperando para siempre — a los 25s se fuerza a seguir.
      setTimeout(terminarUnaVez, 25000);
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  // Reproduce el audio generado por Voicebox (voz local). Mismo contrato que
  // SpeechSynthesis: `alTerminar` se llama una sola vez, con salvavidas de 25s.
  function reproducirAudioVoicebox({ base64, mime }, alTerminar) {
    const el = new Audio(`data:${mime};base64,${base64}`);
    audioElRef.current = el;
    let yaTermino = false;
    const terminarUnaVez = () => {
      if (yaTermino) return;
      yaTermino = true;
      if (audioElRef.current === el) audioElRef.current = null;
      alTerminar && alTerminar();
    };
    el.onended = terminarUnaVez;
    el.onerror = terminarUnaVez;
    setTimeout(terminarUnaVez, 25000);
    el.play().catch(terminarUnaVez);
  }

  // Núcleo: registra el turno del alumno, pide la respuesta al coach, la
  // registra y la devuelve. La transcripción ES `mensajes` (se guarda en el
  // backend en coach_conversaciones automáticamente). En modo voz, el backend
  // responde corto (2-3 oraciones, sin listas) para que se escuche natural.
  async function consultarCoach(texto, modoVozActivo = false) {
    setMensajes((m) => [...m, { rol: "user", texto }]);
    let respuesta;
    ultimoAudioRef.current = null; // se completa abajo si vino audio de Voicebox
    try {
      const r = await fetch("/web/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumnoId: alumno.id, mensaje: texto, modoVoz: modoVozActivo }),
      });
      const data = await r.json();
      respuesta =
        r.ok && data.status === "success"
          ? data.respuesta
          : data.message || "Uy, algo falló. Probá de nuevo en un ratito.";
      if (r.ok && data.audioBase64) {
        ultimoAudioRef.current = { base64: data.audioBase64, mime: data.audioMime || "audio/wav" };
      }
    } catch {
      respuesta = "No me pude conectar. Fijate la conexión y probá de nuevo.";
    }
    setMensajes((m) => [...m, { rol: "assistant", texto: respuesta }]);
    return respuesta;
  }

  async function enviarMensaje(texto, porVoz = false) {
    texto = (texto || "").trim();
    if (!texto || enviando || !alumno?.id) return;
    setInput("");
    setEnviando(true);
    const respuesta = await consultarCoach(texto);
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

  // ── MODO VOZ INMERSIVO (manos libres, tipo ChatGPT) ──────────────────
  // Loop continuo: Luqui habla → escucha tu respuesta → consulta → habla →
  // vuelve a escuchar. Toda la charla queda escrita en la transcripción
  // (mensajes) y guardada en el backend.

  function iniciarModoVoz() {
    if (!SR || !soportaLectura) return;
    modoVozRef.current = true;
    reintentoRef.current = 0;
    setModoVoz(true);
    const nombre = (alumno?.nombre || "").split(" ")[0];
    const saludo = `Dale${nombre ? " " + nombre : ""}, activé el modo voz. Entrenamos juntos: yo te voy guiando y vos me hablás cuando quieras. Si necesitás algo mientras hablo, decímelo nomás y me corto para escucharte. ¿Qué querés hacer hoy?`;
    setMensajes((m) => [...m, { rol: "assistant", texto: saludo }]);
    hablarYEscuchar(saludo);
  }

  // Habla Y escucha AL MISMO TIEMPO desde que arranca (no espera a que Luqui
  // termine). Si el alumno habla mientras Luqui todavía suena, se corta la
  // voz de Luqui y se procesa lo que dijo — es la "interrupción" real, el
  // alumno lidera el diálogo. Si el alumno no dice nada, cuando Luqui termina
  // de hablar el MISMO reconocedor sigue escuchando (sin reiniciar nada).
  function hablarYEscuchar(texto) {
    if (!modoVozRef.current) return;
    setVozEstado("hablando");
    let yaTermino = false;
    const pasarAEscuchar = () => {
      if (yaTermino) return;
      yaTermino = true;
      if (modoVozRef.current && vozEstadoRef.current === "hablando") setVozEstado("escuchando");
    };
    if (ultimoAudioRef.current) {
      const el = new Audio(`data:${ultimoAudioRef.current.mime};base64,${ultimoAudioRef.current.base64}`);
      audioElRef.current = el;
      const terminar = () => { if (audioElRef.current === el) audioElRef.current = null; pasarAEscuchar(); };
      el.onended = terminar;
      el.onerror = terminar;
      setTimeout(terminar, 25000);
      el.play().catch(terminar);
      escucharVoz();
      return;
    }
    const u = new SpeechSynthesisUtterance(prepararParaVoz(texto));
    u.lang = "es-AR";
    const es = elegirVozEs();
    if (es) u.voice = es;
    u.rate = 0.97;
    u.onend = pasarAEscuchar;
    u.onerror = pasarAEscuchar;
    // Mismo salvavidas que hablar(): si onend nunca dispara, no se queda
    // "hablando" para siempre bloqueando el resto de la conversación.
    setTimeout(pasarAEscuchar, 25000);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    escucharVoz(); // arranca YA, en paralelo — así puede interrumpir a Luqui
  }

  function escucharVoz() {
    if (!modoVozRef.current || !SR) return;
    const rec = new SR();
    rec.lang = "es-AR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let capturado = false;
    rec.onresult = (e) => {
      const dicho = e.results?.[0]?.[0]?.transcript || "";
      if (!dicho.trim()) return;
      capturado = true;
      cortarVoz(); // corta a Luqui si todavía estaba hablando
      try { rec.stop(); } catch {}
      turnoVoz(dicho);
    };
    rec.onerror = () => { if (!capturado && modoVozRef.current) reintentarEscucha(); };
    rec.onend = () => {
      if (!capturado && modoVozRef.current && vozEstadoRef.current !== "pausado" && vozEstadoRef.current !== "pensando") {
        reintentarEscucha();
      }
    };
    recognitionRef.current = rec;
    try { rec.start(); } catch { reintentarEscucha(); }
  }

  function reintentarEscucha() {
    if (!modoVozRef.current) return;
    reintentoRef.current += 1;
    // 2026-07-31 — Lucas: "no escucha, empieza a hablar y no para". Como el
    // micrófono arranca en paralelo con la voz de Luqui (barge-in), en
    // parlante (sin auriculares) suele captar su propio audio como "no-speech"
    // o ruido y reiniciar en cascada. Más margen entre reintentos (450→800ms)
    // y más reintentos antes de rendirse (6→10) para no pausar de golpe por
    // un par de falsos positivos de eco.
    if (reintentoRef.current > 10) { pausarVoz(); return; } // silencio largo → pausa
    setTimeout(() => {
      if (modoVozRef.current && vozEstadoRef.current !== "pausado" && vozEstadoRef.current !== "hablando") {
        setVozEstado("escuchando");
        escucharVoz();
      }
    }, 800);
  }

  async function turnoVoz(texto) {
    reintentoRef.current = 0;
    setVozEstado("pensando");
    const respuesta = await consultarCoach(texto, true);
    if (!modoVozRef.current) return;
    hablarYEscuchar(respuesta);
  }

  function pausarVoz() {
    setVozEstado("pausado"); // primero el estado, así el onend no re-escucha
    cortarVoz();
    try { recognitionRef.current?.stop(); } catch {}
  }

  function reanudarVoz() {
    reintentoRef.current = 0;
    escucharVoz();
  }

  function terminarModoVoz() {
    modoVozRef.current = false;
    cortarVoz();
    try { recognitionRef.current?.stop(); } catch {}
    setVozEstado("idle");
    setModoVoz(false);
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
      <style>{`@keyframes coachLogoSpin{0%{transform:rotateY(0)}25%{transform:rotateY(52deg)}50%{transform:rotateY(0)}75%{transform:rotateY(-52deg)}100%{transform:rotateY(0)}}@keyframes coachPulse{0%,100%{box-shadow:0 0 0 0 rgba(229,72,77,0.5)}50%{box-shadow:0 0 0 6px rgba(229,72,77,0)}}@keyframes coachRing{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0.45)}50%{box-shadow:0 0 0 18px rgba(255,255,255,0)}}`}</style>

      {/* Botón flotante (logo arrastrable) — en mobile vive en la barra
          inferior en su lugar (mostrarBoton=false), este queda solo para
          desktop. */}
      {mostrarBoton && (
        <button
          aria-label="Abrir entrenador"
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
      )}

      {/* Panel de chat */}
      {abierto && (
        <div
          role="dialog"
          aria-label="Entrenador"
          style={{
            position: "fixed",
            right: 14,
            bottom: panelBottom,
            width: "min(92vw, 380px)",
            height: "min(72vh, 560px)",
            // 2026-07-31 — Lucas: "el chat de Luqui es poco estético... tiene
            // que ser más transparente, menos invasivo". Antes era un panel
            // sólido opaco; ahora deja ver de fondo la app (glassmorphism
            // sutil), y la sombra baja de intensidad para no sentirse un
            // bloque pesado flotando encima de todo.
            background: darkMode ? "rgba(7,7,7,0.82)" : "rgba(255,255,255,0.86)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: `1px solid ${BORDER}`,
            borderRadius: 18,
            boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 2147483001,
            fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* Header — clickeable para minimizar (además del ×).
              2026-07-31: si hay modo voz activo, minimizar ya no deja nada
              visible que lo controle (la pantalla completa se sacó, ver
              más abajo) — así que minimizar también lo termina. */}
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

          {/* Input — o, si el modo voz está activo, la barra de estado.
              2026-07-31, pedido de Lucas: "que al clicar en los auriculares
              funcione pero no cambie de pantalla, siga todo en el chat" —
              antes esto abría una pantalla completa aparte (inset:0) con el
              logo grande girando; se saca esa pantalla entera y el modo voz
              pasa a vivir ACÁ, dentro del mismo panel de chat. La
              transcripción ya se escribe en `mensajes`, así que sigue
              apareciendo como burbujas normales arriba — no hace falta
              nada más para eso. */}
          {modoVoz ? (
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
          ) : (
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
          )}
        </div>
      )}

    </>
  );
});

export default CoachFlotante;
