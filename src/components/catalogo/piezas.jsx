// Piezas chicas del catálogo: componentes independientes (con su propio estado interno,
// que no es del padre) y chips reutilizables. Movidos textualmente desde
// CatalogoExplorer.jsx (refactor 2026-08-17).
import { useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import { eyebrow, FONT_BODY, inp, S, smallBtn, TAP, TS } from "../../utils/theme.js";
import { NOMBRE_UNIDAD, UNIDADES } from "../../utils/unidades.js";
import { subirVideo } from "../../../services/supabase.js";
import { NIVELES } from "./helpers.js";

// Chip de filtro. El estado activo se marca con TRES señales (playbook:
// nunca solo con color): fondo invertido + borde + peso tipográfico.
export function Chip({ activo, onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="di-tap"
      aria-pressed={!!activo}
      style={{
        background: activo ? S.white : S.card2,
        color: activo ? S.bg : S.gray,
        border: "1px solid " + (activo ? S.white : S.border),
        borderRadius: 20,
        padding: "8px 14px",
        minHeight: TAP,
        fontSize: TS.chip,
        fontWeight: activo ? 800 : 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: FONT_BODY,
      }}
    >
      {children}
    </button>
  );
}

// Ronda 17 (punto 3): `onRename(valorViejo)` opcional — SOLO se pasa para
// el filtro de Categoría. Cuando está, cada chip suma un lápiz chico al
// lado para renombrar esa categoría (propaga a TODOS los ejercicios que la
// tengan — ver renombrarCategoriaCatalogo). Equipamiento/Músculo/Código NO
// lo reciben: esos valores vienen del dataset y no tiene sentido
// renombrarlos en masa desde acá.
// Jerarquía del sidebar (2026-07-30): antes eran 4 grupos de chips grises
// idénticos, todos con el mismo peso — una pared. Ahora cada grupo es una
// sección plegable con encabezado `eyebrow`, contador de seleccionados y
// aire real entre grupos (escala de 8px). Los grupos largos
// (Equipamiento, 30 valores) arrancan cerrados salvo que tengan filtro
// activo, así se ve de un vistazo qué está filtrado y qué no.
export function FiltroSeccion({ titulo, valores, seleccion, onToggle, labelDe, onRename, colapsable }) {
  const [expandido, setExpandido] = useState(false);
  const [abierto, setAbierto] = useState(!colapsable);
  const LIMITE = 8;
  const mostrar = expandido ? valores : valores.slice(0, LIMITE);
  const nSel = [...seleccion].filter((v) => valores.includes(v)).length;
  const desplegado = abierto || nSel > 0;
  return (
    <div style={{ marginBottom: 24 }}>
      <button
        onClick={() => setAbierto((v) => !v)}
        className="di-tap"
        style={{ ...eyebrow, fontSize: TS.chip, background: "transparent", border: "none", padding: "8px 0", minHeight: TAP, width: "100%", display: "flex", alignItems: "center", gap: 8, cursor: colapsable ? "pointer" : "default", textAlign: "left", color: nSel > 0 ? S.white : S.gray }}
      >
        <span style={{ flex: 1 }}>{titulo}</span>
        {nSel > 0 && (
          <span style={{ color: S.red, fontSize: TS.chip, fontWeight: 800, letterSpacing: 0 }}>{nSel}</span>
        )}
        {colapsable && <span style={{ fontSize: TS.chip, color: S.lgray }}>{desplegado ? "–" : "+"}</span>}
      </button>
      {/* Filete: separa el encabezado de sus chips sin agregar otra card */}
      <div style={{ height: 1, background: nSel > 0 ? S.white : S.border, marginBottom: 10, opacity: nSel > 0 ? 0.5 : 1 }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, ...(desplegado ? null : { display: "none" }) }}>
        {mostrar.map((v) =>
          onRename ? (
            <span key={v} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
              <Chip activo={seleccion.has(v)} onClick={() => onToggle(v)}>
                {labelDe(v)}
              </Chip>
              <button
                onClick={() => onRename(v)}
                title={`Renombrar categoría "${labelDe(v)}"`}
                className="di-tap"
                style={{ background: "transparent", border: "none", color: S.lgray, cursor: "pointer", padding: "0 6px", minHeight: TAP, lineHeight: 1, display: "inline-flex", alignItems: "center" }}
              >
                <Pencil size={14} strokeWidth={2} />
              </button>
            </span>
          ) : (
            <Chip key={v} activo={seleccion.has(v)} onClick={() => onToggle(v)}>
              {labelDe(v)}
            </Chip>
          )
        )}
        {valores.length > LIMITE && (
          <Chip activo={false} onClick={() => setExpandido((v) => !v)}>
            {expandido ? "Ver menos" : `+${valores.length - LIMITE} más`}
          </Chip>
        )}
      </div>
    </div>
  );
}

