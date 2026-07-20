import { useState, useEffect } from "react";
import { S, card, tabBtn } from "../utils/theme.js";
import { RM_EJS, hoy, getYTId } from "../utils/helpers.js";
import { getAppConfig } from "../../services/supabase.js";
import { MOVILIDAD_ARTICULACIONES } from "../utils/planTemplates.js";
import ItemCard from "./ItemCard.jsx";

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
}) {
  const [prep, setPrep] = useState("movilidad");
  const [videosGlobal, setVideosGlobal] = useState(null);
  // Dos tabs del mismo tamaño: Preparación | Principales.
  const [seccion, setSeccion] = useState("preparacion");

  // Videos de movilidad globales (Admin → Plan → Videos de movilidad).
  useEffect(() => {
    getAppConfig("videos_movilidad").then(setVideosGlobal);
  }, []);

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
    corta: plan?.movilidad_videos?.corta?.url ? plan.movilidad_videos.corta : videosGlobal?.corta,
    larga: plan?.movilidad_videos?.larga?.url ? plan.movilidad_videos.larga : (videosGlobal?.larga || videosGlobal?.avanzada),
  };

  const PREP_TABS = [
    { id: "movilidad", label: "Movilidad", detalle: "6 rep por lado", items: movilidad },
    { id: "banda", label: "Activación con elástico", detalle: "5 rep por brazo", items: calor },
    { id: "peso", label: "Activación con peso", detalle: "5 repeticiones", items: activacion },
    // Entrada en calor superrápida: bloque fijo para días con poco tiempo (CEREBRO-ENTRENAMIENTO 3.5)
    { id: "superrapida", label: "Superrápida", detalle: "activación express — 5 por lado", items: MOVILIDAD_ARTICULACIONES },
  ];
  const prepActiva = PREP_TABS.find((t) => t.id === prep) || PREP_TABS[0];

  return (
    <div>
      {/* Selector de día si el plan tiene más de uno */}
      {planValido && plan.dias.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {plan.dias.map((d, i) => (
            <button key={i} onClick={() => setDiaIdx(i)} style={{ ...tabBtn(diaIdx === i), flex: 1 }}>
              {d.dia}
            </button>
          ))}
        </div>
      )}

      {/* Resumen de la semana */}
      {planValido && (
        <div style={{ ...card, padding: "10px 14px", display: "flex", gap: 20 }}>
          <div>
            <div style={{ color: S.white, fontWeight: 700 }}>
              {sem.series}x{sem.reps}
            </div>
            <div style={{ color: S.gray, fontSize: 10 }}>SEM {semanaActual}</div>
          </div>
          {sem.intensidad && (
            <div>
              <div style={{ color: S.green, fontWeight: 700 }}>{sem.intensidad}</div>
              <div style={{ color: S.gray, fontSize: 10 }}>INTENSIDAD</div>
            </div>
          )}
          {dia && (
            <div>
              <div style={{ color: S.white, fontWeight: 700 }}>{(dia.ejercicios || []).length}</div>
              <div style={{ color: S.gray, fontSize: 10 }}>PRINCIPALES</div>
            </div>
          )}
        </div>
      )}

      {/* ── Tabs principales: PREPARACIÓN | PRINCIPALES (pills del mismo tamaño) ── */}
      <div style={{ display: "flex", gap: 8, margin: "16px 0 12px" }}>
        {[
          ["preparacion", "Preparación"],
          ["principales", "Principales"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSeccion(id)}
            style={{ ...tabBtn(seccion === id), flex: 1, padding: "12px 4px", fontSize: 12, borderRadius: 10 }}
          >
            {label}
          </button>
        ))}
      </div>

      {seccion === "preparacion" && (
        <>
          {/* Sub-menús de Preparación */}
          <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
            {PREP_TABS.map((t) => (
              <button key={t.id} onClick={() => setPrep(t.id)} style={{ ...tabBtn(prep === t.id), flex: 1, padding: "9px 3px", fontSize: 10 }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ color: S.gray, fontSize: 11, textAlign: "center", marginBottom: 10 }}>{prepActiva.detalle}</div>
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
              />
            ))
          )}
          {/* Videos de la rutina completa, al final de Movilidad */}
          {prep === "movilidad" && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, color: S.gray, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 10 }}>
                Rutina completa con el profe
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <VideoCard tipo="Corta" defaultDur="8 min" mv={videos.corta} />
                <VideoCard tipo="Completa" defaultDur="15+ min" mv={videos.larga} />
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PRINCIPALES ── */}
      {seccion === "principales" && (!planValido || !dia ? (
        <div style={{ ...card, padding: "24px 16px", textAlign: "center", color: S.gray, fontSize: 12 }}>
          Sin ejercicios principales asignados
        </div>
      ) : (
        <>
          <div style={{ color: S.gray, fontSize: 11, textAlign: "center", marginBottom: 10 }}>
            {sem.series}x{sem.reps}
            {sem.intensidad ? " al " + sem.intensidad : ""}
          </div>
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
                showPeso
                semana={sem}
                peso={pesos[ej.id] || 0}
                historial={historiales[ej.id] || []}
                pesoAnterior={pesoAnteriorDe(ej.id)}
                onPesoChange={(v) => onPeso(ej.id, v)}
                pesoSugerido={pesoSugerido}
                intensidad={sem.intensidad}
              />
            );
          })}
        </>
      ))}
    </div>
  );
}
