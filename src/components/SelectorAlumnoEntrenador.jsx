import { useState } from "react";
import { Dumbbell, X } from "lucide-react";
import { S, card, inp } from "../utils/theme.js";
import { FotoAlumno } from "./FotoAlumno.jsx";

// Selector de alumno al activar el modo entrenador.
export function SelectorAlumnoEntrenador({ alumnos, onElegir, onCerrar }) {
  const [q, setQ] = useState("");
  const lista = alumnos.filter(
    (a) =>
      a.nombre.toLowerCase().includes(q.toLowerCase()) ||
      (a.username || a.codigo || "").toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.65)", overflowY: "auto", padding: "40px 16px" }}
      onClick={onCerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420, margin: "0 auto", background: S.bg, border: "1px solid " + S.border, borderRadius: 14, padding: 16 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ color: S.white, fontWeight: 800, fontSize: 14, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}><Dumbbell size={16} />Modo entrenador</div>
          <button onClick={onCerrar} style={{ background: "transparent", color: S.gray, border: "none", fontSize: 18, cursor: "pointer" }}><X size={16} /></button>
        </div>
        <div style={{ color: S.gray, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
          Elegí el alumno: vas a ver su interfaz tal como la ve él, y los pesos que cargues se guardan en su historial.
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o username..." style={{ ...inp, marginBottom: 10 }} />
        {lista.map((a) => (
          <div
            key={a.id}
            onClick={() => onElegir(a)}
            style={{ ...card, display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 8, cursor: "pointer" }}
          >
            <FotoAlumno foto={a.foto} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>{a.nombre}</div>
              <div style={{ color: S.gray, fontSize: 11 }}>
                {a.username || a.codigo}
              </div>
            </div>
            <span style={{ color: S.gray }}>›</span>
          </div>
        ))}
        {lista.length === 0 && <div style={{ color: S.gray, fontSize: 12, textAlign: "center", padding: 16 }}>Sin resultados</div>}
      </div>
    </div>
  );
}
