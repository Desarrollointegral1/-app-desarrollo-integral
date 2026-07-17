import { S, card, tabBtn } from "../utils/theme.js";
import { RM_EJS, hoy } from "../utils/helpers.js";
import ItemCard from "./ItemCard.jsx";

// Vista unificada de la sesión del alumno, con la estructura fija de los
// planes de Desarrollo Integral:
//   1. Movilidad
//   2. Entrada en calor con banda
//   2.1 Entrada en calor con peso
//   3. Ejercicios principales (con peso anterior + peso de hoy)
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
  const movilidad = plan?.movilidad || [];
  const calor = plan?.calor || [];
  const activacion = plan?.activacion || [];

  const SeccionHeader = ({ num, titulo, detalle }) => (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        margin: "22px 0 10px",
        paddingBottom: 8,
        borderBottom: "1px solid " + S.border,
      }}
    >
      <span style={{ color: S.green, fontWeight: 900, fontSize: 13 }}>{num}</span>
      <span style={{ color: S.white, fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>
        {titulo}
      </span>
      {detalle && <span style={{ color: S.gray, fontSize: 11, marginLeft: "auto" }}>{detalle}</span>}
    </div>
  );

  // Último peso registrado ANTES de hoy (para comparar contra el de hoy)
  const pesoAnteriorDe = (ejId) => {
    const previos = (historiales[ejId] || []).filter((h) => h.fecha && h.fecha < hoy() && Number(h.peso) > 0);
    return previos.length > 0 ? previos[previos.length - 1] : null;
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
        <div style={{ ...card, padding: "10px 14px", marginBottom: 4, display: "flex", gap: 20 }}>
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

      {/* 1 · Movilidad */}
      {movilidad.length > 0 && (
        <>
          <SeccionHeader num="1" titulo="Movilidad" detalle="6 rep por lado" />
          {movilidad.map((ej, i) => (
            <ItemCard key={i} numero={i + 1} nombre={ej.nombre} desc={ej.desc} video={ej.video} mediaLocal={ej.mediaLocal} />
          ))}
          {/* Rutina completa con el profe (videos si están cargados) */}
          {(plan.movilidad_videos?.corta?.url || plan.movilidad_videos?.avanzada?.url) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              {[
                { tipo: "Corta", defaultDur: "8 min", mv: plan.movilidad_videos?.corta },
                { tipo: "Avanzada", defaultDur: "15 min", mv: plan.movilidad_videos?.avanzada },
              ].map(({ tipo, defaultDur, mv }) => (
                <div key={tipo} style={{ ...card, padding: "16px 12px", textAlign: "center" }}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{tipo}</div>
                  <div style={{ color: S.green, fontSize: 12, marginBottom: 12, fontWeight: 600 }}>
                    {mv?.duracion || defaultDur}
                  </div>
                  {mv?.url ? (
                    <video controls style={{ width: "100%", borderRadius: 6, display: "block" }}>
                      <source src={mv.url} type="video/mp4" />
                    </video>
                  ) : (
                    <div style={{ padding: "16px 0", color: S.lgray || S.gray, fontSize: 11 }}>Video pendiente</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 2 · Entrada en calor con banda */}
      {calor.length > 0 && (
        <>
          <SeccionHeader num="2" titulo="Entrada en calor — Banda" detalle="5 rep por brazo" />
          {calor.map((ej, i) => (
            <ItemCard
              key={i}
              numero={i + 1}
              nombre={(ej.nombre || "").replace(/\s*\(banda\)/gi, "").trim()}
              desc={ej.desc}
              video={ej.video}
              mediaLocal={ej.mediaLocal}
            />
          ))}
        </>
      )}

      {/* 2.1 · Entrada en calor con peso */}
      {activacion.length > 0 && (
        <>
          <SeccionHeader num="2.1" titulo="Entrada en calor — Con peso" detalle="5 repeticiones" />
          {activacion.map((ej, i) => (
            <ItemCard
              key={i}
              numero={i + 1}
              nombre={(ej.nombre || "").replace(/\s*\(banda\)/gi, "").trim()}
              desc={ej.desc}
              video={ej.video}
              mediaLocal={ej.mediaLocal}
            />
          ))}
        </>
      )}

      {/* 3 · Ejercicios principales — con registro de peso */}
      {planValido && dia && (
        <>
          <SeccionHeader
            num="3"
            titulo="Ejercicios principales"
            detalle={`${sem.series}x${sem.reps}${sem.intensidad ? " al " + sem.intensidad : ""}`}
          />
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
    </div>
  );
}
