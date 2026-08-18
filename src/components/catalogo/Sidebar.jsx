import { Archive, Flag, X } from "lucide-react";
import { inp, S, TAP } from "../../utils/theme.js";
import { NIVELES, labelCat, labelEq, labelNivel, labelTg } from "./helpers.js";
import { Chip, FiltroSeccion } from "./piezas.jsx";

// Antes `const sidebar = (…)` en CatalogoExplorer.
// Movido textualmente desde CatalogoExplorer.jsx (refactor 2026-08-17): solo JSX,
// todo el estado y los handlers viven en CatalogoExplorer.jsx y llegan por props.
export function Sidebar({
  categorias,
  equipos,
  fCat,
  fEq,
  fNivel,
  fPre,
  fTg,
  hayFiltrosActivos,
  isWide,
  limpiarFiltros,
  prefijos,
  q,
  renombrarCategoria,
  revisarIds,
  revisarOk,
  setFCat,
  setFEq,
  setFNivel,
  setFPre,
  setFTg,
  setQ,
  setSoloDI,
  setVerArchivados,
  setVerRevisar,
  soloDI,
  targets,
  toggle,
  verArchivados,
  verRevisar,
}) {
  return (
    <div style={{ width: isWide ? 260 : "auto", flexShrink: 0, padding: isWide ? "0 20px 0 0" : 0, borderRight: isWide ? "1px solid " + S.border : "none", overflowY: isWide ? "auto" : "visible" }}>
      <div style={{ position: "relative", marginBottom: 24 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar ejercicios…"
          style={{ ...inp, paddingRight: 44 }}
        />
        {q && (
          <button onClick={() => setQ("")} title="Limpiar búsqueda" className="di-tap" style={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: S.gray, cursor: "pointer", width: TAP, height: TAP, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} strokeWidth={2} />
          </button>
        )}
      </div>
      {/* Ronda 17 (punto 3): "Todos los ejercicios" — resetea todos los
          filtros y muestra el catálogo completo (1.344) sin acotar. Antes
          Lucas confundía esto con el botón "Rutinas propias (movilidad)"
          de más abajo, que en realidad abre otra biblioteca separada. */}
      <div style={{ marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Chip activo={!hayFiltrosActivos} onClick={limpiarFiltros}>Todos los ejercicios</Chip>
        <Chip activo={soloDI} onClick={() => setSoloDI((v) => !v)}>★ Principales DI</Chip>
        {/* Ronda 18: ver/recuperar archivados */}
        <Chip activo={verArchivados} onClick={() => setVerArchivados((v) => !v)}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Archive size={14} strokeWidth={2} />Archivados</span></Chip>
        {/* 2026-07-30: bandeja "Para revisar" con contador — es una lista de
            pendientes, sirve saber cuántos quedan sin abrirla. Si la
            migración 025 no está aplicada, el chip ni aparece. */}
        {revisarOk && (
          <Chip activo={verRevisar} onClick={() => setVerRevisar((v) => !v)} title="Ejercicios que marcaste para revisar (gif/nombre/código raros)">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Flag size={14} strokeWidth={2} />Para revisar{revisarIds.size > 0 ? ` (${revisarIds.size})` : ""}
            </span>
          </Chip>
        )}
      </div>
      {/* Ronda 18: los botones de crear (ejercicio / plan) se MUDARON a la
          barra de acciones principal de la pantalla — no van dentro del
          panel de filtros. */}
      {/* Jerarquía: los dos filtros que un entrenador usa siempre
          (categoría y nivel) quedan abiertos; los largos, plegados. */}
      <FiltroSeccion titulo="Categoría" valores={categorias} seleccion={fCat} onToggle={toggle(setFCat)} labelDe={labelCat} onRename={renombrarCategoria} />
      <FiltroSeccion titulo="Nivel" valores={NIVELES.map(([id]) => id)} seleccion={fNivel} onToggle={toggle(setFNivel)} labelDe={labelNivel} />
      <FiltroSeccion titulo="Músculo objetivo" valores={targets} seleccion={fTg} onToggle={toggle(setFTg)} labelDe={labelTg} colapsable />
      <FiltroSeccion titulo="Equipamiento" valores={equipos} seleccion={fEq} onToggle={toggle(setFEq)} labelDe={labelEq} colapsable />
      {/* Ronda 17 (punto 3): filtro por prefijo de código, derivado
          dinámicamente de codigo_di. */}
      <FiltroSeccion titulo="Código" valores={prefijos} seleccion={fPre} onToggle={toggle(setFPre)} labelDe={(v) => v} colapsable />
      {/* 2026-07-30: el botón de "Rutinas propias" ya NO vive acá. Lucas
          preguntó "ese botón de abajo para qué sirve?" — y era esperable:
          estaba al fondo de una columna de filtros, así que se leía como un
          filtro más del catálogo cuando en realidad NAVEGA a otra biblioteca
          (tabla distinta). Se mudó arriba, fuera de la zona de filtros, como
          bloque de navegación rotulado (hoy vive adentro de PantallaPreparacion). */}
    </div>
  );
}
