import { ChevronRight, Dumbbell, X } from "lucide-react";
import { card, eyebrow, FONT_BODY, FONT_DISPLAY, inp, S, smallBtn, TAP, TS } from "../../utils/theme.js";
import { PREP_LISTAS } from "../../utils/preparacion.js";

// ── PREPARACIÓN: los PREDETERMINADOS globales (2026-08-10) ──────────
// Pedido de Lucas: "en biblioteca de ejercicios en la parte de planes de
// entrenamiento tengo que tener una parte de entrada en calor y otra de
// movilidad para poder editar esas también". Lo que se edita acá es el
// NIVEL 1 (app_config, claves prep_*): la lista con la que arranca todo
// alumno que no tenga la suya propia. Mismo editor de lista que las
// plantillas de plan (buscar en el catálogo · ＋ · ▲▼ · ✕) — no se
// inventa un editor nuevo.
//
// Los ejercicios se guardan con {nombre, desc}: el nombre es la clave con
// la que ejerciciosMedia.js resuelve la imagen, así que se copia tal cual
// viene del catálogo y no se toca en ningún paso.
// Antes `const pantallaPreparacion = (…)` en CatalogoExplorer.
// Movido textualmente desde CatalogoExplorer.jsx (refactor 2026-08-17): solo JSX,
// todo el estado y los handlers viven en CatalogoExplorer.jsx y llegan por props.
export function PantallaPreparacion({
  agregarPrep,
  cat,
  guardandoPrep,
  guardarPrep,
  moverPrep,
  onAbrirPropia,
  prepLista,
  prepSel,
  qPrepAdd,
  quitarPrep,
  setPantalla,
  setPrepSel,
  setQPrepAdd,
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button onClick={() => setPantalla("biblioteca")} style={{ ...smallBtn(S.gray) }}>← Volver</button>
        <div style={{ color: S.white, fontWeight: 800, fontSize: TS.title, lineHeight: 1, letterSpacing: 0.5, textTransform: "uppercase", flex: 1, fontFamily: FONT_DISPLAY }}>
          Preparación (predeterminados)
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ ...card, padding: "10px 14px", marginBottom: 10, color: S.gray, fontSize: TS.body }}>
          Estas son las listas con las que arrancan TODOS los alumnos. El alumno que tenga
          una lista propia (editada desde su ficha) no se pisa: sigue con la suya.
        </div>
        {/* 2026-08-10: única entrada a la biblioteca de rutinas propias (antes
            duplicaba a este mismo botón desde la pantalla anterior). Vive acá
            porque es el mismo tema: movilidad, elástico y entrada en calor. */}
        {onAbrirPropia && (
          <button
            onClick={onAbrirPropia}
            className="di-tap"
            title="Abre la biblioteca de rutinas propias (otra lista, no el catálogo de 1.343 ejercicios)"
            style={{ ...card, width: "100%", marginBottom: 12, padding: "12px 14px", minHeight: TAP, cursor: "pointer", fontFamily: FONT_BODY, display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}
          >
            <Dumbbell size={20} strokeWidth={2} color={S.white} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ ...eyebrow, display: "block" }}>Rutinas propias</span>
              <span style={{ display: "block", color: S.white, fontSize: TS.ui, fontWeight: 700, marginTop: 2 }}>
                Editar los ejercicios uno por uno (videos, GIFs, códigos)
              </span>
            </span>
            <ChevronRight size={18} strokeWidth={2} color={S.gray} style={{ flexShrink: 0 }} />
          </button>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {PREP_LISTAS.map((l) => (
            <button
              key={l.id}
              onClick={() => setPrepSel(l.id)}
              className="di-tap"
              style={{ ...smallBtn(prepSel === l.id ? S.white : S.gray) }}
            >
              {l.grupo === "movilidad" ? `Movilidad · ${l.label}` : l.label}
            </button>
          ))}
        </div>
        {(() => {
          const lista = prepLista(prepSel);
          const sugerencias = qPrepAdd.trim().length >= 2 && cat
            ? cat.filter((e) => !e.archivado && `${e.nombre_es} ${e.codigo_di || ""}`.toLowerCase().includes(qPrepAdd.trim().toLowerCase())).slice(0, 8)
            : [];
          return (
            <div style={{ maxWidth: 560 }}>
              <div style={{ ...card, padding: 12, marginBottom: 10 }}>
                {lista.length === 0 && <div style={{ color: S.gray, fontSize: TS.body, padding: "6px 2px" }}>Lista vacía.</div>}
                {lista.map((ej, i) => (
                  <div key={i} style={{ background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, padding: "7px 9px", marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ color: S.gray, fontSize: TS.chip, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, color: S.white, fontSize: TS.ui, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ej.nombre}</span>
                    <button onClick={() => moverPrep(i, -1)} title="Subir" className="di-tap" style={{ ...smallBtn(S.gray), padding: "0 10px", minWidth: 40 }}>▲</button>
                    <button onClick={() => moverPrep(i, 1)} title="Bajar" className="di-tap" style={{ ...smallBtn(S.gray), padding: "0 10px", minWidth: 40 }}>▼</button>
                    <button onClick={() => quitarPrep(i)} title="Quitar" className="di-tap" style={{ ...smallBtn(S.red), padding: "0 10px", minWidth: 40, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
                  </div>
                ))}
              </div>
              <div style={{ ...card, padding: 12, marginBottom: 12 }}>
                <div style={{ ...eyebrow, fontSize: TS.chip, marginBottom: 8 }}>Agregar ejercicio</div>
                <input value={qPrepAdd} onChange={(e) => setQPrepAdd(e.target.value)} placeholder="Buscar en el catálogo…" style={inp} />
                {sugerencias.map((e) => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", borderBottom: "1px solid " + S.border }}>
                    <span style={{ flex: 1, minWidth: 0, color: S.white, fontSize: TS.ui, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {e.nombre_es}{e.codigo_di ? <span style={{ color: S.lgray }}>{" · " + e.codigo_di}</span> : ""}
                    </span>
                    <button onClick={() => agregarPrep(e)} title="Agregar" className="di-tap" style={{ ...smallBtn(S.white), padding: "0 14px" }}>＋</button>
                  </div>
                ))}
              </div>
              <button
                onClick={guardarPrep}
                disabled={guardandoPrep}
                className="di-tap"
                style={{ width: "100%", marginBottom: 20, background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: 13, minHeight: TAP, fontSize: TS.ui, fontWeight: 900, cursor: "pointer", opacity: guardandoPrep ? 0.6 : 1, fontFamily: FONT_BODY }}
              >
                {guardandoPrep ? "GUARDANDO..." : "GUARDAR PREDETERMINADO"}
              </button>
            </div>
          );
        })()}
      </div>
    </>
  );
}
