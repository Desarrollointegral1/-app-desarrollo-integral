import { useState } from "react";
import { S, card } from "../utils/theme.js";
import { getYTId } from "../utils/helpers.js";
import { getEjercicioGif, MEDIA_CREDITO } from "../utils/ejerciciosMedia.js";

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
    // URL directa (Storage de Supabase u otra): puede ser FOTO o VIDEO.
    // preload="none" para no bajar el video entero al abrir la tarjeta.
    if (video && /^https?:/i.test(video)) {
      if (/\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(video))
        return (
          <img
            src={video}
            alt={nombre}
            style={{ width: "100%", borderRadius: 8, marginBottom: 12, maxHeight: 320, objectFit: "cover" }}
          />
        );
      return (
        <video controls preload="none" style={{ width: "100%", borderRadius: 8, marginBottom: 12, maxHeight: 300 }}>
          <source src={video} />
          Tu navegador no soporta videos
        </video>
      );
    }
    if (mediaLocal && mediaLocal.startsWith("data:video"))
      return (
        <video controls preload="none" style={{ width: "100%", borderRadius: 8, marginBottom: 12, maxHeight: 220 }}>
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
    const gif = getEjercicioGif(nombre);
    if (gif)
      return (
        <div style={{ background: "#fff", borderRadius: 8, marginBottom: 12, padding: "10px 0 4px", textAlign: "center" }}>
          <img
            src={gif}
            alt={nombre}
            style={{ width: 180, height: 180, objectFit: "contain" }}
          />
          <div style={{ color: "#999", fontSize: 8, paddingBottom: 4 }}>{MEDIA_CREDITO}</div>
        </div>
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
            border: "1px solid " + S.border,
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
            /* Peso de hoy SIEMPRE editable acá mismo, sin abrir la tarjeta */
            <div style={{ display: "flex", alignItems: "center", gap: 5 }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onPesoChange && onPesoChange(Math.max(0, peso - 1))}
                style={{ width: 28, height: 28, background: S.card2, color: S.white, border: "1px solid " + S.border, borderRadius: 7, fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0, padding: 0 }}
              >
                −
              </button>
              <div style={{ textAlign: "center" }}>
                <input
                  type="number"
                  value={peso || ""}
                  placeholder="0"
                  onChange={(e) => onPesoChange && onPesoChange(Math.max(0, Number(e.target.value) || 0))}
                  style={{ width: 44, textAlign: "center", background: S.card2, border: "1px solid " + S.border, borderRadius: 7, padding: "5px 2px", color: S.white, fontSize: 13, fontWeight: 900, outline: "none" }}
                />
                <div style={{ color: S.gray, fontSize: 8, letterSpacing: 1, marginTop: 1 }}>KG HOY</div>
              </div>
              <button
                onClick={() => onPesoChange && onPesoChange(peso + 1)}
                style={{ width: 28, height: 28, background: S.white, color: S.bg, border: "none", borderRadius: 7, fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0, padding: 0 }}
              >
                +
              </button>
            </div>
          )}
          <div style={{ color: S.gray }}>{open ? "▲" : "▼"}</div>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: "1px solid " + S.border, padding: 14 }}>
          {desc && (
            <div style={{ color: S.gray, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{desc}</div>
          )}
          {renderMedia()}
          {showPeso && (
            <div style={{ background: S.card2, borderRadius: 8, padding: 12, marginTop: 4 }}>
              {pesoAnterior && (
                <div
                  style={{
                    background: S.card,
                    border: "1px solid " + S.border,
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
              {/* Ronda 7: sin título "Registro de peso", sin "Sin registrar",
                  sin gráfico. Solo: último registro arriba → título centrado
                  → stepper compacto centrado. El peso se guarda solo al
                  cambiarlo (no hace falta botón de guardar). */}
              <div
                style={{
                  textAlign: "center",
                  color: S.white,
                  fontWeight: 900,
                  fontSize: 12,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Registrá tu peso de hoy
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
                <button
                  onClick={() => onPesoChange && onPesoChange(Math.max(0, peso - 1))}
                  style={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    background: S.card,
                    color: S.white,
                    border: "1px solid " + S.border,
                    borderRadius: 8,
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  value={peso || ""}
                  placeholder="0"
                  onChange={(e) => onPesoChange && onPesoChange(Math.max(0, Number(e.target.value) || 0))}
                  style={{
                    width: 72,
                    textAlign: "center",
                    background: S.card,
                    border: "1px solid " + S.border,
                    borderRadius: 8,
                    padding: "9px 6px",
                    color: S.white,
                    fontSize: 16,
                    fontWeight: 700,
                    outline: "none",
                  }}
                />
                <span style={{ color: S.gray, fontSize: 13, flexShrink: 0 }}>kg</span>
                <button
                  onClick={() => onPesoChange && onPesoChange(peso + 1)}
                  style={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    background: S.white,
                    color: S.bg,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
