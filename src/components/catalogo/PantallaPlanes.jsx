import { Pencil, Trash2, X } from "lucide-react";
import { card, eyebrow, FONT_BODY, FONT_DISPLAY, inp, S, smallBtn, TAP, TS } from "../../utils/theme.js";
import { labelNivel } from "./helpers.js";
import { nivelChips } from "./piezas.jsx";

// Antes `const pantallaPlanes = (…)` en CatalogoExplorer.
// Movido textualmente desde CatalogoExplorer.jsx (refactor 2026-08-17): solo JSX,
// todo el estado y los handlers viven en CatalogoExplorer.jsx y llegan por props.
export function PantallaPlanes({
  abrirPlantilla,
  agregarEjPlantilla,
  campoVariante,
  editarVariante,
  eliminarPlantilla,
  guardandoPlantilla,
  guardarPlantilla,
  guardarVariante,
  labelCampo,
  moverEjPlantilla,
  planForm,
  planSel,
  plantillas,
  qPlanAdd,
  quitarEjPlantilla,
  setPantalla,
  setPlanForm,
  setPlanSel,
  setQPlanAdd,
  sugerenciasPlanAdd,
  variantes,
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button
          onClick={() => {
            if (planSel) { setPlanSel(null); setPlanForm(null); }
            else setPantalla("biblioteca");
          }}
          style={{ ...smallBtn(S.gray) }}
        >
          ← Volver
        </button>
        <div style={{ color: S.white, fontWeight: 800, fontSize: TS.title, lineHeight: 1, letterSpacing: 0.5, textTransform: "uppercase", flex: 1, fontFamily: FONT_DISPLAY }}>
          {planSel ? "Editar plan" : "Todos los planes"}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {!planSel ? (
          <>
          {!plantillas ? (
            <div style={{ color: S.gray, fontSize: TS.body, textAlign: "center", padding: 30 }}>Cargando planes…</div>
          ) : plantillas.length === 0 ? (
            <div style={{ ...card, padding: 24, textAlign: "center", color: S.gray, fontSize: TS.body }}>
              Todavía no hay planes guardados — crealos con "＋ Crear plan de entrenamiento".
            </div>
          ) : (
            plantillas.map((p) => (
              <div key={p.id} style={{ ...card, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => abrirPlantilla(p)}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: TS.lead, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</div>
                  <div style={{ color: S.gray, fontSize: TS.chip, marginTop: 4 }}>
                    {[p.grupo, labelNivel(p.nivel), `${(p.dias || []).reduce((n, d) => n + (d.ejercicios || []).length, 0)} ejercicio(s)`].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <button onClick={() => abrirPlantilla(p)} className="di-tap" style={{ ...smallBtn(S.white), flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6 }}><Pencil size={16} strokeWidth={2} />Editar</button>
                <button onClick={() => eliminarPlantilla(p)} title="Eliminar plan" className="di-tap" style={{ ...smallBtn(S.red), padding: "0 12px", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={18} strokeWidth={2} /></button>
              </div>
            ))
          )}

          {/* ── Planes de entrenamiento de la base (2026-08-12) ──────────
              Los que se asignan desde "Plan x día". Nombre y descripción se
              editan EN LÍNEA y se guardan al salir del campo: cambiar una
              palabra no puede costar abrir y cerrar un modal. Sin
              confirmación — es reversible; lo que sí se ve es el aviso de
              guardado. */}
          <div style={{ ...eyebrow, fontSize: TS.chip, margin: "22px 0 4px" }}>Planes de entrenamiento</div>
          <div style={{ color: S.gray, fontSize: TS.chip, marginBottom: 10 }}>
            Los que se asignan a cada día del alumno. Podés renombrarlos y cambiarles la descripción — los planes ya
            asignados siguen con el nombre que tenían.
          </div>
          {variantes === null ? (
            <div style={{ color: S.gray, fontSize: TS.body, textAlign: "center", padding: 20 }}>Cargando…</div>
          ) : variantes.length === 0 ? (
            <div style={{ ...card, padding: 20, textAlign: "center", color: S.gray, fontSize: TS.body }}>
              No hay planes de entrenamiento cargados.
            </div>
          ) : (
            variantes.map((v) => (
              <div key={v.id} style={{ ...card, padding: "12px 14px", marginBottom: 8 }}>
                <input
                  value={campoVariante(v, "nombre")}
                  onChange={(e) => editarVariante(v.id, "nombre", e.target.value)}
                  onBlur={() => guardarVariante(v, "nombre")}
                  onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                  title="Renombrar este plan"
                  style={{ ...inp, fontWeight: 700 }}
                />
                <div style={{ color: S.lgray, fontSize: TS.chip, margin: "6px 0 8px" }}>
                  {[v.familia, v.dia_ciclo ? `Día ${v.dia_ciclo}` : null, `${(v.ejercicios || []).length} ejercicio(s)`]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                <textarea
                  value={campoVariante(v, "descripcion")}
                  onChange={(e) => editarVariante(v.id, "descripcion", e.target.value)}
                  onBlur={() => guardarVariante(v, "descripcion")}
                  placeholder="Descripción — qué es este plan y para quién."
                  rows={3}
                  style={{ ...inp, minHeight: 72, resize: "vertical", lineHeight: 1.45, fontSize: TS.body }}
                />
              </div>
            ))
          )}
          </>
        ) : (
          planForm && (
            <div style={{ maxWidth: 560 }}>
              <div style={labelCampo}>Nombre del Plan</div>
              <input value={planForm.nombre} onChange={(e) => setPlanForm((f) => ({ ...f, nombre: e.target.value }))} style={{ ...inp, marginBottom: 8 }} />
              <div style={labelCampo}>Categoría</div>
              <input value={planForm.grupo} onChange={(e) => setPlanForm((f) => ({ ...f, grupo: e.target.value }))} placeholder="ej. Hipertrofia, Fuerza, Básico…" style={{ ...inp, marginBottom: 8 }} />
              <div style={labelCampo}>Nivel</div>
              <div style={{ marginBottom: 12 }}>{nivelChips(planForm.nivel, (v) => setPlanForm((f) => ({ ...f, nivel: v })))}</div>
              {planForm.dias.map((d, di) => (
                <div key={di} style={{ ...card, padding: 12, marginBottom: 10 }}>
                  {planForm.dias.length > 1 && <div style={{ ...eyebrow, fontSize: TS.chip, marginBottom: 8 }}>{d.dia || `Día ${di + 1}`}</div>}
                  {(d.ejercicios || []).length === 0 && (
                    <div style={{ color: S.gray, fontSize: TS.body, padding: "6px 2px" }}>Sin ejercicios en este día.</div>
                  )}
                  {(d.ejercicios || []).map((ej, i) => (
                    <div key={ej.id || i} style={{ background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, padding: "7px 9px", marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ color: S.gray, fontSize: TS.chip, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0, color: S.white, fontSize: TS.ui, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ej.nombre}</span>
                      <button onClick={() => moverEjPlantilla(di, i, -1)} title="Subir" className="di-tap" style={{ ...smallBtn(S.gray), padding: "0 10px", minWidth: 40 }}>▲</button>
                      <button onClick={() => moverEjPlantilla(di, i, 1)} title="Bajar" className="di-tap" style={{ ...smallBtn(S.gray), padding: "0 10px", minWidth: 40 }}>▼</button>
                      <button onClick={() => quitarEjPlantilla(di, i)} title="Quitar" className="di-tap" style={{ ...smallBtn(S.red), padding: "0 10px", minWidth: 40, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ ...card, padding: 12, marginBottom: 12 }}>
                <div style={{ ...eyebrow, fontSize: TS.chip, marginBottom: 8 }}>Agregar ejercicio</div>
                <input value={qPlanAdd} onChange={(e) => setQPlanAdd(e.target.value)} placeholder="Buscar en el catálogo…" style={inp} />
                {sugerenciasPlanAdd.map((e) => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", borderBottom: "1px solid " + S.border }}>
                    <span style={{ flex: 1, minWidth: 0, color: S.white, fontSize: TS.ui, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {e.nombre_es}{e.codigo_di ? <span style={{ color: S.lgray }}>{" · " + e.codigo_di}</span> : ""}
                    </span>
                    <button onClick={() => agregarEjPlantilla(e)} title="Agregar al plan" className="di-tap" style={{ ...smallBtn(S.white), padding: "0 14px" }}>＋</button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button onClick={() => { setPlanSel(null); setPlanForm(null); }} className="di-tap" style={{ ...smallBtn(S.gray), padding: "12px 18px" }}>
                  Cancelar
                </button>
                <button
                  onClick={guardarPlantilla}
                  disabled={guardandoPlantilla}
                  className="di-tap"
                  style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: 13, minHeight: TAP, fontSize: TS.ui, fontWeight: 900, cursor: "pointer", opacity: guardandoPlantilla ? 0.6 : 1, fontFamily: FONT_BODY }}
                >
                  {guardandoPlantilla ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}
