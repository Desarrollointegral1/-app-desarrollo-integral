import { useState } from "react";
import { S, card } from "../utils/theme.js";
import { getYTId } from "../utils/helpers.js";
import MiniChart from "./MiniChart.jsx";

// Tarjeta de ejercicio colapsable: media + descripción + registro de peso.
// `pesoAnterior` ({peso, fecha}) muestra el último peso registrado en días
// anteriores, para comparar contra el peso de hoy.
export default function ItemCard({
  nombre,
  desc,
  video,
  mediaLocal,
  numero,
  peso,
  historial,
  onPesoChange,
  showPeso,
  semana,
  pesoSugerido,
  pesoAnterior,
  intensidad,
}) {
  peso = peso || 0;
  historial = historial || [];
  showPeso = showPeso || false;
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [tmp, setTmp] = useState("0");
  const [showChart, setShowChart] = useState(false);
  const ytId = getYTId(video);
  const renderMedia = () => {
    if (ytId)
      return (
        <div
          style={{
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 12,
            background: "#000",
            position: "relative",
            paddingTop: "56.25%",
          }}
        >
          <iframe
            src={"https://www.youtube.com/embed/" + ytId}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            frameBorder="0"
            allowFullScreen
            title={nombre}
          />
        </div>
      );
    if (video && video.includes("supabase.co"))
      return (
        <video controls style={{ width: "100%", borderRadius: 8, marginBottom: 12, maxHeight: 300 }}>
          <source src={video} type="video/mp4" />
          Tu navegador no soporta videos
        </video>
      );
    if (mediaLocal && mediaLocal.startsWith("data:video"))
      return (
        <video controls style={{ width: "100%", borderRadius: 8, marginBottom: 12, maxHeight: 220 }}>
          <source src={mediaLocal} />
        </video>
      );
    if (mediaLocal && mediaLocal.startsWith("data:image"))
      return (
        <img
          src={mediaLocal}
          alt={nombre}
          style={{ width: "100%", borderRadius: 8, marginBottom: 12, maxHeight: 280, objectFit: "cover" }}
        />
      );
    return (
      <div style={{ background: S.card2, borderRadius: 8, marginBottom: 12, padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 22, marginBottom: 4 }}>▶</div>
        <div style={{ color: S.lgray, fontSize: 12 }}>Video proximamente</div>
      </div>
    );
  };
  return (
    <div style={{ ...card, marginBottom: 8, overflow: "hidden" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      >
        <div
          style={{
            minWidth: 22,
            height: 22,
            borderRadius: "50%",
            background: S.card2,
            border: "1px solid #2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: S.gray,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {numero}
        </div>
        <div style={{ flex: 1, color: S.white, fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{nombre}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {showPeso && (
            <div style={{ textAlign: "right" }}>
              <div style={{ color: S.white, fontWeight: 900, fontSize: 14 }}>{peso > 0 ? peso + "kg" : "—"}</div>
              <div style={{ color: S.gray, fontSize: 9 }}>HOY</div>
            </div>
          )}
          <div style={{ color: S.gray }}>{open ? "▲" : "▼"}</div>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: "1px solid #2a2a2a", padding: 14 }}>
          {renderMedia()}
          {desc && (
            <div style={{ color: S.gray, fontSize: 13, lineHeight: 1.6, marginBottom: showPeso ? 12 : 0 }}>{desc}</div>
          )}
          {showPeso && (
            <div style={{ background: S.card2, borderRadius: 8, padding: 12, marginTop: 4 }}>
              {semana && (
                <div style={{ fontSize: 10, color: S.gray, marginBottom: 6 }}>
                  SEMANA {semana.semana} — {semana.series}x{semana.reps}
                  {semana.intensidad ? " al " + semana.intensidad : ""}
                </div>
              )}
              {pesoAnterior && (
                <div
                  style={{
                    background: S.card,
                    border: "1px solid #2a2a2a",
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ color: S.gray, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>PESO ANTERIOR</div>
                    <div style={{ color: S.lgray, fontSize: 10 }}>{pesoAnterior.fecha}</div>
                  </div>
                  <div style={{ color: S.white, fontWeight: 900, fontSize: 18 }}>{pesoAnterior.peso} kg</div>
                </div>
              )}
              {pesoSugerido && (
                <div
                  style={{
                    background: "#0d1f0d",
                    border: "1px solid #1a4d1a",
                    borderRadius: 8,
                    padding: "10px 12px",
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ color: S.green, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>
                      PESO SUGERIDO HOY
                    </div>
                    <div style={{ color: S.gray, fontSize: 10 }}>
                      {semana && semana.series}x{semana && semana.reps} al {intensidad}
                    </div>
                  </div>
                  <div style={{ color: S.green, fontWeight: 900, fontSize: 24 }}>{pesoSugerido} kg</div>
                </div>
              )}
              <div
                style={{ fontSize: 10, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}
              >
                Registrar peso de hoy
              </div>
              {edit ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="number"
                    value={tmp}
                    onChange={(e) => setTmp(e.target.value)}
                    style={{
                      flex: 1,
                      background: S.card,
                      border: "1px solid #2a2a2a",
                      borderRadius: 6,
                      padding: "8px 10px",
                      color: S.white,
                      fontSize: 16,
                      outline: "none",
                    }}
                  />
                  <span style={{ color: S.gray }}>kg</span>
                  <button
                    onClick={() => {
                      onPesoChange && onPesoChange(Number(tmp));
                      setEdit(false);
                    }}
                    style={{
                      background: S.white,
                      color: S.bg,
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 14px",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEdit(false)}
                    style={{
                      background: "transparent",
                      color: S.gray,
                      border: "1px solid #2a2a2a",
                      borderRadius: 6,
                      padding: "8px 10px",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}
                >
                  <span style={{ color: S.white, fontWeight: 700, fontSize: 18 }}>
                    {peso > 0 ? peso + " kg" : "Sin registrar"}
                  </span>
                  <button
                    onClick={() => {
                      setTmp(String(peso));
                      setEdit(true);
                    }}
                    style={{
                      background: "transparent",
                      color: S.white,
                      border: "1px solid #2a2a2a",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    ✎ EDITAR
                  </button>
                </div>
              )}
              {historial.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowChart(!showChart)}
                    style={{
                      background: "transparent",
                      color: S.gray,
                      border: "1px solid #2a2a2a",
                      borderRadius: 6,
                      padding: "5px 10px",
                      fontSize: 10,
                      cursor: "pointer",
                      marginTop: 8,
                    }}
                  >
                    {showChart ? "▲ OCULTAR" : "📈 PROGRESO"} ({historial.length})
                  </button>
                  {showChart && (
                    <div style={{ marginTop: 10 }}>
                      <MiniChart data={historial} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
