import { useState } from "react";
import { Check } from "lucide-react";
import { S, card, inp } from "../utils/theme.js";
import { FotoAlumno } from "./FotoAlumno.jsx";

// ── BUSCADOR ALUMNOS ──────────────────────────────────────────────────
export function AlumnoBuscador({ alumnos, selId, onSelect }) {
  const [q, setQ] = useState("");
  const filtrados = alumnos.filter(
    (a) =>
      a.nombre.toLowerCase().includes(q.toLowerCase()) ||
      a.codigo.toLowerCase().includes(q.toLowerCase()) ||
      (a.username || "").toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div>
      {" "}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre o username..."
        style={{ ...inp, marginBottom: q ? 8 : 0 }}
      />{" "}
      {q && filtrados.length > 0 && (
        <div style={{ ...card, borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
          {" "}
          {filtrados.map((a) => (
            <div
              key={a.id}
              onClick={() => {
                onSelect(a.id);
                setQ("");
              }}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: "1px solid " + S.border,
                background: selId === a.id ? S.card2 : S.card,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {" "}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {" "}
                <FotoAlumno foto={a.foto} size={32} />{" "}
                <div>
                  <div style={{ color: S.white, fontWeight: 600, fontSize: 13 }}>{a.nombre}</div>
                  <div style={{ color: S.gray, fontSize: 11 }}>{a.username || a.codigo}</div>
                </div>{" "}
              </div>{" "}
              {selId === a.id && <div style={{ color: S.white, fontSize: 12 }}><Check size={14} /></div>}{" "}
            </div>
          ))}{" "}
        </div>
      )}{" "}
      {/* Ronda 18: la card del alumno seleccionado abajo del buscador se
          SACÓ (quedaba duplicada con la lista de "Todos los alumnos") —
          el seleccionado ahora aparece PRIMERO en esa lista (ver
          Dashboard) con el borde resaltado. */}
    </div>
  );
}
