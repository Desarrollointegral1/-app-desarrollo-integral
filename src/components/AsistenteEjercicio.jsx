// ============================================================
// ARMADOR DE EJERCICIOS ASISTIDO — interfaz (2026-08-09)
// ============================================================
// El backend (api/ejercicio-asistido.js) ya sugiere nombres, redacta la
// descripción en el tono del catálogo y genera la ilustración. Esto es la
// parte que toca el profe.
//
// Por qué es un bloque chico y progresivo, y no un formulario con todo a la
// vista (pedido textual de Lucas): "que no quede algo enorme, para poner el
// video, que sea un casillero y para marcar, crear imagen o subir video y
// dependiendo del que elija se despliega la opción". Los dos chips de media
// arrancan APAGADOS: si no elige ninguno, no se muestra nada más.
//
// Por qué vive acá y no dentro de App.jsx: App.jsx ya pasa las 4.000 líneas y
// esto necesita mockearse en dev/harness.jsx (que no tiene sesión). Las dos
// dependencias que tocan red — `llamar` y `subirArchivo` — entran por props
// con el default real, así el banco de pruebas las reemplaza sin stubear fetch.
import { useState, useRef } from "react";
import { supabase, subirMediaRehab } from "../../services/supabase.js";
import { S, innerCard, TS, TAP } from "../utils/theme.js";

// Sesión caída: el mismo texto en los dos lugares donde puede pasar (antes de
// salir y cuando el servidor devuelve 401), para que el profe lea siempre lo
// mismo y sepa qué hacer.
const SIN_SESION = "Se cayó la sesión. Salí y volvé a entrar a la app para seguir usando el armador.";

/**
 * Una llamada a /api/ejercicio-asistido con el token de Supabase, como lo hace
 * src/components/ScanCorporal.jsx. Siempre tira Error con un texto que se le
 * puede mostrar al profe tal cual — nunca un error mudo.
 */
