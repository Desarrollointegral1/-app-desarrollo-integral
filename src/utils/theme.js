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
//    · FONT_BODY — TODA la UI (labels, botones, inputs, menús).
//    · FONT_BRAND — PP Formula, piezas de marca puntuales.
//    · FONT_UI — escape hatch: la sans del sistema. Se usa SOLO en el caso
//      puntual donde PP Formula no rinda (tablas muy densas, números
//      apretados), nunca como base de la app.
//
// ── Auditoría 2026-07-30 ────────────────────────────────────────────────
// La ronda 18 había pasado FONT_BODY a la sans del sistema porque "PP
// Formula no se entiende en cuerpos chicos". Medido en producción, la causa
// era otra: el texto estaba a 10-13px (71 de 99 elementos de la vista del
// alumno por debajo de 16px; 199 elementos a 11px y 60 a 9px en la
// biblioteca). No era la fuente, era el tamaño. Con la escala TS de abajo,
// PP Formula Medium se lee bien y la app deja de estar escrita en la fuente
// por defecto del navegador (se habían medido 246 de 249 elementos en
// system-ui y 27 heredando Times New Roman).
//
// 3) ESCALA TIPOGRÁFICA (TS) — piso duro de 15px en UI, 16px en lectura.
//    El Brand Kit v1.0 manda "nunca por debajo de 16px en interfaz"; se
//    admite 15px SOLO en chips y etiquetas de una palabra, donde 16px
//    rompe el layout en 375px. Por debajo de 15px no se baja: si algo no
//    entra, se sacan elementos o se acorta el texto, no se achica la letra.
//
// 4) TAP — piso táctil de 44px (iOS HIG / WCAG 2.5.5). Se medían 11 de 13
//    botones de la vista alumno y 84 de 93 de la biblioteca por debajo.
//    Todo helper interactivo de este archivo declara `minHeight: TAP`.
//
// PALETA: grises/blanco/negro como base, rojo como ÚNICO acento (Brand Kit
// v1.0, 2026-07-30). El verde quedó reservado a confirmación de estado real
// (guardado, presente) — nunca decorativo, nunca en texto de marca.
// ══════════════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";

export const FONT_DISPLAY = '"PP Formula Condensed", "PP Formula", system-ui, -apple-system, "Segoe UI", sans-serif';
export const FONT_BODY = '"PP Formula", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const FONT_BRAND = '"PP Formula", system-ui, -apple-system, "Segoe UI", sans-serif';
export const FONT_UI = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// ── Escala tipográfica ── usar SIEMPRE estos tokens, nunca un número suelto.
export const TS = {
  chip: 15,   // piso absoluto: chips, etiquetas de una palabra
  label: 15,  // labels de formulario, botones secundarios
  ui: 16,     // texto de interfaz, botones, inputs (piso del Brand Kit)
  body: 16,   // lectura corrida
  lead: 20,   // bajadas, nombres
  title: 26,  // títulos de sección
  hero: 34,   // navegación protagonista
};
// ── Piso táctil ── iOS HIG y WCAG 2.5.5 piden 44x44 CSS px.
export const TAP = 44;

// ── Breakpoint único ── (2026-07-30, pedido de Lucas: "dos versiones, una
// web para casa y una de celular para la clase"). Se resuelve con UN solo
// código base: por debajo de BP manda el layout de celular que ya existe,
// por encima la app gana ancho real donde sirve (panel admin y biblioteca).
// Dos bases separadas se desincronizan; esto no.
export const BP = 900;
export const isWide = () => typeof window !== "undefined" && window.innerWidth >= BP;

