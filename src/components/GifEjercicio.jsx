import { MEDIA_CREDITO, SIN_GIF, resolverGif } from "../utils/ejerciciosMedia.js";
import { S, TS } from "../utils/theme.js";

// ── GIF DEL EJERCICIO, SOLO PARA VER (2026-07-30) ──────────────────────
// Pedido textual de Lucas probando el panel: "en ejercicios NO ME DEJA VER EL
// GIF (me pide link de YouTube o subir video)... acá lo que me sirve es ver el
// gif del ejercicio cargado". Este bloque NO edita nada: resuelve el GIF igual
// que la vista del alumno (ItemCard.jsx) — primero el `gif` que el ítem del
// plan ya tenga guardado, si no el automático por nombre — y lo muestra.
// Mismo criterio visual que ItemCard: fondo blanco (los GIFs de Gym visual
// vienen sobre blanco) y el crédito obligatorio debajo.
export function GifEjercicio({ nombre, gif, size = 180 }) {
  const src = resolverGif(gif, nombre);
  if (!src)
    return (
      <div style={{ background: S.card2, borderRadius: 8, padding: 14, textAlign: "center", marginBottom: 8 }}>
        <div style={{ color: S.lgray, fontSize: TS.chip }}>
          {gif === SIN_GIF
            ? "Este ejercicio queda sin GIF (lo sacaste a propósito)"
            : nombre
              ? "Este ejercicio todavía no tiene GIF"
              : "Elegí un ejercicio para ver su GIF"}
        </div>
      </div>
    );
  return (
    <div style={{ background: "#fff", borderRadius: 8, marginBottom: 8, padding: "10px 0 4px", textAlign: "center" }}>
      {/* Sin loading="lazy": medido en producción, las miniaturas de la lista
          de ejercicios quedaban en blanco (0 de 6 cargadas) aunque estuvieran
          a la vista — el navegador no dispara la carga diferida para imágenes
          que se montan dentro de un panel ya scrolleado. Son GIFs de ~100 kB
          que además cachea el service worker, así que no hay motivo para
          diferirlos acá: el punto de esta pantalla es justamente VER el GIF. */}
      <img src={src} alt={nombre} style={{ width: size, height: size, objectFit: "contain" }} />
      <div style={{ color: "#999", fontSize: TS.chip, paddingBottom: 4 }}>{MEDIA_CREDITO}</div>
    </div>
  );
}
