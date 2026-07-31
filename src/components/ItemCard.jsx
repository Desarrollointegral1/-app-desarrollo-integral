import { useState } from "react";
import { Play } from "lucide-react";
import { S, card, TS, TAP, stepperTrack, stepperBtn, stepperDivider, stepperValue } from "../utils/theme.js";
import { getYTId } from "../utils/helpers.js";
import { getEjercicioGif } from "../utils/ejerciciosMedia.js";
import { useSignedUrl } from "../utils/useSignedUrl.js";

// Tarjeta de ejercicio colapsable: media + descripción + registro de peso.
// `pesoAnterior` ({peso, fecha}) muestra el último peso registrado en días
// anteriores, para comparar contra el peso de hoy.
export default function ItemCard({
  nombre,
  desc,
  video,
  mediaLocal,
  gif,
  numero,
  peso,
  historial,
  onPesoChange,
  showPeso,
  semana,
  pesoSugerido,
  pesoAnterior,
  intensidad,
  unidad,
}) {
  peso = peso || 0;
  historial = historial || [];
  showPeso = showPeso || false;
  // Taxonomía 2026-07-21: la Plancha se mide SIEMPRE en segundos, no en
  // repeticiones ni kilos. unidad viene del plan/biblioteca; el chequeo por
  // nombre es la red de seguridad para planes viejos sin el campo.
  const enSegundos = unidad === "segundos" || /^plancha\b/i.test((nombre || "").trim());
  const [open, setOpen] = useState(false);
  const ytId = getYTId(video);
  // `video` puede ser un path de rehab-media (bucket privado): se resuelve a
  // signed URL. Si ya es http/data/YouTube, el hook lo devuelve tal cual.
  const resolvedVideo = useSignedUrl("rehab-media", ytId ? null : video);
  const mediaPendiente = video && !ytId && !/^(https?:|data:)/i.test(video) && !resolvedVideo;
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
    // Path de rehab-media aún resolviéndose a signed URL: mostrar loading.
    if (mediaPendiente)
      return (
        <div style={{ background: S.card2, borderRadius: 8, marginBottom: 12, padding: 16, textAlign: "center", color: S.gray, fontSize: 15 }}>
          Cargando media…
        </div>
      );
    // URL directa (signed URL de Storage u otra): puede ser FOTO o VIDEO.
    // preload="none" para no bajar el video entero al abrir la tarjeta.
    if (resolvedVideo && /^https?:/i.test(resolvedVideo)) {
      if (/\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(resolvedVideo))
        return (
          <img
            src={resolvedVideo}
            alt={nombre}
            style={{ width: "100%", borderRadius: 8, marginBottom: 12, maxHeight: 320, objectFit: "cover" }}
          />
        );
      return (
        <video controls preload="none" style={{ width: "100%", borderRadius: 8, marginBottom: 12, maxHeight: 300 }}>
          <source src={resolvedVideo} />
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
    // Ronda 12: GIF manual (asignado a mano en el editor cuando el lookup
    // automático por nombre no encuentra match) tiene prioridad sobre el
    // automático — mismo componente para Preparación y Principales.
    const gifResuelto = gif || getEjercicioGif(nombre);
    if (gifResuelto)
      return (
        <div style={{ background: "#fff", borderRadius: 8, marginBottom: 12, padding: "10px 0 4px", textAlign: "center" }}>
          {/* Ronda 18: loading lazy — el GIF solo se baja al abrir la
              tarjeta y entrar en viewport (además el SW lo cachea). */}
          <img
            src={gifResuelto}
            alt={nombre}
            loading="lazy"
            style={{ width: 180, height: 180, objectFit: "contain" }}
          />
        </div>
      );
    return (
      <div style={{ background: S.card2, borderRadius: 8, marginBottom: 12, padding: 16, textAlign: "center" }}>
        <div style={{ marginBottom: 4, display: "flex", justifyContent: "center" }}><Play size={22} color={S.gray} strokeWidth={2} /></div>
        <div style={{ color: S.lgray, fontSize: 15 }}>Video proximamente</div>
      </div>
    );
  };
  // 2026-07-31 — Lucas: "esa barra de máximo abajo del gif quedó horrible,
  // sacala, dejemos solo arriba". Se saca del detalle expandido y se suma acá
  // como texto chico, junto al stepper que ya se ve sin abrir la tarjeta.
  const maxHistorico = historial.length > 0 ? Math.max(...historial.map((h) => Number(h.peso) || 0)) : 0;
  return (
    <div style={{ ...card, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "12px 14px", cursor: "pointer" }}>
        {/* 2026-07-31 — Lucas: la fila de arriba quedaba fea y apretaba el
            nombre del ejercicio contra el stepper (bug real: el <input> del
            stepper no tenía width fijo y tomaba ~220px del navegador,
            arrinconando nombres largos a una palabra por línea — ya
            corregido en theme.js). Además de eso, separar nombre y stepper
            en dos filas evita volver a apretar nada aunque el nombre sea
            largo. */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              // El círculo crece con el número: a 22px el dígito a 15px no
              // entraba (la escala nueva subió el piso de 10 a 15).
              minWidth: 26,
              height: 26,
              borderRadius: "50%",
              background: S.card2,
              border: "1px solid " + S.border,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              color: S.gray,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {numero}
          </div>
          <div style={{ flex: 1, color: S.white, fontSize: TS.ui, fontWeight: 600, lineHeight: 1.3 }}>{nombre}</div>
          <div style={{ color: S.gray, flexShrink: 0 }}>{open ? "▲" : "▼"}</div>
        </div>
        {showPeso && (
          /* Peso de hoy SIEMPRE editable acá mismo, sin abrir la tarjeta.
             Auditoría 2026-07-30: los +/- medían 28x28 reales. Es el botón
             que el alumno toca en medio de la serie, de pie y transpirado
             — pasa al piso táctil de 44x44 (iOS HIG / WCAG 2.5.5). */
          <div
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10, paddingLeft: 36 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: S.gray, fontSize: 15 }}>
              {enSegundos ? "SEG HOY" : "KG HOY"}
              {maxHistorico > 0 && <span style={{ marginLeft: 8 }}>· Máx {maxHistorico}{enSegundos ? "seg" : "kg"}</span>}
            </div>
            <div style={stepperTrack()}>
              <button
                onClick={() => onPesoChange && onPesoChange(Math.max(0, peso - 1))}
                aria-label="Restar un kilo"
                style={stepperBtn()}
              >
                −
              </button>
              <div style={stepperDivider()} />
              <input
                type="number"
                inputMode="decimal"
                value={peso || ""}
                placeholder="0"
                onChange={(e) => onPesoChange && onPesoChange(Math.max(0, Number(e.target.value) || 0))}
                style={{ ...stepperValue(), minWidth: 44, height: TAP }}
              />
              <div style={stepperDivider()} />
              <button
                onClick={() => onPesoChange && onPesoChange(peso + 1)}
                aria-label="Sumar un kilo"
                style={stepperBtn()}
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>
      {open && (
        <div style={{ borderTop: "1px solid " + S.border, padding: 14 }}>
          {desc && (
            <div style={{ color: S.gray, fontSize: 15, lineHeight: 1.6, marginBottom: 12 }}>{desc}</div>
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
                    <div style={{ color: S.gray, fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>PESO ANTERIOR</div>
                    <div style={{ color: S.lgray, fontSize: 15 }}>{pesoAnterior.fecha}</div>
                  </div>
                  <div style={{ color: S.white, fontWeight: 900, fontSize: 18 }}>{pesoAnterior.peso} {enSegundos ? "seg" : "kg"}</div>
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
                  fontSize: 15,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                {enSegundos ? "Registrá tus segundos de hoy" : "Registrá tu peso de hoy"}
              </div>
              {/* 2026-07-31 — mismo stepperTrack que la fila colapsada de
                  arriba, solo un poco más grande (acá hay más lugar). Antes
                  este era un segundo diseño distinto (40x40, otros estilos)
                  del mismo control — quedaban dos steppers de peso que no se
                  parecían entre sí. */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={stepperTrack()}>
                  <button
                    onClick={() => onPesoChange && onPesoChange(Math.max(0, peso - 1))}
                    aria-label="Restar un kilo"
                    style={{ ...stepperBtn(), width: 48 }}
                  >
                    −
                  </button>
                  <div style={stepperDivider()} />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={peso || ""}
                    placeholder="0"
                    onChange={(e) => onPesoChange && onPesoChange(Math.max(0, Number(e.target.value) || 0))}
                    style={{ ...stepperValue(), minWidth: 72, height: 48 }}
                  />
                  <span style={{ color: S.gray, fontSize: 15, flexShrink: 0, alignSelf: "center" }}>{enSegundos ? "seg" : "kg"}</span>
                  <div style={stepperDivider()} />
                  <button
                    onClick={() => onPesoChange && onPesoChange(peso + 1)}
                    aria-label="Sumar un kilo"
                    style={{ ...stepperBtn(), width: 48 }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
