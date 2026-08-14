import { useState, useEffect } from "react";
import { Play, ChevronDown } from "lucide-react";
import { S, card, TS, TAP, stepperTrack, stepperBtn, stepperDivider, stepperValue } from "../utils/theme.js";
import { getYTId } from "../utils/helpers.js";
import { pasosDeInstrucciones } from "../utils/pasosInstrucciones.js";
import { resolverGif } from "../utils/ejerciciosMedia.js";
import { vueltasDe, cantidadDeVueltas, resumenVueltas } from "../utils/pesos.js";
import { useSignedUrl } from "../utils/useSignedUrl.js";
import { unidadDe, ETIQUETA_HOY, SUFIJO, PASO_UNIDAD } from "../utils/unidades.js";
import { formaDe, ayudaDe } from "../utils/carga.js";

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
  // Peso por vuelta (2026-08-09). `vueltas` es lo que hay guardado hoy para
  // este ejercicio (número viejo o array), `seriesPlan` cuántos casilleros
  // mostrar, y `onVueltaChange(serie, peso)` el que persiste. Si no llega
  // onVueltaChange, la tarjeta sigue con un solo peso, como siempre.
  vueltas,
  seriesPlan,
  onVueltaChange,
  // `equipamiento` es el equipment_es del catálogo (Barra · Mancuerna ·
  // Polea…) y viaja con el ejercicio desde el plan, igual que `unidad`. De ahí
  // sale la línea de ayuda de abajo del casillero.
  equipamiento,
}) {
  peso = peso || 0;
  historial = historial || [];
  showPeso = showPeso || false;
  // 2026-08-12 — Lucas: "los ejercicios de peso corporal como la trx o fondo
  // triceps no se cuenta por kilo sino por repeticiones... los isometricos
  // tipo plancha son por segundos". Antes acá había un regex de "plancha" que
  // decidía entre KG y SEG: un parche que dejaba en kilos todo lo demás (una
  // dominada, un puente, un fondo). Ahora la unidad viene del catálogo por el
  // plan (migración 038) y unidadDe solo la deduce si el ejercicio es viejo o
  // se escribió a mano.
  const uni = unidadDe({ unidad, nombre });
  const sufijo = SUFIJO[uni];
  // 2026-08-14 — LA REFERENCIA, no un selector. El 13 acá había un selector de
  // barra y discos: el alumno tocaba botones y la app sumaba. Lucas lo probó y
  // lo sacó ("quedó mucho... la persona tiene que poder hacer la cuenta
  // mentalmente y luego completar"). Queda un solo casillero y, al lado, una
  // línea que le recuerda qué sumar según con qué se hace el ejercicio. La
  // forma sale del equipamiento del catálogo (ver src/utils/carga.js).
  const ayuda = ayudaDe(formaDe({ unidad, nombre, equipamiento }));
  const [open, setOpen] = useState(false);

  // ── PESO POR VUELTA (2026-08-09) ─────────────────────────────────────
  // Se activa sólo si el llamador pasa onVueltaChange. Sin eso, la tarjeta se
  // comporta exactamente como antes (un peso por ejercicio) — así ninguna de
  // las otras pantallas que montan ItemCard cambia sola.
  const porVuelta = typeof onVueltaChange === "function";
  const listaVueltas = porVuelta
    ? Array.from({ length: cantidadDeVueltas(vueltas, seriesPlan) }, (_, i) => vueltasDe(vueltas)[i] ?? null)
    : [];
  const [vueltaActiva, setVueltaActiva] = useState(0);
  // Arrancar en la primera vuelta sin cargar: es la que el alumno viene a
  // completar. Si ya están todas, queda en la última.
  useEffect(() => {
    if (!porVuelta) return;
    const primeraVacia = listaVueltas.findIndex((v) => v == null || v <= 0);
    setVueltaActiva(primeraVacia === -1 ? Math.max(0, listaVueltas.length - 1) : primeraVacia);
    // Sólo al montar o si cambia la cantidad de vueltas: si se recalculara con
    // cada tecleo, el foco saltaría de casillero mientras el alumno escribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [porVuelta, listaVueltas.length]);

  const valorActivo = porVuelta ? Number(listaVueltas[vueltaActiva] || 0) : peso;
  const cambiarPeso = (v) => {
    if (porVuelta) onVueltaChange(vueltaActiva + 1, v);
    else if (onPesoChange) onPesoChange(v);
  };

  // Las instrucciones vienen del catálogo como un párrafo corrido de ~493
  // caracteres, y el alumno las lee de pie en medio de la serie: se muestran
  // como pasos numerados. Si el texto no se deja partir en una lista razonable,
  // `pasos` es null y abajo cae al párrafo de siempre.
  const pasos = pasosDeInstrucciones(desc);
  // ── EXPLICACIÓN PRIMERO, GIF ABAJO, Y "MOSTRAR MÁS" (2026-08-12) ──────
  // Pedido de Lucas: "el ejercicio tiene que ser el gif abajo y la explicación
  // como primer ítem y la opción de mostrar más". Las instrucciones del
  // catálogo son párrafos de ~500 caracteres: mostradas enteras empujaban el
  // GIF fuera de la pantalla del celular, así que la tarjeta abierta arrancaba
  // con un muro de texto y el video quedaba escondido abajo. Ahora se ven los
  // primeros pasos —que son los que se leen de pie, en medio de la serie— y el
  // resto se despliega a pedido.
  const PASOS_A_LA_VISTA = 3;
  const CHARS_A_LA_VISTA = 220;
  const [verMas, setVerMas] = useState(false);
  const textoLargo = pasos ? pasos.length > PASOS_A_LA_VISTA : (desc || "").length > CHARS_A_LA_VISTA;
  const pasosVisibles = pasos && !verMas && textoLargo ? pasos.slice(0, PASOS_A_LA_VISTA) : pasos;
  // Corte del párrafo (cuando el texto no se dejó partir en pasos): se corta en
  // el último espacio para no partir una palabra al medio.
  const descVisible = !pasos && textoLargo && !verMas
    ? (desc || "").slice(0, CHARS_A_LA_VISTA).replace(/\s+\S*$/, "") + "…"
    : desc;
  // Al cerrar la tarjeta vuelve a su forma corta: si no, el ejercicio que se
  // abrió una vez quedaba desplegado para siempre en toda la sesión.
  useEffect(() => { if (!open) setVerMas(false); }, [open]);
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
    // 2026-08-09: pasa por resolverGif para respetar el sentinel SIN_GIF —
    // un ejercicio al que el admin le sacó el GIF a propósito no debe volver
    // a mostrarlo por el lookup automático de nombre.
    const gifResuelto = resolverGif(gif, nombre);
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
        {showPeso && (
          /* Peso de hoy SIEMPRE editable acá mismo, sin abrir la tarjeta.
             Auditoría 2026-07-30: los +/- medían 28x28 reales. Es el botón
             que el alumno toca en medio de la serie, de pie y transpirado
             — piso táctil de 44x44 (iOS HIG / WCAG 2.5.5).

             2026-08-09, pedido de Lucas: "el peso se tiene que marcar por
             vuelta". Antes había UN casillero para todo el ejercicio, así que
             de 4 series con pesos distintos quedaba uno solo. Ahora hay un
             casillero por vuelta y el stepper opera sobre la que está
             seleccionada — se mantiene el botón grande, que es lo que hace
             usable esto en el medio de la serie. */
          <div
            style={{ marginTop: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* La sangría de 36px alinea el label con el texto del ejercicio,
                pero SOLO acá arriba: las pastillas de vuelta usan el ancho
                completo, si no en un teléfono de 375px la cuarta se sale. */}
            {/* flexWrap (2026-08-13): con el zoom del sistema al 200% el ancho
                útil baja a ~120px y el stepper (132px) no entra al lado del
                rótulo — envolviendo, el stepper cae a su propio renglón en vez
                de salirse de la pantalla. */}
            <div className="di-sin-sangria-angosto" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingLeft: 36 }}>
              <div style={{ color: S.gray, fontSize: TS.chip }}>
                {/* Con vueltas el casillero igual tiene que decir QUÉ se
                    carga: sin la unidad al lado, el alumno de un plan de TRX
                    escribe kilos donde van repeticiones (2026-08-12). */}
                {/* 2026-08-14: "SERIE", nunca "VUELTA". En pantalla hay UNA
                    sola palabra para esto — Lucas usa las dos hablando, pero
                    el alumno que lee "VUELTA 3" arriba y unos cuadraditos
                    abajo no ata que son la misma cosa. */}
                {porVuelta ? `SERIE ${vueltaActiva + 1} · ${sufijo.toUpperCase()}` : ETIQUETA_HOY[uni]}
                {/* La referencia de una línea (2026-08-14). Solo aparece donde
                    la cuenta se puede errar: barra y mancuernas. */}
                {ayuda && (
                  <div style={{ color: S.lgray, fontSize: 11, fontWeight: 500, lineHeight: 1.25, marginTop: 2 }}>
                    {ayuda}
                  </div>
                )}
              </div>
              <div style={stepperTrack()}>
                <button
                  onClick={() => cambiarPeso(Math.max(0, valorActivo - 1))}
                  aria-label={PASO_UNIDAD[uni][0]}
                  style={stepperBtn()}
                >
                  −
                </button>
                <div style={stepperDivider()} />
                <input
                  type="number"
                  inputMode="decimal"
                  value={valorActivo || ""}
                  placeholder="0"
                  onChange={(e) => cambiarPeso(Math.max(0, Number(e.target.value) || 0))}
                  style={{ ...stepperValue(), minWidth: 44, height: TAP }}
                />
                <div style={stepperDivider()} />
                <button
                  onClick={() => cambiarPeso(valorActivo + 1)}
                  aria-label={PASO_UNIDAD[uni][1]}
                  style={stepperBtn()}
                >
                  +
                </button>
              </div>
            </div>
            {porVuelta && (
              /* Una pastilla por SERIE. La que está seleccionada es la que
                 edita el stepper de arriba. Muestra el peso ya cargado, así
                 el alumno ve la sesión entera de un vistazo sin abrir nada.

                 2026-08-14, pedido de Lucas ("que se note que los distintos
                 cuadrados quiere referirse a las series"): arriba de cada
                 número va la palabra SERIE, no un dígito suelto. Cuatro
                 cuadraditos numerados no dicen qué son. Entra en 375px porque
                 a 9px "SERIE 4" mide ~34px y el piso de la pastilla es 44. */
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {listaVueltas.map((v, i) => {
                  const activa = i === vueltaActiva;
                  const cargada = v != null && v > 0;
                  return (
                    <button
                      key={i}
                      onClick={() => setVueltaActiva(i)}
                      aria-label={`Serie ${i + 1}${cargada ? `: ${v}` : ", sin cargar"}`}
                      aria-pressed={activa}
                      style={{
                        flex: "1 1 0",
                        // 44px es el piso táctil (iOS HIG / WCAG 2.5.5) y a la
                        // vez lo que permite que entren 5 vueltas en 375px.
                        minWidth: 44,
                        minHeight: TAP,
                        borderRadius: 8,
                        border: "1px solid " + (activa ? S.white : S.border),
                        background: activa ? S.card2 : "transparent",
                        color: cargada ? S.white : S.lgray,
                        fontSize: TS.chip,
                        fontWeight: cargada ? 900 : 500,
                        cursor: "pointer",
                        padding: "4px 2px",
                        lineHeight: 1.2,
                      }}
                    >
                      <span style={{ display: "block", color: S.gray, fontSize: 9, fontWeight: 700, letterSpacing: 0.3, whiteSpace: "nowrap" }}>SERIE {i + 1}</span>
                      {cargada ? String(v).replace(".", ",") : "—"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {open && (
        <div style={{ borderTop: "1px solid " + S.border, padding: 14 }}>
          {/* 1) LA EXPLICACIÓN — primer ítem de la tarjeta abierta. */}
          {desc &&
            (pasos ? (
              <ol style={{ listStyle: "none", margin: "0 0 10px", padding: 0, display: "grid", gap: 9 }}>
                {pasosVisibles.map((paso, i) => (
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
              <div style={{ color: S.gray, fontSize: TS.body, lineHeight: 1.6, marginBottom: 10 }}>{descVisible}</div>
            ))}
          {desc && textoLargo && (
            <button
              onClick={() => setVerMas((v) => !v)}
              aria-expanded={verMas}
              style={{
                background: "transparent",
                border: "1px solid " + S.border,
                borderRadius: 8,
                color: S.white,
                fontSize: TS.chip,
                fontWeight: 700,
                cursor: "pointer",
                minHeight: TAP,
                padding: "0 14px",
                marginBottom: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {verMas
                ? "Mostrar menos"
                : pasos
                  ? `Mostrar más (${pasos.length - PASOS_A_LA_VISTA} pasos)`
                  : "Mostrar más"}
              <ChevronDown
                size={15}
                color={S.gray}
                strokeWidth={2}
                style={{ transform: verMas ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              />
            </button>
          )}
          {/* 2) EL GIF / VIDEO — abajo de la explicación, no arriba. */}
          {renderMedia()}
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
                    <div style={{ color: S.gray, fontSize: TS.chip, fontWeight: 700, letterSpacing: 1 }}>
                      {uni === "kilos" ? "PESO ANTERIOR" : "LA VEZ ANTERIOR"}
                    </div>
                    <div style={{ color: S.lgray, fontSize: TS.chip }}>{pesoAnterior.fecha}</div>
                  </div>
                  <div style={{ color: S.white, fontWeight: 900, fontSize: TS.lead }}>{pesoAnterior.peso} {sufijo}</div>
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
                  <div style={{ color: S.white, fontWeight: 900, fontSize: TS.lead }}>{maxHistorico} {sufijo}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
