import { useState } from "react";
import { subirVideo } from "../../services/supabase.js";
import { S, inp } from "../utils/theme.js";

// ── VIDEO UPLOAD BUTTON ───────────────────────────────────────────────
export function VideoUploadButton({ onVideoUrl }) {
  const [cargando, setCargando] = useState(false);
  const [err, setErr] = useState("");

  const handleFileSelect = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith("video/")) {
      setErr("Solo se aceptan videos");
      return;
    }

    setCargando(true);
    setErr("");

    try {
      const url = await subirVideo(archivo);
      onVideoUrl(url);
      setErr("");
    } catch (error) {
      setErr(error.message || "Error al subir video");
    } finally {
      setCargando(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          disabled={cargando}
          style={{
            position: "absolute",
            opacity: 0,
            width: "100%",
            height: "100%",
            cursor: cargando ? "not-allowed" : "pointer",
          }}
        />
        <button
          disabled={cargando}
          style={{
            ...inp,
            display: "block",
            cursor: cargando ? "not-allowed" : "pointer",
            opacity: cargando ? 0.6 : 1,
            background: cargando ? S.lgray : S.card2,
            color: S.white,
          }}
        >
          {cargando ? "Subiendo..." : "Seleccionar video"}
        </button>
      </div>
      {err && <div style={{ color: S.red, fontSize: 12, marginBottom: 8 }}>{err}</div>}
    </div>
  );
}
