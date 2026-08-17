import { useState } from "react";
import { Pencil, Play, X } from "lucide-react";
import { S, card, inp, smallBtn } from "../../utils/theme.js";
import { EjercicioEditor } from "./EjercicioEditor.jsx";

// ── DIAS EDITOR ───────────────────────────────────────────────────────
// ocultarAgregarDia (ronda 6): en Plan → Principales el "+ Dia" de acá abajo era
// redundante (agregar día ya está arriba con "+ Otro día") — se oculta, y si el
// plan tiene un solo día tampoco se muestra la fila de pills.
export function DiasEditor({ dias = [], onChange, biblioteca = [], onGuardarBiblioteca, onGuardarParaTodos, ocultarAgregarDia = false }) {
  const [selDia, setSelDia] = useState(0);
  const [editDia, setEditDia] = useState(false);
  const [diaForm, setDiaForm] = useState({ dia: "", subtitulo: "" });
  const safeSelDia = Math.min(selDia, Math.max(0, dias.length - 1));
  const d = dias[safeSelDia];
  const updateEjs = (ejs) => {
    const arr = [...dias];
    arr[selDia] = { ...arr[selDia], ejercicios: ejs };
    onChange(arr);
  };
  const saveDia = () => {
    if (!diaForm.dia.trim()) return;
    const arr = [...dias];
    arr[selDia] = { ...arr[selDia], ...diaForm };
    onChange(arr);
    setEditDia(false);
  };
  const addDia = () => {
    onChange([...dias, { dia: "Dia " + (dias.length + 1), subtitulo: "Ejercicios", ejercicios: [] }]);
    setSelDia(dias.length);
  };
  const removeDia = (i) => {
    if (dias.length <= 1) {
      window.alert("Debe haber al menos 1 dia.");
      return;
    }
    // Ronda 11: confirm explícito antes de borrar un día completo.
    if (!window.confirm(`¿Borrar "${dias[i].dia}"? Se pierden los ejercicios asignados ese día.`)) return;
    const arr = dias.filter((_, j) => j !== i);
    onChange(arr);
    setSelDia(Math.min(selDia, arr.length - 1));
  };
  // Ronda 11: reordenar días (el orden acá es el mismo que ve el alumno en
  // el selector de día de Principales).
  const moveDia = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= dias.length) return;
    const arr = [...dias];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
    if (selDia === i) setSelDia(j);
    else if (selDia === j) setSelDia(i);
  };
  if (!d) return (
    <div style={{ ...card, padding: 24, textAlign: "center" }}>
      <div style={{ color: S.gray, fontSize: 13, marginBottom: 12 }}>Sin días de entrenamiento</div>
      <button onClick={() => { onChange([{ dia: "Día 1", subtitulo: "Ejercicios", ejercicios: [] }]); setSelDia(0); }} style={{ background: S.white, color: S.bg, border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>+ Agregar Día</button>
    </div>
  );
  return (
    <div>
      {" "}
      {!(ocultarAgregarDia && dias.length <= 1) && (
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {" "}
        {dias.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {" "}
            <button
              onClick={() => {
                setSelDia(i);
                setEditDia(false);
              }}
              style={{
                background: selDia === i ? S.white : S.card,
                color: selDia === i ? S.bg : S.gray,
                border: "1px solid " + (selDia === i ? S.white : S.border),
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {d.dia}
            </button>{" "}
            {dias.length > 1 && (
              <button
                onClick={() => moveDia(i, -1)}
                disabled={i === 0}
                title="Mover antes"
                style={{
                  background: "transparent",
                  color: i === 0 ? S.lgray : S.gray,
                  border: "1px solid " + S.border,
                  borderRadius: 6,
                  padding: "3px 5px",
                  fontSize: 14,
                  cursor: i === 0 ? "default" : "pointer",
                  opacity: i === 0 ? 0.4 : 1,
                }}
              >
                ◀
              </button>
            )}{" "}
            {dias.length > 1 && (
              <button
                onClick={() => moveDia(i, 1)}
                disabled={i === dias.length - 1}
                title="Mover después"
                style={{
                  background: "transparent",
                  color: i === dias.length - 1 ? S.lgray : S.gray,
                  border: "1px solid " + S.border,
                  borderRadius: 6,
                  padding: "3px 5px",
                  fontSize: 14,
                  cursor: i === dias.length - 1 ? "default" : "pointer",
                  opacity: i === dias.length - 1 ? 0.4 : 1,
                }}
              >
                <Play size={11} />
              </button>
            )}{" "}
            {dias.length > 1 && (
              <button
                onClick={() => removeDia(i)}
                title="Borrar día"
                style={{
                  background: "transparent",
                  color: S.red,
                  border: "1px solid " + S.red,
                  borderRadius: 6,
                  padding: "3px 6px",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <X size={12} />
              </button>
            )}{" "}
          </div>
        ))}{" "}
        {!ocultarAgregarDia && (
        <button
          onClick={addDia}
          style={{
            background: "transparent",
            color: S.gray,
            border: "1px dashed " + S.border,
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          + Dia
        </button>
        )}{" "}
      </div>
      )}{" "}
      {/* Ronda 12 (punto 7): el botón "✎ Editar" (renombrar día/subtítulo) se
          saca cuando esto se usa desde Principales (ocultarAgregarDia) — ya
          no tiene sentido con el sistema de códigos (el nombre del día/plan
          se define al asignar el plan desde Planificación, no acá). Se
          mantiene solo en el uso genérico de DiasEditor (fuera de
          Principales), por si hace falta armar un plan a medida. */}
      {!ocultarAgregarDia && (editDia ? (
        <div style={{ ...card, padding: 12, marginBottom: 12 }}>
          {" "}
          <input
            value={diaForm.dia}
            onChange={(e) => setDiaForm((f) => ({ ...f, dia: e.target.value }))}
            placeholder="Nombre"
            style={{ ...inp, marginBottom: 8 }}
          />{" "}
          <input
            value={diaForm.subtitulo}
            onChange={(e) => setDiaForm((f) => ({ ...f, subtitulo: e.target.value }))}
            placeholder="Subtitulo"
            style={{ ...inp, marginBottom: 8 }}
          />{" "}
          <div style={{ display: "flex", gap: 6 }}>
            {" "}
            <button
              onClick={saveDia}
              style={{
                flex: 1,
                background: S.white,
                color: S.bg,
                border: "none",
                borderRadius: 6,
                padding: "8px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              GUARDAR
            </button>{" "}
            <button
              onClick={() => setEditDia(false)}
              style={{
                background: "transparent",
                color: S.gray,
                border: "1px solid " + S.border,
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>{" "}
          </div>{" "}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          {" "}
          <div>
            <div style={{ color: S.white, fontWeight: 700, fontSize: 15 }}>{d.dia}</div>
            <div style={{ color: S.gray, fontSize: 12 }}>{d.subtitulo}</div>
          </div>{" "}
          <button
            onClick={() => {
              setDiaForm({ dia: d.dia, subtitulo: d.subtitulo });
              setEditDia(true);
            }}
            style={smallBtn(S.white)}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Pencil size={13} />Editar</span>
          </button>{" "}
        </div>
      ))}{" "}
      {/* key por día (2026-08-09, pedido de Lucas): "al entrar en un ejercicio
          y cambiar de día sigue ese ejercicio en la pantalla, debería cerrar
          ese ejercicio al cambiar de día". El editor no se remontaba al
          cambiar de día (misma posición en el árbol), así que se arrastraban
          el ejercicio abierto en edición y los desplegados. Con la key ligada
          al día, cambiar de día lo devuelve a la lista limpia. */}
      <EjercicioEditor key={"dia-" + safeSelDia} items={d.ejercicios} onChange={updateEjs} showVideo={true} biblioteca={biblioteca} onGuardarBiblioteca={onGuardarBiblioteca} onGuardarParaTodos={onGuardarParaTodos} />{" "}
    </div>
  );
}
