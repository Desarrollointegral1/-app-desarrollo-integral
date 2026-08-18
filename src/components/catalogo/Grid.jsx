import { Fragment } from "react";
import { Archive, Check, Dumbbell, Flag, Layers, RotateCcw, Search, X } from "lucide-react";
import { card, eyebrow, FONT_BODY, FONT_DISPLAY, S, smallBtn, TAP, TS } from "../../utils/theme.js";
import { catalogoMediaUrl } from "../../../services/supabase.js";
import { PAGE, labelCat, labelNivel } from "./helpers.js";
import { Chip } from "./piezas.jsx";

// Antes `const grid = (…)` en CatalogoExplorer.
// Movido textualmente desde CatalogoExplorer.jsx (refactor 2026-08-17): solo JSX,
// todo el estado y los handlers viven en CatalogoExplorer.jsx y llegan por props.
export function Grid({
  abrirDetalle,
  agregarAlCarrito,
  archivarRapido,
  armadorAbierto,
  badgesActivos,
  carrito,
  cat,
  clusters,
  filtrados,
  hayFiltrosActivos,
  hoverId,
  isWide,
  limpiarFiltros,
  orden,
  revisarIds,
  setHoverId,
  setOrden,
  setVisibles,
  visibles,
}) {
  // Grilla (2026-07-30). Antes: `minmax(150px, 1fr)` daba 11 columnas en
  // desktop — 63 tarjetas de 154px con 90px útiles de texto, densidad de
  // catálogo mayorista y todos los títulos truncados. Ahora tarjetas de
  // ~240px en escritorio (auto-fill, se adapta al ancho real que queda
  // libre según haya sidebar o panel de plan) y 2 columnas en el celular,
  // que es lo máximo legible a 375px.
  const gridCols = {
    display: "grid",
    gridTemplateColumns: isWide ? "repeat(auto-fill, minmax(240px, 1fr))" : "repeat(2, minmax(0, 1fr))",
    gap: isWide ? 16 : 10,
    alignItems: "start",
  };

  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {/* barra de resultados + filtros activos + orden */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {badgesActivos.map((b) => (
          <span key={b.l} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: S.card2, border: "1px solid " + S.border, borderRadius: 20, padding: "4px 4px 4px 12px", minHeight: TAP, fontSize: TS.chip, fontWeight: 600, color: S.white }}>
            {b.l}
            <button onClick={b.del} title={`Quitar filtro ${b.l}`} className="di-tap" style={{ background: "transparent", border: "none", color: S.gray, cursor: "pointer", width: 36, height: 36, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: TS.chip, color: S.gray, display: "inline-flex", alignItems: "center", gap: 6 }}>
          {cat ? (
            <>
              <strong style={{ color: S.white, fontWeight: 800 }}>{filtrados.length}</strong>
              de {cat.length} ejercicios
            </>
          ) : "Cargando catálogo…"}
        </span>
        {/* Orden: por defecto agrupado por categoría (el alfabético puro
            dejaba 20 variantes de abdominales seguidas al abrir). */}
        <div style={{ display: "flex", gap: 6 }}>
          <Chip activo={orden === "categoria"} onClick={() => setOrden("categoria")}>Por categoría</Chip>
          <Chip activo={orden === "az"} onClick={() => setOrden("az")}>A–Z</Chip>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {!cat ? (
          <div style={gridCols}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ ...card, height: 280, opacity: 0.35 }} />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ ...card, padding: 40, textAlign: "center", maxWidth: 460, margin: "24px auto" }}>
            <Search size={22} strokeWidth={2} color={S.gray} />
            <div style={{ color: S.white, fontSize: TS.lead, fontWeight: 700, marginTop: 12, fontFamily: FONT_DISPLAY, letterSpacing: 0.5 }}>
              Ningún ejercicio con esos filtros
            </div>
            <div style={{ color: S.gray, fontSize: TS.body, marginTop: 8, lineHeight: 1.5 }}>
              Probá con menos filtros, o buscá por el nombre del movimiento.
            </div>
            {hayFiltrosActivos && (
              <button onClick={limpiarFiltros} className="di-tap" style={{ marginTop: 20, background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: "12px 20px", minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY }}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={gridCols}>
              {filtrados.slice(0, visibles).map((e, i, arr) => {
                const enCarrito = carrito.some((c) => c.id === e.id);
                const media = hoverId === e.id && e.gif_url ? catalogoMediaUrl(e.gif_url) : catalogoMediaUrl(e.image || e.gif_url);
                // Encabezado de grupo: el orden por categoría se tiene que
                // VER, si no es un orden invisible.
                const grupo = orden === "categoria" && (i === 0 || arr[i - 1].categoria !== e.categoria)
                  ? labelCat(e.categoria || "Sin categoría")
                  : null;
                // 2026-08-04: cluster de variantes por movimiento (ver
                // `clusters` arriba) — badge chico, sin competir con el
                // acento rojo de marca que ya usa el encabezado de categoría.
                const cluster = clusters[i];
                return (
                  <Fragment key={e.id}>
                    {grupo && (
                      <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12, marginTop: i === 0 ? 0 : 16 }}>
                        <span style={{ width: 24, height: 2, background: S.red, flexShrink: 0 }} />
                        <span style={{ ...eyebrow, fontSize: TS.chip, color: S.white }}>{grupo}</span>
                        <span style={{ flex: 1, height: 1, background: S.border }} />
                      </div>
                    )}
                    {cluster && (
                      <div style={{ gridColumn: "1 / -1", marginTop: grupo ? 4 : i === 0 ? 0 : 10 }}>
                        <span
                          title={`${cluster.size} variantes de "${cluster.label}" — mismo movimiento, distinto equipo/ejecución`}
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: TS.chip, fontWeight: 700, color: S.lgray, background: S.card2, border: "1px solid " + S.border, borderRadius: 20, padding: "4px 10px 4px 8px" }}
                        >
                          <Layers size={13} strokeWidth={2} />{cluster.label} · {cluster.size} variantes
                        </span>
                      </div>
                    )}
                    <article
                      className="di-cat-card"
                      tabIndex={0}
                      onMouseEnter={() => setHoverId(e.id)}
                      onMouseLeave={() => setHoverId((h) => (h === e.id ? null : h))}
                      onClick={() => abrirDetalle(e)}
                      onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); abrirDetalle(e); } }}
                      style={{
                        ...card,
                        overflow: "hidden",
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        // 2026-07-30 — marca de "para revisar": un filete
                        // rojo de 3px al costado, nada de badge de color
                        // pleno. El rojo es el único acento de la marca y acá
                        // se usa en la mínima superficie que se ve de un
                        // vistazo al barrer la grilla.
                        ...(revisarIds.has(e.id) ? { borderLeft: "3px solid " + S.red } : null),
                      }}
                    >
                      {/* La imagen deja de dominar la tarjeta: 4:3 en vez de
                          1:1 y desaturada, para que el rojo del pack de
                          stock no compita con el rojo de la marca. Al pasar
                          el puntero vuelve a color y arranca el gif — el
                          movimiento devuelve el detalle real del ejercicio. */}
                      <div style={{ aspectRatio: "4 / 3", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                        {media ? (
                          <img src={media} alt={e.nombre_es} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "saturate(0.5)" }} />
                        ) : (
                          <Dumbbell size={30} color={S.bg} strokeWidth={2} />
                        )}
                      </div>
                      {armadorAbierto && (
                        <button
                          onClick={(ev) => { ev.stopPropagation(); agregarAlCarrito(e); }}
                          title={enCarrito ? "Ya está en el plan" : "Agregar al plan"}
                          className="di-tap"
                          style={{ position: "absolute", top: 8, right: 8, width: TAP, height: TAP, borderRadius: "50%", background: enCarrito ? S.green : S.white, color: S.bg, border: "none", fontWeight: 900, fontSize: TS.lead, cursor: "pointer", lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                        >
                          {enCarrito ? <Check size={20} strokeWidth={2.5} /> : "＋"}
                        </button>
                      )}
                      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                        {/* El nombre manda: es el único dato que importa. */}
                        <div style={{ color: S.white, fontSize: TS.ui, fontWeight: 700, lineHeight: 1.35, minHeight: 44, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", fontFamily: FONT_BODY }}>
                          {e.nombre_es}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: "auto" }}>
                          {e.target_es && <span style={{ fontSize: TS.chip, color: S.gray, background: S.card2, borderRadius: 4, padding: "3px 8px" }}>{e.target_es}</span>}
                          {e.equipment_es && <span style={{ fontSize: TS.chip, color: S.gray, background: S.card2, borderRadius: 4, padding: "3px 8px" }}>{e.equipment_es}</span>}
                          {e.nivel && (
                            <span style={{ fontSize: TS.chip, fontWeight: 700, color: S.white, background: S.card3, border: "1px solid " + S.border2, borderRadius: 4, padding: "3px 8px" }}>
                              {labelNivel(e.nivel)}
                            </span>
                          )}
                          {e.archivado && (
                            <span style={{ fontSize: TS.chip, fontWeight: 700, color: S.yellow, background: S.card2, borderRadius: 4, padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Archive size={14} strokeWidth={2} />Archivado
                            </span>
                          )}
                          {/* Etiqueta terciaria, en gris: la señal fuerte ya
                              la da el filete; esto solo la nombra. */}
                          {revisarIds.has(e.id) && (
                            <span style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, background: "transparent", border: "1px solid " + S.border2, borderRadius: 4, padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Flag size={14} strokeWidth={2} />Para revisar
                            </span>
                          )}
                        </div>
                        {/* Pie de la tarjeta. El código queda (identifica el
                            ejercicio); la marquita "editado" se fue: era
                            informativa y ocupaba el lugar donde Lucas
                            necesita la acción que sí usa 1.343 veces
                            (2026-08-10). El botón archiva de un toque y
                            frena la propagación para que tocar la tarjeta
                            siga abriendo el detalle. */}
                        {/* En el celular van apilados: con dos columnas de
                            tarjetas, en fila el código quedaba en "A…" y el
                            código es justamente lo que identifica al
                            ejercicio. */}
                        <div style={{ display: "flex", flexDirection: isWide ? "row" : "column", alignItems: isWide ? "center" : "stretch", gap: 8 }}>
                          <span style={{ flex: 1, minWidth: 0, fontSize: TS.chip, color: S.lgray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {e.codigo_di}
                          </span>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); archivarRapido(e); }}
                            onKeyDown={(ev) => ev.stopPropagation()}
                            title={e.archivado ? "Sacar del archivo" : "Archivar (se oculta de los listados; se recupera con el chip Archivados)"}
                            className="di-tap"
                            style={{ flexShrink: 0, minHeight: TAP, minWidth: TAP, padding: "0 12px", background: "transparent", color: e.archivado ? S.green : S.gray, border: "1px solid " + (e.archivado ? S.green : S.border2), borderRadius: 8, fontSize: TS.chip, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                          >
                            {e.archivado
                              ? <><RotateCcw size={14} strokeWidth={2} />Recuperar</>
                              : <><Archive size={14} strokeWidth={2} />Archivar</>}
                          </button>
                        </div>
                      </div>
                    </article>
                  </Fragment>
                );
              })}
            </div>
            {visibles < filtrados.length && (
              <button
                onClick={() => setVisibles((v) => v + PAGE)}
                className="di-tap"
                style={{ ...smallBtn(S.gray), width: "100%", marginTop: 20, marginBottom: 8 }}
              >
                Cargar más ({filtrados.length - visibles} restantes)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
