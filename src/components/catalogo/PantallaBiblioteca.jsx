import { BookOpen, CalendarRange, FolderTree, Move, X } from "lucide-react";
import { FONT_BODY, FONT_DISPLAY, S, smallBtn, TAP, TS } from "../../utils/theme.js";

// ── Pantalla Biblioteca (default) ───────────────────────────────────
// Antes `const pantallaBiblioteca = (…)` en CatalogoExplorer.
// Movido textualmente desde CatalogoExplorer.jsx (refactor 2026-08-17): solo JSX,
// todo el estado y los handlers viven en CatalogoExplorer.jsx y llegan por props.
export function PantallaBiblioteca({
  abrirNuevo,
  grid,
  isWide,
  mostrarFiltros,
  navPropia,
  onClose,
  setMostrarFiltros,
  setPantalla,
  sidebar,
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {/* minWidth:0 (2026-08-10): sin esto el título no baja de su
            min-content y empujaba el botón "Cerrar" 13px fuera de la pantalla
            en 375px — medido con dev/medir-mobile. */}
        <div style={{ color: S.white, fontWeight: 800, fontSize: TS.title, lineHeight: 1, letterSpacing: 0.5, textTransform: "uppercase", flex: 1, minWidth: 0, fontFamily: FONT_DISPLAY }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><BookOpen size={24} strokeWidth={2} />Biblioteca de ejercicios</span>
        </div>
        {!isWide && (
          <button onClick={() => setMostrarFiltros((v) => !v)} className="di-tap" style={{ ...smallBtn(S.gray) }}>
            {mostrarFiltros ? "Ocultar filtros" : "Filtros"}
          </button>
        )}
        <button onClick={onClose} className="di-tap" style={{ ...smallBtn(S.gray), display: "inline-flex", alignItems: "center", gap: 6 }}><X size={16} strokeWidth={2} />Cerrar</button>
      </div>
      {/* Ronda 18: barra de ACCIONES principal — los botones de crear
          salieron del panel de filtros y viven acá arriba, junto con
          "Ver todos los planes". */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <button
          onClick={abrirNuevo}
          className="di-tap"
          style={{ flex: "1 1 180px", minWidth: 0, background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY }}
        >
          ＋ Crear ejercicio nuevo
        </button>
        <button
          onClick={() => setPantalla("armador")}
          className="di-tap"
          style={{ flex: "1 1 180px", minWidth: 0, background: S.card3, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY }}
        >
          ＋ Crear plan de entrenamiento
        </button>
        <button
          onClick={() => setPantalla("planes")}
          className="di-tap"
          style={{ flex: "1 1 180px", minWidth: 0, background: S.card3, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <FolderTree size={16} strokeWidth={2} />Ver todos los planes
        </button>
        {/* 2026-08-10, pedido de Lucas: la movilidad (3 versiones) y la
            entrada en calor también se editan acá, no solo alumno por alumno. */}
        <button
          onClick={() => setPantalla("preparacion")}
          className="di-tap"
          style={{ flex: "1 1 180px", minWidth: 0, background: S.card3, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Move size={16} strokeWidth={2} />Movilidad y entrada en calor
        </button>
        {/* 2026-08-10, pedido de Lucas: "lo tendría que poder cambiar el
            predeterminado desde la biblioteca de ejercicios". */}
        <button
          onClick={() => setPantalla("periodizacion")}
          className="di-tap"
          style={{ flex: "1 1 180px", minWidth: 0, background: S.card3, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <CalendarRange size={16} strokeWidth={2} />Periodizaciones
        </button>
      </div>
      {navPropia}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: isWide ? "row" : "column", gap: isWide ? 14 : 10 }}>
        {(isWide || mostrarFiltros) && sidebar}
        {grid}
      </div>
    </>
  );
}
