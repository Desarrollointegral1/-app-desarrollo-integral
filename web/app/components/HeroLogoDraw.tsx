"use client";

/**
 * Escudo de la marca que se "dibuja" sobre el video del hero al cargar
 * (patrón hermanoskoumori.com: el logo se traza en línea encima del plano
 * quieto y después se asienta). Motion con función: revela la marca una
 * sola vez, no se repite, respeta prefers-reduced-motion (aparece sin trazo).
 *
 * Paths tomados de public/logos/icon-outline-blanco.svg (viewBox 1500).
 * Los tres trazos se dibujan con stroke-dasharray/offset vía CSS
 * (.hero-logo-draw en globals.css); el relleno entra al final.
 */
export function HeroLogoDraw() {
  return (
    <svg
      className="hero-logo-draw"
      viewBox="0 0 1500 1500"
      aria-hidden="true"
      focusable="false"
    >
      {/* escudo (contorno) */}
      <path
        className="hld-stroke hld-shield"
        d="M750,1185.087s-90.497-45.019-189.134-127.865c-71.053-59.66-112.435-139.307-130.778-181.474-10.33-23.745-15.565-48.933-15.565-74.865v-325.806c0-18.691,11.822-35.486,29.417-41.792l306.032-109.673,306.034,109.673c17.595,6.306,29.417,23.101,29.417,41.792v325.821c0,25.925-5.234,51.107-15.559,74.845-18.337,42.167-59.714,121.817-130.787,181.481-94.353,79.248-189.076,127.863-189.076,127.863Z"
      />
      {/* figura: brazos */}
      <path
        className="hld-stroke hld-arms"
        d="M1032.948,503.91c-1.342,1.868-54.59,74.947-127.824,131.885-35.608,27.685-65.906,61.723-87.777,101.17-14.497,26.147-27.837,57.46-36.647,93.791-25.8,106.457-32.119,223.712-33.39,254.577-.049,1.336-.098,2.492-.13,3.502-.049-1.01-.098-2.166-.147-3.502-1.27-30.865-7.59-148.12-33.39-254.577-9.477-39.1-24.208-72.389-39.981-99.679-21.35-36.939-50.134-69.007-83.823-95.186-73.294-56.957-126.602-130.114-127.939-131.98,2.476,2.199,161.395,143.658,285.475,143.739h.098c124.08-.081,282.999-141.54,285.475-143.739Z"
      />
      {/* figura: piernas */}
      <path
        className="hld-stroke hld-legs"
        d="M697.987,995.962s-5.049-145.46-42.91-221.541c-49.198-98.864-165.777-166.842-165.777-166.842,0,0,79.214,78.312,133.251,186.387,54.037,108.075,75.436,201.996,75.436,201.996Z M797.059,995.962s5.049-145.46,42.91-221.541c49.198-98.864,165.777-166.842,165.777-166.842,0,0-79.214,78.312-133.251,186.387-54.037,108.075-75.436,201.996-75.436,201.996Z"
      />
      {/* cabeza: entra por opacidad al final */}
      <circle className="hld-head" cx="747.425" cy="545.377" r="56.568" />
    </svg>
  );
}

export default HeroLogoDraw;
