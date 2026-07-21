import { useState, useEffect } from "react";
import { S, card, tabBtn, tabN2, segTrack, segChip, n4Track, chipN4 } from "../utils/theme.js";
import { RM_EJS, hoy, getYTId } from "../utils/helpers.js";
import { getAppConfig } from "../../services/supabase.js";
import { MOVILIDAD_ARTICULACIONES, MOVILIDAD_CORTA } from "../utils/planTemplates.js";
import ItemCard from "./ItemCard.jsx";

// ── Texto de repeticiones (ronda 12) ────────────────────────────────────
// Antes cada sección tenía su propio string libre ("6 rep por lado", "5 rep
// por brazo", "activación express — 5 por lado") con la palabra recortada.
// Ahora el dato es ESTRUCTURADO ({ prefijo, cantidad, tipo, sufijo }) y este
// componente lo renderiza siempre con "repeticiones" completo y el número en
// verde + negrita — los 3 patrones pedidos: "X repeticiones", "X
// repeticiones por brazo", "X repeticiones por lado".
function RepsLabel({ prefijo, cantidad, tipo, sufijo }) {
  const suf = tipo === "lado" ? " por lado" : tipo === "brazo" ? " por brazo" : "";
  return (
    <>
      {prefijo ? prefijo + " " : ""}
      <span style={{ color: S.green, fontWeight: 800 }}>{cantidad}</span>
      {" repeticiones" + suf}
      {sufijo ? " " + sufijo : ""}
    </>
  );
}

