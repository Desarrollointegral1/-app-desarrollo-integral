import { useState, useEffect } from "react";
import { S, card, inp } from "../utils/theme.js";
import { getYTId } from "../utils/helpers.js";
import { getAppConfig, setAppConfig } from "../../services/supabase.js";

// Admin → Plan → Movilidad: videos de la rutina completa (corta / completa).
// Son GLOBALES: se guardan una vez en app_config y los ven todos los alumnos
// al final de la sección Movilidad. Acepta links de YouTube (recomendado para
// videos largos: subirlo como "oculto/no listado" y pegar el link acá).
export default function VideosMovilidadAdmin({ showToast }) {
  const [videos, setVideos] = useState({ corta: { url: "", duracion: "" }, larga: { url: "", duracion: "" } });
  const [guardando, setGuardando] = useState(false);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    getAppConfig("videos_movilidad").then((v) => {
      if (v) setVideos({ corta: v.corta || { url: "", duracion: "" }, larga: v.larga || v.avanzada || { url: "", duracion: "" } });
      setCargado(true);
    });
  }, []);

  const set = (key, campo) => (e) =>
    setVideos((prev) => ({ ...prev, [key]: { ...prev[key], [campo]: e.target.value } }));

  const guardar = async () => {
    setGuardando(true);
    const ok = await setAppConfig("videos_movilidad", videos);
    setGuardando(false);
    showToast && showToast(ok ? "Videos guardados para todos los alumnos ✓" : "No se pudo guardar — ¿corriste la migración 007?");
  };

  return (
    <div style={{ ...card, padding: "14px 16px", marginTop: 12 }}>
      <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 4, letterSpacing: 1 }}>
        Videos — Rutina completa (todos los alumnos)
      </div>
      <div style={{ fontSize: 11, color: S.lgray, marginBottom: 12, lineHeight: 1.5 }}>
        Pegá el link de YouTube (subilo como "oculto") o una URL de video directa. Se muestran al final de Movilidad.
      </div>
      {!cargado ? (
        <div style={{ color: S.gray, fontSize: 12 }}>Cargando...</div>
      ) : (
        <>
          {[
            { label: "Corta", key: "corta", defaultDur: "8 min" },
            { label: "Completa (larga)", key: "larga", defaultDur: "15+ min" },
          ].map(({ label, key, defaultDur }) => {
            const mv = videos[key];
            const ytId = mv.url ? getYTId(mv.url) : null;
            return (
              <div key={key} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: S.gray, marginBottom: 6 }}>{label}</div>
                <input
                  placeholder={`URL del video (${label.toLowerCase()})`}
                  value={mv.url || ""}
                  onChange={set(key, "url")}
                  style={{ ...inp, marginBottom: 4 }}
                />
                <input
                  placeholder={`Duración (ej: ${defaultDur})`}
                  value={mv.duracion || ""}
                  onChange={set(key, "duracion")}
                  style={{ ...inp, marginBottom: mv.url ? 8 : 0 }}
                />
                {ytId && (
                  <div style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "16/9" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      style={{ width: "100%", height: "100%", border: "none" }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`Video movilidad ${label}`}
                    />
                  </div>
                )}
                {mv.url && !ytId && (
                  <video controls style={{ width: "100%", borderRadius: 8, marginTop: 4, maxHeight: 200 }}>
                    <source src={mv.url} />
                  </video>
                )}
              </div>
            );
          })}
          <button
            onClick={guardar}
            disabled={guardando}
            style={{
              width: "100%",
              background: guardando ? S.card2 : S.white,
              color: guardando ? S.gray : S.bg,
              border: "none",
              borderRadius: 8,
              padding: 11,
              fontSize: 12,
              fontWeight: 700,
              cursor: guardando ? "default" : "pointer",
              letterSpacing: 0.5,
            }}
          >
            {guardando ? "GUARDANDO..." : "GUARDAR VIDEOS"}
          </button>
        </>
      )}
    </div>
  );
}