// Hook reactivo: como los estilos de esta app son inline (no hay hojas CSS),
// el breakpoint no puede resolverse con una media query — hay que re-render.
export function useIsWide() {
  const [wide, setWide] = useState(isWide);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${BP}px)`);
    const on = (e) => setWide(e.matches);
    setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

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
// fontSize TS.ui (16): por debajo de 16px iOS Safari hace zoom automático al
// enfocar el campo. Estaba en 15 y el zoom se tapaba bloqueando el gesto en
// el <meta viewport> — ahora no hace falta ninguna de las dos cosas.
export let inp = { background: S.card2, border: "1px solid " + S.border2, borderRadius: 8, padding: "11px 12px", color: S.white, fontSize: TS.ui, minHeight: TAP, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: FONT_BODY };
// ── Título de módulo (eyebrow): el label chico arriba de cada módulo ──
export let eyebrow = { fontSize: 13, color: S.gray, letterSpacing: 1.6, textTransform: "uppercase", fontWeight: 700, fontFamily: FONT_BODY };

export const tabBtn = (a) => ({ flex: 1, textAlign: "center", background: a ? S.white : S.card3, color: a ? S.bg : S.gray, border: "1px solid " + (a ? S.white : S.border2), borderRadius: 8, padding: "12px 8px", minHeight: TAP, fontSize: TS.label, fontWeight: 700, cursor: "pointer", letterSpacing: 0.4, transition: "all 0.25s cubic-bezier(0.32,0.72,0,1)", fontFamily: FONT_BODY });
export const smallBtn = (color = "#888", bg = "transparent") => ({ background: bg, color, border: "1px solid " + (bg === "transparent" ? color : "transparent"), borderRadius: 8, padding: "10px 14px", minHeight: TAP, fontSize: TS.chip, cursor: "pointer", whiteSpace: "nowrap", fontFamily: FONT_BODY });

// ── Jerarquía de tabs del alumno — 3 niveles bien diferenciados ──
// Nivel 1 (Entrenamiento | Diario): pills grandes, el activo invertido.
// Usa FONT_DISPLAY — es el nivel de navegación protagonista.
// Ronda 2026-07-22 (spec Design): nav protagonista más grande y con la
// condensada bien lucida — a 22px con tracking ajustado (0.5) la PP Formula
// Condensed lidera en vez de competir con los sub-labels. lineHeight:1 saca
// el aire vertical fantasma de las mayúsculas altas.
export const tabN1 = (a) => ({ flex: 1, textAlign: "center", background: a ? S.white : S.card, color: a ? S.bg : S.gray, border: "1.5px solid " + (a ? S.white : S.border2), borderRadius: 14, padding: "20px 12px", minHeight: TAP, fontSize: TS.hero, fontWeight: 800, lineHeight: 1, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", transition: "all 0.25s cubic-bezier(0.32,0.72,0,1)", fontFamily: FONT_DISPLAY, boxShadow: a ? S.shadow2 : "none" });
// Nivel 2 (Preparación | Principales): tamaño medio, activo con borde claro.
export const tabN2 = (a) => ({ flex: 1, textAlign: "center", background: a ? S.card2 : "transparent", color: a ? S.white : S.gray, border: "1px solid " + (a ? S.white : S.border2), borderRadius: 10, padding: "12px 8px", minHeight: TAP, fontSize: TS.ui, fontWeight: 700, cursor: "pointer", letterSpacing: 0.6, transition: "all 0.25s cubic-bezier(0.32,0.72,0,1)", fontFamily: FONT_BODY });
// Nivel 3: segmented control — track nivel 2, segmento activo pastilla clara.
export const segTrack = () => ({ display: "flex", gap: 3, background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, padding: 3, boxShadow: S.shadow2 });
export const segChip = (a) => ({ flex: 1, textAlign: "center", background: a ? S.white : "transparent", color: a ? S.bg : S.gray, border: "none", borderRadius: 7, padding: "12px 6px", minHeight: TAP, fontSize: TS.chip, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", cursor: "pointer", transition: "all 0.25s cubic-bezier(0.32,0.72,0,1)", boxShadow: a ? "0 1px 3px rgba(0,0,0,0.3)" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: FONT_BODY });
// Nivel 4 — sub-menú dentro de un chip de nivel 3: texto + subrayado.
// El subrayado activo era verde (#46a758): color prohibido por el Brand Kit
// v1.0 fuera de un estado real. Pasa a blanco, que es el marcador de
// "seleccionado" que ya usa el resto de la app.
export const n4Track = () => ({ display: "flex", gap: 14, justifyContent: "center", borderTop: "1px solid " + S.border, paddingTop: 6 });
export const chipN4 = (a) => ({ background: "transparent", border: "none", borderBottom: "2px solid " + (a ? S.white : "transparent"), color: a ? S.white : S.gray, fontSize: TS.chip, fontWeight: a ? 700 : 500, letterSpacing: 0.3, padding: "12px 8px 8px", minHeight: TAP, cursor: "pointer", transition: "all 0.15s", fontFamily: FONT_BODY });

export function applyTheme(dark) {
  const t = dark ? DARK_T : LIGHT_T;
  S = t;
  card = { background: S.card, border: "1px solid " + S.border, borderRadius: 14, boxShadow: S.shadow1 };
  innerCard = { background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, boxShadow: S.shadow2 };
  inp = { background: S.card2, border: "1px solid " + S.border2, borderRadius: 8, padding: "11px 12px", color: S.white, fontSize: TS.ui, minHeight: TAP, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: FONT_BODY };
  eyebrow = { fontSize: 13, color: S.gray, letterSpacing: 1.6, textTransform: "uppercase", fontWeight: 700, fontFamily: FONT_BODY };
}

// ── Retratos ── Brand Kit §08 y señal 10 del playbook anti-cara-de-IA:
// los retratos NUNCA van en círculo. Marco rectangular de esquina suave; el
// tamaño varía según jerarquía, no es siempre el mismo.
export const retrato = (size = 44) => ({ width: size, height: size, borderRadius: Math.max(6, Math.round(size * 0.14)), objectFit: "cover", display: "block", background: S.card2, border: "1px solid " + S.border2, flexShrink: 0 });

// ── Contenedor responsive ── el layout de celular es el que ya existía
// (columna centrada). En pantalla ancha se ensancha en vez de dejar dos
// bandas negras vacías a los lados.
export const shell = (wide = isWide(), max = 1180) => ({ width: "100%", maxWidth: wide ? max : 460, margin: "0 auto", padding: wide ? "0 24px" : "0 12px", boxSizing: "border-box" });
