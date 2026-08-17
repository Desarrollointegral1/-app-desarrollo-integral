import { GIFS_DISPONIBLES, getEjercicioGif } from "../utils/ejerciciosMedia.js";
import { S, inp } from "../utils/theme.js";

// ── GIF MANUAL (ronda 12, punto 9) ──────────────────────────────────────
// Selector de GIF de public/ejercicios/ para asociar a mano cuando el
// lookup automático por nombre (ejerciciosMedia.js) no encuentra match.
// Se usa acá en EjercicioEditor (Principales/Movilidad/etc, por alumno) Y en
// la pantalla Biblioteca — MISMO componente en los dos lados.
export function GifPicker({ nombre, value, onChange }) {
  const autoMatch = getEjercicioGif(nombre);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>
        GIF MANUAL {autoMatch && !value ? "(ya hay uno automático por nombre)" : ""}
      </div>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={inp}>
        <option value="">
          {autoMatch ? "— Automático (por nombre) —" : "— Sin GIF —"}
        </option>
        {GIFS_DISPONIBLES.map((g) => (
          <option key={g.slug} value={g.path}>{g.label}</option>
        ))}
      </select>
      {value && (
        <div style={{ marginTop: 6, background: "#fff", borderRadius: 6, padding: "6px 0", textAlign: "center" }}>
          <img src={value} alt="" style={{ width: 64, height: 64, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}