// Vista de la sesión del alumno, con DOS tabs del mismo tamaño (pills):
//   PREPARACIÓN — 3 sub-menús: Movilidad · Activación con elástico · Activación con peso
//      (al final de Movilidad, los videos de la rutina completa: corta/larga)
//   PRINCIPALES — los ejercicios principales, con peso anterior + peso de hoy
export default function PlanDelDia({
  plan,
  planValido,
  dia,
  diaIdx,
  setDiaIdx,
  sem,
  semanaActual,
  pesos,
  historiales,
  onPeso,
  rm,
  onRegistrarDia,
  diaRegistrado,
  registrandoDia,
  irAPrincipales,
}) {
  // null = "la primera sección visible según el orden del admin" (ronda 9)
  const [prep, setPrep] = useState(null);
  // Versión de movilidad elegida por el alumno: superrapida (~3') · corta (~8') · completa (15'+).
  // Arranca en la PREDETERMINADA que el admin eligió para este alumno
  // (rm.movilidad_default, Admin → Plan → Movil.); el alumno puede cambiarla acá.
  const [moviVersion, setMoviVersion] = useState(() =>
    ["superrapida", "corta", "completa"].includes(rm?.movilidad_default) ? rm.movilidad_default : "completa"
  );
  const [videosGlobal, setVideosGlobal] = useState(null);
  // Dos tabs del mismo tamaño: Preparación | Principales.
  const [seccion, setSeccion] = useState("preparacion");

  // Videos de movilidad globales (Admin → Plan → Videos de movilidad).
  useEffect(() => {
    getAppConfig("videos_movilidad").then(setVideosGlobal);
  }, []);

  // Ronda 17 (punto 4): atajo desde las pills de día de la ficha del
  // alumno — "irAPrincipales" es un token que se incrementa en cada click
  // (no un booleano) para poder disparar el salto aunque el alumno ya esté
  // en Principales cuando toca otra pill de nuevo.
  useEffect(() => {
    if (irAPrincipales) setSeccion("principales");
  }, [irAPrincipales]);

  const movilidad = plan?.movilidad || [];
  const calor = plan?.calor || [];
  const activacion = plan?.activacion || [];

  // Último peso registrado ANTES de hoy (para comparar contra el de hoy)
  const pesoAnteriorDe = (ejId) => {
    const previos = (historiales[ejId] || []).filter((h) => h.fecha && h.fecha < hoy() && Number(h.peso) > 0);
    return previos.length > 0 ? previos[previos.length - 1] : null;
  };

  const VideoCard = ({ tipo, defaultDur, mv }) => {
    const url = mv?.url || "";
    const ytId = getYTId(url);
    return (
      <div style={{ ...card, padding: "14px 12px", textAlign: "center" }}>
        <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{tipo}</div>
        <div style={{ color: S.green, fontSize: 12, marginBottom: 10, fontWeight: 600 }}>{mv?.duracion || defaultDur}</div>
        {ytId ? (
          <div style={{ borderRadius: 6, overflow: "hidden", position: "relative", paddingTop: "56.25%", background: "#000" }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`Rutina de movilidad ${tipo}`}
            />
          </div>
        ) : url ? (
          <video controls style={{ width: "100%", borderRadius: 6, display: "block" }}>
            <source src={url} type="video/mp4" />
          </video>
        ) : (
          <div style={{ padding: "14px 0", color: S.lgray || S.gray, fontSize: 11 }}>Video pendiente</div>
        )}
      </div>
    );
  };

  if (!planValido && movilidad.length === 0 && calor.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: S.gray }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <div style={{ color: S.white, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
          Todavía no tenés plan asignado
        </div>
        <div style={{ fontSize: 13 }}>Hablá con tu entrenador para que configure tu rutina.</div>
      </div>
    );
  }

  // Videos: lo cargado por plan pisa lo global; lo global es lo normal.
  const videos = {
    superrapida: plan?.movilidad_videos?.superrapida?.url ? plan.movilidad_videos.superrapida : videosGlobal?.superrapida,
    corta: plan?.movilidad_videos?.corta?.url ? plan.movilidad_videos.corta : videosGlobal?.corta,
    larga: plan?.movilidad_videos?.larga?.url ? plan.movilidad_videos.larga : (videosGlobal?.larga || videosGlobal?.avanzada),
  };

  // Las 3 versiones de movilidad (CEREBRO-ENTRENAMIENTO 3.1 y 3.5): el alumno
  // elige según el tiempo que tiene; cada una con sus ejercicios y su video.
  const MOVI_VERSIONES = [
    { id: "superrapida", label: "Superrápida", detalle: { prefijo: "activación express —", cantidad: 5, tipo: "lado" }, items: MOVILIDAD_ARTICULACIONES, video: videos.superrapida, videoDur: "3 min" },
    { id: "corta", label: "Corta", detalle: { cantidad: 6, tipo: "lado", sufijo: "— versión corta" }, items: MOVILIDAD_CORTA, video: videos.corta, videoDur: "8 min" },
    { id: "completa", label: "Completa", detalle: { cantidad: 6, tipo: "lado" }, items: movilidad, video: videos.larga, videoDur: "15+ min" },
  ];
  const moviActiva = MOVI_VERSIONES.find((v) => v.id === moviVersion) || MOVI_VERSIONES[2];

  // Ronda 9: secciones renombradas (Movilidad · Act. Elástico · Entrada en
  // calor) y el ADMIN puede ocultar/reordenar secciones por alumno vía
  // rm.secciones_config = { orden: ["movilidad","banda","peso"], ocultas: [] }.
  const PREP_TABS_BASE = [
    { id: "movilidad", label: "Movilidad", detalle: moviActiva.detalle, items: moviActiva.items },
    { id: "banda", label: "Act. Elástico", detalle: { cantidad: 5, tipo: "brazo" }, items: calor },
    { id: "peso", label: "Entrada en calor", detalle: { cantidad: 5, tipo: null }, items: activacion },
  ];
  const cfg = rm?.secciones_config || {};
  const ordenCfg = (Array.isArray(cfg.orden) ? cfg.orden : []).filter((id) => PREP_TABS_BASE.some((t) => t.id === id));
  PREP_TABS_BASE.forEach((t) => { if (!ordenCfg.includes(t.id)) ordenCfg.push(t.id); });
  const ocultas = Array.isArray(cfg.ocultas) ? cfg.ocultas : [];
  const PREP_TABS = ordenCfg
    .map((id) => PREP_TABS_BASE.find((t) => t.id === id))
    .filter((t) => t && !ocultas.includes(t.id));
  const prepActiva = PREP_TABS.find((t) => t.id === prep) || PREP_TABS[0] || null;

  // Selector de día (Lunes/Miércoles/Viernes... o Día 1/Día 2/Día 3...) —
  // SOLO aplica a Principales (Preparación es igual todos los días). Ronda
  // 11: se ubica debajo de la ficha de stats, no arriba del todo. Punto 9
  // (2026-07-21): el admin elige por alumno el modo de etiquetado —
  // rm.dias_modo === "numerico" muestra "Día 1/Día 2/..." en vez del
  // nombre real del día (para alumnos sin horario fijo).
  const diasModo = rm?.dias_modo === "numerico" ? "numerico" : "nombres";
  const SelectorDia = () =>
    planValido && plan.dias.length > 1 ? (
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {plan.dias.map((d, i) => (
          <button key={i} onClick={() => setDiaIdx(i)} style={{ ...tabBtn(diaIdx === i), flex: 1 }}>
            {diasModo === "numerico" ? `Día ${i + 1}` : d.dia}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div>
      {/* ── Tabs nivel 2: PREPARACIÓN | PRINCIPALES — activo con borde blanco
          + fondo card, sin invertir (jerarquía visual ronda 6) ── */}
      <div style={{ display: "flex", gap: 8, margin: "4px 0 12px" }}>
        {[
          ["preparacion", "Preparación"],
          ["principales", "Principales"],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setSeccion(id)} style={tabN2(seccion === id)}>
            {label}
          </button>
        ))}
      </div>

      {seccion === "preparacion" && (PREP_TABS.length === 0 || !prepActiva ? (
        <div style={{ ...card, padding: "24px 16px", textAlign: "center", color: S.gray, fontSize: 12 }}>
          Tu entrenador no habilitó secciones de preparación — pasá directo a Principales.
        </div>
      ) : (
        <>
          {/* Sub-menús de Preparación — respetan orden y visibilidad que el
              admin configuró para este alumno (ronda 9) */}
          <div style={{ ...segTrack(), marginBottom: 8 }}>
            {PREP_TABS.map((t) => (
              <button key={t.id} onClick={() => setPrep(t.id)} style={segChip(prepActiva.id === t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          {/* Selector de versión de movilidad — nivel 4 (ronda 11): sub-menú
              DENTRO de Movilidad, con un estilo más chico/sutil (texto +
              subrayado) para que no se confunda con el segmented control de
              nivel 3 de arriba (Movilidad/Act. Elástico/Entrada en calor). */}
          {prepActiva.id === "movilidad" && (
            <div style={{ ...n4Track(), marginBottom: 10 }}>
              {MOVI_VERSIONES.map((v) => (
                <button key={v.id} onClick={() => setMoviVersion(v.id)} style={chipN4(moviVersion === v.id)}>
                  {v.label}
                </button>
              ))}
            </div>
          )}
          <div style={{ color: S.gray, fontSize: 11, textAlign: "center", marginBottom: 10 }}>
            <RepsLabel {...prepActiva.detalle} />
          </div>
          {prepActiva.items.length === 0 ? (
            <div style={{ ...card, padding: "24px 16px", textAlign: "center", color: S.gray, fontSize: 12 }}>
              Sin ejercicios en esta parte
            </div>
          ) : (
            prepActiva.items.map((ej, i) => (
              <ItemCard
                key={i}
                numero={i + 1}
                nombre={(ej.nombre || "").replace(/\s*\(banda\)/gi, "").trim()}
                desc={ej.desc}
                video={ej.video}
                mediaLocal={ej.mediaLocal}
                gif={ej.gif}
              />
            ))
          )}
          {/* Video de la versión elegida, al final de Movilidad */}
          {prepActiva.id === "movilidad" && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, color: S.gray, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 10 }}>
                Rutina con el profe
              </div>
              <VideoCard tipo={moviActiva.label} defaultDur={moviActiva.videoDur} mv={moviActiva.video} />
            </div>
          )}
        </>
      ))}

      {/* ── PRINCIPALES ── */}
      {seccion === "principales" && (!planValido || !dia ? (
        <div style={{ ...card, padding: "24px 16px", textAlign: "center", color: S.gray, fontSize: 12 }}>
          Sin ejercicios principales asignados
        </div>
      ) : (
        <>
          {/* Ficha de stats — SOLO acá en Principales (Preparación usa otras
              series/reps): series x reps · intensidad · cantidad de ejercicios.
              Ronda 8: contenido CENTRADO (antes quedaba pegado a la izquierda). */}
          <div style={{ ...card, padding: "10px 14px", display: "flex", gap: 28, marginBottom: 12, justifyContent: "center", textAlign: "center" }}>
            <div>
              <div style={{ color: S.white, fontWeight: 700 }}>
                {sem.series}x{sem.reps}
              </div>
              <div style={{ color: S.gray, fontSize: 10 }}>SERIES X REPS</div>
            </div>
            {sem.intensidad && (
              <div>
                <div style={{ color: S.green, fontWeight: 700 }}>{sem.intensidad}</div>
                <div style={{ color: S.gray, fontSize: 10 }}>INTENSIDAD</div>
              </div>
            )}
            <div>
              <div style={{ color: S.white, fontWeight: 700 }}>{(dia.ejercicios || []).length}</div>
              <div style={{ color: S.gray, fontSize: 10 }}>EJERCICIOS</div>
            </div>
          </div>
          <SelectorDia />
          {dia.subtitulo && <div style={{ color: S.gray, fontSize: 12, marginBottom: 10 }}>{dia.subtitulo}</div>}
          {(dia.ejercicios || []).map((ej, i) => {
            const rmKey = RM_EJS.find(
              (k) =>
                ej.nombre.toLowerCase().includes(k.toLowerCase().split(" ")[0]) ||
                k.toLowerCase().includes(ej.nombre.toLowerCase().split(" ")[0]),
            );
            const rmDato = rmKey && rm && rm[rmKey];
            const pct = sem.intensidad ? Number(sem.intensidad.replace("%", "")) : null;
            const pesoSugerido = rmDato && rmDato.peso > 0 && pct ? Math.round((rmDato.peso * pct) / 100) : null;
            return (
              <ItemCard
                key={ej.id}
                numero={i + 1}
                nombre={ej.nombre}
                desc={ej.desc}
                video={ej.video}
                mediaLocal={ej.mediaLocal}
                gif={ej.gif}
                showPeso
                semana={sem}
                peso={pesos[ej.id] || 0}
                historial={historiales[ej.id] || []}
                pesoAnterior={pesoAnteriorDe(ej.id)}
                onPesoChange={(v) => onPeso(ej.id, v)}
                pesoSugerido={pesoSugerido}
                intensidad={sem.intensidad}
                unidad={ej.unidad}
              />
            );
          })}
          {/* ── REGISTRAR DÍA (ronda 8): cierre de la sesión de hoy. Los pesos
              se autoguardan igual mientras se cargan; este botón confirma la
              sesión: re-sincroniza los pesos de hoy, marca la asistencia si no
              estaba, y deja el día como registrado. ── */}
          {onRegistrarDia && (
            <button
              onClick={onRegistrarDia}
              disabled={registrandoDia}
              style={{
                width: "100%",
                marginTop: 16,
                background: diaRegistrado ? S.green : S.white,
                color: diaRegistrado ? "#fff" : S.bg,
                border: "none",
                borderRadius: 12,
                padding: "16px 24px",
                fontSize: 15,
                fontWeight: 900,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                cursor: registrandoDia ? "default" : "pointer",
                opacity: registrandoDia ? 0.7 : 1,
                transition: "all 0.3s",
              }}
            >
              {registrandoDia ? "REGISTRANDO..." : diaRegistrado ? "✓ DÍA REGISTRADO" : "REGISTRAR DÍA"}
            </button>
          )}
          {onRegistrarDia && (
            <div style={{ fontSize: 10, color: S.lgray, textAlign: "center", marginTop: 8 }}>
              {diaRegistrado
                ? "La sesión de hoy quedó registrada en tu historial. Podés volver a tocar si cambiaste algún peso."
                : "Tus pesos se van guardando solos — este botón cierra y registra la sesión de hoy."}
            </div>
          )}
        </>
      ))}
    </div>
  );
}
