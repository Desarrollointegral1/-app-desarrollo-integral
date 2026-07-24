// ══════════════════════════════════════════════════════════════════════
// SISTEMA DE DISEÑO DI — ronda 18 (rediseño visual sistémico)
// Pedido de Lucas: "falta jerarquía visual en los módulos, todo parece lo
// mismo". Este archivo define DOS cosas que toda la app respeta:
//
// 1) NIVELES DE SUPERFICIE (dark y claro):
//    · Nivel 0 — fondo base (S.bg): el lienzo de la pantalla.
//    · Nivel 1 — módulo (S.card + estilo `card`): cada bloque grande de la
//      pantalla (header, navegación, buscador, listado, contenido) es una
//      card nivel 1: fondo apenas más claro que el bg, borde hairline,
//      sombra suave + highlight interno arriba (efecto "placa"). Radio 14.
//    · Nivel 2 — elemento dentro de un módulo (S.card2 + `innerCard`):
//      fondo un paso más claro, borde más marcado, radio 10.
//    · Nivel 3 — elemento interactivo (S.card3): botones/steppers/chips en
//      reposo. Fondo otro paso más claro, radio 8.
//    La regla: al subir de nivel el fondo SIEMPRE aclara (en dark) o se
//    diferencia con borde+sombra (en claro) — así los módulos se
//    distinguen a simple vista sin depender del color.
//
// 2) TIPOGRAFÍA (2 familias, roles estrictos):
//    · FONT_DISPLAY — SOLO títulos de pantalla / marca / wordmark:
//      "PP Formula Condensed" (el condensado black del logo).
//    · FONT_BODY — TODA la UI (labels, botones, inputs, menús): sans de
//      sistema de máxima legibilidad. Lucas marcó que PP Formula no se
//      entiende en cuerpos chicos ("las letras de los menús quedaron muy
//      chicas y no se entiende con esa fuente") — la legibilidad manda.
//    · FONT_BRAND — PP Formula, reservada a piezas de marca puntuales
//      (ej. el subtítulo "APP DE ENTRENAMIENTO" del login/header).
//    Tamaños mínimos: nada de UI por debajo de 12px real; labels de menú
//    13-14px. Los estilos compartidos de acá abajo ya lo cumplen.
//
// PALETA: grises/blanco/negro como base. Verde = éxito, rojo = peligro,
// amarillo = atención — SOLO como indicadores, nunca decorativos.
// ══════════════════════════════════════════════════════════════════════
export const FONT_DISPLAY = '"PP Formula Condensed", "PP Formula", system-ui, -apple-system, "Segoe UI", sans-serif';
export const FONT_BODY = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const FONT_BRAND = '"PP Formula", system-ui, -apple-system, "Segoe UI", sans-serif';

export const DARK_T = {
  bg: "#070707",
  card: "#131313",
  card2: "#1c1c1c",
  card3: "#262626",
  border: "#242424",
  border2: "#343434",
  white: "#f2f2f2",
  gray: "#9a9a9a",
  lgray: "#5f5f5f",
  red: "#e5484d",
  green: "#46a758",
  yellow: "#d4a72c",
  // Sombras por nivel: en dark la profundidad la dan el highlight interno
  // superior (hairline blanco translúcido) + una sombra corta.
  shadow1: "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.5)",
  shadow2: "inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.4)",
};
// Modo claro: blanco + escala de grises con contraste (pedido de Lucas
// 2026-07-20). Nada de tonos crema — acá la jerarquía la dan las sombras
// difusas (los fondos casi no cambian entre niveles en claro).
export const LIGHT_T = {
  bg: "#f2f2f4",
  card: "#ffffff",
  card2: "#f4f4f6",
  card3: "#e9e9ee",
  border: "#e2e2e6",
  border2: "#c8c8d0",
  white: "#17171a",
  gray: "#4b4b52",
  lgray: "#84848c",
  red: "#c0392b",
  green: "#1e7e34",
  yellow: "#9a6700",
  shadow1: "0 1px 3px rgba(16,16,20,0.08), 0 4px 14px rgba(16,16,20,0.05)",
  shadow2: "0 1px 2px rgba(16,16,20,0.07)",
};

export let S = { ...DARK_T };

