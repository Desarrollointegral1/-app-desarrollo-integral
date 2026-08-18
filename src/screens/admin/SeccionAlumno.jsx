import { Check, Pencil, Play, Target, Trash2 } from "lucide-react";
import { cambiarPINAlumno, cargarPlanesXDia, guardarFotoAlumno, subirMediaRehab } from "../../../services/supabase.js";
import { FotoAlumno } from "../../components/FotoAlumno.jsx";
import { calcularEdad } from "../../utils/helpers.js";
import { card, inp, S, smallBtn, TAP, TS } from "../../utils/theme.js";
import { AsignarPlanModal } from "../AsignarPlanModal.jsx";
import { MODALIDADES, modalidadLabel } from "./helpers.js";

// Sección "alumnos" del AdminPanel. Solo JSX: todo el estado y los
// handlers viven en AdminPanel.jsx y llegan por props (refactor 2026-08-17).
export function SeccionAlumno({
  al,
  alumnos,
  biblioteca,
  DIAS_SEM,
  editPin,
  eliminarAlumno,
  form,
  guardarParaTodos,
  nsubiendo,
  onGuardarBiblioteca,
  onUpdate,
  saveEdit,
  setEditPin,
  setForm,
  setNsubiendo,
  setPlanesTab,
  setPlanFoco,
  setPlanTab,
  setSec,
  setSelectedDia,
  setShowAsignarPlan,
  showAsignarPlan,
  showToast,
  startEdit,
}) {
  return (
    <div>
      {/* Ronda 9: sin fila "← Volver · nombre" ni tab Diario — queda
          solo el Perfil (el diario vive en Reportes → Asistencia) */}
      {(<>
        {form ? (
          <div style={{ ...card, padding: 16 }}>
            <div style={{ color: S.white, fontWeight: 700, marginBottom: 14 }}>Editar alumno</div>
            {[
              ["Nombre", form.nombre, "nombre"],
              ["Username (login)", form.codigo, "codigo"],
              ["Email", form.email, "email"],
              ["Peso", form.peso, "peso"],
              ["Altura", form.altura, "altura"],
            ].map(([label, val, key]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: S.gray, marginBottom: 4, textTransform: "uppercase" }}>{label}</div>
                {/* Auditoría 2026-07-30: peso y altura son numéricos con
                    coma → teclado decimal en el celular. */}
                <input
                  type={key === "email" ? "email" : "text"}
                  inputMode={key === "peso" || key === "altura" ? "decimal" : undefined}
                  autoComplete="off"
                  placeholder={key === "email" ? "para mandarle el acceso más adelante" : undefined}
                  value={val || ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: key === "codigo" ? e.target.value.toUpperCase() : e.target.value }))}
                  style={inp}
                />
              </div>
            ))}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: S.gray, marginBottom: 4, textTransform: "uppercase" }}>Fecha de nacimiento</div>
              <input type="date" value={form.fecha_nacimiento || ""} onChange={(e) => setForm((f) => ({ ...f, fecha_nacimiento: e.target.value }))} style={inp} />
              {form.fecha_nacimiento && <div style={{ fontSize: 11, color: S.green, marginTop: 4 }}>Edad: {calcularEdad(form.fecha_nacimiento)} años</div>}
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: S.gray, marginBottom: 8, textTransform: "uppercase" }}>Modalidad de entrenamiento</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {/* 2026-07-30: a las 4 categorías se les suma, si hace
                    falta, la modalidad vieja que este alumno ya tenía y
                    no tiene equivalente (ej. "A distancia"). Se muestra
                    y se puede desmarcar — no se borra sola. */}
                {[
                  ...MODALIDADES,
                  ...(form.modalidad && !MODALIDADES.includes(form.modalidad) ? [form.modalidad] : []),
                ].map((m) => {
                  const activa = (form.modalidad || "") === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setForm((f) => ({ ...f, modalidad: activa ? "" : m }))}
                      style={{ background: activa ? S.white : S.card2, color: activa ? S.bg : S.gray, border: "1px solid " + (activa ? S.white : S.border), borderRadius: 8, padding: "10px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left", lineHeight: 1.3 }}
                    >
                      {activa && <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}{m}
                    </button>
                  );
                })}
              </div>
              {!form.modalidad && <div style={{ fontSize: 14, color: S.lgray, marginTop: 6 }}>Sin definir — tocá una para asignarla</div>}
            </div>

            {/* Género (ronda 12): define el saludo de la Bienvenida */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: S.gray, marginBottom: 8, textTransform: "uppercase" }}>Género</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[["M", "Hombre"], ["F", "Mujer"]].map(([id, l]) => {
                  const activa = (form.genero || "") === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setForm((f) => ({ ...f, genero: activa ? "" : id }))}
                      style={{ background: activa ? S.white : S.card2, color: activa ? S.bg : S.gray, border: "1px solid " + (activa ? S.white : S.border), borderRadius: 8, padding: "10px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      {activa && <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}{l}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cambiar clave */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: S.gray, marginBottom: 4, textTransform: "uppercase" }}>Nueva clave (4 dígitos — dejá vacío para no cambiar)</div>
              {/* Auditoría 2026-07-30: la clave son 4 dígitos — mismo
                  criterio que el PIN del login, teclado numérico. */}
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                value={editPin}
                onChange={(e) => setEditPin(e.target.value.slice(0, 4))}
                placeholder="····"
                maxLength={4}
                style={inp}
              />
              {editPin.length > 0 && editPin.length < 4 && <div style={{ fontSize: 11, color: S.red, marginTop: 4 }}>La clave debe ser de 4 dígitos</div>}
              {editPin.length === 4 && <div style={{ fontSize: 11, color: S.green, marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={12} />Nueva clave lista para guardar</div>}
            </div>

            {/* Solo video (2026-08-09): marcar acá cambia la pantalla que
                ve el alumno al entrar — pasa a ver únicamente su video de
                movilidad, sin menú ni plan. */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: S.gray, marginBottom: 8, textTransform: "uppercase" }}>Pantalla del alumno</div>
              <button
                onClick={() => setForm((f) => ({ ...f, tipo: f.tipo === "video" ? "entrenamiento" : "video" }))}
                style={{ width: "100%", background: form.tipo === "video" ? S.white : S.card2, color: form.tipo === "video" ? S.bg : S.gray, border: "1px solid " + (form.tipo === "video" ? S.white : S.border), borderRadius: 8, padding: "10px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left" }}
              >
                {form.tipo === "video" ? <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} /> : <Play size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}
                Solo video (entra y ve nada más que su video)
              </button>
              {form.tipo === "video" && (
                <div style={{ marginTop: 8 }}>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setNsubiendo(true);
                      try {
                        // 2026-08-12: el input NO se limpia antes de
                        // subir. En Android el File es un puntero al
                        // archivo de la Galería y soltarlo antes de
                        // tiempo deja al navegador sin poder leerlo: la
                        // subida se caía sin llegar nunca al servidor
                        // (así se perdieron los 3 intentos del video de
                        // Ángel). Se limpia recién al final, cuando el
                        // archivo ya está leído y subido.
                        // 2026-08-13: el aviso de "pesa mucho" llega por
                        // callback y se muestra ANTES de que termine la
                        // subida — es el único momento en que Lucas
                        // todavía puede elegir otro archivo.
                        const path = await subirMediaRehab(f, (m) => showToast && showToast(m));
                        setForm((prev) => ({ ...prev, video_movilidad: path }));
                        showToast && showToast("Video subido — acordate de Guardar");
                      } catch (err) {
                        showToast && showToast(err.message || "No se pudo subir el video");
                      } finally { setNsubiendo(false); e.target.value = ""; }
                    }}
                    style={{ ...inp, padding: 8 }}
                  />
                  <div style={{ fontSize: 11, color: form.video_movilidad ? S.green : S.lgray, marginTop: 4 }}>
                    {nsubiendo ? "Subiendo..." : form.video_movilidad ? "Video cargado" : "Todavía sin video — el alumno ve un mensaje explicándolo."}
                  </div>
                </div>
              )}
            </div>

            {/* Solo días de entrenamiento — sin hora del día (pedido de Lucas 2026-07-20).
                2026-08-12: no se muestran para un alumno "solo video" —
                "los que son solo video no importa el día de
                entrenamiento". Marcar días ahí no cambiaba nada de lo
                que ve el alumno, pero después aparecían en su ficha
                como si entrenara. */}
            {form.tipo !== "video" && (<>
            <div style={{ fontSize: 11, color: S.gray, marginBottom: 8, textTransform: "uppercase" }}>Días de entrenamiento</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {DIAS_SEM.map((d) => {
                const activo = (form.horarios || []).some((h) => h.dia === d);
                return (
                  <button
                    key={d}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        horarios: activo
                          ? (f.horarios || []).filter((h) => h.dia !== d)
                          : [...(f.horarios || []), { dia: d, hora: "" }],
                      }))
                    }
                    style={{ background: activo ? S.white : S.card2, color: activo ? S.bg : S.gray, border: "1px solid " + (activo ? S.white : S.border), borderRadius: 6, padding: "8px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    {activo && <Check size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />}{d}
                  </button>
                );
              })}
            </div>
            </>)}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={async () => {
                  saveEdit();
                  if (editPin.length === 4) {
                    const ok = await cambiarPINAlumno(al.id, editPin);
                    showToast && showToast(ok ? "Clave actualizada" : "Error al cambiar la clave");
                    setEditPin("");
                  }
                }}
                style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 12, fontWeight: 900, cursor: "pointer" }}
              >GUARDAR</button>
              <button onClick={() => { setForm(null); setEditPin(""); }} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 8, padding: "12px 16px", cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div style={{ ...card, padding: "14px 16px" }}>
            {/* 2026-08-13: el nombre no tenía `minWidth:0`, así que no
                podía encogerse: quedaba pegado al botón Editar (0px de
                aire) y empujaba la fila 2px fuera de la pantalla en
                375px. Con `flex:1, minWidth:0` el nombre usa el ancho
                que hay, envuelve, y los botones ya no salen del borde. */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 0 }}>
                <FotoAlumno foto={al.foto} size={52} editable onFoto={(foto) => { guardarFotoAlumno(al.id, foto); onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, foto } : a))); }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 16 }}>{al.nombre}</div>
                  <div style={{ color: S.gray, fontSize: 12, marginTop: 2 }}>@{al.username || al.codigo}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={startEdit} style={smallBtn(S.white)}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Pencil size={13} />Editar</span></button>
                <button onClick={eliminarAlumno} style={smallBtn(S.red)}><Trash2 size={16} /></button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[["Peso", al.peso], ["Altura", al.altura], ["Edad", calcularEdad(al.fecha_nacimiento) || al.edad]].map(([l, v]) => (
                <div key={l} style={{ flex: 1, background: S.card2, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>{v || "—"}</div>
                  <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1 }}>{l}</div>
                </div>
              ))}
            </div>
            {/* 2026-07-30: se sacó el botón "Evaluar" de acá. Arriba de
                esta misma pantalla ya está el tab "Evaluación", que
                lleva exactamente al mismo lugar (sec="evaluacion") —
                dos entradas al mismo módulo en la misma pantalla. Queda
                el TAB porque es navegación persistente: está siempre a
                la vista, en cualquier sección del alumno, no solo con
                la ficha abierta. */}
            {al.modalidad && (
              <div style={{ marginBottom: 10 }}>
                <span style={{ background: S.card2, border: "1px solid " + S.border, borderRadius: 20, padding: "4px 12px", fontSize: 15, color: S.white, fontWeight: 600 }}>
                  {modalidadLabel(al.modalidad)}
                </span>
              </div>
            )}
            {/* Días de entrenamiento — 2026-07-30: eran texto muerto.
                Ahora cada día es un link al plan de ESE día, con el
                mismo salto que ya usan las filas de "Planes asignados"
                de abajo (planFoco + planTab + sec="plan"). Si el día no
                tiene plan todavía, en vez de no hacer nada lleva a
                Planificación → Plan x día con el día ya elegido, que es
                donde se le asigna uno.
                2026-08-12: para el alumno "solo video" no se muestran ni
                los días ni los planes asignados — no entrena, así que
                todo eso era ruido que además invitaba a clickear hacia
                pantallas que no le aplican. En su lugar va una línea que
                dice qué es este alumno. */}
            {al.tipo === "video" ? (
              <div style={{ fontSize: 12, color: S.lgray, lineHeight: 1.5 }}>
                Alumno de solo video: entra y ve su video, nada más. Sin días de entrenamiento, sin plan de ejercicios y sin planificación.
              </div>
            ) : (<>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(al.horarios || []).filter((h) => h.dia).map((h, i) => {
                const planDelDia = (al.planes || []).find((p) => p.dia_semana === h.dia);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (planDelDia) {
                        setPlanFoco(planDelDia.id || null);
                        setPlanTab("entrenamiento");
                        setSec("plan");
                      } else {
                        setSelectedDia(h.dia);
                        setPlanesTab("plan-dias");
                        setSec("planes");
                      }
                      setForm(null);
                    }}
                    title={planDelDia ? `Ver el plan de ${h.dia}` : `Asignarle un plan a ${h.dia}`}
                    style={{
                      minHeight: TAP,
                      background: S.card2,
                      border: "1px solid " + (planDelDia ? S.border2 : S.border),
                      borderRadius: 8,
                      padding: "0 14px",
                      fontSize: TS.chip,
                      color: S.white,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {h.dia}
                    <span style={{ color: S.gray }}>›</span>
                  </button>
                );
              })}
            </div>

            {/* Planes REALES asignados (plan por día), con el de hoy marcado.
                Antes acá había un "bilateral/unilateral" hardcodeado. */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid " + S.border }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", letterSpacing: 1 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Target size={13} />Planes asignados</span>
                </div>
                {/* Punto 6: la asignación de un plan predeterminado a
                    este alumno vive acá, separada del Armador (que
                    solo crea/edita plantillas). */}
                <button onClick={() => setShowAsignarPlan(true)} style={smallBtn(S.white)}>
                  ＋ Asignar plan
                </button>
              </div>
              {(al.planes || []).length === 0 ? (
                <div style={{ fontSize: 12, color: S.lgray }}>
                  Sin planes asignados — asignalos en Plan → Plan Día
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(al.planes || []).map((p, i) => {
                    const diaHoy = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"][new Date().getDay()];
                    const esHoy = p.dia_semana === diaHoy || (p.dia_semana === "Fijo" && !(al.planes || []).some((x) => x.dia_semana === diaHoy));
                    return (
                      <div
                        key={p.id || i}
                        onClick={() => {
                          // Ronda 7: tocar un plan abre el menú Plan con ESE plan listo para editar
                          setPlanFoco(p.id || null);
                          setPlanTab("entrenamiento");
                          setSec("plan");
                        }}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: S.card2, border: "1px solid " + (esHoy ? S.green : S.border), borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}
                      >
                        <div>
                          <div style={{ color: S.white, fontWeight: 700, fontSize: 12 }}>{p.nombre || "Plan sin nombre"}</div>
                          <div style={{ color: S.gray, fontSize: 14, marginTop: 1 }}>{p.dia_semana || "Fijo"}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {esHoy && <span style={{ color: S.green, fontSize: 14, fontWeight: 700 }}>● HOY</span>}
                          <span style={{ color: S.gray, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 3 }}><Pencil size={12} /> ›</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ fontSize: 14, color: S.lgray, marginTop: 8 }}>Tocá un plan para editarlo · para reemplazarlos: Planes → Plan de ejercicios</div>
            </div>
            </>)}
            {showAsignarPlan && (
              <AsignarPlanModal
                al={al}
                biblioteca={biblioteca}
                onGuardarBiblioteca={onGuardarBiblioteca}
                onGuardarParaTodos={(payload) => guardarParaTodos("principales", payload)}
                showToast={showToast}
                onClose={() => setShowAsignarPlan(false)}
                onAsignado={async () => {
                  setShowAsignarPlan(false);
                  const planesFrescos = await cargarPlanesXDia(al.id, al);
                  onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, planes: planesFrescos } : a)));
                  showToast && showToast("Plan asignado");
                }}
              />
            )}
          </div>
        )}
      </>)}
    </div>
  );
}