// Editor de tags/músculos con "predeterminado" (punto 4, 2026-07-21): lista
// de chips editable (agregar/sacar) + un ☆/★ para marcar cuál es el
// principal. Se usa para músculos (target + secondary) y para tags
// (equipment + libres).
export function TagsEditor({ items, defaultItem, onChange, onChangeDefault, placeholder }) {
  const [nuevo, setNuevo] = useState("");
  const add = () => {
    const v = nuevo.trim();
    if (!v || items.includes(v)) { setNuevo(""); return; }
    const next = [...items, v];
    onChange(next);
    if (!defaultItem) onChangeDefault(v);
    setNuevo("");
  };
  const remove = (v) => {
    const next = items.filter((x) => x !== v);
    onChange(next);
    if (defaultItem === v) onChangeDefault(next[0] || "");
  };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
        {items.length === 0 && <span style={{ fontSize: TS.chip, color: S.lgray }}>Sin ninguno todavía</span>}
        {items.map((v) => {
          const esDefault = v === defaultItem;
          return (
            <span
              key={v}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: esDefault ? S.white : S.card2,
                color: esDefault ? S.bg : S.white,
                border: "1px solid " + S.border,
                borderRadius: 20,
                padding: "3px 6px 3px 10px",
                minHeight: TAP,
                fontSize: TS.chip,
                fontWeight: 600,
              }}
            >
              <button
                onClick={() => onChangeDefault(v)}
                title="Marcar como predeterminado"
                className="di-tap"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0 4px", minHeight: TAP, fontSize: TS.ui, color: esDefault ? S.bg : S.gray, lineHeight: 1 }}
              >
                {esDefault ? "★" : "☆"}
              </button>
              {v}
              <button
                onClick={() => remove(v)}
                title="Quitar"
                className="di-tap"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0 6px", minHeight: TAP, color: esDefault ? S.bg : S.gray, lineHeight: 1, display: "inline-flex", alignItems: "center" }}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </span>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          style={{ ...inp, flex: 1 }}
        />
        <button onClick={add} className="di-tap" style={{ ...smallBtn(S.gray) }}>+ Agregar</button>
      </div>
    </div>
  );
}

// Uploader de video inline (bucket ejercicios-videos, misma vía que el
// editor de ejercicios de siempre).
export function SubirVideoInline({ onUrl, showToast }) {
  const ref = useRef();
  const [subiendo, setSubiendo] = useState(false);
  return (
    <>
      <button
        onClick={() => ref.current && ref.current.click()}
        disabled={subiendo}
        className="di-tap"
        style={{ ...smallBtn(S.gray), width: "100%" }}
      >
        {subiendo ? "Subiendo..." : "⬆ Subir video propio"}
      </button>
      <input
        ref={ref}
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files && e.target.files[0];
          if (!f) return;
          setSubiendo(true);
          try {
            const url = await subirVideo(f);
            onUrl(url);
            showToast && showToast("Video subido");
          } catch (err) {
            window.alert("No se pudo subir el video: " + (err.message || "error"));
          } finally {
            setSubiendo(false);
            e.target.value = "";
          }
        }}
      />
    </>
  );
}

// Chips de nivel reutilizables (armador + edición de plantilla).
export const nivelChips = (valor, onSet) => (
  <div style={{ display: "flex", gap: 6 }}>
    {NIVELES.map(([id, l]) => (
      <button
        key={id}
        onClick={() => onSet(valor === id ? "" : id)}
        className="di-tap"
        style={{ flex: 1, background: valor === id ? S.white : S.card3, color: valor === id ? S.bg : S.gray, border: "1px solid " + (valor === id ? S.white : S.border2), borderRadius: 8, padding: "11px 6px", minHeight: TAP, fontSize: TS.chip, fontWeight: valor === id ? 800 : 600, cursor: "pointer", fontFamily: FONT_BODY }}
      >
        {l}
      </button>
    ))}
  </div>
);

// 2026-08-12 — Lucas: la unidad tiene que salir del catálogo y poder
// corregirse ejercicio por ejercicio. Mismo patrón visual que nivelChips,
// pero SIN toggle de apagado: un ejercicio siempre se registra de alguna de
// las tres formas, "sin unidad" no existe.
export const unidadChips = (valor, onSet) => (
  <div style={{ display: "flex", gap: 6 }}>
    {UNIDADES.map((id) => (
      <button
        key={id}
        onClick={() => onSet(id)}
        className="di-tap"
        style={{ flex: 1, background: valor === id ? S.white : S.card3, color: valor === id ? S.bg : S.gray, border: "1px solid " + (valor === id ? S.white : S.border2), borderRadius: 8, padding: "11px 6px", minHeight: TAP, fontSize: TS.chip, fontWeight: valor === id ? 800 : 600, cursor: "pointer", fontFamily: FONT_BODY }}
      >
        {NOMBRE_UNIDAD[id]}
      </button>
    ))}
  </div>
);
