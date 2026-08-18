import { Check, Dumbbell, Eye, Play, X } from "lucide-react";
import { deleteAlumno, saveDailyAttendance, subirMediaRehab } from "../../../services/supabase.js";
import SelectorDiasAlta from "../../components/SelectorDiasAlta.jsx";
import { calcularEdad, hoy, registroAsistencia } from "../../utils/helpers.js";
import { etiquetaVariante, varianteAPlan } from "../../utils/planVariantes.js";
import { card, inp, S, TAP } from "../../utils/theme.js";
import { Dashboard } from "../Dashboard.jsx";
import { MODALIDADES } from "./helpers.js";

// Sección "dashboard" del AdminPanel. Solo JSX: todo el estado y los
// handlers viven en AdminPanel.jsx y llegan por props (refactor 2026-08-17).
export function SeccionDashboard({
  alumnos,
  catalogoIdx,
  crearAlumno,
  DIAS_SEM,
  ejecutarConDeshacer,
  gruposVariantes,
  na,
  nc,
  ndias,
  ne,
  nfecha,
  ngenero,
  nmodalidad,
  nn,
  np,
  npin,
  nsubiendo,
  ntemplate,
  ntipo,
  nvideo,
  onUpdate,
  planVisor,
  selId,
  setForm,
  setNa,
  setNc,
  setNdias,
  setNe,
  setNfecha,
  setNgenero,
  setNmodalidad,
  setNn,
  setNp,
  setNpin,
  setNsubiendo,
  setNtipo,
  setNvideo,
  setPlanVisor,
  setSec,
  setSelId,
  setShowCatalogo,
  setShowCrearAlumno,
  showCrearAlumno,
  showToast,
}) {
  return (
    <div>
      <Dashboard
        alumnos={alumnos}
        selId={selId}
        onSelect={(id) => {
          setSelId(id);
          setSec("alumnos");
          setForm(null);
        }}
        // Auditoría 2026-07-30 — patrón de Gmail/Instagram/Mercado Libre:
        // en vez de frenar al usuario con un window.confirm() bloqueante
        // ANTES de actuar, se actúa y se ofrece "Deshacer" unos segundos.
        // Menos fricción y menos miedo, y el borrado real recién sale
        // cuando vence el plazo (ver useDeshacer en ToastDeshacer.jsx).
        onDelete={(id, nombre) => {
          const alumnoBorrado = alumnos.find((a) => a.id === id);
          const nuevos = alumnos.filter((a) => a.id !== id);
          onUpdate(nuevos);
          if (selId === id) setSelId(nuevos[0]?.id);
          ejecutarConDeshacer({
            // 2026-08-04: ya no es un borrado real (ver deleteAlumno,
            // migración 030) — el mensaje lo dice, para que quede
            // claro que se puede recuperar después desde "Archivados",
            // no solo dentro de los 6s del Deshacer.
            mensaje: `${nombre} archivado`,
            alDeshacer: () => {
              onUpdate(alumnos);
              setSelId(id);
            },
            alConfirmar: async () => {
              try {
                await deleteAlumno(id);
              } catch (e) {
                // Si la base rechaza el archivado, se repone en pantalla:
                // nunca queda "borrado" acá y vivo allá.
                console.error("[onDelete alumno]", e);
                if (alumnoBorrado) onUpdate(alumnos);
                showToast && showToast(`No se pudo archivar a ${nombre}`);
              }
            },
          });
        }}
        onNuevo={() => setShowCrearAlumno((v) => !v)}
        onBiblioteca={() => setShowCatalogo(true)}
        onDeselect={() => setSelId(null)}
        showToast={showToast}
        onToggleAsistencia={async (id, marcar) => {
          await saveDailyAttendance(id, hoy(), marcar);
          // Auditoría 2026-07-30: este toggle guardaba la fecha pelada,
          // sin hora — por eso el reporte de Asistencia mostraba "—" en
          // el horario para lo marcado desde acá. registroAsistencia()
          // arma "YYYY-MM-DD HH:mm" para hoy, igual que ya hacía el
          // auto-marcado del alumno.
          const nuevos = alumnos.map((a) => {
            if (a.id !== id) return a;
            const sinHoy = (a.asistencia || []).filter((f) => f.slice(0, 10) !== hoy());
            return { ...a, asistencia: marcar ? [...sinHoy, registroAsistencia(hoy())] : sinHoy };
          });
          onUpdate(nuevos);
          showToast && showToast(marcar ? "Asistencia marcada" : "Asistencia borrada");
        }}
      />

      {/* 2026-08-10 — BibliotecaScreen se mudó al final del render,
          fuera de este bloque. Ver el comentario allá. */}

      {/* Formulario nuevo alumno — PANTALLA APARTE (modal, ronda 9):
          antes era inline y la página quedaba larguísima */}
      {showCrearAlumno && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.65)", overflowY: "auto", padding: "24px 12px 40px" }}
          onClick={() => setShowCrearAlumno(false)}
        >
        <div onClick={(e) => e.stopPropagation()} style={{ ...card, maxWidth: 440, margin: "0 auto", background: S.bg, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: S.white, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Crear nuevo alumno</div>
            <button onClick={() => setShowCrearAlumno(false)} style={{ background: "transparent", color: S.gray, border: "none", fontSize: 18, cursor: "pointer" }}><X size={16} /></button>
          </div>
          {/* TIPO DE ALUMNO — PRIMERA DECISIÓN (2026-08-12).
              Antes estaba al final del formulario: había que completar
              y scrollear todo el alta de entrenamiento para recién ahí
              enterarse de que existía "Solo video" y ver cómo se caían
              la mitad de los campos. Elegir el tipo primero es lo que
              hace que el alta de un alumno de video sea, de verdad,
              tres campos: nombre, clave y video. */}
          <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Tipo de alumno</div>
          {/* "Solo video" (2026-08-09): el alumno entra y ve únicamente
              el video que Lucas le grabó. No lleva plan, ni días, ni
              modalidad — por eso el resto del formulario se esconde. */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 }}>
            {[[<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Dumbbell size={14} />Entrenamiento</span>, "entrenamiento"], [<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Play size={14} />Solo video</span>, "video"]].map(([l, k]) => (
              <button key={k} onClick={() => setNtipo(k)} style={{ background: ntipo === k ? S.white : S.card, color: ntipo === k ? S.bg : S.gray, border: "1px solid " + (ntipo === k ? S.white : S.border), borderRadius: 8, padding: "10px 4px", fontSize: 11, fontWeight: 700, cursor: "pointer", minHeight: TAP }}>{l}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: S.lgray, marginBottom: 14 }}>
            {ntipo === "video"
              ? "Entra y ve su video, nada más: sin días de entrenamiento, sin plan y sin planificación."
              : "Entrena: se le cargan días, plan de ejercicios y planificación."}
          </div>
          {ntipo === "video" && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 4 }}>Video de movilidad</div>
              <input
                type="file"
                accept="video/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  setNsubiendo(true);
                  try {
                    // Va al bucket privado rehab-media, el mismo que ya
                    // se usaba para media grabada con el celular.
                    setNvideo(await subirMediaRehab(f));
                    showToast && showToast("Video subido");
                  } catch (err) {
                    showToast && showToast(err.message || "No se pudo subir el video");
                  } finally { setNsubiendo(false); }
                }}
                style={{ ...inp, padding: 8 }}
              />
              <div style={{ fontSize: 11, color: nvideo ? S.green : S.lgray, marginTop: 4 }}>
                {nsubiendo ? "Subiendo..." : nvideo ? "Video cargado" : "Se puede crear sin video y subirlo después desde la ficha."}
              </div>
            </div>
          )}
          {/* 2026-08-09: el alta de un alumno "Solo video" es corta a
              propósito — nombre, clave y video. Peso, altura, email y
              fecha no aplican a alguien que solo entra a mirar. */}
          {[["Nombre completo", nn, setNn], ["Username (para login)", nc, setNc], ["Clave (4 dígitos)", npin, setNpin], ["Email", ne, setNe], ["Peso (kg)", np, setNp], ["Altura (cm)", na, setNa]]
            .filter(([label]) => ntipo !== "video" || label === "Nombre completo" || label.startsWith("Username") || label.startsWith("Clave"))
            .map(([label, val, set]) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
              {/* Auditoría 2026-07-30: Clave son 4 dígitos (entero),
                  Peso y Altura admiten coma (72,5 kg / 1,78 m). Sin
                  `inputMode` los tres abrían el teclado alfabético. */}
              <input
                type={label === "Email" ? "email" : "text"}
                inputMode={label.startsWith("Clave") ? "numeric" : (label.startsWith("Peso") || label.startsWith("Altura")) ? "decimal" : undefined}
                autoComplete="off"
                value={val}
                onChange={(e) => set(e.target.value)}
                placeholder={label === "Email" ? "para mandarle el acceso más adelante" : undefined}
                style={inp}
              />
            </div>
          ))}
          {ntipo !== "video" && (<>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 4 }}>Fecha de nacimiento</div>
            <input type="date" value={nfecha} onChange={(e) => setNfecha(e.target.value)} style={inp} />
            {nfecha && <div style={{ fontSize: 11, color: S.green, marginTop: 4 }}>Edad: {calcularEdad(nfecha)} años</div>}
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Modalidad de entrenamiento</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {MODALIDADES.map((m) => {
                const activa = nmodalidad === m;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      const nueva = activa ? "" : m;
                      setNmodalidad(nueva);
                      // Elegir con quién entrena implica que entrena.
                      if (nueva) setNtipo("entrenamiento");
                    }}
                    style={{ background: activa ? S.white : S.card2, color: activa ? S.bg : S.gray, border: "1px solid " + (activa ? S.white : S.border), borderRadius: 8, padding: "10px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left", lineHeight: 1.3 }}
                  >
                    {activa && <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}{m}
                  </button>
                );
              })}
            </div>
            {!nmodalidad && <div style={{ fontSize: 14, color: S.lgray, marginTop: 6 }}>Sin definir — tocá una para asignarla</div>}
          </div>
          {/* Género (ronda 12): pill simple M/F — define el saludo de la
              Bienvenida ("¡Bienvenido!" / "¡Bienvenida!"). Sin setear
              queda el fallback neutro de siempre. */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Género</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[["M", "Hombre"], ["F", "Mujer"]].map(([id, l]) => {
                const activa = ngenero === id;
                return (
                  <button
                    key={id}
                    onClick={() => setNgenero(activa ? "" : id)}
                    style={{ background: activa ? S.white : S.card2, color: activa ? S.bg : S.gray, border: "1px solid " + (activa ? S.white : S.border), borderRadius: 8, padding: "10px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    {activa && <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}{l}
                  </button>
                );
              })}
            </div>
          </div>
          {/* DÍAS Y PLAN DE EJERCICIOS (2026-08-12) — reclamo de Lucas:
              "no me aparecen los planes que tenemos organizados". El
              desplegable ofrecía PLANTILLAS (planTemplates.js, podado a
              2), no las rutinas reales de `plan_variantes`. Ahora lista
              las mismas variantes agrupadas por familia que el selector
              por día del panel (SelectorPlanDia) — mismos datos, mismas
              etiquetas — y arriba de todo "Sin plan", que es el
              predeterminado: crear un alumno no le impone una rutina que
              nadie eligió. */}
          <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Días de entrenamiento y plan de ejercicios</div>
          <div style={{ fontSize: 11, color: S.lgray, marginBottom: 8 }}>
            Tocá los días que entrena — a cada día le podés poner un plan distinto, o dejarlo sin plan. La progresión (series, repeticiones e intensidad por semana) se elige aparte, en Planes → Planificación.
          </div>
          <SelectorDiasAlta
            dias={DIAS_SEM}
            seleccion={ndias}
            grupos={gruposVariantes}
            onToggle={(d) => setNdias((prev) => { const n = { ...prev }; if (n[d] != null) delete n[d]; else n[d] = ntemplate; return n; })}
            onPlan={(d, valor) => setNdias((prev) => ({ ...prev, [d]: valor }))}
          />
          <div style={{ marginBottom: 14 }} />
          </>)}
          {/* Ronda 9: "Todos los planes" es un VISOR — tocar un plan abre
              una ventana con sus ejercicios explicados. El plan del
              alumno se asigna por día, arriba.
              2026-08-12: el visor también pasó a las variantes reales.
              Mostraba las 2 plantillas viejas, así que Lucas no podía
              mirar antes de asignar ninguna de las rutinas que escribió. */}
          {ntipo !== "video" && (<>
          <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Todos los planes de ejercicios</div>
          <div style={{ fontSize: 11, color: S.lgray, marginBottom: 8 }}>Tocá un plan para ver sus ejercicios con las descripciones. La asignación se hace por día, arriba.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {gruposVariantes.flatMap((g) => g.variantes).map((v) => (
              <button
                key={v.id}
                onClick={() => setPlanVisor({ nombre: v.nombre, descripcion: v.descripcion || "", plan: varianteAPlan(v, catalogoIdx || {}) })}
                title={v.descripcion || v.nombre}
                style={{ background: S.card, color: S.gray, border: "1px solid " + S.border, borderRadius: 8, padding: "10px 6px", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "left", lineHeight: 1.3 }}
              >
                {etiquetaVariante(v)} <Eye size={13} style={{ verticalAlign: "-2px" }} />
              </button>
            ))}
            {gruposVariantes.length === 0 && (
              <div style={{ gridColumn: "1 / -1", color: S.lgray, fontSize: 12 }}>Cargando los planes…</div>
            )}
          </div>
          </>)}
          <button
            onClick={async () => {
              if (nn && nc && npin) {
                if (!window.confirm(`Estás creando el alumno ${nn.trim()}. ¿Confirmar?`)) return;
              }
              const ok = await crearAlumno();
              if (ok) setShowCrearAlumno(false);
            }}
            style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 14, fontSize: 14, fontWeight: 900, cursor: "pointer" }}
          >
            CREAR ALUMNO
          </button>
        </div>
        </div>
      )}
      {/* Visor de plan (ronda 9): ejercicios del plan con descripciones */}
      {planVisor && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 210, background: "rgba(0,0,0,0.7)", overflowY: "auto", padding: "24px 12px 40px" }}
          onClick={() => setPlanVisor(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, maxWidth: 440, margin: "0 auto", background: S.bg, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ color: S.white, fontWeight: 800, fontSize: 16 }}>{planVisor.nombre}</div>
              <button onClick={() => setPlanVisor(null)} style={{ background: "transparent", color: S.gray, border: "none", fontSize: 18, cursor: "pointer" }}><X size={16} /></button>
            </div>
            {planVisor.descripcion && <div style={{ color: S.gray, fontSize: 12, marginBottom: 12 }}>{planVisor.descripcion}</div>}
            {(planVisor.plan.periodizacion || []).length > 0 && (
              <div style={{ fontSize: 11, color: S.lgray, marginBottom: 12 }}>
                Periodización: {planVisor.plan.periodizacion.length} semanas ·{" "}
                {planVisor.plan.periodizacion[0].series}x{planVisor.plan.periodizacion[0].reps} al {planVisor.plan.periodizacion[0].intensidad} →{" "}
                {planVisor.plan.periodizacion[planVisor.plan.periodizacion.length - 1].series}x{planVisor.plan.periodizacion[planVisor.plan.periodizacion.length - 1].reps} al {planVisor.plan.periodizacion[planVisor.plan.periodizacion.length - 1].intensidad}
              </div>
            )}
            {(planVisor.plan.dias || []).map((d, di) => (
              <div key={di} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14, color: S.gray, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
                  {(planVisor.plan.dias || []).length > 1 ? d.dia + " — " : ""}{d.subtitulo || "Ejercicios principales"}
                </div>
                {(d.ejercicios || []).map((ej, i) => (
                  <div key={i} style={{ background: S.card2, border: "1px solid " + S.border, borderRadius: 8, padding: "9px 12px", marginBottom: 6 }}>
                    <div style={{ color: S.white, fontWeight: 700, fontSize: 12 }}>{i + 1}. {ej.nombre}</div>
                    {ej.desc && <div style={{ color: S.gray, fontSize: 11, marginTop: 2, lineHeight: 1.45 }}>{ej.desc}</div>}
                  </div>
                ))}
              </div>
            ))}
            <button onClick={() => setPlanVisor(null)} style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 12, fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
              CERRAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