export async function llamarAsistente(body) {
  const { data: { session } = {} } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error(SIN_SESION);

  let r;
  let data = {};
  try {
    r = await fetch("/api/ejercicio-asistido", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    data = await r.json().catch(() => ({}));
  } catch {
    throw new Error("No se pudo conectar con el servidor. Probá de nuevo.");
  }
  if (!r.ok) {
    if (r.status === 401) throw new Error(SIN_SESION);
    // El 501 ya viene con el texto largo que explica que falta cargar
    // GEMINI_API_KEY en Vercel: se muestra ese, no uno inventado acá.
    throw new Error(data?.error || `El servidor respondió ${r.status}.`);
  }
  return data;
}

const chipMedia = (activo) => ({
  flex: 1,
  minHeight: TAP,
  background: activo ? S.white : S.card3,
  color: activo ? S.bg : S.gray,
  border: "1px solid " + (activo ? S.white : S.border2),
  borderRadius: 8,
  padding: "10px 8px",
  fontSize: TS.chip,
  fontWeight: 700,
  cursor: "pointer",
});

const botonChico = (deshabilitado) => ({
  minHeight: TAP,
  background: S.card3,
  color: S.white,
  border: "1px solid " + S.border2,
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: TS.chip,
  fontWeight: 700,
  cursor: deshabilitado ? "default" : "pointer",
  opacity: deshabilitado ? 0.6 : 1,
});

/**
 * Bloque asistido del editor de ejercicios. No reemplaza al buscador: se usa
 * cuando el ejercicio NO existe y hay que escribirlo desde cero.
 *
 * form/setForm son los del EjercicioEditor — escribe `desc`, `grupo_di`,
 * `gif` (imagen generada) y `video` (video subido).
 */
export default function AsistenteEjercicio({ form, setForm, llamar = llamarAsistente, subirArchivo = subirMediaRehab }) {
  const [completando, setCompletando] = useState(false);
  const [modoMedia, setModoMedia] = useState(null); // null | "imagen" | "video"
  const [generando, setGenerando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  // El prompt de la ilustración no va al ítem del plan: sólo sirve para pedir
  // la imagen, guardarlo en la base sería basura en el JSON del alumno.
  const [promptImagen, setPromptImagen] = useState("");
  const archivoRef = useRef(null);

  const nombre = (form.nombre || "").trim();

  const completar = async () => {
    if (!nombre) { setError("Escribí primero el nombre del ejercicio."); return; }
    setError("");
    setCompletando(true);
    try {
      const ficha = await llamar({ accion: "completar", nombre });
      setPromptImagen(ficha.prompt_imagen || "");
      // El texto queda EDITABLE en el textarea de siempre: esto rellena, no guarda.
      setForm((f) => ({ ...f, desc: ficha.descripcion || f.desc, grupo_di: ficha.grupo_di || f.grupo_di }));
      return ficha;
    } catch (e) {
      setError(e.message || "No se pudo escribir la descripción.");
      return null;
    } finally {
      setCompletando(false);
    }
  };

  const generarImagen = async () => {
    if (!nombre) { setError("Escribí primero el nombre del ejercicio."); return; }
    setError("");
    let prompt = promptImagen;
    // Sin prompt no hay imagen, y el prompt lo devuelve `completar`. En vez de
    // dejar el botón muerto con un cartel, se completa solo y se sigue.
    if (!prompt) {
      const ficha = await completar();
      if (!ficha) return;
      prompt = ficha.prompt_imagen || "";
      if (!prompt) { setError("El modelo no devolvió con qué dibujar la imagen. Probá de nuevo."); return; }
    }
    setGenerando(true);
    try {
      const { url } = await llamar({ accion: "imagen", prompt_imagen: prompt });
      setForm((f) => ({ ...f, gif: url }));
    } catch (e) {
      setError(e.message || "No se pudo generar la imagen.");
    } finally {
      setGenerando(false);
    }
  };

  const subirVideo = async (file) => {
    if (!file) return;
    // Mismo tope que la subida de rehab: arriba de 50MB Supabase Storage
    // rechaza el archivo y el profe se come una espera larga para nada.
    if (file.size > 50 * 1024 * 1024) {
      setError("El video pesa más de 50MB. Grabá un clip más corto (10-20 segundos alcanza).");
      return;
    }
    setError("");
    setSubiendo(true);
    try {
      const url = await subirArchivo(file);
      setForm((f) => ({ ...f, video: url }));
    } catch (e) {
      setError(e.message || "No se pudo subir el video.");
    } finally {
      setSubiendo(false);
    }
  };

  const elegirModo = (modo) => { setError(""); setModoMedia((m) => (m === modo ? null : modo)); };

  return (
    <div style={{ ...innerCard, padding: 10, marginBottom: 8 }} data-asistente-ejercicio>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <button onClick={completar} disabled={completando} style={botonChico(completando)}>
          {completando ? "Escribiendo…" : "Escribila por mí"}
        </button>
        {form.grupo_di && (
          <span style={{ color: S.gray, fontSize: TS.chip, border: "1px solid " + S.border2, borderRadius: 6, padding: "4px 8px" }}>
            {form.grupo_di}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => elegirModo("imagen")} aria-pressed={modoMedia === "imagen"} style={chipMedia(modoMedia === "imagen")}>
          Crear imagen
        </button>
        <button onClick={() => elegirModo("video")} aria-pressed={modoMedia === "video"} style={chipMedia(modoMedia === "video")}>
          Subir video
        </button>
      </div>

      {modoMedia === "imagen" && (
        <div style={{ marginTop: 8 }} data-panel-imagen>
          {form.gif && (
            <img
              src={form.gif}
              alt={"Ilustración de " + (nombre || "el ejercicio")}
              style={{ width: "100%", maxWidth: 260, display: "block", margin: "0 auto 8px", background: "#fff", borderRadius: 8 }}
            />
          )}
          <button onClick={generarImagen} disabled={generando || completando} style={{ ...botonChico(generando || completando), width: "100%" }}>
            {generando ? "Generando…" : form.gif ? "Generar otra" : "Generar"}
          </button>
        </div>
      )}

      {modoMedia === "video" && (
        <div style={{ marginTop: 8 }} data-panel-video>
          {form.video && (
            <div style={{ color: S.gray, fontSize: TS.chip, marginBottom: 6, wordBreak: "break-all" }}>Video cargado: {form.video}</div>
          )}
          <button onClick={() => !subiendo && archivoRef.current?.click()} disabled={subiendo} style={{ ...botonChico(subiendo), width: "100%" }}>
            {subiendo ? "Subiendo…" : form.video ? "Cambiar el video" : "Elegir video"}
          </button>
          <input
            ref={archivoRef}
            type="file"
            accept="video/*"
            style={{ display: "none" }}
            onChange={(e) => { subirVideo(e.target.files?.[0]); e.target.value = ""; }}
          />
          <div style={{ color: S.lgray, fontSize: TS.chip, marginTop: 6 }}>Hasta 50MB. Con 10-20 segundos alcanza.</div>
        </div>
      )}

      {error && (
        <div role="alert" style={{ color: S.red, fontSize: TS.chip, marginTop: 8, lineHeight: 1.4 }}>{error}</div>
      )}
    </div>
  );
}
