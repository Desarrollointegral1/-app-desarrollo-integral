import { X } from "lucide-react";
import { EjercicioEditor } from "../../components/editores/EjercicioEditor.jsx";
import { PrepEditorAlumno } from "../../components/editores/PrepEditorAlumno.jsx";
import VideosMovilidadAdmin from "../../components/VideosMovilidadAdmin.jsx";
import { chipN4, n4Track, S, smallBtn } from "../../utils/theme.js";
import { PlanesPrincipales } from "../PlanesPrincipales.jsx";

// Sección "plan" del AdminPanel. Solo JSX: todo el estado y los
// handlers viven en AdminPanel.jsx y llegan por props (refactor 2026-08-17).
export function SeccionEjercicios({
  al,
  alumnos,
  biblioteca,
  guardarParaTodos,
  guardarPrepAlumno,
  moviVer,
  onGuardarBiblioteca,
  onUpdate,
  planFoco,
  planTab,
  prepGlobales,
  rm,
  setDiasModo,
  setMoviDefault,
  setMoviVer,
  setPlanesTab,
  setPlanTab,
  setSec,
  setSeccionesConfig,
  showToast,
  updatePlan,
  volverPrepGlobal,
}) {
  return (
    <div>
      {" "}
      {/* ── Ronda 10: la reorganización/ocultado de secciones vive DIRECTO
          en esta fila de tabs (reemplaza la card "Secciones que ve...").
          Cada chip de preparación tiene una "✕" para ocultar/mostrar
          (toggle — atenuado en el admin, oculto de verdad solo para el
          alumno) y soporta drag&drop nativo para reordenar. Mismo
          storage de siempre: rm.secciones_config = { orden, ocultas },
          con ids "movilidad"/"banda"/"peso" (los que usa PlanDelDia).
          "Principales" queda fijo al final, sin drag ni ocultar. ── */}
      {(() => {
        const SECCIONES_DEF = [["movilidad", "Movilidad"], ["banda", "Act. Elástico"], ["peso", "Entrada en calor"]];
        const TAB_KEY_BY_SECCION = { movilidad: "movilidad", banda: "calor", peso: "activacion" };
        const cfg = al ? (rm[al.id] && rm[al.id].secciones_config) || al.rm?.secciones_config || {} : {};
        const orden = (Array.isArray(cfg.orden) ? cfg.orden : []).filter((id) => SECCIONES_DEF.some((s) => s[0] === id));
        SECCIONES_DEF.forEach(([id]) => { if (!orden.includes(id)) orden.push(id); });
        const ocultas = Array.isArray(cfg.ocultas) ? cfg.ocultas : [];
        const toggleVis = (id) =>
          al && setSeccionesConfig({ orden, ocultas: ocultas.includes(id) ? ocultas.filter((x) => x !== id) : [...ocultas, id] });
        const reordenar = (idArrastrado, idDestino) => {
          if (!al || idArrastrado === idDestino || !orden.includes(idArrastrado) || !orden.includes(idDestino)) return;
          const n = orden.filter((x) => x !== idArrastrado);
          n.splice(n.indexOf(idDestino), 0, idArrastrado);
          setSeccionesConfig({ orden: n, ocultas });
        };
        const chips = orden.map((id) => {
          const def = SECCIONES_DEF.find((s) => s[0] === id);
          return { key: TAB_KEY_BY_SECCION[id], seccionId: id, label: def[1] };
        });
        chips.push({ key: "entrenamiento", seccionId: null, label: "Principales" });
        return (
          /* flexWrap (2026-08-13): estos chips no bajaban de renglón y
             con el zoom del sistema al 200% "Principales" quedaba 291px
             fuera de la pantalla. */
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
            {chips.map((c) => {
              const oculta = c.seccionId && ocultas.includes(c.seccionId);
              return (
                <div
                  key={c.key}
                  draggable={!!(al && c.seccionId)}
                  onDragStart={(e) => { if (c.seccionId) e.dataTransfer.setData("text/plain", c.seccionId); }}
                  onDragOver={(e) => { if (c.seccionId) e.preventDefault(); }}
                  onDrop={(e) => {
                    if (!c.seccionId) return;
                    e.preventDefault();
                    reordenar(e.dataTransfer.getData("text/plain"), c.seccionId);
                  }}
                  style={{ position: "relative", flex: "1 1 74px" }}
                >
                  <button
                    onClick={() => setPlanTab(c.key)}
                    style={{
                      width: "100%",
                      background: planTab === c.key ? S.white : S.card,
                      color: planTab === c.key ? S.bg : S.gray,
                      border: "1px solid " + (planTab === c.key ? S.white : S.border),
                      borderRadius: 8,
                      padding: "7px 4px",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: al && c.seccionId ? "grab" : "pointer",
                      opacity: oculta ? 0.4 : 1,
                    }}
                  >
                    {c.label}
                  </button>
                  {al && c.seccionId && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVis(c.seccionId); }}
                      title={oculta ? `Mostrar a ${al.nombre}` : `Ocultar a ${al.nombre}`}
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -4,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: oculta ? S.green : S.red,
                        color: "#fff",
                        border: "none",
                        fontSize: 14,
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      {oculta ? "+" : <X size={12} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}{" "}
      {planTab === "entrenamiento" && al && (
        <PlanesPrincipales
          key={al.id + "-" + (planFoco || "")}
          al={al}
          alumnos={alumnos}
          onUpdate={onUpdate}
          biblioteca={biblioteca}
          onGuardarBiblioteca={onGuardarBiblioteca}
          onGuardarParaTodos={(payload) => guardarParaTodos("principales", payload)}
          showToast={showToast}
          onIrPlanDia={() => { setSec("planes"); setPlanesTab("plan-dias"); }}
          initialPlanId={planFoco}
          diasModo={(rm[al.id] && rm[al.id].dias_modo) || al.rm?.dias_modo || "nombres"}
          onSetDiasModo={setDiasModo}
        />
      )}{" "}
      {planTab === "movilidad" && al && (
        <>
          {/* 2026-08-10 — bug de Lucas: "al cambiar la movilidad no
              cambia los ejercicios". El selector cambiaba SOLO la
              preferencia (rm.movilidad_default) y abajo se mostraba
              siempre la misma lista, así que parecía un filtro roto.
              Ahora las 3 versiones son 3 listas de verdad: el selector
              elige cuál se ve y se edita, y "arranca acá" es un control
              aparte — un botón, un trabajo. */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...n4Track(), justifyContent: "center" }}>
              {[["superrapida", "Superrápida"], ["corta", "Corta"], ["completa", "Completa"]].map(([id, l]) => (
                <button key={id} onClick={() => setMoviVer(id)} style={chipN4(moviVer === id)}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 14, color: S.lgray, textAlign: "center", marginTop: 6 }}>
              Estás viendo los ejercicios de la versión {moviVer === "superrapida" ? "Superrápida" : moviVer === "corta" ? "Corta" : "Completa"}.
            </div>
            <div style={{ textAlign: "center", marginTop: 8 }}>
              {(al.rm?.movilidad_default || "corta") === moviVer ? (
                <span style={{ fontSize: 13, color: S.green }}>✓ {al.nombre} arranca en esta versión</span>
              ) : (
                <button onClick={() => setMoviDefault(moviVer)} style={smallBtn(S.gray)}>
                  Que {al.nombre} arranque en esta versión
                </button>
              )}
            </div>
          </div>
          <PrepEditorAlumno
            al={al}
            id={"movilidad_" + moviVer}
            globales={prepGlobales}
            onGuardar={guardarPrepAlumno}
            onVolverGlobal={volverPrepGlobal}
            biblioteca={biblioteca}
            onGuardarBiblioteca={onGuardarBiblioteca}
            onGuardarParaTodos={(payload) => guardarParaTodos("movilidad", payload)}
          />
          <VideosMovilidadAdmin showToast={showToast} />
        </>
      )}{" "}
      {planTab === "calor" && al && (
        <PrepEditorAlumno
          al={al}
          id="calor"
          globales={prepGlobales}
          onGuardar={guardarPrepAlumno}
          onVolverGlobal={volverPrepGlobal}
          biblioteca={biblioteca}
          onGuardarBiblioteca={onGuardarBiblioteca}
          onGuardarParaTodos={(payload) => guardarParaTodos("calor", payload)}
        />
      )}{" "}
      {planTab === "activacion" && al && (
        <EjercicioEditor items={al.plan.activacion || []} onChange={(v) => updatePlan("activacion", v)} showVideo={true} biblioteca={biblioteca} onGuardarBiblioteca={onGuardarBiblioteca} onGuardarParaTodos={(payload) => guardarParaTodos("activacion", payload)} />
      )}{" "}
    </div>
  );
}
