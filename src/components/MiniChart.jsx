import { S } from "../utils/theme.js";

// dd/mm, como se lee en castellano (antes salía "05/19", mes/día, heredado de un slice crudo del ISO)
const fmtFecha = (f) => {
  if (!f) return "";
  const p = f.split("-");
  return p.length >= 3 ? p[2].slice(0, 2) + "/" + p[1] : f;
};

// Gráfico de línea minimalista para historial de pesos.
// El SVG lleva SOLO el trazo: las etiquetas van en HTML debajo (playbook anti-cara-de-IA, señal 11 —
// texto dentro de un SVG que escala se vuelve ilegible; los 8-9px que tenía estaban por debajo
// del mínimo de 12px real que fija el sistema de diseño de DI).
export default function MiniChart({ data, color = "#fff" }) {
  if (data.length < 2)
    return <div style={{ color: S.lgray, fontSize: 12, padding: "6px 0" }}>Necesitas al menos 2 registros.</div>;
  const W = 260,
    H = 80,
    pad = 12;
  const vals = data.map((d) => d.peso);
  const mn = Math.min(...vals),
    mx = Math.max(...vals),
    rng = mx - mn || 1;
  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - ((d.peso - mn) / rng) * (H - pad * 2),
  }));
  const first = data[0],
    last = data[data.length - 1];
  const lbl = { color: S.lgray, fontSize: 12, letterSpacing: 0.3, marginBottom: 3, whiteSpace: "nowrap" };
  const val = { color: S.gray, fontSize: 15, fontWeight: 600 };
  return (
    // ancho fluido para que no quede un gráfico de 260px perdido en una card ancha, con techo
    // para que en desktop no se convierta en un cartel de 400px de alto. El techo va en el bloque
    // entero (no solo en el SVG) para que el separador y las etiquetas acompañen al trazo en vez
    // de estirarse a todo el ancho de la card y dejar un vacío suelto a la derecha.
    <div style={{ maxWidth: 520 }}>
      <svg
        viewBox={"0 0 " + W + " " + H}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block", width: "100%", height: "auto" }}
      >
        <polyline
          points={pts.map((p) => p.x + "," + p.y).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          gap: 18,
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid " + S.border,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={lbl}>Inicio {fmtFecha(first.fecha)}</div>
          <div style={val}>{first.peso}kg</div>
        </div>
        <div>
          <div style={lbl}>Máximo</div>
          <div style={val}>{mx}kg</div>
        </div>
        <div>
          <div style={lbl}>Último {fmtFecha(last.fecha)}</div>
          <div style={{ ...val, color: S.white, fontWeight: 700 }}>{last.peso}kg</div>
        </div>
      </div>
    </div>
  );
}
