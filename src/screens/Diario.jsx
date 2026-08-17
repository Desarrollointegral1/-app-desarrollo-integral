import { useState } from "react";
import { NotebookPen } from "lucide-react";
import { FechaRapida } from "../components/FechaRapida.jsx";
import { hoy } from "../utils/helpers.js";
import { S, card, inp } from "../utils/theme.js";

// ── DIARIO ────────────────────────────────────────────────────────────
// Ronda 17 (punto 4): las entradas ahora son editables — texto Y fecha (no
// solo el texto). `onEdit(idxOriginal, patch)` recibe el índice de la
// entrada en el array SIN ordenar (se conserva al ordenar acá abajo con
// .map antes del .sort, así el índice sigue apuntando a la entrada
// correcta en al.diario del lado de App()).
export function Diario({ entradas, onAdd, onEdit, onDelete, slotAntesDeEntradas }) {
  const [texto, setTexto] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editFecha, setEditFecha] = useState("");
  const [editTexto, setEditTexto] = useState("");
  const MAX = 140;
  const guardar = () => {
    if (!texto.trim()) return;
    // Ronda 8: las entradas nuevas guardan fecha Y HORA ("YYYY-MM-DD HH:mm").
    // Las viejas quedan solo con fecha — la lectura es retrocompatible (mismo
    // criterio que la asistencia: slice(0,10) para la fecha, resto es hora).
    const ahora = new Date();
    const conHora = `${hoy()} ${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
    onAdd({ fecha: conHora, texto: texto.trim() });
    setTexto("");
  };
  const empezarEdicion = (idxOriginal, entrada) => {
    setEditIdx(idxOriginal);
    setEditFecha((entrada.fecha || hoy()).slice(0, 10));
    setEditTexto(entrada.texto || "");
  };
  const guardarEdicion = () => {
    if (editIdx == null || !editTexto.trim() || !onEdit) return;
    const original = entradas[editIdx] || {};
    // Conserva la hora original si la tenía (solo se edita la fecha/texto).
    const hora = original.fecha && String(original.fecha).length > 10 ? String(original.fecha).slice(10) : "";
    onEdit(editIdx, { fecha: (editFecha || hoy()) + hora, texto: editTexto.trim() });
    setEditIdx(null);
  };
  return (
    <div>
      {/* Ronda 8: sin título "Mi diario de entrenamiento" — el recuadro va
          directo debajo del botón de asistencia */}
      <div style={{ ...card, padding: 14, marginBottom: 14 }}>
        {" "}
        <div style={{ fontSize: 11, color: S.gray, marginBottom: 6 }}>¿Contanos cómo estuvo el entrenamiento hoy?</div>{" "}
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, MAX))}
          placeholder="Ej: Muy buen dia, subi peso en sentadilla..."
          rows={3}
          style={{ ...inp, resize: "none", marginBottom: 6 }}
        />{" "}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {" "}
          <div style={{ fontSize: 11, color: texto.length > 120 ? S.red : S.lgray }}>
            {texto.length}/{MAX}
          </div>{" "}
          <button
            onClick={guardar}
            disabled={!texto.trim()}
            style={{
              background: texto.trim() ? S.white : S.card2,
              color: texto.trim() ? S.bg : S.lgray,
              border: "none",
              borderRadius: 6,
              padding: "8px 18px",
              fontWeight: 900,
              fontSize: 12,
              cursor: texto.trim() ? "pointer" : "default",
            }}
          >
            GUARDAR
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Slot opcional entre el input y los comentarios guardados (ronda
          2026-07-22): acá cae el reporte "Tu mes" — Lucas lo quiere abajo,
          justo antes de los comentarios guardados, no arriba de todo. */}
      {slotAntesDeEntradas}
      {entradas.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: "center" }}>
          <NotebookPen size={32} style={{ marginBottom: 8 }} />
          <div style={{ color: S.gray, fontSize: 13 }}>Sin entradas todavía</div>
        </div>
      ) : (
        entradas
          .map((e, i) => ({ e, i })) // conserva el índice ORIGINAL antes de ordenar
          .sort((a, b) => b.e.fecha.localeCompare(a.e.fecha))
          .map(({ e, i }) =>
            editIdx === i ? (
              <div key={i} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Fecha</div>
                {/* Ronda 18: sin date picker nativo — chips Hoy/Ayer/Otro día */}
                <div style={{ marginBottom: 8 }}>
                  <FechaRapida value={editFecha} onChange={setEditFecha} />
                </div>
                <textarea
                  value={editTexto}
                  onChange={(ev) => setEditTexto(ev.target.value.slice(0, MAX))}
                  rows={3}
                  style={{ ...inp, resize: "none", marginBottom: 6 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: editTexto.length > 120 ? S.red : S.lgray }}>{editTexto.length}/{MAX}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setEditIdx(null)} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 6, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>
                      Cancelar
                    </button>
                    <button
                      onClick={guardarEdicion}
                      disabled={!editTexto.trim()}
                      style={{ background: editTexto.trim() ? S.white : S.card2, color: editTexto.trim() ? S.bg : S.lgray, border: "none", borderRadius: 6, padding: "7px 14px", fontWeight: 900, fontSize: 12, cursor: editTexto.trim() ? "pointer" : "default" }}
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={i} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
                {" "}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                  <div style={{ color: S.lgray, fontSize: 11 }}>
                    {e.fecha.slice(0, 10)}
                    {e.fecha.length > 10 && <span style={{ color: S.green, fontWeight: 700 }}> · {e.fecha.slice(11)} hs</span>}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                    {onEdit && (
                      <button
                        onClick={() => empezarEdicion(i, e)}
                        style={{ background: "transparent", border: "none", color: S.gray, fontSize: 11, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                      >
                        Editar
                      </button>
                    )}
                    {/* 2026-07-31, pedido de Lucas: "el alumno tiene que poder
                        borrar un comentario". Confirmación nativa — es
                        destructivo y no se puede deshacer. */}
                    {onDelete && (
                      <button
                        onClick={() => window.confirm("¿Borrar este comentario? No se puede deshacer.") && onDelete(i)}
                        style={{ background: "transparent", border: "none", color: S.gray, fontSize: 11, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </div>{" "}
                <div style={{ color: S.white, fontSize: 14, lineHeight: 1.5 }}>{e.texto}</div>{" "}
                {e.respuesta && (
                  <div style={{ marginTop: 8, borderLeft: "3px solid " + S.green, paddingLeft: 10 }}>
                    <div style={{ color: S.green, fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Respuesta del profe</div>
                    <div style={{ color: S.white, fontSize: 13, lineHeight: 1.5 }}>{e.respuesta}</div>
                  </div>
                )}{" "}
              </div>
            )
          )
      )}{" "}
    </div>
  );
}
