import { S, TAP } from "../utils/theme.js";

// ══════════════════════════════════════════════════════════════════════
// SKELETONS — siluetas de carga (patrón Instagram)
//
// Auditoría 2026-07-30: la app muestra textos "Cargando…" sueltos. Instagram
// muestra la silueta gris del contenido que viene: el alumno ya sabe qué va
// a aparecer y dónde, y la espera se siente más corta aunque dure lo mismo.
//
// Reemplazo directo:
//   {cargando ? <SkeletonListaAlumnos n={5} /> : <ListaAlumnos … />}
//
// Motion: shimmer de 1.2s, easing suave, sin rebote. Respeta
// `prefers-reduced-motion` — Lucas lo tiene activado: con la preferencia
// puesta queda el bloque gris quieto, sin animación (la media query vive
// dentro del <style>, así que reacciona al toggle del sistema sin re-render).
// ══════════════════════════════════════════════════════════════════════

const CSS = `
@keyframes di-shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
.di-sk { animation: di-shimmer 1.2s cubic-bezier(0.23,1,0.32,1) infinite; background-size: 200% 100%; }
@media (prefers-reduced-motion: reduce) { .di-sk { animation: none; background-image: none; } }
`;

// Un solo <style> por árbol montado; duplicarlo es inofensivo (mismas reglas).
function Estilos() {
  return <style>{CSS}</style>;
}

// Bloque gris base. Todo lo demás se arma con esto.
export function SkeletonBloque({ w = "100%", h = 14, r = 6, style }) {
  return (
    <div
      aria-hidden="true"
      className="di-sk"
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: S.card2,
        backgroundImage: `linear-gradient(90deg, ${S.card2} 0%, ${S.card3} 50%, ${S.card2} 100%)`,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

// Una línea de texto. `w` para variar el largo y que no parezca una grilla.
export function SkeletonLinea({ w = "100%", h = 14, style }) {
  return (
    <>
      <Estilos />
      <SkeletonBloque w={w} h={h} r={4} style={style} />
    </>
  );
}

// Silueta de una card genérica (título + dos líneas).
export function SkeletonCard({ style }) {
  return (
    <div
      aria-hidden="true"
      style={{
        background: S.card,
        border: "1px solid " + S.border,
        borderRadius: 14,
        boxShadow: S.shadow1,
        padding: 14,
        marginBottom: 8,
        ...style,
      }}
    >
      <Estilos />
      <SkeletonBloque w="62%" h={18} r={5} style={{ marginBottom: 12 }} />
      <SkeletonBloque w="100%" h={12} r={4} style={{ marginBottom: 8 }} />
      <SkeletonBloque w="78%" h={12} r={4} />
    </div>
  );
}

// Lista de alumnos: retrato rectangular (Brand Kit §08: nunca en círculo) +
// nombre + dato secundario. Los anchos varían para que no lea como grilla.
export function SkeletonListaAlumnos({ n = 5 }) {
  const anchos = ["68%", "54%", "76%", "60%", "72%", "58%"];
  return (
    <div role="status" aria-live="polite" aria-busy="true" aria-label="Cargando alumnos">
      <Estilos />
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: S.card,
            border: "1px solid " + S.border,
            borderRadius: 14,
            boxShadow: S.shadow1,
            padding: 12,
            marginBottom: 8,
            minHeight: TAP + 16,
          }}
        >
          <SkeletonBloque w={44} h={44} r={6} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <SkeletonBloque w={anchos[i % anchos.length]} h={16} r={4} style={{ marginBottom: 8 }} />
            <SkeletonBloque w="38%" h={12} r={4} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Lista de ejercicios: número + nombre + stepper de peso a la derecha.
// Copia la anatomía de ItemCard para que el salto al contenido real no mueva
// nada de lugar.
export function SkeletonEjercicios({ n = 6 }) {
  const anchos = ["70%", "52%", "80%", "64%", "58%", "74%"];
  return (
    <div role="status" aria-live="polite" aria-busy="true" aria-label="Cargando ejercicios">
      <Estilos />
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: S.card,
            border: "1px solid " + S.border,
            borderRadius: 14,
            boxShadow: S.shadow1,
            padding: "12px 14px",
            marginBottom: 8,
          }}
        >
          <SkeletonBloque w={26} h={26} r={13} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <SkeletonBloque w={anchos[i % anchos.length]} h={16} r={4} />
          </div>
          <SkeletonBloque w={56} h={TAP} r={8} />
        </div>
      ))}
    </div>
  );
}

export default SkeletonCard;
