import { Archive, Dumbbell, Flag, RotateCcw, X } from "lucide-react";
import { card, FONT_BODY, FONT_DISPLAY, inp, S, TAP, TS } from "../../utils/theme.js";
import { catalogoMediaUrl } from "../../../services/supabase.js";
import { labelCat } from "./helpers.js";
import { SubirVideoInline, TagsEditor, nivelChips, unidadChips } from "./piezas.jsx";

// Modal de detalle/edición de un ejercicio (antes `{detalle && form && (…)}` en el return).
// Movido textualmente desde CatalogoExplorer.jsx (refactor 2026-08-17): solo JSX,
// todo el estado y los handlers viven en CatalogoExplorer.jsx y llegan por props.
export function DetalleEjercicio({
  agregarAlCarrito,
  armadorAbierto,
  categorias,
  codigoError,
  creando,
  detalle,
  form,
  guardando,
  guardarDetalle,
  revisarIds,
  revisarOk,
  setCodigoError,
  setCreando,
  setDetalle,
  setForm,
  showToast,
  toggleArchivado,
  toggleRevisar,
}) {
  return (
    <div onClick={() => { setDetalle(null); setCreando(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "100%", maxWidth: 460, maxHeight: "92vh", overflowY: "auto", WebkitOverflowScrolling: "touch", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ color: S.white, fontWeight: 800, fontSize: TS.title, letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1, fontFamily: FONT_DISPLAY }}>
            {creando ? "Crear ejercicio nuevo" : "Editar ejercicio"}
          </div>
          <button onClick={() => { setDetalle(null); setCreando(false); }} title="Cerrar" className="di-tap" style={{ background: "transparent", border: "none", color: S.gray, cursor: "pointer", width: TAP, height: TAP, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={20} strokeWidth={2} /></button>
        </div>
        {/* media: SOLO se muestra/edita en el flujo de crear nuevo — editar
            un ejercicio existente del catálogo no reemplaza su media
            (punto 4). Para uno existente se ve la media actual de solo
            lectura arriba, sin uploader. */}
        {!creando && (
          <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", marginBottom: 12, display: "flex", justifyContent: "center" }}>
            {detalle.gif_url ? (
              <img src={catalogoMediaUrl(detalle.gif_url)} alt={form.nombre_es} style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain" }} />
            ) : detalle.image ? (
              <img src={catalogoMediaUrl(detalle.image)} alt={form.nombre_es} style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain" }} />
            ) : detalle.video ? (
              <video src={detalle.video} controls playsInline style={{ width: "100%", maxHeight: 260, background: "#000" }} />
            ) : (
              <div style={{ padding: 40, display: "flex" }}><Dumbbell size={34} color={S.bg} strokeWidth={2} /></div>
            )}
          </div>
        )}
        <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Código</div>
        <input
          value={form.codigo_di}
          onChange={(e) => { setForm((f) => ({ ...f, codigo_di: e.target.value.toUpperCase() })); setCodigoError(""); }}
          placeholder="ej. CO006 (dejar vacío = sin código)"
          style={{ ...inp, marginBottom: codigoError ? 4 : 10, fontWeight: 700, borderColor: codigoError ? S.red : undefined }}
        />
        {codigoError && <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.red, marginBottom: 10 }}>{codigoError}</div>}
        <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Nombre</div>
        <input value={form.nombre_es} onChange={(e) => setForm((f) => ({ ...f, nombre_es: e.target.value }))} style={{ ...inp, marginBottom: 10, fontWeight: 700 }} />
        {detalle.nombre_en && (
          <div style={{ fontSize: TS.chip, color: S.lgray, marginTop: -4, marginBottom: 10 }}>EN: {detalle.nombre_en}</div>
        )}
        {/* Ronda 17 (punto 3): categoría editable con datalist. */}
        <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Categoría</div>
        <input
          value={form.categoria}
          onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
          placeholder="ej. Espalda, Pecho, Core…"
          list="di-catalogo-categorias"
          style={{ ...inp, marginBottom: 10 }}
        />
        <datalist id="di-catalogo-categorias">
          {categorias.map((v) => <option key={v} value={labelCat(v)} />)}
        </datalist>
        {/* Ronda 18: nivel del ejercicio — Inicial/Intermedio/Avanzado,
            visible como badge en la card y filtrable en el sidebar. */}
        <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Nivel</div>
        <div style={{ marginBottom: 10 }}>{nivelChips(form.nivel, (v) => setForm((f) => ({ ...f, nivel: v })))}</div>
        {/* 2026-08-12: cómo se registra este ejercicio. Es lo que va a
            decir el casillero del alumno (KG HOY / REPS HOY / SEG HOY). */}
        <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Se registra en</div>
        <div style={{ marginBottom: 4 }}>{unidadChips(form.unidad, (v) => setForm((f) => ({ ...f, unidad: v })))}</div>
        <div style={{ fontSize: TS.chip, color: S.lgray, marginBottom: 10, lineHeight: 1.45 }}>
          Kilos si lleva carga · Repeticiones si es peso corporal (TRX, fondos, dominadas) · Segundos si es isométrico (plancha).
        </div>
        <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Instrucciones</div>
        <textarea value={form.instrucciones_es} onChange={(e) => setForm((f) => ({ ...f, instrucciones_es: e.target.value }))} rows={5} style={{ ...inp, resize: "vertical", marginBottom: 12, lineHeight: 1.45 }} />
        {/* músculos editables, con ★ predeterminado (punto 4) */}
        <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Músculos trabajados</div>
        <div style={{ marginBottom: 12 }}>
          <TagsEditor
            items={form.musculos}
            defaultItem={form.musculo_default}
            onChange={(musculos) => setForm((f) => ({ ...f, musculos }))}
            onChangeDefault={(musculo_default) => setForm((f) => ({ ...f, musculo_default }))}
            placeholder="Agregar músculo…"
          />
        </div>
        {/* tags editables, con ★ predeterminado (punto 4) */}
        <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Tags (equipamiento y otros)</div>
        <div style={{ marginBottom: 12 }}>
          <TagsEditor
            items={form.tags}
            defaultItem={form.tag_default}
            onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            onChangeDefault={(tag_default) => setForm((f) => ({ ...f, tag_default }))}
            placeholder="Agregar tag…"
          />
        </div>
        {/* video/gif propio: SOLO en el flujo de crear nuevo */}
        {creando && (
          <>
            <div style={{ fontSize: TS.chip, fontWeight: 700, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Link video (YouTube o propio)</div>
            <input value={form.video} onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))} placeholder="https://…" style={{ ...inp, marginBottom: 8 }} />
            <div style={{ marginBottom: 12 }}>
              <SubirVideoInline onUrl={(url) => setForm((f) => ({ ...f, video: url }))} showToast={showToast} />
            </div>
          </>
        )}
        {/* 2026-07-30 — tag REVISAR: mismo camino que archivar (acción de
            estado al pie del detalle), pero neutro: marcar algo para
            mirarlo después no es una alerta, es una nota. */}
        {!creando && detalle.id && revisarOk && (
          <button
            onClick={() => toggleRevisar(detalle)}
            className="di-tap"
            style={{ width: "100%", marginBottom: 10, background: revisarIds.has(detalle.id) ? S.card3 : "transparent", color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.label, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Flag size={14} strokeWidth={2} />
              {revisarIds.has(detalle.id) ? "Sacar de “Para revisar”" : "Marcar para revisar (algo está raro)"}
            </span>
          </button>
        )}
        {/* Ronda 18: archivar/desarchivar (solo ejercicios existentes) */}
        {!creando && detalle.id && (
          <button
            onClick={() => toggleArchivado(detalle)}
            className="di-tap"
            style={{ width: "100%", marginBottom: 10, background: "transparent", color: detalle.archivado ? S.green : S.yellow, border: "1px solid " + (detalle.archivado ? S.green : S.yellow), borderRadius: 10, padding: "12px 14px", minHeight: TAP, fontSize: TS.label, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY }}
          >
            {detalle.archivado ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><RotateCcw size={14} strokeWidth={2} />Recuperar (sacar del archivo)</span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Archive size={14} strokeWidth={2} />Archivar (ocultar de los listados)</span>
            )}
          </button>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          {armadorAbierto && !creando && (
            <button
              onClick={() => { agregarAlCarrito(detalle); setDetalle(null); }}
              className="di-tap"
              style={{ flex: 1, background: S.card2, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: 13, minHeight: TAP, fontSize: TS.ui, fontWeight: 800, cursor: "pointer", fontFamily: FONT_BODY }}
            >
              ＋ AGREGAR AL PLAN
            </button>
          )}
          <button
            onClick={guardarDetalle}
            disabled={guardando}
            className="di-tap"
            style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 10, padding: 13, minHeight: TAP, fontSize: TS.ui, fontWeight: 900, cursor: "pointer", opacity: guardando ? 0.6 : 1, fontFamily: FONT_BODY }}
          >
            {guardando ? "GUARDANDO..." : creando ? "CREAR" : "GUARDAR"}
          </button>
        </div>
      </div>
    </div>
  );
}
