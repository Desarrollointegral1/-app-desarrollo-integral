// Constantes y funciones puras del coach (nombre, texto→voz, elección de voz, render de
// texto con negritas). Movidos textualmente desde CoachFlotante.jsx (refactor 2026-08-18).
import React from "react";

/**
 * ============================================================
 * COACH FLOTANTE — asistente conversacional dentro de la app
 * ============================================================
 *
 * El logo del gimnasio flota sobre la app (arrastrable). Al tocarlo se abre un
 * chat estilo WhatsApp/ChatGPT que le habla al endpoint /web/api/coach con el
 * alumno logueado. El backend conoce los datos del alumno + el método de
 * Integral y lo puede guiar (entrenar, dudas, coaching).
 *
 * Props:
 *   - alumno: objeto del alumno logueado (necesita .id y .nombre)
 *   - iconWhite / iconBlack: data-URI del logo RECORTADO en blanco y en negro
 *     (ICON_WHITE_CROP / ICON_BLACK_CROP de App.jsx)
 *   - darkMode: para elegir el color del logo según el modo
 *   - S: tokens de tema activos (theme.js) para matchear la estética
 */

// 2026-07-31 — el entrenador virtual pasa a llamarse Luqui (pedido de Lucas).
export const NOMBRE_ENTRENADOR = "Luqui";

// ── Texto → voz: preparación antes de leer en voz alta ──────────────────
// Lucas: "todo el tiempo lee los números, no interpreta lo que dice, queda
// muy robotizado". SpeechSynthesis lee "2x6" o "70%" letra por letra o de
// forma rara porque no son palabras — esto expande los patrones más
// comunes de esta app (series×repeticiones, porcentajes, kilos) a texto
// que se lee como lo diría una persona. No toca el CONTENIDO de la
// respuesta (eso lo genera el backend) — solo cómo se pronuncia.
export function prepararParaVoz(texto) {
  return texto
    .replace(/[*#>_`]/g, "")
    // "2x6" / "2 x 6" / "2×6" → "2 series de 6 repeticiones"
    .replace(/\b(\d+)\s*[x×]\s*(\d+)\b/gi, "$1 series de $2 repeticiones")
    // "70%" → "70 por ciento"
    .replace(/(\d+)\s*%/g, "$1 por ciento")
    // "40kg" / "40 kg" → "40 kilos" (no toca "kg" si no viene después de un número)
    .replace(/(\d+)\s*kg\b/gi, "$1 kilos")
    .replace(/(\d+)\s*seg\b/gi, "$1 segundos");
}

// Elige la mejor voz en español disponible. Antes se quedaba con la PRIMERA
// que empezara con "es" — que en Windows/Chrome suele ser la voz local más
// robótica. Prioridad: voces de red (Google, generalmente mejores que las
// del sistema operativo) > es-AR/es-419 (acento rioplatense/latino, más
// cercano al alumno) > cualquier es-* como último recurso.
export function elegirVozEs() {
  const voces = window.speechSynthesis.getVoices();
  const es = voces.filter((v) => v.lang && v.lang.toLowerCase().startsWith("es"));
  if (es.length === 0) return null;
  const puntaje = (v) => {
    let p = 0;
    if (!v.localService) p += 2; // voz de red: suele sonar mejor que la local
    if (/es-ar|es-419|es-mx|es-us/i.test(v.lang)) p += 1; // acento latino/rioplatense
    return p;
  };
  return [...es].sort((a, b) => puntaje(b) - puntaje(a))[0];
}

// Renderiza texto del coach preservando saltos de línea y **negrita** de forma
// segura (sin dangerouslySetInnerHTML — se parsea a nodos React).
export function renderTexto(texto) {
  return texto.split("\n").map((linea, i) => {
    const partes = linea.split(/(\*\*[^*]+\*\*)/g).map((p, j) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <b key={j}>{p.slice(2, -2)}</b>;
      }
      return <React.Fragment key={j}>{p}</React.Fragment>;
    });
    return (
      <React.Fragment key={i}>
        {partes}
        {i < texto.split("\n").length - 1 && <br />}
      </React.Fragment>
    );
  });
}
