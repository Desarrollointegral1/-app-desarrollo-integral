import { X } from "lucide-react";
import { card, eyebrow, FONT_BODY, FONT_DISPLAY, inp, S, smallBtn, TAP, TS } from "../../utils/theme.js";
import { NIVELES as NIVELES_PER, nivelLabel, objetivoLabel, OBJETIVOS as OBJETIVOS_PER } from "../../utils/periodizacion.js";

// ── PERIODIZACIÓN: los PREDETERMINADOS globales (2026-08-10) ────────
// Pedido de Lucas: "lo tendría que poder cambiar el predeterminado desde la
// biblioteca de ejercicios, después también debería poder personalizar el de
// cada alumno si quiero". Las 8 tablas (4 objetivos × 2 niveles) se editan
// acá; la del alumno se sigue editando en su ficha, igual que antes.
//
// Las semanas se editan en línea (sin modal): son 3 campos por fila y Lucas
// va a llenar a mano las 6 tablas que faltan, así que tiene que poder pasar
// de campo en campo sin abrir y cerrar nada.
// Antes `const pantallaPeriodizacion = (…)` en CatalogoExplorer.
// Movido textualmente desde CatalogoExplorer.jsx (refactor 2026-08-17): solo JSX,
// todo el estado y los handlers viven en CatalogoExplorer.jsx y llegan por props.
export function PantallaPeriodizacion({
  agregarSemana,
  guardandoPer,
  guardarNombrePer,
  guardarPer,
  perNiv,
  perNombreVisible,
  perObj,
  perSemanas,
  quitarSemana,
  setPantalla,
  setPerCampo,
  setPerNiv,
  setPerNombreDraft,
  setPerObj,
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button onClick={() => setPantalla("biblioteca")} style={{ ...smallBtn(S.gray) }}>← Volver</button>
        <div style={{ color: S.white, fontWeight: 800, fontSize: TS.title, lineHeight: 1, letterSpacing: 0.5, textTransform: "uppercase", flex: 1, fontFamily: FONT_DISPLAY }}>
          Periodizaciones
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ ...card, padding: "10px 14px", marginBottom: 10, color: S.gray, fontSize: TS.body }}>
          Estas son las tablas con las que arranca cada alumno según su objetivo y su nivel.
          El alumno que tenga una periodización propia (editada desde su ficha) no se pisa: sigue con la suya.
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {/* setPerNombreDraft(null) al cambiar de fila: si no, el texto a
              medio escribir de una planificación se vería sobre otra. */}
          {OBJETIVOS_PER.map((o) => (
            <button key={o.id} onClick={() => { setPerObj(o.id); setPerNombreDraft(null); }} className="di-tap" style={{ ...smallBtn(perObj === o.id ? S.white : S.gray) }}>
              {o.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {NIVELES_PER.map((n) => (
            <button key={n.id} onClick={() => { setPerNiv(n.id); setPerNombreDraft(null); }} className="di-tap" style={{ ...smallBtn(perNiv === n.id ? S.white : S.gray) }}>
              {n.label}
            </button>
          ))}
        </div>
        <div style={{ maxWidth: 560 }}>
          <div style={{ ...card, padding: 12, marginBottom: 10 }}>
            {/* 2026-08-12: el título es un campo. Se escribe encima y se
                guarda al salir del campo — un renombre es cambiar una palabra,
                no vale abrir un modal para eso. */}
            <input
              value={perNombreVisible}
              onChange={(e) => setPerNombreDraft(e.target.value)}
              onBlur={guardarNombrePer}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              title="Renombrar esta planificación"
              style={{ ...inp, marginBottom: 6, fontWeight: 800 }}
            />
            <div style={{ ...eyebrow, fontSize: TS.chip, marginBottom: 8 }}>
              {objetivoLabel(perObj)} · {nivelLabel(perNiv)} · {perSemanas.length} semana(s)
            </div>
            <div style={{ display: "flex", gap: 6, color: S.lgray, fontSize: TS.chip, fontWeight: 800, padding: "0 2px 6px" }}>
              <span style={{ width: 26, flexShrink: 0 }}>#</span>
              <span style={{ flex: 1, minWidth: 0 }}>SERIES</span>
              <span style={{ flex: 1, minWidth: 0 }}>REPS</span>
              <span style={{ flex: 1, minWidth: 0 }}>INTENSIDAD</span>
              <span style={{ width: 40, flexShrink: 0 }} />
            </div>
            {perSemanas.length === 0 && (
              <div style={{ color: S.gray, fontSize: TS.body, padding: "6px 2px" }}>
                Sin semanas cargadas — agregá la primera con “＋ Agregar semana”.
              </div>
            )}
            {perSemanas.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ width: 26, flexShrink: 0, color: S.gray, fontSize: TS.chip, fontWeight: 800 }}>{i + 1}</span>
                <input
                  value={String(s.series ?? "")}
                  onChange={(e) => setPerCampo(i, "series", e.target.value)}
                  inputMode="numeric"
                  style={{ ...inp, flex: 1, minWidth: 0 }}
                />
                <input
                  value={String(s.reps ?? "")}
                  onChange={(e) => setPerCampo(i, "reps", e.target.value)}
                  inputMode="numeric"
                  placeholder="8"
                  style={{ ...inp, flex: 1, minWidth: 0 }}
                />
                <input
                  value={String(s.intensidad ?? "")}
                  onChange={(e) => setPerCampo(i, "intensidad", e.target.value)}
                  placeholder="75%"
                  style={{ ...inp, flex: 1, minWidth: 0 }}
                />
                <button onClick={() => quitarSemana(i)} title="Quitar semana" className="di-tap" style={{ ...smallBtn(S.red), padding: "0 8px", minWidth: 40, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            ))}
            <button onClick={agregarSemana} className="di-tap" style={{ ...smallBtn(S.white), width: "100%", marginTop: 6 }}>
              ＋ Agregar semana
            </button>
          </div>
          <button
            onClick={guardarPer}
            disabled={guardandoPer}
            className="di-tap"
            style={{ width: "100%", marginBottom: 20, background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: 13, minHeight: TAP, fontSize: TS.ui, fontWeight: 900, cursor: "pointer", opacity: guardandoPer ? 0.6 : 1, fontFamily: FONT_BODY }}
          >
            {guardandoPer ? "GUARDANDO..." : "GUARDAR PREDETERMINADO"}
          </button>
        </div>
      </div>
    </>
  );
}
