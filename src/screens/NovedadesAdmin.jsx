import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { S, card, inp, smallBtn } from "../utils/theme.js";

// ── NOVEDADES ADMIN ───────────────────────────────────────────────────
export function NovedadesAdmin({ novedades, onCrear, onToggle, onEliminar }) {
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [dirigido, setDirigido] = useState("todos");

  const publicar = () => {
    if (!titulo.trim()) return;
    onCrear({ titulo, contenido, tipo: "comunicado", autor: "", dirigido_a: dirigido });
    setTitulo(""); setContenido(""); setDirigido("todos");
  };

  return (
    <div>
      {/* Formulario nuevo comunicado */}
      <div style={{ ...card, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 12, letterSpacing: 1 }}>
          Nuevo comunicado
        </div>
        <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>TÍTULO</div>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Horarios semana santa" style={{ ...inp, marginBottom: 10 }} />
        <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>CONTENIDO (opcional)</div>
        <textarea value={contenido} onChange={(e) => setContenido(e.target.value)} rows={3} placeholder="Detalle del comunicado..." style={{ ...inp, resize: "vertical", marginBottom: 10 }} />
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>PARA</div>
          <select value={dirigido} onChange={(e) => setDirigido(e.target.value)} style={inp}>
            <option value="todos">Todos los alumnos</option>
            <option value="entrenamiento">Solo Entrenamiento</option>
          </select>
        </div>
        <button onClick={publicar} style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 12, fontWeight: 900, cursor: "pointer", fontSize: 13 }}>
          PUBLICAR COMUNICADO
        </button>
      </div>

      {/* Lista de novedades existentes */}
      <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 10, letterSpacing: 1 }}>
        Publicadas ({novedades.length})
      </div>
      {novedades.length === 0 && (
        <div style={{ ...card, padding: 30, textAlign: "center", color: S.gray, fontSize: 13 }}>Sin novedades publicadas</div>
      )}
      {novedades.map((n) => (
        <div key={n.id} style={{ ...card, padding: "12px 14px", marginBottom: 8, opacity: n.activo ? 1 : 0.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{n.titulo}</div>
              {n.contenido && <div style={{ color: S.gray, fontSize: 11, marginBottom: 4, lineHeight: 1.4 }}>{n.contenido}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 14, color: S.gray, background: S.card2, borderRadius: 4, padding: "2px 6px" }}>{n.tipo}</span>
                <span style={{ fontSize: 14, color: S.gray, background: S.card2, borderRadius: 4, padding: "2px 6px" }}>→ {n.dirigido_a}</span>
                <span style={{ fontSize: 14, color: S.gray }}>{new Date(n.fecha).toLocaleDateString("es-AR")}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => onToggle(n.id, !n.activo)} style={{ ...smallBtn(n.activo ? S.green : S.gray), padding: "4px 8px", fontSize: 14 }}>
                {n.activo ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={12} />Activa</span> : "○ Oculta"}
              </button>
              <button onClick={() => onEliminar(n.id)} style={{ ...smallBtn(S.red), padding: "4px 8px", fontSize: 14 }}><Trash2 size={16} /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
