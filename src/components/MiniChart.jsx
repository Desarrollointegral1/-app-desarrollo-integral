import { S } from "../utils/theme.js";

// Gráfico de línea minimalista para historial de pesos
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
    d,
  }));
  return (
    <svg width={W} height={H} style={{ display: "block", overflow: "visible" }}>
      <polyline
        points={pts.map((p) => p.x + "," + p.y).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={color} />
          <text x={p.x} y={p.y - 9} textAnchor="middle" fill={S.gray} fontSize="9">
            {p.d.peso}kg
          </text>
          <text x={p.x} y={H} textAnchor="middle" fill={S.lgray} fontSize="8">
            {p.d.fecha ? p.d.fecha.slice(5) : ""}
          </text>
        </g>
      ))}
    </svg>
  );
}
