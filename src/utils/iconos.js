// ── LOGO ──────────────────────────────────────────────────────────────
// Ronda 18: el SVG original (viewBox 0 0 1500 1500) tiene ~30% de aire
// interno arriba y ~21% abajo (los paths ocupan y≈437-1181, x≈399-1101).
// Ese padding quemado en el vector era la causa real del "aire muerto"
// que Lucas venía marcando alrededor del logo (login/headers): aunque el
// contenedor tuviera padding 0, el dibujo flotaba lejos de los bordes.
// Se generan DOS variantes por color: la completa (cuadrada, para donde
// el aspecto 1:1 importa, ej. PDF/reportes) y la RECORTADA (viewBox
// ajustado al dibujo real) que usan login, headers y pantalla de carga.
const _ICON_PATHS = (fill) => {
  const f = fill ? ` fill="${fill}"` : "";
  return `<g><path d="M749.86,1171.008v9.548s-.04-1.818-.16-5.254c.04-1.238.1-2.657.16-4.295Z"${f}/><g><path d="M1100.176,457.931c-1.646,2.291-66.952,91.918-156.767,161.748-43.672,33.954-80.83,75.699-107.653,124.079-17.779,32.068-34.14,70.471-44.945,115.028-31.642,130.562-39.392,274.368-40.95,312.222-.06,1.638-.12,3.056-.16,4.295-.06-1.238-.12-2.657-.18-4.295-1.558-37.854-9.309-181.66-40.95-312.222-11.623-47.953-29.689-88.78-49.034-122.25-26.185-45.303-61.486-84.632-102.803-116.74-89.891-69.855-155.269-159.576-156.909-161.865,3.036,2.697,197.94,176.187,350.116,176.287h.12c152.176-.1,347.08-173.59,350.116-176.287Z"${f}/><path d="M749.7,1175.303c-.14,3.436-.18,5.254-.18,5.254v-9.548c.06,1.638.12,3.056.18,4.295Z"${f}/></g></g><circle cx="750.001" cy="508.788" r="69.377"${f}/><path d="M689.368,1062.142s-6.193-178.398-52.626-271.706c-60.339-121.251-203.315-204.621-203.315-204.621,0,0,97.15,96.045,163.424,228.592,66.274,132.547,92.518,247.736,92.518,247.736Z"${f}/><path d="M810.874,1062.142s6.193-178.398,52.626-271.706c60.339-121.251,203.315-204.621,203.315-204.621,0,0-97.15,96.045-163.424,228.592-66.274,132.547-92.518,247.736-92.518,247.736Z"${f}/>`;
};
const _iconSvg = (fill, viewBox, w, h) =>
  "data:image/svg+xml," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}">${_ICON_PATHS(fill)}</svg>`);
export const ICON_WHITE = _iconSvg("#fff", "0 0 1500 1500", 1500, 1500);
export const ICON_BLACK = _iconSvg(null, "0 0 1500 1500", 1500, 1500);
// Recortadas al dibujo real (x 370-1130, y 410-1200 con margen mínimo):
export const ICON_WHITE_CROP = _iconSvg("#fff", "370 410 760 790", 760, 790);
export const ICON_BLACK_CROP = _iconSvg(null, "370 410 760 790", 760, 790);
let ICON = ICON_WHITE;
export let ICON_CROP = ICON_WHITE_CROP;
// El tema (claro/oscuro) elige el color del ícono. Antes App() reasignaba
// ICON / ICON_CROP directo (vivían en el mismo archivo); ahora que son un
// módulo aparte, la reasignación tiene que hacerse acá adentro — los que
// importan ICON_CROP (Logo3D, AdminPanel) ven el valor nuevo por el live
// binding de ES modules, igual que antes.
export function aplicarIconosTema(oscuro) {
  ICON = oscuro ? ICON_WHITE : ICON_BLACK;
  ICON_CROP = oscuro ? ICON_WHITE_CROP : ICON_BLACK_CROP;
}
