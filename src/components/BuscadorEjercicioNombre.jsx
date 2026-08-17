import { useEffect, useState } from "react";
import { getEjercicioGif } from "../utils/ejerciciosMedia.js";
import { S, TAP, TS, inp } from "../utils/theme.js";

// Buscador con autocomplete desde la biblioteca (ronda 12, punto 7): se usa
// tanto para editar un ejercicio existente como para AGREGAR uno nuevo — el
// buscador sugiere ejercicios EXISTENTES (con su código, si tienen) y
// permite crear uno nuevo si no existe (simplemente tipeando un nombre que
// no matchea nada y guardando).
// 2026-07-30: pasa a ser un SELECTOR de ejercicios existentes, no un campo de
// texto libre — "el campo nombre debería mostrar la lista de ejercicios
// existentes (elegir, no crear)". Cambios: la lista se abre al enfocar aunque
// el campo esté vacío (patrón Mercado Libre), se filtra en vivo al tipear, y
// se navega con teclado (↓ ↑ Enter Esc) además del mouse. Cada fila muestra
// el GIF del ejercicio, para elegir mirando y no leyendo.
export function BuscadorEjercicioNombre({ value, sugs, showSugs, setShowSugs, onInputChange, onSelect }) {
  const [hi, setHi] = useState(-1);
  useEffect(() => { setHi(-1); }, [sugs]);
  const elegir = (sug) => { setHi(-1); onSelect(sug); };
  const onKeyDown = (e) => {
    if (!showSugs || sugs.length === 0) {
      if (e.key === "ArrowDown") { setShowSugs(true); onInputChange(value); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => (h + 1) % sugs.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => (h <= 0 ? sugs.length - 1 : h - 1)); }
    else if (e.key === "Enter" && hi >= 0) { e.preventDefault(); elegir(sugs[hi]); }
    else if (e.key === "Escape") { setShowSugs(false); setHi(-1); }
  };
  return (
    <div style={{ position: "relative", marginBottom: 8 }}>
      <input
        value={value}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setShowSugs(false), 150)}
        onFocus={() => onInputChange(value)}
        placeholder="Buscá y elegí un ejercicio…"
        style={{ ...inp, minHeight: TAP, fontSize: TS.ui }}
        autoComplete="off"
        role="combobox"
        aria-expanded={showSugs}
        aria-autocomplete="list"
      />
      {showSugs && sugs.length > 0 && (
        <div role="listbox" style={{ position: "absolute", top: "100%", left: 0, right: 0, background: S.card, border: "1px solid " + S.border2, borderRadius: 8, zIndex: 50, maxHeight: 320, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
          {sugs.map((sug, i) => {
            const gifSug = sug.gif || getEjercicioGif(sug.nombre);
            return (
              <div
                key={i}
                role="option"
                aria-selected={hi === i}
                onMouseDown={() => elegir(sug)}
                onMouseEnter={() => setHi(i)}
                style={{ padding: "8px 14px", minHeight: TAP, cursor: "pointer", borderBottom: "1px solid " + S.border, display: "flex", alignItems: "center", gap: 10, background: hi === i ? S.card2 : "transparent" }}
              >
                {gifSug && (
                  <img src={gifSug} alt="" loading="lazy" style={{ width: 34, height: 34, objectFit: "contain", background: "#fff", borderRadius: 4, flexShrink: 0 }} />
                )}
                {sug.codigo && (
                  <span style={{ color: S.gray, fontSize: TS.chip, fontWeight: 800, letterSpacing: 0.5, background: S.card2, border: "1px solid " + S.border2, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>
                    {sug.codigo}
                  </span>
                )}
                {/* 2026-08-09: las que propone el modelo (armador asistido) se
                    marcan como NUEVO. Sin esta marca el profe cree que ya
                    existen en el catálogo y no entiende por qué no traen ni
                    código ni GIF — son nombres a crear, no a elegir. */}
                {sug.nuevo && (
                  <span style={{ color: S.bg, background: S.white, fontSize: TS.chip, fontWeight: 800, letterSpacing: 0.5, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>
                    NUEVO
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: S.white, fontSize: TS.chip, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sug.nombre}</div>
                  {sug.desc && <div style={{ color: S.gray, fontSize: TS.chip, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sug.desc}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
