import { useState, useEffect } from "react";
import { S, card, tabBtn } from "../utils/theme.js";
import { RM_EJS, hoy, getYTId } from "../utils/helpers.js";
import { getAppConfig } from "../../services/supabase.js";
import ItemCard from "./ItemCard.jsx";

// Vista de la sesión del alumno, en DOS secciones claras:
//   A. PREPARACIÓN — segmentada en 3: Movilidad · Con banda · Con peso
//      (al final de Movilidad, los videos de la rutina completa: corta/larga)
//   B. EJERCICIOS PRINCIPALES — con peso anterior + peso de hoy por ejercicio
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
  // Preparación y Ejercicios principales son dos menús desplegables
  // independientes — solo uno se muestra expandido a la vez.
  const [seccionAbierta, setSeccionAbierta] = useState("preparacion");

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

  // Header-acordeón: clickeable, muestra si esa sección está abierta o cerrada.
  const SeccionTitulo = ({ letra, titulo, detalle, seccion, abierta, onToggle }) => (
    <div
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        margin: "20px 0 10px",
        paddingBottom: 8,
        borderBottom: "1px solid " + S.border,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <span style={{ color: S.green, fontWeight: 900, fontSize: 13 }}>{letra}</span>
      <span style={{ color: S.white, fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>
        {titulo}
      </span>
      {detalle && <span style={{ color: S.gray, fontSize: 11, marginLeft: "auto" }}>{detalle}</span>}
      <span style={{ color: S.gray, fontSize: 11, marginLeft: detalle ? 8 : "auto" }}>{abierta ? "▲" : "▼"}</span>
    </div>
  );

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
    { id: "banda", label: "Con banda", detalle: "5 rep por brazo", items: calor },
    { id: "peso", label: "Con peso", detalle: "5 repeticiones", items: activacion },
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

      {/* ── A · PREPARACIÓN (menú desplegable independiente) ── */}
      <SeccionTitulo
        letra="A"
        titulo="Preparación"
        detalle={seccionAbierta === "preparacion" ? prepActiva.detalle : null}
        abierta={seccionAbierta === "preparacion"}
        onToggle={() => setSeccionAbierta((s) => (s === "preparacion" ? null : "preparacion"))}
      />
      {seccionAbierta === "preparacion" && (
        <>
          <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
            {PREP_TABS.map((t) => (
              <button key={t.id} onClick={() => setPrep(t.id)} style={{ ...tabBtn(prep === t.id), flex: 1, padding: "8px 4px", fontSize: 11 }}>
                {t.label}
              </button>
            ))}
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

      {/* ── B · EJERCICIOS PRINCIPALES (menú desplegable independiente) ── */}
      {planValido && dia && (
        <>
          <SeccionTitulo
            letra="B"
            titulo="Ejercicios principales"
            detalle={seccionAbierta === "principales" ? `${sem.series}x${sem.reps}${sem.intensidad ? " al " + sem.intensidad : ""}` : null}
            abierta={seccionAbierta === "principales"}
            onToggle={() => setSeccionAbierta((s) => (s === "principales" ? null : "principales"))}
          />
          {seccionAbierta === "principales" && (
          <>
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
          )}
        </>
      )}
    </div>
  );
}
