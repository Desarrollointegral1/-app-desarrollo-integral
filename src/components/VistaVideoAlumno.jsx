import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { FONT_BODY, DARK_T } from "../utils/theme.js";
import { useSignedUrl } from "../utils/useSignedUrl.js";

// ══════════════════════════════════════════════════════════════════════
// VISTA "SOLO VIDEO" — 2026-08-09, rehecha en oscuro el 2026-08-13
// Pedido de Lucas: alumnos presenciales, sobre todo ADULTOS MAYORES, que
// entran a la app únicamente a ver el video de movilidad que él les grabó
// en la casa. No hay menú, ni pestañas, ni pasos: entran y el video está.
//
// 2026-08-13 — POR QUÉ SE FUE EL FONDO BLANCO. La versión del 09/08 iba en
// blanco puro buscando legibilidad para adultos mayores. Lucas la probó con
// Ángel y el veredicto fue "quedó horrible": rompía con toda la app, que es
// oscura, y encima una pantalla blanca entera a 100% de brillo encandila
// más de lo que ayuda. Lo que SÍ estaba bien medido se conserva entero y no
// se toca: piso de 20px de texto, saludo de 30px, el control grande arriba
// de 44x44 y contraste real. Los colores ahora salen de DARK_T (el tema de
// la app) y se midieron contra el fondo, no se estimaron:
//   · texto principal #f2f2f2 sobre #0d0d0d → 17,3:1
//   · texto secundario #9a9a9a sobre #0d0d0d → 6,9:1 (y 6,6:1 sobre #131313)
//   · botón: #0d0d0d sobre #f2f2f2 → 17,3:1
// Esta pantalla NO usa los tokens de tamaño TS de theme.js: esa escala
// (piso 15-16px) está calibrada para Lucas y sus alumnos jóvenes. Acá el
// piso es 20px y el saludo 30px, por eso los números van literales.
//
// 2026-08-13 — POR QUÉ CAMBIÓ EL MANEJO DE ERRORES. Antes, CUALQUIER
// tropiezo mataba el reproductor: `onError` y el `.catch()` del play()
// ponían fallo=true, y eso desmonta el <video> y lo reemplaza por "No se
// pudo abrir el video". Un bache de señal a mitad de la carga, o tocar dos
// veces seguidas el botón grande (que hace pause() antes de que resuelva el
// play() y devuelve un AbortError perfectamente inofensivo), dejaban al
// alumno sin video y obligaban a bajar todo el archivo de nuevo desde cero.
// Ahora solo se considera falla lo que el navegador marca como falla real
// (v.error), y un play() rechazado no rompe nada.
//
// 2026-08-13 — POR QUÉ HAY BARRA DE CARGA. El video de Ángel pesaba 37,5 MB
// (3:23 a 1,47 Mbps): con datos móviles son varios segundos de recuadro
// negro y mudo, que a esta gente le parece que la app se colgó. Se muestra
// cuánto lleva cargado, en número y en barra. El archivo además se
// recomprimió a 8,7 MB y la app ahora avisa al subir cuando un video va a
// dar problemas (ver App.jsx, ficha del alumno).
//
// Reglas que se respetan a propósito y no hay que "optimizar" después:
//  · Un solo control grande (72px de alto) además de los controles nativos
//    del <video>, que son los que ya conocen del celular.
//  · Sin gestos: nada de swipe, arrastrar ni doble toque. Solo tocar.
//  · Nada tocable de más: el único botón que saca de la pantalla es Salir,
//    abajo del todo, angosto y separado 44px del resto.
//  · Si el video no está o falla, se explica en castellano llano — nunca
//    una pantalla vacía ni un error técnico.
// ══════════════════════════════════════════════════════════════════════

const FONDO = DARK_T.bg;       // #0d0d0d
const PLACA = DARK_T.card;     // #131313
const PISTA = DARK_T.card3;    // #262626 — track de la barra de carga
const TINTA = DARK_T.white;    // #f2f2f2 — 17,3:1 sobre el fondo
const TINTA2 = DARK_T.gray;    // #9a9a9a — 6,9:1 sobre el fondo
const BORDE = DARK_T.border2;  // #343434

const base = { fontFamily: FONT_BODY, color: TINTA };
const aviso = {
  ...base,
  fontSize: 21,
  lineHeight: 1.55,
  margin: "12px 0 0",
  background: PLACA,
  border: "1px solid " + BORDE,
  borderRadius: 14,
  padding: "22px 20px",
};

