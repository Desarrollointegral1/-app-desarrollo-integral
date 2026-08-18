// Modo voz inmersivo (manos libres) del coach: hablar → escuchar → consultar → hablar.
// Funciones movidas textualmente desde CoachFlotante.jsx (refactor 2026-08-18) a un hook
// para achicar el padre: los refs, setters y `consultarCoach` siguen viviendo en CoachFlotante.jsx
// y entran por parámetro; las funciones se redefinen en cada render igual que antes.
import { elegirVozEs, prepararParaVoz } from "./helpers.jsx";

export function useModoVoz({
  alumno,
  audioElRef,
  consultarCoach,
  cortarVoz,
  modoVozRef,
  recognitionRef,
  reintentoRef,
  setMensajes,
  setModoVoz,
  setVozEstado,
  soportaLectura,
  SR,
  ultimoAudioRef,
  vozEstadoRef,
}) {
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

  return { iniciarModoVoz, pausarVoz, reanudarVoz, terminarModoVoz };
}
