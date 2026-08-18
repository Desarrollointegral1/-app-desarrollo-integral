import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { supabase } from "../../services/supabase.js";
import { NOMBRE_ENTRENADOR, prepararParaVoz, elegirVozEs } from "./coach/helpers.jsx";
import { useModoVoz } from "./coach/useModoVoz.js";
import { BotonFlotante } from "./coach/BotonFlotante.jsx";
import { CabeceraChat } from "./coach/CabeceraChat.jsx";
import { ListaMensajes } from "./coach/ListaMensajes.jsx";
import { BarraModoVoz } from "./coach/BarraModoVoz.jsx";
import { BarraInput } from "./coach/BarraInput.jsx";

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
      // Auth por JWT (auditoría 2026-08-02): el backend deriva el alumnoId del
      // token, no del body — cierra el IDOR donde cualquiera con un UUID podía
      // leer el diario/bioimpedancia de otro alumno. Se sigue mandando alumnoId
      // por compatibilidad con el web viejo durante el deploy escalonado.
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch("/web/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
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
  // Vive en ./coach/useModoVoz.js (mismas funciones, movidas textualmente); acá solo se
  // le pasan los refs/setters del padre y se reciben los handlers que usa el JSX.
  const { iniciarModoVoz, pausarVoz, reanudarVoz, terminarModoVoz } = useModoVoz({
    alumno, audioElRef, consultarCoach, cortarVoz, modoVozRef, recognitionRef, reintentoRef,
    setMensajes, setModoVoz, setVozEstado, soportaLectura, SR, ultimoAudioRef, vozEstadoRef,
  });

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
        <BotonFlotante
          BORDER={BORDER} CIRCULO={CIRCULO} LOGO={LOGO} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
          onPointerUp={onPointerUp} pos={pos}
        />
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
          <CabeceraChat
            BORDER={BORDER} CIRCULO={CIRCULO} GRAY={GRAY} iniciarModoVoz={iniciarModoVoz} leerVoz={leerVoz} LOGO={LOGO}
            modoVoz={modoVoz} RED={RED} setAbierto={setAbierto} setLeerVoz={setLeerVoz} soportaLectura={soportaLectura}
            soportaVoz={soportaVoz} terminarModoVoz={terminarModoVoz} TEXT={TEXT}
          />

          {/* Mensajes */}
          <ListaMensajes
            CARD2={CARD2} enviando={enviando} GRAY={GRAY} mensajes={mensajes} RED={RED} scrollRef={scrollRef}
            TEXT={TEXT}
          />

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
            <BarraModoVoz
              BG={BG} BORDER={BORDER} CARD2={CARD2} GRAY={GRAY} pausarVoz={pausarVoz} reanudarVoz={reanudarVoz} RED={RED}
              terminarModoVoz={terminarModoVoz} TEXT={TEXT} vozEstado={vozEstado}
            />
          ) : (
            <BarraInput
              BG={BG} BORDER={BORDER} CARD2={CARD2} enviando={enviando} enviar={enviar} escuchando={escuchando}
              input={input} inputRef={inputRef} onKeyDown={onKeyDown} RED={RED} setInput={setInput}
              soportaVoz={soportaVoz} TEXT={TEXT} toggleEscucha={toggleEscucha}
            />
          )}
        </div>
      )}

    </>
  );
});

export default CoachFlotante;
