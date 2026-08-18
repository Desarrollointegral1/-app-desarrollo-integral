import { X } from "lucide-react";
import { card, eyebrow, FONT_BODY, FONT_DISPLAY, inp, S, smallBtn, TAP, TS } from "../../utils/theme.js";
import { nivelChips } from "./piezas.jsx";

// ── Pantalla de armado ("Plan de Entrenamiento") — ronda 18 ─────────
// Pantalla DEDICADA (no un drawer sobre la Biblioteca): volver arriba,
// búsqueda + lista con ＋, y el plan en construcción con sus campos.
// Antes `const pantallaArmador = (…)` en CatalogoExplorer.
// Movido textualmente desde CatalogoExplorer.jsx (refactor 2026-08-17): solo JSX,
// todo el estado y los handlers viven en CatalogoExplorer.jsx y llegan por props.
export function PantallaArmador({
  armadorAbierto,
  carrito,
  cerrarArmador,
  grid,
  grupoPlan,
  guardandoPlan,
  guardarPlan,
  isWide,
  labelCampo,
  moverCarrito,
  nivelPlan,
  nombrePlan,
  q,
  setCarrito,
  setGrupoPlan,
  setNivelPlan,
  setNombrePlan,
  setQ,
}) {
  // ── Panel "Plan de Entrenamiento" (pantalla de armado) ──────────────
  // Ronda 18: título correcto + campos Nombre del Plan / Categoría / Nivel
  // (antes decía "Plan en construcción (N)" y solo tenía nombre y grupo).
  const planPanel = armadorAbierto && (
    <div style={{ ...card, width: isWide ? 300 : "auto", flexShrink: 0, padding: 12, display: "flex", flexDirection: "column", maxHeight: isWide ? "none" : "48vh", minHeight: 0 }}>
      <div style={{ ...eyebrow, fontSize: TS.chip, marginBottom: 8 }}>
        Plan de Entrenamiento {carrito.length > 0 ? `· ${carrito.length} ejercicio(s)` : ""}
      </div>
      <div style={labelCampo}>Nombre del Plan</div>
      <input value={nombrePlan} onChange={(e) => setNombrePlan(e.target.value)} placeholder="ej. Hipertrofia V2" style={{ ...inp, marginBottom: 8 }} />
      <div style={labelCampo}>Categoría</div>
      <input value={grupoPlan} onChange={(e) => setGrupoPlan(e.target.value)} placeholder="ej. Hipertrofia, Fuerza, Básico…" style={{ ...inp, marginBottom: 8 }} />
      <div style={labelCampo}>Nivel</div>
      <div style={{ marginBottom: 10 }}>{nivelChips(nivelPlan, setNivelPlan)}</div>
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", minHeight: 60 }}>
        {carrito.length === 0 ? (
          <div style={{ color: S.gray, fontSize: TS.body, padding: "14px 4px", lineHeight: 1.5 }}>
            Tocá ＋ en los ejercicios de la lista para ir armando el plan.
          </div>
        ) : (
          carrito.map((it, i) => (
            <div key={it.id} style={{ background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, padding: "7px 9px", marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: S.gray, fontSize: TS.chip, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0, color: S.white, fontSize: TS.ui, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {it.nombre_es}
              </span>
              <button onClick={() => moverCarrito(i, -1)} title="Subir" className="di-tap" style={{ ...smallBtn(S.gray), padding: "0 10px", minWidth: 40 }}>▲</button>
              <button onClick={() => moverCarrito(i, 1)} title="Bajar" className="di-tap" style={{ ...smallBtn(S.gray), padding: "0 10px", minWidth: 40 }}>▼</button>
              <button onClick={() => setCarrito((c) => c.filter((x) => x.id !== it.id))} title="Quitar del plan" className="di-tap" style={{ ...smallBtn(S.red), padding: "0 10px", minWidth: 40, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
            </div>
          ))
        )}
      </div>
      <button
        onClick={guardarPlan}
        disabled={guardandoPlan || carrito.length === 0 || !nombrePlan.trim()}
        className="di-tap"
        style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: 14, minHeight: TAP, fontSize: TS.ui, fontWeight: 900, letterSpacing: 0.8, cursor: "pointer", marginTop: 10, opacity: guardandoPlan || carrito.length === 0 || !nombrePlan.trim() ? 0.5 : 1, fontFamily: FONT_BODY }}
      >
        {guardandoPlan ? "GUARDANDO..." : "GUARDAR PLAN"}
      </button>
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button onClick={cerrarArmador} style={{ ...smallBtn(S.gray) }}>
          ← Volver
        </button>
        <div style={{ color: S.white, fontWeight: 800, fontSize: TS.title, lineHeight: 1, letterSpacing: 0.5, textTransform: "uppercase", flex: 1, fontFamily: FONT_DISPLAY }}>
          Plan de Entrenamiento
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: isWide ? "row" : "column", gap: isWide ? 14 : 10 }}>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ejercicios para el plan…"
            style={{ ...inp, marginBottom: 10 }}
          />
          {grid}
        </div>
        {planPanel}
      </div>
    </>
  );
}