// ── Nivel 1: MÓDULO ── cada bloque grande de una pantalla.
export let card = { background: S.card, border: "1px solid " + S.border, borderRadius: 14, boxShadow: S.shadow1 };
// ── Nivel 2: elemento dentro de un módulo ──
export let innerCard = { background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, boxShadow: S.shadow2 };
// ── Inputs (interactivo) ──
export let inp = { background: S.card2, border: "1px solid " + S.border2, borderRadius: 8, padding: "10px 12px", color: S.white, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: FONT_BODY };
// ── Título de módulo (eyebrow): el label chico arriba de cada módulo ──
export let eyebrow = { fontSize: 11, color: S.gray, letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 700, fontFamily: FONT_BODY };

export const tabBtn = (a) => ({ flex: 1, textAlign: "center", background: a ? S.white : S.card3, color: a ? S.bg : S.gray, border: "1px solid " + (a ? S.white : S.border2), borderRadius: 8, padding: "9px 4px", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 0.4, transition: "all 0.25s cubic-bezier(0.32,0.72,0,1)", fontFamily: FONT_BODY });
export const smallBtn = (color = "#888", bg = "transparent") => ({ background: bg, color, border: "1px solid " + (bg === "transparent" ? color : "transparent"), borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", fontFamily: FONT_BODY });

// ── Jerarquía de tabs del alumno — 3 niveles bien diferenciados ──
// Nivel 1 (Entrenamiento | Diario): pills grandes, el activo invertido.
// Usa FONT_DISPLAY — es el nivel de navegación protagonista.
// Ronda 2026-07-22 (spec Design): nav protagonista más grande y con la
// condensada bien lucida — a 22px con tracking ajustado (0.5) la PP Formula
// Condensed lidera en vez de competir con los sub-labels. lineHeight:1 saca
// el aire vertical fantasma de las mayúsculas altas.
export const tabN1 = (a) => ({ flex: 1, textAlign: "center", background: a ? S.white : S.card, color: a ? S.bg : S.gray, border: "1.5px solid " + (a ? S.white : S.border2), borderRadius: 14, padding: "20px 12px", fontSize: 30, fontWeight: 800, lineHeight: 1, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", transition: "all 0.25s cubic-bezier(0.32,0.72,0,1)", fontFamily: FONT_DISPLAY, boxShadow: a ? S.shadow2 : "none" });
// Nivel 2 (Preparación | Principales): tamaño medio, activo con borde claro.
export const tabN2 = (a) => ({ flex: 1, textAlign: "center", background: a ? S.card2 : "transparent", color: a ? S.white : S.gray, border: "1px solid " + (a ? S.white : S.border2), borderRadius: 10, padding: "11px 4px", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 0.6, transition: "all 0.25s cubic-bezier(0.32,0.72,0,1)", fontFamily: FONT_BODY });
// Nivel 3: segmented control — track nivel 2, segmento activo pastilla clara.
export const segTrack = () => ({ display: "flex", gap: 3, background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, padding: 3, boxShadow: S.shadow2 });
export const segChip = (a) => ({ flex: 1, textAlign: "center", background: a ? S.white : "transparent", color: a ? S.bg : S.gray, border: "none", borderRadius: 7, padding: "8px 4px", fontSize: 12, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", cursor: "pointer", transition: "all 0.25s cubic-bezier(0.32,0.72,0,1)", boxShadow: a ? "0 1px 3px rgba(0,0,0,0.3)" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: FONT_BODY });
// Nivel 4 — sub-menú dentro de un chip de nivel 3: texto + subrayado.
export const n4Track = () => ({ display: "flex", gap: 18, justifyContent: "center", borderTop: "1px solid " + S.border, paddingTop: 8 });
export const chipN4 = (a) => ({ background: "transparent", border: "none", borderBottom: "2px solid " + (a ? S.green : "transparent"), color: a ? S.white : S.gray, fontSize: 12, fontWeight: a ? 700 : 500, letterSpacing: 0.3, padding: "1px 1px 5px", cursor: "pointer", transition: "all 0.15s", fontFamily: FONT_BODY });

export function applyTheme(dark) {
  const t = dark ? DARK_T : LIGHT_T;
  S = t;
  card = { background: S.card, border: "1px solid " + S.border, borderRadius: 14, boxShadow: S.shadow1 };
  innerCard = { background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, boxShadow: S.shadow2 };
  inp = { background: S.card2, border: "1px solid " + S.border2, borderRadius: 8, padding: "10px 12px", color: S.white, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: FONT_BODY };
  eyebrow = { fontSize: 11, color: S.gray, letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 700, fontFamily: FONT_BODY };
}