export default function VistaVideoAlumno({ nombre, video, onSalir }) {
  const url = useSignedUrl("rehab-media", video);
  const ref = useRef(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [fallo, setFallo] = useState(false);
  // null = todavía no se sabe cuánto pesa; 0..100 = cargado de verdad.
  const [cargado, setCargado] = useState(null);
  const [listo, setListo] = useState(false);
  // Cambiar la key remonta el <video> y vuelve a pedir el archivo: es el
  // "probar de nuevo" cuando la conexión se cortó a mitad de la carga.
  const [intento, setIntento] = useState(0);

  const primerNombre = String(nombre || "").trim().split(" ")[0] || "";

  const alternar = () => {
    const v = ref.current;
    if (!v) return;
    // El play() puede rechazar por motivos que NO son una falla del video
    // (el más común: se tocó pausa antes de que arrancara). Se ignora a
    // propósito — romper el reproductor por esto fue el bug del 12/08.
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  // buffered.end() puede tirar si el rango todavía no existe: va con guarda.
  const mirarCarga = () => {
    const v = ref.current;
    if (!v || !v.duration || !isFinite(v.duration) || !v.buffered.length) return;
    try {
      setCargado(Math.min(100, Math.round((v.buffered.end(v.buffered.length - 1) / v.duration) * 100)));
    } catch { /* rango todavía inexistente */ }
  };

  return (
    <div
      data-vista-video
      style={{
        ...base,
        minHeight: "100vh",
        background: FONDO,
        padding: "28px 20px 40px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ ...base, fontSize: 30, lineHeight: 1.2, fontWeight: 800, margin: "0 0 10px" }}>
          Hola{primerNombre ? `, ${primerNombre}` : ""}
        </h1>
        {/* Solo cuando hay video: si no, "esta es tu rutina" arriba del aviso
            de que todavía no hay nada se contradice y confunde. */}
        {video && (
          <p style={{ ...base, color: TINTA2, fontSize: 21, lineHeight: 1.5, margin: "0 0 22px" }}>
            Esta es tu rutina de movilidad.
          </p>
        )}

        {!video ? (
          <p style={aviso}>
            Todavía no tenés el video acá. Lucas lo va a subir apenas lo grabe.
            Entrá de nuevo más adelante.
          </p>
        ) : !url ? (
          /* El video vive en un bucket privado: hay un instante donde se está
             pidiendo la signed URL. Sin este aviso queda un recuadro negro
             mudo, que a esta gente le parece que la app se rompió. */
          <p style={aviso}>Un momento, estamos abriendo tu video.</p>
        ) : fallo ? (
          <div style={{ background: PLACA, border: "1px solid " + BORDE, borderRadius: 14, padding: "22px 20px" }}>
            <p style={{ ...base, fontSize: 21, lineHeight: 1.55, margin: "0 0 18px" }}>
              No se pudo abrir el video. Fijate que tengas internet y tocá el botón
              de abajo.
            </p>
            <button
              onClick={() => { setFallo(false); setCargado(null); setListo(false); setIntento((n) => n + 1); }}
              style={{
                ...base, width: "100%", minHeight: 72, background: TINTA, color: FONDO,
                border: "none", borderRadius: 14, fontSize: 22, fontWeight: 800, cursor: "pointer",
              }}
            >
              Probar de nuevo
            </button>
          </div>
        ) : (
          <>
            <video
              key={intento}
              ref={ref}
              src={url || undefined}
              controls
              playsInline
              preload="metadata"
              controlsList="nodownload"
              onPlay={() => setReproduciendo(true)}
              onPause={() => setReproduciendo(false)}
              onProgress={mirarCarga}
              onLoadedMetadata={mirarCarga}
              onCanPlay={() => setListo(true)}
              // Solo es falla si el navegador dejó un error de verdad
              // colgado en el elemento: los `error` sin `v.error` son ruido
              // (un rango que se canceló, un seek abortado) y antes se
              // llevaban puesto el reproductor entero.
              onError={() => { if (ref.current?.error) setFallo(true); }}
              style={{
                width: "100%", display: "block", background: "#000",
                borderRadius: 14, border: "1px solid " + BORDE, boxSizing: "border-box",
              }}
            />

            {/* Mientras no se puede reproducir todavía, se dice cuánto va
                cargado. 37 MB por datos móviles tardan, y sin esto el
                recuadro negro parece una app colgada. */}
            {!listo && (
              <div data-cargando style={{ marginTop: 14 }}>
                <p style={{ ...base, color: TINTA2, fontSize: 20, margin: "0 0 8px" }}>
                  {cargado == null ? "Cargando el video…" : `Cargando el video… ${cargado}%`}
                </p>
                <div style={{ height: 8, borderRadius: 4, background: PISTA, overflow: "hidden" }}>
                  {/* scaleX y no width: animar el ancho hace relayout en cada
                      evento `progress`, y esto corre mientras el celular ya
                      está ocupado bajando el video. */}
                  <div
                    style={{
                      height: "100%", width: "100%", borderRadius: 4, background: TINTA,
                      transformOrigin: "left center",
                      transform: `scaleX(${(cargado == null ? 4 : Math.max(4, cargado)) / 100})`,
                      transition: "transform 0.3s linear",
                    }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={alternar}
              aria-label={reproduciendo ? "Pausar el video" : "Reproducir el video"}
              style={{
                ...base,
                width: "100%", minHeight: 72, marginTop: 14,
                background: TINTA, color: FONDO, border: "none", borderRadius: 14,
                fontSize: 22, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              {reproduciendo ? <Pause size={26} /> : <Play size={26} />}
              {reproduciendo ? "Pausar" : "Reproducir"}
            </button>
          </>
        )}

        {/* Separado 44px de todo lo demás: es lo único que saca de la
            pantalla y no se puede tocar por error yendo al video. */}
        <div style={{ marginTop: 44, textAlign: "center" }}>
          <button
            onClick={onSalir}
            style={{
              ...base, color: TINTA2, background: "transparent",
              border: "1px solid " + BORDE, borderRadius: 10,
              minHeight: 44, padding: "10px 26px", fontSize: 20, cursor: "pointer",
            }}
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
