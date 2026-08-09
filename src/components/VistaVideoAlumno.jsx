import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { FONT_BODY } from "../utils/theme.js";
import { useSignedUrl } from "../utils/useSignedUrl.js";

// ══════════════════════════════════════════════════════════════════════
// VISTA "SOLO VIDEO" — 2026-08-09
// Pedido de Lucas: alumnos presenciales, sobre todo ADULTOS MAYORES, que
// entran a la app únicamente a ver el video de movilidad que él les grabó
// en la casa. No hay menú, ni pestañas, ni pasos: entran y el video está.
//
// Por qué esta pantalla NO usa los tokens de tamaño de theme.js (TS/S):
// esa escala está calibrada para Lucas y sus alumnos jóvenes (piso 15-16px,
// gris sobre gris). Acá el piso es 20px, el saludo 30px y el contraste es
// negro sobre blanco puro — por eso los colores van literales y no por
// tema: esta gente nunca ve el toggle de dark mode, y un gris claro sobre
// gris oscuro directamente no se lee.
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

const BLANCO = "#ffffff";
const TINTA = "#101010";   // 19.8:1 sobre blanco
const TINTA2 = "#3d3d3d";  //  9.9:1 sobre blanco
const BORDE = "#c9c9c9";

const base = { fontFamily: FONT_BODY, color: TINTA };

export default function VistaVideoAlumno({ nombre, video, onSalir }) {
  const url = useSignedUrl("rehab-media", video);
  const ref = useRef(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [fallo, setFallo] = useState(false);
  // Cambiar la key remonta el <video> y vuelve a pedir el archivo: es el
  // "probar de nuevo" cuando la conexión se cortó a mitad de la carga.
  const [intento, setIntento] = useState(0);

  const primerNombre = String(nombre || "").trim().split(" ")[0] || "";

  const alternar = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => setFallo(true));
    else v.pause();
  };

  return (
    <div
      data-vista-video
      style={{
        ...base,
        minHeight: "100vh",
        background: BLANCO,
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
          <p
            style={{
              ...base,
              fontSize: 21,
              lineHeight: 1.55,
              margin: "12px 0 0",
              border: "2px solid " + BORDE,
              borderRadius: 14,
              padding: "22px 20px",
            }}
          >
            Todavía no tenés el video acá. Lucas lo va a subir apenas lo grabe.
            Entrá de nuevo más adelante.
          </p>
        ) : !url ? (
          /* El video vive en un bucket privado: hay un instante donde se está
             pidiendo la signed URL. Sin este aviso queda un recuadro negro
             mudo, que a esta gente le parece que la app se rompió. */
          <p style={{ ...base, fontSize: 21, lineHeight: 1.55, margin: "12px 0 0", border: "2px solid " + BORDE, borderRadius: 14, padding: "22px 20px" }}>
            Un momento, estamos abriendo tu video.
          </p>
        ) : fallo ? (
          <div style={{ border: "2px solid " + BORDE, borderRadius: 14, padding: "22px 20px" }}>
            <p style={{ ...base, fontSize: 21, lineHeight: 1.55, margin: "0 0 18px" }}>
              No se pudo abrir el video. Fijate que tengas internet y tocá el botón
              de abajo.
            </p>
            <button
              onClick={() => { setFallo(false); setIntento((n) => n + 1); }}
              style={{
                ...base, width: "100%", minHeight: 72, background: TINTA, color: BLANCO,
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
              onError={() => setFallo(true)}
              style={{
                width: "100%", display: "block", background: "#000",
                borderRadius: 14, border: "2px solid " + BORDE, boxSizing: "border-box",
              }}
            />
            <button
              onClick={alternar}
              aria-label={reproduciendo ? "Pausar el video" : "Reproducir el video"}
              style={{
                ...base,
                width: "100%", minHeight: 72, marginTop: 14,
                background: TINTA, color: BLANCO, border: "none", borderRadius: 14,
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
