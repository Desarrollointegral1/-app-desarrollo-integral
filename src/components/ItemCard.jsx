import { useState } from "react";
import { Play, ChevronDown } from "lucide-react";
import { S, card, TS, TAP, stepperTrack, stepperBtn, stepperDivider, stepperValue } from "../utils/theme.js";
import { getYTId } from "../utils/helpers.js";
import { pasosDeInstrucciones } from "../utils/pasosInstrucciones.js";
import { getEjercicioGif } from "../utils/ejerciciosMedia.js";
import { useSignedUrl } from "../utils/useSignedUrl.js";

// Chip de la fila meta (series×reps, equipo). Nivel 3 del sistema de la app:
// fondo card2, borde de borde, texto al piso de 15px (TS.chip) — no inventa
// tamaños, misma escala que el resto de los chips.
const metaChip = {
  background: S.card2,
  border: "1px solid " + S.border,
  borderRadius: 6,
  padding: "3px 8px",
  fontSize: TS.chip,
  color: S.lgray,
  fontWeight: 700,
  letterSpacing: 0.3,
};

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
  equipo,
}) {
  peso = peso || 0;
  historial = historial || [];
  showPeso = showPeso || false;
  // Taxonomía 2026-07-21: la Plancha se mide SIEMPRE en segundos, no en
  // repeticiones ni kilos. unidad viene del plan/biblioteca; el chequeo por
  // nombre es la red de seguridad para planes viejos sin el campo.
  const enSegundos = unidad === "segundos" || /^plancha\b/i.test((nombre || "").trim());
  const [open, setOpen] = useState(false);
  // Las instrucciones vienen del catálogo como un párrafo corrido de ~493
  // caracteres, y el alumno las lee de pie en medio de la serie: se muestran
  // como pasos numerados. Si el texto no se deja partir en una lista razonable,
  // `pasos` es null y abajo cae al párrafo de siempre.
  const pasos = pasosDeInstrucciones(desc);
  // "3x8-10" de la periodización semanal. Se arma solo si vienen las dos
  // puntas: media prescripción ("3x") confunde más de lo que informa.
  const chipSeries =
    semana && semana.series != null && semana.reps != null
      ? `${semana.series}x${semana.reps}`
      : null;
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
        <div style={{ background: S.card2, borderRadius: 8, marginBottom: 12, padding: 16, textAlign: "center", color: S.gray, fontSize: TS.chip }}>
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
    // El fondo blanco de abajo NO es un descuido: los GIFs del dataset vienen
    // con fondo blanco quemado, oscurecerlo los rompe. Lo que se arregla es que
    // dentro de una card oscura leía como un agujero — con marco, radio propio
    // y sombra interna lee como visor deliberado.
    if (gifResuelto)
      return (
        <div
          style={{
            background: "#fff",
            border: "1px solid " + S.border2,
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)",
            borderRadius: 10,
            marginBottom: 12,
            padding: "10px 0 4px",
            textAlign: "center",
          }}
        >
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
        <div style={{ color: S.lgray, fontSize: TS.chip }}>Video proximamente</div>
      </div>
    );
  };
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
              fontSize: TS.chip,
              color: S.gray,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {numero}
          </div>
          <div style={{ flex: 1, color: S.white, fontSize: TS.ui, fontWeight: 600, lineHeight: 1.3 }}>{nombre}</div>
          {/* Chevron de lucide (mismo set de íconos que el resto de la app) en
              vez de los caracteres ▲/▼, que se renderizaban con la fuente de
              emoji del sistema y cambiaban de forma según el celular. */}
          <ChevronDown
            size={18}
            color={S.gray}
            strokeWidth={2}
            style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          />
        </div>
        {/* Fila meta: lo que hay que hacer y con qué, SIN abrir la tarjeta.
            · series×reps salen de la periodización de la semana, que ya
              llegaba hasta acá (`semana`) y se descartaba: el prop estaba
              declarado y no se usaba en ningún lado. No es dato nuevo ni
              requiere alta — `plan_ejercicios.series/reps` sigue vacía, la
              prescripción es semanal (planTemplates.js: PERIODIZACION_BASE).
            · equipo es `catalogo_ejercicios.equipment_es`, poblado en los
              1343 del catálogo y que hasta ahora moría en el buscador del
              armador de planes: nunca se copiaba al plan.
            La dificultad (`nivel`) NO está acá a propósito: la columna existe
            pero está vacía en los 1343, así que no hay nada que mostrar. */}
        {(chipSeries || equipo) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, paddingLeft: 36 }}>
            {chipSeries && (
              <span style={metaChip}>{chipSeries}</span>
            )}
            {equipo && <span style={metaChip}>{equipo}</span>}
          </div>
        )}
        {showPeso && (
          /* Peso de hoy SIEMPRE editable acá mismo, sin abrir la tarjeta.
             Auditoría 2026-07-30: los +/- medían 28x28 reales. Es el botón
             que el alumno toca en medio de la serie, de pie y transpirado
             — pasa al piso táctil de 44x44 (iOS HIG / WCAG 2.5.5). */
          <div
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10, paddingLeft: 36 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: S.gray, fontSize: TS.chip }}>{enSegundos ? "SEG HOY" : "KG HOY"}</div>
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
          {/* La media va ARRIBA de los pasos: primero se ve el movimiento,
              después se lee cómo hacerlo. Es el orden de la ficha de Afitz
              (video → "Como Executar") y el que el manual daba por hecho
              desde el 2026-08-04 — pero en el código estaba al revés: el
              gif/video se renderizaba DEBAJO del párrafo de instrucciones. */}
          {renderMedia()}
          {desc &&
            (pasos ? (
              <ol style={{ listStyle: "none", margin: "0 0 14px", padding: 0, display: "grid", gap: 9 }}>
                {pasos.map((paso, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span
                      style={{
                        color: S.lgray,
                        fontSize: TS.chip,
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        minWidth: 15,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ color: S.gray, fontSize: TS.body, lineHeight: 1.45 }}>{paso}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div style={{ color: S.gray, fontSize: TS.body, lineHeight: 1.6, marginBottom: 12 }}>{desc}</div>
            ))}
          {showPeso && (pesoAnterior || maxHistorico > 0) && (
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
                    <div style={{ color: S.gray, fontSize: TS.chip, fontWeight: 700, letterSpacing: 1 }}>PESO ANTERIOR</div>
                    <div style={{ color: S.lgray, fontSize: TS.chip }}>{pesoAnterior.fecha}</div>
                  </div>
                  <div style={{ color: S.white, fontWeight: 900, fontSize: TS.lead }}>{pesoAnterior.peso} {enSegundos ? "seg" : "kg"}</div>
                </div>
              )}
              {/* 2026-07-31 — Lucas: "no quiero que aparezca tu peso de hoy
                  abajo otra vez, ahí lo que tiene que aparecer es el peso
                  máximo". El editable ya está arriba (fila colapsada, KG
                  HOY); acá abajo del gif va solo lectura, sin duplicar el
                  control. */}
              {maxHistorico > 0 && (
                <div
                  style={{
                    background: S.card,
                    border: "1px solid " + S.border,
                    borderRadius: 8,
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ color: S.gray, fontSize: TS.chip, fontWeight: 700, letterSpacing: 1 }}>TU MÁXIMO EN ESTE EJERCICIO</div>
                  <div style={{ color: S.white, fontWeight: 900, fontSize: TS.lead }}>{maxHistorico} {enSegundos ? "seg" : "kg"}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
